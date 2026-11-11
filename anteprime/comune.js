/* ANTEPRIME C e D — funzioni comuni: scritte adattate alla larghezza, occhi
   che seguono il puntatore, piccoli strumenti per i dati.
   File di prova: non fa parte del sito pubblicato. */

const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72L19 12 8 5.14Z"/></svg>';
const PIU = '<svg class="piu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>';
const FERMO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Righe a tutta larghezza: si misura il testo a 100 px e si scala,
   restando un filo sotto la larghezza piena perché le lettere tonde sporgono
   dal loro riquadro e verrebbero rifilate ---- */
function adatta() {
  document.querySelectorAll('.fit').forEach((riga) => {
    const testo = riga.querySelector('.fit-testo');
    if (!testo || !riga.clientWidth) return;
    riga.style.fontSize = '100px';
    const largo = testo.getBoundingClientRect().width;
    if (largo) riga.style.fontSize = (99.4 * riga.clientWidth / largo).toFixed(2) + 'px';
  });
  // Una scritta può prendere la misura di un'altra (stessa altezza, non stessa larghezza)
  document.querySelectorAll('[data-misura-di]').forEach((el) => {
    const modello = document.querySelector(el.dataset.misuraDi);
    if (modello) el.style.fontSize = modello.style.fontSize;
  });
}

/* ---- Occhi: ogni pupilla si sposta verso il punto guardato ---- */
function guarda(x, y) {
  document.querySelectorAll('.occhio').forEach((occhio) => {
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
  // A riposo guardano in basso a destra, verso il contenuto
  guarda(window.innerWidth * 0.7, window.innerHeight * 1.2);
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

/* ---- Dati ---- */
function nuovaImmagine(percorso, alt) {
  const img = document.createElement('img');
  img.alt = alt || '';
  mostraImmagine(img, percorso);
  return img;
}

function indirizzoOpera(opera) {
  return 'opera.html?film=' + encodeURIComponent(opera.codice);
}

function datiOpera(opera) {
  return [opera.anno, generePrincipale(opera), 'Regia di ' + opera.regista].filter(Boolean).join(' · ');
}

function daGuardare(opere) {
  return opere.filter(streamingDisponibile).sort(dallaPiuRecente);
}

document.addEventListener('DOMContentLoaded', () => {
  adatta();
  window.addEventListener('resize', adatta);
  window.addEventListener('load', adatta);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(adatta);
  accendiOcchi();
});
