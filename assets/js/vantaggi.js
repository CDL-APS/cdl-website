/* ==========================================================================
   VANTAGGI PER I SOCI — menu a comparsa del pulsante "Diventa socio".
   ========================================================================== */

lucide.createIcons();

const socioToggle = document.getElementById('socio-toggle');
const socioMenu = document.getElementById('socio-menu');

socioToggle.addEventListener('click', (e) => {
  // Ferma la propagazione, altrimenti il gestore sul document qui sotto
  // richiuderebbe il menu nello stesso istante in cui si apre
  e.stopPropagation();
  socioMenu.classList.toggle('active');
});

// Clic fuori dal menu: si chiude
document.addEventListener('click', (e) => {
  if (!socioMenu.contains(e.target) && e.target !== socioToggle) {
    socioMenu.classList.remove('active');
  }
});
