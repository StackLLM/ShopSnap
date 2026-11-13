"""Petit récepteur local et temporaire : reçoit la liste (POST /) et l'écrit dans un fichier.
Usage : python recepteur.py <fichier_sortie> [port]. Écoute seulement sur 127.0.0.1, s'arrête après une réception."""
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

SORTIE = sys.argv[1]
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8799

PAGE = b"""<!doctype html><meta charset=utf-8><title>Transfert</title><body>
<p id=s>Transfert...</p><script>
fetch('/', {method:'POST', body: window.name}).then(r => r.text()).then(t => {
  document.getElementById('s').textContent = t; window.name = '';
});
</script>"""


class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(PAGE)

    def do_POST(self):
        data = self.rfile.read(int(self.headers['Content-Length']))
        with open(SORTIE, 'wb') as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(f'recu {len(data)} octets'.encode())
        global fini
        fini = True


fini = False
srv = HTTPServer(('127.0.0.1', PORT), H)
while not fini:
    srv.handle_request()
