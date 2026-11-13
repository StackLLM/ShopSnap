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


def build_steps(kind, entry, base):
    """Étapes (commande, dossier de travail, erreurs tolérées). Tout s'écrit sous `base`
    avec le même rangement que la destination : profils/<profil>/ ou liens/<compte>/<code>/."""
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


def yt_dlp_command(out):
    cmd = ['yt-dlp',
           '-f', 'bv*+ba/b',              # meilleure vidéo + meilleur son
           '-S', 'res,br,fps',            # plus grande résolution, puis plus gros débit
           '--merge-output-format', 'mp4',  # assemblage sans réencodage
           '--impersonate', 'chrome',
           # Un dossier par lien : liens/<compte>/<code du post>/ (même pour une seule vidéo)
           '-o', str(out / '%(channel,uploader,uploader_id|inconnu)s/%(playlist_id,id)s/%(id)s.%(ext)s'),
           '--restrict-filenames', '--no-overwrites', '--no-mtime', '--newline']
    if COOKIES.exists():
        cmd += ['--cookies', str(COOKIES)]
    return cmd
