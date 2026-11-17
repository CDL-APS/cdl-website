/* ==========================================================================
   DATI — opere, eventi e il rullino della home, comune a tutte le pagine
   che li mostrano: home, Cortoteca, Produzioni, pagina del corto, Eventi. Lo usano anche gestione
   e proposta (urlImmagine, esc, indirizzoSicuro).

   La fonte è il database Supabase dell'associazione. Se non risponde (per
   esempio perché il progetto è in pausa) le pagine ripiegano sulla copia di
   riserva in data/opere.json, data/eventi.json e data/rullino.json, che ha la stessa forma dei
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
  eventi: 'data/eventi.json',
  rullino: 'data/rullino.json'
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

/* La copia di riserva contiene anche ciò che non è pubblicato (per esempio
   un'opera nascosta perché il socio non ha rinnovato la quota): qui si tiene
   solo ciò che il database darebbe a chi visita il sito */
async function leggiRiserva(tabella) {
  const response = await fetch(RISERVA[tabella]);
  if (!response.ok) throw new Error('Copia di riserva non trovata: ' + RISERVA[tabella]);
  const righe = await response.json();
  const campo = { opere: 'pubblicata', eventi: 'pubblicato' }[tabella];
  return campo ? righe.filter((riga) => riga[campo] === true) : righe;
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

/* Le colonne che il sito legge, una per una. Chi visita il sito (ruolo anon)
   può leggere solo queste: la data di creazione o chi ha fatto l'ultima
   modifica restano alla gestione. Una colonna nuova da mostrare va aggiunta
   qui e nei permessi del database (vedi supabase/migrations/, "colonne
   pubbliche"). */
const COLONNE_OPERE = [
  'id', 'codice', 'titolo', 'anno', 'durata', 'regista', 'produzione', 'produzione_cdl', 'collaborazione_cdl',
  'generi', 'tagline', 'sinossi', 'note_regia', 'fotogramma', 'video_url', 'letterboxd_url', 'imdb_url',
  'sceneggiatura', 'produttore', 'fotografia', 'montaggio', 'colonna_sonora', 'scenografia', 'trucco', 'costumi',
  'suono', 'altri_ruoli', 'titolo_png', 'titolo_font', 'colore', 'solo_scheda', 'pubblicata'
].join(',');

const COLONNE_EVENTI = [
  'id', 'codice', 'titolo', 'data_inizio', 'data_fine', 'luogo', 'riassunto', 'descrizione',
  'copertina', 'miniatura', 'pagina', 'serie', 'pubblicato',
  'logo', 'colore', 'instagram', 'sfondo', 'presentazione', 'blocchi'
].join(',');

// Gli interpreti arrivano già annidati in ogni opera, nell'ordine del cast
const QUERY_OPERE =
  `select=${COLONNE_OPERE},interpreti(posizione,nome,ruolo)&pubblicata=eq.true&order=id&interpreti.order=posizione`;

async function caricaOpere() {
  return leggi('opere', QUERY_OPERE);
}

async function caricaOpera(codice) {
  const opere = await leggi('opere', QUERY_OPERE + '&codice=eq.' + encodeURIComponent(codice));
  return opere.find((o) => o.codice === codice) || null;
}

/* Eventi pubblicati, dal più recente */
async function caricaEventi() {
  const eventi = await leggi('eventi', `select=${COLONNE_EVENTI}&pubblicato=eq.true&order=data_inizio.desc`);
  return eventi.sort((a, b) => b.data_inizio.localeCompare(a.data_inizio));
}

/* Il rullino della home, nell'ordine scelto in gestione. Ogni foto porta a
   un evento, a un corto o a una pagina del sito (vedi home.js) */
async function caricaRullino() {
  return leggi('rullino', 'select=immagine,descrizione,evento_id,opera_id,pagina,posizione&order=posizione,id');
}

/* Ordine dalla più recente. A parità di anno conta come più recente l'opera
   inserita per ultima, cioè con l'id più alto. */
function dallaPiuRecente(a, b) {
  return b.anno - a.anno || b.id - a.id;
}

/* Le opere prodotte da CDL, dalla più recente */
function produzioniCdl(opere) {
  return opere.filter((o) => o.produzione_cdl).sort(dallaPiuRecente);
}

/* Le opere a cui CDL ha collaborato senza produrle, dalla più recente */
function collaborazioniCdl(opere) {
  return opere.filter((o) => o.collaborazione_cdl).sort(dallaPiuRecente);
}

/* Trasforma un link YouTube o Vimeo nel corrispondente URL di embed.
   Restituisce null se il campo è vuoto o non riconosciuto: la pagina del
   corto resta un'immagine (con "Streaming in arrivo", se l'opera non è
   segnata come sola scheda) e la Cortoteca non mostra il tasto Guarda. */
function getEmbedUrl(url) {
  if (!url || url.trim() === '') return null;

  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = url.match(ytRegex);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`;

  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?badge=0&autopause=0&player_id=0&app_id=58479`;

  return null;
}

/* Vero se l'opera si può vedere in streaming sul sito */
function streamingDisponibile(opera) {
  return getEmbedUrl(opera.video_url) !== null;
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

/* Le pagine evento composte dal database sono in pausa (13 novembre 2026),
   finché il modulo di gestione non è stato provato: ogni evento usa la sua
   pagina scritta a mano, anche se nel database ha presentazione e blocchi
   (Short Talks #1 li ha già, restano lì). Come riaccenderle:
   storico/2026-11-13-piano-eventi-gestione.md. */
const MODELLO_EVENTI = false;

/* La Cortoteca è in pausa (17 novembre 2026). Spento: la voce del nastro
   della home, "Streaming in arrivo" sulle pagine dei corti, ogni rimando a
   cortoteca.html; in gestione le schede Dashboard, Proposte e Soci e il
   titolare delle opere. Le voci di barra e indice sono tolte dall'HTML e
   netlify.toml rimanda galleria e area socio. Come riprendere:
   storico/2026-11-17-cortoteca-in-pausa.md. */
const CORTOTECA_ATTIVA = false;

/* Vero se la pagina dell'evento si compone dal database (evento.html, vedi
   modello-evento.js): ha una presentazione o almeno un blocco */
function conModello(evento) {
  return MODELLO_EVENTI && Boolean(evento && evento.codice && ((evento.presentazione || '').trim()
    || (Array.isArray(evento.blocchi) && evento.blocchi.length)));
}

/* La pagina di un evento: quella composta dal modello
   (evento.html?e=short-talks-1) o, per gli eventi non ancora convertiti,
   solo il nome di un file del sito (blue-hour.html), niente indirizzi
   esterni né parametri. La pagina Eventi scarica quel file e ne inserisce il
   contenuto: un indirizzo esterno porterebbe dentro il sito una pagina di
   altri. */
function paginaEvento(evento) {
  if (conModello(evento)) return 'evento.html?e=' + evento.codice;
  const pagina = (evento && evento.pagina) || '';
  return /^[a-z0-9-]+\.html$/.test(pagina) ? pagina : null;
}

/* Un'immagine di un evento: una copia nel sito (assets/img/eventi/…, le foto
   degli eventi di prima) o un percorso nello spazio immagini. Qualsiasi
   altra cosa è scartata. */
function immagineEvento(percorso) {
  if (typeof percorso !== 'string') return null;
  if (/^assets\/img\/eventi\/[a-z0-9\/._-]+$/i.test(percorso) && !percorso.includes('..')) return { locale: percorso };
  if (/^eventi\/[a-z0-9\/._-]+$/i.test(percorso) && !percorso.includes('..')) return { percorso };
  return null;
}

/* L'indirizzo da cui caricare un'immagine di un evento (il ripiego sulla
   copia locale lo fa mostraImmagine) */
function urlImmagineEvento(percorso) {
  const i = immagineEvento(percorso);
  return i ? (i.locale || urlImmagine(i.percorso)) : null;
}

/* Le foto delle pagine composte dal modello, blocco per blocco (le usa la
   scheda Rullino della gestione) */
function fotoEvento(evento) {
  const viste = new Set();
  return (Array.isArray(evento && evento.blocchi) ? evento.blocchi : [])
    .flatMap((b) => (b && Array.isArray(b.foto) ? b.foto.filter(Boolean).map((f, i, tutte) => ({
      immagine: f.immagine,
      descrizione: f.descrizione || (b.descrizione_foto ? `${b.descrizione_foto}, ${i + 1} di ${tutte.length}` : '')
    })) : []))
    .filter((f) => immagineEvento(f.immagine) && !viste.has(f.immagine) && viste.add(f.immagine));
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
