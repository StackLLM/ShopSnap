import { basculer, coches, dossier, estFacebook, nomDuLien, racineDe } from "@/lib/outils";

describe("logique reprise de l'ancienne page", () => {
  it("dossier commun d'une récupération", () => {
    expect(dossier(["liens/compte/CODE/CODE_1.jpg", "liens/compte/CODE/CODE_2.jpg"])).toBe("liens/compte/CODE/");
    expect(dossier(["profils/x/a.jpg", "profils/x/b/c.mp4"])).toBe("profils/x/");
    expect(dossier([])).toBe("");
  });

  it("nom affiché de la destination", () => {
    expect(racineDe("projet/web/medias/donnees")).toBe("donnees/");
    expect(racineDe("donnees/")).toBe("donnees/");
    expect(racineDe("")).toBe("destination/");
  });

  it("reconnaît Facebook", () => {
    expect(estFacebook("https://www.facebook.com/nike")).toBe(true);
    expect(estFacebook("https://fb.watch/abc/")).toBe(true);
    expect(estFacebook("fb:nike")).toBe(true);
    expect(estFacebook("https://www.instagram.com/p/X/")).toBe(false);
  });

  it("cocher / décocher remplit le champ Profil", () => {
    let champ = "";
    champ = basculer(champ, ["demo_a"], true);
    champ = basculer(champ, ["demo_b"], true);
    expect(champ).toBe("https://www.instagram.com/demo_a/\nhttps://www.instagram.com/demo_b/");
    expect(coches(champ)).toEqual(new Set(["demo_a", "demo_b"]));
    champ = basculer(champ, ["demo_a"], false);
    expect(champ).toBe("https://www.instagram.com/demo_b/");
  });

  it("garde un nom tapé à la main", () => {
    expect(nomDuLien("@demo_c")).toBe("demo_c");
    expect(coches("demo_c\nhttps://www.instagram.com/demo_d/")).toEqual(new Set(["demo_c", "demo_d"]));
  });
});
