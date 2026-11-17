/* ==========================================================================
   HOME (index.html) — la torcia sulla sala, il nastro delle ultime notizie,
   gli elenchi brevi dell'indice, il rullino che scorre e i passaggi verso
   le sezioni. Si appoggia a dati.js e comune.js.
   ========================================================================== */

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

function voceNastro(testo, href) {
  return `<span class="nastro__voce"><a href="${esc(href)}">${esc(testo)}</a><span class="logo" aria-hidden="true"></span></span>`;
}

/* L'elenco breve sotto un nome dell'indice: titolo e, più piccolo, quando.
   --i fa entrare le voci una dopo l'altra (vedi home.css). */
function elencoBreve(id, voci) {
  const elenco = document.getElementById('elenco-' + id);
  elenco.innerHTML = voci.map((v, i) =>
    `<li style="--i:${i}"><a href="${esc(v.href)}"><span>${esc(v.titolo)}</span><small>${esc(v.quando)}</small></a></li>`).join('');
}

/* Il rullino delle foto, scelto in gestione (tabella rullino): ogni foto
   porta all'evento (la sua pagina, o Eventi), al corto o alla pagina del
   sito indicata; una foto senza collegamento non si clicca. Le foto delle
   gallerie degli eventi sono file del sito (assets/…), le altre stanno
   nello spazio immagini. */
function indirizzoRullino(foto, eventi, opere) {
  if (foto.evento_id) return paginaEvento(eventi.find((e) => e.id === foto.evento_id)) || 'eventi.html';
  if (foto.opera_id) {
    const opera = opere.find((o) => o.id === foto.opera_id);
    if (opera) return indirizzoOpera(opera);
    return CORTOTECA_ATTIVA ? 'cortoteca.html' : null;
  }
  return paginaEvento({ pagina: foto.pagina });
}

/* La didascalia di una foto del rullino: l'evento e la sua data, il corto
   e chi l'ha fatto, o per le altre foto la loro descrizione */
function didascaliaRullino(foto, eventi, opere) {
  const evento = foto.evento_id && eventi.find((e) => e.id === foto.evento_id);
  if (evento) return [evento.titolo, evento.data_inizio ? dataLunga(evento.data_inizio) : ''];
  const opera = foto.opera_id && opere.find((o) => o.id === foto.opera_id);
  if (opera) {
    const chi = opera.produzione_cdl ? 'Produzione CDL' : opera.collaborazione_cdl ? 'Collaborazione CDL'
      : CORTOTECA_ATTIVA ? 'Cortoteca' : 'Cortometraggio';
    return [opera.titolo, [chi, opera.anno].filter(Boolean).join(', ')];
  }
  return [foto.descrizione || '', ''];
}

/* Fermandosi con il puntatore su una foto del rullino per un secondo e
   mezzo, la foto si ingrandisce di una volta e mezza, sopra le vicine, e
   al piede compare la didascalia. Il punto da cui cresce si sposta verso
   l'interno vicino ai bordi della finestra, perché resti tutta visibile.
   Solo con un puntatore vero: sul telefono il dito tocca e apre. */
const ATTESA_LENTE = 1500;

function preparaLente(blocco) {
  if (!PUNTATORE) return;
  blocco.querySelectorAll('.scorre__pista > .cornice').forEach((cornice) => {
    let attesa = null;
    cornice.addEventListener('pointerenter', () => {
      clearTimeout(attesa);
      attesa = setTimeout(() => {
        const r = cornice.getBoundingClientRect();
        const margine = 16;
        // con l'origine a ox px dal bordo sinistro la foto ingrandita va da
        // r.left - ox/2 a r.left + 1.5 larghezza - ox/2
        const minimo = 2 * (r.left + 1.5 * r.width - innerWidth + margine);
        const massimo = 2 * (r.left - margine);
        const ox = Math.min(r.width, Math.max(0, Math.min(massimo, Math.max(minimo, r.width / 2))));
        cornice.style.transformOrigin = `${ox.toFixed(1)}px 50%`;
        cornice.classList.add('is-lente');
        blocco.classList.add('ha-lente');
      }, ATTESA_LENTE);
    });
    cornice.addEventListener('pointerleave', () => {
      clearTimeout(attesa);
      cornice.classList.remove('is-lente');
      if (!blocco.querySelector('.is-lente')) blocco.classList.remove('ha-lente');
    });
  });
}

function riempiRullino(rullino, eventi, opere) {
  const blocco = document.getElementById('sale');
  const pista = blocco.querySelector('.scorre__pista');
  pista.replaceChildren(...rullino.map((foto) => {
    const href = indirizzoRullino(foto, eventi, opere);
    const cornice = document.createElement(href ? 'a' : 'span');
    cornice.className = 'cornice';
    if (href) cornice.href = href;
    let img;
    if (foto.immagine.startsWith('assets/')) {
      img = document.createElement('img');
      img.src = foto.immagine;
      img.alt = foto.descrizione || '';
    } else {
      img = nuovaImmagine(foto.immagine, foto.descrizione);
    }
    img.loading = 'lazy';
    cornice.append(img);
    const [titolo, dettaglio] = didascaliaRullino(foto, eventi, opere);
    if (titolo) {
      // la didascalia ripete in chiaro il collegamento: per i lettori di schermo basta l'alt
      const didascalia = document.createElement('span');
      didascalia.className = 'didascalia';
      didascalia.setAttribute('aria-hidden', 'true');
      const forte = document.createElement('strong');
      forte.textContent = titolo;
      didascalia.append(forte);
      if (dettaglio) {
        const piccolo = document.createElement('small');
        piccolo.textContent = dettaglio;
        didascalia.append(piccolo);
      }
      cornice.append(didascalia);
    }
    return cornice;
  }));
  blocco.hidden = !rullino.length;
  preparaScorre(blocco);
  preparaLente(blocco);
}

function meseAnno(giorno) {
  return new Date(giorno + 'T12:00:00').toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }).replace('.', '');
}

/* I due elenchi dell'indice (gli ultimi eventi, le ultime produzioni) e il
   nastro delle notizie. La quota ridotta è scritta una volta sola,
   nell'HTML (data-quota sul nastro). */
async function home() {
  const [eventi, opere, rullino] = await Promise.all([
    caricaEventi().catch(() => []), caricaOpere().catch(() => []), caricaRullino().catch(() => [])
  ]);
  riempiRullino(rullino, eventi, opere);
  const [evento] = eventi;
  const produzioni = produzioniCdl(opere);
  const [produzione] = produzioni;

  elencoBreve('eventi', eventi.slice(0, 3).map((e) => ({
    titolo: e.titolo, quando: meseAnno(e.data_inizio), href: paginaEvento(e) || 'eventi.html',
  })));
  elencoBreve('produzioni', produzioni.slice(0, 3).map((o) => ({
    titolo: o.titolo, quando: String(o.anno), href: indirizzoOpera(o),
  })));

  const nastro = document.getElementById('nastro');
  const voci = [];
  if (evento) voci.push(voceNastro(`Ultimo evento: ${evento.titolo}, ${dataLunga(evento.data_inizio)}`, paginaEvento(evento) || 'eventi.html'));
  if (produzione) voci.push(voceNastro(`Ultima produzione: ${produzione.titolo} (${produzione.anno})`, indirizzoOpera(produzione)));
  if (CORTOTECA_ATTIVA && opere.length) {
    const guardabili = opere.filter(streamingDisponibile).length;
    voci.push(voceNastro(`In Cortoteca ${opere.length} opere, ${guardabili} da guardare ora`, 'cortoteca.html'));
  }
  if (nastro.dataset.quota) voci.push(voceNastro(nastro.dataset.quota, 'vantaggi-tesseramento.html#associati'));

  nastro.querySelector('.scorre__pista').innerHTML = voci.join('');
  preparaScorre(nastro);
}

/* "Vedi tutti gli eventi" e "Vedi tutte le produzioni" portano dove porta il
   nome della sezione, con lo stesso passaggio di colore (preparaPassaggi in
   comune.js): il clic semplice passa al nome; con un tasto premuto (nuova
   scheda) il collegamento fa da sé */
function preparaTutti() {
  document.querySelectorAll('.sezione__tutti').forEach((tutti) => {
    tutti.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      tutti.closest('.sezione').querySelector('.sezione__nome a').click();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  home().catch(console.error);
  preparaTutti();
  torcia();
  preparaPassaggi();
});
