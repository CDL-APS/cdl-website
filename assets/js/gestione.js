/* ==========================================================================
   GESTIONE — pagina riservata ai redattori.

   Accesso con email e password (account creati dalla dashboard di Supabase),
   poi elenco e modifica di opere ed eventi. Tutte le scritture passano dal
   client ufficiale di Supabase con la sessione di chi ha fatto l'accesso: le
   regole del database (RLS) lasciano scrivere solo i redattori, qualunque
   cosa faccia questa pagina.

   Usa da dati.js: SUPABASE_URL, SUPABASE_CHIAVE, BUCKET_IMMAGINI, urlImmagine,
   urlImmagineLocale, esc.
   ========================================================================== */

const client = supabase.createClient(SUPABASE_URL, SUPABASE_CHIAVE);

const LATO_MASSIMO_IMMAGINE = 2000; // px, lato lungo
const QUALITA_JPEG = 0.85;

const stato = {
  scheda: 'opere',  // elenco mostrato: opere o eventi
  modificato: false, // modifiche non salvate nel modulo aperto
  immagini: {}       // file scelti e non ancora caricati, per nome del campo
};

const $ = (id) => document.getElementById(id);

/* --------------------------------------------------------------------------
   Viste e messaggi
   -------------------------------------------------------------------------- */
function mostraVista(nome) {
  document.querySelectorAll('[data-vista]').forEach((v) => {
    v.hidden = v.dataset.vista !== nome;
  });
  window.scrollTo(0, 0);
}

let timerAvviso;
function avviso(testo, errore = false) {
  const el = $('avviso');
  el.textContent = testo;
  el.classList.toggle('g-avviso--errore', errore);
  el.hidden = false;
  clearTimeout(timerAvviso);
  if (!errore) timerAvviso = setTimeout(() => { el.hidden = true; }, 4000);
}

function nascondiAvviso() {
  $('avviso').hidden = true;
}

/* Errori del database tradotti in qualcosa di comprensibile */
function messaggioErrore(errore) {
  if (!errore) return 'Errore sconosciuto';
  if (errore.code === '23505') return 'Esiste già un elemento con questo codice: scegline un altro.';
  if (errore.code === '23514') return 'Un campo non è valido: controlla codice, anno e date.';
  if (errore.code === '42501') return 'Non hai i permessi per questa modifica.';
  if (errore.message && /fetch|network/i.test(errore.message)) return 'Connessione non riuscita: riprova.';
  return errore.message || String(errore);
}

/* --------------------------------------------------------------------------
   Accesso
   -------------------------------------------------------------------------- */
async function aggiornaSessione(sessione) {
  $('utente').hidden = !sessione;
  if (!sessione) {
    mostraVista('accesso');
    return;
  }
  $('utente-email').textContent = sessione.user.email;
  mostraVista('caricamento');

  const { data: redattore, error } = await client.rpc('sono_redattore');
  if (error || !redattore) {
    mostraVista('negato');
    return;
  }
  mostraElenco();
}

$('modulo-accesso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const modulo = e.currentTarget;
  const pulsante = modulo.querySelector('[type=submit]');
  pulsante.disabled = true;
  nascondiAvviso();

  const { data, error } = await client.auth.signInWithPassword({
    email: modulo.email.value.trim(),
    password: modulo.password.value
  });
  pulsante.disabled = false;

  if (error) {
    avviso('Email o password non corretti.', true);
    return;
  }
  modulo.password.value = '';
  aggiornaSessione(data.session);
});

$('esci').addEventListener('click', async () => {
  if (stato.modificato && !confirm('Ci sono modifiche non salvate. Uscire lo stesso?')) return;
  stato.modificato = false;
  await client.auth.signOut();
  aggiornaSessione(null);
});

/* --------------------------------------------------------------------------
   Elenco
   -------------------------------------------------------------------------- */
document.querySelectorAll('.g-scheda').forEach((b) => {
  b.addEventListener('click', () => {
    stato.scheda = b.dataset.scheda;
    mostraElenco();
  });
});

$('nuovo').addEventListener('click', () => {
  if (stato.scheda === 'opere') apriOpera(null);
  else apriEvento(null);
});

async function mostraElenco() {
  mostraVista('elenco');
  document.querySelectorAll('.g-scheda').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.scheda === stato.scheda));
  });
  $('nuovo').textContent = stato.scheda === 'opere' ? 'Nuova opera' : 'Nuovo evento';

  const elenco = $('elenco');
  elenco.innerHTML = '<li class="g-vuoto">Caricamento…</li>';

  const richiesta = stato.scheda === 'opere'
    ? client.from('opere')
        .select('id, titolo, anno, regista, produzione_cdl, pubblicata')
        .order('anno', { ascending: false })
        .order('id', { ascending: false })
    : client.from('eventi')
        .select('id, titolo, data_inizio, luogo, pubblicato')
        .order('data_inizio', { ascending: false });

  const { data, error } = await richiesta;
  if (error) {
    elenco.innerHTML = `<li class="g-vuoto">${esc(messaggioErrore(error))}</li>`;
    return;
  }
  if (!data.length) {
    elenco.innerHTML = '<li class="g-vuoto">Ancora niente: usa il pulsante qui sopra.</li>';
    return;
  }

  elenco.innerHTML = data.map((r) => {
    const pubblicato = stato.scheda === 'opere' ? r.pubblicata : r.pubblicato;
    const dati = stato.scheda === 'opere'
      ? `${esc(r.anno)} · ${esc(r.regista)}`
      : [formattaData(r.data_inizio), r.luogo].filter(Boolean).map(esc).join(' · ');
    const segni = [
      r.produzione_cdl ? '<span class="g-segno">CDL</span>' : '',
      pubblicato
        ? '<span class="g-segno g-segno--pubblicata">Pubblicata</span>'
        : '<span class="g-segno g-segno--bozza">Bozza</span>'
    ].join('');
    return `
      <li>
        <button type="button" class="g-riga" data-id="${r.id}">
          <span class="g-riga-titolo">${esc(r.titolo)}</span>
          <span class="g-riga-dati">${dati}</span>
          <span class="g-segni">${segni}</span>
        </button>
      </li>`;
  }).join('');

  elenco.querySelectorAll('.g-riga').forEach((riga) => {
    riga.addEventListener('click', () => {
      const id = Number(riga.dataset.id);
      if (stato.scheda === 'opere') apriOpera(id);
      else apriEvento(id);
    });
  });
}

function formattaData(iso) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* --------------------------------------------------------------------------
   Campi dei moduli
   -------------------------------------------------------------------------- */

/* Codice per l'indirizzo, dal titolo: "Quarto Livello" → "quarto-livello" */
function codiceDaTitolo(titolo) {
  return titolo
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* Riempie un modulo dai dati di una riga */
function compilaModulo(modulo, riga) {
  [...modulo.elements].forEach((el) => {
    if (!el.name || el.type === 'file') return;
    const valore = riga[el.name];
    if (el.type === 'checkbox') el.checked = Boolean(valore);
    else if (Array.isArray(valore)) el.value = valore.join(', ');
    else el.value = valore ?? '';
  });
}

/* Legge un modulo in un oggetto pronto per il database: testi vuoti come
   null, numeri come numeri, generi come elenco */
function leggiModulo(modulo) {
  const dati = {};
  [...modulo.elements].forEach((el) => {
    if (!el.name || el.type === 'file') return;
    if (el.type === 'checkbox') dati[el.name] = el.checked;
    else if (el.name === 'generi') {
      dati.generi = el.value.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean);
    } else if (el.type === 'number') dati[el.name] = el.value === '' ? null : Number(el.value);
    else dati[el.name] = el.value.trim() === '' ? null : el.value.trim();
  });
  return dati;
}

/* Il codice si genera dal titolo finché l'elemento è nuovo e nessuno l'ha
   scritto a mano; dopo il primo salvataggio resta bloccato */
function preparaCodice(modulo, nuovo) {
  const titolo = modulo.titolo;
  const codice = modulo.codice;
  codice.readOnly = !nuovo;
  codice.dataset.manuale = '';
  titolo.oninput = () => {
    if (nuovo && !codice.dataset.manuale) codice.value = codiceDaTitolo(titolo.value);
  };
  codice.oninput = () => { codice.dataset.manuale = '1'; };
}

/* --------------------------------------------------------------------------
   Immagini: anteprima, ridimensionamento, caricamento
   -------------------------------------------------------------------------- */
function preparaImmagini(modulo) {
  stato.immagini = {};
  modulo.querySelectorAll('.g-immagine').forEach((box) => {
    const campo = box.dataset.campo;
    const nascosto = box.querySelector(`input[name="${campo}"]`);
    const anteprima = box.querySelector('.g-anteprima');
    const file = box.querySelector('input[type=file]');
    const togli = box.querySelector('.g-togli');

    const aggiorna = () => {
      const scelto = stato.immagini[campo];
      if (scelto) {
        anteprima.src = URL.createObjectURL(scelto);
      } else if (nascosto.value) {
        const locale = urlImmagineLocale(nascosto.value);
        anteprima.onerror = () => {
          anteprima.onerror = null;
          if (locale) anteprima.src = locale;
        };
        anteprima.src = urlImmagine(nascosto.value);
      }
      const presente = Boolean(scelto || nascosto.value);
      anteprima.hidden = !presente;
      togli.hidden = !presente;
    };

    file.value = '';
    file.onchange = () => {
      if (!file.files[0]) return;
      stato.immagini[campo] = file.files[0];
      stato.modificato = true;
      aggiorna();
    };
    togli.onclick = () => {
      delete stato.immagini[campo];
      nascosto.value = '';
      stato.modificato = true;
      aggiorna();
    };
    aggiorna();
  });
}

/* Ridimensiona a LATO_MASSIMO_IMMAGINE e converte in JPEG: le foto da
   telefono superano facilmente il limite di 5 MB del bucket */
async function ridimensiona(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Non riesco a leggere "${file.name}": usa un'immagine JPEG o PNG.`);
  }
  const scala = Math.min(1, LATO_MASSIMO_IMMAGINE / Math.max(bitmap.width, bitmap.height));
  const tela = document.createElement('canvas');
  tela.width = Math.round(bitmap.width * scala);
  tela.height = Math.round(bitmap.height * scala);
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#fff'; // le parti trasparenti dei PNG diventano bianche
  ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.drawImage(bitmap, 0, 0, tela.width, tela.height);
  return new Promise((ok, ko) => {
    tela.toBlob((b) => (b ? ok(b) : ko(new Error('Conversione immagine non riuscita'))), 'image/jpeg', QUALITA_JPEG);
  });
}

/* Carica le immagini scelte e scrive il loro percorso nei dati. Il nome
   contiene un orario, così un'immagine sostituita non viene servita dalla
   cache del browser con il contenuto vecchio. */
async function caricaImmagini(modulo, dati) {
  for (const box of modulo.querySelectorAll('.g-immagine')) {
    const campo = box.dataset.campo;
    const file = stato.immagini[campo];
    if (!file) continue;
    const blob = await ridimensiona(file);
    const percorso = `${box.dataset.cartella}/${dati.codice}-${campo}-${Date.now()}.jpg`;
    const { error } = await client.storage.from(BUCKET_IMMAGINI).upload(percorso, blob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false
    });
    if (error) throw error;
    dati[campo] = percorso;
    box.querySelector(`input[name="${campo}"]`).value = percorso;
    delete stato.immagini[campo];
  }
}

/* --------------------------------------------------------------------------
   Opera
   -------------------------------------------------------------------------- */
function aggiungiInterprete(interprete = {}) {
  const riga = $('modello-interprete').content.firstElementChild.cloneNode(true);
  riga.querySelector('[data-nome]').value = interprete.nome || '';
  riga.querySelector('[data-ruolo]').value = interprete.ruolo || '';
  riga.querySelector('[data-su]').onclick = () => {
    if (riga.previousElementSibling) riga.parentNode.insertBefore(riga, riga.previousElementSibling);
    stato.modificato = true;
  };
  riga.querySelector('[data-giu]').onclick = () => {
    if (riga.nextElementSibling) riga.parentNode.insertBefore(riga.nextElementSibling, riga);
    stato.modificato = true;
  };
  riga.querySelector('[data-togli]').onclick = () => {
    riga.remove();
    stato.modificato = true;
  };
  $('interpreti').appendChild(riga);
  return riga;
}

$('aggiungi-interprete').addEventListener('click', () => {
  aggiungiInterprete().querySelector('[data-nome]').focus();
  stato.modificato = true;
});

function leggiInterpreti() {
  return [...$('interpreti').children]
    .map((riga) => ({
      nome: riga.querySelector('[data-nome]').value.trim(),
      ruolo: riga.querySelector('[data-ruolo]').value.trim() || null
    }))
    .filter((i) => i.nome);
}

async function apriOpera(id) {
  nascondiAvviso();
  const modulo = $('modulo-opera');
  let opera = { anno: new Date().getFullYear(), pubblicata: false, generi: [] };
  let interpreti = [];

  if (id) {
    mostraVista('caricamento');
    const { data, error } = await client
      .from('opere')
      .select('*, interpreti(posizione, nome, ruolo)')
      .eq('id', id)
      .single();
    if (error) {
      avviso(messaggioErrore(error), true);
      mostraElenco();
      return;
    }
    opera = data;
    interpreti = [...data.interpreti].sort((a, b) => a.posizione - b.posizione);
  }

  modulo.reset();
  modulo.classList.remove('is-verificato');
  modulo.dataset.id = id || '';
  compilaModulo(modulo, opera);
  preparaCodice(modulo, !id);
  preparaImmagini(modulo);

  $('interpreti').innerHTML = '';
  interpreti.forEach((i) => aggiungiInterprete(i));

  $('titolo-modulo-opera').textContent = id ? opera.titolo : 'Nuova opera';
  modulo.querySelector('[data-elimina]').hidden = !id;
  const vedi = $('vedi-opera');
  vedi.hidden = !(id && opera.pubblicata);
  vedi.href = 'opera.html?film=' + encodeURIComponent(opera.codice || '');

  stato.modificato = false;
  mostraVista('opera');
}

$('modulo-opera').addEventListener('submit', async (e) => {
  e.preventDefault();
  const modulo = e.currentTarget;
  modulo.classList.add('is-verificato');
  if (!modulo.checkValidity()) {
    modulo.reportValidity();
    return;
  }

  const pulsante = modulo.querySelector('[type=submit]');
  pulsante.disabled = true;
  pulsante.textContent = 'Salvataggio…';
  const id = modulo.dataset.id ? Number(modulo.dataset.id) : null;

  try {
    const dati = leggiModulo(modulo);
    await caricaImmagini(modulo, dati);

    let operaId = id;
    if (id) {
      const { error } = await client.from('opere').update(dati).eq('id', id);
      if (error) throw error;
    } else {
      const { data, error } = await client.from('opere').insert(dati).select('id').single();
      if (error) throw error;
      operaId = data.id;
    }

    // Il cast si riscrive per intero: è più semplice che confrontare righe
    const interpreti = leggiInterpreti().map((i, n) => ({ ...i, opera_id: operaId, posizione: n + 1 }));
    const tolti = await client.from('interpreti').delete().eq('opera_id', operaId);
    if (tolti.error) throw tolti.error;
    if (interpreti.length) {
      const { error } = await client.from('interpreti').insert(interpreti);
      if (error) throw error;
    }

    stato.modificato = false;
    avviso(`"${dati.titolo}" salvata${dati.pubblicata ? ' e pubblicata' : ' come bozza'}.`);
    mostraElenco();
  } catch (errore) {
    console.error(errore);
    avviso(messaggioErrore(errore), true);
    window.scrollTo(0, 0);
  } finally {
    pulsante.disabled = false;
    pulsante.textContent = 'Salva';
  }
});

/* --------------------------------------------------------------------------
   Evento
   -------------------------------------------------------------------------- */
async function apriEvento(id) {
  nascondiAvviso();
  const modulo = $('modulo-evento');
  mostraVista('caricamento');

  let evento = { pubblicato: false };
  let collegate = [];

  const opere = await client.from('opere').select('id, titolo, anno').order('anno', { ascending: false });
  if (opere.error) {
    avviso(messaggioErrore(opere.error), true);
    mostraElenco();
    return;
  }

  if (id) {
    const { data, error } = await client
      .from('eventi')
      .select('*, eventi_opere(opera_id)')
      .eq('id', id)
      .single();
    if (error) {
      avviso(messaggioErrore(error), true);
      mostraElenco();
      return;
    }
    evento = data;
    collegate = data.eventi_opere.map((c) => c.opera_id);
  }

  modulo.reset();
  modulo.classList.remove('is-verificato');
  modulo.dataset.id = id || '';
  compilaModulo(modulo, evento);
  preparaCodice(modulo, !id);
  preparaImmagini(modulo);

  $('opere-collegate').innerHTML = opere.data.length
    ? opere.data.map((o) => `
        <label class="g-spunta">
          <input type="checkbox" data-opera="${o.id}" ${collegate.includes(o.id) ? 'checked' : ''}>
          <span>${esc(o.titolo)} <small>(${esc(o.anno)})</small></span>
        </label>`).join('')
    : '<p class="g-vuoto">Nessuna opera in archivio.</p>';

  $('titolo-modulo-evento').textContent = id ? evento.titolo : 'Nuovo evento';
  modulo.querySelector('[data-elimina]').hidden = !id;

  stato.modificato = false;
  mostraVista('evento');
}

$('modulo-evento').addEventListener('submit', async (e) => {
  e.preventDefault();
  const modulo = e.currentTarget;
  modulo.classList.add('is-verificato');
  if (!modulo.checkValidity()) {
    modulo.reportValidity();
    return;
  }

  const pulsante = modulo.querySelector('[type=submit]');
  pulsante.disabled = true;
  pulsante.textContent = 'Salvataggio…';
  const id = modulo.dataset.id ? Number(modulo.dataset.id) : null;

  try {
    const dati = leggiModulo(modulo);
    await caricaImmagini(modulo, dati);

    let eventoId = id;
    if (id) {
      const { error } = await client.from('eventi').update(dati).eq('id', id);
      if (error) throw error;
    } else {
      const { data, error } = await client.from('eventi').insert(dati).select('id').single();
      if (error) throw error;
      eventoId = data.id;
    }

    const collegate = [...$('opere-collegate').querySelectorAll('[data-opera]:checked')]
      .map((c) => ({ evento_id: eventoId, opera_id: Number(c.dataset.opera) }));
    const tolti = await client.from('eventi_opere').delete().eq('evento_id', eventoId);
    if (tolti.error) throw tolti.error;
    if (collegate.length) {
      const { error } = await client.from('eventi_opere').insert(collegate);
      if (error) throw error;
    }

    stato.modificato = false;
    avviso(`"${dati.titolo}" salvato${dati.pubblicato ? ' e pubblicato' : ' come bozza'}.`);
    mostraElenco();
  } catch (errore) {
    console.error(errore);
    avviso(messaggioErrore(errore), true);
    window.scrollTo(0, 0);
  } finally {
    pulsante.disabled = false;
    pulsante.textContent = 'Salva';
  }
});

/* --------------------------------------------------------------------------
   Annulla ed elimina, comuni ai due moduli
   -------------------------------------------------------------------------- */
document.querySelectorAll('[data-annulla]').forEach((b) => {
  b.addEventListener('click', () => {
    if (stato.modificato && !confirm('Ci sono modifiche non salvate. Uscire lo stesso?')) return;
    stato.modificato = false;
    nascondiAvviso();
    mostraElenco();
  });
});

document.querySelectorAll('[data-elimina]').forEach((b) => {
  b.addEventListener('click', async () => {
    const modulo = b.closest('form');
    const tabella = modulo.id === 'modulo-opera' ? 'opere' : 'eventi';
    const titolo = modulo.titolo.value;
    const domanda = tabella === 'opere'
      ? `Eliminare definitivamente "${titolo}"? Spariscono anche il suo cast e i collegamenti agli eventi. Per toglierla dal sito senza perderla, togli invece la spunta "Pubblicata".`
      : `Eliminare definitivamente "${titolo}"? Per toglierlo dal sito senza perderlo, togli invece la spunta "Pubblicato".`;
    if (!confirm(domanda)) return;

    const { error } = await client.from(tabella).delete().eq('id', Number(modulo.dataset.id));
    if (error) {
      avviso(messaggioErrore(error), true);
      return;
    }
    stato.modificato = false;
    avviso(`"${titolo}" eliminato.`);
    mostraElenco();
  });
});

// Qualsiasi modifica ai campi segna il modulo come da salvare
document.querySelectorAll('.g-modulo').forEach((m) => {
  m.addEventListener('input', () => { stato.modificato = true; });
});

window.addEventListener('beforeunload', (e) => {
  if (stato.modificato) e.preventDefault();
});

/* --------------------------------------------------------------------------
   Avvio: se c'è già una sessione aperta si entra direttamente
   -------------------------------------------------------------------------- */
(async function avvia() {
  const { data } = await client.auth.getSession();
  aggiornaSessione(data.session);
  client.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_OUT') aggiornaSessione(null);
  });
})();
