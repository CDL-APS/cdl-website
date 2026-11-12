/* ==========================================================================
   OPERA (opera.html) — la pagina di un corto, aperta da sola. Legge il
   codice dalla query string (opera.html?film=quartolivello) e la riempie
   con mostraCorto() (corto.js). Senza parametro, o con un codice che non
   c'è, mostra "Opera non trovata". Si appoggia a dati.js, comune.js e
   corto.js.
   ========================================================================== */

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
