/* ANTEPRIMA C — riempie le fasce della home e l'indice della Cortoteca con i
   dati veri (assets/js/dati.js). Si appoggia a comune.js.
   File di prova: non fa parte del sito pubblicato. */

/* Elenco con anteprima: la voce sotto il puntatore (o a fuoco) diventa
   attiva e nella cornice compare la sua fotografia */
function elencoConAnteprima(elenco, cornice, voci) {
  elenco.replaceChildren();
  cornice.replaceChildren();

  const attiva = (i) => {
    elenco.querySelectorAll('.riga').forEach((r, n) => r.classList.toggle('is-attiva', n === i));
    cornice.querySelectorAll('img').forEach((img, n) => img.classList.toggle('is-attiva', n === i));
  };

  voci.forEach((voce, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="riga" href="${esc(voce.href)}">
        <span class="riga__mini"></span>
        <span class="riga__titolo">${esc(voce.titolo)}</span>
        <span class="riga__dati">${esc(voce.dati)}</span>
        <span class="riga__segno" aria-hidden="true">${PIU}</span>
      </a>`;
    const riga = li.firstElementChild;
    riga.querySelector('.riga__mini').append(nuovaImmagine(voce.immagine));
    riga.addEventListener('pointerenter', () => attiva(i));
    riga.addEventListener('focus', () => attiva(i));
    elenco.append(li);
    cornice.append(nuovaImmagine(voce.immagine));
  });
  attiva(0);
}

function home() {
  caricaEventi().then((eventi) => {
    elencoConAnteprima(
      document.getElementById('elenco-eventi'),
      document.getElementById('cornice-eventi'),
      eventi.slice(0, 4).map((e) => ({
        href: indirizzoSicuro(e.pagina) || 'eventi.html',
        titolo: e.titolo,
        dati: e.riassunto || e.luogo || '',
        immagine: e.miniatura || e.copertina
      }))
    );
  }).catch(console.error);

  caricaOpere().then((opere) => {
    const griglia = document.getElementById('tessere-produzioni');
    produzioniCdl(opere).slice(0, 3).forEach((o) => {
      const a = document.createElement('a');
      a.className = 'scheda tessera span-4';
      a.href = indirizzoOpera(o);
      a.innerHTML = `
        <span class="cornice"></span>
        <span class="tessera__testo">
          <h3 class="tessera__titolo">${esc(o.titolo)}</h3>
          <p class="tessera__dati">${esc(datiOpera(o))}</p>
        </span>`;
      a.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
      griglia.append(a);
    });

    const [corto] = daGuardare(opere);
    const cornice = document.getElementById('corto-da-guardare');
    if (corto) {
      cornice.href = indirizzoOpera(corto);
      cornice.append(nuovaImmagine(corto.fotogramma));
      cornice.insertAdjacentHTML('beforeend', `<span class="disco">${PLAY}Guarda ${esc(corto.titolo)}</span>`);
      cornice.hidden = false;
    }
  }).catch(console.error);
}

/* ---- Cortoteca: indice a sinistra, palco a destra ---- */
let opere = [];

function sulPalco(o) {
  const palco = document.getElementById('palco');
  const guardabile = streamingDisponibile(o);
  palco.innerHTML = `
    <a class="cornice" href="${esc(indirizzoOpera(o))}" tabindex="-1" aria-hidden="true"></a>
    <div class="palco__testo">
      <h2 class="palco__titolo">${esc(o.titolo)}</h2>
      ${o.tagline ? `<p class="palco__frase">${esc(o.tagline)}</p>` : ''}
      <p class="palco__dati">${esc(datiOpera(o))}</p>
      <a class="btn" href="${esc(indirizzoOpera(o))}">${guardabile ? PLAY + 'Guarda ora' : 'Apri la scheda'}</a>
    </div>`;
  palco.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
  palco.hidden = false;
}

function disegnaIndice() {
  const elenco = document.getElementById('movie-grid');
  const perAnno = document.getElementById('ordine-anno').checked;
  const cerca = document.getElementById('db-search').value.toLowerCase().trim();

  const scelte = opere.filter((o) =>
    [o.titolo, o.regista, o.produzione].some((t) => (t || '').toLowerCase().includes(cerca)));
  scelte.sort(perAnno ? dallaPiuRecente : (a, b) => a.titolo.localeCompare(b.titolo));

  elenco.replaceChildren();
  const attiva = (i) => {
    elenco.querySelectorAll('.riga').forEach((r, n) => r.classList.toggle('is-attiva', n === i));
    sulPalco(scelte[i]);
  };

  scelte.forEach((o, i) => {
    const li = document.createElement('li');
    const guardabile = streamingDisponibile(o);
    li.innerHTML = `
      <a class="riga riga--indice" href="${esc(indirizzoOpera(o))}">
        <span class="riga__mini"></span>
        ${guardabile ? PLAY.replace('<svg', '<svg class="riga__play"') : '<span class="riga__play"></span>'}
        <span class="riga__titolo">${esc(o.titolo)}</span>
        <span class="riga__dati">Regia di ${esc(o.regista)}${guardabile ? ' · da guardare ora' : ''}</span>
        <span class="riga__anno">${esc(o.anno)}</span>
      </a>`;
    const riga = li.firstElementChild;
    riga.querySelector('.riga__mini').append(nuovaImmagine(o.fotogramma));
    riga.addEventListener('pointerenter', () => attiva(i));
    riga.addEventListener('focus', () => attiva(i));
    elenco.append(li);
  });

  if (scelte.length) {
    attiva(0);
  } else {
    document.getElementById('palco').hidden = true;
    const li = document.createElement('li');
    li.className = 'avviso';
    li.textContent = 'Nessuna opera trovata. Prova con un altro titolo o un altro nome.';
    elenco.append(li);
  }
}

async function cortoteca() {
  document.querySelectorAll('input[name="ordine"]').forEach((r) => r.addEventListener('change', disegnaIndice));
  document.getElementById('db-search').addEventListener('input', disegnaIndice);
  try {
    opere = await caricaOpere();
  } catch (errore) {
    console.error(errore);
  }
  disegnaIndice();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('movie-grid')) cortoteca();
  if (document.getElementById('elenco-eventi')) home();
});
