/* ==========================================================================
   EVENTI — gli eventi organizzati da CDL, divisi in blocchi per serie.

   Gli eventi pubblicati arrivano dal database (vedi dati.js), dal più
   recente. L'ultima edizione di Long Story Short sta in primo piano, a tutta
   larghezza; le edizioni di Short Talks hanno un blocco loro; tutto il resto
   (eventi senza serie, ed edizioni passate di Long Story Short quando ci
   saranno) finisce in "Altri eventi". Un evento con una pagina dedicata
   diventa un riquadro cliccabile. La serie si sceglie dal modulo di gestione.
   ========================================================================== */

const ICONA_FRECCIA_EVENTO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';

/* Riquadro di un evento: la foto sopra e, sotto il filetto, anno, titolo e
   riassunto */
function riquadroEvento(evento) {
  const pagina = indirizzoSicuro(evento.pagina);
  const riquadro = document.createElement(pagina ? 'a' : 'div');
  riquadro.className = 'riquadro';
  if (pagina) riquadro.href = pagina;

  riquadro.innerHTML = `
    <span class="riquadro-foto">
      <img class="foto" alt="" loading="lazy">
      ${pagina ? `<span class="freccia" aria-hidden="true">${ICONA_FRECCIA_EVENTO}</span>` : ''}
    </span>
    <div class="chip">
      <p class="chip-etichetta">${esc(evento.data_inizio.slice(0, 4))}</p>
      <p class="chip-titolo">${esc(evento.titolo)}</p>
      ${evento.riassunto ? `<p class="chip-meta">${esc(evento.riassunto)}</p>` : ''}
    </div>
  `;
  mostraImmagine(riquadro.querySelector('.foto'), evento.miniatura || evento.copertina);
  return riquadro;
}

/* Mette gli eventi nella griglia del blocco; senza eventi resta nascosto */
function riempiBlocco(id, eventi) {
  const blocco = document.getElementById(id);
  const griglia = blocco.querySelector('.griglia-riquadri');
  eventi.forEach((evento) => griglia.appendChild(riquadroEvento(evento)));
  blocco.hidden = eventi.length === 0;
}

/* Long Story Short in primo piano. Titolo e marchio sono scritti nell'HTML:
   qui arrivano copertina, anno, riassunto e pagina dell'ultima edizione. */
function riempiPrimoPiano(evento) {
  if (!evento) return;
  const box = document.getElementById('primo-piano');
  const pagina = indirizzoSicuro(evento.pagina);
  if (pagina) box.href = pagina;
  else box.querySelector('.freccia').remove();

  box.querySelector('.primo-piano-edizione').textContent = 'Edizione ' + evento.data_inizio.slice(0, 4);
  box.querySelector('.primo-piano-riassunto').textContent = evento.riassunto || evento.luogo || '';
  mostraImmagine(box.querySelector('.foto'), evento.copertina || evento.miniatura);
  box.hidden = false;
}

async function initEventi() {
  try {
    const eventi = await caricaEventi();
    const primoPiano = eventi.find((e) => e.serie === 'long-story-short');

    riempiPrimoPiano(primoPiano);
    riempiBlocco('blocco-short-talks', eventi.filter((e) => e.serie === 'short-talks'));
    riempiBlocco('blocco-altri', eventi.filter((e) => e !== primoPiano && e.serie !== 'short-talks'));
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', initEventi);
