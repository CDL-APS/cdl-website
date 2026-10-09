/* ==========================================================================
   HOME — casella "L'ultima produzione CDL".

   La produzione mostrata è la più recente fra quelle con "cdl": true in
   data/film.json (vedi produzioniCdl in opere.js): quando ne arriva una
   nuova basta aggiungerla al JSON. Se il file non si legge, la casella resta
   nascosta e sotto rimane il rimando a tutte le produzioni.
   ========================================================================== */

async function initHome() {
  const casella = document.getElementById('ultima-produzione');
  if (!casella) return;

  try {
    const [ultima] = produzioniCdl(await caricaOpere());
    if (!ultima) return;

    casella.href = 'opera.html?film=' + ultima.codice;
    casella.querySelector('.notizia-foto').src = ultima.still || '';
    casella.querySelector('.notizia-titolo').textContent = ultima.titolo;
    const genere = generePrincipale(ultima);
    casella.querySelector('.notizia-meta').innerHTML = ultima.anno + (genere ? ' &bull; ' + genere : '');
    casella.hidden = false;
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', initHome);
