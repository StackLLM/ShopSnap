"""File d'attente des téléchargements : un seul à la fois, pause entre deux profils (anti-blocage).
Chaque téléchargement arrive dans ATTENTE/<id>/ et y reste jusqu'au choix de l'utilisateur."""
import shutil
import subprocess
import threading
import time
import uuid
from collections import deque

from .commandes import build_steps
from .config import ATTENTE, MEDIA_EXT, PAUSE_ENTRE_PROFILS

jobs = {}
queue = deque()
lock = threading.Lock()
wake = threading.Event()


def medias(folder):
    return sorted(p for p in folder.rglob('*') if p.is_file() and p.suffix.lower() in MEDIA_EXT) \
        if folder.exists() else []


def ajouter(kind, entry):
    jid = uuid.uuid4().hex[:8]
    jobs[jid] = {'id': jid, 'kind': kind, 'entry': entry, 'status': 'en attente',
                 'log': [], 'files': [], 'created': time.time(), 'enregistre': None}
    with lock:
        queue.append(jid)
        wake.set()
    return jid


def run(job):
    job['status'] = 'en cours'
    base = ATTENTE / job['id']
    try:
        real_error = False
        for cmd, cwd, tolerated in build_steps(job['kind'], job['entry'], base):
            proc = subprocess.Popen(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, bufsize=1)
            for line in proc.stdout:
                line = line.rstrip().replace(str(base) + '/', '')
                if any(t in line for t in tolerated):
                    line = 'Pas de vidéo dans ce post (photos seulement) : normal.'
                if line and not line.startswith('[download]') or '100%' in line or 'Destination' in line:
                    job['log'].append(line[-400:])
                    del job['log'][:-200]
            proc.wait()
            if proc.returncode != 0 and not (tolerated and job['log'] and
                                             job['log'][-1].startswith('Pas de vidéo')):
                real_error = True
            job['files'] = [str(p.relative_to(base)) for p in medias(base)]
        if not job['files']:
            job['status'] = 'échec'
            shutil.rmtree(base, ignore_errors=True)
        else:
            job['status'] = 'prêt'  # téléchargé, en attente du choix de l'utilisateur
            if real_error:
                job['log'].append('Certaines parties ont échoué : vérifie avant d\'enregistrer.')
    except Exception as e:  # noqa: BLE001
        job['log'].append(f'Erreur : {e}')
        job['status'] = 'échec'
        shutil.rmtree(base, ignore_errors=True)  # ne pas laisser de dossier vide en zone d'attente
    job['ended'] = time.time()


def worker():
    dernier_profil = 0.0
    while True:
        wake.wait()
        with lock:
            job = jobs.get(queue.popleft()) if queue else None
            if not queue:
                wake.clear()
        if job:
            if job['kind'] == 'profil':
                attente = dernier_profil + PAUSE_ENTRE_PROFILS - time.time()
                if attente > 0:
                    job['log'].append(f'Pause de {int(attente)} s avant ce profil (anti-blocage).')
                    time.sleep(attente)
            run(job)
            if job['kind'] == 'profil':
                dernier_profil = time.time()


def demarrer():
    threading.Thread(target=worker, daemon=True).start()
