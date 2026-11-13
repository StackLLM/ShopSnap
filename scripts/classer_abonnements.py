"""Classe les abonnements Instagram (vêtements / chaussures) à partir du nom seulement,
puis crée un fichier Excel. Aucune requête vers Instagram : lit le JSON déjà récupéré.

Usage : python classer_abonnements.py abonnements.json abonnements.xlsx
Pour ajouter des mots : compléter les listes ci-dessous et relancer.
"""
import json
import re
import sys
import unicodedata

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

# ---------- Mots-clés (modifiables) ----------
CHAUSSURES = [
    'shoes', 'shoe', 'sneaker', 'sneakers', 'chaussure', 'chaussures', 'kicks', 'footwear',
    'sandal', 'sandale', 'sandales', 'boots', 'botte', 'bottes', 'basket', 'baskets', 'talon',
    'talons', 'heels', 'sabot', 'babouche', 'babouches', 'mocassin', 'slides', 'jordan', 'yeezy',
    'airmax', 'airforce', 'af1', 'dunk', 'snkrs', 'snkr', 'sneakerhead', 'pointure', 'sneak',
    'kickz', 'espadrille', 'espadrilles',
]
# Mots sûrs : la page parle clairement de vêtements
VETEMENTS = [
    'clothing', 'clothes', 'cloothes', 'wear', 'apparel', 'outfit', 'outfits', 'fashion',
    'dressing', 'couture', 'tailor', 'textile', 'vetement', 'vetements', 'hijab', 'abaya',
    'abayas', 'jellaba', 'djellaba', 'jalaba', 'kaftan', 'caftan', 'takchita', 'jabador',
    'jabadour', 'gandoura', 'tshirt', 'tee', 'tees', 'hoodie', 'hoodies', 'jeans', 'denim',
    'streetwear', 'thrift', 'thrifting', 'thriftiing', 'friperie', 'fripe', 'fripes',
    'pretaporter', 'sweat', 'polo', 'jogging', 'survetement', 'robe', 'robes', 'dress',
    'dresses', 'veste', 'jacket', 'pantalon', 'chemise', 'shirt', 'shirts', 'lingerie', 'pyjama',
    'jersey', 'maillot', 'maillots', 'tenue', 'casquette', 'casquettes', 'suit', 'costume',
]
# Mots faibles : souvent des vêtements, mais aussi parfums, montres, motos…
VETEMENTS_FAIBLES = [
    'mode', 'style', 'styles', 'look', 'looks', 'collection', 'collections', 'luxe', 'luxury',
    'vintage', 'original', 'originale', 'originals', 'drip', 'merch', 'ensemble', 'men', 'homme',
    'femme', 'kids', 'replica',
]
# Si l'un de ces mots est présent, un mot faible ne suffit pas
HORS_SUJET = [
    'parfum', 'parfums', 'parfumerie', 'fragrance', 'fragrances', 'perfume', 'testeur', 'moto',
    'motos', 'biker', 'bikers', 'phone', 'phones', 'electro', 'tech', 'barber', 'coffee',
    'beauty', 'cosmetic', 'cosmetique', 'montre', 'montres', 'watch', 'watches', 'horlogerie',
    'entertainment', 'lifestyle', 'scent', 'football', 'league', 'club', 'news', 'cars', 'car',
    'immobilier', 'restaurant', 'lounge', 'fitness', 'gym', 'nutrition', 'millionaire',
]
# Marques qui font vêtements ET chaussures (mot entier, ou début du nom d'utilisateur)
MARQUES_MIXTES = [
    'nike', 'adidas', 'puma', 'newbalance', 'asics', 'reebok', 'vans', 'converse',
    'lacoste', 'gucci', 'prada', 'dior', 'balenciaga', 'louisvuitton', 'versace', 'fendi',
    'burberry', 'givenchy', 'valentino', 'zara', 'bershka', 'pullandbear', 'stradivarius',
    'massimodutti', 'defacto', 'lcwaikiki', 'kiabi', 'celio', 'shein', 'townteam',
    'offwhite', 'supreme', 'stoneisland', 'moncler', 'amiri', 'palmangels', 'fearofgod',
    'ralphlauren', 'tommyhilfiger', 'calvinklein', 'hugoboss', 'levis', 'carhartt',
    'thenorthface', 'northface', 'timberland', 'clarks', 'skechers', 'fila', 'kappa', 'umbro',
    'underarmour', 'ellesse', 'celine', 'chanel', 'hermes', 'armani', 'moschino', 'dsquared',
    'kenzo', 'trapstar', 'corteiz', 'hellstar', 'cpcompany', 'lululemon', 'salomon',
    'birkenstock', 'crocs', 'siksilk', 'oryx',
]
# Mots de commerce sans précision : la page vend quelque chose, à vérifier à la main
COMMERCE = [
    'shop', 'shope', 'shoop', 'chop', 'store', 'stoore', 'boutique', 'brand', 'market', 'outlet',
    'concept', 'vente', 'seller', 'livraison', 'commande', 'wholesale', 'grossiste', 'import',
    'magasin', 'mall',
]


def normaliser(texte):
    t = unicodedata.normalize('NFKD', texte or '').encode('ascii', 'ignore').decode().lower()
    return t


def mots(texte):
    return [m for m in re.split(r'[^a-z0-9]+', texte) if m]


def chercher(liste, compact, tokens):
    """Mot court (≤ 4 lettres) : doit être un mot entier. Mot long : peut être collé (ex. democlothes)."""
    for k in liste:
        if len(k) <= 4:
            if k in tokens:
                return k
        elif k in compact:
            return k
    return None


def marque(username, tokens):
    """Marque : mot entier, ou début du nom d'utilisateur (ex. nikemarocofficiel)."""
    debut = re.sub(r'[^a-z0-9]', '', normaliser(username))
    for k in MARQUES_MIXTES:
        if k in tokens or debut.startswith(k):
            return k
    return None


def classer(username, full_name):
    texte = normaliser(f'{username} {full_name}')
    tokens = set(mots(texte))
    compact = re.sub(r'[^a-z0-9]', '', texte)
    hors_sujet = chercher(HORS_SUJET, compact, tokens)
    ch = chercher(CHAUSSURES, compact, tokens)
    ve = chercher(VETEMENTS, compact, tokens)
    if not ve and not hors_sujet:
        ve = chercher(VETEMENTS_FAIBLES, compact, tokens)
    mq = marque(username, tokens)
    if mq and hors_sujet in ('league', 'club'):
        mq = None  # ex. un club ou une ligue qui porte un nom proche d'une marque
    if mq or (ch and ve):
        return 'Vêtements et chaussures', ', '.join(x for x in (mq, ve, ch) if x)
    if ch:
        return 'Chaussures', ch
    if ve:
        return 'Vêtements', ve
    co = chercher(COMMERCE, compact, tokens)
    if co:
        return 'Commerce à vérifier', co
    return 'Autre', ''


ORDRE = ['Vêtements et chaussures', 'Vêtements', 'Chaussures', 'Commerce à vérifier', 'Autre']
COULEURS = {'Vêtements et chaussures': 'D9EAD3', 'Vêtements': 'E2EFDA', 'Chaussures': 'DDEBF7',
            'Commerce à vérifier': 'FFF2CC', 'Autre': 'F2F2F2'}
ENTETES = ['Nom d\'utilisateur', 'Nom affiché', 'Lien', 'Vérifié', 'Catégorie proposée',
           'Mot repéré', 'Ta décision']
LARGEURS = [30, 36, 46, 9, 24, 26, 18]


def remplir(ws, lignes):
    ws.append(ENTETES)
    for c in ws[1]:
        c.font = Font(bold=True, color='FFFFFF')
        c.fill = PatternFill('solid', fgColor='2F5D46')
        c.alignment = Alignment(vertical='center')
    for u, nom, verif, cat, mot in lignes:
        lien = f'https://www.instagram.com/{u}/'
        ws.append([u, nom, lien, 'oui' if verif else '', cat, mot, ''])
        r = ws.max_row
        ws.cell(r, 3).hyperlink = lien
        ws.cell(r, 3).font = Font(color='0563C1', underline='single')
        ws.cell(r, 5).fill = PatternFill('solid', fgColor=COULEURS[cat])
    for i, w in enumerate(LARGEURS, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = 'A2'
    ws.auto_filter.ref = ws.dimensions


def main(src, dst):
    data = json.load(open(src, encoding='utf-8'))
    vus, lignes = set(), []
    for u, nom, verif in data:
        if u in vus:
            continue
        vus.add(u)
        cat, mot = classer(u, nom)
        lignes.append((u, nom, verif, cat, mot))
    lignes.sort(key=lambda l: (ORDRE.index(l[3]), l[0]))

    wb = Workbook()
    resume = wb.active
    resume.title = 'Résumé'
    resume.append(['Catégorie', 'Nombre'])
    for c in resume[1]:
        c.font = Font(bold=True)
    for cat in ORDRE:
        resume.append([cat, sum(1 for l in lignes if l[3] == cat)])
    resume.append(['Total', len(lignes)])
    resume.append([])
    resume.append(['Classement fait sur le nom seulement (aucun profil ouvert).'])
    resume.append(['« Commerce à vérifier » et « Autre » peuvent contenir des pages de vêtements au nom peu parlant.'])
    resume.column_dimensions['A'].width = 30

    remplir(wb.create_sheet('Tous'), lignes)
    for cat in ORDRE:
        remplir(wb.create_sheet(cat[:31]), [l for l in lignes if l[3] == cat])
    wb.save(dst)

    # Même classement en JSON, lu par la page web Hakim Médias (liste à cocher)
    dst_json = re.sub(r'\.xlsx$', '', dst) + '_classes.json'
    with open(dst_json, 'w', encoding='utf-8') as f:
        json.dump({
            'categories': ORDRE,
            'comptes': [{'username': u, 'nom': nom, 'verifie': bool(verif), 'categorie': cat,
                         'mot': mot, 'lien': f'https://www.instagram.com/{u}/'}
                        for u, nom, verif, cat, mot in lignes],
        }, f, ensure_ascii=False, indent=1)
    print(f'JSON : {dst_json}')
    for cat in ORDRE:
        print(f'{cat:26} {sum(1 for l in lignes if l[3] == cat)}')
    print(f'{"Total":26} {len(lignes)}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
