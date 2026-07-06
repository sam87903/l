/**
 * Bonus-Quizze über den reinen Modulstoff hinaus – Transfer- und
 * Umfeldwissen, abgestimmt auf Studiengang und Studienverlaufsplan des
 * B.Sc. E-Commerce an der HRW (BPO 2023).
 */
export const GENERAL_QUIZZES = [
  {
    id: "gen-hrw", icon: "🎓", name: "Studienplan & HRW",
    desc: "Aufbau des Studiums, Prüfungsformen und Fakten aus Modulhandbuch und Studienverlaufsplan.",
    quiz: [
      { q: "Wie viele ECTS umfasst der B.Sc. E-Commerce an der HRW insgesamt?", options: ["180", "210", "240", "120"], correct: 1, explain: "7 Semester × 30 ECTS = 210 ECTS – inklusive Praxissemester, Bachelorarbeit und Kolloquium." },
      { q: "Wie viel Workload entspricht einem ECTS-Punkt?", options: ["10 Stunden", "30 Stunden", "45 Stunden", "60 Stunden"], correct: 1, explain: "Laut Modulhandbuch stehen z.B. 6 Credits für 180 h Workload – also 30 h pro ECTS." },
      { q: "Mit welcher Programmiersprache startest du an der HRW ins Studium?", options: ["Python", "Java", "PHP", "C++"], correct: 1, explain: "Grundlagen der Informatik und Programmierung (1. Semester) lehrt Programmierung in Java – Softwaretechnik baut darauf auf." },
      { q: "Welches Datenbanksystem wird im Modul Datenbanken hauptsächlich eingesetzt?", options: ["MySQL", "MongoDB", "Oracle", "MS Access"], correct: 0, explain: "Konzeption und Implementierung einer Datenbankanwendung erfolgen laut Modulhandbuch in MySQL." },
      { q: "Welches Frontend-Framework steht im Modul Webtechnologien auf dem Plan?", options: ["Angular", "Vue", "React", "Svelte"], correct: 2, explain: "Die Inhaltsliste nennt HTML5, CSS3, JavaScript und React – entwickelt wird mit VS Code, Git und Node.js." },
      { q: "Wie viele frei wählbare Wahlmodule enthält der Studienverlaufsplan insgesamt?", options: ["2", "3", "5", "7"], correct: 2, explain: "Zwei Wahlmodule im 5. und drei im 6. Semester – insgesamt fünf à 6 ECTS." },
      { q: "In welchem Modul schreibst du bereits im 1. Semester eine Seminararbeit als Gruppenarbeit?", options: ["Einführung in die BWL", "Grundlagen des E-Commerce", "English", "Grundlagen des Handelsmanagements"], correct: 1, explain: "Grundlagen des E-Commerce: Klausur (50 %) plus Seminararbeit als Gruppenarbeit mit mündlicher Prüfung (50 %)." },
      { q: "Wie viele ECTS bringt die Bachelorarbeit (ohne Kolloquium)?", options: ["8", "10", "12", "15"], correct: 2, explain: "Bachelorarbeit 12 ECTS plus Kolloquium 2 ECTS im 7. Semester." },
      { q: "Was bedeutet die 'Fünfsemesterhürde' beim Modul Social Commerce?", options: ["Man muss fünf Semester warten", "Das Modul Marketing aus dem 2. Semester muss bestanden sein", "Fünf Klausuren in einer Woche", "Das Modul darf nur fünfmal besucht werden"], correct: 1, explain: "Formale Teilnahmevoraussetzung laut Modulhandbuch: Das Modul '(Online-)Marketing' (2. FS) muss bestanden sein." },
      { q: "Wofür steht 'BPO 2023'?", options: ["Bachelorprüfungsordnung von 2023", "Business Process Optimization", "Bachelor-Praxisordnung", "Berufspraktische Orientierung"], correct: 0, explain: "Die BPO regelt Prüfungen, Fristen und den Studienverlauf – dein Jahrgang studiert nach der BPO 2023." },
      { q: "Welche Wahlmodule bietet der Studiengang unter anderem an?", options: ["Empfehlungssysteme, Natural Language Processing und Virtual/Augmented Reality", "Nur Sprachkurse", "Nur BWL-Vertiefungen", "Maschinenbau-Grundlagen"], correct: 0, explain: "Der Wahlkatalog reicht von KI-Themen (Empfehlungssysteme, NLP, Machine Learning) über UX bis Startup Project." },
      { q: "In welcher Sprache finden die meisten Prüfungen laut Modulhandbuch statt?", options: ["Englisch", "Deutsch", "Wahlweise Deutsch oder Englisch", "Französisch"], correct: 1, explain: "Prüfungssprache ist fast durchgehend Deutsch – Ausnahme ist das englischsprachige Modul English." },
    ],
  },
  {
    id: "gen-praxis", icon: "🛒", name: "E-Commerce-Praxis & Trends",
    desc: "Branchenwissen über den Vorlesungsstoff hinaus – was im Online-Handel wirklich passiert.",
    quiz: [
      { q: "Was ist Dropshipping?", options: ["Der Händler verkauft, der Lieferant versendet direkt an den Kunden – ohne eigenes Lager", "Ein Expressversand-Tarif", "Zustellung per Drohne", "Ein Rabattsystem"], correct: 0, explain: "Beim Dropshipping entfällt das Lagerrisiko, dafür sinkt die Kontrolle über Lieferzeit und Markenerlebnis." },
      { q: "Wofür steht die Kennzahl AOV?", options: ["Average Order Value – der durchschnittliche Bestellwert", "Automatic Order Verification", "Annual Online Volume", "Average Onsite Visits"], correct: 0, explain: "Der AOV steigt z.B. durch Cross-Selling, Bundles oder Versandkostenfrei-Schwellen." },
      { q: "Wann lohnt sich Kundenakquise langfristig?", options: ["Wenn der Customer Lifetime Value über den Akquisekosten (CAC) liegt", "Wenn CAC gleich dem Umsatz ist", "Wenn der CLV egal ist", "Wenn die Akquisekosten steigen"], correct: 0, explain: "CLV > CAC ist die Grundgleichung profitablen Wachstums im E-Commerce." },
      { q: "Was unterscheidet SEO von SEA?", options: ["SEO = organische Suchoptimierung, SEA = bezahlte Suchanzeigen", "SEO ist immer bezahlt", "SEA betrifft nur Social Media", "Es gibt keinen Unterschied"], correct: 0, explain: "Beides zusammen ist Suchmaschinenmarketing (SEM): unbezahlte Rankings plus gebuchte Anzeigen." },
      { q: "Was ist ein A/B-Test?", options: ["Zwei Varianten werden parallel an echten Nutzern verglichen, z.B. zwei Checkout-Designs", "Ein Backup-Verfahren", "Zwei Zahlungsarten anbieten", "Ein Sicherheitstest"], correct: 0, explain: "A/B-Tests machen Optimierung messbar: Die Variante mit besserer Conversion gewinnt." },
      { q: "Ein häufiger Grund für Warenkorbabbrüche ist …", options: ["unerwartete Versandkosten im Checkout", "zu große Produktbilder", "zu schnelle Ladezeiten", "zu viele Zahlungsarten"], correct: 0, explain: "Überraschende Kosten kurz vor dem Kauf sind Abbruchgrund Nummer eins – Transparenz erhöht die Conversion." },
      { q: "Was bedeutet 'Buy Now, Pay Later' (z.B. Klarna)?", options: ["Sofort kaufen, später zahlen – der Anbieter übernimmt das Ausfallrisiko", "Ein Abo-Modell", "Barzahlung bei Abholung", "Eine Preisgarantie"], correct: 0, explain: "BNPL erhöht die Conversion; der Händler bekommt sein Geld sofort, zahlt dafür Gebühren." },
      { q: "Wofür nutzen Online-Shops künstliche Intelligenz besonders häufig?", options: ["Produktempfehlungen und Personalisierung", "Steuererklärungen", "Personaleinstellungen", "Gebäudereinigung"], correct: 0, explain: "Empfehlungssysteme, personalisierte Startseiten und dynamische Preise sind die häufigsten KI-Anwendungen – an der HRW sogar ein Wahlmodul." },
      { q: "Was verspricht Quick Commerce?", options: ["Lieferung in Minuten aus stadtnahen Mikro-Lagern", "Schnellere Websites", "Express-Retouren", "Sofortige Werbeschaltung"], correct: 0, explain: "Q-Commerce (z.B. Lieferdienste für Lebensmittel) setzt auf dichte Mikro-Hubs – Kostendruck auf der letzten Meile inklusive." },
      { q: "Welche Branche kämpft online mit den höchsten Retourenquoten?", options: ["Mode/Fashion", "Bücher", "Unterhaltungselektronik", "Tierbedarf"], correct: 0, explain: "Bei Bekleidung gehen teils über 50 % zurück (Passform!) – Größenberater und bessere Bilder wirken dagegen." },
      { q: "Was bedeutet 'Fulfillment by Amazon' (FBA)?", options: ["Amazon lagert, verpackt und versendet die Ware des Händlers", "Amazon produziert die Ware selbst", "Der Händler liefert selbst aus", "Nur Werbung auf Amazon"], correct: 0, explain: "FBA-Händler kaufen Logistik und Prime-Versand als Service ein – gegen Lager- und Versandgebühren." },
      { q: "Was ist Headless Commerce?", options: ["Frontend und Shop-Backend sind entkoppelt und über APIs verbunden", "Ein Shop ohne Impressum", "Verkauf ohne Kundenkonto", "Ein Shop ohne Produkte"], correct: 0, explain: "Headless trennt Präsentation und Commerce-Logik – ein Backend beliefert Web, App und weitere Kanäle." },
    ],
  },
  {
    id: "gen-wirtschaft", icon: "📈", name: "Wirtschaftswissen kompakt",
    desc: "Ökonomisches Grundwissen, das in jeder Vorlesung und jedem Praktikum vorausgesetzt wird.",
    quiz: [
      { q: "Was passiert bei steigender Nachfrage und gleichem Angebot tendenziell mit dem Preis?", options: ["Er steigt", "Er sinkt", "Er bleibt exakt gleich", "Er wird null"], correct: 0, explain: "Marktmechanismus: Übersteigt die Nachfrage das Angebot, steigen die Preise – und umgekehrt." },
      { q: "Was misst die Inflationsrate?", options: ["Den durchschnittlichen Anstieg des Preisniveaus", "Die Arbeitslosigkeit", "Die Exportquote", "Die Leitzinsen"], correct: 0, explain: "Deshalb unterscheidet man auch nominale und reale (preisbereinigte) Kenngrößen." },
      { q: "Welche Mehrwertsteuersätze gelten in Deutschland?", options: ["19 % regulär und 7 % ermäßigt", "21 % und 10 %", "15 % einheitlich", "25 % und 12 %"], correct: 0, explain: "19 % Standard; 7 % u.a. für Lebensmittel und Bücher – wichtig für jede Shop-Kalkulation." },
      { q: "Was sind Fixkosten?", options: ["Kosten, die unabhängig von der Menge anfallen, z.B. Miete", "Kosten pro verkauftem Stück", "Einmalige Gründungskosten", "Nur Steuern"], correct: 0, explain: "Fixkosten bleiben konstant; variable Kosten wachsen mit der Menge – Basis der Break-even-Rechnung." },
      { q: "Was beschreibt der Break-even-Punkt?", options: ["Die Absatzmenge, ab der die Erlöse die Gesamtkosten decken", "Den maximalen Gewinn", "Das Saisonende", "Den Lagerhöchstbestand"], correct: 0, explain: "Ab dem Break-even beginnt die Gewinnzone: Fixkosten ÷ Deckungsbeitrag je Stück = Break-even-Menge." },
      { q: "Was ist der Deckungsbeitrag?", options: ["Verkaufspreis minus variable Kosten je Stück", "Umsatz minus sämtliche Kosten", "Gewinn nach Steuern", "Das Marketingbudget"], correct: 0, explain: "Der Deckungsbeitrag 'deckt' die Fixkosten – was darüber hinausgeht, ist Gewinn." },
      { q: "Was sind Opportunitätskosten?", options: ["Der entgangene Nutzen der besten nicht gewählten Alternative", "Bürokosten", "Zölle", "Werbekosten"], correct: 0, explain: "Wer 5.000 € in Lager statt Werbung steckt, 'zahlt' den entgangenen Werbeertrag als Opportunitätskosten." },
      { q: "Was sind Skaleneffekte (Economies of Scale)?", options: ["Sinkende Stückkosten bei steigender Ausbringungsmenge", "Steigende Preise bei Knappheit", "Mehr Personal pro Auftrag", "Höhere Steuern bei Wachstum"], correct: 0, explain: "Fixkosten verteilen sich auf mehr Einheiten – ein Kernvorteil großer Plattformen." },
      { q: "Der häufigste Auslöser für Unternehmensinsolvenzen ist …", options: ["Zahlungsunfähigkeit (fehlende Liquidität)", "zu viel Eigenkapital", "zu hohe Gewinne", "zu wenige Meetings"], correct: 0, explain: "Auch profitable Firmen scheitern, wenn Rechnungen nicht fristgerecht bezahlt werden können – Liquidität vor Rentabilität." },
      { q: "Was unterscheidet Handelsmarge und Aufschlag?", options: ["Die Marge bezieht sich auf den Verkaufspreis, der Aufschlag auf den Einkaufspreis", "Nichts, beides ist identisch", "Der Aufschlag ist immer kleiner", "Margen gibt es nur im Laden"], correct: 0, explain: "EK 50 €, VK 100 €: Aufschlag 100 % (auf EK), Marge 50 % (vom VK) – ein Klassiker in Kalkulationsaufgaben." },
    ],
  },
  {
    id: "gen-it", icon: "💻", name: "IT- & Digital-Grundwissen",
    desc: "Digitale Basics, die im Studium und in jedem E-Commerce-Job vorausgesetzt werden.",
    quiz: [
      { q: "Was bedeutet das 'S' in HTTPS?", options: ["Secure – die Verbindung ist verschlüsselt", "Speed", "Server", "Standard"], correct: 0, explain: "TLS-Verschlüsselung schützt Daten unterwegs – für Shops mit Kundendaten Pflicht." },
      { q: "Was ist eine API?", options: ["Eine Schnittstelle, über die Programme Daten und Funktionen austauschen", "Ein Virenschutzprogramm", "Eine spezielle Datenbank", "Ein Betriebssystem"], correct: 0, explain: "Shop, Warenwirtschaft und Zahlungsanbieter sprechen über APIs miteinander – z.B. per REST." },
      { q: "Was bedeutet SaaS?", options: ["Software as a Service – Software wird als Cloud-Dienst gemietet", "Storage as a System", "Security and Safety", "Server at a Site"], correct: 0, explain: "Statt Kauf und eigenem Server: Miete pro Monat/Nutzer – wie bei vielen Shopsystemen üblich." },
      { q: "Was ist Phishing?", options: ["Der Versuch, mit gefälschten Nachrichten an Zugangsdaten zu gelangen", "Eine Team-Sportart", "Ein Datenkompressionsverfahren", "Ein Netzwerkkabel-Typ"], correct: 0, explain: "Gefälschte Login-Seiten und Mails sind Angriffsvektor Nr. 1 – auch auf Shop-Admin-Konten." },
      { q: "Wozu dient Zwei-Faktor-Authentifizierung (2FA)?", options: ["Zusätzlicher Schutz: Login erfordert Passwort plus zweiten Faktor", "Doppelte Internetgeschwindigkeit", "Zwei Benutzerkonten", "Automatische Backups"], correct: 0, explain: "Selbst mit gestohlenem Passwort scheitert der Angreifer am zweiten Faktor (App, Code, Hardware-Key)." },
      { q: "Was ist Open-Source-Software?", options: ["Der Quellcode ist offen einsehbar und darf genutzt und verändert werden", "Eine kostenlose Testversion", "Software ohne jede Lizenz", "Nur für Behörden erlaubt"], correct: 0, explain: "Viele E-Commerce-Bausteine (Linux, MySQL, Node.js) sind Open Source – Lizenzbedingungen gelten trotzdem." },
      { q: "Was speichert ein Cookie im Browser?", options: ["Kleine Datenmengen wie Session-IDs oder Einstellungen", "Ganze Programme", "Viren", "Immer Passwörter im Klartext"], correct: 0, explain: "Cookies halten z.B. den Warenkorb und Logins – Tracking-Cookies brauchen daher Consent (DSGVO/TTDSG)." },
      { q: "Was ist ein Algorithmus?", options: ["Eine eindeutige Schritt-für-Schritt-Anleitung zur Lösung eines Problems", "Ein Computervirus", "Eine Programmiersprache", "Ein Speichermedium"], correct: 0, explain: "Vom Sortierverfahren bis zum Empfehlungssystem: Algorithmen sind präzise Handlungsvorschriften." },
      { q: "Was beschreibt Machine Learning?", options: ["Systeme lernen Muster aus Daten, statt explizit programmiert zu werden", "Roboter zusammenbauen", "Auswendiglernen von Fakten", "Ein Hardware-Upgrade"], correct: 0, explain: "ML steckt hinter Empfehlungen, Betrugserkennung und Prognosen – und im HRW-Wahlkatalog." },
      { q: "Wer stellt im Web die Anfrage: Client oder Server?", options: ["Der Client (z.B. Browser) fragt an, der Server antwortet", "Der Server fragt den Client", "Beide senden immer gleichzeitig", "Keiner von beiden"], correct: 0, explain: "Request/Response-Prinzip: Browser sendet HTTP-Anfragen, der (Web-)Server liefert Antworten." },
    ],
  },
];

export const GENERAL_QUIZ_BY_ID = new Map(GENERAL_QUIZZES.map((d) => [d.id, d]));
