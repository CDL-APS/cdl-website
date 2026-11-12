/* ==========================================================================
   CONTATTI (contatti.html) — il modulo, inviato con Netlify Forms.
   Il motivo scelto decide il modulo Netlify (e quindi l'indirizzo che
   riceve la mail: contatti → ciao@, contatti-eventi → eventi@,
   contatti-produzione → produzione@cdlaps.com) e l'oggetto della mail:
   "[Sito CDL] <oggetto> – <nome>". Motivi, moduli e oggetti stanno
   nell'HTML (data-modulo, data-oggetto). ?motivo=socio sceglie già il
   motivo. Dopo l'invio Netlify riapre la pagina su #grazie.
   ========================================================================== */

/* "Scrivici" alto quanto la frase a fianco: le maiuscole del titolo vanno
   dalla cima delle maiuscole della prima riga della frase alla linea di base
   dell'ultima. Servono le misure di Montserrat (in em): ascendente,
   discendente e altezza delle maiuscole. Il titolo è largo quanto gli serve
   e la frase prende il resto, quindi un titolo più grande può mandare la
   frase a capo una volta di più: si cerca il numero di righe in cui i due
   coincidono. Se il titolo prenderebbe più di metà della riga, titolo e
   frase vanno uno sotto l'altro col corpo del CSS, come sul telefono. */
const MONTSERRAT = { ascendente: 0.968, discendente: 0.251, maiuscole: 0.7 };

function misuraTitolo() {
  const testa = document.querySelector('.contatti__testa');
  const titolo = testa?.querySelector('h1');
  const frase = testa?.querySelector('.contatti__frase');
  if (!titolo || !frase) return;
  titolo.style.fontSize = '';
  titolo.style.marginTop = '';
  testa.classList.remove('contatti__testa--impilata');
  if (getComputedStyle(testa).gridTemplateColumns.trim().split(/\s+/).length < 2) return;

  const { ascendente, discendente, maiuscole } = MONTSERRAT;
  // dalla cima della riga alla cima delle maiuscole e alla linea di base
  const cima = (corpo, riga) => (riga - (ascendente + discendente) * corpo) / 2 + (ascendente - maiuscole) * corpo;
  const base = (corpo, riga) => cima(corpo, riga) + maiuscole * corpo;

  const stile = getComputedStyle(frase);
  const corpo = parseFloat(stile.fontSize);
  const riga = parseFloat(stile.lineHeight);
  if (!corpo || !riga) return;
  const cimaFrase = cima(corpo, riga);
  const contaRighe = () => Math.max(1, Math.round(frase.getBoundingClientRect().height / riga));
  // il corpo del titolo per una frase di n righe
  const corpoPer = (n) => ((n - 1) * riga + base(corpo, riga) - cimaFrase) / maiuscole;

  let righe = contaRighe();
  for (let giro = 0; giro < 8; giro++) {
    titolo.style.fontSize = corpoPer(righe).toFixed(2) + 'px';
    if (titolo.getBoundingClientRect().width > testa.clientWidth / 2) break;
    const ora = contaRighe();
    if (ora === righe) {
      const corpoTitolo = corpoPer(righe);
      const rigaTitolo = parseFloat(getComputedStyle(titolo).lineHeight);
      titolo.style.marginTop = (cimaFrase - cima(corpoTitolo, rigaTitolo)).toFixed(2) + 'px';
      return;
    }
    righe = ora;
  }
  titolo.style.fontSize = '';
  testa.classList.add('contatti__testa--impilata');
}

document.addEventListener('DOMContentLoaded', () => {
  misuraTitolo();
  document.fonts?.ready.then(misuraTitolo);
  let attesa;
  window.addEventListener('resize', () => {
    clearTimeout(attesa);
    attesa = setTimeout(misuraTitolo, 100);
  });
});

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
