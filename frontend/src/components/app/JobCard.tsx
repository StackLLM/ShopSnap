import { useState } from "react";
import { motion } from "framer-motion";
import { Archive, Facebook, FolderDown, Instagram, Play, ScrollText } from "lucide-react";
import { Badge } from "@/components/lightswind/badge";
import { Button } from "@/components/lightswind/button";
import { BorderBeam } from "@/components/lightswind/border-beam";
import { SlideToConfirm } from "@/components/lightswind/slide-to-confirm";
import { Skeleton } from "@/components/lightswind/skeleton";
import { urlApercu, type Job, type Statut } from "@/api";
import { dossier, estFacebook, estImage, estVideo } from "@/lib/outils";
import { Lightbox } from "./Lightbox";

const BADGE: Record<Statut, { variant: "secondary" | "warning" | "info" | "destructive" | "success" | "outline"; texte: string; classe?: string }> = {
  "en attente": { variant: "secondary", texte: "en attente" },
  "en cours": { variant: "warning", texte: "en cours" },
  // « prêt » aux couleurs de la charte (champagne) plutôt que le bleu par défaut
  prêt: { variant: "outline", texte: "prêt", classe: "border-primary/60 bg-primary/15 text-primary" },
  échec: { variant: "destructive", texte: "échec" },
  enregistré: { variant: "success", texte: "enregistré" },
  rejeté: { variant: "outline", texte: "rejeté" },
};

interface Props {
  job: Job;
  racine: string;
  onEnregistrer: (id: string, mode: "dossier" | "zip") => Promise<void>;
  onRejeter: (id: string) => Promise<void>;
}

export function JobCard({ job: j, racine, onEnregistrer, onRejeter }: Props) {
  const [occupe, setOccupe] = useState(false);
  const [vue, setVue] = useState<number | null>(null);
  const fb = estFacebook(j.entry);
  const Plateforme = fb ? Facebook : Instagram;
  const medias = j.files.filter((f) => estImage(f) || estVideo(f)).slice(0, 60);
  const urls = medias.map((f) => urlApercu(j.id, f));
  const montrerVignettes = j.files.length > 0 && j.status !== "rejeté" && !(j.enregistre && j.enregistre.mode === "zip");
  const b = BADGE[j.status] ?? BADGE["en attente"];

  const agir = async (f: () => Promise<void>) => {
    setOccupe(true);
    try {
      await f();
    } finally {
      setOccupe(false);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="job verre relative overflow-hidden p-5 sm:p-6"
      data-id={j.id}
    >
      {j.status === "en cours" && <BorderBeam size={180} duration={7} colorFrom="var(--nacre-2)" colorTo="hsl(var(--halo))" />}

      <header className="flex flex-wrap items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background/50 text-primary">
          <Plateforme className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <span className="tag text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {fb ? "Facebook" : "Instagram"} · {j.kind === "profil" ? "profil" : "lien"}
        </span>
        <span className="entry min-w-0 flex-1 truncate font-mono text-[13px] text-foreground/90" title={j.entry}>
          {j.entry}
        </span>
        <Badge variant={b.variant} withDot={j.status === "en cours"} className={`st whitespace-nowrap ${b.classe ?? ""}`}>
          {b.texte}
          {j.files.length ? ` · ${j.files.length} fichiers` : ""}
        </Badge>
      </header>

      {j.status === "prêt" && (
        <div className="mt-5 space-y-4">
          <p className="aide-ligne text-sm text-muted-foreground">
            Pas encore enregistré. Destination :{" "}
            <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
              {racine}
              {dossier(j.files)}
            </code>
          </p>
          <div className="actions flex flex-wrap items-center gap-3">
            <Button disabled={occupe} className="gap-2 rounded-full" onClick={() => agir(() => onEnregistrer(j.id, "dossier"))}>
              <FolderDown className="h-4 w-4" /> Télécharger dans le dossier
            </Button>
            <Button disabled={occupe} variant="outline" className="gap-2 rounded-full" onClick={() => agir(() => onEnregistrer(j.id, "zip"))}>
              <Archive className="h-4 w-4" /> Télécharger en ZIP
            </Button>
            <SlideToConfirm
              text="Glisser pour rejeter"
              successText="Rejeté"
              width={230}
              height={44}
              className="border-destructive/30"
              onConfirm={() => agir(() => onRejeter(j.id))}
            />
            {/* Accès clavier / lecteur d'écran : même action, avec confirmation */}
            <button
              type="button"
              className="sr-only focus:not-sr-only focus:rounded-full focus:border focus:border-destructive focus:px-4 focus:py-2 focus:text-sm focus:text-destructive"
              data-action="rejeter"
              onClick={() => {
                if (confirm("Rejeter ce téléchargement ? Les fichiers seront effacés.")) agir(() => onRejeter(j.id));
              }}
            >
              Rejeter
            </button>
          </div>
        </div>
      )}

      {j.enregistre && (
        <p className="enregistre mt-4 text-sm text-succes">
          ✔ Enregistré dans{" "}
          <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
            {racine}
            {j.enregistre.chemin}
          </code>
        </p>
      )}

      {j.status === "en cours" && j.files.length === 0 && (
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {montrerVignettes && medias.length > 0 && (
        <div className="thumbs mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
          {medias.map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => setVue(i)}
              className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-muted ring-primary/0 transition hover:ring-2 hover:ring-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Voir ${f.split("/").pop()}`}
            >
              {estVideo(f) ? (
                <>
                  <video src={`${urls[i]}#t=0.5`} muted preload="metadata" className="h-full w-full object-cover" />
                  <Play className="absolute bottom-2 right-2 h-4 w-4 text-white drop-shadow" />
                </>
              ) : (
                <img src={urls[i]} loading="lazy" alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              )}
            </button>
          ))}
        </div>
      )}

      {j.log.length > 0 && (
        <details open={j.status === "échec"} className="mt-4 group">
          <summary className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ScrollText className="h-3.5 w-3.5" /> Journal
          </summary>
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {j.log.join("\n")}
          </pre>
        </details>
      )}

      <Lightbox urls={urls} index={vue} onChange={setVue} />
    </motion.article>
  );
}
