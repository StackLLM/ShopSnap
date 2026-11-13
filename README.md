# ShopSnap

**Récupère les photos, vidéos, Reels et carrousels d'Instagram et de Facebook en qualité maximale, depuis une page web locale.**
Pensé pour les e-commerçants : constituer la banque de visuels produits d'une boutique à partir des pages suivies.

- **Instagram** : un **profil entier** (photos, carrousels, vidéos, Reels) ou **un seul lien** (post, Reel).
- **Facebook** : les **photos d'une page**, un **album**, une **vidéo** ou un **Reel**, une **pub de la Meta Ad Library**.
- **Qualité d'origine** : meilleure version disponible, aucun réencodage (assemblage vidéo + son par simple copie).
- **Tu décides** : chaque récupération attend en zone d'attente, avec aperçu. Rien n'est enregistré avant ton clic
  (**dossier** ou **ZIP**), ou tu **rejettes**.
- **Rangement automatique** : `profils/<profil>/` et `liens/<compte>/<code du post>/` (Instagram), `facebook/…` (Facebook),
  un dossier par lien même pour une seule image.
- **Liste d'abonnements à cocher** : classée Vêtements / Chaussures / Commerce… ; cocher une page remplit le champ Profil.
- **Anti-blocage** : un téléchargement à la fois, 90 s entre deux profils.
- **Interface premium** : thème noir et champagne (ou clair ivoire), composants animés [Lightswind](https://lightswind.com),
  visionneuse plein écran, notifications, compteurs, onglets Récupérer / Abonnements / Historique, mobile.

Basé sur trois projets open source : [instaloader](https://github.com/instaloader/instaloader) (Instagram : profils, photos),
[yt-dlp](https://github.com/yt-dlp/yt-dlp) (vidéos, Reels, pubs) et [gallery-dl](https://github.com/mikf/gallery-dl) (Facebook : photos, albums).

---

## Démarrage rapide

Prérequis : Docker (Docker Desktop sur Mac / Windows).

```bash
git clone https://github.com/StackLLM/ShopSnap.git
cd ShopSnap
cp .env.example .env          # puis adapter la destination si besoin
docker compose up -d --build
```

Ouvrir **http://127.0.0.1:8765**. Arrêt : `docker compose down`.

## Configuration (`.env`)

| Variable | Rôle | Défaut |
|---|---|---|
| `SHOPSNAP_DESTINATION` | Dossier de ta machine où les médias sont enregistrés | `./donnees` |
| `DESTINATION_LABEL` | Chemin affiché dans la page | vide |
| `SHOPSNAP_PORT` | Port de la page web (seulement sur `127.0.0.1`) | `8765` |

**Connexion à un compte (optionnel)** : sans compte, Instagram limite vite les requêtes et donne certaines vidéos en
qualité réduite. Pour utiliser un compte (**secondaire**, jamais celui de la boutique), exporter ses cookies au format
`cookies.txt` (extension de navigateur « Get cookies.txt ») et poser le fichier dans `cookies/cookies.txt`.
Les deux outils l'utilisent alors automatiquement.

## Utilisation

1. **Profil entier** (un par ligne) :
   - Instagram : lien du profil ou simple nom, ou cocher des pages dans « Mes abonnements » ;
   - Facebook : lien de la page (`facebook.com/<page>`) ou `fb:<page>` → toutes les photos de la page.
2. **Un lien** : coller ou glisser un lien.
   - Instagram : post (instaloader prend les photos, yt-dlp les vidéos éventuelles) ou Reel.
   - Facebook : album (`facebook.com/media/set/?set=…`), vidéo, Reel, `fb.watch`, pub Meta Ad Library.
3. Quand le statut passe à **prêt**, vérifier l'aperçu (clic sur une vignette : visionneuse, flèches, Échap) puis :
   - **Télécharger dans le dossier** → `destination/liens/<compte>/<code>/` ou `destination/profils/<profil>/`
     (Facebook : `destination/facebook/profils/<page>/`, `facebook/liens/<page>/<id>/`, `facebook/pubs/<id>/`)
   - **Télécharger en ZIP** → `destination/liens/<compte>/<code>.zip` (sans compression : qualité intacte)
   - **Glisser pour rejeter** → efface la récupération (au clavier : bouton « Rejeter » avec confirmation)

Raccourcis : glisser un lien sur un champ lance la récupération ; **⌘/Ctrl + Entrée** envoie le champ.
Les récupérations enregistrées ou rejetées passent dans l'onglet **Historique** (jusqu'au redémarrage).

### Liste « Mes abonnements »

La page lit `destination/abonnements_classes.json`. Pour le créer à partir d'une liste brute
(`[[nom_utilisateur, nom_affiché, vérifié], …]`) :

```bash
python scripts/classer_abonnements.py abonnements.json abonnements.xlsx
```

Le script ne contacte pas Instagram : il classe d'après les noms et produit un Excel (onglets par catégorie, liens,
colonne « Ta décision ») et le JSON lu par la page. Les mots-clés se modifient en haut du script.

## Architecture

```
ShopSnap/
├── shopsnap/                  Application (paquet Python)
│   ├── __main__.py            Lancement : python -m shopsnap
│   ├── config.py              Chemins, extensions, pause anti-blocage
│   ├── commandes.py           Commandes instaloader / yt-dlp / gallery-dl (qualité, rangement)
│   ├── taches.py              File d'attente et exécution (zone d'attente)
│   ├── enregistrement.py      Enregistrement en dossier ou en ZIP
│   ├── routes.py              Page web et API JSON (Flask)
│   └── static/                Interface construite (générée, non versionnée)
├── frontend/                  Interface React + Vite + Tailwind + Lightswind
│   ├── src/App.tsx            Page : en-tête, compteurs, onglets
│   ├── src/components/app/    Cartes de saisie, carte de récupération, visionneuse, abonnements
│   ├── src/components/lightswind/  Composants Lightswind (copiés depuis le registre, MIT)
│   └── src/test/              Tests Vitest
├── scripts/
│   ├── classer_abonnements.py Classement des abonnements → Excel + JSON
│   └── recepteur.py           Récepteur local ponctuel (transfert d'une liste depuis le navigateur)
├── tests/                     Tests pytest (commandes, enregistrement, classement)
├── Dockerfile · compose.yml   Construction de l'interface (Node 22) puis image Python 3.12 + ffmpeg
├── requirements.txt           flask, instaloader, yt-dlp, gallery-dl (versions figées)
└── .env.example               Réglages locaux à copier en .env
```

### API

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/api/jobs` | `{kind: "profil" \| "lien", entries: "…"}` → ajoute des récupérations |
| `GET` | `/api/jobs` | État des récupérations (50 dernières) |
| `POST` | `/api/jobs/<id>/enregistrer` | `{mode: "dossier" \| "zip"}` → enregistre dans la destination |
| `POST` | `/api/jobs/<id>/rejeter` | Efface la récupération en attente |
| `GET` | `/apercu/<id>/<chemin>` | Aperçu d'un média |
| `GET` | `/api/abonnements` | Abonnements classés |
| `GET` | `/api/info` | Cookies présents, destination affichée |

## Développement

```bash
uv run --python 3.12 --no-project --with-requirements requirements-dev.txt python -m pytest -q   # API
cd frontend && npm ci && npm test                                                              # interface
```

Interface en direct : `cd frontend && npm run dev` → http://127.0.0.1:5180 (l'API de Docker sur 8765 est relayée).
Après une modification : `docker compose up -d --build`.

## Limites à connaître

- Aucun outil ne dépasse la qualité stockée par Instagram (≈ 1080 px pour les photos, 720p à 1080p pour les vidéos).
- yt-dlp ne télécharge pas les photos d'Instagram ; instaloader sans compte donne certaines vidéos en qualité réduite.
- Instagram limite les requêtes : au-delà, blocage temporaire (« Réessayez plus tard »). Aller doucement.
- Un profil est retéléchargé en entier à chaque fois (rien ne reste sur place avant l'enregistrement).
- Facebook : une **photo seule** n'est pas prise en charge (gallery-dl 1.32.19 renvoie une erreur ou tout l'album) :
  utiliser le lien de l'album ou la page. Les photos d'une page sont lues une par une (pause 1,5–3 s) : c'est long.
- Facebook : les pubs Meta Ad Library dépendent de l'outil amont et peuvent échouer (pub expirée, protection du site).
- Beaucoup de contenus Facebook demandent un compte connecté (`cookies/cookies.txt`).

## Usage responsable

ShopSnap automatise l'accès à Instagram et Facebook, ce que les conditions d'utilisation de Meta n'autorisent pas.
Les contenus récupérés restent la propriété de leurs auteurs : ne les publier qu'avec leur accord
(vos propres comptes, vos fournisseurs). L'utilisateur est seul responsable de l'usage qu'il en fait.

## Licences

Le code de ShopSnap est fourni tel quel par StackLLM. Dépendances : instaloader (MIT), yt-dlp (Unlicense),
gallery-dl (GPL-2.0, appelé comme programme séparé), Flask (BSD-3-Clause), FFmpeg (LGPL/GPL, installé dans l'image Docker),
Lightswind UI (MIT), React (MIT), Tailwind CSS (MIT), framer-motion (MIT), lucide (ISC), polices Inter et Cormorant Garamond (OFL).
