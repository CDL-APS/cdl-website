/* ==========================================================================
   BARRA — indicatore della barra di navigazione, comune a tutte le pagine.

   Le voci del gruppo (Produzioni, Eventi, Cortoteca) sono le pagine del sito:
   il filetto sta sotto quella in cui ci si trova — la marca l'HTML con la
   classe is-active — e scorre sulla voce sfiorata dal mouse, per poi tornare
   al suo posto.

   Le pagine che non appartengono a nessuna voce (home, vantaggi soci) non
   marcano nulla: lì il filetto compare solo al passaggio del mouse.
   ========================================================================== */

(function () {
  const barra = document.querySelector('.barra');
  if (!barra) return;

  const gruppo = barra.querySelector('.barra-gruppo');
  const indicatore = barra.querySelector('.indicatore');
  const voci = Array.from(gruppo.querySelectorAll('.voce'));
  if (!indicatore || !voci.length) return;

  const corrente = gruppo.querySelector('.voce.is-active');

  // Misure prese dai rettangoli e non da offsetWidth/offsetLeft: quelli
  // arrotondano all'intero e l'indicatore resterebbe sfalsato di un pixel.
  // Senza voce (pagina fuori dal gruppo) il filetto si spegne.
  function sposta(voce) {
    if (!voce) {
      indicatore.classList.remove('indicatore--visibile');
      return;
    }

    const riferimento = gruppo.getBoundingClientRect();
    const r = voce.getBoundingClientRect();
    indicatore.style.width = r.width + 'px';
    indicatore.style.transform = 'translateX(' + (r.left - riferimento.left) + 'px)';
    indicatore.classList.add('indicatore--visibile');
  }

  voci.forEach((voce) => {
    voce.addEventListener('mouseenter', () => sposta(voce));
    voce.addEventListener('focus', () => sposta(voce));
  });

  // Uscendo dal gruppo l'indicatore torna sulla pagina in cui siamo
  gruppo.addEventListener('mouseleave', () => sposta(corrente));
  gruppo.addEventListener('focusout', () => sposta(corrente));

  // Le voci cambiano larghezza per più motivi: ridimensionamento, arrivo dei
  // font, immagine del logo. L'osservatore sul gruppo li copre tutti, ma le
  // sue notifiche viaggiano col disegno della pagina e non arrivano se questa
  // apre in una scheda di sfondo: senza le due ancore qui sotto l'indicatore
  // resterebbe con la misura sbagliata del primo istante.
  if (window.ResizeObserver) {
    new ResizeObserver(() => sposta(corrente)).observe(gruppo);
  }
  window.addEventListener('resize', () => sposta(corrente));
  window.addEventListener('load', () => sposta(corrente));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => sposta(corrente));
  }

  // Se la pagina è aperta in una scheda di sfondo, il browser rimanda gli
  // eventi di disegno: al ritorno in primo piano la misura va rifatta.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) sposta(corrente);
  });

  // Ultima rete di sicurezza: prima di qualunque interazione con la barra
  // l'indicatore si rimisura comunque.
  barra.addEventListener('pointerenter', () => sposta(corrente));

  // Primo posizionamento senza animazione, così all'apertura l'indicatore è
  // già al suo posto invece di allargarsi da zero sotto gli occhi.
  // Un timer e non requestAnimationFrame: quest'ultimo non scatta se la
  // pagina apre in una scheda di sfondo.
  sposta(corrente);
  setTimeout(() => indicatore.classList.add('indicatore--pronto'), 50);
})();
