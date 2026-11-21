// Gestione con un accesso finto (strumento di verifica, non fa parte del sito).
//
// Apre gestione.html in Chrome con una sessione inventata e risponde da qui a
// tutte le richieste verso Supabase, coi dati delle copie di riserva
// (data/*.json) e qualche dato d'esempio per avvisi, cruscotto, proposte e
// soci. Nessuna scrittura esce dal browser: le richieste POST/PATCH/DELETE
// vengono bloccate e scritte in console (quelle sulla vetrina della home si
// applicano a una copia in memoria, per provare la Dashboard). Passano solo le letture delle
// immagini pubbliche. Per ogni vista: misure (scorrimento orizzontale, aree
// da toccare sotto i 44 px, scritte sotto gli 11 px) e due schermate.
//
// Uso (sito servito su http://localhost:5500, vedi CLAUDE.md):
//   mkdir -p /tmp/strumenti && cd /tmp/strumenti && npm i puppeteer-core@23.11.1
//   NODE_PATH=/tmp/strumenti/node_modules W=375 node storico/strumenti/gestione-finta.js
// W è la larghezza della finestra; USCITA la cartella delle schermate
// (predefinita: una cartella temporanea); CHROME il percorso di Chrome.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const SITO = path.resolve(__dirname, '../..');
const D = process.env.USCITA || path.join(os.tmpdir(), 'cdl-gestione-finta');
fs.mkdirSync(D, { recursive: true });
const PROGETTO = 'rsspmqhhrykbmrkmwqcg';
const W = Number(process.env.W || 375);

const opere = JSON.parse(fs.readFileSync(SITO + '/data/opere.json'));
const eventi = JSON.parse(fs.readFileSync(SITO + '/data/eventi.json'));
const rullino = JSON.parse(fs.readFileSync(SITO + '/data/rullino.json'));
const vetrina = JSON.parse(fs.readFileSync(SITO + '/data/vetrina.json')).map((r, i) => ({ id: i + 1, ...r }));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const ora = Math.floor(Date.now() / 1000);
const utente = { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'redattore.prova@example.org', factors: [], app_metadata: {}, user_metadata: {} };
const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: utente.id, email: utente.email, role: 'authenticated', aal: 'aal1', amr: [{ method: 'password', timestamp: ora }], exp: ora + 3600, iat: ora, session_id: 's1' })}.ZmlybWFwcm92YQ`;
const sessione = { access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: ora + 3600, user: utente };

const iso = (giorni) => new Date(Date.now() - giorni * 864e5).toISOString();
const soci = [
  { numero: 1, anno: 2026, nome: 'Francesco Pasquinelli', email: 'francesco@example.org', pagato: true, data_pagamento: '2026-01-12', in_regola: true, ultimo_accesso: iso(3), invito_creato_il: iso(20) },
  { numero: 2, anno: 2026, nome: 'Gabriele Rattini', email: 'gabriele@example.org', pagato: false, in_regola: false, invito_creato_il: iso(40) },
  { numero: 3, anno: 2026, nome: 'Alessandra Maria Giovanna Bartolomei-Castiglioni', email: 'alessandra.bartolomei.castiglioni@example.org', pagato: true, data_pagamento: '2026-02-01', in_regola: true },
  { numero: 4, anno: 2026, nome: 'Socio senza email', email: null, pagato: true, in_regola: true },
];
const RPC = {
  sono_redattore: true,
  avvisi: {
    proposte_in_attesa: [{ id: 1 }],
    sincronizzazione: { quando: iso(9), vecchia: true, righe: 42, anno: 2026, senza_email: ['Socio senza email'] },
    non_in_regola: [{ titolo: 'Andrea', socio: 'Gabriele Rattini', opera_id: opere[2].id }],
    da_ripubblicare: [{ titolo: 'Lupara verde', socio: 'Francesco Pasquinelli', opera_id: opere[3].id }],
    senza_licenza: [{ titolo: 'Verso mare', socio: 'Francesco Pasquinelli', opera_id: opere[4].id, serve: 'streaming' }],
    revoche_recenti: [{ socio: 'Gabriele Rattini', titolo: 'Il martello', quando: iso(2) }],
  },
  cruscotto: {
    numeri: { proposte_in_attesa: 1, bozze_soci: 2, opere_online: 7, con_video: 2, corti_soci: 3, soci_in_regola: 38, soci: 42, collegamenti: 12, collegamenti_usati: 9, eventi_online: 9 },
    attivita: Array.from({ length: 14 }, (_, i) => ({ quando: iso(i * 0.7), tipo: ['opera', 'evento', 'proposta', 'accesso'][i % 4], testo: ['«Interzona» modificata da redattore.prova@example.org', '«Short Talks al Nòt 2026» pubblicato', 'Francesco Pasquinelli ha inviato «Un titolo di prova piuttosto lungo per vedere come va a capo»', 'Gabriele Rattini è entrato con il suo collegamento'][i % 4] })),
  },
  proposte_da_rivedere: [
    { id: 1, stato: 'inviata', socio_nome: 'Francesco Pasquinelli', socio_email: 'francesco@example.org', socio_in_regola: false, inviata_il: iso(1), dati: { titolo: 'Un titolo di prova piuttosto lungo', regista: 'Francesco Pasquinelli', anno: 2026, durata: 12, sinossi: 'Una sinossi di prova.', modalita: 'streaming', video_url: 'https://vimeo.com/123456789' }, licenza: { tipo: 'streaming', versione_testo: 1, accettata_il: iso(1) } },
    { id: 2, stato: 'da_rivedere', socio_nome: 'Gabriele Rattini', inviata_il: iso(5), nota_revisione: 'Manca il fotogramma in buona qualità', dati: { titolo: 'Andrea 2' } },
    { id: 3, stato: 'approvata', socio_nome: 'Francesco Pasquinelli', inviata_il: iso(30), opera_id: opere[0].id, dati: { titolo: 'Interzona' } },
  ],
  elenco_soci: soci,
  soci_con_bozze: [{ nome: 'Gabriele Rattini' }, { nome: 'Alessandra Maria Giovanna Bartolomei-Castiglioni' }],
  opere_titolari: [{ opera_id: opere[0].id, email: 'francesco@example.org', nome: 'Francesco Pasquinelli', licenza_attiva: true }],
};

function tabella(nome, url) {
  const righe = { opere, eventi, rullino, vetrina: [...vetrina].sort((a, b) => a.posizione - b.posizione || a.id - b.id), testi_licenza: [{ testo: 'Testo della licenza di prova.\n\nSecondo paragrafo.' }], interpreti: [] }[nome] || [];
  const id = url.searchParams.get('id');
  let fuori = righe;
  if (id && id.startsWith('eq.')) fuori = righe.filter((r) => String(r.id) === id.slice(3));
  return fuori;
}

(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: W, height: 812, isMobile: true, hasTouch: true });
  p.on('pageerror', (e) => console.log('JS:', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });
  p.on('dialog', (d) => d.dismiss());
  await p.setRequestInterception(true);
  p.on('request', (r) => {
    const url = new URL(r.url());
    if (!url.hostname.includes(PROGETTO)) return r.continue();
    const json = (corpo, stato = 200) => r.respond({ status: stato, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(corpo) });
    if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    // le immagini pubbliche si leggono davvero
    if (r.method() === 'GET' && url.pathname.startsWith('/storage/v1/object/public/')) return r.continue();
    if (url.pathname.startsWith('/storage/')) return r.respond({ status: 404, body: '' });
    if (url.pathname === '/auth/v1/user') return json(utente);
    if (url.pathname.startsWith('/auth/')) return json({});
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)/);
    if (rpc) return json(RPC[rpc[1]] ?? null);
    const tab = url.pathname.match(/^\/rest\/v1\/(\w+)/);
    if (tab) {
      // la vetrina: le scritture cambiano la copia in memoria
      if (tab[1] === 'vetrina' && r.method() !== 'GET') {
        const id = Number((url.searchParams.get('id') || '').replace('eq.', ''));
        const corpo = r.postData() ? JSON.parse(r.postData()) : {};
        if (r.method() === 'POST') vetrina.push({ id: Math.max(0, ...vetrina.map((v) => v.id)) + 1, attiva: true, titolo: null, testo: null, invito: null, immagine: null, lettering: null, colore: null, colore_testo: null, evento_id: null, opera_id: null, pagina: null, ...corpo });
        if (r.method() === 'PATCH') Object.assign(vetrina.find((v) => v.id === id) || {}, corpo);
        if (r.method() === 'DELETE') vetrina.splice(vetrina.findIndex((v) => v.id === id), 1);
        console.log('scrittura finta sulla vetrina:', r.method(), id || '', JSON.stringify(corpo));
        return json([]);
      }
      if (r.method() !== 'GET') { console.log('SCRITTURA BLOCCATA:', r.method(), url.pathname); return json([]); }
      const righe = tabella(tab[1], url);
      const singola = (r.headers().accept || '').includes('vnd.pgrst.object');
      return json(singola ? righe[0] : righe);
    }
    console.log('non gestita:', r.method(), url.pathname);
    return json({});
  });
  // la sessione finta, prima che la pagina parta
  await p.evaluateOnNewDocument((chiave, valore) => { localStorage.setItem(chiave, valore); }, `sb-${PROGETTO}-auth-token`, JSON.stringify(sessione));

  const misura = () => p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const vis = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.closest('[hidden]'); };
    const nome = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : ''} «${(el.textContent || el.value || el.name || '').trim().replace(/\s+/g, ' ').slice(0, 30)}»`;
    const taglia = (el) => { for (let a = el.parentElement; a; a = a.parentElement) { const s = getComputedStyle(a); if (['hidden', 'auto', 'scroll', 'clip'].includes(s.overflowX)) return true; } return false; };
    const sbordi = [...document.body.querySelectorAll('*')].filter((el) => vis(el) && !taglia(el) && el.getBoundingClientRect().right > vw + 1).map((el) => `${nome(el)} →${Math.round(el.getBoundingClientRect().right)}`);
    const tocchi = [...document.querySelectorAll('a[href], button, input:not([type=hidden]):not([type=file]), select, textarea, summary, label.btn')].filter(vis)
      .filter((el) => { const r = el.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; })
      .filter((el) => !(el.type === 'checkbox' || el.type === 'radio') || !el.closest('label'))
      .map((el) => { const r = el.getBoundingClientRect(); return `${nome(el)} ${Math.round(r.width)}×${Math.round(r.height)}`; });
    const piccoli = [...new Set([...document.body.querySelectorAll('*')].filter((el) => vis(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 11).map((el) => `${nome(el)} ${getComputedStyle(el).fontSize}`))];
    return { scorre: document.documentElement.scrollWidth > vw ? document.documentElement.scrollWidth : 0, sbordi: sbordi.slice(0, 8), tocchi: tocchi.slice(0, 14), nTocchi: tocchi.length, piccoli: piccoli.slice(0, 6) };
  });
  const attendi = (ms) => new Promise((r) => setTimeout(r, ms));
  const passo = async (nome, azione) => {
    if (azione) await azione();
    await attendi(900);
    const m = await misura();
    const righe = [];
    if (m.scorre) righe.push(`  SCORRE IN ORIZZONTALE: ${m.scorre}`);
    if (m.sbordi.length) righe.push(`  sbordi: ${m.sbordi.join(' | ')}`);
    if (m.nTocchi) righe.push(`  tocchi <44 (${m.nTocchi}): ${m.tocchi.join(' | ')}`);
    if (m.piccoli.length) righe.push(`  sotto 11px: ${m.piccoli.join(' | ')}`);
    console.log(`${nome} @${W}` + (righe.length ? '\n' + righe.join('\n') : '  ok'));
    await p.screenshot({ path: `${D}/${nome}-${W}.png`, fullPage: true });
    await p.evaluate(() => scrollTo(0, 700)); await attendi(200);
    await p.screenshot({ path: `${D}/${nome}-${W}-schermo.png` });
    await p.evaluate(() => scrollTo(0, 0));
  };
  const clic = (sel) => p.evaluate((s) => { const el = document.querySelector(s); if (!el) throw new Error('manca ' + s); el.click(); }, sel);
  const scheda = (nome) => clic(`[data-scheda="${nome}"]`);

  await p.goto('http://localhost:5500/gestione.html', { waitUntil: 'networkidle0' });
  await passo('01-dashboard');
  // la vetrina: una pagina messa in vetrina dall'indice, spostata in cima, un
  // titolo riscritto, poi tolta
  await passo('01b-vetrina-aggiunta', () => p.evaluate(() => [...document.querySelectorAll('.g-indice__vetrina')].find((b) => /Produzioni/.test(b.getAttribute('aria-label'))).click()));
  await passo('01c-vetrina-spostata', () => p.evaluate(() => [...document.querySelectorAll('#vetrina-slide > li')].at(-1).querySelector('[aria-label="Sposta prima"]').click()));
  await passo('01d-vetrina-titolo', () => p.evaluate(() => { const c = document.querySelector('#vetrina-slide .g-slide__campi input[type=text]'); c.value = 'Le nostre produzioni'; c.dispatchEvent(new Event('change')); }));
  await passo('01e-vetrina-tolta', () => p.evaluate(() => [...document.querySelectorAll('.g-indice__vetrina')].find((b) => /Togli dalla vetrina: Produzioni/.test(b.getAttribute('aria-label'))).click()));
  await passo('02-proposte', () => scheda('proposte'));
  await passo('03-revisione', () => clic('#elenco button.g-riga'));
  await passo('04-opere', async () => { await p.evaluate(() => document.querySelector('[data-annulla]')?.click()); await attendi(300); await scheda('opere'); });
  await passo('05-modulo-opera', () => clic('#elenco button.g-riga, #elenco .g-riga'));
  await passo('06-eventi', async () => { await p.evaluate(() => [...document.querySelectorAll('[data-annulla]')].find((x) => x.offsetParent)?.click()); await attendi(300); await scheda('eventi'); });
  await passo('07-modulo-evento', () => p.evaluate(() => document.querySelector('#elenco button.g-riga')?.click()));
  await passo('08-rullino', async () => { await p.evaluate(() => [...document.querySelectorAll('[data-annulla]')].find((x) => x.offsetParent)?.click()); await attendi(300); await scheda('rullino'); });
  await passo('09-soci', () => scheda('soci'));
  const nuovo = await p.$('#nuovo, [data-nuovo], .g-nuovo');
  console.log('tasto nuovo:', !!nuovo);
  await passo('10-sicurezza', () => p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Sicurezza/.test(x.textContent))?.click()));
  console.log('schermate in', D);
  await b.close();
})();
