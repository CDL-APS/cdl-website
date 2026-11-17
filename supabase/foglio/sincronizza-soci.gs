/* ==========================================================================
   CORTOTECA — sincronizzazione dei soci fra il foglio e il sito.

   Va incollato nel foglio "Gestione APS (fogli)": Estensioni → Apps Script.
   Legge le schede "TESSERATI <anno>" e manda al sito solo sei colonne:
   numero, nome, email, pagato, data di pagamento, data di tesseramento.
   Nient'altro del foglio lascia Google.

   Primo avvio: menu Cortoteca → Collega al sito. Lo script crea una chiave,
   la tiene nelle proprie proprietà e ne mostra l'impronta, da incollare in
   gestione.html (scheda Soci). Da quel momento sincronizza a ogni modifica
   delle schede TESSERATI e una volta per notte.

   Avvisi al direttivo: facoltativi. Menu Cortoteca → Destinatari degli
   avvisi. Parte un'email, dall'account di chi ha collegato il foglio, solo
   quando c'è qualcosa di nuovo da sistemare.
   ========================================================================== */

const SITO_URL = 'https://rsspmqhhrykbmrkmwqcg.supabase.co';
// Chiave pubblica del sito, la stessa di assets/js/dati.js: da sola non
// autorizza nulla. A dare accesso è la chiave creata da "Collega al sito".
const SITO_CHIAVE_PUBBLICA = 'sb_publishable_GL627ST9nccoDrMVDhsxAQ_dUpRdVmh';

const SCHEDA_SOCI = /^TESSERATI (\d{4})$/;

// Intestazioni lette dal foglio. Se una cambia nome, la sincronizzazione si
// ferma con un errore invece di mandare dati sbagliati.
const COLONNE = {
  numero: '#',
  nome: 'Nome cognome',
  email: 'Email',
  pagato: 'Pagato?',
  data_pagamento: 'Data pagamento',
  data_tesseramento: 'Data tesseramento'
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Cortoteca')
    .addItem('Sincronizza soci ora', 'sincronizzaDalMenu')
    .addItem('Destinatari degli avvisi', 'impostaDestinatari')
    .addSeparator()
    .addItem('Collega al sito', 'collegaAlSito')
    .addToUi();
}

/* --------------------------------------------------------------------------
   Collegamento: crea la chiave e gli avvii automatici
   -------------------------------------------------------------------------- */
function collegaAlSito() {
  const ui = SpreadsheetApp.getUi();
  const proprieta = PropertiesService.getScriptProperties();

  if (proprieta.getProperty('CHIAVE')) {
    const risposta = ui.alert(
      'Il foglio è già collegato',
      'Rifare il collegamento crea una chiave nuova: finché non incolli la nuova impronta in gestione, la sincronizzazione si ferma. Continuare?',
      ui.ButtonSet.YES_NO
    );
    if (risposta !== ui.Button.YES) return;
  }

  const chiave = esadecimale(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid() + Date.now()
  ));
  proprieta.setProperty('CHIAVE', chiave);
  const impronta = esadecimale(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, chiave));

  // Avvii automatici: si ricreano da capo per non averne di doppi
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('alModifica').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger('ogniNotte').timeBased().everyDays(1).atHour(4).create();

  ui.alert(
    'Collegamento creato',
    'Copia questa impronta e incollala in gestione.html, scheda Soci, "Collega il foglio":\n\n' +
      impronta +
      '\n\nPoi torna qui e scegli Cortoteca → Sincronizza soci ora.',
    ui.ButtonSet.OK
  );
}

function impostaDestinatari() {
  const ui = SpreadsheetApp.getUi();
  const proprieta = PropertiesService.getScriptProperties();
  const attuali = proprieta.getProperty('AVVISI_A') || '';
  const risposta = ui.prompt(
    'Destinatari degli avvisi',
    'Indirizzi separati da virgola. Lascia vuoto per non ricevere email.' +
      (attuali ? '\n\nOra: ' + attuali : ''),
    ui.ButtonSet.OK_CANCEL
  );
  if (risposta.getSelectedButton() !== ui.Button.OK) return;
  proprieta.setProperty('AVVISI_A', risposta.getResponseText().trim());
  proprieta.deleteProperty('AVVISI_ULTIMI');
}

/* --------------------------------------------------------------------------
   Avvii
   -------------------------------------------------------------------------- */
function sincronizzaDalMenu() {
  const ui = SpreadsheetApp.getUi();
  try {
    const esiti = sincronizzaSoci();
    ui.alert('Soci sincronizzati', esiti.map(descriviEsito).join('\n\n'), ui.ButtonSet.OK);
  } catch (errore) {
    ui.alert('Sincronizzazione non riuscita', String(errore.message || errore), ui.ButtonSet.OK);
  }
}

/* A ogni modifica di una scheda TESSERATI. Aspetta venti secondi e parte solo
   se nel frattempo non ci sono state altre modifiche: così una riga compilata
   cella per cella produce una sola sincronizzazione. */
function alModifica(e) {
  if (!e || !e.range || !SCHEDA_SOCI.test(e.range.getSheet().getName())) return;
  const memoria = CacheService.getScriptCache();
  const segno = String(Date.now()) + Math.random();
  memoria.put('ultima_modifica', segno, 120);
  Utilities.sleep(20000);
  if (memoria.get('ultima_modifica') !== segno) return;
  sincronizzaSoci();
}

function ogniNotte() {
  const esiti = sincronizzaSoci();
  mandaAvvisi(esiti);
}

/* --------------------------------------------------------------------------
   Sincronizzazione
   -------------------------------------------------------------------------- */
function sincronizzaSoci() {
  const chiave = PropertiesService.getScriptProperties().getProperty('CHIAVE');
  if (!chiave) throw new Error('Il foglio non è collegato: usa Cortoteca → Collega al sito.');

  const quest = new Date().getFullYear();
  const esiti = [];

  SpreadsheetApp.getActive().getSheets().forEach((scheda) => {
    const trovato = scheda.getName().match(SCHEDA_SOCI);
    if (!trovato) return;
    const anno = Number(trovato[1]);
    if (Math.abs(anno - quest) > 1) return;

    const righe = leggiScheda(scheda);
    if (!righe.length) return;
    esiti.push(chiama('sincronizza_soci', { p_chiave: chiave, p_anno: anno, p_righe: righe }));
  });

  if (!esiti.length) throw new Error('Nessuna scheda "TESSERATI <anno>" con righe da sincronizzare.');
  return esiti;
}

function leggiScheda(scheda) {
  // Valori come appaiono a video: numeri di tessera con gli zeri, date gg/mm/aaaa
  const valori = scheda.getDataRange().getDisplayValues();
  const intestazioni = valori[0].map((v) => v.trim());

  const posizione = {};
  Object.keys(COLONNE).forEach((campo) => {
    posizione[campo] = intestazioni.indexOf(COLONNE[campo]);
    if (posizione[campo] < 0) {
      throw new Error('Nella scheda "' + scheda.getName() + '" manca la colonna "' + COLONNE[campo] + '".');
    }
  });

  const righe = valori.slice(1)
    .map((riga) => ({
      numero: riga[posizione.numero].trim(),
      nome: riga[posizione.nome].trim(),
      email: riga[posizione.email].trim(),
      pagato: /^s[iì]$/i.test(riga[posizione.pagato].trim()),
      data_pagamento: dataIso(riga[posizione.data_pagamento]),
      data_tesseramento: dataIso(riga[posizione.data_tesseramento])
    }))
    .filter((riga) => riga.numero && riga.nome);

  // Un numero di tessera ripetuto farebbe sparire un socio nel database (la
  // chiave è anno + numero): meglio fermarsi e dirlo (17 novembre 2026)
  const visti = {};
  righe.forEach((riga) => {
    if (visti[riga.numero]) {
      throw new Error('Nella scheda "' + scheda.getName() + '" il numero ' + riga.numero + ' compare due volte ('
        + visti[riga.numero] + ', ' + riga.nome + '): correggilo e risincronizza.');
    }
    visti[riga.numero] = riga.nome;
  });
  return righe;
}

/* "24/12/2025" → "2025-12-24"; qualsiasi altra cosa → vuoto */
function dataIso(testo) {
  const parti = String(testo).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!parti) return '';
  return parti[3] + '-' + parti[2].padStart(2, '0') + '-' + parti[1].padStart(2, '0');
}

function chiama(funzione, corpo) {
  const risposta = UrlFetchApp.fetch(SITO_URL + '/rest/v1/rpc/' + funzione, {
    method: 'post',
    contentType: 'application/json',
    headers: { apikey: SITO_CHIAVE_PUBBLICA },
    payload: JSON.stringify(corpo),
    muteHttpExceptions: true
  });
  const testo = risposta.getContentText();
  if (risposta.getResponseCode() >= 300) {
    let messaggio = testo;
    try { messaggio = JSON.parse(testo).message || testo; } catch (e) { /* risposta non JSON */ }
    throw new Error('Il sito ha risposto ' + risposta.getResponseCode() + ': ' + messaggio);
  }
  return JSON.parse(testo);
}

function descriviEsito(esito) {
  const righe = [esito.anno + ': ' + esito.righe + ' soci aggiornati.'];
  if (esito.rimossi) righe.push(esito.rimossi + ' non più presenti nel foglio.');
  if (esito.senza_email && esito.senza_email.length) {
    righe.push('Senza email (non possono ricevere il collegamento): ' + esito.senza_email.join(', ') + '.');
  }
  return righe.join('\n');
}

/* --------------------------------------------------------------------------
   Avvisi al direttivo: un'email solo quando l'elenco cambia
   -------------------------------------------------------------------------- */
function mandaAvvisi(esiti) {
  const proprieta = PropertiesService.getScriptProperties();
  const destinatari = (proprieta.getProperty('AVVISI_A') || '').trim();
  if (!destinatari) return;

  const avvisi = chiama('avvisi_per_foglio', { p_chiave: proprieta.getProperty('CHIAVE') });
  const sezioni = [];

  const elenco = (titolo, voci, scrivi) => {
    if (voci && voci.length) sezioni.push(titolo + '\n' + voci.map((v) => '  - ' + scrivi(v)).join('\n'));
  };

  elenco('Proposte da rivedere:', avvisi.proposte_in_attesa, (v) => v.titolo || 'senza titolo');
  elenco('Opere online di soci non in regola con la quota:', avvisi.non_in_regola, (v) => v.titolo + ' (' + v.socio + ')');
  elenco('Opere da ripubblicare, il socio ha rinnovato:', avvisi.da_ripubblicare, (v) => v.titolo + ' (' + v.socio + ')');
  elenco('Opere online senza licenza registrata:', avvisi.senza_licenza, (v) => v.titolo + (v.socio ? ' (' + v.socio + ')' : ''));
  elenco('Licenze revocate negli ultimi 30 giorni:', avvisi.revoche_recenti, (v) => v.titolo + ' (' + v.socio + ')');
  (esiti || []).forEach((esito) => {
    elenco('Soci ' + esito.anno + ' senza email nel foglio:', esito.senza_email, (v) => v);
  });

  const testo = sezioni.join('\n\n');
  const firma = esadecimale(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, testo));
  if (!testo || proprieta.getProperty('AVVISI_ULTIMI') === firma) return;

  MailApp.sendEmail(
    destinatari,
    'Cortoteca: cose da sistemare',
    testo + '\n\nSi sistemano da https://cdlaps.com/gestione.html\n'
  );
  proprieta.setProperty('AVVISI_ULTIMI', firma);
}

function esadecimale(byte) {
  return byte.map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
}
