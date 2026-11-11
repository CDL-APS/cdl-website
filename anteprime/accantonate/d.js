/* ANTEPRIMA D — riempie i due pannelli della home e la Cortoteca con i dati
   veri (assets/js/dati.js). Si appoggia a comune.js.
   File di prova: non fa parte del sito pubblicato. */

function riempiPannello(id, { href, immagine, titolo, dati }) {
  const voce = document.querySelector(`#${id} .pannello__voce`);
  voce.href = href;
  voce.querySelector('.cornice').append(nuovaImmagine(immagine));
  voce.querySelector('.pannello__titolo span').textContent = titolo;
  voce.querySelector('.pannello__dati').textContent = dati;
  voce.hidden = false;
}

function home() {
  caricaEventi().then(([e]) => {
    if (!e) return;
    riempiPannello('pannello-eventi', {
      href: indirizzoSicuro(e.pagina) || 'eventi.html',
      immagine: e.miniatura || e.copertina,
      titolo: e.titolo,
      dati: e.riassunto || e.luogo || ''
    });
  }).catch(console.error);

  caricaOpere().then((opere) => {
    const [o] = produzioniCdl(opere);
    if (o) {
      riempiPannello('pannello-produzioni', {
        href: indirizzoOpera(o), immagine: o.fotogramma, titolo: o.titolo, dati: datiOpera(o)
      });
    }
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

/* ---- Cortoteca: prima i corti da guardare, poi l'indice di tutte le opere ---- */
let opere = [];

function disegnaDaGuardare() {
  const griglia = document.getElementById('da-guardare');
  daGuardare(opere).slice(0, 2).forEach((o) => {
    const a = document.createElement('a');
    a.className = 'scheda film span-6';
    a.href = indirizzoOpera(o);
    a.innerHTML = `
      <span class="cornice"></span>
      <span class="film__testo">
        <h2 class="film__titolo">${esc(o.titolo)}</h2>
        <span class="film__dati">${esc(datiOpera(o))}</span>
        <span class="film__guarda">${PLAY}Guarda</span>
      </span>`;
    a.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
    griglia.append(a);
  });
}

function disegnaIndice() {
  const elenco = document.getElementById('movie-grid');
  const perAnno = document.getElementById('ordine-anno').checked;
  const cerca = document.getElementById('db-search').value.toLowerCase().trim();

  const scelte = opere.filter((o) =>
    [o.titolo, o.regista, o.produzione].some((t) => (t || '').toLowerCase().includes(cerca)));
  scelte.sort(perAnno ? dallaPiuRecente : (a, b) => a.titolo.localeCompare(b.titolo));

  elenco.replaceChildren();
  scelte.forEach((o) => {
    const li = document.createElement('li');
    const stato = streamingDisponibile(o)
      ? `<span class="voce__stato voce__stato--play">${PLAY}Guarda</span>`
      : '<span class="voce__stato">In arrivo</span>';
    li.innerHTML = `
      <a class="voce" href="${esc(indirizzoOpera(o))}">
        <span class="cornice"></span>
        <span>
          <span class="voce__titolo"><span>${esc(o.titolo)}</span></span>
          <span class="voce__dati">${esc([generePrincipale(o), 'Regia di ' + o.regista].filter(Boolean).join(' · '))}</span>
        </span>
        <span class="voce__anno">${esc(o.anno)}</span>
        ${stato}
      </a>`;
    li.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
    elenco.append(li);
  });

  if (!scelte.length) {
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
  disegnaDaGuardare();
  disegnaIndice();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('movie-grid')) cortoteca();
  if (document.getElementById('pannello-eventi')) home();
});
