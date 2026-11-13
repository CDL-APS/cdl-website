/* ==========================================================================
   LA PAGINA DEL CORTO — la riempie mostraCorto(), usata da opera.html e
   dalla sala della Cortoteca (lo stesso modello HTML, in una <template>).
   In alto lo schermo: il fotogramma col titolo grafico; se il corto è in
   streaming lo schermo è anche il lettore. Sotto frase, sinossi, dati, note
   di regia e crediti. Si appoggia a dati.js e comune.js.
   ========================================================================== */

/* I crediti, nell'ordine in cui compaiono. Regia e produzione stanno già
   nei dati accanto alla sinossi. La chiave è la colonna di opere; i ruoli
   vuoti si saltano. Poi vengono i ruoli senza colonna (altri_ruoli), nel
   loro ordine, e il cast. */
const CREDITI = [
  ['Produttore', 'produttore'],
  ['Fotografia', 'fotografia'],
  ['Sceneggiatura', 'sceneggiatura'],
  ['Montaggio', 'montaggio'],
  ['Trucco', 'trucco'],
  ['Costumi', 'costumi'],
  ['Scenografia', 'scenografia'],
  ['Colonna sonora', 'colonna_sonora'],
  ['Suono', 'suono'],
];

function pieno(valore) {
  return valore !== null && valore !== undefined && String(valore).trim() !== '';
}

// Il colore più usato nei tracciati dell'SVG del titolo (solo per le copie
// locali di TITOLI_GRAFICI: per gli altri corti c'è la colonna colore)
async function coloreTitolo(codice) {
  const testo = await fetch(`assets/img/film/titoli/${encodeURIComponent(codice)}.svg`).then((r) => r.text());
  const conta = {};
  (testo.match(/fill="(#[0-9a-fA-F]{6})"/g) || []).forEach((f) => {
    const c = f.slice(6, 13).toLowerCase();
    conta[c] = (conta[c] || 0) + 1;
  });
  return Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0] || null;
}

// Luminosità percepita di un colore #rrggbb, da 0 (nero) a 1 (bianco)
function luminosita(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Contrasto WCAG fra un colore #rrggbb e il nero del sito (#1d1d1b)
function contrastoColNero(hex) {
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = (h) => {
    const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  return (lum(hex) + 0.05) / (lum('#1d1d1b') + 0.05);
}

/* Il colore della pagina del corto (--titolo, sulla radice della pagina o
   della sala): la colonna colore scelta in gestione; se manca, il colore
   del titolo grafico locale; se manca anche quello, il colore della Cortoteca del foglio.
   Un colore troppo scuro sul nero non si leggerebbe: diventa il chiaro.
   Sui pieni nel colore del corto (Guarda, il pulsante, la crocetta della
   sala) la scritta è nera, o chiara se col nero il contrasto è troppo
   basso (--sul-titolo). */
function coloraCorto(o, radice) {
  const applica = (c) => {
    if (!c) return;
    const leggibile = luminosita(c) > 0.12;
    radice.style.setProperty('--titolo', leggibile ? c : 'var(--chiaro)');
    radice.style.setProperty('--sul-titolo', leggibile && contrastoColNero(c) < 4.5 ? 'var(--chiaro)' : 'var(--nero)');
  };
  if (/^#[0-9a-f]{6}$/i.test(o.colore || '')) applica(o.colore.toLowerCase());
  else if (!o.titolo_png && !o.titolo_font && TITOLI_GRAFICI.has(o.codice)) coloreTitolo(o.codice).then(applica).catch(console.error);
}

/* Lo schermo del corto come lettore. Il fotogramma col titolo fa da
   copertina; toccando lo schermo (o con Invio) il video parte e la
   copertina si dissolve. Arrivando dalla Cortoteca col passaggio parte da
   solo, appena ricomparso il titolo: dove il browser non lascia partire un
   video con l'audio senza un tocco su questa pagina, resta il lettore
   pronto col suo tasto di avvio. */
function lettore(schermo, embed, titolo, ritardo = null) {
  schermo.classList.add('schermo--lettore');
  schermo.setAttribute('role', 'button');
  schermo.setAttribute('tabindex', '0');
  schermo.setAttribute('aria-label', 'Guarda ' + titolo);
  schermo.dataset.cursore = 'Guarda';
  schermo.insertAdjacentHTML('beforeend', `<span class="disco schermo__play" aria-hidden="true">${PLAY}Guarda</span>`);

  let partito = false;
  const avvia = () => {
    if (partito) return;
    partito = true;
    const indirizzo = embed.replace('autoplay=0', 'autoplay=1') + (embed.includes('youtube') ? '&playsinline=1' : '');
    const video = document.createElement('iframe');
    video.title = titolo;
    video.allow = 'autoplay; fullscreen; picture-in-picture';
    video.allowFullscreen = true;
    video.src = indirizzo;
    // il video entra sotto la copertina, che si dissolve quando è pronto
    schermo.querySelector('.cornice').prepend(video);
    video.addEventListener('load', () => schermo.classList.add('is-in-onda'), { once: true });
    setTimeout(() => schermo.classList.add('is-in-onda'), 2500);
    schermo.removeAttribute('role');
    schermo.removeAttribute('tabindex');
    schermo.removeAttribute('aria-label');
    delete schermo.dataset.cursore;
  };
  schermo.addEventListener('click', avvia);
  schermo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avvia(); }
  });
  if (ritardo !== null) setTimeout(avvia, FERMO ? 0 : ritardo);
}

/* Riempie la pagina del corto. radice è dove si posa il colore del corto
   (il body della pagina, o la sala aperta dentro la Cortoteca); con
   ritardoAvvio il video parte da solo dopo quel tempo. */
function mostraCorto(o, radice, ritardoAvvio = null) {
  document.title = `${o.titolo} – CDL APS`;
  document.getElementById('titolo-corto').textContent = o.titolo;
  coloraCorto(o, radice);

  // Lo schermo: il fotogramma col titolo grafico (o scritto)
  const schermo = document.getElementById('schermo');
  schermo.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
  document.getElementById('schermo-titolo').replaceChildren(
    titoloGrafico(o, { classe: 'targa__titolo', alt: '' }) || titoloScritto(o, 'targa__titolo'));

  document.getElementById('corto-frase').textContent = o.tagline || '';
  document.getElementById('corto-sinossi').textContent = o.sinossi || '';

  // In streaming lo schermo è già il lettore; senza video lo schermo resta
  // un'immagine, e dice "Streaming in arrivo" solo se il socio non ha
  // scelto la sola scheda
  const embed = getEmbedUrl(o.video_url);
  if (embed) lettore(schermo, embed, o.titolo, ritardoAvvio);
  else if (!o.solo_scheda) schermo.insertAdjacentHTML('beforeend', '<span class="disco schermo__attesa">Streaming in arrivo</span>');

  // Letterboxd: solo indirizzi web veri, il campo arriva da un modulo
  if (pieno(o.letterboxd_url) && /^https?:\/\//i.test(o.letterboxd_url)) {
    const azioni = document.getElementById('corto-azioni');
    azioni.innerHTML = `<a class="btn" href="${esc(o.letterboxd_url)}" target="_blank" rel="noopener">Su Letterboxd ${ESTERNO}</a>`;
    azioni.hidden = false;
  }

  const voce = (nome, valore, classe = '') => (pieno(valore) ? `<div${classe ? ` class="${classe}"` : ''}><dt>${esc(nome)}</dt><dd>${esc(valore)}</dd></div>` : '');
  document.getElementById('corto-dati').innerHTML = [
    voce('Regia', o.regista),
    voce('Anno', o.anno),
    voce('Genere', (o.generi || []).map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')),
    voce('Durata', durata(o)),
    voce('Produzione', o.produzione),
  ].join('');
  document.getElementById('corto').hidden = false;

  // Le note di regia, un paragrafo per ogni a capo
  if (pieno(o.note_regia)) {
    document.getElementById('note-regia').innerHTML = o.note_regia.split(/\n+/).filter((p) => p.trim())
      .map((p) => `<p>${esc(p.trim())}</p>`).join('');
    document.getElementById('blocco-note').hidden = false;
  }

  const altri = (Array.isArray(o.altri_ruoli) ? o.altri_ruoli : [])
    .filter((r) => r && pieno(r.ruolo) && pieno(r.nome));
  const interpreti = (o.interpreti || []).map((i) => (i.ruolo ? `${i.nome} (${i.ruolo})` : i.nome)).join(', ');
  const crediti = [
    ...CREDITI.map(([nome, colonna]) => voce(nome, o[colonna])),
    ...altri.map((r) => voce(r.ruolo, r.nome)),
    voce('Interpreti', interpreti, 'crediti__interpreti'), // lungo: su telefono prende tutta la riga
  ].join('');
  if (crediti) {
    document.getElementById('crediti').innerHTML = crediti;
    document.getElementById('blocco-crediti').hidden = false;
  }
}
