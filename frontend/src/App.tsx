import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { History, Link2, Moon, Sparkles, Sun, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { AuroraBackground } from "@/components/lightswind/aurora-background";
import { CountUp } from "@/components/lightswind/count-up";
import { ShinyText } from "@/components/lightswind/shiny-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/lightswind/tabs";
import { Toaster } from "@/components/lightswind/toaster";
import { TopLoader } from "@/components/lightswind/top-loader";
import { Badge } from "@/components/lightswind/badge";
import { Abonnements } from "@/components/app/Abonnements";
import { CaptureCard } from "@/components/app/CaptureCard";
import { JobCard } from "@/components/app/JobCard";
import { api, type Job, type Kind } from "@/api";
import { useAbonnements, useInfo, useJobs, useTheme } from "@/hooks/useShopSnap";
import { racineDe } from "@/lib/outils";

const ACTIF = new Set(["en attente", "en cours", "prêt", "échec"]);

export default function App() {
  const { jobs, rafraichir } = useJobs();
  const info = useInfo();
  const abos = useAbonnements();
  const { sombre, basculer } = useTheme();
  const [onglet, setOnglet] = useState("recuperer");
  const [profil, setProfil] = useState("");
  const [lien, setLien] = useState("");
  const racine = racineDe(info?.destination ?? "");

  const liste = jobs ?? [];
  const actifs = liste.filter((j) => ACTIF.has(j.status));
  const historique = liste.filter((j) => !ACTIF.has(j.status));
  const enCours = liste.some((j) => j.status === "en cours");
  const stats = useMemo(
    () => ({
      cours: liste.filter((j) => j.status === "en cours" || j.status === "en attente").length,
      prets: liste.filter((j) => j.status === "prêt").length,
      enregistres: liste.filter((j) => j.status === "enregistré").length,
      fichiers: liste.reduce((s, j) => s + (j.status === "rejeté" ? 0 : j.files.length), 0),
    }),
    [liste],
  );

  // Notification quand une récupération devient prête ou échoue
  const precedents = useRef<Record<string, Job["status"]>>({});
  useEffect(() => {
    if (!jobs) return;
    for (const j of jobs) {
      const avant = precedents.current[j.id];
      if (avant && avant !== j.status) {
        if (j.status === "prêt") toast.success("Prêt à valider", { description: `${j.files.length} fichiers · ${j.entry}` });
        if (j.status === "échec") toast.error("Échec de la récupération", { description: j.entry });
      }
      precedents.current[j.id] = j.status;
    }
  }, [jobs]);

  const lancer = async (kind: Kind, texte: string) => {
    try {
      const ids = await api.lancer(kind, texte);
      kind === "profil" ? setProfil("") : setLien("");
      toast(`${ids.length} récupération${ids.length > 1 ? "s" : ""} ajoutée${ids.length > 1 ? "s" : ""}`, {
        description: "Une à la fois, pour éviter les blocages.",
      });
      rafraichir();
    } catch {
      toast.error("Impossible de lancer la récupération");
    }
  };

  const enregistrer = async (id: string, mode: "dossier" | "zip") => {
    try {
      const r = await api.enregistrer(id, mode);
      toast.success(mode === "zip" ? "ZIP enregistré" : "Enregistré", { description: `${racine}${r.chemin}` });
    } catch {
      toast.error("Enregistrement impossible");
    }
    rafraichir();
  };

  const rejeter = async (id: string) => {
    try {
      await api.rejeter(id);
      toast("Récupération rejetée", { description: "Les fichiers ont été effacés." });
    } catch {
      toast.error("Rejet impossible");
    }
    rafraichir();
  };

  const nbAbos = abos?.comptes.length ?? 0;

  return (
    <div className="grain relative min-h-screen overflow-x-hidden">
      <TopLoader isLoading={enCours} color="#C9A96E" height={2} showSpinner={false} />
      <Toaster position="bottom-right" />

      {/* Fond aurore champagne, discret */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.35] dark:opacity-25" aria-hidden>
        <AuroraBackground className="h-screen w-screen bg-background dark:bg-background">{null}</AuroraBackground>
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{ background: "radial-gradient(1200px 600px at 50% -10%, hsl(var(--primary) / 0.10), transparent 60%)" }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* En-tête */}
        <header className="flex items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-primary/40 bg-gradient-to-b from-or-200/20 to-or-600/10 font-display text-xl text-primary">
              S
            </span>
            <div className="leading-tight">
              <p className="font-display text-xl tracking-wide">ShopSnap</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Banque de visuels</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden border-border text-muted-foreground sm:inline-flex" withDot dotColor={info?.cookies ? "#4ade80" : "#C9A96E"}>
              {info?.cookies ? "Compte connecté" : "Sans compte"}
            </Badge>
            <button
              type="button"
              onClick={basculer}
              aria-label={sombre ? "Passer en thème clair" : "Passer en thème sombre"}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background/40 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              {sombre ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Titre */}
        <section className="pb-10 pt-8 text-center sm:pt-14">
          <p className="surtitre">Instagram · Facebook · Qualité d'origine</p>
          <h1 className="titre-luxe mx-auto mt-5 max-w-3xl text-5xl leading-[1.02] sm:text-7xl">
            <ShinyText
              size="4xl"
              weight="normal"
              baseColor={sombre ? "#E9DFCC" : "#2A231B"}
              shineColor={sombre ? "#FFF6E2" : "#B08D4F"}
              speed={4}
              intensity={0.8}
              className="font-display !text-5xl sm:!text-7xl"
            >
              ShopSnap
            </ShinyText>
          </h1>
          <p className="sub mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Glisse un lien Instagram ou Facebook dans la bonne case. Qualité maximale, sans réencodage. Rien n'est enregistré sans ton
            accord.
          </p>
          <div className="filet-or mx-auto mt-10 max-w-md" />
        </section>

        {/* Compteurs */}
        <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Compteurs">
          {[
            { l: "En cours", v: stats.cours },
            { l: "À valider", v: stats.prets },
            { l: "Enregistrés", v: stats.enregistres },
            { l: "Fichiers", v: stats.fichiers },
          ].map((s) => (
            <div key={s.l} className="verre px-5 py-4">
              <p className="surtitre">{s.l}</p>
              <CountUp
                value={s.v}
                duration={1.2}
                triggerOnView={false}
                colorScheme="custom"
                customColor="hsl(var(--foreground))"
                className="mt-1"
                numberClassName="font-display text-4xl"
              />
            </div>
          ))}
        </section>

        <Tabs value={onglet} onValueChange={setOnglet} className="w-full">
          <TabsList className="mx-auto mb-8 flex h-11 w-fit rounded-full border border-border bg-background/50 p-1 backdrop-blur dark:bg-background/50">
            <TabsTrigger value="recuperer" className="gap-1.5 rounded-full px-3 text-[12px] sm:gap-2 sm:px-5 sm:text-sm">
              <Sparkles className="hidden h-4 w-4 sm:block" /> Récupérer
              {actifs.length > 0 && <span className="text-xs text-primary">{actifs.length}</span>}
            </TabsTrigger>
            {nbAbos > 0 && (
              <TabsTrigger value="abonnements" className="gap-1.5 rounded-full px-3 text-[12px] sm:gap-2 sm:px-5 sm:text-sm">
                <Users className="hidden h-4 w-4 sm:block" /> Abonnements
              </TabsTrigger>
            )}
            <TabsTrigger value="historique" className="gap-1.5 rounded-full px-3 text-[12px] sm:gap-2 sm:px-5 sm:text-sm">
              <History className="hidden h-4 w-4 sm:block" /> Historique
              {historique.length > 0 && <span className="text-xs text-muted-foreground">{historique.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recuperer">
            <div className="grid gap-5 md:grid-cols-2">
              <CaptureCard
                kind="profil"
                icone={UserRound}
                surtitre="instaloader · gallery-dl"
                titre="Profil entier"
                description={
                  <>
                    Instagram : photos, carrousels, vidéos et Reels (lien ou simple nom). Facebook : photos d'une page (lien de la page, ou{" "}
                    <code className="font-mono text-foreground/80">fb:nom</code>). Un par ligne.
                  </>
                }
                placeholder="https://www.instagram.com/nom_du_profil/"
                bouton="Télécharger le profil"
                value={profil}
                onChange={setProfil}
                onSubmit={(t) => lancer("profil", t)}
                sombre={sombre}
              />
              <CaptureCard
                kind="lien"
                icone={Link2}
                surtitre="yt-dlp · gallery-dl"
                titre="Un lien"
                description="Instagram ou Facebook : post, photo, album, vidéo, Reel, ou pub de la Meta Ad Library. Un lien par ligne."
                placeholder="https://www.instagram.com/reel/XXXXXXXX/"
                bouton="Télécharger le lien"
                value={lien}
                onChange={setLien}
                onSubmit={(t) => lancer("lien", t)}
                sombre={sombre}
              />
            </div>

            <p className="note mt-5 text-center text-xs text-muted-foreground" id="note">
              {info?.destination ? `Fichiers enregistrés dans ${info.destination}.` : "Fichiers enregistrés dans le dossier de destination."}
              {info ? (info.cookies ? " Compte connecté via cookies.txt." : " Mode sans compte.") : ""}
            </p>

            <div className="mt-12">
              <div className="mb-5 flex items-end justify-between">
                <h3 className="titre-luxe text-2xl">Téléchargements</h3>
                <span className="surtitre">en cours et à valider</span>
              </div>
              <div id="jobs" className="space-y-4">
                {jobs === null ? (
                  <div className="verre h-24 animate-pulse" />
                ) : actifs.length ? (
                  <AnimatePresence initial={false}>
                    {actifs.map((j) => (
                      <JobCard key={j.id} job={j} racine={racine} onEnregistrer={enregistrer} onRejeter={rejeter} />
                    ))}
                  </AnimatePresence>
                ) : (
                  <p className="empty verre px-6 py-10 text-center text-sm text-muted-foreground">
                    Aucun téléchargement pour l'instant. Colle un lien ci-dessus.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {nbAbos > 0 && abos && (
            <TabsContent value="abonnements">
              <Abonnements data={abos} profil={profil} setProfil={setProfil} versProfil={() => setOnglet("recuperer")} />
            </TabsContent>
          )}

          <TabsContent value="historique">
            <div className="space-y-4">
              {historique.length ? (
                <AnimatePresence initial={false}>
                  {historique.map((j) => (
                    <JobCard key={j.id} job={j} racine={racine} onEnregistrer={enregistrer} onRejeter={rejeter} />
                  ))}
                </AnimatePresence>
              ) : (
                <p className="verre px-6 py-10 text-center text-sm text-muted-foreground">
                  Rien encore : les récupérations enregistrées ou rejetées apparaîtront ici (jusqu'au redémarrage de l'app).
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
