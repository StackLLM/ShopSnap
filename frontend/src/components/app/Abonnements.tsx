import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Search } from "lucide-react";
import { Badge } from "@/components/lightswind/badge";
import { Button } from "@/components/lightswind/button";
import { Checkbox } from "@/components/lightswind/checkbox";
import { ScrollArea } from "@/components/lightswind/scroll-area";
import { cn } from "@/components/lib/utils";
import type { Abonnements as Donnees } from "@/api";
import { basculer, coches } from "@/lib/outils";

interface Props {
  data: Donnees;
  /** Contenu du champ « Profil entier » : les pages cochées y sont écrites en liens. */
  profil: string;
  setProfil: (v: string) => void;
  versProfil: () => void;
}

/** Mes abonnements : cocher une page met son lien dans « Profil entier ». */
export function Abonnements({ data, profil, setProfil, versProfil }: Props) {
  const [filtre, setFiltre] = useState("Vêtements et chaussures");
  const [recherche, setRecherche] = useState("");
  const sel = coches(profil);
  const n = sel.size;

  const categories = ["Tous", ...data.categories];
  const compte = (c: string) => (c === "Tous" ? data.comptes.length : data.comptes.filter((a) => a.categorie === c).length);

  const liste = useMemo(() => {
    const q = recherche.toLowerCase();
    return data.comptes.filter(
      (a) =>
        (filtre === "Tous" || a.categorie === filtre) &&
        (!q || a.username.toLowerCase().includes(q) || a.nom.toLowerCase().includes(q)),
    );
  }, [data.comptes, filtre, recherche]);

  return (
    <section id="abos" className="abos verre p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="surtitre">Instagram · pages suivies</p>
          <h2 className="titre-luxe mt-2 text-3xl">Mes abonnements</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Coche les pages : leur lien entre tout seul dans « Profil entier ». Puis clique sur « Télécharger le profil ».
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" size="lg" className="compteur border-primary/40 text-primary" id="abos-compteur">
            {n} {n > 1 ? "cochés" : "coché"}
          </Badge>
          <Button size="sm" className="gap-1.5 rounded-full" disabled={!n} onClick={versProfil}>
            Aller au champ Profil <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="onglets mt-6 flex flex-wrap gap-2" id="abos-onglets">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            data-cat={c}
            aria-pressed={c === filtre}
            onClick={() => setFiltre(c)}
            className={cn(
              "onglet rounded-full border px-3.5 py-1.5 text-[13px] transition",
              c === filtre
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {c} <span className="opacity-70">({compte(c)})</span>
          </button>
        ))}
      </div>

      <div className="abos-outils mt-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="abos-recherche"
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value.trim())}
            placeholder="Rechercher un nom…"
            className="h-10 w-full rounded-full border border-border bg-background/50 pl-10 pr-4 text-sm outline-none transition focus:border-primary/60"
          />
        </label>
        <Button
          id="abos-tout"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setProfil(basculer(profil, liste.map((a) => a.username), true))}
        >
          Cocher la liste affichée
        </Button>
        <Button id="abos-rien" variant="ghost" size="sm" className="rounded-full" onClick={() => setProfil("")}>
          Tout décocher
        </Button>
      </div>

      <p className="avert mb-3 mt-3 text-xs text-muted-foreground">
        Chaque profil coché est un téléchargement complet. L'app laisse 90 s entre deux profils pour éviter un blocage : commence par
        quelques pages à la fois.
      </p>

      <ScrollArea maxHeight={480} className="abos-liste rounded-xl border border-border bg-background/30" id="abos-liste">
        {liste.length ? (
          <ul>
            {liste.map((a) => {
              const coche = sel.has(a.username);
              return (
                <li key={a.username}>
                  <label
                    className={cn(
                      "abo grid cursor-pointer grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-border/60 px-4 py-2.5 transition last:border-b-0",
                      coche ? "bg-primary/[0.07]" : "hover:bg-accent/60",
                    )}
                  >
                    <Checkbox
                      checked={coche}
                      data-u={a.username}
                      onCheckedChange={(oui) => setProfil(basculer(profil, [a.username], oui))}
                      aria-label={`Cocher @${a.username}`}
                    />
                    <span className="abo-nom min-w-0">
                      <a
                        href={a.lien}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                      >
                        @{a.username}
                        {a.verifie && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                      </a>
                      <small className="block truncate text-xs text-muted-foreground">
                        {a.nom || "—"}
                        {a.mot ? ` · « ${a.mot} »` : ""}
                      </small>
                    </span>
                    <span className="abo-cat text-right text-[11px] text-muted-foreground">{a.categorie}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty p-4 text-sm text-muted-foreground">Aucune page.</p>
        )}
      </ScrollArea>
    </section>
  );
}
