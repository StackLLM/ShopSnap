// Logique reprise à l'identique de l'ancienne page (static/js/app.js).

/** Dossier commun des fichiers d'une récupération, ex. « liens/compte/CODE/ ». */
export function dossier(files: string[]): string {
  if (!files.length) return "";
  const d = files.map((f) => f.split("/").slice(0, -1));
  const commun = d.reduce((a, b) => a.filter((x, i) => b[i] === x));
  return commun.join("/") + "/";
}

/** Nom affiché de la destination (« donnees/ ») à partir du libellé complet. */
export function racineDe(destination: string): string {
  return destination ? destination.replace(/\/+$/, "").split("/").pop() + "/" : "destination/";
}

export const estFacebook = (entry: string) => /facebook\.com|fb\.watch|fb\.com\/|^fb:/i.test(entry);

export const lienDe = (u: string) => `https://www.instagram.com/${u}/`;

/** Nom d'utilisateur à partir d'un lien Instagram (ou d'un nom tapé). */
export const nomDuLien = (l: string) =>
  (l.match(/instagram\.com\/([A-Za-z0-9._]+)/) || [])[1] || l.replace(/^@/, "");

/** Pages cochées = noms présents dans le champ Profil. */
export const coches = (texte: string) =>
  new Set(texte.split(/\s+/).filter(Boolean).map(nomDuLien));

/** Ajoute / retire des noms dans le champ Profil (un lien par ligne). */
export function basculer(texte: string, usernames: string[], oui: boolean): string {
  const sel = coches(texte);
  usernames.forEach((u) => (oui ? sel.add(u) : sel.delete(u)));
  return [...sel].map(lienDe).join("\n");
}

export const estVideo = (f: string) => /\.(mp4|mov|webm)$/i.test(f);
export const estImage = (f: string) => /\.(jpe?g|png|webp)$/i.test(f);

export const ACTIFS = ["en attente", "en cours", "prêt"] as const;
