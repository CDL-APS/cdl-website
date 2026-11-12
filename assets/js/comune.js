/* ==========================================================================
   COMUNE — funzioni che servono a tutte le pagine pubbliche: scritte
   adattate alla larghezza, occhi che seguono il puntatore, disco del
   puntatore, strisce che scorrono, schede, titolo grafico delle opere,
   passaggi animati fra una pagina e l'altra, strisce di foto delle serate.

   Va caricato dopo dati.js e prima dello script della pagina, che ne usa
   le funzioni. Le funzioni sono globali: niente moduli.
   ========================================================================== */

const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72L19 12 8 5.14Z"/></svg>';
// → verso un elenco o un'altra pagina, ↗ per aprire un contenuto
const FRECCIA = '<svg class="freccia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg>';
const FRECCIA_SU = '<svg class="freccia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';
// l'icona del link esterno: solo per ciò che porta fuori dal sito
const ESTERNO = '<svg class="freccia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/></svg>';
const CHIUDI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

// Movimento ridotto: niente passaggi animati, rullini fermi
const FERMO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Un puntatore vero (mouse o trackpad): solo lì il disco che lo accompagna
const PUNTATORE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
// La curva e la durata di tutti i passaggi fra le pagine
const CURVA_PASSAGGIO = 'cubic-bezier(0.65, 0, 0.25, 1)';
const DURATA_PASSAGGIO = 820;

/* ---- Righe a tutta larghezza (.fit): si misura il testo a 100 px e si
   scala, restando un filo sotto la larghezza piena ---- */
function adatta() {
  document.querySelectorAll('.fit').forEach((riga) => {
    const testo = riga.querySelector('.fit-testo');
    // data-fermo: il corpo è già quello giusto (arriva da un'altra pagina)
    if (!testo || !riga.clientWidth || riga.dataset.fermo) return;
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
  // Senza puntatore gli occhi seguono lo scorrimento
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
  const batti = () => {
    if (!occhio.isConnected) return;
    occhio.classList.add('is-chiuso');
    setTimeout(() => occhio.classList.remove('is-chiuso'), 130);
    setTimeout(batti, 4500 + Math.random() * 7000);
  };
  setTimeout(batti, 3000 + Math.random() * 7000);
}

// Gli occhi aggiunti dopo il caricamento (quelli della galleria) vanno accesi a parte
function avviaOcchiNuovi(contenitore) {
  guarda(window.innerWidth * 0.5, window.innerHeight * 0.5);
  contenitore.querySelectorAll('.occhio').forEach(battito);
}

/* ---- Disco del puntatore: sulle immagini con data-cursore dice che cosa
   succede al clic ("Guarda") ---- */
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
   abbia stacco (le copie sono nascoste ai lettori di schermo e fuori dal
   Tab); un pulsante le ferma ---- */
function preparaScorre(blocco) {
  const pista = blocco && blocco.querySelector('.scorre__pista');
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
  });
}

/* ---- Dati: piccole formule usate da più pagine ---- */
function nuovaImmagine(percorso, alt) {
  const img = document.createElement('img');
  img.alt = alt || '';
  mostraImmagine(img, percorso);
  return img;
}

// La pagina di un'opera: una sola pagina per tutte (opera.html?film=codice)
function indirizzoOpera(opera) {
  return 'opera.html?film=' + encodeURIComponent(opera.codice);
}

function dataLunga(giorno) {
  return new Date(giorno + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function dataBreve(giorno) {
  return new Date(giorno + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

// Durata in minuti, se l'opera ce l'ha
function durata(opera) {
  const minuti = Number(opera.durata);
  return minuti > 0 ? `${minuti} min` : '';
}

/* ---- Il titolo grafico di un'opera, nell'ordine:
   1. titolo_png: l'immagine nello spazio immagini di Supabase;
   2. titolo_font: il titolo scritto nel carattere del corto, caricato dallo
      stesso spazio;
   3. un SVG in assets/img/film/titoli/, solo per i codici di TITOLI_GRAFICI
      (copie provvisorie: quei titoli vanno ricaricati dalla gestione);
   4. nessuno: restituisce null e chi chiama scrive il titolo in Montserrat.
   Se l'immagine non arriva, al suo posto compare il titolo scritto. ---- */
const TITOLI_GRAFICI = new Set(['interzona', 'quartolivello', 'relativita', 'vivarevolution']);
const caratteriTitolo = new Map();

// Il titolo scritto, in Montserrat (o nel carattere del corto, vedi sotto)
function titoloScritto(opera, classe = '') {
  const span = document.createElement('span');
  if (classe) span.className = classe;
  span.textContent = opera.titolo;
  return span;
}

function titoloGrafico(opera, { classe = '', alt = opera.titolo } = {}) {
  const testo = () => titoloScritto(opera, classe);
  const immagine = (src) => {
    const img = document.createElement('img');
    img.className = 'targa__grafica';
    img.alt = alt;
    img.addEventListener('error', () => img.replaceWith(testo()), { once: true });
    img.src = src;
    return img;
  };
  if (opera.titolo_png) return immagine(urlImmagine(opera.titolo_png));
  if (opera.titolo_font) {
    const span = testo();
    span.classList.add('targa__font');
    caricaCarattereTitolo(opera)
      .then((famiglia) => { span.style.fontFamily = `"${famiglia}", var(--f-titoli)`; })
      .catch(() => span.classList.remove('targa__font'));
    return span;
  }
  if (TITOLI_GRAFICI.has(opera.codice)) return immagine(`assets/img/film/titoli/${encodeURIComponent(opera.codice)}.svg`);
  return null;
}

// Il carattere del titolo, caricato una volta sola per opera
function caricaCarattereTitolo(opera) {
  if (!caratteriTitolo.has(opera.codice)) {
    const famiglia = 'titolo-' + opera.codice.replace(/[^a-z0-9-]/gi, '');
    const carattere = new FontFace(famiglia, `url(${JSON.stringify(urlImmagine(opera.titolo_font))})`);
    caratteriTitolo.set(opera.codice, carattere.load().then((pronto) => {
      document.fonts.add(pronto);
      return famiglia;
    }));
  }
  return caratteriTitolo.get(opera.codice);
}

/* ---- Schede (Eventi, Produzioni): foto, e sotto il filo titolo e dati.
   Diventa un collegamento solo se ha un indirizzo. Con un logo (gli eventi)
   la scheda mostra il PNG coi suoi colori; se il logo non c'è, la foto. ---- */
function schedaG({ titolo, dati, immagine, logo, href }) {
  const li = document.createElement('li');
  const tag = href ? 'a' : 'div';
  li.innerHTML = `
    <${tag} class="scheda-g"${href ? ` href="${esc(href)}"` : ''}>
      <span class="cornice"></span>
      <span class="scheda-g__testo">
        <span class="scheda-g__titolo">${esc(titolo)}</span>
        <span class="scheda-g__dati">${esc(dati)}</span>
      </span>
    </${tag}>`;
  const cornice = li.querySelector('.cornice');
  if (logo) {
    // --ar (larghezza / altezza) ne regola la misura, vedi components.css
    cornice.classList.add('cornice--logo');
    const img = new Image();
    img.className = 'logo-evento';
    img.alt = '';
    img.onload = () => {
      img.style.setProperty('--ar', (img.naturalWidth / img.naturalHeight).toFixed(4));
      cornice.append(img);
    };
    img.onerror = () => {
      cornice.classList.remove('cornice--logo');
      cornice.append(nuovaImmagine(immagine));
    };
    img.src = logo;
  } else {
    cornice.append(nuovaImmagine(immagine));
  }
  return li;
}

/* Riempie un blocco di schede; senza schede il blocco resta nascosto */
function riempiSchede(id, schede) {
  const blocco = document.getElementById(id);
  blocco.querySelector('.schede').append(...schede.map(schedaG));
  blocco.hidden = schede.length === 0;
}

/* ---- Il passaggio dalla home a una sezione ----
   Al clic su un nome dell'indice il colore della sezione, che il passaggio
   del puntatore ha già acceso, si allarga fino a coprire lo schermo; il nome
   resta sopra e sale fin dove la pagina d'arrivo ha il suo titolo, alla
   stessa misura. Poi si cambia pagina: chi arriva trova il nome già lì. */
const COLORI_SEZIONE = {
  eventi: ['--blu', '--azzurro'],
  produzioni: ['--lilla', '--nero'],
  cortoteca: ['--nero-sala', '--lilla'],
};

// Con Netlify una pagina risponde anche senza ".html" (e la home anche come
// "/"): per confrontare due indirizzi si tolgono entrambe le cose
function percorsoPagina(indirizzo) {
  return indirizzo.replace(/\.html$/, '').replace(/\/index$/, '/');
}

function preparaPassaggi() {
  const indice = document.getElementById('indice');
  if (!indice) return;

  indice.querySelectorAll('.sezione').forEach((sezione) => {
    const nome = Object.keys(COLORI_SEZIONE).find((k) => sezione.classList.contains('sezione--' + k));
    const link = sezione.querySelector('.sezione__nome a');
    // Al passaggio del puntatore la pagina si comincia a caricare
    link.addEventListener('pointerenter', () => {
      if (document.querySelector(`link[rel="prefetch"][href="${link.href}"]`)) return;
      const pre = document.createElement('link');
      pre.rel = 'prefetch';
      pre.href = link.href;
      document.head.append(pre);
    }, { once: true });
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (FERMO) return; // con il movimento ridotto si cambia pagina e basta
      e.preventDefault();
      passaggio(indice, link, COLORI_SEZIONE[nome]);
    });
  });
}

function passaggio(indice, link, [fondo, scritta]) {
  const stile = getComputedStyle(document.documentElement);
  const colore = stile.getPropertyValue(fondo).trim();
  const inchiostro = stile.getPropertyValue(scritta).trim();
  const r = indice.getBoundingClientRect();
  const alto = Math.max(0, r.top);
  const basso = Math.max(0, innerHeight - r.bottom);

  // Il velo parte dal rettangolo della sezione e si allarga a tutto lo schermo
  const velo = document.createElement('div');
  velo.className = 'passaggio';
  velo.style.background = colore;
  document.body.append(velo);
  velo.animate(
    [{ clipPath: `inset(${alto}px 0 ${basso}px 0)` }, { clipPath: 'inset(0 0 0 0)' }],
    { duration: DURATA_PASSAGGIO, easing: CURVA_PASSAGGIO, fill: 'forwards' });

  // Si cambia pagina alla fine dell'animazione; il timer è di riserva, se
  // l'animazione resta ferma (scheda in secondo piano)
  let partito = false;
  const vai = () => { if (!partito) { partito = true; location.href = link.href; } };
  setTimeout(vai, DURATA_PASSAGGIO + 200);

  // Il nome si stacca dalla pagina e sale dove lo aspetta la testata d'arrivo
  const titolo = link.closest('.sezione__nome');
  const t = titolo.getBoundingClientRect();
  const copia = titolo.cloneNode(true);
  copia.classList.add('passaggio__parola');
  Object.assign(copia.style, { left: t.left + 'px', top: t.top + 'px', width: t.width + 'px', color: getComputedStyle(titolo).color });
  document.body.append(copia);
  // La pagina d'arrivo userà lo stesso corpo, senza aspettare di misurarlo
  try {
    sessionStorage.setItem('cdl-passaggio', JSON.stringify({
      pagina: percorsoPagina(new URL(link.href).pathname),
      corpo: titolo.querySelector('.fit').style.fontSize,
      larghezza: innerWidth,
    }));
  } catch (errore) { /* senza memoria di sessione si arriva lo stesso */ }
  const barra = document.querySelector('.nav').offsetHeight;
  const arrivo = barra + (innerWidth <= 639 ? 24 : 40);
  copia.animate(
    [{ transform: 'translateY(0)', color: copia.style.color }, { transform: `translateY(${arrivo - t.top}px)`, color: inchiostro }],
    { duration: DURATA_PASSAGGIO, easing: CURVA_PASSAGGIO, fill: 'forwards' })
    .finished.then(vai);
}

/* Arrivo da un passaggio: il titolo prende subito il corpo che aveva nella
   home e lo tiene finché i caratteri non sono pronti, così non si muove;
   barra e filo compaiono piano (vedi .da-passaggio in components.css).
   Gira appena lo script è letto, prima che la pagina si mostri. */
(function arrivo() {
  let dato = null;
  try {
    dato = JSON.parse(sessionStorage.getItem('cdl-passaggio'));
    sessionStorage.removeItem('cdl-passaggio');
  } catch (errore) { return; }
  if (!dato || dato.pagina !== percorsoPagina(location.pathname)) return;
  document.documentElement.classList.add('da-passaggio');
  const fit = document.querySelector('.parola .fit');
  if (!fit || Math.abs(dato.larghezza - innerWidth) > 1 || !dato.corpo) return;
  fit.style.fontSize = dato.corpo;
  fit.dataset.fermo = 'si';
  const libera = () => { delete fit.dataset.fermo; adatta(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(libera);
  else window.addEventListener('load', libera);
}());

/* Tornando indietro il browser può riaprire la pagina com'era al momento
   del clic: col velo del passaggio, l'immagine ingrandita e la galleria in
   ombra. Il velo si dissolve, il resto torna com'era. */
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  document.querySelectorAll('.passaggio-corto, .passaggio__parola').forEach((el) => el.remove());
  document.querySelectorAll('.galleria.ha-fuoco').forEach((g) => g.classList.remove('ha-fuoco'));
  document.querySelectorAll('.still.is-fuoco').forEach((s) => s.classList.remove('is-fuoco'));
  document.querySelectorAll('.passaggio').forEach((velo) => {
    velo.getAnimations().forEach((a) => a.cancel());
    velo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FERMO ? 1 : 420, easing: 'ease-out', fill: 'forwards' })
      .finished.then(() => velo.remove());
  });
});

/* ---- Le strisce di foto delle serate (pagine degli eventi): le foto del
   post Instagram di ogni serata, alte quanto l'elenco accanto, si scorrono
   col dito, col trackpad, con le frecce della tastiera o coi due tasti, una
   foto alla volta. La linea dice quanto della striscia si è visto. ---- */
function preparaGiostre(radice) {
  radice.querySelectorAll('.giostra').forEach((giostra) => {
    if (giostra.dataset.pronta) return;
    giostra.dataset.pronta = 'si';
    const pista = giostra.querySelector('.giostra__pista');
    const linea = giostra.querySelector('.giostra__linea');
    const [prima, dopo] = giostra.querySelectorAll('.giostra__tasto');
    // Il passo è una foto più lo spazio fra due foto
    const passo = () => {
      const [a, b] = pista.querySelectorAll('img');
      return b ? b.offsetLeft - a.offsetLeft : pista.clientWidth;
    };
    const fine = () => pista.scrollWidth - pista.clientWidth;
    let meta = null;
    const aggiorna = () => {
      const x = pista.scrollLeft;
      if (meta !== null && Math.abs(x - Math.min(meta * passo(), fine())) < 2) meta = null; // arrivata
      linea.style.transform = `scaleX(${pista.scrollWidth ? (x + pista.clientWidth) / pista.scrollWidth : 1})`;
      prima.disabled = x < 2;
      dopo.disabled = x > fine() - 2;
    };
    // Verso una foto precisa: due clic di fila avanzano di due anche se il
    // primo scorrimento non è ancora finito
    const vai = (verso) => {
      const ultima = Math.ceil(fine() / passo());
      meta = Math.min(Math.max((meta ?? Math.round(pista.scrollLeft / passo())) + verso, 0), ultima);
      pista.scrollTo({ left: Math.min(meta * passo(), fine()), behavior: FERMO ? 'auto' : 'smooth' });
    };
    prima.addEventListener('click', () => vai(-1));
    dopo.addEventListener('click', () => vai(1));
    pista.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); vai(e.key === 'ArrowLeft' ? -1 : 1); }
    });
    pista.addEventListener('scroll', aggiorna, { passive: true });
    // le foto arrivano dopo, e la striscia cambia misura con la finestra
    new ResizeObserver(aggiorna).observe(pista);
    pista.querySelectorAll('img').forEach((img) => img.addEventListener('load', aggiorna, { once: true }));
    aggiorna();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  adatta();
  window.addEventListener('resize', adatta);
  window.addEventListener('load', adatta);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(adatta);
  accendiOcchi();
  accendiCursore();
  // Pagina di un evento aperta da sola: la galleria scorre di continuo,
  // come quando si apre dentro Eventi
  if (document.body.classList.contains('pagina-evento')) {
    document.querySelectorAll('.rullino').forEach(preparaScorre);
    preparaGiostre(document);
  }
});
