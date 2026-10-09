/* ==========================================================================
   SCHEDA OPERA — dettaglio di un singolo cortometraggio.

   La pagina è un guscio vuoto: legge il codice dell'opera dalla query string
   (opera.html?film=quartolivello), chiede quell'opera al database (vedi
   dati.js) e riempie i campi. Una sola pagina serve tutte le opere.
   ========================================================================== */

/* Trasforma un link YouTube o Vimeo nel corrispondente URL di embed.
   Restituisce null se il campo è vuoto o non riconosciuto, ed è questo che
   fa comparire il velo "streaming in arrivo". */
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

/* Ruoli mostrati nella colonna troupe, nell'ordine in cui appaiono.
   La chiave è il nome della colonna nella tabella opere; i ruoli con campo
   vuoto vengono semplicemente saltati. */
const RUOLI_TROUPE = [
  { label: 'Regia', key: 'regista' },
  { label: 'Produzione', key: 'produzione' },
  { label: 'DOP', key: 'fotografia' },
  { label: 'Sceneggiatura', key: 'sceneggiatura' },
  { label: 'Montaggio', key: 'montaggio' },
  { label: 'Trucco', key: 'trucco' },
  { label: 'Costumi', key: 'costumi' },
  { label: 'Scenografia', key: 'scenografia' },
  { label: 'Colonna Sonora', key: 'colonna_sonora' }
];

function valorizzato(v) {
  return v !== null && v !== undefined && v.toString().trim() !== '';
}

async function initPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const identifier = urlParams.get('film');

  const mainContent = document.getElementById('main-content');
  const loader = document.getElementById('loader');

  try {
    const movie = identifier ? await caricaOpera(identifier) : null;

    if (!movie) {
      loader.innerHTML = '<p class="etichetta">Opera non trovata.</p>';
      return;
    }

    document.title = 'CDL | ' + movie.titolo;
    document.getElementById('movie-title').textContent = movie.titolo;
    document.getElementById('movie-year').textContent = movie.anno;

    if (valorizzato(movie.tagline)) {
      document.getElementById('movie-tagline').textContent = movie.tagline;
      document.getElementById('tagline-row').hidden = false;
    }

    const sinossi = document.getElementById('movie-synopsis');
    if (valorizzato(movie.sinossi)) sinossi.textContent = movie.sinossi;
    else sinossi.hidden = true;

    if (valorizzato(movie.note_regia)) {
      document.getElementById('movie-notes').textContent = movie.note_regia;
      document.getElementById('notes-section').hidden = false;
    }

    // Generi: una etichetta per ciascuno
    const genreContainer = document.getElementById('genre-container');
    (movie.generi || []).forEach((g) => {
      const span = document.createElement('span');
      span.className = 'genere';
      span.textContent = g;
      genreContainer.appendChild(span);
    });

    const lbBtn = document.getElementById('letterboxd-link');
    // Solo indirizzi web veri: il campo arriva da un modulo
    if (valorizzato(movie.letterboxd_url) && /^https?:\/\//.test(movie.letterboxd_url)) {
      lbBtn.href = movie.letterboxd_url;
      lbBtn.hidden = false;
    }

    // Troupe
    const troupeContainer = document.getElementById('troupe-container');
    troupeContainer.innerHTML = '';
    RUOLI_TROUPE.forEach((role) => {
      const val = movie[role.key];

      if (valorizzato(val)) {
        const div = document.createElement('div');
        div.innerHTML = `<dt>${role.label}</dt><dd>${esc(val)}</dd>`;
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
      videoWrapper.hidden = false;
      comingSoon.hidden = true;
      movieStill.hidden = true;
    } else {
      movieStill.hidden = false;
      mostraImmagine(movieStill, movie.fotogramma);
      comingSoon.hidden = false;
      videoWrapper.hidden = true;
    }

    // Cast: gli interpreti arrivano già nell'ordine giusto
    const castList = document.getElementById('movie-cast');
    castList.innerHTML = '';
    const interpreti = movie.interpreti || [];
    interpreti.forEach((interprete) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="cast-nome">${esc(interprete.nome)}</span>
        ${interprete.ruolo ? `<span class="cast-ruolo">${esc(interprete.ruolo)}</span>` : ''}
      `;
      castList.appendChild(li);
    });
    if (interpreti.length) document.getElementById('cast-box').hidden = false;

    // Solo ora si toglie il velo di caricamento, così la pagina non appare
    // mai a metà riempimento
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      mainContent.classList.add('is-pronta');
    }, 500);
  } catch (error) {
    console.error(error);
    loader.innerHTML = '<p class="etichetta">Errore di sincronizzazione.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initPage);
