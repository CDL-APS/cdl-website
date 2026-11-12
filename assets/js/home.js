/* ==========================================================================
   HOME — riquadri "L'ultimo evento CDL" e "L'ultima produzione CDL".

   Entrambi vengono dal database (vedi dati.js): l'evento è il più recente fra
   quelli pubblicati, la produzione la più recente fra le opere prodotte da
   CDL. Quando ne arriva uno nuovo basta pubblicarlo dalla pagina di gestione.
   Se i dati non si leggono, il riquadro resta nascosto e sotto rimane il
   rimando all'elenco completo.
   ========================================================================== */

function riempiRiquadro(box, { href, immagine, titolo, riassunto }) {
  box.href = href;
  mostraImmagine(box.querySelector('.foto'), immagine);
  box.querySelector('.primo-piano-titolo').textContent = titolo;
  scriviRiassunto(box.querySelector('.primo-piano-riassunto'), riassunto);
  box.hidden = false;
}

async function ultimoEvento() {
  const box = document.getElementById('ultimo-evento');
  const [evento] = await caricaEventi();
  if (!box || !evento) return;

  riempiRiquadro(box, {
    href: paginaEvento(evento) || 'eventi.html',
    immagine: evento.copertina || evento.miniatura,
    titolo: evento.titolo,
    riassunto: evento.riassunto || evento.luogo || ''
  });
}

async function ultimaProduzione() {
  const box = document.getElementById('ultima-produzione');
  const [opera] = produzioniCdl(await caricaOpere());
  if (!box || !opera) return;

  const genere = generePrincipale(opera);
  riempiRiquadro(box, {
    href: 'opera.html?film=' + encodeURIComponent(opera.codice),
    immagine: opera.fotogramma,
    titolo: opera.titolo,
    riassunto: opera.tagline || [opera.anno, genere].filter(Boolean).join(' • ')
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ultimoEvento().catch(console.error);
  ultimaProduzione().catch(console.error);
});
