/* ==========================================================================
   OPERA (opera.html) — la pagina di un corto, aperta da sola. Legge il
   codice dalla query string (opera.html?film=quartolivello) e la riempie
   con mostraCorto() (corto.js). Senza parametro, o con un codice che non
   c'è, mostra "Opera non trovata". Si appoggia a dati.js, comune.js e
   corto.js.
   ========================================================================== */

/* Arrivo dal passaggio di Produzioni (passaggioScheda in produzioni.js): la
   copertina è già al suo posto, la barra compare piano come dopo i
   passaggi dalla home. Gira appena lo script è letto. */
(function arrivoDaProduzioni() {
  try {
    const da = sessionStorage.getItem('cdl-passaggio-scheda');
    sessionStorage.removeItem('cdl-passaggio-scheda');
    if (da && da === location.search) document.documentElement.classList.add('da-passaggio');
  } catch (errore) { /* senza memoria di sessione si arriva lo stesso */ }
}());

async function paginaCorto() {
  const codice = new URLSearchParams(location.search).get('film');
  let o = null;
  try {
    o = codice ? await caricaOpera(codice) : null;
  } catch (errore) {
    console.error(errore);
  }
  if (!o) { document.getElementById('corto-avviso').hidden = false; return; }
  mostraCorto(o, document.body);
}

document.addEventListener('DOMContentLoaded', paginaCorto);
