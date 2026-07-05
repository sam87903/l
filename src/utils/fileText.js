/**
 * Client-seitige Textextraktion für Klausur-Uploads – ohne externe
 * Bibliotheken, damit der Single-File-Build klein und offline bleibt.
 * PDF: FlateDecode-Streams inflaten und Tj/TJ-Textoperatoren einsammeln.
 * DOCX: Minimaler ZIP-Reader, word/document.xml entpacken, XML strippen.
 * Beide Wege nutzen DecompressionStream (iOS 16.4+/moderne Browser).
 */

const supportsInflate = () => typeof DecompressionStream !== "undefined";

async function inflate(bytes, format) {
  const ds = new DecompressionStream(format);
  const writer = ds.writable.getWriter();
  // Fehler kommen über reader.read() zurück – Writer-Promises nicht crashen lassen
  writer.write(bytes).catch(() => {});
  writer.close().catch(() => {});
  const reader = ds.readable.getReader();
  const parts = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

const latin1 = (bytes) => new TextDecoder("latin1").decode(bytes);
const utf8 = (bytes) => new TextDecoder("utf-8").decode(bytes);

/** Alle Vorkommen eines ASCII-Markers in einem Byte-Array. */
function findAll(bytes, marker) {
  const m = [...marker].map((c) => c.charCodeAt(0));
  const hits = [];
  outer: for (let i = 0; i <= bytes.length - m.length; i++) {
    for (let j = 0; j < m.length; j++) if (bytes[i + j] !== m[j]) continue outer;
    hits.push(i);
  }
  return hits;
}

/** PDF-String-Escapes (\n, \053, \\ …) auflösen. */
function decodePdfString(raw) {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c !== "\\") { out += c; continue; }
    const n = raw[++i];
    if (n === undefined) break;
    if (n === "n") out += "\n";
    else if (n === "r") out += "\r";
    else if (n === "t") out += "\t";
    else if (n === "b" || n === "f") out += "";
    else if (n >= "0" && n <= "7") {
      let oct = n;
      while (oct.length < 3 && raw[i + 1] >= "0" && raw[i + 1] <= "7") oct += raw[++i];
      out += String.fromCharCode(parseInt(oct, 8));
    } else out += n; // \\, \(, \) und Zeilenfortsetzung
  }
  return out;
}

/** Text-Operatoren (… ) Tj und [ … ] TJ aus einem Content-Stream ziehen. */
function textFromContentStream(content) {
  const parts = [];
  const re = /\(((?:\\.|[^\\()])*)\)\s*(Tj|'|")|\[((?:\((?:\\.|[^\\()])*\)|[^\]])*)\]\s*TJ|\b(Td|TD|T\*|ET)\b/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    if (match[1] !== undefined) parts.push(decodePdfString(match[1]));
    else if (match[3] !== undefined) {
      const inner = match[3];
      const strRe = /\((?:\\.|[^\\()])*\)/g;
      let s;
      while ((s = strRe.exec(inner)) !== null) parts.push(decodePdfString(s[0].slice(1, -1)));
    } else parts.push("\n");
  }
  return parts.join("");
}

/** Anteil an Buchstaben – erkennt Binärmüll aus kodierten Schriften. */
function letterRatio(text) {
  const compact = text.replace(/\s+/g, "");
  if (!compact.length) return 0;
  const letters = compact.match(/[A-Za-zÄÖÜäöüß0-9.,;:%€§()\-/]/g)?.length ?? 0;
  return letters / compact.length;
}

/** Text aus einem PDF extrahieren (textbasierte PDFs, keine Scans). */
export async function extractPdfText(buffer) {
  if (!supportsInflate()) throw new Error("Dieser Browser unterstützt keine PDF-Extraktion – bitte Text einfügen.");
  const bytes = new Uint8Array(buffer);
  const raw = latin1(bytes);
  const chunks = [];
  for (const start of findAll(bytes, "stream")) {
    if (raw.slice(Math.max(0, start - 3), start) === "end") continue; // Teil von "endstream"
    const isFlate = raw.slice(Math.max(0, start - 600), start).includes("/FlateDecode");
    let dataStart = start + 6;
    if (bytes[dataStart] === 13) dataStart++; // \r
    if (bytes[dataStart] === 10) dataStart++; // \n
    const end = raw.indexOf("endstream", dataStart);
    if (end === -1) continue;
    let dataEnd = end;
    while (dataEnd > dataStart && (bytes[dataEnd - 1] === 10 || bytes[dataEnd - 1] === 13)) dataEnd--;
    const data = bytes.subarray(dataStart, dataEnd);
    try {
      const content = isFlate ? latin1(await inflate(data, "deflate")) : raw.slice(dataStart, end);
      if (content.includes("Tj") || content.includes("TJ")) {
        const text = textFromContentStream(content);
        if (text.trim()) chunks.push(text);
      }
    } catch {
      // Nicht dekodierbarer Stream (Bild, Font …) – überspringen.
    }
  }
  const text = chunks.join("\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 40 || letterRatio(text) < 0.5) {
    throw new Error("PDF enthält keinen extrahierbaren Text (vermutlich Scan oder Sonderschrift) – bitte Text markieren, kopieren und einfügen.");
  }
  return text;
}

const readU16 = (b, o) => b[o] | (b[o + 1] << 8);
const readU32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

/** Eine Datei aus einem ZIP-Archiv (z.B. DOCX) entpacken. */
async function unzipEntry(bytes, entryName) {
  // End of Central Directory im hinteren Dateibereich suchen
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (readU32(bytes, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error("Kein gültiges ZIP-Archiv.");
  let offset = readU32(bytes, eocd + 16);
  const count = readU16(bytes, eocd + 10);
  for (let i = 0; i < count; i++) {
    if (readU32(bytes, offset) !== 0x02014b50) break;
    const method = readU16(bytes, offset + 10);
    const compressedSize = readU32(bytes, offset + 20);
    const nameLength = readU16(bytes, offset + 28);
    const extraLength = readU16(bytes, offset + 30);
    const commentLength = readU16(bytes, offset + 32);
    const localOffset = readU32(bytes, offset + 42);
    const name = utf8(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (name === entryName) {
      const localNameLength = readU16(bytes, localOffset + 26);
      const localExtraLength = readU16(bytes, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const data = bytes.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return data;
      if (method === 8) return inflate(data, "deflate-raw");
      throw new Error("Nicht unterstützte ZIP-Kompression.");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${entryName} nicht im Archiv gefunden.`);
}

const XML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decodeXml = (s) =>
  s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (_, e) => {
    if (e[0] === "#") return String.fromCodePoint(parseInt(e[1] === "x" ? e.slice(2) : e.slice(1), e[1] === "x" ? 16 : 10));
    return XML_ENTITIES[e] ?? `&${e};`;
  });

/** Text aus einer DOCX-Datei (Word) extrahieren. */
export async function extractDocxText(buffer) {
  if (!supportsInflate()) throw new Error("Dieser Browser unterstützt keine DOCX-Extraktion – bitte Text einfügen.");
  const xml = utf8(await unzipEntry(new Uint8Array(buffer), "word/document.xml"));
  const text = decodeXml(
    xml
      .replace(/<w:tab[^>]*\/>/g, "\t")
      .replace(/<w:br[^>]*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
  ).replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("Das Word-Dokument enthält keinen lesbaren Text.");
  return text;
}

/** Einheitlicher Einstieg: liest .pdf, .docx, .txt, .md und Klartext. */
export async function extractFileText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return extractPdfText(await file.arrayBuffer());
  }
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractDocxText(await file.arrayBuffer());
  }
  if (name.endsWith(".doc")) {
    throw new Error("Altes .doc-Format wird nicht unterstützt – bitte als .docx oder PDF speichern.");
  }
  return (await file.text()).trim();
}
