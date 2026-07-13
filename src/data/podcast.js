/**
 * Podcast-Skripte: strukturierte, informative Hör-Episoden zu den
 * Themenblöcken des Studiengangs. Jede Episode besteht aus Segmenten
 * ({ heading, text }), die nacheinander vorgelesen werden (Web Speech API)
 * und gleichzeitig als mitlesbares Skript erscheinen.
 *
 * Der `text` ist bewusst emoji- und sonderzeichenarm gehalten, damit die
 * Sprachausgabe sauber klingt. Reihenfolge folgt dem Studienaufbau.
 */
export const PODCASTS = [
  {
    id: "pod-bwl",
    icon: "🏛️",
    title: "BWL-Grundlagen: Wirtschaften mit knappen Mitteln",
    sem: 1,
    topic: "Ökonomisches Prinzip, Zielsystem, Rechtsformen",
    segments: [
      {
        heading: "Worum es geht",
        text: "Willkommen zur ersten Folge. Heute steigen wir in die Betriebswirtschaftslehre ein – das Fundament deines Studiums. Die zentrale Frage der BWL lautet: Wie treffen Unternehmen kluge Entscheidungen, wenn Geld, Zeit und Personal immer knapp sind? Genau darum dreht sich alles Weitere.",
      },
      {
        heading: "Das ökonomische Prinzip",
        text: "Die wichtigste Entscheidungsregel ist das ökonomische Prinzip, auch Wirtschaftlichkeitsprinzip genannt. Es hat zwei Gesichter. Beim Minimalprinzip ist ein Ziel fest vorgegeben, zum Beispiel eine bestimmte Produktionsmenge, und du willst den Mitteleinsatz dafür so gering wie möglich halten. Beim Maximalprinzip ist umgekehrt das Budget fix, und du willst damit den größtmöglichen Ertrag erzielen. Wirtschaftlichkeit misst man als Verhältnis von Ertrag zu Aufwand. Ein Wert über eins bedeutet: Es kam mehr heraus, als hineingesteckt wurde.",
      },
      {
        heading: "Das Zielsystem",
        text: "Kein Unternehmen verfolgt nur ein einziges Ziel. Sachziele legen fest, was angeboten wird – also Produkte, Märkte, Qualität. Formalziele beschreiben, wie erfolgreich gewirtschaftet wird: Gewinn, Rentabilität, Liquidität, Marktanteil. Dazu kommen soziale und ökologische Ziele, etwa faire Arbeitsbedingungen und Umweltschutz. Spannend wird es bei Zielkonflikten: Höhere Servicequalität kostet Geld und belastet kurzfristig den Gewinn. Gutes Management heißt, diese Spannungen bewusst auszubalancieren.",
      },
      {
        heading: "Rechtsformen und Haftung",
        text: "Wenn du gründest, musst du eine Rechtsform wählen – und die entscheidet vor allem über die Haftung. Beim Einzelunternehmen und bei der Gesellschaft bürgerlichen Rechts haftest du unbeschränkt, also auch mit deinem Privatvermögen. Kapitalgesellschaften wie die GmbH oder die Aktiengesellschaft beschränken die Haftung dagegen auf das Gesellschaftsvermögen. Der Preis dafür sind ein Mindestkapital, mehr Formalitäten und strengere Publizitätspflichten. Die Rechtsform beeinflusst also Haftung, Steuern, Finanzierung und Mitspracherechte gleichzeitig.",
      },
      {
        heading: "Merke dir das",
        text: "Fassen wir zusammen: Wirtschaften bedeutet, mit knappen Mitteln rational umzugehen. Das ökonomische Prinzip gibt dir die Grundlogik, das Zielsystem zeigt die vielen Interessen, und die Rechtsform steckt den rechtlichen Rahmen ab. Wenn du diese drei Bausteine verstanden hast, hast du das Gerüst der BWL im Kopf. In der nächsten Folge schauen wir uns an, wie Unternehmen ihre Zahlen erfassen.",
      },
    ],
  },
  {
    id: "pod-rewe",
    icon: "📊",
    title: "Rechnungswesen: Die Sprache der Zahlen",
    sem: 1,
    topic: "Bilanz, doppelte Buchführung, GuV, Abschreibungen",
    segments: [
      {
        heading: "Intern und extern",
        text: "Das Rechnungswesen ist die Sprache, in der ein Unternehmen über sich selbst spricht. Man unterscheidet zwei Bereiche. Das externe Rechnungswesen richtet sich nach außen – an Finanzamt, Banken und Investoren – und ist gesetzlich geregelt, Stichwort Handelsgesetzbuch. Das interne Rechnungswesen, die Kosten- und Leistungsrechnung, ist für die Steuerung im Inneren gedacht und frei gestaltbar. Heute geht es vor allem um den externen Teil.",
      },
      {
        heading: "Inventur, Inventar, Bilanz",
        text: "Am Anfang steht die Inventur – die körperliche Bestandsaufnahme aller Vermögenswerte und Schulden. Das Ergebnis ist das Inventar, ein ausführliches Verzeichnis. Daraus wird die Bilanz verdichtet. Die Bilanz hat zwei Seiten: Links stehen die Aktiva, also wofür das Geld verwendet wurde – das Vermögen. Rechts stehen die Passiva, also woher das Geld kommt – Eigen- und Fremdkapital. Beide Seiten sind per Definition immer gleich groß. Deshalb spricht man von der Bilanzgleichung.",
      },
      {
        heading: "Doppelte Buchführung",
        text: "Der Kern des Systems ist die doppelte Buchführung. Jeder Geschäftsvorfall wird auf mindestens zwei Konten gebucht: einmal im Soll und einmal im Haben. Deshalb doppelt. Ein einfaches Beispiel: Du kaufst Ware und bezahlst bar. Dann steigt dein Warenbestand, während deine Kasse sinkt. Die beiden Buchungen halten sich exakt die Waage. Diese Systematik macht Fehler sichtbar, denn Soll und Haben müssen am Ende immer übereinstimmen.",
      },
      {
        heading: "Die Gewinn- und Verlustrechnung",
        text: "Während die Bilanz einen Stichtag abbildet, zeigt die Gewinn- und Verlustrechnung einen Zeitraum. Sie stellt Erträge den Aufwendungen gegenüber. Überwiegen die Erträge, entsteht Gewinn; überwiegen die Aufwendungen, entsteht Verlust. Wichtig ist die Unterscheidung: Auszahlung ist nicht gleich Aufwand. Kaufst du eine Maschine, ist das eine Auszahlung, aber der Aufwand verteilt sich über die Nutzungsdauer. Und genau da kommen die Abschreibungen ins Spiel.",
      },
      {
        heading: "Abschreibungen verstehen",
        text: "Abschreibungen verteilen die Anschaffungskosten eines Gutes über seine Nutzungsdauer. Eine Maschine für zehntausend Euro mit fünf Jahren Nutzungsdauer wird linear mit zweitausend Euro pro Jahr abgeschrieben. So bildet die Buchhaltung den realen Wertverlust ab und der Gewinn wird periodengerecht ausgewiesen. Merke: Rechnungswesen ist kein Selbstzweck, sondern liefert die Zahlen, auf denen jede unternehmerische Entscheidung beruht.",
      },
    ],
  },
  {
    id: "pod-handel",
    icon: "🛍️",
    title: "Handel verstehen: Funktionen, Formen, Wandel",
    sem: 1,
    topic: "Handelsfunktionen, Betriebsformen, Handelsspanne",
    segments: [
      {
        heading: "Was Handel eigentlich leistet",
        text: "Handel bedeutet, Waren zu beschaffen und ohne wesentliche Be- oder Verarbeitung weiterzuverkaufen. Man unterscheidet Großhandel, der an gewerbliche Kunden verkauft, und Einzelhandel, der an Endverbraucher verkauft. Oft hört man, der Handel sei nur ein Zwischenhändler, der Ware teurer macht. Doch das greift zu kurz, denn der Handel erfüllt echte volkswirtschaftliche Funktionen.",
      },
      {
        heading: "Die Handelsfunktionen",
        text: "Merk dir diese Kernfunktionen. Die Raumüberbrückung bringt Ware vom Hersteller zum Kunden. Die Zeitüberbrückung lagert Ware, bis sie gebraucht wird. Die Mengenfunktion teilt große Produktionsmengen in kundengerechte Portionen. Die Sortimentsfunktion bündelt Produkte vieler Hersteller zu einem passenden Angebot. Dazu kommen Kredit-, Beratungs- und Werbefunktion. Erst diese Leistungen rechtfertigen die Handelsspanne.",
      },
      {
        heading: "Betriebsformen",
        text: "Der Handel tritt in vielen Betriebsformen auf: vom Fachgeschäft über den Supermarkt und Discounter bis zum Versand- und Online-Handel. Jede Form hat ihre eigene Logik aus Sortimentsbreite, Preisniveau und Servicegrad. Der Discounter setzt auf schmales Sortiment und niedrige Preise, das Fachgeschäft auf Tiefe und Beratung. Diese Positionierung entscheidet über den Erfolg.",
      },
      {
        heading: "Handelsspanne und Kalkulation",
        text: "Die Handelsspanne ist die Differenz zwischen Einkaufs- und Verkaufspreis. Sie muss alle Kosten des Handels decken und den Gewinn ermöglichen. In der Handelskalkulation rechnest du vom Einstandspreis über Handlungskosten und Gewinnzuschlag zum Verkaufspreis. Wer die Spanne zu knapp kalkuliert, macht Verlust; wer sie zu hoch ansetzt, verliert Kunden an die Konkurrenz.",
      },
      {
        heading: "Der Wandel zum Omnichannel",
        text: "Der Handel ist heute im Umbruch. Kunden wechseln nahtlos zwischen Laden, App und Website. Man spricht von Omnichannel: Alle Kanäle greifen ineinander, der Kunde informiert sich online und kauft offline oder umgekehrt. Der stationäre Handel erfindet sich als Erlebnisort neu, während der Online-Handel auf Bequemlichkeit und Auswahl setzt. Genau an dieser Schnittstelle setzt dein Studiengang an.",
      },
    ],
  },
  {
    id: "pod-ecommerce",
    icon: "🛒",
    title: "E-Commerce-Grundlagen: Geschäftsmodelle und Plattformen",
    sem: 1,
    topic: "B2B/B2C/D2C, Plattformökonomie, Netzeffekte",
    segments: [
      {
        heading: "Die Marktbeziehungen",
        text: "E-Commerce, also der elektronische Handel, ordnet sich nach den Beteiligten. B2C steht für Business-to-Consumer, das Unternehmen verkauft an Endkunden. B2B ist Business-to-Business, der Handel zwischen Unternehmen, mengenmäßig der größte Bereich. C2C bezeichnet den Handel zwischen Privatpersonen, etwa auf Kleinanzeigen-Plattformen. Und D2C, Direct-to-Consumer, meint Hersteller, die den Handel überspringen und direkt an den Kunden verkaufen.",
      },
      {
        heading: "Geschäftsmodelle im Netz",
        text: "Es gibt mehr als nur den klassischen Online-Shop. Marktplätze bringen viele Anbieter und Käufer zusammen und verdienen an Provisionen. Abo-Modelle liefern regelmäßig gegen wiederkehrende Zahlung. Und ein digitales Phänomen ist der Long Tail: Online lassen sich auch Nischenprodukte profitabel verkaufen, weil Regalplatz praktisch unbegrenzt ist. Die Summe vieler kleiner Nischen kann den Umsatz der Bestseller übersteigen.",
      },
      {
        heading: "Plattformökonomie und Netzeffekte",
        text: "Das mächtigste Konzept im E-Commerce sind Netzeffekte. Eine Plattform wird für jeden Nutzer wertvoller, je mehr andere sie nutzen. Mehr Käufer ziehen mehr Verkäufer an, und mehr Verkäufer ziehen wieder mehr Käufer an. Das nennt man indirekte Netzeffekte. Der Haken: Am Anfang ist die Plattform leer. Erst wenn die kritische Masse erreicht ist, kippt das Wachstum ins Selbstläuferische. Deshalb kämpfen Plattformen anfangs so hart um Reichweite.",
      },
      {
        heading: "Die Customer Journey",
        text: "Der Weg des Kunden bis zum Kauf heißt Customer Journey. Sie beginnt bei der Aufmerksamkeit, führt über Interesse und Abwägung bis zur Entscheidung und schließlich zur Bindung. An jedem Berührungspunkt, jedem Touchpoint, kann der Kunde abspringen. Im E-Commerce misst man das genau: Wie viele Besucher werden zu Käufern? Diese Conversion Rate ist die zentrale Kennzahl.",
      },
      {
        heading: "Erfolgsfaktoren",
        text: "Worauf kommt es an? Vertrauen ist die härteste Währung im Online-Handel: Gütesiegel, Bewertungen und sichere Bezahlung senken die Kaufhemmung. Dazu kommen schnelle Ladezeiten, eine klare Nutzerführung und ein reibungsloser Checkout. Jeder zusätzliche Klick kostet Kunden. Merke: Im E-Commerce gewinnt selten das billigste Angebot, sondern das reibungsloseste Erlebnis.",
      },
    ],
  },
  {
    id: "pod-marketing",
    icon: "📣",
    title: "Online-Marketing: Von SEO bis Customer Journey",
    sem: 2,
    topic: "Marketing-Mix, SEO/SEA, Social Media, KPIs",
    segments: [
      {
        heading: "Der Marketing-Mix",
        text: "Marketing ist mehr als Werbung – es ist die konsequente Ausrichtung des Unternehmens am Markt. Klassisch beschreibt man es mit den vier P: Product, Price, Place und Promotion, also Produkt, Preis, Vertrieb und Kommunikation. Bei Dienstleistungen kommen drei weitere P dazu: People, Process und Physical Evidence. Der Mix bedeutet: Diese Stellschrauben müssen zusammenpassen und dieselbe Botschaft senden.",
      },
      {
        heading: "SEO gegen SEA",
        text: "Zwei Begriffe verwechseln viele. SEO, Suchmaschinenoptimierung, sorgt dafür, dass deine Seite in den unbezahlten Trefferlisten weit oben steht – durch gute Inhalte, Technik und Verlinkung. Das wirkt langfristig und kostet vor allem Arbeit. SEA, Suchmaschinenwerbung, sind die bezahlten Anzeigen über den Ergebnissen; du zahlst pro Klick und bist sofort sichtbar. SEO ist der langsam wachsende Baum, SEA der Wasserhahn, den du auf- und zudrehen kannst.",
      },
      {
        heading: "Social Media und Content",
        text: "Auf sozialen Plattformen zählt nicht Unterbrechung, sondern Relevanz. Content-Marketing setzt darauf, mit nützlichen oder unterhaltsamen Inhalten Vertrauen aufzubauen, statt direkt zu verkaufen. Influencer verleihen Marken Glaubwürdigkeit über ihre Reichweite. Wichtig ist, den Kanal zur Zielgruppe zu wählen: Ein B2B-Anbieter ist woanders unterwegs als eine Modemarke für junge Leute.",
      },
      {
        heading: "Die Journey steuern",
        text: "Ein bewährtes Modell für den Kaufweg ist AIDA: Attention, Interest, Desire, Action – Aufmerksamkeit, Interesse, Verlangen, Handlung. Modernes Marketing denkt darüber hinaus in Touchpoints über alle Kanäle und will den Kunden nach dem Kauf halten. Denn einen bestehenden Kunden zu binden ist deutlich günstiger, als einen neuen zu gewinnen.",
      },
      {
        heading: "Kennzahlen, die zählen",
        text: "Online-Marketing lebt von Messbarkeit. Die Click-Through-Rate zeigt, wie oft eine Anzeige geklickt wird. Die Conversion Rate misst, wie viele Besucher zu Kunden werden. Die Customer Acquisition Cost sagt, was ein neuer Kunde kostet, und der Customer Lifetime Value, was er über die gesamte Beziehung einbringt. Die Faustregel: Der Lebenswert eines Kunden muss deutlich über den Kosten seiner Gewinnung liegen, sonst rechnet sich das Geschäft nicht.",
      },
    ],
  },
  {
    id: "pod-informatik",
    icon: "💻",
    title: "Informatik-Grundlagen: Daten, Datenbanken, Web",
    sem: 2,
    topic: "Zahlensysteme, Datenbanken, SQL, Client-Server",
    segments: [
      {
        heading: "Alles ist Bits",
        text: "Computer kennen nur zwei Zustände: Strom an oder aus, eins oder null. Das ist ein Bit. Acht Bits ergeben ein Byte. Damit lassen sich Zahlen, Text, Bilder und Töne codieren. Neben dem Dezimalsystem, das wir Menschen nutzen, arbeitet die Informatik mit dem Binär- und dem Hexadezimalsystem. Wer Zahlensysteme umrechnen kann, versteht, wie Daten im Rechner wirklich aussehen.",
      },
      {
        heading: "Algorithmen und Daten",
        text: "Ein Algorithmus ist eine eindeutige, schrittweise Handlungsvorschrift zur Lösung eines Problems – vergleichbar mit einem Kochrezept. Damit ein Programm effizient arbeitet, braucht es passende Datenstrukturen, etwa Listen für Reihenfolgen oder Tabellen für schnellen Zugriff. Gute Software entsteht, wenn Algorithmus und Datenstruktur zum Problem passen.",
      },
      {
        heading: "Relationale Datenbanken",
        text: "Das Herz vieler Anwendungen ist die Datenbank. Im relationalen Modell werden Daten in Tabellen aus Zeilen und Spalten gespeichert. Jede Tabelle hat einen Primärschlüssel, der jeden Datensatz eindeutig identifiziert. Über Fremdschlüssel werden Tabellen verknüpft, zum Beispiel Kunden mit ihren Bestellungen. Vor dem Bau modelliert man das im Entity-Relationship-Diagramm, das Objekte und ihre Beziehungen abbildet.",
      },
      {
        heading: "Fragen mit SQL",
        text: "Mit Daten spricht man über SQL, die Structured Query Language. Mit SELECT holst du Daten, mit WHERE filterst du sie, mit JOIN verknüpfst du Tabellen, und mit INSERT, UPDATE und DELETE veränderst du Bestände. Ein Beispiel: SELECT Name FROM Kunden WHERE Stadt gleich Berlin liefert dir alle Berliner Kunden. SQL ist erstaunlich nah an natürlicher Sprache – deshalb lohnt es sich, es früh zu üben.",
      },
      {
        heading: "Das Web dahinter",
        text: "Im Web arbeiten Rechner nach dem Client-Server-Prinzip. Dein Browser, der Client, schickt über das Protokoll HTTP eine Anfrage an einen Server, der die Seite zurückliefert. Aufgebaut werden Seiten aus HTML für die Struktur, CSS für das Aussehen und JavaScript für das Verhalten. Wer diese Schichten kennt, versteht, wie jeder Online-Shop im Inneren funktioniert.",
      },
    ],
  },
  {
    id: "pod-recht",
    icon: "⚖️",
    title: "E-Commerce-Recht und Datenschutz: Die Spielregeln",
    sem: 3,
    topic: "Vertragsschluss, Widerruf, Impressum, DSGVO",
    segments: [
      {
        heading: "Verträge im Internet",
        text: "Auch online gelten die Regeln des Bürgerlichen Gesetzbuchs. Ein Vertrag kommt durch Angebot und Annahme zustande. Achtung, eine Produktdarstellung im Shop ist juristisch noch kein Angebot, sondern eine Einladung zum Bestellen. Erst die Bestellung des Kunden ist das Angebot, das der Händler annimmt. Weil der Kunde die Ware nicht anfassen kann, spricht das Gesetz von Fernabsatz und schützt ihn besonders.",
      },
      {
        heading: "Das Widerrufsrecht",
        text: "Der wichtigste Verbraucherschutz im Fernabsatz ist das Widerrufsrecht. Kunden können einen Online-Kauf in der Regel innerhalb von vierzehn Tagen ohne Angabe von Gründen widerrufen. Der Händler muss darüber klar informieren, sonst verlängert sich die Frist erheblich. Wichtig ist auch die sogenannte Button-Lösung: Der Bestellknopf muss eindeutig beschriftet sein, etwa mit zahlungspflichtig bestellen, sonst kommt kein Vertrag zustande.",
      },
      {
        heading: "Pflichtangaben im Shop",
        text: "Jeder gewerbliche Online-Auftritt braucht ein vollständiges Impressum mit Anbieterkennung. Dazu kommen klare Informationspflichten über Preise inklusive Steuern, Versandkosten, Lieferzeiten und das Widerrufsrecht. Allgemeine Geschäftsbedingungen dürfen den Kunden nicht unangemessen benachteiligen. Fehlen diese Angaben oder sind sie falsch, drohen Abmahnungen durch Wettbewerber oder Verbände.",
      },
      {
        heading: "Datenschutz nach DSGVO",
        text: "Wer mit Kundendaten arbeitet, unterliegt der Datenschutz-Grundverordnung. Ihre Grundprinzipien: Datenverarbeitung braucht eine Rechtsgrundlage, etwa eine Einwilligung. Es gilt Datensparsamkeit, also nur so viele Daten wie nötig, und Zweckbindung, also Nutzung nur für den angegebenen Zweck. Kunden haben Rechte auf Auskunft, Berichtigung und Löschung. Verstöße können empfindliche Bußgelder auslösen.",
      },
      {
        heading: "Fairer Wettbewerb",
        text: "Zum Schluss das Wettbewerbsrecht. Es verbietet unlautere Geschäftspraktiken wie irreführende Werbung oder das Belästigen mit ungefragter Werbung. Verstöße werden häufig per Abmahnung verfolgt, bei der der Abgemahnte eine Unterlassungserklärung abgeben und Kosten tragen soll. Für den E-Commerce heißt das: Sauber informieren und ehrlich werben ist nicht nur fair, sondern schützt auch vor teuren Fehlern.",
      },
    ],
  },
  {
    id: "pod-logistik",
    icon: "📦",
    title: "Logistik und Supply Chain: Ware in Bewegung",
    sem: 4,
    topic: "Fulfillment, Lager, Supply Chain, Retouren",
    segments: [
      {
        heading: "Was Logistik bedeutet",
        text: "Logistik sorgt dafür, dass das richtige Produkt in der richtigen Menge zur richtigen Zeit am richtigen Ort ist – und das zu möglichst geringen Kosten. Sie umfasst Beschaffung, Lagerung, Transport und Distribution. Im E-Commerce ist die Logistik oft der entscheidende Wettbewerbsfaktor, denn schnelle und zuverlässige Lieferung ist ein zentrales Kaufkriterium geworden.",
      },
      {
        heading: "Fulfillment im E-Commerce",
        text: "Der gesamte Prozess von der Bestellung bis zur Auslieferung heißt Fulfillment. Er umfasst das Kommissionieren, also das Zusammenstellen der Ware, das Verpacken, den Versand und die Bearbeitung von Rücksendungen. Viele Händler lagern diesen Prozess an Dienstleister aus, etwa an Fulfillment-Center großer Plattformen. Das spart Investitionen, kostet aber Marge und Kontrolle.",
      },
      {
        heading: "Lager und Kommissionierung",
        text: "Im Lager entscheidet sich Geschwindigkeit. Eine gute Lagerorganisation minimiert Wege. Bei der chaotischen Lagerhaltung werden Artikel dort abgelegt, wo gerade Platz ist, und ein System merkt sich den Ort – das nutzt den Raum optimal. Moderne Lager arbeiten mit Barcodes, Scannern und zunehmend mit Robotern, um die Kommissionierung zu beschleunigen und Fehler zu vermeiden.",
      },
      {
        heading: "Supply Chain Management",
        text: "Über das einzelne Unternehmen hinaus denkt das Supply Chain Management. Es steuert die gesamte Kette vom Rohstoff bis zum Endkunden über mehrere Firmen hinweg. Ein bekanntes Problem ist der Peitscheneffekt, englisch Bullwhip-Effekt: Kleine Nachfrageschwankungen beim Kunden schaukeln sich entlang der Kette zu immer größeren Ausschlägen auf. Gute Informationsflüsse und Abstimmung dämpfen diesen Effekt.",
      },
      {
        heading: "Retouren und Nachhaltigkeit",
        text: "Ein Sonderthema des Online-Handels sind Retouren. Rücksendungen sind teuer und belasten die Umwelt. Gutes Retourenmanagement senkt die Quote durch genaue Produktbeschreibungen, gute Bilder und Größenberatung. Überhaupt rückt Nachhaltigkeit in den Fokus: umweltfreundliche Verpackung, gebündelte Lieferungen und kürzere Transportwege. Logistik ist längst nicht mehr nur eine Kostenfrage, sondern auch eine Verantwortungsfrage.",
      },
    ],
  },
  {
    id: "pod-lernen",
    icon: "🎧",
    title: "Clever lernen: Deine Prüfungsvorbereitung",
    sem: 0,
    topic: "Active Recall, Spaced Repetition, Fokus, Altklausuren",
    segments: [
      {
        heading: "Warum aktiv besser ist",
        text: "Bevor du in den Stoff eintauchst, hier die vielleicht wichtigste Folge: wie du überhaupt lernst. Der größte Fehler ist passives Wiederlesen. Es fühlt sich produktiv an, bringt aber wenig. Viel wirksamer ist Active Recall, aktives Erinnern: Du schließt das Buch und versuchst, den Stoff aus dem Kopf abzurufen. Genau das trainieren die Quizze und Lernkarten in dieser App. Jeder Abruf gräbt die Spur im Gedächtnis tiefer.",
      },
      {
        heading: "Spaced Repetition",
        text: "Der zweite Hebel ist zeitlich verteiltes Wiederholen, Spaced Repetition. Statt alles am Vortag zu pauken, wiederholst du in wachsenden Abständen: nach einem Tag, nach drei Tagen, nach einer Woche. Das Leitner-System mit seinen Karteikästen macht genau das. Was du sicher kannst, kommt seltener; was noch wackelt, häufiger. So bleibt der Stoff langfristig hängen, statt nach der Klausur zu verpuffen.",
      },
      {
        heading: "Fokus statt Dauerlauf",
        text: "Konzentration ist eine begrenzte Ressource. Die Pomodoro-Technik teilt das Lernen in fokussierte Blöcke von etwa fünfundzwanzig Minuten mit kurzen Pausen dazwischen. Der eingebaute Fokus-Timer hilft dir dabei. Wichtig ist, in diesen Blöcken das Handy wegzulegen. Lieber vier konzentrierte Blöcke als drei zerstreute Stunden.",
      },
      {
        heading: "Altklausuren sind Gold",
        text: "Nichts bereitet besser vor als echte Altklausuren. Sie zeigen dir Aufgabentypen, Schwerpunkte und das Anspruchsniveau. Arbeite sie unter realistischen Bedingungen durch, auf Zeit und ohne Hilfsmittel. Der Klausur-Simulator und die Klausur-Analyse in dieser App helfen dir, Muster und wiederkehrende Themen zu erkennen. Wer die Fragen der Vergangenheit kennt, ist auf die Zukunft besser vorbereitet.",
      },
      {
        heading: "Dranbleiben zählt",
        text: "Zum Schluss das Wichtigste: Kontinuität schlägt Intensität. Jeden Tag ein bisschen ist wirksamer als seltene Marathons. Halte deinen Streak am Leben, hak deine Tagesziele ab und feiere kleine Fortschritte. Motivation folgt oft dem Handeln, nicht umgekehrt. Fang einfach an – und der Rest kommt von selbst. Viel Erfolg bei deinem Studium.",
      },
    ],
  },
];

/** Vollständiges Vorlese-Skript einer Episode (für die Sprachausgabe). */
export const podcastFullText = (episode) =>
  episode.segments.map((s) => s.text).join("\n\n");

/** Grobe Hördauer in Minuten (ca. 145 Wörter/Minute bei Sprachausgabe). */
export const podcastMinutes = (episode) => {
  const words = episode.segments.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 145));
};
