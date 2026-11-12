# Piano — portare il redesign dalle anteprime al sito vero (12 novembre 2026)

Piano di lavoro per l'agente che farà il porting. Va letto per intero prima
di toccare un file. Le regole generali stanno in `CLAUDE.md`; quelle visive in
[`2026-11-11-design-handoff.md`](2026-11-11-design-handoff.md); come sono
fatte le anteprime in [`2026-11-11-handoff.md`](2026-11-11-handoff.md);
l'infrastruttura della Cortoteca dei soci in
[`2026-11-11-cortoteca-infrastruttura.md`](2026-11-11-cortoteca-infrastruttura.md)
e [`2026-11-12-handoff-cortoteca-gestione.md`](2026-11-12-handoff-cortoteca-gestione.md).

## Il problema

Sul branch `redesign` convivono due cose:

1. **Il nuovo design approvato** ("proposta G"), che vive **solo** in
   `anteprime/`: pagine generate da `anteprime/genera.py`, stili
   `anteprime/comune.css` + `anteprime/g.css`, comportamenti
   `anteprime/comune.js` + `anteprime/g.js`, con `<base href="/">` e
   `noindex`. Si vede su `http://localhost:5500/anteprime/home.html`.
2. **Il sito vero** (radice del repository), fermo al primo redesign del
   commit `b3c9b43` ("taglio editoriale": Instrument Serif, Inter,
   etichette sopra i titoli). Sopra c'è la nuova infrastruttura della
   Cortoteca dei soci: `gestione.html`, `proponi.html`, migrazioni già in
   produzione, Edge Function `accesso-socio`.

Il passaggio dalle anteprime alla radice non è mai stato fatto. Se si unisse
oggi `redesign` in `main`, andrebbe online il design vecchio, più la cartella
`anteprime/` pubblica.

## Obiettivo e criterio di "fatto"

Il sito della radice deve **diventare ciò che si vede in `anteprime/`**,
pagina per pagina, e **funzionare con l'infrastruttura della Cortoteca**: i
dati scritti da `gestione.html` e dalle proposte approvate devono comparire
correttamente nelle pagine nuove.

Il lavoro è finito quando:

- ogni pagina pubblica della radice, a 1440 e a 375 px, è indistinguibile
  dalla sua anteprima (tranne le differenze decise in questo piano);
- `anteprime/` e `genera.py` non esistono più e nessun file punta lì;
- le pagine rispettano le convenzioni di `CLAUDE.md` (aggiornate dove il
  nuovo design le cambia);
- gestione e proposta funzionano come prima, sotto la CSP di `netlify.toml`;
- un'opera inserita o approvata dalla gestione compare in Cortoteca,
  Produzioni e nella pagina del corto con tutti i suoi campi (troupe
  completa, durata, titolo grafico PNG o font, scheda senza video);
- la verifica finale (fase 9) è passata e documentata.

## Decisioni da confermare con l'utente prima di cominciare

Fai queste domande **tutte insieme, all'inizio**. Accanto a ciascuna c'è la
risposta proposta: se l'utente la accetta, procedi così.

1. **Angoli arrotondati.** Le anteprime hanno foto e cornici arrotondate
   (`--r: 20px`, rullino 16, still 14), mentre il design handoff e
   `CLAUDE.md` dicono "spigolo vivo". *Proposta: si segue l'anteprima così
   come appare, e si corregge la documentazione.*
2. **Testi riscritti nelle anteprime** (`LSS_PARAGRAFI`, `TESTI_EVENTO`,
   `RITOCCHI`, `PROGRAMMI` di Blue Hour, `NOTE_SERATE`, frasi di Contatti,
   Vantaggi e 404). *Proposta: diventano i testi ufficiali.*
3. **Corti con la sola scheda.** Oggi una scheda senza video mostra
   "streaming in arrivo", e il pubblico non può sapere se il socio ha
   autorizzato solo la scheda (`licenze` non è leggibile da `anon`).
   *Proposta: nuova colonna `opere.solo_scheda boolean not null default
   false`, scritta da `approva_proposta` e `accetta_licenza_opera` e
   modificabile in gestione; con `true` la pagina mostra la scheda senza
   promettere lo streaming.*
4. **Colore del corto.** Il design ricava il colore della pagina del corto
   dai `fill` del titolo SVG. Con i titoli in PNG o font non è possibile.
   *Proposta: nuova colonna `opere.colore text` (controllo
   `^#[0-9a-f]{6}$`), campo colore in gestione; se manca, si usa l'SVG locale
   per i quattro corti che lo hanno, altrimenti il lilla di riserva.*
5. **Aspetto di gestione e proposta.** *Proposta: prendono barra, token e
   caratteri nuovi ma tengono layout e funzioni; nessun cambiamento ai
   flussi.*
6. **Contatti.** La pagina nuova usa Netlify Forms, con tre moduli e i
   destinatari ciao@, eventi@ e produzione@cdlaps.com. *Proposta: va online
   così; manca la conferma `#grazie`, da fare in questo lavoro.*
7. **`cornicenarrativa.html`.** Resta com'è (Tailwind, `cornice.js`); si
   aggiornano solo i link della barra.

Nessuna migrazione va applicata a Supabase senza un sì esplicito
dell'utente: il database è quello di produzione.

## Regole di lavoro

- Lavora sul branch `redesign`, con **un commit per fase** e messaggi in
  italiano. Non fare push e non aprire la PR senza che l'utente lo chieda.
- **Prima di cancellare `anteprime/`** il risultato deve essere verificato.
  Fino ad allora le anteprime sono il riferimento: fotografa ogni pagina
  (1440 e 375 px) prima di cominciare e confronta durante il lavoro.
- **Parti dall'HTML già generato** in `anteprime/*.html`, non dalle
  funzioni di `genera.py`: le pagine evento della radice sono la *sorgente*
  del generatore. Quando le sostituisci, il generatore non funzionerebbe
  più, quindi **non eseguire più `genera.py`** dopo aver toccato la radice.
- Ogni modifica allo schema diventa un nuovo file in `supabase/migrations/`
  con i suoi `grant` (vedi `CLAUDE.md`), applicato solo con il sì
  dell'utente.
- Controlla nel browser integrato (`.claude/launch.json` → `sito-locale`) e
  forza il ricaricamento: il browser tiene in cache HTML e CSS.

## Fase 0 — Correzioni già note, indipendenti dal design

Piccole, da fare per prime. Sono emerse dalla revisione del 12 novembre.

1. `supabase/licenze/cortoteca-v1.txt`: togli l'a capo finale. Il database
   ha l'impronta `6d1bcf88…` (testo senza a capo), il file oggi dà
   `38a850e0…`. **Non toccare il database**: un testo in vigore non si
   corregge. Verifica con `shasum -a 256`.
2. `netlify.toml`: aggiungi la stessa CSP (e `Cache-Control: no-store`,
   `Referrer-Policy` per proponi) anche a `/gestione` e `/proponi`, perché
   Netlify serve le pagine anche senza `.html`.
3. Aggiungi `supabase/config.toml` con `[functions.accesso-socio]
   verify_jwt = false`, così una pubblicazione dalla CLI non riattiva la
   verifica del JWT.
4. `assets/js/dati.js`: sostituisci `select=*` in `QUERY_OPERE` (e negli
   eventi) con l'elenco esplicito delle colonne usate dal sito, **senza
   `modificato_da`**, che oggi `anon` legge. Poi, con una migrazione,
   revoca a `anon` il `select` sulla tabella e concedi il `select` solo
   sulle colonne pubbliche di `opere` ed `eventi`. Prima scrivi la select
   esplicita, poi la migrazione: altrimenti il `select=*` fallisce.
5. `indirizzoSicuro`: per il campo `pagina` degli eventi accetta solo
   `^[a-z0-9-]+\.html$`. La sala degli eventi scarica quella pagina e ne
   inserisce il `<main>`: con un URL esterno sarebbe un'iniezione.
6. Ripiego JSON: in `dati.js` filtra `pubblicata === true` anche sui dati di
   `data/opere.json`, così un'opera nascosta per quota non ricompare quando
   Supabase non risponde.

## Fase 1 — Fondamenta CSS (`base.css`)

Fonte: `anteprime/comune.css` righe 9–142 (reset, token, campiture
`.fondo-*`, body, fuoco, griglia, titoli) più `--nero-sala`, `.start-6`,
`.start-9` da `g.css`.

- **Token.** Prendi quelli nuovi (`--nero`, `--chiaro`, `--lilla`, `--blu`,
  `--azzurro`, `--arancio`, `--rosso`, `--tenue`, `--filo`, `--nav`, `--gut`,
  `--gap`, `--ease`, `--r`, `--f-titoli`, `--f-testo`). Conflitti con il
  `base.css` attuale:

  | Nuovo | Vecchio | Cosa fare |
  |---|---|---|
  | `--chiaro` #f7f7f7 | `--cdl-white` #f5f3ee | vale il nuovo |
  | `--ease` | `--ease-out` | vale il nuovo |
  | `--nav` 72/56 | `--barra-h` 64 | vale il nuovo |
  | `--gut` | `--margine` | vale il nuovo |
  | `.wrap` 1280 | `--larghezza` 1360 | vale il nuovo |
  | `--r` 20 | `--r-l` 4 | secondo la decisione 1 |
  | `--f-testo` Montserrat | `--f-testo` Inter | vale il nuovo |
  | `--evento` | `--accento` in `evento.css` | rinomina in `--evento`; `--accento` resta l'accento di sezione |

- **Alias.** `gestione.css`, `proponi.css` e `cornice.css` usano i token
  vecchi (`--cdl-*`, `--etichetta`, `--riga`, `--barra-h`…). Aggiungi in
  fondo a `base.css` una sezione "Alias per le pagine riservate", con i
  vecchi nomi che puntano ai nuovi valori. Non lasciare token orfani:
  cerca ogni `var(--…)` di quei fogli e controlla che sia definito.
- **Regole globali da togliere.** Del vecchio `base.css` vanno via
  `body { padding-top }`, `svg { 15px }`, `scroll-behavior: smooth` e le
  regole di `h1`/`h2`, se il nuovo design non le prevede. Controlla che
  gestione e proposta non ne dipendano: se sì, spostale in
  `pages/riservato.css` (fase 5).
- **Caratteri.** Solo Montserrat, con `<link>` a Google Fonts:
  `family=Montserrat:wght@500;600;700;800;900`. L'800 oggi è usato
  (`g.css` 356–357, 817) ma non caricato. Via Instrument Serif e Inter da
  tutte le pagine, tranne `cornicenarrativa.html` se le usa.
- **Percorsi.** I `url('../assets/…')` di `comune.css` (149, 161) e `g.css`
  (303) vanno riscritti relativi ad `assets/css/`.

## Fase 2 — Componenti (`components.css`) e fogli di pagina

Distribuzione (righe dell'anteprima):

- **`components.css`:**
  - da `comune.css`: `main > section`/`.closing`, `.logo`, occhi, barra
    `.nav` (più gli override di `g.css` 397–401 e 415–421), `.btn`,
    `.link`, `.freccia`, `.cornice`, Sostieni, piede, cursore, `.scorre`,
    `.scelte`/`.scelta`;
  - da `g.css`: `.hero--pagina`, `.entra`, `.blocco-pagina`,
    `.presentazione` (256–296), `.marchio-serie` (299), schede `.scheda-g`
    (320–344), `.rullino` (363), passaggi (390–408), `.o .occhio`.
- **Fogli di pagina:**

  | Foglio | Righe dell'anteprima |
  |---|---|
  | `pages/home.css` | `g.css` 16–144, 224, 238; `.marchio`/`.lettera` |
  | `pages/cortoteca.css` | `comune.css` 383–392, 411–490; `g.css` 149–246, 425–430, 573–595 |
  | `pages/opera.css` | `g.css` 439–496, 560–566 |
  | `pages/eventi.css` | `g.css` 348–365, 895–916 |
  | `pages/produzioni.css` | `g.css` 309–316, 372–374, 556 |
  | `pages/evento.css` | `g.css` 605–765, 813–886, più i colori degli eventi |
  | `pages/contatti.css` (nuovo) | `g.css` 505–553 |
  | `pages/vantaggi.css` | `g.css` 772–789 |
  | `pages/404.css` (nuovo, o in `components.css` se è poco) | `g.css` 796–809 |

- **Pagine che caricano altri fogli.** La sala della Cortoteca mostra la
  pagina del corto e la sala di Eventi mostra il `<main>` di una pagina
  evento. Quindi `cortoteca.html` carica anche `pages/opera.css` ed
  `eventi.html` anche `pages/evento.css`. Scrivi l'eccezione in
  `CLAUDE.md`.
- **Classi con lo stesso nome** nei vecchi `components.css` e nelle
  anteprime: `.btn`, `.btn--pieno`, `.freccia`, `.galleria`, `.piede`,
  `.primo-piano`, `.scheda`, `.sezione`. Vale la versione nuova. Prima
  controlla con grep cosa usano `gestione.html`, `proponi.html`,
  `gestione.js`, `proponi.js` e `riservato.js`, e sposta in
  `pages/riservato.css` ciò che serve solo a loro.
- **Pulizia.**
  - Togli le classi mai usate (`.sparsi`, `.fondo-nero`, `.fondo-blu`,
    `.fondo-lilla`, `.scheda` vecchia, `.start-7`, `.span-6`, da
    ricontrollare con grep).
  - Togli la media query vuota di `g.css` 549 e unisci le regole doppie
    (`.stanza`, `.fondo-sala`, `.nav__socio`).
  - Togli i commenti delle proposte ("Proposta G, ultime regole", "ogni
    proposta…").
- **`style=` inline.** Non sono vietati alla lettera, ma `CLAUDE.md` li
  scoraggia, e nelle pagine con CSP non funzionano. Dove i valori sono
  pochi e fissi, diventano classi:
  - `--punto` della barra → `.nav__voce--eventi`, `--produzioni`,
    `--contatti`;
  - `--marchio` e `--ar` dei loghi evento → classi in `evento.css`.

  Possono restare attributi gli occhi (`--x`, `--y`, `--d`) e le larghezze
  dei partner (`--w`) e delle foto (`--rapporto`), che sono dati della
  singola pagina pubblica.

## Fase 3 — JavaScript

Le funzioni restano globali, senza moduli. File:

| File | Contenuto |
|---|---|
| `assets/js/comune.js` (nuovo condiviso) | da `anteprime/comune.js`: `adatta` (`.fit`), occhi (`guarda`, `accendiOcchi`, `battito`, `avviaOcchiNuovi`), `accendiCursore`, `preparaScorre`, `nuovaImmagine`, `dataLunga`; da `g.js`: passaggi (`preparaPassaggi`, `passaggio`, `arrivo`), `preparaGiostre`, il gestore `pageshow`, Esc e `popstate` delle sale |
| `assets/js/corto.js` (nuovo condiviso) | la pagina del corto: `mostraCorto`, `lettore`, `coloreTitolo`, `luminosita`, titolo grafico. La usano `opera.html` e la sala di `cortoteca.html` |
| `assets/js/home.js` | `home()`, `torcia`, `voceNastro`, `elencoBreve`, `meseAnno` |
| `assets/js/cortoteca.js` | `avviaCortoteca`, `disegnaGalleria`, `listaConPalco`, `galleriaAFuoco`, `passaggioCorto`, `apriSala`, `chiudiSala` |
| `assets/js/opera.js` | `paginaCorto` (legge `?film=`, "Opera non trovata") |
| `assets/js/eventi.js` | `paginaEventi`, `schedaG`, `riempiSchede`, `logoEvento`, `luogoBreve`, `dataBreve`, `indirizzoEvento`, sala evento (`leggiEvento`, `costruisciEvento`, `mostraEvento`, `apriEvento`, `chiudiEvento`, `preparaEvento`) |
| `assets/js/produzioni.js` | `paginaProduzioni` |
| `assets/js/contatti.js` (nuovo) | motivo, `form-name`, `subject` (blocco `DOMContentLoaded` di `g.js` 891) |

- **`barra.js`** non serve al nuovo menu: toglilo da tutte le pagine tranne
  `cornicenarrativa.html` se lo usa ancora, poi elimina il file se nessuno
  lo carica. Aggiorna le eccezioni in `CLAUDE.md` (`comune.js`, `corto.js`).
- **`indirizzoOpera`** è definita due volte (`comune.js` e `g.js`): ne
  resta una.
- **Percorsi da sistemare.** Togli il prefisso `anteprime/`:
  - `g.js` 62, 69, 71, 72: il link `home.html#socio` diventa
    `contatti.html`, la cui testata è il blocco Sostieni, cioè la meta di
    "Diventa socio" nel nuovo design. Controlla nell'anteprima dove porta
    ogni "Diventa socio";
  - `g.js` 133 (`indirizzoOpera`) e 265 (`indirizzoEvento`);
  - il titolo "(anteprima G)" in `g.js` 790.
- **`arrivo()`** confronta il `pathname`. Con Netlify le pagine rispondono
  anche senza `.html`: normalizza togliendo `.html` e `index` prima del
  confronto.
- **La quota ridotta** è scritta a mano due volte (`QUOTA` in `genera.py`
  e in `g.js` 72). Ne resta una sola, nell'HTML.
- **Testi dal database.** Tutti gli `innerHTML` devono passare da `esc()` e
  i link da `indirizzoSicuro()`. Lo sono già: controlla che lo restino.
- **`prefers-reduced-motion`.** Conserva il comportamento descritto nel
  design handoff.

## Fase 4 — Pagine HTML

Per ogni pagina parti dall'HTML generato in `anteprime/` e:

- togli `<base href="/">`, `noindex` e il prefisso `anteprime/`;
- rendi relativi gli indirizzi, tranne nel 404, che resta con percorsi
  assoluti;
- carica i fogli `base.css` → `components.css` → `pages/<pagina>.css` e gli
  script in fondo al `<body>`, tutti con `?v=` alla data del giorno;
- `<title>` nella forma "Pagina – CDL APS". La home tiene "CDL APS – Cinema
  giovane e indipendente a Rimini", come oggi;
- voce corrente: `aria-current="page"` (lo fa il nuovo design) **e** classe
  `is-active`, oppure aggiorna `CLAUDE.md` perché valga solo
  `aria-current`. Le schede opera accendono Cortoteca, le pagine evento
  Eventi;
- `skip-link` verso `#top`, non verso `anteprime/<pagina>.html#top`.

| Pagina nuova | Diventa | Note |
|---|---|---|
| `anteprime/home.html` | `index.html` | Il rullino delle foto (`RULLINO`) resta scritto a mano e ogni foto porta alla pagina del suo evento. Nastro ed elenchi brevi da `home.js` |
| `anteprime/cortoteca.html` | `cortoteca.html` | Barra ridotta a "Diventa socio" come nell'anteprima. Porta con sé `<template id="modello-corto">` |
| `anteprime/opera.html` | `opera.html` | Conserva `?film=` e i redirect di `netlify.toml` |
| `anteprime/eventi.html` | `eventi.html` | Primo piano LSS col lettering, blocco Short Talks, "Altri eventi", per `serie` come oggi |
| `anteprime/produzioni.html` | `produzioni.html` | Primo piano = più recente (anno, poi id più alto) fra produzioni e collaborazioni; blocco collaborazioni nascosto se vuoto |
| `anteprime/contatti.html` | `contatti.html` (nuova) | Tre moduli Netlify, uno visibile e due nascosti. Aggiungi la conferma `#grazie` |
| `anteprime/vantaggi.html` | `vantaggi-tesseramento.html` | **Tieni il nome attuale**: lo usano `proponi.js:169` e molti link. Tieni l'ancora `#socio` |
| `anteprime/404.html` | `404.html` | Percorsi assoluti |
| `anteprime/longstoryshort.html` e le 7 pagine evento | stessi nomi in radice | Statiche: copia l'output generato. Il logo evento resta in `assets/img/eventi/loghi/` |

- Il **piede** del nuovo design va su tutte le pagine pubbliche, con l'anno
  2026 come oggi.
- Instagram e YouTube nel piede, e i `.tag-ig`, escono dal sito: devono
  avere l'icona del link esterno, non ↗ né →. Il link a
  `cornicenarrativa.html` è interno: va con →.
- Aree toccabili da portare a 44 px:
  - `.scelta` (38 px, strumenti della Cortoteca);
  - `.nav__cortoteca` e `.nav__socio` sotto 640 (40 px);
  - `.nav__logo` (33–42 px);
  - i link del nastro.

## Fase 5 — Gestione e proposta nel nuovo stile

Obiettivo: stessa funzione, aspetto coerente.

- `gestione.html` e `proponi.html` caricano `base.css` → `components.css` →
  `pages/riservato.css` (nuovo: classi `g-*` comuni alle due pagine,
  spostate da `gestione.css`) → `pages/gestione.css` oppure
  `pages/proponi.css`. Così `proponi.html` smette di caricare il foglio di
  un'altra pagina. Scrivi l'eccezione in `CLAUDE.md`, accanto a
  `riservato.js`.
- Barra nel nuovo stile, ridotta (marchio, schede, "Sicurezza 2FA", "Esci";
  per proponi: marchio, Cortoteca, Esci), **senza `style=` inline e senza
  `<base>`**. La CSP ha `style-src 'self'` e `base-uri 'none'`, e
  `font-src` permette solo `fonts.gstatic.com`.
- Non cambiare id, `name` dei campi, `data-*` e struttura dei moduli letti da
  `gestione.js`, `proponi.js` e `riservato.js`. Prima di toccare una classe,
  cercala nei tre JS.
- Percorsi da non cambiare: `proponi.html#invito=<64 caratteri>` e
  `opera.html?film=`.
- `.barra-socio` sparisce con la barra vecchia. Nelle pagine riservate il
  pulsante "Esci" prende il componente nuovo, alto 44 px.

## Fase 6 — Integrazione con l'infrastruttura della Cortoteca

Il nuovo design deve mostrare tutto ciò che la gestione scrive. Le colonne
di `opere` oggi: `codice`, `titolo`, `anno`, `durata`, `regista`,
`produzione`, `produzione_cdl`, `collaborazione_cdl`, `generi[]`, `tagline`,
`sinossi`, `note_regia`, `fotogramma`, `video_url`, `letterboxd_url`, la
troupe (`sceneggiatura`, `produttore`, `fotografia`, `montaggio`,
`colonna_sonora`, `scenografia`, `trucco`, `costumi`, `suono`),
`altri_ruoli` (elenco di `{ruolo, nome}`), `titolo_png`, `titolo_font`,
`pubblicata`; poi `interpreti(posizione, nome, ruolo)`.

1. **Crediti nella pagina del corto** (`corto.js`). L'anteprima (`g.js`
   824–829) non mostra `suono`, `altri_ruoli`, `note_regia` e
   `letterboxd_url`. Portali come fa oggi `opera.js`:
   - ordine Regia, Produzione, DOP, Sceneggiatura, Montaggio, Trucco,
     Costumi, Scenografia, Colonna sonora, Suono, poi `altri_ruoli` filtrati
     e passati da `esc()`;
   - Letterboxd solo se l'indirizzo è `https?://`, con l'icona del link
     esterno.
2. **Titolo grafico.** L'ordine di precedenza:
   1. `titolo_png` → `<img>` con `urlImmagine(titolo_png)`, `alt` uguale al
      titolo;
   2. `titolo_font` → `new FontFace('titolo-<codice>',
      'url(<urlImmagine>)')`, poi il titolo scritto in quel carattere. Lo
      storage di Supabase risponde con `access-control-allow-origin: *`
      (verificato il 12/11), quindi sulle pagine pubbliche funziona;
   3. SVG locale `assets/img/film/titoli/<codice>.svg`, solo per i codici di
      `TITOLI_GRAFICI`. È una riserva temporanea: annota in `CLAUDE.md` che
      quei quattro titoli vanno ricaricati dalla gestione;
   4. testo in Montserrat 900.

   Vale nella galleria della Cortoteca (`.still`/`.targa`), nella sala, in
   `opera.html` e nei primi piani di home e Produzioni se mostrano il
   titolo.
3. **Colore del corto** (decisione 4). Ordine: `opere.colore` →
   `coloreTitolo()` dall'SVG → lilla. Se l'utente approva la colonna:
   - migrazione con il vincolo sul formato;
   - campo `<input type="color">` in `gestione.html`, che `leggiModulo`
     scrive;
   - colonna aggiunta a `approva_proposta`, solo se la proposta la porta
     (oggi non la porta: basta il campo in gestione).
4. **Sola scheda** (decisione 3). Migrazione che:
   - aggiunge `opere.solo_scheda`;
   - aggiorna `approva_proposta` e `accetta_licenza_opera`: `true` se la
     licenza collegata è di tipo `scheda`, `false` se è `streaming`;
   - riempie le opere esistenti dalle licenze.

   Poi, in pagina:
   - con `solo_scheda` la galleria e lo schermo non mostrano più lo
     streaming come "in arrivo" e lo schermo resta un'immagine;
   - senza `solo_scheda` e senza video resta "Streaming in arrivo".

   In gestione: casella in sola lettura, oppure modificabile dai redattori,
   secondo la risposta dell'utente.
5. **Durata**: il design la mostra già (`g.js` 81–84). Togli il commento
   superato di `g.js` 79–80.
6. **Opere nascoste per quota**: spariscono già (`pubblicata=false`). Resta
   solo il filtro sul ripiego (fase 0, punto 6).
7. **`data/opere.json`**: rigeneralo dalla Data API con la select pubblica
   della fase 0, così ha le colonne nuove (`suono`, `altri_ruoli`,
   `titolo_png`, `titolo_font`, `durata` e le eventuali `colore` e
   `solo_scheda`). È una lettura con la chiave pubblica e non scrive
   niente. Controlla che sia JSON valido.
8. **Immagini di riserva**: `IMMAGINI_LOCALI` in `dati.js` non conosce
   `titoli/`. Aggiungi `titoli/` → `assets/img/film/titoli/` solo se ci metti
   delle copie, altrimenti in caso di errore il titolo ripiega sul testo.
9. **Eventi**: le regole attuali restano.
   - Il campo `pagina` rende la scheda un link, ed è anche ciò che la sala
     scarica: valgono i limiti della fase 0, punto 5.
   - `serie` sceglie il blocco.
   - Il logo arriva da `assets/img/eventi/loghi/<pagina>.png`; senza logo, la
     scheda mostra la foto del database.
   - La sveglia di `.github/workflows/sveglia-supabase.yml` legge
     `eventi?select=id`: dopo la revoca per colonna, `id` deve restare
     leggibile da `anon`.

## Fase 7 — Pulizia

- Elimina `anteprime/` per intero, compresi `genera.py`, `index.html`,
  `index.css` e `accantonate/` se c'è, **solo dopo** la verifica della fase
  9 sulle pagine nuove.
- Elimina i file non più usati da nessuna pagina: i fogli e gli script
  vecchi rimasti orfani, gli SVG di copertina degli eventi rimossi.
  **Non toccare** ciò a cui puntano i redirect di `netlify.toml` (per
  esempio `assets/img/nuvole/`).
- Aggiorna tutte le `?v=` alla data del giorno.
- `grep -rn "anteprime" --include="*.html" --include="*.js" --include="*.css"
  --include="*.toml" --include="*.md" .` deve restituire solo `storico/`.

## Fase 8 — Documentazione

- **`CLAUDE.md`**, da riscrivere dove il design cambia:
  - identità visiva: solo Montserrat, colori di sezione (Eventi blu,
    Produzioni lilla, Cortoteca nera, Contatti e Sostieni arancio), angoli
    secondo la decisione 1, titoli sopra le still come nel design;
  - eccezioni JS (`comune.js`, `corto.js`) e CSS (`riservato.css`, fogli
    caricati dalle sale);
  - descrizione della home (apertura, nastro, indice, rullino, Sostieni
    arancio) e delle testate (`.fit` + `.presentazione` al posto di
    `.testa-pagina`);
  - voce corrente con `aria-current`;
  - pagina Contatti e Netlify Forms;
  - colonne nuove (`colore`, `solo_scheda`) e titolo grafico;
  - la regola "mai eyebrow".
- Un nuovo passaggio di consegne in `storico/` con la data: cosa è stato
  fatto, cosa resta, come si verifica.
- Nelle due specifiche dell'11 novembre aggiungi in cima una nota: "il
  design ora vive nella radice; `anteprime/` non esiste più".

## Fase 9 — Verifica

Nel browser integrato, a 1440, 1024, 768 e 375 px. Per ogni pagina:
nessun errore in console, nessuna richiesta fallita, confronto con le foto
delle anteprime della fase 0.

- **Pagine pubbliche:**
  - home;
  - Cortoteca: galleria e lista, per anno e per nome, ricerca, sala aperta e
    chiusa con Esc, indietro e crocetta, ricarica a sala aperta;
  - `opera.html?film=quartolivello`, un corto senza titolo grafico e
    `opera.html` senza parametro;
  - Eventi, con la sala di un evento;
  - Produzioni;
  - le 8 pagine evento;
  - Contatti, con `?motivo=socio`;
  - Vantaggi;
  - 404 aperta da un percorso profondo (`/a/b/c`).
- **Riduzione del movimento.** Con `prefers-reduced-motion` (emulato), i
  passaggi diventano cambi di pagina e i rullini fermi.
- **Supabase irraggiungibile** (blocca la richiesta nel browser):
  - le pagine si riempiono dai JSON;
  - le opere non pubblicate non compaiono.
- **Dati della gestione.** Chiedi all'utente di accedere a
  `gestione.html`. **Non inserire tu password o codici.** Poi, con lui:
  - un'opera di prova (o una esistente) con `titolo_png`, una con
    `titolo_font` e una con la sola scheda;
  - controlla come appaiono in Cortoteca, nella sala, in `opera.html` e in
    Produzioni;
  - se l'opera è di prova, falla cancellare all'utente alla fine.
- **CSP** di gestione e proposta. In locale il server Python non manda
  header, quindi:
  1. scrivi nello scratchpad un piccolo server Python che serve la radice
     aggiungendo gli header di `netlify.toml` per `gestione.html` e
     `proponi.html`;
  2. apri le due pagine, accedi (l'utente), passa da tutte le schede;
  3. la console deve essere senza violazioni CSP.
- **Controlli finali:**
  - `python3 -m json.tool` sui due JSON;
  - `grep -n "<style" *.html` vuoto;
  - nessun `anteprime/` nei file pubblicati;
  - `?v=` aggiornate.

## Fase 10 — Consegna

- Riassumi all'utente le pagine fatte, le decisioni prese, le migrazioni
  scritte e applicate e ciò che non è stato verificato, per esempio Safari
  e iOS reali.
- **Push e PR solo su richiesta.** La PR `redesign` → `main` va unita da
  GitHub con l'account `cdl-aps`, con un merge commit (vedi `CLAUDE.md`,
  "Pubblicazione"). Le deploy preview falliscono per lo stesso motivo: non
  è un errore del codice.
- Dopo il primo deploy:
  - Netlify → Forms: attivare *Form detection* e una notifica per modulo
    (`contatti` → ciao@, `contatti-eventi` → eventi@, `contatti-produzione`
    → produzione@cdlaps.com), poi un invio di prova per ciascun motivo;
  - controllare con `curl -I` la CSP su `/gestione.html`, `/gestione`,
    `/proponi.html` e `/proponi`;
  - rigenerare dal sito online i collegamenti dei soci creati in locale
    (puntano a `localhost`);
  - in Supabase Auth, attivare "Secure password change" (lo fa l'utente
    dalla dashboard). Chiude la strada per cui chi ha il collegamento di un
    socio-redattore senza 2FA può impostarsi una password ed entrare in
    gestione.

## Fuori da questo piano

Dal passaggio di consegne della Cortoteca, cose che non fanno parte di
questo lavoro:

- il pulsante "Aggiungi il video" per il socio;
- la revoca delle licenze da parte dei redattori e la vista Licenze;
- i controlli automatici su fotogramma e video;
- l'esportazione;
- i titoli graficati degli altri corti;
- i loghi GECO separati;
- le scelte del Consiglio direttivo.

Se uno di questi si rende necessario, chiedi prima all'utente.

## Urgenza

La gestione oggi online non sa chiedere il codice 2FA, e l'amministratore
lo ha attivato: finché questo lavoro non è pubblicato, i redattori possono
salvare solo dalla copia locale. Se il porting dovesse richiedere molto
tempo, l'utente può decidere di pubblicare prima la sola gestione, con una
PR separata. Non farlo di tua iniziativa.
