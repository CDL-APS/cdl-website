/* ==========================================================================
   DATI — opere ed eventi, comune a tutte le pagine che li mostrano: home,
   Cortoteca, Produzioni, scheda opera, Eventi.

   La fonte è il database Supabase dell'associazione. Se non risponde (per
   esempio perché il progetto è in pausa) le pagine ripiegano sulla copia di
   riserva in data/opere.json e data/eventi.json, che ha la stessa forma dei
   dati del database. Le immagini seguono la stessa logica: prima lo spazio
   immagini di Supabase, poi le copie in assets/img/.

   Va caricato prima dello script della pagina, che ne usa le funzioni.
   ========================================================================== */

// Indirizzo del progetto e chiave pubblica: stanno nel sito apposta. La
// chiave permette solo ciò che le regole del database concedono a chi non ha
// fatto l'accesso, cioè leggere opere ed eventi pubblicati.
const SUPABASE_URL = 'https://rsspmqhhrykbmrkmwqcg.supabase.co';
const SUPABASE_CHIAVE = 'sb_publishable_GL627ST9nccoDrMVDhsxAQ_dUpRdVmh';

const BUCKET_IMMAGINI = 'immagini';
const ATTESA_MASSIMA = 6000; // ms prima di passare alla copia di riserva

// Dove stanno nel sito le copie locali delle immagini, per cartella del bucket
const IMMAGINI_LOCALI = {
  'opere/': 'assets/img/film/',
  'eventi/': 'assets/img/eventi/'
};

const RISERVA = {
  opere: 'data/opere.json',
  eventi: 'data/eventi.json'
};

/* Legge una tabella dalla Data API di Supabase. `query` è la parte dopo il
   punto di domanda, per esempio "select=*&order=id". */
async function leggiSupabase(tabella, query) {
  const controllo = new AbortController();
  const timer = setTimeout(() => controllo.abort(), ATTESA_MASSIMA);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tabella}?${query}`, {
      headers: { apikey: SUPABASE_CHIAVE },
      signal: controllo.signal
    });
    if (!response.ok) throw new Error(`Supabase: ${tabella} ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function leggiRiserva(tabella) {
  const response = await fetch(RISERVA[tabella]);
  if (!response.ok) throw new Error('Copia di riserva non trovata: ' + RISERVA[tabella]);
  return response.json();
}

/* Prima il database, poi la copia di riserva */
async function leggi(tabella, query) {
  try {
    return await leggiSupabase(tabella, query);
  } catch (errore) {
    console.warn(errore, '— uso la copia di riserva');
    return leggiRiserva(tabella);
  }
}

// Gli interpreti arrivano già annidati in ogni opera, nell'ordine del cast
const QUERY_OPERE =
  'select=*,interpreti(posizione,nome,ruolo)&pubblicata=eq.true&order=id&interpreti.order=posizione';

async function caricaOpere() {
  return leggi('opere', QUERY_OPERE);
}

async function caricaOpera(codice) {
  const opere = await leggi('opere', QUERY_OPERE + '&codice=eq.' + encodeURIComponent(codice));
  return opere.find((o) => o.codice === codice) || null;
}

/* Eventi pubblicati, dal più recente */
async function caricaEventi() {
  const eventi = await leggi('eventi', 'select=*&pubblicato=eq.true&order=data_inizio.desc');
  return eventi.sort((a, b) => b.data_inizio.localeCompare(a.data_inizio));
}

/* Le opere prodotte da CDL, dalla più recente. A parità di anno conta come
   più recente quella inserita per ultima, cioè con l'id più alto. */
function produzioniCdl(opere) {
  return opere.filter((o) => o.produzione_cdl).sort((a, b) => b.anno - a.anno || b.id - a.id);
}

/* Primo genere della lista, con l'iniziale maiuscola: ["thriller",
   "mistero"] diventa "Thriller" */
function generePrincipale(opera) {
  const primo = (opera.generi || [])[0] || '';
  return primo.charAt(0).toUpperCase() + primo.slice(1);
}

/* Indirizzi di un'immagine: quello nello spazio immagini di Supabase e la
   copia locale, se la cartella ne ha una */
function urlImmagine(percorso) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_IMMAGINI}/${percorso}`;
}

function urlImmagineLocale(percorso) {
  const cartella = Object.keys(IMMAGINI_LOCALI).find((c) => percorso.startsWith(c));
  return cartella ? IMMAGINI_LOCALI[cartella] + percorso.slice(cartella.length) : null;
}

/* Carica un'immagine in un <img>: prima da Supabase, se manca dalla copia
   locale, e se manca anche quella la toglie, lasciando il fondo neutro del
   contenitore */
function mostraImmagine(img, percorso) {
  if (!percorso) {
    img.remove();
    return;
  }
  const locale = urlImmagineLocale(percorso);
  img.onerror = () => {
    if (locale && img.src !== new URL(locale, location.href).href) {
      img.src = locale;
    } else {
      img.onerror = null;
      img.remove();
    }
  };
  img.src = urlImmagine(percorso);
}

/* Indirizzo sicuro per un collegamento: una pagina del sito (es.
   longstoryshort.html) o un indirizzo web. Qualsiasi altra cosa, come un
   "javascript:", viene scartata. */
function indirizzoSicuro(indirizzo) {
  if (!indirizzo) return null;
  return /^(https?:\/\/|[a-z0-9-]+\.html(\?.*)?$)/i.test(indirizzo) ? indirizzo : null;
}

/* Testo sicuro da inserire in un modello HTML: i dati arrivano da un modulo
   compilato dai redattori, non vanno interpretati come codice */
function esc(testo) {
  return String(testo ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
