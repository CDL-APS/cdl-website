/* ANTEPRIMA B — titoli adattati alla larghezza, occhi che seguono il
   puntatore, e i dati veri (assets/js/dati.js) per home e Cortoteca.
   File di prova: non fa parte del sito pubblicato. */

const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72L19 12 8 5.14Z"/></svg>';
const FERMO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Righe a tutta larghezza: si misura il testo a 100 px e si scala ---- */
function adatta() {
  document.querySelectorAll('.fit').forEach((riga) => {
    const testo = riga.querySelector('.fit-testo');
    if (!testo || !riga.clientWidth) return;
    riga.style.fontSize = '100px';
    const largo = testo.getBoundingClientRect().width;
    if (largo) riga.style.fontSize = (100 * riga.clientWidth / largo).toFixed(2) + 'px';
  });
}

/* ---- Occhi: ogni pupilla si sposta verso il punto guardato ---- */
const occhi = () => Array.from(document.querySelectorAll('.occhio'));

function guarda(x, y) {
  occhi().forEach((occhio) => {
    const r = occhio.getBoundingClientRect();
    if (!r.width) return;
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height / 2);
    const distanza = Math.hypot(dx, dy) || 1;
    const forza = Math.min(1, distanza / 140);
    occhio.style.setProperty('--px', (dx / distanza) * r.width * 0.2 * forza + 'px');
    occhio.style.setProperty('--py', (dy / distanza) * r.height * 0.2 * forza + 'px');
  });
}

function accendiOcchi() {
  // A riposo guardano in basso a sinistra, verso il contenuto
  guarda(window.innerWidth * 0.25, window.innerHeight * 1.1);
  if (FERMO) return;

  let attesa = false;
  const segui = (x, y) => {
    if (attesa) return;
    attesa = true;
    requestAnimationFrame(() => { guarda(x, y); attesa = false; });
  };
  window.addEventListener('pointermove', (e) => segui(e.clientX, e.clientY));
  // Con la tastiera guardano l'elemento a fuoco
  document.addEventListener('focusin', (e) => {
    const r = e.target.getBoundingClientRect();
    segui(r.left + r.width / 2, r.top + r.height / 2);
  });
  // Senza puntatore (telefono) oscillano piano con lo scorrimento
  if (!window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('scroll', () => {
      segui(window.innerWidth * (0.5 + 0.45 * Math.sin(window.scrollY / 160)), window.innerHeight);
    }, { passive: true });
  }
}

/* ---- Home: l'ultimo evento e l'ultima produzione ---- */
function riempiRecente(box, { href, immagine, titolo, dati }) {
  const schermo = box.querySelector('.schermo');
  schermo.href = href;
  mostraImmagine(schermo.querySelector('img'), immagine);
  const link = box.querySelector('.recente-titolo a');
  link.href = href;
  link.textContent = titolo;
  box.querySelector('.recente-dati').textContent = dati;
  box.querySelector('.recente-testo-dati').hidden = false;
  schermo.hidden = false;
}

function home() {
  caricaEventi().then(([e]) => {
    if (!e) return;
    riempiRecente(document.getElementById('ultimo-evento'), {
      href: indirizzoSicuro(e.pagina) || 'eventi.html',
      immagine: e.copertina || e.miniatura,
      titolo: e.titolo,
      dati: e.riassunto || e.luogo || ''
    });
  }).catch(console.error);

  caricaOpere().then((opere) => {
    const [o] = produzioniCdl(opere);
    if (!o) return;
    riempiRecente(document.getElementById('ultima-produzione'), {
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
      <span class="schermo"><img alt="" loading="lazy">${cdl}${stato}</span>
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
  adatta();
  window.addEventListener('resize', adatta);
  window.addEventListener('load', adatta);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(adatta);
  accendiOcchi();

  if (document.getElementById('movie-grid')) cortoteca();
  if (document.getElementById('ultimo-evento')) home();
});
