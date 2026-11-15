/* ==========================================================================
   PRODUZIONI (produzioni.html) — in "Prossimamente" il lavoro più recente
   fra produzioni e collaborazioni (anno, poi id più alto), poi i due
   blocchi. Il blocco delle collaborazioni resta nascosto finché è
   vuoto. Al clic su un corto il fotogramma vola al posto della copertina
   nella sua scheda (passaggioScheda). Si appoggia a dati.js e comune.js.
   ========================================================================== */

async function paginaProduzioni() {
  const avviso = (testo) => {
    const el = document.getElementById('avviso-produzioni');
    el.textContent = testo;
    el.hidden = false;
  };
  let opere;
  try {
    opere = await caricaOpere();
  } catch (errore) {
    console.error(errore);
    avviso('Le produzioni non si riescono a caricare. Riprova fra poco.');
    return;
  }
  const produzioni = produzioniCdl(opere);
  const collaborazioni = collaborazioniCdl(opere);
  const [primo] = [...produzioni, ...collaborazioni].sort(dallaPiuRecente);
  if (!primo) { avviso('Nessuna produzione da mostrare.'); return; }

  const box = document.getElementById('primo-piano');
  const href = indirizzoOpera(primo);
  box.querySelector('.cornice').href = href;
  box.querySelector('.cornice').append(nuovaImmagine(primo.fotogramma));
  // Il titolo grafico, se c'è (produzioni.css lo ricolora in nero); se no il testo
  const titolo = box.querySelector('.primo-piano__titolo');
  const grafica = titoloGrafico(primo, { colora: false });
  if (grafica) titolo.replaceChildren(grafica);
  else titolo.textContent = primo.titolo;
  // La frase va a capo dopo la prima virgola: "Non c'eri per l'inizio, / non ci sarai per la fine"
  box.querySelector('.primo-piano__frase').innerHTML = esc(primo.tagline || '').replace(/,\s*/, ',<br>');
  // I dati su righe distinte: regista / genere / anno, durata
  box.querySelector('.primo-piano__dati').innerHTML = [
    primo.regista,
    generePrincipale(primo),
    [primo.anno, durata(primo)].filter(Boolean).join(', '),
  ].filter(Boolean).map((r) => `<span>${esc(r)}</span>`).join('');
  const azione = box.querySelector('.primo-piano__azione');
  azione.href = href;
  azione.innerHTML = streamingDisponibile(primo) ? PLAY + 'Guarda' : 'Scheda' + FRECCIA_SU;
  box.hidden = false;

  const scheda = (o) => ({
    titolo: o.titolo,
    dati: [o.regista, o.anno, o.collaborazione_cdl && o.produzione ? 'con ' + o.produzione : ''].filter(Boolean).join(' · '),
    immagine: o.fotogramma,
    href: indirizzoOpera(o),
  });
  const tranne = (o) => o !== primo;
  riempiSchede('blocco-produzioni', produzioni.filter(tranne).map(scheda));
  riempiSchede('blocco-collaborazioni', collaborazioni.filter(tranne).map(scheda));

  // Il passaggio verso la scheda: dal fotogramma grande (anche dal suo
  // pulsante) e da ogni scheda
  const voli = [[box.querySelector('.cornice'), box.querySelector('.cornice')], [azione, box.querySelector('.cornice')]];
  document.querySelectorAll('#blocco-produzioni a.scheda-g, #blocco-collaborazioni a.scheda-g')
    .forEach((a) => voli.push([a, a.querySelector('.cornice')]));
  voli.forEach(([link, cornice]) => link.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || FERMO) return;
    const img = cornice.querySelector('img');
    if (!img) return;
    e.preventDefault();
    passaggioScheda(img, link.href);
  }));
}

/* ---- Il passaggio verso la scheda del corto ----
   Il fotogramma cliccato si stacca dalla pagina, si sposta e si ridimensiona
   fino al posto e alla misura della copertina nella scheda del corto
   (opera.html: tutta la larghezza del contenuto, in 16:9, sotto la barra,
   con gli angoli dello schermo), mentre il lilla si fa nero come la
   Cortoteca. Poi si cambia pagina: la copertina è già lì. */
function passaggioScheda(img, href) {
  const r = img.getBoundingClientRect();
  const wrap = document.querySelector('main .wrap').getBoundingClientRect();
  const arrivo = document.querySelector('.nav').offsetHeight + (innerWidth <= 639 ? 24 : 40);
  const volo = { duration: DURATA_PASSAGGIO, easing: CURVA_PASSAGGIO, fill: 'forwards' };

  const velo = document.createElement('div');
  velo.className = 'passaggio';
  velo.style.background = getComputedStyle(document.documentElement).getPropertyValue('--nero-sala').trim() || '#000';
  document.body.append(velo);
  velo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATA_PASSAGGIO * 0.7, easing: 'ease-out', fill: 'forwards' });

  const copia = document.createElement('span');
  copia.className = 'cornice passaggio-corto';
  copia.setAttribute('aria-hidden', 'true');
  const foto = img.cloneNode();
  foto.removeAttribute('loading');
  copia.append(foto);
  document.body.append(copia);

  let partito = false;
  const vai = () => { if (!partito) { partito = true; location.href = href; } };
  setTimeout(vai, DURATA_PASSAGGIO + 200);
  // La scheda d'arrivo sa che la copertina è arrivata in volo (vedi opera.js)
  try { sessionStorage.setItem('cdl-passaggio-scheda', new URL(href, location.href).search); } catch (errore) { /* si arriva lo stesso */ }
  copia.animate([
    { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: '0px' },
    { left: wrap.left + 'px', top: arrivo + 'px', width: wrap.width + 'px', height: (wrap.width * 9 / 16) + 'px', borderRadius: '14px' },
  ], volo).finished.then(vai);
}

document.addEventListener('DOMContentLoaded', paginaProduzioni);
