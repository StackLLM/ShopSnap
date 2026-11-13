# ShopSnap (page web locale · Flask + React/Lightswind · instaloader + yt-dlp + gallery-dl · Docker)

Récupère photos, vidéos, Reels et carrousels Instagram et Facebook (et pubs Meta Ad Library) en qualité maximale pour constituer
la banque de visuels produits d'une boutique. Dépôt public `StackLLM/ShopSnap`.

## Commandes
- Lancer / mettre à jour : `docker compose up -d --build` → http://127.0.0.1:8765 · Arrêt : `docker compose down`
- Tests API : `uv run --python 3.12 --no-project --with-requirements requirements-dev.txt python -m pytest -q`
- Interface : `cd frontend && npm test` (Vitest) · types `npm run lint` · direct `npm run dev` (5180, proxy vers 8765) · build `npm run build` → `shopsnap/static/` (généré, non versionné ; Docker le refait)
- Journal : `docker logs shopsnap`
- Classer les abonnements : `python scripts/classer_abonnements.py <abonnements.json> <abonnements.xlsx>` (produit aussi `<…>_classes.json`, lu par la page). Ne contacte pas Instagram.

## Architecture
- `shopsnap/config.py` chemins (`DATA_DIR`=/data, `ATTENTE_DIR`=/attente, cookies), `PAUSE_ENTRE_PROFILS`=90 s.
- `shopsnap/commandes.py` construit les commandes : profil → instaloader seul ; post `/p/` → instaloader (photos) PUIS yt-dlp (vidéos, erreur « no video » tolérée) ; Reel / autre lien → yt-dlp seul. Facebook (`est_facebook` ou préfixe `fb:` en profil) → `build_steps_facebook` : page → gallery-dl `/<page>/photos` ; album `/media/set/` → gallery-dl ; Ad Library → yt-dlp SANS `--impersonate` (sinon 403) ; vidéo / Reel / fb.watch / post → yt-dlp ; photo seule → ValueError (message clair).
- `shopsnap/taches.py` file d'attente, un téléchargement à la fois, statuts `en attente → en cours → prêt | échec`, puis `enregistré | rejeté`.
- `shopsnap/enregistrement.py` dossier (déplacement, légendes .txt incluses) ou ZIP (`ZIP_STORED`).
- `shopsnap/routes.py` Flask (`create_app`), sert `shopsnap/static/index.html` et `/static/assets/*` construits par Vite.
- `frontend/` React 18 + Vite 6 + TS + Tailwind 3 + composants **Lightswind**. `src/App.tsx` (en-tête, compteurs, onglets Récupérer / Abonnements / Historique, notifications sonner), `components/app/` (CaptureCard, JobCard, Lightbox, Abonnements), `lib/outils.ts` (logique reprise de l'ancienne page), `hooks/useShopSnap.ts` (actualisation toutes les 2 s, thème).

## Règles (ne pas casser)
- **Jamais d'enregistrement automatique** : tout arrive dans `attente/<id>/` ; seule l'action de l'utilisateur (Télécharger dans le dossier / en ZIP) écrit dans la destination. « Rejeter » efface.
- **Qualité** : yt-dlp `-f bv*+ba/b -S res,br,fps --merge-output-format mp4` (pas de réencodage) ; instaloader sans `--no-iphone` (images HD). ffmpeg obligatoire dans l'image.
- **Rangement** : `profils/<profil>/`, `liens/<compte>/<code du post>/` (Instagram, inchangé) ; `facebook/profils/<page>/`, `facebook/liens/<page>/<id>/`, `facebook/pubs/<id>/`. Un dossier par lien, même une seule image. ZIP = `<dossier>.zip` à côté.
- **Versions figées** dans `requirements.txt` (instaloader 4.16, yt-dlp 2026.10.26, gallery-dl 1.32.19) ; monter de version = retester un post photo, un Reel, un profil, une page et un album Facebook, une vidéo Facebook.
- **Aucune donnée personnelle dans le dépôt (public)** : `.env`, `donnees/`, `attente/`, `cookies/*` sont ignorés. Pas de chemin de machine, pas de nom de compte Instagram, pas de liste d'abonnements dans le code ou les docs.
- Interdit de supprimer ou modifier une fonctionnalité existante sans demande explicite.
- **Interface** : charte noir chaud / ivoire / champagne (`frontend/src/index.css`, variables HSL au format Lightswind : background, primary, muted…). Pas de couleur en dur hors palette `or-*`. Titres en Cormorant Garamond (`font-display`), texte en Inter. Polices embarquées (fontsource) : l'app reste 100 % locale.
- **Lightswind** : composants copiés depuis le registre (`https://lightswind.com/api/registry`) dans `src/components/lightswind/`, retouches locales signalées en tête de fichier (aurora en or, onglets en primary, type de toast). Plugin Tailwind `lightswind/plugin` (3.2.5, `effect3d: false`) obligatoire pour les classes `btn-3d-*` / `badge-3d-*`. Ne pas lancer `npx lightswind add` (réécrit la config Tailwind) : reprendre le code depuis le registre.
- Pairs imposés par lightswind : `lucide-react` 0.400.0, `tailwind-merge` ^2.6.1. Les icônes de marque (Instagram, Facebook) sont marquées obsolètes par lucide mais présentes en 0.400.0.
- Classes et attributs gardés pour les tests navigateur : `.job[data-id]`, `.st`, `.tag`, `.entry`, `.aide-ligne`, `.enregistre`, `.actions`, `.thumbs`, `#note`, `#jobs`, `#abos`, `#abos-compteur`, `#abos-recherche`, `#abos-tout`, `#abos-rien`, `.onglet[data-cat]`, `input[data-u]`, `form[data-kind]`.

## Contexte local
- Voir `CLAUDE.local.md` (non versionné : chemins et réglages de la machine).

## Pièges connus
- yt-dlp ne prend pas les photos Instagram (« No video formats found ») → c'est pour ça que `/p/` passe d'abord par instaloader.
- instaloader sans compte : vidéos parfois en 480p (yt-dlp donne 720p) → les vidéos des liens passent par yt-dlp.
- Profil yt-dlp (`instagram:user`) cassé en amont → profils uniquement via instaloader.
- Instagram : au-delà de quelques dizaines de requêtes sans compte → redirection connexion / 429. Garder un téléchargement à la fois et la pause entre profils.
- Un profil est retéléchargé en entier à chaque fois (pas de `--fast-update`, la zone d'attente est vidée après choix).
- gallery-dl 1.32.19 : photo Facebook seule cassée (`/photo/?fbid=` → 404 sur `media/set/?set=` ; `/<page>/photos/<set>/<id>/` → tout l'album). D'où le refus explicite.
- gallery-dl lit les photos d'une page une par une (`--sleep-request 1.5-3`) : une grosse page prend du temps.
- Un nom seul dans « Profil entier » = Instagram ; pour Facebook, lien de la page ou `fb:<page>`.
- `InteractiveGradient` (Lightswind) centre son contenu par défaut : passer `className="block text-left"`. Sa couleur de fond suit `sombre` (prop), pas la classe `dark`.
- « Glisser pour rejeter » (SlideToConfirm) n'est pas accessible au clavier : un bouton `Rejeter` `sr-only` (visible au focus) fait la même action avec confirmation.
- Captures d'écran du navigateur intégré prises en pleine animation (aurore, onglets) : vérifier par le DOM et les styles calculés.
