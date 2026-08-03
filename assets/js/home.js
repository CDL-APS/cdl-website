/* ==========================================================================
   HOME — nuvoletta del pensiero.

   Cliccando sull'icona CDL compare per due secondi una nuvoletta scelta a
   caso, in una posizione casuale nel quadrante in alto a destra. Il flag
   isCloudActive impedisce che clic ravvicinati facciano accavallare più
   nuvolette o azzerino il timer a metà animazione.
   ========================================================================== */

lucide.createIcons();

const NUVOLE = [
  'assets/img/nuvole/nuvola1.png',
  'assets/img/nuvole/nuvola2.png',
  'assets/img/nuvole/nuvola3.png',
  'assets/img/nuvole/nuvola4.png',
  'assets/img/nuvole/nuvola5.png'
];

const DURATA_VISIBILE = 2000; // ms in cui la nuvoletta resta a schermo
const DURATA_USCITA = 600; // ms dell'animazione di scomparsa

let domandaTimeout;
let lastImageIndex = -1;
let isCloudActive = false;

function nascondiNuvola(img) {
  img.classList.remove('active');
  setTimeout(() => {
    img.style.display = 'none';
    isCloudActive = false;
  }, DURATA_USCITA);
}

function toggleCredits(event) {
  event.stopPropagation();
  const img = document.getElementById('domanda-image');

  if (isCloudActive) return;
  if (domandaTimeout) clearTimeout(domandaTimeout);

  isCloudActive = true;

  // Estrae un indice diverso dall'ultimo, così non esce mai due volte di fila
  // la stessa nuvoletta
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * NUVOLE.length);
  } while (randomIndex === lastImageIndex);

  lastImageIndex = randomIndex;
  img.src = NUVOLE[randomIndex];

  const randomTop = Math.floor(Math.random() * 31) + 5; // 5%–35%
  const randomLeft = Math.floor(Math.random() * 26) + 60; // 60%–85%

  img.style.top = randomTop + '%';
  img.style.left = randomLeft + '%';

  img.onload = function () {
    img.style.display = 'block';
    img.classList.add('active');
  };

  img.onerror = function () {
    console.error('Impossibile caricare: ' + img.src);
    isCloudActive = false;
  };

  domandaTimeout = setTimeout(() => nascondiNuvola(img), DURATA_VISIBILE);
}

// Un clic in qualsiasi punto della pagina chiude la nuvoletta in anticipo
document.addEventListener('click', () => {
  const img = document.getElementById('domanda-image');
  if (img && img.classList.contains('active')) {
    if (domandaTimeout) clearTimeout(domandaTimeout);
    nascondiNuvola(img);
  }
});
