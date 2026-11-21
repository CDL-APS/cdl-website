/* ==========================================================================
   DATI — opere, eventi, il rullino e la vetrina della home, comune a tutte le pagine
   che li mostrano: home, Cortoteca, Produzioni, pagina del corto, Eventi. Lo usano anche gestione
   e proposta (urlImmagine, esc, indirizzoSicuro).

   La fonte è il database Supabase dell'associazione. Se non risponde (per
   esempio perché il progetto è in pausa) le pagine ripiegano sulla copia di
   riserva in data/opere.json, data/eventi.json, data/rullino.json e
   data/vetrina.json, che ha la stessa forma dei dati del database. Le immagini seguono la stessa logica: prima lo spazio
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
  rullino: 'data/rullino.json',
  vetrina: 'data/vetrina.json'
};

/* Prove senza toccare il database: ?riserva nell'indirizzo fa leggere a
   quella pagina solo le copie di riserva in data/, così un evento o una
   slide nuovi si guardano prima di scriverli nel database. Vale solo per
   la pagina che ce l'ha nell'indirizzo (fino al 21 novembre 2026 restava
   acceso per tutta la scheda, e la home non corrispondeva più alla
   gestione), e una striscia in basso lo ricorda, col collegamento per
   tornare ai dati veri. */
const SOLO_RISERVA = (() => {
  try {
    sessionStorage.removeItem('cdl-solo-riserva'); // il segno di prima
    const scelta = new URLSearchParams(location.search).get('riserva');
    return scelta !== null && scelta !== 'no';
  } catch (errore) {
    return false;
  }
})();
if (SOLO_RISERVA) {
  document.addEventListener('DOMContentLoaded', () => {
    const indirizzo = new URL(location.href);
    indirizzo.searchParams.delete('riserva');
    const striscia = document.createElement('p');
    striscia.className = 'avviso-riserva';
    striscia.setAttribute('role', 'status');
    striscia.innerHTML = `Stai guardando le copie di riserva, non il database. <a href="${esc(indirizzo.pathname + indirizzo.search + indirizzo.hash)}">Torna ai dati veri</a>`;
    document.body.append(striscia);
  });
}

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
  const campo = { opere: 'pubblicata', eventi: 'pubblicato', vetrina: 'attiva' }[tabella];
  return campo ? righe.filter((riga) => riga[campo] === true) : righe;
}

/* Prima il database, poi la copia di riserva */
async function leggi(tabella, query) {
  if (SOLO_RISERVA) return leggiRiserva(tabella);
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
  'logo', 'colore', 'instagram', 'sfondo', 'presentazione', 'blocchi', 'carattere'
].join(',');

/* I caratteri che un evento può avere al posto di Montserrat (colonna
   carattere, 20261121150000_carattere_eventi.sql): la famiglia, il nome
   per Google Fonts e come si comportano i titoli. VT323 è piccolo a parità
   di corpo: il testo si ingrandisce (scala). Un carattere nuovo va aggiunto
   qui e nel vincolo della colonna. */
const CARATTERI = {
  Inter: { famiglia: "'Inter', sans-serif", google: 'Inter:wght@400;500;600;700', pesoTitolo: 600, maiuscolo: false, spazio: '-0.035em', pesoTesto: 500, scala: 1 },
  VT323: { famiglia: "'VT323', ui-monospace, monospace", google: 'VT323', pesoTitolo: 400, maiuscolo: true, spazio: '0', pesoTesto: 400, scala: 1.3 }
};

// Carica da Google Fonts un carattere di CARATTERI, una volta sola per pagina
function caricaCarattere(nome) {
  const c = CARATTERI[nome];
  if (!c || document.querySelector(`link[data-carattere="${nome}"]`)) return c || null;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${c.google}&display=swap`;
  link.dataset.carattere = nome;
  document.head.append(link);
  return c;
}

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

/* La vetrina della home: le slide attive (la sala e i contenuti in
   evidenza), nell'ordine scelto nella Dashboard della gestione (vedi
   home.js) */
async function caricaVetrina() {
  return leggi('vetrina', 'select=tipo,evento_id,opera_id,pagina,titolo,testo,invito,immagine,lettering,colore,colore_testo,posizione&order=posizione,id');
}

/* I corti che hanno un titolo grafico provvisorio in SVG in
   assets/img/film/titoli/ (vedi titoloGrafico in comune.js) */
const TITOLI_GRAFICI = new Set(['interzona', 'quartolivello', 'relativita', 'vivarevolution']);

/* Il lettering di un evento o di un corto, se il sito ne ha uno: la
   vetrina della home lo usa al posto del titolo scritto, se la slide non ne
   ha uno suo (colonna lettering). Per un evento: il logo del database, il
   lettering di Long Story Short, o il PNG col nome della pagina in
   assets/img/eventi/loghi/ (se il file non c'è, chi lo usa torna al titolo
   scritto). Per un corto: il titolo grafico caricato, o l'SVG provvisorio. */
function letteringEvento(evento) {
  if (!evento) return null;
  if (evento.logo) return urlImmagineEvento(evento.logo);
  if (evento.serie === 'long-story-short') return 'assets/img/brand/long-story-short.png';
  const pagina = paginaEvento(evento);
  return pagina && /^[a-z0-9-]+\.html$/.test(pagina) ? `assets/img/eventi/loghi/${pagina.replace(/\.html$/, '')}.png` : null;
}

function letteringOpera(opera) {
  if (!opera) return null;
  if (opera.titolo_png) return urlImmagine(opera.titolo_png);
  return TITOLI_GRAFICI.has(opera.codice) ? `assets/img/film/titoli/${encodeURIComponent(opera.codice)}.svg` : null;
}

/* L'indirizzo del lettering caricato per una slide: un file del sito o un
   percorso nello spazio immagini */
function indirizzoLettering(percorso) {
  if (!percorso || percorso.includes('..')) return null;
  if (/^assets\/img\/[A-Za-z0-9\/._-]+\.png$/.test(percorso)) return percorso;
  if (/^(vetrina|eventi)\/[A-Za-z0-9\/._-]+\.png$/.test(percorso)) return urlImmagine(percorso);
  return null;
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

/* Le pagine fisse del sito, con il nome e i colori della loro sezione
   (fondo e scritte): le usano la vetrina della home (una slide che porta a
   una pagina) e la gestione (l'indice nella Dashboard, i collegamenti del
   rullino). Le sezioni sono quelle della barra, più la home; una pagina che
   sta dentro un'altra lo dice con dentro (la pagina che la contiene: una
   sezione o la pagina di un evento). Le pagine dei corti e degli eventi
   vengono dal database: stanno dentro Produzioni (o la Cortoteca) e Eventi. */
const PAGINE_SITO = [
  { pagina: 'index.html', nome: 'Home', fondo: '#1d1d1b', colore: '#b9bbf8' },
  { pagina: 'eventi.html', nome: 'Eventi', fondo: '#004aad', colore: '#84f1f7' },
  { pagina: 'produzioni.html', nome: 'Produzioni', fondo: '#b9bbf8', colore: '#1d1d1b' },
  ...(CORTOTECA_ATTIVA ? [{ pagina: 'cortoteca.html', nome: 'Cortoteca', fondo: '#000000', colore: '#ff751f' }] : []),
  { pagina: 'contatti.html', nome: 'Contatti', fondo: '#ff751f', colore: '#1d1d1b' },
  { pagina: 'vantaggi-tesseramento.html', nome: 'Sostieni', fondo: '#ff751f', colore: '#1d1d1b' },
  { pagina: 'vantaggi-tesseramento.html#associati', nome: 'Domanda di ammissione', dentro: 'vantaggi-tesseramento.html', fondo: '#ff751f', colore: '#1d1d1b' },
  { pagina: 'cornicenarrativa.html', nome: 'Cornice narrativa', dentro: 'longstoryshort.html', fondo: '#1d1d1b', colore: '#f7f7f7' }
];

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
