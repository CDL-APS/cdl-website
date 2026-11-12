/* ==========================================================================
   GESTIONE, MODULO EVENTO — la pagina dell'evento composta dalla gestione:
   logo (con l'anteprima nel suo colore), colore, presentazione, post
   Instagram, sfondo, e i blocchi sotto la testata, che si aggiungono, si
   spostano e si tolgono. La pagina pubblica li disegna con
   modello-evento.js, dove sono descritti tipi e campi.

   I blocchi si modificano su una copia in memoria (stato.blocchi): i campi
   la aggiornano a ogni tasto, le azioni (aggiungi, sposta, togli) la
   cambiano e ridisegnano l'elenco. I campi che il modulo non mostra (per
   esempio i corti annidati sotto una voce) restano come sono.
   Le foto e il logo nuovi aspettano il salvataggio per essere caricati;
   l'anteprima li mostra già, dalla memoria del browser.

   Caricato dopo gestione.js, di cui usa client, stato, $, avviso e i
   campi comuni dei moduli; da dati.js e riservato.js usa ridimensiona,
   urlImmagine, urlImmagineEvento, immagineEvento, esc.
   ========================================================================== */

const CHIAVE_ANTEPRIMA = 'cdl-anteprima-evento';
const NOMI_BLOCCO = { programma: 'Programma', testo: 'Testo' };

// Un file in attesa di caricamento ha una chiave; l'anteprima un indirizzo blob:
let prossimoFile = 1;
const fileInAttesa = new Map(); // chiave → { file, anteprima }

function mettiInAttesa(file) {
  const chiave = 'f' + prossimoFile++;
  fileInAttesa.set(chiave, { file, anteprima: URL.createObjectURL(file) });
  return chiave;
}

function svuotaAttesa() {
  fileInAttesa.forEach(({ anteprima }) => URL.revokeObjectURL(anteprima));
  fileInAttesa.clear();
}

// Dove si vede un'immagine dell'evento nel modulo: in attesa o già salvata
function sorgenteFoto(foto) {
  if (foto._attesa) return fileInAttesa.get(foto._attesa)?.anteprima || '';
  return urlImmagineEvento(foto.immagine) || '';
}

/* --------------------------------------------------------------------------
   Testata: logo e colore
   -------------------------------------------------------------------------- */
const moduloEvento = () => $('modulo-evento');

function coloreEvento() {
  const valore = moduloEvento().colore.value.trim();
  return /^#[0-9a-f]{6}$/i.test(valore) ? valore.toLowerCase() : '#1d1d1b';
}

// Il logo come sul sito: la sua sagoma nel colore dell'evento, sulla carta
function aggiornaLogo() {
  const anteprima = $('evento-logo-anteprima');
  const segno = anteprima.querySelector('.g-logo-evento__segno');
  const sorgente = stato.logoEvento ? fileInAttesa.get(stato.logoEvento)?.anteprima : urlImmagineEvento(moduloEvento().logo.value);
  $('evento-logo-togli').hidden = !sorgente;
  anteprima.hidden = !sorgente;
  if (!sorgente) return;
  const img = new Image();
  img.onload = () => {
    segno.style.setProperty('--marchio', `url("${new URL(sorgente, location.href).href}")`);
    segno.style.setProperty('--ar', (img.naturalWidth / img.naturalHeight).toFixed(4));
  };
  img.src = sorgente;
  segno.style.setProperty('--colore', coloreEvento());
}

$('evento-logo-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    if (riconosciFileTitolo(file).tipo !== 'png') throw new Error('Il logo deve essere un PNG, meglio con il fondo trasparente.');
  } catch (errore) {
    avviso(errore.message, true);
    return;
  }
  stato.logoEvento = mettiInAttesa(file);
  segnaModificato();
  aggiornaLogo();
});

$('evento-logo-togli').addEventListener('click', () => {
  stato.logoEvento = null;
  moduloEvento().logo.value = '';
  segnaModificato();
  aggiornaLogo();
});

function allineaColoreEvento() {
  $('evento-colore-scelta').value = coloreEvento();
  $('evento-logo-anteprima').querySelector('.g-logo-evento__segno').style.setProperty('--colore', coloreEvento());
}
$('evento-colore-scelta').addEventListener('input', (e) => {
  moduloEvento().colore.value = e.target.value;
  allineaColoreEvento();
});
moduloEvento().colore.addEventListener('input', allineaColoreEvento);
$('evento-colore-togli').addEventListener('click', () => {
  moduloEvento().colore.value = '';
  allineaColoreEvento();
  segnaModificato();
});

/* --------------------------------------------------------------------------
   I blocchi
   -------------------------------------------------------------------------- */
function nuovoBlocco(tipo) {
  if (tipo === 'testo') return { tipo, titolo: '', testo: '' };
  return { tipo: 'programma', titolo: '', nota: '', gruppi: [{ numerato: true, voci: [{}] }], foto: [] };
}

// Sposta un elemento di un elenco di un posto; vero se si è mosso
function sposta(elenco, i, verso) {
  const j = i + verso;
  if (j < 0 || j >= elenco.length) return false;
  [elenco[i], elenco[j]] = [elenco[j], elenco[i]];
  return true;
}

// I tre tasti tondi; data-azione e data-dove dicono cosa e dove
function comandi(dove, quanti, i, nome) {
  return `<span class="g-comandi">
      <button type="button" class="g-icona" data-azione="su" data-dove="${dove}" ${i === 0 ? 'disabled' : ''} aria-label="Sposta su ${nome}">↑</button>
      <button type="button" class="g-icona" data-azione="giu" data-dove="${dove}" ${i === quanti - 1 ? 'disabled' : ''} aria-label="Sposta giù ${nome}">↓</button>
      <button type="button" class="g-icona" data-azione="togli" data-dove="${dove}" aria-label="Togli ${nome}">✕</button>
    </span>`;
}

// Un campo legato a un valore della copia in memoria (data-campo: il percorso)
function campo(etichetta, percorso, valore, { area = false, largo = false, nota = '', segnaposto = '', tipo = 'text' } = {}) {
  const controllo = area
    ? `<textarea rows="4" data-campo="${percorso}">${esc(valore || '')}</textarea>`
    : `<input type="${tipo}" data-campo="${percorso}" value="${esc(valore || '')}" placeholder="${esc(segnaposto)}">`;
  return `<label class="g-campo${largo ? ' g-campo--largo' : ''}"><span>${etichetta}</span>${controllo}${nota ? `<small>${nota}</small>` : ''}</label>`;
}

function sceltaOpera(percorso, valore) {
  const opzioni = (stato.opereEvento || []).map((o) =>
    `<option value="${o.id}" ${o.id === valore ? 'selected' : ''}>${esc(o.titolo)}${o.anno ? ` (${esc(o.anno)})` : ''}${o.pubblicata ? '' : ' · non pubblicata'}</option>`).join('');
  return `<select data-campo="${percorso}" data-numero aria-label="Corto nella Cortoteca"><option value="">Nessun corto della Cortoteca</option>${opzioni}</select>`;
}

function disegnaVoce(b, g, v, voce, quante) {
  const dove = `${b}.gruppi.${g}.voci.${v}`;
  const conservati = [
    Array.isArray(voce.voci) && voce.voci.length ? `${voce.voci.length} ${voce.voci.length === 1 ? 'corto' : 'corti'} sotto questa voce` : '',
    voce.logo ? 'un logo al posto del nome' : '',
  ].filter(Boolean).join(' e ');
  return `<li class="g-riga-voce">
      <input type="text" data-campo="${dove}.titolo" value="${esc(voce.titolo || '')}" placeholder="Titolo" aria-label="Titolo della voce">
      <input type="text" data-campo="${dove}.riga" value="${esc(voce.riga || '')}" placeholder="Regia · produzione · anno · durata" aria-label="Riga sotto il titolo">
      ${sceltaOpera(`${dove}.opera_id`, voce.opera_id)}
      ${comandi(dove, quante, v, 'la voce')}
      ${conservati ? `<small class="g-riga-voce__nota">Ha ${conservati}: restano come sono.</small>` : ''}
    </li>`;
}

function disegnaGruppo(b, g, gruppo, quanti) {
  const dove = `${b}.gruppi.${g}`;
  const voci = Array.isArray(gruppo.voci) ? gruppo.voci : [];
  return `<div class="g-elenco-voci">
      <div class="g-blocco__testa"><h4 class="g-blocco__nome">Elenco ${quanti > 1 ? g + 1 : ''}</h4>${quanti > 1 ? comandi(dove, quanti, g, "l'elenco") : ''}</div>
      <div class="g-griglia">
        ${campo('Titolo dell\'elenco', `${dove}.titolo`, gruppo.titolo, { nota: 'Facoltativo, per dividere una serata in più parti.' })}
        ${campo('Nota', `${dove}.nota`, gruppo.nota)}
        <label class="g-spunta"><input type="checkbox" data-campo="${dove}.numerato" ${gruppo.numerato === false ? '' : 'checked'}><span>Numerato <small>(01, 02…: per i corti in proiezione; senza, per le voci di una serata)</small></span></label>
      </div>
      <ol class="g-voci">${voci.map((voce, v) => disegnaVoce(b, g, v, voce || {}, voci.length)).join('')}</ol>
      <button type="button" class="btn" data-azione="aggiungi-voce" data-dove="${dove}.voci">Aggiungi una voce</button>
    </div>`;
}

function disegnaFoto(b, foto) {
  const dove = `${b}.foto`;
  return `<ol class="g-foto-evento">${foto.map((f, i) => `
      <li class="g-foto-evento__voce">
        <span class="g-foto-evento__cornice"><img src="${esc(sorgenteFoto(f))}" alt=""></span>
        <input type="text" data-campo="${dove}.${i}.descrizione" value="${esc(f.descrizione || '')}" placeholder="Descrizione" aria-label="Descrizione della foto ${i + 1}">
        ${comandi(`${dove}.${i}`, foto.length, i, 'la foto').replace(/↑/g, '←').replace(/↓/g, '→').replace(/Sposta su/g, 'Sposta prima').replace(/Sposta giù/g, 'Sposta dopo')}
      </li>`).join('')}</ol>`;
}

function disegnaBlocco(blocco, b, quanti) {
  const nome = NOMI_BLOCCO[blocco.tipo] || `Blocco "${blocco.tipo}"`;
  const testa = `<div class="g-blocco__testa"><h3 class="g-blocco__nome">${esc(nome)}</h3>${comandi(String(b), quanti, b, 'il blocco')}</div>`;
  if (blocco.tipo === 'testo') {
    return `<li class="g-blocco">${testa}<div class="g-griglia">
        ${campo('Titolo', `${b}.titolo`, blocco.titolo, { largo: true, nota: 'Facoltativo.' })}
        ${campo('Testo', `${b}.testo`, blocco.testo, { area: true, largo: true, nota: 'Stesse regole della presentazione.' })}
      </div></li>`;
  }
  if (blocco.tipo !== 'programma') {
    return `<li class="g-blocco">${testa}<p class="g-nota-blocchi">Questo blocco non si modifica ancora da qui: resta com'è.</p></li>`;
  }
  const gruppi = Array.isArray(blocco.gruppi) ? blocco.gruppi : [];
  const foto = Array.isArray(blocco.foto) ? blocco.foto : [];
  return `<li class="g-blocco">${testa}
      <div class="g-griglia">
        ${campo('Titolo della serata', `${b}.titolo`, blocco.titolo, { nota: 'Per esempio "Doppia visione" o "Mercoledì 30 aprile". Facoltativo.' })}
        ${campo('Nota', `${b}.nota`, blocco.nota, { nota: 'Una riga sotto il titolo: chi suona, chi conduce…' })}
      </div>
      ${gruppi.map((gruppo, g) => disegnaGruppo(b, g, gruppo || {}, gruppi.length)).join('')}
      <button type="button" class="btn" data-azione="aggiungi-gruppo" data-dove="${b}.gruppi">Aggiungi un elenco</button>
      <div class="g-blocco__foto">
        <h4 class="g-blocco__nome">Foto della serata</h4>
        ${foto.length ? disegnaFoto(b, foto) : '<p class="g-nota-blocchi">Nessuna foto: il programma occupa da solo la riga.</p>'}
        <div class="g-immagine-azioni">
          <label class="btn">Aggiungi foto<input type="file" accept="image/*" multiple hidden data-foto="${b}"></label>
        </div>
        <div class="g-griglia">
          ${campo('Nome della striscia', `${b}.descrizione_foto`, blocco.descrizione_foto, { segnaposto: 'Foto della serata del 18 aprile', nota: 'Per chi usa un lettore di schermo.' })}
          ${campo('Post Instagram della serata', `${b}.instagram`, blocco.instagram, { tipo: 'url', segnaposto: 'https://www.instagram.com/p/…', nota: 'Se vuoto, quello dell\'evento.' })}
        </div>
      </div>
    </li>`;
}

function disegnaBlocchi(fuoco = null) {
  const blocchi = stato.blocchi;
  $('blocchi-evento').innerHTML = blocchi.length
    ? blocchi.map((blocco, b) => disegnaBlocco(blocco || {}, b, blocchi.length)).join('')
    : '<li class="g-vuoto">Ancora nessun blocco.</li>';
  if (fuoco) $('blocchi-evento').querySelector(fuoco)?.focus();
}

// Il valore in un percorso come "0.gruppi.1.voci.2.titolo"
function percorso(stringa) {
  const parti = stringa.split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p));
  const ultima = parti.pop();
  const padre = parti.reduce((o, p) => o[p], stato.blocchi);
  return { padre, ultima };
}

$('blocchi-evento').addEventListener('input', (e) => {
  const el = e.target.closest('[data-campo]');
  if (!el) return;
  const { padre, ultima } = percorso(el.dataset.campo);
  if (el.type === 'checkbox') padre[ultima] = el.checked;
  else if (el.dataset.numero !== undefined) padre[ultima] = el.value ? Number(el.value) : null;
  else padre[ultima] = el.value;
});
// le foto scelte dal disco
$('blocchi-evento').addEventListener('change', (e) => {
  const scelta = e.target.closest('input[data-foto]');
  if (!scelta) return;
  const blocco = stato.blocchi[Number(scelta.dataset.foto)];
  blocco.foto = Array.isArray(blocco.foto) ? blocco.foto : [];
  [...scelta.files].forEach((file) => blocco.foto.push({ _attesa: mettiInAttesa(file) }));
  segnaModificato();
  disegnaBlocchi();
});

$('blocchi-evento').addEventListener('click', (e) => {
  const tasto = e.target.closest('[data-azione]');
  if (!tasto) return;
  const { azione, dove } = tasto.dataset;
  if (azione === 'aggiungi-voce' || azione === 'aggiungi-gruppo') {
    const { padre, ultima } = percorso(dove);
    if (!Array.isArray(padre[ultima])) padre[ultima] = [];
    padre[ultima].push(azione === 'aggiungi-voce' ? {} : { numerato: true, voci: [{}] });
  } else {
    // dove è il percorso dell'elemento: il padre è l'elenco, l'ultima parte la posizione
    const parti = dove.split('.');
    const i = Number(parti.pop());
    const elenco = parti.length ? percorso(parti.join('.')).padre[parti[parti.length - 1]] : stato.blocchi;
    if (azione === 'togli') {
      if (!parti.length && !confirm('Togliere questo blocco? Si perde anche il suo contenuto.')) return;
      elenco.splice(i, 1);
    } else if (!sposta(elenco, i, azione === 'su' ? -1 : 1)) {
      return;
    }
  }
  segnaModificato();
  // dopo uno spostamento il fuoco segue l'elemento
  const nuovo = azione === 'su' || azione === 'giu'
    ? dove.replace(/\d+$/, (n) => String(Number(n) + (azione === 'su' ? -1 : 1))) : null;
  disegnaBlocchi(nuovo ? `[data-azione="${azione}"][data-dove="${nuovo}"]:not(:disabled)` : null);
});

document.querySelectorAll('[data-nuovo-blocco]').forEach((tasto) => {
  tasto.addEventListener('click', () => {
    stato.blocchi.push(nuovoBlocco(tasto.dataset.nuovoBlocco));
    segnaModificato();
    disegnaBlocchi();
    const ultimo = $('blocchi-evento').lastElementChild;
    ultimo.scrollIntoView({ block: 'start', behavior: 'smooth' });
    ultimo.querySelector('input, textarea')?.focus({ preventScroll: true });
  });
});

/* --------------------------------------------------------------------------
   Apertura, lettura e salvataggio
   -------------------------------------------------------------------------- */

/* Chiamata da apriEvento (gestione.js) dopo aver riempito i campi */
function preparaPaginaEvento(evento, opere) {
  svuotaAttesa();
  stato.logoEvento = null;
  stato.opereEvento = opere;
  stato.blocchi = structuredClone(Array.isArray(evento.blocchi) ? evento.blocchi : []);
  allineaColoreEvento();
  aggiornaLogo();
  disegnaBlocchi();
}

// Toglie i campi vuoti e le voci senza titolo; i campi in più restano
function pulisci(valore) {
  if (Array.isArray(valore)) return valore.map(pulisci).filter((v) => v !== undefined);
  if (valore && typeof valore === 'object') {
    const pulito = {};
    Object.entries(valore).forEach(([k, v]) => {
      if (k.startsWith('_')) return;
      const p = pulisci(v);
      if (p === undefined || p === null || p === '' || (Array.isArray(p) && !p.length)) return;
      pulito[k] = p;
    });
    return Object.keys(pulito).length ? pulito : undefined;
  }
  return typeof valore === 'string' ? valore.trim() : valore;
}

function leggiBlocchi() {
  return pulisci(stato.blocchi.map((blocco) => {
    if (!blocco || blocco.tipo !== 'programma') return blocco;
    return {
      ...blocco,
      gruppi: (blocco.gruppi || []).map((g) => ({
        ...g,
        numerato: g.numerato !== false,
        voci: (g.voci || []).filter((v) => v && ((v.titolo || '').trim() || v.logo)),
      })).filter((g) => g.voci.length),
      foto: (blocco.foto || []).filter((f) => f && (f.immagine || f._attesa)),
    };
  }) || []) || [];
}

/* Carica logo e foto in attesa e scrive i percorsi. Le foto vanno nella
   cartella dell'evento, ridimensionate come le altre; se ne tengono le
   misure, così la pagina non salta mentre arrivano. */
async function caricaFileEvento(dati) {
  const cartella = `eventi/${dati.codice}`;
  if (stato.logoEvento) {
    const { file } = fileInAttesa.get(stato.logoEvento);
    const percorsoLogo = `${cartella}/logo-${Date.now()}.png`;
    const { error } = await client.storage.from(BUCKET_IMMAGINI).upload(percorsoLogo, file, {
      contentType: 'image/png', cacheControl: '31536000', upsert: false
    });
    if (error) throw error;
    dati.logo = percorsoLogo;
    moduloEvento().logo.value = percorsoLogo;
    stato.logoEvento = null;
  }
  let n = 0;
  for (const blocco of stato.blocchi) {
    for (const foto of (blocco && Array.isArray(blocco.foto) ? blocco.foto : [])) {
      if (!foto._attesa) continue;
      const { file } = fileInAttesa.get(foto._attesa);
      const blob = await ridimensiona(file);
      const misure = await createImageBitmap(blob);
      const percorsoFoto = `${cartella}/foto-${Date.now()}-${++n}.jpg`;
      const { error } = await client.storage.from(BUCKET_IMMAGINI).upload(percorsoFoto, blob, {
        contentType: 'image/jpeg', cacheControl: '31536000', upsert: false
      });
      if (error) throw error;
      foto.immagine = percorsoFoto;
      foto.larghezza = misure.width;
      foto.altezza = misure.height;
      delete foto._attesa;
    }
  }
  dati.blocchi = leggiBlocchi();
}

/* L'anteprima: la pagina pubblica dell'evento, in un'altra scheda, con i
   dati del modulo così come sono (anche non salvati). Passano dalla memoria
   del browser; le immagini in attesa si vedono dagli indirizzi blob:. */
$('anteprima-evento').addEventListener('click', () => {
  const modulo = moduloEvento();
  const dati = leggiModulo(modulo);
  const conAnteprime = stato.blocchi.map((b) => (b && Array.isArray(b.foto)
    ? { ...b, foto: b.foto.map((f) => (f._attesa ? { ...f, anteprima: sorgenteFoto(f) } : f)) } : b));
  const evento = {
    ...dati,
    titolo: dati.titolo || 'Senza titolo',
    codice: dati.codice || 'anteprima',
    logo_anteprima: stato.logoEvento ? fileInAttesa.get(stato.logoEvento)?.anteprima : null,
    blocchi: pulisci(conAnteprime) || [], // pulisci toglie "_attesa", non "anteprima"
  };
  try {
    localStorage.setItem(CHIAVE_ANTEPRIMA, JSON.stringify(evento));
  } catch (errore) {
    avviso("Il browser non lascia preparare l'anteprima (memoria locale bloccata).", true);
    return;
  }
  window.open('evento.html?anteprima', 'anteprima-evento');
});
