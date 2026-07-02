import { useState, useEffect } from "react";
/* ═══════════════════════════════════════════════════════════════════
   MAROKKO-LERNPLAN 2026 v2  —  HRW E-Commerce B.Sc.
   Layout: Liquid Glass · Dark/Light Theme
   4 Tabs: Start (Plan+Quiz+Timer) · Detailliert · Semester · Glossar
   Neu in v2:
   - 📖 Glossar-Tab mit Volltextsuche (alle ~150 Begriffe)
   - ⏱ 20-Minuten-Fokus-Timer (mit Vibration am Ende)
   - 📍 "Heute dran"-Karte mit Sprung zum Tages-Eintrag
   - ✈️/🎓 Countdown-Chips (Abreise & Semesterstart 01.09.2026)
   - 🏆 Quiz-Bestscores (persistiert) + "Nochmal versuchen"
   - 🃏 Lernkarten mit Shuffle, Gewusst/Nochmal-Tracking, "Nur neue"
   - 📊 Statistik-Reihe (Tage, Karten, perfekte Quizze)
   - 🧩 Quiz-Direktsprung aus dem Semester-Tab
   - 💾 Speicher-Fallback auf localStorage (läuft überall)
   - 🌓 Theme-Fixes (Tab-Bar & Date-Picker im Light Mode)
═══════════════════════════════════════════════════════════════════ */
/* ── Akzentfarben (theme-unabhängig: Marokko Rot/Grün + Navy/Violett) ── */
const ACCENT={
  red:"#ff6b6b", teal:"#2dd4a8", violet:"#a78bfa", blue:"#5b7cfa", blueD:"#0e1c60",
  redBg:"rgba(255,107,107,0.12)", tealBg:"rgba(45,212,168,0.12)", violetBg:"rgba(167,139,250,0.12)",
};
const WC=[null,ACCENT.red,ACCENT.teal,ACCENT.violet];
const WBG=[null,ACCENT.redBg,ACCENT.tealBg,ACCENT.violetBg];
/* ── Zwei Themes: Dark (Standard, Liquid Glass) & Light ───────────── */
const DARK={
  bg:"#0a0e1a", bgGrad:"radial-gradient(ellipse 120% 80% at 50% -10%, #16215c 0%, #0a0e1a 55%)",
  card:"rgba(255,255,255,0.055)", cream:"rgba(255,255,255,0.04)",
  text:"#eef2fb", muted:"#8a96b8", border:"rgba(255,255,255,0.10)",
  white:"#ffffff", glassBorder:"rgba(255,255,255,0.14)", glassHi:"rgba(255,255,255,0.09)",
  glassBg1:"rgba(255,255,255,0.045)", glassBg2:"rgba(255,255,255,0.05)", glassShadow:"rgba(0,0,0,0.35)",
  blueGlow:"rgba(91,124,250,0.35)",
  ...ACCENT,
};
const LIGHT={
  bg:"#efe9db", bgGrad:"radial-gradient(ellipse 120% 80% at 50% -10%, #fbf8f0 0%, #efe9db 60%)",
  card:"rgba(255,255,255,0.62)", cream:"rgba(255,255,255,0.5)",
  text:"#1a1d2e", muted:"#5f6a86", border:"rgba(20,25,50,0.11)",
  white:"#ffffff", glassBorder:"rgba(20,25,50,0.10)", glassHi:"rgba(255,255,255,0.65)",
  glassBg1:"rgba(255,255,255,0.4)", glassBg2:"rgba(255,255,255,0.45)", glassShadow:"rgba(30,35,60,0.12)",
  blueGlow:"rgba(91,124,250,0.22)",
  ...ACCENT,
};
/* ── Liquid-Glass Stil-Helfer (Apple-artig: blur + translucent) ──── */
const glass=(tint,C)=>({
  background:tint?`linear-gradient(135deg, ${tint}22 0%, ${tint}0a 100%), ${C.glassBg1}`:C.glassBg2,
  backdropFilter:"blur(20px) saturate(160%)",
  WebkitBackdropFilter:"blur(20px) saturate(160%)",
  border:`1px solid ${tint?tint+"35":C.glassBorder}`,
  boxShadow:`0 8px 32px ${C.glassShadow}, inset 0 1px 0 ${C.glassHi}`,
});
/* ── Storage-Wrapper: claude.ai window.storage ODER localStorage ─── */
const storage={
  async get(k){
    try{
      if(typeof window!=="undefined"&&window.storage&&window.storage.get){
        const r=await window.storage.get(k);
        return r?r.value:null;
      }
    }catch{}
    try{return localStorage.getItem(k);}catch{return null;}
  },
  async set(k,v){
    try{
      if(typeof window!=="undefined"&&window.storage&&window.storage.set){
        await window.storage.set(k,v);
        return;
      }
    }catch{}
    try{localStorage.setItem(k,v);}catch{}
  },
};
/* ── Datums-Helfer ───────────────────────────────────────────────── */
const SEMESTER_START="2026-09-01";
function daysUntil(iso){
  try{
    const t=new Date();t.setHours(0,0,0,0);
    const d=new Date(iso);if(isNaN(d))return null;d.setHours(0,0,0,0);
    return Math.round((d-t)/86400000);
  }catch{return null;}
}
function todayPlanDay(startIso,totalDays){
  try{
    const t=new Date();t.setHours(0,0,0,0);
    const s=new Date(startIso);if(isNaN(s))return null;s.setHours(0,0,0,0);
    const diff=Math.floor((t-s)/86400000)+1;
    return diff>=1&&diff<=totalDays?diff:null;
  }catch{return null;}
}
/* ── URL-Helfer ──────────────────────────────────────────────────── */
const BOOK="https://drive.google.com/file/d/1zu9nR85-tedUw2c074pIm2S_KQdy-kWw/view";
const B   = p=>`${BOOK}?pli=1#page=${p}`; // ?pli=1 erzwingt Drive-Reload zur richtigen Seite
const YT  = q=>`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const SF  = q=>YT("Studyflix "+q);          // Studyflix via YouTube (zuverlässig)
const K   = q=>`https://knowunity.de/knows?q=${encodeURIComponent(q)}`;
const DOC = q=>`https://www.studocu.com/de/search?q=${encodeURIComponent(q)}`;
const QZ  = q=>`https://quizlet.com/de/search?query=${encodeURIComponent(q)}&type=sets`;
const GLOSSARY={
  "3PL":"Third-Party Logistics – externer Logistikdienstleister (z.B. DHL), der Lagerung, Versand und Retouren für E-Commerce-Händler übernimmt.",
  "AG":"Aktiengesellschaft – Kapitalgesellschaft mit mind. 50.000 € Grundkapital, Anteile als Aktien handelbar, für große/börsennotierte Unternehmen.",
  "AND":"Boolescher Operator – Ergebnis ist nur wahr, wenn BEIDE Eingaben wahr sind. In Java: &&",
  "APA-Stil":"Internationaler Zitierstandard (American Psychological Association): Quellenangabe im Text als (Autor, Jahr, S. X).",
  "API":"Application Programming Interface – Schnittstelle, über die zwei Programme/Systeme automatisiert Daten austauschen (z.B. Shop ruft DHL-API auf).",
  "ASCII":"American Standard Code for Information Interchange – Zeichenkodierung, die Buchstaben/Zeichen als Zahlen (0–127) darstellt.",
  "Abschreibung":"Planmäßige Verteilung der Anschaffungskosten eines Wirtschaftsguts über seine Nutzungsdauer (Wertminderung durch Gebrauch).",
  "AfA":"Absetzung für Abnutzung – steuerlicher Fachbegriff für Abschreibung; AfA-Tabelle gibt Nutzungsdauern vor.",
  "Aktiva":"Linke Seite der Bilanz – zeigt, WOFÜR das Kapital verwendet wurde (Anlage- & Umlaufvermögen).",
  "Aktives Erinnern":"Lerntechnik, bei der man Wissen aus dem Gedächtnis abruft statt nur passiv zu lesen – deutlich effektiver für Langzeitgedächtnis.",
  "Aktivkonto":"Bilanzkonto auf der Vermögensseite; Zugänge werden im Soll, Abgänge im Haben gebucht (z.B. Kasse, Bank).",
  "Anki":"Kostenlose Karteikarten-App, die mit Spaced-Repetition-Algorithmus arbeitet – zeigt unsichere Karten häufiger.",
  "Anki-Review":"Tägliche Wiederholungssession in Anki, bei der fällige Karten abgefragt werden.",
  "Anlagevermögen":"Langfristig im Unternehmen gebundenes Vermögen (Maschinen, Software, Gebäude) – Teil der Aktivseite der Bilanz.",
  "Anschaffungskosten":"Gesamtkosten zum Erwerb eines Wirtschaftsguts (Kaufpreis + Nebenkosten), Basis für Abschreibungsberechnung.",
  "B2B":"Business-to-Business – Geschäftsmodell, bei dem Unternehmen an andere Unternehmen verkaufen (z.B. Amazon Business).",
  "B2C":"Business-to-Consumer – Geschäftsmodell, bei dem Unternehmen direkt an Endverbraucher verkaufen (z.B. Zalando).",
  "Betriebstyp":"Klassifizierung von Handelsunternehmen nach Sortiment, Preis und Service (z.B. Discounter, Fachhandel, Marktplatz).",
  "Bilanzsumme":"Summe aller Aktiva = Summe aller Passiva; Grundgleichung der doppelten Buchführung.",
  "Binärsystem":"Zahlensystem mit Basis 2 (nur Ziffern 0 und 1) – die interne Sprache aller Computer.",
  "Bit":"Kleinste Speichereinheit eines Computers; kann nur 0 oder 1 sein.",
  "Buchführungspflicht":"Gesetzliche Pflicht nach § 238 HGB für Kaufleute, Geschäftsvorfälle systematisch in Büchern zu dokumentieren.",
  "Buchungssatz":"Formale Darstellung einer Buchung: 'Soll-Konto an Haben-Konto, Betrag' (z.B. Kasse an Bank 500 €).",
  "Buchwert":"Aktueller Restwert eines Wirtschaftsguts nach Abzug bisheriger Abschreibungen.",
  "Byte":"8 Bit zusammengefasst – Standard-Speichereinheit (1 Byte kann 256 verschiedene Werte darstellen).",
  "C2C":"Consumer-to-Consumer – Verbraucher verkaufen direkt an Verbraucher über eine Plattform (z.B. eBay Kleinanzeigen).",
  "CO2-Kompensation":"Ausgleich von Versand-Emissionen durch Investition in Klimaschutzprojekte – wichtiges Nachhaltigkeitsthema im E-Commerce-Versand.",
  "CPU":"Central Processing Unit – der Hauptprozessor, der Berechnungen durchführt und Programme ausführt.",
  "Casting":"Typkonvertierung in Java – Umwandlung eines Datentyps in einen anderen (implizit oder explizit).",
  "Category Management":"Strategische Steuerung von Produktkategorien im Handel zur Optimierung von Sortiment, Platzierung und Umsatz.",
  "Client":"Das anfragende Gerät/Programm (z.B. dein Browser), das Daten von einem Server anfordert.",
  "Conversion Rate":"Prozentsatz der Website-Besucher, die tatsächlich einen Kauf abschließen – zentrale E-Commerce-Kennzahl.",
  "Corona-Effekt":"Starker Anstieg des Online-Handels 2020/2021 durch Lockdowns und verändertes Kaufverhalten.",
  "D2C":"Direct-to-Consumer – Hersteller verkauft direkt an Endkunden ohne Zwischenhändler (z.B. Nike.com).",
  "DNS":"Domain Name System – 'Telefonbuch des Internets', übersetzt Domainnamen (amazon.de) in IP-Adressen.",
  "Datentyp":"Klassifizierung einer Variable in Java (z.B. int, double, boolean, String), bestimmt Speicherart und erlaubte Operationen.",
  "De-Morgan":"Logikregeln zur Vereinfachung negierter Ausdrücke: NOT(A AND B) = NOT A OR NOT B.",
  "Deklaration":"Festlegung von Name und Datentyp einer Variable in Java (z.B. int preis;).",
  "Direktgeschäft":"Online-Vertriebsform, bei der ein Händler über einen eigenen Shop direkt verkauft (kein Marktplatz).",
  "Discounter":"Betriebstyp mit schmalem, flachem Sortiment und Preisführerschaft (z.B. Aldi, Lidl).",
  "Disintermediation":"Ausschaltung von Handelsstufen durch direkten Verkauf vom Hersteller an den Endkunden (z.B. via D2C).",
  "Disruption":"Radikale Marktveränderung durch neue Technologie, die etablierte Geschäftsmodelle verdrängt.",
  "Dropshipping":"Fulfillment-Modell, bei dem der Hersteller/Großhändler direkt an den Endkunden versendet – Händler braucht kein eigenes Lager.",
  "E-Commerce":"Elektronischer Handel – Kauf und Verkauf von Waren/Dienstleistungen über digitale Kanäle (Internet).",
  "Eigenkapital":"Kapital, das den Eigentümern des Unternehmens gehört – Teil der Passivseite der Bilanz.",
  "Einzelhandel":"Handelsstufe, die Waren direkt an Endverbraucher verkauft (im Gegensatz zum Großhandel).",
  "Fachhandel":"Betriebstyp mit tiefem Sortiment in einer Warengruppe und hoher Beratungskompetenz (z.B. MediaMarkt).",
  "Fremdkapital":"Von außen geliehenes Kapital (Kredite, Verbindlichkeiten) – Teil der Passivseite der Bilanz.",
  "Fulfillment":"Gesamtprozess von Lagerung über Kommissionierung bis Versand und Retourenabwicklung im E-Commerce.",
  "GAFA":"Sammelbegriff für Google, Apple, Facebook (Meta), Amazon – die dominanten US-Tech-Plattformen.",
  "GbR":"Gesellschaft bürgerlichen Rechts – einfachste Personengesellschaft, mind. 2 Personen, unbeschränkte Haftung.",
  "GmbH":"Gesellschaft mit beschränkter Haftung – Kapitalgesellschaft mit 25.000 € Stammkapital, häufigste Rechtsform für Online-Shops.",
  "GoB":"Grundsätze ordnungsmäßiger Buchführung – ungeschriebene Regeln für korrekte, nachvollziehbare Buchführung.",
  "Großhandel":"Handelsstufe, die große Warenmengen an Wiederverkäufer (nicht Endverbraucher) verkauft.",
  "Güterarten":"Klassifizierung wirtschaftlicher Güter in Sachgüter, Dienstleistungen und Rechte.",
  "HGB":"Handelsgesetzbuch – zentrales deutsches Gesetz für Kaufleute, regelt u.a. Buchführungspflicht.",
  "HRW Moodle":"Digitale Lernplattform der Hochschule Ruhr West für Vorlesungsmaterialien, Abgaben und Kommunikation.",
  "HTTP":"HyperText Transfer Protocol – unverschlüsseltes Protokoll zur Datenübertragung im Web.",
  "HTTPS":"HTTP + SSL/TLS-Verschlüsselung – sicherer Standard, Pflicht für jeden seriösen Online-Shop.",
  "Haben":"Rechte Seite eines T-Kontos; bei Passivkonten bedeutet eine Buchung im Haben eine Erhöhung.",
  "Haftungsbeschränkung":"Rechtlicher Schutz, bei dem nur das Gesellschaftsvermögen (nicht das Privatvermögen) für Schulden haftet (z.B. bei GmbH).",
  "Handelsfunktion":"Aufgabe, die der Handel in der Wertschöpfungskette übernimmt (Überbrückung, Quantität, Qualität, Kredit, Werbung).",
  "Handelsmanagement":"Disziplin, die sich mit Strategie, Organisation und Steuerung von Handelsunternehmen beschäftigt.",
  "Handelsregister":"Öffentliches Verzeichnis, in dem Kaufleute und Kapitalgesellschaften rechtsverbindlich eingetragen werden.",
  "Hedonistisch":"Kaufmotivation aus Freude/Genuss am Einkaufserlebnis selbst (Gegensatz: utilitaristisch).",
  "Hexadezimal":"Zahlensystem mit Basis 16 (0–9, A–F) – kompakte Darstellung binärer Daten (z.B. Farbcodes #FF5733).",
  "Initialisierung":"Erstmalige Wertzuweisung an eine deklarierte Variable in Java (z.B. preis = 9.99;).",
  "Inventar":"Detailliertes, mengenmäßiges Verzeichnis aller Vermögensgegenstände und Schulden zu einem Stichtag.",
  "Inventur":"Körperliche Bestandsaufnahme (Zählen, Messen, Wiegen) aller Vermögensgegenstände als Basis für das Inventar.",
  "JVM":"Java Virtual Machine – Laufzeitumgebung, die Java-Code plattformunabhängig auf jedem Betriebssystem ausführt.",
  "Jahresüberschuss":"Positives Ergebnis der GuV-Rechnung (Erträge > Aufwendungen) – erhöht das Eigenkapital.",
  "Java-Vertiefung":"Intensiveres Üben von Java-Konzepten über die Grundlagen hinaus, z.B. durch Praxisaufgaben.",
  "Kapitalgesellschaft":"Rechtsform, bei der das Kapital (nicht die Person) im Vordergrund steht – Haftung meist beschränkt (GmbH, AG, UG).",
  "Kapselung":"OOP-Prinzip: Attribute einer Klasse werden privat gehalten und nur über Methoden (Getter/Setter) zugänglich gemacht.",
  "Kaufentscheidungsprozess":"5-stufiger Prozess: Problemerkennung → Informationssuche → Bewertung → Kauf → Nachkaufverhalten.",
  "Kaufhemmnis":"Faktor, der einen Online-Kauf verhindert oder verzögert (z.B. fehlendes Vertrauen, hohe Versandkosten).",
  "Kaufmann":"Person, die ein Handelsgewerbe betreibt und damit unter die Vorschriften des HGB fällt.",
  "Klasse":"Bauplan für Objekte in Java – definiert Attribute (Eigenschaften) und Methoden (Verhalten).",
  "Konstruktor":"Spezielle Java-Methode, die beim Erstellen eines Objekts automatisch aufgerufen wird, um es zu initialisieren.",
  "Kontrollstruktur":"Sprachelement, das den Programmablauf steuert (if/else, for, while, switch).",
  "Lernkurve":"Grafische Darstellung, wie sich Lernfortschritt über Zeit entwickelt – typisch steil am Anfang, flacher später.",
  "Lernplan":"Strukturierter Zeitplan zur systematischen Vorbereitung auf Prüfungen oder neue Lerninhalte.",
  "Letzte Meile":"Letzter Transportabschnitt vom Verteilzentrum zum Endkunden – teuerster Teil der Logistikkette (40–50% der Kosten).",
  "Literaturverzeichnis":"Vollständige, formal korrekte Liste aller in einer wissenschaftlichen Arbeit zitierten Quellen.",
  "Logikgatter":"Elektronisches Bauteil, das boolesche Operationen (AND, OR, NOT) physisch in Hardware umsetzt.",
  "Marktplatz":"Online-Plattform, auf der mehrere Drittanbieter ihre Produkte verkaufen können (z.B. Amazon Marketplace).",
  "Maximalprinzip":"Wirtschaftlichkeitsprinzip: Mit gegebenem Mitteleinsatz den größtmöglichen Ertrag erzielen.",
  "Methode":"Funktion innerhalb einer Java-Klasse, die eine bestimmte Aktion ausführt und Parameter/Rückgabewerte haben kann.",
  "Mind-Map":"Visuelle Lernmethode, bei der ein Thema im Zentrum steht und verzweigte Unterthemen drumherum angeordnet werden.",
  "Minimalprinzip":"Wirtschaftlichkeitsprinzip: Ein gegebenes Ziel mit dem geringstmöglichen Mitteleinsatz erreichen.",
  "Multichannel":"Vertrieb über mehrere, aber getrennt agierende Kanäle (Filiale + Online-Shop ohne Verknüpfung).",
  "NAND":"Boolescher Operator – Negation von AND; liefert nur dann falsch, wenn beide Eingaben wahr sind.",
  "NOT":"Boolescher Operator, der einen Wahrheitswert invertiert (aus wahr wird falsch und umgekehrt). In Java: !",
  "Netzwerkeffekte":"Phänomen, bei dem eine Plattform für jeden neuen Nutzer wertvoller wird, je mehr Nutzer sie bereits hat.",
  "Nutzungsdauer":"Zeitraum, über den ein Wirtschaftsgut voraussichtlich genutzt wird – Basis der Abschreibungsberechnung.",
  "OR":"Boolescher Operator – Ergebnis ist wahr, wenn MINDESTENS EINE Eingabe wahr ist. In Java: ||",
  "Objekt":"Konkrete Instanz einer Klasse in Java – ein 'fertig gebautes' Exemplar nach dem Bauplan der Klasse.",
  "Omnichannel":"Nahtlos vernetzte Vertriebskanäle mit einheitlichem Kundenerlebnis (z.B. online bestellen, im Laden abholen).",
  "Parameter":"Eingabewert, der einer Methode beim Aufruf übergeben wird, um sie zu konfigurieren.",
  "Passiva":"Rechte Seite der Bilanz – zeigt, WOHER das Kapital stammt (Eigen- & Fremdkapital).",
  "Passivkonto":"Bilanzkonto auf der Kapitalseite; Zugänge werden im Haben, Abgänge im Soll gebucht (z.B. Verbindlichkeiten).",
  "Payment Gateway":"Technische Schnittstelle, die Online-Zahlungen zwischen Shop, Kunde und Zahlungsanbieter sicher abwickelt.",
  "Plagiat":"Unrechtmäßige Übernahme fremder Texte/Ideen ohne korrekte Quellenangabe – führt zum Nichtbestehen der Arbeit.",
  "Plattform":"Digitales Geschäftsmodell, das Angebot und Nachfrage verschiedener Akteure zusammenbringt (z.B. Amazon, Airbnb).",
  "Port":"Nummerierte 'Tür' an einem Server, über die eine bestimmte Anwendung erreichbar ist (z.B. Port 443 für HTTPS).",
  "Primärquelle":"Originalquelle/Erstveröffentlichung eines Sachverhalts (z.B. das Originalbuch von Deges).",
  "Produktionsfaktoren":"Grundlegende Einsatzmittel der Wirtschaft: Arbeit, Betriebsmittel, Werkstoffe und der dispositive Faktor.",
  "RAM":"Random Access Memory – flüchtiger Arbeitsspeicher, in dem laufende Programme zwischengespeichert werden.",
  "ROPO":"Research Online, Purchase Offline – Kunde informiert sich online, kauft aber im stationären Laden.",
  "Reflexion":"Bewusstes Nachdenken über eigenen Lernfortschritt, um Stärken und Schwächen zu identifizieren.",
  "Restbuchwert":"Verbleibender Wert eines Wirtschaftsguts nach bereits erfolgten Abschreibungen.",
  "Retoure":"Rücksendung einer bestellten Ware durch den Kunden – verursacht erhebliche Zusatzkosten im E-Commerce.",
  "Rückgabewert":"Wert, den eine Java-Methode nach ihrer Ausführung mit 'return' an den Aufrufer zurückgibt.",
  "SSL/TLS":"Verschlüsselungsprotokolle, die HTTPS-Verbindungen absichern und Daten vor Abhören schützen.",
  "Saldo":"Differenz zwischen Soll- und Haben-Summe eines Kontos – zeigt den aktuellen Kontostand.",
  "Sekundärquelle":"Quelle, die über eine Primärquelle berichtet oder sie interpretiert (z.B. ein Statista-Bericht über offizielle Zahlen).",
  "Semesterstart":"Beginn der Vorlesungszeit – bei dir der 1. September 2026 an der HRW.",
  "Seminararbeit":"Wissenschaftliche schriftliche Ausarbeitung zu einem Thema – im ECM-Modul Sem.1 als 25-seitige Gruppenarbeit gefordert.",
  "Server":"Computer/Programm, das Anfragen von Clients entgegennimmt und Daten/Webseiten bereitstellt.",
  "Soll":"Linke Seite eines T-Kontos; bei Aktivkonten bedeutet eine Buchung im Soll eine Erhöhung.",
  "Sortimentsbreite":"Anzahl unterschiedlicher Warengruppen im Sortiment eines Händlers.",
  "Sortimentstiefe":"Anzahl verschiedener Varianten/Ausführungen innerhalb einer Warengruppe.",
  "Spaced Repetition":"Lernmethode mit zeitlich gestaffelten Wiederholungen – Basis des Anki-Algorithmus, maximal effizient fürs Langzeitgedächtnis.",
  "Stakeholder":"Alle Personen/Gruppen mit berechtigtem Interesse am Unternehmen (Mitarbeiter, Kunden, Investoren, Staat).",
  "Stammkapital":"Mindestkapital, das Gesellschafter bei Gründung einer GmbH einbringen müssen (gesetzlich 25.000 €).",
  "Stationärer Handel":"Handel mit physischen Verkaufsstellen (Ladengeschäfte) im Gegensatz zum Online-Handel.",
  "String":"Java-Datentyp für Zeichenketten/Text (z.B. \"Hallo Welt\") – technisch eine Klasse, kein primitiver Typ.",
  "T-Konto":"Visuelle Darstellung eines Buchführungskontos in T-Form: links Soll, rechts Haben.",
  "TCP/IP":"Grundlegendes Protokollpaar des Internets – TCP sichert zuverlässige Übertragung, IP adressiert Geräte.",
  "TOPO":"Try Offline, Purchase Online – Kunde probiert im Laden, kauft aber günstiger online.",
  "Trust":"Vertrauen des Kunden in einen Online-Shop – entscheidender Faktor für die Kaufentscheidung im E-Commerce.",
  "UG":"Unternehmergesellschaft (haftungsbeschränkt) – vereinfachte GmbH-Variante, gründbar bereits ab 1 € Stammkapital.",
  "Umlaufvermögen":"Kurzfristig im Unternehmen gebundenes Vermögen (Waren, Forderungen, Kasse) – Teil der Aktivseite.",
  "Umsatzsteuer":"Steuer auf Warenverkäufe (19% bzw. 7%), die Unternehmen einnehmen und ans Finanzamt abführen.",
  "Utilitaristisch":"Kaufmotivation, die rein zweckorientiert und rational ist – Gegensatz zum hedonistischen Kauf.",
  "Variable":"Benannter Speicherplatz in Java, der einen Wert eines bestimmten Datentyps enthält.",
  "Vererbung":"OOP-Prinzip, bei dem eine Unterklasse Attribute und Methoden einer Oberklasse automatisch übernimmt.",
  "Von-Neumann":"Klassische Computerarchitektur mit gemeinsamem Speicher für Programme und Daten, gesteuert durch eine CPU.",
  "Vorsteuer":"Umsatzsteuer, die ein Unternehmen beim Einkauf zahlt und vom Finanzamt zurückerstattet bekommt.",
  "Wahrheitstabelle":"Tabellarische Darstellung aller möglichen Ein-/Ausgabe-Kombinationen einer logischen Operation.",
  "Wertschöpfungskette":"Abfolge von Aktivitäten, die ein Produkt vom Rohstoff bis zum Endkunden durchläuft und dabei an Wert gewinnt.",
  "Wiederholung":"Aktives erneutes Durcharbeiten von bereits gelerntem Stoff zur Festigung im Langzeitgedächtnis.",
  "Wirtschaftlichkeit":"Verhältnis von erzieltem Ertrag zu eingesetzten Mitteln – zentrales ökonomisches Prinzip.",
  "Wissenschaftssprache":"Präzise, unpersönliche und sachliche Ausdrucksweise, die in akademischen Arbeiten erwartet wird.",
  "XOR":"Boolescher Operator (Exklusiv-Oder) – wahr, wenn GENAU EINE der beiden Eingaben wahr ist.",
  "Zahlungsausfallrisiko":"Risiko des Händlers, dass ein Kunde nach Lieferung nicht bezahlt (besonders bei Kauf auf Rechnung).",
  "Zitation":"Korrekte Kennzeichnung übernommener Gedanken/Texte mit Quellenangabe in wissenschaftlichen Arbeiten.",
  "bevh":"Bundesverband E-Commerce und Versandhandel Deutschland – wichtigste Quelle für deutsche E-Commerce-Marktzahlen.",
  "boolean":"Java-Datentyp, der nur zwei Werte annehmen kann: true oder false.",
  "break":"Java-Schlüsselwort, das eine Schleife oder switch-Anweisung sofort beendet.",
  "continue":"Java-Schlüsselwort, das den Rest der aktuellen Schleifeniteration überspringt und zur nächsten springt.",
  "dispositiver Faktor":"Vierter Produktionsfaktor – die Leitungs- und Entscheidungsfunktion des Managements/Unternehmers.",
  "do-while":"Java-Schleifentyp, der den Code-Block mindestens einmal ausführt und die Bedingung erst danach prüft (Gegensatz zu while).",
  "doppelte Buchführung":"Buchführungssystem, bei dem jeder Geschäftsvorfall auf mindestens zwei Konten erfasst wird (Soll und Haben).",
  "externes Rechnungswesen":"Rechnungswesen-Teil, der für außenstehende Adressaten (Finanzamt, Investoren) gesetzlich vorgeschrieben ist – z.B. Bilanz, GuV.",
  "for-Schleife":"Java-Schleifentyp für eine bekannte Anzahl von Wiederholungen, z.B. for(int i=0;i<10;i++).",
  "if-else":"Java-Kontrollstruktur zur bedingten Ausführung von Code-Blöcken je nach Wahrheitswert einer Bedingung.",
  "int":"Java-Datentyp für ganze Zahlen (ohne Nachkommastellen), z.B. int menge = 5;",
  "switch":"Java-Kontrollstruktur zur übersichtlichen Auswahl zwischen vielen festen Fällen (Alternative zu langen if-else-Ketten).",
  "while-Schleife":"Java-Schleifentyp, der läuft, solange eine Bedingung wahr ist – Anzahl der Durchläufe ist vorher unbekannt.",
  "§ 238 HGB":"Zentrale Gesetzesvorschrift, die die Buchführungspflicht für Kaufleute in Deutschland festlegt.",
  "Überbrückungsfunktion":"Handelsfunktion, die Raum- und Zeitunterschiede zwischen Herstellung und Verbrauch eines Gutes überbrückt.",
};
/* ══════════════════════════════════════════════════════════════════
   SEMESTER-DATEN — Vollständiges Curriculum B.Sc. E-Commerce (HRW)
   Quelle: Modulhandbuch BPO 02.06.2023 (hochschule-ruhr-west.de) + eigene
   didaktische Aufbereitung der Modulthemen mit Definition + Beispiel
   ══════════════════════════════════════════════════════════════════ */
const SEMESTERS=[
  {nr:1,title:"Grundlagen BWL, Handel, E-Commerce & Informatik",ects:30,modules:[
    {id:"s1-bwl",code:"BWL EC",name:"Einführung in die BWL",ects:6,sws:"4",exam:"Klausur 120 Min. · 100%",desc:"Betriebswirtschaftliche Grundlagen und Technik des betrieblichen Rechnungswesens.",
      topics:[
        {t:"Wirtschaftlichkeitsprinzip & betriebliche Ziele",def:"Das ökonomische Prinzip ist die fundamentale Entscheidungsregel der Betriebswirtschaftslehre und beschreibt, wie ein rational handelnder Wirtschaftsakteur mit begrenzten Ressourcen (Knappheit) umgeht. Es existiert in zwei Ausprägungen: Beim Minimalprinzip ist ein bestimmtes Ziel (z.B. eine Produktionsmenge oder ein Umsatzziel) fest vorgegeben, und der Mitteleinsatz (Kosten, Zeit, Personal) soll dafür minimiert werden. Beim Maximalprinzip ist umgekehrt der Mitteleinsatz fix vorgegeben (z.B. ein Budget), und mit diesem soll der größtmögliche Ertrag erzielt werden. Beide Prinzipien sind zwei Seiten derselben Wirtschaftlichkeitslogik: Wirtschaftlichkeit = Ertrag ÷ Aufwand, ein Wert über 1 zeigt, dass mehr erwirtschaftet wurde als eingesetzt wurde. Über das reine Ertrags-Aufwands-Verhältnis hinaus verfolgt jedes Unternehmen ein Zielsystem aus mehreren, teils konkurrierenden Zielarten: Sachziele definieren, WAS angeboten wird (Produkt-/Leistungsprogramm, Marktsegmente, Qualität); Formalziele beschreiben, WIE erfolgreich gewirtschaftet wird (Gewinn, Rentabilität, Liquidität, Marktanteil, Umsatzwachstum); soziale und ökologische Ziele (auch Humanziele bzw. Nachhaltigkeitsziele genannt) betreffen Mitarbeiterzufriedenheit, faire Arbeitsbedingungen, Umweltschutz und gesellschaftliche Verantwortung (CSR). Diese Zielarten stehen in der Praxis häufig in Zielkonflikten zueinander – etwa wenn eine höhere Servicequalität die Formalziele belastet, oder wenn ökologische Standards kurzfristig die Rentabilität senken. Ein gutes Management muss diese Zielkonflikte transparent machen und über Zielhierarchien oder Zielgewichtung auflösen.",ex:"Ein Online-Modehändler hat exakt 5.000 € Werbebudget und möchte damit so viele Neukunden-Bestellungen wie möglich generieren – klassische Anwendung des Maximalprinzips. Würde er stattdessen vorgeben 'Ich brauche 200 neue Kunden' und das günstigste Budget dafür suchen, wäre das Minimalprinzip. Ein Zielkonflikt entsteht, wenn er zusätzlich klimaneutralen Versand anbieten will (soziales Ziel), der die Versandkosten um 15% erhöht und damit das Gewinnziel schmälert."},
        {t:"Rechtsformen von Unternehmen",def:"Die Wahl der Rechtsform bestimmt zentrale unternehmerische Rahmenbedingungen: Haftung, Kapitalbedarf, Steuerlast, Publizitätspflichten und Mitspracherechte. Personengesellschaften umfassen das Einzelunternehmen (ein Inhaber, volle unbeschränkte Haftung, keine Formvorschriften), die GbR (mind. zwei Gesellschafter, gemeinsame Zweckverfolgung, gesamtschuldnerische unbeschränkte Haftung), die OHG (Handelsgewerbe, im Handelsregister eingetragen, ebenfalls unbeschränkte Haftung aller Gesellschafter) und die KG (mind. ein unbeschränkt haftender Komplementär und mind. ein nur mit seiner Einlage haftender Kommanditist). Kapitalgesellschaften sind eigenständige juristische Personen mit eigener Rechtspersönlichkeit, unabhängig von den Gesellschaftern: Die GmbH erfordert 25.000 € Stammkapital (davon mindestens 12.500 € bei Gründung tatsächlich einzuzahlen), die UG (haftungsbeschränkt) als 'Mini-GmbH' kann bereits mit 1 € gegründet werden, muss aber Gewinne teilweise als gesetzliche Rücklage thesaurieren bis das GmbH-Mindestkapital erreicht ist, und die AG benötigt 50.000 € Grundkapital sowie Vorstand, Aufsichtsrat und Hauptversammlung. Mit der Rechtsform verändern sich zudem Buchführungspflichten (Kapitalgesellschaften sind stets buchführungspflichtig), Publizitätspflichten (z.B. Offenlegung im Bundesanzeiger) sowie Mitbestimmungsrechte der Arbeitnehmer ab bestimmten Unternehmensgrößen. Die Entscheidung ist daher immer eine Abwägung zwischen Haftungsschutz, Gründungsaufwand, steuerlicher Behandlung und Außenwirkung gegenüber Banken, Lieferanten und Investoren.",ex:"Zwei Gründer starten einen Online-Sneaker-Shop mit 3.000 € Startkapital. Wegen des geringen Kapitals wählen sie zunächst die UG (haftungsbeschränkt) mit 1.500 € Stammkapital statt einer GmbH – ihr Privatvermögen bleibt geschützt. Wächst der Umsatz auf über 500.000 € jährlich und bauen sie 25.000 € Rücklagen auf, können sie später in eine GmbH umwandeln, um seriöser gegenüber Lieferanten und Investoren aufzutreten."},
        {t:"Buchführungspflicht & GoB",def:"§ 238 Abs. 1 HGB verpflichtet jeden Kaufmann, Bücher zu führen und darin seine Handelsgeschäfte sowie die Lage seines Vermögens nach den Grundsätzen ordnungsmäßiger Buchführung (GoB) ersichtlich zu machen. Kaufmann im rechtlichen Sinn ist grundsätzlich jeder, der ein Handelsgewerbe betreibt (Ist-Kaufmann), sowie jeder, der sich freiwillig ins Handelsregister eintragen lässt (Kann-Kaufmann). Kleingewerbetreibende und Freiberufler, die bestimmte Umsatz- und Gewinnschwellen nicht überschreiten (§ 241a HGB: 800.000 € Umsatz bzw. 80.000 € Gewinn pro Jahr), sind von der doppelten Buchführung befreit und dürfen vereinfacht per Einnahmen-Überschuss-Rechnung (EÜR) ihren Gewinn ermitteln. Die GoB selbst sind kein geschlossenes Gesetzeswerk, sondern ein Bündel kodifizierter und ungeschriebener, aus der kaufmännischen Praxis abgeleiteter Ordnungsprinzipien: Richtigkeit und Willkürfreiheit (Buchungen müssen den tatsächlichen Geschäftsvorfall widerspiegeln), Vollständigkeit (kein Geschäftsvorfall darf fehlen), Klarheit und Übersichtlichkeit, Nachprüfbarkeit (lückenloser Zusammenhang zwischen Beleg und Buchung – 'keine Buchung ohne Beleg'), das Vorsichtsprinzip (Verluste werden antizipiert, Gewinne erst bei Realisierung verbucht) sowie zeitgerechte und geordnete Erfassung. Diese Prinzipien dienen dem Gläubigerschutz und der Vergleichbarkeit von Abschlüssen und sind Grundlage jeder Betriebsprüfung.",ex:"Ein Online-Händler mit GmbH-Rechtsform und 800.000 € Jahresumsatz ist eindeutig buchführungspflichtig und muss jede Wareneinfuhr, jede Marktplatzabrechnung und jede PayPal-Gutschrift lückenlos mit Belegen dokumentieren – ein Betriebsprüfer muss jede Buchung bis zum Ursprungsbeleg zurückverfolgen können (Belegprinzip als Ausprägung der GoB)."},
        {t:"Soll/Haben, T-Konten, Buchungssätze",def:"Die doppelte Buchführung ist das zentrale technische Verfahren des Rechnungswesens: Jeder Geschäftsvorfall wird stets auf mindestens zwei Konten erfasst – einmal auf der linken Seite (Soll) und einmal auf der rechten Seite (Haben) – wodurch die fundamentale Bilanzgleichung Aktiva = Passiva jederzeit erhalten bleibt und sich Fehlbuchungen über Kontrollsummen aufdecken lassen. Konten werden schematisch als T-Konten dargestellt: eine senkrechte Linie trennt Soll (links) von Haben (rechts). Für Aktivkonten (Bestandskonten des Vermögens wie Kasse, Bank, Warenbestand, Forderungen) gilt: Anfangsbestand und Zugänge stehen im Soll, Abgänge im Haben. Für Passivkonten (Eigenkapital, Verbindlichkeiten, Rückstellungen) gilt es spiegelverkehrt: Anfangsbestand und Zugänge im Haben, Abgänge im Soll. Ein Buchungssatz ist die formale Kurzschreibweise eines Geschäftsvorfalls nach dem Schema 'Soll-Konto an Haben-Konto, Betrag' und liest sich wie ein Satz: Das im Soll genannte Konto wird belastet, das im Haben genannte entlastet bzw. erkannt. Komplexere Vorfälle können auch zusammengesetzte Buchungssätze mit mehreren Soll- oder Haben-Konten erfordern, wobei die Summe aller Soll-Beträge stets der Summe aller Haben-Beträge entsprechen muss.",ex:"Ein Fashion-Shop kauft Ware im Wert von 2.000 € auf Rechnung (30 Tage Zahlungsziel) ein. Buchungssatz: Wareneingang 2.000 € an Verbindlichkeiten 2.000 €. Zahlt er 15 Tage später per Überweisung, lautet der zweite Buchungssatz: Verbindlichkeiten 2.000 € an Bank 2.000 € – das Bankkonto wird im Haben entlastet, die Schuld im Soll getilgt."},
        {t:"Bilanz, GuV, Abschreibungen",def:"Die Bilanz und die Gewinn- und Verlustrechnung (GuV) sind die zentralen Bestandteile des handelsrechtlichen Jahresabschlusses (§ 242 HGB). Die Bilanz ist eine stichtagsbezogene Gegenüberstellung von Vermögen und Kapital: Auf der Aktivseite steht die Mittelverwendung, gegliedert in Anlagevermögen (langfristig gebundene Werte wie Maschinen, Gebäude, Lizenzen) und Umlaufvermögen (kurzfristig verfügbare Werte wie Warenbestand, Forderungen, liquide Mittel); auf der Passivseite steht die Mittelherkunft, gegliedert in Eigenkapital und Fremdkapital (Verbindlichkeiten, Rückstellungen). Beide Bilanzseiten sind per Definition immer gleich groß (Bilanzsumme). Die GuV ist demgegenüber zeitraumbezogen: Sie stellt alle Erträge (z.B. Umsatzerlöse) den Aufwendungen (Material-, Personalaufwand, Abschreibungen) einer Periode gegenüber und ermittelt den Jahresüberschuss oder -fehlbetrag, der anschließend das Eigenkapital in der Folgebilanz erhöht bzw. mindert. Abschreibungen (AfA) sind das Bindeglied zwischen beiden Rechenwerken: Sie verteilen Anschaffungs-/Herstellungskosten von Anlagevermögen systematisch über die betriebsgewöhnliche Nutzungsdauer (oft anhand amtlicher AfA-Tabellen), reduzieren dadurch jährlich den Restbuchwert in der Bilanz und schlagen sich gleichzeitig als Aufwand in der GuV nieder. Man unterscheidet die lineare Abschreibung (gleichbleibender Jahresbetrag) von der degressiven Abschreibung (fallende Jahresbeträge) sowie außerplanmäßige Abschreibungen bei dauerhafter Wertminderung.",ex:"Ein E-Commerce-Unternehmen kauft einen Lagerstapler für 24.000 €, Nutzungsdauer 8 Jahre. Lineare Jahresabschreibung: 24.000 € ÷ 8 = 3.000 €/Jahr. Nach 3 Jahren steht der Stapler mit einem Restbuchwert von 15.000 € in der Bilanz, während die jährlichen 3.000 € als Aufwand die GuV und damit den Jahresüberschuss mindern."},
      ],
      quiz:[{q:"Was besagt das Minimalprinzip?",options:["Maximalen Ertrag mit festem Mitteleinsatz erzielen","Ein festes Ziel mit minimalem Mitteleinsatz erreichen","Immer die billigste Option wählen","Nur bei Verlust wirtschaften"],correct:1,explain:"Minimalprinzip = gegebenes Ziel mit geringstmöglichem Aufwand erreichen."},{q:"Welche Rechtsform hat unbeschränkte Haftung?",options:["GmbH","AG","GbR","UG"],correct:2,explain:"Bei der GbR haften die Gesellschafter unbeschränkt und persönlich."},{q:"Auf welcher Seite steht bei einem Aktivkonto der Zugang?",options:["Haben","Soll","Beide gleich","Keine, nur bei Passivkonten"],correct:1,explain:"Aktivkonten: Zugang im Soll, Abgang im Haben."}],
      cards:[{front:"Wirtschaftlichkeitsprinzip",back:"Verhältnis von Ertrag zu Mitteleinsatz optimieren – Minimal- oder Maximalprinzip."},{front:"GmbH",back:"Kapitalgesellschaft, 25.000 € Stammkapital, Haftung auf Gesellschaftsvermögen beschränkt."},{front:"GoB",back:"Grundsätze ordnungsmäßiger Buchführung – Regeln für korrekte, nachvollziehbare Buchhaltung."},{front:"T-Konto",back:"Visuelle Kontodarstellung: links Soll, rechts Haben."},{front:"Aktiva",back:"Linke Bilanzseite – zeigt, wofür das Kapital verwendet wurde (Vermögen)."}]},

    {id:"s1-hbl",code:"HBL",name:"Grundlagen des Handelsmanagements",ects:6,sws:"4",exam:"Klausur 60 Min. · 100%",desc:"Einführung in das Handelsmanagement: Handelsfunktionen, Betriebstypen, Sortimentspolitik.",
      topics:[
        {t:"5 klassische Handelsfunktionen",def:"Der Handel ist volkswirtschaftlich als eigenständige Wirtschaftsstufe zwischen Produktion und Konsum zu verstehen, die Wert schafft, indem sie güterwirtschaftliche und informatorische Lücken zwischen Herstellern und Endkunden schließt. Klassischerweise werden fünf Grundfunktionen unterschieden: (1) Die Raum- und Zeit-Überbrückungsfunktion transportiert Ware von Produktionsstandorten zu den Kunden und lagert sie zwischen Produktion und Bedarf zwischen; (2) die Mengen-/Quantitätsfunktion (Umgruppierungsfunktion) zerlegt große, industriell produzierte Mengen in kleinere, konsumgerechte Einheiten; (3) die Qualitäts-/Sortimentsfunktion bündelt Produkte unterschiedlicher Hersteller zu einem für die Zielgruppe sinnvollen Sortiment und übernimmt dabei häufig Qualitätskontrolle; (4) die Kreditfunktion (Finanzierungsfunktion) ermöglicht Zahlungsziele, Ratenkäufe oder Vorfinanzierung und verlagert damit Liquiditätsrisiken zwischen den Marktstufen; (5) die Werbe- und Beratungsfunktion informiert über Produkte, schafft Aufmerksamkeit und unterstützt die Kaufentscheidung durch fachkundige Beratung. Im digitalen Handel verschieben sich diese Funktionen deutlich: Die Raum-/Zeitfunktion wird zunehmend von spezialisierten Fulfillment-Dienstleistern übernommen, während persönliche Beratung immer häufiger durch algorithmische Empfehlungen, Kundenbewertungen und Erklärvideos ersetzt wird – die Funktion bleibt bestehen, nur ihr Träger verändert sich.",ex:"Amazon erfüllt alle 5 Funktionen digital: Es lagert Millionen Artikel in Fulfillment-Zentren (Überbrückung), bietet Einzelstücke statt Großgebinde (Menge), bündelt Produkte unzähliger Hersteller durchsuchbar (Sortiment), ermöglicht Rechnungskauf und Ratenzahlung (Kredit) und zeigt Rezensionen sowie Anzeigen (Werbung/Beratung)."},
        {t:"Einzel- vs. Großhandel",def:"Großhandel und Einzelhandel unterscheiden sich primär nach der Marktstufe, auf der sie agieren, sowie nach ihren typischen Kunden. Der Großhandel (Wholesale) kauft üblicherweise in großen Mengen unmittelbar bei Herstellern oder Importeuren ein und verkauft diese in geringeren, aber weiterhin gewerblichen Mengen an Wiederverkäufer, Weiterverarbeiter oder Großabnehmer weiter (klassisches B2B-Geschäft) – typisch sind Mengenrabatte, längere Zahlungsziele und häufig ein Mindestbestellwert. Der Einzelhandel (Retail) verkauft dagegen einzelne Artikel direkt an private Endverbraucher (B2C) und übernimmt dabei zusätzliche, kundennahe Serviceleistungen wie Beratung, Umtausch- und Rückgaberecht, kleinteilige Verpackung sowie ein ansprechendes Einkaufserlebnis. Handelsspannen unterscheiden sich entsprechend: Großhändler kalkulieren meist mit geringeren prozentualen Aufschlägen bei hohem Volumen, Einzelhändler mit höheren Margen bei geringerem Stückvolumen. Im E-Commerce verschwimmen diese Grenzen zunehmend, da digitale Plattformen beide Geschäftsmodelle parallel unter einem Dach abbilden können – etwa wenn ein Konzern sowohl einen B2B-Marktplatz mit Staffelpreisen als auch einen klassischen Endkunden-Shop betreibt und beide über dieselbe Logistikinfrastruktur abwickelt.",ex:"Ein Sportartikelhersteller verkauft Laufschuhe paketweise (je 50 Paar) mit 20% Mengenrabatt und 60 Tagen Zahlungsziel an einen Sporthändler (Großhandel/B2B). Derselbe Hersteller betreibt zugleich einen eigenen Online-Shop, über den Privatkunden einzelne Paare zum vollen Preis sofort per Kreditkarte kaufen (Einzelhandel/B2C)."},
        {t:"Betriebstypen (Fachhandel, Discounter, Marktplatz)",def:"Betriebstypen des Handels sind idealtypische Kombinationen aus Sortimentsbreite und -tiefe, Preis-/Leistungsniveau, Servicegrad, Standortkonzept und Vertriebsweg, an denen sich Handelsunternehmen strategisch positionieren. Der Fachhandel konzentriert sich auf ein enges, aber tiefes Sortiment mit hoher fachlicher Beratungskompetenz im mittleren bis Premium-Preissegment. Verbrauchermärkte und SB-Warenhäuser kombinieren große Sortimentsbreite und -tiefe mit Selbstbedienung und mittlerem Preisniveau, um möglichst viele Bedarfe eines Haushalts in einem Einkauf abzudecken. Discounter reduzieren Sortimentsbreite und -tiefe bewusst auf ein rotierendes Kernsortiment, um über schlanke Prozesse, hohe Umschlagsgeschwindigkeit und geringe Handling-Kosten einen dauerhaften Preisvorteil zu erzielen. Der reine Online-/Versandhandel verzichtet vollständig auf physische Verkaufsflächen und kann dadurch – dank zentraler Lagerhaltung statt Regalflächenbeschränkung – ein nahezu unbegrenztes Sortiment anbieten (Long-Tail-Effekt: auch Nischenprodukte mit geringer Einzelnachfrage werden profitabel, weil sie über viele Regionen hinweg verkauft werden). Marktplätze sind streng genommen gar kein Händler, sondern eine reine Vermittlungs- und Infrastrukturplattform, auf der unabhängige Drittanbieter ihre Produkte listen und dafür Provisionen sowie Gebühren an den Plattformbetreiber zahlen.",ex:"MediaMarkt (Fachhandel: tiefes Elektroniksortiment, geschulte Berater), Kaufland (Verbrauchermarkt: breit und tief, Selbstbedienung), Aldi (Discounter: rotierendes Schmalsortiment), Zalando (Online-Versandhandel: über 6.000 Marken ohne eigene Läden) und Amazon Marketplace (reine Vermittlungsplattform mit Millionen Drittanbietern) zeigen die Grundtypen nebeneinander."},
        {t:"Sortimentsbreite & -tiefe",def:"Die Sortimentspolitik ist eine der zentralen strategischen Stellschrauben im Handel und wird über zwei unabhängige Dimensionen gesteuert. Die Sortimentsbreite gibt an, wie viele unterschiedliche Warengruppen bzw. Produktkategorien ein Händler führt – ein breites Sortiment erlaubt es, möglichst viele unterschiedliche Kundenbedürfnisse unter einem Dach zu bedienen und dadurch Kundenbindung sowie durchschnittlichen Bestellwert (Cross-Selling) zu erhöhen. Die Sortimentstiefe gibt an, wie viele Varianten – Marken, Modelle, Farben, Größen, Ausstattungsstufen – innerhalb einer einzelnen Warengruppe angeboten werden; eine hohe Tiefe erhöht die Auswahl und die Wahrscheinlichkeit, dass ein Kunde exakt sein gewünschtes Produkt findet. Aus der Kombination beider Dimensionen ergeben sich vier idealtypische Sortimentsstrategien: schmal und flach (typisch für Discounter), schmal und tief (typisch für Fachgeschäfte), breit und flach (kleinere Gemischtwarenläden) sowie breit und tief (große Kaufhäuser oder Online-Marktplätze). Eine größere Sortimentstiefe erhöht zwar die Kundenzufriedenheit durch Auswahl, gleichzeitig aber auch Lagerkomplexität, Kapitalbindung im Bestand und das Risiko von Ladenhütern.",ex:"Zalando führt Mode, Schuhe, Accessoires, Sport und Beauty (hohe Breite) und bietet allein bei Sneakern hunderte Modelle in zig Farb-/Größenkombinationen (hohe Tiefe) – eine bewusste breit-und-tief-Strategie, um möglichst viele Kaufanlässe eines Kunden auf einer Plattform abzudecken."},
        {t:"Omnichannel vs. Multichannel",def:"Multichannel-Handel bedeutet, dass ein Unternehmen mehrere Vertriebs- und Kommunikationskanäle – Filiale, Online-Shop, Katalog, App, Marktplatz – parallel betreibt, diese aber organisatorisch, technisch und häufig auch von den Verantwortlichkeiten her getrennt funktionieren. Das führt in der Praxis oft zu inkonsistenten Erfahrungen: unterschiedliche Preise oder Verfügbarkeiten je Kanal, getrennte Kundenkonten, keine kanalübergreifende Rückgabemöglichkeit. Omnichannel-Handel geht einen entscheidenden Schritt weiter: Alle Kanäle werden technisch und organisatorisch nahtlos vernetzt, sodass der Kunde ein einheitliches, konsistentes Markenerlebnis erlebt, unabhängig davon, über welchen Kanal er gerade interagiert. Typische Omnichannel-Services sind Click & Collect (online bestellen, in der Filiale abholen), Click & Reserve (online reservieren, vor Ort anprobieren und kaufen), In-Store-Return für online gekaufte Ware sowie ein einheitliches Kundenkonto mit Bonuspunkten und Bestellhistorie über alle Kanäle. Voraussetzung ist eine vollständig integrierte IT-Landschaft: ein zentrales Warenwirtschaftssystem, das Lagerbestände in Echtzeit über alle Kanäle synchronisiert, sowie eine einheitliche Kundendatenbank (Single Customer View), die verhindert, dass derselbe Kunde online und offline als zwei unterschiedliche Personen behandelt wird.",ex:"H&M lässt Kunden online einen Artikel reservieren, in der nächsten Filiale anprobieren und dort sofort kaufen oder zurückgeben (Click & Collect/Return) – Bestand und Kundendaten sind kanalübergreifend in Echtzeit synchronisiert. Ein reiner Multichannel-Händler hätte getrennte Lagerbestände, sodass ein online reservierter Artikel in der Filiale u.U. fehlen würde."},
      ],
      quiz:[{q:"Welche Handelsfunktion beschreibt das Überbrücken von Raum und Zeit?",options:["Kreditfunktion","Überbrückungsfunktion","Werbefunktion","Qualitätsfunktion"],correct:1,explain:"Die Überbrückungsfunktion bringt Ware vom Hersteller zum Kunden über Raum und Zeit."},{q:"Was kennzeichnet einen Discounter?",options:["Tiefes Sortiment, hohe Beratung","Schmales, flaches Sortiment, Preisführerschaft","Nur online aktiv","Ausschließlich Luxusgüter"],correct:1,explain:"Discounter wie Aldi/Lidl setzen auf schmales Sortiment und niedrige Preise."},{q:"Was ist Omnichannel?",options:["Nur ein Verkaufskanal","Getrennte, parallele Kanäle","Nahtlos vernetzte Kanäle mit einheitlichem Erlebnis","Nur stationärer Handel"],correct:2,explain:"Omnichannel verknüpft alle Kanäle nahtlos (z.B. online bestellen, im Laden abholen)."}],
      cards:[{front:"Handelsfunktion",back:"Aufgabe des Handels in der Wertschöpfungskette (Überbrückung, Menge, Qualität, Kredit, Werbung)."},{front:"Sortimentsbreite",back:"Anzahl unterschiedlicher Warengruppen im Angebot eines Händlers."},{front:"Sortimentstiefe",back:"Anzahl verschiedener Varianten innerhalb einer Warengruppe."},{front:"Disintermediation",back:"Ausschaltung von Handelsstufen durch Direktverkauf (z.B. D2C)."},{front:"Category Management",back:"Strategische Steuerung von Produktkategorien zur Sortiments- und Umsatzoptimierung."}]},

    {id:"s1-ecm",code:"B EC",name:"Grundlagen des E-Commerce",ects:6,sws:"6",exam:"Klausur 120 Min. · 50% + Seminararbeit (Gruppe, 25 S.) mit mündl. Prüfung · 50%",desc:"Grundlagen des E-Commerce/Online-Handels: Geschäftsmodelle, Plattformökonomie, Konsumentenverhalten.",
      topics:[
        {t:"E-Commerce-Historie & ökonomische Bedeutung",def:"Die Entwicklung des E-Commerce lässt sich in mehreren historischen Wellen nachzeichnen. In der Pionierphase Mitte der 1990er-Jahre entstanden die ersten kommerziellen Websites; 1995 gründete Jeff Bezos Amazon zunächst als reinen Online-Buchhandel, 1999 startete eBay seinen deutschen Marktplatz für Privatverkäufe. In den 2000er-Jahren schufen der Ausbau von Breitbandinternet, sinkende Technologiekosten und wachsendes Vertrauen in Online-Zahlungsverfahren (u.a. durch PayPal) die Grundlage für ein breiteres Publikum. In den 2010er-Jahren beschleunigte der mobile Durchbruch (Smartphones, Apps, mobile Zahlungen) den Wandel zusätzlich, während gleichzeitig Amazon und Zalando zu globalen Größen aufstiegen. Die Corona-Pandemie 2020/2021 wirkte als historischer Beschleuniger: Weil stationäre Geschäfte zeitweise schließen mussten, verlagerte sich Kaufverhalten strukturell und dauerhaft Richtung Online. Ökonomisch ist der deutsche E-Commerce-Markt heute laut Branchenverband bevh ein Umsatzvolumen von rund 80 Mrd. € jährlich und beeinflusst damit nicht nur die Wettbewerbsfähigkeit einzelner Händler, sondern auch gesamtwirtschaftliche Größen wie Beschäftigung im Einzelhandel, die Struktur von Innenstädten (Leerstand durch Kaufkraftabwanderung) und internationale Warenströme durch grenzüberschreitenden Online-Handel.",ex:"Der deutsche Online-Modehandel wuchs 2020 pandemiebedingt zweistellig, während stationäre Modegeschäfte teils über 30% Umsatzverlust verzeichneten – ein Beispiel dafür, wie externe Schocks Handelsstrukturen dauerhaft Richtung Online verschieben können."},
        {t:"B2B/B2C/C2C/D2C-Geschäftsmodelle",def:"Die vier zentralen E-Commerce-Geschäftsmodelle unterscheiden sich danach, welche Marktseiten an der Transaktion beteiligt sind und wer die Kontrolle über Kundenbeziehung und Markenerlebnis behält. B2C (Business-to-Consumer) bezeichnet den Verkauf eines Unternehmens an private Endverbraucher und ist das klassische Modell des Online-Handels (z.B. Zalando). B2B (Business-to-Business) bezeichnet den Verkauf zwischen Unternehmen, häufig mit abweichenden Preisstrukturen (Staffelpreise, individuelle Konditionen), größeren Bestellmengen und komplexeren Beschaffungsprozessen mit mehreren Entscheidern (z.B. Amazon Business). C2C (Consumer-to-Consumer) vermittelt den Verkauf zwischen Privatpersonen über eine zentrale Plattform, die selbst nicht Eigentümerin der Ware ist, sondern über Vermittlungsgebühren oder Abonnements Einnahmen erzielt (z.B. eBay Kleinanzeigen, Vinted). D2C (Direct-to-Consumer) beschreibt ein Modell, bei dem ein Hersteller bewusst auf den mehrstufigen Handel verzichtet und direkt an Endkunden verkauft – meist über einen eigenen Online-Shop. Der strategische Vorteil von D2C liegt in der vollständigen Kontrolle über Markenpräsentation, Preisgestaltung und vor allem über wertvolle Erstanbieter-Kundendaten (First-Party-Data); der Nachteil ist der Verzicht auf die etablierte Reichweite, Logistik und Kundenbasis traditioneller Handelspartner.",ex:"Nike verkauft weiterhin über Zalando (B2C via Drittanbieter), baut aber gezielt nike.com als D2C-Kanal aus, um Kundendaten direkt zu erfassen und limitierte Editionen exklusiv selbst zu vermarkten – ein Trend vieler Markenhersteller weg vom reinen Handelspartner-Modell."},
        {t:"Plattformökonomie & Netzwerkeffekte",def:"Plattformunternehmen unterscheiden sich fundamental von klassischen linearen Handelsunternehmen dadurch, dass sie in der Regel selbst kein oder kaum eigenes Warenvermögen besitzen, sondern als vermittelnde Infrastruktur zwischen zwei oder mehr Marktseiten fungieren – etwa zwischen Käufern und Verkäufern – und für diese Vermittlungsleistung Gebühren, Provisionen oder Werbeeinnahmen erzielen. Der zentrale ökonomische Werttreiber von Plattformen sind Netzwerkeffekte. Man unterscheidet direkte (same-side) Netzwerkeffekte, bei denen der Nutzen für eine Nutzergruppe unmittelbar mit der Anzahl der Mitglieder derselben Gruppe steigt, von indirekten (cross-side) Netzwerkeffekten, bei denen der Nutzen einer Marktseite mit der Anzahl der Teilnehmer auf der jeweils anderen Marktseite steigt (mehr Käufer machen die Plattform für Verkäufer attraktiver, und umgekehrt ziehen mehr Verkäufer wiederum mehr Käufer an). Diese sich selbst verstärkenden Effekte führen in vielen digitalen Märkten zu einer Tendenz hin zu 'Winner-take-most'- oder sogar 'Winner-take-all'-Marktstrukturen, in denen wenige dominante Plattformen den überwiegenden Teil des Marktes kontrollieren. Zusätzlich verschaffen die im Betrieb gesammelten Nutzer- und Transaktionsdaten der etablierten Plattform einen kumulativen Datenvorteil, der Empfehlungsalgorithmen, Preisfindung und Produktentwicklung verbessert und Neueinsteigern den Markteintritt zusätzlich erschwert.",ex:"Amazon Marketplace: Je mehr Drittanbieter listen, desto attraktiver wird die Plattform für Käufer; je mehr Käufer aktiv sind, desto attraktiver wird sie für neue Verkäufer – dieser sich selbst verstärkende Netzwerkeffekt hat Amazon zur dominanten Plattform mit über 2 Mio. aktiven Drittanbietern gemacht."},
        {t:"Kaufentscheidungsprozess & ROPO-Effekt",def:"Der Kaufentscheidungsprozess wird in der Konsumentenverhaltensforschung klassisch in fünf aufeinanderfolgende Phasen unterteilt. In der Problemerkennung wird dem Konsumenten ein Bedürfnis bewusst (ausgelöst durch interne Reize wie Bedarf oder externe Reize wie Werbung). In der Informationssuche recherchiert der Kunde mögliche Lösungen – heute überwiegend online über Suchmaschinen, Vergleichsportale, Social Media und Influencer-Empfehlungen. In der Bewertung der Alternativen vergleicht er Angebote anhand von Preis, Qualität, Bewertungen und Markenvertrauen. In der Kaufentscheidung erfolgt der eigentliche Kaufabschluss auf einem gewählten Kanal. Im Nachkaufverhalten entscheidet sich, ob der Kunde zufrieden ist, das Produkt behält oder retourniert, eine Bewertung hinterlässt und eine Wiederkaufabsicht entsteht. Dabei spielt der ROPO-Effekt (Research Online, Purchase Offline) eine zentrale Rolle: Viele Kunden recherchieren online, kaufen aber bewusst stationär – etwa weil sie das Produkt vorab anfassen, anprobieren oder sofort mitnehmen möchten. Das spiegelbildliche Gegenstück TOPO (Try Offline, Purchase Online) beschreibt den umgekehrten Weg: im Laden anprobieren, aber anschließend günstiger online kaufen. Beide Effekte belegen, dass sich Online- und Offline-Handel in der Realität kaum trennscharf abgrenzen lassen.",ex:"Ein Kunde vergleicht Kopfhörer anhand von YouTube-Reviews und Amazon-Bewertungen (Informationssuche), geht dann aber in den Elektronikmarkt, um sie live zu testen und sofort mitzunehmen (ROPO). Ein anderer Kunde probiert Kleidungsgrößen im Laden an, bestellt das passende Teil aber abends günstiger online (TOPO)."},
        {t:"Payment & Fulfillment",def:"Payment und Fulfillment bilden gemeinsam das operative Rückgrat jeder E-Commerce-Transaktion nach Abschluss des Kaufakts. Im Bereich Payment stehen Händlern verschiedene Zahlungsmethoden mit unterschiedlichem Risiko-, Kosten- und Komfortprofil zur Verfügung: Der Kauf auf Rechnung ist bei Kunden sehr beliebt, weil er das Ausfallrisiko beim Kunden lässt, bevor er die Ware sieht, birgt für den Händler jedoch ein erhebliches Forderungsausfallrisiko. PayPal und Kreditkarte bieten hohen Komfort und schnelle Abwicklung, kosten aber prozentuale Transaktionsgebühren. Buy-now-pay-later-Anbieter wie Klarna übernehmen das komplette Ausfallrisiko gegen eine Gebühr und zahlen dem Händler sofort aus, was die Konversionsrate erhöhen kann. SEPA-Lastschrift ist günstig, birgt aber ein Rückbuchungsrisiko innerhalb der gesetzlichen Widerspruchsfrist. Im Bereich Fulfillment umfasst der Prozess den kompletten physischen Weg einer Bestellung: Wareneingang und Einlagerung, Kommissionierung (Zusammenstellen der Bestellung), Verpackung, Übergabe an den Versanddienstleister sowie Retourenabwicklung inkl. Qualitätsprüfung. Händler wählen zwischen Inhouse-Fulfillment (volle Kontrolle, hohe Fixkosten), Auslagerung an spezialisierte 3PL-Logistikdienstleister (Skalierbarkeit ohne eigene Infrastruktur) oder Dropshipping (der Hersteller versendet direkt, kein eigenes Lagerrisiko, aber weniger Kontrolle über Lieferzeit und Markenerlebnis).",ex:"Ein Modehändler bietet Kauf auf Rechnung (erhöht die Konversion, aber mit Ausfallrisiko) und Klarna-Ratenkauf an; im Hintergrund lagert er Bestseller im eigenen Lager, lässt saisonale Nischenartikel aber per Dropshipping direkt vom Hersteller verschicken, um Kapital nicht in selten verkaufte Ware zu binden."},
      ],
      quiz:[{q:"Was bedeutet D2C?",options:["Data to Cloud","Direct to Consumer","Distribution to Company","Digital to Customer"],correct:1,explain:"D2C: Hersteller verkauft direkt an Endkunden, ohne Zwischenhändler."},{q:"Was beschreibt der ROPO-Effekt?",options:["Online recherchieren, offline kaufen","Immer nur online kaufen","Retouren ohne Produktoption","Reine Offline-Werbung"],correct:0,explain:"ROPO = Research Online, Purchase Offline."},{q:"Was sind Netzwerkeffekte?",options:["Serverausfälle bei hoher Last","Plattform wird wertvoller, je mehr Nutzer sie hat","Preissenkung bei mehr Konkurrenz","Netzwerkkabel-Standards"],correct:1,explain:"Je mehr Nutzer eine Plattform hat, desto attraktiver wird sie für neue Nutzer."}],
      cards:[{front:"B2C",back:"Business-to-Consumer – Unternehmen verkauft direkt an Endverbraucher."},{front:"Plattformökonomie",back:"Geschäftsmodell, das Angebot und Nachfrage verschiedener Akteure auf einer Plattform zusammenbringt."},{front:"ROPO-Effekt",back:"Research Online, Purchase Offline – online informieren, im Laden kaufen."},{front:"Fulfillment",back:"Gesamtprozess von Lagerung über Kommissionierung bis Versand und Retouren."},{front:"GAFA",back:"Sammelbegriff für Google, Apple, Facebook (Meta), Amazon."}]},

    {id:"s1-gip",code:"GIP EC",name:"Grundlagen der Informatik und Programmierung",ects:6,sws:"5",exam:"Klausur 120 Min. · 100% + Praktikum (Pflicht, unbenotet)",desc:"Einführung in Informatik-Grundlagen und Programmierung mit Java.",
      topics:[
        {t:"Zahlensysteme (Binär, Hex)",def:"Digitale Rechner verarbeiten sämtliche Informationen – Zahlen, Text, Bilder, Programme – ausschließlich in binärer Form, also im Zahlensystem zur Basis 2 mit den einzigen Ziffern 0 und 1 (Bits), weil sich zwei eindeutig unterscheidbare physikalische Zustände (z.B. Spannung an/aus) technisch am zuverlässigsten realisieren lassen. Da lange Binärfolgen für Menschen schwer lesbar sind, wird in der Praxis häufig das Hexadezimalsystem zur Basis 16 verwendet (Ziffern 0–9 gefolgt von A–F für die Werte 10–15), weil sich exakt vier Binärstellen (ein Nibble) verlustfrei in genau eine Hexadezimalziffer übersetzen lassen – dadurch wird die Darstellung kompakter, etwa bei Farbcodes in HTML/CSS (#FF5733) oder Speicheradressen. Die Umrechnung von Dezimal- in Binärzahlen erfolgt durch fortgesetzte Division der Dezimalzahl durch 2, wobei die entstehenden Reste von unten (zuletzt berechnet) nach oben (zuerst berechnet) gelesen die Binärzahl ergeben. Die Umrechnung von Binär- in Hexadezimalzahlen erfolgt durch Gruppierung der Binärziffern von rechts in 4er-Blöcke, die anschließend einzeln in ihre Hexadezimal-Entsprechung übersetzt werden. Auch die Umrechnung in die Gegenrichtung folgt demselben Prinzip: Jede Hex-Ziffer wird durch ihre 4-Bit-Binärentsprechung ersetzt.",ex:"Die Dezimalzahl 214 wird binär zu 11010110 (128+64+16+4+2=214) und lässt sich in zwei 4er-Blöcke (1101 | 0110) aufteilen, was hexadezimal D6 ergibt – genau dieser Umrechnungstyp taucht regelmäßig als Klausuraufgabe auf."},
        {t:"Boolesche Algebra & Aussagenlogik",def:"Die boolesche Algebra, benannt nach dem Mathematiker George Boole, ist die formale Grundlage der digitalen Logik und arbeitet ausschließlich mit den zwei Wahrheitswerten wahr (1) und falsch (0). Die vier grundlegenden Verknüpfungsoperatoren sind: AND (Konjunktion, in Java &&), das nur dann wahr liefert, wenn beide verknüpften Aussagen gleichzeitig wahr sind; OR (Disjunktion, in Java ||), das bereits dann wahr liefert, wenn mindestens eine der beiden Aussagen wahr ist; NOT (Negation, in Java !), das den Wahrheitswert seiner Eingabe umkehrt; und XOR (exklusives Oder), das nur dann wahr liefert, wenn genau eine der beiden Eingaben wahr ist, nicht aber beide gleichzeitig. Die nach Augustus De Morgan benannten De-Morgan-Regeln erlauben das systematische Umformen negierter Verknüpfungsausdrücke und sind in der Programmierung äußerst nützlich, um komplexe Bedingungen zu vereinfachen: NOT(A AND B) ist logisch identisch zu (NOT A) OR (NOT B), und NOT(A OR B) ist logisch identisch zu (NOT A) AND (NOT B). Diese Regeln bilden die theoretische Basis von Bedingungsausdrücken in nahezu jeder Programmiersprache sowie die physikalische Grundlage digitaler Schaltkreise und Logikgatter in der Hardware-Entwicklung.",ex:"Eine Bestelllogik soll auslösen, wenn NICHT (Lager leer UND Nachfrage niedrig) gilt – nach De-Morgan äquivalent zu (Lager nicht leer) ODER (Nachfrage nicht niedrig). In Java: if (!(lagerLeer && nachfrageNiedrig)) entspricht exakt if (!lagerLeer || !nachfrageNiedrig)."},
        {t:"Java: Variablen & Datentypen",def:"Eine Variable ist in Java ein benannter, typgebundener Speicherplatz im Arbeitsspeicher, dessen Inhalt sich während der Programmlaufzeit ändern kann. Java ist streng typisiert, das heißt jede Variable muss vor ihrer ersten Verwendung mit einem festen Datentyp deklariert werden. Man unterscheidet primitive Datentypen, die direkt Werte speichern (int für 32-Bit-Ganzzahlen, long für sehr große Ganzzahlen, double für Fließkommazahlen doppelter Genauigkeit, float für einfache Genauigkeit, boolean für wahr/falsch, char für ein einzelnes Unicode-Zeichen, byte und short für kleinere Ganzzahlbereiche), von Referenztypen, die stattdessen eine Speicheradresse auf ein Objekt im Heap enthalten – der wichtigste Referenztyp im Alltag ist String für Zeichenketten, der deshalb großgeschrieben wird, weil er technisch eine eigene Klasse ist. Jede Variable sollte möglichst direkt bei der Deklaration mit einem sinnvollen Startwert initialisiert werden, um Fehler durch undefinierte Werte zu vermeiden. Bei der Typkonvertierung (Casting) unterscheidet man die implizite (automatische) Konvertierung, die immer dann stattfindet, wenn kein Informationsverlust droht (z.B. int zu double), von der expliziten (manuellen) Konvertierung mittels vorangestelltem Klammer-Cast wie (int), die nötig ist, wenn vom größeren zum kleineren Typ konvertiert wird und dabei möglicherweise Nachkommastellen oder Wertebereich verloren gehen.",ex:"int lagerbestand = 120; double einzelpreis = 29.99; boolean istVerfuegbar = lagerbestand > 0; String produktname = \"Wanderrucksack\"; double gesamtwert = lagerbestand * einzelpreis; – implizite Konvertierung von int zu double bei der Multiplikation."},
        {t:"Kontrollstrukturen (if/else, Schleifen)",def:"Kontrollstrukturen sind die syntaktischen Bausteine, mit denen ein Programm vom rein sequenziellen Ablauf abweichen und stattdessen Entscheidungen treffen oder Codeabschnitte wiederholen kann. Bedingte Anweisungen steuern Verzweigungen: Eine if-Anweisung führt einen Block nur aus, wenn eine Bedingung wahr ist; eine optionale else-if-Kette prüft weitere Bedingungen der Reihe nach; ein abschließendes else fängt alle übrigen Fälle ab; eine switch-Anweisung bietet bei vielen festen, diskreten Fallunterscheidungen eine übersichtlichere Alternative zu langen if-else-Ketten. Schleifen wiederholen einen Codeblock: Die for-Schleife wird verwendet, wenn die Anzahl der Wiederholungen von vornherein bekannt ist (mit Zählvariable, Bedingung und Inkrement in einer Zeile); die while-Schleife prüft ihre Bedingung vor jedem Durchlauf und eignet sich, wenn die Anzahl vorab unbekannt ist; die do-while-Schleife führt den Block mindestens ein einziges Mal aus, bevor sie ihre Abbruchbedingung überhaupt zum ersten Mal prüft. Innerhalb von Schleifen ermöglichen zwei Sprunganweisungen zusätzliche Kontrolle: break bricht die gesamte Schleife sofort und vollständig ab, während continue lediglich den Rest des aktuellen Durchlaufs überspringt und sofort mit der nächsten Iteration fortfährt.",ex:"for (int i = 1; i <= 10; i++) { if (lagerbestand[i] == 0) continue; System.out.println(produkt[i] + \" ist verfügbar\"); } durchläuft zehn Produkte, überspringt aber ausverkaufte Artikel und listet nur verfügbare auf."},
        {t:"Methoden & objektorientierte Grundlagen",def:"Eine Methode ist ein benannter, wiederverwendbarer Codeabschnitt, der eine klar abgegrenzte Aufgabe erledigt: Sie kann optionale Parameter entgegennehmen und liefert entweder über return einen Wert eines festgelegten Rückgabetyps zurück oder verwendet void, wenn kein Wert zurückgegeben wird. Die objektorientierte Programmierung (OOP) organisiert Software nicht als lose Ansammlung von Funktionen, sondern in Klassen und Objekten: Eine Klasse ist ein Bauplan, der festlegt, welche Attribute (Eigenschaften) und Methoden (Verhalten) ihre Instanzen besitzen; ein Objekt ist eine konkrete, im Speicher existierende Instanz dieser Klasse mit eigenen, individuellen Attributwerten. Ein Konstruktor ist eine spezielle, nach der Klasse benannte Methode ohne Rückgabetyp, die automatisch beim Erzeugen eines neuen Objekts mit new aufgerufen wird und typischerweise die Attribute mit übergebenen Startwerten initialisiert. Vererbung (mit extends realisiert) erlaubt es, eine Unterklasse zu definieren, die automatisch sämtliche Attribute und Methoden einer Oberklasse übernimmt und zusätzlich um eigene ergänzen oder bestehende Methoden überschreiben (Overriding) kann – das fördert Wiederverwendbarkeit, vermeidet Codeduplikate und bildet reale Hierarchien direkt im Code ab.",ex:"class Produkt { String name; double preis; Produkt(String n, double p){name=n; preis=p;} double getBrutto(double mwst){return preis*(1+mwst);} } – ein Objekt Produkt sneaker = new Produkt(\"Air Max\", 129.99); ruft dann sneaker.getBrutto(0.19) auf, um den Bruttopreis inkl. 19% Mehrwertsteuer zu berechnen (154.69 €)."},
      ],
      quiz:[{q:"Wie viele Werte kann 1 Bit annehmen?",options:["1","2","4","8"],correct:1,explain:"Ein Bit ist binär: 0 oder 1 – also 2 mögliche Werte."},{q:"Was liefert NOT(A AND B) nach De-Morgan?",options:["NOT A AND NOT B","NOT A OR NOT B","A OR B","A AND B"],correct:1,explain:"De-Morgan: NOT(A AND B) = NOT A OR NOT B."},{q:"Welcher Java-Datentyp speichert Text?",options:["int","boolean","String","double"],correct:2,explain:"String ist der Java-Referenztyp für Zeichenketten/Text."}],
      cards:[{front:"Binärsystem",back:"Zahlensystem mit Basis 2 (nur 0 und 1) – die Sprache des Computers."},{front:"Boolescher Operator AND",back:"Ergebnis nur wahr, wenn beide Eingaben wahr sind. In Java: &&"},{front:"for-Schleife",back:"Java-Schleife für bekannte Wiederholungsanzahl: for(int i=0;i<10;i++)"},{front:"Klasse (Java)",back:"Bauplan für Objekte – definiert Attribute und Methoden."},{front:"Konstruktor",back:"Spezielle Methode, die beim Erstellen eines Objekts automatisch aufgerufen wird."}]},

    {id:"s1-eng",code:"ENGECom",name:"English",ects:6,sws:"4",exam:"Mehrteilig: Draft 25% + Presentation 40% + schriftl. Prüfung 35%",desc:"Business-Englisch für den E-Commerce-Kontext, mit Anwesenheitspflicht.",
      topics:[
        {t:"Business Vocabulary E-Commerce",def:"Professionelles Business-Englisch im E-Commerce-Kontext erfordert einen präzisen, fachspezifischen Wortschatz, der weit über Alltagsenglisch hinausgeht und sich grob in mehrere Kategorien gliedern lässt. Finanzielle Kennzahlen umfassen Begriffe wie revenue (Umsatz), profit margin (Gewinnspanne), conversion rate (Konversionsrate), churn rate (Abwanderungsrate) und customer lifetime value (erwarteter Gesamtwert eines Kunden über die gesamte Beziehung). Prozessbegriffe umfassen supply chain (Lieferkette), fulfillment (Auftragsabwicklung), inventory management (Bestandsmanagement) und customer journey (die gesamte Kundenreise von der ersten Wahrnehmung bis zum Nachkauf). Stakeholder-Begriffe unterscheiden shareholder (formale Anteilseigner mit Kapitalbeteiligung) von stakeholder im weiteren Sinne (jede Interessengruppe mit legitimem Interesse am Unternehmen, also auch Mitarbeiter, Kunden, Lieferanten und die Gesellschaft). Zusätzlich sollten Studierende auf systematische Unterschiede zwischen britischem und amerikanischem Geschäftsenglisch achten (colour/color, organisation/organization, unterschiedliche Anredekonventionen) sowie den jeweils angemessenen Formalitätsgrad wählen – ein interner Chat mit Kollegen erfordert einen anderen Ton als ein formeller Investorenbericht oder eine Kundenkommunikation.",ex:"In einem Quartalsbericht könnte stehen: 'Our conversion rate increased by 12% after the checkout redesign, while churn rate among returning customers dropped significantly, positively impacting overall revenue.' – ein Satz mit vier zentralen Fachbegriffen im Kontext."},
        {t:"Präsentationstechniken auf Englisch",def:"Eine überzeugende englischsprachige Geschäftspräsentation folgt typischerweise einer klaren dreiteiligen Struktur. Der Hook (Einstieg) soll innerhalb der ersten Sekunden Aufmerksamkeit erzeugen, etwa durch eine überraschende Statistik, eine provokante rhetorische Frage oder eine kurze, relevante Anekdote. Der Body (Hauptteil) sollte auf maximal drei bis vier klar abgegrenzte Kernbotschaften begrenzt bleiben, die jeweils durch Daten, Diagramme oder konkrete Beispiele untermauert werden, statt das Publikum mit zu vielen Details zu überfrachten. Der Call-to-Action (Abschluss) formuliert am Ende eine konkrete, umsetzbare Handlungsaufforderung. Auf rhetorischer Ebene helfen Signalwörter zur Gliederung ('firstly... secondly... in conclusion...'), aktive statt passive Sprachkonstruktionen sowie bewusste Pausen zur Betonung wichtiger Punkte. Beim Umgang mit Rückfragen im Anschluss an eine Präsentation ist es eine bewährte Technik, die gestellte Frage zunächst in eigenen Worten zu paraphrasieren ('That's a great question about...'), bevor man antwortet – das verschafft zusätzliche Bedenkzeit und stellt sicher, dass die Frage korrekt verstanden wurde.",ex:"Eine Produktpräsentation beginnt mit: 'Did you know that 70% of online shopping carts are abandoned before checkout?' (Hook), führt durch drei Lösungsansätze (Body) und endet mit: 'That's why we recommend implementing a one-click checkout by Q3.' (Call-to-Action)."},
        {t:"Schriftliche Ausarbeitung (Draft)",def:"Ein Draft bezeichnet im akademischen wie im geschäftlichen Kontext eine bewusst vorläufige, häufig noch unvollständige oder unpolierte Fassung eines Textes, die nicht als Endprodukt gedacht ist, sondern als Zwischenschritt, um frühzeitig strukturelles und inhaltliches Feedback von Dozierenden, Kolleg:innen oder Vorgesetzten einzuholen, bevor unverhältnismäßig viel Zeit in sprachlichen Feinschliff investiert wird, der später ohnehin überarbeitet werden müsste. Üblich ist ein mehrstufiger, iterativer Schreibprozess: Ein first draft enthält meist nur eine grobe Gliederung und die wichtigsten Kernargumente in vorläufiger Formulierung; ein revised draft integriert erhaltenes Feedback und verbessert Struktur sowie Argumentationslogik; der final draft ist schließlich die sprachlich und formal ausgefeilte Abgabeversion. In diesem Prozess bezieht sich Feedback in den frühen Phasen typischerweise auf inhaltliche und strukturelle Aspekte (Ist die Argumentation logisch? Fehlen wichtige Belege?), während sprachliche und grammatikalische Korrekturen bewusst erst in späteren Runden im Fokus stehen, um zu vermeiden, dass Zeit in Formulierungen investiert wird, die inhaltlich ohnehin noch verworfen werden könnten.",ex:"Vor der Abgabe eines Business Case zur Einführung eines neuen Bezahlverfahrens reicht ein Student einen ersten Draft mit Rohgliederung ein; basierend auf dem Feedback ('add more quantitative evidence in section 2') entsteht der überarbeitete, deutlich stärkere finale Draft."},
        {t:"Verhandlungs- & Meeting-Englisch",def:"Souveränes Verhandeln und Moderieren von Meetings auf Englisch erfordert einen Werkzeugkasten an situativ passenden Redewendungen für unterschiedliche Gesprächsphasen. Zustimmung lässt sich abgestuft signalisieren, von einfacher Bestätigung ('That makes sense') bis zu starker Übereinstimmung ('I completely agree with that point'). Höflicher, konstruktiver Widerspruch, der die Geschäftsbeziehung nicht belastet, gelingt über abmildernde Formulierungen wie 'I see your point, but...' oder 'I'm not entirely sure that would work, because...', statt direkt zu widersprechen. Kompromissvorschläge werden typischerweise über vorsichtig formulierte Fragen eingeleitet, etwa 'Could we consider a middle ground here?' oder 'What if we met halfway on the pricing?'. Die professionelle Moderation eines Meetings umfasst das Eröffnen mit einer klaren Agenda ('Today we'll cover three points...'), das aktive Steuern und ausgewogene Verteilen von Redebeiträgen sowie das Zusammenfassen am Ende zur Sicherstellung eines gemeinsamen Verständnisses ('To summarize what we've discussed today...'). Wichtig ist zudem ein Bewusstsein für interkulturelle Unterschiede: Verhandlungspartner aus unterschiedlichen Kulturkreisen unterscheiden sich teils erheblich in ihrer bevorzugten Direktheit, ihrem Verhandlungstempo und ihrer Erwartungshaltung an Small Talk vor dem eigentlichen Geschäftlichen.",ex:"In einer Preisverhandlung mit einem britischen Lieferanten reagiert der Einkäufer diplomatisch: 'I understand your position, but our budget is quite tight this quarter. Could we possibly agree on a 5% discount for orders above 10,000 units?' – ein höflicher Kompromissvorschlag statt Konfrontation."},
      ],
      quiz:[{q:"Was bedeutet 'stakeholder' im Business-Englisch?",options:["Nur Aktionäre","Alle Interessengruppen eines Unternehmens","Ein Firmensitz","Ein Vertragstyp"],correct:1,explain:"Stakeholder = alle Personen/Gruppen mit Interesse am Unternehmen."},{q:"Welches Wort passt zu 'supply chain'?",options:["Lieferkette","Aktienkurs","Personalabteilung","Marketingstrategie"],correct:0,explain:"'Supply chain' ist der englische Begriff für Lieferkette."}],
      cards:[{front:"Stakeholder",back:"Person or group with an interest in a company's activities and outcomes."},{front:"Revenue",back:"Total income generated by a business before expenses (Umsatz)."},{front:"Supply Chain",back:"Lieferkette – the network involved in producing and delivering a product."},{front:"Draft",back:"A preliminary written version of a document before final submission."}]},

  ]},
  {nr:2,title:"Datenbanken, Marketing, Mathematik & Recht",ects:30,modules:[
    {id:"s2-dat",code:"DAT",name:"Datenbanken",ects:6,sws:"5",exam:"Klausur 90 Min. · 100% + Praktikum (Pflicht, unbenotet)",desc:"Grundlagen relationaler Datenbanken, praktische Arbeit mit MySQL und SQL.",
      topics:[
        {t:"ER-Modell & Datenmodellierung",def:"Das Entity-Relationship-Modell (ERM) ist die zentrale konzeptionelle Methode zur Modellierung von Datenstrukturen, bevor eine Datenbank technisch umgesetzt wird. Es bildet reale Objekte der Anwendungswelt als Entitäten ab (z.B. Kunde, Produkt, Bestellung), die durch Attribute näher beschrieben werden (Kunde hat Name, E-Mail, Adresse), und modelliert die Beziehungen zwischen diesen Entitäten. Jede Beziehung erhält eine Kardinalität: 1:1 (eine Entität entspricht genau einer anderen), 1:n (eine Entität kann mit vielen anderen verbunden sein, aber nicht umgekehrt) oder n:m (beide Seiten mehrfach verknüpft, was in der relationalen Umsetzung eine eigene Zwischentabelle erfordert). Aus dem fertigen ER-Diagramm lassen sich systematisch relationale Tabellen mit Primär- und Fremdschlüsseln ableiten – das ERM ist die Brücke zwischen fachlicher Anforderung und technischem Datenbankschema.",ex:"Ein Online-Shop-ERM zeigt: Kunde tätigt Bestellung (1:n, ein Kunde kann viele Bestellungen haben, eine Bestellung gehört zu genau einem Kunden), während Bestellung enthält Produkt eine n:m-Beziehung ist (eine Bestellung enthält mehrere Produkte, ein Produkt taucht in mehreren Bestellungen auf) und daher in eine Zwischentabelle Bestellposition aufgelöst wird."},
        {t:"Relationale Algebra",def:"Die relationale Algebra ist die formale mathematische Grundlage, auf der SQL-Abfragen aufbauen, und definiert eine Menge von Operationen, die aus einer oder mehreren Tabellen (Relationen) neue Tabellen erzeugen. Die Selektion (σ) filtert Zeilen einer Tabelle anhand einer Bedingung heraus, ohne Spalten zu verändern. Die Projektion (π) wählt dagegen bestimmte Spalten aus und blendet andere aus. Der Verbund (Join) verknüpft zwei Tabellen anhand gemeinsamer Attribute (meist Primär-/Fremdschlüssel) zu einer neuen, breiteren Tabelle. Weitere Operationen sind Vereinigung, Differenz und das kartesische Produkt. Jede SQL-Abfrage lässt sich gedanklich in eine Abfolge solcher elementarer Operationen zerlegen, was beim Verständnis und bei der Optimierung komplexer Abfragen hilft.",ex:"Um den Umsatz aller Bestellungen über 100 € pro Kunde zu ermitteln, filtert man zunächst mit einer Selektion die Bestellungen (Betrag > 100), führt dann einen Join mit der Kundentabelle über die Kunden-ID durch und projiziert abschließend nur die Spalten Kundenname und Betrag."},
        {t:"SQL: SELECT, JOIN, Aggregation",def:"SQL (Structured Query Language) ist die Standardsprache zur Abfrage und Bearbeitung relationaler Datenbanken. Die SELECT-Anweisung liest Daten aus einer oder mehreren Tabellen aus und kann über eine WHERE-Klausel gefiltert werden. JOIN-Operationen verknüpfen mehrere Tabellen über gemeinsame Schlüsselspalten: Der INNER JOIN liefert nur Zeilen, die in beiden Tabellen eine Entsprechung haben, während ein LEFT JOIN zusätzlich alle Zeilen der linken Tabelle behält, auch wenn keine Entsprechung existiert. Aggregatfunktionen wie SUM (Summe), COUNT (Anzahl), AVG (Durchschnitt), MIN und MAX fassen mehrere Zeilen zu einem einzigen Kennwert zusammen und werden häufig zusammen mit GROUP BY verwendet, das die Ergebnismenge zunächst in Gruppen (z.B. je Kunde) aufteilt, bevor die Aggregation pro Gruppe berechnet wird. HAVING filtert anschließend die bereits aggregierten Gruppen, während WHERE die Zeilen vor der Aggregation filtert.",ex:"SELECT kunde.name, SUM(betrag) AS umsatz FROM bestellung JOIN kunde ON bestellung.kunden_id = kunde.id GROUP BY kunde.name HAVING SUM(betrag) > 500 berechnet den Gesamtumsatz je Kunde und zeigt nur Kunden mit über 500 € Umsatz."},
        {t:"Normalisierung (1.–3. NF)",def:"Die Normalisierung ist ein systematisches Verfahren zur Strukturierung relationaler Datenbanken, das Datenredundanz reduziert und Anomalien bei Einfüge-, Änderungs- und Löschvorgängen vermeidet. Die erste Normalform (1. NF) fordert, dass jede Tabellenspalte nur atomare, nicht weiter zerlegbare Werte enthält (keine Listen oder Mehrfachwerte in einer Zelle). Die zweite Normalform (2. NF) baut darauf auf und fordert zusätzlich, dass jedes Nicht-Schlüsselattribut vollständig vom gesamten Primärschlüssel abhängt, nicht nur von einem Teil davon (relevant bei zusammengesetzten Schlüsseln). Die dritte Normalform (3. NF) fordert darüber hinaus, dass kein Nicht-Schlüsselattribut transitiv von einem anderen Nicht-Schlüsselattribut abhängt, sondern ausschließlich direkt vom Primärschlüssel. In der Praxis wird oft bewusst von der strengen Normalisierung abgewichen (Denormalisierung), um Abfragen zu beschleunigen, wenn Lesegeschwindigkeit wichtiger ist als minimale Redundanz.",ex:"Würde man die Kundenadresse in jeder einzelnen Bestellzeile wiederholen, verstieße das gegen die Normalisierung: Ändert sich die Adresse, müssten alle Zeilen aktualisiert werden. Stattdessen wird die Adresse einmalig in einer eigenen Kundentabelle gespeichert, und die Bestelltabelle verweist nur über die Kunden-ID (Fremdschlüssel) darauf."},
        {t:"Einblick in NoSQL-Datenbanken",def:"NoSQL-Datenbanken ('Not only SQL') verzichten bewusst auf das starre, im Voraus festgelegte Tabellenschema relationaler Datenbanken und bieten stattdessen flexible Datenmodelle, die sich für große, heterogene oder schnell wachsende Datenmengen eignen. Man unterscheidet mehrere Kategorien: Dokumentbasierte Datenbanken (z.B. MongoDB) speichern Datensätze als flexible, JSON-ähnliche Dokumente, bei denen unterschiedliche Datensätze unterschiedliche Felder haben können. Key-Value-Stores (z.B. Redis) speichern einfache Schlüssel-Wert-Paare mit sehr hoher Lese-/Schreibgeschwindigkeit, oft für Caching. Spaltenorientierte Datenbanken (z.B. Cassandra) eignen sich für sehr große Datenmengen mit hohem Schreibdurchsatz. Graphdatenbanken (z.B. Neo4j) modellieren explizit Beziehungen zwischen Datenpunkten und eignen sich für stark vernetzte Daten wie soziale Netzwerke oder Empfehlungssysteme. Der Kompromiss gegenüber relationalen Datenbanken liegt meist in geringerer Konsistenzgarantie zugunsten höherer Skalierbarkeit und Flexibilität (CAP-Theorem).",ex:"Ein Produktkatalog eines Marktplatzes, bei dem Elektronikartikel völlig andere Attribute (Akkulaufzeit, Prozessor) haben als Kleidung (Größe, Material), passt schlecht in ein starres relationales Schema mit festen Spalten, aber sehr gut in eine dokumentbasierte NoSQL-Datenbank wie MongoDB, bei der jedes Produktdokument nur die für es relevanten Felder enthält."},
      ],
      quiz:[{q:"Was beschreibt das ER-Modell?",options:["Entitäten und ihre Beziehungen","Nur Tabellenformate","Ein Programmiersprachen-Standard","Ein Backup-Verfahren"],correct:0,explain:"Entity-Relationship-Modell zeigt Entitäten und ihre Beziehungen zueinander."},{q:"Welcher SQL-Befehl liest Daten aus?",options:["INSERT","UPDATE","DELETE","SELECT"],correct:3,explain:"SELECT liest (liefert) Daten aus einer oder mehreren Tabellen."},{q:"Wozu dient die Normalisierung?",options:["Datenredundanz vermeiden","Tabellen verschlüsseln","Server beschleunigen","Backups erstellen"],correct:0,explain:"Normalisierung reduziert Redundanz und verbessert Datenintegrität."}],
      cards:[{front:"Primärschlüssel",back:"Eindeutiger Identifikator einer Tabellenzeile (z.B. Kunden-ID)."},{front:"JOIN",back:"SQL-Operation, die Daten aus mehreren Tabellen anhand einer Beziehung verknüpft."},{front:"Normalisierung",back:"Prozess zur Reduktion von Datenredundanz durch Aufteilung in mehrere Tabellen."},{front:"NoSQL",back:"Nicht-relationale Datenbanken (z.B. dokumentbasiert) für flexible, große Datenmengen."},{front:"Fremdschlüssel",back:"Attribut, das auf den Primärschlüssel einer anderen Tabelle verweist."}]},

    {id:"s2-mkt",code:"M EC",name:"Marketing",ects:6,sws:"4",exam:"Test 90 Min. · 50% + Gruppenprojekt (Entwurf, 5 S.) · 50%",desc:"Einführung in die Instrumente des Marketing – Marketing-Mix im E-Commerce-Kontext.",
      topics:[
        {t:"Marketing-Mix: Product, Price, Place, Promotion",def:"Der klassische Marketing-Mix nach E. Jerome McCarthy fasst die vier zentralen, vom Unternehmen aktiv gestaltbaren Marketinginstrumente zusammen ('4 Ps'). Die Produktpolitik (Product) umfasst alle Entscheidungen rund um das Leistungsangebot: Sortiment, Qualität, Design, Markierung, Verpackung und Zusatzleistungen wie Garantie oder Kundenservice. Die Preispolitik (Price) legt Preisniveau, Rabatt- und Zahlungskonditionen fest und beeinflusst direkt Umsatz und Positionierung. Die Distributionspolitik (Place) betrifft die Wahl der Vertriebswege und -kanäle, über die ein Produkt den Kunden erreicht (z.B. eigener Online-Shop, Marktplätze, stationärer Handel). Die Kommunikationspolitik (Promotion) umfasst alle Maßnahmen, mit denen ein Unternehmen sein Angebot bekannt macht und Kaufanreize schafft, etwa Werbung, Öffentlichkeitsarbeit, Verkaufsförderung und Social-Media-Marketing. Im digitalen Kontext wird der Mix oft um weitere Ps erweitert (z.B. People, Process, Physical Evidence bei Dienstleistungen).",ex:"Ein neu gestarteter Online-Sportshop trifft Marketing-Mix-Entscheidungen auf allen vier Ebenen gleichzeitig: Er wählt ein auf Laufsport spezialisiertes Sortiment (Product), positioniert sich preislich im mittleren Segment mit gelegentlichen Rabattaktionen (Price), verkauft ausschließlich über einen eigenen Online-Shop plus Amazon-Marktplatz (Place) und bewirbt sich über Instagram-Kooperationen mit Laufinfluencern (Promotion)."},
        {t:"Zielgruppenanalyse & Segmentierung",def:"Die Marktsegmentierung teilt einen heterogenen Gesamtmarkt in intern möglichst homogene, untereinander aber klar abgrenzbare Kundengruppen (Segmente) ein, um diese gezielter mit passenden Angeboten und Botschaften anzusprechen als mit einer undifferenzierten Massenansprache. Man unterscheidet mehrere Segmentierungskriterien: demografische Kriterien (Alter, Geschlecht, Einkommen, Bildung), geografische Kriterien (Region, Stadt/Land), psychografische Kriterien (Werte, Lebensstil, Persönlichkeit) und verhaltensbezogene Kriterien (Kaufhäufigkeit, Markentreue, Preissensibilität, Nutzungsintensität). Eine gute Segmentierung erfüllt mehrere Anforderungen: Die Segmente müssen messbar (erfassbare Daten verfügbar), erreichbar (über gezielte Kanäle ansprechbar), wirtschaftlich groß genug (Substanz) und in ihrem Kaufverhalten tatsächlich unterschiedlich (Differenzierbarkeit) sein. Auf Basis der Segmentierung folgt im Marketing-Prozess das Targeting (Auswahl der zu bearbeitenden Segmente) und die Positionierung (wie sich das Angebot im Kopf der Zielgruppe von der Konkurrenz abheben soll).",ex:"Ein Sportartikelhändler segmentiert seinen Markt nach Nutzungsintensität in Gelegenheitssportler (kaufen selten, preissensibel, einfache Grundausstattung) und Leistungssportler (kaufen häufiger, weniger preissensibel, legen Wert auf Spitzentechnologie) und entwickelt für beide Segmente unterschiedliche Produktlinien, Preispunkte und Werbebotschaften."},
        {t:"Markenführung (Branding)",def:"Markenführung (Branding) umfasst alle strategischen und operativen Maßnahmen, mit denen ein Unternehmen ein konsistentes, unverwechselbares Markenbild in den Köpfen seiner Zielgruppe aufbaut und pflegt. Zentrale Bausteine sind die Markenidentität (wofür die Marke intern stehen soll: Werte, Mission, Persönlichkeit), das Markenimage (wie die Marke tatsächlich von außen wahrgenommen wird – idealerweise deckt sich dies mit der Identität) sowie die Markenbekanntheit (wie viele Personen der Zielgruppe die Marke überhaupt kennen und mit welchen Assoziationen). Eine starke Marke schafft Vertrauen, reduziert das wahrgenommene Kaufrisiko, ermöglicht höhere Preisspielräume (Markenpremium) und fördert Kundenloyalität über wiederholte Käufe hinweg. Konsistenz ist dabei entscheidend: Visuelle Elemente (Logo, Farben, Typografie), Tonalität der Kommunikation und das Kundenerlebnis sollten über alle Berührungspunkte (Website, App, Verpackung, Kundenservice, Social Media) hinweg einheitlich gestaltet sein, um Wiedererkennung zu erzeugen.",ex:"Zalando setzt über Website, App, Werbeanzeigen und Verpackung konsequent denselben orangefarbenen Markenauftritt sowie einen einheitlichen, jugendlich-lockeren Kommunikationsstil ein – diese Konsistenz über alle Touchpoints hinweg stärkt die Wiedererkennung und das Vertrauen der Kunden in die Marke."},
        {t:"Preispolitik & Preisstrategien",def:"Die Preispolitik legt fest, zu welchem Preis und unter welchen Konditionen (Rabatte, Zahlungsziele, Finanzierungsangebote) ein Produkt angeboten wird, und ist eines der am direktesten gewinnwirksamen Marketinginstrumente. Bei der Markteinführung neuer Produkte stehen zwei gegensätzliche Grundstrategien zur Wahl: Die Skimming-Strategie (Abschöpfungsstrategie) setzt zunächst einen hohen Einführungspreis an, um zahlungsbereite Frühkäufer (Innovatoren) abzuschöpfen, und senkt den Preis anschließend schrittweise, um sukzessive preissensiblere Kundensegmente zu erschließen – geeignet bei hoher Produktdifferenzierung und geringer anfänglicher Konkurrenz. Die Penetrationsstrategie (Durchdringungsstrategie) setzt dagegen von Beginn an einen niedrigen Preis an, um schnell hohe Marktanteile und Skaleneffekte zu erzielen, bevor Wettbewerber reagieren können – geeignet bei hoher Preiselastizität und dem Ziel schneller Marktdurchdringung. Daneben existieren weitere Preisstrategien wie die dynamische Preisbildung (Preise ändern sich in Echtzeit nach Nachfrage, Wettbewerb oder Lagerbestand) und psychologische Preissetzung (z.B. 9,99 € statt 10 €).",ex:"Ein neues Smartphone-Modell wird zum Marktstart bewusst teuer positioniert, um technikaffine Frühkäufer mit hoher Zahlungsbereitschaft abzuschöpfen (Skimming), und wird einige Monate später schrittweise günstiger, sobald Konkurrenzmodelle erscheinen und die breitere Masse angesprochen werden soll."},
      ],
      quiz:[{q:"Welche 4 Elemente umfasst der klassische Marketing-Mix?",options:["Product, Price, Place, Promotion","Plan, Price, People, Product","Product, Profit, Place, Person","Price, Promotion, Profit, Plan"],correct:0,explain:"Die 4 Ps: Product, Price, Place, Promotion."},{q:"Was ist Preisskimming?",options:["Niedrigpreis-Einstieg","Hochpreis-Einstieg, der sinkt","Preise nie ändern","Nur Rabattaktionen"],correct:1,explain:"Skimming = hoher Einstiegspreis, der über Zeit gesenkt wird."}],
      cards:[{front:"Marketing-Mix (4P)",back:"Product, Price, Place, Promotion – die vier klassischen Marketinginstrumente."},{front:"Preisskimming",back:"Hoher Einführungspreis, der schrittweise gesenkt wird, um verschiedene Käufersegmente abzuschöpfen."},{front:"Penetrationsstrategie",back:"Niedriger Einführungspreis zur schnellen Marktdurchdringung."},{front:"Zielgruppensegmentierung",back:"Aufteilung des Marktes in homogene Kundengruppen nach Merkmalen."}]},

    {id:"s2-mat",code:"MAT 1",name:"Mathematik 1 (Ingenieurmathematik)",ects:6,sws:"6",exam:"Klausur 120 Min. · 100%",desc:"Mathematisches Grundwissen: Funktionen, Vektorrechnung, Folgen, Differential- und Integralrechnung, komplexe Zahlen.",
      topics:[
        {t:"Logik, Mengen & Funktionen",def:"Die Aussagenlogik untersucht die Verknüpfung von Aussagen (die entweder wahr oder falsch sind) über Operatoren wie UND, ODER und NICHT und bildet die formale Grundlage vieler mathematischer Beweise. Die Mengenlehre beschreibt Zusammenfassungen von Objekten (Mengen) und definiert Operationen zwischen ihnen: die Vereinigung (alle Elemente, die in mindestens einer Menge vorkommen), der Durchschnitt (alle Elemente, die in beiden Mengen vorkommen) und die Differenz (Elemente einer Menge, die nicht in der anderen vorkommen). Der Funktionsbegriff beschreibt eine eindeutige Zuordnungsvorschrift, die jedem Element einer Definitionsmenge (den x-Werten) genau ein Element einer Zielmenge (den y-Werten) zuordnet. Wichtige Funktionseigenschaften sind Definitionsbereich (erlaubte Eingabewerte), Wertebereich (mögliche Ausgabewerte), Monotonie (steigend/fallend) sowie Nullstellen (x-Werte, an denen die Funktion den Wert 0 annimmt).",ex:"Die lineare Funktion f(x) = 2x + 3 ordnet jedem x-Wert eindeutig einen y-Wert zu (z.B. f(5) = 13) und lässt sich als Kostenfunktion interpretieren, bei der 3 die Fixkosten und 2 die variablen Kosten pro Einheit darstellen."},
        {t:"Vektor- & Matrizenrechnung",def:"Ein Vektor ist ein mathematisches Objekt, das im Gegensatz zu einer einzelnen Zahl (Skalar) sowohl einen Betrag (Länge) als auch eine Richtung besitzt und üblicherweise als geordnetes Zahlentupel dargestellt wird. Vektoren lassen sich addieren, subtrahieren und mit einem Skalar multiplizieren; das Skalarprodukt zweier Vektoren liefert eine einzelne Zahl und wird u.a. zur Berechnung von Winkeln zwischen Vektoren verwendet. Eine Matrix ist ein rechteckiges Schema von Zahlen, angeordnet in Zeilen und Spalten, und dient insbesondere zur kompakten Darstellung und Lösung linearer Gleichungssysteme: Ein System mehrerer linearer Gleichungen mit mehreren Unbekannten lässt sich als Matrix-Vektor-Gleichung schreiben und mit Verfahren wie dem Gauß-Algorithmus systematisch lösen. Matrizen lassen sich addieren, mit einem Skalar multiplizieren und unter bestimmten Bedingungen miteinander multiplizieren (Matrizenmultiplikation), was in der Praxis z.B. bei linearen Transformationen oder in der Datenanalyse verwendet wird.",ex:"Eine 3×4-Matrix bildet die Lagerbestände von drei Produkten an vier verschiedenen Lagerstandorten ab; durch Matrizenmultiplikation mit einem Preisvektor lässt sich in einem Rechenschritt der Gesamtwert des Lagerbestands je Standort berechnen."},
        {t:"Folgen & Reihen",def:"Eine Zahlenfolge ist eine geordnete, abzählbare Liste von Zahlen, deren einzelne Glieder nach einer festen mathematischen Vorschrift gebildet werden – etwa einer expliziten Formel (die jedes Glied direkt aus seiner Position berechnet) oder einer rekursiven Vorschrift (die jedes Glied aus dem vorherigen berechnet). Bei einer arithmetischen Folge ist die Differenz zwischen aufeinanderfolgenden Gliedern konstant (lineares Wachstum), bei einer geometrischen Folge ist dagegen der Quotient zwischen aufeinanderfolgenden Gliedern konstant (exponentielles Wachstum bzw. exponentieller Zerfall). Eine Reihe ist die fortlaufende Summe der Glieder einer Folge; man unterscheidet endliche Reihen (Partialsummen) von unendlichen Reihen, die unter bestimmten Bedingungen gegen einen endlichen Grenzwert konvergieren können, obwohl unendlich viele Glieder addiert werden.",ex:"Ein Startup rechnet mit monatlich 8% Umsatzwachstum – eine geometrische Folge mit dem Quotienten 1,08. Nach 12 Monaten hat sich der Umsatz dadurch nicht linear, sondern um den Faktor 1,08 hoch 12 (rund das 2,5-fache) erhöht, was die Dynamik exponentiellen Wachstums verdeutlicht."},
        {t:"Differentialrechnung",def:"Die Differentialrechnung berechnet Ableitungen von Funktionen und beantwortet damit die Frage, wie stark sich der Funktionswert bei einer minimalen Änderung des Eingabewerts verändert – geometrisch entspricht die Ableitung an einer Stelle der Steigung der Tangente an den Funktionsgraphen an genau diesem Punkt. Wichtige Ableitungsregeln sind die Potenzregel (die Ableitung von xⁿ ist n·xⁿ⁻¹), die Summenregel, die Produktregel und die Kettenregel für verschachtelte Funktionen. Ökonomisch lässt sich die erste Ableitung einer Funktion oft als Grenzrate interpretieren: Die Ableitung einer Kostenfunktion liefert die Grenzkosten (die zusätzlichen Kosten für genau eine weitere produzierte Einheit), die Ableitung einer Erlösfunktion die Grenzerlöse. Die zweite Ableitung gibt zusätzlich Aufschluss über die Krümmung des Graphen und wird u.a. genutzt, um Maxima und Minima einer Funktion (z.B. den gewinnmaximalen Preis) zu identifizieren und zu klassifizieren.",ex:"Eine Kostenfunktion K(x) = 0,5x² + 20x + 500 hat die Ableitung K'(x) = x + 20. Bei einer bereits produzierten Menge von x=100 Einheiten betragen die Grenzkosten für die 101. Einheit also rund 120 € – deutlich mehr als die durchschnittlichen Stückkosten, weil die Produktion in diesem Bereich überproportional teurer wird."},
        {t:"Integralrechnung & komplexe Zahlen",def:"Die Integralrechnung ist die Umkehroperation der Differentialrechnung: Während die Ableitung die Steigung einer Funktion an einem Punkt liefert, berechnet das bestimmte Integral die Fläche zwischen dem Funktionsgraphen und der x-Achse über einem festgelegten Intervall – dies lässt sich ökonomisch etwa nutzen, um aus einer Grenzkostenfunktion die gesamten (kumulierten) Kosten über eine Produktionsmenge hinweg zu berechnen. Das unbestimmte Integral (die Stammfunktion) liefert dagegen eine ganze Funktionsfamilie, deren Ableitung wieder die ursprüngliche Funktion ergibt. Komplexe Zahlen erweitern den reellen Zahlenraum um die imaginäre Einheit i, definiert als Wurzel aus -1 (eine im Reellen unlösbare Gleichung), und werden in der Form a + bi geschrieben, wobei a der Realteil und b der Imaginärteil ist. Komplexe Zahlen ermöglichen es, Gleichungen zu lösen, die im Reellen keine Lösung haben (z.B. x² = -1), und finden Anwendung u.a. in der Elektrotechnik und Signalverarbeitung.",ex:"Integriert man die Grenzkostenfunktion K'(x) = x + 20 über das Intervall von 0 bis 100, erhält man die gesamten Produktionskosten für 100 Einheiten: das Integral ergibt [0,5x² + 20x] von 0 bis 100 = 5.000 + 2.000 = 7.000 €."},
      ],
      quiz:[{q:"Was ist die Ableitung von x²?",options:["x","2x","x²","2"],correct:1,explain:"Die Potenzregel: d/dx(xⁿ) = n·xⁿ⁻¹, also d/dx(x²) = 2x."},{q:"Was beschreibt eine Matrix?",options:["Eine einzelne Zahl","Ein rechteckiges Zahlenschema","Nur Dezimalzahlen","Eine Funktion 3. Grades"],correct:1,explain:"Eine Matrix ist ein rechteckiges Schema von Zahlen in Zeilen und Spalten."},{q:"Was ist die imaginäre Einheit i?",options:["√-1","√1","0","∞"],correct:0,explain:"i ist definiert als Wurzel aus -1, Basis komplexer Zahlen."}],
      cards:[{front:"Differentialrechnung",back:"Berechnung von Ableitungen – beschreibt die Änderungsrate/Steigung einer Funktion."},{front:"Integralrechnung",back:"Berechnung von Flächen unter Kurven / Umkehrung der Ableitung."},{front:"Vektor",back:"Mathematisches Objekt mit Richtung und Betrag, dargestellt als geordnetes Zahlentupel."},{front:"Komplexe Zahl",back:"Zahl der Form a+bi, bestehend aus Realteil a und Imaginärteil b."},{front:"Folge",back:"Geordnete, abzählbare Liste von Zahlen nach einer bestimmten Vorschrift."}]},

    {id:"s2-pme",code:"PME",name:"Prozessmanagement im E-Commerce",ects:6,sws:"4",exam:"Schriftliche Ausarbeitung (5 S.) · 100%",desc:"Einführung in das Prozessmanagement mit Vertiefung im E-Commerce-Kontext.",
      topics:[
        {t:"Prozessmodellierung (BPMN Grundlagen)",def:"BPMN (Business Process Model and Notation) ist ein international standardisierter, grafischer Notationsstandard zur eindeutigen und für alle Beteiligten verständlichen Darstellung von Geschäftsprozessen. Zentrale Elemente sind Start- und Endereignisse (kreisförmige Symbole, die den Beginn und das Ende eines Prozesses markieren), Aktivitäten bzw. Aufgaben (rechteckige Symbole für einzelne Arbeitsschritte), Gateways bzw. Entscheidungspunkte (rautenförmige Symbole, an denen sich der Prozessfluss abhängig von einer Bedingung verzweigt oder wieder zusammenführt) sowie Sequenzflüsse (Pfeile, die die Reihenfolge der Schritte festlegen). Zusätzlich lassen sich in BPMN sogenannte Swimlanes (Bahnen) verwenden, um zu visualisieren, welche Rolle oder Abteilung für welchen Prozessschritt verantwortlich ist. Der große Vorteil von BPMN liegt darin, dass sowohl Fachabteilungen als auch IT-Entwickler dieselbe, eindeutige Notation verstehen und darauf aufbauend Prozesse analysieren, optimieren oder sogar automatisiert in Workflow-Systemen ausführen können.",ex:"Der Bestellprozess eines Online-Shops wird als BPMN-Diagramm mit den Schritten Warenkorb befüllen → Kasse (Gateway: Zahlungsart wählen) → Zahlung verarbeiten → Lager benachrichtigt (Aktivität) → Versand → Bestätigungs-E-Mail (Endereignis) modelliert, wobei separate Swimlanes für Kunde, Zahlungsdienstleister und Lager die jeweiligen Zuständigkeiten sichtbar machen."},
        {t:"Ist- vs. Soll-Prozesse",def:"Die Unterscheidung zwischen Ist- und Soll-Prozessen ist ein zentrales methodisches Werkzeug des Prozessmanagements. Der Ist-Prozess (auch Ist-Zustand) beschreibt möglichst objektiv und detailliert, wie ein Arbeitsablauf tatsächlich in der Praxis abläuft – inklusive aller Umwege, Sonderfälle, manueller Zwischenschritte und Medienbrüche, die sich oft im Laufe der Zeit unbemerkt eingeschlichen haben. Die Ist-Aufnahme erfolgt typischerweise durch Interviews mit den beteiligten Mitarbeitenden, direkte Beobachtung oder die Auswertung von Systemprotokollen. Der Soll-Prozess (Ziel- oder Referenzprozess) beschreibt demgegenüber, wie der Ablauf nach einer geplanten Verbesserung idealerweise aussehen soll – meist mit dem Ziel, Schritte zu eliminieren, zu vereinfachen oder zu automatisieren. Die systematische Gegenüberstellung (Ist-Soll-Vergleich, auch Gap-Analyse genannt) macht sichtbar, an welchen konkreten Stellen sich Schwachstellen befinden und liefert die Grundlage für einen priorisierten Maßnahmenplan zur Prozessverbesserung.",ex:"Ist-Prozess: Ein Kunde schickt eine Retoure per E-Mail an den Kundenservice, ein Mitarbeiter prüft den Fall manuell und veranlasst die Rückerstattung oft erst nach mehreren Tagen. Soll-Prozess: Der Kunde meldet die Retoure selbst über ein automatisiertes Online-Portal an, erhält sofort ein Rücksendeetikett, und die Rückerstattung wird automatisch ausgelöst, sobald die Retoure im Lager gescannt wird – der manuelle Prüfschritt entfällt fast vollständig."},
        {t:"Prozessoptimierung im Online-Handel",def:"Prozessoptimierung bezeichnet die systematische, meist datengetriebene Verbesserung bestehender Geschäftsabläufe hinsichtlich Durchlaufzeit, Fehlerquote, Kosten und Kundenerlebnis. Typische Ansatzpunkte sind die Eliminierung überflüssiger oder doppelter Arbeitsschritte, die Automatisierung repetitiver, regelbasierter Tätigkeiten (z.B. durch Software-Bots oder Workflow-Systeme), die Parallelisierung von Prozessschritten, die bislang unnötig nacheinander abliefen, sowie der Abbau von Medienbrüchen, bei denen Informationen manuell von einem System in ein anderes übertragen werden müssen. Im E-Commerce sind besonders die sogenannten Order-to-Cash-Prozesse (vom Bestelleingang bis zum Zahlungseingang) und Procure-to-Pay-Prozesse (von der Beschaffung bis zur Bezahlung von Lieferanten) klassische Optimierungsfelder, weil hier hohe Transaktionsvolumina auf enge Zeit- und Kostenanforderungen treffen. Kennzahlen wie Durchlaufzeit, Fehlerquote pro 1.000 Vorgänge oder Prozesskosten pro Transaktion dienen dazu, den Erfolg von Optimierungsmaßnahmen messbar zu machen.",ex:"Ein Online-Händler automatisiert die bislang manuelle Rechnungsstellung: Statt dass ein Mitarbeiter jede Bestellung händisch prüft und eine Rechnung erstellt, generiert das System die Rechnung automatisch bei Zahlungseingang und verschickt sie sofort per E-Mail – der Order-to-Cash-Prozess verkürzt sich dadurch von mehreren Tagen auf wenige Minuten und die Fehlerquote sinkt spürbar."},
        {t:"Schnittstellen zwischen Abteilungen",def:"Schnittstellen sind die definierten Übergabepunkte, an denen Informationen, Daten oder physische Güter von einer Abteilung, einem System oder einem Prozessschritt an den nächsten übergeben werden. Im E-Commerce-Kontext sind Schnittstellen besonders kritisch zwischen Marketing (das Kaufinteresse generiert), Vertrieb/Shop-System (das Bestellungen entgegennimmt), Logistik/Lager (das die Ware bereitstellt und versendet), Buchhaltung (die Zahlungen verbucht) und Kundenservice (der Rückfragen und Reklamationen bearbeitet). Schlecht definierte Schnittstellen führen häufig zu Informationsverlust, Doppelarbeit oder Verzögerungen, etwa wenn Bestandsänderungen im Lager nicht in Echtzeit an den Online-Shop gemeldet werden und dadurch Artikel verkauft werden, die gar nicht mehr vorrätig sind. Moderne Systemlandschaften lösen dieses Problem zunehmend durch automatisierte, in Echtzeit synchronisierte Schnittstellen (APIs) zwischen den beteiligten Systemen, statt sich auf manuellen Datenaustausch per E-Mail oder Excel-Tabelle zu verlassen.",ex:"Eine automatisierte API-Schnittstelle zwischen dem Warenwirtschaftssystem des Lagers und dem Online-Shop meldet in Echtzeit, sobald ein Artikel ausverkauft ist, sodass der Shop den Artikel sofort als 'nicht verfügbar' kennzeichnet – ohne diese Schnittstelle könnten Kunden Artikel bestellen, die bereits vergriffen sind, was zu Stornierungen und Unzufriedenheit führt."},
      ],
      quiz:[{q:"Wofür steht BPMN?",options:["Business Process Model and Notation","Basic Process Management Network","Business Planning Model Number","Big Process Management Node"],correct:0,explain:"BPMN = Business Process Model and Notation, Standard zur Prozessmodellierung."},{q:"Was ist ein Ist-Prozess?",options:["Der aktuell tatsächlich ablaufende Prozess","Ein zukünftiger Wunschprozess","Ein Prozess, der gelöscht wurde","Ein rein theoretisches Konzept"],correct:0,explain:"Der Ist-Prozess beschreibt, wie ein Ablauf aktuell wirklich funktioniert."}],
      cards:[{front:"Prozessmodellierung",back:"Grafische Darstellung von Arbeitsabläufen, z.B. mit BPMN-Notation."},{front:"Ist-Prozess",back:"Der aktuelle, tatsächlich gelebte Ablauf eines Geschäftsprozesses."},{front:"Soll-Prozess",back:"Der angestrebte, optimierte Zielprozess nach einer Verbesserung."},{front:"Prozessoptimierung",back:"Systematische Verbesserung von Abläufen hinsichtlich Zeit, Kosten und Qualität."}]},

    {id:"s2-law",code:"ECLAW",name:"Rechtliche Grundlagen des E-Commerce",ects:6,sws:"4",exam:"Klausur 90 Min. · 100%",desc:"Rechtliche Basis für den Online-Handel: BGB, HGB, AGB, Urheberrecht, Wettbewerbsrecht, Datenschutz.",
      topics:[
        {t:"BGB & HGB Grundlagen",def:"Das Bürgerliche Gesetzbuch (BGB) ist das zentrale deutsche Zivilgesetzbuch und regelt allgemeine Rechtsgeschäfte zwischen Privatpersonen und Unternehmen, insbesondere das Vertragsrecht: Ein Vertrag kommt durch zwei übereinstimmende Willenserklärungen zustande – ein Angebot und dessen Annahme. Für Kaufverträge regelt das BGB u.a. Pflichten von Verkäufer (mangelfreie Lieferung) und Käufer (Zahlung, Abnahme) sowie Gewährleistungsrechte bei Mängeln (Nacherfüllung, Rücktritt, Minderung, Schadensersatz). Das Handelsgesetzbuch (HGB) ergänzt das BGB um Sonderregeln, die ausschließlich für Kaufleute gelten und den besonderen Anforderungen des Geschäftsverkehrs zwischen Unternehmen Rechnung tragen, etwa strengere Formvorschriften, aber auch mehr Vertragsfreiheit als im Verbraucherschutzrecht, sowie spezielle Regeln zur kaufmännischen Rüge- und Untersuchungspflicht bei Warenlieferungen.",ex:"Ein Online-Kaufvertrag entsteht rechtlich, sobald der Kunde auf 'Jetzt kaufen' klickt (Annahme des im Shop unterbreiteten Angebots) – die reine Produktanzeige im Shop gilt dabei rechtlich meist nur als unverbindliche Aufforderung zur Abgabe eines Angebots (invitatio ad offerendum), das eigentliche Angebot gibt der Kunde mit seiner Bestellung ab, angenommen wird es durch die Bestellbestätigung des Händlers."},
        {t:"AGB-Recht im Online-Shop",def:"Allgemeine Geschäftsbedingungen (AGB) sind vom Verkäufer für eine Vielzahl von Verträgen vorformulierte Vertragsbedingungen, die er seinen Kunden bei Vertragsschluss stellt, um Rechtsverhältnisse einheitlich und effizient zu regeln, statt jeden Vertrag individuell auszuhandeln. Damit AGB wirksam Vertragsbestandteil werden, müssen sie dem Kunden vor Vertragsschluss klar erkennbar zugänglich gemacht werden und er muss zumutbar die Möglichkeit zur Kenntnisnahme haben. Das AGB-Recht (§§ 305 ff. BGB) unterwirft AGB-Klauseln zudem einer strengen Inhaltskontrolle: Überraschende Klauseln werden nicht Vertragsbestandteil, und Klauseln, die den Kunden unangemessen benachteiligen (z.B. unklare oder widersprüchliche Formulierungen, unzulässiger Haftungsausschluss), sind unwirksam – im Zweifel geht eine Unklarheit stets zu Lasten des Verwenders (Unklarheitenregel). Für Online-Shops kommen zusätzlich verbraucherschutzrechtliche Informationspflichten hinzu, die typischerweise über die AGB oder begleitende Rechtstexte erfüllt werden.",ex:"Ein Online-Shop muss in seinen AGB transparent und verständlich über das 14-tägige Widerrufsrecht für Verbraucher, die voraussichtliche Lieferzeit, die akzeptierten Zahlungsarten sowie etwaige Versandkosten informieren – fehlen diese Angaben oder sind sie versteckt/unklar formuliert, drohen Abmahnungen durch Wettbewerber oder Verbraucherschutzverbände."},
        {t:"Urheberrecht & Wettbewerbsrecht",def:"Das Urheberrecht (UrhG) schützt persönliche geistige Schöpfungen wie Texte, Fotos, Grafiken, Musik oder Software vor unerlaubter Vervielfältigung, Verbreitung und öffentlicher Zugänglichmachung durch Dritte – der Schutz entsteht automatisch mit der Schöpfung, ohne dass eine Registrierung nötig ist, und liegt grundsätzlich beim Urheber, sofern keine Nutzungsrechte vertraglich übertragen wurden. Das Wettbewerbsrecht, insbesondere das Gesetz gegen den unlauteren Wettbewerb (UWG), schützt demgegenüber nicht geistiges Eigentum, sondern einen fairen Wettbewerb zwischen Marktteilnehmern und verbietet unlautere Geschäftspraktiken wie irreführende Werbung (unwahre oder zur Täuschung geeignete Angaben über Produkteigenschaften, Preise oder Verfügbarkeit), aggressive Verkaufsmethoden sowie die gezielte Herabsetzung oder Nachahmung von Mitbewerbern. Verstöße gegen beide Rechtsgebiete können sowohl zivilrechtliche Unterlassungs- und Schadensersatzansprüche als auch kostenpflichtige Abmahnungen durch Konkurrenten oder Verbände nach sich ziehen.",ex:"Übernimmt ein Online-Händler unautorisiert die Produktfotos und Beschreibungstexte eines Konkurrenten für sein eigenes Angebot, verletzt er sowohl das Urheberrecht des ursprünglichen Erstellers (unerlaubte Vervielfältigung) als auch das Wettbewerbsrecht, sofern die Kopie geeignet ist, Kunden über die Herkunft oder Eigenständigkeit des Angebots zu täuschen."},
        {t:"TMG (Telemediengesetz)",def:"Das Telemediengesetz (TMG) regelt rechtliche Rahmenbedingungen für Anbieter von Telemedien – also praktisch alle internetbasierten Dienste wie Websites, Online-Shops, Apps und soziale Netzwerke – und legt insbesondere Informations- und Kennzeichnungspflichten fest. Die bekannteste Regelung ist die Impressumspflicht (§ 5 TMG): Geschäftsmäßige Telemedien-Anbieter müssen leicht erkennbar, unmittelbar erreichbar und ständig verfügbar Angaben zu Namen bzw. Firma, Anschrift, Kontaktmöglichkeit (z.B. E-Mail), Handelsregistereintrag und ggf. Umsatzsteuer-ID bereitstellen. Das TMG regelt zudem Haftungsfragen für Diensteanbieter, etwa in welchem Umfang ein Betreiber für von Nutzern eingestellte Inhalte (z.B. Kundenbewertungen, Foreneinträge) haftet, und unterscheidet dabei zwischen eigenen und fremden Informationen sowie zwischen bloßer Durchleitung, Zwischenspeicherung und Hosting von Inhalten.",ex:"Jeder deutsche Online-Shop benötigt ein vollständiges, über einen klar mit 'Impressum' beschrifteten Link von jeder Seite aus in maximal zwei Klicks erreichbares Impressum gemäß § 5 TMG – fehlt es oder ist es unvollständig, drohen kostenpflichtige Abmahnungen durch Mitbewerber oder Verbraucherschutzverbände."},
        {t:"DSGVO, BDSG & TTDSG",def:"Die Datenschutz-Grundverordnung (DSGVO) ist eine EU-weit unmittelbar geltende Verordnung, die den Umgang mit personenbezogenen Daten (allen Informationen, die sich auf eine identifizierte oder identifizierbare Person beziehen) einheitlich regelt und auf zentralen Grundsätzen beruht: Rechtmäßigkeit und Transparenz der Verarbeitung, Zweckbindung (Daten dürfen nur für den ursprünglich festgelegten Zweck genutzt werden), Datenminimierung (nur so viele Daten wie nötig erheben) sowie Betroffenenrechte wie Auskunft, Berichtigung, Löschung ('Recht auf Vergessenwerden') und Datenübertragbarkeit. Das Bundesdatenschutzgesetz (BDSG) ergänzt die DSGVO um nationale Konkretisierungen und Öffnungsklauseln, während das Telekommunikation-Telemedien-Datenschutz-Gesetz (TTDSG) speziell Regeln für elektronische Kommunikationsdienste und den Einsatz von Cookies bzw. vergleichbaren Tracking-Technologien festlegt – insbesondere die Pflicht, vor dem Setzen nicht technisch notwendiger Cookies eine informierte, aktive und freiwillige Einwilligung der Nutzer einzuholen (Opt-in statt Opt-out).",ex:"Ein Online-Shop darf Marketing- und Tracking-Cookies (z.B. für personalisierte Werbung oder Analyse-Tools) erst setzen, nachdem der Nutzer über ein DSGVO- und TTDSG-konformes Cookie-Banner aktiv zugestimmt hat – ein bloßes Weiterscrollen oder ein vorangekreuztes Zustimmungsfeld reicht nach geltender Rechtsprechung nicht als wirksame Einwilligung aus."},
      ],
      quiz:[{q:"Wofür steht DSGVO?",options:["Datenschutz-Grundverordnung","Deutsche Software-Gesetzesordnung","Digitale Sicherheits-Grundverordnung","Daten-Sende-Genehmigungs-Ordnung"],correct:0,explain:"DSGVO = Datenschutz-Grundverordnung, EU-weites Datenschutzrecht."},{q:"Was regelt das TMG?",options:["Steuerrecht","Telemedien / Online-Dienste","Arbeitsrecht","Erbrecht"],correct:1,explain:"Das Telemediengesetz (TMG) regelt rechtliche Pflichten für Online-Anbieter, z.B. Impressum."},{q:"Was sind AGB?",options:["Allgemeine Geschäftsbedingungen","Amtliche Gewerbebescheinigung","Allgemeine Gewinnbeteiligung","Automatisierte Geschäftsbuchung"],correct:0,explain:"AGB = Allgemeine Geschäftsbedingungen, vom Verkäufer vorformulierte Vertragsbedingungen."}],
      cards:[{front:"AGB",back:"Allgemeine Geschäftsbedingungen – vorformulierte Vertragsbedingungen für viele Kunden."},{front:"DSGVO",back:"EU-Datenschutz-Grundverordnung, regelt Umgang mit personenbezogenen Daten."},{front:"TMG",back:"Telemediengesetz – regelt Impressumspflicht & Haftung für Online-Dienste."},{front:"Widerrufsrecht",back:"Recht des Verbrauchers, einen Online-Kauf innerhalb von 14 Tagen zu widerrufen."},{front:"Wettbewerbsrecht (UWG)",back:"Schützt vor unlauteren Geschäftspraktiken wie irreführender Werbung."}]},
  ]},
  {nr:3,title:"Statistik, CRM, Finanzierung & Softwaretechnik",ects:30,modules:[
    {id:"s3-stat",code:"Ang.Stat.",name:"Angewandte Statistik",ects:6,sws:"4",exam:"Klausur 120 Min. · 100%",desc:"Statistische Methoden zur Datenauswertung – Basis für Marktforschung und Data-Analytics.",
      topics:[
        {t:"Deskriptive Statistik (Mittelwert, Median, Streuung)",def:"Die deskriptive Statistik fasst große Datenmengen mit wenigen aussagekräftigen Kennzahlen zusammen, ohne bereits auf eine größere Grundgesamtheit zu schließen. Lagemaße beschreiben, wo sich die 'Mitte' der Daten befindet: Der arithmetische Mittelwert (Durchschnitt) summiert alle Werte und teilt durch ihre Anzahl, ist aber empfindlich gegenüber Ausreißern; der Median ist der mittlere Wert einer der Größe nach sortierten Reihe und robuster gegenüber extremen Einzelwerten; der Modus ist der am häufigsten vorkommende Wert. Streuungsmaße beschreiben dagegen, wie stark die Werte um diese Mitte herum variieren: Die Varianz ist die durchschnittliche quadrierte Abweichung vom Mittelwert, die Standardabweichung ist die Wurzel daraus und damit in derselben Einheit wie die Ursprungsdaten interpretierbar, und die Spannweite ist die Differenz zwischen größtem und kleinstem Wert. Eine geringe Streuung zeigt homogene, eine hohe Streuung stark variierende Daten an.",ex:"Der durchschnittliche Warenkorbwert eines Shops liegt bei 65 € (Mittelwert), doch weil einige wenige Großbestellungen von über 500 € den Durchschnitt nach oben verzerren, liegt der Median – der tatsächlich 'typische' Warenkorb – nur bei 42 €, was bei der Interpretation der Kennzahl entscheidend ist."},
        {t:"Wahrscheinlichkeitsrechnung",def:"Die Wahrscheinlichkeitsrechnung quantifiziert die Chance, dass ein bestimmtes zufälliges Ereignis eintritt, als Zahl zwischen 0 (unmöglich) und 1 (sicher). Grundlegende Konzepte sind der Ereignisraum (die Menge aller möglichen Ausgänge eines Zufallsexperiments), die Additionsregel (die Wahrscheinlichkeit, dass eines von mehreren sich ausschließenden Ereignissen eintritt, ist die Summe ihrer Einzelwahrscheinlichkeiten) und die Multiplikationsregel (die Wahrscheinlichkeit, dass zwei unabhängige Ereignisse beide eintreten, ist das Produkt ihrer Einzelwahrscheinlichkeiten). Die bedingte Wahrscheinlichkeit beschreibt die Wahrscheinlichkeit eines Ereignisses unter der Voraussetzung, dass ein anderes Ereignis bereits eingetreten ist, und ist die Grundlage des Bayes-Theorems, mit dem sich Wahrscheinlichkeiten unter neuer Information systematisch aktualisieren lassen.",ex:"Aus historischen Daten weiß ein Shop, dass 3% aller Website-Besucher tatsächlich kaufen (unbedingte Kaufwahrscheinlichkeit). Legt ein Besucher jedoch bereits einen Artikel in den Warenkorb, steigt die bedingte Kaufwahrscheinlichkeit auf 35% – dieses Wissen lässt sich nutzen, um Besuchern mit gefülltem Warenkorb gezielt einen Rabatt-Reminder per E-Mail zu senden."},
        {t:"Verteilungen (Normal-, Binomialverteilung)",def:"Eine Wahrscheinlichkeitsverteilung beschreibt, wie sich die Wahrscheinlichkeit über alle möglichen Werte einer Zufallsvariable verteilt. Die Normalverteilung (Gauß-Verteilung) ist die bekannteste stetige Verteilung, symmetrisch glockenförmig um ihren Mittelwert, und beschreibt viele natürliche Phänomene, bei denen sich viele kleine, unabhängige Einflussfaktoren zu einem Gesamtergebnis addieren; sie wird vollständig durch Mittelwert und Standardabweichung charakterisiert, wobei nach der 68-95-99,7-Regel etwa 68% aller Werte innerhalb einer Standardabweichung um den Mittelwert liegen. Die Binomialverteilung ist eine diskrete Verteilung und modelliert die Anzahl der Erfolge bei einer festen Anzahl unabhängiger Ja/Nein-Versuche mit jeweils gleicher Erfolgswahrscheinlichkeit (z.B. wie oft bei 100 Münzwürfen 'Kopf' fällt) und ist die theoretische Grundlage vieler A/B-Test-Auswertungen im E-Commerce, bei denen jeder Website-Besucher entweder konvertiert oder nicht.",ex:"Die Lieferzeiten eines Versandhändlers folgen annähernd einer Normalverteilung mit Mittelwert 3 Tage und Standardabweichung 0,5 Tage – rund 95% aller Lieferungen kommen demnach zwischen 2 und 4 Tagen an, was der Kundenservice nutzt, um realistische Lieferzeitversprechen zu kommunizieren."},
        {t:"Hypothesentests",def:"Ein Hypothesentest ist ein statistisches Verfahren, um zu prüfen, ob ein in einer Stichprobe beobachteter Unterschied oder Effekt tatsächlich in der Grundgesamtheit existiert oder lediglich zufälliger Stichprobenschwankung geschuldet ist. Man formuliert zunächst eine Nullhypothese (meist: 'es gibt keinen Unterschied/Effekt') und eine Alternativhypothese (der zu beweisende Effekt), berechnet aus den Stichprobendaten eine Teststatistik und daraus den p-Wert – die Wahrscheinlichkeit, ein mindestens so extremes Ergebnis rein zufällig zu beobachten, wenn die Nullhypothese tatsächlich zuträfe. Ist der p-Wert kleiner als ein vorab festgelegtes Signifikanzniveau (üblicherweise 5%), wird die Nullhypothese verworfen und der Effekt gilt als statistisch signifikant. Wichtig ist dabei die Unterscheidung zwischen statistischer Signifikanz (der Effekt ist wahrscheinlich real) und praktischer Relevanz (der Effekt ist auch groß genug, um geschäftlich bedeutsam zu sein) sowie das Bewusstsein für mögliche Fehler erster Art (fälschlich signifikant) und zweiter Art (fälschlich nicht signifikant).",ex:"Ein A/B-Test vergleicht die Konversionsraten zweier Checkout-Varianten bei jeweils 5.000 Besuchern. Variante B erzielt 4,2% statt 3,8% Konversion. Ein Hypothesentest ergibt einen p-Wert von 0,03 (unter der 5%-Schwelle) – der Unterschied gilt damit als statistisch signifikant, und der Shop kann die Nullhypothese ('kein Unterschied zwischen den Varianten') mit hoher Sicherheit verwerfen."},
        {t:"Korrelation & Regression",def:"Die Korrelation misst die Stärke und Richtung eines linearen Zusammenhangs zwischen zwei numerischen Variablen über den Korrelationskoeffizienten, der zwischen -1 (perfekter negativer Zusammenhang) über 0 (kein linearer Zusammenhang) bis +1 (perfekter positiver Zusammenhang) reicht. Wichtig ist dabei der Grundsatz 'Korrelation impliziert keine Kausalität': Auch stark korrelierte Variablen müssen nicht ursächlich zusammenhängen, sondern können beide von einer dritten, unbeobachteten Variable beeinflusst werden. Die Regressionsanalyse geht einen Schritt weiter und modelliert eine abhängige Zielvariable als (meist lineare) Funktion einer oder mehrerer unabhängiger Einflussvariablen, um daraus konkrete Vorhersagen abzuleiten – die einfache lineare Regression schätzt dabei eine Gerade, deren Steigung angibt, um wie viele Einheiten sich die Zielvariable im Schnitt ändert, wenn die Einflussvariable um eine Einheit steigt, während die multiple Regression mehrere Einflussfaktoren gleichzeitig berücksichtigt.",ex:"Eine lineare Regression zeigt, dass jeder zusätzlich investierte Euro Werbebudget im Schnitt mit 4,50 € zusätzlichem Wochenumsatz einhergeht (Regressionskoeffizient), mit einem Korrelationskoeffizienten von 0,82 – ein starker positiver Zusammenhang, der jedoch nicht automatisch beweist, dass die Werbung allein ursächlich für den Umsatz verantwortlich ist, da z.B. saisonale Effekte beide Größen gleichzeitig beeinflussen könnten."},
      ],
      quiz:[{q:"Was misst die Standardabweichung?",options:["Den Mittelwert","Die Streuung um den Mittelwert","Die Anzahl der Datenpunkte","Den Median"],correct:1,explain:"Die Standardabweichung zeigt, wie stark Werte um den Mittelwert streuen."},{q:"Was zeigt ein Korrelationskoeffizient von +1?",options:["Keinen Zusammenhang","Perfekten negativen Zusammenhang","Perfekten positiven Zusammenhang","Zufälligen Zusammenhang"],correct:2,explain:"+1 bedeutet perfekten positiven linearen Zusammenhang zwischen zwei Variablen."},{q:"Was ist der Median?",options:["Der häufigste Wert","Der mittlere Wert einer sortierten Reihe","Die Summe aller Werte","Die größte Zahl"],correct:1,explain:"Der Median teilt eine sortierte Datenreihe in zwei gleich große Hälften."}],
      cards:[{front:"Median",back:"Der mittlere Wert einer der Größe nach sortierten Datenreihe."},{front:"Standardabweichung",back:"Maß für die Streuung von Werten um den Mittelwert."},{front:"Normalverteilung",back:"Glockenförmige Verteilung, bei der die meisten Werte um den Mittelwert liegen."},{front:"Korrelation",back:"Statistisches Maß für den linearen Zusammenhang zweier Variablen (-1 bis +1)."},{front:"Hypothesentest",back:"Statistisches Verfahren, um eine Annahme über die Grundgesamtheit zu prüfen."}]},

    {id:"s3-bwl2",code:"BWL II",name:"Bilanz und Erfolgsrechnung",ects:6,sws:"4",exam:"Klausur 60 Min. · 100%",desc:"Vertiefung Rechnungswesen: Bilanzen und Jahresabschluss nach HGB.",
      topics:[
        {t:"Jahresabschluss nach HGB",def:"Der handelsrechtliche Jahresabschluss ist der jährliche Rechenschaftsbericht eines Unternehmens gegenüber Eigentümern, Gläubigern und der Öffentlichkeit und besteht bei Kapitalgesellschaften mindestens aus Bilanz, Gewinn- und Verlustrechnung (GuV) sowie einem erläuternden Anhang; größere Kapitalgesellschaften müssen zusätzlich einen Lagebericht erstellen, der die wirtschaftliche Lage und Risiken einordnet. Der Aufstellungs-, Prüfungs- und Offenlegungsumfang richtet sich nach der handelsrechtlichen Größenklasse des Unternehmens (klein, mittelgroß, groß gemäß § 267 HGB), die anhand von Bilanzsumme, Umsatzerlösen und Mitarbeiterzahl bestimmt wird – größere Gesellschaften unterliegen strengeren Prüfungs- (Wirtschaftsprüfer) und Offenlegungspflichten. Der Jahresabschluss muss dabei den GoB entsprechen und ein den tatsächlichen Verhältnissen entsprechendes Bild der Vermögens-, Finanz- und Ertragslage vermitteln.",ex:"Eine mittelgroße GmbH muss ihren geprüften Jahresabschluss jährlich beim Bundesanzeiger einreichen, wo er für jedermann einsehbar offengelegt wird – dies dient dem Gläubigerschutz, da potenzielle Geschäftspartner sich so vor Vertragsabschluss ein Bild von der finanziellen Stabilität des Unternehmens machen können."},
        {t:"Bilanzierung & Bewertung",def:"Bilanzierungs- und Bewertungsvorschriften legen fest, ob ein Vermögensgegenstand oder eine Schuld überhaupt in der Bilanz angesetzt werden darf (Bilanzierungsfähigkeit) und mit welchem Wert er bewertet wird (Bewertungsmaßstab). Der Grundsatz der Bewertung zu Anschaffungs- oder Herstellungskosten begrenzt den Ansatz nach oben: Vermögensgegenstände dürfen höchstens mit ihren tatsächlichen Anschaffungs- bzw. Herstellungskosten (abzüglich Abschreibungen) bilanziert werden, auch wenn ihr aktueller Marktwert gestiegen ist (Anschaffungswertprinzip). Das Vorsichtsprinzip, eine der zentralen GoB, verlangt zusätzlich, drohende Verluste und Risiken bereits zu berücksichtigen, sobald sie erkennbar sind, während Gewinne erst bei tatsächlicher Realisierung ausgewiesen werden dürfen (Realisationsprinzip) – dies führt beim Umlaufvermögen zum sogenannten strengen Niederstwertprinzip: Ist der aktuelle Marktpreis niedriger als die Anschaffungskosten, muss zum niedrigeren Wert bilanziert werden.",ex:"Ein Warenlager wurde zu Anschaffungskosten von 50.000 € eingekauft. Ist der aktuelle Marktpreis der Ware zum Bilanzstichtag auf 42.000 € gefallen (z.B. wegen Modell-Nachfolgern), muss das Unternehmen nach dem strengen Niederstwertprinzip den niedrigeren Wert von 42.000 € ansetzen und die Differenz als außerplanmäßige Abschreibung verbuchen."},
        {t:"Erfolgsrechnung (GuV) im Detail",def:"Die Gewinn- und Verlustrechnung schlüsselt detailliert auf, wie sich der Jahresüberschuss bzw. -fehlbetrag eines Unternehmens zusammensetzt, indem sie sämtliche Erträge und Aufwendungen einer Periode systematisch gegenüberstellt. Nach dem in Deutschland verbreiteten Gesamtkostenverfahren beginnt die GuV mit den Umsatzerlösen, denen der Reihe nach Materialaufwand (Kosten für Rohstoffe, Waren, bezogene Leistungen), Personalaufwand (Löhne, Gehälter, Sozialabgaben), Abschreibungen und sonstige betriebliche Aufwendungen gegenübergestellt werden, bis das Betriebsergebnis (operatives Ergebnis) erreicht ist. Anschließend werden Finanzerträge und -aufwendungen (Zinsen) sowie außerordentliche und steuerliche Effekte berücksichtigt, um zum finalen Jahresüberschuss zu gelangen. Diese stufenweise Gliederung erlaubt es, gezielt zu analysieren, auf welcher Ebene (operativ, finanziell, außerordentlich) ein Ergebnis maßgeblich beeinflusst wurde.",ex:"Ein Online-Händler analysiert seine GuV und stellt fest, dass die Versandkosten (Teil der sonstigen betrieblichen Aufwendungen) in den letzten zwei Jahren von 8% auf 13% der Umsatzerlöse gestiegen sind und damit einen wesentlichen Teil des Rückgangs im operativen Ergebnis erklären – eine Erkenntnis, die auf Basis der reinen Jahresüberschusszahl allein nicht sichtbar geworden wäre."},
        {t:"Bilanzanalyse & Kennzahlen",def:"Die Bilanzanalyse wertet die im Jahresabschluss veröffentlichten Zahlen mithilfe standardisierter Kennzahlen aus, um die wirtschaftliche Lage eines Unternehmens einzuschätzen und im Zeit- oder Branchenvergleich einzuordnen. Zentrale Kennzahlenkategorien sind: Kapitalstrukturkennzahlen wie die Eigenkapitalquote (Eigenkapital ÷ Bilanzsumme), die die finanzielle Unabhängigkeit von Fremdkapitalgebern zeigt; Liquiditätskennzahlen wie die Liquidität 1., 2. und 3. Grades, die messen, inwieweit kurzfristige Verbindlichkeiten durch liquide Mittel bzw. kurzfristig verwertbares Umlaufvermögen gedeckt sind; Rentabilitätskennzahlen wie die Eigenkapitalrentabilität (Gewinn ÷ eingesetztes Eigenkapital) oder die Umsatzrentabilität (Gewinn ÷ Umsatz); sowie Effizienzkennzahlen wie der Lagerumschlag, der zeigt, wie oft der durchschnittliche Warenbestand innerhalb eines Jahres verkauft und ersetzt wird. Diese Kennzahlen sollten stets im Kontext der Branche und im Zeitverlauf betrachtet werden, da absolute Werte allein wenig aussagekräftig sind.",ex:"Eine Eigenkapitalquote von 40% signalisiert eine solide, wenig fremdkapitalabhängige Finanzierungsstruktur, während ein Wert von nur 10% auf eine hohe Verschuldung und damit ein erhöhtes finanzielles Risiko hindeutet, insbesondere wenn zusätzlich die Liquidität 1. Grades unter 100% liegt und kurzfristige Verbindlichkeiten nicht vollständig durch liquide Mittel gedeckt sind."},
      ],
      quiz:[{q:"Wonach richtet sich der Jahresabschluss in Deutschland primär?",options:["IFRS","HGB","US-GAAP","ISO 9001"],correct:1,explain:"Der handelsrechtliche Jahresabschluss in Deutschland folgt dem HGB."},{q:"Was zeigt die Eigenkapitalquote?",options:["Anteil des Eigenkapitals an der Bilanzsumme","Nur den Gewinn","Die Mitarbeiterzahl","Den Lagerbestand"],correct:0,explain:"Die Eigenkapitalquote = Eigenkapital / Bilanzsumme, zeigt finanzielle Stabilität."}],
      cards:[{front:"Jahresabschluss",back:"Besteht aus Bilanz, GuV und ggf. Anhang – jährlicher Rechenschaftsbericht eines Unternehmens."},{front:"Eigenkapitalquote",back:"Kennzahl: Eigenkapital ÷ Bilanzsumme – zeigt finanzielle Unabhängigkeit."},{front:"Rückstellung",back:"Passivposten für ungewisse zukünftige Verpflichtungen (z.B. Prozessrisiken)."},{front:"Bilanzanalyse",back:"Auswertung von Bilanzkennzahlen zur Beurteilung der wirtschaftlichen Lage."}]},

    {id:"s3-crm",code:"CRM",name:"Customer Relationship Management (CRM) und Web Controlling",ects:6,sws:"5",exam:"Seminararbeit (Gruppe, ca. 6 S./Person) · 100%",desc:"Einführung in CRM im Online-Handel sowie wichtigste Kennzahlen und Instrumente des Web Controllings.",
      topics:[
        {t:"CRM-Grundlagen & Customer Lifecycle",def:"Customer Relationship Management (CRM) bezeichnet die systematische, meist softwaregestützte Steuerung sämtlicher Phasen der Beziehung zwischen einem Unternehmen und seinen Kunden mit dem Ziel, Kundenwert und -zufriedenheit über die gesamte Beziehungsdauer zu maximieren. Der Customer Lifecycle (Kundenlebenszyklus) gliedert diese Beziehung typischerweise in mehrere Phasen: Akquise (Gewinnung neuer Interessenten und Erstkunden), Onboarding (erste Kauferfahrung, Willkommenskommunikation), Bindung/Entwicklung (Ausbau der Beziehung durch Cross- und Upselling, personalisierte Kommunikation), Loyalität (der Kunde wird zum wiederkehrenden Stammkunden und ggf. Markenbotschafter) sowie potenziell Rückgewinnung (Reaktivierung abgewanderter oder inaktiver Kunden). Ein CRM-System speichert dabei alle Kundeninteraktionen (Käufe, Support-Anfragen, Kommunikation) zentral, um jede Phase gezielt und datenbasiert zu steuern statt auf Vermutungen zu basieren.",ex:"Ein Online-Shop sendet automatisiert eine Willkommens-E-Mail mit einem kleinen Rabattcode direkt nach dem ersten Kauf (Onboarding-Phase), verschickt drei Monate später eine personalisierte Empfehlung basierend auf dem bisherigen Kaufverhalten (Bindungsphase) und reaktiviert Kunden, die sechs Monate nicht mehr gekauft haben, mit einer gezielten 'Wir vermissen dich'-Kampagne (Rückgewinnungsphase)."},
        {t:"Kundenbindung & Loyalty-Programme",def:"Kundenbindungsprogramme (Loyalty-Programme) sind strukturierte Anreizsysteme, die wiederkehrendes Kaufverhalten gezielt belohnen und damit die Wechselbereitschaft von Kunden zu Wettbewerbern senken sollen. Gängige Ausgestaltungsformen sind Punktesysteme (Kunden sammeln für jeden Einkauf Punkte, die später gegen Rabatte oder Prämien eingelöst werden können), Stufenprogramme (Tier-Systeme), bei denen Kunden mit steigendem Umsatz höhere Statusstufen mit exklusiveren Vorteilen erreichen, sowie reine Rabatt- oder Cashback-Modelle. Ökonomisch rechtfertigt sich der Aufwand solcher Programme dadurch, dass die Gewinnung neuer Kunden in der Regel deutlich teurer ist als die Bindung bestehender Kunden, und dass gebundene Kunden tendenziell höhere durchschnittliche Bestellwerte, eine geringere Preissensibilität sowie eine höhere Weiterempfehlungsbereitschaft aufweisen. Der Erfolg eines Loyalty-Programms wird meist über die Wiederkaufrate, den durchschnittlichen Customer Lifetime Value teilnehmender vs. nicht teilnehmender Kunden sowie die Nutzungs-/Einlösequote gemessen.",ex:"Ein Modehändler betreibt ein dreistufiges Punkteprogramm: Für jeden ausgegebenen Euro erhalten Kunden einen Punkt, ab 500 gesammelten Punkten erreichen sie die Silber-Stufe mit kostenlosem Versand, ab 2.000 Punkten die Gold-Stufe mit exklusivem Zugang zu Sale-Vorverkäufen – dieses gestaffelte System motiviert Kunden zu höheren und häufigeren Käufen, um die nächste Stufe zu erreichen."},
        {t:"Web-Controlling-Kennzahlen (KPIs)",def:"Web-Controlling nutzt quantitative Kennzahlen (Key Performance Indicators, KPIs), um den Erfolg einer Website oder eines Online-Shops objektiv und datenbasiert zu messen, statt sich auf subjektive Einschätzungen zu verlassen. Zentrale KPIs umfassen: die Absprungrate (Bounce Rate) – der Anteil der Besucher, die die Seite verlassen, ohne weiter zu interagieren; die durchschnittliche Verweildauer (Time on Site), die Engagement signalisiert; die Seiten pro Sitzung, die zeigen, wie tief Besucher navigieren; die Conversion Rate, also der Anteil der Besucher, die eine gewünschte Zielaktion (Kauf, Newsletter-Anmeldung) abschließen; sowie Traffic-Quellen-Kennzahlen, die aufschlüsseln, über welche Kanäle (organische Suche, bezahlte Werbung, Social Media, Direktzugriff) Besucher auf die Seite gelangen. Erst die Kombination mehrerer KPIs ergibt ein aussagekräftiges Gesamtbild, da eine einzelne Kennzahl isoliert betrachtet leicht fehlinterpretiert werden kann.",ex:"Eine ungewöhnlich hohe Absprungrate von 75% speziell auf einer bestimmten Produktseite (im Vergleich zu 40% im Seitendurchschnitt) kann darauf hindeuten, dass die Produktbeschreibung unklar ist, wichtige Informationen (z.B. Größentabelle) fehlen oder die Ladezeit dieser Seite zu lang ist – eine gezielte Analyse dieser einzelnen KPI-Abweichung liefert konkrete Ansatzpunkte zur Optimierung."},
        {t:"Conversion-Rate-Optimierung",def:"Conversion-Rate-Optimierung (CRO) bezeichnet den systematischen, datengetriebenen Prozess, den Anteil der Website-Besucher zu erhöhen, die eine definierte Zielaktion abschließen – meist einen Kauf, aber auch Newsletter-Anmeldungen oder Kontaktanfragen. Der CRO-Prozess folgt typischerweise einem iterativen Zyklus: Zunächst werden anhand von Web-Analytics-Daten und Nutzerverhaltensanalysen (z.B. Heatmaps, Session-Recordings) Schwachstellen oder Reibungspunkte im Nutzerpfad identifiziert; darauf basierend werden Hypothesen formuliert (z.B. 'ein prominenterer Call-to-Action-Button erhöht die Klickrate'); anschließend wird die Hypothese über einen kontrollierten A/B-Test empirisch geprüft, bei dem ein Teil der Besucher zufällig die bisherige Version (Kontrollgruppe) und der andere Teil die neue Variante (Testgruppe) sieht; abschließend wird die Variante mit der statistisch signifikant besseren Performance dauerhaft übernommen. Häufige CRO-Hebel sind die Vereinfachung des Checkout-Prozesses, die Reduktion der Formularfelder, das Hinzufügen von Vertrauenssignalen (Kundenbewertungen, Sicherheitssiegel) und eine klarere Preis-/Versandkosten-Kommunikation.",ex:"Ein Online-Shop testet zwei Checkout-Varianten: die bisherige mit fünf Formularschritten und eine neue, verkürzte Variante mit nur zwei Schritten. Nach 10.000 Besuchern je Variante zeigt die verkürzte Variante eine Abschlussrate von 4,8% gegenüber 3,9% bei der bisherigen Version – ein statistisch signifikanter Unterschied, woraufhin der Shop die verkürzte Variante dauerhaft übernimmt."},
        {t:"Google Analytics Grundlagen",def:"Google Analytics ist eines der weltweit meistgenutzten Web-Analyse-Werkzeuge und erfasst automatisiert Website-Traffic, Nutzerverhalten und Conversion-Pfade, indem ein Tracking-Code auf jeder Seite eines Shops Ereignisse (Seitenaufrufe, Klicks, Käufe) an Google übermittelt. Zentrale Berichtskategorien sind: Akquisitionsberichte, die zeigen, über welche Kanäle Besucher auf die Website gelangen (organische Suche, bezahlte Anzeigen, Social Media, Direktzugriff, Verweise von anderen Seiten); Verhaltensberichte, die zeigen, welche Seiten wie oft und wie lange besucht werden und wo Nutzer die Seite verlassen; sowie Conversion-/E-Commerce-Berichte, die Käufe, Umsätze und den gesamten Kaufpfad bis zum Abschluss nachvollziehen. Über sogenannte Zielvorhaben (Goals) und Trichter-Analysen (Funnel-Analysen) lässt sich zudem exakt identifizieren, an welcher konkreten Stelle im Kaufprozess Besucher überproportional häufig abspringen, bevor sie den Kauf abschließen.",ex:"Über Google Analytics erkennt ein Modehändler, dass 45% aller zahlenden Kunden über organische Instagram-Verweise und Influencer-Links auf die Seite gelangen, während bezahlte Google-Ads-Anzeigen zwar viel Traffic, aber eine deutlich niedrigere Conversion Rate liefern – eine Erkenntnis, die den Händler dazu bewegt, das Marketingbudget stärker in Richtung Social-Media-Kooperationen zu verschieben."},
      ],
      quiz:[{q:"Was misst die Conversion Rate?",options:["Anzahl der Website-Besucher","Anteil der Besucher, die kaufen","Ladezeit der Website","Anzahl der Produkte im Shop"],correct:1,explain:"Conversion Rate = Anteil der Besucher, die eine gewünschte Aktion (z.B. Kauf) ausführen."},{q:"Was ist der Customer Lifetime Value (CLV)?",options:["Alter des Kunden","Erwarteter Gesamtumsatz eines Kunden über die Kundenbeziehung","Anzahl der Klicks","Retourenquote"],correct:1,explain:"CLV schätzt den gesamten Wert eines Kunden über die gesamte Geschäftsbeziehung."},{q:"Was ist eine typische CRM-Maßnahme?",options:["Personalisierte E-Mail-Kampagnen","Serverwartung","Buchhaltung","Produktionsplanung"],correct:0,explain:"Personalisierte Kommunikation ist ein zentrales CRM-Instrument zur Kundenbindung."}],
      cards:[{front:"CRM",back:"Customer Relationship Management – systematische Gestaltung der Kundenbeziehungen."},{front:"Conversion Rate",back:"Prozentsatz der Besucher, die eine gewünschte Aktion (z.B. Kauf) abschließen."},{front:"Customer Lifetime Value",back:"Erwarteter Gesamtumsatz/-gewinn eines Kunden über die gesamte Geschäftsbeziehung."},{front:"Web Controlling",back:"Systematische Analyse von Website-Kennzahlen zur Erfolgssteuerung."},{front:"Churn Rate",back:"Kennzahl für die Kundenabwanderungsrate in einem Zeitraum."}]},

    {id:"s3-bwl6",code:"BWL VI",name:"Investition und Finanzierung",ects:6,sws:"4",exam:"Klausur 60 Min. · 100%",desc:"Investitionsverfahren, Finanzierungsformen und Finanzmanagement.",
      topics:[
        {t:"Statische Investitionsrechnung",def:"Statische Investitionsrechnungsverfahren bewerten die Vorteilhaftigkeit einer Investition anhand einer einzigen, meist durchschnittlichen Rechnungsperiode und berücksichtigen dabei bewusst nicht, dass Geld zu unterschiedlichen Zeitpunkten unterschiedlich viel wert ist (Zeitwert des Geldes) – sie sind dafür einfach und schnell anzuwenden, liefern aber bei langfristigen oder stark schwankenden Zahlungsströmen nur eine grobe Näherung. Die Kostenvergleichsrechnung vergleicht die durchschnittlichen jährlichen Kosten mehrerer Investitionsalternativen. Die Gewinnvergleichsrechnung erweitert dies um die erwarteten Erlöse. Die Rentabilitätsrechnung setzt den durchschnittlichen Gewinn ins Verhältnis zum eingesetzten Kapital. Die Amortisationsrechnung (Payback-Methode) schließlich berechnet, nach welcher Zeitspanne die anfänglichen Anschaffungskosten einer Investition durch die daraus resultierenden Rückflüsse (Einzahlungsüberschüsse) wieder vollständig hereingeholt wurden – je kürzer die Amortisationsdauer, desto geringer gilt das Investitionsrisiko.",ex:"Ein neues automatisiertes Lagersystem kostet in der Anschaffung 200.000 € und spart durch geringeren Personalbedarf jährlich 50.000 € an Kosten. Die Amortisationsrechnung zeigt: 200.000 € ÷ 50.000 €/Jahr = 4 Jahre, bis sich die Investition durch die Einsparungen amortisiert hat – ein Wert, den das Management mit der geplanten Nutzungsdauer der Anlage von z.B. 10 Jahren vergleicht, um die Investition zu bewerten."},
        {t:"Dynamische Verfahren (Kapitalwertmethode)",def:"Dynamische Investitionsrechnungsverfahren berücksichtigen im Gegensatz zu statischen Verfahren explizit den Zeitwert des Geldes: Ein Euro, der heute zur Verfügung steht, ist mehr wert als ein Euro, der erst in fünf Jahren zufließt, weil er zwischenzeitlich angelegt und verzinst werden könnte. Die Kapitalwertmethode (Net Present Value, NPV) ist das wichtigste dynamische Verfahren: Sie diskontiert (rechnet zurück) alle zukünftigen, mit der Investition verbundenen Ein- und Auszahlungen mithilfe eines Kalkulationszinssatzes (der die geforderte Mindestverzinsung bzw. die Kapitalkosten widerspiegelt) auf ihren heutigen Wert (Barwert) und summiert diese Barwerte abzüglich der anfänglichen Investitionsauszahlung. Ist der resultierende Kapitalwert positiv, gilt die Investition als wirtschaftlich vorteilhaft, da sie mehr Wert schafft, als die geforderte Mindestverzinsung erfordert; bei mehreren sich ausschließenden Alternativen wird üblicherweise diejenige mit dem höchsten positiven Kapitalwert gewählt. Verwandte dynamische Verfahren sind die interne Zinsfußmethode (der Zinssatz, bei dem der Kapitalwert genau null wird) und die Annuitätenmethode.",ex:"Ein Unternehmen plant eine neue Fulfillment-Anlage mit 500.000 € Anschaffungskosten, die über 5 Jahre jährliche Einzahlungsüberschüsse von 130.000 € erwirtschaften soll. Bei einem Kalkulationszinssatz von 8% ergibt die Diskontierung dieser Zahlungsströme einen positiven Kapitalwert von rund 19.000 € – die Investition gilt damit als wirtschaftlich vorteilhaft, da sie die geforderte 8%-Mindestverzinsung übertrifft."},
        {t:"Eigen- vs. Fremdfinanzierung",def:"Die Finanzierungsentscheidung eines Unternehmens betrifft grundlegend die Frage, woher das für Investitionen benötigte Kapital stammt. Eigenfinanzierung stammt von den Eigentümern des Unternehmens – etwa durch Einlagen der Gründer, Kapitalerhöhungen bestehender oder neuer Gesellschafter, oder durch die Selbstfinanzierung aus einbehaltenen (thesaurierten) Gewinnen – und begründet keinen festen Rückzahlungsanspruch, dafür aber Mitspracherechte und eine Beteiligung am Gewinn (und Verlust). Fremdfinanzierung stammt dagegen von externen Gläubigern wie Banken (Kredite), Anleihegläubigern oder Lieferanten (Lieferantenkredit) und begründet einen festen, vertraglich fixierten Rückzahlungs- und Zinsanspruch unabhängig vom Geschäftserfolg, gewährt den Gläubigern aber in der Regel keine Mitspracherechte. Der sogenannte Leverage-Effekt (Hebelwirkung) beschreibt, dass Fremdkapital die Eigenkapitalrendite steigern kann, solange die Gesamtkapitalrendite über dem Fremdkapitalzinssatz liegt – gleichzeitig erhöht ein hoher Fremdkapitalanteil aber auch das finanzielle Risiko, da Zins- und Tilgungszahlungen unabhängig von der Geschäftslage geleistet werden müssen.",ex:"Ein Startup finanziert den Bau einer neuen Lagerhalle im Wert von 1 Mio. € zu 40% aus Eigenkapital (Einlagen der Gründer und eines Investors) und zu 60% über einen Bankkredit (Fremdkapital) – dieser Finanzierungsmix nutzt den Leverage-Effekt zur Steigerung der Eigenkapitalrendite, birgt aber gleichzeitig das Risiko, dass die monatlichen Kreditraten auch in einem schwachen Geschäftsjahr bedient werden müssen."},
        {t:"Finanzierungsformen (Kredit, Leasing, Factoring)",def:"Neben der klassischen Kreditfinanzierung (ein Kreditinstitut stellt einen Geldbetrag gegen Zins- und Tilgungszahlungen zur Verfügung) existieren im Unternehmensalltag mehrere spezialisierte Finanzierungsinstrumente. Leasing ist eine zeitlich befristete Nutzungsüberlassung eines Wirtschaftsguts (z.B. Fahrzeuge, Maschinen, IT-Ausstattung) gegen regelmäßige Leasingraten, ohne dass das rechtliche Eigentum auf den Nutzer übergeht – dies schont die Liquidität, da keine hohe Einmalzahlung nötig ist, und verlagert oft Instandhaltungsrisiken auf den Leasinggeber. Factoring bezeichnet den Verkauf offener Kundenforderungen (Rechnungen mit Zahlungsziel) an eine spezialisierte Factoring-Gesellschaft, die dem Unternehmen sofort einen Großteil des Rechnungsbetrags auszahlt (abzüglich einer Gebühr) und dadurch sofortige Liquidität schafft, während das Ausfallrisiko und der Verwaltungsaufwand für das Forderungsmanagement auf die Factoring-Gesellschaft übergehen (beim echten Factoring). Diese Instrumente sind besonders für wachstumsstarke, aber liquiditätsknappe Unternehmen attraktiv, da sie Kapitalbindung reduzieren, ohne dafür klassische Kredite mit strengen Sicherheitenanforderungen aufnehmen zu müssen.",ex:"Ein Online-Händler mit 30 Tagen Zahlungsziel gegenüber seinen Geschäftskunden verkauft seine offenen Forderungen über 100.000 € an eine Factoring-Gesellschaft und erhält dafür sofort 95.000 € ausgezahlt (5% Factoring-Gebühr) – dadurch steht ihm die Liquidität sofort zur Verfügung, um z.B. pünktlich Löhne zu zahlen, statt 30 Tage auf den Zahlungseingang seiner Kunden warten zu müssen."},
      ],
      quiz:[{q:"Was berechnet die Kapitalwertmethode?",options:["Den Barwert aller Zahlungsströme einer Investition","Nur den Kaufpreis","Die Steuerlast","Den Personalbedarf"],correct:0,explain:"Der Kapitalwert (NPV) diskontiert alle zukünftigen Zahlungen auf den heutigen Wert."},{q:"Was ist Leasing?",options:["Kauf auf Raten","Miete von Wirtschaftsgütern gegen Gebühr","Eine Aktienart","Ein Steuervorteil"],correct:1,explain:"Leasing = zeitlich befristete Nutzungsüberlassung von Gütern gegen Zahlung."}],
      cards:[{front:"Kapitalwertmethode",back:"Dynamisches Investitionsverfahren, das alle Zahlungsströme abzinst und summiert (NPV)."},{front:"Amortisationsrechnung",back:"Statisches Verfahren, das die Zeit bis zur Rückgewinnung des eingesetzten Kapitals berechnet."},{front:"Leasing",back:"Zeitlich befristete Nutzungsüberlassung von Wirtschaftsgütern gegen Zahlung."},{front:"Factoring",back:"Verkauf von Forderungen an ein Finanzinstitut zur sofortigen Liquiditätsbeschaffung."}]},

    {id:"s3-swt",code:"SWT EC",name:"Softwaretechnik",ects:6,sws:"5",exam:"Klausur 90 Min. · 100% + Praktikum (Pflicht, unbenotet)",desc:"Einführung in die Softwaretechnik: Requirements Engineering, UML, Entwurfsmuster, Vorgehensmodelle.",
      topics:[
        {t:"Requirements Engineering",def:"Requirements Engineering (Anforderungsmanagement) ist die systematische Disziplin, mit der Anforderungen an ein Softwaresystem ermittelt (Elicitation), dokumentiert, analysiert, priorisiert, abgestimmt und über den gesamten Projektverlauf hinweg verwaltet werden, bevor bzw. während Software entwickelt wird. Man unterscheidet funktionale Anforderungen (was das System konkret tun soll, z.B. 'Nutzer können Artikel in den Warenkorb legen') von nicht-funktionalen Anforderungen (Qualitätseigenschaften wie Performance, Sicherheit, Benutzerfreundlichkeit oder Skalierbarkeit). Typische Techniken zur Anforderungsermittlung sind Interviews mit Stakeholdern, Workshops, Beobachtung bestehender Arbeitsabläufe sowie das Verfassen von User Stories (kurze, aus Nutzersicht formulierte Anforderungsbeschreibungen nach dem Schema 'Als [Rolle] möchte ich [Ziel], um [Nutzen] zu erreichen') und Use Cases (detailliertere Beschreibungen von Interaktionsabläufen zwischen Nutzer und System). Mangelhaftes Requirements Engineering gilt als eine der Hauptursachen für gescheiterte oder budgetüberziehende Softwareprojekte, weil Fehlverständnisse erst spät und damit besonders teuer korrigiert werden können.",ex:"Vor der Entwicklung eines neuen Warenkorb-Features formuliert das Entwicklungsteam gemeinsam mit dem Produktmanagement User Stories wie 'Als Kundin möchte ich Artikel im Warenkorb speichern können, auch nachdem ich mich ausgeloggt habe, damit ich meinen Einkauf später fortsetzen kann' – diese konkrete, aus Nutzersicht formulierte Anforderung lässt sich anschließend in klar testbare technische Akzeptanzkriterien übersetzen."},
        {t:"UML-Diagramme (Klassen, Sequenz, Use-Case)",def:"UML (Unified Modeling Language) ist der internationale Standard zur grafischen Modellierung von Softwaresystemen und stellt verschiedene Diagrammtypen für unterschiedliche Perspektiven bereit. Klassendiagramme gehören zu den Strukturdiagrammen und zeigen die statische Architektur eines Systems: Klassen mit ihren Attributen und Methoden sowie die Beziehungen zwischen ihnen (Assoziation, Vererbung, Aggregation, Komposition). Sequenzdiagramme gehören zu den Verhaltensdiagrammen und zeigen den zeitlichen Ablauf von Nachrichtenaustausch zwischen mehreren Objekten oder Systemkomponenten – wer ruft wann welche Methode bei wem auf. Use-Case-Diagramme visualisieren aus einer höheren, fachlichen Flughöhe, welche Akteure (Nutzer oder externe Systeme) welche Funktionalitäten (Anwendungsfälle) eines Systems nutzen, ohne technische Details der Umsetzung zu zeigen. Zusammen ergeben diese komplementären Diagrammtypen ein vollständigeres Bild eines Softwaresystems als jeder einzelne Diagrammtyp für sich.",ex:"Ein Sequenzdiagramm für den Checkout-Prozess zeigt exakt die zeitliche Reihenfolge der Nachrichten: Kunde sendet Kaufanfrage an Shop-System → Shop-System fragt Zahlungsstatus beim Zahlungsdienstleister an → Zahlungsdienstleister bestätigt die Zahlung → Shop-System löst Versandauftrag beim Lagersystem aus – dieses Diagramm macht auf einen Blick sichtbar, welche Systeme in welcher Reihenfolge miteinander kommunizieren müssen."},
        {t:"Entwurfsmuster (Design Patterns)",def:"Entwurfsmuster (Design Patterns) sind bewährte, in der Softwareentwicklungspraxis wiederholt erprobte und dokumentierte Lösungsschablonen für wiederkehrende, strukturell ähnliche Entwurfsprobleme – sie sind kein fertiger Code, sondern eine allgemeine, übertragbare Vorlage, die auf das konkrete Problem angepasst wird. Die 1994 vom sogenannten 'Gang of Four' veröffentlichten klassischen Design Patterns werden traditionell in drei Kategorien eingeteilt: Erzeugungsmuster (Creational Patterns) regeln, wie Objekte erzeugt werden (z.B. das Singleton-Pattern, das sicherstellt, dass von einer Klasse zur Laufzeit nur genau eine Instanz existiert); Strukturmuster (Structural Patterns) regeln, wie Klassen und Objekte zu größeren Strukturen zusammengesetzt werden (z.B. das Adapter-Pattern, das inkompatible Schnittstellen kompatibel macht); Verhaltensmuster (Behavioral Patterns) regeln, wie Objekte miteinander kommunizieren und Verantwortlichkeiten verteilen (z.B. das Observer-Pattern, bei dem mehrere Objekte automatisch über Zustandsänderungen eines anderen Objekts benachrichtigt werden). Design Patterns fördern Wiederverwendbarkeit, verbessern die Verständlichkeit im Team (durch gemeinsames Vokabular) und vermeiden häufige Entwurfsfehler.",ex:"Das Singleton-Pattern wird eingesetzt, um sicherzustellen, dass pro Nutzersitzung genau ein Warenkorb-Objekt existiert, unabhängig davon, von wie vielen unterschiedlichen Stellen im Code auf den Warenkorb zugegriffen wird – ohne dieses Muster könnten versehentlich mehrere, widersprüchliche Warenkorb-Instanzen entstehen."},
        {t:"Testverfahren & Qualitätssicherung",def:"Softwaretests stellen systematisch sicher, dass ein Softwaresystem die spezifizierten Anforderungen korrekt erfüllt, und werden üblicherweise in einer aufsteigenden Teststufen-Pyramide organisiert. Unit-Tests (Komponententests) prüfen die kleinste isolierte Code-Einheit – meist eine einzelne Methode oder Funktion – automatisiert und unabhängig von anderen Systemteilen und bilden die breite Basis der Testpyramide, da sie schnell, zahlreich und günstig auszuführen sind. Integrationstests prüfen darauf aufbauend das korrekte Zusammenspiel mehrerer bereits einzeln getesteter Komponenten (z.B. ob das Bestellsystem korrekt mit dem Zahlungsdienstleister kommuniziert). Systemtests prüfen das gesamte, vollständig integrierte System gegen die fachlichen Anforderungen, häufig aus Nutzersicht. Abnahmetests schließlich werden vom Auftraggeber oder Endnutzer selbst durchgeführt, um die Freigabe für den produktiven Einsatz zu erteilen. Automatisierte Tests, die bei jeder Codeänderung automatisch erneut ausgeführt werden (Regressionstests), sind heute Standard, um sicherzustellen, dass neue Änderungen keine bestehende Funktionalität versehentlich brechen.",ex:"Ein automatisierter Unit-Test prüft isoliert, ob die Rabattberechnungsfunktion bei Eingabe des Gutscheincodes 'SOMMER10' korrekt 10% vom Warenkorbwert abzieht, bei einem ungültigen Code aber keinen Rabatt gewährt und keine Fehlermeldung im System auslöst – dieser Test läuft bei jeder Codeänderung automatisch mit, um sicherzustellen, dass die Rabattlogik durch spätere Anpassungen nicht versehentlich beschädigt wird."},
        {t:"Vorgehensmodelle (Wasserfall, Scrum)",def:"Vorgehensmodelle strukturieren, in welcher Reihenfolge und mit welcher Organisationsform die Phasen eines Softwareentwicklungsprojekts (Anforderungsanalyse, Design, Implementierung, Test, Betrieb) durchlaufen werden. Das klassische Wasserfallmodell ist linear-sequenziell: Jede Phase wird vollständig abgeschlossen, bevor die nächste beginnt, was eine klare Planbarkeit und Dokumentation ermöglicht, aber wenig Flexibilität bei sich ändernden Anforderungen bietet und Fehler oft erst spät im Projekt sichtbar macht. Agile Vorgehensmodelle wie Scrum durchbrechen diese starre Linearität zugunsten kurzer, iterativer Entwicklungszyklen (Sprints, meist 1–4 Wochen), an deren Ende jeweils ein potenziell auslieferbares Produktinkrement steht; zentrale Scrum-Rollen sind der Product Owner (verantwortet die fachlichen Prioritäten im Product Backlog), das Entwicklungsteam und der Scrum Master (moderiert den Prozess und beseitigt Hindernisse), während tägliche kurze Abstimmungen (Daily Standups) und regelmäßige Rückblicke (Sprint Reviews, Retrospektiven) für kontinuierliche Anpassung sorgen. Agile Modelle eignen sich besonders gut für Projekte mit unklaren oder sich häufig ändernden Anforderungen, wie es im schnelllebigen E-Commerce-Umfeld typisch ist.",ex:"Ein E-Commerce-Entwicklungsteam plant seine Arbeit in zweiwöchigen Scrum-Sprints: Zu Sprint-Beginn wählt das Team gemeinsam mit dem Product Owner priorisierte Einträge aus dem Product Backlog aus (z.B. 'Wunschliste-Feature entwickeln'), führt täglich ein 15-minütiges Daily Standup durch, um Fortschritt und Hindernisse zu besprechen, und liefert am Sprint-Ende ein fertig getestetes, potenziell direkt einsetzbares Feature aus – im Gegensatz zum starren Wasserfallmodell kann das Team so flexibel auf neue Erkenntnisse oder veränderte Kundenwünsche reagieren."},
      ],
      quiz:[{q:"Wofür steht UML?",options:["Unified Modeling Language","Universal Machine Learning","User Management Layer","Unit Model Logic"],correct:0,explain:"UML = Unified Modeling Language, Standard-Notation für Softwaremodellierung."},{q:"Was ist ein Entwurfsmuster (Design Pattern)?",options:["Ein fertiges Programm","Eine wiederverwendbare Lösung für ein wiederkehrendes Entwurfsproblem","Ein Datenbankschema","Ein Testverfahren"],correct:1,explain:"Design Patterns sind bewährte, wiederverwendbare Lösungsschablonen für Software-Probleme."},{q:"Welches Vorgehensmodell ist iterativ und agil?",options:["Wasserfallmodell","Scrum","V-Modell","Spiralmodell (klassisch)"],correct:1,explain:"Scrum ist ein agiles, iteratives Vorgehensmodell mit kurzen Sprints."}],
      cards:[{front:"Requirements Engineering",back:"Systematisches Ermitteln, Dokumentieren und Verwalten von Anforderungen an Software."},{front:"UML-Klassendiagramm",back:"Zeigt Klassen, Attribute, Methoden und Beziehungen in einem Softwaresystem."},{front:"Design Pattern",back:"Bewährte, wiederverwendbare Lösung für ein wiederkehrendes Entwurfsproblem."},{front:"Scrum",back:"Agiles Vorgehensmodell mit iterativen Sprints, Product Owner und Daily Standups."},{front:"Unit Test",back:"Automatisierter Test einer einzelnen, isolierten Code-Einheit (z.B. Methode)."}]},
  ]},
  {nr:4,title:"Entrepreneurship, UX, Operations & Webtechnologien",ects:30,modules:[
    {id:"s4-ent",code:"ENT",name:"Entrepreneurship",ects:6,sws:"4",exam:"Schriftl. Ausarbeitung (15 S.) · 75% + Vortrag 10 Min. · 25%",desc:"Technologiebasierte Unternehmensgründungen und Innovationen.",
      topics:[
        {t:"Business Model Canvas",def:"Das Business Model Canvas, entwickelt von Alexander Osterwalder, ist ein strategisches Visualisierungswerkzeug, das die neun zentralen Bausteine eines Geschäftsmodells auf einer einzigen, übersichtlichen Seite darstellt und damit die gemeinsame Diskussion und iterative Weiterentwicklung einer Geschäftsidee im Team erleichtert. Die neun Bausteine sind: Kundensegmente (für wen wird Wert geschaffen), Wertangebote (welches Problem wird gelöst bzw. welcher Nutzen gestiftet), Kanäle (wie erreicht das Angebot den Kunden), Kundenbeziehungen (wie wird die Beziehung zum Kunden gestaltet), Erlösquellen (wie verdient das Unternehmen Geld), Schlüsselressourcen (welche Ressourcen sind notwendig), Schlüsselaktivitäten (welche Tätigkeiten sind zentral), Schlüsselpartnerschaften (wer sind wichtige externe Partner) sowie Kostenstruktur (welche Kosten entstehen). Der große Vorteil gegenüber einem klassischen, seitenlangen Businessplan liegt in der kompakten, ganzheitlichen Übersicht, die es erleichtert, Wechselwirkungen zwischen den Bausteinen zu erkennen und das Geschäftsmodell iterativ anzupassen, bevor viel Zeit in Detailplanung investiert wird.",ex:"Ein Gründerteam für einen nachhaltigen Online-Modeshop füllt das Canvas aus: Kundensegment sind umweltbewusste 20- bis 35-Jährige, das Wertangebot ist zertifiziert nachhaltige Mode zu fairen Preisen, Kanal ist ein eigener Online-Shop plus Instagram-Marketing, Erlösquelle ist der direkte Produktverkauf – durch das Ausfüllen aller neun Felder erkennt das Team frühzeitig, dass die Schlüsselpartnerschaft mit zertifizierten Textilherstellern der kritischste, noch ungeklärte Baustein des gesamten Modells ist."},
        {t:"Gründungsfinanzierung (VC, Business Angels)",def:"Wachstumsstarke, technologiebasierte Startups finanzieren sich häufig nicht über klassische Bankkredite (da ihnen meist Sicherheiten und ein belastbarer Track Record fehlen), sondern über spezialisierte Risikokapitalgeber. Business Angels sind meist selbst erfahrene Unternehmer oder ehemalige Gründer, die in der sehr frühen Phase (Pre-Seed/Seed) mit eigenem privatem Kapital sowie ihrem Netzwerk und Know-how in Startups investieren, typischerweise gegen eine Minderheitsbeteiligung. Venture-Capital-Gesellschaften (VC-Fonds) verwalten dagegen gebündeltes Kapital institutioneller Investoren und investieren meist in späteren, bereits etwas reiferen Finanzierungsrunden (Serie A, B, C) deutlich größere Summen, ebenfalls gegen Unternehmensanteile, mit dem Ziel, das Unternehmen innerhalb weniger Jahre stark zu skalieren und die Beteiligung anschließend gewinnbringend zu verkaufen (Exit, z.B. über einen Börsengang oder Verkauf an einen strategischen Käufer). Beide Finanzierungsformen unterscheiden sich fundamental von Fremdkapital: Es entsteht keine Rückzahlungspflicht, dafür geben die Gründer einen Teil der Unternehmensanteile und -kontrolle ab.",ex:"Ein E-Commerce-Startup erhält in der Seed-Phase 300.000 € von zwei Business Angels gegen 15% Unternehmensanteile, um die erste eigene Lagerhalle und ein kleines Team aufzubauen; wächst der Umsatz daraufhin stark, folgt oft eine deutlich größere Serie-A-Finanzierungsrunde von mehreren Millionen Euro durch einen spezialisierten VC-Fonds, um die Expansion in weitere Länder zu finanzieren."},
        {t:"Pitch-Techniken",def:"Ein Pitch ist eine kompakte, überzeugende Kurzpräsentation einer Geschäftsidee vor potenziellen Investoren, Partnern oder Kunden, deren Ziel es ist, in sehr begrenzter Zeit (oft nur 60–120 Sekunden beim sogenannten Elevator Pitch) Interesse zu wecken und einen Folgetermin oder eine Investitionsentscheidung zu erwirken. Ein überzeugender Pitch folgt meist einer bewährten Struktur: Zunächst wird das Problem klar und nachvollziehbar geschildert, das ein relevanter Teil des Marktes hat; dann wird die eigene Lösung vorgestellt und ihr Alleinstellungsmerkmal gegenüber bestehenden Alternativen herausgearbeitet; anschließend wird die Marktgröße und das Geschäftsmodell knapp skizziert, um die wirtschaftliche Tragfähigkeit zu belegen; abschließend folgt ein konkreter Call-to-Action (z.B. eine gesuchte Investitionssumme oder ein gewünschter nächster Schritt). Erfolgreiche Pitches zeichnen sich durch eine klare, jargon-freie Sprache, überzeugende Kennzahlen sowie souveränes, selbstbewusstes Auftreten aus, ohne die Risiken der Idee zu verschweigen.",ex:"In einem 90-sekündigen Elevator Pitch erklärt eine Gründerin knapp: 'Kleine Modehändler verlieren jährlich Millionen durch Retouren, weil Kunden online falsche Größen bestellen. Unser KI-gestütztes Größenberatungs-Tool reduziert Retourenquoten nachweislich um 30%. Wir suchen 200.000 € Seed-Kapital, um in den nächsten 12 Monaten 50 zahlende Kunden zu gewinnen.' – Problem, Lösung, Beleg und konkreter Call-to-Action in wenigen Sätzen."},
        {t:"Innovationsmanagement",def:"Innovationsmanagement bezeichnet die systematische, organisierte Steuerung des gesamten Prozesses von der Ideenfindung über die Bewertung und Auswahl bis zur Markteinführung neuer Produkte, Dienstleistungen, Prozesse oder Geschäftsmodelle. Man unterscheidet inkrementelle Innovationen (schrittweise Verbesserungen bestehender Angebote, mit geringem Risiko, aber auch begrenztem Differenzierungspotenzial) von radikalen bzw. disruptiven Innovationen (grundlegend neue Lösungsansätze, die bestehende Märkte oder Geschäftsmodelle fundamental verändern können, aber mit deutlich höherem Risiko verbunden sind). Etablierte Unternehmen stehen dabei häufig vor dem sogenannten Innovator's Dilemma: Sie optimieren ihr bestehendes, profitables Geschäft so gut, dass sie disruptive, zunächst noch unprofitable Innovationen tendenziell zu spät erkennen oder verfolgen. Als organisatorische Antwort etablieren viele Unternehmen dedizierte Innovation Labs oder nutzen offene Innovationsansätze (Open Innovation), bei denen externe Partner, Kunden oder Startups aktiv in den Innovationsprozess eingebunden werden.",ex:"Ein etabliertes Handelsunternehmen gründet ein separates Innovation Lab außerhalb der bestehenden Konzernstrukturen, um risikofreudiger und mit agileren Methoden neue Checkout-Technologien (z.B. kassenlose In-Store-Bezahlung) zu testen, ohne dass diese Experimente sofort an den Renditeanforderungen des Kerngeschäfts gemessen werden."},
        {t:"Marktanalyse für Startups",def:"Eine fundierte Marktanalyse untersucht systematisch, ob für eine Geschäftsidee tatsächlich ausreichend zahlungsbereite Nachfrage existiert, bevor größere Ressourcen in die Umsetzung investiert werden. Zentrale Analysedimensionen sind die Marktgröße, oft in drei Stufen gegliedert: TAM (Total Addressable Market – die theoretisch maximale Marktgröße bei vollständiger Marktdurchdringung), SAM (Serviceable Available Market – der mit dem konkreten Geschäftsmodell tatsächlich erreichbare Teilmarkt) und SOM (Serviceable Obtainable Market – der realistisch in den nächsten Jahren erreichbare Marktanteil). Ergänzend werden die Wettbewerbslandschaft (direkte und indirekte Konkurrenten, deren Stärken und Schwächen), die Zielgruppe (demografische und verhaltensbezogene Merkmale, konkrete Bedürfnisse) sowie Markttrends und regulatorische Rahmenbedingungen analysiert. Validierungsmethoden wie Kundeninterviews, Umfragen, Landingpage-Tests (Messung des Interesses über Registrierungen, bevor das Produkt überhaupt existiert) oder ein Minimum Viable Product (MVP) helfen, Annahmen über die Marktnachfrage mit echten Daten zu überprüfen, statt sich allein auf Intuition zu verlassen.",ex:"Ein Startup, das ein Bio-Lebensmittel-Abo plant, schaltet vor der eigentlichen Produktentwicklung eine einfache Landingpage mit Registrierungsformular und bewirbt sie mit einem kleinen Werbebudget; erst als sich innerhalb von zwei Wochen genügend Interessenten mit echten E-Mail-Adressen registrieren, gilt die grundsätzliche Marktnachfrage als validiert und das Team beginnt mit dem Aufbau der eigentlichen Lieferkette."},
      ],
      quiz:[{q:"Was ist ein Business Model Canvas?",options:["Ein Marketingplan","Ein visuelles 1-Seiten-Tool zur Geschäftsmodell-Entwicklung","Ein Buchhaltungsprogramm","Ein Vertragstyp"],correct:1,explain:"Das Business Model Canvas visualisiert alle Kernelemente eines Geschäftsmodells auf einer Seite."},{q:"Was ist Venture Capital?",options:["Bankkredit","Risikokapital von Investoren für Startups","Staatliche Subvention","Eigenkapital der Gründer"],correct:1,explain:"Venture Capital ist Risikokapital, das Investoren in wachstumsstarke Startups investieren."}],
      cards:[{front:"Business Model Canvas",back:"Strategisches Tool zur Visualisierung aller Kernelemente eines Geschäftsmodells."},{front:"Venture Capital",back:"Risikokapital, das Investoren gegen Unternehmensanteile in Startups investieren."},{front:"Business Angel",back:"Privater Investor, der Startups mit Kapital und Know-how unterstützt."},{front:"MVP",back:"Minimum Viable Product – kleinste funktionsfähige Produktversion zum Testen am Markt."}]},

    {id:"s4-mmi",code:"MMI EC",name:"MMI und GUI Programmierung",ects:6,sws:"5",exam:"Entwurf (10 S.) · 100%",desc:"Konzeption und Modellierung grafischer Benutzeroberflächen; Richtlinien für gebrauchstaugliche Software.",
      topics:[
        {t:"Mensch-Maschine-Interaktion (MMI) Grundlagen",def:"Die Mensch-Maschine-Interaktion (MMI, international auch Human-Computer Interaction, HCI) ist ein interdisziplinäres Forschungs- und Gestaltungsfeld, das untersucht, wie Menschen technische Systeme wahrnehmen, verstehen und bedienen, mit dem Ziel, Systeme so zu gestalten, dass sie möglichst intuitiv, effizient und fehlerarm nutzbar sind. Zentrale theoretische Grundlagen stammen aus der Kognitionspsychologie (wie Menschen Informationen wahrnehmen, verarbeiten und im Gedächtnis behalten), der Ergonomie (physische und kognitive Belastungsgrenzen) sowie der Interaktionsdesign-Theorie. Ein zentrales Konzept ist das mentale Modell: die intuitive, oft unbewusste Vorstellung, die ein Nutzer davon hat, wie ein System funktioniert – gute Interfaces gestalten die Interaktion so, dass sie mit dem natürlichen mentalen Modell der Nutzer übereinstimmt, statt sie zu zwingen, ein völlig neues, unnatürliches Bedienkonzept zu erlernen. Norman's Prinzip der Affordanz beschreibt zudem, wie visuelle Gestaltungselemente selbst signalisieren können, wie sie zu bedienen sind (z.B. ein Button, der wie ein drückbarer physischer Knopf aussieht).",ex:"Die Anordnung von Warenkorb-Icon oben rechts und Suchleiste oben mittig im Shop-Header folgt etablierten MMI-Konventionen, die sich über Jahre branchenübergreifend als mentales Modell bei den meisten Internetnutzern eingeprägt haben – weicht ein Shop grundlos von dieser Konvention ab, müssen Nutzer erst umlernen, was Reibung und Frustration erzeugt."},
        {t:"GUI-Design-Prinzipien",def:"Die Gestaltung grafischer Benutzeroberflächen (GUI) folgt etablierten Design-Prinzipien, die die Nutzung intuitiver und fehlertoleranter machen. Konsistenz bedeutet, dass gleiche Elemente im gesamten System gleich aussehen und sich gleich verhalten, damit Nutzer einmal Gelerntes überall anwenden können. Die Sichtbarkeit des Systemstatus fordert, dass das System den Nutzer jederzeit klar und zeitnah darüber informiert, was gerade passiert (z.B. ob eine Aktion erfolgreich war, noch lädt oder fehlgeschlagen ist), statt ihn im Unklaren zu lassen. Fehlertoleranz bedeutet, Fehleingaben möglichst zu verhindern (z.B. durch Eingabebeschränkungen), leicht erkennbar zu machen und einfach korrigierbar zu gestalten, statt den Nutzer für Fehler zu 'bestrafen'. Weitere wichtige Prinzipien sind Nutzerkontrolle und Freiheit (Nutzer sollten Aktionen leicht rückgängig machen können), Wiedererkennung statt Erinnerung (relevante Informationen sichtbar halten, statt Nutzer zu zwingen, sich Dinge zu merken) sowie eine klare visuelle Hierarchie, die wichtige Elemente hervorhebt.",ex:"Ein mehrstufiger Checkout-Prozess zeigt oben durchgehend einen Fortschrittsbalken mit den Schritten 'Warenkorb → Adresse → Zahlung → Bestätigung', bei dem der aktuell aktive Schritt optisch hervorgehoben ist – dies erfüllt direkt das Prinzip der Sichtbarkeit des Systemstatus, da der Kunde jederzeit weiß, wo im Prozess er sich befindet und wie viele Schritte noch folgen."},
        {t:"Usability-Heuristiken",def:"Usability-Heuristiken sind praxiserprobte Faustregeln zur systematischen Bewertung der Gebrauchstauglichkeit einer Benutzeroberfläche, ohne dass dafür zwingend aufwändige Nutzertests mit echten Probanden nötig sind. Die bekanntesten Heuristiken stammen von Jakob Nielsen und umfassen zehn Grundsätze, darunter: Sichtbarkeit des Systemstatus, Übereinstimmung zwischen System und realer Welt (vertraute Sprache und Konzepte statt technischem Fachjargon), Nutzerkontrolle und Freiheit, Konsistenz und Standards, Fehlervermeidung, Wiedererkennung statt Erinnerung, Flexibilität und Effizienz (sowohl für Anfänger als auch erfahrene Nutzer geeignet), ästhetisches und minimalistisches Design, Hilfe beim Erkennen und Beheben von Fehlern sowie Hilfe und Dokumentation. Eine sogenannte heuristische Evaluation lässt dabei mehrere Usability-Experten unabhängig voneinander eine Oberfläche anhand dieser Kriterien systematisch durchgehen und Verstöße dokumentieren und nach Schweregrad einstufen – eine schnelle und kostengünstige Ergänzung zu aufwändigeren Nutzertests mit echten Endanwendern.",ex:"Ein Usability-Test mit fünf realen Testpersonen prüft konkret, ob Nutzer den zentralen 'Jetzt kaufen'-Button auf einer Produktseite ohne Hilfestellung innerhalb weniger Sekunden finden und anklicken – findet mehr als eine Person den Button nicht sofort, deutet das auf einen Verstoß gegen die Heuristik der Sichtbarkeit wichtiger Elemente hin und signalisiert konkreten Überarbeitungsbedarf."},
        {t:"Wireframing & Prototyping",def:"Wireframes sind bewusst grobe, meist grau- oder schwarz-weiß gehaltene Strukturskizzen einer Benutzeroberfläche, die sich ausschließlich auf Layout, Informationsarchitektur und Platzierung von Elementen konzentrieren, ohne bereits Farben, Schriftarten oder finales visuelles Design festzulegen – dieser bewusste Verzicht auf Details in frühen Phasen erlaubt es Teams, sich zunächst auf grundlegende Struktur- und Funktionsfragen zu konzentrieren, statt sich in Diskussionen über Farbnuancen zu verlieren. Prototyping geht einen Schritt weiter und macht Interaktionen tatsächlich testbar: Ein Low-Fidelity-Prototyp (z.B. auf Papier) demonstriert grobe Abläufe, während ein High-Fidelity-Prototyp (klickbare digitale Mockups mit Werkzeugen wie Figma) nahezu wie die echte Anwendung wirkt und mit echten Nutzern in Usability-Tests erprobt werden kann, bevor überhaupt Code geschrieben wird. Dieser iterative Ansatz – schnell grobe Ideen visualisieren, mit Nutzern testen, Feedback einarbeiten – reduziert das Risiko, teure Entwicklungszeit in ein Design zu investieren, das sich später als unbrauchbar erweist.",ex:"Bevor ein einziger Zeile Code für eine neue Checkout-Seite geschrieben wird, erstellt das Designteam zunächst einen groben Wireframe der Seitenstruktur, entwickelt daraus einen klickbaren High-Fidelity-Prototyp in Figma und lässt zehn Testpersonen den kompletten Bestellvorgang darin durchklicken – aufgedeckte Verständnisprobleme werden direkt im Prototyp korrigiert, bevor die eigentliche, deutlich teurere technische Entwicklung überhaupt beginnt."},
        {t:"Barrierefreiheit",def:"Digitale Barrierefreiheit (Accessibility) stellt sicher, dass Websites, Apps und andere digitale Angebote auch von Menschen mit körperlichen, sensorischen oder kognitiven Einschränkungen vollständig genutzt werden können, und ist in vielen Ländern für bestimmte Anbieter mittlerweile auch gesetzlich vorgeschrieben. Der internationale Standard WCAG (Web Content Accessibility Guidelines) definiert konkrete, überprüfbare Kriterien entlang vier zentraler Prinzipien: Wahrnehmbarkeit (Inhalte müssen über verschiedene Sinne erfassbar sein, z.B. Alt-Texte für Bilder, die von Screenreadern vorgelesen werden können, und ausreichender Farbkontrast für sehbeeinträchtigte Nutzer), Bedienbarkeit (alle Funktionen müssen auch ausschließlich über Tastatur bedienbar sein, ohne Maus), Verständlichkeit (klare, vorhersehbare Sprache und Navigation) sowie Robustheit (Kompatibilität mit unterstützenden Technologien wie Screenreadern und Sprachsteuerung). Barrierefreiheit nützt dabei nicht nur Menschen mit dauerhaften Einschränkungen, sondern verbessert die Nutzbarkeit generell auch situativ (z.B. bei grellem Sonnenlicht auf dem Bildschirm oder wenn beide Hände anderweitig beschäftigt sind).",ex:"Ein Online-Shop hinterlegt für jedes Produktfoto einen aussagekräftigen Alt-Text (z.B. 'Roter Lederrucksack mit silbernen Schnallen, Frontansicht') und stellt sicher, dass alle Texte einen Farbkontrast von mindestens 4,5:1 zum Hintergrund haben – dadurch können auch blinde Nutzer mit Screenreader-Software oder sehbehinderte Nutzer mit eingeschränktem Kontrastsehen selbstständig und ohne fremde Hilfe einkaufen."},
      ],
      quiz:[{q:"Wofür steht GUI?",options:["General User Info","Graphical User Interface","Global Usability Index","Guided User Instruction"],correct:1,explain:"GUI = Graphical User Interface, grafische Benutzeroberfläche."},{q:"Was ist ein Wireframe?",options:["Ein Netzwerkkabel","Eine grobe strukturelle Skizze einer Benutzeroberfläche","Ein Datenbankschema","Ein Servertyp"],correct:1,explain:"Wireframes sind einfache, strukturelle Entwürfe von UI-Layouts vor dem finalen Design."}],
      cards:[{front:"MMI",back:"Mensch-Maschine-Interaktion – Erforschung, wie Menschen mit Systemen interagieren."},{front:"Usability",back:"Gebrauchstauglichkeit – wie effektiv, effizient und zufriedenstellend ein System nutzbar ist."},{front:"Wireframe",back:"Grobe, strukturelle Skizze einer Benutzeroberfläche ohne visuelles Design."},{front:"Barrierefreiheit",back:"Gestaltung von Software, die auch für Menschen mit Einschränkungen nutzbar ist."}]},

    {id:"s4-oscm",code:"OSCM",name:"Operations und Supply Chain Management",ects:6,sws:"4",exam:"Klausur 60 Min. · 100%",desc:"Grundlagen betrieblicher Produktions- und Logistikabläufe.",
      topics:[
        {t:"Produktionsplanung & -steuerung",def:"Die Produktionsplanung und -steuerung (PPS) plant systematisch, in welcher Menge, zu welchem Zeitpunkt und mit welchen Ressourcen Produkte hergestellt oder beschafft werden müssen, um die erwartete Nachfrage termingerecht und kosteneffizient zu decken. Die Bedarfsplanung schätzt zunächst die zukünftige Nachfrage anhand historischer Verkaufsdaten, saisonaler Muster und Markttrends (Absatzprognose). Die Materialbedarfsplanung (MRP) leitet daraus ab, welche Rohstoffe, Vorprodukte oder fertige Waren in welcher Menge zu welchem Zeitpunkt benötigt werden, unter Berücksichtigung von Lieferzeiten (Vorlaufzeiten) der Lieferanten. Die Kapazitätsplanung stellt sicher, dass ausreichend Produktions-, Lager- und Personalkapazität für den geplanten Bedarf vorhanden ist. Besonders im Handel mit stark saisonalen Produkten (z.B. Weihnachtsartikel, Sommerkleidung) ist eine vorausschauende Planung entscheidend, da die Vorlaufzeiten für Produktion und internationalen Transport oft mehrere Monate betragen und eine zu späte Bestellung zu Lieferengpässen genau zur Hauptverkaufszeit führen kann.",ex:"Ein Hersteller von Weihnachtsdekoration beginnt die Produktionsplanung für die Weihnachtssaison bereits im März: Basierend auf den Verkaufszahlen der Vorjahre und aktuellen Trendindikatoren wird die benötigte Menge geschätzt, die Produktion in asiatischen Fabriken mit mehrmonatiger Vorlaufzeit beauftragt und der Seetransport so terminiert, dass die Ware bereits im September in den europäischen Lagern eintrifft – rechtzeitig für den Verkaufsstart im Oktober."},
        {t:"Lagerhaltungsstrategien",def:"Lagerhaltungsstrategien balancieren den fundamentalen Zielkonflikt zwischen Lagerkosten (Kapitalbindung, Lagerfläche, Versicherung, Verderb-/Veralterungsrisiko) und Lieferfähigkeit (die Fähigkeit, Kundennachfrage jederzeit sofort zu bedienen, ohne dass Artikel ausverkauft sind). Der Sicherheitsbestand (Sicherheitspuffer) ist eine zusätzliche Lagermenge über den erwarteten Bedarf hinaus, die Schwankungen in Nachfrage oder Lieferzeiten abfedert und damit Fehlmengen (Out-of-Stock-Situationen) verhindert – seine optimale Höhe hängt von der Nachfrage- und Lieferzeitvariabilität sowie dem gewünschten Servicegrad ab. Die ABC-Analyse klassifiziert das Sortiment nach wirtschaftlicher Bedeutung: A-Artikel (meist ca. 20% der Artikel, aber ca. 80% des Umsatzes gemäß Pareto-Prinzip) erhalten intensive Steuerung und höhere Sicherheitsbestände, C-Artikel (viele Artikel mit geringem Einzelumsatzanteil) werden mit vereinfachten, kostengünstigeren Regeln gesteuert. Dieses differenzierte Vorgehen erlaubt es, das begrenzte Managementaufwand- und Kapitalbudget gezielt dort einzusetzen, wo der wirtschaftliche Hebel am größten ist.",ex:"Ein Elektronikhändler hält für seine umsatzstärksten A-Artikel (z.B. aktuelle Smartphone-Modelle) einen großzügigen Sicherheitsbestand, um auch bei unerwarteten Nachfragespitzen sofort lieferfähig zu bleiben, während er für langsam drehende C-Artikel (z.B. Nischenzubehör) bewusst geringere Bestände und längere Nachbestellzeiten in Kauf nimmt, da ein gelegentlicher kurzfristiger Ausverkauf hier wirtschaftlich weniger schmerzhaft ist als die Kapitalbindung durch hohe Lagerbestände."},
        {t:"Supply-Chain-Grundmodelle",def:"Eine Supply Chain (Lieferkette) umfasst alle Organisationen, Prozesse, Informationen und physischen Warenflüsse, die notwendig sind, um ein Produkt von der Rohstoffgewinnung über mehrere Verarbeitungsstufen bis zum Endkunden zu bringen. Man unterscheidet dabei drei parallel laufende Flüsse: den physischen Materialfluss (Rohstoffe, Halbfertig- und Fertigwaren bewegen sich vorwärts durch die Kette), den Informationsfluss (Bestellungen, Bedarfsprognosen und Statusmeldungen bewegen sich in beide Richtungen zwischen den Stufen) sowie den Finanzfluss (Zahlungen bewegen sich meist rückwärts, vom Endkunden zurück zu den vorgelagerten Stufen). Klassische Supply-Chain-Modelle unterscheiden zudem push-basierte Systeme (Produktion erfolgt basierend auf Prognosen, bevor konkrete Kundenbestellungen vorliegen) von pull-basierten Systemen (Produktion wird erst durch eine tatsächliche Kundenbestellung ausgelöst) – die meisten realen Lieferketten kombinieren beide Prinzipien an unterschiedlichen Stufen (Push-Pull-Grenze).",ex:"Die Lieferkette eines Modehändlers reicht vom Baumwollanbau über die Textilweberei und Konfektionsnäherei bis zum internationalen Transport in ein zentrales Verteilzentrum und schließlich zum Versand an die Haustür des Endkunden – dabei fließt physisch die Ware stromabwärts, während Bestellinformationen und Bedarfsprognosen stromaufwärts an die Produktionsstufen zurückgemeldet werden, damit diese ihre Kapazität entsprechend planen können."},
        {t:"Bullwhip-Effekt",def:"Der Bullwhip-Effekt (Peitscheneffekt) beschreibt das Phänomen, dass sich bereits kleine, ganz normale Schwankungen in der tatsächlichen Endkundennachfrage entlang der vorgelagerten Stufen einer Lieferkette zunehmend verstärken und aufschaukeln, sodass Hersteller am Anfang der Kette weitaus größere Nachfrageschwankungen wahrnehmen und darauf überproportional reagieren, als tatsächlich vom Endkunden ausgelöst wurden. Ursachen sind u.a.: verzögerte und unvollständige Informationsweitergabe zwischen den Stufen, Mindestbestellmengen und Mengenrabatte, die zu unregelmäßigen statt gleichmäßigen Bestellungen führen, Sicherheitsbestandsaufschläge, die auf jeder Stufe zusätzlich draufgerechnet werden, sowie psychologische Überreaktionen bei kurzfristigen Nachfragespitzen (Angstbestellungen, um bloß nicht selbst in Lieferengpässe zu geraten). Der Effekt führt zu ineffizienter Kapazitätsplanung, überhöhten Lagerbeständen und volatiler Produktionsauslastung entlang der gesamten Kette und lässt sich durch verbesserten Informationsaustausch (z.B. Echtzeit-Verkaufsdaten, die allen Stufen gleichzeitig zugänglich sind) sowie stabilere Bestellrhythmen deutlich abmildern.",ex:"Steigt die Nachfrage im Einzelhandel für ein Produkt kurzfristig nur um 10%, bestellt der Einzelhändler beim Großhändler vorsichtshalber 20% mehr (um Sicherheitsreserven aufzubauen), der Großhändler bestellt daraufhin beim Hersteller 40% mehr, und der Hersteller plant seine Produktion sogar um 60% hoch – am Ende der Kette entsteht dadurch eine massive Überproduktion, obwohl die ursprüngliche Nachfrageänderung beim Endkunden vergleichsweise moderat war."},
        {t:"Just-in-Time-Konzepte",def:"Just-in-Time (JIT) ist ein aus der japanischen Automobilindustrie (v.a. Toyota) stammendes Logistik- und Produktionskonzept, das darauf abzielt, Materialien und Waren exakt in der benötigten Menge und zum benötigten Zeitpunkt anzuliefern, statt große Lagerbestände vorzuhalten – mit dem Ziel, Kapitalbindung, Lagerkosten und Verschwendung (im Sinne der Lean-Philosophie) zu minimieren. Voraussetzung für ein funktionierendes JIT-System sind sehr zuverlässige, eng getaktete Lieferanten, eine hohe Prozessstabilität sowie meist ein enger, oft standortnaher Verbund zwischen Lieferant und Abnehmer, da schon kleine Lieferverzögerungen bei fehlendem Sicherheitspuffer sofort zu Produktions- oder Lieferstopps führen können. Der große Vorteil liegt in massiv reduzierter Kapitalbindung und Lagerfläche; der Nachteil ist eine erhöhte Verwundbarkeit gegenüber Lieferkettenstörungen, wie viele Unternehmen während globaler Lieferkettenkrisen schmerzhaft erfahren mussten, was seither vielerorts zu einem bewussten Umdenken hin zu etwas höheren strategischen Sicherheitsbeständen (Just-in-Case) geführt hat.",ex:"Ein Fulfillment-Zentrum eines Online-Händlers bestellt Verpackungskartons nicht in großen Mengen auf Vorrat, sondern lässt sie vom Lieferanten mehrmals wöchentlich exakt in der Menge anliefern, die dem prognostizierten Versandvolumen der kommenden Tage entspricht – das spart wertvolle Lagerfläche und Kapitalbindung, setzt aber eine sehr zuverlässige, eng getaktete Lieferbeziehung voraus."},
      ],
      quiz:[{q:"Was ist der Bullwhip-Effekt?",options:["Ein Produktionsfehler","Aufschaukelnde Nachfrageschwankungen entlang der Lieferkette","Ein Lagertyp","Eine Transportmethode"],correct:1,explain:"Der Bullwhip-Effekt beschreibt sich verstärkende Nachfrageschwankungen entlang der Supply Chain."},{q:"Was bedeutet Just-in-Time?",options:["Lagerbestände just rechtzeitig zur Bedarfsdeckung anliefern","Lager voll auffüllen","Nur einmal jährlich bestellen","Produkte vor Bedarf lagern"],correct:0,explain:"Just-in-Time minimiert Lagerbestände durch bedarfsgenaue Anlieferung."}],
      cards:[{front:"Supply Chain",back:"Die gesamte Lieferkette vom Rohstoff bis zum Endkunden."},{front:"Bullwhip-Effekt",back:"Sich entlang der Lieferkette verstärkende Nachfrageschwankungen."},{front:"Just-in-Time",back:"Logistikkonzept mit bedarfsgenauer, lagerarmer Anlieferung."},{front:"Sicherheitsbestand",back:"Zusätzlicher Lagerbestand zur Absicherung gegen Nachfrage-/Lieferschwankungen."}]},

    {id:"s4-sww",code:"SWW",name:"Shop und Warenwirtschaftssysteme",ects:6,sws:"5",exam:"Entwurf (10 S.) · 100%",desc:"Einführung in Aufbau und Betrieb eines Online-Shops und Warenwirtschaftssystems.",
      topics:[
        {t:"Shopsystem-Architektur (Shopify, Magento etc.)",def:"Ein Shopsystem ist die technische Softwareplattform, die alle Kernfunktionen eines Online-Shops bereitstellt: Produktkatalog und -präsentation, Warenkorb, Checkout-Prozess, Zahlungsabwicklung sowie grundlegende Bestandsverwaltung. Man unterscheidet grundsätzlich SaaS-Lösungen (Software-as-a-Service, z.B. Shopify), bei denen der Anbieter Hosting, Wartung und Sicherheitsupdates übernimmt und der Händler dafür eine monatliche Gebühr zahlt, ohne eigene Serverinfrastruktur betreiben zu müssen; Open-Source-Systeme (z.B. Magento/Adobe Commerce, WooCommerce), die kostenlos nutzbar und vollständig anpassbar sind, aber eigenes technisches Know-how oder eine Agentur für Betrieb und Wartung erfordern; sowie Individualentwicklungen (Custom-Lösungen), die vollständige Flexibilität bieten, aber den höchsten Entwicklungs- und Wartungsaufwand verursachen. Die Wahl des richtigen Shopsystems hängt von Faktoren wie erwartetem Bestellvolumen, benötigten individuellen Funktionen, technischem Know-how im Unternehmen und Budget ab.",ex:"Ein kleiner Modehändler wählt Shopify, weil er innerhalb weniger Tage ohne eigene IT-Abteilung startklar sein kann und über den App-Store zahlreiche fertige Payment- und Marketing-Plugins nachrüsten kann; ein großer Konzern mit sehr spezifischen, individuellen Prozessanforderungen entscheidet sich dagegen für eine aufwändigere Magento- oder Individualentwicklung, um maximale Flexibilität bei der Anpassung an interne Systeme zu erhalten."},
        {t:"Warenwirtschaft & Bestandsführung",def:"Ein Warenwirtschaftssystem (WWS) steuert und dokumentiert in Echtzeit sämtliche warenbezogenen Bewegungen eines Unternehmens: Wareneingang (Einbuchen gelieferter Ware inkl. Qualitätsprüfung), Lagerbestandsführung (fortlaufende Verwaltung, wie viele Einheiten jedes Artikels an welchem Lagerort verfügbar sind) sowie Warenausgang (Ausbuchen bei Verkauf, Kommissionierung oder Retoure). Ein zentraler technischer Mechanismus ist die Bestandssynchronisation: Bei jedem Verkauf – egal über welchen Kanal (Online-Shop, Marktplatz, stationäre Filiale) – wird der verfügbare Bestand automatisch und in Echtzeit reduziert, damit derselbe Artikel nicht versehentlich mehrfach über verschiedene Kanäle verkauft wird, obwohl nur eine Einheit tatsächlich vorrätig ist (Überverkauf/Oversell). Moderne Warenwirtschaftssysteme unterstützen zudem automatisierte Nachbestell-Trigger, die auslösen, sobald ein definierter Mindestbestand (Meldebestand) unterschritten wird.",ex:"Verkauft ein Händler den letzten verfügbaren Artikel eines Produkts gleichzeitig über seinen eigenen Online-Shop und Amazon, muss das Warenwirtschaftssystem den Bestand in Echtzeit über beide Kanäle synchronisieren und den Artikel sofort überall als 'ausverkauft' markieren – ohne diese Echtzeit-Synchronisation könnte der Artikel versehentlich doppelt verkauft werden, was zu einer notwendigen, kundenunfreundlichen Stornierung führt."},
        {t:"Schnittstellen (ERP, PIM)",def:"Ein modernes E-Commerce-System besteht selten aus einer einzigen monolithischen Software, sondern aus mehreren spezialisierten Systemen, die über technische Schnittstellen (meist APIs) miteinander verbunden werden. Ein ERP-System (Enterprise Resource Planning) ist die zentrale, unternehmensweite Software zur Planung und Steuerung sämtlicher Ressourcen – Finanzbuchhaltung, Einkauf, Personalwesen, Lagerhaltung – und übernimmt oft die betriebswirtschaftliche 'Wahrheit' über Bestände, Preise und Finanzdaten. Ein PIM-System (Product Information Management) ist demgegenüber spezialisiert auf die zentrale Pflege aller Produktinformationen (Beschreibungen, Bilder, technische Daten, Übersetzungen), die anschließend konsistent an verschiedene Ausgabekanäle (eigener Shop, Marktplätze, gedruckter Katalog) verteilt werden. Die Schnittstelle zwischen Shopsystem und diesen Backend-Systemen sorgt dafür, dass Bestelldaten, Bestände und Produktinformationen automatisch synchron gehalten werden, statt manuell und fehleranfällig mehrfach gepflegt werden zu müssen.",ex:"Sobald eine Bestellung im Online-Shop eingeht, überträgt eine automatisierte ERP-Schnittstelle die Bestelldaten unmittelbar in die Finanzbuchhaltung (für die Rechnungsstellung) und ins Lagersystem (für die Kommissionierung) – ohne diese automatisierte Schnittstelle müsste ein Mitarbeiter jede Bestellung manuell in mehrere Systeme übertragen, was bei hohem Bestellvolumen weder skalierbar noch fehlerfrei wäre."},
        {t:"Produktdatenmanagement",def:"Produktdatenmanagement bezeichnet die zentrale, strukturierte Pflege sämtlicher produktbezogener Informationen – Bezeichnung, Beschreibungstexte, technische Attribute, Bilder, Preise, Übersetzungen in verschiedene Sprachen – an einer einzigen Quelle (Single Source of Truth), von der aus die Daten konsistent an alle verschiedenen Verkaufs- und Kommunikationskanäle verteilt werden, statt an jedem Kanal separat und potenziell widersprüchlich gepflegt zu werden. Diese zentrale Pflege wird umso wichtiger, je mehr Kanäle ein Unternehmen gleichzeitig bespielt (eigener Online-Shop, mehrere Marktplätze mit jeweils eigenen Datenanforderungen, stationäre Filialen, gedruckte Kataloge, internationale Ländershops mit unterschiedlichen Sprachen), da inkonsistente Produktdaten zwischen Kanälen nicht nur Verwirrung bei Kunden, sondern auch rechtliche Risiken (z.B. widersprüchliche Preisangaben) verursachen können. Ein gutes Produktdatenmanagement beschleunigt zudem die Markteinführung neuer Produkte erheblich, da neue Artikel nur einmal zentral angelegt werden müssen, um automatisch auf allen angeschlossenen Kanälen zu erscheinen.",ex:"Ein PIM-System hält die Produktbeschreibung, technischen Daten und Bilder eines Wanderrucksacks zentral gepflegt und verteilt diese automatisch konsistent an den eigenen Online-Shop, den Amazon-Marktplatz-Eintrag und den gedruckten Saisonkatalog – ändert sich eine technische Spezifikation, muss sie nur an einer einzigen Stelle korrigiert werden, statt an drei separaten Systemen."},
        {t:"Omnichannel-Integration",def:"Omnichannel-Integration bezeichnet die technische und organisatorische Verknüpfung aller Vertriebs- und Kommunikationskanäle eines Unternehmens (Online-Shop, stationäre Filialen, mobile App, Marktplätze, Callcenter) zu einem einheitlichen, nahtlos zusammenarbeitenden Gesamtsystem, sodass Kunden unabhängig vom genutzten Kanal ein konsistentes Erlebnis erhalten. Technische Voraussetzung ist ein zentrales, kanalübergreifendes Warenwirtschafts- und Kundendatensystem, das Bestände, Preise, Bestellhistorien und Kundenprofile in Echtzeit über alle Kanäle synchronisiert (Single Customer View und Single Stock View). Erst dadurch werden Omnichannel-Services wie Click & Collect (online bestellen, in der Filiale abholen), Ship-from-Store (Filialen versenden Online-Bestellungen aus ihrem lokalen Bestand, um Lieferzeiten zu verkürzen) oder ein einheitliches, kanalübergreifendes Rückgaberecht praktisch umsetzbar. Ohne eine solche technische Integration bleiben verschiedene Kanäle isolierte, in sich geschlossene Systeme mit potenziell widersprüchlichen Beständen und Kundendaten.",ex:"Ein Kunde bestellt online einen Artikel und wählt die Option, ihn noch am selben Tag in einer nahegelegenen Filiale abzuholen (Click & Collect) – dies funktioniert nur, weil das zentrale Omnichannel-System in Echtzeit den tatsächlichen Bestand genau dieser Filiale kennt und die Bestellung automatisch dorthin zur Kommissionierung weiterleitet, statt aus einem entfernten Zentrallager zu versenden."},
      ],
      quiz:[{q:"Was verwaltet ein Warenwirtschaftssystem primär?",options:["Nur Kundendaten","Bestände, Bestellungen und Lagerbewegungen","Nur Marketing-Kampagnen","Ausschließlich Gehälter"],correct:1,explain:"Ein Warenwirtschaftssystem (WWS) steuert Warenbestände, Ein-/Verkauf und Lagerbewegungen."},{q:"Wofür steht PIM?",options:["Product Information Management","Personal Inventory Method","Payment Integration Module","Product Import Manager"],correct:0,explain:"PIM = Product Information Management, zentrale Verwaltung von Produktdaten."}],
      cards:[{front:"Warenwirtschaftssystem",back:"Software zur Steuerung von Warenbeständen, Bestellungen und Lagerbewegungen."},{front:"ERP",back:"Enterprise Resource Planning – integrierte Unternehmenssoftware für Ressourcenplanung."},{front:"PIM",back:"Product Information Management – zentrale Pflege und Verteilung von Produktdaten."},{front:"Shopsystem",back:"Softwareplattform zum Betrieb eines Online-Shops (z.B. Shopify, Magento, OXID)."}]},

    {id:"s4-app",code:"APP",name:"Webtechnologien und mobile Anwendungen",ects:6,sws:"5",exam:"Portfolioprüfung: E-Klausur 50% + Projektarbeit 50%",desc:"Einführung in Webtechnologien und die Entwicklung von Web- und mobilen Anwendungen.",
      topics:[
        {t:"HTML5 & CSS3",def:"HTML (HyperText Markup Language) ist die grundlegende Auszeichnungssprache des Web und strukturiert Inhalte über verschachtelte Elemente (Tags). HTML5, die aktuelle Version, führte insbesondere semantische Elemente ein (wie header, nav, article, footer), die nicht nur visuell, sondern auch inhaltlich-strukturell kennzeichnen, welche Rolle ein Seitenabschnitt hat – das verbessert sowohl die Zugänglichkeit für Screenreader als auch die Auffindbarkeit durch Suchmaschinen (SEO). CSS (Cascading Style Sheets) ist demgegenüber ausschließlich für die visuelle Gestaltung zuständig: Farben, Schriftarten, Abstände und Layout. CSS3 erweiterte frühere Versionen um mächtige Layout-Systeme wie Flexbox (eindimensionale Anordnung von Elementen) und CSS Grid (zweidimensionale Rasterlayouts) sowie um Media Queries, mit denen sich das Layout abhängig von der Bildschirmgröße des jeweiligen Geräts anpassen lässt (Responsive Design) – ein zentrales Konzept, da heute ein Großteil des Web-Traffics über mobile Endgeräte mit stark unterschiedlichen Bildschirmgrößen erfolgt.",ex:"Ein Online-Shop nutzt ein responsives CSS-Grid-Layout für seinen Produktkatalog: Auf einem großen Desktop-Monitor werden vier Produktkarten pro Zeile nebeneinander angezeigt, während dieselbe HTML-Struktur dank Media Queries auf einem schmalen Smartphone-Bildschirm automatisch auf eine einzige Spalte umbricht, ohne dass horizontal gescrollt werden muss."},
        {t:"JavaScript-Grundlagen",def:"JavaScript ist die Programmiersprache, die Webseiten von statischen Dokumenten in interaktive Anwendungen verwandelt, indem sie direkt im Browser des Nutzers ausgeführt wird. Zentrales Konzept ist das DOM (Document Object Model): eine baumartige, programmatisch zugängliche Repräsentation der HTML-Struktur einer Seite im Speicher des Browsers, die JavaScript zur Laufzeit lesen und verändern kann (DOM-Manipulation) – etwa um Inhalte dynamisch hinzuzufügen, zu entfernen oder zu aktualisieren, ohne die gesamte Seite neu vom Server laden zu müssen. Ereignissteuerung (Event Handling) erlaubt es, auf Nutzerinteraktionen wie Klicks, Tastatureingaben oder Formularabsendungen zu reagieren, indem bestimmte Funktionen (Event Listener) registriert werden, die automatisch ausgeführt werden, sobald das entsprechende Ereignis eintritt. Moderne JavaScript-Anwendungen nutzen zudem asynchrone Programmierung (z.B. über Promises oder async/await), um Daten von einem Server nachzuladen, ohne währenddessen die gesamte Benutzeroberfläche zu blockieren.",ex:"Klickt ein Kunde auf den 'In den Warenkorb'-Button eines Produkts, registriert JavaScript diesen Klick über einen Event Listener, aktualisiert sofort die Warenkorb-Anzeige im DOM (ohne die Seite neu zu laden) und sendet parallel asynchron eine Anfrage an den Server, um den Warenkorbinhalt auch serverseitig zu speichern."},
        {t:"React-Basics",def:"React ist eine von Meta entwickelte, weit verbreitete JavaScript-Bibliothek zum Bau von Benutzeroberflächen nach einem komponentenbasierten Ansatz: Eine komplexe Oberfläche wird in kleinere, in sich geschlossene, wiederverwendbare Bausteine (Komponenten) zerlegt, die jeweils ihr eigenes Aussehen und Verhalten kapseln und beliebig oft an unterschiedlichen Stellen der Anwendung wiederverwendet werden können. React nutzt dabei ein virtuelles DOM: Änderungen werden zunächst in einer schnellen, im Speicher gehaltenen Kopie der Seitenstruktur berechnet, bevor React effizient nur die tatsächlich notwendigen, minimalen Änderungen am echten Browser-DOM vornimmt – das verbessert die Performance gegenüber direkter, unstrukturierter DOM-Manipulation erheblich. Über den sogenannten State (Zustand) können Komponenten sich veränderliche Daten merken (z.B. wie viele Artikel im Warenkorb liegen), und ändert sich dieser State, aktualisiert React automatisch alle betroffenen Teile der Benutzeroberfläche, ohne dass der Entwickler die DOM-Aktualisierung manuell steuern muss (deklaratives Programmiermodell).",ex:"Statt für jedes einzelne Produkt im Katalog eigenen, dupliziert geschriebenen HTML-Code zu pflegen, definiert ein Entwicklerteam eine einzige ProductCard-Komponente, die Produktname, Bild und Preis als Parameter (Props) entgegennimmt, und rendert diese eine Komponente anschließend hundertfach mit jeweils unterschiedlichen Produktdaten – ändert sich später das visuelle Design einer Produktkarte, muss der Code nur an dieser einen zentralen Stelle angepasst werden."},
        {t:"XML/JSON & REST/HTTP",def:"XML (Extensible Markup Language) und JSON (JavaScript Object Notation) sind beides textbasierte Datenformate zum strukturierten Austausch von Daten zwischen Systemen, wobei sich JSON aufgrund seiner deutlich kompakteren, leichter lesbaren Syntax (verschachtelte Schlüssel-Wert-Paare) in modernen Web-APIs weitgehend gegenüber dem älteren, verbose-eren XML durchgesetzt hat. REST (Representational State Transfer) ist ein weit verbreiteter Architekturstil zur Gestaltung von Web-APIs, bei dem Ressourcen (z.B. ein Produkt, eine Bestellung) über eindeutige URLs adressiert werden und mit standardisierten HTTP-Methoden bearbeitet werden: GET liest eine Ressource aus, POST erstellt eine neue Ressource, PUT/PATCH aktualisiert eine bestehende Ressource, DELETE löscht sie. HTTP-Statuscodes signalisieren dabei standardisiert den Ausgang einer Anfrage (200 für Erfolg, 404 für nicht gefunden, 500 für Serverfehler). Diese Standardisierung erlaubt es, dass völlig unterschiedliche Systeme (z.B. ein Online-Shop und ein externer Versanddienstleister) unabhängig von ihrer jeweiligen internen Technologie zuverlässig miteinander kommunizieren können.",ex:"Ein Online-Shop ruft per GET-Anfrage an eine REST-API des Versanddienstleisters den aktuellen Sendungsstatus eines Pakets ab; die Antwort kommt im JSON-Format zurück, z.B. {\"status\": \"zugestellt\", \"datum\": \"2026-06-28\"}, und der Shop zeigt diese Information direkt im Kundenkonto an, ohne dass der Kunde die Website des Versanddienstleisters separat besuchen muss."},
        {t:"Mobile Web & Sicherheit",def:"Mobile Webentwicklung berücksichtigt die spezifischen Anforderungen kleinerer Bildschirme und touchbasierter Bedienung: größere, leichter antippbare Bedienelemente (empfohlene Mindestgröße oft 44×44 Pixel), vereinfachte Navigation, reduzierte Datenmengen für langsamere mobile Verbindungen sowie die Berücksichtigung von Touch-Gesten (Wischen, Zoomen mit zwei Fingern) statt reiner Maussteuerung. Im Bereich Websicherheit ist HTTPS (die verschlüsselte Version von HTTP, technisch realisiert über TLS-Zertifikate) heute Grundvoraussetzung für jede seriöse Website, insbesondere für Formulare mit sensiblen Daten wie Zahlungsinformationen, da HTTPS die Kommunikation zwischen Browser und Server vor Abhören und Manipulation durch Dritte schützt. Input-Validierung – sowohl clientseitig (im Browser, für schnelles Nutzerfeedback) als auch zwingend serverseitig (da clientseitige Prüfungen umgangen werden können) – verhindert, dass fehlerhafte oder böswillig manipulierte Eingaben (z.B. SQL-Injection- oder Cross-Site-Scripting-Angriffe) das System kompromittieren.",ex:"Eine mobile Checkout-Seite verwendet großzügig dimensionierte, gut mit dem Daumen antippbare Buttons für 'Weiter' und 'Jetzt kaufen', übermittelt sämtliche eingegebenen Zahlungsdaten ausschließlich über eine HTTPS-verschlüsselte Verbindung und validiert serverseitig streng, dass eine eingegebene Kreditkartennummer tatsächlich dem erwarteten Format entspricht, bevor sie überhaupt an den Zahlungsdienstleister weitergeleitet wird."},
      ],
      quiz:[{q:"Welches Datenformat wird häufig bei REST-APIs verwendet?",options:["JSON","MP3","EXE","CSV ausschließlich"],correct:0,explain:"JSON ist das Standard-Datenaustauschformat für REST-APIs."},{q:"Wofür steht CSS?",options:["Computer Style Sheets","Cascading Style Sheets","Central System Styling","Coded Style Syntax"],correct:1,explain:"CSS = Cascading Style Sheets, zur Gestaltung von HTML-Dokumenten."},{q:"Was ist React?",options:["Eine Datenbank","Ein JavaScript-Framework für Benutzeroberflächen","Ein Servertyp","Ein Bildformat"],correct:1,explain:"React ist eine JavaScript-Bibliothek von Meta zum Bau von UI-Komponenten."}],
      cards:[{front:"HTML5",back:"Aktuelle Version der Auszeichnungssprache zur Strukturierung von Webinhalten."},{front:"REST-API",back:"Architekturstil für Webservices, die über HTTP mit Ressourcen interagieren."},{front:"JSON",back:"JavaScript Object Notation – leichtgewichtiges Datenformat für den Datenaustausch."},{front:"React",back:"JavaScript-Bibliothek zum Bau komponentenbasierter Benutzeroberflächen."},{front:"Responsive Design",back:"Gestaltungsansatz, der Webseiten an verschiedene Bildschirmgrößen anpasst."}]},
  ]},
  {nr:5,title:"E-Commerce-Geschäftsmodelle, Marktforschung & Wahlmodule",ects:30,modules:[
    {id:"s5-ebm",code:"EBM",name:"Geschäftsmodelle im E-Commerce",ects:6,sws:"5",exam:"Entwurf 5 Min. · 50% + Vortrag 10 Min. · 50%",desc:"Vertiefte Analyse von Geschäftsmodellen im E-Commerce.",
      topics:[
        {t:"Geschäftsmodell-Innovation",def:"Geschäftsmodell-Innovation verändert gezielt einzelne oder mehrere Bausteine eines bestehenden Geschäftsmodells – etwa die Erlösquelle, den Vertriebskanal, die Zielgruppe oder die Art der Wertschöpfung – um neuen, differenzierenden Kundennutzen zu schaffen, ohne notwendigerweise ein technologisch neues Produkt zu entwickeln. Im Gegensatz zur reinen Produktinnovation (ein neues oder verbessertes physisches Produkt) verändert Geschäftsmodell-Innovation die grundlegende Art und Weise, wie ein Unternehmen Wert schafft, an Kunden liefert und dafür Erlöse erzielt. Typische Innovationsmuster sind der Wechsel von Einmalkäufen zu wiederkehrenden Erlösmodellen (Abo statt Kauf), die Verlagerung von reinem Produktverkauf zu ergänzenden Dienstleistungen (Product-as-a-Service), das Hinzufügen einer Plattformkomponente zu einem bislang linearen Geschäft, oder die Erschließung neuer Kundensegmente durch radikal vereinfachte, günstigere Angebotsvarianten. Geschäftsmodell-Innovation gilt oft als nachhaltiger wettbewerbsfähiger als reine Produktinnovation, weil sie von Konkurrenten schwerer kurzfristig kopierbar ist.",ex:"Ein klassischer Büromöbelhändler, der bislang nur Einmalverkäufe tätigte, führt ein monatliches Abo-Modell ein, bei dem Unternehmen Büromöbel gegen eine laufende Gebühr mieten statt kaufen, inklusive Wartung und flexiblem Austausch bei wachsendem oder schrumpfendem Personalbestand – dieselbe physische Ware wird durch ein neues Erlösmodell für eine neue Kundengruppe (kleine, wachsende Startups ohne hohes Investitionskapital) attraktiv."},
        {t:"Erlösmodelle (Abo, Freemium, Marketplace)",def:"Erlösmodelle definieren, auf welche konkrete Art und Weise ein Unternehmen aus seinem Wertangebot tatsächlich Geld verdient, und beeinflussen maßgeblich Cashflow-Struktur, Kundenbindung und Skalierbarkeit eines Geschäfts. Das Abonnement-Modell erzielt wiederkehrende, planbare Zahlungen (meist monatlich oder jährlich) für dauerhaften Zugang zu einem Produkt oder Service, was besonders stabile, vorhersehbare Umsätze (Recurring Revenue) und eine enge, langfristige Kundenbeziehung ermöglicht. Das Freemium-Modell bietet eine kostenlose Basisversion mit eingeschränktem Funktionsumfang an, um eine große Nutzerbasis aufzubauen, und monetarisiert anschließend nur einen kleinen Anteil dieser Nutzer über kostenpflichtige Zusatzfunktionen (Premium-Features) – der Erfolg hängt stark von einer ausreichend hohen Konversionsrate von kostenlosen zu zahlenden Nutzern ab. Das Marketplace-Modell erzielt Erlöse nicht durch eigenen Warenverkauf, sondern durch Provisionen oder Gebühren auf Transaktionen unabhängiger Drittanbieter, die über die eigene Plattform verkaufen – hier liegt der wirtschaftliche Hebel primär im Transaktionsvolumen, nicht in eigener Wertschöpfung.",ex:"Netflix erzielt seine Erlöse ausschließlich über monatliche Abogebühren (Abo-Modell) und profitiert von planbaren, wiederkehrenden Einnahmen; Spotify kombiniert eine werbefinanzierte Gratisversion mit einem kostenpflichtigen Premium-Abo ohne Werbung (Freemium); Etsy verdient dagegen nicht am eigenen Produktverkauf, sondern über eine Provision auf jeden Verkauf unabhängiger Kunsthandwerker, die die Plattform als Vertriebskanal nutzen (Marketplace-Modell)."},
        {t:"Skalierung digitaler Geschäftsmodelle",def:"Skalierbarkeit bezeichnet die Fähigkeit eines Geschäftsmodells, den Umsatz deutlich stärker zu steigern als die dafür notwendigen Kosten – im Idealfall sinken die durchschnittlichen Kosten pro zusätzlichem Kunden sogar, je größer das Unternehmen wird (sinkende Grenzkosten, Skaleneffekte). Digitale Geschäftsmodelle skalieren häufig besonders gut, weil die Grenzkosten für einen zusätzlichen digitalen Nutzer (z.B. ein weiterer Software-Nutzer oder Streaming-Abonnent) nahe null liegen, sobald die initiale Entwicklungsinvestition einmal getätigt wurde – anders als bei physischen Produkten, bei denen jede zusätzliche Einheit spürbare Grenzkosten für Material, Produktion und Versand verursacht. Wichtige Voraussetzungen für erfolgreiche Skalierung sind eine technisch robuste, für hohe Nutzerzahlen ausgelegte Infrastruktur, standardisierte (nicht individuell anzupassende) Prozesse sowie ein Geschäftsmodell, das nicht linear mit der Personalstärke wächst. Nicht jedes digitale Geschäft skaliert automatisch gut – Modelle mit hohem individuellem Beratungs- oder Serviceaufwand pro Kunde stoßen trotz digitaler Grundlage schneller an Skalierungsgrenzen.",ex:"Ein B2B-Software-Abo-Anbieter gewinnt 10.000 neue zahlende Kunden hinzu, ohne dafür proportional mehr Personal einstellen zu müssen, da die Software bereits entwickelt ist und jeder zusätzliche Nutzer nur minimale zusätzliche Serverkosten verursacht – der Umsatz wächst dadurch deutlich schneller als die Kostenbasis, was die Gewinnmarge mit zunehmender Größe strukturell verbessert."},
        {t:"Fallstudienanalyse erfolgreicher E-Commerce-Modelle",def:"Die Fallstudienanalyse (Case Study Analysis) ist eine strukturierte Methode, um aus der detaillierten Untersuchung realer, bereits erfolgreicher (oder auch gescheiterter) Unternehmen übertragbare Erfolgsfaktoren, Muster und Lehren abzuleiten, statt Geschäftsmodelle rein theoretisch zu entwickeln. Eine methodisch saubere Fallstudienanalyse untersucht typischerweise systematisch: die anfängliche Ausgangssituation und das ursprüngliche Problem, das gelöst werden sollte; die konkreten strategischen Entscheidungen, die getroffen wurden (und die Alternativen, die verworfen wurden); die tatsächlich erzielten quantitativen und qualitativen Ergebnisse; sowie kritisch, welche Faktoren tatsächlich ursächlich für den Erfolg waren im Gegensatz zu Faktoren, die lediglich zufällig oder marktspezifisch begünstigend wirkten (Survivorship Bias – man sieht meist nur die erfolgreichen Fälle, nicht die vielen gescheiterten Unternehmen mit ähnlicher Strategie). Eine gute Fallstudienanalyse hinterfragt daher stets, ob ein beobachtetes Erfolgsmuster tatsächlich kausal übertragbar ist oder nur im spezifischen Kontext dieses einen Unternehmens funktionierte.",ex:"Eine Fallstudie zu Zalando untersucht systematisch, wie die frühzeitige Einführung kostenloser Retouren und einer sehr langen Rückgabefrist das Vertrauen und damit die Konversionsrate bei online gekaufter Mode signifikant steigerte – gleichzeitig hinterfragt eine gute Analyse kritisch, ob dieses Modell auch für kleinere Händler mit geringerer Marktmacht und schwächerer Verhandlungsposition gegenüber Logistikpartnern in gleicher Weise wirtschaftlich tragfähig wäre."},
      ],
      quiz:[{q:"Was ist ein Freemium-Modell?",options:["Alles kostenpflichtig","Basisversion kostenlos, Zusatzfunktionen kostenpflichtig","Nur Werbefinanzierung","Einmalzahlung ohne Abo"],correct:1,explain:"Freemium = kostenlose Basisversion, Premium-Funktionen gegen Bezahlung."},{q:"Was kennzeichnet ein skalierbares Geschäftsmodell?",options:["Umsatz wächst linear mit Personal","Umsatz wächst überproportional zu den Kosten","Nur regional begrenzt","Erfordert viel manuelle Arbeit pro Kunde"],correct:1,explain:"Skalierbarkeit bedeutet, dass Wachstum nicht proportional mehr Ressourcen erfordert."}],
      cards:[{front:"Freemium",back:"Geschäftsmodell mit kostenloser Basisversion und kostenpflichtigen Zusatzfunktionen."},{front:"Skalierbarkeit",back:"Fähigkeit eines Geschäftsmodells, Umsatz überproportional zu den Kosten zu steigern."},{front:"Marketplace-Modell",back:"Plattform, die Drittanbieter und Käufer zusammenbringt und Provision erhält."}]},

    {id:"s5-edv",code:"EDV I",name:"Marktforschung – Statistische Auswertung mit SPSS",ects:6,sws:"4",exam:"E-Assessment 15 Min. · 30% + Vortrag 15 Min. · 70%",desc:"Praktische Marktforschung mit dem Statistikprogramm SPSS.",
      topics:[
        {t:"Fragebogendesign & Datenerhebung",def:"Ein methodisch sauberes Fragebogendesign ist die Grundvoraussetzung für belastbare Marktforschungsergebnisse. Zentrale Prinzipien sind: die Vermeidung suggestiver oder wertender Formulierungen, die Befragte unbewusst zu einer bestimmten Antwort lenken (z.B. 'Wie sehr gefällt Ihnen unser hervorragender Service?' statt neutral 'Wie bewerten Sie unseren Service?'); klare, eindeutige und für alle Befragten gleich verständliche Fragen ohne Fachjargon oder Doppeldeutigkeiten; die Verwendung geeigneter Antwortskalen, insbesondere der Likert-Skala (meist 5- oder 7-stufig, von starker Ablehnung bis starker Zustimmung), die feinere Abstufungen als reine Ja/Nein-Fragen erlaubt. Bei der Datenerhebung ist zudem die Repräsentativität der Stichprobe entscheidend: Nur wenn die befragte Gruppe in ihren relevanten Merkmalen (Alter, Geschlecht, Kaufverhalten) der interessierenden Grundgesamtheit ähnelt, lassen sich die Ergebnisse überhaupt verallgemeinern – eine unrepräsentative, verzerrte Stichprobe (z.B. nur besonders zufriedene Bestandskunden) führt zu irreführenden Schlussfolgerungen, egal wie sorgfältig der Fragebogen selbst gestaltet ist.",ex:"Eine Kundenzufriedenheitsumfrage nutzt eine 5-stufige Likert-Skala von 'sehr unzufrieden' über 'neutral' bis 'sehr zufrieden' statt einer reinen Ja/Nein-Frage, um feinere Abstufungen der Zufriedenheit zu erfassen, und stellt durch zufällige Auswahl der Befragten aus der gesamten Kundendatenbank (statt nur aktiver Vielkäufer) sicher, dass auch unzufriedene oder inaktive Kunden angemessen repräsentiert sind."},
        {t:"Datenaufbereitung in SPSS",def:"Bevor Rohdaten aus einer Umfrage statistisch ausgewertet werden können, müssen sie in SPSS (Statistical Package for the Social Sciences, einer der verbreitetsten Statistik-Software für Sozial- und Marktforschung) systematisch aufbereitet werden. Der Prozess umfasst typischerweise: das Einlesen der Rohdaten (oft aus Excel- oder CSV-Exporten von Online-Umfragetools), die Kodierung von Textantworten in numerische Werte, mit denen statistische Verfahren rechnen können (z.B. 'weiblich' = 1, 'männlich' = 2), die Datenbereinigung, bei der widersprüchliche, unplausible oder eindeutig fehlerhafte Antworten identifiziert und behandelt werden, sowie den systematischen Umgang mit fehlenden Werten (fehlt eine Antwort, weil eine Frage übersprungen wurde, oder wurde sie bewusst verweigert – beides muss unterschiedlich kodiert und in der späteren Analyse berücksichtigt werden, um die Ergebnisse nicht zu verzerren). Erst nach dieser sorgfältigen Aufbereitung liefern nachfolgende statistische Berechnungen verlässliche und interpretierbare Ergebnisse.",ex:"Bei der Auswertung einer Kundenumfrage werden Antworten, bei denen Befragte eine Pflichtfrage zum Einkommen übersprungen haben, in SPSS explizit als 'fehlender Wert' (Missing Value) markiert statt versehentlich als 0 interpretiert zu werden – würde man sie fälschlich als 0 behandeln, würde der berechnete Durchschnittswert für das Einkommen systematisch und irreführend nach unten verzerrt."},
        {t:"Deskriptive Auswertung",def:"Die deskriptive Auswertung fasst die erhobenen Umfragedaten mit Kennzahlen und visuellen Darstellungen so zusammen, dass sich Muster und Verteilungen auf einen Blick erfassen lassen, bevor komplexere statistische Tests durchgeführt werden. Typische deskriptive Kennzahlen sind Häufigkeitsverteilungen (wie oft welche Antwortkategorie gewählt wurde, meist als Prozentangabe), Mittelwerte und Mediane für numerische Fragen (z.B. durchschnittliche Zufriedenheitsbewertung), sowie Streuungsmaße, die zeigen, wie einheitlich oder gespalten die Meinungen der Befragten tatsächlich sind. Visuelle Darstellungen wie Balkendiagramme (für kategoriale Daten wie Altersgruppen), Kreisdiagramme (für Anteilsverhältnisse) oder Histogramme (für die Verteilung numerischer Werte) erleichtern es, Ergebnisse auch fachfremden Stakeholdern verständlich zu kommunizieren. Die deskriptive Auswertung liefert dabei noch keine Aussage darüber, ob beobachtete Unterschiede statistisch bedeutsam oder zufällig sind – dafür sind nachgelagerte Signifikanztests notwendig.",ex:"SPSS erstellt automatisch ein Balkendiagramm zur Altersverteilung der befragten Online-Käufer, das auf einen Blick zeigt, dass die Altersgruppe 25–34 Jahre mit 38% deutlich überrepräsentiert ist gegenüber älteren Altersgruppen – eine Erkenntnis, die das Marketingteam direkt nutzt, um Werbebotschaften gezielter auf diese dominante Zielgruppe zuzuschneiden."},
        {t:"Signifikanztests in SPSS",def:"Signifikanztests prüfen mithilfe von SPSS statistisch, ob ein in den Umfragedaten beobachteter Unterschied zwischen Gruppen (z.B. zwischen Männern und Frauen, oder zwischen zwei Werbevarianten) tatsächlich in der Grundgesamtheit existiert oder lediglich zufälliger Stichprobenschwankung geschuldet ist. Der t-Test vergleicht die Mittelwerte zweier Gruppen (z.B. durchschnittliche Zahlungsbereitschaft von Männern vs. Frauen) und prüft, ob der beobachtete Unterschied statistisch signifikant ist. Die Varianzanalyse (ANOVA) erweitert dieses Prinzip auf den Vergleich von mehr als zwei Gruppen gleichzeitig (z.B. drei oder mehr Altersgruppen). Der Chi-Quadrat-Test prüft dagegen Zusammenhänge zwischen kategorialen Variablen (z.B. ob die Präferenz für eine Zahlungsart vom Wohnort abhängt). In allen Fällen liefert SPSS einen p-Wert, der mit dem vorab festgelegten Signifikanzniveau (meist 5%) verglichen wird, um zu entscheiden, ob der beobachtete Unterschied als statistisch abgesichert gilt oder nicht.",ex:"Ein t-Test in SPSS vergleicht die durchschnittliche Zahlungsbereitschaft für ein Premium-Produkt zwischen männlichen und weiblichen Befragten und liefert einen p-Wert von 0,21 – da dieser deutlich über der 5%-Signifikanzschwelle liegt, muss die Nullhypothese ('kein Unterschied zwischen den Geschlechtern') beibehalten werden, der beobachtete kleine Unterschied in der Stichprobe gilt somit als statistisch nicht signifikant und vermutlich zufällig."},
        {t:"Ergebnisinterpretation & Präsentation",def:"Die abschließende Phase jeder Marktforschungsstudie besteht darin, komplexe statistische Kennwerte und Testergebnisse in klare, verständliche und handlungsleitende Aussagen für Entscheidungsträger zu übersetzen, die selbst meist keine statistische Ausbildung haben. Dabei gilt es, mehrere typische Fehlerquellen zu vermeiden: statistische Signifikanz nicht mit praktischer Relevanz zu verwechseln (ein winziger, aber signifikanter Unterschied kann geschäftlich bedeutungslos sein), Korrelationen nicht vorschnell als Kausalität zu interpretieren, sowie Ergebnisse nicht über den tatsächlich untersuchten Kontext hinaus zu verallgemeinern. Eine gute Ergebnispräsentation stellt die zentrale Erkenntnis zuerst voran (statt sich in methodischen Details zu verlieren), visualisiert Kernaussagen mit einfachen, aussagekräftigen Diagrammen und leitet aus den Daten konkrete, umsetzbare Handlungsempfehlungen ab, statt nur nackte Zahlen zu präsentieren.",ex:"Aus der statistisch signifikanten Erkenntnis, dass Kunden mit Warenkorbwerten unter 50 € eine deutlich höhere Kaufabbruchrate aufweisen, sobald Versandkosten angezeigt werden, leitet das Marketingteam die konkrete, unmittelbar umsetzbare Handlungsempfehlung ab, kostenlosen Versand ab einem Mindestbestellwert von 50 € einzuführen – eine für die Geschäftsführung sofort verständliche und handlungsorientierte Übersetzung der zugrundeliegenden statistischen Analyse."},
      ],
      quiz:[{q:"Wofür wird SPSS hauptsächlich genutzt?",options:["Bildbearbeitung","Statistische Datenauswertung","Buchhaltung","Videoschnitt"],correct:1,explain:"SPSS ist eine Software speziell für statistische Datenanalyse in der Marktforschung."},{q:"Was ist eine Voraussetzung für valide Marktforschungsergebnisse?",options:["Möglichst kleine Stichprobe","Repräsentative Stichprobe","Nur Freunde befragen","Keine Fragebögen nötig"],correct:1,explain:"Eine repräsentative Stichprobe ist entscheidend für verallgemeinerbare Ergebnisse."}],
      cards:[{front:"SPSS",back:"Statistiksoftware (Statistical Package for the Social Sciences) für Datenauswertung."},{front:"Stichprobe",back:"Teilmenge einer Grundgesamtheit, die für eine Untersuchung befragt/analysiert wird."},{front:"Signifikanztest",back:"Statistisches Verfahren zur Prüfung, ob ein Ergebnis zufällig oder bedeutsam ist."},{front:"Likert-Skala",back:"Bewertungsskala (z.B. 1-5) zur Messung von Einstellungen in Umfragen."}]},

    {id:"s5-scsm",code:"SCSM",name:"Social Commerce und Social Media",ects:6,sws:"5",exam:"Entwurf (5 S.) · 50% + Vortrag 20 Min. · 50%",desc:"Verkauf und Marketing über soziale Medien und Social-Commerce-Plattformen.",
      topics:[
        {t:"Social-Media-Plattformen im Vergleich",def:"Social-Media-Plattformen unterscheiden sich fundamental in Nutzerdemografie, bevorzugtem Inhaltsformat und den zugrundeliegenden Empfehlungsalgorithmen, weshalb eine erfolgreiche Social-Media-Strategie plattformspezifisch statt einheitlich gestaltet werden muss. Instagram ist primär visuell geprägt (Fotos, kurze Videos/Reels, Stories) und eignet sich besonders für ästhetisch ansprechende Produktkategorien wie Mode, Beauty oder Lifestyle. TikTok setzt auf kurze, algorithmisch stark personalisierte Videoinhalte mit sehr hoher viraler Reichweitenchance auch für Accounts ohne große bestehende Followerschaft, bevorzugt eine jüngere Zielgruppe und einen unterhaltsamen, unpolierten Stil. LinkedIn ist auf berufliche Inhalte und B2B-Kommunikation fokussiert und eignet sich für Geschäftskunden-Marketing, Employer Branding und Fachwissen-Content. Facebook erreicht demgegenüber eine im Schnitt ältere Zielgruppe und eignet sich gut für zielgruppengenaue bezahlte Werbung dank umfangreicher Targeting-Optionen. Die Wahl der richtigen Plattform(en) sollte sich konsequent an der tatsächlichen Zielgruppe und dem Produkttyp orientieren, statt einfach jede populäre Plattform gleichermaßen zu bespielen.",ex:"Ein Modehändler mit junger Zielgruppe investiert sein Content-Budget primär in Instagram (ästhetische Produktfotos, Reels) und TikTok (unterhaltsame Outfit-Videos), während ein B2B-Software-Anbieter für Warenwirtschaftssysteme fast ausschließlich auf LinkedIn setzt, um Einkaufsentscheider in Unternehmen mit Fachcontent zu erreichen."},
        {t:"Influencer-Marketing",def:"Influencer-Marketing nutzt Personen mit einer glaubwürdigen, engagierten Reichweite in sozialen Medien, um Produkte oder Marken auf eine authentischere, weniger werbliche Weise zu bewerben, als es klassische Anzeigenwerbung leisten kann. Man unterscheidet nach Reichweitengröße mehrere Kategorien: Mega- und Makro-Influencer (mehrere hunderttausend bis Millionen Follower, hohe Reichweite, aber oft geringere prozentuale Engagement-Rate und hohe Kooperationskosten), Micro-Influencer (typischerweise 10.000 bis 100.000 Follower, oft thematisch fokussiert auf eine Nische, mit deutlich höherer Vertrauensbindung und Engagement-Rate innerhalb ihrer Community) sowie Nano-Influencer (unter 10.000 Follower, sehr persönliche, glaubwürdige Beziehung zu ihren Followern). Die Wahl zwischen wenigen reichweitenstarken oder vielen kleineren, thematisch passenden Influencern hängt vom Kampagnenziel ab: Für breite Markenbekanntheit eignen sich eher Makro-Influencer, für Vertrauensaufbau und tatsächliche Konversionen oft ein Netzwerk vieler Micro-Influencer. Transparenz ist rechtlich zwingend: Bezahlte Kooperationen müssen als Werbung gekennzeichnet werden.",ex:"Statt eine einzelne, teure Kooperation mit einem reichweitenstarken Mega-Influencer einzugehen, arbeitet ein Beauty-Startup gezielt mit zwanzig thematisch passenden Micro-Influencern zusammen, die das Produkt in authentischen Unboxing- und Anwendungsvideos vorstellen – die Summe der kleineren, aber hoch engagierten Communities erzeugt oft eine glaubwürdigere und kosteneffizientere Wirkung als eine einzelne Großkampagne."},
        {t:"Social-Commerce-Features (Shop-Tags, Live-Shopping)",def:"Social Commerce bezeichnet die direkte Integration von Kauffunktionen in soziale Medien, sodass der gesamte oder zumindest der überwiegende Teil des Kaufprozesses innerhalb der Social-Media-App selbst abläuft, statt Nutzer auf eine externe Website weiterzuleiten – dadurch wird die Reibung zwischen Produktentdeckung und Kaufabschluss minimiert. Shop-Tags (z.B. Instagram Shopping) verlinken Produkte direkt in Fotos oder Videos, sodass Nutzer per Antippen sofort Preis und Kaufoption sehen. Live-Shopping überträgt das aus Teleshopping bekannte Format ins digitale Zeitalter: Ein Host präsentiert Produkte in einem Live-Video-Stream, beantwortet Fragen der Zuschauer in Echtzeit im Chat und Zuschauer können die gezeigten Produkte unmittelbar während der Übertragung kaufen – dieses Format erzeugt durch die Live-Interaktion und oft zeitlich begrenzte Angebote ein starkes Gefühl von Dringlichkeit und Community. Diese Formate sind besonders in asiatischen Märkten (allen voran China) bereits stark etabliert und gewinnen auch in westlichen Märkten zunehmend an Bedeutung.",ex:"Bei einer Instagram-Live-Shopping-Session präsentiert eine Marke live neue Produkte, beantwortet direkt im Chat Fragen zu Größen und Materialien, und Zuschauer können die gerade gezeigten Artikel per Klick auf einen eingeblendeten Shop-Tag sofort kaufen, ohne die App zu verlassen oder auf eine externe Website weitergeleitet zu werden."},
        {t:"Content-Strategie & Community-Management",def:"Eine Content-Strategie plant systematisch, welche Themen, Formate und Frequenzen von Inhalten auf welchen Kanälen veröffentlicht werden, um konsistent auf übergeordnete Marketingziele (Markenbekanntheit, Engagement, Konversion) einzuzahlen, statt Inhalte spontan und unkoordiniert zu veröffentlichen. Ein Redaktionsplan (Content-Kalender) legt dabei im Voraus fest, welche Art von Content an welchem Wochentag erscheint, um eine ausgewogene Mischung verschiedener Content-Typen (z.B. Produktvorstellungen, Behind-the-Scenes-Einblicke, nutzergenerierte Inhalte, unterhaltsame Formate) sicherzustellen und die Content-Produktion planbar zu organisieren. Community-Management ergänzt die reine Inhaltsproduktion um den aktiven, zeitnahen Dialog mit der Zielgruppe: Kommentare beantworten, auf Direktnachrichten reagieren, sowohl positives als auch kritisches Feedback konstruktiv aufgreifen und dadurch eine loyale, engagierte Community aufbauen. Ein professionelles Community-Management etabliert zudem klare interne Richtlinien (Tonalität, Reaktionszeiten, Umgang mit negativen Kommentaren oder Shitstorms), um auch in schwierigen Situationen konsistent und professionell zu reagieren.",ex:"Ein Redaktionsplan eines Online-Shops legt fest: Montags erscheint neuer Produkt-Content, mittwochs ein Behind-the-Scenes-Einblick ins Team, freitags eine Kunden-Erfolgsgeschichte (Social Proof) – durch diese geplante Abwechslung wirkt der Kanal weder rein werblich noch beliebig, und das Community-Management-Team reagiert innerhalb von maximal zwei Stunden auf jede Kundenanfrage in den Kommentaren."},
        {t:"Performance-Messung Social Ads",def:"Die Erfolgsmessung bezahlter Social-Media-Werbung (Social Ads) stützt sich auf mehrere komplementäre Kennzahlen, die jeweils unterschiedliche Aspekte des Kampagnenerfolgs abbilden und gemeinsam betrachtet werden müssen, da keine einzelne Kennzahl allein aussagekräftig ist. Die Reichweite zeigt, wie viele individuelle Nutzer eine Anzeige gesehen haben. Die Klickrate (Click-Through-Rate, CTR) misst den Anteil der Betrachter, die tatsächlich auf die Anzeige geklickt haben, und gibt Aufschluss über die Attraktivität von Bild/Video und Werbetext. Die Kosten pro Klick (CPC) und die Kosten pro Conversion (CPA – Cost per Acquisition) zeigen, wie wirtschaftlich effizient eine Kampagne tatsächlich Kunden oder Verkäufe generiert. Entscheidend ist dabei, den gesamten Trichter (Funnel) zu betrachten statt einzelner isolierter Kennzahlen: Eine Anzeige mit niedriger CTR kann dennoch hocheffizient sein, wenn die wenigen tatsächlichen Klicks überdurchschnittlich oft zu einem Kauf führen (hohe Konversionsrate), während eine Anzeige mit sehr hoher CTR, aber kaum Konversionen, in Wahrheit ineffizient Werbebudget verbrennt.",ex:"Eine Social-Ad-Kampagne erzielt nur eine unterdurchschnittliche Klickrate von 0,8%, konvertiert aber 12% der Klicks tatsächlich zu einem Kauf (weit über dem Branchendurchschnitt von 3%) – trotz der niedrigen CTR ist diese Kampagne wirtschaftlich hocheffizient, weil sie eine sehr präzise, kaufbereite Zielgruppe anspricht, was sich erst bei gemeinsamer Betrachtung von CTR und Conversion Rate zeigt."},
      ],
      quiz:[{q:"Was ist Social Commerce?",options:["Rein organische Werbung ohne Kaufoption","Kaufabwicklung direkt innerhalb sozialer Medien","Nur B2B-Handel","Offline-Verkauf mit Social-Media-Werbung"],correct:1,explain:"Social Commerce ermöglicht den Kaufabschluss direkt innerhalb der Social-Media-Plattform."},{q:"Was ist ein Micro-Influencer?",options:["Influencer mit sehr großer Reichweite (>1 Mio.)","Influencer mit kleinerer, aber engagierter Followerschaft","Ein Bot-Account","Ein Unternehmenskonto"],correct:1,explain:"Micro-Influencer haben kleinere, aber oft sehr engagierte und thematisch fokussierte Communities."}],
      cards:[{front:"Social Commerce",back:"Kaufabwicklung direkt innerhalb sozialer Netzwerke (z.B. Instagram Shopping)."},{front:"Influencer-Marketing",back:"Kooperation mit reichweitenstarken Personen zur Produktbewerbung."},{front:"Engagement Rate",back:"Kennzahl für Interaktionen (Likes, Kommentare) im Verhältnis zur Reichweite."},{front:"Live-Shopping",back:"Live-Videoformat, in dem Produkte in Echtzeit vorgestellt und direkt gekauft werden können."}]},

    {id:"s5-wahl1",code:"Wahlmodul 1",name:"Wahlmodul (frei wählbar)",ects:6,sws:"4",exam:"Je nach gewähltem Modul",desc:"Ein frei wählbares Modul aus dem Wahlkatalog (siehe Wahlmodul-Verzeichnis).",
      topics:[{t:"Wahlpflichtbereich",def:"Du wählst eines von über 30 Wahlmodulen aus dem HRW-Katalog – von KI über UX Design bis Retail Management.",ex:"Siehe das anklickbare Wahlmodul-Verzeichnis am Ende dieser Seite für alle Optionen und Lerninhalte."}],
      quiz:[],
      cards:[]},

    {id:"s5-wahl2",code:"Wahlmodul 2",name:"Wahlmodul (frei wählbar)",ects:6,sws:"4",exam:"Je nach gewähltem Modul",desc:"Ein frei wählbares Modul aus dem Wahlkatalog (siehe Wahlmodul-Verzeichnis).",
      topics:[{t:"Wahlpflichtbereich",def:"Du wählst eines von über 30 Wahlmodulen aus dem HRW-Katalog – von KI über UX Design bis Retail Management.",ex:"Siehe das anklickbare Wahlmodul-Verzeichnis am Ende dieser Seite für alle Optionen und Lerninhalte."}],
      quiz:[],
      cards:[]},
  ]},
  {nr:6,title:"Wahlmodule & Praxissemester (Teil I)",ects:30,modules:[
    {id:"s6-wahl0",code:"Wahlmodul 3",name:"Wahlmodul (frei wählbar)",ects:6,sws:"4",exam:"Je nach gewähltem Modul",desc:"Ein frei wählbares Modul aus dem Wahlkatalog (siehe Wahlmodul-Verzeichnis unten).",
      topics:[{t:"Wahlpflichtbereich",def:"Freie Wahl aus dem HRW-Katalog, Vertiefung nach persönlichem Interesse.",ex:"Siehe Wahlmodul-Verzeichnis unten für alle Optionen und Lerninhalte."}],
      quiz:[],
      cards:[]},
    {id:"s6-wahl1",code:"Wahlmodul 4",name:"Wahlmodul (frei wählbar)",ects:6,sws:"4",exam:"Je nach gewähltem Modul",desc:"Ein frei wählbares Modul aus dem Wahlkatalog (siehe Wahlmodul-Verzeichnis unten).",
      topics:[{t:"Wahlpflichtbereich",def:"Freie Wahl aus dem HRW-Katalog, Vertiefung nach persönlichem Interesse.",ex:"Siehe Wahlmodul-Verzeichnis unten für alle Optionen und Lerninhalte."}],
      quiz:[],
      cards:[]},
    {id:"s6-wahl2",code:"Wahlmodul 5",name:"Wahlmodul (frei wählbar)",ects:6,sws:"4",exam:"Je nach gewähltem Modul",desc:"Ein frei wählbares Modul aus dem Wahlkatalog (siehe Wahlmodul-Verzeichnis unten).",
      topics:[{t:"Wahlpflichtbereich",def:"Freie Wahl aus dem HRW-Katalog, Vertiefung nach persönlichem Interesse.",ex:"Siehe Wahlmodul-Verzeichnis unten für alle Optionen und Lerninhalte."}],
      quiz:[],
      cards:[]},
    {id:"s6-praxis1",code:"Praxis I",name:"Praxissemester – Teil I",ects:12,sws:"—",exam:"Praxisbericht / Nachweis · unbenotet",desc:"Erster Teil des Praxissemesters: Anwendung des Studienwissens in einem Unternehmen der E-Commerce-/Handelsbranche.",
      topics:[
        {t:"Unternehmenssuche & Bewerbungsprozess",def:"Die Suche nach einer geeigneten Praxisstelle sollte idealerweise 3 bis 6 Monate vor dem geplanten Praxissemesterbeginn starten, da attraktive Unternehmen im E-Commerce- und Handelsumfeld ihre Praktikumsplätze oft frühzeitig besetzen. Zu den wichtigsten Suchwegen zählen die offiziellen Praxispartner-Verzeichnisse der Hochschule (Unternehmen, die bereits Erfahrung mit HRW-Studierenden haben und curricular passende Aufgaben anbieten können), allgemeine Jobportale und Karriereseiten von Zielunternehmen sowie Initiativbewerbungen bei Unternehmen, die aktuell keine ausgeschriebene Praktikumsstelle führen, aber grundsätzlich für Praxissemester offen sind. Eine überzeugende Bewerbung sollte klar herausstellen, welche bereits erworbenen Studieninhalte (z.B. Grundlagen aus BWL, Marketing, Programmierung, Statistik) konkret zum Nutzen des aufnehmenden Unternehmens eingebracht werden können, statt nur allgemein Lernbereitschaft zu betonen.",ex:"Ein Student bewirbt sich fünf Monate vor Praxissemesterbeginn gezielt bei einem regionalen Praxispartner im E-Commerce- oder Handelsumfeld und hebt in seinem Anschreiben konkret hervor, dass er bereits SQL-Grundlagen und Web-Analytics-Kenntnisse aus dem Studium mitbringt, die er direkt im Marketing- oder IT-Bereich des Unternehmens anwenden kann."},
        {t:"Praktische Mitarbeit im Fachbereich",def:"Der Kern des Praxissemesters ist die aktive, verantwortungsvolle Mitarbeit in einem konkreten Fachbereich des aufnehmenden Unternehmens – etwa Online-Marketing, IT/Softwareentwicklung, Logistik, Category Management oder Controlling – mit realen, geschäftsrelevanten Aufgaben statt reiner Beobachtung oder Zuarbeit ohne inhaltlichen Bezug zum Studium. Idealerweise erhalten Studierende im Laufe des Praktikums zunehmend eigenverantwortliche Teilaufgaben oder sogar ein kleines eigenes Projekt, statt dauerhaft nur unterstützende Routinetätigkeiten zu übernehmen, da erst eigenverantwortliches Arbeiten einen echten Lerneffekt und aussagekräftige Erfahrungen für den späteren Praxisbericht liefert. Ein regelmäßiger, strukturierter Austausch mit dem betrieblichen Betreuer hilft dabei, frühzeitig Erwartungen abzustimmen und den Aufgabenbereich im Verlauf des Praktikums sinnvoll zu erweitern.",ex:"Ein Praktikant im Category Management eines Online-Händlers unterstützt zunächst bei der Pflege von Produktdaten und Preisen, übernimmt aber bereits nach wenigen Wochen eigenverantwortlich die komplette Analyse und Neustrukturierung einer bislang wenig erfolgreichen Produktkategorie, inklusive konkreter Handlungsempfehlungen an den Category Manager."},
        {t:"Anwendung von Studieninhalten im Betrieb",def:"Ein zentrales Ausbildungsziel des Praxissemesters ist der bewusste Transfer bereits erlernter theoretischer Studieninhalte auf reale betriebliche Fragestellungen, um zu erfahren, wie sich Konzepte aus BWL, Marketing, Statistik, Programmierung oder Recht in der betrieblichen Praxis tatsächlich anwenden lassen und wo Theorie und Praxis voneinander abweichen. Dieser Theorie-Praxis-Transfer funktioniert in beide Richtungen: Einerseits ermöglichen bereits vorhandene Studieninhalte, betriebliche Probleme fundierter zu analysieren als ohne entsprechendes Vorwissen; andererseits zeigt die praktische Anwendung oft, dass reale Situationen komplexer, mehrdeutiger oder politisch beeinflusster sind als vereinfachte Lehrbuchbeispiele, was das eigene Verständnis der Theorie vertieft und kritischer werden lässt. Studierende, die diesen bewussten Transfer aktiv reflektieren, statt Studieninhalte und Praxiserfahrung getrennt nebeneinander stehen zu lassen, ziehen den größten Lernnutzen aus dem Praxissemester.",ex:"Ein Student nutzt sein im CRM-Modul erworbenes theoretisches Wissen über Kundensegmentierung, um im Praktikum eine reale Kundendatenbank nach Kaufhäufigkeit und -wert zu segmentieren und darauf aufbauend eine gezielte, nach Segment differenzierte Newsletter-Kampagne zu konzipieren – ein direkter, konkreter Transfer von Vorlesungsinhalt in eine reale unternehmerische Anwendung."},
        {t:"Dokumentation der Tätigkeiten",def:"Eine sorgfältige, kontinuierliche Dokumentation der eigenen Tätigkeiten während des gesamten Praxissemesters ist die notwendige Grundlage für einen später überzeugenden, inhaltlich substanziellen Praxisbericht – wird die Dokumentation erst am Ende nachträglich aus der Erinnerung rekonstruiert, gehen wichtige Details, konkrete Zahlen und differenzierte Lernerfahrungen unweigerlich verloren. Empfehlenswert ist ein regelmäßiges (z.B. wöchentliches) kurzes Protokoll, das festhält, welche konkreten Aufgaben bearbeitet wurden, welche neuen Kenntnisse oder Fähigkeiten dabei erworben wurden, welche Herausforderungen oder Probleme auftraten und wie diese gelöst wurden, sowie eine kurze persönliche Reflexion des eigenen Lernfortschritts. Diese laufende Dokumentation erleichtert nicht nur das spätere Schreiben des Praxisberichts erheblich, sondern hilft auch dabei, den eigenen Kompetenzzuwachs über die Zeit bewusst wahrzunehmen und gezielt zu steuern.",ex:"Ein wöchentliches Protokoll hält fest: 'Woche 6: Eigenständige Analyse der Retourenquote für Kategorie X durchgeführt, dabei erstmals selbstständig eine SQL-Abfrage über die Warenwirtschaftsdatenbank geschrieben; Herausforderung war das Verständnis der komplexen Datenbankstruktur, gelöst durch Rücksprache mit dem IT-Team' – solche konkreten, zeitnah festgehaltenen Einträge bilden am Ende des Praktikums die Grundlage für einen detaillierten, authentischen Praxisbericht."},
      ],
      quiz:[{q:"Wie viele ECTS umfasst das gesamte Praxissemester (Teil I + II)?",options:["12","20","28","6"],correct:2,explain:"Teil I (12 CR) + Teil II inkl. Praxisseminar (16 CR) = 28 ECTS gesamt."},{q:"Was ist ein zentrales Ziel des Praxissemesters?",options:["Reine Urlaubszeit","Theoretisches Wissen in der Praxis anwenden","Nur Prüfungen schreiben","Auslandsaufenthalt Pflicht"],correct:1,explain:"Das Praxissemester verbindet Theorie mit praktischer Berufserfahrung im Unternehmen."}],
      cards:[{front:"Praxissemester",back:"Praktisches Studiensemester in einem Unternehmen, Anwendung des bisherigen Studienwissens."},{front:"Praxisbericht",back:"Schriftliche Dokumentation der Tätigkeiten und Lernerfahrungen während des Praktikums."}]},
  ]},
  {nr:7,title:"Praxissemester (Teil II), Bachelorarbeit & Kolloquium",ects:30,modules:[
    {id:"s7-praxis2",code:"Praxis II",name:"Praxissemester – Teil II (inkl. Praxisseminar)",ects:16,sws:"—",exam:"Praxisbericht + Seminarleistung · unbenotet",desc:"Zweiter Teil des Praxissemesters inklusive begleitendem Praxisseminar zur Reflexion der Praxiserfahrungen.",
      topics:[
        {t:"Fortsetzung der praktischen Tätigkeit",def:"Im zweiten Teil des Praxissemesters vertieft sich die praktische Mitarbeit typischerweise deutlich: Nachdem im ersten Teil vor allem die betrieblichen Abläufe, Systeme und das Team kennengelernt wurden, übernehmen Studierende nun zunehmend eigenständige Verantwortung für konkrete Teilaufgaben oder sogar ganze kleine Projekte, oft mit direktem Kontakt zu weiteren Abteilungen oder sogar externen Partnern. Dieser Verantwortungszuwachs spiegelt einen natürlichen Lernkurven-Effekt wider: Mit wachsender Vertrautheit mit den betrieblichen Prozessen, Systemen und der Unternehmenskultur können Studierende komplexere, weniger eng angeleitete Aufgaben übernehmen als zu Beginn des Praktikums. Ein bewusstes Einfordern von mehr Verantwortung im zweiten Praktikumsteil – etwa durch aktives Vorschlagen eigener kleiner Projektideen gegenüber dem betrieblichen Betreuer – maximiert den Lerneffekt und die Aussagekraft der später zu erstellenden Praxisdokumentation.",ex:"Nachdem ein Praktikant im ersten Praxisteil vor allem unterstützend an der Datenpflege im Category Management mitgewirkt hat, übernimmt er im zweiten Teil eigenverantwortlich die komplette Optimierung einer schwach performenden Produktkategorie – von der Datenanalyse über die Ableitung konkreter Handlungsempfehlungen bis zur eigenständigen Präsentation der Ergebnisse vor dem zuständigen Team."},
        {t:"Praxisseminar: Erfahrungsaustausch",def:"Das begleitende Praxisseminar bringt Studierende, die ihr Praxissemester in ganz unterschiedlichen Unternehmen und Fachbereichen absolviert haben, zu einem strukturierten, moderierten Erfahrungsaustausch zusammen. Ziel ist es, über die eigene, notwendigerweise begrenzte Einzelerfahrung hinaus einen breiteren Einblick zu gewinnen, wie unterschiedliche Unternehmen – je nach Größe, Branche und Digitalisierungsgrad – ähnliche betriebliche Herausforderungen (z.B. Kundenbindung, Retourenmanagement, Lieferkettenorganisation) jeweils anders lösen. Der strukturierte Austausch fördert zudem die kritische Reflexion der eigenen Praxiserfahrung im Vergleich zu den Berichten der Kommilitonen und schärft das Bewusstsein dafür, dass es selten nur eine 'richtige' betriebliche Lösung gibt, sondern verschiedene, jeweils kontextabhängig sinnvolle Ansätze. Häufig werden im Praxisseminar auch übergreifende Themen wie Karriereplanung, Berufseinstieg oder die Themenfindung für die anstehende Bachelorarbeit gemeinsam besprochen.",ex:"Im Praxisseminar berichten Studierende aus unterschiedlichen Unternehmen, wie diese jeweils mit hohen Retourenquoten umgehen: Während ein großer Modehändler auf ein automatisiertes, KI-gestütztes Größenberatungssystem setzt, um Fehlkäufe vorab zu vermeiden, verfolgt ein kleinerer Elektronikhändler eine strengere Rückgabepolitik mit gezielter Kundenberatung vor dem Kauf – dieser Vergleich zeigt exemplarisch, wie unterschiedlich dasselbe betriebliche Problem je nach Unternehmenskontext gelöst werden kann."},
        {t:"Reflexion der Praxiserfahrung",def:"Die bewusste, strukturierte Reflexion der eigenen Praxiserfahrung geht über die reine Dokumentation der ausgeführten Tätigkeiten hinaus und fragt gezielt danach, was tatsächlich gelernt wurde, welche eigenen Stärken und Entwicklungsfelder sich gezeigt haben, und wie sich das eigene Verständnis von Theorie und Praxis durch die Erfahrung verändert hat. Typische Reflexionsfragen sind: Welche im Studium erlernten Konzepte haben sich in der Praxis als besonders nützlich oder gerade nicht anwendbar erwiesen? Welche fachlichen oder überfachlichen Kompetenzen (z.B. Kommunikation, Projektmanagement, Umgang mit Unsicherheit) wurden am stärksten weiterentwickelt? Welche eigenen beruflichen Interessen und Stärken haben sich durch die praktische Erfahrung deutlicher herauskristallisiert, etwa im Hinblick auf die spätere Berufswahl? Diese Reflexion ist nicht nur akademisch gefordert, sondern hat einen echten praktischen Nutzen für die eigene Karriereplanung und die Auswahl des Bachelorarbeitsthemas.",ex:"Ein Student reflektiert am Ende des Praxissemesters, dass ihm die praktische, selbst durchgeführte SQL-Datenanalyse im Unternehmen ein deutlich tieferes und sichereres Verständnis vermittelt hat als die rein theoretische Behandlung des Themas in der Vorlesung, und erkennt daraus, dass er sich beruflich stärker in Richtung datengetriebener Rollen wie Business Intelligence oder Web-Analytics orientieren möchte."},
        {t:"Vorbereitung auf die Bachelorarbeit",def:"Das zweite Praxissemester bietet eine wertvolle Gelegenheit, sowohl inhaltlich als auch organisatorisch die anschließende Bachelorarbeit vorzubereiten. Inhaltlich entstehen viele überzeugende Bachelorarbeitsthemen direkt aus konkreten, im Unternehmen erlebten Problemstellungen, da diese praxisrelevant, mit echten Daten zugänglich und häufig auch für das aufnehmende Unternehmen selbst von Interesse sind (was wiederum Datenzugang und Unterstützung während der Bachelorarbeit erleichtert). Organisatorisch umfasst die Vorbereitung die frühzeitige Kontaktaufnahme mit einem geeigneten betreuenden Dozenten, die grobe Eingrenzung eines Themenfelds sowie das Klären, ob und in welchem Umfang das Unternehmen Daten, Zugang zu Interviewpartnern oder sonstige Unterstützung für eine unternehmensbezogene Abschlussarbeit bereitstellen kann. Wer diese Vorbereitung bereits während des zweiten Praxisteils beginnt, statt erst danach, gewinnt wertvolle Vorlaufzeit und kann das Bachelorarbeitsthema oft noch gezielt mit den letzten Wochen der praktischen Tätigkeit abstimmen.",ex:"Aus der eigenverantwortlichen Mitarbeit im Category Management entsteht bei einem Studenten die konkrete Idee, seine Bachelorarbeit über die datengetriebene Optimierung von Sortimentsentscheidungen im Online-Handel zu schreiben – er klärt bereits während der letzten Praktikumswochen mit seinem Unternehmen ab, ob er dafür anonymisierte Verkaufsdaten für seine empirische Analyse nutzen darf."},
      ],
      quiz:[{q:"Was ist Ziel des Praxisseminars?",options:["Reine Notenvergabe","Reflexion und Austausch über die Praxiserfahrungen","Zusätzliche Klausur","Firmenbesuch der Dozenten"],correct:1,explain:"Im Praxisseminar reflektieren Studierende gemeinsam ihre Praxiserfahrungen."}],
      cards:[{front:"Praxisseminar",back:"Begleitveranstaltung zum Praxissemester zur Reflexion und zum Erfahrungsaustausch."}]},

    {id:"s7-ba",code:"BA",name:"Bachelorarbeit",ects:12,sws:"—",exam:"Schriftliche Arbeit (i.d.R. 40–60 S.) · benotet",desc:"Eigenständige wissenschaftliche Abschlussarbeit zu einem Thema aus dem E-Commerce-Umfeld.",
      topics:[
        {t:"Themenfindung & Exposé",def:"Die Themenfindung grenzt aus einem oft noch breiten Interessensgebiet (z.B. 'Retourenmanagement' oder 'Personalisierung im E-Commerce') eine konkrete, klar beantwortbare Forschungsfrage ein, die weder zu breit (nicht innerhalb der vorgegebenen Bearbeitungszeit seriös zu bearbeiten) noch zu eng (zu wenig Substanz für eine vollständige Abschlussarbeit) gefasst ist. Das Exposé ist ein kurzes, meist 2- bis 5-seitiges Konzeptpapier, das vor dem eigentlichen Schreibbeginn erstellt und mit dem betreuenden Dozenten abgestimmt wird: Es skizziert die Forschungsfrage und deren Relevanz, den aktuellen Forschungs- bzw. Praxisstand, das geplante methodische Vorgehen sowie eine vorläufige Kapitelgliederung. Ein sorgfältig erarbeitetes Exposé erspart spätere grundlegende Kurskorrekturen, da methodische oder inhaltliche Schwachstellen idealerweise bereits vor Beginn der eigentlichen, zeitaufwändigen Schreibarbeit erkannt und mit dem Betreuer geklärt werden.",ex:"Ein Exposé grenzt das breite Interessensgebiet 'schnelle Lieferung' auf die konkrete, klar untersuchbare Forschungsfrage ein: 'Welchen Einfluss hat die Verfügbarkeit von Same-Day-Delivery auf die Kundenzufriedenheit und Wiederkaufabsicht bei deutschen Online-Modehändlern?' – und skizziert bereits, dass diese Frage über eine eigene Kundenumfrage empirisch untersucht werden soll."},
        {t:"Wissenschaftliches Arbeiten & Methodik",def:"Wissenschaftliches Arbeiten folgt verbindlichen methodischen Standards, die eine Bachelorarbeit von einem bloßen Meinungsessay unterscheiden: eine klar formulierte, eingrenzbare Forschungsfrage, die die gesamte Arbeit konsequent leitet; eine nachvollziehbare, logisch aufgebaute Argumentation, bei der jeder Schluss auf vorherigen, belegten Aussagen aufbaut; eine kritische, nicht unreflektierte Auswertung und Einordnung von Quellen (nicht jede gefundene Information ist gleichermaßen verlässlich oder relevant); sowie durchgängige methodische Transparenz, bei der für Dritte nachvollziehbar dokumentiert wird, wie genau zu Ergebnissen gelangt wurde, damit die Arbeit im Prinzip reproduzierbar wäre. Eigene Meinungen oder unbelegte Behauptungen haben in einer wissenschaftlichen Arbeit grundsätzlich keinen Platz, es sei denn, sie werden explizit als eigene, aus den Ergebnissen abgeleitete Einschätzung gekennzeichnet und argumentativ begründet.",ex:"Statt zu behaupten 'Kostenlose Retouren sind für Online-Händler generell vorteilhaft', belegt eine wissenschaftlich sauber arbeitende Bachelorarbeit diese Aussage durch konkrete zitierte Studienergebnisse und eigene Datenanalysen, differenziert dabei aber auch zwischen Branchen und Unternehmensgrößen, für die diese pauschale Aussage möglicherweise nicht gleichermaßen zutrifft."},
        {t:"Literaturrecherche & Zitation",def:"Die systematische Literaturrecherche identifiziert und bewertet relevante wissenschaftliche Quellen (Fachbücher, referierte Zeitschriftenartikel, seriöse Studien) zum gewählten Thema, meist über wissenschaftliche Datenbanken, Bibliothekskataloge und Google Scholar, wobei die Qualität und Aktualität der gefundenen Quellen kritisch bewertet werden muss (nicht jede im Internet auffindbare Quelle erfüllt wissenschaftliche Qualitätsstandards). Die Zitation kennzeichnet transparent und nachvollziehbar, welche Gedanken, Daten oder Formulierungen aus fremden Quellen übernommen wurden, um Plagiate (die unausgewiesene Übernahme fremden geistigen Eigentums, ein schwerwiegender akademischer Verstoß) zu vermeiden und die eigene Argumentation durch etablierte Erkenntnisse zu untermauern. Gängige Zitationsstile wie APA oder die in den Wirtschaftswissenschaften verbreitete deutsche Zitierweise (Fußnoten) folgen jeweils festen, formalen Regeln für Verweise im Text sowie das abschließende Literaturverzeichnis, deren konsequente und einheitliche Anwendung über die gesamte Arbeit hinweg verpflichtend ist.",ex:"Eine Aussage zur durchschnittlichen Retourenquote im deutschen Online-Modehandel wird nicht einfach unbelegt behauptet, sondern korrekt mit Quellenangabe zitiert, etwa im APA-Stil als '(Deges, 2023, S. 45)', wobei die vollständige bibliografische Angabe der Quelle zusätzlich im Literaturverzeichnis am Ende der Arbeit aufgeführt wird."},
        {t:"Empirische oder konzeptionelle Bearbeitung",def:"Je nach Art der Forschungsfrage wird eine Bachelorarbeit entweder empirisch oder konzeptionell (theoretisch-analytisch) bearbeitet, wobei auch Mischformen möglich sind. Die empirische Bearbeitung sammelt und analysiert eigene, neu erhobene oder bereits vorhandene Daten (z.B. eine selbst durchgeführte Kundenumfrage, Experteninterviews oder die Auswertung eines Unternehmensdatensatzes) mit geeigneten quantitativen (statistischen) oder qualitativen (interpretativen) Methoden, um die Forschungsfrage mit konkreter, selbst erhobener Evidenz zu beantworten. Die konzeptionelle Bearbeitung stützt sich dagegen primär auf die systematische Analyse und Synthese bereits vorhandener Fachliteratur, um bestehende Theorien, Modelle oder Konzepte kritisch zu vergleichen, neu zusammenzuführen oder auf einen neuen Anwendungskontext zu übertragen, ohne eigene neue Daten zu erheben. Die Wahl des Bearbeitungstyps sollte sich konsequent aus der Art der Forschungsfrage ergeben – eine Frage nach subjektiver Kundenwahrnehmung erfordert meist empirische Daten, eine Frage nach der theoretischen Einordnung eines Konzepts eher eine konzeptionelle Literaturanalyse.",ex:"Für die Forschungsfrage zum Einfluss von Same-Day-Delivery auf die Kundenzufriedenheit entwickelt die Studentin einen eigenen strukturierten Fragebogen, befragt 150 tatsächliche Online-Käufer und wertet die Ergebnisse empirisch mit statistischen Methoden (u.a. Signifikanztests) aus, statt sich ausschließlich auf bereits publizierte Studien anderer Autoren zu stützen."},
        {t:"Schriftliche Ausarbeitung nach wiss. Standards",def:"Die eigentliche schriftliche Ausarbeitung folgt einem etablierten, weitgehend standardisierten Aufbau: Eine Einleitung führt in das Thema ein, begründet dessen Relevanz, formuliert die zentrale Forschungsfrage und gibt einen kurzen Überblick über den Aufbau der Arbeit. Der theoretische/konzeptionelle Grundlagenteil arbeitet relevante Begriffe, Theorien und den aktuellen Forschungsstand auf. Der Hauptteil (empirische Analyse oder konzeptionelle Argumentation) bearbeitet die eigentliche Forschungsfrage systematisch und ausführlich. Das Fazit fasst die zentralen Ergebnisse zusammen, beantwortet explizit die eingangs gestellte Forschungsfrage, benennt selbstkritisch die Grenzen und methodischen Limitationen der eigenen Arbeit und gibt oft einen Ausblick auf weiterführende Forschungsfragen. Der Sprachstil ist durchgehend sachlich, präzise und unpersönlich (Vermeidung von Ich-Formulierungen und umgangssprachlichen Wendungen), wobei Fachbegriffe konsistent und korrekt verwendet werden.",ex:"Das Fazit einer Bachelorarbeit beantwortet explizit die eingangs gestellte Forschungsfrage ('Same-Day-Delivery erhöht die Kundenzufriedenheit signifikant, jedoch nur bei Bestellwerten über 50 €'), benennt aber selbstkritisch die Limitation, dass die Stichprobe von 150 Befragten nur eine bestimmte Altersgruppe überproportional abbildet und die Ergebnisse daher nicht ohne Weiteres auf die Gesamtbevölkerung übertragen werden können."},
      ],
      quiz:[{q:"Was ist ein Exposé?",options:["Die fertige Bachelorarbeit","Ein Kurzkonzept zur Themenvorstellung vor Beginn der Arbeit","Ein Literaturverzeichnis","Die mündliche Prüfung"],correct:1,explain:"Ein Exposé skizziert Thema, Fragestellung und Vorgehen, bevor die eigentliche Arbeit beginnt."},{q:"Was zeichnet eine gute wissenschaftliche Fragestellung aus?",options:["Möglichst vage formuliert","Klar abgegrenzt und beantwortbar","Nie in der Einleitung genannt","Rein subjektive Meinung"],correct:1,explain:"Eine gute Forschungsfrage ist klar abgegrenzt, präzise und mit den verfügbaren Methoden beantwortbar."}],
      cards:[{front:"Exposé",back:"Kurzes Konzeptpapier zur Themenvorstellung vor Beginn der Bachelorarbeit."},{front:"Forschungsfrage",back:"Klar abgegrenzte, zentrale Fragestellung, die die Arbeit beantworten soll."},{front:"Literaturrecherche",back:"Systematische Suche und Auswertung wissenschaftlicher Quellen zum Thema."}]},

    {id:"s7-koll",code:"Kolloq.",name:"Bachelorarbeit (Kolloquium)",ects:2,sws:"—",exam:"Mündliche Prüfung · benotet",desc:"Mündliche Verteidigung der Bachelorarbeit vor Prüfungskommission.",
      topics:[
        {t:"Kurzpräsentation der Arbeit",def:"Zu Beginn des Kolloquiums stellt der Kandidat oder die Kandidatin die eigene Bachelorarbeit in einer knapp bemessenen, meist 15- bis 20-minütigen Präsentation vor der Prüfungskommission vor. Diese Präsentation muss die zentrale Forschungsfrage und deren Relevanz klar herausstellen, das methodische Vorgehen nachvollziehbar zusammenfassen (ohne sich in technischen Details zu verlieren) und die wichtigsten Ergebnisse sowie deren praktische oder theoretische Bedeutung pointiert darstellen – angesichts der knappen Zeit ist eine strenge inhaltliche Priorisierung entscheidend, da unmöglich alle Details der oft 40 bis 60 Seiten umfassenden schriftlichen Arbeit in wenigen Minuten wiedergegeben werden können. Eine gelungene Kurzpräsentation endet zudem mit einer klaren, expliziten Beantwortung der ursprünglichen Forschungsfrage und schafft damit die inhaltliche Grundlage für die anschließende Fragerunde der Prüfer.",ex:"Ein Student präsentiert in 18 Minuten kompakt, wie er methodisch mittels einer eigenen Kundenumfrage den Einfluss von Same-Day-Delivery auf die Kundenzufriedenheit untersucht hat, zeigt die wichtigsten statistischen Ergebnisse anhand von zwei bis drei aussagekräftigen Diagrammen und schließt mit der klaren Kernaussage, unter welchen Bedingungen sich die Investition in Same-Day-Delivery aus Kundensicht besonders lohnt."},
        {t:"Verteidigung der Methodik & Ergebnisse",def:"Im Anschluss an die Kurzpräsentation muss der Kandidat die in der Bachelorarbeit gewählte Methodik gegenüber kritischen Rückfragen der Prüfungskommission begründen und verteidigen – dies erfordert ein tieferes Verständnis der eigenen methodischen Entscheidungen, als nur zu wissen, was durchgeführt wurde. Typische Verteidigungsaspekte sind: Warum wurde genau diese Methode (z.B. eine quantitative Umfrage statt qualitativer Interviews) und nicht eine Alternative gewählt? Ist die gewählte Stichprobengröße und -zusammensetzung für belastbare Aussagen ausreichend? Welche alternativen Erklärungen für die beobachteten Ergebnisse wurden erwogen und warum wurden sie verworfen? Eine überzeugende Verteidigung zeigt nicht nur technisches Methodenwissen, sondern auch ein reflektiertes Bewusstsein für die Grenzen und Schwächen der eigenen gewählten Vorgehensweise, statt diese zu verschweigen oder zu verharmlosen.",ex:"Der Kandidat erklärt und begründet auf Nachfrage der Kommission, warum eine Stichprobe von 150 Umfrageteilnehmenden für seine statistische Analyse als ausreichend groß galt (unter Verweis auf die berechnete statistische Power der durchgeführten Signifikanztests), räumt aber gleichzeitig selbstkritisch ein, dass die Stichprobe geografisch nicht vollständig repräsentativ für ganz Deutschland war."},
        {t:"Fragerunde mit Prüfern",def:"In der abschließenden Fragerunde stellen die Mitglieder der Prüfungskommission gezielt vertiefende Fragen zu Inhalt, Methodik, theoretischem Hintergrund oder den Grenzen (Limitationen) der vorgelegten Arbeit, um zu prüfen, ob der Kandidat sein Thema tatsächlich durchdrungen hat und nicht nur die schriftliche Arbeit auswendig wiedergeben kann. Häufige Fragetypen betreffen die Übertragbarkeit der Ergebnisse auf andere Kontexte, Branchen oder Länder, alternative methodische Herangehensweisen, die der Kandidat nicht gewählt hat, die praktische Relevanz und mögliche Handlungsempfehlungen für Unternehmen, sowie mögliche Anschlussfragen für weiterführende zukünftige Forschung. Eine überzeugende Antwort zeigt intellektuelle Flexibilität, Ehrlichkeit bezüglich der Grenzen der eigenen Arbeit sowie die Fähigkeit, spontan und unter Zeitdruck fundiert über das eigene Thema nachzudenken, statt lediglich vorbereitete Antworten abzuspulen.",ex:"Eine Prüferin fragt kritisch nach, ob sich die für den Modehandel gewonnenen Erkenntnisse zu Same-Day-Delivery auch auf andere Branchen wie den Lebensmittel- oder Elektronikhandel übertragen ließen – der Kandidat antwortet differenziert, dass die grundsätzliche Wirkungsrichtung vermutlich ähnlich sei, die Zahlungsbereitschaft für schnelle Lieferung aber je nach Produktkategorie und Dringlichkeit des Bedarfs stark variieren dürfte, was in seiner Arbeit nicht empirisch untersucht wurde."},
      ],
      quiz:[{q:"Was passiert im Kolloquium?",options:["Eine neue Klausur wird geschrieben","Die Bachelorarbeit wird mündlich präsentiert und verteidigt","Nur die Note wird bekanntgegeben","Ein neues Thema wird vergeben"],correct:1,explain:"Im Kolloquium präsentiert und verteidigt man die eigene Bachelorarbeit mündlich."}],
      cards:[{front:"Kolloquium",back:"Mündliche Prüfung zur Verteidigung der Bachelorarbeit vor einer Prüfungskommission."}]},
  ]},
];
/* Wahlmodul-Verzeichnis: Objekte mit Kurzbeschreibung + typischen Lerninhalten
   (recherchiert über hochschule-ruhr-west.de + fachüblicher Studieninhalte) */
const WAHLMODULE=[
  {n:"Angewandte künstliche Intelligenz im E-Commerce",d:"Praktische Anwendung von KI-Verfahren auf typische E-Commerce-Probleme wie Produktempfehlung, Preisoptimierung und Chatbots.",th:["Machine-Learning-Grundlagen für den Handel","Personalisierung & Produktempfehlungen","Chatbots & Conversational Commerce","Dynamische Preisoptimierung mit KI"]},
  {n:"Angewandtes Mediendesign für E-Commerce",d:"Gestaltung wirkungsvoller visueller Inhalte (Bilder, Banner, Videos) für Online-Shops und Kampagnen.",th:["Bildbearbeitung & Bildsprache im E-Commerce","Grundlagen Typografie & Layout","Werbemittel- und Bannergestaltung","Praktische Arbeit mit Tools wie Photoshop/Canva"]},
  {n:"Angewandtes Online-Marketing",d:"Vertiefung praktischer Online-Marketing-Kanäle: SEO, SEA, Social Ads und E-Mail-Marketing im Zusammenspiel.",th:["Suchmaschinenoptimierung (SEO)","Suchmaschinenwerbung (SEA/Google Ads)","Social-Media-Advertising","Kampagnen-Controlling & ROI-Messung"]},
  {n:"Angewandtes Webshop-Management",d:"Operativer Betrieb eines Online-Shops: Sortimentspflege, Preisgestaltung, Kampagnensteuerung im Tagesgeschäft.",th:["Shop-Administration im laufenden Betrieb","Sortiments- und Preispflege","Kampagnen- und Aktionsmanagement","Kennzahlenbasierte Shopsteuerung"]},
  {n:"Computergrafik und Visualisierung",d:"Grundlagen der Erzeugung und Darstellung von 2D-/3D-Grafiken, relevant für Produktvisualisierung im E-Commerce.",th:["Grundlagen 2D-/3D-Grafik","Rendering-Verfahren","Produktvisualisierung (z.B. 360°-Ansichten)","Datenvisualisierung"]},
  {n:"Current Topics of Operations & SCM (English)",d:"Aktuelle Themen aus Operations Management und Supply Chain Management, unterrichtet auf Englisch.",th:["Aktuelle Supply-Chain-Trends","Nachhaltige Logistik","Resilienz von Lieferketten","Fallstudien internationaler Unternehmen"]},
  {n:"Digitales Mediendesign",d:"Gestaltung digitaler Medienprodukte (Web, App, Video) unter Berücksichtigung von Nutzerführung und Markenauftritt.",th:["Digitale Gestaltungsprinzipien","UI-Elemente & Designsysteme","Bewegtbild & Animation","Cross-Media-Konsistenz"]},
  {n:"Empfehlungssysteme",d:"Funktionsweise und Einsatz von Recommendation Engines, wie sie z.B. Amazon oder Netflix zur Personalisierung nutzen.",th:["Collaborative Filtering","Content-based Filtering","Hybride Empfehlungsansätze","Bewertung von Empfehlungsqualität"]},
  {n:"Entwicklung und Produktion eines Rennwagens (Formula Student)",d:"Interdisziplinäres Projektmodul, in dem Studierende gemeinsam einen Rennwagen für Formula-Student-Wettbewerbe konstruieren.",th:["Projektmanagement im Konstruktionsteam","Technische Konstruktion & Fertigung","Teamarbeit interdisziplinärer Fachbereiche","Wettbewerbsvorbereitung & Präsentation"]},
  {n:"EyeTracking Research in Retail Management",d:"Einsatz von Eye-Tracking-Technologie zur Untersuchung des Blickverhaltens von Kunden im On- und Offline-Handel.",th:["Grundlagen der Eye-Tracking-Methodik","Studiendesign für Blickverhaltensstudien","Auswertung von Heatmaps","Gestaltungsempfehlungen für Shops ableiten"]},
  {n:"Forschungsprojekt mit aktuellem Thema im E-Commerce",d:"Eigenständige, forschungsnahe Bearbeitung eines aktuellen E-Commerce-Themas, oft mit einem Lehrstuhl oder Praxispartner.",th:["Selbstständige Forschungsfrage entwickeln","Wissenschaftliche Methodik anwenden","Aktuelle E-Commerce-Trends untersuchen","Ergebnispräsentation & Dokumentation"]},
  {n:"Grundlagen der KI – interdisziplinär",d:"Interdisziplinäre Einführung in Konzepte der Künstlichen Intelligenz für Studierende unterschiedlicher Fachrichtungen.",th:["Was ist KI? Abgrenzung zu ML und Deep Learning","Grundlegende Algorithmen & Anwendungsfelder","Chancen und Risiken von KI","Ethische Fragestellungen"]},
  {n:"Grundlagen der Verhandlungsführung",d:"Theorie und Praxis erfolgreicher Verhandlungsführung, u.a. für Einkaufs-, Vertriebs- und Gehaltsverhandlungen.",th:["Verhandlungsstrategien (z.B. Harvard-Konzept)","Argumentations- und Kommunikationstechniken","Umgang mit schwierigen Verhandlungspartnern","Verhandlungssimulationen"]},
  {n:"Inklusives IT-Design",d:"Gestaltung digitaler Produkte, die für möglichst viele Menschen nutzbar sind, unabhängig von Einschränkungen.",th:["Prinzipien inklusiven Designs","Barrierefreiheit nach WCAG","Design für unterschiedliche Nutzergruppen","Testing mit assistiven Technologien"]},
  {n:"Internationales Management",d:"Grundlagen der Führung und Steuerung international tätiger Unternehmen, inkl. interkultureller Aspekte.",th:["Internationalisierungsstrategien","Interkulturelles Management","Globale Organisationsstrukturen","Fallstudien internationaler Konzerne"]},
  {n:"Internationalisation of E-Commerce & Intercultural Aspects (English)",d:"Untersucht, wie E-Commerce-Unternehmen international expandieren und kulturelle Unterschiede im Kaufverhalten berücksichtigen.",th:["Markteintrittsstrategien im E-Commerce","Kulturelle Unterschiede im Kaufverhalten","Lokalisierung von Online-Shops","Internationale Zahlungs- und Logistikaspekte"]},
  {n:"Let's battle for some attention: Brand Development and Marketing (English)",d:"Praxisorientiertes Modul zu Markenentwicklung und Aufmerksamkeitsstrategien im digitalen Wettbewerb, auf Englisch.",th:["Markenidentität & Positionierung entwickeln","Attention Economy & Content-Strategien","Kampagnenkonzeption","Markenkommunikation über mehrere Kanäle"]},
  {n:"Mobile Computing",d:"Grundlagen mobiler Technologien, Betriebssysteme und Anwendungsentwicklung für Smartphones und Tablets.",th:["Mobile Betriebssysteme (iOS, Android)","Mobile App-Architekturen","Standortbasierte Dienste","Mobile Sicherheit & Datenschutz"]},
  {n:"Modelle im Maschinellen Lernen verstehen und bewerten",d:"Vertiefung im Verständnis, der Bewertung und kritischen Einordnung von Machine-Learning-Modellen.",th:["Überwachtes vs. unüberwachtes Lernen","Modellbewertung (Genauigkeit, Overfitting)","Interpretierbarkeit von ML-Modellen","Praktische Fallbeispiele"]},
  {n:"Natural Language Processing",d:"Verarbeitung und Analyse natürlicher Sprache durch Algorithmen, z.B. für Chatbots oder Sentiment-Analyse von Kundenrezensionen.",th:["Grundlagen der Textverarbeitung","Sentiment-Analyse von Kundenbewertungen","Chatbot- und Sprachassistenten-Technologien","Sprachmodelle (Grundlagen)"]},
  {n:"Net Economy (English)",d:"Ökonomische Prinzipien digitaler Märkte und Netzwerke, u.a. Plattformökonomie und digitale Geschäftsmodelle, auf Englisch.",th:["Ökonomie digitaler Netzwerke","Plattform- und Zwei-Seiten-Märkte","Digitale Geschäftsmodelle im Vergleich","Regulierung digitaler Märkte"]},
  {n:"New Work and Digital Leadership",d:"Neue Arbeitsformen und Führungskonzepte im digitalen Zeitalter, z.B. agile Teams und Remote Leadership.",th:["New-Work-Prinzipien","Agile Führungskonzepte","Remote- und Hybrid-Arbeit","Digitale Zusammenarbeit & Tools"]},
  {n:"Positive Computing und Diversity in der Mensch-Technik-Interaktion",d:"Gestaltung von Technik, die Wohlbefinden fördert, unter Berücksichtigung von Diversität und Nutzerbedürfnissen.",th:["Positive Computing – Grundprinzipien","Diversity-Aspekte im Interaktionsdesign","Wohlbefinden durch Technikgestaltung","Fallstudien inklusiver Produkte"]},
  {n:"Projekt und Experiment Roboter Pepper",d:"Praktisches Projektmodul mit dem humanoiden Roboter Pepper, u.a. zu Programmierung und Mensch-Roboter-Interaktion.",th:["Grundlagen der Roboterprogrammierung","Mensch-Roboter-Interaktion gestalten","Experimentelles Vorgehen & Auswertung","Einsatzszenarien im Handel"]},
  {n:"Projekt: Benutzerschnittstellen für Mobilgeräte",d:"Projektbasierte Entwicklung von Benutzeroberflächen speziell für mobile Endgeräte.",th:["Mobile UI/UX-Prinzipien","Prototyping für mobile Apps","Usability-Testing auf Mobilgeräten","Umsetzung eines eigenen Mobile-UI-Projekts"]},
  {n:"Retail Management im E-Commerce",d:"Vertiefte Betrachtung von Handelsmanagement-Konzepten speziell im E-Commerce-Kontext, z.B. Sortiments- und Flächenmanagement online.",th:["Retail-Strategien im Online-Handel","Sortiments- und Category-Management vertieft","Preis- und Promotionsmanagement","Kennzahlenbasierte Steuerung im Retail"]},
  {n:"Soziale Robotik und virtuelle Assistenzsysteme",d:"Untersucht soziale Roboter und virtuelle Assistenten (z.B. Sprachassistenten) und ihre Rolle in Kundeninteraktion und Service.",th:["Grundlagen sozialer Robotik","Virtuelle Assistenzsysteme im Kundenservice","Akzeptanzforschung gegenüber Robotern","Ethische Fragestellungen"]},
  {n:"Startup Project",d:"Praktisches Projektmodul, in dem Studierende eine eigene Geschäftsidee von der Konzeption bis zum Prototyp entwickeln.",th:["Ideenfindung & Validierung","Business-Model-Entwicklung","Prototyping & Testing mit echten Nutzern","Pitch vor einer Jury"]},
  {n:"Summer School on Sustainability (English)",d:"Interdisziplinäre Summer School zu Nachhaltigkeitsthemen, oft mit internationalen Studierenden, auf Englisch.",th:["Nachhaltigkeitskonzepte (ökologisch, sozial, ökonomisch)","Nachhaltiger Konsum & E-Commerce","Internationale Fallstudien","Interdisziplinäre Gruppenarbeit"]},
  {n:"User Experience Design",d:"Vertiefte Gestaltung positiver Nutzererlebnisse entlang der gesamten Customer Journey einer digitalen Anwendung.",th:["UX-Research-Methoden","Informationsarchitektur","Interaktionsdesign & Prototyping","Usability-Testing & Iteration"]},
  {n:"Vertriebs- und Pricing-Strategien im Cross-Channel-Kontext",d:"Vertriebs- und Preisstrategien, die kanalübergreifend (online, stationär, Marktplatz) konsistent gestaltet werden müssen.",th:["Cross-Channel-Vertriebsstrategien","Dynamische Preisgestaltung","Preisparität zwischen Kanälen","Steuerung von Rabatt- und Aktionsstrategien"]},
  {n:"Virtual und Augmented Reality",d:"Grundlagen von VR/AR-Technologien und ihr Einsatz im E-Commerce, z.B. virtuelle Anproben oder 3D-Produktvisualisierung.",th:["Grundlagen VR- und AR-Technologie","Virtuelle Produktvisualisierung & Anprobe","Entwicklung einfacher AR-Anwendungen","Einsatzszenarien im Handel"]},
];
/* ── Module (HRW BPO 2023, Sem.1) ───────────────────────────────── */
const MODS=[
  {id:"BWL",label:"BWL EC",  desc:"Einführung in die BWL",             e:"📊",c:ACCENT.red},
  {id:"HBL",label:"HBL EC",  desc:"Grundlagen Handelsmanagement",       e:"🏬",c:ACCENT.teal},
  {id:"ECM",label:"ECM",     desc:"Grundlagen des E-Commerce",          e:"🌐",c:ACCENT.teal},
  {id:"GIP",label:"GIP EC",  desc:"Informatik & Java-Programmierung",   e:"💻",c:ACCENT.violet},
  {id:"ALL",label:"Allgemein",desc:"Studium allgemein",                 e:"📚",c:"#8a96b8"},
];
/* ── Link-Kategorien ─────────────────────────────────────────────── */
const CATS=[
  {id:"video",e:"🎬",label:"Lernvideos",      c:ACCENT.blue},
  {id:"book", e:"📖",label:"Bücher & Stellen",c:ACCENT.violet},
  {id:"table",e:"📊",label:"Tabellen",        c:ACCENT.teal},
  {id:"card", e:"🃏",label:"Karteikarten",    c:ACCENT.red},
];
/* ── Ressourcen-Bibliothek ───────────────────────────────────────── */
const RES=[
  // 🎬 LERNVIDEOS
  {cat:"video",mod:"BWL",l:"SimpleClub – Was ist BWL?",       u:YT("SimpleClub Was ist BWL")},
  {cat:"video",mod:"BWL",l:"Studyflix – Rechtsformen",         u:SF("Rechtsformen GmbH AG")},
  {cat:"video",mod:"BWL",l:"Studyflix – Soll & Haben",         u:SF("Soll Haben Buchführung")},
  {cat:"video",mod:"BWL",l:"Studyflix – Bilanz",               u:SF("Bilanz einfach erklärt")},
  {cat:"video",mod:"BWL",l:"Studyflix – Abschreibung",         u:SF("Abschreibung AfA")},
  {cat:"video",mod:"BWL",l:"Studyflix – Betriebliche Ziele",   u:SF("betriebliche Ziele")},
  {cat:"video",mod:"HBL",l:"Handelsmanagement Grundlagen",     u:YT("Handelsmanagement Grundlagen Einzelhandel")},
  {cat:"video",mod:"HBL",l:"Betriebstypen im Handel",          u:YT("Betriebstypen Einzelhandel Discounter")},
  {cat:"video",mod:"HBL",l:"Sortimentsgestaltung",             u:YT("Sortimentsgestaltung Category Management")},
  {cat:"video",mod:"ECM",l:"E-Commerce Grundlagen",            u:YT("E-Commerce Grundlagen erklärt")},
  {cat:"video",mod:"ECM",l:"Plattformökonomie & Netzeffekte",  u:YT("Plattformökonomie Netzeffekte erklärt")},
  {cat:"video",mod:"ECM",l:"B2B / B2C / D2C Vergleich",       u:YT("B2B B2C D2C Unterschied E-Commerce")},
  {cat:"video",mod:"ECM",l:"ROPO-Effekt erklärt",              u:YT("ROPO Effekt Online Shopping erklärt")},
  {cat:"video",mod:"ECM",l:"Customer Journey",                 u:YT("Customer Journey Map einfach erklärt")},
  {cat:"video",mod:"ECM",l:"DSGVO im E-Commerce",              u:YT("DSGVO E-Commerce Datenschutz erklärt")},
  {cat:"video",mod:"GIP",l:"Zahlensysteme: Binär & Hex",       u:YT("Zahlensysteme Binär Hexadezimal Informatik")},
  {cat:"video",mod:"GIP",l:"Boolesche Algebra",                u:YT("Boolesche Algebra Wahrheitstabelle De Morgan")},
  {cat:"video",mod:"GIP",l:"Java: Variablen & Datentypen",     u:YT("Java Tutorial Deutsch Variablen Anfänger")},
  {cat:"video",mod:"GIP",l:"Java: Kontrollstrukturen",         u:YT("Java if else for Schleife Deutsch")},
  {cat:"video",mod:"GIP",l:"Java: OOP & Klassen",              u:YT("Objektorientierung Java Klassen Deutsch")},
  {cat:"video",mod:"ALL",l:"Wissenschaftlich schreiben",        u:YT("Wissenschaftlich schreiben Hausarbeit Deutsch")},
  // 📖 BÜCHER (Deges, Grundlagen des E-Commerce, 2. Aufl.)
  {cat:"book",mod:"ECM",l:"Kap.1   – E-Commerce Grundlagen (S.1)",      u:B(17)},
  {cat:"book",mod:"ECM",l:"Kap.1.1 – E-Commerce & Distanzhandel (S.2)", u:B(18)},
  {cat:"book",mod:"ECM",l:"Kap.1.2 – Entwicklungsgeschichte (S.8)",     u:B(24)},
  {cat:"book",mod:"ECM",l:"Kap.1.3 – Gesellschaftl. Bedeutung (S.12)",  u:B(28)},
  {cat:"book",mod:"ECM",l:"Kap.1.4 – Disruption (S.16)",                u:B(32)},
  {cat:"book",mod:"ECM",l:"Kap.1.5 – Ökonomische Bedeutung (S.20)",     u:B(36)},
  {cat:"book",mod:"ECM",l:"Kap.1.5.2 – E-Commerce DE (S.21)",           u:B(37)},
  {cat:"book",mod:"ECM",l:"Kap.1.5.3 – Corona-Effekt (S.26)",           u:B(42)},
  {cat:"book",mod:"ECM",l:"Kap.1.6 – Rechtliche Grundlagen (S.27)",     u:B(43)},
  {cat:"book",mod:"ECM",l:"Kap.1.6.1 – DSGVO (S.29)",                   u:B(45)},
  {cat:"book",mod:"ECM",l:"Kap.1.7 – Chancen & Risiken (S.42)",         u:B(58)},
  {cat:"book",mod:"ECM",l:"Kap.2 – Marktformen (S.53)",                  u:B(68)},
  {cat:"book",mod:"ECM",l:"Kap.2.1.1 – B2C (S.54)",                     u:B(69)},
  {cat:"book",mod:"ECM",l:"Kap.2.1.2 – B2B (S.54)",                     u:B(69)},
  {cat:"book",mod:"ECM",l:"Kap.2.1.3 – C2C (S.56)",                     u:B(71)},
  {cat:"book",mod:"ECM",l:"Kap.2.1.5 – D2C (S.59)",                     u:B(74)},
  {cat:"book",mod:"ECM",l:"Kap.2.2 – Direktgeschäft (S.60)",             u:B(75)},
  {cat:"book",mod:"ECM",l:"Kap.2.3 – Marktplätze (S.62)",               u:B(77)},
  {cat:"book",mod:"ECM",l:"Kap.2.5.1 – Shopsysteme (S.89)",             u:B(104)},
  {cat:"book",mod:"ECM",l:"Kap.2.5.3 – Big Data & KI (S.96)",           u:B(111)},
  {cat:"book",mod:"ECM",l:"Kap.3 – Erlösformen (S.105)",                 u:B(120)},
  {cat:"book",mod:"ECM",l:"Kap.4.2 – Kaufentscheidung (S.130)",         u:B(144)},
  {cat:"book",mod:"ECM",l:"Kap.4.3 – Konsumententypologien (S.139)",    u:B(153)},
  {cat:"book",mod:"ECM",l:"Kap.4.5 – Customer Journey (S.148)",         u:B(162)},
  {cat:"book",mod:"ECM",l:"Kap.5 – Betriebstypen (S.163)",              u:B(177)},
  {cat:"book",mod:"ALL",l:"📂 Buch öffnen (Google Drive)",               u:BOOK},
  // 📊 TABELLEN & ÜBERSICHTEN
  {cat:"table",mod:"BWL",l:"Studyflix – Güterarten",          u:SF("Güterarten Wirtschaft")},
  {cat:"table",mod:"BWL",l:"Studyflix – Rechtsformen Tabelle",u:SF("Rechtsformen Vergleich")},
  {cat:"table",mod:"BWL",l:"Studyflix – Betriebliche Ziele",  u:SF("betriebliche Ziele Tabelle")},
  {cat:"table",mod:"BWL",l:"Studyflix – Bilanz Aufbau",       u:SF("Bilanz Aktiva Passiva")},
  {cat:"table",mod:"BWL",l:"Studyflix – GuV-Rechnung",        u:SF("GuV Rechnung Aufbau")},
  {cat:"table",mod:"BWL",l:"Studyflix – Abschreibungsarten",  u:SF("Abschreibung linear degressiv")},
  {cat:"table",mod:"BWL",l:"Studyflix – Buchungssatz",        u:SF("Buchungssatz Soll Haben")},
  {cat:"table",mod:"HBL",l:"HDE – Handelsverband Zahlen",     u:"https://einzelhandel.de/"},
  {cat:"table",mod:"HBL",l:"Gabler – Handelsmanagement",      u:"https://wirtschaftslexikon.gabler.de/"},
  {cat:"table",mod:"HBL",l:"Knowunity – Betriebstypen",       u:K("Betriebstypen Handel Übersicht")},
  {cat:"table",mod:"ECM",l:"Statista – E-Commerce DE",        u:"https://de.statista.com/themen/3979/e-commerce-in-deutschland/"},
  {cat:"table",mod:"ECM",l:"bevh – Online-Handel Fakten",     u:"https://www.bevh.org/zahlen-daten-fakten/"},
  {cat:"table",mod:"ECM",l:"Knowunity – Geschäftsmodelle",    u:K("E-Commerce Geschäftsmodelle B2B B2C")},
  {cat:"table",mod:"ECM",l:"Studocu – E-Commerce Zusammenf.", u:DOC("E-Commerce Grundlagen Hochschule")},
  {cat:"table",mod:"GIP",l:"Studyflix – Binärsystem",         u:SF("Binärsystem Umrechnung")},
  {cat:"table",mod:"GIP",l:"Studyflix – Hexadezimalsystem",   u:SF("Hexadezimalsystem erklärt")},
  {cat:"table",mod:"GIP",l:"Studyflix – Aussagenlogik",       u:SF("Aussagenlogik Wahrheitstabelle")},
  {cat:"table",mod:"GIP",l:"Studyflix – De-Morgan-Regeln",    u:SF("De Morgan Regel")},
  {cat:"table",mod:"GIP",l:"W3Schools – Java Referenz",       u:"https://www.w3schools.com/java/default.asp"},
  {cat:"table",mod:"ALL",l:"Knowunity – Alle Fächer",         u:"https://knowunity.de/"},
  {cat:"table",mod:"ALL",l:"Studocu – Mitschriften",          u:"https://www.studocu.com/de/"},
  // 🃏 KARTEIKARTEN
  {cat:"card",mod:"ALL",l:"Anki App (iOS/Android)",           u:"https://apps.ankiweb.net/"},
  {cat:"card",mod:"ALL",l:"Quizlet – Sets suchen",            u:"https://quizlet.com/de/"},
  {cat:"card",mod:"ECM",l:"Springer Flashcard-App (Deges)",   u:"https://flashcards.springernature.com/login"},
  {cat:"card",mod:"ECM",l:"Quizlet – E-Commerce",             u:QZ("E-Commerce Grundlagen")},
  {cat:"card",mod:"BWL",l:"Quizlet – BWL Grundlagen",         u:QZ("BWL Grundlagen Wirtschaft")},
  {cat:"card",mod:"BWL",l:"Quizlet – Buchführung",            u:QZ("Buchführung Soll Haben")},
  {cat:"card",mod:"HBL",l:"Quizlet – Handelsmanagement",      u:QZ("Handelsmanagement Einzelhandel")},
  {cat:"card",mod:"GIP",l:"Quizlet – Java Grundlagen",        u:QZ("Java Programmierung Grundlagen")},
  {cat:"card",mod:"GIP",l:"Quizlet – Boolesche Algebra",      u:QZ("Boolesche Algebra Informatik")},
];
/* ── 21-Tage-Lernplan ────────────────────────────────────────────── */
const PLAN=[
  {nr:1,w:1,e:"🏢",t:"Grundbegriffe der BWL",
   d:"Gegenstand BWL, Produktionsfaktoren, Preis-Absatz-Funktion, betriebliche Ziele, Wirtschaftlichkeitsprinzip",
   a:"SimpleClub-Video 'Was ist BWL?' (10 Min) → 5 Kernbegriffe mit Definition ins Notizbuch",
   lk:[{l:"▶ SimpleClub BWL",u:YT("SimpleClub Was ist BWL")},{l:"Studyflix Wirtschaft",u:SF("BWL Grundlagen")}]},
  {nr:2,w:1,e:"⚖️",t:"Rechtsformen & Organisation",
   d:"GbR, GmbH, AG, UG – Haftung, Kapital, Gründungsaufwand; Aufbau- vs. Ablauforganisation",
   a:"Video Rechtsformen + Tabelle: Rechtsform | Haftung | Stammkapital | E-Commerce-Beispiel",
   lk:[{l:"▶ Rechtsformen",u:SF("Rechtsformen GmbH AG")},{l:"Studyflix",u:SF("Rechtsformen Vergleich")}]},
  {nr:3,w:1,e:"🧾",t:"Buchführung: Warum & Wie?",
   d:"Buchführungspflicht HGB, Inventur & Inventar, GoB, internes vs. externes Rechnungswesen",
   a:"Video Buchführungspflicht → Welche Kaufleute müssen Bücher führen? → 3 GoB aufschreiben",
   lk:[{l:"▶ Buchführungspflicht",u:YT("Buchführungspflicht HGB einfach erklärt")},{l:"wiwiweb.de",u:"https://www.wiwiweb.de/"}]},
  {nr:4,w:1,e:"📒",t:"Soll & Haben, T-Konten",
   d:"Doppelte Buchführung, Aktiv-/Passivkonten, Buchungssatz-Schema, Konten eröffnen & abschließen",
   a:"Video Soll & Haben + 3 T-Konten selbst zeichnen: Kasse, Bank, Verbindlichkeiten",
   lk:[{l:"▶ Soll & Haben",u:SF("Soll Haben T-Konto")},{l:"wiwiweb.de Übungen",u:"https://www.wiwiweb.de/"}]},
  {nr:5,w:1,e:"📋",t:"Bilanz & GuV verstehen",
   d:"Bilanzaufbau (Aktiva/Passiva), GuV, Bilanzveränderungstypen, Eröffnungs- → Schlussbilanz",
   a:"Video Bilanz + Zalando-Jahresabschluss googeln → 5 Bilanzpositionen identifizieren",
   lk:[{l:"▶ Bilanz erklärt",u:SF("Bilanz Aktiva Passiva")},{l:"Studyflix GuV",u:SF("GuV Rechnung")}]},
  {nr:6,w:1,e:"💸",t:"Abschreibungen & Umsatzsteuer",
   d:"Planmäßige/außerplanmäßige Abschreibung; Buchung USt/VSt im E-Commerce-Kontext",
   a:"Video Abschreibung + Beispiel: Laptop 1.200 € / 5 Jahre → Jahresabschreibung berechnen",
   lk:[{l:"▶ Abschreibung",u:SF("Abschreibung AfA linear")},{l:"▶ Umsatzsteuer",u:SF("Umsatzsteuer einfach")}]},
  {nr:7,w:1,e:"🔁",t:"Woche 1 – Wiederholung BWL",
   d:"Alle BWL & Buchführungsbegriffe aus Woche 1 festigen. Mind-Map zeichnen",
   a:"Anki 10 Min + Mind-Map Woche 1 auf Papier: BWL im Zentrum, alle Unterthemen drumherum",
   lk:[{l:"🃏 Anki",u:"https://apps.ankiweb.net/"},{l:"Quizlet BWL",u:QZ("BWL Grundlagen Wirtschaft")}]},
  {nr:8,w:2,e:"🏬",t:"Was ist Handel? Grundlagen HBL",
   d:"Handelsfunktionen (Überbrückungs-, Raum-, Mengen-, Qualitäts-, Warenbestandsfunktion), 10 Handelskompetenzen",
   a:"Video Handelsmanagement + Tabelle: Funktion | stationärer Handel | E-Commerce",
   lk:[{l:"▶ Handelsmanagement",u:YT("Handelsmanagement Grundlagen Einzelhandel")},{l:"Gabler Lexikon",u:"https://wirtschaftslexikon.gabler.de/"}]},
  {nr:9,w:2,e:"🛍️",t:"Handelsformen & Vertriebstypen",
   d:"Betriebstypen (Fachhandel, Discounter, Marktplatz, Versandhandel), Sortiment, Category Management",
   a:"Lieblingsshop analysieren: Welcher Betriebstyp? Welches Sortimentskonzept (Breite/Tiefe)?",
   lk:[{l:"▶ Betriebstypen",u:YT("Betriebstypen Einzelhandel Discounter Fachhandel")},{l:"HDE Zahlen",u:"https://einzelhandel.de/"}]},
  {nr:10,w:2,e:"🌐",t:"E-Commerce Grundlagen",
   d:"Umsatz DE, Handelsfunktionen online, Wertschöpfungsstufen, Pandemie-Effekt, GAFA",
   a:"Statista E-Commerce-Zahlen DE lesen + Deges Kap.1 öffnen → 3 Kernaussagen notieren",
   lk:[{l:"📊 Statista",u:"https://de.statista.com/themen/3979/e-commerce-in-deutschland/"},{l:"📖 Deges Kap.1",u:B(17)}]},
  {nr:11,w:2,e:"🔄",t:"Geschäftsmodelle & Plattformökonomie",
   d:"B2C, B2B, C2C, D2C; GAFA als Plattformen; Netzeffekte; Multichannel vs. Omnichannel",
   a:"Video Plattformökonomie + Amazon-Ökosystem auf Papier skizzieren (Seller, Buyer, AWS, Ads)",
   lk:[{l:"▶ Plattformökonomie",u:YT("Plattformökonomie Netzeffekte erklärt")},{l:"📖 Deges Kap.2",u:B(68)}]},
  {nr:12,w:2,e:"🧠",t:"Konsumentenverhalten im E-Commerce",
   d:"ROPO-Effekt, hedonistisch vs. utilitaristisch, Kaufentscheidungsprozess, Vertrauen & Trust",
   a:"Video ROPO + Selbsttest: War dein letzter Kauf hedonistisch oder utilitaristisch?",
   lk:[{l:"▶ ROPO-Effekt",u:YT("ROPO Effekt Online Shopping erklärt")},{l:"📖 Deges Kap.4",u:B(144)}]},
  {nr:13,w:2,e:"💳",t:"Payment, Fulfillment & Nachhaltigkeit",
   d:"PayPal/Klarna/SEPA aus Händler- & Kundensicht; Fulfillment, letzte Meile, Retouren, Nachhaltigkeit",
   a:"Nächsten Online-Kauf vollständig dokumentieren: Payment → Versand → Lieferung → mögliche Retoure",
   lk:[{l:"▶ Payment E-Commerce",u:YT("Payment Methoden E-Commerce PayPal Klarna Stripe")},{l:"▶ Fulfillment",u:YT("Fulfillment letzte Meile E-Commerce Logistik")}]},
  {nr:14,w:2,e:"📝",t:"Wissenschaftliches Arbeiten",
   d:"WICHTIG: Im ECM-Modul Sem.1 gibt es eine 25-seitige Gruppenarbeit! Zitation, Gliederung, Wissenschaftssprache",
   a:"Video Hausarbeit schreiben + 5 Zitationsregeln aufschreiben + Aufbau skizzieren (7 Abschnitte)",
   lk:[{l:"▶ Hausarbeit schreiben",u:YT("Hausarbeit schreiben Aufbau Gliederung Anfänger")},{l:"Scribbr Zitieren",u:"https://www.scribbr.de/category/richtig-zitieren/"}]},
  {nr:15,w:3,e:"💻",t:"Computeraufbau & Zahlensysteme",
   d:"CPU/RAM/Speicher; Binär-, Oktal-, Hexadezimalsystem; Umrechnung – direkt Klausurstoff GIP EC!",
   a:"Video Zahlensysteme + Übungsaufgaben: 42 → Binär, 255 → Hex, 1010₂ → Dezimal",
   lk:[{l:"▶ Zahlensysteme",u:YT("Zahlensysteme Binär Hexadezimal Informatik")},{l:"Studyflix Binär",u:SF("Binärsystem Umrechnung")}]},
  {nr:16,w:3,e:"🔣",t:"Boolesche Algebra & Aussagenlogik",
   d:"AND/OR/NOT/XOR; Wahrheitstabellen; De-Morgan-Regeln – direkter Klausurstoff GIP EC!",
   a:"Video De-Morgan + 3 Wahrheitstabellen selbst aufstellen: A AND B, A OR B, NOT(A AND B)",
   lk:[{l:"▶ Boolesche Algebra",u:YT("Boolesche Algebra Wahrheitstabelle De Morgan")},{l:"Studyflix Logik",u:SF("Aussagenlogik Wahrheitstabelle")}]},
  {nr:17,w:3,e:"☕",t:"Java Basics I – Variablen & Datentypen",
   d:"Warum Java? (Prüfungssprache GIP EC!) int, double, boolean, String; Typkonvertierung; Hello World",
   a:"W3Schools Java Intro + Variables + Data Types (im Browser, kein Laptop nötig!) – 3 Lektionen",
   lk:[{l:"💻 W3Schools Java Intro",u:"https://www.w3schools.com/java/java_intro.asp"},{l:"💻 W3Schools Variables",u:"https://www.w3schools.com/java/java_variables.asp"}]},
  {nr:18,w:3,e:"🔀",t:"Java Basics II – Kontrollstrukturen",
   d:"if/else/else-if; for-Schleife; while-Schleife; switch – Pflichtthemen im GIP-Praktikum!",
   a:"W3Schools: Java Conditions + For Loop + While Loop – je 1 eigenes Beispiel tippen",
   lk:[{l:"💻 Java Conditions",u:"https://www.w3schools.com/java/java_conditions.asp"},{l:"💻 Java For Loop",u:"https://www.w3schools.com/java/java_for_loop.asp"}]},
  {nr:19,w:3,e:"🧱",t:"Java Basics III – Methoden & OOP",
   d:"Methoden mit Parametern & Rückgabewert; Klassen, Attribute, Konstruktoren, Vererbung",
   a:"Video OOP erklärt + Klasse 'Produkt' selbst skizzieren: Attribute name, preis, lagerbestand",
   lk:[{l:"💻 Java Methods",u:"https://www.w3schools.com/java/java_methods.asp"},{l:"💻 Java OOP",u:"https://www.w3schools.com/java/java_oop.asp"}]},
  {nr:20,w:3,e:"🌍",t:"Internet & Netzwerke",
   d:"HTTP/HTTPS, URLs, DNS, IP, TCP/IP, Client-Server – Basis für Datenbanken (Sem.2) & APIs",
   a:"Video Internet erklärt + alle Schritte von Browser-Eingabe bis Webseitenladung aufschreiben",
   lk:[{l:"▶ Internet erklärt",u:YT("Wie funktioniert Internet HTTP DNS TCP IP Deutsch")},{l:"MDN – Internet",u:"https://developer.mozilla.org/de/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work"}]},
  {nr:21,w:3,e:"🎓",t:"Abschluss & August-Lernplan",
   d:"3 Wochen rekapitulieren: Was sitzt? Wo sind Lücken? Konkreten August-Plan erstellen",
   a:"Top 5 Erkenntnisse + August-Plan: Java vertiefen / BWL üben / ECM Seminararbeit recherchieren",
   lk:[{l:"🃏 Anki",u:"https://apps.ankiweb.net/"},{l:"🎓 HRW Moodle",u:"https://elearning.hs-ruhrwest.de/"},{l:"💻 Udemy Java",u:"https://www.udemy.com/topic/java/?price=price-free"}]},
];
const WOCHEN=[
  {nr:1,t:"BWL & Buchführung",         e:"📊",sub:"Modul: BWL EC – Einführung in die BWL"},
  {nr:2,t:"Handel & E-Commerce",        e:"🛒",sub:"Module: HBL EC + Grundlagen E-Commerce (ECM)"},
  {nr:3,t:"Informatik & Java",          e:"💻",sub:"Modul: GIP EC – Informatik & Programmierung"},
];
/* ── Detailliert – Kompendium mit Lernziel, Prüfung, Begriffe ───── */
const DET={
  1:{
    lernziel:"Du verstehst, was Betriebswirtschaftslehre als Wissenschaft bedeutet und warum BWL-Grundkenntnisse für E-Commerce-Führungskräfte unerlässlich sind. Du unterscheidest die drei Güterarten (Sachgüter, Dienstleistungen, Rechte), kennst die vier betrieblichen Produktionsfaktoren und kannst das Wirtschaftlichkeitsprinzip in seinen beiden Ausprägungen (Minimal- und Maximalprinzip) mit konkreten E-Commerce-Beispielen erklären.",
    prüfung:"Klausur BWL EC: Minimal-/Maximalprinzip mit Zahlenbeispiel, Güterarten klassifizieren, Produktionsfaktoren benennen (Arbeit, Betriebsmittel, Werkstoffe, dispositiver Faktor), betriebliche Ziele und Zielkonflikte erläutern",
    begriffe:["Wirtschaftlichkeit","Güterarten","Produktionsfaktoren","Stakeholder","Minimalprinzip","Maximalprinzip","dispositiver Faktor"],
    subs:[
      {t:"Wirtschaft & knappe Güter",
       desc:"Wirtschaft entsteht, weil Bedürfnisse der Menschen unbegrenzt sind, aber Güter knapp. Die BWL untersucht, wie Unternehmen mit diesen knappen Ressourcen (Produktionsfaktoren) möglichst effizient umgehen. Für E-Commerce bedeutet das: Wie setzt ein Online-Händler sein Budget (Kapital) und seine Mitarbeiter (Arbeit) optimal ein?",
       items:[{c:"▶",l:"SimpleClub – Was ist BWL?",u:YT("SimpleClub Was ist BWL")},{c:"▶",l:"Studyflix – Güterarten",u:SF("Güterarten Wirtschaft")},{c:"🧠",l:"Knowunity BWL Grundlagen",u:K("BWL Grundlagen Wirtschaft Güter")},{c:"💬",l:"Studocu BWL",u:DOC("BWL Wirtschaft Grundlagen Hochschule")}]},
      {t:"Wirtschaftlichkeitsprinzip & betriebliche Ziele",
       desc:"Das Wirtschaftlichkeitsprinzip besagt: Entweder ein gegebenes Ziel mit minimalem Einsatz erreichen (Minimalprinzip) – oder mit gegebenem Einsatz das Maximum herausholen (Maximalprinzip). Betriebliche Ziele umfassen Sachziele (Produkte, Dienstleistungen), Formalziele (Gewinn, Liquidität) und soziale Ziele. Zielkonflikte entstehen z.B., wenn Nachhaltigkeitsziele den Gewinn kurzfristig senken.",
       items:[{c:"▶",l:"YouTube – Wirtschaftlichkeitsprinzip",u:YT("Wirtschaftlichkeitsprinzip Minimal Maximalprinzip BWL")},{c:"▶",l:"Studyflix – Betriebliche Ziele",u:SF("betriebliche Ziele Unternehmen")},{c:"🧠",l:"Knowunity – Zielkonflikte",u:K("betriebliche Ziele Zielkonflikte BWL")},{c:"💬",l:"Studocu – BWL Zusammenfassung",u:DOC("BWL Grundlagen Unternehmensziele Hochschule")}]},
    ]
  },
  2:{
    lernziel:"Du kennst die wichtigsten deutschen Unternehmensrechtsformen und kannst für jeden Online-Shop-Typ die passende empfehlen. Du verstehst den grundlegenden Unterschied zwischen Personen- (GbR, OHG, KG) und Kapitalgesellschaften (GmbH, AG, UG), insbesondere hinsichtlich Haftung, Stammkapital und Gründungsaufwand. Du weißt, warum die meisten E-Commerce-Startups die UG oder GmbH wählen und ab wann eine AG sinnvoll ist.",
    prüfung:"Klausur BWL EC: Rechtsformen-Tabelle vervollständigen (Haftung, Stammkapital, Leitungsorgan, Mindestpersonen), Unterschied GmbH vs. AG erklären, passende Rechtsform für ein Unternehmensbeispiel empfehlen und begründen",
    begriffe:["GmbH","AG","UG","GbR","Haftungsbeschränkung","Stammkapital","Handelsregister","Kapitalgesellschaft"],
    subs:[
      {t:"Rechtsformen im Überblick",
       desc:"Deutschland kennt sechs wichtige Rechtsformen: Einzelunternehmen (volle Haftung, kein Mindestkapital), GbR (mindestens 2 Personen, unbeschränkte Haftung), GmbH (25.000 € Stammkapital, beschränkte Haftung – die häufigste Wahl für Online-Shops), UG (ab 1 € Stammkapital, vereinfachte GmbH), AG (50.000 € Grundkapital, für börsennotierte Unternehmen) und KG/OHG.",
       items:[{c:"▶",l:"Studyflix – Rechtsformen",u:SF("Rechtsformen GmbH AG UG")},{c:"🧠",l:"Knowunity – Rechtsformen Tabelle",u:K("Rechtsformen GmbH AG Vergleich Tabelle")},{c:"💬",l:"Studocu – Rechtsformen",u:DOC("Rechtsformen Unternehmen GmbH AG Hochschule")},{c:"▶",l:"YouTube – GmbH erklärt",u:YT("GmbH einfach erklärt Gründung Stammkapital")}]},
      {t:"Haftung & Kapital – Entscheidungskriterien für E-Commerce",
       desc:"Das zentrale Entscheidungskriterium ist die Haftungsfrage: Wer für Verbindlichkeiten des Unternehmens persönlich einsteht. Bei GmbH und AG haftet nur das Gesellschaftsvermögen. Für einen neuen Online-Shop empfiehlt sich die UG (haftungsbeschränkt) als günstiger Einstieg – mit der Option auf spätere Umwandlung in eine GmbH, sobald ausreichend Rücklagen gebildet wurden.",
       items:[{c:"▶",l:"YouTube – Rechtsform wählen E-Commerce",u:YT("Welche Rechtsform Online-Shop E-Commerce GmbH UG")},{c:"🧠",l:"Knowunity – Haftung Rechtsformen",u:K("Haftung Rechtsformen Unterschiede")},{c:"💬",l:"Studocu – Rechtsform Praxisfall",u:DOC("Rechtsformen E-Commerce Online-Shop Hochschule")}]},
    ]
  },
  3:{
    lernziel:"Du verstehst, warum Buchführung gesetzlich verpflichtend ist und welche Kaufleute dem HGB unterliegen. Du kennst den Unterschied zwischen freiwilliger und gesetzlicher Buchführungspflicht, den Ablauf einer Inventur und was das Inventar von der Bilanz unterscheidet. Du verstehst die sechs Grundsätze ordnungsmäßiger Buchführung (GoB) und warum sie insbesondere für E-Commerce-Unternehmen mit internationalen Lieferanten relevant sind.",
    prüfung:"Klausur BWL EC: GoB nennen und erklären, Buchführungspflicht nach § 238 HGB beschreiben, Unterschied Inventur / Inventar / Bilanz erläutern, Kaufmannsbegriff definieren",
    begriffe:["HGB","Buchführungspflicht","GoB","Inventur","Inventar","Kaufmann","externes Rechnungswesen","§ 238 HGB"],
    subs:[
      {t:"Buchführungspflicht nach HGB",
       desc:"Nach § 238 HGB ist jeder Kaufmann verpflichtet, Bücher zu führen und in diesen seine Handelsgeschäfte und die Lage seines Vermögens nach den Grundsätzen ordnungsmäßiger Buchführung ersichtlich zu machen. Ein Online-Händler, der als Einzelkaufmann oder GmbH handelt, unterliegt dieser Pflicht. Kleinunternehmer unter 600.000 € Umsatz können unter Umständen eine vereinfachte EÜR nutzen.",
       items:[{c:"▶",l:"YouTube – Buchführungspflicht HGB",u:YT("Buchführungspflicht HGB § 238 Kaufleute")},{c:"📚",l:"wiwiweb.de Buchführung",u:"https://www.wiwiweb.de/"},{c:"🧠",l:"Knowunity – Buchführungspflicht",u:K("Buchführung Pflicht HGB Grundlagen")},{c:"💬",l:"Studocu – Rechnungswesen",u:DOC("Buchführung Rechnungswesen Grundlagen Hochschule")}]},
      {t:"GoB – 6 Grundsätze ordnungsmäßiger Buchführung",
       desc:"Die GoB sind ungeschriebene Regeln der Buchführungspraxis: (1) Richtigkeit & Willkürfreiheit, (2) Vollständigkeit, (3) Übersichtlichkeit & Nachvollziehbarkeit, (4) Einzelbewertung, (5) Vorsichtsprinzip, (6) Periodenabgrenzung (Abgrenzungsprinzip). Für E-Commerce besonders relevant: Das Vorsichtsprinzip beim Bewerten von Warenbeständen und das Realisationsprinzip bei mehrmonatigen Softwareprojekten.",
       items:[{c:"▶",l:"YouTube – GoB erklärt",u:YT("Grundsätze ordnungsmäßiger Buchführung GoB einfach erklärt")},{c:"▶",l:"Studyflix – Rechnungswesen",u:SF("Rechnungswesen Grundlagen Überblick")},{c:"🧠",l:"Knowunity – GoB",u:K("GoB Grundsätze ordnungsmäßige Buchführung")}]},
    ]
  },
  4:{
    lernziel:"Du beherrschst das Grundprinzip der doppelten Buchführung: Jeder Geschäftsvorfall wird auf zwei Konten gebucht – einmal im Soll und einmal im Haben. Du kannst T-Konten für Aktiv- und Passivkonten korrekt anlegen, eröffnen und abschließen. Du verstehst die Merkregel 'Soll an Haben' und kannst für gängige E-Commerce-Vorgänge (Wareneingang auf Ziel, PayPal-Zahlung, Kauf auf Rechnung) eigenständig Buchungssätze bilden.",
    prüfung:"Klausur BWL EC: T-Konten eröffnen und führen, Buchungssätze bilden (z.B. Waren auf Ziel kaufen: Wareneingang 500 € an Verbindlichkeiten 500 €), Saldo berechnen, Abschluss eines Aktivkontos",
    begriffe:["Soll","Haben","T-Konto","Buchungssatz","Aktivkonto","Passivkonto","Saldo","doppelte Buchführung"],
    subs:[
      {t:"Das T-Konto – Soll links, Haben rechts",
       desc:"Das T-Konto ist die visuelle Grundlage der Buchführung. Links steht immer das Soll, rechts immer das Haben – unabhängig davon, ob es ein Aktiv- oder Passivkonto ist. Bei Aktivkonten (z.B. Kasse) bedeutet eine Buchung im Soll eine Erhöhung; bei Passivkonten (z.B. Verbindlichkeiten) bedeutet eine Buchung im Haben eine Erhöhung. Ein Shop-Beispiel: Warenbestand (Aktiv) steigt durch Wareneinkauf → Buchung im Soll.",
       items:[{c:"▶",l:"Studyflix – Soll & Haben",u:SF("Soll Haben T-Konto Buchführung")},{c:"📚",l:"wiwiweb.de – T-Konto Übungen",u:"https://www.wiwiweb.de/"},{c:"🧠",l:"Knowunity – T-Konten",u:K("T-Konto Buchführung Soll Haben")},{c:"💬",l:"Studocu – Buchungssätze Aufgaben",u:DOC("Buchungssätze T-Konto Aufgaben Lösungen")}]},
      {t:"Buchungssätze für E-Commerce-Vorgänge",
       desc:"Praxisbeispiele für Buchungssätze: (1) Wareneinkauf auf Ziel: Wareneingang 500 € / Verbindlichkeiten 500 €. (2) Zahlung per Banküberweisung: Verbindlichkeiten 500 € / Bank 500 €. (3) Online-Verkauf (Ausgangsrechnung): Forderungen 119 € / Umsatzerlöse 100 € / USt 19 €. Diese Vorgänge erscheinen regelmäßig in der Klausur!",
       items:[{c:"▶",l:"YouTube – Buchungssatz bilden",u:YT("Buchungssatz bilden Soll Haben einfach erklärt")},{c:"▶",l:"Studyflix – Buchungssatz",u:SF("Buchungssatz Schema")},{c:"🧠",l:"Knowunity – Buchungssätze E-Commerce",u:K("Buchungssätze Wareneinkauf Verkauf Buchführung")}]},
    ]
  },
  5:{
    lernziel:"Du kannst eine Bilanz lesen und die wichtigsten Positionen auf Aktiv- (Anlagevermögen, Umlaufvermögen) und Passivseite (Eigenkapital, Fremdkapital) einordnen. Du verstehst, wie die Gewinn- und Verlustrechnung (GuV) aufgebaut ist und erkennst den Zusammenhang zwischen Bilanz, GuV und Eigenkapital. Du kannst die vier Bilanzveränderungstypen unterscheiden.",
    prüfung:"Klausur BWL EC: Bilanzpositionen zuordnen (aktiv oder passiv?), Bilanzveränderungstypen nennen und erkennen, GuV-Schema ausfüllen, Jahresüberschuss/-fehlbetrag berechnen, Bilanzsumme-Gleichung (Aktiva = Passiva) anwenden",
    begriffe:["Aktiva","Passiva","Eigenkapital","Fremdkapital","Anlagevermögen","Umlaufvermögen","Jahresüberschuss","Bilanzsumme"],
    subs:[
      {t:"Bilanzaufbau – Aktiva und Passiva",
       desc:"Die Bilanz ist eine Momentaufnahme des Vermögens (Aktiva) und der Finanzierung (Passiva) zu einem Stichtag. Aktiva: Anlagevermögen (langfristig: Maschinen, Software, Patente) + Umlaufvermögen (kurzfristig: Waren, Forderungen, Kasse). Passiva: Eigenkapital (was Eigentümer eingebracht haben) + Fremdkapital (Schulden bei Banken, Lieferanten). Für Zalando bedeutet das: Lagerwaren und Forderungen aus Retouren sind das größte Umlaufvermögen.",
       items:[{c:"▶",l:"Studyflix – Bilanz erklärt",u:SF("Bilanz Aktiva Passiva Aufbau")},{c:"🧠",l:"Knowunity – Bilanz Aufbau",u:K("Bilanz Aktiva Passiva Aufbau einfach")},{c:"💬",l:"Studocu – Bilanz Aufgaben",u:DOC("Bilanz Jahresabschluss BWL Hochschule Aufgaben")}]},
      {t:"GuV & die 4 Bilanzveränderungstypen",
       desc:"Die GuV zeigt Ertrag vs. Aufwand in einer Periode. Vier Bilanzveränderungstypen: (1) Aktiv-Tausch: Kasse ↑, Bank ↓ – Bilanzsumme gleich. (2) Passiv-Tausch: EK ↑, Verbindlichkeiten ↓. (3) Aktiv-Passiv-Mehrung: Ware ↑ (Aktiv), Verbindlichkeiten ↑ (Passiv) – Bilanzsumme steigt. (4) Aktiv-Passiv-Minderung: Bank ↓, Kredit ↓ – Bilanzsumme sinkt.",
       items:[{c:"▶",l:"Studyflix – GuV Rechnung",u:SF("GuV Gewinn Verlustrechnung Aufbau")},{c:"▶",l:"YouTube – Bilanzveränderungen",u:YT("Bilanzveränderungen 4 Typen Buchführung einfach")},{c:"🧠",l:"Knowunity – GuV",u:K("GuV Gewinn Verlustrechnung einfach Aufbau")}]},
    ]
  },
  6:{
    lernziel:"Du verstehst, warum Anlagevermögen abgeschrieben wird und kannst lineare und degressive Abschreibung für typische E-Commerce-Assets (Server, Laptop, Lagerhalle) berechnen. Du kennst den Unterschied zwischen Vorsteuer (VSt) und Umsatzsteuer (USt) aus Händler- und Kundensicht und kannst den USt-Buchungssatz für einen Online-Kauf korrekt bilden.",
    prüfung:"Klausur BWL EC: Jahresabschreibung linear berechnen (Anschaffungskosten / Nutzungsdauer), Buchwert zum Stichtag ermitteln, USt-Buchungssatz bilden (Nettobetrag / USt 19% / Bruttobetrag), Vorsteuer vs. Umsatzsteuer aus Unternehmenssicht erklären",
    begriffe:["Abschreibung","AfA","Buchwert","Restbuchwert","Vorsteuer","Umsatzsteuer","Nutzungsdauer","Anschaffungskosten"],
    subs:[
      {t:"Lineare Abschreibung & AfA-Tabelle",
       desc:"Anlagevermögen verliert durch Nutzung an Wert. Die lineare Abschreibung verteilt die Kosten gleichmäßig über die Nutzungsdauer: AfA = Anschaffungskosten / Nutzungsdauer. Beispiel Shopify-Server-Hardware: 12.000 € / 4 Jahre = 3.000 €/Jahr. Das Finanzamt gibt in der AfA-Tabelle vor, wie lange verschiedene Güter genutzt werden dürfen (PC = 3 Jahre, Lkw = 6 Jahre, Gebäude = 33 Jahre).",
       items:[{c:"▶",l:"Studyflix – Abschreibungsarten",u:SF("Abschreibung linear degressiv AfA")},{c:"🧠",l:"Knowunity – Abschreibung Aufgaben",u:K("Abschreibung lineare Berechnung Aufgaben")},{c:"💬",l:"Studocu – Abschreibung Lösungen",u:DOC("Abschreibungen Rechnungswesen Aufgaben Lösungen")},{c:"▶",l:"YouTube – AfA Buchwert berechnen",u:YT("Abschreibung AfA Buchwert berechnen Beispiel")}]},
      {t:"Umsatzsteuer – VSt & USt im E-Commerce",
       desc:"Als Unternehmer zahlst du beim Einkauf Vorsteuer (VSt), die du vom Finanzamt zurückholst, und erhebst beim Verkauf Umsatzsteuer (USt), die du ans Finanzamt abführst. Du bist quasi Steuereinnehmer des Staates. Buchungssatz Warenverkauf: Forderungen 119 € / Umsatzerlöse 100 € / USt-Verbindlichkeiten 19 €. Im EU-Onlinehandel: Ab 10.000 € Jahresumsatz grenzüberschreitend greift das OSS-Verfahren (One Stop Shop).",
       items:[{c:"▶",l:"Studyflix – Umsatzsteuer",u:SF("Umsatzsteuer Vorsteuer einfach erklärt")},{c:"🧠",l:"Knowunity – USt Buchungssatz",u:K("Umsatzsteuer Vorsteuer Buchungssatz")},{c:"▶",l:"YouTube – USt E-Commerce",u:YT("Umsatzsteuer E-Commerce Online-Handel OSS")}]},
    ]
  },
  7:{
    lernziel:"Du festigst alle Inhalte aus Woche 1 durch aktive Wiederholung mit Anki und Mind-Map. Ziel: Du kannst ohne Hilfsmittel T-Konten aufstellen, Buchungssätze bilden, die 4 Bilanzveränderungstypen nennen und das Wirtschaftlichkeitsprinzip erklären. Spaced Repetition (Anki) ist bewiesen die effektivste Methode für Klausurvorbereitung.",
    prüfung:"Gesamtwiederholung Woche 1 – alle Themen sind direkt klausurrelevant im BWL-EC-Modul",
    begriffe:["Spaced Repetition","Aktives Erinnern","Mind-Map","Anki","Wiederholung","Lernkurve"],
    subs:[
      {t:"Anki effektiv nutzen – Spaced Repetition",
       desc:"Anki ist eine Karteikarten-App, die auf dem Prinzip des Spaced Repetition basiert: Karten, die du noch nicht gut kennst, zeigt sie öfter; sichere Karten weniger oft. Damit lernst du in minimalster Zeit maximal viel. Erstelle für jede BWL-Definition und jeden Buchungssatz eine eigene Karte. Ziel für Woche 1: 35+ Karten, Trefferquote > 80%.",
       items:[{c:"🃏",l:"Anki App (iOS/Android/Desktop)",u:"https://apps.ankiweb.net/"},{c:"▶",l:"YouTube – Anki Tutorial Deutsch",u:YT("Anki Tutorial Deutsch Karteikarten Spaced Repetition")},{c:"🧠",l:"Knowunity – BWL Gesamtübersicht",u:K("BWL Zusammenfassung Prüfungsvorbereitung")}]},
      {t:"Mind-Map als Verbindungsstruktur",
       desc:"Zeichne eine Mind-Map mit 'BWL' im Zentrum und allen 6 Themen der Woche als Äste: Grundbegriffe, Rechtsformen, Buchführung, Soll/Haben, Bilanz, Abschreibungen. Trage unter jedem Ast die wichtigsten 3 Schlüsselbegriffe ein. Das visuelle Ordnen stärkt das Langzeitgedächtnis und hilft dir, Klausurthemen schnell einzuordnen.",
       items:[{c:"▶",l:"YouTube – Mind-Map Methode",u:YT("Mind Map erstellen Lernmethode effektiv")},{c:"💬",l:"Studocu – BWL Klausur",u:DOC("BWL Klausuraufgaben Lösungen Hochschule")}]},
    ]
  },
  8:{
    lernziel:"Du verstehst, was Handelsmanagement als Disziplin bedeutet und welche wirtschaftliche Funktion Handelsbetriebe in der Wertschöpfungskette übernehmen. Du kennst die 5 klassischen Handelsfunktionen und kannst erklären, wie E-Commerce diese verändert oder teilweise obsolet macht. Du kennst die 10 Handelskompetenzen nach dem HBL-EC-Modul der HRW.",
    prüfung:"Klausur HBL EC: 5 Handelsfunktionen nennen und beschreiben, Unterschied Einzel-/Großhandel, Disintermediation erklären, Handelskompetenzen benennen",
    begriffe:["Handelsfunktion","Einzelhandel","Großhandel","Disintermediation","Handelsmanagement","Wertschöpfungskette","Überbrückungsfunktion"],
    subs:[
      {t:"Die 5 klassischen Handelsfunktionen",
       desc:"Handelsbetriebe erfüllen 5 Funktionen: (1) Überbrückungsfunktion (Raum & Zeit: Ware vom Hersteller zum Kunden bringen), (2) Quantitätsfunktion (große Mengen vom Hersteller, kleine an Kunden), (3) Qualitätsfunktion (Sortimentszusammenstellung), (4) Kreditfunktion (Kauf auf Rechnung ermöglichen), (5) Werbefunktion (Produkte bekannt machen). Im E-Commerce entfallen teilweise Raum- und Zeitfunktionen durch Direktversand (Dropshipping).",
       items:[{c:"▶",l:"YouTube – Handelsfunktionen",u:YT("Handelsfunktionen 5 Funktionen Handel erklärt")},{c:"🧠",l:"Knowunity – Handelsmanagement",u:K("Handelsmanagement Handelsfunktionen Einzelhandel")},{c:"💬",l:"Studocu – HBL Zusammenfassung",u:DOC("Handelsmanagement HBL Zusammenfassung Hochschule")}]},
      {t:"Disintermediation – wenn Handel überflüssig wird",
       desc:"Disintermediation beschreibt die Ausschaltung von Handelsstufen durch das Internet: Hersteller können direkt an Endkunden verkaufen (D2C). Nike verkauft über nike.com direkt, Tesla über eigene Showrooms. Das zwingt den traditionellen Handel zur Spezialisierung und Innovation. Im HBL-EC-Modul ist dieser Wandel ein zentrales Thema.",
       items:[{c:"▶",l:"YouTube – Disintermediation",u:YT("Disintermediation Handel Internet D2C erklärt")},{c:"📖",l:"Gabler – Handelsmanagement",u:"https://wirtschaftslexikon.gabler.de/"},{c:"📊",l:"HDE – Handelsdaten",u:"https://einzelhandel.de/"}]},
    ]
  },
  9:{
    lernziel:"Du kannst die verschiedenen Betriebstypen des stationären und digitalen Handels unterscheiden: Fachhandel, Verbrauchermarkt, Discounter, Versandhandel, Online-Marktplatz. Du verstehst Sortimentsstrategie (Breite vs. Tiefe) und Category Management und erkennst den Unterschied zwischen Multi-, Cross- und Omnichannel-Handel.",
    prüfung:"Klausur HBL EC: Betriebstypen zuordnen und Beispiele nennen, Sortimentsbreite vs. -tiefe erläutern, Omnichannel vs. Multichannel unterscheiden, Category Management beschreiben",
    begriffe:["Betriebstyp","Sortimentsbreite","Sortimentstiefe","Category Management","Omnichannel","Multichannel","Fachhandel","Discounter"],
    subs:[
      {t:"Betriebstypen im Überblick",
       desc:"Fachhandel: tiefes Sortiment (z.B. MediaMarkt für Elektronik), hohe Beratungskompetenz. Verbrauchermarkt/SB-Warenhaus: breites, tiefes Sortiment (Kaufland). Discounter: schmales, flaches Sortiment, Preisführerschaft (Aldi, Lidl). Versandhandel/E-Commerce: kein stationärer Punkt, unbegrenzte Sortimentsbreite möglich (Amazon). Marktplatz: Plattform für Drittanbieter (Amazon Marketplace, Etsy).",
       items:[{c:"▶",l:"YouTube – Betriebstypen",u:YT("Betriebstypen Einzelhandel Fachhandel Discounter Verbrauchermarkt")},{c:"🧠",l:"Knowunity – Betriebstypen",u:K("Betriebstypen Handel Übersicht")},{c:"💬",l:"Studocu – HBL Mitschriften",u:DOC("Handelsmanagement Betriebstypen Sortiment")}]},
      {t:"Omnichannel – die Zukunft des Handels",
       desc:"Omnichannel bedeutet, dass alle Verkaufskanäle (Filiale, Website, App, Social Commerce) nahtlos vernetzt sind und ein einheitliches Kundenerlebnis bieten: Bestellung online, Abholung im Laden (Click & Collect), Rückgabe im Store. Im Gegensatz zu Multichannel, bei dem Kanäle parallel, aber getrennt existieren. Zalando und H&M sind Paradebeispiele für Omnichannel-Händler.",
       items:[{c:"▶",l:"YouTube – Omnichannel erklärt",u:YT("Omnichannel Multichannel Crosschannel Unterschied")},{c:"📊",l:"HDE Handelsverband",u:"https://einzelhandel.de/"},{c:"🧠",l:"Knowunity – Omnichannel",u:K("Omnichannel Multichannel Handel erklärt")}]},
    ]
  },
  10:{
    lernziel:"Du kennst die aktuellen Umsatzzahlen des deutschen E-Commerce-Markts und kannst die wichtigsten Entwicklungsphasen seit 1995 benennen. Du verstehst, warum Online-Handel ein Disruptor für den stationären Handel ist und welche Unternehmen als 'GAFA' bezeichnet werden. Du kannst die Wertschöpfungsstufen des E-Commerce beschreiben.",
    prüfung:"Klausur ECM: E-Commerce Umsatzzahlen DE (aktuelle Größenordnung kennen), Entwicklungsgeschichte Internethandel, Disruption und Disintermediation erklären, GAFA beschreiben",
    begriffe:["E-Commerce","Disruption","GAFA","Wertschöpfungskette","Stationärer Handel","bevh","Corona-Effekt"],
    subs:[
      {t:"E-Commerce Entwicklung & aktuelle Zahlen",
       desc:"Deutsche E-Commerce-Geschichte: 1995 erste Online-Shops, 1999 eBay & Amazon DE, 2005 Zalando-Gründung, 2011–2019 kontinuierliches Wachstum, 2020–2021 Corona-Boom (+30%), danach Normalisierung. Heute: Laut bevh erzielte der deutsche Online-Handel 2023 ca. 79,7 Mrd. Euro Umsatz. Die wichtigsten Kategorien: Mode, Elektronik, Möbel. Amazon, Otto und Zalando sind die Top-3-Plattformen in Deutschland.",
       items:[{c:"📊",l:"Statista – E-Commerce DE Umsatz",u:"https://de.statista.com/themen/3979/e-commerce-in-deutschland/"},{c:"📊",l:"bevh – Marktdaten",u:"https://www.bevh.org/zahlen-daten-fakten/"},{c:"📖",l:"Deges Kap.1.5 – Ökonomische Bedeutung (S.20)",u:B(36)},{c:"📖",l:"Deges Kap.1.5.3 – Corona-Effekt (S.26)",u:B(42)}]},
      {t:"Disruption durch E-Commerce",
       desc:"E-Commerce hat ganze Branchen disruptiert: Buchhandel (Hugendubel schließt Filialen wegen Amazon), Musik (CD-Handel ersetzt durch Streaming), Reisebüros (durch booking.com). Disruption nach Christensen: Neue Technologie tritt zunächst im Niedrigpreissegment an und verdrängt dann die etablierten Spieler von unten. Im HRW-Modul ECM ist dieses Konzept Prüfungsstoff.",
       items:[{c:"📖",l:"Deges Kap.1.4 – Disruption (S.16)",u:B(32)},{c:"▶",l:"YouTube – Disruption Handel",u:YT("Disruption Branchentransformation E-Commerce stationärer Handel")}]},
    ]
  },
  11:{
    lernziel:"Du unterscheidest sicher zwischen B2C, B2B, C2C und D2C und kannst für jedes Modell drei reale Beispiele nennen. Du verstehst das Konzept der Plattformökonomie mit Netzeffekten und kannst erklären, warum Marktplätze wie Amazon Daten als Wettbewerbsvorteil nutzen. Du kennst den Unterschied zwischen Online-Direktgeschäft und Marktplatzmodell.",
    prüfung:"Klausur ECM: Geschäftsmodelle definieren und mit Beispielen belegen, Netzwerkeffekte erklären, Vor-/Nachteile Marktplatz vs. eigener Shop, Plattformökonomie beschreiben",
    begriffe:["B2C","B2B","C2C","D2C","Plattform","Netzwerkeffekte","Marktplatz","Direktgeschäft"],
    subs:[
      {t:"Geschäftsmodelle im E-Commerce",
       desc:"B2C (Business-to-Consumer): Unternehmen an Endverbraucher (Zalando, Amazon Retail). B2B (Business-to-Business): Unternehmen an Unternehmen (Amazon Business, Alibaba). C2C (Consumer-to-Consumer): Verbraucher an Verbraucher über Plattform (eBay Kleinanzeigen, Vinted). D2C (Direct-to-Consumer): Hersteller direkt an Endkunde ohne Zwischenhändler (Nike.com, Tesla). D2C wächst stark, weil Hersteller Kundendaten selbst kontrollieren wollen.",
       items:[{c:"📖",l:"Deges Kap.2.1 – Marktformen (S.53)",u:B(68)},{c:"📖",l:"Deges Kap.2.1.5 – D2C (S.59)",u:B(74)},{c:"🧠",l:"Knowunity – Geschäftsmodelle",u:K("B2B B2C D2C Geschäftsmodelle E-Commerce")},{c:"▶",l:"YouTube – D2C erklärt",u:YT("D2C Direct to Consumer Geschäftsmodell erklärt")}]},
      {t:"Plattformökonomie & Netzwerkeffekte",
       desc:"Plattformen schaffen Mehrwert durch Vernetzung von Angebot und Nachfrage. Je mehr Nutzer eine Plattform hat, desto attraktiver wird sie für neue Nutzer – das sind positive Netzwerkeffekte. Amazon hatte 2023 über 300 Millionen Kunden weltweit und über 2 Millionen aktive Drittanbieter. Diese Datenmacht ermöglicht personalisierte Empfehlungen (Recommendation Engine) und Preisoptimierung in Echtzeit.",
       items:[{c:"📖",l:"Deges Kap.2.3 – Marktplätze (S.62)",u:B(77)},{c:"📖",l:"Deges Kap.2.5.3 – Big Data & KI (S.96)",u:B(111)},{c:"▶",l:"YouTube – Plattformökonomie",u:YT("Plattformökonomie Amazon Netzeffekte erklärt")},{c:"💬",l:"Studocu – Plattformökonomie",u:DOC("Plattformökonomie Netzeffekte Hochschule")}]},
    ]
  },
  12:{
    lernziel:"Du kannst den fünfstufigen Kaufentscheidungsprozess beschreiben und auf Online-Kaufsituationen anwenden. Du kennst den ROPO-Effekt und seinen Gegensatz (TOPO) und verstehst ihre Bedeutung für Omnichannel-Strategien. Du kannst hedonistischen vom utilitaristischen Kauf unterscheiden und verschiedene Konsumententypologien benennen.",
    prüfung:"Klausur ECM: Kaufentscheidungsprozess skizzieren (5 Phasen), ROPO-Effekt erklären, Konsumententypologien (hedonistisch, utilitaristisch) unterscheiden, Vertrauen als Kaufhemmnis im E-Commerce",
    begriffe:["Kaufentscheidungsprozess","ROPO","TOPO","Hedonistisch","Utilitaristisch","Trust","Conversion Rate","Kaufhemmnis"],
    subs:[
      {t:"5-stufiger Kaufentscheidungsprozess",
       desc:"(1) Problemerkennung: Ich brauche neue Kopfhörer. (2) Informationssuche: Google, YouTube-Reviews, Amazon-Rezensionen. (3) Alternativbewertung: Sony vs. Apple vs. Sennheiser – Preisvergleich, Testberichte. (4) Kaufentscheidung: Kauf auf Amazon mit Prime. (5) Nachkaufverhalten: Bewertung schreiben, Retoure prüfen, Empfehlung an Freunde. E-Commerce-Händler müssen in jeder Phase präsent sein (SEO, Ads, Trust-Signale, After-Sales).",
       items:[{c:"📖",l:"Deges Kap.4.2 – Kaufentscheidung (S.130)",u:B(144)},{c:"▶",l:"YouTube – Kaufentscheidungsprozess",u:YT("Kaufentscheidungsprozess 5 Phasen E-Commerce")},{c:"🧠",l:"Knowunity – Kaufentscheidung",u:K("Kaufentscheidungsprozess Konsument Phasen")}]},
      {t:"ROPO-Effekt & Konsumententypologien",
       desc:"ROPO = Research Online, Purchase Offline: Kunde informiert sich online, kauft aber im Laden. TOPO = Try Offline, Purchase Online: Kunde probiert im Laden an, kauft günstiger online. Beide Effekte zeigen: Online und stationär sind nicht getrennt, sondern verflochten. Konsumententypologien: Hedonisten kaufen aus Freude am Einkaufen (Impulskauf); Utilitaristen kaufen zielorientiert, rational und preisbewusst.",
       items:[{c:"📖",l:"Deges Kap.4.3 – Konsumententypologien (S.139)",u:B(153)},{c:"▶",l:"YouTube – ROPO-Effekt",u:YT("ROPO Effekt Research Online Purchase Offline")},{c:"💬",l:"Studocu – Konsumentenverhalten",u:DOC("Konsumentenverhalten E-Commerce Online Shopping")}]},
    ]
  },
  13:{
    lernziel:"Du kennst die wichtigsten Zahlungsmethoden im deutschen E-Commerce aus Kunden- und Händlersicht und kannst deren Kosten und Ausfallrisiken einschätzen. Du verstehst Fulfillment-Modelle (Inhouse, 3PL, Dropshipping) und weißt, warum die 'letzte Meile' der teuerste Teil der Lieferkette ist. Du kennst Nachhaltigkeitsansätze im E-Commerce-Versand.",
    prüfung:"Klausur ECM: Payment-Methoden Vor-/Nachteile aus Händlersicht nennen, Fulfillment-Modelle beschreiben, Retouren und ihre Kosten erklären, Nachhaltigkeit der letzten Meile",
    begriffe:["Payment Gateway","Zahlungsausfallrisiko","Fulfillment","3PL","Dropshipping","Letzte Meile","Retoure","CO2-Kompensation"],
    subs:[
      {t:"Payment-Methoden aus Händlersicht",
       desc:"Kauf auf Rechnung: Beliebteste Methode in DE (30%+ Marktanteil), hohes Zahlungsausfallrisiko für Händler. PayPal: Schnell, sicher, aber Gebühren 1,5–3%. Klarna (BNPL): Ratenkauf, Händler erhält sofort Geld, Klarna trägt das Ausfallrisiko gegen Gebühr. Kreditkarte: Weltweit, aber chargeback-Risiko. SEPA-Lastschrift: Günstig, aber Rückbuchungsrisiko. Für E-Commerce-Händler: Breites Payment-Angebot erhöht Conversion Rate!",
       items:[{c:"▶",l:"YouTube – Payment E-Commerce",u:YT("Payment Methoden E-Commerce Vergleich PayPal Klarna Kreditkarte")},{c:"🧠",l:"Knowunity – Payment",u:K("Payment E-Commerce Zahlungsmethoden Online-Shop")},{c:"💬",l:"Studocu – Payment",u:DOC("Payment Fulfillment E-Commerce Hochschule")}]},
      {t:"Fulfillment & Nachhaltigkeit der letzten Meile",
       desc:"Fulfillment umfasst: Lagerung, Kommissionierung, Verpackung, Versand, Retouren. 3 Modelle: (1) Inhouse: Händler macht alles selbst (Kontrolle, aber kapitalintensiv). (2) 3PL (Third-Party Logistics): DHL, Hermes übernehmen Logistik. (3) Dropshipping: Hersteller versendet direkt – kein Lager nötig, aber weniger Kontrolle. Die letzte Meile (vom Depot zum Kunden) macht 40–50% der Logistikkosten aus. Nachhaltigkeit: E-Fahrzeuge, Paketstationen, CO2-neutrale Optionen.",
       items:[{c:"▶",l:"YouTube – Fulfillment & Letzte Meile",u:YT("Fulfillment letzte Meile E-Commerce Logistik erklärt")},{c:"📊",l:"DHL Nachhaltigkeit",u:"https://www.dhl.com/de-de/home/nachhaltigkeit.html"},{c:"🧠",l:"Knowunity – Logistik",u:K("Logistik Fulfillment E-Commerce letzte Meile")}]},
    ]
  },
  14:{
    lernziel:"Du kennst den strukturellen Aufbau einer wissenschaftlichen Seminararbeit und kannst jeden Abschnitt mit Inhalt füllen. Du verstehst den Unterschied zwischen Primär- und Sekundärquellen, findest seriöse wissenschaftliche Quellen und kannst korrekt zitieren. WICHTIG: Im ECM-Modul Semester 1 schreibst du eine 25-seitige Gruppenarbeit zu einem realen Handelsunternehmen.",
    prüfung:"Seminararbeit ECM Sem.1: 25 Seiten Gruppenarbeit, wissenschaftliche Sprache, korrekte Zitation (APA oder Harvard), Literaturverzeichnis, Eigenständigkeitserklärung",
    begriffe:["Seminararbeit","Zitation","Literaturverzeichnis","Primärquelle","Sekundärquelle","APA-Stil","Wissenschaftssprache","Plagiat"],
    subs:[
      {t:"Aufbau der wissenschaftlichen Seminararbeit",
       desc:"Klassischer Aufbau (7 Teile): (1) Titelblatt (Name, Modul, Betreuer, Datum). (2) Inhaltsverzeichnis mit Seitenzahlen. (3) Abbildungsverzeichnis (falls vorhanden). (4) Einleitung (Thema + Fragestellung + Aufbau der Arbeit – ca. 1 Seite). (5) Hauptteil (Theorie, Analyse, Ergebnisse – 20+ Seiten). (6) Fazit & Ausblick (ca. 1 Seite). (7) Literaturverzeichnis. Sprache: Wissenschaftlich, kein 'Ich', unpersönlich, präzise.",
       items:[{c:"▶",l:"YouTube – Seminararbeit Aufbau",u:YT("Seminararbeit schreiben Aufbau Gliederung Anleitung")},{c:"📚",l:"Scribbr – Gliederung",u:"https://www.scribbr.de/richtig-zitieren/gliederung/"},{c:"🧠",l:"Knowunity – Wiss. Schreiben",u:K("Wissenschaftlich schreiben Seminararbeit Aufbau")},{c:"💬",l:"Studocu – Seminararbeit Beispiel",u:DOC("Seminararbeit E-Commerce Beispiel Hochschule")}]},
      {t:"Zitation & seriöse Quellen finden",
       desc:"In-Text-Zitation APA: (Deges, 2023, S. 20). Literaturverzeichnis: Deges, F. (2023). Grundlagen des E-Commerce (2. Aufl.). Springer Gabler. Seriöse Quellen: Springer Link, EBSCO, Google Scholar, statista.com (Vorsicht: nur als Sekundärquelle), bevh.org. Vorsicht: Wikipedia und Blogs sind keine zitierfähigen Quellen! Das Buch von Deges ist dein Primärwerk für das ECM-Modul.",
       items:[{c:"📚",l:"Scribbr – APA Zitieren",u:"https://www.scribbr.de/category/richtig-zitieren/"},{c:"📚",l:"Citavi Tutorials",u:"https://www.citavi.com/de/tutorials"},{c:"🌐",l:"Google Scholar",u:"https://scholar.google.de/"},{c:"📖",l:"Springer Link",u:"https://link.springer.com/"}]},
    ]
  },
  15:{
    lernziel:"Du kennst die grundlegenden Hardware-Komponenten eines Computers (CPU, RAM, Festplatte, Mainboard, GPU) und verstehst das Von-Neumann-Prinzip. Du kannst Zahlen sicher zwischen Dezimal-, Binär-, Oktal- und Hexadezimalsystem umrechnen – das ist direkt klausurrelevant im GIP-EC-Modul! Du verstehst, warum Computer intern im Binärsystem arbeiten.",
    prüfung:"Klausur GIP EC: Umrechnung Dezimal ↔ Binär ↔ Hex (Rechenaufgaben mit Lösungsweg!), Von-Neumann-Architektur skizzieren, Hardware-Komponenten benennen und erklären",
    begriffe:["CPU","RAM","Binärsystem","Hexadezimal","Von-Neumann","Bit","Byte","ASCII"],
    subs:[
      {t:"Computeraufbau & Von-Neumann-Architektur",
       desc:"Ein Computer nach Von-Neumann besteht aus: CPU (rechnet und steuert), Hauptspeicher RAM (flüchtig, schnell), Festplatte/SSD (persistent, langsam), Eingabe (Tastatur) und Ausgabe (Monitor). Die CPU besteht aus ALU (Arithmetisch-Logische Einheit, rechnet), Steuerwerk (organisiert Abläufe) und Registern (ultraschneller Speicher). Für Java-Programmierung wichtig: Dein Programm liegt als .class-Datei auf der Festplatte, wird in den RAM geladen und von der CPU ausgeführt.",
       items:[{c:"▶",l:"YouTube – Computeraufbau",u:YT("Computeraufbau CPU RAM Festplatte einfach erklärt")},{c:"🧠",l:"Knowunity – Computeraufbau",u:K("Computeraufbau CPU RAM Speicher Informatik")},{c:"📊",l:"Studyflix – Von-Neumann",u:SF("Von Neumann Architektur")}]},
      {t:"Zahlensysteme – Umrechnung für die Klausur",
       desc:"Dezimal (Basis 10): Unser Alltag. Binär (Basis 2): Nur 0 und 1 – so denkt der Computer. Hexadezimal (Basis 16): Kompakte Darstellung binärer Daten (Farben in HTML: #FF5733). Umrechnung Dezimal → Binär: Wiederholtes Dividieren durch 2, Rest aufschreiben von unten nach oben. Beispiel: 42 = 101010₂. Umrechnung Hex: Jede Hex-Stelle entspricht 4 Bit (0=0000, F=1111, A=1010). Diese Aufgaben kommen garantiert in der GIP-Klausur!",
       items:[{c:"📊",l:"Studyflix – Binärsystem",u:SF("Binärsystem Umrechnung Dezimal")},{c:"📊",l:"Studyflix – Hexadezimal",u:SF("Hexadezimalsystem Umrechnung")},{c:"▶",l:"YouTube – Binär Dezimal",u:YT("Dezimal Binär Hexadezimal Umrechnung Aufgaben")},{c:"💬",l:"Studocu – Zahlensysteme",u:DOC("Zahlensysteme Informatik Binär Hex Hochschule")}]},
    ]
  },
  16:{
    lernziel:"Du kannst Wahrheitstabellen für AND, OR, NOT, XOR und NAND eigenständig aufstellen und auswerten. Du kennst die De-Morgan-Regeln und kannst logische Ausdrücke vereinfachen. Du verstehst, wie boolesche Logik die Grundlage für if-Bedingungen in Java bildet. Diese Themen sind ausdrücklich Klausurstoff im GIP-EC-Modul der HRW.",
    prüfung:"Klausur GIP EC: Wahrheitstabellen aufstellen (2–3 Aufgaben), De-Morgan anwenden und vereinfachen, boolesche Ausdrücke auswerten, Verbindung zu Java-Bedingungen (&&, ||, !) erklären",
    begriffe:["AND","OR","NOT","XOR","NAND","De-Morgan","Wahrheitstabelle","Logikgatter"],
    subs:[
      {t:"Grundoperatoren & Wahrheitstabellen",
       desc:"AND (UND): Nur wahr, wenn BEIDE Eingaben wahr sind. OR (ODER): Wahr, wenn MINDESTENS EINE Eingabe wahr ist. NOT (NICHT): Invertiert den Wert. XOR (Exklusiv-Oder): Wahr, wenn GENAU EINE Eingabe wahr ist. NAND: Gegenteil von AND. In Java: && = AND, || = OR, ! = NOT. Klausurbeispiel: Ausdruck !(A && B) = !A || !B nach De-Morgan vereinfachen.",
       items:[{c:"📊",l:"Studyflix – Aussagenlogik",u:SF("Aussagenlogik Wahrheitstabelle AND OR NOT")},{c:"🧠",l:"Knowunity – Boolesche Algebra",u:K("Boolesche Algebra Wahrheitstabelle AND OR NOT")},{c:"▶",l:"YouTube – Wahrheitstabellen",u:YT("Wahrheitstabelle AND OR NOT XOR Informatik")},{c:"💬",l:"Studocu – Aufgaben",u:DOC("Aussagenlogik Boolesche Algebra Aufgaben Informatik")}]},
      {t:"De-Morgan-Regeln – vereinfachen für die Klausur",
       desc:"De-Morgans Gesetze: (1) NOT(A AND B) = NOT A OR NOT B. (2) NOT(A OR B) = NOT A AND NOT B. Merkhilfe: 'Klammer auflösen = Vorzeichen wechseln + AND↔OR tauschen'. Praxisbeispiel: Eine Warenbestellbedingung im E-Commerce: 'Bestelle, wenn Lager leer UND Nachfrage hoch' → mit NOT vereinfachen für die Systemlogik. De-Morgan erscheint in jeder GIP-Klausur!",
       items:[{c:"📊",l:"Studyflix – De-Morgan",u:SF("De Morgan Regel Vereinfachung")},{c:"▶",l:"YouTube – De-Morgan erklärt",u:YT("De-Morgan Regel Informatik einfach erklärt Aufgaben")},{c:"🧠",l:"Knowunity – De-Morgan",u:K("De Morgan Regel Logik Informatik Klausur")}]},
    ]
  },
  17:{
    lernziel:"Du verstehst, warum Java als Programmiersprache im GIP-EC-Modul der HRW verwendet wird (plattformunabhängig dank JVM, weit verbreitet im Enterprise-Bereich). Du kannst Variablen mit int, double, long, boolean, char und String deklarieren und initialisieren. Du verstehst Typkonvertierung (implizites und explizites Casting) und kannst dein erstes Hello-World-Programm in Java schreiben.",
    prüfung:"Klausur/Praktikum GIP EC: Variablen deklarieren, Datentypen unterscheiden und konvertieren, einfache Ein-/Ausgabe mit System.out.println() und Scanner, Typfehler erkennen",
    begriffe:["Variable","Datentyp","int","String","boolean","Casting","JVM","Deklaration","Initialisierung"],
    subs:[
      {t:"Java Grundstruktur & Datentypen",
       desc:"Jedes Java-Programm beginnt mit einer Klasse und einer main()-Methode. Primitive Datentypen: int (ganze Zahlen, z.B. int lagerbestand = 100;), double (Dezimalzahlen, z.B. double preis = 9.99;), boolean (wahr/falsch, z.B. boolean verfügbar = true;), char (einzelnes Zeichen). Referenztypen: String (Zeichenkette, z.B. String name = \"Sneaker\";). ACHTUNG: String mit großem S – ist eine Klasse, kein primitiver Typ!",
       items:[{c:"💻",l:"W3Schools – Java Variables",u:"https://www.w3schools.com/java/java_variables.asp"},{c:"💻",l:"W3Schools – Data Types",u:"https://www.w3schools.com/java/java_data_types.asp"},{c:"🧠",l:"Knowunity – Java Variablen",u:K("Java Variablen Datentypen Programmierung")},{c:"▶",l:"YouTube – Java Deutsch",u:YT("Java Tutorial Deutsch Variablen Datentypen Anfänger")}]},
      {t:"Type Casting & erstes Programm",
       desc:"Implizites Casting: Kleiner Typ → größer funktioniert automatisch: int → double. Explizites Casting: Größer → kleiner muss manuell erfolgen: (int) meinDouble – dabei gehen Nachkommastellen verloren. Dein erstes Programm: public class Hallo { public static void main(String[] args) { System.out.println(\"Hallo Marokko!\"); } }. Scanner für Eingabe: Scanner sc = new Scanner(System.in); String eingabe = sc.nextLine();",
       items:[{c:"💻",l:"W3Schools – Type Casting",u:"https://www.w3schools.com/java/java_type_casting.asp"},{c:"▶",l:"YouTube – Java Grundlagen",u:YT("Java erstes Programm Hello World Deutsch Tutorial")},{c:"💬",l:"Studocu – Java Mitschriften",u:DOC("Java Programmierung Grundlagen Hochschule")}]},
    ]
  },
  18:{
    lernziel:"Du kannst if/else-Verzweigungen, else-if-Ketten und switch-Anweisungen in Java schreiben und einsetzen. Du beherrschst die drei Schleifentypen: for (bekannte Iterationsanzahl), while (unbekannte Anzahl) und do-while (mindestens einmal). Diese Kontrollstrukturen sind die Basis für alle GIP-Praktikumsaufgaben.",
    prüfung:"Klausur/Praktikum GIP EC: Code-Tracing (Was gibt dieses Programm aus?), eigene Schleifen und Bedingungen schreiben, Endlosschleifen erkennen, break und continue erklären",
    begriffe:["if-else","switch","for-Schleife","while-Schleife","do-while","break","continue","Kontrollstruktur"],
    subs:[
      {t:"Bedingungen & Verzweigungen in Java",
       desc:"if (bedingung) { // wenn wahr } else if (andere) { // alternativ } else { // sonst }. Bedingungen verwenden Vergleichsoperatoren: == (gleich), != (ungleich), > < >= <=. switch für viele feste Fälle: switch(tag) { case 1: System.out.println(\"Mo\"); break; default: ... }. E-Commerce-Beispiel: if (bestand > 0 && preis < budget) { kaufen(); } else { wunschliste(); }",
       items:[{c:"💻",l:"W3Schools – Java Conditions",u:"https://www.w3schools.com/java/java_conditions.asp"},{c:"💻",l:"W3Schools – Switch",u:"https://www.w3schools.com/java/java_switch.asp"},{c:"🧠",l:"Knowunity – Java if-else",u:K("Java if else Bedingungen Programmierung")},{c:"▶",l:"YouTube – if/else Java",u:YT("Java if else Bedingungen switch Kontrollstrukturen Deutsch")}]},
      {t:"Schleifen: for, while, do-while",
       desc:"for-Schleife (Anzahl bekannt): for (int i = 0; i < 10; i++) { System.out.println(i); } – zählt 0 bis 9. while-Schleife (Anzahl unbekannt): while (user.hatGeld()) { kaufen(); } – solange Bedingung wahr. do-while (mindestens einmal): do { eingabe(); } while (!eingabe.valid()); – führt mindestens einmal aus, dann prüft. break beendet die Schleife sofort; continue überspringt den Rest der aktuellen Iteration.",
       items:[{c:"💻",l:"W3Schools – For Loop",u:"https://www.w3schools.com/java/java_for_loop.asp"},{c:"💻",l:"W3Schools – While Loop",u:"https://www.w3schools.com/java/java_while_loop.asp"},{c:"🌐",l:"CodingBat – Java Übungen",u:"https://codingbat.com/java"},{c:"▶",l:"YouTube – Schleifen Java",u:YT("Java for while Schleife Deutsch Anfänger Übungen")}]},
    ]
  },
  19:{
    lernziel:"Du kannst eigene Methoden in Java definieren, Parameter übergeben und Rückgabewerte nutzen. Du verstehst das OOP-Konzept: Klassen sind Baupläne, Objekte sind Instanzen. Du kannst eine einfache Klasse 'Produkt' mit Attributen, Konstruktor und Getter-/Setter-Methoden schreiben. Du verstehst Vererbung und Polymorphie auf konzeptioneller Ebene.",
    prüfung:"Klausur/Praktikum GIP EC: Methoden schreiben und aufrufen (Parameter, Rückgabetyp), einfache Klasse implementieren, Konstruktor und Getter/Setter, Vererbungshierarchie verstehen und zeichnen",
    begriffe:["Methode","Parameter","Rückgabewert","Klasse","Objekt","Konstruktor","Vererbung","Kapselung"],
    subs:[
      {t:"Methoden definieren & aufrufen",
       desc:"Eine Methode kapselt wiederverwendbaren Code: public static int addiere(int a, int b) { return a + b; } – aufruf: int ergebnis = addiere(5, 3); → ergebnis = 8. Methodenbestandteile: Zugriffsmodifizierer (public), Rückgabetyp (int oder void), Name (addiere), Parameter ((int a, int b)), Methodenrumpf ({...}), Return-Anweisung. E-Commerce-Beispiel: berechneGesamtpreis(double preis, int menge, double rabatt)",
       items:[{c:"💻",l:"W3Schools – Java Methods",u:"https://www.w3schools.com/java/java_methods.asp"},{c:"💻",l:"W3Schools – Parameters",u:"https://www.w3schools.com/java/java_methods_param.asp"},{c:"🧠",l:"Knowunity – Java Methoden",u:K("Java Methoden Parameter Rückgabewert")},{c:"▶",l:"YouTube – Methoden Java",u:YT("Java Methoden Parameter Rückgabewert Deutsch")}]},
      {t:"OOP: Klassen, Objekte & Vererbung",
       desc:"Klasse = Bauplan. Objekt = konkrete Instanz. Beispielklasse: class Produkt { String name; double preis; Produkt(String n, double p) { name=n; preis=p; } String getName() { return name; } } – Objekt erstellen: Produkt sneaker = new Produkt(\"Air Max\", 149.99); System.out.println(sneaker.getName()); Vererbung: class DigitalesProdukt extends Produkt { } – erbt alle Attribute und Methoden von Produkt.",
       items:[{c:"💻",l:"W3Schools – Java Classes",u:"https://www.w3schools.com/java/java_classes.asp"},{c:"💻",l:"W3Schools – OOP",u:"https://www.w3schools.com/java/java_oop.asp"},{c:"▶",l:"YouTube – OOP Java",u:YT("Objektorientierung Java Klassen Vererbung Deutsch")},{c:"🌐",l:"CodinGame – Java üben",u:"https://www.codingame.com/start/"}]},
    ]
  },
  20:{
    lernziel:"Du kannst erklären, was passiert, wenn du 'amazon.de' im Browser eingibst – von der DNS-Auflösung über TCP/IP-Handshake bis zur HTTP-Anfrage und HTML-Antwort. Du kennst den Unterschied zwischen HTTP und HTTPS (SSL/TLS-Verschlüsselung) und weißt, warum HTTPS für E-Commerce-Shops Pflicht ist. Diese Grundlagen bereiten dich auf das Datenbanken-Modul in Semester 2 vor.",
    prüfung:"Relevant in mehreren Modulen: HTTP vs. HTTPS erklären, DNS-Auflösung beschreiben, Client-Server-Modell skizzieren, API-Begriff definieren, IP-Adressen und Ports",
    begriffe:["HTTP","HTTPS","DNS","TCP/IP","SSL/TLS","Client","Server","API","Port"],
    subs:[
      {t:"Vom Browser bis zur Webseite – Schritt für Schritt",
       desc:"(1) Du tippst amazon.de. (2) Browser fragt den DNS-Server: 'Welche IP hat amazon.de?' → Antwort: 54.239.28.85. (3) Browser baut TCP-Verbindung auf (3-Way-Handshake). (4) HTTPS: SSL/TLS-Verschlüsselung aktiviert. (5) Browser sendet HTTP-Request: GET /index.html HTTP/1.1. (6) Server antwortet mit HTTP-Response: 200 OK + HTML-Code. (7) Browser rendert HTML zu sichtbarer Webseite. Das alles in unter 1 Sekunde!",
       items:[{c:"▶",l:"YouTube – Internet erklärt",u:YT("Wie funktioniert Internet HTTP DNS TCP IP Schritt Schritt Deutsch")},{c:"📚",l:"MDN – Internet",u:"https://developer.mozilla.org/de/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work"},{c:"🧠",l:"Knowunity – Netzwerke",u:K("Internet HTTP DNS IP Netzwerke Informatik")}]},
      {t:"HTTP vs. HTTPS & APIs",
       desc:"HTTP (HyperText Transfer Protocol): Unverschlüsselt – Daten können abgefangen werden. HTTPS: HTTP + SSL/TLS-Verschlüsselung – alle Daten (Kreditkarten, Passwörter) verschlüsselt. Seit 2021 straft Google HTTP-Seiten in Rankings ab. API (Application Programming Interface): Eine Schnittstelle, über die zwei Programme kommunizieren. Beispiel: Shopify-Shop ruft die DHL-API auf, um eine Sendungsverfolgung zu starten. REST-APIs sind der Standard im E-Commerce.",
       items:[{c:"▶",l:"YouTube – HTTPS erklärt",u:YT("HTTPS SSL TLS Verschlüsselung einfach erklärt")},{c:"▶",l:"YouTube – API erklärt",u:YT("API einfach erklärt REST API Deutsch")},{c:"💬",l:"Studocu – Netzwerke",u:DOC("Informatik Netzwerke HTTP HTTPS API Hochschule")}]},
    ]
  },
  21:{
    lernziel:"Du reflektierst die drei Wochen Marokko-Lernplan: Was hast du wirklich gemeistert? Wo sind noch Lücken? Du erstellst einen konkreten, realistischen Lernplan für August (bis Vorlesungsbeginn 1.9.2026). Du kennst die Anforderungen der Seminararbeit im ECM-Modul und kannst schon erste Themenideen sammeln. Du bist mental und fachlich bereit für Semester 1.",
    prüfung:"Kein Klausurthema – aber die beste Investition in einen starken Semesterstart. Nutze August für Java-Vertiefung (Praktikum!) und BWL-Klausuraufgaben.",
    begriffe:["Reflexion","Lernplan","Seminararbeit","Java-Vertiefung","Anki-Review","HRW Moodle","Semesterstart"],
    subs:[
      {t:"Rückblick & Lückenanalyse",
       desc:"Gehe alle 20 Tage durch und beantworte ehrlich: (1) Kann ich das Thema ohne Unterlagen erklären? (2) Würde ich eine Klausuraufgabe dazu lösen können? Markiere Schwächethemen rot. Typische Schwächen nach Woche 1: Buchungssätze und T-Konten. Nach Woche 2: Konsumentenverhalten und Plattformökonomie. Nach Woche 3: Java und Boolesche Algebra. Diese Themen kommen in August intensiver dran.",
       items:[{c:"🃏",l:"Anki – alle Karten durchgehen",u:"https://apps.ankiweb.net/"},{c:"🧠",l:"Knowunity – Prüfungsvorbereitung",u:K("Studium Prüfungsvorbereitung Lernplan")},{c:"🎓",l:"Springer Flashcards (Deges)",u:"https://flashcards.springernature.com/login"}]},
      {t:"August-Plan & Semesterstart-Vorbereitung",
       desc:"Empfohlener August-Plan: Woche 1 (1.-7.8): BWL-Klausuraufgaben üben + Buchführung vertiefen. Woche 2 (8.-14.8): Java-Übungen auf CodingBat + W3Schools durcharbeiten. Woche 3 (15.-21.8): Deges-Buch Kapitel 1-3 lesen + Seminararbeitsthema recherchieren. Woche 4 (22.-31.8): HRW Moodle-Zugang einrichten, Campus-Karte holen, Stundenplan organisieren, Anki-Decks finalisieren.",
       items:[{c:"🎓",l:"HRW Moodle",u:"https://elearning.hs-ruhrwest.de/"},{c:"💻",l:"Udemy – Java Kurs",u:"https://www.udemy.com/topic/java/?price=price-free"},{c:"📖",l:"Deges Buch öffnen",u:BOOK},{c:"📚",l:"HRW Bibliothek",u:"https://www.hs-ruhrwest.de/studium/bibliothek/"}]},
    ]
  },
};

function fmtDate(iso,offset){
  try{const d=new Date(iso);if(isNaN(d))return"";d.setDate(d.getDate()+offset);return d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"});}catch{return"";}
}
function cCol(c){
  return{"📖":ACCENT.violet,"🧠":"#c026a8","💬":ACCENT.teal,"📊":"#167a5e","💻":ACCENT.blue,"🌐":"#1d6fa8","🃏":ACCENT.red,"🎓":ACCENT.red,"📚":ACCENT.violet,"▶":ACCENT.blue}[c]||"#8a96b8";
}
function dayNum(n){return String(n).padStart(2,"0");}
/* Tastatur-Handler für klickbare divs (WCAG 2.1.1 Keyboard) */
function kb(fn){return{role:"button",tabIndex:0,onKeyDown:e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fn();}}};}

/* ── Pill – tappable Link (Liquid Glass) ─────────────────────────── */
function Pill({l,u,col}){
  return(
    <a href={u} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="hover-pop"
      style={{display:"inline-flex",alignItems:"center",gap:"0.22rem",
        background:`linear-gradient(135deg, ${col}26 0%, ${col}0f 100%)`,
        backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
        border:`1px solid ${col}50`,
        borderRadius:"9999px",padding:"0.32rem 0.72rem",
        fontSize:"0.7rem",color:col,fontWeight:600,
        textDecoration:"none",marginRight:"0.35rem",marginBottom:"0.35rem",
        WebkitTapHighlightColor:"transparent",minHeight:"32px",
        boxShadow:`0 2px 8px ${col}1a`,transition:"transform 0.15s"}}>
      {l}<span style={{opacity:0.6,fontSize:"0.55rem"}}>↗</span>
    </a>
  );
}

/* ── TermPill – klickbarer Kernbegriff mit Inline-Definition ─────── */
function TermPill({term,col,openTerm,setOpenTerm,C}){
  const isOpen=openTerm===term;
  const def=GLOSSARY[term];
  return(
    <div style={{display:"inline-block",verticalAlign:"top",marginRight:"0.4rem",marginBottom:"0.4rem"}}>
      <button onClick={()=>setOpenTerm(isOpen?null:term)} className="hover-pop" aria-expanded={isOpen}
        style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",
          background:isOpen?`linear-gradient(135deg, ${col}40 0%, ${col}1c 100%)`:`linear-gradient(135deg, ${col}22 0%, ${col}0c 100%)`,
          backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
          border:`1px solid ${isOpen?col+"80":col+"38"}`,
          borderRadius:"9999px",padding:"0.3rem 0.75rem",
          fontSize:"0.7rem",color:isOpen?C.text:col,fontWeight:700,
          fontFamily:"inherit",cursor:"pointer",
          boxShadow:isOpen?`0 4px 16px ${col}45`:`0 2px 6px ${col}15`,
          transition:"all 0.2s",WebkitTapHighlightColor:"transparent"}}>
        {term}
        <span style={{fontSize:"0.6rem",opacity:0.7,transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s",display:"inline-block"}}>▾</span>
      </button>
      {isOpen&&def&&(
        <div style={{
          marginTop:"0.4rem",maxWidth:"min(320px, 86vw)",
          background:`linear-gradient(135deg, ${col}1c 0%, rgba(255,255,255,0.05) 100%)`,
          backdropFilter:"blur(24px) saturate(180%)",WebkitBackdropFilter:"blur(24px) saturate(180%)",
          border:`1px solid ${col}45`,borderRadius:"14px",
          padding:"0.75rem 0.9rem",
          boxShadow:`0 12px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`,
          animation:"termFadeIn 0.22s ease-out"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.32rem"}}>
            <div style={{width:"5px",height:"5px",borderRadius:"50%",background:col,flexShrink:0}}/>
            <span style={{fontSize:"0.62rem",color:col,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase"}}>{term}</span>
          </div>
          <p style={{margin:0,fontSize:"0.78rem",color:C.text,lineHeight:1.6}}>{def}</p>
        </div>
      )}
    </div>
  );
}

/* ── Ressourcen-Bibliothek ───────────────────────────────────────── */
function QuickLinks({C}){
  const [cat,setCat]=useState("video");
  const ci=CATS.find(c=>c.id===cat);
  const byMod=MODS.reduce((acc,mod)=>{
    const links=RES.filter(r=>r.cat===cat&&r.mod===mod.id);
    if(links.length>0) acc.push({...mod,links});
    return acc;
  },[]);
  return(
    <div style={{...glass(C.blue,C),borderRadius:"18px",padding:"1.15rem 1.05rem",marginBottom:"1.5rem"}}>
      <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.85rem"}}>
        <div style={{width:"4px",height:"20px",background:`linear-gradient(180deg, ${C.blue}, ${C.violet})`,borderRadius:"2px"}}/>
        <span style={{fontSize:"0.62rem",color:C.text,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase"}}>Ressourcen-Bibliothek</span>
        <span style={{fontSize:"0.58rem",color:C.muted,marginLeft:"0.2rem"}}>· Modulhandbuch HRW BPO 2023</span>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.32rem",marginBottom:"0.9rem"}}>
        {CATS.map(c=>(
          <button key={c.id} onClick={()=>setCat(c.id)} className="hover-pop" aria-pressed={cat===c.id}
            style={{padding:"0.34rem 0.75rem",borderRadius:"9999px",
              border:`1px solid ${cat===c.id?C.blue+"90":C.glassBorder}`,
              background:cat===c.id?`linear-gradient(135deg, ${C.blue}50, ${C.violet}30)`:"rgba(255,255,255,0.05)",
              backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
              color:cat===c.id?C.text:C.muted,
              fontSize:"0.7rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit",
              transition:"all 0.18s",minHeight:"34px"}}>
            {c.e} {c.label}
          </button>
        ))}
      </div>
      {byMod.map(mod=>(
        <div key={mod.id} style={{marginBottom:"0.7rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.35rem",marginBottom:"0.32rem",paddingBottom:"0.28rem",borderBottom:`1px solid ${mod.c}30`}}>
            <span style={{fontSize:"0.88rem"}}>{mod.e}</span>
            <span style={{fontSize:"0.62rem",color:mod.c,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase"}}>{mod.label}</span>
            <span style={{fontSize:"0.6rem",color:C.muted}}>— {mod.desc}</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap"}}>
            {mod.links.map((lk,i)=><Pill key={i} l={lk.l} u={lk.u} col={ci.c}/>)}
          </div>
        </div>
      ))}
      {byMod.length===0&&<div style={{fontSize:"0.75rem",color:C.muted,padding:"0.5rem"}}>Keine Links in dieser Kategorie.</div>}
    </div>
  );
}

/* ── Quiz – Multiple Choice mit Sofort-Feedback, Bestscore & Retry ── */
function Quiz({questions,col,C,best,onDone}){
  const [answers,setAnswers]=useState({}); // {qIdx: optionIdx}
  const doneCount=Object.keys(answers).length;
  const correctCount=Object.entries(answers).filter(([qi,oi])=>questions[qi].correct===oi).length;
  const finished=doneCount===questions.length&&questions.length>0;
  const pick=(qi,oi)=>{
    if(answers[qi]!==undefined) return;
    const na={...answers,[qi]:oi};
    setAnswers(na);
    if(Object.keys(na).length===questions.length&&onDone){
      const corr=Object.entries(na).filter(([q,o])=>questions[q].correct===o).length;
      onDone(corr,questions.length);
    }
  };
  const reset=()=>setAnswers({});
  return(
    <div style={{...glass(col,C),borderRadius:"14px",padding:"0.9rem 1rem",marginBottom:"0.6rem"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.7rem",flexWrap:"wrap",gap:"0.3rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
          <span style={{fontSize:"0.95rem"}}>🧩</span>
          <span style={{fontSize:"0.66rem",color:col,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>Quiz</span>
          {best&&(
            <span style={{fontSize:"0.6rem",color:best.c===best.t?ACCENT.teal:C.muted,fontWeight:700,
              background:best.c===best.t?`${ACCENT.teal}1c`:"rgba(255,255,255,0.05)",
              border:`1px solid ${best.c===best.t?ACCENT.teal+"45":C.glassBorder}`,
              borderRadius:"9999px",padding:"0.12rem 0.5rem"}}>
              🏆 Best: {best.c}/{best.t}
            </span>
          )}
        </div>
        <span aria-live="polite" style={{fontSize:"0.68rem",color:C.muted,fontWeight:600}}>
          {doneCount>0?`${correctCount}/${doneCount} richtig${finished?" · fertig 🎉":""}`:""}
        </span>
      </div>
      {questions.map((q,qi)=>{
        const picked=answers[qi];
        const answered=picked!==undefined;
        return(
          <div key={qi} style={{marginBottom:qi<questions.length-1?"0.85rem":0}}>
            <div style={{fontSize:"0.79rem",color:C.text,fontWeight:600,marginBottom:"0.45rem",lineHeight:1.5}}>{qi+1}. {q.q}</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
              {q.options.map((opt,oi)=>{
                const isCorrect=oi===q.correct;
                const isPicked=oi===picked;
                let bg="rgba(255,255,255,0.03)", brd=C.glassBorder, txt=C.text, icon=null;
                if(answered&&isCorrect){ bg=`${ACCENT.teal}22`; brd=ACCENT.teal+"70"; txt=ACCENT.teal; icon="✓"; }
                else if(answered&&isPicked&&!isCorrect){ bg=`${ACCENT.red}1c`; brd=ACCENT.red+"70"; txt=ACCENT.red; icon="✕"; }
                return(
                  <button key={oi} onClick={()=>pick(qi,oi)} disabled={answered} className={answered?"":"hover-pop"}
                    style={{textAlign:"left",padding:"0.55rem 0.7rem",borderRadius:"10px",
                      border:`1px solid ${brd}`,background:bg,color:txt,
                      fontSize:"0.75rem",fontWeight:isPicked||isCorrect&&answered?700:500,
                      fontFamily:"inherit",cursor:answered?"default":"pointer",
                      display:"flex",alignItems:"center",gap:"0.5rem",
                      transition:"all 0.18s",lineHeight:1.4}}>
                    <span style={{flexShrink:0,width:"16px",textAlign:"center"}}>{icon||""}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {answered&&q.explain&&(
              <div style={{marginTop:"0.4rem",fontSize:"0.71rem",color:C.muted,lineHeight:1.55,paddingLeft:"0.1rem"}}>
                💡 {q.explain}
              </div>
            )}
          </div>
        );
      })}
      {finished&&(
        <button onClick={reset} className="hover-pop"
          style={{marginTop:"0.8rem",width:"100%",padding:"0.5rem",borderRadius:"9999px",
            border:`1px solid ${col}55`,background:`${col}22`,color:col,
            fontSize:"0.72rem",fontWeight:700,cursor:"pointer",fontFamily:"inherit",minHeight:"42px"}}>
          ↺ Nochmal versuchen
        </button>
      )}
    </div>
  );
}

/* ── FlashcardDeck – Lernkarten mit Flip, Shuffle & Gewusst-Tracking ─ */
function FlashcardDeck({cards,col,C,known,onKnown}){
  const [order,setOrder]=useState(()=>cards.map((_,i)=>i));
  const [pos,setPos]=useState(0);
  const [flipped,setFlipped]=useState(false);
  const [onlyNew,setOnlyNew]=useState(false);
  const seq=onlyNew?order.filter(i=>!known.has(i)):order;
  const safePos=seq.length?Math.min(pos,seq.length-1):0;
  const idx=seq.length?seq[safePos]:null;
  const card=idx!=null?cards[idx]:null;
  const go=d=>{setFlipped(false);setPos(p=>{const n=seq.length;if(!n)return 0;return(Math.min(p,n-1)+d+n)%n;});};
  const flip=()=>setFlipped(f=>!f);
  const shuffle=()=>{
    const a=[...order];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    setOrder(a);setPos(0);setFlipped(false);
  };
  const mark=k=>{
    if(idx==null)return;
    onKnown(idx,k);
    setFlipped(false);
    if(!(onlyNew&&k)) go(1); // bei "gewusst" im Nur-neue-Modus rückt die Liste automatisch nach
  };
  const knownPct=cards.length?Math.round(known.size/cards.length*100):0;
  return(
    <div style={{...glass(col,C),borderRadius:"14px",padding:"0.9rem 1rem",marginBottom:"0.6rem"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.55rem",flexWrap:"wrap",gap:"0.35rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
          <span style={{fontSize:"0.95rem"}}>🃏</span>
          <span style={{fontSize:"0.66rem",color:col,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>Lernkarten</span>
          <span style={{fontSize:"0.62rem",color:known.size===cards.length&&cards.length>0?ACCENT.teal:C.muted,fontWeight:700}}>
            {known.size}/{cards.length} gewusst
          </span>
        </div>
        <div style={{display:"flex",gap:"0.3rem"}}>
          <button onClick={shuffle} className="hover-pop" aria-label="Karten mischen"
            style={{padding:"0.3rem 0.6rem",borderRadius:"9999px",border:`1px solid ${C.glassBorder}`,
              background:"rgba(255,255,255,0.05)",color:C.text,fontSize:"0.68rem",fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",minHeight:"30px"}}>🔀</button>
          <button onClick={()=>{setOnlyNew(o=>!o);setPos(0);setFlipped(false);}} className="hover-pop" aria-pressed={onlyNew}
            style={{padding:"0.3rem 0.65rem",borderRadius:"9999px",
              border:`1px solid ${onlyNew?col+"70":C.glassBorder}`,
              background:onlyNew?`${col}28`:"rgba(255,255,255,0.05)",
              color:onlyNew?col:C.muted,fontSize:"0.64rem",fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",minHeight:"30px"}}>
            {onlyNew?"Nur neue ✓":"Nur neue"}
          </button>
        </div>
      </div>
      {/* Gewusst-Fortschritt */}
      <div style={{background:"rgba(255,255,255,0.07)",borderRadius:"9999px",height:"4px",overflow:"hidden",marginBottom:"0.7rem",border:`1px solid ${C.glassBorder}`}}>
        <div style={{height:"100%",width:`${knownPct}%`,background:`linear-gradient(90deg, ${ACCENT.teal}, ${col})`,borderRadius:"9999px",transition:"width 0.3s"}}/>
      </div>
      {card?(
        <>
          <div onClick={flip} {...kb(flip)} className="hover-pop" aria-label={flipped?"Definition anzeigen, antippen für Begriff":"Begriff anzeigen, antippen für Definition"}
            style={{minHeight:"118px",borderRadius:"12px",cursor:"pointer",position:"relative",
              background:flipped?`linear-gradient(135deg, ${col}2c, ${col}12)`:"rgba(255,255,255,0.04)",
              border:`1px solid ${flipped?col+"55":C.glassBorder}`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              padding:"1rem 1.1rem",textAlign:"center",transition:"all 0.25s",marginBottom:"0.65rem"}}>
            <div style={{position:"absolute",top:"0.5rem",left:"0.7rem",fontSize:"0.56rem",color:C.muted,fontWeight:700}}>
              {safePos+1}/{seq.length}
            </div>
            {known.has(idx)&&(
              <div style={{position:"absolute",top:"0.45rem",right:"0.6rem",fontSize:"0.56rem",color:ACCENT.teal,fontWeight:800,
                background:`${ACCENT.teal}1c`,border:`1px solid ${ACCENT.teal}45`,borderRadius:"9999px",padding:"0.1rem 0.45rem"}}>
                ✓ gewusst
              </div>
            )}
            <div style={{fontSize:"0.56rem",color:flipped?col:C.muted,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.5rem"}}>
              {flipped?"DEFINITION":"BEGRIFF"}
            </div>
            <div style={{fontSize:flipped?"0.82rem":"1rem",color:C.text,fontWeight:flipped?500:800,lineHeight:1.55}}>
              {flipped?card.back:card.front}
            </div>
            <div style={{fontSize:"0.58rem",color:C.muted,marginTop:"0.6rem",opacity:0.7}}>antippen zum Umdrehen ↺</div>
          </div>
          {flipped?(
            <div style={{display:"flex",gap:"0.5rem"}}>
              <button onClick={()=>mark(false)} className="hover-pop"
                style={{flex:1,padding:"0.5rem",borderRadius:"9999px",border:`1px solid ${ACCENT.red}55`,
                  background:`${ACCENT.red}1c`,color:ACCENT.red,fontSize:"0.72rem",fontWeight:700,
                  cursor:"pointer",fontFamily:"inherit",minHeight:"44px"}}>↺ Nochmal</button>
              <button onClick={()=>mark(true)} className="hover-pop"
                style={{flex:1,padding:"0.5rem",borderRadius:"9999px",border:`1px solid ${ACCENT.teal}60`,
                  background:`${ACCENT.teal}22`,color:ACCENT.teal,fontSize:"0.72rem",fontWeight:700,
                  cursor:"pointer",fontFamily:"inherit",minHeight:"44px"}}>✓ Gewusst</button>
            </div>
          ):(
            <div style={{display:"flex",gap:"0.5rem"}}>
              <button onClick={()=>go(-1)} className="hover-pop" aria-label="Vorherige Karte"
                style={{flex:1,padding:"0.5rem",borderRadius:"9999px",border:`1px solid ${C.glassBorder}`,
                  background:"rgba(255,255,255,0.04)",color:C.text,fontSize:"0.72rem",fontWeight:600,
                  cursor:"pointer",fontFamily:"inherit",minHeight:"44px"}}>← Zurück</button>
              <button onClick={()=>go(1)} className="hover-pop" aria-label="Nächste Karte"
                style={{flex:1,padding:"0.5rem",borderRadius:"9999px",border:`1px solid ${col}55`,
                  background:`${col}22`,color:col,fontSize:"0.72rem",fontWeight:700,
                  cursor:"pointer",fontFamily:"inherit",minHeight:"44px"}}>Weiter →</button>
            </div>
          )}
        </>
      ):(
        <div style={{textAlign:"center",padding:"1rem 0.5rem"}}>
          <div style={{fontSize:"1.5rem",marginBottom:"0.35rem"}}>🎉</div>
          <div style={{fontSize:"0.82rem",color:C.text,fontWeight:700,marginBottom:"0.6rem"}}>Alle Karten gewusst – stark!</div>
          <button onClick={()=>{setOnlyNew(false);setPos(0);}} className="hover-pop"
            style={{padding:"0.5rem 1.1rem",borderRadius:"9999px",border:`1px solid ${col}55`,
              background:`${col}22`,color:col,fontSize:"0.72rem",fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",minHeight:"42px"}}>Alle Karten zeigen</button>
        </div>
      )}
    </div>
  );
}

/* ── FocusTimer – 20-Minuten-Lernsession ─────────────────────────── */
function FocusTimer({C}){
  const DUR=20*60;
  const [left,setLeft]=useState(DUR);
  const [run,setRun]=useState(false);
  useEffect(()=>{
    if(!run)return;
    const id=setInterval(()=>setLeft(l=>Math.max(0,l-1)),1000);
    return()=>clearInterval(id);
  },[run]);
  useEffect(()=>{
    if(left===0&&run){
      setRun(false);
      try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate([200,100,200]);}catch{}
    }
  },[left,run]);
  const mm=String(Math.floor(left/60)).padStart(2,"0");
  const ss=String(left%60).padStart(2,"0");
  const pct=Math.round((DUR-left)/DUR*100);
  const done=left===0;
  return(
    <div style={{...glass(ACCENT.blue,C),borderRadius:"16px",padding:"1rem 1.1rem",marginBottom:"1.1rem"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.55rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
          <span style={{fontSize:"0.95rem"}}>⏱</span>
          <span style={{fontSize:"0.62rem",color:ACCENT.blue,fontWeight:800,letterSpacing:"0.09em",textTransform:"uppercase"}}>Fokus-Timer · 20 Min</span>
        </div>
        <span style={{fontSize:"0.62rem",color:C.muted,fontWeight:700}}>{pct}%</span>
      </div>
      <div aria-live="polite" style={{textAlign:"center",fontSize:"2rem",fontWeight:800,color:done?ACCENT.teal:C.text,
        fontVariantNumeric:"tabular-nums",letterSpacing:"0.04em",marginBottom:"0.55rem"}}>
        {done?"Geschafft! 🎉":`${mm}:${ss}`}
      </div>
      <div style={{background:"rgba(255,255,255,0.07)",borderRadius:"9999px",height:"5px",overflow:"hidden",marginBottom:"0.75rem",border:`1px solid ${C.glassBorder}`}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg, ${ACCENT.blue}, ${ACCENT.teal})`,borderRadius:"9999px",transition:"width 0.5s linear"}}/>
      </div>
      <div style={{display:"flex",gap:"0.5rem"}}>
        <button onClick={()=>{if(done)setLeft(DUR);setRun(r=>done?true:!r);}} className="hover-pop"
          style={{flex:2,padding:"0.55rem",borderRadius:"9999px",border:`1px solid ${ACCENT.blue}60`,
            background:`${ACCENT.blue}26`,color:ACCENT.blue,fontSize:"0.75rem",fontWeight:800,
            cursor:"pointer",fontFamily:"inherit",minHeight:"44px"}}>
          {done?"▶ Neue Session":run?"⏸ Pause":"▶ Start"}
        </button>
        <button onClick={()=>{setRun(false);setLeft(DUR);}} className="hover-pop"
          style={{flex:1,padding:"0.55rem",borderRadius:"9999px",border:`1px solid ${C.glassBorder}`,
            background:"rgba(255,255,255,0.04)",color:C.muted,fontSize:"0.75rem",fontWeight:700,
            cursor:"pointer",fontFamily:"inherit",minHeight:"44px"}}>↺ Reset</button>
      </div>
      <div style={{fontSize:"0.62rem",color:C.muted,textAlign:"center",marginTop:"0.5rem"}}>
        5 Min Anki · 10 Min Video/Lesen · 5 Min Takeaways notieren
      </div>
    </div>
  );
}

/* ── Stat – kleine Statistik-Kachel ──────────────────────────────── */
function Stat({e,v,l,col,C}){
  return(
    <div style={{...glass(col,C),borderRadius:"14px",padding:"0.7rem 0.4rem",textAlign:"center"}}>
      <div style={{fontSize:"1rem",lineHeight:1}}>{e}</div>
      <div style={{fontSize:"1.02rem",fontWeight:800,color:C.text,marginTop:"0.25rem"}}>{v}</div>
      <div style={{fontSize:"0.54rem",color:C.muted,marginTop:"0.15rem",letterSpacing:"0.05em",textTransform:"uppercase"}}>{l}</div>
    </div>
  );
}

/* ── App ─────────────────────────────────────────────────────────── */
export default function App(){
  const [tab,setTab]       =useState("plan");
  const [ck,setCk]         =useState({});
  const [oCards,setOCards] =useState(new Set());
  const [dDays,setDDays]   =useState(new Set());
  const [dSubs,setDSubs]   =useState(new Set());
  const [openTerm,setOpenTerm]=useState(null); // aktuell geöffneter Kernbegriff (global, 1 zur Zeit)
  const [start,setStart]   =useState("2026-07-10");
  const [ready,setReady]   =useState(false);
  const [isDark,setIsDark] =useState(true); // Standard: Liquid-Glass Dark Mode
  const [semOpen,setSemOpen]=useState(new Set()); // offene Semester (Semester-Tab)
  const [modOpen,setModOpen]=useState(new Set()); // offene Module (Semester-Tab)
  const [wahlOpen,setWahlOpen]=useState(new Set()); // offene Wahlmodule (Wahlmodul-Verzeichnis)
  const [quizOpen,setQuizOpen]=useState(new Set()); // offene Quiz-Module (Quiz-Verzeichnis im Start-Tab)
  const [quizSecOpen,setQuizSecOpen]=useState(false); // Quiz-Verzeichnis-Sektion insgesamt auf-/zugeklappt
  const [semQuizExp,setSemQuizExp]=useState(new Set()); // Semester im Quiz-Verzeichnis, die alle Module zeigen (statt nur das erste)
  const [topicOpen,setTopicOpen]=useState(new Set()); // ausgeklappte Themen (Definition+Beispiel) im Semester-Tab
  const [quizBest,setQuizBest]=useState({}); // {modId:{c,t}} – Bestscores pro Modul-Quiz
  const [fcKnown,setFcKnown]=useState({});   // {modId:[idx,…]} – gewusste Lernkarten pro Modul
  const [glosQ,setGlosQ]=useState("");       // Glossar-Suchbegriff
  const [glosOpen,setGlosOpen]=useState(new Set()); // aufgeklappte Glossar-Einträge

  const C = isDark ? DARK : LIGHT; // aktuelle Palette – alle untenstehenden Views nutzen dies per Closure

  useEffect(()=>{
    (async()=>{
      try{const r=await storage.get("mrk6-ck");if(r)setCk(JSON.parse(r));}catch{}
      try{const r=await storage.get("mrk6-sd");if(r)setStart(r);}catch{}
      try{const r=await storage.get("mrk6-th");if(r)setIsDark(r==="dark");}catch{}
      try{const r=await storage.get("mrk6-qb");if(r)setQuizBest(JSON.parse(r));}catch{}
      try{const r=await storage.get("mrk6-fc");if(r)setFcKnown(JSON.parse(r));}catch{}
      setReady(true);
    })();
  },[]);

  const save=async n=>{setCk(n);try{await storage.set("mrk6-ck",JSON.stringify(n));}catch{}};
  const toggle=id=>save({...ck,[id]:!ck[id]});
  const saveDate=async v=>{setStart(v);try{await storage.set("mrk6-sd",v);}catch{}};
  const toggleTheme=async()=>{
    const next=!isDark; setIsDark(next);
    try{await storage.set("mrk6-th",next?"dark":"light");}catch{}
  };
  const saveQuizResult=(modId,c,t)=>{
    const prev=quizBest[modId];
    if(prev&&prev.c>=c)return;
    const n={...quizBest,[modId]:{c,t}};
    setQuizBest(n);
    storage.set("mrk6-qb",JSON.stringify(n));
  };
  const setKnownCard=(modId,idx,isKnown)=>{
    const cur=new Set(fcKnown[modId]||[]);
    isKnown?cur.add(idx):cur.delete(idx);
    const n={...fcKnown,[modId]:[...cur]};
    setFcKnown(n);
    storage.set("mrk6-fc",JSON.stringify(n));
  };
  // Multi-open toggle helpers (Set-basiert → mehrere gleichzeitig offen)
  const tCard=id=>setOCards(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const tDay =id=>setDDays(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const tSub =id=>setDSubs(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const tSem =id=>setSemOpen(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const tMod =id=>setModOpen(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const tWahl=id=>setWahlOpen(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const resetWahl=()=>setWahlOpen(new Set());
  const tQuiz=id=>setQuizOpen(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const resetQuiz=()=>setQuizOpen(new Set());
  const tSemQuizExp=semNr=>setSemQuizExp(p=>{const n=new Set(p);n.has(semNr)?n.delete(semNr):n.add(semNr);return n;});
  const tTopic=key=>setTopicOpen(p=>{const n=new Set(p);n.has(key)?n.delete(key):n.add(key);return n;});
  const tGlos=t=>setGlosOpen(p=>{const n=new Set(p);n.has(t)?n.delete(t):n.add(t);return n;});
  // Direktsprung Semester-Tab → Quiz-Verzeichnis im Start-Tab
  const jumpToQuiz=(modId,semNr)=>{
    setTab("plan");
    setQuizSecOpen(true);
    setQuizOpen(p=>{const n=new Set(p);n.add(modId);return n;});
    setSemQuizExp(p=>{const n=new Set(p);n.add(String(semNr));return n;});
    setTimeout(()=>{try{const el=document.getElementById("quiz-verzeichnis");el&&el.scrollIntoView({behavior:"smooth"});}catch{}},150);
  };

  const total=PLAN.length,done=Object.values(ck).filter(Boolean).length,pct=Math.round(done/total*100);
  const knownTotal=Object.values(fcKnown).reduce((a,arr)=>a+(arr?arr.length:0),0);
  const quizzesPerfect=Object.values(quizBest).filter(b=>b.c===b.t).length;
  const dAb=daysUntil(start), dSem=daysUntil(SEMESTER_START);
  const todayNr=todayPlanDay(start,total);
  // Verzeichnis aller Module mit Quiz, über alle 7 Semester hinweg (fürs Quiz-Verzeichnis im Start-Tab)
  const quizMods=SEMESTERS.flatMap(sem=>sem.modules.filter(m=>m.quiz&&m.quiz.length>0).map(m=>({...m,semNr:sem.nr})));

  if(!ready)return(
    <div style={{background:C.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"0.75rem"}}>
      <div style={{fontSize:"2.5rem"}}>🇲🇦</div>
      <div style={{color:C.muted,fontSize:"0.9rem",fontFamily:"system-ui"}}>Lernplan wird geladen…</div>
    </div>
  );

  /* ─ Header (Liquid Glass, dark navy) ─ */
  const Hdr=(
    <div style={{background:C.bgGrad,padding:"1.5rem 1.1rem 1.3rem",position:"relative",overflow:"hidden"}}>
      {/* Glow-Orbs */}
      <div style={{position:"absolute",top:-60,right:-40,width:"180px",height:"180px",borderRadius:"50%",background:C.blueGlow,filter:"blur(50px)",opacity:0.5}}/>
      <div style={{position:"absolute",bottom:-40,left:-30,width:"120px",height:"120px",borderRadius:"50%",background:"rgba(45,212,168,0.18)",filter:"blur(40px)"}}/>
      {/* Theme-Toggle */}
      <button onClick={toggleTheme} className="hover-pop"
        style={{position:"absolute",top:"1rem",right:"1.1rem",zIndex:2,
          width:"38px",height:"38px",borderRadius:"50%",cursor:"pointer",
          border:`1px solid ${C.glassBorder}`,background:C.glassBg2,
          backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:"1.05rem",boxShadow:`0 4px 14px ${C.glassShadow}`}}
        aria-label={isDark?"Zu hellem Modus wechseln":"Zu dunklem Modus wechseln"}>
        {isDark?"☀️":"🌙"}
      </button>
      <div style={{display:"flex",alignItems:"flex-start",gap:"0.85rem",marginBottom:"1.2rem",position:"relative"}}>
        <div style={{fontSize:"2.3rem",lineHeight:1,filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))"}}>🇲🇦</div>
        <div>
          <h1 style={{margin:0,fontSize:"1.32rem",fontWeight:800,color:C.text,letterSpacing:"-0.01em",lineHeight:1.15}}>
            Marokko-Lernplan
          </h1>
          <p style={{margin:"0.24rem 0 0",color:C.muted,fontSize:"0.64rem",letterSpacing:"0.07em",textTransform:"uppercase"}}>
            HRW E-Commerce B.Sc. · BPO 2023 · 20 Min/Tag
          </p>
        </div>
        <div style={{marginLeft:"auto",textAlign:"right",paddingRight:"2.6rem"}}>
          <div style={{fontSize:"1.65rem",fontWeight:800,color:C.text,lineHeight:1}}>{pct}<span style={{fontSize:"0.85rem",color:C.muted}}>%</span></div>
          <div style={{fontSize:"0.58rem",color:C.muted,marginTop:"0.12rem"}}>{done}/{total} Tage</div>
        </div>
      </div>
      {/* Progress Bar */}
      <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Lernfortschritt"
        style={{background:"rgba(255,255,255,0.08)",borderRadius:"9999px",height:"6px",overflow:"hidden",marginBottom:"0.9rem",position:"relative",border:`1px solid ${C.glassBorder}`}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg, ${C.blue}, ${C.violet})`,borderRadius:"9999px",transition:"width 0.4s",boxShadow:`0 0 12px ${C.blueGlow}`}}/>
      </div>
      {/* Abreise-Datum (Glass) */}
      <div style={{display:"flex",alignItems:"center",gap:"0.5rem",...glass(null,C),padding:"0.5rem 0.7rem",borderRadius:"12px",position:"relative"}}>
        <label htmlFor="abreise-datum" style={{fontSize:"0.68rem",color:C.muted,whiteSpace:"nowrap"}}>✈️ Abreise:</label>
        <input id="abreise-datum" type="date" value={start} onChange={e=>saveDate(e.target.value)}
          style={{flex:1,background:"transparent",border:"none",color:C.text,padding:"0.18rem 0.3rem",fontSize:"0.78rem",outline:"none",fontFamily:"inherit",colorScheme:isDark?"dark":"light"}}/>
        <span style={{fontSize:"0.68rem",color:C.muted,whiteSpace:"nowrap"}}>→ 31.07.</span>
      </div>
      {/* Countdown-Chips */}
      <div style={{display:"flex",gap:"0.4rem",marginTop:"0.7rem",flexWrap:"wrap",position:"relative"}}>
        {[
          {e:"✈️",txt:dAb==null?"Datum wählen":dAb>0?`Abreise in ${dAb} Tg.`:dAb===0?"Abreise heute!":"In Marokko 🌴"},
          {e:"🎓",txt:dSem!=null&&dSem>0?`Semesterstart in ${dSem} Tg.`:"Semester läuft"},
          {e:"🃏",txt:`${knownTotal} Karten gewusst`},
        ].map((c,i)=>(
          <div key={i} style={{...glass(null,C),borderRadius:"9999px",padding:"0.3rem 0.7rem",fontSize:"0.62rem",color:C.text,fontWeight:600,display:"flex",alignItems:"center",gap:"0.3rem"}}>
            <span>{c.e}</span>{c.txt}
          </div>
        ))}
      </div>
      {done===total&&total>0&&(
        <div style={{marginTop:"0.7rem",...glass(C.teal,C),borderRadius:"12px",padding:"0.55rem 0.8rem",fontSize:"0.75rem",color:C.text,fontWeight:600,textAlign:"center",position:"relative"}}>
          🎉 Alle 21 Tage abgeschlossen – bereit für HRW Semester 1!
        </div>
      )}
    </div>
  );

  /* ─ Tab-Bar (Glass) ─ */
  const Tabs=(
    <div role="tablist" aria-label="Ansicht wählen" style={{display:"flex",
      background:isDark?"rgba(10,14,26,0.85)":"rgba(251,248,240,0.92)",
      backdropFilter:"blur(24px) saturate(160%)",WebkitBackdropFilter:"blur(24px) saturate(160%)",
      borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:20}}>
      {[{id:"plan",l:"🏠 Start"},{id:"detail",l:"🔬 Detail"},{id:"semester",l:"🎓 Semester"},{id:"glossar",l:"📖 Glossar"}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} className="hover-pop" role="tab" aria-selected={tab===t.id}
          style={{flex:1,padding:"0.78rem 0",fontSize:"0.7rem",fontWeight:700,fontFamily:"inherit",
            border:"none",background:"transparent",
            color:tab===t.id?C.text:C.muted,
            borderBottom:tab===t.id?`2px solid ${C.blue}`:"2px solid transparent",
            cursor:"pointer",transition:"all 0.2s",letterSpacing:"0.01em"}}>
          {t.l}
        </button>
      ))}
    </div>
  );

  /* ─ Wochen-Banner (Glass mit Farbtönung) ─ */
  const WkBanner=({woche,wColor,days,doneCount})=>(
    <div style={{...glass(wColor,C),borderRadius:"14px",padding:"0.9rem 1.05rem",marginBottom:"0.8rem",display:"flex",alignItems:"center",gap:"0.65rem"}}>
      <span style={{fontSize:"1.3rem"}}>{woche.e}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:"0.58rem",color:wColor,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Woche {woche.nr}</div>
        <div style={{fontSize:"0.92rem",fontWeight:800,color:C.text}}>{woche.t}</div>
        <div style={{fontSize:"0.62rem",color:C.muted,marginTop:"0.08rem"}}>{woche.sub}</div>
      </div>
      <div style={{background:`${wColor}28`,border:`1px solid ${wColor}50`,borderRadius:"9999px",padding:"0.2rem 0.7rem",fontSize:"0.68rem",color:wColor,fontWeight:700,flexShrink:0}}>
        {doneCount}/{days.length}
      </div>
    </div>
  );

  /* ─ TAG-KARTE (Liquid Glass) ─ */
  const TagKarte=({day,wColor,wBg})=>{
    const isOpen=oCards.has(day.nr),isDone=!!ck[day.nr],datum=fmtDate(start,day.nr-1);
    const isToday=todayNr===day.nr;
    return(
      <div id={`day-${day.nr}`} style={{...glass(isDone?wColor:null,C),borderRadius:"14px",marginBottom:"0.6rem",overflow:"hidden",
        border:`1px solid ${isToday?wColor+"85":isOpen?wColor+"55":(isDone?wColor+"40":C.glassBorder)}`,
        boxShadow:isToday?`0 8px 28px ${wColor}30, inset 0 1px 0 ${C.glassHi}`:undefined,
        transition:"all 0.25s"}}>
        <div className="hover-pop" {...kb(()=>tCard(day.nr))} aria-expanded={isOpen} style={{display:"flex",alignItems:"center",gap:"0.65rem",padding:"0.85rem 0.95rem",cursor:"pointer"}} onClick={()=>tCard(day.nr)}>
          {/* Tag-Nummer */}
          <div style={{textAlign:"center",flexShrink:0,width:"36px"}}>
            <div style={{fontSize:"1.1rem",fontWeight:900,color:isDone?wColor+"aa":wColor,lineHeight:1,textDecoration:isDone?"line-through":"none"}}>{dayNum(day.nr)}</div>
            <div style={{fontSize:"0.52rem",color:C.muted,fontWeight:600}}>{datum||"Tag"}</div>
          </div>
          {/* Vertikaler Divider */}
          <div style={{width:"2px",height:"36px",background:`${wColor}40`,borderRadius:"1px",flexShrink:0}}/>
          {/* Inhalt */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:"0.88rem",fontWeight:700,color:isDone?C.muted:C.text,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:isOpen?"normal":"nowrap",lineHeight:1.3}}>
              {isToday&&<span style={{fontSize:"0.56rem",color:wColor,fontWeight:800,letterSpacing:"0.06em",marginRight:"0.35rem",background:`${wColor}22`,border:`1px solid ${wColor}45`,borderRadius:"9999px",padding:"0.08rem 0.4rem",verticalAlign:"middle"}}>HEUTE</span>}
              {day.e} {day.t}
            </div>
            {!isOpen&&<div style={{fontSize:"0.68rem",color:C.muted,marginTop:"0.15rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{day.d}</div>}
          </div>
          {/* Checkbox */}
          <div onClick={e=>{e.stopPropagation();toggle(day.nr);}}
            onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();toggle(day.nr);}}}
            role="checkbox" aria-checked={isDone} aria-label={`Tag ${day.nr} als erledigt markieren`} tabIndex={0}
            className="hover-pop"
            style={{width:"27px",height:"27px",flexShrink:0,borderRadius:"50%",
              border:`2px solid ${isDone?wColor:C.glassBorder}`,
              background:isDone?wColor:"rgba(255,255,255,0.06)",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",color:isDone?"#0a0e1a":"transparent",fontSize:"0.75rem",fontWeight:900,
              boxShadow:isDone?`0 2px 10px ${wColor}60`:"none",transition:"all 0.2s"}}>
            {isDone&&"✓"}
          </div>
        </div>
        {isOpen&&(
          <div style={{padding:"0 0.95rem 0.95rem",borderTop:`1px solid ${C.border}`}}>
            <p style={{margin:"0.65rem 0 0.7rem",fontSize:"0.8rem",color:C.muted,lineHeight:1.6}}>{day.d}</p>
            <div style={{...glass(null,C),borderRadius:"12px",padding:"0.68rem 0.85rem",marginBottom:"0.65rem"}}>
              <div style={{fontSize:"0.58rem",color:wColor,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.32rem"}}>✏️ AUFGABE · 20 MIN</div>
              <div style={{fontSize:"0.8rem",color:C.text,lineHeight:1.6}}>{day.a}</div>
            </div>
            <div style={{fontSize:"0.58rem",color:C.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem"}}>🔗 LINKS & RESSOURCEN</div>
            <div style={{display:"flex",flexWrap:"wrap"}}>{day.lk.map((lk,i)=><Pill key={i} l={lk.l} u={lk.u} col={wColor}/>)}</div>
          </div>
        )}
      </div>
    );
  };

  /* ── LERNPLAN VIEW (Start) ─ */
  const PlanView=(
    <div style={{padding:"1rem"}}>
      {/* Start-Banner */}
      <div style={{...glass(C.blue,C),borderRadius:"16px",padding:"1rem 1.1rem",marginBottom:"1.1rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:"100px",height:"100px",borderRadius:"50%",background:`${C.blue}25`,filter:"blur(30px)"}}/>
        <div style={{fontSize:"0.6rem",color:C.blue,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.4rem",position:"relative"}}>🏠 Start-Verzeichnis</div>
        <div style={{fontSize:"0.92rem",fontWeight:800,color:C.text,marginBottom:"0.25rem",position:"relative"}}>Willkommen zurück!</div>
        <div style={{fontSize:"0.72rem",color:C.muted,lineHeight:1.6,position:"relative"}}>
          Alles zum Interagieren an einem Ort: Fokus-Timer, Quiz-Verzeichnis, 21-Tage-Plan zum Abhaken und die Ressourcen-Bibliothek. Tagesstruktur: 5 Min Anki · 10 Min Video/Lesen · 5 Min Takeaways notieren.
        </div>
      </div>

      {/* Statistik-Reihe */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.5rem",marginBottom:"1.1rem"}}>
        <Stat e="✅" v={`${done}/${total}`} l="Tage" col={ACCENT.teal} C={C}/>
        <Stat e="🃏" v={knownTotal} l="Karten gewusst" col={ACCENT.violet} C={C}/>
        <Stat e="🏆" v={quizzesPerfect} l="Quiz perfekt" col={ACCENT.red} C={C}/>
      </div>

      {/* Heute-dran-Karte */}
      {todayNr&&(()=>{
        const td=PLAN[todayNr-1];
        const twc=WC[td.w];
        return(
          <div style={{...glass(twc,C),borderRadius:"16px",padding:"0.9rem 1rem",marginBottom:"1.1rem",display:"flex",alignItems:"center",gap:"0.6rem"}}>
            <span style={{fontSize:"1.3rem",flexShrink:0}}>📍</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"0.58rem",color:twc,fontWeight:800,letterSpacing:"0.09em",textTransform:"uppercase"}}>Heute dran · Tag {todayNr}</div>
              <div style={{fontSize:"0.85rem",fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{td.e} {td.t}</div>
            </div>
            <button onClick={()=>{
                setOCards(p=>{const n=new Set(p);n.add(todayNr);return n;});
                setTimeout(()=>{try{const el=document.getElementById(`day-${todayNr}`);el&&el.scrollIntoView({behavior:"smooth",block:"center"});}catch{}},100);
              }} className="hover-pop"
              style={{flexShrink:0,padding:"0.45rem 0.9rem",borderRadius:"9999px",border:`1px solid ${twc}60`,
                background:`${twc}24`,color:twc,fontSize:"0.7rem",fontWeight:800,
                cursor:"pointer",fontFamily:"inherit",minHeight:"38px"}}>
              Öffnen ↓
            </button>
          </div>
        );
      })()}

      {/* Fokus-Timer */}
      <FocusTimer C={C}/>

      {/* 21-Tage-Plan */}
      <div style={{display:"flex",alignItems:"center",gap:"0.4rem",margin:"0.3rem 0 0.7rem"}}>
        <span style={{fontSize:"0.95rem"}}>📋</span>
        <span style={{fontSize:"0.66rem",color:C.text,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>21-Tage-Plan</span>
      </div>
      {WOCHEN.map(woche=>{
        const wc=WC[woche.nr],wbg=WBG[woche.nr],days=PLAN.filter(d=>d.w===woche.nr),wd=days.filter(d=>ck[d.nr]).length;
        return(
          <div key={woche.nr} style={{marginBottom:"1.75rem"}}>
            <WkBanner woche={woche} wColor={wc} days={days} doneCount={wd}/>
            {days.map(day=><TagKarte key={day.nr} day={day} wColor={wc} wBg={wbg}/>)}
          </div>
        );
      })}

      {/* Quiz-Verzeichnis – als Ganzes auf-/zuklappbar, nach Semester strukturiert */}
      <div id="quiz-verzeichnis" style={{...glass(ACCENT.teal,C),borderRadius:16,marginBottom:"1.1rem",overflow:"hidden"}}>
        <div onClick={()=>setQuizSecOpen(o=>!o)} {...kb(()=>setQuizSecOpen(o=>!o))} aria-expanded={quizSecOpen} className="hover-pop"
          style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.85rem 1.1rem",cursor:"pointer"}}>
          <span style={{fontSize:"0.95rem"}}>🧩</span>
          <span style={{fontSize:"0.66rem",color:ACCENT.teal,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",flex:1}}>Quiz-Verzeichnis</span>
          <span style={{fontSize:"0.6rem",color:C.muted}}>{quizMods.length} Module</span>
          <span style={{color:ACCENT.teal,fontSize:"0.65rem",flexShrink:0}}>{quizSecOpen?"▲":"▼"}</span>
        </div>
        {quizSecOpen&&(
          <div style={{padding:"0 1.1rem 1rem"}}>
            <div style={{fontSize:"0.72rem",color:C.muted,lineHeight:1.6,marginBottom:"0.6rem"}}>
              Tippe auf ein Modul, um sein Quiz direkt hier zu machen. Dein Bestscore wird gespeichert 🏆.
            </div>
            <button onClick={resetQuiz} disabled={quizOpen.size===0} className="hover-pop"
              aria-label="Alle geöffneten Quiz wieder zuklappen"
              style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.7rem",
                padding:"0.4rem 0.85rem",borderRadius:"9999px",border:`1px solid ${quizOpen.size?ACCENT.teal+"55":C.glassBorder}`,
                background:quizOpen.size?`${ACCENT.teal}1c`:"rgba(255,255,255,0.04)",
                color:quizOpen.size?ACCENT.teal:C.muted,fontSize:"0.7rem",fontWeight:700,
                cursor:quizOpen.size?"pointer":"default",fontFamily:"inherit",minHeight:"34px",
                opacity:quizOpen.size?1:0.55,transition:"all 0.18s"}}>
              ↺ Auswahl zurücksetzen{quizOpen.size?` (${quizOpen.size})`:""}
            </button>
            {Object.entries(quizMods.reduce((acc,m)=>{(acc[m.semNr]=acc[m.semNr]||[]).push(m);return acc;},{}))
              .sort((a,b)=>Number(a[0])-Number(b[0]))
              .map(([semNr,mods])=>{
                const semExpanded=semQuizExp.has(semNr);
                const visibleMods=semExpanded?mods:mods.slice(0,1);
                const restCount=mods.length-1;
                return(
                  <div key={semNr} style={{marginBottom:"0.7rem"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.3rem",paddingLeft:"0.1rem"}}>
                      <span style={{fontSize:"0.58rem",color:C.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>
                        Semester {semNr}
                      </span>
                      {restCount>0&&(
                        <button onClick={()=>tSemQuizExp(semNr)} className="hover-pop" aria-expanded={semExpanded}
                          style={{marginLeft:"auto",padding:"0.15rem 0.55rem",borderRadius:"9999px",
                            border:`1px solid ${ACCENT.teal}40`,background:"rgba(255,255,255,0.04)",
                            color:ACCENT.teal,fontSize:"0.58rem",fontWeight:700,cursor:"pointer",
                            fontFamily:"inherit",minHeight:"26px"}}>
                          {semExpanded?"▲ weniger":`▾ +${restCount} weitere`}
                        </button>
                      )}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:"0.28rem"}}>
                      {visibleMods.map(mod=>{
                        const qOpen=quizOpen.has(mod.id);
                        const mColor=ACCENT.teal;
                        const b=quizBest[mod.id];
                        return(
                          <div key={mod.id} style={{borderRadius:"10px",overflow:"hidden",
                            border:`1px solid ${qOpen?mColor+"50":C.glassBorder}`,
                            background:qOpen?`${mColor}0d`:"rgba(255,255,255,0.03)",transition:"all 0.18s"}}>
                            <div onClick={()=>tQuiz(mod.id)} {...kb(()=>tQuiz(mod.id))} aria-expanded={qOpen} className="hover-pop"
                              style={{fontSize:"0.72rem",color:C.text,padding:"0.45rem 0.6rem",lineHeight:1.4,
                                cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem"}}>
                              <span style={{background:`${mColor}20`,border:`1px solid ${mColor}40`,borderRadius:"6px",
                                padding:"0.15rem 0.4rem",fontSize:"0.56rem",fontWeight:800,color:mColor,flexShrink:0}}>
                                {mod.code}
                              </span>
                              <span style={{flex:1,fontWeight:qOpen?700:500}}>{mod.name}</span>
                              {b&&<span style={{fontSize:"0.56rem",fontWeight:800,color:b.c===b.t?ACCENT.teal:C.muted,flexShrink:0}}>🏆{b.c}/{b.t}</span>}
                              <span style={{color:mColor,fontSize:"0.6rem",flexShrink:0}}>{qOpen?"▲":"▼"}</span>
                            </div>
                            {qOpen&&(
                              <div style={{padding:"0 0.6rem 0.6rem"}}>
                                <Quiz questions={mod.quiz} col={mColor} C={C} best={quizBest[mod.id]} onDone={(c,t)=>saveQuizResult(mod.id,c,t)}/>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </div>

      <QuickLinks C={C}/>
    </div>
  );

  /* ── DETAILLIERT VIEW ─ */
  const DetailView=(
    <div style={{padding:"1rem"}}>
      {/* Buch-Banner */}
      <div style={{...glass(C.violet,C),borderRadius:"16px",padding:"1.05rem 1.15rem",marginBottom:"1.15rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:"100px",height:"100px",borderRadius:"50%",background:"rgba(167,139,250,0.18)",filter:"blur(30px)"}}/>
        <div style={{fontSize:"0.6rem",color:C.violet,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.4rem",position:"relative"}}>📖 Dein Studienbuch · Modul ECM · Google Drive</div>
        <div style={{fontSize:"0.92rem",fontWeight:800,color:C.text,marginBottom:"0.2rem",position:"relative"}}>Frank Deges – Grundlagen des E-Commerce</div>
        <div style={{fontSize:"0.7rem",color:C.muted,marginBottom:"0.7rem",position:"relative"}}>Strategien, Modelle, Instrumente · 2. Auflage · Springer Gabler 2023</div>
        <div style={{display:"flex",flexWrap:"wrap",position:"relative"}}>
          <Pill l="📂 Buch öffnen" u={BOOK} col={C.violet}/>
          <Pill l="🃏 Springer Flashcards" u="https://flashcards.springernature.com/login" col={C.violet}/>
          <Pill l="🎓 HRW Moodle" u="https://elearning.hs-ruhrwest.de/" col={C.violet}/>
        </div>
        <div style={{fontSize:"0.6rem",color:C.muted,marginTop:"0.4rem",position:"relative"}}>Flashcard-Code: <span style={{fontFamily:"monospace",color:C.muted,opacity:0.85}}>53220-33846-342AA-43471-1D108</span></div>
      </div>

      {WOCHEN.map(woche=>{
        const wc=WC[woche.nr],wbg=WBG[woche.nr],days=PLAN.filter(d=>d.w===woche.nr),wd=days.filter(d=>ck[d.nr]).length;
        return(
          <div key={woche.nr} style={{marginBottom:"1.75rem"}}>
            <WkBanner woche={woche} wColor={wc} days={days} doneCount={wd}/>
            {days.map(day=>{
              const isDone=!!ck[day.nr],datum=fmtDate(start,day.nr-1),dayOpen=dDays.has(day.nr);
              const det=DET[day.nr]||{lernziel:"",prüfung:"",begriffe:[],subs:[]};
              return(
                <div key={day.nr} style={{...glass(isDone?wc:null,C),marginBottom:"0.6rem",borderRadius:"16px",overflow:"hidden",border:`1px solid ${dayOpen?wc+"60":(isDone?wc+"40":C.glassBorder)}`,boxShadow:dayOpen?`0 8px 32px ${wc}30, inset 0 1px 0 ${C.glassHi}`:`0 8px 32px ${C.glassShadow}, inset 0 1px 0 ${C.glassHi}`}}>
                  {/* Kopfzeile */}
                  <div className="hover-pop" {...kb(()=>tDay(day.nr))} aria-expanded={dayOpen} style={{display:"flex",alignItems:"center",gap:"0.65rem",padding:"0.85rem 0.95rem",cursor:"pointer"}} onClick={()=>tDay(day.nr)}>
                    <div style={{textAlign:"center",flexShrink:0,width:"36px"}}>
                      <div style={{fontSize:"1.1rem",fontWeight:900,color:wc,lineHeight:1}}>{dayNum(day.nr)}</div>
                      <div style={{fontSize:"0.52rem",color:C.muted,fontWeight:600}}>{datum||"Tag"}</div>
                    </div>
                    <div style={{width:"2px",height:"36px",background:`${wc}40`,borderRadius:"1px",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"0.88rem",fontWeight:700,color:isDone?C.muted:C.text,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{day.e} {day.t}</div>
                      <div style={{fontSize:"0.63rem",color:wc,marginTop:"0.12rem",fontWeight:600}}>Modul: {MODS.find(m=>m.id===(day.w===1?"BWL":day.w===2&&day.nr<=9?"HBL":day.w===2?"ECM":"GIP"))?.label}</div>
                    </div>
                    <div onClick={e=>{e.stopPropagation();toggle(day.nr);}}
                      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();toggle(day.nr);}}}
                      role="checkbox" aria-checked={isDone} aria-label={`Tag ${day.nr} als erledigt markieren`} tabIndex={0}
                      className="hover-pop"
                      style={{width:"27px",height:"27px",flexShrink:0,borderRadius:"50%",border:`2px solid ${isDone?wc:C.glassBorder}`,background:isDone?wc:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:isDone?"#0a0e1a":"transparent",fontSize:"0.75rem",fontWeight:900,boxShadow:isDone?`0 2px 10px ${wc}60`:"none",transition:"all 0.2s"}}>
                      {isDone&&"✓"}
                    </div>
                  </div>

                  {dayOpen&&(
                    <div style={{padding:"0 0.9rem 0.9rem",borderTop:`1px solid ${C.border}`}}>
                      {/* Lernziel */}
                      <div style={{...glass(null,C),borderRadius:"12px",padding:"0.78rem 0.88rem",margin:"0.65rem 0"}}>
                        <div style={{fontSize:"0.58rem",color:wc,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.32rem"}}>🎯 LERNZIEL</div>
                        <div style={{fontSize:"0.79rem",color:C.text,lineHeight:1.65}}>{det.lernziel}</div>
                      </div>
                      {/* Prüfungsrelevanz */}
                      <div style={{...glass(wc,C),borderRadius:"12px",padding:"0.68rem 0.88rem",marginBottom:"0.68rem"}}>
                        <div style={{fontSize:"0.58rem",color:wc,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.3rem"}}>📋 PRÜFUNGSRELEVANZ</div>
                        <div style={{fontSize:"0.78rem",color:C.text,lineHeight:1.6}}>{det.prüfung}</div>
                      </div>
                      {/* Kernbegriffe – klickbar mit Definition */}
                      {det.begriffe&&det.begriffe.length>0&&(
                        <div style={{marginBottom:"0.7rem"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.4rem"}}>
                            <span style={{fontSize:"0.58rem",color:C.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>🔑 KERNBEGRIFFE</span>
                            <span style={{fontSize:"0.56rem",color:C.muted,opacity:0.6}}>· antippen für Definition</span>
                          </div>
                          <div style={{display:"flex",flexWrap:"wrap"}}>
                            {det.begriffe.map((b,bi)=>(
                              <TermPill key={bi} term={b} col={wc} openTerm={openTerm} setOpenTerm={setOpenTerm} C={C}/>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Aufgabe */}
                      <div style={{...glass(null,C),borderRadius:"12px",padding:"0.68rem 0.88rem",marginBottom:"0.68rem"}}>
                        <div style={{fontSize:"0.58rem",color:wc,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.3rem"}}>✏️ AUFGABE (20 MIN)</div>
                        <div style={{fontSize:"0.8rem",color:C.text,lineHeight:1.65}}>{day.a}</div>
                      </div>
                      {/* Unterthemen */}
                      {(det.subs||[]).map((sub,si)=>{
                        const sk=`${day.nr}-${si}`,subOpen=dSubs.has(sk);
                        return(
                          <div key={si} style={{...glass(subOpen?wc:null,C),border:`1px solid ${subOpen?wc+"55":C.glassBorder}`,borderRadius:"12px",marginBottom:"0.42rem",overflow:"hidden"}}>
                            <div onClick={()=>tSub(sk)} {...kb(()=>tSub(sk))} aria-expanded={subOpen} className="hover-pop"
                              style={{display:"flex",alignItems:"center",gap:"0.55rem",padding:"0.65rem 0.85rem",cursor:"pointer"}}>
                              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:wc,flexShrink:0}}/>
                              <div style={{flex:1}}>
                                <div style={{fontSize:"0.82rem",fontWeight:700,color:C.text}}>{sub.t}</div>
                              </div>
                              <span style={{color:C.muted,fontSize:"0.65rem",flexShrink:0}}>{subOpen?"▲":"▼"}</span>
                            </div>
                            {subOpen&&(
                              <div style={{padding:"0 0.85rem 0.8rem",borderTop:`1px solid ${C.border}`}}>
                                <p style={{margin:"0.55rem 0 0.65rem",fontSize:"0.79rem",color:C.muted,lineHeight:1.7}}>{sub.desc}</p>
                                <div style={{fontSize:"0.58rem",color:C.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.35rem"}}>🔗 RESSOURCEN & LINKS</div>
                                <div style={{display:"flex",flexWrap:"wrap"}}>
                                  {sub.items.map((lk,li)=><Pill key={li} l={`${lk.c} ${lk.l}`} u={lk.u} col={cCol(lk.c)}/>)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      <QuickLinks C={C}/>
    </div>
  );

  /* ── SEMESTER VIEW ─ Gesamtes Curriculum, Modul-Akkordeons mit Quiz+Lernkarten ─ */
  const SemesterView=(
    <div style={{padding:"1rem"}}>
      {/* Intro-Banner */}
      <div style={{...glass(ACCENT.blue,C),borderRadius:"16px",padding:"1rem 1.1rem",marginBottom:"1.1rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:"100px",height:"100px",borderRadius:"50%",background:`${ACCENT.blue}25`,filter:"blur(30px)"}}/>
        <div style={{fontSize:"0.6rem",color:ACCENT.blue,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.4rem",position:"relative"}}>🎓 Gesamtes Curriculum</div>
        <div style={{fontSize:"0.92rem",fontWeight:800,color:C.text,marginBottom:"0.25rem",position:"relative"}}>B.Sc. E-Commerce · HRW · BPO 02.06.2023</div>
        <div style={{fontSize:"0.72rem",color:C.muted,lineHeight:1.6,position:"relative"}}>
          Alle 7 Semester, 210 ECTS, mit echten Modulinhalten aus dem Modulhandbuch. Jedes Thema mit Definition und Beispiel. Tippe auf ein Semester, dann auf ein Modul.
        </div>
      </div>

      {SEMESTERS.map(sem=>{
        const isCurrentTarget = sem.nr===1; // Sem.1 = direkt bevorstehend
        const sOpen = semOpen.has(sem.nr);
        const sColor = ACCENT.blue;
        return(
          <div key={sem.nr} style={{marginBottom:"0.6rem"}}>
            <div onClick={()=>tSem(sem.nr)} {...kb(()=>tSem(sem.nr))} aria-expanded={sOpen} className="hover-pop"
              style={{...glass(isCurrentTarget?ACCENT.red:sColor,C),borderRadius:sOpen?"14px 14px 0 0":"14px",
                padding:"0.85rem 1rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.65rem"}}>
              <div style={{width:"38px",height:"38px",borderRadius:"11px",flexShrink:0,
                background:`linear-gradient(135deg, ${isCurrentTarget?ACCENT.red:sColor}35, ${isCurrentTarget?ACCENT.red:sColor}15)`,
                border:`1px solid ${isCurrentTarget?ACCENT.red:sColor}45`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:"1rem",fontWeight:900,color:isCurrentTarget?ACCENT.red:sColor}}>
                {sem.nr}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"0.58rem",color:isCurrentTarget?ACCENT.red:sColor,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>
                  Semester {sem.nr}{isCurrentTarget?" · als Nächstes":""}
                </div>
                <div style={{fontSize:"0.85rem",fontWeight:700,color:C.text,lineHeight:1.3}}>{sem.title}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:"0.68rem",color:C.muted,fontWeight:600}}>{sem.ects} ECTS</div>
                <div style={{fontSize:"0.6rem",color:C.muted}}>{sem.modules.length} Module</div>
              </div>
              <span style={{color:C.muted,fontSize:"0.65rem",flexShrink:0}}>{sOpen?"▲":"▼"}</span>
            </div>

            {sOpen&&(
              <div style={{...glass(null,C),borderTop:"none",borderRadius:"0 0 14px 14px",padding:"0.7rem",overflow:"hidden"}}>
                {sem.modules.map((mod,mi)=>{
                  const mKey=mod.id;
                  const mOpen=modOpen.has(mKey);
                  const mColor = WC[(mi%3)+1];
                  const hasQuiz = mod.quiz&&mod.quiz.length>0;
                  const hasCards = mod.cards&&mod.cards.length>0;
                  return(
                    <div key={mKey} style={{marginBottom:mi<sem.modules.length-1?"0.5rem":0,
                      borderRadius:"12px",overflow:"hidden",
                      border:`1px solid ${mOpen?mColor+"50":C.glassBorder}`,
                      background:mOpen?`${mColor}0a`:"rgba(255,255,255,0.025)"}}>
                      <div onClick={()=>tMod(mKey)} {...kb(()=>tMod(mKey))} aria-expanded={mOpen} className="hover-pop"
                        style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.68rem 0.8rem",cursor:"pointer"}}>
                        <div style={{background:`${mColor}20`,border:`1px solid ${mColor}40`,borderRadius:"7px",
                          padding:"0.2rem 0.45rem",fontSize:"0.62rem",fontWeight:800,color:mColor,flexShrink:0,minWidth:"48px",textAlign:"center"}}>
                          {mod.code}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:"0.82rem",fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:mOpen?"normal":"nowrap"}}>{mod.name}</div>
                          <div style={{fontSize:"0.62rem",color:C.muted,marginTop:"0.1rem"}}>{mod.ects} ECTS{mod.sws!=="—"?` · ${mod.sws} SWS`:""}</div>
                        </div>
                        <span style={{color:C.muted,fontSize:"0.6rem",flexShrink:0}}>{mOpen?"▲":"▼"}</span>
                      </div>

                      {mOpen&&(
                        <div style={{padding:"0 0.8rem 0.8rem"}}>
                          <p style={{margin:"0.3rem 0 0.6rem",fontSize:"0.77rem",color:C.muted,lineHeight:1.6}}>{mod.desc}</p>

                          <div style={{...glass(null,C),borderRadius:"10px",padding:"0.55rem 0.7rem",marginBottom:"0.6rem"}}>
                            <div style={{fontSize:"0.56rem",color:mColor,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.25rem"}}>📋 PRÜFUNGSFORM</div>
                            <div style={{fontSize:"0.75rem",color:C.text,lineHeight:1.5}}>{mod.exam}</div>
                          </div>

                          {mod.topics&&mod.topics.length>0&&(
                            <div style={{marginBottom:"0.65rem"}}>
                              <div style={{fontSize:"0.56rem",color:C.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.3rem"}}>📚 THEMEN <span style={{opacity:0.7,textTransform:"none",letterSpacing:0}}>· antippen für Definition & Beispiel</span></div>
                              <div style={{display:"flex",flexDirection:"column",gap:"0.32rem"}}>
                                {mod.topics.map((t,ti)=>{
                                  const tKey=`${mod.id}-${ti}`;
                                  const tOpen=topicOpen.has(tKey);
                                  return(
                                    <div key={ti} style={{...glass(tOpen?mColor:null,C),border:`1px solid ${tOpen?mColor+"50":C.glassBorder}`,borderRadius:"10px",overflow:"hidden"}}>
                                      <div onClick={()=>tTopic(tKey)} {...kb(()=>tTopic(tKey))} aria-expanded={tOpen} className="hover-pop"
                                        style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 0.7rem",cursor:"pointer"}}>
                                        <span style={{color:mColor,flexShrink:0}}>▸</span>
                                        <span style={{flex:1,fontSize:"0.79rem",fontWeight:700,color:C.text,lineHeight:1.4}}>{t.t}</span>
                                        <span style={{color:mColor,fontSize:"0.6rem",flexShrink:0}}>{tOpen?"▲":"▼"}</span>
                                      </div>
                                      {tOpen&&(
                                        <div style={{padding:"0 0.7rem 0.65rem",borderTop:`1px solid ${C.border}`}}>
                                          {t.def&&(
                                            <div style={{fontSize:"0.73rem",color:C.muted,lineHeight:1.65,margin:"0.55rem 0",marginBottom:t.ex?"0.4rem":"0.55rem"}}>
                                              <b style={{color:mColor,fontWeight:700}}>Definition: </b>{t.def}
                                            </div>
                                          )}
                                          {t.ex&&(
                                            <div style={{fontSize:"0.73rem",color:C.text,lineHeight:1.65,background:`${mColor}12`,borderRadius:"7px",padding:"0.5rem 0.6rem"}}>
                                              <b style={{color:mColor,fontWeight:700}}>Beispiel: </b>{t.ex}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {hasQuiz && (
                            <button onClick={()=>jumpToQuiz(mod.id,sem.nr)} className="hover-pop"
                              style={{width:"100%",display:"flex",alignItems:"center",gap:"0.5rem",
                                ...glass(mColor,C),borderRadius:"10px",padding:"0.6rem 0.75rem",marginBottom:"0.6rem",
                                cursor:"pointer",fontFamily:"inherit",border:`1px solid ${mColor}45`}}>
                              <span style={{fontSize:"0.95rem"}}>🧩</span>
                              <span style={{fontSize:"0.73rem",color:C.text,fontWeight:600,flex:1,textAlign:"left",lineHeight:1.4}}>
                                Quiz zu diesem Modul starten{quizBest[mod.id]?` · 🏆 ${quizBest[mod.id].c}/${quizBest[mod.id].t}`:""}
                              </span>
                              <span style={{color:mColor,fontSize:"0.75rem",flexShrink:0}}>→</span>
                            </button>
                          )}
                          {hasCards && (
                            <FlashcardDeck cards={mod.cards} col={mColor} C={C}
                              known={new Set(fcKnown[mod.id]||[])}
                              onKnown={(i,k)=>setKnownCard(mod.id,i,k)}/>
                          )}
                          {!hasQuiz && !hasCards && (
                            <div style={{fontSize:"0.7rem",color:C.muted,fontStyle:"italic",padding:"0.4rem 0"}}>
                              Konkrete Inhalte hängen vom gewählten Wahlmodul ab – siehe Wahlmodul-Verzeichnis unten.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Wahlmodul-Verzeichnis – anklickbar mit Reset-Button */}
      <div style={{...glass(ACCENT.violet,C),borderRadius:"16px",padding:"1rem 1.1rem",marginTop:"0.5rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.6rem"}}>
          <span style={{fontSize:"0.95rem"}}>🗂️</span>
          <span style={{fontSize:"0.66rem",color:ACCENT.violet,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>Wahlmodul-Verzeichnis</span>
          <span style={{fontSize:"0.6rem",color:C.muted}}>({WAHLMODULE.length} zur Auswahl)</span>
        </div>
        <div style={{fontSize:"0.72rem",color:C.muted,lineHeight:1.6,marginBottom:"0.65rem"}}>
          In Semester 5 & 6 wählst du insgesamt 5 Wahlmodule frei aus diesem Katalog. Tippe auf ein Modul, um die Inhalte zu sehen.
        </div>
        <button onClick={resetWahl} disabled={wahlOpen.size===0} className="hover-pop"
          aria-label="Alle geöffneten Wahlmodule wieder zuklappen"
          style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.75rem",
            padding:"0.4rem 0.85rem",borderRadius:"9999px",border:`1px solid ${wahlOpen.size?ACCENT.violet+"55":C.glassBorder}`,
            background:wahlOpen.size?`${ACCENT.violet}1c`:"rgba(255,255,255,0.04)",
            color:wahlOpen.size?ACCENT.violet:C.muted,fontSize:"0.7rem",fontWeight:700,
            cursor:wahlOpen.size?"pointer":"default",fontFamily:"inherit",minHeight:"36px",
            opacity:wahlOpen.size?1:0.55,transition:"all 0.18s"}}>
          ↺ Auswahl zurücksetzen{wahlOpen.size?` (${wahlOpen.size})`:""}
        </button>
        <div style={{display:"flex",flexDirection:"column",gap:"0.3rem"}}>
          {WAHLMODULE.map((w,wi)=>{
            const wOpen=wahlOpen.has(wi);
            return(
              <div key={wi} style={{borderRadius:"10px",overflow:"hidden",
                border:`1px solid ${wOpen?ACCENT.violet+"50":C.glassBorder}`,
                background:wOpen?`${ACCENT.violet}0d`:"rgba(255,255,255,0.03)",transition:"all 0.18s"}}>
                <div onClick={()=>tWahl(wi)} {...kb(()=>tWahl(wi))} aria-expanded={wOpen} className="hover-pop"
                  style={{fontSize:"0.73rem",color:C.text,padding:"0.5rem 0.65rem",lineHeight:1.4,
                    cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem"}}>
                  <span style={{flex:1,fontWeight:wOpen?700:500}}>{w.n}</span>
                  <span style={{color:ACCENT.violet,fontSize:"0.6rem",flexShrink:0}}>{wOpen?"▲":"▼"}</span>
                </div>
                {wOpen&&(
                  <div style={{padding:"0 0.65rem 0.65rem",borderTop:`1px solid ${C.border}`}}>
                    <p style={{margin:"0.5rem 0 0.55rem",fontSize:"0.72rem",color:C.muted,lineHeight:1.6}}>{w.d}</p>
                    <div style={{fontSize:"0.56rem",color:ACCENT.violet,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.3rem"}}>📚 THEMEN</div>
                    <div style={{display:"flex",flexDirection:"column",gap:"0.22rem"}}>
                      {w.th.map((th,thi)=>(
                        <div key={thi} style={{display:"flex",alignItems:"flex-start",gap:"0.35rem",fontSize:"0.71rem",color:C.text,lineHeight:1.45}}>
                          <span style={{color:ACCENT.violet,flexShrink:0}}>▸</span>
                          <span>{th}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ── GLOSSAR VIEW ─ Alle Begriffe mit Volltextsuche ─ */
  const glosTerms=Object.keys(GLOSSARY).sort((a,b)=>a.localeCompare(b,"de"));
  const gq=glosQ.trim().toLowerCase();
  const glosFiltered=gq?glosTerms.filter(t=>t.toLowerCase().includes(gq)||GLOSSARY[t].toLowerCase().includes(gq)):glosTerms;
  const glosGroups=glosFiltered.reduce((acc,t)=>{
    const ch=t[0].toUpperCase();
    const key=/[A-ZÄÖÜ]/.test(ch)?ch:"#";
    (acc[key]=acc[key]||[]).push(t);
    return acc;
  },{});
  const GlossarView=(
    <div style={{padding:"1rem"}}>
      <div style={{...glass(ACCENT.violet,C),borderRadius:"16px",padding:"1rem 1.1rem",marginBottom:"1rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:"100px",height:"100px",borderRadius:"50%",background:"rgba(167,139,250,0.18)",filter:"blur(30px)"}}/>
        <div style={{fontSize:"0.6rem",color:ACCENT.violet,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.4rem",position:"relative"}}>📖 Glossar</div>
        <div style={{fontSize:"0.92rem",fontWeight:800,color:C.text,marginBottom:"0.25rem",position:"relative"}}>{glosTerms.length} Fachbegriffe von A bis Z</div>
        <div style={{fontSize:"0.72rem",color:C.muted,lineHeight:1.6,position:"relative"}}>
          Alle Kernbegriffe aus BWL, Handel, E-Commerce und Informatik – durchsuchbar nach Begriff oder Definition. Tippe auf einen Eintrag zum Aufklappen.
        </div>
      </div>

      {/* Suche */}
      <div style={{...glass(null,C),borderRadius:"12px",padding:"0.45rem 0.7rem",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
        <span style={{fontSize:"0.9rem",opacity:0.7}}>🔍</span>
        <input type="search" value={glosQ} onChange={e=>setGlosQ(e.target.value)}
          placeholder="Begriff oder Definition suchen…" aria-label="Glossar durchsuchen"
          style={{flex:1,background:"transparent",border:"none",color:C.text,padding:"0.35rem 0.1rem",
            fontSize:"0.82rem",outline:"none",fontFamily:"inherit",minHeight:"32px"}}/>
        {glosQ&&(
          <button onClick={()=>setGlosQ("")} className="hover-pop" aria-label="Suche löschen"
            style={{border:"none",background:"rgba(255,255,255,0.08)",color:C.muted,borderRadius:"50%",
              width:"26px",height:"26px",cursor:"pointer",fontSize:"0.75rem",fontFamily:"inherit",flexShrink:0}}>✕</button>
        )}
      </div>
      <div aria-live="polite" style={{fontSize:"0.62rem",color:C.muted,fontWeight:600,marginBottom:"0.7rem",paddingLeft:"0.2rem"}}>
        {glosFiltered.length} von {glosTerms.length} Begriffen{gq?` für "${glosQ.trim()}"`:""}
      </div>

      {Object.keys(glosGroups).sort((a,b)=>a==="#"?1:b==="#"?-1:a.localeCompare(b,"de")).map(letter=>(
        <div key={letter} style={{marginBottom:"0.9rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.4rem"}}>
            <div style={{width:"26px",height:"26px",borderRadius:"8px",flexShrink:0,
              background:`linear-gradient(135deg, ${ACCENT.violet}35, ${ACCENT.violet}15)`,
              border:`1px solid ${ACCENT.violet}45`,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:"0.72rem",fontWeight:900,color:ACCENT.violet}}>{letter}</div>
            <div style={{flex:1,height:"1px",background:C.border}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.28rem"}}>
            {glosGroups[letter].map(term=>{
              const isOpen=glosOpen.has(term);
              return(
                <div key={term} style={{borderRadius:"10px",overflow:"hidden",
                  border:`1px solid ${isOpen?ACCENT.violet+"50":C.glassBorder}`,
                  background:isOpen?`${ACCENT.violet}0d`:"rgba(255,255,255,0.03)",transition:"all 0.18s"}}>
                  <div onClick={()=>tGlos(term)} {...kb(()=>tGlos(term))} aria-expanded={isOpen} className="hover-pop"
                    style={{fontSize:"0.76rem",color:isOpen?ACCENT.violet:C.text,fontWeight:isOpen?800:600,
                      padding:"0.5rem 0.65rem",lineHeight:1.4,cursor:"pointer",
                      display:"flex",alignItems:"center",gap:"0.4rem"}}>
                    <span style={{flex:1}}>{term}</span>
                    <span style={{color:ACCENT.violet,fontSize:"0.6rem",flexShrink:0}}>{isOpen?"▲":"▼"}</span>
                  </div>
                  {isOpen&&(
                    <div style={{padding:"0 0.65rem 0.6rem",borderTop:`1px solid ${C.border}`}}>
                      <p style={{margin:"0.5rem 0 0",fontSize:"0.75rem",color:C.text,lineHeight:1.65}}>{GLOSSARY[term]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {glosFiltered.length===0&&(
        <div style={{textAlign:"center",padding:"2rem 1rem",color:C.muted}}>
          <div style={{fontSize:"1.6rem",marginBottom:"0.5rem"}}>🤷</div>
          <div style={{fontSize:"0.8rem"}}>Kein Begriff gefunden – probiere einen anderen Suchbegriff.</div>
        </div>
      )}
    </div>
  );

  return(
    <div style={{background:C.bg,backgroundImage:C.bgGrad,minHeight:"100vh",fontFamily:"'Inter',system-ui,-apple-system,sans-serif",color:C.text,WebkitFontSmoothing:"antialiased"}}>
      <style>{`
        @keyframes termFadeIn { from { opacity:0; transform:translateY(-4px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:${isDark?"invert(1)":"none"}; opacity:0.7; }
        input[type="search"]::-webkit-search-cancel-button { display:none; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background:${isDark?"rgba(255,255,255,0.15)":"rgba(20,25,50,0.2)"}; border-radius:9999px; }
        .hover-pop { transition:transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease; }
        @media (hover:hover) {
          .hover-pop:hover { transform:translateY(-2px); filter:brightness(1.08); }
        }
        .hover-pop:active { transform:translateY(0) scale(0.985); filter:brightness(0.97); }
        a.hover-pop:hover { text-decoration:none; }
        [role="button"]:focus-visible, [role="checkbox"]:focus-visible, [role="tab"]:focus-visible,
        button:focus-visible, a:focus-visible, input:focus-visible {
          outline: 2px solid ${C.blue}; outline-offset: 2px; border-radius: 8px;
        }
      `}</style>
      {Hdr}{Tabs}
      <div style={{overflowY:"auto",paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 1.5rem)"}}>
        {tab==="plan"&&PlanView}
        {tab==="detail"&&DetailView}
        {tab==="semester"&&SemesterView}
        {tab==="glossar"&&GlossarView}
      </div>
    </div>
  );
}
