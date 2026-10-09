/* ==========================================================================
   PRODUZIONI — elenco delle opere prodotte da CDL.

   Come la Cortoteca, la pagina non contiene le opere nell'HTML: tiene quelle
   con "cdl": true in data/film.json (vedi opere.js) e le elenca dalla più
   recente.
   ========================================================================== */

const ICONA_ELENCO =
  '<svg class="elenco-freccia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';

async function initProduzioni() {
  const elenco = document.getElementById('elenco-produzioni');

  try {
    const produzioni = produzioniCdl(await caricaOpere());

    produzioni.forEach((opera) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="opera.html?film=${opera.codice}">
          <span class="elenco-titolo">${opera.titolo}</span>
          <span class="elenco-dati">${opera.regista} &bull; ${opera.anno} &bull; ${opera.produzione}</span>
          ${ICONA_ELENCO}
        </a>
      `;
      elenco.appendChild(li);
    });

    if (produzioni.length === 0) mostraAvvisoElenco(elenco, 'Nessuna produzione da mostrare');
  } catch (error) {
    console.error(error);
    mostraAvvisoElenco(elenco, 'Errore caricamento database');
  }
}

function mostraAvvisoElenco(elenco, testo) {
  const li = document.createElement('li');
  li.className = 'elenco-avviso';
  li.textContent = testo;
  elenco.appendChild(li);
}

document.addEventListener('DOMContentLoaded', initProduzioni);
