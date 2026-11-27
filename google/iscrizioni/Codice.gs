/* ==========================================================================
   DOMANDA DI AMMISSIONE A SOCIO — la web app che riceve le domande dal sito
   (vantaggi-tesseramento.html#associati, assets/js/vantaggi-tesseramento.js).

   Alla domanda:
   - controlla i dati, i limiti contro gli abusi e la chiave della domanda
     (la stessa chiave dà la stessa risposta: niente doppioni se la pagina
     riprova);
   - scrive una riga nella scheda "TESSERATI <anno>" del libro soci, SENZA
     numero di tessera e con "Pagato?" = No (la crea se manca);
   - prepara il PDF riepilogativo nella cartella "Domande di ammissione" e lo
     collega in "Link al modulo";
   - manda una mail a ciao@ (con il PDF) e una al candidato (PDF, statuto,
     istruzioni per pagare);
   - risponde alla pagina con il codice della domanda e i dati per pagare.

   Ogni minuto (controllaPagamenti): per le domande arrivate dal sito,
   quando il tesoriere ha messo "Pagato?" = Sì da un paio di minuti (così un
   Sì messo per sbaglio si può togliere), assegna il numero di tessera, compila
   la data di pagamento se manca, rinomina il PDF e manda "quota ricevuta"
   al candidato (e a ciao@ in copia nascosta). Una volta sola. Dà il numero
   anche alle righe scritte a mano (domande cartacee) pagate e senza #
   (numeraRigheCartacee): i numeri li assegna solo lo script, e chi rinnova
   riprende il suo (numeroPerRiga).
   Il tasto nella mail a ciao@ (doGet, mostraConferma, confermaQuota): apre
   una pagina, riservata all'account ciao@, con i dati della domanda e il
   numero di tessera che prenderà; "Conferma" fa subito quello che fa il Sì
   nel foglio, senza aspettare.
   Ogni mattina (riepilogoQuotidiano): a ciao@ le domande non pagate, quelle
   da far decadere, quelle pagate e non ancora ratificate, gli errori, i
   numeri di tessera doppi.

   È un progetto AUTONOMO (script.google.com → Nuovo progetto), non lo
   script del foglio: "Collega al sito" di sincronizza-soci.gs cancella
   tutti i trigger del suo progetto. Installazione, impostazioni e
   aggiornamenti: README.md in questa cartella. Progetto e casi limite:
   storico/2026-11-17-piano-iscrizione-online.md.
   ========================================================================== */

// Le intestazioni di TESSERATI <anno> lette e scritte (riga 1). Se una
// cambia nome lo script si ferma con un errore invece di scrivere male.
const INTESTAZIONI = {
  numero: '#',
  nome: 'Nome cognome',
  data: 'Data tesseramento',
  conferma: 'Conferma assemblea?',
  modulo: 'Link al modulo',
  pagato: 'Pagato?',
  modalita: 'Modalità pagamento',
  dataPagamento: 'Data pagamento',
  email: 'Email',
  note: 'Note'
};
// I valori dei menu del foglio
const MODALITA = { paypal: 'PayPal', bonifico: 'Bonifico', contanti: 'Cash' };
const NOMI_MODALITA = { paypal: 'PayPal', bonifico: 'bonifico', contanti: 'contanti' };

const LIMITI = {
  corpo: 10000,          // caratteri della richiesta
  tempoMinimo: 4000,     // ms fra l'apertura della pagina e l'invio
  allOra: 10,            // domande nuove all'ora, da chiunque
  perEmail: 3,           // domande nuove al giorno con la stessa email
  attesaSi: 2 * 60000,   // un Sì vale dopo che è rimasto almeno questo
  promemoria: 7,         // giorni senza pagamento prima del riepilogo
  decadenza: 30,         // giorni senza pagamento: la domanda decade
  ratifica: 20,          // giorni dal pagamento senza "Conferma assemblea?"
  // controllaPagamenti lascia stare per questo tempo una domanda appena
  // arrivata: PDF e mail li sta ancora facendo doPost (una web app non
  // dura più di 6 minuti)
  attesaNuova: 7 * 60000,
  tentativi: 6,          // giri falliti di PDF e mail prima di arrendersi
  riprova: 10 * 60000    // fra un tentativo fallito e l'altro
};
const LUNGHEZZE = {
  nome: 60, cognome: 60, luogo_nascita: 80, via: 120, comune: 80,
  provincia: 2, cap: 5, email: 120, cellulare: 20, chi_paga: 80
};
const FUSO = 'Europe/Rome';
// Da cambiare a ogni modifica: la mostrano la pagina della conferma e
// l'indirizzo della web app aperto senza parametri, per sapere quale
// versione serve ciascun deployment
const VERSIONE = '2026-11-27a';
const GENERICO = 'La domanda non è stata registrata. Riprova tra poco, o scrivici a ciao@cdlaps.com.';

class Rifiuto extends Error {}

/* --------------------------------------------------------------------------
   Impostazioni (Impostazioni progetto → Proprietà dello script)
   -------------------------------------------------------------------------- */
function impostazioni() {
  const p = PropertiesService.getScriptProperties().getProperties();
  const obbligatorie = ['FOGLIO_ID', 'CARTELLA_DOMANDE_ID', 'DESTINATARIO', 'PAYPAL_ME', 'IBAN',
    'QUOTE', 'INFORMATIVA', 'STATUTO', 'STATUTO_URL'];
  const mancanti = obbligatorie.filter((k) => !p[k]);
  if (mancanti.length) throw new Error('Impostazioni mancanti: ' + mancanti.join(', '));
  return {
    attivo: p.ATTIVO === 'si',
    foglio: p.FOGLIO_ID,
    cartella: p.CARTELLA_DOMANDE_ID,
    destinatario: p.DESTINATARIO,
    paypal: p.PAYPAL_ME.replace(/\/+$/, ''),
    iban: p.IBAN,
    beneficiario: p.BENEFICIARIO || 'CDL APS',
    quote: JSON.parse(p.QUOTE),
    informativa: p.INFORMATIVA,
    statuto: p.STATUTO,
    statutoUrl: p.STATUTO_URL,
    // L'indirizzo /exec del secondo deployment, riservato al dominio: senza,
    // la mail a ciao@ non ha il tasto
    urlConferma: p.URL_CONFERMA || ''
  };
}

/* --------------------------------------------------------------------------
   Registro delle domande arrivate dal sito (proprietà dello script):
   domanda:<codice> → stato; chiave:<chiave> → risposta già data;
   contatore:<anno> → ultimo numero di domanda
   -------------------------------------------------------------------------- */
const registro = {
  leggi(nome) {
    const v = PropertiesService.getScriptProperties().getProperty(nome);
    return v ? JSON.parse(v) : null;
  },
  scrivi(nome, valore) {
    PropertiesService.getScriptProperties().setProperty(nome, JSON.stringify(valore));
  },
  togli(nome) {
    PropertiesService.getScriptProperties().deleteProperty(nome);
  },
  // Rilegge la domanda, la cambia e la riscrive, sotto il lock: mai
  // scrivere una copia letta prima, che cancellerebbe quello che ha scritto
  // un'altra esecuzione (per esempio la conferma dal tasto della mail).
  // Se cambia() restituisce false non scrive niente. Mai chiamarla con il
  // lock già preso.
  aggiorna(codice, cambia) {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return null;
    try {
      const domanda = this.leggi('domanda:' + codice);
      if (!domanda) return null;
      if (cambia(domanda) === false) return domanda;
      this.scrivi('domanda:' + codice, domanda);
      return domanda;
    } finally {
      lock.releaseLock();
    }
  },
  domande() {
    const tutte = PropertiesService.getScriptProperties().getProperties();
    return Object.keys(tutte).filter((k) => k.startsWith('domanda:')).map((k) => JSON.parse(tutte[k]));
  }
};

/* --------------------------------------------------------------------------
   La web app
   -------------------------------------------------------------------------- */
function doPost(e) {
  try {
    return risposta(riceviDomanda(e));
  } catch (errore) {
    if (errore instanceof Rifiuto) return risposta({ ok: false, messaggio: errore.message });
    console.error(errore);
    return risposta({ ok: false, messaggio: GENERICO });
  }
}

/* La stessa web app è pubblicata due volte (README.md): "Chiunque", per le
   domande dal sito, e "Chiunque in cdlaps.com", per il tasto della mail a
   ciao@. La pagina del tasto risponde solo a chi è entrato in Google con
   l'account DESTINATARIO: la mail a ciao@ ha "Rispondi a" il candidato, e
   in una risposta il collegamento finirebbe citato. A chiunque altro va un
   testo semplice, mai una pagina HtmlService (da una pagina HtmlService si
   possono chiamare le funzioni dello script con google.script.run). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!p.codice) return risposta({ ok: false, messaggio: 'Qui si inviano le domande di ammissione di CDL APS dal sito.', versione: VERSIONE });
  let imp;
  try {
    imp = impostazioni();
  } catch (errore) {
    console.error(errore);
    return testoSemplice('La web app non è configurata.');
  }
  if (!utenteAutorizzato(imp)) {
    return testoSemplice('Questa pagina si apre solo con l\'account ' + imp.destinatario
      + '. Entra in Google con quell\'account e riapri il link della mail.');
  }
  const codice = String(p.codice).slice(0, 20);
  try {
    return p.t ? confermaQuota(codice, String(p.t).slice(0, 60), imp) : mostraConferma(codice, imp, '');
  } catch (errore) {
    console.error(errore);
    return paginaConferma({
      titolo: 'Qualcosa è andato storto',
      testo: 'Errore: ' + (errore.message || errore) + '. Riprova fra qualche minuto, oppure metti "Pagato?" = Sì nel foglio.'
    });
  }
}

function utenteAutorizzato(imp) {
  let email = '';
  try {
    email = Session.getActiveUser().getEmail();
  } catch (_) {
    return false;
  }
  return !!email && email.toLowerCase() === imp.destinatario.toLowerCase();
}

function testoSemplice(messaggio) {
  return ContentService.createTextOutput(messaggio).setMimeType(ContentService.MimeType.TEXT);
}

function risposta(oggetto) {
  return ContentService.createTextOutput(JSON.stringify(oggetto)).setMimeType(ContentService.MimeType.JSON);
}

function riceviDomanda(e) {
  const imp = impostazioni();
  if (!imp.attivo) throw new Rifiuto('La domanda dal sito per ora è chiusa: scrivici a ciao@cdlaps.com.');

  const corpo = (e && e.postData && e.postData.contents) || '';
  if (corpo.length > LIMITI.corpo) throw new Rifiuto(GENERICO);
  let d;
  try { d = JSON.parse(corpo); } catch (_) { throw new Rifiuto(GENERICO); }
  if (!d || typeof d !== 'object') throw new Rifiuto(GENERICO);
  if (d.trappola) throw new Rifiuto(GENERICO);
  if (typeof d.tempo_ms !== 'number' || d.tempo_ms < LIMITI.tempoMinimo) {
    throw new Rifiuto('La domanda è partita troppo in fretta: ricontrolla i dati e inviala di nuovo.');
  }
  const chiave = String(d.chiave || '');
  if (!/^[\w-]{16,64}$/.test(chiave)) throw new Rifiuto(GENERICO);

  // Stessa chiave: la pagina riprova dopo una risposta persa
  const giaData = registro.leggi('chiave:' + chiave);
  if (giaData) return giaData.risposta;

  const v = valida(d, imp);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Rifiuto(GENERICO);
  let domanda;
  let esito;
  try {
    const ripetuta = registro.leggi('chiave:' + chiave);
    if (ripetuta) return ripetuta.risposta;
    controllaLimiti(v.email);

    const adesso = new Date();
    const anno = Number(Utilities.formatDate(adesso, FUSO, 'yyyy'));
    const importo = imp.quote[anno];
    if (!importo) throw new Error('Nessuna quota per il ' + anno + ' nelle impostazioni (QUOTE)');

    const contatore = (registro.leggi('contatore:' + anno) || 0) + 1;
    registro.scrivi('contatore:' + anno, contatore);
    const codice = 'D' + String(anno).slice(2) + '-' + String(contatore).padStart(3, '0');

    const foglio = SpreadsheetApp.openById(imp.foglio);
    const scheda = schedaAnno(foglio, anno);
    const col = colonne(scheda);
    const segni = [];
    if (cercaEmail(scheda, col, v.email)) segni.push('possibile doppione (email già in questa scheda)');
    const prima = foglio.getSheetByName('TESSERATI ' + (anno - 1));
    let colPrima = null;
    try { colPrima = prima && colonne(prima, ['email']); } catch (_) { /* scheda vecchia senza Email */ }
    if (colPrima && cercaEmail(prima, colPrima, v.email)) segni.push('email presente anche in TESSERATI ' + (anno - 1));

    const quando = Utilities.formatDate(adesso, FUSO, "dd/MM/yyyy 'alle' HH:mm");
    // Corte: data e ora stanno in "Data tesseramento" e nel registro, le
    // versioni di statuto e informativa nel PDF
    const note = [
      'Sito ' + codice,
      v.chi_paga ? 'paga: ' + v.chi_paga : '',
      v.cellulare ? 'cell. ' + v.cellulare : ''
    ].concat(segni).filter(Boolean).join(' · ');

    const riga = primaRigaLibera(scheda, col);
    if (riga > scheda.getMaxRows()) scheda.insertRowsAfter(scheda.getMaxRows(), 20);
    const scrivi = (campo, valore) => scheda.getRange(riga, col[campo]).setValue(valore);
    scrivi('numero', '');
    scrivi('nome', testo(v.nome + ' ' + v.cognome));
    scrivi('data', giornoSenzaOra(adesso));
    scheda.getRange(riga, col.data).setNumberFormat('dd/mm/yyyy');
    scrivi('conferma', 'No');
    scrivi('pagato', 'No');
    scrivi('modalita', MODALITA[v.pagamento]);
    scrivi('email', testo(v.email));
    scrivi('note', testo(note));
    SpreadsheetApp.flush();

    const causale = 'Quota associativa ' + anno + ' ' + v.cognome + ' ' + v.nome + ' ' + codice;
    esito = {
      ok: true,
      codice: codice,
      anno: anno,
      importo: importo,
      pagamento: v.pagamento,
      email: v.email,
      causale: causale,
      paypal: v.pagamento === 'paypal' ? imp.paypal + '/' + importo + 'EUR' : '',
      iban: v.pagamento === 'bonifico' ? imp.iban : '',
      beneficiario: v.pagamento === 'bonifico' ? imp.beneficiario : ''
    };
    domanda = {
      codice: codice,
      anno: anno,
      ricevuta: adesso.getTime(),
      quando: quando,
      importo: importo,
      causale: causale,
      segni: segni,
      // i dati servono a rifare PDF e mail se falliscono: si tolgono appena
      // la quota è registrata
      dati: v,
      stato: 'da pagare',
      pdf: '',
      mailNoi: false,
      mailCandidato: false,
      tentativi: 0,
      errore: '',
      siDal: 0
    };
    registro.scrivi('domanda:' + codice, domanda);
    registro.scrivi('chiave:' + chiave, { quando: adesso.getTime(), risposta: esito });
    contaDomanda(v.email);
  } finally {
    lock.releaseLock();
  }

  // Fuori dal lock: PDF e mail. Se falliscono la domanda è comunque salvata
  // e la risposta resta ok; controllaPagamenti riprova.
  completaDomanda(domanda.codice, imp);
  return esito;
}

/* --------------------------------------------------------------------------
   Controlli
   -------------------------------------------------------------------------- */
function valida(d, imp) {
  const v = {};
  Object.keys(LUNGHEZZE).forEach((campo) => {
    // L'apostrofo tipografico (’), che iPhone e Mac mettono da soli, vale come '
    const valore = String(d[campo] == null ? '' : d[campo]).replace(/[\u2018\u2019\u02BC`´]/g, "'").replace(/\s+/g, ' ').trim();
    if (valore.length > LUNGHEZZE[campo]) throw new Rifiuto('Un campo è troppo lungo: ricontrollalo.');
    v[campo] = valore;
  });
  const nomeProprio = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;
  const luogo = /^[\p{L}\p{M}][\p{L}\p{M}' .()\/-]*$/u;
  const libero = /^[^<>\p{Cc}]+$/u;
  if (!nomeProprio.test(v.nome) || !nomeProprio.test(v.cognome)) throw new Rifiuto('Controlla nome e cognome: solo lettere, spazi, apostrofi e trattini.');
  if (!luogo.test(v.luogo_nascita)) throw new Rifiuto('Controlla il luogo di nascita.');
  if (!libero.test(v.via) || !luogo.test(v.comune)) throw new Rifiuto('Controlla l\'indirizzo.');
  if (!/^[A-Za-z]{2}$/.test(v.provincia)) throw new Rifiuto('La provincia va scritta con la sigla di due lettere.');
  v.provincia = v.provincia.toUpperCase();
  if (!/^\d{5}$/.test(v.cap)) throw new Rifiuto('Il CAP ha cinque cifre.');
  // Niente punti all'inizio, alla fine o doppi: MailApp rifiuterebbe l'indirizzo
  if (!/^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[A-Za-z]{2,}$/.test(v.email) || /\.\.|^\.|\.@|@\./.test(v.email)) {
    throw new Rifiuto('Controlla l\'indirizzo email.');
  }
  v.email = v.email.toLowerCase();
  if (v.cellulare && !/^[0-9+ ]{6,20}$/.test(v.cellulare)) throw new Rifiuto('Controlla il numero di cellulare.');
  if (v.chi_paga && !nomeProprio.test(v.chi_paga)) throw new Rifiuto('Controlla il nome di chi paga.');

  const nascita = String(d.data_nascita || '');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nascita);
  if (!m) throw new Rifiuto('Controlla la data di nascita.');
  const [anno, mese, giorno] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const oggi = Utilities.formatDate(new Date(), FUSO, 'yyyy-MM-dd').split('-').map(Number);
  let eta = oggi[0] - anno;
  if (oggi[1] < mese || (oggi[1] === mese && oggi[2] < giorno)) eta -= 1;
  if (eta < 18) throw new Rifiuto('La domanda dal sito è per i maggiorenni: per un minore serve il modulo cartaceo, firmato da un genitore.');
  if (eta > 120 || mese < 1 || mese > 12 || giorno < 1 || giorno > 31) throw new Rifiuto('Controlla la data di nascita.');
  v.data_nascita = String(giorno).padStart(2, '0') + '/' + String(mese).padStart(2, '0') + '/' + anno;

  if (!Object.prototype.hasOwnProperty.call(MODALITA, d.pagamento)) throw new Rifiuto('Scegli come paghi la quota.');
  v.pagamento = d.pagamento;
  if (d.ammissione !== true || d.maggiorenne !== true) throw new Rifiuto('Mancano le dichiarazioni.');
  if (d.statuto !== imp.statuto || d.informativa !== imp.informativa) {
    throw new Rifiuto('I documenti sono stati aggiornati: ricarica la pagina, riaprili e invia di nuovo.');
  }
  v.statuto = imp.statuto;
  v.informativa = imp.informativa;
  return v;
}

// Limiti contro gli abusi: l'indirizzo della web app è pubblico, e il
// limite per email evita che qualcuno faccia arrivare le nostre mail a un
// indirizzo altrui. Contano solo le domande registrate (contaDomanda, dopo
// la scrittura): un tentativo fallito per un errore nostro non consuma il
// limite di chi riprova (successo il 27 novembre 2026, con una colonna del
// foglio rinominata)
function chiaviLimiti(email) {
  const adesso = new Date();
  return {
    ora: 'ora:' + Utilities.formatDate(adesso, FUSO, 'yyyyMMddHH'),
    giorno: 'email:' + impronta(email) + ':' + Utilities.formatDate(adesso, FUSO, 'yyyyMMdd')
  };
}

function controllaLimiti(email) {
  const cache = CacheService.getScriptCache();
  const k = chiaviLimiti(email);
  if (Number(cache.get(k.ora) || 0) >= LIMITI.allOra) throw new Rifiuto('In questo momento arrivano troppe domande: riprova fra un\'ora, o scrivici a ciao@cdlaps.com.');
  if (Number(cache.get(k.giorno) || 0) >= LIMITI.perEmail) throw new Rifiuto('Con questa email sono già arrivate alcune domande oggi: se serve, scrivici a ciao@cdlaps.com.');
}

// Sotto il lock, appena la domanda è scritta
function contaDomanda(email) {
  const cache = CacheService.getScriptCache();
  const k = chiaviLimiti(email);
  cache.put(k.ora, String(Number(cache.get(k.ora) || 0) + 1), 3600);
  cache.put(k.giorno, String(Number(cache.get(k.giorno) || 0) + 1), 86400);
}

/* Da eseguire a mano dall'editor: azzera per oggi il limite di domande di
   un'email (e quello dell'ora in corso). Scrivi l'indirizzo fra le
   virgolette, esegui, poi rimettilo vuoto */
function sbloccaEmail() {
  const email = '';
  if (!email) throw new Error('Scrivi l\'email fra le virgolette in sbloccaEmail, poi esegui di nuovo');
  const k = chiaviLimiti(email.trim().toLowerCase());
  CacheService.getScriptCache().removeAll([k.ora, k.giorno]);
  console.log('Limite azzerato per oggi: ' + email.trim().toLowerCase());
}

function impronta(testo) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, testo, Utilities.Charset.UTF_8)
    .map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('').slice(0, 24);
}

// Testo nel foglio: l'apostrofo davanti impedisce che diventi una formula
function testo(valore) {
  return "'" + String(valore);
}

function giornoSenzaOra(data) {
  const [a, m, g] = Utilities.formatDate(data, FUSO, 'yyyy-MM-dd').split('-').map(Number);
  return new Date(a, m - 1, g, 12, 0, 0);
}

/* --------------------------------------------------------------------------
   Il libro soci
   -------------------------------------------------------------------------- */

// La scheda dell'anno; se manca la crea copiando quella dell'anno prima
// (intestazioni, formati, menu), senza i dati
function schedaAnno(foglio, anno) {
  const nome = 'TESSERATI ' + anno;
  const esistente = foglio.getSheetByName(nome);
  if (esistente) return esistente;
  const prima = foglio.getSheetByName('TESSERATI ' + (anno - 1));
  if (!prima) throw new Error('Manca la scheda ' + nome + ' e non c\'è quella dell\'anno prima da copiare');
  const nuova = prima.copyTo(foglio).setName(nome);
  const righe = nuova.getMaxRows();
  if (righe > 1) nuova.getRange(2, 1, righe - 1, nuova.getMaxColumns()).clearContent();
  foglio.setActiveSheet(nuova);
  foglio.moveActiveSheet(1);
  return nuova;
}

// La posizione (1, 2, …) di ogni intestazione. Senza `campi` servono tutte
// (la scheda dove si scrive); per leggere le schede degli anni prima, che
// possono avere meno colonne, si chiedono solo quelle che servono.
function colonne(scheda, campi) {
  const intestazioni = scheda.getRange(1, 1, 1, scheda.getLastColumn()).getDisplayValues()[0].map((t) => t.trim());
  const col = {};
  (campi || Object.keys(INTESTAZIONI)).forEach((campo) => {
    const i = intestazioni.indexOf(INTESTAZIONI[campo]);
    if (i < 0) throw new Error('Nella scheda ' + scheda.getName() + ' manca la colonna "' + INTESTAZIONI[campo] + '"');
    col[campo] = i + 1;
  });
  return col;
}

function valoriColonna(scheda, colonna) {
  const ultima = scheda.getLastRow();
  if (ultima < 2) return [];
  return scheda.getRange(2, colonna, ultima - 1, 1).getDisplayValues().map((r) => r[0].trim());
}

function cercaEmail(scheda, col, email) {
  return valoriColonna(scheda, col.email).some((v) => v.toLowerCase() === email);
}

// La riga dopo l'ultima con un nome (non getLastRow: celle formattate più in
// basso la sposterebbero)
function primaRigaLibera(scheda, col) {
  const nomi = valoriColonna(scheda, col.nome);
  let ultima = 0;
  nomi.forEach((n, i) => { if (n) ultima = i + 1; });
  return ultima + 2;
}

// La riga della domanda, dal suo codice all'inizio delle Note: "Sito
// D26-017 · …" (fino al 18 novembre 2026 "Domanda dal sito D26-017, …")
function notaDellaDomanda(nota, codice) {
  const n = String(nota).trim();
  const inizio = 'Sito ' + codice;
  if (n.indexOf(inizio) === 0) return !/[0-9A-Za-z]/.test(n.charAt(inizio.length));
  return n.indexOf('Domanda dal sito ' + codice + ',') === 0;
}

function rigaDomanda(scheda, col, codice) {
  const note = valoriColonna(scheda, col.note);
  const i = note.findIndex((n) => notaDellaDomanda(n, codice));
  return i < 0 ? 0 : i + 2;
}

// I numeri di tessera delle righe con un nome: un numero scritto in anticipo
// su una riga vuota non conta (fino al 17 novembre 2026 nel foglio c'erano
// i numeri da 035 a 150 già scritti)
function numeriUsati(scheda, col) {
  const nomi = valoriColonna(scheda, col.nome);
  return valoriColonna(scheda, col.numero)
    .map((n, i) => (nomi[i] && /^\d+$/.test(n) ? { numero: n, riga: i + 2 } : null))
    .filter(Boolean);
}

/* Il numero di tessera è della persona, non dell'anno: chi rinnova tiene
   il suo (decisione dell'utente, 18 novembre 2026). Quindi:
   - se la persona ha già un numero in un'altra scheda TESSERATI (stessa
     email; senza email, stesso nome e cognome), riprende quello, purché
     nella scheda di quest'anno non l'abbia già qualcun altro;
   - altrimenti prende il successivo al più alto mai usato, in tutte le
     schede TESSERATI. */
function schedeTesserati(foglio) {
  return foglio.getSheets().filter((s) => /^TESSERATI \d{4}$/.test(s.getName()));
}

function normalizza(testo) {
  return String(testo || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/* Tutto quello che serve per numerare, letto una volta sola: i numeri già
   usati in questa scheda, il più alto di tutte le schede, e i numeri delle
   altre schede per email e per nome. Le schede senza le colonne # e Nome
   cognome si saltano; senza Email si cerca solo per nome. */
function indiceTesserati(scheda, col) {
  const indice = { giaQui: {}, piuAlto: 0, perEmail: {}, perNome: {} };
  numeriUsati(scheda, col).forEach((u) => { indice.giaQui[parseInt(u.numero, 10)] = true; });
  schedeTesserati(scheda.getParent()).forEach((s) => {
    const questa = s.getSheetId() === scheda.getSheetId();
    let c = col;
    if (!questa) {
      try { c = colonne(s, ['numero', 'nome']); } catch (_) { return; }
      try { c.email = colonne(s, ['email']).email; } catch (_) { c.email = 0; }
    }
    const nomi = valoriColonna(s, c.nome);
    const emails = c.email ? valoriColonna(s, c.email) : [];
    numeriUsati(s, c).forEach((u) => {
      const n = parseInt(u.numero, 10);
      if (n > indice.piuAlto) indice.piuAlto = n;
      if (questa) return;
      const i = u.riga - 2;
      const email = normalizza(emails[i]);
      const nome = normalizza(nomi[i]);
      if (email && !indice.perEmail[email]) indice.perEmail[email] = u.numero;
      if (nome && !indice.perNome[nome]) indice.perNome[nome] = u.numero;
    });
  });
  return indice;
}

// Il numero per una riga (vedi sopra). Con più righe da numerare si passa
// lo stesso indice: tiene conto dei numeri appena dati.
function numeroPerRiga(scheda, col, riga, indice) {
  indice = indice || indiceTesserati(scheda, col);
  const email = normalizza(scheda.getRange(riga, col.email).getDisplayValue());
  const nome = normalizza(scheda.getRange(riga, col.nome).getDisplayValue());
  const ripreso = email ? indice.perEmail[email] : indice.perNome[nome];
  if (ripreso && !indice.giaQui[parseInt(ripreso, 10)]) {
    indice.giaQui[parseInt(ripreso, 10)] = true;
    return ripreso;
  }
  indice.piuAlto += 1;
  indice.giaQui[indice.piuAlto] = true;
  return String(indice.piuAlto).padStart(3, '0');
}

// I numeri che compaiono su più righe: "2 righe con 036 (righe 37, 40)"
function numeriDoppi(scheda, col) {
  const righe = {};
  numeriUsati(scheda, col).forEach((u) => {
    const chiave = String(parseInt(u.numero, 10));
    (righe[chiave] = righe[chiave] || []).push(u);
  });
  return Object.keys(righe).filter((k) => righe[k].length > 1)
    .map((k) => righe[k][0].numero + ' (righe ' + righe[k].map((u) => u.riga).join(', ') + ')');
}

function nomeFile(prefisso, d) {
  const pulito = (d.nome + d.cognome).replace(/[\/\\:*?"<>|\p{Cc}\s']+/gu, '');
  return (prefisso + '_' + pulito).slice(0, 80);
}

function collegaPdf(scheda, riga, col, file, testoLink) {
  const valore = SpreadsheetApp.newRichTextValue().setText(testoLink).setLinkUrl(file.getUrl()).build();
  scheda.getRange(riga, col.modulo).setRichTextValue(valore);
}

/* --------------------------------------------------------------------------
   PDF e mail della domanda
   -------------------------------------------------------------------------- */
/* PDF, mail a ciao@, mail al candidato: tre passi, ognuno segnato nel
   registro appena fatto, così un nuovo tentativo rifà solo quello che manca
   (e ciao@ non riceve la stessa domanda due volte). Legge sempre la domanda
   fresca dal registro. */
function completaDomanda(codice, imp) {
  const domanda = registro.leggi('domanda:' + codice);
  if (!domanda || domanda.stato !== 'da pagare') return domanda;
  // Solo i campi di questa funzione, e solo se nel frattempo la domanda non
  // è stata accolta (dal tasto della mail, mentre qui partivano le mail)
  const salva = () => registro.aggiorna(codice, (x) => {
    if (x.stato !== 'da pagare') return false;
    ['pdf', 'mailNoi', 'mailCandidato', 'tentativi', 'provata', 'errore'].forEach((k) => { x[k] = domanda[k]; });
  });
  try {
    if (!domanda.pdf) {
      const modello = HtmlService.createTemplateFromFile('domanda');
      modello.d = domanda.dati;
      modello.domanda = domanda;
      modello.modalita = NOMI_MODALITA[domanda.dati.pagamento];
      const nome = nomeFile(domanda.codice, domanda.dati);
      const blob = modello.evaluate().getBlob().getAs('application/pdf').setName(nome + '.pdf');
      const file = DriveApp.getFolderById(imp.cartella).createFile(blob);
      domanda.pdf = file.getId();
      salva();
      const scheda = SpreadsheetApp.openById(imp.foglio).getSheetByName('TESSERATI ' + domanda.anno);
      const col = colonne(scheda);
      const riga = rigaDomanda(scheda, col, domanda.codice);
      if (riga) collegaPdf(scheda, riga, col, file, nome);
    }
    if (!domanda.mailNoi || !domanda.mailCandidato) {
      if (MailApp.getRemainingDailyQuota() < 3) throw new Error('Quota giornaliera delle mail quasi finita');
      const pdf = DriveApp.getFileById(domanda.pdf).getBlob();
      if (!domanda.mailNoi) {
        mandaMailNoi(domanda, imp, pdf);
        domanda.mailNoi = true;
        salva();
      }
      if (!domanda.mailCandidato) {
        mandaMailCandidato(domanda, imp, pdf);
        domanda.mailCandidato = true;
        salva();
      }
    }
    domanda.errore = '';
    salva();
  } catch (errore) {
    console.error(errore);
    domanda.tentativi = (domanda.tentativi || 0) + 1;
    domanda.provata = Date.now();
    domanda.errore = String(errore.message || errore);
    salva();
  }
  return domanda;
}

function istruzioniPagamento(domanda, imp) {
  const d = domanda.dati;
  if (d.pagamento === 'paypal') {
    return [
      'Puoi pagare con PayPal da qui: ' + imp.paypal + '/' + domanda.importo + 'EUR',
      'IMPORTANTE: su PayPal scegli "Amici e familiari", non "Beni e servizi". Nel messaggio scrivi questa causale:',
      domanda.causale
    ].join('\n');
  }
  if (d.pagamento === 'bonifico') {
    return [
      'Puoi fare un bonifico istantaneo:',
      'IBAN: ' + imp.iban,
      'Intestato a: ' + imp.beneficiario,
      'Importo: ' + domanda.importo + ' euro',
      'Causale: ' + domanda.causale
    ].join('\n');
  }
  return 'Per pagare in contanti rispondi a questa mail e ci mettiamo d\'accordo: ci vediamo di persona '
    + 'o al prossimo evento. Il codice della tua domanda è ' + domanda.codice + '.';
}

function mandaMailNoi(domanda, imp, pdf) {
  const d = domanda.dati;
  const nomeCompleto = d.nome + ' ' + d.cognome;

  const perNoi = [
    nomeCompleto + ' ha fatto domanda di ammissione dal sito (' + domanda.codice + ', ' + domanda.quando + ').',
    '',
    'Nome: ' + nomeCompleto,
    'Nato/a a ' + d.luogo_nascita + ' il ' + d.data_nascita,
    'Residenza: ' + d.via + ', ' + d.cap + ' ' + d.comune + ' (' + d.provincia + ')',
    'Email: ' + d.email,
    d.cellulare ? 'Cellulare: ' + d.cellulare : '',
    'Pagamento: ' + NOMI_MODALITA[d.pagamento] + ', ' + domanda.importo + ' euro per il ' + domanda.anno,
    d.chi_paga ? 'Paga: ' + d.chi_paga : '',
    'Causale: ' + domanda.causale,
    domanda.segni.length ? '\nDa controllare: ' + domanda.segni.join('; ') : '',
    '',
    'La trovi nella scheda TESSERATI ' + domanda.anno + ', ancora senza numero di tessera.'
  ].filter((r) => r !== '');
  const link = imp.urlConferma ? imp.urlConferma + '?codice=' + encodeURIComponent(domanda.codice) : '';
  const comeAccogliere = link
    ? ['Quando arriva la quota, apri il link qui sotto con l\'account ' + imp.destinatario + '. Ti mostra il numero '
      + 'da scrivere sulla tessera, e con "Conferma" la domanda è accolta: lo script aggiorna il foglio, rinomina il PDF '
      + 'e manda il benvenuto a ' + d.nome + '.',
      'Se preferisci, puoi anche mettere "Pagato?" = Sì nel foglio: ci pensa lo script in tre o quattro minuti.']
    : ['Quando arriva la quota, metti "Pagato?" = Sì nel foglio: in tre o quattro minuti lo script dà il numero di '
      + 'tessera, aggiorna il foglio, rinomina il PDF e manda il benvenuto a ' + d.nome + '.'];
  const chiusura = 'Il PDF della domanda è allegato. Se rispondi a questa mail, scrivi direttamente a ' + d.nome + '.';
  const body = perNoi.concat([''], comeAccogliere.slice(0, 1), link ? [link] : [], comeAccogliere.slice(1), ['', chiusura]).join('\n');
  const paragrafo = (righe) => '<p>' + righe.map(html).join('<br>') + '</p>';
  const htmlBody = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#111">'
    + paragrafo(perNoi)
    + paragrafo(comeAccogliere.slice(0, 1))
    + (link ? '<p><a href="' + html(link) + '" style="display:inline-block;background:#f26b21;color:#111;'
      + 'font-weight:bold;text-decoration:none;padding:12px 20px;border-radius:12px">Quota arrivata: accogli la domanda</a></p>' : '')
    + comeAccogliere.slice(1).map((r) => paragrafo([r])).join('')
    + paragrafo([chiusura]) + '</div>';
  MailApp.sendEmail({
    to: imp.destinatario,
    replyTo: d.email,
    name: 'CDL APS',
    subject: '[Sito CDL] Domanda di ammissione – ' + nomeCompleto + ' – ' + MODALITA[d.pagamento] + ', da pagare'
      + (domanda.segni.length ? ' – da controllare' : ''),
    body: body,
    htmlBody: htmlBody,
    attachments: [pdf]
  });
}

function html(testo) {
  return String(testo).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/* --------------------------------------------------------------------------
   Il tasto della mail a ciao@ (solo per l'account DESTINATARIO, vedi doGet)
   -------------------------------------------------------------------------- */

/* Prima pagina: i dati della domanda e il numero di tessera che prenderà,
   da scrivere sulla tessera. Non cambia niente: un antivirus o un'anteprima
   che apre il collegamento non accoglie nessuna domanda. Il tasto Conferma
   porta una chiave usa e getta (30 minuti), così un collegamento di
   conferma non si può preparare da fuori. */
function mostraConferma(codice, imp, avviso) {
  const domanda = registro.leggi('domanda:' + codice);
  if (!domanda) {
    return paginaConferma({
      titolo: 'Domanda ' + codice + ' non trovata',
      testo: 'Questa domanda non c\'è più: forse è scaduta, o la riga è stata tolta dal foglio. Se la quota è '
        + 'arrivata, scrivi la riga a mano e metti "Pagato?" = Sì, e il numero lo dà lo script.'
    });
  }
  if (domanda.stato === 'pagata') {
    return paginaConferma({
      titolo: 'Domanda già accolta',
      numero: domanda.numero,
      etichettaNumero: 'Numero di tessera',
      righe: [['Socio', domanda.nome], ['Domanda', domanda.codice]],
      avviso: avviso,
      testo: domanda.mailBenvenuto === false
        ? 'La quota è registrata, ma la mail di benvenuto non era partita: scrivi tu a ' + domanda.nome + '.'
        : 'La quota è registrata e la mail di benvenuto è già partita.'
    });
  }
  const scheda = SpreadsheetApp.openById(imp.foglio).getSheetByName('TESSERATI ' + domanda.anno);
  const col = scheda && colonne(scheda);
  const riga = scheda ? rigaDomanda(scheda, col, domanda.codice) : 0;
  if (!riga) {
    return paginaConferma({
      titolo: 'Riga non trovata',
      testo: 'Nel foglio non trovo la riga di questa domanda. Le sue Note devono cominciare con "Sito '
        + codice + '": dai un\'occhiata al foglio.'
    });
  }
  const numero = scheda.getRange(riga, col.numero).getDisplayValue().trim() || numeroPerRiga(scheda, col, riga);
  const chiave = Utilities.getUuid();
  CacheService.getScriptCache().put('conferma:' + chiave, JSON.stringify({ codice: codice, numero: numero }), 1800);
  const d = domanda.dati;
  return paginaConferma({
    titolo: d.nome + ' ' + d.cognome,
    numero: numero,
    etichettaNumero: 'Numero da scrivere sulla tessera',
    righe: [
      ['Domanda', domanda.codice + ', ' + domanda.quando],
      ['Quota', domanda.importo + ' euro per il ' + domanda.anno],
      ['Pagamento', NOMI_MODALITA[d.pagamento] + (d.chi_paga ? ', paga ' + d.chi_paga : '')],
      ['Causale', domanda.causale],
      ['Email', d.email]
    ],
    avviso: avviso || (domanda.segni.length ? 'Da controllare: ' + domanda.segni.join('; ') : ''),
    testo: 'Premi "Conferma" solo quando la quota è arrivata tutta. Il numero diventa definitivo, il foglio si '
      + 'aggiorna e a ' + d.nome + ' arriva la mail di benvenuto.',
    tasto: { etichetta: 'Quota arrivata: conferma', url: indirizzoConferma(imp) + '?codice=' + encodeURIComponent(codice) + '&t=' + chiave },
    pdf: domanda.pdf ? 'https://drive.google.com/file/d/' + domanda.pdf + '/view' : ''
  });
}

/* Il tasto Conferma: la chiave vale una volta sola. Un ricaricamento (o una
   chiave scaduta) mostra di nuovo la prima pagina, che dice com'è la
   domanda adesso. */
function confermaQuota(codice, chiave, imp) {
  const cache = CacheService.getScriptCache();
  const salvata = cache.get('conferma:' + chiave);
  if (!salvata) return mostraConferma(codice, imp, 'Questo link di conferma era già stato usato, o è scaduto. Ecco com\'è la domanda adesso.');
  const visto = JSON.parse(salvata);
  if (visto.codice !== codice) return mostraConferma(codice, imp, '');
  cache.remove('conferma:' + chiave);

  const domanda = registro.leggi('domanda:' + codice);
  if (!domanda || domanda.stato !== 'da pagare') return mostraConferma(codice, imp, '');
  const scheda = SpreadsheetApp.openById(imp.foglio).getSheetByName('TESSERATI ' + domanda.anno);
  const col = scheda && colonne(scheda);
  const riga = scheda ? rigaDomanda(scheda, col, codice) : 0;
  if (!riga) return mostraConferma(codice, imp, '');

  const dopo = registraQuota(domanda, scheda, col, riga, imp, true);
  if (!dopo || dopo.stato !== 'pagata') {
    return paginaConferma({
      titolo: 'Non ancora confermata',
      testo: 'Il foglio era occupato. Riprova fra un minuto dal link della mail.'
    });
  }
  const cambiato = dopo.numero !== visto.numero;
  return paginaConferma({
    titolo: 'Domanda accolta',
    numero: dopo.numero,
    etichettaNumero: 'Numero di tessera',
    righe: [['Socio', dopo.nome], ['Domanda', dopo.codice]],
    avviso: [
      cambiato ? 'Attenzione: nel frattempo il ' + visto.numero + ' è andato a un\'altra persona. Sulla tessera scrivi '
        + dopo.numero + '.' : '',
      dopo.errore ? 'Da sistemare: ' + dopo.errore + '.' : ''
    ].filter(Boolean).join(' '),
    testo: 'Fatto! Il foglio è aggiornato'
      + (dopo.mailBenvenuto === false ? '.' : ' e la mail di benvenuto è partita.')
      + ' Resta solo la ratifica del direttivo, entro 30 giorni: dopo la riunione metti "Conferma assemblea?" = Sì.'
  });
}

function indirizzoConferma(imp) {
  return imp.urlConferma || ScriptApp.getService().getUrl();
}

// La pagina è scritta qui, non in un modello HtmlService: ogni dato passa
// da html(), che fa l'escape (i dati arrivano dal modulo del sito)
const STILE_CONFERMA = [
  'body{margin:0;background:#f7f7f7;color:#111;font-family:Arial,Helvetica,sans-serif}',
  'main{max-width:520px;margin:0 auto;padding:28px 16px 40px}',
  'h1{font-size:26px;font-weight:900;text-transform:uppercase;margin:0 0 18px;line-height:1.1}',
  '.numero{background:#f26b21;border-radius:20px;padding:18px 20px;margin:0 0 20px}',
  '.numero span{display:block;font-size:14px;font-weight:700}',
  '.numero strong{display:block;font-size:64px;font-weight:900;line-height:1;margin-top:6px}',
  'dl{margin:0 0 18px;display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;font-size:15px}',
  'dt{font-weight:700}dd{margin:0;overflow-wrap:anywhere}',
  '.avviso{background:#fff;border:2px solid #111;border-radius:14px;padding:12px 14px;font-weight:700;margin:0 0 18px}',
  'p{font-size:15px;line-height:1.5}',
  '.tasto{display:block;text-align:center;background:#111;color:#fff;text-decoration:none;font-weight:800;font-size:17px;padding:16px 20px;border-radius:14px;margin:22px 0 14px}',
  '.pdf{color:#111;font-weight:700}',
  '.versione{margin-top:32px;font-size:12px;color:#777}'
].join('');

function paginaConferma(dati) {
  const v = Object.assign({ numero: '', etichettaNumero: '', righe: [], avviso: '', testo: '', tasto: null, pdf: '' }, dati);
  const parti = ['<!DOCTYPE html><html lang="it"><head><base target="_top"><meta charset="UTF-8"><style>' + STILE_CONFERMA + '</style></head><body><main>'];
  parti.push('<h1>' + html(v.titolo) + '</h1>');
  if (v.numero) parti.push('<div class="numero"><span>' + html(v.etichettaNumero) + '</span><strong>' + html(v.numero) + '</strong></div>');
  if (v.avviso) parti.push('<p class="avviso">' + html(v.avviso) + '</p>');
  if (v.righe.length) parti.push('<dl>' + v.righe.map((r) => '<dt>' + html(r[0]) + '</dt><dd>' + html(r[1]) + '</dd>').join('') + '</dl>');
  if (v.testo) parti.push('<p>' + html(v.testo) + '</p>');
  if (v.tasto) parti.push('<a class="tasto" href="' + html(v.tasto.url) + '">' + html(v.tasto.etichetta) + '</a>');
  if (v.pdf) parti.push('<p><a class="pdf" href="' + html(v.pdf) + '" target="_blank" rel="noopener">Apri il PDF della domanda</a></p>');
  parti.push('<p class="versione">Versione ' + VERSIONE + '</p></main></body></html>');
  return HtmlService.createHtmlOutput(parti.join(''))
    .setTitle('Domanda di ammissione – CDL APS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Da eseguire dall'editor per vedere la pagina della conferma senza
// passare dal deployment: scrive nel log l'inizio della pagina per la
// domanda indicata (prepara solo l'anteprima, non conferma niente)
function provaPagina() {
  const codice = 'D26-001';
  const pagina = mostraConferma(codice, impostazioni(), '').getContent();
  console.log('Versione ' + VERSIONE + ', pagina di ' + pagina.length + ' caratteri');
  console.log(pagina.replace(/<style>.*?<\/style>/, '<style>…</style>').slice(0, 1500));
}

function mandaMailCandidato(domanda, imp, pdf) {
  const d = domanda.dati;
  const allegati = [pdf];
  try {
    allegati.push(UrlFetchApp.fetch(imp.statutoUrl).getBlob().setName('Statuto CDL APS.pdf'));
  } catch (errore) {
    console.error('Statuto non scaricato: ' + errore);
  }
  const perCandidato = [
    'Ciao ' + d.nome + ',',
    '',
    'grazie per la tua domanda di ammissione a CDL APS! In allegato trovi il riepilogo e lo statuto.',
    '',
    'Se hai già pagato la quota sei a posto: appena ci arriva ti scriviamo con il tuo numero di tessera.',
    '',
    'Se non l\'hai ancora pagata, sono ' + domanda.importo + ' euro per il ' + domanda.anno + '.',
    istruzioniPagamento(domanda, imp),
    '',
    'Il codice ' + domanda.codice + ' ci serve solo a riconoscere il tuo pagamento, non è il numero di tessera. '
      + 'Se per qualche motivo la domanda non venisse accolta, ti restituiamo la quota.',
    '',
    'Per qualsiasi dubbio rispondi pure a questa mail.',
    '',
    'A presto!',
    'CDL APS',
    'cdlaps.com',
    '',
    '—',
    'Non hai fatto tu questa domanda? Ignora pure questa mail: senza pagamento non succede niente. Se vuoi che '
      + 'cancelliamo i tuoi dati, scrivici.'
  ].join('\n');
  MailApp.sendEmail({
    to: d.email,
    replyTo: imp.destinatario,
    name: 'CDL APS',
    subject: 'La tua domanda per CDL APS (' + domanda.codice + ')',
    body: perCandidato,
    attachments: allegati
  });
}

/* --------------------------------------------------------------------------
   Ogni minuto: pagamenti segnati dal tesoriere, PDF e mail da rifare
   -------------------------------------------------------------------------- */
function controllaPagamenti() {
  // Un giro lento non deve accavallarsi con quello del minuto dopo. Il
  // segno dura più di un'esecuzione (6 minuti al massimo), e ogni giro
  // toglie solo il suo
  const cache = CacheService.getScriptCache();
  if (cache.get('giro in corso')) return;
  const mio = Utilities.getUuid();
  cache.put('giro in corso', mio, 420);
  try {
    giroPagamenti();
  } finally {
    if (cache.get('giro in corso') === mio) cache.remove('giro in corso');
  }
}

function giroPagamenti() {
  const imp = impostazioni();
  const aperte = registro.domande().filter((d) => d.stato === 'da pagare');
  const foglio = SpreadsheetApp.openById(imp.foglio);

  aperte.forEach((domanda) => {
    try {
      const incompleta = !domanda.pdf || !domanda.mailNoi || !domanda.mailCandidato;
      if (incompleta) {
        // Appena arrivata: ci sta ancora lavorando doPost
        if (Date.now() - domanda.ricevuta < LIMITI.attesaNuova) return;
        const daRiprovare = (domanda.tentativi || 0) < LIMITI.tentativi
          && Date.now() - (domanda.provata || 0) >= LIMITI.riprova;
        if (daRiprovare) domanda = completaDomanda(domanda.codice, imp) || domanda;
      }
      const scheda = foglio.getSheetByName('TESSERATI ' + domanda.anno);
      if (!scheda) return;
      const col = colonne(scheda);
      const riga = rigaDomanda(scheda, col, domanda.codice);
      if (!riga) return; // riga tolta o Note cambiate: lo dice il riepilogo
      const pagato = /^s[iì]$/i.test(scheda.getRange(riga, col.pagato).getDisplayValue().trim());
      if (!pagato) {
        if (domanda.siDal) {
          registro.aggiorna(domanda.codice, (x) => {
            if (x.stato !== 'da pagare') return false;
            x.siDal = 0;
          });
        }
        return;
      }
      // Il Sì vale dopo un paio di minuti: c'è il tempo di toglierlo se era uno sbaglio
      if (!domanda.siDal) {
        registro.aggiorna(domanda.codice, (x) => {
          if (x.stato !== 'da pagare') return false;
          x.siDal = Date.now();
        });
        return;
      }
      if (Date.now() - domanda.siDal < LIMITI.attesaSi) return;
      registraQuota(domanda, scheda, col, riga, imp);
    } catch (errore) {
      console.error(domanda.codice + ': ' + errore);
    }
  });

  try {
    numeraRigheCartacee(foglio, aperte.map((d) => d.codice));
  } catch (errore) {
    console.error('Domande cartacee: ' + errore);
  }
}

/* Le domande cartacee (e ogni riga scritta a mano): anche lì il numero lo
   assegna lo script, così i numeri non si accavallano mai con quelli del
   sito. Riga con un nome, senza #, "Pagato?" = Sì da almeno un giro e che
   non sia una domanda dal sito ancora da pagare (quella la segue
   registraQuota, con la mail): prende il suo numero di prima, se rinnova,
   o il successivo (numeroPerRiga). Niente mail (non c'è un indirizzo
   sicuro a cui scrivere). Un numero scritto a mano non viene toccato.
   Solo la scheda dell'anno in corso. */
function numeraRigheCartacee(foglio, codiciAperti) {
  const anno = Number(Utilities.formatDate(new Date(), FUSO, 'yyyy'));
  const scheda = foglio.getSheetByName('TESSERATI ' + anno);
  if (!scheda) return;
  const col = colonne(scheda);
  const nomi = valoriColonna(scheda, col.nome);
  const numeri = valoriColonna(scheda, col.numero);
  const pagati = valoriColonna(scheda, col.pagato);
  const note = valoriColonna(scheda, col.note);
  const props = PropertiesService.getScriptProperties();
  const visti = {};

  const daNumerare = [];
  nomi.forEach((nome, i) => {
    if (!nome || numeri[i]) return;
    if (codiciAperti.some((c) => notaDellaDomanda(note[i], c))) return;
    if (!/^s[iì]$/i.test(pagati[i])) return;
    const chiave = 'carta:' + anno + ':' + impronta(nome.toLowerCase());
    visti[chiave] = true;
    const dal = Number(props.getProperty(chiave) || 0);
    if (!dal) props.setProperty(chiave, String(Date.now()));
    else if (Date.now() - dal >= LIMITI.attesaSi) daNumerare.push({ riga: i + 2, nome: nome, chiave: chiave });
  });

  // Un Sì tolto, o una riga numerata: l'attesa ricomincia da capo
  Object.keys(props.getProperties())
    .filter((k) => k.startsWith('carta:') && !visti[k])
    .forEach((k) => props.deleteProperty(k));
  if (!daNumerare.length) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const indice = indiceTesserati(scheda, col);
    daNumerare.forEach((r) => {
      // Ricontrollo sotto il lock: la riga potrebbe essere cambiata
      if (scheda.getRange(r.riga, col.nome).getDisplayValue().trim() !== r.nome) return;
      if (scheda.getRange(r.riga, col.numero).getDisplayValue().trim()) return;
      scheda.getRange(r.riga, col.numero).setValue(testo(numeroPerRiga(scheda, col, r.riga, indice)));
      const cellaData = scheda.getRange(r.riga, col.dataPagamento);
      if (!cellaData.getDisplayValue().trim()) {
        cellaData.setValue(giornoSenzaOra(new Date())).setNumberFormat('dd/mm/yyyy');
      }
      SpreadsheetApp.flush();
      props.deleteProperty(r.chiave);
    });
  } finally {
    lock.releaseLock();
  }
}

// Restituisce la domanda com'è dopo (null se il foglio era occupato).
// segnaPagato: dal tasto della mail, mette anche "Pagato?" = Sì.
function registraQuota(domanda, scheda, col, riga, imp, segnaPagato) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return null;
  try {
    const attuale = registro.leggi('domanda:' + domanda.codice);
    if (!attuale || attuale.stato !== 'da pagare') return attuale;
    // La riga si ricerca sotto il lock: nell'attesa il foglio può essere
    // stato riordinato
    riga = rigaDomanda(scheda, col, domanda.codice);
    if (!riga) return attuale;
    if (segnaPagato) scheda.getRange(riga, col.pagato).setValue('Sì');
    const problemi = [];
    if (!attuale.pdf) problemi.push('il PDF della domanda non è mai stato creato');
    if (!attuale.mailCandidato) problemi.push('la mail con il riepilogo e lo statuto non era partita');

    let numero = scheda.getRange(riga, col.numero).getDisplayValue().trim();
    if (!numero) {
      numero = numeroPerRiga(scheda, col, riga);
      scheda.getRange(riga, col.numero).setValue(testo(numero));
    }
    const cellaData = scheda.getRange(riga, col.dataPagamento);
    if (!cellaData.getDisplayValue().trim()) {
      cellaData.setValue(giornoSenzaOra(new Date())).setNumberFormat('dd/mm/yyyy');
    }
    if (attuale.pdf) {
      try {
        const file = DriveApp.getFileById(attuale.pdf);
        const nome = nomeFile(numero, attuale.dati);
        file.setName(nome + '.pdf');
        collegaPdf(scheda, riga, col, file, nome);
      } catch (errore) {
        console.error(errore);
        problemi.push('PDF non rinominato (' + (errore.message || errore) + '): rinominalo tu ' + numero + '_NomeCognome');
      }
    }
    SpreadsheetApp.flush();

    const d = attuale.dati;
    // Il numero è già scritto: se la mail non parte (indirizzo rifiutato) la
    // quota resta registrata e l'errore va nel riepilogo, senza riprovare
    try {
    MailApp.sendEmail({
      to: d.email,
      bcc: imp.destinatario,
      replyTo: imp.destinatario,
      name: 'CDL APS',
      subject: 'Ti diamo il benvenuto in CDL APS (tessera n. ' + numero + ')',
      body: [
        'Ciao ' + d.nome + ',',
        '',
        'abbiamo ricevuto la tua quota per il ' + attuale.anno + ': da adesso fai parte di CDL APS!',
        '',
        'Il tuo numero di tessera è ' + numero + '.',
        '',
        'Ti scriveremo per i prossimi eventi e per le assemblee dei soci. Come prevede lo statuto, alla prossima '
          + 'riunione il Consiglio direttivo ratificherà la tua ammissione: tu non devi fare niente.',
        '',
        'A presto!',
        'CDL APS',
        'cdlaps.com'
      ].join('\n')
    });
      attuale.mailBenvenuto = true;
    } catch (errore) {
      console.error(errore);
      attuale.mailBenvenuto = false;
      problemi.push('mail di benvenuto non partita (' + (errore.message || errore) + '): scrivi tu al socio, numero ' + numero);
    }
    attuale.errore = problemi.join('; ');

    attuale.stato = 'pagata';
    attuale.numero = numero;
    attuale.pagata = Date.now();
    attuale.nome = d.nome + ' ' + d.cognome;
    delete attuale.dati; // i dati ora stanno nel libro soci e nel PDF
    registro.scrivi('domanda:' + attuale.codice, attuale);
    return attuale;
  } finally {
    lock.releaseLock();
  }
}

/* --------------------------------------------------------------------------
   Ogni mattina: il riepilogo per ciao@ e la pulizia del registro
   -------------------------------------------------------------------------- */
function riepilogoQuotidiano() {
  const imp = impostazioni();
  const foglio = SpreadsheetApp.openById(imp.foglio);
  const ora = Date.now();
  const giorni = (da) => Math.floor((ora - da) / 86400000);
  const nome = (d) => (d.dati ? d.dati.nome + ' ' + d.dati.cognome : d.nome || '');
  const sezioni = { promemoria: [], decadute: [], ratifica: [], errori: [], sparite: [] };

  registro.domande().forEach((d) => {
    if (d.errore) {
      sezioni.errori.push(d.codice + ' ' + nome(d) + ': ' + d.errore);
      // Una domanda già pagata non riprova più: l'errore si segnala una volta
      if (d.stato === 'pagata') registro.aggiorna(d.codice, (x) => { x.errore = ''; });
    }
    const scheda = foglio.getSheetByName('TESSERATI ' + d.anno);
    const col = scheda && colonne(scheda);
    const riga = scheda ? rigaDomanda(scheda, col, d.codice) : 0;
    if (d.stato === 'da pagare') {
      // Segnalata una volta sola, poi esce dal registro: se la riga c'è
      // ancora (Note cambiate), al Sì il numero lo dà numeraRigheCartacee
      if (!riga) {
        // Decaduta e riga tolta, come chiede il riepilogo: niente da dire
        if (giorni(d.ricevuta) < LIMITI.decadenza) sezioni.sparite.push(d.codice + ' ' + nome(d));
        registro.togli('domanda:' + d.codice);
        return;
      }
      const n = giorni(d.ricevuta);
      if (n >= LIMITI.decadenza) sezioni.decadute.push(d.codice + ' ' + nome(d) + ', ' + d.dati.pagamento + ', da ' + n + ' giorni');
      else if (n >= LIMITI.promemoria) sezioni.promemoria.push(d.codice + ' ' + nome(d) + ', ' + d.dati.pagamento + ', da ' + n + ' giorni');
    } else if (d.stato === 'pagata' && riga) {
      const ratificata = /^s[iì]$/i.test(scheda.getRange(riga, col.conferma).getDisplayValue().trim());
      if (!ratificata && giorni(d.pagata) >= LIMITI.ratifica) {
        sezioni.ratifica.push(d.numero + ' ' + nome(d) + ', pagata da ' + giorni(d.pagata) + ' giorni');
      }
      // Ratificata da tempo: il registro non serve più
      if (ratificata && giorni(d.pagata) > 90) registro.togli('domanda:' + d.codice);
    }
  });

  // Le chiavi delle risposte servono solo per qualche giorno
  const tutte = PropertiesService.getScriptProperties().getProperties();
  Object.keys(tutte).filter((k) => k.startsWith('chiave:')).forEach((k) => {
    if (giorni(JSON.parse(tutte[k]).quando) > 7) registro.togli(k);
  });

  // Numeri di tessera doppi nella scheda dell'anno (scritti a mano)
  const schedaOggi = foglio.getSheetByName('TESSERATI ' + Utilities.formatDate(new Date(), FUSO, 'yyyy'));
  const doppi = schedaOggi ? numeriDoppi(schedaOggi, colonne(schedaOggi)) : [];

  const parti = [];
  if (doppi.length) parti.push('Numeri di tessera usati due volte in ' + schedaOggi.getName() + '. Cancella il # sbagliato e lascia "Pagato?" = Sì: in pochi minuti lo script gli dà quello giusto.\n' + doppi.join('\n'));
  if (sezioni.decadute.length) parti.push('Non pagate da più di ' + LIMITI.decadenza + ' giorni, quindi decadute. Togli la riga dal foglio e sposta il PDF: dal giorno dopo spariscono da qui.\n' + sezioni.decadute.join('\n'));
  if (sezioni.promemoria.length) parti.push('Ancora da pagare dopo ' + LIMITI.promemoria + ' giorni. Mandiamo un promemoria?\n' + sezioni.promemoria.join('\n'));
  if (sezioni.ratifica.length) parti.push('Nuovi soci da far ratificare al direttivo, che ha 30 giorni di tempo. Dopo la riunione metti "Conferma assemblea?" = Sì.\n' + sezioni.ratifica.join('\n'));
  if (sezioni.errori.length) parti.push('PDF o mail non riusciti. Lo script riprova ogni 10 minuti per un\'ora, poi si ferma: controlla l\'indirizzo e scrivi tu alla persona.\n' + sezioni.errori.join('\n'));
  if (sezioni.sparite.length) parti.push('Domande di cui non trovo più la riga (Note cambiate o riga tolta). Da oggi non le seguo più; se la riga c\'è ancora, al "Sì" do il numero come per una domanda cartacea, senza mail.\n' + sezioni.sparite.join('\n'));

  if (!parti.length) return;
  MailApp.sendEmail({
    to: imp.destinatario,
    name: 'CDL APS',
    subject: '[Sito CDL] Domande di ammissione: da fare oggi',
    body: parti.join('\n\n') + '\n\nIl libro soci: ' + foglio.getUrl()
  });
}

/* --------------------------------------------------------------------------
   Da eseguire a mano dall'editor
   -------------------------------------------------------------------------- */

// Crea i due avvii automatici (toglie solo quelli di questo progetto con lo
// stesso nome, se c'erano)
function installa() {
  ScriptApp.getProjectTriggers()
    .filter((t) => ['controllaPagamenti', 'riepilogoQuotidiano'].includes(t.getHandlerFunction()))
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('controllaPagamenti').timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger('riepilogoQuotidiano').timeBased().everyDays(1).atHour(8).inTimezone(FUSO).create();
  verifica();
}

// Controlla impostazioni, foglio, colonne, cartella e quota delle mail
function verifica() {
  const imp = impostazioni();
  const anno = Number(Utilities.formatDate(new Date(), FUSO, 'yyyy'));
  const foglio = SpreadsheetApp.openById(imp.foglio);
  const scheda = foglio.getSheetByName('TESSERATI ' + anno);
  if (scheda) colonne(scheda);
  DriveApp.getFolderById(imp.cartella).getName();
  // UrlFetchApp non conosce il metodo HEAD: si scarica lo statuto
  const statuto = UrlFetchApp.fetch(imp.statutoUrl, { muteHttpExceptions: true }).getResponseCode();
  console.log([
    'Statuto: ' + (statuto === 200 ? 'raggiungibile' : 'NON raggiungibile (risposta ' + statuto + '), controlla STATUTO_URL'),
    'Foglio: ' + foglio.getName() + (scheda ? ', scheda ' + scheda.getName() + ' con tutte le colonne' : ', manca TESSERATI ' + anno + ' (la crea alla prima domanda)'),
    'Quota ' + anno + ': ' + (imp.quote[anno] || 'MANCA'),
    'Modulo ' + (imp.attivo ? 'aperto' : 'chiuso (ATTIVO non è "si")'),
    'Mail ancora disponibili oggi: ' + MailApp.getRemainingDailyQuota(),
    'Domande nel registro: ' + registro.domande().length
  ].join('\n'));
}
