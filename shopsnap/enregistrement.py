"""Enregistrement dans la destination finale, seulement sur clic : en dossier ou en ZIP."""
import os
import shutil
import zipfile
from pathlib import Path

from .config import DATA


def dossier_commun(files):
    """Dossier qui regroupe les fichiers : liens/<compte>/<code> ou profils/<profil>."""
    return Path(os.path.commonpath([str(Path(f).parent) for f in files]))


def enregistrer_dossier(job, base, data=None):
    data = data or DATA
    for src in sorted(p for p in base.rglob('*') if p.is_file()):  # médias + légendes .txt
        dest = data / src.relative_to(base)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dest))  # remplace un fichier du même nom s'il existe
    return str(dossier_commun(job['files'])) + '/'


def enregistrer_zip(job, base, data=None):
    data = data or DATA
    commun = dossier_commun(job['files'])
    dest = data / commun.parent / f'{commun.name}.zip'
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Sans compression : photos et vidéos déjà compressées, qualité intacte.
    with zipfile.ZipFile(dest, 'w', zipfile.ZIP_STORED, allowZip64=True) as z:
        for src in sorted(p for p in (base / commun).rglob('*') if p.is_file()):
            z.write(src, arcname=str(Path(commun.name) / src.relative_to(base / commun)))
    return str(commun.parent / f'{commun.name}.zip')
