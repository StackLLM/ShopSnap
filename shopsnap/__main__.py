"""Lancement : python -m shopsnap"""
from . import taches
from .config import ATTENTE, DATA, PORT
from .routes import create_app

if __name__ == '__main__':
    DATA.mkdir(parents=True, exist_ok=True)
    ATTENTE.mkdir(parents=True, exist_ok=True)
    taches.demarrer()
    create_app().run(host='0.0.0.0', port=PORT, threaded=True)
