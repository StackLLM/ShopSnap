import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Abonnements, type Info, type Job } from "@/api";

/** Récupérations : actualisées toutes les 2 secondes (comme l'ancienne page). */
export function useJobs() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const actif = useRef(true);

  const rafraichir = useCallback(async () => {
    try {
      const j = await api.jobs();
      if (actif.current) setJobs(j);
    } catch {
      /* serveur momentanément indisponible : on réessaie au prochain tour */
    }
  }, []);

  useEffect(() => {
    actif.current = true;
    rafraichir();
    const t = setInterval(rafraichir, 2000);
    return () => {
      actif.current = false;
      clearInterval(t);
    };
  }, [rafraichir]);

  return { jobs, rafraichir };
}

export function useInfo() {
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    api.info().then(setInfo).catch(() => setInfo({ cookies: false, destination: "" }));
  }, []);
  return info;
}

export function useAbonnements() {
  const [data, setData] = useState<Abonnements | null>(null);
  useEffect(() => {
    api.abonnements().then(setData).catch(() => setData({ categories: [], comptes: [] }));
  }, []);
  return data;
}

/** Thème clair / sombre, mémorisé dans le navigateur (sombre par défaut). */
export function useTheme() {
  const [sombre, setSombre] = useState(() => {
    try {
      return localStorage.getItem("shopsnap-theme") !== "clair";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", sombre);
    try {
      localStorage.setItem("shopsnap-theme", sombre ? "sombre" : "clair");
    } catch {
      /* stockage indisponible : pas grave */
    }
  }, [sombre]);
  return { sombre, basculer: () => setSombre((s) => !s) };
}
