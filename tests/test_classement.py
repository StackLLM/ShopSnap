import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from classer_abonnements import classer  # noqa: E402


@pytest.mark.parametrize('username, nom, categorie', [
    ('demo_clothes', '', 'Vêtements'),
    ('demosneakers', 'DEMO SNEAKERS', 'Chaussures'),
    ('nikedemo', 'Nike Demo', 'Vêtements et chaussures'),
    ('vintage.sneakers.demo', '', 'Vêtements et chaussures'),
    ('demostore', 'Demo Store', 'Commerce à vérifier'),
    ('championsleague', 'UEFA Champions League', 'Autre'),       # pas la marque Champion
    ('vindiesel', 'Vin Diesel', 'Autre'),                        # pas la marque Diesel
    ('demo_original_fragrance', 'DEMO ORIGINAL', 'Autre'),  # parfum, pas vêtement
    ('ami_de_lycee', 'Yasmine', 'Autre'),
])
def test_classement(username, nom, categorie):
    assert classer(username, nom)[0] == categorie
