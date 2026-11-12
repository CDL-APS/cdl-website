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
    return opera ? indirizzoOpera(opera) : 'cortoteca.html';
  }
  return paginaEvento({ pagina: foto.pagina });
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
    return cornice;
  }));
  blocco.hidden = !rullino.length;
  preparaScorre(blocco);
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
  const guardabili = opere.filter(streamingDisponibile).length;

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
  if (opere.length) voci.push(voceNastro(`In Cortoteca ${opere.length} opere, ${guardabili} da guardare ora`, 'cortoteca.html'));
  if (nastro.dataset.quota) voci.push(voceNastro(nastro.dataset.quota, 'contatti.html#socio'));

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
