import { describe, expect, it } from "vitest";
import { groupLinks, YT, SF, B, QZ } from "../links.js";

describe("links – groupLinks (Kategorien für Links & Ressourcen)", () => {
  const links = [
    { l: "▶ SimpleClub BWL", u: YT("Was ist BWL") },
    { l: "📊 Statista", u: "https://de.statista.com/themen/3979/e-commerce-in-deutschland/" },
    { l: "📖 Deges Kap.1", u: B(17) },
    { l: "💻 W3Schools", u: "https://www.w3schools.com/java/" },
    { l: "Quizlet BWL", u: QZ("BWL") },
    { l: "▶ Studyflix", u: SF("Bilanz") },
    { l: "HDE Zahlen", u: "https://einzelhandel.de/" },
    { l: "Irgendwas", u: "https://example.com/" },
  ];

  it("sortiert in feste Kategorien: Videos → Daten → Buch → Üben → Weitere", () => {
    const groups = groupLinks(links);
    expect(groups.map((g) => g.id)).toEqual(["video", "daten", "lesen", "ueben", "mehr"]);
  });

  it("ordnet richtig zu und erhält die Reihenfolge innerhalb der Gruppe", () => {
    const groups = groupLinks(links);
    const byId = Object.fromEntries(groups.map((g) => [g.id, g.links.map((x) => x.l)]));
    expect(byId.video).toEqual(["▶ SimpleClub BWL", "▶ Studyflix"]);
    expect(byId.daten).toEqual(["📊 Statista", "HDE Zahlen"]);
    expect(byId.lesen).toEqual(["📖 Deges Kap.1"]);
    expect(byId.ueben).toEqual(["💻 W3Schools", "Quizlet BWL"]);
    expect(byId.mehr).toEqual(["Irgendwas"]);
  });

  it("lässt leere Gruppen weg und verkraftet leere Eingaben", () => {
    expect(groupLinks([])).toEqual([]);
    const onlyVideo = groupLinks([{ l: "▶ x", u: YT("x") }]);
    expect(onlyVideo).toHaveLength(1);
    expect(onlyVideo[0].id).toBe("video");
  });
});
