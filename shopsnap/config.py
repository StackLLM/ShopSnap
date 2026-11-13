"""Réglages de ShopSnap (chemins dans le conteneur, extensions, pauses anti-blocage)."""
import os
from pathlib import Path

# Destination finale des médias enregistrés (montée depuis l'hôte, voir compose.yml)
DATA = Path(os.environ.get('DATA_DIR', '/data'))
# Zone d'attente : téléchargements pas encore enregistrés (hors DATA)
ATTENTE = Path(os.environ.get('ATTENTE_DIR', '/attente'))
# Optionnel : cookies.txt d'un compte secondaire (connexion pour instaloader et yt-dlp)
COOKIES = Path(os.environ.get('COOKIES_FILE', '/cookies/cookies.txt'))
SESSION = Path('/tmp/instaloader-session')

MEDIA_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm', '.m4a'}

# Secondes entre deux téléchargements de profil : plusieurs profils d'affilée = risque de blocage
PAUSE_ENTRE_PROFILS = 90

PORT = int(os.environ.get('PORT', '8080'))
