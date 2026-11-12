/* ==========================================================================
   CONTATTI (contatti.html) — il modulo, inviato con Netlify Forms.
   Il motivo scelto decide il modulo Netlify (e quindi l'indirizzo che
   riceve la mail: contatti → ciao@, contatti-eventi → eventi@,
   contatti-produzione → produzione@cdlaps.com) e l'oggetto della mail:
   "[Sito CDL] <oggetto> – <nome>". Motivi, moduli e oggetti stanno
   nell'HTML (data-modulo, data-oggetto). ?motivo=socio sceglie già il
   motivo. Dopo l'invio Netlify riapre la pagina su #grazie.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const modulo = document.querySelector('form.modulo');
  if (!modulo) return;
  const invia = modulo.querySelector('button[type="submit"]');
  const testoInvia = invia.innerHTML;

  const motivo = new URLSearchParams(location.search).get('motivo');
  const scelta = motivo && /^[a-z-]+$/.test(motivo) && document.getElementById('motivo-' + motivo);
  if (scelta) scelta.checked = true;

  const aggiornaInvio = () => {
    const scelto = modulo.querySelector('input[name="motivo"]:checked');
    const nome = modulo.elements.nome.value.trim();
    modulo.elements['form-name'].value = scelto?.dataset.modulo || 'contatti';
    modulo.elements.subject.value = `[Sito CDL] ${scelto?.dataset.oggetto || 'Messaggio dal sito'}${nome ? ' – ' + nome : ''}`;
  };
  modulo.addEventListener('change', aggiornaInvio);
  modulo.addEventListener('input', aggiornaInvio);
  aggiornaInvio();

  // All'invio il tasto resta arancio e dice che il messaggio parte
  modulo.addEventListener('submit', () => {
    aggiornaInvio();
    invia.classList.add('is-inviato');
    invia.textContent = 'Invio in corso…';
  });
  // Tornando indietro alla pagina il tasto torna com'era
  window.addEventListener('pageshow', () => {
    invia.classList.remove('is-inviato');
    invia.innerHTML = testoInvia;
  });
});
