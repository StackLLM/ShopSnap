import { useState, type DragEvent } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { InteractiveGradient } from "@/components/lightswind/interactive-gradient-card";
import { Button } from "@/components/lightswind/button";
import { cn } from "@/components/lib/utils";
import type { Kind } from "@/api";

interface Props {
  kind: Kind;
  icone: LucideIcon;
  surtitre: string;
  titre: string;
  description: React.ReactNode;
  placeholder: string;
  bouton: string;
  value: string;
  onChange: (v: string) => void;
  /** Envoie le contenu du champ (le champ est vidé ensuite par le parent). */
  onSubmit: (texte: string) => void;
  sombre: boolean;
}

/** Carte de saisie : champ multi-lignes, glisser-déposer d'un lien (envoi immédiat), Ctrl/⌘ + Entrée. */
export function CaptureCard(p: Props) {
  const [survol, setSurvol] = useState(false);
  const Icone = p.icone;

  const envoyer = (texte = p.value) => {
    if (texte.trim()) p.onSubmit(texte);
  };

  const deposer = (e: DragEvent) => {
    e.preventDefault();
    setSurvol(false);
    const t = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (t) envoyer((p.value.trim() + "\n" + t.trim()).trim());
  };

  return (
    <InteractiveGradient
      color={p.sombre ? "#C9A96E" : "#C9D2E8"}
      glowColor={p.sombre ? "rgba(201,169,110,0.16)" : "rgba(196,184,232,0.28)"}
      backgroundColor={p.sombre ? "#100E0B" : "#FFFFFF"}
      borderRadius="1.25rem"
      intensity={70}
      className="block h-full text-left"
    >
      <form
        data-kind={p.kind}
        className="relative flex h-full flex-col gap-4 p-6 sm:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          envoyer();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="surtitre">{p.surtitre}</p>
            <h2 className="titre-luxe mt-2 text-3xl text-foreground">{p.titre}</h2>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full nacre border border-border text-primary shadow-sm dark:border-primary/30 dark:bg-none dark:bg-primary/10">
            <Icone className="h-5 w-5" strokeWidth={1.5} />
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>

        <div
          className={cn(
            "rounded-xl border border-dashed border-border bg-background/40 transition-colors",
            survol && "border-primary/70 bg-primary/10",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={deposer}
        >
          <textarea
            aria-label={p.titre}
            value={p.value}
            onChange={(e) => p.onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                envoyer();
              }
            }}
            placeholder={p.placeholder}
            className="min-h-[124px] w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Glisser un lien ici · ⌘/Ctrl + Entrée</span>
          <Button type="submit" className="group gap-2 rounded-full px-6 font-medium">
            {p.bouton}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </form>
    </InteractiveGradient>
  );
}
