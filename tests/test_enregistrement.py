import zipfile

from shopsnap.enregistrement import dossier_commun, enregistrer_dossier, enregistrer_zip


def preparer(base):
    fichiers = ['liens/compte/CODE/CODE_1.jpg', 'liens/compte/CODE/CODE_2.jpg']
    for f in fichiers:
        (base / f).parent.mkdir(parents=True, exist_ok=True)
        (base / f).write_bytes(b'image')
    (base / 'liens/compte/CODE/CODE.txt').write_text('légende')
    return {'files': fichiers}


def test_dossier_commun():
    assert str(dossier_commun(['profils/x/a.jpg', 'profils/x/b.mp4'])) == 'profils/x'


def test_enregistrer_en_dossier(tmp_path):
    base, data = tmp_path / 'attente', tmp_path / 'data'
    job = preparer(base)
    chemin = enregistrer_dossier(job, base, data)
    assert chemin == 'liens/compte/CODE/'
    assert sorted(p.name for p in (data / 'liens/compte/CODE').iterdir()) == \
        ['CODE.txt', 'CODE_1.jpg', 'CODE_2.jpg']  # la légende suit les médias
    assert not any(p.is_file() for p in base.rglob('*'))  # déplacés, pas copiés


def test_enregistrer_en_zip(tmp_path):
    base, data = tmp_path / 'attente', tmp_path / 'data'
    job = preparer(base)
    chemin = enregistrer_zip(job, base, data)
    assert chemin == 'liens/compte/CODE.zip'
    with zipfile.ZipFile(data / chemin) as z:
        assert sorted(z.namelist()) == ['CODE/CODE.txt', 'CODE/CODE_1.jpg', 'CODE/CODE_2.jpg']
        assert all(i.compress_type == zipfile.ZIP_STORED for i in z.infolist())  # sans compression
