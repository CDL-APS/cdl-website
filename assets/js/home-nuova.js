/* ==========================================================================
   NUOVA HOME — indicatore dello slider di navigazione.

   Le tre voci di sinistra (logo, Produzioni, Eventi) sono le pagine del sito
   nuovo: l'indicatore lavanda sta sotto quella in cui ci si trova — la marca
   l'HTML con la classe is-active — e scorre sulla voce sfiorata dal mouse,
   per poi tornare al suo posto. Cortoteca è fuori dal gruppo: è il format di
   piattaforma, non una pagina come le altre.

   Lo stesso file serve home-nuova.html, produzioni.html ed eventi.html.
   ========================================================================== */

(function () {
  const barra = document.querySelector('.barra');
  if (!barra) return;

  const gruppo = barra.querySelector('.barra-gruppo');
  const indicatore = barra.querySelector('.indicatore');
  const voci = Array.from(gruppo.querySelectorAll('.voce'));
  if (!indicatore || !voci.length) return;

  const corrente = gruppo.querySelector('.voce.is-active') || voci[0];

  // Misure prese dai rettangoli e non da offsetWidth/offsetLeft: quelli
  // arrotondano all'intero e l'indicatore resterebbe sfalsato di un pixel.
  //
  // La bolla non compare sulla voce del logo: la home è il posto in cui si è
  // già, e segnarla con una pastiglia non aggiunge nulla.
  function sposta(voce) {
    if (!voce) return;

    if (voce.classList.contains('voce--logo')) {
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
