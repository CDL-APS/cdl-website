/* ==========================================================================
   CORTOTECA (cortoteca.html) — le opere dei soci in due viste, galleria e
   lista, con ricerca e ordine; il corto si apre nella sala, sopra la
   galleria, con la pagina del corto (corto.js). Si appoggia a dati.js,
   comune.js e corto.js.
   La vista si può scegliere anche dall'indirizzo (?vista=galleria,
   ?vista=lista).
   ========================================================================== */

async function avviaCortoteca() {
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
      avviso.textContent = opere.length
        ? 'Nessuna opera trovata. Prova con un altro titolo o un altro nome.'
        : 'Le opere non si riescono a caricare. Riprova fra poco.';
      contenitore.append(avviso);
      return;
    }
    (vista === 'galleria' ? galleriaAFuoco : listaConPalco)(scelte, contenitore);
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

/* Vista a lista: l'indice dei titoli e, a fianco, il fotogramma dell'opera
   su cui ci si trova, fermo sotto la barra mentre la lista scorre (vedi
   cortoteca.css). Sotto ogni titolo: regista, genere, durata, anno. */
function listaConPalco(scelte, contenitore) {
  contenitore.innerHTML = '<div class="grid"><ol class="righe span-5"></ol><div class="palco span-7 start-6"></div></div>';
  const elenco = contenitore.querySelector('.righe');
  const palco = contenitore.querySelector('.palco');

  const attiva = (i) => {
    const o = scelte[i];
    const guardabile = streamingDisponibile(o);
    elenco.querySelectorAll('.riga').forEach((r, n) => r.classList.toggle('is-attiva', n === i));
    palco.innerHTML = `
      <a class="cornice palco__schermo" href="${esc(indirizzoOpera(o))}" tabindex="-1" aria-hidden="true"></a>
      <a class="palco__azione" href="${esc(indirizzoOpera(o))}">
        ${guardabile ? PLAY + 'Guarda' : 'Informazioni' + FRECCIA_SU}
        <span class="sr-only">: ${esc(o.titolo)}</span>
      </a>`;
    palco.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
  };

  scelte.forEach((o, i) => {
    const guardabile = streamingDisponibile(o);
    const dati = [o.regista, generePrincipale(o), durata(o), o.anno].filter(Boolean).join(' · ');
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="riga" href="${esc(indirizzoOpera(o))}">
        <span class="riga__mini"></span>
        ${guardabile ? PLAY.replace('<svg', '<svg class="riga__play"') : '<span class="riga__play"></span>'}
        <span class="riga__titolo">${esc(o.titolo)}</span>
        <span class="riga__dati">${esc(dati)}</span>
      </a>`;
    const riga = li.firstElementChild;
    riga.querySelector('.riga__mini').append(nuovaImmagine(o.fotogramma));
    riga.addEventListener('pointerenter', () => attiva(i));
    riga.addEventListener('focus', () => attiva(i));
    elenco.append(li);
  });
  attiva(0);
}

/* Vista a galleria: solo i fotogrammi, e su ognuno il titolo (grafico se
   c'è, vedi titoloGrafico in comune.js). Al passaggio il titolo svanisce e
   resta il fotogramma pulito, mentre gli altri arretrano. Nell'ultimo posto
   della griglia, dove non c'è un fotogramma, due occhi guardano i corti. */
function galleriaAFuoco(scelte, contenitore) {
  const griglia = document.createElement('ul');
  griglia.className = 'galleria';
  scelte.forEach((o) => {
    const guardabile = streamingDisponibile(o);
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="still" href="${esc(indirizzoOpera(o))}">
        <span class="cornice"></span>
        <span class="targa"></span>
        <span class="sr-only">${esc([o.regista, o.anno].filter(Boolean).join(', '))}${guardabile ? ', da guardare in streaming' : ''}</span>
      </a>`;
    const still = li.firstElementChild;
    still.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
    still.querySelector('.targa').append(titoloGrafico(o, { classe: 'targa__titolo' }) || titoloScritto(o, 'targa__titolo'));
    still.opera = o;
    still.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || FERMO) return;
      e.preventDefault();
      passaggioCorto(still, (pulisci) => apriSala(o, still, pulisci));
    });
    griglia.append(li);
  });
  const vuoto = document.createElement('li');
  vuoto.className = 'galleria__vuoto';
  vuoto.setAttribute('aria-hidden', 'true');
  vuoto.innerHTML = '<span class="occhio" style="--x:38%;--y:46%;--d:19%"><span class="pupilla"></span></span>'
    + '<span class="occhio" style="--x:63%;--y:60%;--d:12%"><span class="pupilla"></span></span>';
  griglia.append(vuoto);
  contenitore.append(griglia);
  avviaOcchiNuovi(vuoto);

  const riposo = () => {
    griglia.classList.remove('ha-fuoco');
    griglia.querySelectorAll('.is-fuoco').forEach((s) => s.classList.remove('is-fuoco'));
  };
  griglia.querySelectorAll('.still').forEach((still) => {
    const accendi = () => {
      griglia.classList.add('ha-fuoco');
      griglia.querySelectorAll('.still').forEach((s) => s.classList.toggle('is-fuoco', s === still));
    };
    still.addEventListener('pointerenter', accendi);
    still.addEventListener('focus', accendi);
  });
  griglia.addEventListener('pointerleave', riposo);
  griglia.addEventListener('focusout', (e) => { if (!griglia.contains(e.relatedTarget)) riposo(); });
}

/* ---- Il passaggio dalla galleria al corto ----
   Il fotogramma si stacca e cresce fino al posto e alla misura dello schermo
   del corto (stessa larghezza del contenuto, sotto la barra), mentre intorno
   tutto si fa nero. Alla fine si apre la sala. */
function passaggioCorto(still, allaFine) {
  const r = still.getBoundingClientRect();
  const wrap = still.closest('.wrap').getBoundingClientRect();
  const arrivo = document.querySelector('.nav').offsetHeight + (innerWidth <= 639 ? 24 : 40);
  const scala = wrap.width / r.width;
  const raggio = parseFloat(getComputedStyle(still).borderTopLeftRadius) || 0;

  const velo = document.createElement('div');
  velo.className = 'passaggio';
  velo.style.background = getComputedStyle(document.documentElement).getPropertyValue('--nero-sala').trim() || '#000';
  document.body.append(velo);
  velo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATA_PASSAGGIO * 0.6, easing: 'ease-out', fill: 'forwards' });

  const copia = still.cloneNode(true);
  copia.querySelector('.targa')?.remove();
  copia.classList.remove('is-fuoco');
  copia.classList.add('passaggio-corto');
  copia.setAttribute('aria-hidden', 'true');
  Object.assign(copia.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.append(copia);

  let partito = false;
  const vai = () => {
    if (partito) return;
    partito = true;
    allaFine(() => { copia.remove(); velo.remove(); });
  };
  setTimeout(vai, DURATA_PASSAGGIO + 200);
  copia.animate([
    { transform: 'none', borderRadius: raggio + 'px' },
    // il raggio cresce con la scala: lo si riduce perché all'arrivo sia quello dello schermo
    { transform: `translate(${wrap.left - r.left}px, ${arrivo - r.top}px) scale(${scala})`, borderRadius: (raggio / scala) + 'px' },
  ], { duration: DURATA_PASSAGGIO, easing: CURVA_PASSAGGIO, fill: 'forwards' }).finished.then(vai);
}

/* ---- La sala: il corto aperto dentro la Cortoteca ----
   Invece di cambiare pagina, la Cortoteca mostra la pagina del corto sopra
   la galleria, dove il passaggio ha lasciato il fotogramma. Così il clic
   sulla still è lo stesso gesto che fa partire il video, e il browser lo
   lascia partire con l'audio. L'indirizzo diventa quello del corto (si può
   condividere e ricaricare); "indietro", la crocetta o Esc tornano alla
   galleria. */
let sala = null;
let titoloGalleria = document.title;

function apriSala(o, still, pulisci = () => {}, scriviIndirizzo = true) {
  if (sala) return;
  titoloGalleria = document.title;
  sala = document.getElementById('modello-corto').content.firstElementChild.cloneNode(true);
  sala.ritorno = still;
  document.body.append(sala);
  document.documentElement.classList.add('sala-aperta');
  mostraCorto(o, sala, 450);
  sala.querySelector('.sala-corto__chiudi').addEventListener('click', () => history.back());
  if (scriviIndirizzo) history.pushState({ sala: o.codice }, '', indirizzoOpera(o));

  // Il fotogramma ingrandito resta sopra finché lo schermo della sala non è pronto
  const img = sala.querySelector('.schermo .cornice img');
  const pronto = img && img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  Promise.race([pronto, new Promise((r) => setTimeout(r, 400))]).then(pulisci);
  sala.querySelector('.sala-corto__chiudi').focus({ preventScroll: true });
}

function chiudiSala() {
  if (!sala) return;
  const chiusa = sala;
  sala = null;
  // la sala che svanisce lascia libero il posto a una che si riapre subito
  chiusa.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  document.title = titoloGalleria;
  document.documentElement.classList.remove('sala-aperta');
  document.querySelectorAll('.galleria.ha-fuoco').forEach((g) => g.classList.remove('ha-fuoco'));
  document.querySelectorAll('.still.is-fuoco').forEach((s) => s.classList.remove('is-fuoco'));
  chiusa.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FERMO ? 1 : 320, easing: 'ease-out', fill: 'forwards' })
    .finished.then(() => chiusa.remove());
  setTimeout(() => chiusa.remove(), 450); // di riserva, se l'animazione resta ferma
  if (chiusa.ritorno) chiusa.ritorno.focus({ preventScroll: true });
}

window.addEventListener('popstate', (e) => {
  if (sala && !(e.state && e.state.sala)) { chiudiSala(); return; }
  // Avanti dopo indietro: si riapre il corto, senza animazione
  if (!sala && e.state && e.state.sala) {
    const still = [...document.querySelectorAll('.still')].find((s) => s.opera && s.opera.codice === e.state.sala);
    if (still) apriSala(still.opera, still, undefined, false);
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sala) history.back(); });

document.addEventListener('DOMContentLoaded', avviaCortoteca);
