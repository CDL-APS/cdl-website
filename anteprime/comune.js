/* ANTEPRIME E e F — funzioni comuni: scritte adattate alla larghezza, occhi
   che seguono il puntatore e sbattono le palpebre, disco che accompagna il
   puntatore sulle fotografie, strisce che scorrono, e il motore della
   Cortoteca (ricerca, ordine, vista a lista o a galleria).
   File di prova: non fa parte del sito pubblicato. */

const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72L19 12 8 5.14Z"/></svg>';
// → verso un elenco o un'altra pagina, ↗ per aprire un contenuto
const FRECCIA = '<svg class="freccia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg>';
const FRECCIA_SU = '<svg class="freccia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';
const FERMO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PUNTATORE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---- Righe a tutta larghezza: si misura il testo a 100 px e si scala,
   restando un filo sotto la larghezza piena ---- */
function adatta() {
  document.querySelectorAll('.fit').forEach((riga) => {
    const testo = riga.querySelector('.fit-testo');
    if (!testo || !riga.clientWidth) return;
    riga.style.fontSize = '100px';
    const largo = testo.getBoundingClientRect().width;
    if (largo) riga.style.fontSize = (99.4 * riga.clientWidth / largo).toFixed(2) + 'px';
  });
}

/* ---- Occhi: la pupilla va verso il punto guardato; ogni tanto un battito ---- */
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
  if (!document.querySelector('.occhio')) return;
  guarda(window.innerWidth * 0.5, window.innerHeight * 1.2);
  if (FERMO) return;

  let attesa = false;
  const segui = (x, y) => {
    if (attesa) return;
    attesa = true;
    requestAnimationFrame(() => { guarda(x, y); attesa = false; });
  };
  window.addEventListener('pointermove', (e) => segui(e.clientX, e.clientY));
  document.addEventListener('focusin', (e) => {
    const r = e.target.getBoundingClientRect();
    segui(r.left + r.width / 2, r.top + r.height / 2);
  });
  if (!PUNTATORE) {
    window.addEventListener('scroll', () => {
      segui(window.innerWidth * (0.5 + 0.45 * Math.sin(window.scrollY / 160)), window.innerHeight);
    }, { passive: true });
  }

  document.querySelectorAll('.occhio').forEach(battito);
}

// Ogni occhio sbatte la palpebra per conto suo, a intervalli irregolari
function battito(occhio) {
  if (FERMO) return;
  {
    const batti = () => {
      if (!occhio.isConnected) return;
      occhio.classList.add('is-chiuso');
      setTimeout(() => occhio.classList.remove('is-chiuso'), 130);
      setTimeout(batti, 4500 + Math.random() * 7000);
    };
    setTimeout(batti, 3000 + Math.random() * 7000);
  }
}

// Gli occhi aggiunti dopo il caricamento (quelli della galleria) vanno accesi a parte
function avviaOcchiNuovi(contenitore) {
  guarda(window.innerWidth * 0.5, window.innerHeight * 0.5);
  contenitore.querySelectorAll('.occhio').forEach(battito);
}

/* ---- Disco del puntatore: sulle fotografie con data-cursore dice che cosa
   succede al clic ("Apri", "Guarda") ---- */
function accendiCursore() {
  if (!PUNTATORE || FERMO) return;
  const disco = document.createElement('div');
  disco.className = 'cursore';
  disco.setAttribute('aria-hidden', 'true');
  document.body.append(disco);
  window.addEventListener('pointermove', (e) => {
    const bersaglio = e.target.closest ? e.target.closest('[data-cursore]') : null;
    disco.style.setProperty('--cx', e.clientX + 'px');
    disco.style.setProperty('--cy', e.clientY + 'px');
    if (bersaglio) disco.textContent = bersaglio.dataset.cursore;
    disco.classList.toggle('is-visibile', Boolean(bersaglio));
  });
  document.addEventListener('pointerleave', () => disco.classList.remove('is-visibile'));
}

/* ---- Strisce che scorrono: il contenuto è raddoppiato perché il giro non
   abbia stacco; un pulsante le ferma ---- */
function preparaScorre(blocco) {
  const pista = blocco.querySelector('.scorre__pista');
  if (!pista || pista.dataset.pronta) return;
  Array.from(pista.children).forEach((figlio) => {
    const copia = figlio.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    copia.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
    if (copia.matches('a')) copia.setAttribute('tabindex', '-1');
    pista.append(copia);
  });
  pista.dataset.pronta = 'si';

  const pausa = blocco.querySelector('.scorre__pausa');
  if (!pausa) return;
  pausa.addEventListener('click', () => {
    const ferma = blocco.classList.toggle('is-ferma');
    pausa.setAttribute('aria-pressed', String(ferma));
    const testo = pausa.querySelector('[data-testo]');
    if (testo) testo.textContent = ferma ? 'Riprendi' : 'Ferma';
  });
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

function dataLunga(giorno) {
  return new Date(giorno + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ---- Galleria: solo i fotogrammi; titolo e dati stanno nella targa che
   compare al passaggio ---- */
function disegnaGalleria(scelte, contenitore) {
  const griglia = document.createElement('ul');
  griglia.className = 'galleria';
  scelte.forEach((o) => {
    const guardabile = streamingDisponibile(o);
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="still" href="${esc(indirizzoOpera(o))}">
        <span class="cornice"></span>
        <span class="targa">
          <span class="targa__titolo">${esc(o.titolo)}</span>
          <span class="targa__dati">${esc(datiOpera(o))}</span>
          <span class="targa__stato">${guardabile ? PLAY + 'Guarda' : 'In arrivo'}</span>
        </span>
      </a>`;
    li.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
    li.firstElementChild.opera = o;
    griglia.append(li);
  });
  // Nell'ultimo posto della griglia, dove non c'è un fotogramma, due occhi
  // guardano i corti
  const vuoto = document.createElement('li');
  vuoto.className = 'galleria__vuoto';
  vuoto.setAttribute('aria-hidden', 'true');
  vuoto.innerHTML = '<span class="occhio" style="--x:38%;--y:46%;--d:19%"><span class="pupilla"></span></span>'
    + '<span class="occhio" style="--x:63%;--y:60%;--d:12%"><span class="pupilla"></span></span>';
  griglia.append(vuoto);
  contenitore.append(griglia);
  avviaOcchiNuovi(vuoto);
  return griglia;
}

/* ---- Cortoteca: carica le opere e ridisegna a ogni ricerca, riordino o
   cambio di vista. Ogni proposta passa il suo modo di disegnare la lista e,
   se vuole, la galleria. La vista si può scegliere anche dall'indirizzo
   (?vista=galleria, ?vista=lista). ---- */
async function avviaCortoteca({ lista, galleria = disegnaGalleria }) {
  const contenitore = document.getElementById('opere');
  const cerca = document.getElementById('db-search');
  const richiesta = new URLSearchParams(location.search).get('vista');
  if (richiesta === 'galleria' || richiesta === 'lista') document.getElementById('vista-' + richiesta).checked = true;

  let opere = [];
  const disegna = () => {
    const testo = cerca.value.toLowerCase().trim();
    const perAnno = document.getElementById('ordine-anno').checked;
    const vista = document.getElementById('vista-galleria').checked ? 'galleria' : 'lista';
    const scelte = opere.filter((o) =>
      [o.titolo, o.regista, o.produzione].some((t) => (t || '').toLowerCase().includes(testo)));
    scelte.sort(perAnno ? dallaPiuRecente : (a, b) => a.titolo.localeCompare(b.titolo));

    contenitore.replaceChildren();
    contenitore.dataset.vista = vista;
    if (!scelte.length) {
      const avviso = document.createElement('p');
      avviso.className = 'avviso';
      avviso.textContent = 'Nessuna opera trovata. Prova con un altro titolo o un altro nome.';
      contenitore.append(avviso);
      return;
    }
    (vista === 'galleria' ? galleria : lista)(scelte, contenitore, opere);
  };

  document.querySelectorAll('input[name="ordine"], input[name="vista"]').forEach((r) => r.addEventListener('change', disegna));
  cerca.addEventListener('input', disegna);
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
  accendiCursore();
});
