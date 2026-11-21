/* ==========================================================================
   HOME (index.html) — la vetrina in cima (le slide in evidenza e la sala
   con la torcia), il nastro delle ultime notizie, gli elenchi brevi
   dell'indice, il rullino che scorre e i passaggi verso le sezioni. Si
   appoggia a dati.js e comune.js.
   ========================================================================== */

/* La vetrina aspetta i dati, nascosta, al più ATTESA_VETRINA ms (vedi
   home.css): si segna subito, prima che la pagina si disegni */
const ATTESA_VETRINA = 1200;
// Quanto resta in vista ogni slide prima di passare alla dopo
const GIRO_VETRINA = 8000;
document.getElementById('vetrina')?.classList.add('in-attesa');

/* La torcia: un cerchio di luce che insegue il puntatore con un po' di
   ritardo. Senza puntatore, o dopo qualche secondo di quiete, passeggia da
   sola fra le poltrone. Quando la sala non si vede (un'altra slide della
   vetrina, o la pagina scorsa più giù) si ferma. */
function torcia() {
  const sala = document.querySelector('.hero--sala');
  if (!sala || FERMO) return;

  let x = 0.7, y = 0.42, versoX = x, versoY = y, ultimoMovimento = 0;
  let visibile = true, giro = null;
  sala.addEventListener('pointermove', (e) => {
    const r = sala.getBoundingClientRect();
    versoX = (e.clientX - r.left) / r.width;
    versoY = (e.clientY - r.top) / r.height;
    ultimoMovimento = performance.now();
  });

  const passo = (ora) => {
    if (!visibile) { giro = null; return; }
    if (ora - ultimoMovimento > 3500) {
      versoX = 0.62 + 0.26 * Math.sin(ora / 4100);
      versoY = 0.45 + 0.22 * Math.sin(ora / 2900 + 1);
    }
    x += (versoX - x) * 0.07;
    y += (versoY - y) * 0.07;
    sala.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
    sala.style.setProperty('--my', (y * 100).toFixed(2) + '%');
    giro = requestAnimationFrame(passo);
  };
  new IntersectionObserver(([voce]) => {
    visibile = voce.isIntersecting;
    if (visibile && !giro) giro = requestAnimationFrame(passo);
  }).observe(sala);
}

/* --------------------------------------------------------------------------
   La vetrina: le slide scelte nella Dashboard della gestione (tabella
   vetrina), nell'ordine di posizione. La sala è scritta nella pagina e si
   sposta al suo posto; le altre si compongono da ciò a cui portano (un
   evento, un corto, una pagina del sito), e i campi compilati in gestione
   (titolo, testo, invito, immagine, colore) prendono il posto di quelli
   ricavati. Una slide che porta a un evento o a un corto non pubblicato
   non si vede.
   -------------------------------------------------------------------------- */
const PAGINA_SICURA = /^[a-z0-9-]+\.html(#[a-z0-9-]+)?$/;

function oggi() {
  return new Date().toLocaleDateString('sv'); // AAAA-MM-GG, nel fuso del visitatore
}

// Ciò che una slide ricava da dove porta
function ricavaSlide(riga, eventi, opere) {
  if (riga.evento_id) {
    const evento = eventi.find((e) => e.id === riga.evento_id);
    if (!evento) return null;
    return {
      titolo: evento.titolo,
      testo: [evento.data_inizio && dataLunga(evento.data_inizio), (evento.luogo || '').split(',')[0].trim()].filter(Boolean).join(' · '),
      immagine: evento.copertina || evento.miniatura,
      colore: evento.colore,
      lettering: letteringEvento(evento),
      href: paginaEvento(evento) || 'eventi.html',
      invito: evento.data_inizio >= oggi() ? 'Scopri l\'evento' : 'Vai all\'evento',
    };
  }
  if (riga.opera_id) {
    const opera = opere.find((o) => o.id === riga.opera_id);
    if (!opera) return null;
    return {
      titolo: opera.titolo,
      testo: [opera.regista && 'Regia di ' + opera.regista, opera.anno].filter(Boolean).join(', '),
      immagine: opera.fotogramma,
      colore: opera.colore,
      lettering: letteringOpera(opera),
      href: indirizzoOpera(opera),
      invito: 'Apri la scheda del corto',
    };
  }
  if (!PAGINA_SICURA.test(riga.pagina || '')) return null;
  const pagina = PAGINE_SITO.find((p) => p.pagina === riga.pagina) || { nome: riga.pagina };
  return { titolo: pagina.nome, testo: '', fondo: pagina.fondo, colore: pagina.colore, testoColore: pagina.colore, href: riga.pagina, invito: 'Apri la pagina' };
}

function immagineVetrina(percorso, subito) {
  const img = document.createElement('img');
  img.className = 'vetrina__foto';
  img.alt = '';
  img.decoding = 'async';
  img.loading = subito ? 'eager' : 'lazy';
  if (/^assets\/img\/[a-z0-9\/._-]+$/i.test(percorso) && !percorso.includes('..')) img.src = percorso;
  else mostraImmagine(img, percorso);
  return img;
}

/* Vero se un colore #rrggbb è chiaro: sopra ci va una scritta scura */
function coloreChiaro(colore) {
  const n = parseInt((colore || '').slice(1), 16);
  if (!/^#[0-9a-f]{6}$/i.test(colore || '')) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 > 0.55;
}

function slideContenuto(riga, eventi, opere, prima) {
  const base = ricavaSlide(riga, eventi, opere);
  if (!base) return null;
  const d = {
    ...base,
    titolo: riga.titolo || base.titolo,
    testo: riga.testo || base.testo,
    invito: riga.invito || base.invito,
    immagine: riga.immagine || base.immagine,
    colore: riga.colore || base.colore,
    // il colore della riga di testo e del tasto: quello scelto, o per una
    // pagina senza foto quello delle scritte della sua sezione
    coloreTesto: riga.colore_testo || null,
    // il lettering caricato per la slide; senza, quello dell'evento o del
    // corto, ma solo se la slide non ha un titolo suo
    lettering: indirizzoLettering(riga.lettering) || (riga.titolo ? null : base.lettering),
  };
  const slide = document.createElement('div');
  slide.className = 'vetrina__slide vetrina__slide--contenuto hero';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.nome = d.titolo;
  if (d.fondo) slide.style.setProperty('--fondo-slide', d.fondo);
  if (d.colore) slide.style.setProperty('--colore-slide', d.colore);
  const coloreTesto = d.coloreTesto || (d.testoColore && !d.immagine ? d.testoColore : null);
  if (coloreTesto) {
    slide.style.setProperty('--testo-slide', coloreTesto);
    // il tasto ha il fondo del colore del testo: la sua scritta va in contrasto
    slide.style.setProperty('--sul-testo', coloreChiaro(coloreTesto) ? '#1d1d1b' : '#f7f7f7');
    // testo scuro su una foto: il velo diventa chiaro
    if (d.immagine && !coloreChiaro(coloreTesto)) slide.classList.add('vetrina__slide--velo-chiaro');
  }
  if (d.colore) slide.style.setProperty('--sul-colore', coloreChiaro(d.colore) ? '#1d1d1b' : '#f7f7f7');
  if (d.immagine) {
    slide.append(immagineVetrina(d.immagine, prima));
    const velo = document.createElement('div');
    velo.className = 'vetrina__velo';
    velo.setAttribute('aria-hidden', 'true');
    slide.append(velo);
  }
  const testo = document.createElement('div');
  testo.className = 'wrap vetrina__testo';
  const titolo = document.createElement('h2');
  titolo.className = 'vetrina__titolo';
  // il lettering (PNG o SVG senza fondo) al posto del titolo scritto, a
  // maschera nel colore della slide; se il file non arriva resta il titolo
  titolo.textContent = d.titolo;
  if (d.lettering) {
    // indirizzo assoluto: un url() dentro una variabile si risolverebbe
    // rispetto al foglio che la usa (components.css), non alla pagina
    const indirizzo = new URL(d.lettering, location.href).href;
    const misura = new Image();
    misura.onload = () => {
      if (!misura.naturalWidth) return;
      const marchio = document.createElement('span');
      marchio.className = 'marchio-serie vetrina__marchio';
      marchio.setAttribute('aria-hidden', 'true');
      marchio.style.setProperty('--marchio', `url("${indirizzo}")`);
      marchio.style.setProperty('--ar', (misura.naturalWidth / misura.naturalHeight).toFixed(4));
      titolo.innerHTML = `<span class="sr-only">${esc(d.titolo)}</span>`;
      titolo.append(marchio);
    };
    misura.crossOrigin = 'anonymous';
    misura.src = indirizzo;
  }
  testo.append(titolo);
  if (d.testo) {
    const riga2 = document.createElement('p');
    riga2.className = 'vetrina__riga';
    riga2.textContent = d.testo;
    testo.append(riga2);
  }
  const invito = document.createElement('a');
  invito.className = 'btn btn--pieno vetrina__invito';
  invito.href = d.href;
  invito.innerHTML = `${esc(d.invito)} ${FRECCIA}`;
  testo.append(invito);
  slide.append(testo);
  return slide;
}

/* Mette le slide nell'ordine della gestione. Se la vetrina si è già
   mostrata (i dati sono arrivati tardi), la sala resta la prima e le altre
   seguono nello stesso giro, così niente salta sotto gli occhi. */
function componiVetrina(vetrina, righe, eventi, opere, giaVisibile) {
  const pista = vetrina.querySelector('.vetrina__pista');
  const apertura = pista.querySelector('[data-apertura]');
  apertura.nome = 'CDL APS';
  // nell'ordine di posizione (le copie di riserva non arrivano ordinate)
  righe = [...righe].sort((a, b) => (a.posizione ?? 0) - (b.posizione ?? 0));
  if (!righe.some((r) => r.tipo === 'apertura')) righe = [{ tipo: 'apertura' }, ...righe];
  let slide = righe.map((riga, i) => (riga.tipo === 'apertura' ? apertura : slideContenuto(riga, eventi, opere, i === 0)))
    .filter(Boolean);
  if (giaVisibile) {
    const i = slide.indexOf(apertura);
    slide = [...slide.slice(i), ...slide.slice(0, i)];
  }
  pista.replaceChildren(...slide);
  // lo scroll-snap resterebbe agganciato alla slide di prima (la sala):
  // si riparte dalla prima
  pista.scrollLeft = 0;
}

function preparaVetrina(vetrina) {
  const pista = vetrina.querySelector('.vetrina__pista');
  const slide = [...pista.children];
  const n = slide.length;
  slide.forEach((s, i) => s.setAttribute('aria-label', n > 1 ? `${i + 1} di ${n}: ${s.nome}` : s.nome));
  if (n < 2) return;

  const comandi = vetrina.querySelector('.vetrina__comandi');
  const segni = comandi.querySelector('.vetrina__segni');
  const pausa = comandi.querySelector('.vetrina__pausa');
  vetrina.style.setProperty('--giro', GIRO_VETRINA + 'ms');
  segni.replaceChildren(...slide.map((s, i) => {
    const segno = document.createElement('button');
    segno.type = 'button';
    segno.className = 'vetrina__segno';
    segno.setAttribute('aria-label', `Slide ${i + 1}: ${s.nome}`);
    segno.innerHTML = '<span class="vetrina__segno-linea" aria-hidden="true"></span>';
    segno.addEventListener('click', () => vai(i));
    return segno;
  }));
  comandi.hidden = false;
  vetrina.classList.add('ha-comandi');

  /* Il tempo di ogni slide è la linea del suo segmento che si riempie (CSS,
     --giro): a linea piena si passa alla slide dopo. Ferma la vetrina, si
     ferma la linea. Con il movimento ridotto le animazioni non ci sono, e
     la vetrina non scorre da sola. */
  let corrente = 0;
  let ferma = false;       // pausa col tasto
  let sopra = false;       // puntatore sopra o fuoco da tastiera dentro: si aspetta
  let quiete = null;

  const aggiornaFermo = () => vetrina.classList.toggle('is-ferma', ferma || sopra || document.hidden);
  const segna = () => {
    [...segni.children].forEach((p, i) => p.setAttribute('aria-current', String(i === corrente)));
    slide.forEach((s, i) => { s.inert = i !== corrente; });
    // i comandi prendono il colore delle scritte della slide in vista
    vetrina.style.setProperty('--tinta-comandi', getComputedStyle(slide[corrente]).color);
  };
  function vai(i) {
    corrente = (i + n) % n;
    pista.scrollTo({ left: corrente * pista.clientWidth, behavior: FERMO ? 'auto' : 'smooth' });
    segna();
  }
  const impostaPausa = (si) => {
    ferma = si;
    pausa.setAttribute('aria-pressed', String(si));
    pausa.setAttribute('aria-label', si ? 'Fai scorrere le slide' : 'Ferma lo scorrimento delle slide');
    aggiornaFermo();
  };

  segni.addEventListener('animationend', (e) => {
    if (e.animationName === 'vetrina-avanza') vai(corrente + 1);
  });
  pausa.addEventListener('click', () => impostaPausa(!ferma));
  // col dito o col trackpad: la slide si legge a scorrimento finito
  pista.addEventListener('scroll', () => {
    clearTimeout(quiete);
    quiete = setTimeout(() => {
      const i = Math.round(pista.scrollLeft / pista.clientWidth);
      if (i !== corrente) { corrente = i; segna(); }
    }, 120);
  }, { passive: true });
  vetrina.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { sopra = true; aggiornaFermo(); } });
  vetrina.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { sopra = false; aggiornaFermo(); } });
  // col fuoco da tastiera si aspetta; un clic col mouse su un segmento no
  vetrina.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) { sopra = true; aggiornaFermo(); } });
  vetrina.addEventListener('focusout', (e) => {
    if (!vetrina.contains(e.relatedTarget)) { sopra = false; aggiornaFermo(); }
  });
  vetrina.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    vai(corrente + (e.key === 'ArrowLeft' ? -1 : 1));
  });
  document.addEventListener('visibilitychange', aggiornaFermo);
  // la finestra cambia larghezza: la slide corrente resta al suo posto
  window.addEventListener('resize', () => pista.scrollTo({ left: corrente * pista.clientWidth }));

  impostaPausa(false);
  segna();
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
  const vetrina = document.getElementById('vetrina');
  // se i dati tardano, la vetrina si mostra con la sola sala
  let mostrata = false;
  const mostra = () => { mostrata = true; vetrina.classList.remove('in-attesa'); };
  const scadenza = setTimeout(mostra, ATTESA_VETRINA);

  const [eventi, opere, rullino, righeVetrina] = await Promise.all([
    caricaEventi().catch(() => []), caricaOpere().catch(() => []), caricaRullino().catch(() => []),
    caricaVetrina().catch(() => [])
  ]);
  try {
    componiVetrina(vetrina, righeVetrina, eventi, opere, mostrata);
    preparaVetrina(vetrina);
  } finally {
    clearTimeout(scadenza);
    mostra();
  }
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
  if (evento) {
    const quale = evento.data_inizio >= oggi() ? 'Prossimo evento' : 'Ultimo evento';
    voci.push(voceNastro(`${quale}: ${evento.titolo}, ${dataLunga(evento.data_inizio)}`, paginaEvento(evento) || 'eventi.html'));
  }
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
