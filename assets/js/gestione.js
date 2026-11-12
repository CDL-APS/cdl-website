/* ==========================================================================
   GESTIONE — pagina riservata ai redattori.

   Accesso con email e password (account creati dalla dashboard di Supabase)
   e, per chi l'ha attivato, il codice di un'app di autenticazione. Poi:
   - Dashboard: ciò che richiede una decisione (quota non rinnovata, opere
     senza licenza, foglio non aggiornato), qualche numero, le ultime attività;
   - Proposte: i corti mandati dai soci, da rivedere e pubblicare;
   - Opere ed Eventi: elenco e modifica;
   - Soci: stato della sincronizzazione con il foglio e collegamenti personali.

   Tutte le scritture passano dal client di Supabase con la sessione di chi ha
   fatto l'accesso: le regole del database (RLS) lasciano scrivere solo i
   redattori, qualunque cosa faccia questa pagina.

   Usa da dati.js: BUCKET_IMMAGINI, urlImmagine, urlImmagineLocale, esc,
   indirizzoSicuro.
   Usa da riservato.js: creaClient, $, mostraVista, avviso, nascondiAvviso,
   messaggioErrore, formattaData, formattaDataOra, codiceDaTitolo,
   ridimensiona, aggiungiInterprete, leggiInterpreti, aggiungiRuolo,
   leggiRuoli, riconosciFileTitolo, mimeDaPercorso, descriviRisposte,
   attenzioniRisposte, testoRicevuta, scaricaTesto, TIPI_LICENZA.
   ========================================================================== */

const client = creaClient();

const SPAZIO_PROPOSTE = 'proposte';

const stato = {
  scheda: null,      // scheda mostrata: dashboard, proposte, opere, eventi o soci
  modificato: false, // modifiche non salvate nel modulo aperto
  immagini: {},      // file scelti e non ancora caricati, per nome del campo
  titolo: null,      // titolo grafico scelto e non ancora caricato: { file, tipo }
  avvisi: null,      // risposta di avvisi()
  proposte: [],      // righe di proposte_da_rivedere()
  proposta: null,    // proposta aperta in revisione
  soci: null,        // righe di elenco_soci(), lette una volta per sessione
  titolare: '',      // email del socio a cui era attribuita l'opera aperta
  fattoreInAttesa: null
};

const segnaModificato = () => { stato.modificato = true; };

/* --------------------------------------------------------------------------
   Accesso
   -------------------------------------------------------------------------- */
async function aggiornaSessione(sessione) {
  $('utente').hidden = !sessione;
  $('schede').hidden = true;
  if (!sessione) {
    mostraVista('accesso');
    return;
  }
  $('utente-email').textContent = sessione.user.email;
  mostraVista('caricamento');

  // Chi ha attivato il codice di verifica deve inserirlo: con la sola
  // password il database non lo considera redattore
  const { data: livello } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (livello && livello.nextLevel === 'aal2' && livello.currentLevel !== 'aal2') {
    $('modulo-codice').reset();
    mostraVista('codice');
    $('modulo-codice').codice.focus();
    return;
  }

  const { data: redattore, error } = await client.rpc('sono_redattore');
  if (error || !redattore) {
    mostraVista('negato');
    return;
  }
  $('schede').hidden = false;
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

$('modulo-codice').addEventListener('submit', async (e) => {
  e.preventDefault();
  const modulo = e.currentTarget;
  nascondiAvviso();

  const { data: fattori } = await client.auth.mfa.listFactors();
  const fattore = fattori?.totp?.[0];
  if (!fattore) {
    avviso('Nessun codice attivo per questo account.', true);
    return;
  }
  const { error } = await client.auth.mfa.challengeAndVerify({
    factorId: fattore.id,
    code: modulo.codice.value.trim()
  });
  if (error) {
    avviso('Codice non valido: riprova con quello che l\'app mostra adesso.', true);
    modulo.codice.select();
    return;
  }
  const { data } = await client.auth.getSession();
  aggiornaSessione(data.session);
});

$('esci').addEventListener('click', async () => {
  if (stato.modificato && !confirm('Ci sono modifiche non salvate. Uscire lo stesso?')) return;
  stato.modificato = false;
  await client.auth.signOut({ scope: 'local' });
  aggiornaSessione(null);
});

/* --------------------------------------------------------------------------
   Sicurezza: codice di verifica (TOTP)
   -------------------------------------------------------------------------- */
async function mostraSicurezza() {
  nascondiAvviso();
  mostraVista('sicurezza');
  $('sicurezza-attiva').hidden = true;
  $('sicurezza-avvia').hidden = true;
  $('sicurezza-togli').hidden = true;
  $('sicurezza-stato').textContent = 'Controllo…';

  const { data, error } = await client.auth.mfa.listFactors();
  if (error) {
    $('sicurezza-stato').textContent = messaggioErrore(error);
    return;
  }
  const attivo = (data.totp || []).find((f) => f.status === 'verified');
  if (attivo) {
    $('sicurezza-stato').textContent =
      'Il codice di verifica è attivo: per entrare servono la password e il codice dell\'app. Chi conosce solo la password non può modificare nulla.';
    $('sicurezza-togli').hidden = false;
    $('sicurezza-togli').dataset.fattore = attivo.id;
  } else {
    $('sicurezza-stato').textContent =
      'Il codice di verifica non è attivo: oggi per entrare basta la password. Attivalo: da quel momento servirà anche il codice che un\'app sul tuo telefono genera ogni trenta secondi.';
    $('sicurezza-avvia').hidden = false;
  }
}

$('apri-sicurezza').addEventListener('click', () => {
  if (stato.modificato && !confirm('Ci sono modifiche non salvate. Uscire lo stesso?')) return;
  stato.modificato = false;
  mostraSicurezza();
});

$('sicurezza-chiudi').addEventListener('click', async () => {
  const { data } = await client.auth.getSession();
  aggiornaSessione(data.session);
});

$('sicurezza-avvia').addEventListener('click', async () => {
  nascondiAvviso();
  // Tentativi lasciati a metà: si tolgono, altrimenti Supabase rifiuta il nuovo
  const { data: fattori } = await client.auth.mfa.listFactors();
  for (const f of (fattori?.all || []).filter((x) => x.status === 'unverified')) {
    await client.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Gestione CDL ' + new Date().toISOString().slice(0, 16)
  });
  if (error) {
    avviso(messaggioErrore(error), true);
    return;
  }
  stato.fattoreInAttesa = data.id;
  $('sicurezza-qr').src = data.totp.qr_code;
  $('sicurezza-chiave').textContent = data.totp.secret;
  $('modulo-attiva').reset();
  $('sicurezza-avvia').hidden = true;
  $('sicurezza-attiva').hidden = false;
});

$('modulo-attiva').addEventListener('submit', async (e) => {
  e.preventDefault();
  nascondiAvviso();
  const { error } = await client.auth.mfa.challengeAndVerify({
    factorId: stato.fattoreInAttesa,
    code: e.currentTarget.codice.value.trim()
  });
  if (error) {
    avviso('Codice non valido: riprova con quello che l\'app mostra adesso.', true);
    return;
  }
  stato.fattoreInAttesa = null;
  avviso('Codice di verifica attivato.');
  mostraSicurezza();
});

$('sicurezza-togli').addEventListener('click', async (e) => {
  if (!confirm('Disattivare il codice di verifica? Da quel momento per entrare basterà la password.')) return;
  const { error } = await client.auth.mfa.unenroll({ factorId: e.currentTarget.dataset.fattore });
  if (error) {
    avviso(messaggioErrore(error), true);
    return;
  }
  await client.auth.refreshSession();
  avviso('Codice di verifica disattivato.');
  mostraSicurezza();
});

/* --------------------------------------------------------------------------
   Da sistemare
   -------------------------------------------------------------------------- */
async function caricaAvvisi() {
  const { data, error } = await client.rpc('avvisi');
  if (error) {
    console.error(error);
    return null;
  }
  stato.avvisi = data;

  const attesa = data.proposte_in_attesa.length;
  $('conta-proposte').textContent = attesa;
  $('conta-proposte').hidden = !attesa;

  const voci = [];
  const voce = (testo, azione, etichetta, id) => {
    voci.push(`<li><span>${esc(testo)}</span>${
      azione ? `<button type="button" class="btn" data-avviso="${azione}" data-id="${id ?? ''}">${esc(etichetta)}</button>` : ''
    }</li>`);
  };

  const sync = data.sincronizzazione || {};
  if (!sync.quando) {
    voce('Il foglio dei soci non è ancora collegato: senza, il sito non sa chi è in regola con la quota.', 'soci', 'Vai a Soci');
  } else if (sync.vecchia) {
    voce(`Il foglio dei soci non si aggiorna dal ${formattaDataOra(sync.quando)}.`, 'soci', 'Vai a Soci');
  }
  if (sync.senza_email?.length) {
    voce(`Soci senza email nel foglio, non possono ricevere il collegamento: ${sync.senza_email.join(', ')}.`);
  }
  data.non_in_regola.forEach((o) => {
    voce(`«${o.titolo}» è online, ma ${o.socio} non ha rinnovato la quota.`, 'nascondi', 'Nascondi', o.opera_id);
  });
  data.da_ripubblicare.forEach((o) => {
    voce(`«${o.titolo}» era nascosta per la quota: ${o.socio} ha rinnovato.`, 'ripubblica', 'Ripubblica', o.opera_id);
  });
  data.senza_licenza.forEach((o) => {
    let testo;
    if (o.solo_scheda) {
      testo = `«${o.titolo}» ha il video, ma ${o.socio || 'il socio'} ha autorizzato solo la scheda: togli il video, o chiedigli di confermare la licenza per lo streaming dalla sua pagina.`;
    } else if (o.socio) {
      testo = `«${o.titolo}» è online senza ${o.serve === 'scheda' ? 'autorizzazione' : 'licenza'}: manda a ${o.socio} il suo collegamento perché la confermi.`;
    } else {
      testo = `«${o.titolo}» è online senza licenza: indica a quale socio appartiene.`;
    }
    voce(testo, 'apri', 'Apri', o.opera_id);
  });
  data.revoche_recenti.forEach((r) => {
    voce(`${r.socio} ha ritirato «${r.titolo}» il ${formattaData(r.quando)}.`);
  });

  $('elenco-avvisi').innerHTML = voci.length
    ? voci.join('')
    : '<li class="g-vuoto">Niente da sistemare.</li>';
  $('avvisi-segno').hidden = !voci.length;
  $('conta-avvisi').textContent = voci.length;
  $('conta-avvisi').hidden = !voci.length;
  return data;
}

$('elenco-avvisi').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-avviso]');
  if (!b) return;
  const id = Number(b.dataset.id);
  const azione = b.dataset.avviso;

  if (azione === 'soci') {
    stato.scheda = 'soci';
    mostraElenco();
  } else if (azione === 'apri') {
    apriOpera(id);
  } else if (azione === 'nascondi') {
    if (!confirm('Nascondere quest\'opera dalla Cortoteca? Il regolamento chiede di avvisare prima il socio. Scheda e licenza restano conservate: tornerà visibile al rinnovo.')) return;
    const { error } = await client.rpc('nascondi_per_quota', { p_opera_id: id });
    if (error) avviso(messaggioErrore(error), true);
    else avviso('Opera nascosta.');
    mostraElenco();
  } else if (azione === 'ripubblica') {
    const { error } = await client.rpc('ripubblica_opera', { p_opera_id: id });
    if (error) avviso(messaggioErrore(error), true);
    else avviso('Opera di nuovo in Cortoteca.');
    mostraElenco();
  }
});

/* --------------------------------------------------------------------------
   Elenchi
   -------------------------------------------------------------------------- */
/* Le schede stanno nella barra e restano cliccabili anche da un modulo
   aperto: in quel caso si chiede prima di perdere le modifiche */
document.querySelectorAll('.g-scheda').forEach((b) => {
  b.addEventListener('click', () => {
    if (stato.modificato && !confirm('Ci sono modifiche non salvate. Uscire lo stesso?')) return;
    stato.modificato = false;
    nascondiAvviso();
    stato.scheda = b.dataset.scheda;
    mostraElenco();
  });
});

const SCHEDE = {
  dashboard: ['Dashboard', 'Ciò che aspetta una decisione, lo stato della Cortoteca e le ultime cose successe.'],
  proposte: ['Proposte', 'I corti che i soci mandano dalla loro pagina. Si rileggono, si approvano e vanno in Cortoteca.'],
  opere: ['Opere', 'Tutte le opere del sito, pubblicate e non. Le produzioni CDL e i corti dei soci.'],
  eventi: ['Eventi', 'Gli eventi del sito, pubblicati e non, con i corti nati da ciascuno.'],
  soci: ['Soci', 'Il libro soci arriva dal foglio Google. Da qui si manda a ciascuno il collegamento personale per la Cortoteca.']
};

function segnaScheda() {
  document.querySelectorAll('.g-scheda').forEach((b) => {
    const attiva = b.dataset.scheda === stato.scheda;
    b.classList.toggle('is-active', attiva);
    if (attiva) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  const [titolo, nota] = SCHEDE[stato.scheda];
  $('titolo-scheda').textContent = titolo;
  $('nota-scheda').textContent = nota;
}

$('nuovo').addEventListener('click', () => {
  if (stato.scheda === 'opere') apriOpera(null);
  else apriEvento(null);
});

async function mostraElenco() {
  mostraVista('elenco');
  const elenco = $('elenco');
  elenco.innerHTML = '<li class="g-vuoto">Caricamento…</li>';

  // Alla prima apertura si parte dalla Dashboard
  if (!stato.scheda) stato.scheda = 'dashboard';
  segnaScheda();
  $('nuovo').hidden = !['opere', 'eventi'].includes(stato.scheda);
  $('nuovo').textContent = stato.scheda === 'eventi' ? 'Nuovo evento' : 'Nuova opera';
  $('pannello-soci').hidden = stato.scheda !== 'soci';
  $('cruscotto').hidden = stato.scheda !== 'dashboard';
  $('elenco').hidden = stato.scheda === 'dashboard';

  // Gli avvisi servono sempre: contatore nella barra, segni negli elenchi
  await caricaAvvisi();

  if (stato.scheda === 'dashboard') return mostraCruscotto();
  if (stato.scheda === 'proposte') return elencoProposte();
  if (stato.scheda === 'soci') return elencoSoci();
  return elencoOpereEventi();
}

async function elencoOpereEventi() {
  const elenco = $('elenco');
  const scheda = stato.scheda;

  const richiesta = scheda === 'opere'
    ? client.from('opere')
        .select('id, titolo, anno, regista, produzione_cdl, collaborazione_cdl, pubblicata')
        .order('anno', { ascending: false })
        .order('id', { ascending: false })
    : client.from('eventi')
        .select('id, titolo, data_inizio, luogo, pubblicato')
        .order('data_inizio', { ascending: false });

  const { data, error } = await richiesta;
  if (stato.scheda !== scheda) return;
  if (error) {
    elenco.innerHTML = `<li class="g-vuoto">${esc(messaggioErrore(error))}</li>`;
    return;
  }
  if (!data.length) {
    elenco.innerHTML = '<li class="g-vuoto">Ancora niente: usa il pulsante qui sopra.</li>';
    return;
  }

  const senzaLicenza = new Set((stato.avvisi?.senza_licenza || []).map((o) => o.opera_id));

  elenco.innerHTML = data.map((r) => {
    const pubblicato = scheda === 'opere' ? r.pubblicata : r.pubblicato;
    const dati = scheda === 'opere'
      ? `${esc(r.anno)} · ${esc(r.regista)}`
      : [formattaData(r.data_inizio), r.luogo].filter(Boolean).map(esc).join(' · ');
    const segni = [
      r.produzione_cdl ? '<span class="g-segno">CDL</span>' : '',
      r.collaborazione_cdl ? '<span class="g-segno">Collab.</span>' : '',
      scheda === 'opere' && senzaLicenza.has(r.id) ? '<span class="g-segno g-segno--allarme">Senza licenza</span>' : '',
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
      if (scheda === 'opere') apriOpera(id);
      else apriEvento(id);
    });
  });
}

/* --------------------------------------------------------------------------
   Dashboard: numeri e ultime attività (funzione cruscotto() del database)
   -------------------------------------------------------------------------- */
const NOMI_ATTIVITA = {
  proposta: 'Proposta',
  decisione: 'Revisione',
  licenza: 'Licenza',
  revoca: 'Revoca',
  collegamento: 'Collegamento',
  opera: 'Opera',
  evento: 'Evento',
  quota: 'Quota',
  foglio: 'Foglio soci'
};

function quandoBreve(iso) {
  const data = new Date(iso);
  const oggi = new Date();
  const ieri = new Date(oggi);
  ieri.setDate(oggi.getDate() - 1);
  const ora = data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  if (data.toDateString() === oggi.toDateString()) return 'oggi, ' + ora;
  if (data.toDateString() === ieri.toDateString()) return 'ieri, ' + ora;
  return data.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: data.getFullYear() === oggi.getFullYear() ? undefined : 'numeric' });
}

async function mostraCruscotto() {
  $('numeri').innerHTML = '';
  $('attivita').innerHTML = '<li class="g-vuoto">Caricamento…</li>';
  const { data, error } = await client.rpc('cruscotto', { p_quante: 40 });
  if (stato.scheda !== 'dashboard') return;
  if (error) {
    $('attivita').innerHTML = `<li class="g-vuoto">${esc(messaggioErrore(error))}</li>`;
    return;
  }

  const n = data.numeri;
  const numeri = [
    [n.proposte_in_attesa, 'proposte da rivedere', n.bozze_soci ? `${n.bozze_soci} in preparazione dai soci` : 'nessuna in preparazione', 'proposte'],
    [n.opere_online, 'opere online', `${n.con_video} in streaming · ${n.corti_soci} dei soci`, 'opere'],
    [n.soci_in_regola, `soci in regola su ${n.soci}`, `quota ${new Date().getFullYear()}`, 'soci'],
    [n.collegamenti, 'collegamenti consegnati', `${n.collegamenti_usati} già usati`, 'soci'],
    [n.eventi_online, 'eventi online', '', 'eventi']
  ];
  $('numeri').innerHTML = numeri.map(([valore, cosa, dettaglio, scheda]) => `
    <button type="button" class="g-numero" data-vai="${scheda}">
      <span class="g-numero-valore">${esc(valore)}</span>
      <span class="g-numero-cosa">${esc(cosa)}</span>
      ${dettaglio ? `<span class="g-numero-dettaglio">${esc(dettaglio)}</span>` : ''}
    </button>`).join('');

  $('attivita').innerHTML = data.attivita.length
    ? data.attivita.map((a) => `
      <li>
        <time datetime="${esc(a.quando)}">${esc(quandoBreve(a.quando))}</time>
        <span class="g-attivita-tipo">${esc(NOMI_ATTIVITA[a.tipo] || a.tipo)}</span>
        <span>${esc(a.testo)}</span>
      </li>`).join('')
    : '<li class="g-vuoto">Ancora niente.</li>';
}

$('numeri').addEventListener('click', (e) => {
  const b = e.target.closest('[data-vai]');
  if (!b) return;
  stato.scheda = b.dataset.vai;
  mostraElenco();
});

/* --------------------------------------------------------------------------
   Proposte dei soci
   -------------------------------------------------------------------------- */
const STATI_PROPOSTA = {
  inviata: ['Da rivedere', 'g-segno--pubblicata'],
  da_rivedere: ['Modifiche chieste', 'g-segno--bozza'],
  approvata: ['Pubblicata', ''],
  rifiutata: ['Rifiutata', ''],
  ritirata: ['Ritirata dal socio', '']
};

async function elencoProposte() {
  const elenco = $('elenco');
  const { data, error } = await client.rpc('proposte_da_rivedere');
  if (stato.scheda !== 'proposte') return;
  if (error) {
    elenco.innerHTML = `<li class="g-vuoto">${esc(messaggioErrore(error))}</li>`;
    return;
  }
  stato.proposte = data;
  if (!data.length) {
    elenco.innerHTML = '<li class="g-vuoto">Nessuna proposta. I soci propongono dal loro collegamento personale: lo trovi nella scheda Soci.</li>';
    return;
  }

  elenco.innerHTML = data.map((p) => {
    const [etichetta, classe] = STATI_PROPOSTA[p.stato] || [p.stato, ''];
    const apribile = p.stato === 'inviata' || (p.stato === 'approvata' && p.opera_id);
    const dati = [
      p.socio_nome || p.socio_email,
      p.inviata_il ? 'inviata il ' + formattaData(p.inviata_il) : ''
    ].filter(Boolean).map(esc).join(' · ');
    const segni =
      (p.stato === 'inviata' && !p.socio_in_regola ? '<span class="g-segno g-segno--allarme">Quota non in regola</span>' : '') +
      `<span class="g-segno ${classe}">${esc(etichetta)}</span>`;
    const contenuto = `
        <span class="g-riga-titolo">${esc(p.dati.titolo || 'Senza titolo')}</span>
        <span class="g-riga-dati">${dati}${p.nota_revisione ? ' · «' + esc(p.nota_revisione) + '»' : ''}</span>
        <span class="g-segni">${segni}</span>`;
    return apribile
      ? `<li><button type="button" class="g-riga" data-id="${p.id}">${contenuto}</button></li>`
      : `<li><div class="g-riga g-riga--ferma">${contenuto}</div></li>`;
  }).join('');

  elenco.querySelectorAll('button.g-riga').forEach((riga) => {
    riga.addEventListener('click', () => {
      const proposta = stato.proposte.find((p) => p.id === Number(riga.dataset.id));
      if (proposta.stato === 'inviata') apriRevisione(proposta);
      else apriOpera(proposta.opera_id);
    });
  });
}

/* --------------------------------------------------------------------------
   Soci
   -------------------------------------------------------------------------- */
async function caricaSoci(daCapo = false) {
  if (stato.soci && !daCapo) return stato.soci;
  const { data, error } = await client.rpc('elenco_soci');
  if (error) throw error;
  stato.soci = data;
  return data;
}

async function elencoSoci() {
  const elenco = $('elenco');
  const sync = stato.avvisi?.sincronizzazione || {};
  $('stato-sync').textContent = sync.quando
    ? `${sync.righe} soci del ${sync.anno}, aggiornati dal foglio il ${formattaDataOra(sync.quando)}.`
    : 'Il foglio dei soci non è ancora collegato.';
  $('collega-foglio').open = !sync.quando;

  let soci;
  try {
    soci = await caricaSoci(true);
  } catch (errore) {
    elenco.innerHTML = `<li class="g-vuoto">${esc(messaggioErrore(errore))}</li>`;
    return;
  }
  if (stato.scheda !== 'soci') return;
  if (!soci.length) {
    elenco.innerHTML = '<li class="g-vuoto">Nessun socio: collega il foglio e sincronizza.</li>';
    return;
  }

  elenco.innerHTML = soci.map((s, i) => {
    const quota = s.pagato
      ? 'quota ' + s.anno + (s.data_pagamento ? ' pagata il ' + formattaData(s.data_pagamento) : ' pagata')
      : 'quota ' + s.anno + ' non pagata';
    const accesso = s.ultimo_accesso
      ? 'entrato il ' + formattaData(s.ultimo_accesso)
      : s.invito_creato_il ? 'collegamento creato il ' + formattaData(s.invito_creato_il) : '';
    const dati = ['n. ' + s.numero, s.email || 'senza email', quota, accesso].filter(Boolean).map(esc).join(' · ');
    return `
      <li>
        <div class="g-riga g-riga--ferma">
          <span class="g-riga-titolo">${esc(s.nome)}</span>
          <span class="g-riga-dati">${dati}</span>
          <span class="g-segni">
            <span class="g-segno ${s.in_regola ? 'g-segno--pubblicata' : 'g-segno--allarme'}">${s.in_regola ? 'In regola' : 'Non in regola'}</span>
            <button type="button" class="btn" data-invito="${i}" ${s.email ? '' : 'disabled'}>${s.invito_creato_il ? 'Nuovo collegamento' : 'Copia il collegamento'}</button>
          </span>
        </div>
      </li>`;
  }).join('');
}

/* Crea il collegamento personale di un socio e lo copia, già dentro un
   messaggio pronto da incollare. Il collegamento si vede una volta sola. */
$('elenco').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-invito]');
  if (!b) return;
  const socio = stato.soci[Number(b.dataset.invito)];
  if (socio.invito_creato_il &&
      !confirm(`${socio.nome} ha già un collegamento, creato il ${formattaData(socio.invito_creato_il)}. Crearne uno nuovo annulla il precedente. Continuare?`)) {
    return;
  }

  const { data: segreto, error } = await client.rpc('crea_invito', { p_email: socio.email });
  if (error) {
    avviso(messaggioErrore(error), true);
    return;
  }
  const indirizzo = `${location.origin}/proponi.html#invito=${segreto}`;
  const messaggio =
    `Ciao ${socio.nome.split(' ')[0]}! Questo è il tuo collegamento personale per proporre i tuoi corti alla Cortoteca di CDL:\n` +
    `${indirizzo}\n` +
    'È solo tuo, non girarlo ad altri: vale come la tua firma.';
  try {
    await navigator.clipboard.writeText(messaggio);
    avviso(`Messaggio copiato: incollalo in una chat con ${socio.nome}.`);
  } catch {
    prompt('Copia il collegamento e mandalo al socio:', indirizzo);
  }
  elencoSoci();
});

$('modulo-chiave').addEventListener('submit', async (e) => {
  e.preventDefault();
  const modulo = e.currentTarget;
  const { error } = await client.rpc('imposta_chiave_sync', { p_impronta: modulo.impronta.value.trim() });
  if (error) {
    avviso(messaggioErrore(error), true);
    return;
  }
  modulo.reset();
  avviso('Foglio collegato. Ora nel foglio scegli Cortoteca → Sincronizza soci ora.');
});

/* --------------------------------------------------------------------------
   Campi dei moduli
   -------------------------------------------------------------------------- */

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

/* `iniziali` sono immagini già pronte da caricare al salvataggio: serve alla
   revisione, dove il fotogramma arriva dallo spazio privato delle proposte */
function preparaImmagini(modulo, iniziali = {}) {
  stato.immagini = iniziali;
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

/* Titolo grafico dell'opera: un PNG o un carattere tipografico, nei campi
   nascosti titolo_png e titolo_font. Si carica com'è, senza conversioni.
   `iniziale` è il file della proposta in revisione, da copiare al
   salvataggio. */
function preparaTitolo(modulo, iniziale = null) {
  stato.titolo = iniziale;
  const png = modulo.titolo_png;
  const font = modulo.titolo_font;
  const anteprima = $('titolo-anteprima');
  const nome = $('titolo-font-nome');

  const aggiorna = () => {
    const scelto = stato.titolo;
    anteprima.hidden = true;
    nome.hidden = true;
    if (scelto?.tipo === 'png') {
      anteprima.src = URL.createObjectURL(scelto.file);
      anteprima.hidden = false;
    } else if (scelto?.tipo === 'font') {
      nome.textContent = 'Carattere: ' + (scelto.nome || 'file del font') + ' (da caricare al salvataggio)';
      nome.hidden = false;
    } else if (png.value) {
      anteprima.src = urlImmagine(png.value);
      anteprima.hidden = false;
    } else if (font.value) {
      nome.textContent = 'Carattere: ' + font.value.split('/').pop();
      nome.hidden = false;
    }
    $('titolo-togli').hidden = !(scelto || png.value || font.value);
  };

  $('titolo-file').value = '';
  $('titolo-file').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const tipo = riconosciFileTitolo(file);
      stato.titolo = { file, tipo: tipo.tipo, estensione: tipo.estensione, mime: tipo.mime, nome: file.name };
      stato.modificato = true;
      aggiorna();
    } catch (errore) {
      avviso(errore.message, true);
    }
  };
  $('titolo-togli').onclick = () => {
    stato.titolo = null;
    png.value = '';
    font.value = '';
    stato.modificato = true;
    aggiorna();
  };
  aggiorna();
}

async function caricaTitolo(modulo, dati) {
  const scelto = stato.titolo;
  if (!scelto) return;
  const percorso = `titoli/${dati.codice}-${scelto.tipo}-${Date.now()}.${scelto.estensione}`;
  const { error } = await client.storage.from(BUCKET_IMMAGINI).upload(percorso, scelto.file, {
    contentType: scelto.mime,
    cacheControl: '31536000',
    upsert: false
  });
  if (error) throw error;
  dati.titolo_png = scelto.tipo === 'png' ? percorso : null;
  dati.titolo_font = scelto.tipo === 'font' ? percorso : null;
  modulo.titolo_png.value = dati.titolo_png || '';
  modulo.titolo_font.value = dati.titolo_font || '';
  stato.titolo = null;
}

/* --------------------------------------------------------------------------
   Opera
   -------------------------------------------------------------------------- */
$('aggiungi-interprete').addEventListener('click', () => {
  aggiungiInterprete({}, segnaModificato).querySelector('[data-nome]').focus();
  stato.modificato = true;
});

$('aggiungi-ruolo').addEventListener('click', () => {
  aggiungiRuolo({}, segnaModificato).querySelector('[data-ruolo]').focus();
  stato.modificato = true;
});

/* Riporta il modulo dell'opera al suo aspetto normale (fuori revisione) */
function moduloOperaNormale(modulo) {
  stato.proposta = null;
  modulo.dataset.proposta = '';
  modulo.video_url.disabled = false;
  $('revisione').hidden = true;
  $('gruppo-socio').hidden = false;
  $('salva-opera').textContent = 'Salva';
  $('chiedi-modifiche').hidden = true;
  $('rifiuta-proposta').hidden = true;
}

/* Menu dei soci a cui attribuire un'opera, con la nota sulla licenza */
async function preparaTitolare(operaId) {
  const menu = $('socio-titolare');
  const nota = $('socio-titolare-nota');
  const notaBase = 'Per le opere dei soci: serve a chiedere la licenza e a controllare la quota. Lascia vuoto per le produzioni CDL.';
  stato.titolare = '';
  menu.innerHTML = '<option value="">Nessuno</option>';
  nota.textContent = notaBase;

  let soci = [];
  let titolari = [];
  try {
    soci = await caricaSoci();
    const risposta = await client.rpc('opere_titolari');
    if (risposta.error) throw risposta.error;
    titolari = risposta.data;
  } catch (errore) {
    nota.textContent = messaggioErrore(errore);
    return;
  }

  const titolare = operaId ? titolari.find((t) => t.opera_id === operaId) : null;
  const voci = soci.filter((s) => s.email).map((s) => [s.email, `${s.nome} — n. ${s.numero} del ${s.anno}`]);
  if (titolare && !voci.some(([email]) => email === titolare.email)) {
    voci.push([titolare.email, `${titolare.nome || titolare.email} — non più nel foglio`]);
  }
  menu.innerHTML = '<option value="">Nessuno</option>' +
    voci.map(([email, testo]) => `<option value="${esc(email)}">${esc(testo)}</option>`).join('');

  if (titolare) {
    stato.titolare = titolare.email;
    menu.value = titolare.email;
    nota.textContent = titolare.licenza_attiva
      ? 'Licenza registrata.'
      : 'Manca la licenza: manda al socio il suo collegamento (scheda Soci). La confermerà dalla sua pagina, senza rifare la scheda.';
  }
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
  moduloOperaNormale(modulo);
  compilaModulo(modulo, opera);
  preparaCodice(modulo, !id);
  preparaImmagini(modulo);
  preparaTitolo(modulo);

  $('interpreti').innerHTML = '';
  interpreti.forEach((i) => aggiungiInterprete(i, segnaModificato));
  $('altri-ruoli').innerHTML = '';
  (opera.altri_ruoli || []).forEach((r) => aggiungiRuolo(r, segnaModificato));

  $('titolo-modulo-opera').textContent = id ? opera.titolo : 'Nuova opera';
  modulo.querySelector('[data-elimina]').hidden = !id;
  const vedi = $('vedi-opera');
  vedi.hidden = !(id && opera.pubblicata);
  vedi.href = 'opera.html?film=' + encodeURIComponent(opera.codice || '');

  await preparaTitolare(id);
  stato.modificato = false;
  mostraVista('opera');
}

/* Un'opera è o una produzione CDL o una collaborazione, non entrambe (lo
   impone anche il database): spuntarne una toglie l'altra */
['produzione_cdl', 'collaborazione_cdl'].forEach((nome, i, coppia) => {
  const casella = $('modulo-opera')[nome];
  const altra = $('modulo-opera')[coppia[1 - i]];
  casella.addEventListener('change', () => {
    if (casella.checked) altra.checked = false;
  });
});

/* --------------------------------------------------------------------------
   Revisione di una proposta: lo stesso modulo dell'opera, già compilato con
   ciò che ha scritto il socio, più il riquadro con socio, quota e licenza
   -------------------------------------------------------------------------- */
function indirizzoPosta(email, oggetto, testo) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`;
}

async function apriRevisione(proposta) {
  nascondiAvviso();
  mostraVista('caricamento');
  const modulo = $('modulo-opera');
  const dati = proposta.dati || {};
  const licenza = proposta.licenza;

  // Fotogramma: dallo spazio privato delle proposte. Al salvataggio viene
  // caricato in quello pubblico come qualsiasi immagine scelta a mano.
  const iniziali = {};
  if (dati.fotogramma) {
    const { data: blob } = await client.storage.from(SPAZIO_PROPOSTE).download(dati.fotogramma);
    if (blob) iniziali.fotogramma = blob;
  }
  // Titolo grafico: anche lui dallo spazio privato, copiato così com'è
  let titolo = null;
  const percorsoTitolo = dati.titolo_png || dati.titolo_font;
  if (percorsoTitolo) {
    const { data: blob } = await client.storage.from(SPAZIO_PROPOSTE).download(percorsoTitolo);
    if (blob) {
      const estensione = percorsoTitolo.split('.').pop().toLowerCase();
      titolo = {
        file: blob,
        tipo: dati.titolo_png ? 'png' : 'font',
        estensione,
        mime: mimeDaPercorso(percorsoTitolo),
        nome: dati.titolo_font_nome || percorsoTitolo.split('/').pop()
      };
    }
  }
  const soloScheda = (licenza?.tipo || dati.modalita) === 'scheda';

  modulo.reset();
  modulo.classList.remove('is-verificato');
  modulo.dataset.id = '';
  moduloOperaNormale(modulo);
  stato.proposta = proposta;
  modulo.dataset.proposta = proposta.id;

  compilaModulo(modulo, {
    ...dati,
    codice: codiceDaTitolo(dati.titolo || ''),
    fotogramma: '',
    titolo_png: '',
    titolo_font: '',
    video_url: soloScheda ? '' : dati.video_url,
    produzione_cdl: false,
    collaborazione_cdl: false,
    pubblicata: true
  });
  preparaCodice(modulo, true);
  preparaImmagini(modulo, iniziali);
  preparaTitolo(modulo, titolo);
  // Con la sola scheda autorizzata il video non si può aggiungere
  modulo.video_url.disabled = soloScheda;

  $('interpreti').innerHTML = '';
  (dati.interpreti || []).forEach((i) => aggiungiInterprete(i, segnaModificato));
  $('altri-ruoli').innerHTML = '';
  (dati.altri_ruoli || []).forEach((r) => aggiungiRuolo(r, segnaModificato));

  // Riquadro di revisione
  const righe = [
    ['Socio', `${proposta.socio_nome || 'non trovato nel foglio'}${proposta.socio_numero ? `, tessera n. ${proposta.socio_numero} del ${proposta.socio_anno}` : ''} — ${proposta.socio_email}`],
    ['Quota', proposta.socio_in_regola
      ? 'in regola' + (proposta.socio_pagato_il ? `, pagata il ${formattaData(proposta.socio_pagato_il)}` : '')
      : 'NON in regola'],
    ['Pubblicazione', soloScheda ? 'solo la scheda, senza video' : 'scheda e streaming'],
    [licenza?.tipo === 'scheda' ? 'Autorizzazione' : 'Licenza', licenza && !licenza.revocata_il
      ? `accettata il ${formattaDataOra(licenza.accettata_il)} da ${licenza.nome_dichiarato}, versione ${licenza.versione_testo}, registrazione n. ${licenza.id}`
      : 'mancante'],
    ['Uso promozionale', licenza?.uso_promozionale ? 'autorizzato' : 'non autorizzato'],
    ...descriviRisposte(licenza?.risposte)
  ];
  $('revisione-dati').innerHTML = righe
    .map(([nome, valore]) => `<div><dt>${esc(nome)}</dt><dd>${esc(valore)}</dd></div>`)
    .join('');

  const attenzioni = attenzioniRisposte(licenza?.risposte);
  if (!proposta.socio_in_regola) attenzioni.unshift('Il socio non è in regola con la quota: finché il foglio non dice il contrario, la proposta non si può pubblicare.');
  if (dati.fotogramma && !iniziali.fotogramma) attenzioni.push('Non sono riuscito a leggere il fotogramma: caricane uno a mano.');
  if (percorsoTitolo && !titolo) attenzioni.push('Non sono riuscito a leggere il titolo grafico: chiedilo al socio.');
  if (dati.titolo_font) attenzioni.push('Il titolo arriva come carattere tipografico: il socio dichiara che la sua licenza ne consente l\'uso sul web.');
  if (soloScheda) attenzioni.push('Il socio ha autorizzato solo la scheda: niente video. Per lo streaming dovrà accettare la licenza completa.');
  const elencoAttenzioni = $('revisione-attenzioni');
  elencoAttenzioni.innerHTML = attenzioni.map((a) => `<li>${esc(a)}</li>`).join('');
  const file = indirizzoSicuro(dati.file_url);
  if (!soloScheda && !dati.video_url && file) {
    const li = document.createElement('li');
    li.append('Il socio non ha il video online. Scarica il file, caricalo sul canale di CDL come non in elenco e incolla qui sotto il collegamento: ');
    const a = document.createElement('a');
    a.href = file;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'apri il file';
    li.append(a);
    elencoAttenzioni.append(li);
  }
  elencoAttenzioni.hidden = !elencoAttenzioni.children.length;

  $('revisione-scrivi').href = indirizzoPosta(
    proposta.socio_email,
    `Cortoteca: «${dati.titolo || 'la tua proposta'}»`,
    `Ciao ${(proposta.socio_nome || '').split(' ')[0]},\n\n`
  );
  $('revisione-ricevuta').hidden = !licenza;
  $('revisione').hidden = false;

  $('titolo-modulo-opera').textContent = 'Proposta: ' + (dati.titolo || 'senza titolo');
  $('vedi-opera').hidden = true;
  $('gruppo-socio').hidden = true;
  modulo.querySelector('[data-elimina]').hidden = true;
  $('salva-opera').textContent = 'Approva e pubblica';
  $('chiedi-modifiche').hidden = false;
  $('rifiuta-proposta').hidden = false;

  stato.modificato = false;
  mostraVista('opera');
}

$('revisione-ricevuta').addEventListener('click', async () => {
  const licenza = stato.proposta?.licenza;
  if (!licenza) return;
  const { data } = await client.from('testi_licenza').select('testo').eq('versione', licenza.versione_testo).single();
  scaricaTesto(`ricevuta-cortoteca-${licenza.id}.txt`, testoRicevuta(licenza, data?.testo));
});

/* Chiede o rifiuta: il messaggio compare nella pagina del socio. Niente
   email automatiche: dopo, la pagina propone di scrivergli. */
async function decidi(funzione, domanda, esito) {
  const proposta = stato.proposta;
  if (!proposta) return;
  const nota = prompt(domanda);
  if (nota === null) return;
  if (!nota.trim()) {
    avviso('Scrivi un messaggio per il socio.', true);
    return;
  }
  const { error } = await client.rpc(funzione, { p_id: proposta.id, p_nota: nota.trim() });
  if (error) {
    avviso(messaggioErrore(error), true);
    window.scrollTo(0, 0);
    return;
  }
  stato.modificato = false;
  const titolo = proposta.dati.titolo || 'la tua proposta';
  if (confirm(`${esito} Il socio lo vede nella sua pagina, ma nessuno lo avvisa: vuoi scrivergli ora?`)) {
    location.href = indirizzoPosta(
      proposta.socio_email,
      `Cortoteca: «${titolo}»`,
      `Ciao ${(proposta.socio_nome || '').split(' ')[0]},\n\nabbiamo guardato «${titolo}».\n\n${nota.trim()}\n\nTrovi tutto nella tua pagina della Cortoteca, dal tuo collegamento personale.\n`
    );
  }
  mostraElenco();
}

$('chiedi-modifiche').addEventListener('click', () => {
  decidi('chiedi_modifiche', 'Che cosa deve correggere il socio? Il messaggio compare nella sua pagina.', 'Richiesta registrata.');
});

$('rifiuta-proposta').addEventListener('click', () => {
  decidi('rifiuta_proposta', 'Perché la proposta non viene accolta? Il messaggio compare nella pagina del socio.', 'Proposta rifiutata.');
});

$('modulo-opera').addEventListener('submit', async (e) => {
  e.preventDefault();
  const modulo = e.currentTarget;
  modulo.classList.add('is-verificato');
  if (!modulo.checkValidity()) {
    modulo.reportValidity();
    return;
  }

  const pulsante = $('salva-opera');
  const etichetta = pulsante.textContent;
  pulsante.disabled = true;
  pulsante.textContent = 'Salvataggio…';
  const id = modulo.dataset.id ? Number(modulo.dataset.id) : null;
  const proposta = stato.proposta;

  try {
    const dati = leggiModulo(modulo);
    dati.altri_ruoli = leggiRuoli();
    if (modulo.video_url.disabled) dati.video_url = null;
    await caricaImmagini(modulo, dati);
    await caricaTitolo(modulo, dati);

    // Revisione: l'opera, il cast e i collegamenti con licenza e socio
    // nascono insieme, in una sola transazione del database
    if (proposta) {
      const { data: codice, error } = await client.rpc('approva_proposta', {
        p_id: proposta.id,
        p_opera: dati,
        p_interpreti: leggiInterpreti()
      });
      if (error) throw error;

      stato.modificato = false;
      avviso(`"${dati.titolo}" ${dati.pubblicata ? 'pubblicata' : 'approvata come bozza'}.`);
      if (confirm('Fatto. Nessuno avvisa il socio in automatico: vuoi scrivergli ora?')) {
        location.href = indirizzoPosta(
          proposta.socio_email,
          `«${dati.titolo}» è in Cortoteca`,
          `Ciao ${(proposta.socio_nome || '').split(' ')[0]},\n\n«${dati.titolo}» è in Cortoteca:\n${location.origin}/opera.html?film=${encodeURIComponent(codice)}\n\nLa ricevuta della licenza resta nella tua pagina, dal tuo collegamento personale. Da lì puoi anche ritirare il corto quando vuoi.\n`
        );
      }
      mostraElenco();
      return;
    }

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

    const titolare = $('socio-titolare').value;
    if (titolare !== stato.titolare) {
      const { error } = await client.rpc('assegna_socio', { p_opera_id: operaId, p_email: titolare || null });
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
    pulsante.textContent = etichetta;
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
  m.addEventListener('input', segnaModificato);
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
