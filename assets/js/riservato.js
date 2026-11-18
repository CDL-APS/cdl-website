/* ==========================================================================
   RISERVATO — ciò che condividono le due pagine con accesso: gestione.html
   (redattori) e area-socio.html (soci). Va caricato dopo dati.js e prima dello
   script della pagina.

   Usa da dati.js: SUPABASE_URL, SUPABASE_CHIAVE.
   ========================================================================== */

const LATO_MASSIMO_IMMAGINE = 2000; // px, lato lungo
const QUALITA_JPEG = 0.85;

const $ = (id) => document.getElementById(id);

/* Client di Supabase. Le due pagine tengono sessioni separate nel browser
   (chiaveSessione diversa): aprire un collegamento da socio non chiude la
   sessione di gestione, e viceversa. */
function creaClient(chiaveSessione) {
  const opzioni = chiaveSessione ? { auth: { storageKey: chiaveSessione } } : {};
  return supabase.createClient(SUPABASE_URL, SUPABASE_CHIAVE, opzioni);
}

/* --------------------------------------------------------------------------
   Viste e messaggi
   -------------------------------------------------------------------------- */
function mostraVista(nome) {
  document.querySelectorAll('[data-vista]').forEach((v) => {
    v.hidden = v.dataset.vista !== nome;
  });
  window.scrollTo(0, 0);
}

let timerAvviso;
function avviso(testo, errore = false) {
  const el = $('avviso');
  el.textContent = testo;
  el.classList.toggle('g-avviso--errore', errore);
  el.hidden = false;
  clearTimeout(timerAvviso);
  if (!errore) timerAvviso = setTimeout(() => { el.hidden = true; }, 5000);
}

function nascondiAvviso() {
  $('avviso').hidden = true;
}

/* Errori del database tradotti in qualcosa di comprensibile. Le funzioni
   della Cortoteca sollevano già messaggi in italiano: quelli passano così. */
function messaggioErrore(errore) {
  if (!errore) return 'Errore sconosciuto';
  const testo = errore.message || String(errore);
  if (errore.code === '23505') return 'Esiste già un elemento con questo codice: scegline un altro.';
  if (errore.code === '23514') return 'Un campo non è valido: controlla codice, anno e date.';
  if (errore.code === '42501') {
    return /permission denied|row-level security/i.test(testo)
      ? 'Non hai i permessi per questa modifica.'
      : testo;
  }
  if (/fetch|network/i.test(testo)) return 'Connessione non riuscita: riprova.';
  return testo;
}

/* --------------------------------------------------------------------------
   Date e codici
   -------------------------------------------------------------------------- */
function formattaData(iso) {
  if (!iso) return '';
  const data = iso.length <= 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
  return data.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formattaDataOra(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

/* Codice per l'indirizzo, dal titolo: "Quarto Livello" → "quarto-livello" */
function codiceDaTitolo(titolo) {
  return titolo
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* --------------------------------------------------------------------------
   Immagini
   -------------------------------------------------------------------------- */

/* Ridimensiona a LATO_MASSIMO_IMMAGINE e converte in JPEG: le foto da
   telefono superano facilmente il limite di 5 MB degli spazi di Supabase */
async function ridimensiona(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Non riesco a leggere ${file.name ? `"${file.name}"` : "l'immagine"}: usa un file JPEG o PNG.`);
  }
  const scala = Math.min(1, LATO_MASSIMO_IMMAGINE / Math.max(bitmap.width, bitmap.height));
  const tela = document.createElement('canvas');
  tela.width = Math.round(bitmap.width * scala);
  tela.height = Math.round(bitmap.height * scala);
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#fff'; // le parti trasparenti dei PNG diventano bianche
  ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.drawImage(bitmap, 0, 0, tela.width, tela.height);
  return new Promise((ok, ko) => {
    tela.toBlob((b) => (b ? ok(b) : ko(new Error('Conversione immagine non riuscita'))), 'image/jpeg', QUALITA_JPEG);
  });
}

/* --------------------------------------------------------------------------
   Licenza e questionario: le stesse etichette servono al socio che risponde
   e al redattore che rilegge
   -------------------------------------------------------------------------- */
const VESTI = {
  produttore: "Ho prodotto io l'opera, da solo",
  coproduttore: "L'ho prodotta con altri, che sono d'accordo per iscritto",
  autorizzato: "Non l'ho prodotta io: ho l'autorizzazione scritta di chi l'ha prodotta"
};

const MUSICHE = {
  nessuna: 'Nessuna musica',
  originale_non_iscritti: 'Originale, di autori non iscritti a società di gestione',
  originale_iscritti: 'Originale, di autori iscritti a SIAE, Soundreef o simili',
  preesistente: "Brani già pubblicati, con licenza che copre l'online",
  libreria: 'Libreria musicale con licenza'
};

const PERSONE_FOTOGRAMMA = {
  nessuna: 'Nessuna persona riconoscibile',
  consenso: 'Persone riconoscibili, che hanno acconsentito',
  minori_consenso: 'Anche minori, con il consenso dei genitori'
};

/* I due tipi di autorizzazione: la licenza completa per lo streaming, o
   quella breve per la sola scheda (titolo, testi, crediti, fotogramma) */
const TIPI_LICENZA = {
  streaming: { nome: 'la licenza', titolo: 'Licenza', breve: 'licenza per lo streaming' },
  scheda: { nome: "l'autorizzazione", titolo: 'Autorizzazione per la scheda', breve: 'autorizzazione per la sola scheda' }
};

/* Risposte del questionario come righe di testo. Le domande cambiano con il
   tipo: si mostrano quelle a cui il socio ha risposto. */
function descriviRisposte(r) {
  if (!r) return [];
  const righe = [['Veste', VESTI[r.veste] || r.veste]];
  if (r.musica) {
    righe.push(['Musica', r.musica.map((m) => MUSICHE[m] || m).join('; ')]);
    if (r.musica_note) righe.push(['Titoli e autori', r.musica_note]);
  }
  if ('interpreti_consenso' in r) {
    righe.push(['Interpreti e persone riprese', r.interpreti_consenso ? 'Hanno acconsentito per iscritto alla diffusione online' : 'Consenso non dichiarato']);
  }
  if (r.minori) righe.push(['Minori', r.minori === 'si_con_consenso' ? 'Sì, con il consenso scritto dei genitori' : 'No']);
  if (r.persone_fotogramma) righe.push(['Persone nel fotogramma', PERSONE_FOTOGRAMMA[r.persone_fotogramma] || r.persone_fotogramma]);
  if (r.derivata) righe.push(['Tratta o ispirata da un\'opera altrui', r.derivata.si ? `Sì — ${r.derivata.dettagli || 'senza dettagli'}` : 'No']);
  if (r.vincoli) righe.push(['Accordi in corso', r.vincoli.si ? `Sì — ${r.vincoli.dettagli || 'senza dettagli'}` : 'No']);
  if ('font_web' in r) righe.push(['Carattere del titolo', r.font_web ? 'La sua licenza consente l\'uso sul web' : 'Non dichiarato']);
  if (r.contenuti_sensibili) righe.push(['Contenuti da segnalare', r.contenuti_sensibili]);
  return righe;
}

/* Punti del questionario su cui il redattore deve fermarsi */
function attenzioniRisposte(r) {
  if (!r) return [];
  const punti = [];
  if (r.veste && r.veste !== 'produttore') punti.push('Non è l\'unico produttore: in caso di dubbio chiedi copia del consenso.');
  if ((r.musica || []).some((m) => m === 'originale_iscritti' || m === 'preesistente')) {
    punti.push('Musica di autori iscritti o già pubblicata: il video deve restare su YouTube o Vimeo.');
  }
  if (r.minori === 'si_con_consenso') punti.push('Ci sono minori.');
  if (r.persone_fotogramma === 'minori_consenso') punti.push('Nel fotogramma ci sono minori.');
  if (r.derivata?.si) punti.push('Opera tratta o ispirata da un\'opera altrui.');
  if (r.vincoli?.si) punti.push('Ci sono accordi in corso su quest\'opera.');
  return punti;
}

/* Testo della ricevuta che il socio scarica e il redattore può rileggere */
function testoRicevuta(licenza, testoLicenza) {
  const tipo = TIPI_LICENZA[licenza.tipo] || TIPI_LICENZA.streaming;
  const risposte = descriviRisposte(licenza.risposte).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  return [
    'RICEVUTA DI ACCETTAZIONE — Cortoteca di CDL APS',
    '',
    `Registrazione n. ${licenza.id}`,
    `Tipo: ${tipo.breve}`,
    `Opera: ${licenza.titolo_opera}`,
    `Concedente: ${licenza.nome_dichiarato} (${licenza.email})` +
      (licenza.numero_tessera ? `, tessera n. ${licenza.numero_tessera} del ${licenza.anno_tessera}` : ''),
    `Accettata il: ${formattaDataOra(licenza.accettata_il)}`,
    `Testo accettato: versione ${licenza.versione_testo}`,
    `Impronta SHA-256 del testo: ${licenza.sha256_testo}`,
    `Uso promozionale (art. 3): ${licenza.uso_promozionale ? 'autorizzato' : 'non autorizzato'}`,
    licenza.revocata_il ? `REVOCATA il: ${formattaDataOra(licenza.revocata_il)}` : null,
    '',
    'Risposte al questionario sui diritti:',
    risposte,
    '',
    '------------------------------------------------------------',
    '',
    testoLicenza || '(testo non disponibile)',
    ''
  ].filter((riga) => riga !== null).join('\n');
}

function scaricaTesto(nomeFile, testo) {
  const indirizzo = URL.createObjectURL(new Blob([testo], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = indirizzo;
  a.download = nomeFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(indirizzo), 1000);
}

/* --------------------------------------------------------------------------
   Righe ripetibili (cast, altri ruoli della troupe): si aggiungono, si
   spostano e si tolgono. Ogni elenco ha il suo <ol> e il suo <template>
   nella pagina, con un campo [data-nome] e uno [data-ruolo].
   -------------------------------------------------------------------------- */
function aggiungiRiga(modello, contenitore, valori = {}, alCambio = () => {}) {
  const riga = $(modello).content.firstElementChild.cloneNode(true);
  riga.querySelector('[data-nome]').value = valori.nome || '';
  riga.querySelector('[data-ruolo]').value = valori.ruolo || '';
  riga.querySelector('[data-su]').onclick = () => {
    if (riga.previousElementSibling) riga.parentNode.insertBefore(riga, riga.previousElementSibling);
    alCambio();
  };
  riga.querySelector('[data-giu]').onclick = () => {
    if (riga.nextElementSibling) riga.parentNode.insertBefore(riga.nextElementSibling, riga);
    alCambio();
  };
  riga.querySelector('[data-togli]').onclick = () => {
    riga.remove();
    alCambio();
  };
  $(contenitore).appendChild(riga);
  return riga;
}

function leggiRighe(contenitore) {
  return [...$(contenitore).children].map((riga) => ({
    nome: riga.querySelector('[data-nome]').value.trim(),
    ruolo: riga.querySelector('[data-ruolo]').value.trim() || null
  }));
}

/* Cast: <ol id="interpreti"> e <template id="modello-interprete"> */
function aggiungiInterprete(interprete = {}, alCambio) {
  return aggiungiRiga('modello-interprete', 'interpreti', interprete, alCambio);
}

function leggiInterpreti() {
  return leggiRighe('interpreti').filter((i) => i.nome);
}

/* Altri ruoli: <ol id="altri-ruoli"> e <template id="modello-ruolo">.
   Si tengono solo le righe con ruolo e nome. */
function aggiungiRuolo(voce = {}, alCambio) {
  return aggiungiRiga('modello-ruolo', 'altri-ruoli', voce, alCambio);
}

function leggiRuoli() {
  return leggiRighe('altri-ruoli').filter((r) => r.nome && r.ruolo);
}

/* --------------------------------------------------------------------------
   File del titolo: un PNG o un carattere tipografico, caricati come sono
   -------------------------------------------------------------------------- */
const TIPI_FONT = { ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };
const PESO_MASSIMO_FILE = 5 * 1024 * 1024;

/* { tipo: 'png' | 'font', estensione, mime } oppure un errore leggibile */
function riconosciFileTitolo(file) {
  const estensione = (file.name.split('.').pop() || '').toLowerCase();
  if (file.size > PESO_MASSIMO_FILE) throw new Error('Il file supera i 5 MB.');
  if (estensione === 'png' || file.type === 'image/png') return { tipo: 'png', estensione: 'png', mime: 'image/png' };
  if (TIPI_FONT[estensione]) return { tipo: 'font', estensione, mime: TIPI_FONT[estensione] };
  throw new Error('Serve un PNG oppure un carattere TTF, OTF, WOFF o WOFF2.');
}

/* Estensione di un percorso salvato, per ricaricare il file con il tipo giusto */
function mimeDaPercorso(percorso) {
  const estensione = (percorso.split('.').pop() || '').toLowerCase();
  return estensione === 'png' ? 'image/png' : TIPI_FONT[estensione] || 'application/octet-stream';
}
