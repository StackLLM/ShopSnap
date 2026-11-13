const $ = s => document.querySelector(s);
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

document.querySelectorAll('form').forEach(form => {
  const ta = form.querySelector('textarea'), drop = form.querySelector('.drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.classList.remove('over');
    const t = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (t) { ta.value = (ta.value.trim() + '\n' + t.trim()).trim(); submit(form); }
  });
  form.addEventListener('submit', e => { e.preventDefault(); submit(form); });
});

async function submit(form) {
  const ta = form.querySelector('textarea');
  if (!ta.value.trim()) return;
  await fetch('/api/jobs', { method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ kind: form.dataset.kind, entries: ta.value }) });
  ta.value = '';
  refresh();
}

function thumb(jid, f) {
  const url = `/apercu/${jid}/` + f.split('/').map(encodeURIComponent).join('/');
  return /\.(mp4|mov|webm)$/i.test(f)
    ? `<a href="${url}" target="_blank"><video src="${url}#t=0.5" muted preload="metadata"></video></a>`
    : /\.(jpe?g|png|webp)$/i.test(f) ? `<a href="${url}" target="_blank"><img src="${url}" loading="lazy"></a>` : '';
}

// Enregistrer (dossier ou ZIP) / Rejeter : rien n'entre dans la destination sans ce clic
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const { action, id, mode } = b.dataset;
  if (action === 'rejeter' && !confirm('Rejeter ce téléchargement ? Les fichiers seront effacés.')) return;
  b.closest('.actions').querySelectorAll('button').forEach(x => x.disabled = true);
  await fetch(`/api/jobs/${id}/${action}`, { method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ mode }) });
  refresh();
});

// Dossier où les fichiers seront rangés dans la destination
function dossier(files) {
  const d = files.map(f => f.split('/').slice(0, -1));
  const commun = d.reduce((a, b) => a.filter((x, i) => b[i] === x));
  return commun.join('/') + '/';
}

let lastHtml = '';
async function refresh() {
  const jobs = await (await fetch('/api/jobs')).json();
  if (!jobs.length) return;
  const html = jobs.map(j => `
    <div class="job">
      <div class="job-head">
        <span class="tag">${/facebook\.com|fb\.watch|fb\.com\/|^fb:/i.test(j.entry) ? 'Facebook' : 'Instagram'} · ${j.kind === 'profil' ? 'profil' : 'lien'}</span>
        <span class="entry">${esc(j.entry)}</span>
        <span class="st ${esc(j.status)}">${esc(j.status)}${j.files.length ? ' · ' + j.files.length + ' fichiers' : ''}</span>
      </div>
      ${j.status === 'prêt' ? `
      <p class="aide-ligne">Pas encore enregistré. Destination : <code>${esc(racine)}${esc(dossier(j.files))}</code></p>
      <div class="actions">
        <button type="button" class="btn" data-action="enregistrer" data-mode="dossier" data-id="${j.id}">Télécharger dans le dossier</button>
        <button type="button" class="btn ghost" data-action="enregistrer" data-mode="zip" data-id="${j.id}">Télécharger en ZIP</button>
        <button type="button" class="btn ghost danger" data-action="rejeter" data-id="${j.id}">Rejeter</button>
      </div>` : ''}
      ${j.enregistre ? `<p class="enregistre">✔ Enregistré dans <code>${esc(racine)}${esc(j.enregistre.chemin)}</code></p>` : ''}
      ${j.files.length && j.status !== 'rejeté' && !(j.enregistre && j.enregistre.mode === 'zip')
        ? `<div class="thumbs">${j.files.slice(0, 60).map(f => thumb(j.id, f)).join('')}</div>` : ''}
      ${j.log.length ? `<details ${j.status === 'échec' ? 'open' : ''}><summary>Journal</summary><pre>${esc(j.log.join('\n'))}</pre></details>` : ''}
    </div>`).join('');
  if (html !== lastHtml) {
    const open = [...document.querySelectorAll('details')].map(d => d.open);
    $('#jobs').innerHTML = html; lastHtml = html;
    document.querySelectorAll('details').forEach((d, i) => { if (open[i]) d.open = true; });
  }
}

// ---------- Mes abonnements : cocher = le lien entre dans « Profil entier » ----------
const formProfil = document.querySelector('form[data-kind="profil"]');
const taProfil = formProfil.querySelector('textarea');
const lienDe = u => `https://www.instagram.com/${u}/`;
const nomDuLien = l => (l.match(/instagram\.com\/([A-Za-z0-9._]+)/) || [])[1] || l.replace(/^@/, '');
let abos = [], filtre = 'Vêtements et chaussures', recherche = '';

const coches = () => new Set(taProfil.value.split(/\s+/).filter(Boolean).map(nomDuLien));

function majCompteur() {
  const n = coches().size;
  $('#abos-compteur').textContent = n + (n > 1 ? ' cochés' : ' coché');
}

function afficherAbos() {
  const sel = coches(), q = recherche.toLowerCase();
  const liste = abos.filter(a => (filtre === 'Tous' || a.categorie === filtre) &&
    (!q || a.username.toLowerCase().includes(q) || a.nom.toLowerCase().includes(q)));
  $('#abos-liste').innerHTML = liste.length ? liste.map(a => `
    <label class="abo">
      <input type="checkbox" data-u="${esc(a.username)}" ${sel.has(a.username) ? 'checked' : ''}>
      <span class="abo-nom"><b><a href="${esc(a.lien)}" target="_blank">@${esc(a.username)}</a></b>
        <small>${esc(a.nom || '—')}${a.mot ? ' · « ' + esc(a.mot) + ' »' : ''}</small></span>
      <span class="abo-cat">${esc(a.categorie)}</span>
    </label>`).join('') : '<p class="empty" style="padding:12px">Aucune page.</p>';
  document.querySelectorAll('.onglet').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === filtre));
  majCompteur();
}

function cocher(usernames, oui) {
  const sel = coches();
  usernames.forEach(u => oui ? sel.add(u) : sel.delete(u));
  taProfil.value = [...sel].map(lienDe).join('\n');
  // Pas de redessin de la liste : on garde la position de défilement
  document.querySelectorAll('#abos-liste input').forEach(i => { i.checked = sel.has(i.dataset.u); });
  majCompteur();
}

$('#abos-liste').addEventListener('change', e => {
  if (e.target.dataset.u) cocher([e.target.dataset.u], e.target.checked);
});
$('#abos-recherche').addEventListener('input', e => { recherche = e.target.value.trim(); afficherAbos(); });
$('#abos-tout').addEventListener('click', () =>
  cocher([...document.querySelectorAll('#abos-liste input')].map(i => i.dataset.u), true));
$('#abos-rien').addEventListener('click', () => { taProfil.value = ''; afficherAbos(); });
taProfil.addEventListener('input', afficherAbos);
formProfil.addEventListener('submit', () => setTimeout(afficherAbos, 300));

fetch('/api/abonnements').then(r => r.json()).then(d => {
  abos = d.comptes || [];
  if (!abos.length) return;
  const cats = ['Tous', ...d.categories];
  $('#abos-onglets').innerHTML = cats.map(c => {
    const n = c === 'Tous' ? abos.length : abos.filter(a => a.categorie === c).length;
    return `<button type="button" class="onglet" data-cat="${esc(c)}">${esc(c)} (${n})</button>`;
  }).join('');
  document.querySelectorAll('.onglet').forEach(b => b.addEventListener('click', () => { filtre = b.dataset.cat; afficherAbos(); }));
  $('#abos').hidden = false;
  afficherAbos();
});

// Nom du dossier de destination affiché devant les chemins (ex. « donnees/ »)
let racine = 'destination/';
fetch('/api/info').then(r => r.json()).then(i => {
  if (i.destination) {
    $('#note').textContent = `Fichiers enregistrés dans ${i.destination}.`;
    racine = i.destination.replace(/\/+$/, '').split('/').pop() + '/';
    lastHtml = ''; refresh();
  }
  $('#note').textContent += i.cookies ? ' Compte connecté via cookies.txt.' : ' Mode sans compte.';
});
refresh(); setInterval(refresh, 2000);
