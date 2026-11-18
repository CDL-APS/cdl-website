/* ==========================================================================
   VANTAGGI PER I SOCI — la domanda di ammissione (#associati).

   Il modulo #domanda va alla web app di Google Apps Script indicata in
   data-indirizzo (codice in google/iscrizioni/). La web app scrive la
   domanda nel libro soci, prepara il PDF e manda le mail a ciao@ e al
   candidato; risponde con il codice della domanda e i dati per pagare.
   Solo con quella risposta la pagina mostra come pagare: nessuno paga
   senza una domanda registrata. Progetto e casi limite in
   storico/2026-11-17-piano-iscrizione-online.md.

   Va caricato dopo comune.js (caselleDopoLettura).
   ========================================================================== */

// Tempo massimo per la risposta: la web app si avvia a freddo e prepara un
// PDF, ci mette qualche secondo
const ATTESA_DOMANDA = 60000;
// La chiave della domanda in corso (sessionStorage), insieme ai dati a cui
// vale: se la risposta si perde e il candidato riprova con gli stessi dati,
// la web app riconosce la domanda già registrata; se ha cambiato qualcosa,
// è una domanda nuova, con una chiave nuova
const CHIAVE_DOMANDA = 'cdl-domanda-chiave';
// L'esito della domanda, per rimostrare la conferma se si ricarica la pagina
const ESITO_DOMANDA = 'cdl-domanda-esito';

function leggiSessione(nome) {
  try { return sessionStorage.getItem(nome); } catch { return null; }
}
function scriviSessione(nome, valore) {
  try {
    if (valore === null) sessionStorage.removeItem(nome);
    else sessionStorage.setItem(nome, valore);
  } catch { /* senza memoria si va avanti lo stesso */ }
}

function nuovaChiave() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Gli anni compiuti alla data di oggi
function anniCompiuti(dataNascita) {
  const [a, m, g] = dataNascita.split('-').map(Number);
  const oggi = new Date();
  let anni = oggi.getFullYear() - a;
  if (oggi.getMonth() + 1 < m || (oggi.getMonth() + 1 === m && oggi.getDate() < g)) anni -= 1;
  return anni;
}

function euro(importo) {
  return Number(importo).toLocaleString('it-IT', { minimumFractionDigits: Number.isInteger(Number(importo)) ? 0 : 2 }) + ' €';
}

/* Il testo della quota in cima è scritto nell'HTML per l'anno di
   data-quota-testo; in un altro anno si riscrive da data-quote. È solo
   un'indicazione: la quota vera la decide la web app */
function scriviQuota(modulo) {
  const testo = document.querySelector('[data-quota-testo]');
  let quote = {};
  try { quote = JSON.parse(modulo.dataset.quote || '{}'); } catch { return; }
  const anno = new Date().getFullYear();
  if (testo && String(anno) !== testo.dataset.quotaTesto && quote[anno]) {
    testo.textContent = `per il ${anno} è di ${euro(quote[anno])}`;
  }
}

/* La sezione a comparsa si apre da sola arrivando su #associati (anche dal
   tasto "Diventa socio" di Sostieni, sulla stessa pagina: il clic la apre
   prima che il browser scorra fin lì) */
function apriDomanda() {
  const apri = document.getElementById('domanda-apri');
  if (apri) apri.open = true;
}

/* Controlli oltre a quelli del browser: età, provincia, CAP. Il messaggio
   finisce sul campo, così il browser lo mostra al suo posto */
function controllaCampi(modulo) {
  const nascita = modulo.elements.data_nascita;
  nascita.setCustomValidity('');
  if (nascita.value) {
    const anni = anniCompiuti(nascita.value);
    if (anni < 18) nascita.setCustomValidity('La domanda dal sito è per i maggiorenni: per un minore serve il modulo cartaceo, firmato da un genitore.');
    else if (anni > 120) nascita.setCustomValidity('Controlla la data di nascita.');
  }
  const provincia = modulo.elements.provincia;
  provincia.value = provincia.value.trim().toUpperCase();
  provincia.setCustomValidity(provincia.validity.patternMismatch ? 'La sigla della provincia, due lettere (per esempio RN).' : '');
  const cap = modulo.elements.cap;
  cap.setCustomValidity(cap.validity.patternMismatch ? 'Il CAP ha cinque cifre.' : '');
  return modulo.reportValidity();
}

function datiDomanda(modulo, chiave, inizio) {
  const v = (nome) => (modulo.elements[nome].value || '').trim();
  return {
    chiave,
    tempo_ms: Date.now() - inizio,
    trappola: modulo.elements.trappola.value,
    nome: v('nome'),
    cognome: v('cognome'),
    luogo_nascita: v('luogo_nascita'),
    data_nascita: v('data_nascita'),
    via: v('via'),
    comune: v('comune'),
    provincia: v('provincia'),
    cap: v('cap'),
    email: v('email'),
    cellulare: v('cellulare'),
    pagamento: modulo.elements.pagamento.value,
    chi_paga: v('chi_paga'),
    ammissione: modulo.elements.ammissione.checked,
    maggiorenne: modulo.elements.maggiorenne.checked,
    statuto: modulo.elements.statuto.checked ? modulo.elements.statuto.dataset.versione : '',
    informativa: modulo.elements.informativa.checked ? modulo.elements.informativa.dataset.versione : ''
  };
}

/* La conferma, costruita con elementi e testi (mai HTML dalla risposta) */
function elemento(tag, testo, classe) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (testo !== undefined) el.textContent = testo;
  return el;
}
function riga(...pezzi) {
  const p = document.createElement('p');
  p.append(...pezzi);
  return p;
}
function forte(testo) { return elemento('strong', testo); }

function mostraConferma(esito, modulo, conferma) {
  conferma.replaceChildren();
  conferma.append(elemento('h3', 'Domanda ricevuta', 'domanda__conferma-titolo'));
  conferma.append(riga('Grazie! Ti abbiamo mandato il riepilogo e lo statuto a ', forte(esito.email),
    '. Se non trovi la mail, guarda nello spam o scrivici a ciao@cdlaps.com.'));

  const dati = elemento('dl', undefined, 'domanda__dati');
  const voce = (termine, valore) => {
    dati.append(elemento('dt', termine), elemento('dd', valore));
  };
  if (esito.pagamento === 'bonifico') {
    voce('IBAN', esito.iban);
    voce('Intestato a', esito.beneficiario);
  }
  voce('Quota', `${euro(esito.importo)} per il ${esito.anno}`);
  voce('Causale', esito.causale);

  if (esito.pagamento === 'paypal') {
    conferma.append(riga('Ora manca solo la quota. Su PayPal scegli ', forte('“Amici e familiari”'),
      ' e nel messaggio scrivi la causale qui sotto, così capiamo che il pagamento è tuo.'));
    conferma.append(dati);
    if (/^https:\/\/(www\.)?paypal\.me\/[\w.-]+(\/[\w.]+)?$/i.test(esito.paypal || '')) {
      const vai = elemento('a', 'Vai a PayPal ', 'btn btn--pieno domanda__paypal');
      vai.href = esito.paypal;
      vai.rel = 'noopener';
      vai.insertAdjacentHTML('beforeend', ESTERNO);
      conferma.append(vai);
    }
  } else if (esito.pagamento === 'bonifico') {
    conferma.append(riga('Ora manca solo la quota: puoi fare un bonifico, anche istantaneo, con questi dati.'));
    conferma.append(dati);
  } else {
    conferma.append(riga('Per pagare in contanti scrivici a ', forte('ciao@cdlaps.com'),
      ' e ci mettiamo d’accordo: ci vediamo di persona o al prossimo evento.'));
    conferma.append(dati);
  }

  conferma.append(riga('Il codice ', forte(esito.codice), ' nella causale ci serve solo a riconoscere il pagamento. '
    + 'Appena arriva la quota ti scriviamo con il tuo numero di tessera; se la domanda non venisse accolta, ti restituiamo la quota.'));
  const altra = elemento('button', 'Compila un’altra domanda', 'link domanda__altra');
  altra.type = 'button';
  altra.addEventListener('click', () => {
    scriviSessione(ESITO_DOMANDA, null);
    scriviSessione(CHIAVE_DOMANDA, null);
    modulo.reset();
    conferma.hidden = true;
    modulo.hidden = false;
    modulo.elements.nome.focus();
  });
  conferma.append(altra);

  modulo.hidden = true;
  conferma.hidden = false;
  conferma.focus();
}

document.addEventListener('DOMContentLoaded', () => {
  const modulo = document.getElementById('domanda');
  if (!modulo) return;
  const conferma = document.getElementById('domanda-conferma');
  const errore = modulo.querySelector('.domanda__errore');
  const invia = modulo.querySelector('button[type="submit"]');
  const testoInvia = invia.innerHTML;
  const inizio = Date.now();

  caselleDopoLettura(modulo);
  scriviQuota(modulo);
  if (location.hash === '#associati') apriDomanda();
  window.addEventListener('hashchange', () => { if (location.hash === '#associati') apriDomanda(); });
  document.querySelectorAll('a[href="#associati"]').forEach((a) => {
    a.addEventListener('click', apriDomanda);
  });

  // Ricaricando la pagina dopo l'invio si rivede la conferma
  const esitoSalvato = leggiSessione(ESITO_DOMANDA);
  if (esitoSalvato) {
    try {
      apriDomanda();
      mostraConferma(JSON.parse(esitoSalvato), modulo, conferma);
    } catch { scriviSessione(ESITO_DOMANDA, null); }
  }

  const sbaglio = (testo) => {
    errore.textContent = testo;
    errore.hidden = false;
    errore.scrollIntoView({ block: 'center', behavior: FERMO ? 'auto' : 'smooth' });
  };

  modulo.addEventListener('submit', async (e) => {
    e.preventDefault();
    errore.hidden = true;
    if (invia.disabled) return;
    if (!controllaCampi(modulo)) return;

    const indirizzo = modulo.dataset.indirizzo;
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(indirizzo || '')) {
      sbaglio('La domanda dal sito non è ancora attiva. Per ora puoi usare il modulo cartaceo o scriverci a ciao@cdlaps.com.');
      return;
    }

    const datiSenzaChiave = JSON.stringify(datiDomanda(modulo, '', 0), (k, v) => (k === 'tempo_ms' ? undefined : v));
    let chiave = '';
    try {
      const salvata = JSON.parse(leggiSessione(CHIAVE_DOMANDA) || 'null');
      if (salvata && salvata.dati === datiSenzaChiave) chiave = salvata.chiave;
    } catch { /* chiave illeggibile: se ne fa una nuova */ }
    if (!chiave) {
      chiave = nuovaChiave();
      scriviSessione(CHIAVE_DOMANDA, JSON.stringify({ chiave, dati: datiSenzaChiave }));
    }

    invia.disabled = true;
    invia.classList.add('is-inviato');
    invia.textContent = 'Invio in corso…';
    try {
      // text/plain: la web app di Apps Script non risponde alle richieste
      // preliminari (CORS) che un JSON farebbe partire
      const risposta = await fetch(indirizzo, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(datiDomanda(modulo, chiave, inizio)),
        signal: AbortSignal.timeout ? AbortSignal.timeout(ATTESA_DOMANDA) : undefined
      });
      const esito = await risposta.json();
      if (!esito || !esito.ok) {
        sbaglio(esito?.messaggio || 'La domanda non è stata registrata. Riprova tra poco, o scrivici a ciao@cdlaps.com.');
        return;
      }
      scriviSessione(ESITO_DOMANDA, JSON.stringify(esito));
      scriviSessione(CHIAVE_DOMANDA, null);
      mostraConferma(esito, modulo, conferma);
    } catch (err) {
      // Senza risposta la domanda può essere arrivata lo stesso: riprovando
      // con gli stessi dati la web app non la registra due volte
      sbaglio('Non abbiamo ricevuto risposta: la domanda potrebbe essere arrivata lo stesso. Controlla la tua mail tra qualche minuto (anche nello spam); se non trovi niente, invia di nuovo senza cambiare i dati: non verrà registrata due volte. Se il problema continua, scrivici a ciao@cdlaps.com.');
    } finally {
      invia.disabled = false;
      invia.classList.remove('is-inviato');
      invia.innerHTML = testoInvia;
    }
  });
});
