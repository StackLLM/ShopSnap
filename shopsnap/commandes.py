"""Construction des commandes instaloader (profils, photos) et yt-dlp (vidéos), qualité maximale."""
import http.cookiejar
import re

from .config import COOKIES, SESSION

# Erreurs normales de yt-dlp quand un post ne contient que des photos (pas une vraie panne)
NO_VIDEO = ('No video formats found', 'There is no video in this post')


def instaloader_target(entry):
    """Lien de profil, lien de post ou nom → cible instaloader."""
    e = entry.split('?')[0].rstrip('/')
    m = re.search(r'instagram\.com/(?:[^/]+/)?(?:p|reels?|tv)/([^/]+)', e)
    if m:
        return '-' + m.group(1)
    m = re.search(r'instagram\.com/([^/]+)', e)
    name = m.group(1) if m else e.lstrip('@')
    if not re.fullmatch(r'[A-Za-z0-9._]{1,30}', name):
        raise ValueError(f'Nom de profil invalide : {entry}')
    return name


def instaloader_session():
    """Si cookies.txt existe, le convertit en session instaloader. Renvoie les options de connexion."""
    if not COOKIES.exists():
        return []
    import instaloader
    jar = http.cookiejar.MozillaCookieJar(str(COOKIES))
    jar.load(ignore_discard=True, ignore_expires=True)
    data = {c.name: c.value for c in jar if 'instagram.com' in c.domain}
    if 'sessionid' not in data:
        return []
    L = instaloader.Instaloader(quiet=True)
    L.load_session('tmp', data)
    user = L.test_login()
    if not user:
        return []
    L.load_session(user, data)
    L.save_session_to_file(str(SESSION))
    return ['-l', user, '-f', str(SESSION)]


FACEBOOK = re.compile(r'(?:^|//|\.)(?:facebook\.com|fb\.watch|fb\.com)/', re.I)


def est_facebook(entry):
    return bool(FACEBOOK.search(entry))


def facebook_page(entry):
    """Lien ou nom d'une page Facebook → nom de la page (ex. facebook.com/nike/photos → nike)."""
    e = entry.split('?')[0].rstrip('/')
    m = re.search(r'facebook\.com/([^/]+)', e)
    name = m.group(1) if m else e.lstrip('@')
    if name in ('profile.php', 'pages', 'people', 'groups') or not re.fullmatch(r'[A-Za-z0-9._-]{1,80}', name):
        raise ValueError(f'Page Facebook non reconnue (utiliser facebook.com/<nom_de_la_page>) : {entry}')
    return name


def gallery_dl_command(out, dossier):
    """gallery-dl (photos Facebook) : meilleure taille disponible, pause entre requêtes (anti-blocage)."""
    cmd = ['gallery-dl', '-d', str(out), '-o', f'directory={dossier}',
           '--sleep-request', '1.5-3']
    if COOKIES.exists():
        cmd += ['--cookies', str(COOKIES)]
    return cmd


def build_steps_facebook(kind, entry, base):
    """Facebook, rangé à part : facebook/profils/<page>/, facebook/liens/<page>/<id>/, facebook/pubs/<id>/.
    Page entière et photos → gallery-dl ; vidéos, Reels, posts → yt-dlp ; pubs Ad Library → yt-dlp."""
    fb = base / 'facebook'
    if kind == 'profil':
        page = facebook_page(entry)
        out = fb / 'profils'
        out.mkdir(parents=True, exist_ok=True)
        cmd = gallery_dl_command(out, '["{username}"]')
        return [(cmd + ['--', f'https://www.facebook.com/{page}/photos'], out, ())]
    if not re.match(r'https?://', entry):
        raise ValueError(f'Ce n\'est pas un lien : {entry}')
    if '/ads/library' in entry:
        out = fb / 'pubs'
        out.mkdir(parents=True, exist_ok=True)
        # Ad Library : sans --impersonate (sinon refus 403)
        cmd = [c for c in yt_dlp_command(out, '%(id)s/%(id)s.%(ext)s') if c not in ('--impersonate', 'chrome')]
        return [(cmd + ['--', entry], out, ())]
    out = fb / 'liens'
    out.mkdir(parents=True, exist_ok=True)
    if re.search(r'/media/set/', entry):
        # Album → facebook/liens/<page>/<id de l'album>/
        return [(gallery_dl_command(out, '["{username}", "{set_id}"]') + ['--', entry], out, ())]
    if re.search(r'/photo(?:\.php)?/?\?|fbid=|/photos/[^/]+/\d+', entry):
        # gallery-dl 1.32.19 : une photo seule renvoie 404, ou tout l'album selon le format du lien
        raise ValueError('Photo Facebook seule non prise en charge : coller le lien de l\'album '
                         '(facebook.com/media/set/?set=…) ou la page dans « Profil entier ».')
    return [(yt_dlp_command(out) + ['--', entry], out, ())]


def build_steps(kind, entry, base):
    """Étapes (commande, dossier de travail, erreurs tolérées). Tout s'écrit sous `base`
    avec le même rangement que la destination : profils/<profil>/ ou liens/<compte>/<code>/
    (Instagram) ; facebook/… pour Facebook."""
    if est_facebook(entry) or (kind == 'profil' and entry.lower().startswith('fb:')):
        return build_steps_facebook(kind, entry.removeprefix('fb:').removeprefix('FB:'), base)
    if kind == 'profil':
        target = instaloader_target(entry)
        out = base / 'profils'
        out.mkdir(parents=True, exist_ok=True)
        cmd = ['instaloader', '--reels', '--no-metadata-json', '--sanitize-paths',
               '--dirname-pattern', str(out / '{target}')]
        # Pas de --no-iphone : images en plus haute résolution.
        cmd += instaloader_session()
        return [(cmd + ['--', target], out, ())]
    if not re.match(r'https?://', entry):
        raise ValueError(f'Ce n\'est pas un lien : {entry}')
    out = base / 'liens'
    out.mkdir(parents=True, exist_ok=True)
    steps = []
    # Post Instagram (/p/) : photos et carrousels avec instaloader (yt-dlp ne prend pas les photos),
    # puis les vidéos avec yt-dlp (meilleure qualité vidéo).
    m = re.search(r'instagram\.com/(?:[^/]+/)?p/([^/?#]+)', entry)
    if m:
        steps.append((['instaloader', '--no-videos', '--no-metadata-json', '--sanitize-paths',
                       # Un dossier par lien : liens/<compte>/<code du post>/
                       '--dirname-pattern', str(out / '{profile}' / '{shortcode}'),
                       '--filename-pattern', '{shortcode}']
                      + instaloader_session() + ['--', '-' + m.group(1)], out, ()))
    steps.append((yt_dlp_command(out) + ['--', entry], out, NO_VIDEO if m else ()))
    return steps


def yt_dlp_command(out, modele='%(channel,uploader,uploader_id|inconnu)s/%(playlist_id,id)s/%(id)s.%(ext)s'):
    cmd = ['yt-dlp',
           '-f', 'bv*+ba/b',              # meilleure vidéo + meilleur son
           '-S', 'res,br,fps',            # plus grande résolution, puis plus gros débit
           '--merge-output-format', 'mp4',  # assemblage sans réencodage
           '--impersonate', 'chrome',
           # Un dossier par lien : liens/<compte>/<code du post>/ (même pour une seule vidéo)
           '-o', str(out / modele),
           '--restrict-filenames', '--no-overwrites', '--no-mtime', '--newline']
    if COOKIES.exists():
        cmd += ['--cookies', str(COOKIES)]
    return cmd
