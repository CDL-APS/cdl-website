/* ==========================================================================
   HOME — caselle "L'ultimo evento CDL" e "L'ultima produzione CDL".

   Entrambe vengono dal database (vedi dati.js): l'evento è il più recente fra
   quelli pubblicati, la produzione la più recente fra le opere prodotte da
   CDL. Quando ne arriva uno nuovo basta pubblicarlo dalla pagina di gestione.
   Se i dati non si leggono, la casella resta nascosta e sotto rimane il
   rimando all'elenco completo.
   ========================================================================== */

function riempiCasella(casella, { href, immagine, titolo, meta }) {
  casella.href = href;
  mostraImmagine(casella.querySelector('.notizia-foto'), immagine);
  casella.querySelector('.notizia-titolo').textContent = titolo;
  casella.querySelector('.notizia-meta').textContent = meta;
  casella.hidden = false;
}

async function ultimoEvento() {
  const casella = document.getElementById('ultimo-evento');
  const [evento] = await caricaEventi();
  if (!casella || !evento) return;

  riempiCasella(casella, {
    href: indirizzoSicuro(evento.pagina) || 'eventi.html',
    immagine: evento.miniatura || evento.copertina,
    titolo: evento.titolo,
    meta: evento.riassunto || evento.luogo || ''
  });
}

async function ultimaProduzione() {
  const casella = document.getElementById('ultima-produzione');
  const [opera] = produzioniCdl(await caricaOpere());
  if (!casella || !opera) return;

  const genere = generePrincipale(opera);
  riempiCasella(casella, {
    href: 'opera.html?film=' + encodeURIComponent(opera.codice),
    immagine: opera.fotogramma,
    titolo: opera.titolo,
    meta: opera.anno + (genere ? ' • ' + genere : '')
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ultimoEvento().catch(console.error);
  ultimaProduzione().catch(console.error);
});
