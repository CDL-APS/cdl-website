/* ==========================================================================
   MODELLO DELLE PAGINE EVENTO — la pagina di un evento composta dal
   database: in cima il logo (o il nome) e la presentazione, sotto i blocchi.
   Lo usano evento.html (evento.js) e la sala di eventi.html (eventi.js),
   come corto.js per i corti. Disegna con le classi di pages/evento.css, le
   stesse delle pagine evento scritte a mano. Si appoggia a dati.js e
   comune.js.

   Le colonne dell'evento (vedi supabase/migrations/…_eventi_a_blocchi.sql):
   logo, colore, instagram, sfondo, presentazione, blocchi.

   I testi (presentazione, note, righe) sono testo semplice con poche
   regole: una riga vuota separa i paragrafi; **grassetto**, _corsivo_,
   [testo](indirizzo) per un collegamento, @nome per un profilo Instagram;
   le righe che iniziano con "- " fanno un elenco.

   I blocchi, nell'ordine in cui stanno nella pagina. Ogni blocco ha un tipo:
   - programma: titolo?, nota?, gruppi (ognuno titolo?, nota?, numerato
     — falso per un elenco senza numeri —, voci). Una voce: titolo, riga?
     (testo libero: "regista · 12'"), opera_id? (il corto nella Cortoteca:
     la voce porta alla sua pagina), logo? (un PNG al posto del nome),
     voci? (i corti sotto una voce). Con le foto (foto: immagine,
     descrizione?, larghezza?, altezza?; descrizione_foto: il nome della
     striscia, "Foto della serata del 18 aprile") il blocco diventa una
     serata, con la striscia accanto e il post Instagram (instagram, se no
     quello dell'evento). Più programmi di fila stanno in un solo blocco,
     divisi da un filo.
   - testo: titolo?, testo.
   Gli altri tipi del piano (foto, vincitori, materiali, partner) arrivano
   con la conversione delle altre pagine; un tipo sconosciuto non si vede.
   ========================================================================== */

const ICONA_ESTERNO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/></svg>';
const ICONA_CORTOTECA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';
const ICONA_PRIMA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const ICONA_DOPO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

// Oltre queste proporzioni (larghezza / altezza) il logo è una riga lunga:
// il racconto va sotto e non a fianco
const LOGO_AFFIANCATO = 2.5;

const POST_INSTAGRAM = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_./?=&-]+$/;

/* ---- Il testo ---- */

// Un collegamento che esce dal sito ha l'icona del link esterno
function collegamento(indirizzo, contenuto) {
  const fuori = /^https?:/i.test(indirizzo);
  return `<a class="tag-ig" href="${esc(indirizzo)}"${fuori ? ' target="_blank" rel="noopener"' : ''}>${contenuto}${fuori ? ICONA_ESTERNO : ''}</a>`;
}

// Le regole dentro una riga. Dentro un collegamento (conLink: false) i
// collegamenti non si annidano.
const REGOLE_RIGA = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|(^|[\s(])_(.+?)_(?=$|[\s).,;:!?])|(^|[\s(])@([A-Za-z0-9_](?:[A-Za-z0-9._]*[A-Za-z0-9_])?)/g;

function inRiga(testo, conLink = true) {
  const sorgente = String(testo ?? '');
  let html = '';
  let da = 0;
  for (const m of sorgente.matchAll(REGOLE_RIGA)) {
    const [tutto, linkTesto, linkIndirizzo, grassetto, primaCorsivo, corsivo, primaTag, tag] = m;
    html += esc(sorgente.slice(da, m.index));
    da = m.index + tutto.length;
    if (linkTesto !== undefined) {
      const indirizzo = conLink && indirizzoSicuro(linkIndirizzo);
      html += indirizzo ? collegamento(indirizzo, inRiga(linkTesto, false)) : inRiga(linkTesto, false);
    } else if (grassetto !== undefined) {
      html += `<strong>${inRiga(grassetto, conLink)}</strong>`;
    } else if (corsivo !== undefined) {
      html += `${esc(primaCorsivo)}<em>${inRiga(corsivo, conLink)}</em>`;
    } else {
      html += esc(primaTag) + (conLink ? collegamento(`https://www.instagram.com/${tag}/`, '@' + esc(tag)) : '@' + esc(tag));
    }
  }
  return html + esc(sorgente.slice(da));
}

// Paragrafi ed elenchi
function inParagrafi(testo) {
  return String(testo ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const righe = p.split('\n').map((r) => r.trim());
    if (righe.every((r) => r.startsWith('- '))) {
      return `<ul class="blocco-testo__elenco">${righe.map((r) => `<li>${inRiga(r.slice(2))}</li>`).join('')}</ul>`;
    }
    return `<p>${righe.map((r) => inRiga(r)).join('<br>')}</p>`;
  }).join('');
}

/* ---- Le immagini ---- */

// Nell'anteprima della gestione le immagini non ancora caricate arrivano
// dalla memoria del browser (blob:), solo da questo sito
function daAnteprima(indirizzo) {
  return typeof indirizzo === 'string' && indirizzo.startsWith(`blob:${location.origin}/`) ? indirizzo : null;
}

function fotoMostrabile(foto) {
  return Boolean(foto && (immagineEvento(foto.immagine) || daAnteprima(foto.anteprima)));
}

// Una copia nel sito si mostra subito; dallo spazio immagini la carica
// attivaImmagini, che ripiega sulla copia locale se manca
function tagImmagine(foto, alt, attributi = '') {
  const i = immagineEvento(foto.immagine) || (daAnteprima(foto.anteprima) && { locale: daAnteprima(foto.anteprima) });
  if (!i) return '';
  const misure = foto.larghezza > 0 && foto.altezza > 0 ? ` width="${Number(foto.larghezza)}" height="${Number(foto.altezza)}"` : '';
  const sorgente = i.locale ? `src="${esc(i.locale)}"` : `data-immagine="${esc(i.percorso)}"`;
  return `<img ${sorgente} alt="${esc(alt)}"${misure}${attributi}>`;
}

function attivaImmagini(radice) {
  radice.querySelectorAll('img[data-immagine]').forEach((img) => {
    mostraImmagine(img, img.dataset.immagine);
    img.removeAttribute('data-immagine');
  });
}

// L'indirizzo assoluto di un'immagine, per un url() dentro una variabile
// CSS (che si risolve rispetto al foglio che la usa, non alla pagina)
function assoluto(indirizzo) {
  return new URL(indirizzo, location.href).href;
}

/* Il logo: si carica prima di disegnare, per conoscerne le proporzioni
   (decidono se il racconto gli sta a fianco). Prima lo spazio immagini,
   poi la copia locale; se non arriva, la pagina apre col nome scritto. */
function misuraLogo(percorso, anteprima = null) {
  const i = daAnteprima(anteprima) ? { locale: anteprima } : immagineEvento(percorso);
  if (!i) return Promise.resolve(null);
  const candidati = i.locale ? [i.locale] : [urlImmagine(i.percorso), urlImmagineLocale(i.percorso)].filter(Boolean);
  const prova = (indirizzo) => new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => ok({ src: assoluto(indirizzo), ar: img.naturalWidth / img.naturalHeight });
    img.onerror = no;
    img.src = indirizzo;
  });
  return candidati.reduce((prima, c) => prima.catch(() => prova(c)), Promise.reject())
    .catch(() => null);
}

/* ---- I corti collegati: solo quelli pubblicati portano alla Cortoteca ---- */
function idOpere(voci) {
  return (Array.isArray(voci) ? voci : []).flatMap((v) => [v && v.opera_id, ...idOpere(v && v.voci)]);
}

async function opereCollegate(evento) {
  const ids = [...new Set((evento.blocchi || []).flatMap((b) =>
    (Array.isArray(b && b.gruppi) ? b.gruppi : []).flatMap((g) => idOpere(g && g.voci))))]
    .filter((id) => Number.isInteger(id));
  if (!ids.length) return new Map();
  try {
    const opere = await leggi('opere', `select=id,codice&pubblicata=eq.true&id=in.(${ids.join(',')})`);
    return new Map(opere.filter((o) => ids.includes(o.id)).map((o) => [o.id, o]));
  } catch (errore) {
    console.error(errore);
    return new Map();
  }
}

/* ---- La testata ---- */
function testataEvento(evento, logo) {
  const titolo = logo
    ? `<h1 class="evento-g__marchio" id="titolo-evento"><span class="sr-only">${esc(evento.titolo)}</span>`
      + `<span class="marchio-serie marchio-serie--evento" style="--marchio: url('${esc(logo.src)}'); --ar: ${logo.ar.toFixed(4)}" data-arrivo aria-hidden="true"></span></h1>`
    : `<h1 class="evento-g__titolo" id="titolo-evento"><span data-arrivo>${esc(evento.titolo)}</span></h1>`;
  const presentazione = (evento.presentazione || '').trim()
    ? `<div class="presentazione entra">${inParagrafi(evento.presentazione)}</div>` : '';
  const affiancato = logo && logo.ar < LOGO_AFFIANCATO ? ' hero--affiancato' : '';
  return `<section class="hero hero--evento hero--marchio${affiancato}"><div class="wrap">${titolo}${presentazione}</div></section>`;
}

/* ---- Il programma ---- */
function voceProgramma(voce, opere) {
  if (!voce || !(voce.titolo || voce.logo)) return '';
  const opera = opere.get(voce.opera_id);
  const logo = immagineEvento(voce.logo);
  const nome = logo
    ? `<span class="programma-titolo"><span class="sr-only">${esc(voce.titolo)}</span><span class="marchio-serie marchio-voce" data-logo-voce="${esc(urlImmagineEvento(voce.logo))}" aria-hidden="true"></span></span>`
    : `<span class="programma-titolo">${esc(voce.titolo)}</span>`;
  const riga = voce.riga ? `<span class="programma-dati">${inRiga(voce.riga, !opera)}</span>` : '';
  const dentro = opera
    ? `<a class="programma-voce" href="${esc(indirizzoOpera(opera))}">${nome}${riga}<span class="programma-cortoteca"><span>Scheda del corto</span> ${ICONA_CORTOTECA}</span></a>`
    : `<div class="programma-voce">${nome}${riga}</div>`;
  const sotto = Array.isArray(voce.voci) && voce.voci.length
    ? `<ol class="programma-lista programma-lista--corti">${voce.voci.map((v) => voceProgramma(v, opere)).join('')}</ol>` : '';
  return `<li>${dentro}${sotto}</li>`;
}

function gruppoProgramma(gruppo, opere) {
  const voci = (Array.isArray(gruppo && gruppo.voci) ? gruppo.voci : []).map((v) => voceProgramma(v, opere)).join('');
  if (!voci) return '';
  const lista = gruppo.numerato === false
    ? `<ul class="programma-lista programma-lista--semplice">${voci}</ul>`
    : `<ol class="programma-lista">${voci}</ol>`;
  if (!gruppo.titolo && !gruppo.nota) return lista;
  return `<div class="programma-gruppo">`
    + (gruppo.titolo ? `<h3 class="programma-gruppo-titolo">${esc(gruppo.titolo)}</h3>` : '')
    + (gruppo.nota ? `<p class="programma-gruppo-nota">${inRiga(gruppo.nota)}</p>` : '')
    + `${lista}</div>`;
}

function striscia(blocco, evento) {
  const foto = (Array.isArray(blocco.foto) ? blocco.foto : []).filter(fotoMostrabile);
  if (!foto.length) return '';
  const nome = blocco.descrizione_foto || `Foto di ${evento.titolo}`;
  const post = [blocco.instagram, evento.instagram].find((p) => POST_INSTAGRAM.test(p || ''));
  return `<div class="giostra__foto"><div class="giostra__pista" tabindex="0" role="group" aria-label="${esc(nome)}">`
    + foto.map((f, i) => tagImmagine(f, f.descrizione || `${nome}, ${i + 1} di ${foto.length}`)).join('')
    + `</div></div><div class="giostra__comandi"><span class="giostra__avanzamento" aria-hidden="true"><span class="giostra__linea"></span></span>`
    + `<button class="giostra__tasto" type="button" aria-label="Foto precedenti">${ICONA_PRIMA}</button>`
    + `<button class="giostra__tasto" type="button" aria-label="Foto successive">${ICONA_DOPO}</button>`
    + (post ? `<a class="giostra__post" href="${esc(post)}" target="_blank" rel="noopener">Vedi su Instagram ${ICONA_ESTERNO.replace('<svg ', '<svg class="freccia" ')}</a>` : '')
    + '</div>';
}

function serata(blocco, evento, opere) {
  const gruppi = (Array.isArray(blocco.gruppi) ? blocco.gruppi : []).map((g) => gruppoProgramma(g, opere)).join('');
  const testa = blocco.titolo || blocco.nota
    ? '<div class="serata__testa">'
      + (blocco.titolo ? `<h3 class="programma-gruppo-titolo">${esc(blocco.titolo)}</h3>` : '')
      + (blocco.nota ? `<p class="programma-gruppo-nota">${inRiga(blocco.nota)}</p>` : '')
      + '</div>'
    : '';
  const foto = striscia(blocco, evento);
  if (!gruppi && !testa && !foto) return '';
  const classi = ['serata', foto && 'giostra', !testa && 'serata--senza-testa'].filter(Boolean).join(' ');
  return `<div class="${classi}">${testa}<div class="serata__lista">${gruppi}</div>${foto}</div>`;
}

/* ---- I blocchi ---- */
function sezione(id, titolo, contenuto, titoloVisibile = false) {
  return `<section class="blocco-pagina blocco-pagina--diviso entra" aria-labelledby="${id}"><div class="wrap">`
    + `<h2 class="${titoloVisibile ? 'blocco-pagina__testa' : 'sr-only'}" id="${id}">${esc(titolo)}</h2>${contenuto}</div></section>`;
}

function blocchiEvento(evento, opere) {
  const blocchi = (Array.isArray(evento.blocchi) ? evento.blocchi : []).filter((b) => b && typeof b === 'object');
  const parti = [];
  for (let i = 0; i < blocchi.length; i++) {
    const b = blocchi[i];
    const id = `blocco-${i + 1}`;
    if (b.tipo === 'programma') {
      // i programmi di fila stanno nello stesso blocco
      let serate = '';
      while (i < blocchi.length && blocchi[i].tipo === 'programma') serate += serata(blocchi[i++], evento, opere);
      i--;
      if (serate) parti.push(sezione(id, 'Programma', serate));
    } else if (b.tipo === 'testo' && (b.testo || '').trim()) {
      parti.push(sezione(id, b.titolo || 'Racconto', `<div class="blocco-testo">${inParagrafi(b.testo)}</div>`, Boolean(b.titolo)));
    }
  }
  return parti.join('');
}

/* La pagina dell'evento: il titolo della scheda del browser, il colore e
   l'HTML del contenuto */
async function componiEvento(evento) {
  const [logo, opere] = await Promise.all([misuraLogo(evento.logo, evento.logo_anteprima), opereCollegate(evento)]);
  return {
    titolo: `${evento.titolo} – CDL APS`,
    colore: /^#[0-9a-f]{6}$/i.test(evento.colore || '') ? evento.colore : null,
    html: testataEvento(evento, logo) + blocchiEvento(evento, opere),
  };
}

/* Dopo l'inserimento: il colore, le immagini dallo spazio immagini, i
   loghi delle voci (maschere: le proporzioni arrivano col file), le strisce
   di foto */
function vestiEvento(radice, contenuto, pagina) {
  if (pagina.colore) radice.style.setProperty('--evento', pagina.colore);
  attivaImmagini(contenuto);
  contenuto.querySelectorAll('[data-logo-voce]').forEach((el) => {
    const img = new Image();
    img.onload = () => {
      el.style.setProperty('--marchio', `url('${assoluto(img.src)}')`);
      el.style.setProperty('--ar', (img.naturalWidth / img.naturalHeight).toFixed(4));
    };
    img.src = el.dataset.logoVoce;
    el.removeAttribute('data-logo-voce');
  });
}
