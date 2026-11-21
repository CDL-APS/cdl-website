/* ==========================================================================
   GESTIONE — Dashboard: l'indice del sito e la vetrina della home (tabella
   vetrina, vedi supabase/migrations/20261121120000_vetrina_home.sql).

   In cima le slide della vetrina, nell'ordine in cui scorrono in home: la
   sala (l'apertura, sempre presente: si sposta ma non si toglie) e i
   contenuti in evidenza. Di ogni contenuto si possono riscrivere titolo,
   riga di testo, invito e colore, cambiare l'immagine (caricata nella
   cartella vetrina/ dello spazio immagini) o spegnerlo per un po'. Un campo
   vuoto prende il valore della pagina a cui la slide porta, che si vede in
   grigio come suggerimento.
   Sotto, l'indice di tutte le pagine del sito: le pagine fisse
   (PAGINE_SITO in dati.js), ogni evento e ogni corto, con il loro stato,
   il collegamento per aprirli e il tasto per metterli in vetrina (o
   toglierli). Ogni modifica si salva subito: la home la vede al
   caricamento successivo.

   Viene dopo gestione.js e gestione-rullino.js e ne usa client, stato,
   caricaFonti (eventi e opere, anche non pubblicati, in rullino.eventi e
   rullino.opere), immagineRullino e tastoIcona; da riservato.js e dati.js
   $, avviso, messaggioErrore, formattaData, ridimensiona, BUCKET_IMMAGINI,
   PAGINE_SITO, paginaEvento, esc.
   ========================================================================== */

const CARTELLA_VETRINA = 'vetrina';
const IMMAGINE_SALA = 'assets/img/sfondi/wallpaper-cdl.jpg';

const vetrinaGestione = {
  righe: [],       // la tabella vetrina, in ordine
  occupato: false  // una scrittura in corso: i clic aspettano
};

/* --------------------------------------------------------------------------
   Dati
   -------------------------------------------------------------------------- */
async function caricaSlide() {
  const { data, error } = await client.from('vetrina')
    .select('id, tipo, evento_id, opera_id, pagina, titolo, testo, invito, immagine, lettering, colore, colore_testo, attiva, posizione')
    .order('posizione').order('id');
  if (error) throw error;
  vetrinaGestione.righe = data;
}

function indirizzoCorto(opera) {
  return 'opera.html?film=' + encodeURIComponent(opera.codice);
}

function dataEstesa(giorno) {
  return giorno ? new Date(giorno + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

/* Dove porta una slide: che cos'è, come si chiama, il suo indirizzo, se è
   pubblicata, e i valori che la home ne ricava quando i campi sono vuoti
   (gli stessi di ricavaSlide in home.js) */
function destinazione(riga) {
  if (riga.tipo === 'apertura') {
    return { tipo: 'Apertura', nome: 'La sala vista dall\'alto', href: 'index.html', pubblicata: true, ricavati: { immagine: IMMAGINE_SALA } };
  }
  if (riga.evento_id) {
    const e = rullino.eventi.find((x) => x.id === riga.evento_id);
    if (!e) return { tipo: 'Evento', nome: 'un evento eliminato', href: null, pubblicata: false, ricavati: {} };
    const futuro = e.data_inizio >= new Date().toLocaleDateString('sv');
    return {
      tipo: 'Evento', nome: e.titolo, href: paginaEvento(e), pubblicata: e.pubblicato,
      ricavati: {
        titolo: e.titolo,
        testo: [dataEstesa(e.data_inizio), (e.luogo || '').split(',')[0].trim()].filter(Boolean).join(' · '),
        invito: futuro ? 'Scopri l\'evento' : 'Vai all\'evento',
        immagine: e.copertina || e.miniatura,
        colore: e.colore,
        lettering: letteringEvento(e)
      }
    };
  }
  if (riga.opera_id) {
    const o = rullino.opere.find((x) => x.id === riga.opera_id);
    if (!o) return { tipo: 'Corto', nome: 'un corto eliminato', href: null, pubblicata: false, ricavati: {} };
    return {
      tipo: 'Corto', nome: o.titolo, href: indirizzoCorto(o), pubblicata: o.pubblicata,
      ricavati: {
        titolo: o.titolo,
        testo: [o.regista && 'Regia di ' + o.regista, o.anno].filter(Boolean).join(', '),
        invito: 'Apri la scheda del corto',
        immagine: o.fotogramma,
        colore: o.colore,
        lettering: letteringOpera(o)
      }
    };
  }
  const p = PAGINE_SITO.find((x) => x.pagina === riga.pagina) || { nome: riga.pagina };
  return {
    tipo: 'Pagina', nome: p.nome, href: riga.pagina, pubblicata: true,
    ricavati: { titolo: p.nome, invito: 'Apri la pagina', colore: p.colore, fondo: p.fondo }
  };
}

/* --------------------------------------------------------------------------
   Scrittura: aggiungi, togli, sposta, modifica
   -------------------------------------------------------------------------- */
async function scriviVetrina(azione) {
  if (vetrinaGestione.occupato) return;
  vetrinaGestione.occupato = true;
  try {
    await azione();
  } catch (errore) {
    avviso(messaggioErrore(errore), true);
  } finally {
    try { await caricaSlide(); } catch (errore) { console.error(errore); }
    vetrinaGestione.occupato = false;
    if (stato.scheda === 'dashboard') {
      disegnaSlide();
      disegnaIndice();
    }
  }
}

// Una slide nuova va in fondo: si sposta poi coi tasti
async function aggiungiSlide(collegamento) {
  const posizione = Math.max(0, ...vetrinaGestione.righe.map((r) => r.posizione)) + 1;
  const { error } = await client.from('vetrina').insert({ tipo: 'contenuto', posizione, ...collegamento });
  if (error) throw error;
}

async function togliSlide(id) {
  const { error } = await client.from('vetrina').delete().eq('id', id);
  if (error) throw error;
}

/* Riscrive le posizioni 1, 2, 3… nell'ordine dato (solo quelle cambiate) */
async function salvaOrdineVetrina(righe) {
  const esiti = await Promise.all(righe
    .map((riga, i) => ({ riga, posizione: i + 1 }))
    .filter(({ riga, posizione }) => riga.posizione !== posizione)
    .map(({ riga, posizione }) => client.from('vetrina').update({ posizione }).eq('id', riga.id)));
  const fallito = esiti.find((e) => e.error);
  if (fallito) throw fallito.error;
}

function spostaSlide(i, verso) {
  const j = i + verso;
  const righe = vetrinaGestione.righe.slice();
  if (j < 0 || j >= righe.length) return;
  [righe[i], righe[j]] = [righe[j], righe[i]];
  scriviVetrina(() => salvaOrdineVetrina(righe));
}

function modificaSlide(id, colonne) {
  scriviVetrina(async () => {
    const { error } = await client.from('vetrina').update(colonne).eq('id', id);
    if (error) throw error;
  });
}

// L'immagine di una slide: ridimensionata come tutte, nella cartella vetrina/
function caricaImmagineSlide(id, file) {
  scriviVetrina(async () => {
    const blob = await ridimensiona(file);
    const immagine = `${CARTELLA_VETRINA}/${Date.now()}.jpg`;
    const { error } = await client.storage.from(BUCKET_IMMAGINI).upload(immagine, blob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false
    });
    if (error) throw error;
    const { error: errore } = await client.from('vetrina').update({ immagine }).eq('id', id);
    if (errore) throw errore;
    avviso('Immagine caricata.');
  });
}

/* Il lettering di una slide: un PNG senza fondo, caricato com'è (niente
   ridimensionamento, che lo convertirebbe in JPEG e gli toglierebbe la
   trasparenza), nella cartella vetrina/ */
const LETTERING_MASSIMO = 4 * 1024 * 1024;

function caricaLetteringSlide(id, file) {
  if (file.type !== 'image/png') {
    avviso('Il lettering dev\'essere un PNG senza fondo.', true);
    return;
  }
  if (file.size > LETTERING_MASSIMO) {
    avviso('Il PNG è troppo pesante (più di 4 MB): esportalo più piccolo, basta una larghezza di 2000 px.', true);
    return;
  }
  scriviVetrina(async () => {
    const lettering = `${CARTELLA_VETRINA}/${Date.now()}-lettering.png`;
    const { error } = await client.storage.from(BUCKET_IMMAGINI).upload(lettering, file, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false
    });
    if (error) throw error;
    const { error: errore } = await client.from('vetrina').update({ lettering }).eq('id', id);
    if (errore) throw errore;
    avviso('Lettering caricato.');
  });
}

/* --------------------------------------------------------------------------
   Le slide della vetrina
   -------------------------------------------------------------------------- */
function campoTesto(etichetta, valore, suggerimento, salva) {
  const campo = document.createElement('label');
  campo.className = 'g-campo';
  campo.innerHTML = `<span>${esc(etichetta)}</span><input type="text">`;
  const input = campo.querySelector('input');
  input.value = valore || '';
  input.placeholder = suggerimento || '';
  input.addEventListener('change', () => salva(input.value.trim() || null));
  return campo;
}

// L'anteprima della slide: l'immagine (o il fondo) e, sopra, il lettering
// (il lettering a maschera nel colore del titolo, come in home; se il file
// non c'è non si vede niente, come in home dove resta il titolo scritto)
function anteprimaSlide(percorso, fondo, lettering, colore) {
  const cornice = document.createElement('div');
  cornice.className = 'g-scelta__foto g-slide__foto';
  if (fondo) cornice.style.setProperty('background', fondo);
  if (percorso) cornice.append(immagineRullino(percorso));
  if (lettering) {
    const indirizzo = new URL(lettering, location.href).href;
    const prova = new Image();
    prova.onload = () => {
      const scritta = document.createElement('span');
      scritta.className = 'g-slide__lettering';
      scritta.setAttribute('aria-hidden', 'true');
      scritta.style.setProperty('--lettering', `url("${indirizzo}")`);
      scritta.style.setProperty('background-color', /^#[0-9a-f]{6}$/i.test(colore || '') ? colore : '#f7f7f7');
      cornice.append(scritta);
    };
    prova.crossOrigin = 'anonymous';
    prova.src = indirizzo;
  }
  return cornice;
}

function disegnaSlide() {
  const lista = $('vetrina-slide');
  const righe = vetrinaGestione.righe;
  lista.replaceChildren(...righe.map((riga, i) => {
    const dove = destinazione(riga);
    const r = dove.ricavati;
    const voce = document.createElement('li');
    voce.className = 'g-slide' + (riga.attiva ? '' : ' g-slide--spenta');

    const lettering = indirizzoLettering(riga.lettering) || (riga.titolo ? null : r.lettering);
    voce.append(anteprimaSlide(riga.immagine || r.immagine, r.fondo, lettering, riga.colore || r.colore));

    const testa = document.createElement('div');
    testa.className = 'g-slide__testa';
    const stati = [];
    if (!riga.attiva) stati.push('spenta');
    if (!dove.pubblicata) stati.push('non pubblicato: in home non si vede');
    testa.innerHTML = `
      <p class="g-scelta__dati"><strong>${i + 1}</strong> ${esc(dove.tipo)}${stati.length ? ` · <span class="g-slide__stato">${esc(stati.join(' · '))}</span>` : ''}</p>
      <p class="g-slide__nome">${esc(riga.titolo || dove.nome)}</p>
      ${dove.href ? `<a class="g-slide__apri" href="${esc(dove.href)}" target="_blank" rel="noopener">Apri la pagina ↗</a>` : ''}`;
    voce.append(testa);

    if (riga.tipo === 'apertura') {
      const nota = document.createElement('p');
      nota.className = 'g-nota-tenue';
      nota.textContent = 'La sala al buio con la torcia: è sempre nella vetrina. Si sposta, ma non si toglie.';
      voce.append(nota);
    } else {
      const campi = document.createElement('div');
      campi.className = 'g-slide__campi';
      campi.append(
        campoTesto('Titolo', riga.titolo, r.titolo, (v) => modificaSlide(riga.id, { titolo: v })),
        campoTesto('Riga di testo', riga.testo, r.testo, (v) => modificaSlide(riga.id, { testo: v })),
        campoTesto('Invito', riga.invito, r.invito, (v) => modificaSlide(riga.id, { invito: v }))
      );

      // I colori: del titolo (e del lettering) e del testo sotto (riga e
      // tasto); quelli della pagina o uno scelto qui
      const sceltaColore = (etichetta, colonna, ricavato) => {
        const campo = document.createElement('div');
        campo.className = 'g-campo g-slide__colore';
        campo.innerHTML = `
          <span>${esc(etichetta)}</span>
          <div class="g-slide__colore-riga">
            <label class="g-spunta"><input type="checkbox"> Scegli un colore</label>
            <input type="color" aria-label="${esc(etichetta)}">
          </div>`;
        const spunta = campo.querySelector('[type=checkbox]');
        const tavolozza = campo.querySelector('[type=color]');
        spunta.checked = Boolean(riga[colonna]);
        tavolozza.value = riga[colonna] || (/^#[0-9a-f]{6}$/i.test(ricavato || '') ? ricavato.toLowerCase() : '#f7f7f7');
        tavolozza.disabled = !riga[colonna];
        spunta.addEventListener('change', () => modificaSlide(riga.id, { [colonna]: spunta.checked ? tavolozza.value.toLowerCase() : null }));
        tavolozza.addEventListener('change', () => modificaSlide(riga.id, { [colonna]: tavolozza.value.toLowerCase() }));
        return campo;
      };
      campi.append(
        sceltaColore('Colore del titolo o del lettering', 'colore', r.colore),
        // il testo, se non ha un colore suo, prende quello del titolo
        sceltaColore('Colore del testo e del tasto (vuoto: come il titolo)', 'colore_testo', riga.colore || r.colore));

      // L'immagine: quella della pagina o una caricata qui
      const immagine = document.createElement('div');
      immagine.className = 'g-campo g-campo--largo';
      immagine.innerHTML = `
        <span>Immagine</span>
        <div class="g-immagine-azioni">
          <label class="btn">${riga.immagine ? 'Cambia immagine' : 'Carica un\'altra immagine'}<input type="file" accept="image/*" hidden></label>
          ${riga.immagine ? '<button type="button" class="btn">Torna a quella della pagina</button>' : ''}
        </div>
        <small>${riga.immagine ? 'Questa slide ha un\'immagine sua.' : r.immagine ? 'Ora usa l\'immagine della pagina.' : 'La pagina non ha un\'immagine: la slide ha il fondo della sezione.'}</small>`;
      immagine.querySelector('[type=file]').addEventListener('change', (e) => {
        if (e.target.files[0]) caricaImmagineSlide(riga.id, e.target.files[0]);
      });
      immagine.querySelector('button')?.addEventListener('click', () => modificaSlide(riga.id, { immagine: null }));
      campi.append(immagine);

      // Il lettering: se c'è, prende il posto del titolo scritto
      const scritta = document.createElement('div');
      scritta.className = 'g-campo g-campo--largo';
      const stato = riga.lettering ? 'Questa slide ha un lettering suo: al posto del titolo scritto.'
        : riga.titolo ? 'Nessun lettering: col titolo riscritto qui si vede il titolo scritto.'
        : r.lettering ? `Ora usa il lettering ${dove.tipo === 'Corto' ? 'del corto' : 'dell\'evento'}, se il sito ce l'ha; altrimenti il titolo scritto.`
        : 'Nessun lettering: si vede il titolo scritto.';
      scritta.innerHTML = `
        <span>Lettering</span>
        <div class="g-immagine-azioni">
          <label class="btn">${riga.lettering ? 'Cambia lettering' : 'Carica un lettering'}<input type="file" accept="image/png" hidden></label>
          ${riga.lettering ? '<button type="button" class="btn">Togli il lettering</button>' : ''}
        </div>
        <small>${esc(stato)} PNG senza fondo: prende il colore del titolo.</small>`;
      scritta.querySelector('[type=file]').addEventListener('change', (e) => {
        if (e.target.files[0]) caricaLetteringSlide(riga.id, e.target.files[0]);
      });
      scritta.querySelector('button')?.addEventListener('click', () => modificaSlide(riga.id, { lettering: null }));
      campi.append(scritta);

      const attiva = document.createElement('label');
      attiva.className = 'g-spunta';
      attiva.innerHTML = '<input type="checkbox"> Mostra in home';
      const casella = attiva.querySelector('input');
      casella.checked = riga.attiva;
      casella.addEventListener('change', () => modificaSlide(riga.id, { attiva: casella.checked }));
      campi.append(attiva);
      voce.append(campi);
    }

    const comandi = document.createElement('div');
    comandi.className = 'g-scelta__comandi';
    comandi.append(
      tastoIcona('↑', 'Sposta prima', () => spostaSlide(i, -1), i === 0),
      tastoIcona('↓', 'Sposta dopo', () => spostaSlide(i, 1), i === righe.length - 1));
    if (riga.tipo !== 'apertura') {
      comandi.append(tastoIcona('✕', 'Togli dalla vetrina', () => {
        if (confirm(`Togliere "${riga.titolo || dove.nome}" dalla vetrina?`)) scriviVetrina(() => togliSlide(riga.id));
      }));
    }
    voce.append(comandi);
    return voce;
  }));
}

/* --------------------------------------------------------------------------
   L'indice delle pagine del sito, ad albero come il sito: le sezioni della
   barra (più la home) e, dentro, le loro pagine. Dentro Eventi ogni evento
   (e le pagine che stanno nella sua, come la cornice narrativa in Long
   Story Short), dentro Produzioni i corti di CDL, dentro Sostieni la
   domanda di ammissione. Gli altri corti stanno nella Cortoteca, oggi in
   pausa: le loro pagine si aprono ancora.
   -------------------------------------------------------------------------- */
/* Il carattere di un evento (colonna carattere degli eventi): quello della
   sua grafica, che la vetrina usa nella sua slide. La pagina dell'evento lo
   dichiara nel suo CSS: qui si dice al resto del sito. */
function sceltaCarattere(evento) {
  const campo = document.createElement('label');
  campo.className = 'g-indice__carattere';
  campo.innerHTML = '<span>Carattere</span><select></select>';
  const menu = campo.querySelector('select');
  menu.innerHTML = ['', ...Object.keys(CARATTERI)].map((nome) =>
    `<option value="${esc(nome)}"${(evento.carattere || '') === nome ? ' selected' : ''}>${esc(nome || 'Montserrat (del sito)')}</option>`).join('');
  menu.setAttribute('aria-label', `Carattere di ${evento.titolo}`);
  menu.addEventListener('change', () => scriviVetrina(async () => {
    const { error } = await client.from('eventi').update({ carattere: menu.value || null }).eq('id', evento.id);
    if (error) throw error;
    evento.carattere = menu.value || null;
    avviso(`Carattere di ${evento.titolo}: ${menu.value || 'Montserrat'}.`);
  }));
  return campo;
}

function rigaIndice({ nome, dettaglio, href, collegamento, nota, sezione, evento, figli = [] }) {
  const voce = document.createElement('li');
  voce.className = 'g-indice__voce' + (sezione ? ' g-indice__voce--sezione' : '');
  const riga = document.createElement('div');
  riga.className = 'g-indice__riga';
  const testo = document.createElement('div');
  testo.className = 'g-indice__testo';
  testo.innerHTML = `<span class="g-indice__nome">${esc(nome)}</span>${dettaglio ? `<span class="g-indice__dettaglio">${esc(dettaglio)}</span>` : ''}`;
  riga.append(testo);

  const azioni = document.createElement('div');
  azioni.className = 'g-indice__azioni';
  if (evento) azioni.append(sceltaCarattere(evento));
  if (nota) {
    const piccola = document.createElement('span');
    piccola.className = 'g-indice__nota';
    piccola.textContent = nota;
    azioni.append(piccola);
  }
  if (href) {
    const apri = document.createElement('a');
    apri.className = 'btn g-indice__apri';
    apri.href = href;
    apri.target = '_blank';
    apri.rel = 'noopener';
    apri.innerHTML = `Apri <span aria-hidden="true">↗</span><span class="sr-only"> ${esc(nome)} in una nuova scheda</span>`;
    azioni.append(apri);
  }
  if (collegamento) {
    const presente = vetrinaGestione.righe.find((r) =>
      (collegamento.evento_id && r.evento_id === collegamento.evento_id)
      || (collegamento.opera_id && r.opera_id === collegamento.opera_id)
      || (collegamento.pagina && r.pagina === collegamento.pagina));
    const tasto = document.createElement('button');
    tasto.type = 'button';
    tasto.className = 'btn g-indice__vetrina' + (presente ? ' is-in-vetrina' : ' btn--pieno');
    tasto.textContent = presente ? 'Togli dalla vetrina' : 'Metti in vetrina';
    tasto.setAttribute('aria-label', `${tasto.textContent}: ${nome}`);
    tasto.addEventListener('click', () => scriviVetrina(() => (presente ? togliSlide(presente.id) : aggiungiSlide(collegamento))));
    azioni.append(tasto);
  }
  riga.append(azioni);
  voce.append(riga);
  if (figli.length) {
    const lista = document.createElement('ul');
    lista.className = 'g-indice__figli';
    lista.append(...figli.map(rigaIndice));
    voce.append(lista);
  }
  return voce;
}

// Una pagina fissa di PAGINE_SITO, con le pagine che stanno dentro di lei
function nodoPagina(p, sezione = false) {
  return {
    nome: p.nome, dettaglio: p.pagina, href: p.pagina, sezione,
    collegamento: { pagina: p.pagina },
    figli: PAGINE_SITO.filter((f) => f.dentro === p.pagina).map((f) => nodoPagina(f))
  };
}

function nodoCorto(o) {
  return {
    nome: o.titolo,
    dettaglio: [o.anno, o.regista, o.pubblicata ? '' : 'non pubblicato'].filter(Boolean).join(' · '),
    href: o.codice ? indirizzoCorto(o) : null,
    collegamento: { opera_id: o.id }
  };
}

function alberoSito() {
  const sezioni = PAGINE_SITO.filter((p) => !p.dentro);
  // le pagine che stanno dentro la pagina di un evento (non in una sezione)
  const dentroEventi = PAGINE_SITO.filter((p) => p.dentro && !sezioni.some((x) => x.pagina === p.dentro));
  const eventi = rullino.eventi.map((e) => {
    const pagina = paginaEvento(e);
    return {
      nome: e.titolo,
      dettaglio: [formattaData(e.data_inizio), e.pubblicato ? '' : 'non pubblicato', pagina || 'senza pagina'].filter(Boolean).join(' · '),
      href: pagina,
      collegamento: { evento_id: e.id },
      evento: e,
      figli: dentroEventi.filter((p) => pagina && p.dentro === pagina).map((p) => nodoPagina(p))
    };
  });
  // le pagine dentro un evento che non c'è (più) restano sotto Eventi
  const orfane = dentroEventi.filter((p) => !rullino.eventi.some((e) => paginaEvento(e) === p.dentro)).map((p) => nodoPagina(p));
  const produzioni = rullino.opere.filter((o) => o.produzione_cdl || o.collaborazione_cdl);
  const altri = rullino.opere.filter((o) => !o.produzione_cdl && !o.collaborazione_cdl);

  const nodi = sezioni.map((p) => {
    const nodo = nodoPagina(p, true);
    if (p.pagina === 'index.html') {
      delete nodo.collegamento;
      nodo.nota = 'La sala è sempre in vetrina';
    }
    if (p.pagina === 'eventi.html') nodo.figli = [...eventi, ...orfane, ...nodo.figli];
    if (p.pagina === 'produzioni.html') nodo.figli = [...produzioni.map(nodoCorto), ...nodo.figli];
    if (p.pagina === 'cortoteca.html') nodo.figli = [...altri.map(nodoCorto), ...nodo.figli];
    return nodo;
  });
  // Cortoteca in pausa: i suoi corti restano raggiungibili dalla loro pagina
  if (!CORTOTECA_ATTIVA && altri.length) {
    const dopo = nodi.findIndex((n) => n.href === 'produzioni.html') + 1;
    nodi.splice(dopo, 0, {
      nome: 'Cortoteca', dettaglio: 'in pausa: la sezione non si apre, le pagine dei corti sì', sezione: true,
      figli: altri.map(nodoCorto)
    });
  }
  return nodi;
}

function disegnaIndice() {
  const lista = document.createElement('ul');
  lista.className = 'g-indice__lista';
  lista.append(...alberoSito().map(rigaIndice));
  $('indice-pagine').replaceChildren(lista);
}

/* --------------------------------------------------------------------------
   La scheda
   -------------------------------------------------------------------------- */
async function mostraIndice() {
  $('vetrina-slide').innerHTML = '<li class="g-vuoto">Caricamento…</li>';
  $('indice-pagine').innerHTML = '';
  try {
    await Promise.all([caricaSlide(), caricaFonti()]);
  } catch (errore) {
    $('vetrina-slide').innerHTML = `<li class="g-vuoto">${esc(messaggioErrore(errore))}</li>`;
    return;
  }
  if (stato.scheda !== 'dashboard') return;
  disegnaSlide();
  disegnaIndice();
}
