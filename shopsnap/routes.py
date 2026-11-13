"""Application Flask : page web et API JSON."""
import os
import shutil
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory

from . import taches
from .config import ATTENTE, COOKIES, DATA
from .enregistrement import enregistrer_dossier, enregistrer_zip

STATIC = Path(__file__).parent / 'static'


def create_app():
    app = Flask(__name__, static_folder=str(STATIC), static_url_path='/static')

    @app.get('/')
    def index():
        return send_from_directory(STATIC, 'index.html')

    @app.post('/api/jobs')
    def create_jobs():
        body = request.get_json(force=True)
        kind = body.get('kind')
        if kind not in ('profil', 'lien'):
            abort(400)
        return jsonify([taches.ajouter(kind, e) for e in str(body.get('entries', '')).split()])

    @app.get('/api/jobs')
    def list_jobs():
        return jsonify(sorted(taches.jobs.values(), key=lambda j: j['created'], reverse=True)[:50])

    @app.post('/api/jobs/<jid>/enregistrer')
    def save_job(jid):
        job = taches.jobs.get(jid) or abort(404)
        if job['status'] != 'prêt':
            abort(409)
        mode = (request.get_json(silent=True) or {}).get('mode', 'dossier')
        base = ATTENTE / jid
        chemin = enregistrer_zip(job, base) if mode == 'zip' else enregistrer_dossier(job, base)
        shutil.rmtree(base, ignore_errors=True)
        job['status'] = 'enregistré'
        job['enregistre'] = {'mode': mode, 'chemin': chemin}
        return jsonify(job['enregistre'])

    @app.post('/api/jobs/<jid>/rejeter')
    def reject_job(jid):
        job = taches.jobs.get(jid) or abort(404)
        if job['status'] != 'prêt':
            abort(409)
        shutil.rmtree(ATTENTE / jid, ignore_errors=True)
        job['status'] = 'rejeté'
        return jsonify(ok=True)

    @app.get('/apercu/<jid>/<path:path>')
    def preview(jid, path):
        """Aperçu : depuis la zone d'attente, ou depuis la destination une fois enregistré en dossier."""
        if (ATTENTE / jid / path).exists():
            return send_from_directory(ATTENTE / jid, path)
        return send_from_directory(DATA, path)

    @app.get('/api/info')
    def info():
        # DESTINATION_LABEL : chemin lisible de la destination sur l'hôte (affiché dans la page)
        return jsonify({'cookies': COOKIES.exists(),
                        'destination': os.environ.get('DESTINATION_LABEL', '')})

    @app.get('/api/abonnements')
    def abonnements():
        """Abonnements classés (créés par scripts/classer_abonnements.py)."""
        f = DATA / 'abonnements_classes.json'
        if not f.exists():
            return jsonify({'categories': [], 'comptes': []})
        return send_from_directory(DATA, 'abonnements_classes.json', mimetype='application/json',
                                   max_age=0)

    return app
