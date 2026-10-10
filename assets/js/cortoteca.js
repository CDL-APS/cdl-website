/* ==========================================================================
   CORTOTECA — griglia delle opere.

   La pagina non contiene le opere nell'HTML: le legge dal database (vedi
   dati.js) e costruisce le card a runtime. Un corto aggiunto o pubblicato
   dalla pagina di gestione compare qui senza toccare il codice.
   ========================================================================== */

const LOGO_CDL = 'assets/img/brand/logo-cdl.png';

// Nell'angolo della card: play se il corto si può vedere sul sito, info se
// la scheda ha solo le informazioni (streaming in arrivo)
const ICONA_PLAY =
  '<svg class="icona-stato--play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72L19 12 8 5.14Z"/></svg>';
const ICONA_INFO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

let allMovies = [];

async function init() {
  try {
    allMovies = await caricaOpere();
    sortAndRender();
  } catch (error) {
    console.error(error);
    mostraAvviso('Errore caricamento database');
  }
}

function mostraAvviso(testo) {
  const grid = document.getElementById('movie-grid');
  const avviso = document.createElement('p');
  avviso.className = 'avviso';
  avviso.textContent = testo;
  grid.insertBefore(avviso, document.getElementById('add-card'));
}

function sortAndRender() {
  const grid = document.getElementById('movie-grid');
  const addCard = document.getElementById('add-card');
  const sortByDate = document.getElementById('ordine-anno').checked;
  const searchTerm = document.getElementById('db-search').value.toLowerCase().trim();

  // Si ricostruisce l'intera griglia a ogni ricerca o riordino: con qualche
  // decina di opere è più semplice e altrettanto veloce di un aggiornamento
  // selettivo
  grid.querySelectorAll('.opera, .avviso').forEach((c) => c.remove());

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
    card.href = 'opera.html?film=' + encodeURIComponent(movie.codice);
    card.className = 'riquadro opera';
    card.style.transitionDelay = `${0.03 * index}s`;

    const bollino =
      movie.produzione_cdl
        ? `<span class="bollino-cdl"><img src="${LOGO_CDL}" alt="Produzione CDL"></span>`
        : '';

    const produzione = movie.produzione ? `<br>Produzione: ${esc(movie.produzione)}` : '';
    const stato = streamingDisponibile(movie)
      ? `<span class="freccia icona-stato" title="Streaming disponibile">${ICONA_PLAY}<span class="sr-only">Streaming disponibile</span></span>`
      : `<span class="freccia icona-stato" title="Scheda informativa, streaming in arrivo">${ICONA_INFO}<span class="sr-only">Streaming in arrivo</span></span>`;

    // Se il fotogramma manca resta il fondo neutro del riquadro
    card.innerHTML = `
      <img class="foto" alt="" loading="lazy">
      ${bollino}
      ${stato}
      <div class="chip">
        <p class="chip-etichetta">${esc(movie.anno)}</p>
        <h2 class="chip-titolo">${esc(movie.titolo)}</h2>
        <p class="chip-meta">Regia di ${esc(movie.regista)}${produzione}</p>
      </div>
    `;
    mostraImmagine(card.querySelector('.foto'), movie.fotogramma);

    grid.insertBefore(card, addCard);
    setTimeout(() => card.classList.add('is-visibile'), 50);
  });

  if (filtered.length === 0) mostraAvviso('Nessuna opera trovata');

  // Il riquadro tratteggiato "vuoi la tua opera qui?" sparisce durante una
  // ricerca, dove sarebbe solo rumore
  addCard.style.display = searchTerm.length > 0 ? 'none' : '';
}

document.querySelectorAll('input[name="ordine"]').forEach((r) => r.addEventListener('change', sortAndRender));
document.getElementById('db-search').addEventListener('input', sortAndRender);

document.addEventListener('DOMContentLoaded', init);
