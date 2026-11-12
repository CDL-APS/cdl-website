/* ==========================================================================
   PRODUZIONI (produzioni.html) — in evidenza il lavoro più recente fra
   produzioni e collaborazioni (anno, poi id più alto), poi i due blocchi.
   Il blocco delle collaborazioni resta nascosto finché è vuoto. Si appoggia
   a dati.js e comune.js.
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
  const grafica = titoloGrafico(primo);
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
}

document.addEventListener('DOMContentLoaded', paginaProduzioni);
