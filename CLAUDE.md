# ShopSnap (page web locale · Flask + instaloader + yt-dlp · Docker)

Récupère photos, vidéos, Reels et carrousels Instagram (et pubs Meta Ad Library) en qualité maximale pour constituer
la banque de visuels produits d'une boutique. Dépôt public `StackLLM/ShopSnap`.

## Commandes
- Lancer / mettre à jour : `docker compose up -d --build` → http://127.0.0.1:8765 · Arrêt : `docker compose down`
- Tests : `uv run --python 3.12 --no-project --with-requirements requirements-dev.txt python -m pytest -q`
- Journal : `docker logs shopsnap`
- Classer les abonnements : `python scripts/classer_abonnements.py <abonnements.json> <abonnements.xlsx>` (produit aussi `<…>_classes.json`, lu par la page). Ne contacte pas Instagram.

## Architecture
- `shopsnap/config.py` chemins (`DATA_DIR`=/data, `ATTENTE_DIR`=/attente, cookies), `PAUSE_ENTRE_PROFILS`=90 s.
- `shopsnap/commandes.py` construit les commandes : profil → instaloader seul ; post `/p/` → instaloader (photos) PUIS yt-dlp (vidéos, erreur « no video » tolérée) ; Reel / autre lien → yt-dlp seul.
- `shopsnap/taches.py` file d'attente, un téléchargement à la fois, statuts `en attente → en cours → prêt | échec`, puis `enregistré | rejeté`.
- `shopsnap/enregistrement.py` dossier (déplacement, légendes .txt incluses) ou ZIP (`ZIP_STORED`).
- `shopsnap/routes.py` Flask (`create_app`), `shopsnap/static/` page + `css/style.css` + `js/app.js` (sans framework).

## Règles (ne pas casser)
- **Jamais d'enregistrement automatique** : tout arrive dans `attente/<id>/` ; seule l'action de l'utilisateur (Télécharger dans le dossier / en ZIP) écrit dans la destination. « Rejeter » efface.
- **Qualité** : yt-dlp `-f bv*+ba/b -S res,br,fps --merge-output-format mp4` (pas de réencodage) ; instaloader sans `--no-iphone` (images HD). ffmpeg obligatoire dans l'image.
- **Rangement** : `profils/<profil>/`, `liens/<compte>/<code du post>/` (un dossier par lien, même une seule image). ZIP = `<dossier>.zip` à côté.
- **Versions figées** dans `requirements.txt` (instaloader 4.16, yt-dlp 2026.10.26) ; monter de version = retester un post photo, un Reel, un profil.
- **Aucune donnée personnelle dans le dépôt (public)** : `.env`, `donnees/`, `attente/`, `cookies/*` sont ignorés. Pas de chemin de machine, pas de nom de compte Instagram, pas de liste d'abonnements dans le code ou les docs.
- Interdit de supprimer ou modifier une fonctionnalité existante sans demande explicite.

## Contexte local
- Voir `CLAUDE.local.md` (non versionné : chemins et réglages de la machine).

## Pièges connus
- yt-dlp ne prend pas les photos Instagram (« No video formats found ») → c'est pour ça que `/p/` passe d'abord par instaloader.
- instaloader sans compte : vidéos parfois en 480p (yt-dlp donne 720p) → les vidéos des liens passent par yt-dlp.
- Profil yt-dlp (`instagram:user`) cassé en amont → profils uniquement via instaloader.
- Instagram : au-delà de quelques dizaines de requêtes sans compte → redirection connexion / 429. Garder un téléchargement à la fois et la pause entre profils.
- Un profil est retéléchargé en entier à chaque fois (pas de `--fast-update`, la zone d'attente est vidée après choix).
