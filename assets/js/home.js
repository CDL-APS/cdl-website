/* ==========================================================================
   HOME — riquadri "L'ultimo evento CDL" e "L'ultima produzione CDL".

   Entrambi vengono dal database (vedi dati.js): l'evento è il più recente fra
   quelli pubblicati, la produzione la più recente fra le opere prodotte da
   CDL. Quando ne arriva uno nuovo basta pubblicarlo dalla pagina di gestione.
   Se i dati non si leggono, il riquadro resta nascosto e sotto rimane il
   rimando all'elenco completo.
   ========================================================================== */

/* Il riassunto va a capo solo dopo una virgola: ogni pezzo fra due virgole
   è uno span che non si spezza. Così una tagline come "Non c'eri per
   l'inizio, non ci sarai per la fine" si divide nei suoi due versi invece
   che a metà frase. Un pezzo troppo lungo per la riga va a capo comunque
   (vedi home.css). */
function scriviRiassunto(elemento, testo) {
  elemento.replaceChildren();
  testo.split(/(?<=,)\s+/).forEach((pezzo, i) => {
    if (i > 0) elemento.append(' ');
    const span = document.createElement('span');
    span.className = 'riassunto-pezzo';
    span.textContent = pezzo;
    elemento.append(span);
  });
}

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
    href: indirizzoSicuro(evento.pagina) || 'eventi.html',
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
