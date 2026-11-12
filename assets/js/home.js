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

function meseAnno(giorno) {
  return new Date(giorno + 'T12:00:00').toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }).replace('.', '');
}

/* I due elenchi dell'indice (gli ultimi eventi, le ultime produzioni) e il
   nastro delle notizie. La quota ridotta è scritta una volta sola,
   nell'HTML (data-quota sul nastro). */
async function home() {
  const [eventi, opere] = await Promise.all([caricaEventi().catch(() => []), caricaOpere().catch(() => [])]);
  const [evento] = eventi;
  const produzioni = produzioniCdl(opere);
  const [produzione] = produzioni;
  const guardabili = opere.filter(streamingDisponibile).length;

  elencoBreve('eventi', eventi.slice(0, 4).map((e) => ({
    titolo: e.titolo, quando: meseAnno(e.data_inizio), href: paginaEvento(e) || 'eventi.html',
  })));
  elencoBreve('produzioni', produzioni.slice(0, 4).map((o) => ({
    titolo: o.titolo, quando: String(o.anno), href: indirizzoOpera(o),
  })));

  const nastro = document.getElementById('nastro');
  const voci = [];
  if (evento) voci.push(voceNastro(`Ultimo evento: ${evento.titolo}, ${dataLunga(evento.data_inizio)}`, paginaEvento(evento) || 'eventi.html'));
  if (produzione) voci.push(voceNastro(`Ultima produzione: ${produzione.titolo} (${produzione.anno})`, indirizzoOpera(produzione)));
  if (opere.length) voci.push(voceNastro(`In Cortoteca ${opere.length} opere, ${guardabili} da guardare ora`, 'cortoteca.html'));
  if (nastro.dataset.quota) voci.push(voceNastro(nastro.dataset.quota, 'contatti.html'));

  nastro.querySelector('.scorre__pista').innerHTML = voci.join('');
  preparaScorre(nastro);
}

document.addEventListener('DOMContentLoaded', () => {
  home().catch(console.error);
  torcia();
  preparaScorre(document.getElementById('sale'));
  preparaPassaggi();
});
