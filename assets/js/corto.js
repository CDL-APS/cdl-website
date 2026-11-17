/* ==========================================================================
   LA PAGINA DEL CORTO — la riempie mostraCorto(), usata da opera.html e
   dalla sala della Cortoteca (lo stesso modello HTML, in una <template>).
   In alto lo schermo, la copertina: il fotogramma pulito; se il corto è in
   streaming lo schermo è anche il lettore. Sotto, a sinistra, il titolo
   (grafico se c'è), la tagline e la logline (la sinossi); a destra i dati.
   Poi le note di regia, per tutta la larghezza, il cast (attore e
   personaggio) e i crediti della troupe, un nome per riga. Si appoggia a
   dati.js e comune.js.
   ========================================================================== */

/* I crediti, nell'ordine in cui compaiono. Regia e produzione stanno già
   nei dati accanto alla sinossi. La chiave è la colonna di opere; i ruoli
   vuoti si saltano. Poi vengono i ruoli senza colonna (altri_ruoli), nel
   loro ordine. Il cast ha una sezione sua. */
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

/* Lo schermo del corto come lettore. Il fotogramma fa da copertina; toccando lo schermo (o con Invio) il video parte e la
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

/* La produzione nei dati del corto: dove c'è CDL (da sola, o fra più
   case separate da virgole) al posto della scritta va il marchio, alto
   quanto le maiuscole del testo accanto (vedi .logo--testo in opera.css) */
function vocePresentata(nome, valore) {
  if (!pieno(valore)) return '';
  const produttori = String(valore).split(/\s*,\s*/).filter(pieno)
    .map((c) => (/^CDL(\s+APS)?$/i.test(c) ? `<span class="logo logo--testo" role="img" aria-label="${esc(c)}"></span>` : esc(c)));
  return `<div><dt>${esc(nome)}</dt><dd>${produttori.join(', ')}</dd></div>`;
}

/* I marchi di Letterboxd (i tre punti) e IMDb (la targa gialla), disegnati
   qui come le altre icone del sito, per i collegamenti della pagina del corto */
const MARCHIO_LETTERBOXD = '<svg class="marchio-servizio" viewBox="0 0 46 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="#ff8000"/><circle cx="23" cy="9" r="8" fill="#00e054"/><circle cx="37" cy="9" r="8" fill="#40bcf4"/></svg>';
const MARCHIO_IMDB = '<svg class="marchio-servizio marchio-servizio--imdb" viewBox="0 0 64 32" aria-hidden="true"><rect width="64" height="32" rx="5" fill="#f5c518"/><text x="32" y="23" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="900" letter-spacing="-0.5" fill="#000">IMDb</text></svg>';

/* Riempie la pagina del corto. radice è dove si posa il colore del corto
   (il body della pagina, o la sala aperta dentro la Cortoteca); con
   ritardoAvvio il video parte da solo dopo quel tempo. */
function mostraCorto(o, radice, ritardoAvvio = null) {
  document.title = `${o.titolo} – CDL APS`;
  coloraCorto(o, radice);

  // Lo schermo: il fotogramma, senza scritte
  const schermo = document.getElementById('schermo');
  schermo.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
  // Sotto, il titolo: grafico (l'immagine ha il titolo come alt), o scritto.
  // Sul fondo nero il titolo grafico prende il colore della pagina (--titolo)
  // se l'opera ne ha uno, o se il disegno è troppo scuro (vedi opera.css)
  const grafica = titoloGrafico(o, { classe: 'corto__titolo-font', colora: false });
  const titolo = document.getElementById('titolo-corto');
  if (grafica && grafica.tagName === 'IMG') {
    const riquadro = ritagliaTitolo(grafica);
    riquadro.classList.toggle('is-tinto', /^#[0-9a-f]{6}$/i.test(o.colore || ''));
    titolo.replaceChildren(riquadro);
  } else if (grafica) titolo.replaceChildren(grafica);
  else titolo.textContent = o.titolo;
  titolo.classList.toggle('corto__titolo--grafico', Boolean(grafica));

  // La tagline va a capo dopo la prima virgola quando la virgola divide la
  // frase in due ("Non c'eri per l'inizio, / non ci sarai per la fine."):
  // non se prima della virgola una frase è già finita ("Andiamo al mare. Sì, …")
  const frase = document.getElementById('corto-frase');
  const virgola = (o.tagline || '').search(/,\s/);
  if (virgola > 0 && !/[.!?…]\s/.test(o.tagline.slice(0, virgola))) {
    frase.replaceChildren(o.tagline.slice(0, virgola + 1), document.createElement('br'), o.tagline.slice(virgola + 1).trim());
  } else frase.textContent = o.tagline || '';
  document.getElementById('corto-sinossi').textContent = o.sinossi || '';

  // In streaming lo schermo è già il lettore; senza video lo schermo resta
  // un'immagine, e dice "Streaming in arrivo" solo se il socio non ha
  // scelto la sola scheda (e mai con la Cortoteca in pausa)
  const embed = getEmbedUrl(o.video_url);
  if (embed) lettore(schermo, embed, o.titolo, ritardoAvvio);
  else if (CORTOTECA_ATTIVA && !o.solo_scheda) schermo.insertAdjacentHTML('beforeend', '<span class="disco schermo__attesa">Streaming in arrivo</span>');

  // Letterboxd e IMDb, coi loro marchi: solo indirizzi web veri (IMDb solo
  // imdb.com, come vuole anche il database), i campi arrivano da un modulo
  const fuori = [];
  if (pieno(o.letterboxd_url) && /^https?:\/\//i.test(o.letterboxd_url)) {
    fuori.push(`<a class="btn btn--servizio" href="${esc(o.letterboxd_url)}" target="_blank" rel="noopener">${MARCHIO_LETTERBOXD}Letterboxd ${ESTERNO}</a>`);
  }
  if (pieno(o.imdb_url) && /^https:\/\/(www\.|m\.)?imdb\.com\//i.test(o.imdb_url)) {
    fuori.push(`<a class="btn btn--servizio" href="${esc(o.imdb_url)}" target="_blank" rel="noopener">${MARCHIO_IMDB}<span class="sr-only">IMDb</span>${ESTERNO}</a>`);
  }
  if (fuori.length) {
    const azioni = document.getElementById('corto-azioni');
    azioni.innerHTML = fuori.join('');
    azioni.hidden = false;
  }

  const voce = (nome, valore, classe = '') => (pieno(valore) ? `<div${classe ? ` class="${classe}"` : ''}><dt>${esc(nome)}</dt><dd>${esc(valore)}</dd></div>` : '');
  document.getElementById('corto-dati').innerHTML = [
    voce('Regia', o.regista),
    voce('Anno', o.anno),
    voce('Genere', (o.generi || []).map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')),
    voce('Durata', durata(o)),
    vocePresentata('Produzione', o.produzione),
  ].join('');
  document.getElementById('corto').hidden = false;

  // Le note di regia, un paragrafo per ogni a capo
  if (pieno(o.note_regia)) {
    document.getElementById('note-regia').innerHTML = o.note_regia.split(/\n+/).filter((p) => p.trim())
      .map((p) => `<p>${esc(p.trim())}</p>`).join('');
    document.getElementById('blocco-note').hidden = false;
  }

  // Cast e troupe: un nome per riga, senza virgole. Un ruolo con più nomi
  // (scritti nel modulo separati da virgole) diventa un elenco.
  const elenco = (nome, nomi, classe = '') => {
    const righe = nomi.filter(pieno);
    return righe.length ? `<div${classe ? ` class="${classe}"` : ''}><dt>${esc(nome)}</dt>${righe.map((n) => `<dd>${esc(n)}</dd>`).join('')}</div>` : '';
  };
  const nomi = (valore) => (pieno(valore) ? String(valore).split(/\s*[,;\n]\s*/) : []);
  const altri = (Array.isArray(o.altri_ruoli) ? o.altri_ruoli : [])
    .filter((r) => r && pieno(r.ruolo) && pieno(r.nome));
  const crediti = [
    ...CREDITI.map(([nome, colonna]) => elenco(nome, nomi(o[colonna]))),
    ...altri.map((r) => elenco(r.ruolo, nomi(r.nome))),
  ].join('');
  if (crediti) {
    document.getElementById('crediti').innerHTML = crediti;
    document.getElementById('blocco-crediti').hidden = false;
  }

  // Il cast: l'attore in grande e, sotto, il personaggio, nell'ordine scelto
  // in gestione (posizione)
  const interpreti = (o.interpreti || []).filter((i) => i && pieno(i.nome));
  if (interpreti.length) {
    document.getElementById('cast').innerHTML = interpreti.map((i) =>
      `<li><span class="cast__nome">${esc(i.nome)}</span>${pieno(i.ruolo) ? `<span class="cast__ruolo">${esc(i.ruolo)}</span>` : ''}</li>`).join('');
    document.getElementById('blocco-cast').hidden = false;
  }
}
