/* ANTEPRIMA A — riempie home e Cortoteca con i dati veri (assets/js/dati.js).
   File di prova: non fa parte del sito pubblicato. */

const PIU = '<svg class="piu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72L19 12 8 5.14Z"/></svg>';

/* ---- Home: l'ultimo evento e l'ultima produzione ---- */
function riempiRecente(box, { href, immagine, titolo, dati }) {
  const link = box.querySelector('.recente-link');
  link.href = href;
  mostraImmagine(link.querySelector('img'), immagine);
  box.querySelector('.recente-titolo').textContent = titolo;
  box.querySelector('.recente-dati').textContent = dati;
  link.hidden = false;
}

async function home() {
  const evento = document.getElementById('ultimo-evento');
  const produzione = document.getElementById('ultima-produzione');

  caricaEventi().then(([e]) => {
    if (!e) return;
    riempiRecente(evento, {
      href: indirizzoSicuro(e.pagina) || 'eventi.html',
      immagine: e.copertina || e.miniatura,
      titolo: e.titolo,
      dati: e.riassunto || e.luogo || ''
    });
  }).catch(console.error);

  caricaOpere().then((opere) => {
    const [o] = produzioniCdl(opere);
    if (!o) return;
    riempiRecente(produzione, {
      href: 'opera.html?film=' + encodeURIComponent(o.codice),
      immagine: o.fotogramma,
      titolo: o.titolo,
      dati: [o.anno, generePrincipale(o), 'Regia di ' + o.regista].filter(Boolean).join(' · ')
    });
  }).catch(console.error);
}

/* ---- Cortoteca: griglia, ricerca e ordinamento ---- */
let opere = [];

function disegna() {
  const griglia = document.getElementById('movie-grid');
  const perAnno = document.getElementById('ordine-anno').checked;
  const cerca = document.getElementById('db-search').value.toLowerCase().trim();

  griglia.replaceChildren();

  const scelte = opere.filter((o) =>
    [o.titolo, o.regista, o.produzione].some((t) => (t || '').toLowerCase().includes(cerca)));
  scelte.sort(perAnno ? (a, b) => a.anno - b.anno : (a, b) => a.titolo.localeCompare(b.titolo));

  scelte.forEach((o, i) => {
    const card = document.createElement('a');
    card.className = 'opera';
    card.href = 'opera.html?film=' + encodeURIComponent(o.codice);
    card.style.transitionDelay = `${0.04 * i}s`;

    const cdl = o.produzione_cdl
      ? '<span class="opera-cdl"><span class="logo" role="img" aria-label="Produzione CDL"></span></span>'
      : '';
    const stato = streamingDisponibile(o)
      ? `<span class="opera-stato opera-stato--play">${PLAY}Guarda</span>`
      : '<span class="opera-stato">In arrivo</span>';
    const produzione = o.produzione ? `<br>Produzione: ${esc(o.produzione)}` : '';

    card.innerHTML = `
      <span class="finestra"><img alt="" loading="lazy">${cdl}${stato}</span>
      <h2 class="opera-titolo">${esc(o.titolo)}</h2>
      <p class="opera-dati">${esc(o.anno)} · Regia di ${esc(o.regista)}${produzione}</p>`;
    mostraImmagine(card.querySelector('img'), o.fotogramma);

    griglia.appendChild(card);
    setTimeout(() => card.classList.add('is-visibile'), 50);
  });

  if (!scelte.length) {
    const avviso = document.createElement('p');
    avviso.className = 'avviso';
    avviso.textContent = 'Nessuna opera trovata. Prova con un altro titolo o un altro nome.';
    griglia.appendChild(avviso);
  }
}

async function cortoteca() {
  document.querySelectorAll('input[name="ordine"]').forEach((r) => r.addEventListener('change', disegna));
  document.getElementById('db-search').addEventListener('input', disegna);
  try {
    opere = await caricaOpere();
  } catch (errore) {
    console.error(errore);
  }
  disegna();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('movie-grid')) cortoteca();
  if (document.getElementById('ultimo-evento')) home();
});
