from pathlib import Path

import pytest

from shopsnap.commandes import NO_VIDEO, build_steps, instaloader_target


@pytest.mark.parametrize('entree, cible', [
    ('https://www.instagram.com/demo_clothes/', 'demo_clothes'),
    ('https://www.instagram.com/demo_clothes/?igsh=abc', 'demo_clothes'),
    ('@demo_clothes', 'demo_clothes'),
    ('demo_clothes', 'demo_clothes'),
    ('https://www.instagram.com/p/AbCdEf12345/', '-AbCdEf12345'),
    ('https://www.instagram.com/reel/Chunk8-jurw/', '-Chunk8-jurw'),
    ('https://www.instagram.com/compte/reel/CWqAgUZgCku/', '-CWqAgUZgCku'),
])
def test_cible_instaloader(entree, cible):
    assert instaloader_target(entree) == cible


def test_nom_invalide():
    with pytest.raises(ValueError):
        instaloader_target('pas un nom !')


def test_profil_une_etape_instaloader(tmp_path):
    steps = build_steps('profil', 'https://www.instagram.com/demo_clothes/', tmp_path)
    assert len(steps) == 1
    cmd, cwd, tolerees = steps[0]
    assert cmd[0] == 'instaloader' and '--reels' in cmd and cmd[-1] == 'demo_clothes'
    assert '--no-iphone' not in cmd  # images en plus haute résolution
    assert cwd == tmp_path / 'profils'


def test_post_photos_puis_videos(tmp_path):
    steps = build_steps('lien', 'https://www.instagram.com/p/AbCdEf12345/', tmp_path)
    assert [s[0][0] for s in steps] == ['instaloader', 'yt-dlp']
    insta = steps[0][0]
    assert insta[insta.index('--dirname-pattern') + 1] == str(tmp_path / 'liens' / '{profile}' / '{shortcode}')
    assert steps[1][2] == NO_VIDEO  # « pas de vidéo » toléré pour un post photo


def test_reel_yt_dlp_seul_meilleure_qualite(tmp_path):
    steps = build_steps('lien', 'https://www.instagram.com/reel/Chunk8-jurw/', tmp_path)
    assert len(steps) == 1
    cmd = steps[0][0]
    assert cmd[0] == 'yt-dlp'
    assert cmd[cmd.index('-f') + 1] == 'bv*+ba/b'
    assert cmd[cmd.index('--merge-output-format') + 1] == 'mp4'
    assert '%(playlist_id,id)s/%(id)s.%(ext)s' in cmd[cmd.index('-o') + 1]


def test_lien_doit_etre_une_url(tmp_path):
    with pytest.raises(ValueError):
        build_steps('lien', 'pas-une-url', tmp_path)
