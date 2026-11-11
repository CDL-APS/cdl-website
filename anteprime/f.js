/* ANTEPRIMA F — la torcia sulla sala, l'indice delle sezioni, il rullino che
   scorre, e la Cortoteca con l'indice a fianco del palco e la galleria che
   mette a fuoco un fotogramma alla volta. Si appoggia a comune.js e ai dati
   veri (assets/js/dati.js).
   File di prova: non fa parte del sito pubblicato. */

/* La torcia: un cerchio di luce che insegue il puntatore con un po' di
   ritardo. Senza puntatore, o dopo qualche secondo di quiete, passeggia da
   sola fra le poltrone. */
function torcia() {
  const sala = document.querySelector('.hero--sala');
  if (!sala || FERMO) return;

  let x = 0.7, y = 0.42, versoX = x, versoY = y, ultimoMovimento = 0;
  sala.addEventListener('pointermove', (e) => {
    const r = sala.getBoundingClientRect();
    versoX = (e.clientX - r.left) / r.width;
    versoY = (e.clientY - r.top) / r.height;
    ultimoMovimento = performance.now();
  });

  const passo = (ora) => {
    if (ora - ultimoMovimento > 3500) {
      versoX = 0.62 + 0.26 * Math.sin(ora / 4100);
      versoY = 0.45 + 0.22 * Math.sin(ora / 2900 + 1);
    }
    x += (versoX - x) * 0.07;
    y += (versoY - y) * 0.07;
    sala.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
    sala.style.setProperty('--my', (y * 100).toFixed(2) + '%');
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* L'indice: ogni riga dice l'ultima cosa accaduta in quella sezione e ne
   mostra la fotografia */
async function home() {
  const [eventi, opere] = await Promise.all([caricaEventi().catch(() => []), caricaOpere().catch(() => [])]);
  const [evento] = eventi;
  const [produzione] = produzioniCdl(opere);
  const [corto] = daGuardare(opere);

  const riempi = (id, testo, immagine) => {
    document.getElementById('nota-' + id).textContent = testo;
    if (immagine) document.getElementById('foto-' + id).append(nuovaImmagine(immagine));
  };
  if (evento) riempi('eventi', `Ultimo evento: ${evento.titolo}, ${dataLunga(evento.data_inizio)}`, evento.miniatura || evento.copertina);
  if (produzione) riempi('produzioni', `Ultima produzione: ${produzione.titolo}, ${produzione.anno}`, produzione.fotogramma);
  if (opere.length) riempi('cortoteca', `${opere.length} opere dei soci, ${daGuardare(opere).length} da guardare ora`, (corto || opere[0]).fotogramma);
}

/* Cortoteca, vista a lista: l'indice dei titoli e il palco */
function listaConPalco(scelte, contenitore) {
  contenitore.innerHTML = '<div class="grid"><ol class="righe span-5"></ol><div class="palco span-6 start-7"></div></div>';
  const elenco = contenitore.querySelector('.righe');
  const palco = contenitore.querySelector('.palco');

  const attiva = (i) => {
    const o = scelte[i];
    elenco.querySelectorAll('.riga').forEach((r, n) => r.classList.toggle('is-attiva', n === i));
    palco.innerHTML = `
      <a class="cornice" href="${esc(indirizzoOpera(o))}" tabindex="-1" aria-hidden="true"></a>
      <div class="palco__testo">
        <h2 class="palco__titolo">${esc(o.titolo)}</h2>
        ${o.tagline ? `<p class="palco__frase">${esc(o.tagline)}</p>` : ''}
        <p class="palco__dati">${esc(datiOpera(o))}</p>
        <a class="btn btn--pieno" href="${esc(indirizzoOpera(o))}">${streamingDisponibile(o) ? PLAY + 'Guarda ora' : 'Apri la scheda'}</a>
      </div>`;
    palco.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
  };

  scelte.forEach((o, i) => {
    const guardabile = streamingDisponibile(o);
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="riga" href="${esc(indirizzoOpera(o))}">
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
  attiva(0);
  document.getElementById('lettura').classList.remove('is-visibile');
}

/* Cortoteca, vista a galleria: il fotogramma su cui ci si trova resta
   acceso, gli altri arretrano, e titolo e dati si leggono nella riga sopra */
function galleriaAFuoco(scelte, contenitore, tutte) {
  const griglia = disegnaGalleria(scelte, contenitore);
  const lettura = document.getElementById('lettura');
  const riposo = () => {
    griglia.classList.remove('ha-fuoco');
    griglia.querySelectorAll('.is-fuoco').forEach((s) => s.classList.remove('is-fuoco'));
    lettura.innerHTML = `<span class="lettura__dati">${scelte.length} opere, ${daGuardare(tutte).length} da guardare ora. Passa su un fotogramma per sapere che cos'è.</span>`;
  };
  griglia.querySelectorAll('.still').forEach((still) => {
    const accendi = () => {
      griglia.classList.add('ha-fuoco');
      griglia.querySelectorAll('.still').forEach((s) => s.classList.toggle('is-fuoco', s === still));
      const o = still.opera;
      lettura.innerHTML = `<span class="lettura__titolo">${esc(o.titolo)}</span><span class="lettura__dati">${esc(datiOpera(o))}${streamingDisponibile(o) ? ' · da guardare ora' : ''}</span>`;
    };
    still.addEventListener('pointerenter', accendi);
    still.addEventListener('focus', accendi);
  });
  griglia.addEventListener('pointerleave', riposo);
  lettura.classList.add('is-visibile');
  riposo();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('opere')) avviaCortoteca({ lista: listaConPalco, galleria: galleriaAFuoco });
  if (document.getElementById('nota-eventi')) {
    home().catch(console.error);
    torcia();
    preparaScorre(document.getElementById('sale'));
  }
});
