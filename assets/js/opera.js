/* ==========================================================================
   SCHEDA OPERA — dettaglio di un singolo cortometraggio.

   La pagina è un guscio vuoto: legge il codice dell'opera dalla query string
   (opera.html?film=quartolivello), cerca la voce corrispondente in
   data/film.json e riempie i campi. Una sola pagina serve tutte le opere.
   ========================================================================== */

const PERCORSO_DATABASE = 'data/film.json';

/* Trasforma un link YouTube o Vimeo nel corrispondente URL di embed.
   Restituisce null se il campo è vuoto o non riconosciuto, ed è questo che
   fa comparire il velo "streaming in arrivo". */
function getEmbedUrl(url) {
  if (!url || url.trim() === '' || url === 'null') return null;

  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = url.match(ytRegex);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`;

  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?badge=0&autopause=0&player_id=0&app_id=58479`;

  return null;
}

/* Ruoli mostrati nella colonna troupe, nell'ordine in cui appaiono.
   La chiave deve combaciare col nome del campo in film.json; i ruoli con
   campo vuoto vengono semplicemente saltati. */
const RUOLI_TROUPE = [
  { label: 'Regia', key: 'regista' },
  { label: 'Produzione', key: 'produzione' },
  { label: 'DOP', key: 'fotografia' },
  { label: 'Sceneggiatura', key: 'sceneggiatura' },
  { label: 'Montaggio', key: 'montaggio' },
  { label: 'Trucco', key: 'trucco' },
  { label: 'Costumi', key: 'costumi' },
  { label: 'Scenografia', key: 'scenografia' },
  { label: 'Colonna Sonora', key: 'colonna sonora' }
];

const MAX_CAST = 10;

function valorizzato(v) {
  return v && v.toString().trim() !== '' && v !== '---' && v !== 'null';
}

async function initPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const identifier = urlParams.get('film');

  const mainContent = document.getElementById('main-content');
  const loader = document.getElementById('loader');

  try {
    const response = await fetch(PERCORSO_DATABASE);
    if (!response.ok) throw new Error('Database non trovato.');
    const movies = await response.json();
    const movie = movies.find((m) => m.codice === identifier);

    if (!movie) {
      loader.innerHTML = '<p class="text-xs uppercase font-black">Opera non trovata.</p>';
      return;
    }

    document.title = 'CDL | ' + movie.titolo;
    document.getElementById('movie-title').textContent = movie.titolo;
    document.getElementById('movie-year').textContent = movie.anno;

    if (valorizzato(movie.tagline)) {
      document.getElementById('movie-tagline').textContent = movie.tagline;
      document.getElementById('tagline-row').classList.remove('hidden');
    }

    document.getElementById('movie-synopsis').textContent = movie.sinossi || '---';

    if (valorizzato(movie.note_regia)) {
      document.getElementById('movie-notes').textContent = movie.note_regia;
      document.getElementById('notes-section').classList.remove('hidden');
    }

    // Generi: campo unico separato da virgole, una etichetta per ciascuno
    const genreContainer = document.getElementById('genre-container');
    const genres = movie.genere ? movie.genere.split(',').map((g) => g.trim()) : [];
    genres.forEach((g) => {
      const span = document.createElement('span');
      span.className = 'genre-tag';
      span.textContent = g;
      genreContainer.appendChild(span);
    });

    const lbBtn = document.getElementById('letterboxd-link');
    if (valorizzato(movie.letterboxd)) {
      lbBtn.href = movie.letterboxd;
      lbBtn.classList.remove('hidden');
    }

    // Troupe
    const troupeContainer = document.getElementById('troupe-container');
    troupeContainer.innerHTML = '';
    RUOLI_TROUPE.forEach((role) => {
      // Alcune voci storiche del JSON hanno l'iniziale maiuscola: si accettano
      // entrambe le grafie
      const capitalizedKey = role.key.charAt(0).toUpperCase() + role.key.slice(1);
      const val = movie[role.key] || movie[capitalizedKey];

      if (valorizzato(val)) {
        const div = document.createElement('div');
        div.innerHTML = `
          <span class="label-tech !text-black/40">${role.label}</span>
          <p class="value-tech">${val}</p>
        `;
        troupeContainer.appendChild(div);
      }
    });

    // Media: se c'è un video si mostra il player, altrimenti il fotogramma
    // con sopra il velo "in arrivo"
    const embedUrl = getEmbedUrl(movie.video_url);
    const videoWrapper = document.getElementById('video-wrapper');
    const movieStill = document.getElementById('movie-still');
    const comingSoon = document.getElementById('coming-soon');

    if (embedUrl) {
      document.getElementById('video-player').src = embedUrl;
      videoWrapper.classList.remove('hidden');
      comingSoon.classList.add('hidden');
      movieStill.classList.add('hidden');
    } else {
      movieStill.src = movie.still || '';
      movieStill.classList.remove('hidden');
      comingSoon.classList.remove('hidden');
      videoWrapper.classList.add('hidden');
    }

    // Cast: campi numerati cast1…cast10 con il ruolo appaiato
    const castList = document.getElementById('movie-cast');
    castList.innerHTML = '';
    let hasCast = false;
    for (let i = 1; i <= MAX_CAST; i++) {
      const actor = movie[`cast${i}`];
      const role = movie[`ruolo_cast${i}`];
      if (valorizzato(actor)) {
        hasCast = true;
        const li = document.createElement('li');
        li.className = 'flex flex-col border-b border-white/10 pb-2';
        li.innerHTML = `
          <span class="flex items-center gap-2">
            <i data-lucide="user" class="w-3 h-3 text-[--cdl-lavender] opacity-50"></i> ${actor}
          </span>
          ${role ? `<span class="text-[8px] text-[--cdl-lavender] opacity-100 font-bold ml-5 uppercase tracking-wider">${role}</span>` : ''}
        `;
        castList.appendChild(li);
      }
    }
    if (hasCast) document.getElementById('cast-box').classList.remove('hidden');

    // Solo ora si toglie il velo di caricamento, così la pagina non appare
    // mai a metà riempimento
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      mainContent.classList.add('fade-in');
      mainContent.style.opacity = '1';
      lucide.createIcons();
    }, 500);
  } catch (error) {
    console.error(error);
    loader.innerHTML = '<p class="text-xs uppercase font-black">Errore di Sincronizzazione.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initPage);
