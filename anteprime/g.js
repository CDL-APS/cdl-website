/* ANTEPRIMA G — E e F messe insieme. Home: la torcia sulla sala (da F), il
   nastro di notizie e le note dell'indice (da E), il rullino che scorre.
   Cortoteca: la lista con la scheda a fianco e la galleria che mette a fuoco
   un fotogramma alla volta (da F). Si appoggia a comune.js e ai dati veri
   (assets/js/dati.js).
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

function voceNastro(testo, href) {
  return `<span class="nastro__voce"><a href="${esc(href)}">${esc(testo)}</a><span class="logo" aria-hidden="true"></span></span>`;
}

/* L'elenco breve sotto un nome dell'indice: titolo e, più piccolo, quando */
function elencoBreve(id, voci) {
  const elenco = document.getElementById('elenco-' + id);
  elenco.innerHTML = voci.map((v, i) =>
    `<li style="--i:${i}"><a href="${esc(v.href)}"><span>${esc(v.titolo)}</span><small>${esc(v.quando)}</small></a></li>`).join('');
}

function meseAnno(giorno) {
  return new Date(giorno + 'T12:00:00').toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }).replace('.', '');
}

/* Home: i due elenchi dell'indice (gli ultimi eventi, le ultime produzioni)
   e il nastro delle notizie */
async function home() {
  const [eventi, opere] = await Promise.all([caricaEventi().catch(() => []), caricaOpere().catch(() => [])]);
  const [evento] = eventi;
  const produzioni = produzioniCdl(opere);
  const [produzione] = produzioni;
  const guardabili = daGuardare(opere).length;

  elencoBreve('eventi', eventi.slice(0, 4).map((e) => ({
    titolo: e.titolo, quando: meseAnno(e.data_inizio), href: indirizzoSicuro(e.pagina) || 'eventi.html',
  })));
  elencoBreve('produzioni', produzioni.slice(0, 4).map((o) => ({
    titolo: o.titolo, quando: String(o.anno), href: indirizzoOpera(o),
  })));

  const voci = [];
  if (evento) voci.push(voceNastro(`Ultimo evento: ${evento.titolo}, ${dataLunga(evento.data_inizio)}`, indirizzoSicuro(evento.pagina) || 'eventi.html'));
  if (produzione) voci.push(voceNastro(`Ultima produzione: ${produzione.titolo} (${produzione.anno})`, indirizzoOpera(produzione)));
  if (opere.length) voci.push(voceNastro(`In Cortoteca ${opere.length} opere, ${guardabili} da guardare ora`, 'anteprime/g-cortoteca.html'));
  voci.push(voceNastro('Quota associativa ridotta per gli ultimi mesi del 2026', 'anteprime/g-home.html#socio'));

  const nastro = document.getElementById('nastro');
  nastro.querySelector('.scorre__pista').innerHTML = voci.join('');
  preparaScorre(nastro);
}

/* Durata in minuti, se l'opera ce l'ha (la colonna non c'è ancora nel
   database: finché manca la riga ne fa a meno) */
function durata(opera) {
  const minuti = Number(opera.durata);
  return minuti > 0 ? `${minuti} min` : '';
}

/* Cortoteca, vista a lista: l'indice dei titoli e, a fianco, il fotogramma
   dell'opera su cui ci si trova, fermo sotto la barra mentre la lista scorre
   (vedi g.css). Sotto ogni titolo: regista, genere, durata, anno. */
function listaConPalco(scelte, contenitore) {
  contenitore.innerHTML = '<div class="grid"><ol class="righe span-5"></ol><div class="palco span-7 start-6"></div></div>';
  const elenco = contenitore.querySelector('.righe');
  const palco = contenitore.querySelector('.palco');

  const attiva = (i) => {
    const o = scelte[i];
    const guardabile = streamingDisponibile(o);
    elenco.querySelectorAll('.riga').forEach((r, n) => r.classList.toggle('is-attiva', n === i));
    palco.innerHTML = `
      <a class="cornice palco__schermo" href="${esc(indirizzoOpera(o))}" tabindex="-1" aria-hidden="true"></a>
      <a class="palco__azione" href="${esc(indirizzoOpera(o))}">
        ${guardabile ? PLAY + 'Guarda' : 'Informazioni' + FRECCIA_SU}
        <span class="sr-only">: ${esc(o.titolo)}</span>
      </a>`;
    palco.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
  };

  scelte.forEach((o, i) => {
    const guardabile = streamingDisponibile(o);
    const dati = [o.regista, generePrincipale(o), durata(o), o.anno].filter(Boolean).join(' · ');
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="riga" href="${esc(indirizzoOpera(o))}">
        <span class="riga__mini"></span>
        ${guardabile ? PLAY.replace('<svg', '<svg class="riga__play"') : '<span class="riga__play"></span>'}
        <span class="riga__titolo">${esc(o.titolo)}</span>
        <span class="riga__dati">${esc(dati)}</span>
      </a>`;
    const riga = li.firstElementChild;
    riga.querySelector('.riga__mini').append(nuovaImmagine(o.fotogramma));
    riga.addEventListener('pointerenter', () => attiva(i));
    riga.addEventListener('focus', () => attiva(i));
    elenco.append(li);
  });
  attiva(0);
}

/* Cortoteca, vista a galleria: il fotogramma su cui ci si trova resta
   acceso, gli altri arretrano. Al centro del fotogramma compaiono, piano,
   solo titolo, regista e anno. */
function galleriaAFuoco(scelte, contenitore) {
  const griglia = disegnaGalleria(scelte, contenitore);
  griglia.querySelectorAll('.still').forEach((still) => {
    const o = still.opera;
    still.querySelector('.targa').innerHTML = `
      <span class="targa__titolo">${esc(o.titolo)}</span>
      <span class="targa__dati">${esc(o.regista)} · ${esc(o.anno)}</span>`;
  });
  const riposo = () => {
    griglia.classList.remove('ha-fuoco');
    griglia.querySelectorAll('.is-fuoco').forEach((s) => s.classList.remove('is-fuoco'));
  };
  griglia.querySelectorAll('.still').forEach((still) => {
    const accendi = () => {
      griglia.classList.add('ha-fuoco');
      griglia.querySelectorAll('.still').forEach((s) => s.classList.toggle('is-fuoco', s === still));
    };
    still.addEventListener('pointerenter', accendi);
    still.addEventListener('focus', accendi);
  });
  griglia.addEventListener('pointerleave', riposo);
  griglia.addEventListener('focusout', (e) => { if (!griglia.contains(e.relatedTarget)) riposo(); });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('opere')) avviaCortoteca({ lista: listaConPalco, galleria: galleriaAFuoco });
  if (document.getElementById('nastro')) {
    home().catch(console.error);
    torcia();
    preparaScorre(document.getElementById('sale'));
  }
});
