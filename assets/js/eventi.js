/* ==========================================================================
   EVENTI (eventi.html) — gli eventi per serie: in evidenza l'ultimo Long
   Story Short, poi le edizioni di Short Talks, poi gli altri. Ogni evento
   con una pagina si apre qui sopra, nella sala: composta dal database con
   modello-evento.js (come evento.html) o, per le pagine scritte a mano,
   letta così com'è dal suo file. Si appoggia a dati.js, comune.js e
   modello-evento.js.
   ========================================================================== */

// Il luogo, senza la città: "C'entro Supercinema, Santarcangelo" diventa "C'entro Supercinema"
function luogoBreve(evento) {
  return (evento.luogo || '').split(',')[0].trim();
}

/* Il logo di un evento è un PNG senza fondo: la colonna logo o, per le
   pagine scritte a mano, il file col nome della pagina
   (short-talks-2.html → assets/img/eventi/loghi/short-talks-2.png).
   Se il file non c'è, la scheda mostra la foto del database. */
function logoEvento(evento) {
  if (evento.logo) return urlImmagineEvento(evento.logo);
  const pagina = paginaEvento(evento);
  if (conModello(evento)) return null;
  return pagina ? `assets/img/eventi/loghi/${pagina.replace(/\.html$/, '')}.png` : null;
}

/* Le parole in grassetto nella descrizione di Long Story Short, che arriva
   dal database come testo semplice */
const GRASSETTI_LSS = ['Long Story Short', 'laboratorio collettivo'];

function conGrassetti(testo, parole) {
  return parole.reduce((html, parola) => html.replace(esc(parola), `<strong>${esc(parola)}</strong>`), esc(testo));
}

/* Le edizioni di una serie: si vedono le prime, le altre col tasto "Mostra
   tutte le edizioni", che poi diventa "Mostra meno" */
function preparaEdizioni(lista, visibili) {
  const voci = [...lista.children];
  if (voci.length <= visibili) return;
  const nascoste = voci.slice(visibili);
  const tasto = document.createElement('button');
  tasto.type = 'button';
  tasto.className = 'btn btn--pieno tutte-edizioni';
  tasto.setAttribute('aria-controls', lista.id);
  const imposta = (aperte) => {
    nascoste.forEach((voce) => { voce.hidden = !aperte; });
    tasto.setAttribute('aria-expanded', String(aperte));
    tasto.innerHTML = (aperte ? 'Mostra meno' : 'Mostra tutte le edizioni')
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  };
  tasto.addEventListener('click', () => {
    const aperte = tasto.getAttribute('aria-expanded') !== 'true';
    imposta(aperte);
    if (aperte) nascoste[0].querySelector('a')?.focus({ preventScroll: true });
  });
  imposta(false);
  const riga = document.createElement('div');
  riga.className = 'tutte-edizioni__riga';
  riga.append(tasto);
  lista.after(riga);
}

async function paginaEventi() {
  const eventi = await caricaEventi();
  eventi.forEach((e) => eventiDelModello.set(e.codice, e));
  const lss = eventi.find((e) => e.serie === 'long-story-short');

  // In evidenza: la breve descrizione, fino a due frasi
  if (lss) {
    const frasi = (lss.descrizione || lss.riassunto || '').match(/[^.!?]+[.!?]+/g) || [lss.descrizione || ''];
    document.getElementById('evidenza-descrizione').innerHTML = conGrassetti(frasi.slice(0, 2).join('').trim(), GRASSETTI_LSS);
    const pagina = paginaEvento(lss);
    if (pagina) document.getElementById('evidenza').href = pagina;
  }
  preparaScorre(document.querySelector('.rullino'));

  const scheda = (e) => ({
    titolo: e.titolo,
    dati: [dataBreve(e.data_inizio), luogoBreve(e)].filter(Boolean).join(' · '),
    immagine: e.miniatura || e.copertina || fotoEvento(e)[0]?.immagine,
    logo: logoEvento(e),
    href: paginaEvento(e),
  });
  riempiSchede('blocco-short-talks', eventi.filter((e) => e.serie === 'short-talks').map(scheda));
  preparaEdizioni(document.getElementById('edizioni-short-talks'), 3);
  riempiSchede('blocco-altri', eventi.filter((e) => e !== lss && e.serie !== 'short-talks').map(scheda));

  // Ogni evento si apre qui, sopra la pagina: dalla scheda sale il logo
  // dell'evento (o, senza logo, cresce la foto), da In evidenza il lettering
  // di Long Story Short
  preparaEvento(document.getElementById('evidenza'), '.marchio-serie');
  document.querySelectorAll('a.scheda-g').forEach((link) => preparaEvento(link, '.logo-evento', '.cornice'));
}

/* ---- L'evento aperto dentro la pagina Eventi ----
   Come il corto nella Cortoteca: invece di cambiare pagina, la pagina
   dell'evento (letta dal suo file) si apre sopra gli eventi e l'indirizzo
   diventa il suo, così si può condividere e ricaricare. Al clic l'elemento
   cliccato (il lettering, il logo della scheda) sale fino al suo posto nella
   pagina dell'evento, prendendone il colore, mentre intorno tutto si fa
   carta. "Indietro", la crocetta o Esc tornano agli eventi.
   Si leggono solo pagine del sito (paginaEvento in dati.js): il contenuto
   viene inserito qui così com'è. */
const pagineEvento = new Map();
const eventiDelModello = new Map(); // codice → evento, per la sala composta dal database
let salaEvento = null;
let titoloEventi = document.title;

// evento.html?e=<codice> → il codice; null per le pagine scritte a mano
function codiceDelModello(href) {
  const m = /^evento\.html\?e=([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(href);
  return m && eventiDelModello.has(m[1]) ? m[1] : null;
}

// Una pagina composta dal modello (un oggetto) o l'HTML di un file del sito
function leggiEvento(href) {
  const codice = codiceDelModello(href);
  if (!codice && !/^[a-z0-9-]+\.html$/.test(href)) return Promise.reject(new Error('Non è una pagina del sito: ' + href));
  if (!pagineEvento.has(href)) {
    pagineEvento.set(href, codice ? componiEvento(eventiDelModello.get(codice)) : fetch(href).then((r) => {
      if (!r.ok) throw new Error('Pagina non trovata: ' + href);
      return r.text();
    }));
    pagineEvento.get(href).catch(() => pagineEvento.delete(href));
  }
  return pagineEvento.get(href);
}

async function costruisciEvento(href) {
  const letta = await leggiEvento(href);
  const nuova = document.createElement('div');
  nuova.setAttribute('role', 'dialog');
  nuova.setAttribute('aria-modal', 'true');
  nuova.setAttribute('aria-labelledby', 'titolo-evento');
  const chiudi = `<button class="sala-evento__chiudi" type="button" aria-label="Chiudi e torna agli eventi">${CHIUDI}</button>`;
  if (typeof letta === 'string') {
    const doc = new DOMParser().parseFromString(letta, 'text/html');
    nuova.className = 'sala-evento in-attesa ' + doc.body.className;
    nuova.innerHTML = chiudi + doc.querySelector('main').innerHTML;
    nuova.titolo = doc.title;
  } else {
    nuova.className = 'sala-evento in-attesa pagina-evento';
    nuova.innerHTML = chiudi + letta.html;
    vestiEvento(nuova, nuova, letta);
    nuova.titolo = letta.titolo;
  }
  nuova.href = href;
  return nuova;
}

// La sala si mostra: le entrate partono, la barra passa alla carta
function mostraEvento(nuova, ritorno, scriviIndirizzo) {
  salaEvento = nuova;
  nuova.ritorno = ritorno;
  titoloEventi = document.title;
  document.title = nuova.titolo;
  document.documentElement.classList.add('evento-aperto');
  nuova.classList.remove('in-attesa');
  const rullino = nuova.querySelector('.rullino');
  if (rullino) preparaScorre(rullino);
  preparaGiostre(nuova);
  nuova.querySelector('.sala-evento__chiudi').addEventListener('click', () => history.back());
  if (scriviIndirizzo) history.pushState({ evento: nuova.href }, '', nuova.href);
  nuova.querySelector('.sala-evento__chiudi').focus({ preventScroll: true });
}

async function apriEvento(link, sorgente) {
  if (salaEvento) return;
  const href = link.getAttribute('href');
  let nuova;
  try {
    nuova = await costruisciEvento(href);
  } catch (errore) {
    location.href = href;
    return;
  }
  document.body.append(nuova);
  const arrivo = nuova.querySelector('[data-arrivo]');
  const da = sorgente && sorgente.getBoundingClientRect();
  const a = arrivo && arrivo.getBoundingClientRect();
  // senza movimento, o se manca da dove partire o dove arrivare, si apre e basta
  if (FERMO || !da || !a || !da.width || !a.width) { mostraEvento(nuova, link, true); return; }

  const velo = document.createElement('div');
  velo.className = 'passaggio';
  velo.style.background = getComputedStyle(nuova).backgroundColor;
  document.body.append(velo);
  velo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATA_PASSAGGIO * 0.6, easing: 'ease-out', fill: 'forwards' });

  let copia = sorgente.cloneNode(true);
  let tinta = null;
  if (sorgente.matches('.logo-evento')) {
    // Il logo della scheda ha i suoi colori; quello d'arrivo è la sua
    // sagoma nel colore dell'evento: durante il volo la sagoma compare sopra
    copia = document.createElement('span');
    copia.append(sorgente.cloneNode(true));
    tinta = document.createElement('span');
    tinta.className = 'passaggio-tinta';
    tinta.style.setProperty('--marchio', `url("${sorgente.src}")`);
    tinta.style.background = getComputedStyle(arrivo).color;
    copia.append(tinta);
  }
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
    mostraEvento(nuova, link, true);
    // l'immagine d'arrivo, se c'è, deve essere pronta prima che la copia sparisca
    const img = arrivo.querySelector('img');
    const pronto = img && img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    Promise.race([pronto, new Promise((r) => setTimeout(r, 400))]).then(() => {
      copia.remove();
      velo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(() => velo.remove());
      setTimeout(() => velo.remove(), 300);
    });
  };
  setTimeout(fine, DURATA_PASSAGGIO + 200);
  copia.animate([
    { transform: 'none', color: getComputedStyle(sorgente).color },
    { transform: `translate(${a.left - da.left}px, ${a.top - da.top}px) scale(${a.width / da.width})`, color: getComputedStyle(arrivo).color },
  ], { duration: DURATA_PASSAGGIO, easing: CURVA_PASSAGGIO, fill: 'forwards' }).finished.then(fine);
  if (tinta) tinta.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], { duration: DURATA_PASSAGGIO, easing: 'ease-in-out', fill: 'forwards' });
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
    costruisciEvento(e.state.evento).then((nuova) => {
      document.body.append(nuova);
      mostraEvento(nuova, null, false);
    }).catch(() => { location.href = e.state.evento; });
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && salaEvento) history.back(); });

document.addEventListener('DOMContentLoaded', () => {
  paginaEventi().catch(console.error);
});
