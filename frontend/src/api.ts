// Accès à l'API Flask de ShopSnap (inchangée).

export type Kind = "profil" | "lien";
export type Statut = "en attente" | "en cours" | "prêt" | "échec" | "enregistré" | "rejeté";

export interface Job {
  id: string;
  kind: Kind;
  entry: string;
  status: Statut;
  log: string[];
  files: string[];
  created: number;
  ended?: number;
  enregistre: { mode: "dossier" | "zip"; chemin: string } | null;
}

export interface Info {
  cookies: boolean;
  destination: string;
}

export interface Abonnement {
  username: string;
  nom: string;
  verifie: boolean;
  categorie: string;
  mot: string;
  lien: string;
}

export interface Abonnements {
  categories: string[];
  comptes: Abonnement[];
}

const json = async <T,>(r: Response): Promise<T> => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
};

export const api = {
  jobs: () => fetch("/api/jobs").then((r) => json<Job[]>(r)),
  info: () => fetch("/api/info").then((r) => json<Info>(r)),
  abonnements: () => fetch("/api/abonnements").then((r) => json<Abonnements>(r)),
  lancer: (kind: Kind, entries: string) =>
    fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, entries }),
    }).then((r) => json<string[]>(r)),
  enregistrer: (id: string, mode: "dossier" | "zip") =>
    fetch(`/api/jobs/${id}/enregistrer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    }).then((r) => json<{ mode: string; chemin: string }>(r)),
  rejeter: (id: string) =>
    fetch(`/api/jobs/${id}/rejeter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).then((r) => json<{ ok: boolean }>(r)),
};

export const urlApercu = (jid: string, f: string) =>
  `/apercu/${jid}/` + f.split("/").map(encodeURIComponent).join("/");
