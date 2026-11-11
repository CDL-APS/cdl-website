/* ANTEPRIMA DEL NUOVO SITO — le pagine. Home: la torcia sulla sala, il
   nastro di notizie e le note dell'indice, il rullino che scorre. Cortoteca,
   Eventi, Produzioni, corti e Contatti, coi passaggi fra l'una e l'altra.
   Si appoggia a comune.js e ai dati veri
   (assets/js/dati.js).
   File di prova: non fa parte del sito pubblicato. */

/* La torcia: un cerchio di luce che insegue il puntatore con un po' di
   ritardo. Senza puntatore, o dopo qualche secondo di quiete, passeggia da
   sola fra le poltrone. */
function torcia() {
  const sala = document.querySelector('.hero--sala');
  if (!sala || FERMO) return;

  let x = 0.7, y = 0.42, versoX = x, versoY = y, ultimoMovimento = 0;
  sala.addEventListener('pointermove', (e) => {
    const r = sala.getBoundingClientRect();
    versoX = (e.clientX - r.left) / r.width;
    versoY = (e.clientY - r.top) / r.height;
    ultimoMovimento = performance.now();
  });

  const passo = (ora) => {
    if (ora - ultimoMovimento > 3500) {
      versoX = 0.62 + 0.26 * Math.sin(ora / 4100);
      versoY = 0.45 + 0.22 * Math.sin(ora / 2900 + 1);
    }
    x += (versoX - x) * 0.07;
    y += (versoY - y) * 0.07;
    sala.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
    sala.style.setProperty('--my', (y * 100).toFixed(2) + '%');
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function voceNastro(testo, href) {
  return `<span class="nastro__voce"><a href="${esc(href)}">${esc(testo)}</a><span class="logo" aria-hidden="true"></span></span>`;
}

/* L'elenco breve sotto un nome dell'indice: titolo e, più piccolo, quando */
function elencoBreve(id, voci) {
  const elenco = document.getElementById('elenco-' + id);
  elenco.innerHTML = voci.map((v, i) =>
    `<li style="--i:${i}"><a href="${esc(v.href)}"><span>${esc(v.titolo)}</span><small>${esc(v.quando)}</small></a></li>`).join('');
}

function meseAnno(giorno) {
  return new Date(giorno + 'T12:00:00').toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }).replace('.', '');
}

/* Home: i due elenchi dell'indice (gli ultimi eventi, le ultime produzioni)
   e il nastro delle notizie */
async function home() {
  const [eventi, opere] = await Promise.all([caricaEventi().catch(() => []), caricaOpere().catch(() => [])]);
  const [evento] = eventi;
  const produzioni = produzioniCdl(opere);
  const [produzione] = produzioni;
  const guardabili = daGuardare(opere).length;

  elencoBreve('eventi', eventi.slice(0, 4).map((e) => ({
    titolo: e.titolo, quando: meseAnno(e.data_inizio), href: indirizzoEvento(e) || 'anteprime/eventi.html',
  })));
  elencoBreve('produzioni', produzioni.slice(0, 4).map((o) => ({
    titolo: o.titolo, quando: String(o.anno), href: indirizzoOpera(o),
  })));

  const voci = [];
  if (evento) voci.push(voceNastro(`Ultimo evento: ${evento.titolo}, ${dataLunga(evento.data_inizio)}`, indirizzoEvento(evento) || 'anteprime/eventi.html'));
  if (produzione) voci.push(voceNastro(`Ultima produzione: ${produzione.titolo} (${produzione.anno})`, indirizzoOpera(produzione)));
  if (opere.length) voci.push(voceNastro(`In Cortoteca ${opere.length} opere, ${guardabili} da guardare ora`, 'anteprime/cortoteca.html'));
  voci.push(voceNastro('Quota associativa ridotta per gli ultimi mesi del 2026', 'anteprime/home.html#socio'));

  const nastro = document.getElementById('nastro');
  nastro.querySelector('.scorre__pista').innerHTML = voci.join('');
  preparaScorre(nastro);
}

/* Durata in minuti, se l'opera ce l'ha (la colonna non c'è ancora nel
   database: finché manca la riga ne fa a meno) */
function durata(opera) {
  const minuti = Number(opera.durata);
  return minuti > 0 ? `${minuti} min` : '';
}

/* Cortoteca, vista a lista: l'indice dei titoli e, a fianco, il fotogramma
   dell'opera su cui ci si trova, fermo sotto la barra mentre la lista scorre
   (vedi g.css). Sotto ogni titolo: regista, genere, durata, anno. */
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

/* Le opere che hanno il titolo graficato, ricavato dai titoli di testa e
   salvato in vettoriale come assets/img/film/titoli/<codice>.svg */
const TITOLI_GRAFICI = new Set(['interzona', 'quartolivello', 'relativita', 'vivarevolution']);
// Nella proposta G ogni opera porta alla pagina nuova del corto. Questa
// funzione prende il posto di quella di comune.js, che la galleria usa.
function indirizzoOpera(opera) {
  return 'anteprime/opera.html?film=' + encodeURIComponent(opera.codice);
}

/* Cortoteca, vista a galleria: su ogni fotogramma il titolo (graficato se
   c'è) con regista e anno. Al passaggio svaniscono e resta il fotogramma
   pulito, mentre gli altri arretrano (vedi g.css). */
function galleriaAFuoco(scelte, contenitore) {
  const griglia = disegnaGalleria(scelte, contenitore);
  griglia.querySelectorAll('.still').forEach((still) => {
    const o = still.opera;
    const titolo = TITOLI_GRAFICI.has(o.codice)
      ? `<img class="targa__grafica" src="assets/img/film/titoli/${esc(o.codice)}.svg" alt="${esc(o.titolo)}">`
      : `<span class="targa__titolo">${esc(o.titolo)}</span>`;
    still.querySelector('.targa').innerHTML = titolo;
    still.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || FERMO) return;
      e.preventDefault();
      if (document.getElementById('modello-corto')) passaggioCorto(still, (pulisci) => apriSala(o, still, pulisci));
      else passaggioCorto(still);
    });
  });
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

/* ---- Eventi e Produzioni (pagine) ---- */

function dataBreve(giorno) {
  return new Date(giorno + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

/* Una scheda: foto, e sotto il filo titolo e dati. Diventa un collegamento
   solo se ha un indirizzo. */
function schedaG({ titolo, dati, immagine, logo, href }) {
  const li = document.createElement('li');
  li.innerHTML = `
    <${href ? 'a' : 'div'} class="scheda-g"${href ? ` href="${esc(href)}"` : ''}>
      <span class="cornice"></span>
      <span class="scheda-g__testo">
        <span class="scheda-g__titolo">${esc(titolo)}</span>
        <span class="scheda-g__dati">${esc(dati)}</span>
      </span>
    </${href ? 'a' : 'div'}>`;
  const cornice = li.querySelector('.cornice');
  if (logo) {
    // Il logo dell'evento, senza fondo e nel colore della pagina, come il
    // lettering di Long Story Short; se non c'è, la fotografia
    cornice.classList.add('cornice--logo');
    const prova = new Image();
    prova.onload = () => cornice.append(marchioEvento(logo, prova.naturalWidth / prova.naturalHeight));
    prova.onerror = () => {
      cornice.classList.remove('cornice--logo');
      cornice.append(nuovaImmagine(immagine));
    };
    prova.src = logo;
  } else {
    cornice.append(nuovaImmagine(immagine));
  }
  return li;
}

/* Il logo di un evento come marchio: la sagoma del PNG, ricolorata col
   colore del testo. --ar (larghezza / altezza) ne fissa le proporzioni, così
   il passaggio verso la pagina dell'evento è solo un ingrandimento. */
function marchioEvento(logo, proporzioni) {
  const marchio = document.createElement('span');
  marchio.className = 'marchio-serie marchio-serie--evento';
  marchio.setAttribute('aria-hidden', 'true');
  marchio.style.setProperty('--marchio', `url("/${logo}")`);
  marchio.style.setProperty('--ar', proporzioni.toFixed(4));
  return marchio;
}

/* Riempie un blocco di schede; senza schede il blocco resta nascosto */
function riempiSchede(id, schede) {
  const blocco = document.getElementById(id);
  blocco.querySelector('.schede').append(...schede.map(schedaG));
  blocco.hidden = schede.length === 0;
}

// Il luogo, senza la città: "C'entro Supercinema, Santarcangelo" diventa "C'entro Supercinema"
function luogoBreve(evento) {
  return (evento.luogo || '').split(',')[0].trim();
}

/* Il logo di un evento è un PNG senza fondo, salvato col nome della sua
   pagina: short-talks-1.html → assets/img/eventi/loghi/short-talks-1.png */
function logoEvento(evento) {
  const pagina = (evento.pagina || '').replace(/\.html$/, '');
  return /^[a-z0-9-]+$/.test(pagina) ? `assets/img/eventi/loghi/${pagina}.png` : null;
}

async function paginaEventi() {
  const eventi = await caricaEventi();
  const lss = eventi.find((e) => e.serie === 'long-story-short');

  // In evidenza: la breve descrizione, fino a due frasi
  if (lss) {
    const frasi = (lss.descrizione || lss.riassunto || '').match(/[^.!?]+[.!?]+/g) || [lss.descrizione || ''];
    document.getElementById('evidenza-descrizione').textContent = frasi.slice(0, 2).join('').trim();
    const pagina = indirizzoEvento(lss);
    if (pagina) document.getElementById('evidenza').href = pagina;
  }
  preparaScorre(document.querySelector('.rullino'));

  const scheda = (e) => ({
    titolo: e.titolo,
    dati: [dataBreve(e.data_inizio), luogoBreve(e)].filter(Boolean).join(' · '),
    immagine: e.miniatura || e.copertina,
    logo: logoEvento(e),
    href: indirizzoEvento(e),
  });
  riempiSchede('blocco-short-talks', eventi.filter((e) => e.serie === 'short-talks').map(scheda));
  riempiSchede('blocco-altri', eventi.filter((e) => e !== lss && e.serie !== 'short-talks').map(scheda));

  // Ogni evento si apre qui, sopra la pagina: dalla scheda sale il logo
  // dell'evento (o, senza logo, cresce la foto), da In evidenza il lettering
  // di Long Story Short
  preparaEvento(document.getElementById('evidenza'), '.marchio-serie');
  document.querySelectorAll('a.scheda-g').forEach((scheda) => preparaEvento(scheda, '.marchio-serie', '.cornice'));
}

/* Le pagine degli eventi hanno la loro anteprima G, col nome del file
   attuale: short-talks-1.html → anteprime/short-talks-1.html */
function indirizzoEvento(evento) {
  const pagina = indirizzoSicuro(evento.pagina);
  return pagina && /^[a-z0-9-]+\.html$/.test(pagina) ? 'anteprime/' + pagina : pagina;
}

async function paginaProduzioni() {
  const avviso = (testo) => {
    const el = document.getElementById('avviso-produzioni');
    el.textContent = testo;
    el.hidden = false;
  };
  let opere;
  try {
    opere = await caricaOpere();
  } catch (errore) {
    console.error(errore);
    avviso('Le produzioni non si riescono a caricare. Riprova fra poco.');
    return;
  }
  const produzioni = produzioniCdl(opere);
  const collaborazioni = collaborazioniCdl(opere);
  const [primo] = [...produzioni, ...collaborazioni].sort(dallaPiuRecente);
  if (!primo) { avviso('Nessuna produzione da mostrare.'); return; }

  const box = document.getElementById('primo-piano');
  const href = indirizzoOpera(primo);
  box.querySelector('.cornice').href = href;
  box.querySelector('.cornice').append(nuovaImmagine(primo.fotogramma));
  // Il titolo graficato, se c'è (g.css lo ricolora in nero); se no il testo
  const titolo = box.querySelector('.primo-piano__titolo');
  if (TITOLI_GRAFICI.has(primo.codice)) {
    titolo.innerHTML = `<img src="assets/img/film/titoli/${esc(primo.codice)}.svg" alt="${esc(primo.titolo)}">`;
  } else {
    titolo.textContent = primo.titolo;
  }
  // La frase va a capo dopo la prima virgola: "Non c'eri per l'inizio, / non ci sarai per la fine"
  box.querySelector('.primo-piano__frase').innerHTML = esc(primo.tagline || '').replace(/,\s*/, ',<br>');
  // I dati su righe distinte: regista / genere / anno, durata
  box.querySelector('.primo-piano__dati').innerHTML = [
    primo.regista,
    generePrincipale(primo),
    [primo.anno, durata(primo)].filter(Boolean).join(', '),
  ].filter(Boolean).map((r) => `<span>${esc(r)}</span>`).join('');
  const azione = box.querySelector('.primo-piano__azione');
  azione.href = href;
  azione.innerHTML = streamingDisponibile(primo) ? PLAY + 'Guarda' : 'Scheda' + FRECCIA_SU;
  box.hidden = false;

  const scheda = (o) => ({
    titolo: o.titolo,
    dati: [o.regista, o.anno, o.collaborazione_cdl && o.produzione ? 'con ' + o.produzione : ''].filter(Boolean).join(' · '),
    immagine: o.fotogramma,
    href: indirizzoOpera(o),
  });
  const tranne = (o) => o !== primo;
  riempiSchede('blocco-produzioni', produzioni.filter(tranne).map(scheda));
  riempiSchede('blocco-collaborazioni', collaborazioni.filter(tranne).map(scheda));
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
  const durata = 820;
  // Parte piano e arriva piano: niente scatto all'inizio né alla fine
  const curva = 'cubic-bezier(0.65, 0, 0.25, 1)';

  // Il velo parte dal rettangolo della sezione e si allarga a tutto lo schermo
  const velo = document.createElement('div');
  velo.className = 'passaggio';
  velo.style.background = colore;
  document.body.append(velo);
  velo.animate(
    [{ clipPath: `inset(${alto}px 0 ${basso}px 0)` }, { clipPath: 'inset(0 0 0 0)' }],
    { duration: durata, easing: curva, fill: 'forwards' });

  // Si cambia pagina alla fine dell'animazione; il timer è di riserva, se
  // l'animazione resta ferma (scheda in secondo piano)
  let partito = false;
  const vai = () => { if (!partito) { partito = true; location.href = link.href; } };
  setTimeout(vai, durata + 200);

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
      pagina: new URL(link.href).pathname,
      corpo: titolo.querySelector('.fit').style.fontSize,
      larghezza: innerWidth,
    }));
  } catch (errore) { /* senza memoria di sessione si arriva lo stesso */ }
  const barra = document.querySelector('.nav').offsetHeight;
  const arrivo = barra + (innerWidth <= 639 ? 24 : 40);
  copia.animate(
    [{ transform: 'translateY(0)', color: copia.style.color }, { transform: `translateY(${arrivo - t.top}px)`, color: inchiostro }],
    { duration: durata, easing: curva, fill: 'forwards' })
    .finished.then(vai);
}

/* ---- Il passaggio dalla galleria alla pagina del corto ----
   Il fotogramma si stacca e cresce fino al posto e alla misura dello schermo
   della pagina d'arrivo (stessa larghezza del contenuto, sotto la barra),
   mentre intorno tutto si fa nero. Il titolo, che al passaggio era sparito,
   ricompare sulla pagina d'arrivo. */
function passaggioCorto(still, allaFine) {
  const r = still.getBoundingClientRect();
  const wrap = still.closest('.wrap').getBoundingClientRect();
  const arrivo = document.querySelector('.nav').offsetHeight + (innerWidth <= 639 ? 24 : 40);
  const scala = wrap.width / r.width;
  const durata = 820;
  const curva = 'cubic-bezier(0.65, 0, 0.25, 1)';
  const raggio = parseFloat(getComputedStyle(still).borderTopLeftRadius) || 0;

  const velo = document.createElement('div');
  velo.className = 'passaggio';
  velo.style.background = getComputedStyle(document.documentElement).getPropertyValue('--nero-sala').trim() || '#000';
  document.body.append(velo);
  velo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: durata * 0.6, easing: 'ease-out', fill: 'forwards' });

  const copia = still.cloneNode(true);
  copia.querySelector('.targa')?.remove();
  copia.classList.remove('is-fuoco');
  copia.classList.add('passaggio-corto');
  copia.setAttribute('aria-hidden', 'true');
  Object.assign(copia.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.append(copia);

  if (!allaFine) {
    try {
      sessionStorage.setItem('cdl-passaggio', JSON.stringify({ pagina: new URL(still.href).pathname, larghezza: innerWidth }));
    } catch (errore) { /* si arriva lo stesso */ }
  }

  let partito = false;
  const vai = () => {
    if (partito) return;
    partito = true;
    if (allaFine) allaFine(() => { copia.remove(); velo.remove(); });
    else location.href = still.href;
  };
  setTimeout(vai, durata + 200);
  copia.animate([
    { transform: 'none', borderRadius: raggio + 'px' },
    // il raggio cresce con la scala: lo si riduce perché all'arrivo sia quello dello schermo
    { transform: `translate(${wrap.left - r.left}px, ${arrivo - r.top}px) scale(${scala})`, borderRadius: (raggio / scala) + 'px' },
  ], { duration: durata, easing: curva, fill: 'forwards' }).finished.then(vai);
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

/* ---- L'evento aperto dentro la pagina Eventi ----
   Come il corto nella Cortoteca: invece di cambiare pagina, la pagina
   dell'evento (letta così com'è, dal suo file) si apre sopra gli eventi e
   l'indirizzo diventa il suo, così si può condividere e ricaricare. Al clic
   l'elemento cliccato (il lettering, la grafica della scheda) sale fino al
   suo posto nella pagina dell'evento, prendendone il colore, mentre intorno
   tutto si fa carta. "Indietro", la crocetta o Esc tornano agli eventi. */
const CHIUDI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const pagineEvento = new Map();
let salaEvento = null;
let titoloEventi = document.title;

function leggiEvento(href) {
  if (!pagineEvento.has(href)) {
    pagineEvento.set(href, fetch(href).then((r) => {
      if (!r.ok) throw new Error('Pagina non trovata: ' + href);
      return r.text();
    }));
    pagineEvento.get(href).catch(() => pagineEvento.delete(href));
  }
  return pagineEvento.get(href);
}

async function costruisciEvento(href) {
  const doc = new DOMParser().parseFromString(await leggiEvento(href), 'text/html');
  const sala = document.createElement('div');
  sala.className = 'sala-evento in-attesa ' + doc.body.className;
  sala.setAttribute('role', 'dialog');
  sala.setAttribute('aria-modal', 'true');
  sala.setAttribute('aria-labelledby', 'titolo-evento');
  sala.innerHTML = `<button class="sala-evento__chiudi" type="button" aria-label="Chiudi e torna agli eventi">${CHIUDI}</button>`
    + doc.querySelector('main').innerHTML;
  sala.titolo = doc.title;
  sala.href = href;
  return sala;
}

// La sala si mostra: le entrate partono, la barra passa alla carta
function mostraEvento(sala, ritorno, scriviIndirizzo) {
  salaEvento = sala;
  sala.ritorno = ritorno;
  titoloEventi = document.title;
  document.title = sala.titolo;
  document.documentElement.classList.add('evento-aperto');
  sala.classList.remove('in-attesa');
  const rullino = sala.querySelector('.rullino');
  if (rullino) preparaScorre(rullino);
  sala.querySelector('.sala-evento__chiudi').addEventListener('click', () => history.back());
  if (scriviIndirizzo) history.pushState({ evento: sala.href }, '', sala.href);
  sala.querySelector('.sala-evento__chiudi').focus({ preventScroll: true });
}

async function apriEvento(link, sorgente) {
  if (salaEvento) return;
  const href = link.getAttribute('href');
  let sala;
  try {
    sala = await costruisciEvento(href);
  } catch (errore) {
    location.href = href;
    return;
  }
  document.body.append(sala);
  const arrivo = sala.querySelector('[data-arrivo]');
  if (FERMO || !sorgente || !arrivo) { mostraEvento(sala, link, true); return; }

  const da = sorgente.getBoundingClientRect();
  const a = arrivo.getBoundingClientRect();
  const durata = 820;
  const curva = 'cubic-bezier(0.65, 0, 0.25, 1)';

  const velo = document.createElement('div');
  velo.className = 'passaggio';
  velo.style.background = getComputedStyle(sala).backgroundColor;
  document.body.append(velo);
  velo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: durata * 0.6, easing: 'ease-out', fill: 'forwards' });

  const copia = sorgente.cloneNode(true);
  copia.classList.add('passaggio-corto');
  copia.setAttribute('aria-hidden', 'true');
  Object.assign(copia.style, {
    left: da.left + 'px', top: da.top + 'px', width: da.width + 'px', height: da.height + 'px', maxWidth: 'none',
    color: getComputedStyle(sorgente).color,
  });
  document.body.append(copia);

  let arrivata = false;
  const fine = () => {
    if (arrivata) return;
    arrivata = true;
    mostraEvento(sala, link, true);
    // l'immagine d'arrivo, se c'è, deve essere pronta prima che la copia sparisca
    const img = arrivo.querySelector('img');
    const pronto = img && img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    Promise.race([pronto, new Promise((r) => setTimeout(r, 400))]).then(() => {
      copia.remove();
      velo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(() => velo.remove());
      setTimeout(() => velo.remove(), 300);
    });
  };
  setTimeout(fine, durata + 200);
  copia.animate([
    { transform: 'none', color: getComputedStyle(sorgente).color },
    { transform: `translate(${a.left - da.left}px, ${a.top - da.top}px) scale(${a.width / da.width})`, color: getComputedStyle(arrivo).color },
  ], { duration: durata, easing: curva, fill: 'forwards' }).finished.then(fine);
}

function chiudiEvento() {
  if (!salaEvento) return;
  const chiusa = salaEvento;
  salaEvento = null;
  chiusa.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  document.title = titoloEventi;
  document.documentElement.classList.remove('evento-aperto');
  chiusa.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FERMO ? 1 : 320, easing: 'ease-out', fill: 'forwards' })
    .finished.then(() => chiusa.remove());
  setTimeout(() => chiusa.remove(), 450); // di riserva, se l'animazione resta ferma
  if (chiusa.ritorno) chiusa.ritorno.focus({ preventScroll: true });
}

// Al passaggio del puntatore la pagina dell'evento si comincia a leggere; al
// clic si apre qui (con un tasto premuto, il browser fa come sempre). Sale
// il primo elemento trovato fra i selettori, nell'ordine dato.
function preparaEvento(link, ...selettori) {
  if (!link || !link.getAttribute('href')) return;
  link.addEventListener('pointerenter', () => leggiEvento(link.getAttribute('href')).catch(() => {}), { once: true });
  link.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    apriEvento(link, selettori.map((s) => link.querySelector(s)).find(Boolean));
  });
}

window.addEventListener('popstate', (e) => {
  if (salaEvento && !(e.state && e.state.evento)) { chiudiEvento(); return; }
  // Avanti dopo indietro: si riapre l'evento, senza passaggio
  if (!salaEvento && e.state && e.state.evento) {
    costruisciEvento(e.state.evento).then((sala) => {
      document.body.append(sala);
      mostraEvento(sala, null, false);
    }).catch(() => { location.href = e.state.evento; });
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && salaEvento) history.back(); });

/* ---- La pagina del corto ---- */

// Il colore del titolo: quello più usato nei tracciati del suo file
async function coloreTitolo(codice) {
  const testo = await fetch(`assets/img/film/titoli/${encodeURIComponent(codice)}.svg`).then((r) => r.text());
  const conta = {};
  (testo.match(/fill="(#[0-9a-fA-F]{6})"/g) || []).forEach((f) => {
    const c = f.slice(6, 13).toLowerCase();
    conta[c] = (conta[c] || 0) + 1;
  });
  return Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0] || null;
}

// Luminosità percepita di un colore #rrggbb, da 0 (nero) a 1 (bianco)
function luminosita(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* Lo schermo del corto come lettore. Il fotogramma col titolo fa da
   copertina; sotto c'è già il video, pronto. Toccando lo schermo (o con
   Invio) il video parte e la copertina si dissolve. Arrivando dalla
   Cortoteca col passaggio parte da solo, appena ricomparso il titolo: dove
   il browser non lascia partire un video con l'audio senza un tocco su
   questa pagina, resta il lettore pronto col suo tasto di avvio. */
function lettore(schermo, embed, titolo, ritardo = null) {
  schermo.classList.add('schermo--lettore');
  schermo.setAttribute('role', 'button');
  schermo.setAttribute('tabindex', '0');
  schermo.setAttribute('aria-label', 'Guarda ' + titolo);
  schermo.dataset.cursore = 'Guarda';
  schermo.insertAdjacentHTML('beforeend', `<span class="disco schermo__play" aria-hidden="true">${PLAY}Guarda</span>`);

  let partito = false;
  const avvia = () => {
    if (partito) return;
    partito = true;
    const indirizzo = embed.replace('autoplay=0', 'autoplay=1') + (embed.includes('youtube') ? '&playsinline=1' : '');
    const video = document.createElement('iframe');
    video.title = titolo;
    video.allow = 'autoplay; fullscreen; picture-in-picture';
    video.allowFullscreen = true;
    video.src = indirizzo;
    // il video entra sotto la copertina, che si dissolve quando è pronto
    schermo.querySelector('.cornice').prepend(video);
    video.addEventListener('load', () => schermo.classList.add('is-in-onda'), { once: true });
    setTimeout(() => schermo.classList.add('is-in-onda'), 2500);
    schermo.removeAttribute('role');
    schermo.removeAttribute('tabindex');
    schermo.removeAttribute('aria-label');
    delete schermo.dataset.cursore;
  };
  schermo.addEventListener('click', avvia);
  schermo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avvia(); }
  });
  if (ritardo !== null) setTimeout(avvia, FERMO ? 0 : ritardo);
}

async function paginaCorto() {
  const codice = new URLSearchParams(location.search).get('film');
  let o = null;
  try {
    o = codice ? await caricaOpera(codice) : null;
  } catch (errore) {
    console.error(errore);
  }
  if (!o) { document.getElementById('corto-avviso').hidden = false; return; }
  // Arrivando col passaggio dalla Cortoteca il video prova a partire da solo
  mostraCorto(o, document.body, document.documentElement.classList.contains('da-passaggio') ? 900 : null);
}

/* Riempie la pagina del corto. radice è dove si posa il colore del titolo
   (il body della pagina, o la sala aperta dentro la Cortoteca); con
   ritardoAvvio il video parte da solo dopo quel tempo. */
function mostraCorto(o, radice, ritardoAvvio = null) {
  document.title = `${o.titolo} – CDL APS (anteprima G)`;
  document.getElementById('titolo-corto').textContent = o.titolo;

  // Lo schermo: il fotogramma col titolo graficato (o scritto)
  const schermo = document.getElementById('schermo');
  schermo.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
  const targa = document.getElementById('schermo-titolo');
  if (TITOLI_GRAFICI.has(o.codice)) {
    targa.innerHTML = `<img class="targa__grafica" src="assets/img/film/titoli/${esc(o.codice)}.svg" alt="">`;
    coloreTitolo(o.codice).then((c) => {
      if (c && luminosita(c) > 0.12) radice.style.setProperty('--titolo', c);
      else if (c) radice.style.setProperty('--titolo', 'var(--chiaro)');
    }).catch(console.error);
  } else {
    targa.innerHTML = `<span class="targa__titolo">${esc(o.titolo)}</span>`;
  }

  document.getElementById('corto-frase').textContent = o.tagline || '';
  document.getElementById('corto-sinossi').textContent = o.sinossi || '';

  // Se il corto è in streaming lo schermo è già il lettore (vedi lettore())
  const embed = getEmbedUrl(o.video_url);
  if (embed) lettore(schermo, embed, o.titolo, ritardoAvvio);

  const voce = (nome, valore) => (valore ? `<div><dt>${nome}</dt><dd>${esc(valore)}</dd></div>` : '');
  document.getElementById('corto-dati').innerHTML = [
    voce('Regia', o.regista),
    voce('Anno', String(o.anno)),
    voce('Genere', (o.generi || []).map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')),
    voce('Durata', durata(o)),
    voce('Produzione', o.produzione),
  ].join('');
  document.getElementById('corto').hidden = false;

  const interpreti = (o.interpreti || []).map((i) => (i.ruolo ? `${i.nome} (${i.ruolo})` : i.nome)).join(', ');
  const crediti = [
    voce('Sceneggiatura', o.sceneggiatura), voce('Produttore', o.produttore), voce('Fotografia', o.fotografia),
    voce('Montaggio', o.montaggio), voce('Colonna sonora', o.colonna_sonora), voce('Scenografia', o.scenografia),
    voce('Trucco', o.trucco), voce('Costumi', o.costumi), voce('Interpreti', interpreti),
  ].join('');
  if (crediti) {
    document.getElementById('crediti').innerHTML = crediti;
    document.getElementById('blocco-crediti').hidden = false;
  }
}

/* Tornando indietro (dalla pagina del corto o da una sezione) il browser
   può riaprire la pagina com'era al momento del clic: col velo nero, il
   fotogramma ingrandito e la galleria in ombra. Il velo si dissolve, il resto
   torna com'era. */
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

/* Arrivo da un passaggio: il titolo prende subito il corpo che aveva nella
   home e lo tiene finché i caratteri non sono pronti, così non si muove;
   barra e filo compaiono piano (vedi .da-passaggio in g.css). Gira appena
   lo script è letto, prima che la pagina si mostri. */
(function arrivo() {
  let dato = null;
  try {
    dato = JSON.parse(sessionStorage.getItem('cdl-passaggio'));
    sessionStorage.removeItem('cdl-passaggio');
  } catch (errore) { return; }
  if (!dato || dato.pagina !== location.pathname) return;
  document.documentElement.classList.add('da-passaggio');
  const fit = document.querySelector('.parola .fit');
  if (!fit || Math.abs(dato.larghezza - innerWidth) > 1 || !dato.corpo) return;
  fit.style.fontSize = dato.corpo;
  fit.dataset.fermo = 'si';
  const libera = () => { delete fit.dataset.fermo; adatta(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(libera);
  else window.addEventListener('load', libera);
}());

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('opere')) avviaCortoteca({ lista: listaConPalco, galleria: galleriaAFuoco });
  if (document.getElementById('nastro')) {
    home().catch(console.error);
    torcia();
    preparaScorre(document.getElementById('sale'));
    preparaPassaggi();
  }
  if (document.body.classList.contains('pagina-eventi')) paginaEventi().catch(console.error);
  if (document.body.classList.contains('pagina-produzioni')) paginaProduzioni();
  if (document.body.classList.contains('pagina-corto')) paginaCorto();
  // Contatti: all'invio il tasto resta arancio e dice che il messaggio parte
  const modulo = document.querySelector('form.modulo');
  if (modulo) {
    // ?motivo=socio (dal tasto Diventa socio) sceglie già il motivo
    const motivo = new URLSearchParams(location.search).get('motivo');
    const scelta = motivo && document.getElementById('motivo-' + motivo);
    if (scelta) scelta.checked = true;
    // Il motivo sceglie il modulo Netlify (e quindi l'indirizzo che riceve la
    // mail) e l'oggetto: "[Sito CDL] <oggetto> – <nome>". Vedi genera.py.
    const aggiornaInvio = () => {
      const scelto = modulo.querySelector('input[name="motivo"]:checked');
      const nome = modulo.elements.nome.value.trim();
      modulo.elements['form-name'].value = scelto?.dataset.modulo || 'contatti';
      modulo.elements.subject.value = `[Sito CDL] ${scelto?.dataset.oggetto || 'Messaggio dal sito'}${nome ? ' – ' + nome : ''}`;
    };
    modulo.addEventListener('change', aggiornaInvio);
    modulo.addEventListener('input', aggiornaInvio);
    aggiornaInvio();
    modulo.addEventListener('submit', () => {
      aggiornaInvio();
      const invia = modulo.querySelector('button[type="submit"]');
      invia.classList.add('is-inviato');
      invia.textContent = 'Invio in corso…';
    });
  }
});
