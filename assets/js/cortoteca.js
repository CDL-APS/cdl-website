/* ==========================================================================
   CORTOTECA — griglia delle opere.

   La pagina non contiene le opere nell'HTML: le legge da data/film.json e
   costruisce le card a runtime. Per aggiungere un corto basta quindi
   modificare il JSON, senza toccare una riga di codice.
   ========================================================================== */

const PERCORSO_DATABASE = 'data/film.json';
const LOGO_CDL = 'assets/img/brand/logo-cdl.png';

let allMovies = [];

async function init() {
  try {
    const response = await fetch(PERCORSO_DATABASE);
    if (!response.ok) throw new Error('Database non trovato');
    allMovies = await response.json();
    sortAndRender();
  } catch (error) {
    console.error(error);
    document.getElementById('movie-grid').innerHTML +=
      '<div class="col-span-full text-center p-8 opacity-50 uppercase font-black text-xs">Errore caricamento database</div>';
  }
  lucide.createIcons();
}

function sortAndRender() {
  const grid = document.getElementById('movie-grid');
  const addCard = document.getElementById('add-card');
  const sortByDate = document.getElementById('sort-toggle').checked;
  const searchTerm = document.getElementById('db-search').value.toLowerCase().trim();

  // Si ricostruisce l'intera griglia a ogni ricerca o riordino: con qualche
  // decina di opere è più semplice e altrettanto veloce di un aggiornamento
  // selettivo
  grid.querySelectorAll('.movie-card').forEach((c) => c.remove());

  const filtered = allMovies.filter((m) => {
    const title = (m.titolo || '').toLowerCase();
    const author = (m.regista || '').toLowerCase();
    const prod = (m.produzione || '').toLowerCase();
    return title.includes(searchTerm) || author.includes(searchTerm) || prod.includes(searchTerm);
  });

  if (sortByDate) {
    filtered.sort((a, b) => a.anno - b.anno);
  } else {
    // localeCompare ordina correttamente accenti e caratteri italiani
    filtered.sort((a, b) => a.titolo.localeCompare(b.titolo));
  }

  filtered.forEach((movie, index) => {
    const card = document.createElement('a');
    card.href = movie.codice ? 'opera.html?film=' + movie.codice : '#';
    card.className = 'movie-card bento-border aspect-square group';

    // Ogni card parte trasparente e scivola in posizione con un ritardo
    // crescente, per un ingresso a cascata
    card.style.opacity = '0';
    card.style.transform = 'translateY(15px)';
    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    card.style.transitionDelay = `${0.03 * index}s`;

    const cdlLogo = movie.cdl === 'si' ? `<img src="${LOGO_CDL}" class="cdl-logo-badge" alt="CDL">` : '';
    const stillPath = movie.still || '';

    card.innerHTML = `
      <img src="${stillPath}" alt="${movie.titolo}" class="img-still" onerror="this.src='https://placehold.co/600x600/1d1d1b/f7f7f7?text=${encodeURIComponent(movie.titolo)}'">
      <div class="overlay">
        <div class="flex justify-between items-start mb-auto">
          <i data-lucide="play" class="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity"></i>
          ${cdlLogo}
        </div>
        <div class="flex justify-between items-end mb-1 md:mb-2 gap-2">
          <h2 class="text-xs md:text-xl font-black group-hover:text-[--cdl-lavender]">${movie.titolo}</h2>
          <span class="text-[7px] md:text-[9px] font-black uppercase text-[--cdl-lavender] tracking-[0.2em] flex-shrink-0">${movie.anno}</span>
        </div>
        <div class="pt-1 md:pt-2 border-t border-white/20 flex flex-col gap-0.5">
          <span class="text-[7px] md:text-[9px] font-black uppercase tracking-wider opacity-90">REGIA: ${movie.regista}</span>
          <span class="text-[6px] md:text-[8px] font-medium uppercase tracking-widest opacity-60">PRODUZIONE: ${movie.produzione}</span>
        </div>
      </div>
    `;

    grid.insertBefore(card, addCard);
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 50);
  });

  // Il riquadro tratteggiato "vuoi la tua opera qui?" sparisce durante una
  // ricerca, dove sarebbe solo rumore
  addCard.style.display = searchTerm.length > 0 ? 'none' : 'flex';
  lucide.createIcons();
}

document.getElementById('sort-toggle').addEventListener('change', sortAndRender);
document.getElementById('db-search').addEventListener('input', sortAndRender);

document.addEventListener('DOMContentLoaded', init);
