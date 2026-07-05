import { describe, expect, it } from "vitest";
import { deflateRawSync, deflateSync, crc32 } from "node:zlib";
import { extractDocxText, extractPdfText } from "../fileText.js";

/** Buffer → exakter ArrayBuffer (Node poolt kleine Buffer mit Offset). */
const toArrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);

/** Minimales, gültiges PDF mit Flate-komprimiertem Content-Stream bauen. */
function makePdf(contentStream) {
  const deflated = deflateSync(Buffer.from(contentStream, "latin1"));
  const head = Buffer.from(
    `%PDF-1.4\n1 0 obj\n<< /Length ${deflated.length} /Filter /FlateDecode >>\nstream\n`,
    "latin1"
  );
  const tail = Buffer.from("\nendstream\nendobj\ntrailer\n%%EOF", "latin1");
  return toArrayBuffer(Buffer.concat([head, deflated, tail]));
}

/** Minimales ZIP mit einem deflate-komprimierten Eintrag bauen (DOCX-Gerüst). */
function makeZip(entryName, content) {
  const nameBuf = Buffer.from(entryName);
  const raw = Buffer.from(content, "utf8");
  const data = deflateRawSync(raw);
  const crc = crc32(raw);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(raw.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(8, 10); // deflate
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(raw.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(0, 42); // Offset des Local Headers
  const centralStart = 30 + nameBuf.length + data.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(46 + nameBuf.length, 12);
  eocd.writeUInt32LE(centralStart, 16);
  return toArrayBuffer(Buffer.concat([local, nameBuf, data, central, nameBuf, eocd]));
}

describe("fileText (Klausur-Upload-Extraktion)", () => {
  it("extrahiert Text aus einem Flate-komprimierten PDF (Tj und TJ)", async () => {
    const pdf = makePdf(
      "BT /F1 12 Tf 72 712 Td (Aufgabe 1: Minimalprinzip erklaeren.) Tj T* " +
        "[(Aufgabe 2: Bilanz) -250 ( und GuV abgrenzen.)] TJ ET"
    );
    const text = await extractPdfText(pdf);
    expect(text).toContain("Aufgabe 1: Minimalprinzip erklaeren.");
    expect(text).toContain("Aufgabe 2: Bilanz und GuV abgrenzen.");
  });

  it("löst PDF-Escapes auf (Klammern, Oktal-Umlaute)", async () => {
    const pdf = makePdf(
      "BT (Nennen Sie \\(drei\\) GoB und erl\\344utern Sie das \\366konomische Prinzip anhand eines Beispiels.) Tj ET"
    );
    const text = await extractPdfText(pdf);
    expect(text).toContain("Nennen Sie (drei) GoB und erläutern Sie das ökonomische Prinzip anhand eines Beispiels.");
  });

  it("wirft bei PDFs ohne Textebene einen verständlichen Fehler", async () => {
    const pdf = makePdf("BT ET"); // keine Text-Operatoren
    await expect(extractPdfText(pdf)).rejects.toThrow(/extrahierbaren Text/);
  });

  it("extrahiert Text aus einer DOCX-Datei (ZIP + document.xml)", async () => {
    const xml =
      '<?xml version="1.0"?><w:document xmlns:w="x"><w:body>' +
      "<w:p><w:r><w:t>Klausur E-Commerce &amp; Handel</w:t></w:r></w:p>" +
      "<w:p><w:r><w:t>Aufgabe 1: Erklären Sie den ROPO-Effekt.</w:t></w:r></w:p>" +
      "</w:body></w:document>";
    const docx = makeZip("word/document.xml", xml);
    const text = await extractDocxText(docx);
    expect(text).toContain("Klausur E-Commerce & Handel");
    expect(text).toContain("Aufgabe 1: Erklären Sie den ROPO-Effekt.");
    expect(text.split("\n").length).toBeGreaterThanOrEqual(2);
  });

  it("meldet fehlendes document.xml als Fehler", async () => {
    const zip = makeZip("irgendwas.txt", "kein Word-Dokument");
    await expect(extractDocxText(zip)).rejects.toThrow(/nicht im Archiv/);
  });
});
