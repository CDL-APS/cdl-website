/* ==========================================================================
   EVENTI — griglia degli eventi organizzati da CDL.

   Gli eventi pubblicati arrivano dal database (vedi dati.js), dal più
   recente. Un evento con una pagina dedicata diventa un riquadro cliccabile;
   gli altri restano riquadri informativi. In coda resta la sagoma del
   prossimo evento, scritta nell'HTML.
   ========================================================================== */

const ICONA_FRECCIA_EVENTO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';

async function initEventi() {
  const griglia = document.getElementById('griglia-eventi');
  const sagoma = griglia.querySelector('.riquadro--vuoto');

  try {
    const eventi = await caricaEventi();

    eventi.forEach((evento, indice) => {
      const pagina = indirizzoSicuro(evento.pagina);
      const riquadro = document.createElement(pagina ? 'a' : 'div');
      riquadro.className = 'riquadro';
      if (pagina) riquadro.href = pagina;

      const etichetta = indice === 0 ? 'Ultimo evento' : evento.data_inizio.slice(0, 4);
      riquadro.innerHTML = `
        <img class="foto" alt="" loading="lazy">
        ${pagina ? `<span class="freccia" aria-hidden="true">${ICONA_FRECCIA_EVENTO}</span>` : ''}
        <div class="chip">
          <p class="chip-etichetta">${esc(etichetta)}</p>
          <p class="chip-titolo">${esc(evento.titolo)}</p>
          ${evento.riassunto ? `<p class="chip-meta">${esc(evento.riassunto)}</p>` : ''}
        </div>
      `;
      mostraImmagine(riquadro.querySelector('.foto'), evento.miniatura || evento.copertina);
      griglia.insertBefore(riquadro, sagoma);
    });
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', initEventi);
