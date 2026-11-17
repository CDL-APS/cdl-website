/* ==========================================================================
   GESTIONE — scheda Rullino: le foto che scorrono in home (tabella rullino,
   vedi supabase/migrations/20261112200000_rullino_home.sql).

   In alto le foto scelte, nell'ordine del rullino, con i tasti per spostarle
   e toglierle, "Mescola" per un ordine a caso e il conto per provenienza
   (per tenere il rullino in equilibrio). Sotto, le foto disponibili divise per provenienza:
   - Eventi: le gallerie delle pagine evento, lette dalle pagine stesse (una
     galleria nuova compare appena la pagina dell'evento è nel sito), più
     copertina e miniatura di ogni evento. Portano all'evento;
   - Cortoteca: il fotogramma di ogni corto. Porta alla pagina del corto;
   - Altre foto: caricate qui, nella cartella rullino/ dello spazio
     immagini. Per ognuna si sceglie la pagina a cui porta.
   Un clic su una foto la aggiunge in fondo al rullino, un altro la toglie.
   Ogni modifica si salva subito: la home la vede al caricamento successivo.

   Viene dopo gestione.js e ne usa client, stato e le funzioni di
   riservato.js e dati.js ($, avviso, messaggioErrore, formattaData,
   ridimensiona, urlImmagine, urlImmagineLocale, paginaEvento, conModello,
   fotoEvento, esc).
   ========================================================================== */

const PROVENIENZE = {
  eventi: ['Eventi', 'Le foto delle gallerie delle pagine evento, più copertina e miniatura di ogni evento. Al clic portano all\'evento. Una galleria nuova compare da sola appena la pagina dell\'evento è nel sito.'],
  // la chiave resta "cortoteca", ma sono i fotogrammi di tutte le opere,
  // produzioni comprese (e la Cortoteca è in pausa dal 17 novembre 2026)
  cortoteca: ['Fotogrammi delle opere', 'Il fotogramma di ogni corto. Al clic porta alla pagina del corto.'],
  altre: ['Altre foto', 'Foto caricate apposta per il rullino: backstage, associazione, serate senza pagina. Per ognuna scegli dove porta. Un clic su una foto già caricata la rimette nel rullino.']
};

// Le pagine del sito a cui può portare un'altra foto
const PAGINE_SITO = [
  ['eventi.html', 'Eventi'],
  ['produzioni.html', 'Produzioni'],
  ...(CORTOTECA_ATTIVA ? [['cortoteca.html', 'Cortoteca']] : []),
  ['vantaggi-tesseramento.html', 'Vantaggi per i soci'],
  ['contatti.html', 'Contatti']
];

const CARTELLA_RULLINO = 'rullino';

const rullino = {
  righe: [],             // la tabella rullino, in ordine
  provenienza: 'eventi', // provenienza mostrata sotto
  eventi: null,          // tutti gli eventi, letti una volta
  opere: null,           // tutte le opere, lette una volta
  gallerie: new Map(),   // pagina evento → promessa delle sue foto
  occupato: false        // una scrittura in corso: i clic aspettano
};

/* La provenienza di una foto si legge dal percorso */
function provenienzaDi(immagine) {
  if (immagine.startsWith(CARTELLA_RULLINO + '/')) return 'altre';
  if (immagine.startsWith('opere/')) return 'cortoteca';
  return 'eventi';
}

/* Un'immagine del sito (assets/…) o dello spazio immagini, con la copia
   locale se lo spazio non ce l'ha */
function immagineRullino(percorso, alt = '') {
  const img = document.createElement('img');
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  if (percorso.startsWith('assets/')) {
    img.src = percorso;
  } else {
    const locale = urlImmagineLocale(percorso);
    if (locale) img.addEventListener('error', () => { img.src = locale; }, { once: true });
    img.src = urlImmagine(percorso);
  }
  return img;
}

/* --------------------------------------------------------------------------
   Dati
   -------------------------------------------------------------------------- */
async function caricaRighe() {
  const { data, error } = await client.from('rullino')
    .select('id, immagine, descrizione, evento_id, opera_id, pagina, posizione')
    .order('posizione').order('id');
  if (error) throw error;
  rullino.righe = data;
}

async function caricaFonti() {
  if (!rullino.eventi) {
    const { data, error } = await client.from('eventi')
      .select('id, codice, titolo, data_inizio, pagina, presentazione, blocchi, copertina, miniatura, pubblicato')
      .order('data_inizio', { ascending: false });
    if (error) throw error;
    rullino.eventi = data;
  }
  if (!rullino.opere) {
    const { data, error } = await client.from('opere')
      .select('id, titolo, anno, regista, fotogramma, pubblicata')
      .order('anno', { ascending: false }).order('id', { ascending: false });
    if (error) throw error;
    rullino.opere = data;
  }
}

/* Le foto della galleria di una pagina evento, lette dal suo HTML: le
   immagini di assets/img/eventi/ nel <main>, senza i loghi degli eventi e
   dei partner. Il documento
   letto è inerte: niente script, niente immagini caricate. */
function galleria(pagina) {
  if (!rullino.gallerie.has(pagina)) {
    rullino.gallerie.set(pagina, fetch(pagina)
      .then((r) => (r.ok ? r.text() : ''))
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const viste = new Set();
        return [...doc.querySelectorAll('main img[src^="assets/img/eventi/"]')]
          .map((img) => ({ immagine: img.getAttribute('src'), descrizione: img.getAttribute('alt') || '' }))
          .filter((f) => !/\/(loghi|partner)\//.test(f.immagine) && !viste.has(f.immagine) && viste.add(f.immagine));
      })
      .catch(() => []));
  }
  return rullino.gallerie.get(pagina);
}

/* Dove porta una riga, in parole */
function collegamentoInParole(riga) {
  if (riga.evento_id) {
    const evento = rullino.eventi.find((e) => e.id === riga.evento_id);
    return 'porta a ' + (evento ? evento.titolo : 'Eventi');
  }
  if (riga.opera_id) {
    const opera = rullino.opere.find((o) => o.id === riga.opera_id);
    return 'porta a ' + (opera ? opera.titolo : 'un corto');
  }
  const pagina = PAGINE_SITO.find(([file]) => file === riga.pagina);
  return pagina ? 'porta a ' + pagina[1] : 'non porta da nessuna parte';
}

/* Il valore del menu "Porta a" e le colonne che ne derivano */
function valoreCollegamento(riga) {
  if (riga.evento_id) return 'evento:' + riga.evento_id;
  if (riga.opera_id) return 'opera:' + riga.opera_id;
  return riga.pagina ? 'pagina:' + riga.pagina : 'nessuna';
}

function colonneCollegamento(valore) {
  const [tipo, cosa] = (valore || '').split(':');
  return {
    evento_id: tipo === 'evento' ? Number(cosa) : null,
    opera_id: tipo === 'opera' ? Number(cosa) : null,
    pagina: tipo === 'pagina' ? cosa : null
  };
}

/* Il menu "Porta a": le pagine del sito, poi ogni evento e ogni corto.
   Nel modulo di caricamento (daScegliere) si parte da "Scegli…": nessun
   collegamento va scelto apposta, con "Nessuna pagina". */
function riempiCollegamenti(select, scelto = 'nessuna', daScegliere = false) {
  const opzione = (valore, testo) => `<option value="${esc(valore)}"${valore === scelto ? ' selected' : ''}>${esc(testo)}</option>`;
  select.innerHTML =
    (daScegliere ? '<option value="" disabled selected>Scegli dove porta</option>' : '') +
    opzione('nessuna', 'Nessuna pagina (la foto non si clicca)') +
    `<optgroup label="Pagine del sito">${PAGINE_SITO.map(([file, nome]) => opzione('pagina:' + file, nome)).join('')}</optgroup>` +
    `<optgroup label="Un evento">${rullino.eventi.map((e) => opzione('evento:' + e.id, e.titolo)).join('')}</optgroup>` +
    `<optgroup label="Un corto">${rullino.opere.map((o) => opzione('opera:' + o.id, o.titolo)).join('')}</optgroup>`;
}

/* --------------------------------------------------------------------------
   Scrittura: aggiungi, togli, sposta, modifica
   -------------------------------------------------------------------------- */
async function scrivi(azione) {
  if (rullino.occupato) return;
  rullino.occupato = true;
  try {
    await azione();
  } catch (errore) {
    avviso(messaggioErrore(errore), true);
  } finally {
    try { await caricaRighe(); } catch (errore) { console.error(errore); }
    rullino.occupato = false;
    disegnaScelte();
    aggiornaTessere();
  }
}

async function aggiungiFoto(foto) {
  const posizione = Math.max(0, ...rullino.righe.map((r) => r.posizione)) + 1;
  const { immagine, descrizione = '', evento_id = null, opera_id = null, pagina = null } = foto;
  const { error } = await client.from('rullino').insert({ immagine, descrizione, evento_id, opera_id, pagina, posizione });
  if (error) throw error;
}

async function togliFoto(id) {
  const { error } = await client.from('rullino').delete().eq('id', id);
  if (error) throw error;
}

/* Riscrive le posizioni 1, 2, 3… nell'ordine dato (solo quelle cambiate) */
async function salvaOrdine(righe) {
  const esiti = await Promise.all(righe
    .map((riga, i) => ({ riga, posizione: i + 1 }))
    .filter(({ riga, posizione }) => riga.posizione !== posizione)
    .map(({ riga, posizione }) => client.from('rullino').update({ posizione }).eq('id', riga.id)));
  const fallito = esiti.find((e) => e.error);
  if (fallito) throw fallito.error;
}

function sposta(i, verso) {
  const j = i + verso;
  if (j < 0 || j >= rullino.righe.length) return;
  const righe = rullino.righe.slice();
  [righe[i], righe[j]] = [righe[j], righe[i]];
  scrivi(() => salvaOrdine(righe));
}

/* Mescola l'ordine del rullino (Fisher–Yates) e lo salva */
function mescola() {
  const righe = rullino.righe.slice();
  for (let i = righe.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [righe[i], righe[j]] = [righe[j], righe[i]];
  }
  scrivi(() => salvaOrdine(righe));
}

function modifica(id, colonne) {
  scrivi(async () => {
    const { error } = await client.from('rullino').update(colonne).eq('id', id);
    if (error) throw error;
  });
}

/* Un clic su una foto disponibile: se è già nel rullino la toglie,
   altrimenti la aggiunge in fondo */
function scegliFoto(foto) {
  const presente = rullino.righe.find((r) => r.immagine === foto.immagine);
  scrivi(() => (presente ? togliFoto(presente.id) : aggiungiFoto(foto)));
}

/* --------------------------------------------------------------------------
   Le foto nel rullino
   -------------------------------------------------------------------------- */
function tastoIcona(testo, etichetta, azione, disattivo = false) {
  const tasto = document.createElement('button');
  tasto.type = 'button';
  tasto.className = 'g-icona';
  tasto.textContent = testo;
  tasto.setAttribute('aria-label', etichetta);
  tasto.disabled = disattivo;
  tasto.addEventListener('click', azione);
  return tasto;
}

function disegnaScelte() {
  const lista = $('rullino-scelte');
  const righe = rullino.righe;
  const conta = { eventi: 0, cortoteca: 0, altre: 0 };
  righe.forEach((r) => { conta[provenienzaDi(r.immagine)] += 1; });
  $('rullino-equilibrio').textContent = righe.length
    ? `${righe.length} foto: ${conta.eventi} dagli eventi, ${conta.cortoteca} dalle opere, ${conta.altre} ${conta.altre === 1 ? 'altra' : 'altre'}.`
    : '';
  $('mescola-rullino').disabled = righe.length < 2;
  if (!righe.length) {
    lista.innerHTML = '<li class="g-vuoto">Il rullino è vuoto: in home non scorre nessuna foto. Scegli qui sotto.</li>';
    return;
  }

  lista.replaceChildren(...righe.map((riga, i) => {
    const voce = document.createElement('li');
    voce.className = 'g-scelta';

    const foto = document.createElement('div');
    foto.className = 'g-scelta__foto';
    foto.append(immagineRullino(riga.immagine, riga.descrizione));

    const dati = document.createElement('p');
    dati.className = 'g-scelta__dati';
    dati.innerHTML = `<strong>${i + 1}</strong> ${esc(PROVENIENZE[provenienzaDi(riga.immagine)][0])} · ${esc(collegamentoInParole(riga))}`;

    const comandi = document.createElement('div');
    comandi.className = 'g-scelta__comandi';
    comandi.append(
      tastoIcona('←', 'Sposta prima', () => sposta(i, -1), i === 0),
      tastoIcona('→', 'Sposta dopo', () => sposta(i, 1), i === righe.length - 1),
      tastoIcona('✕', 'Togli dal rullino', () => scrivi(() => togliFoto(riga.id))));

    voce.append(foto, dati);

    // Le altre foto: descrizione e collegamento si cambiano qui
    if (provenienzaDi(riga.immagine) === 'altre') {
      const descrizione = document.createElement('label');
      descrizione.className = 'g-campo';
      descrizione.innerHTML = '<span>Descrizione</span><input type="text">';
      const campo = descrizione.querySelector('input');
      campo.value = riga.descrizione;
      campo.addEventListener('change', () => modifica(riga.id, { descrizione: campo.value.trim() }));

      const porta = document.createElement('label');
      porta.className = 'g-campo';
      porta.innerHTML = '<span>Porta a</span><select></select>';
      const menu = porta.querySelector('select');
      riempiCollegamenti(menu, valoreCollegamento(riga));
      menu.addEventListener('change', () => modifica(riga.id, colonneCollegamento(menu.value)));
      voce.append(descrizione, porta);
    }

    voce.append(comandi);
    return voce;
  }));
}

/* --------------------------------------------------------------------------
   Le foto disponibili, per provenienza
   -------------------------------------------------------------------------- */
function tessera(foto, didascalia = '') {
  const tasto = document.createElement('button');
  tasto.type = 'button';
  tasto.className = 'g-foto';
  tasto.dataset.immagine = foto.immagine;
  tasto.setAttribute('aria-label', foto.descrizione || didascalia || 'Foto');
  const cornice = document.createElement('span');
  cornice.className = 'g-foto__cornice';
  cornice.append(immagineRullino(foto.immagine));
  const segno = document.createElement('span');
  segno.className = 'g-foto__segno';
  segno.setAttribute('aria-hidden', 'true');
  segno.textContent = 'Nel rullino';
  cornice.append(segno);
  tasto.append(cornice);
  if (didascalia) {
    const testo = document.createElement('span');
    testo.className = 'g-foto__didascalia';
    testo.textContent = didascalia;
    tasto.append(testo);
  }
  tasto.addEventListener('click', () => scegliFoto(foto));
  return tasto;
}

/* Le tessere già nel rullino si vedono segnate (e il clic le toglie) */
function aggiornaTessere() {
  const scelte = new Set(rullino.righe.map((r) => r.immagine));
  document.querySelectorAll('#rullino-fonte .g-foto').forEach((tasto) => {
    tasto.setAttribute('aria-pressed', String(scelte.has(tasto.dataset.immagine)));
  });
}

function disegnaGruppo({ titolo, dettaglio, foto }) {
  const gruppo = document.createElement('section');
  gruppo.className = 'g-gruppo-foto';
  if (titolo) {
    const testa = document.createElement('h3');
    testa.className = 'g-gruppo-foto__titolo';
    testa.textContent = titolo;
    if (dettaglio) {
      const piccolo = document.createElement('small');
      piccolo.textContent = dettaglio;
      testa.append(' ', piccolo);
    }
    gruppo.append(testa);
  }
  const griglia = document.createElement('div');
  griglia.className = 'g-foto-griglia';
  griglia.append(...foto.map((f) => tessera(f, f.didascalia)));
  gruppo.append(griglia);
  return gruppo;
}

async function gruppiEventi() {
  const gruppi = await Promise.all(rullino.eventi.map(async (evento) => {
    const pagina = paginaEvento(evento);
    // le pagine composte dal database hanno le foto nei blocchi
    const dellaPagina = conModello(evento) ? fotoEvento(evento) : pagina ? await galleria(pagina) : [];
    const delDatabase = [
      [evento.copertina, 'Copertina di ' + evento.titolo],
      [evento.miniatura, 'Miniatura di ' + evento.titolo]
    ].filter(([percorso]) => percorso && !dellaPagina.some((f) => f.immagine === percorso))
      .map(([immagine, descrizione]) => ({ immagine, descrizione }));
    // le foto dell'evento già nel rullino che la sua pagina non mostra più
    const nelRullino = rullino.righe
      .filter((r) => r.evento_id === evento.id && provenienzaDi(r.immagine) === 'eventi')
      .filter((r) => ![...dellaPagina, ...delDatabase].some((f) => f.immagine === r.immagine))
      .map((r) => ({ immagine: r.immagine, descrizione: r.descrizione }));
    const foto = [...nelRullino, ...dellaPagina, ...delDatabase].map((f) => ({ ...f, evento_id: evento.id }));
    const dettaglio = [formattaData(evento.data_inizio), evento.pubblicato ? '' : 'non pubblicato', pagina ? '' : 'senza pagina']
      .filter(Boolean).join(' · ');
    return { titolo: evento.titolo, dettaglio, foto };
  }));
  return gruppi.filter((g) => g.foto.length);
}

function gruppiCortoteca() {
  const foto = rullino.opere.filter((o) => o.fotogramma).map((o) => ({
    immagine: o.fotogramma,
    descrizione: 'Un fotogramma di ' + o.titolo,
    opera_id: o.id,
    didascalia: `${o.titolo}${o.anno ? ' · ' + o.anno : ''}${o.pubblicata ? '' : ' · non pubblicata'}`
  }));
  return foto.length ? [{ titolo: '', foto }] : [];
}

async function gruppiAltre() {
  const { data, error } = await client.storage.from(BUCKET_IMMAGINI)
    .list(CARTELLA_RULLINO, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  const foto = data.filter((f) => f.id && /\.(jpe?g|png|webp)$/i.test(f.name)).map((f) => {
    const immagine = `${CARTELLA_RULLINO}/${f.name}`;
    const riga = rullino.righe.find((r) => r.immagine === immagine);
    return { immagine, descrizione: riga ? riga.descrizione : '' };
  });
  return foto.length ? [{ titolo: 'Già caricate', foto }] : [];
}

async function mostraProvenienza(nome) {
  rullino.provenienza = nome;
  document.querySelectorAll('.g-provenienza').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.provenienza === nome)));
  $('rullino-nota').textContent = PROVENIENZE[nome][1];
  $('modulo-altra-foto').hidden = nome !== 'altre';
  const fonte = $('rullino-fonte');
  fonte.innerHTML = '<p class="g-vuoto">Caricamento…</p>';
  let gruppi;
  try {
    if (nome === 'eventi') gruppi = await gruppiEventi();
    else if (nome === 'cortoteca') gruppi = gruppiCortoteca();
    else gruppi = await gruppiAltre();
  } catch (errore) {
    fonte.innerHTML = `<p class="g-vuoto">${esc(messaggioErrore(errore))}</p>`;
    return;
  }
  if (rullino.provenienza !== nome) return;
  if (!gruppi.length) {
    fonte.innerHTML = `<p class="g-vuoto">${nome === 'altre' ? 'Ancora nessuna foto caricata: usa il modulo qui sopra.' : 'Nessuna foto da questa provenienza.'}</p>`;
    return;
  }
  fonte.replaceChildren(...gruppi.map(disegnaGruppo));
  aggiornaTessere();
}

/* --------------------------------------------------------------------------
   La scheda
   -------------------------------------------------------------------------- */
async function mostraRullino() {
  $('rullino-scelte').innerHTML = '<li class="g-vuoto">Caricamento…</li>';
  try {
    await Promise.all([caricaRighe(), caricaFonti()]);
  } catch (errore) {
    $('rullino-scelte').innerHTML = `<li class="g-vuoto">${esc(messaggioErrore(errore))}</li>`;
    return;
  }
  if (stato.scheda !== 'rullino') return;
  riempiCollegamenti($('modulo-altra-foto').collegamento, '', true);
  disegnaScelte();
  mostraProvenienza(rullino.provenienza);
}

$('mescola-rullino').addEventListener('click', mescola);

document.querySelectorAll('.g-provenienza').forEach((tasto) => {
  tasto.addEventListener('click', () => mostraProvenienza(tasto.dataset.provenienza));
});

$('modulo-altra-foto').file.addEventListener('change', (e) => {
  $('altra-foto-nome').textContent = e.target.files[0]?.name || '';
});

/* Carica un'altra foto (ridimensionata come tutte le immagini della
   gestione) e la aggiunge in fondo al rullino */
$('modulo-altra-foto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const modulo = e.currentTarget;
  const file = modulo.file.files[0];
  const descrizione = modulo.descrizione.value.trim();
  if (!file) {
    avviso('Scegli prima la foto da caricare.', true);
    return;
  }
  if (!descrizione) {
    avviso('Scrivi una breve descrizione della foto.', true);
    modulo.descrizione.focus();
    return;
  }
  if (!modulo.collegamento.value) {
    avviso('Scegli dove porta la foto al clic.', true);
    modulo.collegamento.focus();
    return;
  }
  const tasto = modulo.querySelector('[type=submit]');
  tasto.disabled = true;
  await scrivi(async () => {
    const blob = await ridimensiona(file);
    const immagine = `${CARTELLA_RULLINO}/${Date.now()}.jpg`;
    const { error } = await client.storage.from(BUCKET_IMMAGINI).upload(immagine, blob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false
    });
    if (error) throw error;
    await aggiungiFoto({ immagine, descrizione, ...colonneCollegamento(modulo.collegamento.value) });
    modulo.reset();
    riempiCollegamenti(modulo.collegamento, '', true);
    $('altra-foto-nome').textContent = '';
    avviso('Foto caricata e aggiunta in fondo al rullino.');
  });
  tasto.disabled = false;
  mostraProvenienza('altre');
});
