/* ==========================================================================
   PRODUZIONI — i lavori di CDL, divisi in blocchi.

   Come la Cortoteca, la pagina non contiene le opere nell'HTML: le prende
   dal database (vedi dati.js). Il lavoro più recente sta in primo piano, a
   tutta larghezza; sotto, le produzioni originali (produzione_cdl) e le
   collaborazioni (collaborazione_cdl), ciascuna dalla più recente. Un blocco
   senza opere resta nascosto: le collaborazioni compaiono con la prima.
   ========================================================================== */

const ICONA_FRECCIA_OPERA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';

function indirizzoOpera(opera) {
  return 'opera.html?film=' + encodeURIComponent(opera.codice);
}

/* Riquadro di un'opera: fotogramma a piena superficie e lastra con anno,
   titolo e regia. Per le collaborazioni anche chi l'ha prodotta. */
function riquadroOpera(opera) {
  const riquadro = document.createElement('a');
  riquadro.className = 'riquadro';
  riquadro.href = indirizzoOpera(opera);

  const produzione = opera.collaborazione_cdl && opera.produzione
    ? `<br>Produzione: ${esc(opera.produzione)}`
    : '';
  riquadro.innerHTML = `
    <img class="foto" alt="" loading="lazy">
    <span class="freccia" aria-hidden="true">${ICONA_FRECCIA_OPERA}</span>
    <div class="chip">
      <p class="chip-etichetta">${esc(opera.anno)}</p>
      <h3 class="chip-titolo">${esc(opera.titolo)}</h3>
      <p class="chip-meta">Regia di ${esc(opera.regista)}${produzione}</p>
    </div>
  `;
  mostraImmagine(riquadro.querySelector('.foto'), opera.fotogramma);
  return riquadro;
}

/* Mette le opere nella griglia del blocco; senza opere resta nascosto */
function riempiBlocco(id, opere) {
  const blocco = document.getElementById(id);
  const griglia = blocco.querySelector('.griglia-riquadri');
  opere.forEach((opera) => griglia.appendChild(riquadroOpera(opera)));
  blocco.hidden = opere.length === 0;
}

/* Il lavoro più recente in primo piano: fotogramma a sinistra, a destra
   titolo, tagline e i dati essenziali */
function riempiPrimoPiano(opera) {
  if (!opera) return;
  const box = document.getElementById('primo-piano');
  box.href = indirizzoOpera(opera);

  const tipo = opera.collaborazione_cdl ? 'Ultima collaborazione' : 'Ultima produzione';
  box.querySelector('.primo-piano-etichetta').textContent = tipo + ' · ' + opera.anno;
  box.querySelector('.primo-piano-titolo').textContent = opera.titolo;
  box.querySelector('.primo-piano-riassunto').textContent = opera.tagline || opera.sinossi || '';

  const dati = [
    ['Regia', opera.regista],
    ['Genere', generePrincipale(opera)],
    ['Produzione', opera.collaborazione_cdl ? opera.produzione : null]
  ].filter(([, valore]) => valore);
  box.querySelector('.primo-piano-dati').innerHTML = dati
    .map(([voce, valore]) => `<div><dt>${voce}</dt><dd>${esc(valore)}</dd></div>`)
    .join('');

  mostraImmagine(box.querySelector('.foto'), opera.fotogramma);
  box.hidden = false;
}

async function initProduzioni() {
  try {
    const opere = await caricaOpere();
    const produzioni = produzioniCdl(opere);
    const collaborazioni = collaborazioniCdl(opere);
    const [primoPiano] = [...produzioni, ...collaborazioni].sort(dallaPiuRecente);
    const tranne = (o) => o !== primoPiano;

    riempiPrimoPiano(primoPiano);
    riempiBlocco('blocco-produzioni', produzioni.filter(tranne));
    riempiBlocco('blocco-collaborazioni', collaborazioni.filter(tranne));
    if (!primoPiano) mostraAvviso('Nessuna produzione da mostrare');
  } catch (error) {
    console.error(error);
    mostraAvviso('Errore caricamento database');
  }
}

function mostraAvviso(testo) {
  const avviso = document.getElementById('avviso-produzioni');
  avviso.textContent = testo;
  avviso.hidden = false;
}

document.addEventListener('DOMContentLoaded', initProduzioni);
