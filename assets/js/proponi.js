/* ==========================================================================
   PROPONI — pagina dei soci per proporre un corto alla Cortoteca.

   Si entra con il collegamento personale (proponi.html#invito=…): la Edge
   Function "accesso-socio" lo scambia con una sessione, senza password. Il
   socio compila la scheda in quattro passi, salvata a ogni modifica, e sceglie
   se il corto si potrà guardare in Cortoteca ("streaming") o se propone la
   sola scheda ("scheda"). Da quella scelta dipendono le domande del
   questionario e il testo da accettare: la licenza completa, oppure
   l'autorizzazione breve per la scheda. Da qui rilegge le ricevute e ritira
   i propri corti.

   Tutti i controlli che contano (quota, proprietà della proposta, licenza)
   li fa il database: vedi supabase/migrations/20261111140100.

   Usa da dati.js: SUPABASE_URL, SUPABASE_CHIAVE, getEmbedUrl, esc.
   Usa da riservato.js: creaClient, $, mostraVista, avviso, messaggioErrore,
   formattaData, formattaDataOra, ridimensiona, aggiungiInterprete,
   leggiInterpreti, aggiungiRuolo, leggiRuoli, riconosciFileTitolo,
   mimeDaPercorso, descriviRisposte, testoRicevuta, scaricaTesto, TIPI_LICENZA.
   ========================================================================== */

const client = creaClient('cdl-socio');

const FUNZIONE_ACCESSO = SUPABASE_URL + '/functions/v1/accesso-socio';
const SPAZIO_PROPOSTE = 'proposte';
const ATTESA_SALVATAGGIO = 900; // ms dopo l'ultima battuta

// Campi della scheda, con lo stesso nome delle colonne di public.opere
const CAMPI = [
  'titolo', 'anno', 'durata', 'regista', 'generi', 'produzione', 'tagline',
  'sinossi', 'note_regia', 'fotografia', 'sceneggiatura', 'montaggio',
  'produttore', 'colonna_sonora', 'scenografia', 'suono', 'costumi',
  'video_url', 'file_url', 'letterboxd_url', 'imdb_url'
];

const stato = {
  utente: null,     // utente di Supabase
  socio: null,      // risposta di stato_socio()
  testi: {},        // testo in vigore per tipo: { streaming, scheda }
  proposte: [],
  licenze: [],
  opere: [],
  proposta: null,   // proposta aperta nel modulo
  opera: null,      // oppure opera già online di cui si accetta la licenza
  passo: 1,
  ricevuta: null    // licenza mostrata nella vista "ricevuta"
};

const modulo = $('modulo-proposta');

/* --------------------------------------------------------------------------
   Accesso
   -------------------------------------------------------------------------- */
function senzaAccesso(titolo, testo) {
  $('utente').hidden = true;
  if (titolo) $('senza-accesso-titolo').textContent = titolo;
  if (testo) $('senza-accesso-testo').textContent = testo;
  mostraVista('senza-accesso');
}

/* Scambia il collegamento personale con una sessione */
async function entraConInvito(invito) {
  const risposta = await fetch(FUNZIONE_ACCESSO, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_CHIAVE },
    body: JSON.stringify({ invito })
  });
  if (!risposta.ok) return false;
  const { token_hash, tipo } = await risposta.json();
  const { error } = await client.auth.verifyOtp({ token_hash, type: tipo });
  return !error;
}

async function avvia() {
  // Il collegamento sta dopo il cancelletto, così non finisce nei registri
  // dei server; lo si toglie subito anche dalla barra degli indirizzi
  const trovato = location.hash.match(/invito=([0-9a-f]{64})/);
  if (location.hash) history.replaceState(null, '', location.pathname);

  if (trovato) {
    let entrato = false;
    try {
      entrato = await entraConInvito(trovato[1]);
    } catch (errore) {
      console.error(errore);
    }
    if (!entrato) {
      senzaAccesso(
        'Il collegamento non è più valido',
        'Può essere stato sostituito da uno più recente. Chiedine uno nuovo al direttivo.'
      );
      return;
    }
  }

  const { data } = await client.auth.getSession();
  if (!data.session) {
    senzaAccesso();
    return;
  }
  stato.utente = data.session.user;

  const [socio, testi] = await Promise.all([
    client.rpc('stato_socio'),
    client.from('testi_licenza').select('*').lte('in_vigore_dal', new Date().toISOString())
      .order('in_vigore_dal', { ascending: false })
  ]);
  if (socio.error || !socio.data?.socio) {
    senzaAccesso(
      'Questo indirizzo non è nel libro soci',
      'La Cortoteca è riservata ai soci di CDL APS. Se sei socio, scrivici: controlliamo l\'indirizzo che abbiamo.'
    );
    return;
  }
  stato.socio = socio.data;
  // Per ogni tipo vale il testo più recente
  stato.testi = {};
  (testi.data || []).forEach((t) => { if (!stato.testi[t.tipo]) stato.testi[t.tipo] = t; });

  $('utente-nome').textContent = stato.socio.nome;
  $('utente').hidden = false;
  mostraCasa();
}

$('esci').addEventListener('click', async () => {
  await salvaSubito();
  await client.auth.signOut({ scope: 'local' });
  senzaAccesso(
    'Sei uscito',
    'Per rientrare apri di nuovo il tuo collegamento personale.'
  );
});

/* --------------------------------------------------------------------------
   Casa: proposte e corti del socio
   -------------------------------------------------------------------------- */
async function mostraCasa() {
  stato.proposta = null;
  stato.opera = null;
  mostraVista('caricamento');

  const [proposte, licenze, opere] = await Promise.all([
    client.from('proposte')
      .select('id, stato, dati, nota_revisione, opera_id, inviata_il, decisa_il, modificato_il')
      .eq('autore', stato.utente.id)
      .order('modificato_il', { ascending: false }),
    client.from('licenze').select('*').eq('user_id', stato.utente.id).order('accettata_il', { ascending: false }),
    client.rpc('le_mie_opere')
  ]);
  const errore = proposte.error || licenze.error || opere.error;
  if (errore) {
    avviso(messaggioErrore(errore), true);
    return;
  }
  stato.proposte = proposte.data;
  stato.licenze = licenze.data;
  stato.opere = opere.data;

  $('saluto').textContent = 'Ciao, ' + stato.socio.nome.split(' ')[0];

  const nota = $('stato-quota');
  nota.replaceChildren();
  if (stato.socio.in_regola) {
    nota.textContent = `Tessera n. ${stato.socio.numero}, quota ${stato.socio.anno} in regola.`;
  } else {
    nota.append(`La quota ${stato.socio.anno_corrente} non risulta pagata: per proporre un corto serve la tessera rinnovata. `);
    const rinnova = document.createElement('a');
    rinnova.href = 'vantaggi-tesseramento.html#socio';
    rinnova.textContent = 'Come rinnovare →';
    nota.append(rinnova);
  }
  nota.classList.toggle('p-nota--allarme', !stato.socio.in_regola);
  $('nuova-proposta').disabled = !stato.socio.in_regola;

  scriviOpere();
  scriviProposte();
  mostraVista('casa');
}

function licenzaAttiva(filtro) {
  return stato.licenze.find((l) => !l.revocata_il && filtro(l)) || null;
}

function pulsante(testo, azione, id, pieno = false) {
  return `<button type="button" class="btn${pieno ? ' btn--pieno' : ''}" data-azione="${azione}" data-id="${id}">${esc(testo)}</button>`;
}

/* Corti già online attribuiti al socio e non nati da una sua proposta */
function scriviOpere() {
  const daProposte = new Set(stato.proposte.map((p) => p.opera_id).filter(Boolean));
  const opere = stato.opere.filter((o) => !daProposte.has(o.opera_id));
  $('blocco-opere').hidden = !opere.length;

  $('elenco-opere').innerHTML = opere.map((o) => {
    // le_mie_opere dà già la licenza adatta all'opera: per lo streaming se
    // ha il video, anche solo per la scheda se non lo ha
    const licenza = o.licenza_id ? stato.licenze.find((l) => l.id === o.licenza_id) : null;
    const documento = TIPI_LICENZA[o.serve] || TIPI_LICENZA.streaming;
    const azioni = licenza
      ? pulsante('Ricevuta', 'ricevuta', licenza.id) + pulsante('Ritira dalla Cortoteca', 'revoca', licenza.id)
      : pulsante(`Conferma ${documento.nome}`, 'licenza-opera', o.opera_id, true);
    const riga = licenza
      ? `${o.pubblicata ? 'In Cortoteca' : 'Non visibile'} · ${TIPI_LICENZA[licenza.tipo]?.breve || 'licenza'} del ${esc(formattaData(licenza.accettata_il))}`
      : `Manca ${documento.nome}: confermala per tenerlo in Cortoteca.`;
    return `
      <li class="p-voce">
        <div class="p-voce-testo">
          <span class="g-riga-titolo">${esc(o.titolo)}</span>
          <span class="g-riga-dati">${esc(o.anno)} · ${riga}</span>
        </div>
        <div class="p-voce-azioni">${azioni}</div>
      </li>`;
  }).join('');
}

function scriviProposte() {
  const elenco = $('elenco-proposte');
  if (!stato.proposte.length) {
    elenco.innerHTML = '<li class="g-vuoto">Ancora nessuna proposta.</li>';
    return;
  }

  elenco.innerHTML = stato.proposte.map((p) => {
    const titolo = p.dati.titolo || 'Senza titolo';
    const licenza = licenzaAttiva((l) => l.proposta_id === p.id);
    const opera = stato.opere.find((o) => o.opera_id === p.opera_id);
    let riga = '';
    let azioni = '';
    let nota = '';

    const soloScheda = p.dati.modalita === 'scheda' ? ' · solo scheda' : '';
    if (p.stato === 'bozza') {
      riga = `Bozza, salvata il ${formattaData(p.modificato_il)}`;
      azioni = pulsante('Continua', 'apri', p.id, true) + pulsante('Elimina', 'elimina', p.id);
    } else if (p.stato === 'inviata') {
      riga = `Inviata il ${formattaData(p.inviata_il)}${soloScheda}. In attesa di revisione.`;
      azioni = (licenza ? pulsante('Ricevuta', 'ricevuta', licenza.id) : '') + pulsante('Ritira', 'ritira', p.id);
    } else if (p.stato === 'da_rivedere') {
      riga = 'Il direttivo chiede una modifica:';
      nota = p.nota_revisione;
      azioni = pulsante('Correggi e rinvia', 'apri', p.id, true) + pulsante('Ritira', 'ritira', p.id);
    } else if (p.stato === 'approvata') {
      riga = `In Cortoteca dal ${formattaData(p.decisa_il)}${soloScheda}`;
      azioni =
        (opera ? `<a class="btn" href="opera.html?film=${encodeURIComponent(opera.codice)}" target="_blank" rel="noopener">Vedi ↗</a>` : '') +
        (licenza ? pulsante('Ricevuta', 'ricevuta', licenza.id) + pulsante('Ritira dalla Cortoteca', 'revoca', licenza.id) : '');
    } else if (p.stato === 'rifiutata') {
      riga = 'Non accolta:';
      nota = p.nota_revisione;
    } else {
      riga = `Ritirata il ${formattaData(p.decisa_il)}`;
    }

    return `
      <li class="p-voce">
        <div class="p-voce-testo">
          <span class="g-riga-titolo">${esc(titolo)}</span>
          <span class="g-riga-dati">${esc(riga)}</span>
          ${nota ? `<p class="p-richiamo">${esc(nota)}</p>` : ''}
        </div>
        <div class="p-voce-azioni">${azioni}</div>
      </li>`;
  }).join('');
}

/* Pulsanti degli elenchi */
document.querySelector('[data-vista="casa"]').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-azione]');
  if (!b) return;
  const id = Number(b.dataset.id);
  const azione = b.dataset.azione;

  if (azione === 'apri') {
    apriProposta(stato.proposte.find((p) => p.id === id));
  } else if (azione === 'licenza-opera') {
    apriLicenzaOpera(stato.opere.find((o) => o.opera_id === id));
  } else if (azione === 'ricevuta') {
    mostraRicevuta(stato.licenze.find((l) => l.id === id), false);
  } else if (azione === 'elimina') {
    if (!confirm('Eliminare questa bozza?')) return;
    const proposta = stato.proposte.find((p) => p.id === id);
    const file = [proposta?.dati.fotogramma, proposta?.dati.titolo_png, proposta?.dati.titolo_font].filter(Boolean);
    if (file.length) await client.storage.from(SPAZIO_PROPOSTE).remove(file);
    const { error } = await client.from('proposte').delete().eq('id', id);
    if (error) avviso(messaggioErrore(error), true);
    mostraCasa();
  } else if (azione === 'ritira') {
    if (!confirm('Ritirare la proposta? Non verrà pubblicata.')) return;
    const { error } = await client.rpc('ritira_proposta', { p_id: id });
    if (error) avviso(messaggioErrore(error), true);
    else avviso('Proposta ritirata.');
    mostraCasa();
  } else if (azione === 'revoca') {
    if (!confirm('Ritirare il corto dalla Cortoteca? La licenza viene revocata e il corto non sarà più visibile. Per rimetterlo servirà una nuova proposta.')) return;
    const { error } = await client.rpc('revoca_licenza', { p_id: id });
    if (error) avviso(messaggioErrore(error), true);
    else avviso('Corto ritirato dalla Cortoteca.');
    mostraCasa();
  }
});

$('nuova-proposta').addEventListener('click', async () => {
  const { data, error } = await client.from('proposte').insert({ dati: {} }).select().single();
  if (error) {
    avviso(messaggioErrore(error), true);
    return;
  }
  apriProposta(data);
});

/* --------------------------------------------------------------------------
   Modulo: apertura
   -------------------------------------------------------------------------- */
function preparaModulo() {
  modulo.reset();
  $('interpreti').innerHTML = '';
  $('altri-ruoli').innerHTML = '';
  $('nota-revisione').hidden = true;
  $('salvataggio').textContent = '';
  $('anteprima-fotogramma').hidden = true;
  $('file-fotogramma').value = '';
  $('file-titolo').value = '';
  aggiornaEsitoVideo();
  modulo.a_nome.value = stato.socio.nome || '';
}

function apriProposta(proposta) {
  if (!proposta) return;
  nascondiAvviso();
  stato.proposta = proposta;
  stato.opera = null;
  preparaModulo();

  const dati = proposta.dati || {};
  CAMPI.forEach((campo) => {
    const valore = dati[campo];
    modulo[campo].value = Array.isArray(valore) ? valore.join(', ') : valore ?? '';
  });
  (dati.interpreti || []).forEach((i) => aggiungiInterprete(i, programmaSalvataggio));
  // Le bozze di prima avevano il trucco fra i campi fissi: diventa un ruolo
  const ruoli = [...(dati.altri_ruoli || [])];
  if (dati.trucco && !ruoli.some((r) => /trucco/i.test(r.ruolo))) ruoli.unshift({ ruolo: 'Trucco', nome: dati.trucco });
  ruoli.forEach((r) => aggiungiRuolo(r, programmaSalvataggio));
  const modalita = dati.modalita || (dati.video_url || dati.file_url ? 'streaming' : null);
  if (modalita) modulo.querySelector(`[name="modalita"][value="${modalita}"]`).checked = true;
  compilaQuestionario(dati.questionario);
  aggiornaEsitoVideo();
  aggiornaModalita();
  mostraFotogramma(dati.fotogramma);
  mostraTitoloGrafico();

  $('titolo-modulo').textContent = dati.titolo || 'Nuova proposta';
  $('passi').hidden = false;
  $('invia').textContent = 'Invia la proposta';

  if (proposta.stato === 'da_rivedere' && proposta.nota_revisione) {
    $('nota-revisione').textContent = 'Il direttivo chiede: ' + proposta.nota_revisione;
    $('nota-revisione').hidden = false;
  }

  mostraPasso(1);
  mostraVista('modulo');
}

/* Opera già online: si accetta solo la licenza, senza rifare la scheda */
function apriLicenzaOpera(opera) {
  if (!opera) return;
  nascondiAvviso();
  stato.proposta = null;
  stato.opera = opera;
  preparaModulo();
  const documento = TIPI_LICENZA[opera.serve] || TIPI_LICENZA.streaming;
  $('titolo-modulo').textContent = `${documento.titolo} per «${opera.titolo}»`;
  $('passi').hidden = true;
  $('invia').textContent = `Accetta ${documento.nome}`;
  mostraPasso(4);
  mostraVista('modulo');
}

/* Testo della licenza: prima riga titolo, righe "1. …" titoletti, il resto
   paragrafi. Arriva dal database e si scrive come testo, mai come HTML. */
function scriviLicenza(contenitore, testo) {
  contenitore.replaceChildren();
  testo.split('\n').forEach((riga, i) => {
    if (!riga.trim()) return;
    const nodo = document.createElement(i === 0 ? 'h3' : /^\d+\. /.test(riga) ? 'h4' : 'p');
    nodo.textContent = riga;
    contenitore.append(nodo);
  });
}

/* --------------------------------------------------------------------------
   Modulo: passi
   -------------------------------------------------------------------------- */
function mostraPasso(n) {
  stato.passo = n;
  modulo.querySelectorAll('[data-pannello]').forEach((p) => {
    p.hidden = Number(p.dataset.pannello) !== n;
  });
  $('passi').querySelectorAll('[data-passo]').forEach((b) => {
    if (Number(b.dataset.passo) === n) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
  });
  const soloLicenza = Boolean(stato.opera);
  $('indietro').hidden = soloLicenza || n === 1;
  $('avanti').hidden = soloLicenza || n === 4;
  if (n === 4) preparaDiritti();
  $('invia').hidden = n !== 4 || !tipoDiritti();
  window.scrollTo(0, 0);
}

/* --------------------------------------------------------------------------
   Diritti: domande e testo secondo la scelta fra streaming e sola scheda
   -------------------------------------------------------------------------- */
function modalitaScelta() {
  return modulo.querySelector('[name="modalita"]:checked')?.value || null;
}

/* Il tipo di documento da accettare: per un'opera già online lo decide il
   video che ha, per una proposta la scelta del passo 3 */
function tipoDiritti() {
  return stato.opera ? stato.opera.serve : modalitaScelta();
}

function conFont() {
  return Boolean(!stato.opera && stato.proposta?.dati.titolo_font);
}

/* Licenza già accettata per questa proposta che vale ancora: stesso tipo,
   testo in vigore e, se c'è un carattere, la dichiarazione sulla sua licenza */
function licenzaGiaValida(tipo) {
  if (!stato.proposta || !tipo) return null;
  return licenzaAttiva((l) =>
    l.proposta_id === stato.proposta.id &&
    l.tipo === tipo &&
    l.versione_testo === stato.testi[tipo]?.versione &&
    (!conFont() || l.risposte?.font_web === true));
}

function preparaDiritti() {
  const tipo = tipoDiritti();
  $('diritti-scegli').hidden = Boolean(tipo);
  $('licenza-gia-accettata').hidden = true;
  $('blocco-diritti').hidden = !tipo;
  $('invia').textContent = stato.opera
    ? `Accetta ${(TIPI_LICENZA[tipo] || TIPI_LICENZA.streaming).nome}`
    : 'Invia la proposta';
  if (!tipo) return;

  const gia = licenzaGiaValida(tipo);
  if (gia) {
    $('licenza-gia-accettata').textContent =
      `Hai già accettato ${TIPI_LICENZA[tipo].nome} il ${formattaDataOra(gia.accettata_il)}: non serve rifarlo. Controlla le correzioni e rinvia.`;
    $('licenza-gia-accettata').hidden = false;
    $('blocco-diritti').hidden = true;
    $('invia').textContent = 'Rinvia la proposta';
    return;
  }

  modulo.querySelectorAll('[data-per]').forEach((d) => { d.hidden = d.dataset.per !== tipo; });
  $('domanda-font').hidden = !conFont();

  const documento = TIPI_LICENZA[tipo];
  $('diritti-intro').textContent = tipo === 'streaming'
    ? 'Il corto si potrà guardare in Cortoteca: per questo serve la licenza completa, con qualche domanda su musica, interpreti e accordi in corso.'
    : 'Proponi la sola scheda: bastano poche domande e un\'autorizzazione breve, che copre titolo, testi, crediti e fotogramma. Se un giorno vorrai rendere visibile il corto, accetterai la licenza completa.';
  $('titolo-testo').textContent = documento.titolo;
  scriviLicenza($('testo-licenza'), stato.testi[tipo]?.testo || 'Testo non disponibile: ricarica la pagina.');
  modulo.querySelectorAll('[data-versione]').forEach((el) => { el.textContent = stato.testi[tipo]?.versione || ''; });
  modulo.querySelectorAll('[data-nome-testo]').forEach((el) => { el.textContent = documento.nome; });
}

$('diritti-scegli').addEventListener('click', (e) => {
  const b = e.target.closest('[data-vai-passo]');
  if (b) mostraPasso(Number(b.dataset.vaiPasso));
});

/* Streaming o sola scheda: i campi del video compaiono solo con lo streaming */
function aggiornaModalita() {
  $('blocco-video').hidden = modalitaScelta() !== 'streaming';
}

$('passi').addEventListener('click', (e) => {
  const b = e.target.closest('[data-passo]');
  if (!b) return;
  salvaSubito();
  mostraPasso(Number(b.dataset.passo));
});

$('avanti').addEventListener('click', () => {
  salvaSubito();
  mostraPasso(Math.min(4, stato.passo + 1));
});

$('indietro').addEventListener('click', () => {
  salvaSubito();
  mostraPasso(Math.max(1, stato.passo - 1));
});

$('torna-casa').addEventListener('click', async () => {
  await salvaSubito();
  mostraCasa();
});

/* --------------------------------------------------------------------------
   Modulo: lettura e salvataggio automatico
   -------------------------------------------------------------------------- */
function testoCampo(nome) {
  const valore = modulo[nome].value.trim();
  return valore === '' ? null : valore;
}

/* Le risposte che contano per il tipo scelto. Senza tipo (bozza a metà) si
   conservano tutte, per non perdere nulla se il socio cambia idea. */
function leggiQuestionario(tipo = tipoDiritti()) {
  const scelto = (nome) => modulo.querySelector(`[name="${nome}"]:checked`)?.value || null;
  const tutte = {
    veste: scelto('q_veste'),
    musica: [...modulo.querySelectorAll('[name="q_musica"]:checked')].map((c) => c.value),
    musica_note: testoCampo('q_musica_note'),
    interpreti_consenso: modulo.q_interpreti.checked,
    minori: scelto('q_minori'),
    persone_fotogramma: scelto('q_persone'),
    derivata: { risposta: scelto('q_derivata'), si: scelto('q_derivata') === 'si', dettagli: testoCampo('q_derivata_dettagli') },
    vincoli: { risposta: scelto('q_vincoli'), si: scelto('q_vincoli') === 'si', dettagli: testoCampo('q_vincoli_dettagli') },
    contenuti_sensibili: testoCampo('q_sensibili'),
    font_web: modulo.q_font.checked
  };
  if (!tipo) return tutte;
  const chiavi = tipo === 'streaming'
    ? ['veste', 'musica', 'musica_note', 'interpreti_consenso', 'minori', 'derivata', 'vincoli', 'contenuti_sensibili']
    : ['veste', 'persone_fotogramma', 'vincoli'];
  if (conFont()) chiavi.push('font_web');
  return Object.fromEntries(chiavi.map((k) => [k, tutte[k]]));
}

function compilaQuestionario(q) {
  if (!q) return;
  const scegli = (nome, valore) => {
    const el = valore && modulo.querySelector(`[name="${nome}"][value="${CSS.escape(valore)}"]`);
    if (el) el.checked = true;
  };
  scegli('q_veste', q.veste);
  (q.musica || []).forEach((m) => scegli('q_musica', m));
  modulo.q_musica_note.value = q.musica_note || '';
  modulo.q_interpreti.checked = Boolean(q.interpreti_consenso);
  scegli('q_minori', q.minori);
  scegli('q_persone', q.persone_fotogramma);
  modulo.q_font.checked = Boolean(q.font_web);
  scegli('q_derivata', q.derivata?.risposta);
  modulo.q_derivata_dettagli.value = q.derivata?.dettagli || '';
  scegli('q_vincoli', q.vincoli?.risposta);
  modulo.q_vincoli_dettagli.value = q.vincoli?.dettagli || '';
  modulo.q_sensibili.value = q.contenuti_sensibili || '';
}

/* La scheda così come va salvata nella proposta */
function leggiDati() {
  const precedenti = stato.proposta?.dati || {};
  const dati = {
    fotogramma: precedenti.fotogramma || null,
    titolo_png: precedenti.titolo_png || null,
    titolo_font: precedenti.titolo_font || null,
    titolo_font_nome: precedenti.titolo_font_nome || null,
    modalita: modalitaScelta()
  };
  CAMPI.forEach((campo) => {
    if (campo === 'generi') {
      dati.generi = modulo.generi.value.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean);
    } else if (campo === 'anno' || campo === 'durata') {
      dati[campo] = modulo[campo].value === '' ? null : Math.round(Number(modulo[campo].value)) || null;
    } else {
      dati[campo] = testoCampo(campo);
    }
  });
  // Con la sola scheda il video non si salva: i campi restano compilati, se
  // il socio torna allo streaming li ritrova
  if (dati.modalita === 'scheda') {
    dati.video_url = null;
    dati.file_url = null;
  }
  dati.interpreti = leggiInterpreti();
  dati.altri_ruoli = leggiRuoli();
  dati.questionario = leggiQuestionario(null);
  return dati;
}

let timerSalvataggio = null;
let salvataggioInCorso = Promise.resolve();

function programmaSalvataggio() {
  if (!stato.proposta) return;
  $('salvataggio').textContent = 'Modifiche da salvare…';
  clearTimeout(timerSalvataggio);
  timerSalvataggio = setTimeout(salvaSubito, ATTESA_SALVATAGGIO);
}

/* Salva la scheda aperta. Le chiamate si mettono in fila: l'ultima scrittura
   è sempre quella con i dati più recenti. */
function salvaSubito() {
  clearTimeout(timerSalvataggio);
  timerSalvataggio = null;
  const proposta = stato.proposta;
  if (!proposta || !['bozza', 'da_rivedere'].includes(proposta.stato)) return salvataggioInCorso;

  const dati = leggiDati();
  salvataggioInCorso = salvataggioInCorso.then(async () => {
    $('salvataggio').textContent = 'Salvataggio…';
    const { error } = await client.from('proposte').update({ dati }).eq('id', proposta.id);
    if (error) {
      $('salvataggio').textContent = 'Non salvato: controlla la connessione';
      return false;
    }
    proposta.dati = dati;
    $('salvataggio').textContent = 'Salvato';
    return true;
  });
  return salvataggioInCorso;
}

modulo.addEventListener('input', (e) => {
  // Nome e caselle di accettazione non si conservano nella bozza
  if (e.target.name && e.target.name.startsWith('a_')) return;
  if (e.target.type === 'file') return;
  if (e.target.name === 'titolo') $('titolo-modulo').textContent = e.target.value || 'Nuova proposta';
  if (e.target.name === 'video_url') aggiornaEsitoVideo();
  if (e.target.name === 'modalita') aggiornaModalita();
  programmaSalvataggio();
});

// "Nessuna musica" esclude le altre risposte, e viceversa
modulo.addEventListener('change', (e) => {
  if (e.target.name !== 'q_musica' || !e.target.checked) return;
  modulo.querySelectorAll('[name="q_musica"]').forEach((c) => {
    if (c === e.target) return;
    if (e.target.value === 'nessuna' || c.value === 'nessuna') c.checked = false;
  });
});

$('aggiungi-interprete').addEventListener('click', () => {
  aggiungiInterprete({}, programmaSalvataggio).querySelector('[data-nome]').focus();
});

$('aggiungi-ruolo').addEventListener('click', () => {
  aggiungiRuolo({}, programmaSalvataggio).querySelector('[data-ruolo]').focus();
});

window.addEventListener('beforeunload', (e) => {
  if (timerSalvataggio) {
    salvaSubito();
    e.preventDefault();
  }
});

/* --------------------------------------------------------------------------
   Modulo: video e fotogramma
   -------------------------------------------------------------------------- */
const TESTO_VIDEO = $('esito-video').textContent;

function aggiornaEsitoVideo() {
  const indirizzo = modulo.video_url.value.trim();
  const esito = $('esito-video');
  esito.classList.remove('p-ok', 'p-errore');
  if (!indirizzo) {
    esito.textContent = TESTO_VIDEO;
  } else if (getEmbedUrl(indirizzo)) {
    esito.textContent = 'Collegamento riconosciuto: il corto si vedrà direttamente in Cortoteca.';
    esito.classList.add('p-ok');
  } else {
    esito.textContent = 'Non riconosco questo collegamento: servono indirizzi di YouTube o di Vimeo.';
    esito.classList.add('p-errore');
  }
}

async function mostraFotogramma(percorso) {
  const img = $('anteprima-fotogramma');
  if (!percorso) {
    img.hidden = true;
    return;
  }
  const { data, error } = await client.storage.from(SPAZIO_PROPOSTE).download(percorso);
  if (error || stato.proposta?.dati.fotogramma !== percorso) return;
  img.src = URL.createObjectURL(data);
  img.hidden = false;
}

$('file-fotogramma').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const proposta = stato.proposta;
  if (!file || !proposta) return;

  $('salvataggio').textContent = 'Carico il fotogramma…';
  try {
    const blob = await ridimensiona(file);
    const percorso = `${stato.utente.id}/${proposta.id}-${Date.now()}.jpg`;
    const { error } = await client.storage.from(SPAZIO_PROPOSTE).upload(percorso, blob, {
      contentType: 'image/jpeg',
      upsert: false
    });
    if (error) throw error;

    const precedente = proposta.dati.fotogramma;
    proposta.dati.fotogramma = percorso;
    $('anteprima-fotogramma').src = URL.createObjectURL(blob);
    $('anteprima-fotogramma').hidden = false;
    await salvaSubito();
    if (precedente) client.storage.from(SPAZIO_PROPOSTE).remove([precedente]);
  } catch (errore) {
    console.error(errore);
    $('salvataggio').textContent = '';
    avviso(messaggioErrore(errore), true);
  } finally {
    e.target.value = '';
  }
});

/* Titolo grafico: un PNG, mostrato in anteprima, o un carattere tipografico,
   di cui si mostra il nome. Si carica com'è, senza conversioni. */
async function mostraTitoloGrafico() {
  const dati = stato.proposta?.dati || {};
  const img = $('anteprima-titolo');
  img.hidden = true;
  $('nome-font').hidden = !dati.titolo_font;
  $('nome-font').textContent = dati.titolo_font ? 'Carattere caricato: ' + (dati.titolo_font_nome || 'file del font') : '';
  $('togli-titolo').hidden = !(dati.titolo_png || dati.titolo_font);
  if (!dati.titolo_png) return;
  const percorso = dati.titolo_png;
  const { data, error } = await client.storage.from(SPAZIO_PROPOSTE).download(percorso);
  if (error || stato.proposta?.dati.titolo_png !== percorso) return;
  img.src = URL.createObjectURL(data);
  img.hidden = false;
}

$('file-titolo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const proposta = stato.proposta;
  if (!file || !proposta) return;

  try {
    const tipo = riconosciFileTitolo(file);
    $('salvataggio').textContent = 'Carico il titolo…';
    const percorso = `${stato.utente.id}/${proposta.id}-titolo-${Date.now()}.${tipo.estensione}`;
    const { error } = await client.storage.from(SPAZIO_PROPOSTE).upload(percorso, file, {
      contentType: tipo.mime,
      upsert: false
    });
    if (error) throw error;

    // Un file sostituisce l'altro: o il PNG o il carattere
    const precedenti = [proposta.dati.titolo_png, proposta.dati.titolo_font].filter(Boolean);
    proposta.dati.titolo_png = tipo.tipo === 'png' ? percorso : null;
    proposta.dati.titolo_font = tipo.tipo === 'font' ? percorso : null;
    proposta.dati.titolo_font_nome = tipo.tipo === 'font' ? file.name.slice(0, 200) : null;
    await salvaSubito();
    mostraTitoloGrafico();
    if (precedenti.length) client.storage.from(SPAZIO_PROPOSTE).remove(precedenti);
  } catch (errore) {
    console.error(errore);
    $('salvataggio').textContent = '';
    avviso(messaggioErrore(errore), true);
  } finally {
    e.target.value = '';
  }
});

$('togli-titolo').addEventListener('click', async () => {
  const proposta = stato.proposta;
  if (!proposta) return;
  const precedenti = [proposta.dati.titolo_png, proposta.dati.titolo_font].filter(Boolean);
  proposta.dati.titolo_png = null;
  proposta.dati.titolo_font = null;
  proposta.dati.titolo_font_nome = null;
  modulo.q_font.checked = false;
  await salvaSubito();
  mostraTitoloGrafico();
  if (precedenti.length) client.storage.from(SPAZIO_PROPOSTE).remove(precedenti);
});

/* --------------------------------------------------------------------------
   Invio
   -------------------------------------------------------------------------- */

/* Restituisce [passo, messaggio] del primo dato mancante, o null */
function primoProblema(dati, conDiritti) {
  if (stato.proposta) {
    if (!dati.titolo) return [1, 'Manca il titolo.'];
    if (!dati.anno || dati.anno < 1900 || dati.anno > 2100) return [1, 'Indica l\'anno del corto.'];
    if (!dati.durata || dati.durata < 1 || dati.durata > 600) return [1, 'Indica la durata del corto, in minuti.'];
    if (!dati.regista) return [1, 'Indica la regia.'];
    if (!dati.sinossi) return [1, 'Scrivi la sinossi.'];
    if (!dati.modalita) return [3, 'Scegli se il corto si potrà guardare in Cortoteca o se proponi la sola scheda.'];
    if (!dati.fotogramma) return [3, 'Carica un fotogramma del corto.'];
    if (dati.modalita === 'streaming') {
      if (dati.video_url && !getEmbedUrl(dati.video_url)) return [3, 'Il collegamento al video deve essere di YouTube o di Vimeo.'];
      if (!dati.video_url && !/^https?:\/\//i.test(dati.file_url || '')) {
        return [3, 'Per lo streaming incolla il collegamento al video, oppure quello da cui scaricare il file.'];
      }
    }
  }
  if (!conDiritti) return null;

  const tipo = tipoDiritti();
  const q = leggiQuestionario(tipo);
  if (!q.veste) return [4, 'Indica in che veste dai l\'autorizzazione.'];
  if (tipo === 'streaming') {
    if (!q.musica.length) return [4, 'Indica che musica c\'è nel corto.'];
    if (q.musica.some((m) => m !== 'nessuna') && !q.musica_note) return [4, 'Scrivi titoli e autori della musica.'];
    if (!q.interpreti_consenso) return [4, 'Serve il consenso scritto di interpreti e persone riprese.'];
    if (!q.minori) return [4, 'Indica se ci sono minori.'];
    if (!q.derivata.risposta) return [4, 'Indica se il corto è tratto da un\'opera altrui.'];
    if (q.derivata.si && !q.derivata.dettagli) return [4, 'Indica da quale opera è tratto e con quale autorizzazione.'];
  } else if (!q.persone_fotogramma) {
    return [4, 'Indica se nel fotogramma compaiono persone riconoscibili.'];
  }
  if (!q.vincoli.risposta) return [4, 'Indica se ci sono accordi in corso.'];
  if (q.vincoli.si && !q.vincoli.dettagli) return [4, 'Indica quali accordi sono in corso.'];
  if (conFont() && !q.font_web) return [4, 'Conferma che la licenza del carattere ne consente l\'uso sul web, oppure togli il file e carica il titolo in PNG.'];
  if (modulo.a_nome.value.trim().length < 5) return [4, 'Scrivi nome e cognome per esteso.'];
  if (!modulo.a_licenza.checked || !modulo.a_dichiarazioni.checked || !modulo.a_informativa.checked) {
    return [4, 'Per inviare servono le tre accettazioni obbligatorie.'];
  }
  return null;
}

modulo.addEventListener('submit', async (e) => {
  e.preventDefault();
  nascondiAvviso();

  if (stato.passo === 4) preparaDiritti();
  const conDiritti = !$('blocco-diritti').hidden;
  const dati = stato.proposta ? leggiDati() : {};
  const problema = primoProblema(dati, conDiritti);
  if (problema) {
    if (!stato.opera) mostraPasso(problema[0]);
    avviso(problema[1], true);
    return;
  }

  const pulsanteInvio = $('invia');
  const etichetta = pulsanteInvio.textContent;
  pulsanteInvio.disabled = true;
  pulsanteInvio.textContent = 'Invio…';

  try {
    const diritti = conDiritti
      ? {
          p_nome: modulo.a_nome.value.trim(),
          p_risposte: leggiQuestionario(),
          p_consensi: {
            licenza: modulo.a_licenza.checked,
            dichiarazioni: modulo.a_dichiarazioni.checked,
            informativa: modulo.a_informativa.checked,
            promozionale: modulo.a_promozionale.checked
          },
          p_versione: stato.testi[tipoDiritti()]?.versione || null
        }
      : {};

    let licenzaId;
    if (stato.opera) {
      const { data, error } = await client.rpc('accetta_licenza_opera', { p_opera_id: stato.opera.opera_id, ...diritti });
      if (error) throw error;
      licenzaId = data;
    } else {
      if (!(await salvaSubito())) throw new Error('Non riesco a salvare la scheda: controlla la connessione e riprova.');
      const { data, error } = await client.rpc('invia_proposta', { p_id: stato.proposta.id, ...diritti });
      if (error) throw error;
      licenzaId = data.licenza_id;
      stato.proposta.stato = 'inviata';
    }

    const { data: licenza, error } = await client.from('licenze').select('*').eq('id', licenzaId).single();
    if (error) throw error;
    mostraRicevuta(licenza, true);
  } catch (errore) {
    console.error(errore);
    avviso(messaggioErrore(errore), true);
    window.scrollTo(0, 0);
  } finally {
    pulsanteInvio.disabled = false;
    pulsanteInvio.textContent = etichetta;
  }
});

/* --------------------------------------------------------------------------
   Ricevuta
   -------------------------------------------------------------------------- */
function mostraRicevuta(licenza, appenaInviata) {
  if (!licenza) return;
  stato.ricevuta = licenza;
  stato.proposta = null;

  const documento = TIPI_LICENZA[licenza.tipo] || TIPI_LICENZA.streaming;
  $('ricevuta-titolo').textContent = appenaInviata
    ? (licenza.proposta_id ? 'Proposta inviata' : documento.titolo + ' accettata')
    : 'Ricevuta';
  $('ricevuta-testo').textContent = appenaInviata && licenza.proposta_id
    ? `Il direttivo la esamina e ti fa sapere. Qui sotto la ricevuta del${licenza.tipo === 'scheda' ? 'l\'autorizzazione' : 'la licenza'} che hai accettato: la ritrovi sempre in questa pagina.`
    : `La registrazione del${licenza.tipo === 'scheda' ? 'l\'autorizzazione' : 'la licenza'} che hai accettato.`;

  const righe = [
    ['Registrazione', 'n. ' + licenza.id],
    ['Tipo', documento.breve],
    ['Opera', licenza.titolo_opera],
    ['Concedente', licenza.nome_dichiarato],
    ['Accettata il', formattaDataOra(licenza.accettata_il)],
    ['Testo', 'versione ' + licenza.versione_testo],
    ['Uso promozionale', licenza.uso_promozionale ? 'autorizzato' : 'non autorizzato'],
    ...descriviRisposte(licenza.risposte)
  ];
  if (licenza.revocata_il) righe.push(['Revocata il', formattaDataOra(licenza.revocata_il)]);

  $('ricevuta-dati').innerHTML = righe
    .map(([nome, valore]) => `<div><dt>${esc(nome)}</dt><dd>${esc(valore)}</dd></div>`)
    .join('');
  mostraVista('ricevuta');
}

$('scarica-ricevuta').addEventListener('click', async () => {
  const licenza = stato.ricevuta;
  const vigente = Object.values(stato.testi).find((t) => t.versione === licenza.versione_testo);
  let testo = vigente ? vigente.testo : null;
  if (!testo) {
    const { data } = await client.from('testi_licenza').select('testo').eq('versione', licenza.versione_testo).single();
    testo = data?.testo || null;
  }
  scaricaTesto(`ricevuta-cortoteca-${licenza.id}.txt`, testoRicevuta(licenza, testo));
});

$('ricevuta-chiudi').addEventListener('click', mostraCasa);

/* -------------------------------------------------------------------------- */

// Collegamento aperto in una scheda dove la pagina c'è già: cambia solo ciò
// che sta dopo il cancelletto e la pagina non ripartirebbe da sola
window.addEventListener('hashchange', () => {
  if (/invito=[0-9a-f]{64}/.test(location.hash)) location.reload();
});

client.auth.onAuthStateChange((evento) => {
  if (evento === 'SIGNED_OUT' && stato.utente) {
    stato.utente = null;
    senzaAccesso('Sei uscito', 'Per rientrare apri di nuovo il tuo collegamento personale.');
  }
});

avvia();
