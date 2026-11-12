/* ==========================================================================
   EVENTO (evento.html) — la pagina di un evento composta dal database,
   aperta da sola. Legge il codice dalla query string
   (evento.html?e=short-talks-1) e la disegna con modello-evento.js. Un
   evento che non usa ancora il modello porta alla sua pagina scritta a mano;
   senza codice, o con un codice che non c'è, "Evento non trovato". Si
   appoggia a dati.js, comune.js e modello-evento.js.
   ========================================================================== */

/* L'anteprima della gestione (evento.html?anteprima): i dati del modulo,
   anche non salvati, lasciati nella memoria del browser */
function eventoInAnteprima() {
  try {
    const evento = JSON.parse(localStorage.getItem('cdl-anteprima-evento') || 'null');
    return evento && typeof evento === 'object' && evento.titolo ? evento : null;
  } catch {
    return null;
  }
}

async function apriPaginaEvento() {
  const parametri = new URLSearchParams(location.search);
  const anteprima = parametri.has('anteprima');
  const codice = parametri.get('e') || '';
  let evento = anteprima ? eventoInAnteprima() : null;
  if (!anteprima && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(codice)) {
    try {
      const eventi = await leggi('eventi', `select=${COLONNE_EVENTI}&pubblicato=eq.true&codice=eq.${codice}`);
      evento = eventi.find((e) => e.codice === codice) || null;
    } catch (errore) {
      console.error(errore);
    }
  }
  if (!anteprima && evento && !conModello(evento) && paginaEvento(evento)) { location.replace(paginaEvento(evento)); return; }
  const main = document.querySelector('main');
  if (!evento) { document.getElementById('evento-avviso').hidden = false; return; }

  const pagina = await componiEvento(evento);
  document.title = (anteprima ? 'Anteprima: ' : '') + pagina.titolo;
  if (evento.descrizione) document.querySelector('meta[name="description"]').content = evento.descrizione;
  main.innerHTML = pagina.html;
  vestiEvento(document.body, main, pagina);
  preparaGiostre(main);
  if (anteprima) {
    main.insertAdjacentHTML('afterbegin', '<p class="avviso-anteprima" role="status">Anteprima dalla gestione: la pagina come sarà dopo il salvataggio. Si aggiorna premendo di nuovo Anteprima.</p>');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  apriPaginaEvento().catch((errore) => {
    console.error(errore);
    const avviso = document.getElementById('evento-avviso');
    if (avviso) avviso.hidden = false;
  });
});
