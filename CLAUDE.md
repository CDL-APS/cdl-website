# Note per chi lavora su questo progetto

Sito statico di CDL APS. Nessun build step, nessuna dipendenza npm: i file
sorgente sono quelli pubblicati. Netlify serve la radice del repository così
com'è.

**Vederlo in locale**: dalla cartella del progetto
`python3 -m http.server 5500`, poi `http://localhost:5500` (Ctrl+C per
fermarlo). Dentro Claude Code: `! python3 -m http.server 5500`.

## Cortoteca in pausa (dal 17 novembre 2026)

Galleria pubblica, area socio, proposte, licenze e le schede Proposte e
Soci della gestione sono spente (la Dashboard dal 21 novembre 2026 è
l'indice del sito; il suo cruscotto della Cortoteca torna con
l'interruttore); database, Edge Function e
sincronizzazione del foglio restano accesi. `opera.html` (la pagina del
corto) resta pubblica: la usano Produzioni, il rullino e le pagine evento.
Interruttori: `CORTOTECA_ATTIVA` in `dati.js` (lo leggono anche
`gestione.js` e `gestione-rullino.js`), `SCHEDE_IN_SVILUPPO` in
`gestione.js`, i redirect 302 in `netlify.toml`, le voci tolte dall'HTML
(barra, indice della home, Contatti; in Sostieni la voce è senza link). Tutto, compreso come
riprendere e il da fare congelato (ordinamenti e ricerca globale della
Cortoteca, titoli grafici da ricaricare, collegamenti dei soci da
rigenerare, prove di area socio e proposte), è in
`storico/2026-11-17-cortoteca-in-pausa.md`: è il punto di partenza del
branch della ripresa. Le sezioni sulla Cortoteca più sotto descrivono il
sistema com'è, spento.

## Da fare più avanti (non prioritario)

- [ ] **Dopo il 27 novembre 2026** (la serata per i soci,
  `evento-interzona.html`): fino alla serata la pagina riporta solo le
  informazioni del post Instagram, niente di più (il perché è nel
  documento della serata, sul Drive). Dopo: aggiornare la pagina (foto
  della serata, eventuale nome), decidere cosa mettere in "In evidenza" in
  Eventi (si riscrive il blocco in `eventi.html`) e togliere o cambiare la
  slide della vetrina dalla Dashboard.

- [ ] Forse: impaginazione più curata della mail che arriva dal modulo di
  Contatti (la notifica di Netlify Forms). Funziona, l'utente l'ha provata
  per intero il 19 novembre 2026; non gli piace molto com'è impaginata, ma
  non è detto che valga la pena cambiarla.
- [ ] Gestione degli eventi e pagine evento composte dal database: ferme
  dal 13 novembre 2026, escluse dal deploy del redesign. Il piano completo
  per riprenderle (cosa è spento e dove, cosa è emerso dalle verifiche,
  review, prove, conversione delle altre pagine) è in
  `storico/2026-11-13-piano-eventi-gestione.md`. Tre interruttori:
  `MODELLO_EVENTI` in `dati.js`, `SCHEDE_IN_SVILUPPO` in `gestione.js`,
  l'etichetta "In sviluppo" e i gruppi `hidden` in `gestione.html`.
- [ ] Riprendere la Cortoteca: `storico/2026-11-17-cortoteca-in-pausa.md`.
- [ ] Sostieni: aggiungere la possibilità di fare una donazione, oltre a
  diventare socio (blocco arancio in home, Contatti e Vantaggi). Può usare
  lo stesso conto PayPal della domanda di ammissione (paypal.me senza
  importo).
- [ ] **Dal 1° gennaio 2027** (quota a 10 €): modulo cartaceo nuovo
  (`documenti/domanda-ammissione-socio-2027.html`, da quello del 2026, e
  link in `vantaggi-tesseramento.html`); togliere la quota ridotta dal
  nastro della home (`data-quota` in `index.html`) e da Sostieni ("La
  quota associativa è stata ridotta…" in home, Contatti e Vantaggi). Il
  testo in cima alla domanda si aggiorna da solo (`data-quote`), la web app
  pure (proprietà `QUOTE`). Chi rinnova tiene il suo numero di tessera: lo
  riprende lo script dalla scheda dell'anno prima (stessa email), i nuovi
  soci continuano la numerazione (`google/iscrizioni/README.md`).
- [ ] Rinnovo online per chi è già socio: per l'art. 3 dello statuto lo
  status di socio è permanente, quindi non serve una nuova domanda, basta
  pagare la quota dell'anno. La domanda di ammissione online è solo per i
  nuovi soci; il rinnovo potrebbe usare la stessa web app con un modulo
  ridotto (nome, email, modalità di pagamento).

## Convenzioni

- **CSS**: `base.css` (colori, misure, griglia, titoli) → `components.css`
  (elementi su più pagine) → `pages/<pagina>.css` (specifico). I fogli si
  caricano sempre in quest'ordine. Eccezioni: `cortoteca.html` carica anche
  `pages/opera.css` (la sala del corto) ed `eventi.html` anche
  `pages/evento.css` (la sala dell'evento), prima del proprio;
  `gestione.html` e `area-socio.html` caricano `pages/riservato.css` (barra e
  moduli comuni) prima del proprio. Non reintrodurre blocchi `<style>` nelle
  pagine. Gli attributi `style=` restano solo per i dati di una singola
  pagina pubblica (occhi `--x`/`--y`/`--d`, larghezze dei partner `--w`,
  proporzioni delle foto `--rapporto`); mai in gestione e proposta, dove la
  CSP li blocca. In fondo a `base.css` ci sono gli alias dei nomi vecchi
  (`--cdl-*`, `--riga`…), ormai solo per `area-socio.css` e la cornice:
  `riservato.css` e `gestione.css` usano i nomi nuovi. Nelle pagine
  riservate i campi sono quelli del modulo di Contatti (bordo nero, angoli
  di 14 px), le superfici bianche con gli angoli del marchio, i gruppi
  separati da spazio e da un filo sottile sopra il titolo.
- **JS**: un file per pagina in `assets/js/`, caricato in fondo al `<body>`.
  File comuni: `dati.js` (lettura di opere ed eventi, per primo), `comune.js`
  (scritte a tutta larghezza, occhi, rullini, schede, titolo grafico,
  passaggi fra le pagine: su tutte le pagine pubbliche, dopo `dati.js` dove
  c'è), `corto.js` (la pagina del corto: `opera.html` e la sala di
  `cortoteca.html`), `modello-evento.js` (la pagina di un evento composta
  dal database: `evento.html` e la sala di `eventi.html`) e `riservato.js` (parti condivise da `gestione.html` e
  `area-socio.html`, dopo `dati.js`). La scheda Rullino di gestione sta in
  `gestione-rullino.js`, la pagina dell'evento (logo, colore, blocchi,
  anteprima) in `gestione-eventi.js` e la Dashboard (indice del sito e
  vetrina della home) in `gestione-indice.js`, caricati dopo `gestione.js`
  (ne usano client e stato; `gestione-indice.js` anche `caricaFonti` del
  rullino). Non ci sono moduli ES né bundler: le
  funzioni sono globali. Le librerie di terzi stanno copiate in
  `assets/js/vendor/` con la versione nel nome.
- **Identità visiva** (dettagli in `storico/2026-11-11-design-handoff.md`):
  solo Montserrat (500–900, da Google Fonts con un `<link>`), tranne due
  eventi che parlano col carattere della loro grafica, nel `<main>` della
  pagina, nella sala e nel loro blocco in Eventi (barra e piede restano in
  Montserrat): Long Story Short in Inter (quello del lettering) e la serata
  del 27 novembre 2026 in VT323; titoli 900
  maiuscoli e stretti, spesso a tutta larghezza (`.fit`); carta `#f7f7f7`.
  Ogni sezione ha il suo fondo pieno: Eventi blu con le scritte azzurre,
  Produzioni lilla e nero, Cortoteca nera con le scritte arancio (`--cortoteca` in `base.css`), Contatti e
  Sostieni arancio; corti ed eventi hanno il loro colore. Angoli del marchio
  arrotondati (`--r` 20 px, rullino della home 16, still della Cortoteca 14);
  le foto delle schede, del primo piano e dei vincitori sono a spigolo vivo,
  chiuse da un filo. **Mai eyebrow**: nessuna etichetta piccola in maiuscolo
  sopra un titolo. Etichette mai sotto gli 11 px, aree toccabili di almeno
  44 px. Tailwind e Lucide restano solo su `cornicenarrativa.html`, perché
  `cornice.js` costruisce i blocchi con quelle classi; altrove le icone sono
  SVG scritte nell'HTML.
- **Barra e piede** sono ripetuti in ogni pagina: una modifica va portata su
  tutti i file HTML. La voce della pagina corrente ha `aria-current="page"`
  (le pagine evento e la cornice narrativa accendono Eventi); il pallino
  colorato di una voce è una classe (`nav__voce--eventi`, `--produzioni`,
  `--contatti`). Con la Cortoteca in pausa la barra non ha la pillola
  Cortoteca e le pagine dei corti non accendono nessuna voce; alla ripresa,
  le pagine dei corti accendono Cortoteca, che ha la barra ridotta (solo
  Diventa socio) e il piede arancio.
- **Frecce**: ↗ per aprire un contenuto, → per andare a un elenco o a
  un'altra pagina del sito, l'icona del link esterno solo per ciò che porta
  fuori (Instagram e YouTube nel piede, i tag Instagram nelle pagine evento).
- **Titolo della scheda del browser**: "Pagina – CDL APS"; la home resta
  "CDL APS – Cinema giovane e indipendente a Rimini".
- **Immagini**: sempre sotto `assets/img/<categoria>/`, mai nella radice;
  i video (brevi, in loop, senza audio) sotto `assets/video/<categoria>/`.
  Nomi in minuscolo con trattini.
- **Lingua**: interfaccia, commenti e nomi di file in italiano.

## Punti da conoscere

- **Opere ed eventi stanno su Supabase** (progetto dell'organizzazione CDL
  APS). Schema e dati iniziali sono in `supabase/migrations/`: ogni modifica
  allo schema va aggiunta lì come nuovo file, oltre che applicata. Le regole
  di accesso (RLS) danno a chiunque la sola lettura di ciò che è pubblicato;
  scrive solo chi è in `privato.redattori`.
- **Tabelle nuove in `public`**: dal 30 ottobre 2026 Supabase non dà più in
  automatico l'accesso della Data API alle tabelle create da quel giorno.
  La migrazione che crea una tabella deve contenere anche i suoi `grant`:
  `select` ad `anon` (se il sito la legge), `select, insert, update, delete`
  ad `authenticated` e `service_role`, come nello schema iniziale e in
  `20261021120000_permessi_service_role.sql`. Senza, la Data API risponde
  "permission denied". Attenzione: il 21 novembre 2026 la tabella nuova
  `vetrina` era comunque leggibile da `anon` per intero (permessi
  predefiniti dello schema): una tabella letta dal sito toglie tutto ad
  `anon` (`revoke all`) e gli concede solo le colonne che servono, come in
  `20261121120000_vetrina_home.sql`. Va sempre verificato con la chiave
  pubblica (`curl …/rest/v1/<tabella>?select=<colonna>`).
- **Il progetto Supabase è sul piano gratuito** e va in pausa dopo 7 giorni
  senza attività. Lo tiene sveglio `.github/workflows/sveglia-supabase.yml`,
  una lettura il lunedì e il giovedì con la chiave pubblica. Se fallisce,
  GitHub manda una mail: il progetto va ripreso dalla dashboard (*Resume
  project*). Funziona solo da `main`.
- `dati.js` legge dalla Data API con la chiave pubblica (sta nel sito
  apposta), chiedendo le colonne una per una (`COLONNE_OPERE`,
  `COLONNE_EVENTI`), mai `select=*`. Se Supabase non risponde, ripiega su
  `data/opere.json` e `data/eventi.json`, copie di riserva con la stessa
  forma, da cui scarta ciò che non è pubblicato; le immagini, se mancano nel
  bucket `immagini`, ripiegano su `assets/img/`. La chiave segreta
  (*secret* / *service_role*) non va mai nel repository.
- **Colonne pubbliche.** `20261113200000_colonne_pubbliche.sql` limita `anon`
  alle colonne mostrate dal sito (niente `modificato_da` né date di lavoro).
  Va applicata solo quando il sito online usa già l'elenco esplicito di
  `dati.js`. Una colonna nuova da mostrare va aggiunta in `dati.js` e con un
  `grant select (colonna)` ad `anon` in una migrazione.
- Le pagine che leggono i dati (home, cortoteca, produzioni, eventi, opera)
  sono gusci riempiti a runtime. I testi arrivano da un modulo: nei modelli
  HTML vanno sempre passati da `esc()`, e i collegamenti da
  `indirizzoSicuro()`. Il campo `pagina` di un evento passa da
  `paginaEvento()`, che accetta solo il nome di un file del sito
  (`blue-hour.html`): la pagina Eventi lo scarica e ne inserisce il `<main>`.
- Fra due produzioni CDL dello stesso anno conta come più recente quella
  inserita per ultima (id più alto).
- `gestione.html` è la pagina dei redattori: accesso con email e password
  via Supabase Auth, più il codice di un'app di autenticazione, obbligatorio
  (un redattore nuovo lo attiva al primo accesso; non si disattiva dalla
  gestione: chi cambia o perde il telefono va sbloccato in Supabase,
  Authentication → utente → fattori). Le scritture sono protette dalla RLS, non
  dalla pagina. Le immagini caricate vengono ridimensionate a 2000 px e
  salvate come `<cartella>/<codice>-<campo>-<orario>.jpg` nel bucket
  `immagini`.
- **Chi è redattore** lo decide `privato.e_redattore()`: utente in
  `privato.redattori`, sessione nata dall'accesso con password (voce
  `password` nel campo `amr` del token) e di livello `aal2` (password più
  codice; `20261113170100_codice_obbligatorio_redattori.sql`).
  `public.redattore_senza_codice()` dice alla gestione quando mostrare
  l'attivazione del codice, senza dare permessi. Il collegamento personale
  dei soci **non vale per i redattori**: `crea_invito` rifiuta l'email di un
  redattore e `verifica_invito` non la riconosce
  (`20261113170000_inviti_non_per_redattori.sql`), perché da quella sessione
  si potrebbe impostare una password e arrivare alla gestione. Un redattore
  che vuole proporre corti come socio usa un altro indirizzo nel libro soci.
- **Cortoteca, proposte dei soci** (in pausa dal 17 novembre 2026, vedi
  "Cortoteca in pausa" in cima: tutto quanto segue è spento, non
  cancellato). Progetto e motivazioni in
  `storico/2026-11-11-cortoteca-infrastruttura.md`; regolamento, licenza e
  delibera sono bozze per il Consiglio direttivo. In breve:
  - il socio entra nell'**area socio** (`area-socio.html`, fino al 13
    novembre 2026 `proponi.html`: `netlify.toml` rimanda i vecchi
    indirizzi) con email e password. La password la sceglie con un
    collegamento personale (`area-socio.html#invito=<64 caratteri>`) che un
    redattore copia dalla scheda Soci di gestione e gli manda a mano, al
    primo accesso o quando l'ha dimenticata. Il collegamento vale una volta
    sola e per 7 giorni (`20261113210000_collegamento_monouso.sql`; in
    gestione `GIORNI_COLLEGAMENTO`); la Edge Function `accesso-socio` (in
    `supabase/functions/`, senza verifica del JWT) lo scambia con una
    sessione, la pagina chiede subito la password (obbligatoria anche se
    il socio chiude a metà: segno `cdl-socio-scegli-password` nel browser)
    e chiude le altre sessioni del socio. In Supabase → Authentication
    restano la password minima di 6 caratteri (`PASSWORD_MINIMA`) e
    "Secure password change" spento: con quella regola un socio che sceglie
    la password più di 24 ore dopo aver aperto il collegamento verrebbe
    rifiutato (scelta dell'utente, 13 novembre 2026). Niente email automatiche: è una
    scelta del direttivo;
  - il socio compila una proposta (`public.proposte`, contenuto in `dati`),
    sceglie se il corto si potrà guardare in Cortoteca (`dati.modalita`:
    `streaming`) o se propone la sola scheda (`scheda`: titolo, testi,
    crediti, fotogramma, niente video), risponde al questionario, accetta e
    invia. Le domande e il testo da accettare dipendono da quella scelta.
    Durata, anno, regia, sinossi e fotogramma sono obbligatori. Lo stato
    della proposta cambia solo tramite funzioni (`invia_proposta`,
    `approva_proposta`, `chiedi_modifiche`, `rifiuta_proposta`,
    `ritira_proposta`), mai scrivendo la colonna;
  - `public.licenze` è un registro: nessuno lo modifica dalla Data API, si
    revoca e basta. Ogni riga ha un `tipo`: `streaming` (la licenza
    completa) o `scheda` (l'autorizzazione breve). Un'opera con il video ha
    bisogno di una licenza `streaming`; senza video ne basta una qualsiasi
    (`privato.licenza_valida()`), e `approva_proposta` rifiuta il video se il
    socio ha autorizzato solo la scheda. I testi accettabili stanno in
    `public.testi_licenza`, una riga per versione con il suo tipo, e in
    `supabase/licenze/` (`cortoteca-v<n>.txt`, `cortoteca-scheda-v<n>.txt`):
    file e database devono coincidere (colonna `sha256`). Un testo in vigore
    non si corregge: si aggiunge una versione con una migrazione;
  - le bozze sono del socio finché non le invia: i redattori leggono solo
    le proposte inviate e i loro file; in Proposte vedono solo chi ha una
    bozza aperta (`soci_con_bozze()`, il nome e basta);
  - Letterboxd e IMDb (`letterboxd_url`, `imdb_url`, solo indirizzi
    imdb.com) si compilano nella proposta e in gestione; la pagina del
    corto li mostra come tasti coi marchi dei due servizi (SVG in
    `corto.js`);
  - troupe: i ruoli fissi sono colonne di `opere` (fra cui `suono`), gli
    altri stanno in `altri_ruoli`, un elenco di `{ ruolo, nome }`. Il titolo
    grafico, facoltativo, è un PNG (`titolo_png`) o un carattere
    tipografico (`titolo_font`) nello spazio `immagini`, cartella `titoli/`:
    si carica com'è, senza conversioni;
  - il libro soci resta sul foglio Google "Gestione APS (fogli)", schede
    `TESSERATI <anno>`. Lo script `supabase/foglio/sincronizza-soci.gs`,
    incollato nel foglio, manda sei colonne a `public.sincronizza_soci()`
    con una chiave che sta solo nelle proprietà dello script (nel database
    c'è l'impronta). "In regola" = quota dell'anno pagata, o di quello
    prima fino al sessantesimo giorno (`privato.giorni_tolleranza()`);
  - le opere di un socio che non rinnova non spariscono da sole: compaiono
    in "Da sistemare" in gestione e un redattore le nasconde
    (`nascondi_per_quota`), poi le ripubblica al rinnovo;
  - i fotogrammi e i titoli grafici delle proposte stanno nel bucket privato
    `proposte` (cartella per utente); all'approvazione la pagina di gestione
    li copia in `immagini`;
  - `opere.solo_scheda`: il corto è in Cortoteca senza streaming per scelta
    del socio. La scrivono `approva_proposta` e `accetta_licenza_opera` dal
    tipo di licenza (il pubblico non legge `licenze`); i redattori la
    cambiano in gestione. Senza video e senza `solo_scheda` la pagina del
    corto dice "Streaming in arrivo";
  - il **titolo grafico** sul sito (`titoloGrafico()` in `comune.js`, in
    galleria, nella pagina del corto sotto la copertina e in Prossimamente
    di Produzioni; nelle schede di Produzioni il titolo resta scritto, per
    leggibilità): prima
    `titolo_png`, poi `titolo_font` (caricato con `FontFace` dallo spazio
    `immagini`), poi gli SVG provvisori in `assets/img/film/titoli/` per i
    codici di `TITOLI_GRAFICI`, poi il titolo in Montserrat. Nella pagina
    del corto l'immagine passa da
    `ritagliaTitolo()`, che toglie i margini trasparenti del file (tutti i
    titoli vengono della stessa altezza, `--alto`) e segna i disegni scuri.
    Quei quattro
    SVG (Interzona, Quarto Livello, Relatività, Viva Revolution) sono i
    titoli definitivi: ricaricarli dalla gestione come PNG è solo una
    questione di ordine, perché stiano nel database come quelli degli altri
    corti (voce nel da fare della Cortoteca);
  - il **colore della pagina del corto** (`--titolo`): `opere.colore`
    (`#rrggbb`, campo in gestione), poi il colore dell'SVG provvisorio, poi
    l'arancio della Cortoteca. Un colore troppo scuro per il nero diventa
    il chiaro; sui pieni nel colore del corto (Guarda) la scritta diventa
    chiara se col nero non si leggerebbe (`--sul-titolo`). Se
    l'opera ha un colore, anche il titolo grafico lo prende (galleria, sala,
    pagina del corto: l'immagine fa da maschera); in Produzioni resta nero
    (`colora: false`).
  - la **pagina del corto**: copertina pulita (il fotogramma, senza
    scritte), sotto titolo, tagline e logline (la colonna `sinossi`), a
    destra i dati; dove la produzione è CDL c'è il marchio, alto quanto le
    maiuscole. La tagline va a capo dopo la prima virgola, se prima non
    finisce già una frase. Note di regia su tutta la larghezza; poi il Cast
    (attore e personaggio, da `interpreti`) e i Crediti della troupe, un nome
    per riga (i valori separati da virgole diventano un elenco). Un titolo
    grafico scuro diventa bianco, uno con `colore` prende `--titolo`.
- **Dashboard di gestione**: la prima scheda di `gestione.html`, dove la
  gestione si apre. Dal 21 novembre 2026 è l'indice del sito
  (`gestione-indice.js`): in cima la **vetrina della home** (le slide, il
  loro ordine, titolo, riga di testo, invito, colore e immagine di
  ciascuna, lettering compreso, accese o spente), sotto tutte le pagine del
  sito ad albero, con "Apri" e "Metti in vetrina": le sezioni (le pagine
  fisse di `PAGINE_SITO` in `dati.js`, dove `dentro` dice in che pagina sta
  una pagina: la domanda di ammissione in Sostieni, la cornice narrativa
  nella pagina di LSS), dentro Eventi ogni evento, dentro Produzioni i corti
  di CDL, poi la Cortoteca (in pausa) con gli altri corti. Si appoggia a `caricaFonti()` di `gestione-rullino.js`
  (eventi e opere, anche non pubblicati). Con la Cortoteca accesa sotto
  torna il cruscotto: "Da
  sistemare" compare solo lì e contiene solo ciò che chiede un'azione: le
  informazioni vanno altrove (ritiri e revoche fra le ultime attività, i
  soci senza email come nota nella scheda Soci); i numeri e le ultime attività arrivano da
  `public.cruscotto()`. Chi ha fatto l'ultima modifica a un'opera o a un
  evento lo scrive un trigger in `modificato_da`.
- **Header di sicurezza.** `netlify.toml` dà a `gestione.html` e
  `area-socio.html` (e agli stessi indirizzi senza `.html`) una
  Content-Security-Policy: solo script del sito, solo connessioni verso il
  progetto Supabase, stili dal sito e da Google Fonts. Uno script, un font o
  un'immagine da un altro indirizzo in quelle pagine va aggiunto anche lì.
- `supabase/config.toml` tiene `verify_jwt = false` per `accesso-socio`:
  una pubblicazione dalla CLI non deve riattivare la verifica.
- I testi in `supabase/licenze/` devono restare identici byte per byte al
  database (`.editorconfig` impedisce all'editor di toccarli).
- `opera.html` legge il codice dell'opera dalla query string (`?film=codice`).
  Senza parametro mostra "Opera non trovata".
- **Le sale** (quella del corto è spenta con la Cortoteca). Un corto si
  apre dentro la Cortoteca e un evento dentro
  Eventi, sopra la pagina (`apriSala` in `cortoteca.js`, `apriEvento` in
  `eventi.js`): l'indirizzo diventa quello del corto o dell'evento, e
  indietro, Esc e la crocetta chiudono. Per questo `cortoteca.html` contiene
  il modello della pagina del corto (`<template id="modello-corto">`, da
  tenere allineato a `opera.html`) ed `eventi.html` scarica il `<main>`
  delle pagine evento. Da Produzioni, il clic su un corto fa volare il
  fotogramma al posto della copertina di `opera.html`
  (`passaggioScheda` in `produzioni.js`, segno `cdl-passaggio-scheda` in
  `sessionStorage`). Dalla home, il clic su Eventi, Produzioni o Cortoteca
  allarga il colore della sezione prima di cambiare pagina. Con
  `prefers-reduced-motion` i passaggi diventano cambi di pagina e i rullini
  restano fermi.
- **Pagine evento composte dal database** (ferme, come la scheda Eventi
  della gestione, che mostra "In sviluppo" al posto dell'elenco: vedi
  `storico/2026-11-13-piano-eventi-gestione.md`. Finché `MODELLO_EVENTI` è
  `false`, `conModello()` dà sempre falso e ogni evento usa la pagina
  scritta a mano; nel modulo evento, se riaperto, ci sono di nuovo
  miniatura e copertina. Piano originale in
  `storico/2026-11-12-piano-pagine-evento.md`): `evento.html?e=<codice>`
  disegna testata e blocchi dalle colonne `logo`, `colore`, `instagram`,
  `sfondo`, `presentazione` e `blocchi` di `eventi`
  (`20261112210000_eventi_a_blocchi.sql`); tipi di blocco e sintassi del
  testo sono descritti in cima a `modello-evento.js`. Un evento usa il
  modello se ha una presentazione o un blocco (`conModello()` in `dati.js`):
  allora `paginaEvento()` dà l'indirizzo del modello, la sala di Eventi lo
  compone invece di scaricare un file e la scheda Rullino prende le foto dai
  blocchi. Convertita finora: Short Talks #1 (il suo file resta fino ai
  redirect della fase 3). In gestione la pagina si compone nel modulo
  evento (`gestione-eventi.js`): logo PNG caricato com'è, foto ridimensionate
  in `immagini/eventi/<codice>/`, misure salvate nel blocco. "Anteprima"
  apre `evento.html?anteprima`, che legge i dati del modulo dalla memoria
  del browser (`localStorage`, chiave `cdl-anteprima-evento`) e mostra le
  immagini non ancora caricate dagli indirizzi `blob:`. Il modulo non
  mostra i corti nati dall'evento (`eventi_opere`): la tabella resta. Col
  modello acceso, senza logo e senza miniatura la scheda di Eventi usa la
  prima foto dei blocchi.
- Le pagine dei singoli eventi (`short-talks-1.html`, `blue-hour.html`…) sono
  statiche, sul modello di `longstoryshort.html`, e condividono
  `pages/evento.css`, dove stanno il colore di ciascuna (`evento--<pagina>`
  sul `<body>`) e il suo logo (`marchio--<pagina>`, PNG senza fondo in
  `assets/img/eventi/loghi/<pagina>.png`, usato come maschera; percorso
  assoluto, perché un `url()` dentro una variabile si risolve rispetto al
  foglio che la usa). La scheda di Eventi mostra lo stesso PNG; senza logo,
  la foto del database. La scheda porta alla pagina solo se il campo
  `pagina` del database contiene il nome del file: si compila quando la
  pagina è già online.
- La pagina Eventi apre con "In evidenza": un evento scelto nell'HTML, nella
  sua grafica (dal 21 novembre 2026 la serata del 27 novembre,
  `#evidenza` con `data-evento="evento-interzona"`: `eventi.js` ne prende
  l'indirizzo dal database e lo toglie da "Altri eventi"; per cambiarlo si
  riscrive il blocco). Poi divide gli eventi per `serie` (colonna di
  `eventi`, scelta dal modulo di gestione): l'ultima edizione con
  `long-story-short` ha un blocco suo col lettering e le foto che scorrono
  (`#blocco-lss`), `short-talks` un altro, gli eventi senza serie finiscono
  in "Altri eventi".
- **La serata del 27 novembre 2026** (`evento-interzona.html`, nome di
  comodo: in pagina, nelle schede e nella scheda del browser si chiama
  "Evento riservato ai soci"; "A/V LIVE SET" è solo la scritta grafica).
  Materiale di Studio JAM sul Drive condiviso (post e manifesti nella
  cartella della serata, in Eventi). Per ora è una schermata sola, come il
  manifesto, con le sole informazioni del post, niente di più. La scritta glitch è un PNG a maschera preso
  dal video del post (`assets/img/eventi/loghi/evento-interzona.png`); la
  figura che all'apertura emerge dal buio e resta è un video di due
  secondi ricavato dal reel del post, senza ripetizione
  (`assets/video/eventi/evento-interzona-figura.mp4`, poster
  `figura-video.jpg`, il suo ultimo fotogramma; `figura.jpg` serve al blocco
  in evidenza). Il fondo è il nero pieno del post (`#000`, `--iz-nero`), e
  video e immagini hanno il fondo portato allo stesso nero. Il conto
  alla rovescia (`preparaConti` in `comune.js`, su `[data-conto]`) e i
  video in loop fermi con "riduci movimento" (`preparaVideo`) partono
  nella pagina, nella sala e nel blocco in evidenza. Regole in
  `evento.css` sotto `.evento--evento-interzona`.
- La pagina Produzioni mette in "Prossimamente" il lavoro più recente, poi il
  blocco delle produzioni originali (`produzione_cdl`) e quello delle
  collaborazioni (`collaborazione_cdl`, nascosto finché è vuoto). Le due
  colonne di `opere` si escludono (vincolo nel database). Le schede
  (`.scheda-g`) stanno in `components.css`, condivise con Eventi.
- **Sostieni** (`vantaggi-tesseramento.html`, il nome del file è rimasto
  quello di prima; dal 19 novembre 2026 al posto di "Vantaggi per i soci"):
  in cima l'invito arancio di Sostieni, lo stesso che chiude home e
  Contatti, con la frase sui vantaggi riservati ai soci; sotto, due sezioni
  a comparsa uguali, "Tutti i vantaggi per i soci" (`#vantaggi`) e la
  domanda di ammissione (`#associati`), che si aprono da sole su quegli
  indirizzi. Fra i vantaggi c'è la Cortoteca, con "coming soon" finché è
  in pausa. Il piede è quello semplice.
- Eventi, Produzioni, Cortoteca e 404 aprono con il nome della
  pagina a tutta larghezza (`.parola` con `.fit`, misurato da `adatta()`) e
  una presentazione (`.presentazione`) chiusa da un filo.
- La home ha quattro parti: la **vetrina** (sotto), con al piede il nastro
  delle ultime notizie ("Prossimo evento" se la data è futura, "Ultimo
  evento" altrimenti);
  l'indice (Eventi e Produzioni, più la Cortoteca quando non è in pausa, tutti dello stesso corpo, centrati
  e misurati sul disegno delle lettere con `data-preciso` e `data-uguali`:
  il nome più lungo tocca i margini; nel cambio di pagina il nome
  si allarga alla misura della testata; al passaggio prendono il colore della sezione e, tranne la
  Cortoteca, mostrano i tre più recenti e "Vedi tutti…");
  il rullino di fotografie, senza titolo; Sostieni in arancio. Nastro,
  elenchi e rullino li riempie `home.js`; il testo della quota ridotta del
  nastro sta in `data-quota`, nell'HTML.
- **La vetrina della home**: il primo blocco scorre in orizzontale, una
  slide per schermo (`scroll-snap`): col dito, coi segmenti in basso (uno
  per slide, solo la linea, senza scritte), con le frecce della tastiera e
  da sola. Il tempo di ogni slide è la linea del suo segmento che si
  riempie in 8 secondi (`GIRO_VETRINA` in `home.js`, animazione
  `vetrina-avanza`): alla fine dell'animazione si passa alla dopo, e la
  linea si ferma col puntatore sopra, col fuoco da tastiera dentro e col
  tasto pausa; con "riduci movimento" non scorre da sola. I comandi
  prendono il colore delle scritte della slide in vista. Le slide fuori
  vista sono `inert`; le foto non si ingrandiscono al passaggio (sulla
  grana sfarfallano). Una slide è
  la sala vista dall'alto, al buio, con l'icona CDL
  (`assets/img/brand/icona-cdl.png`) e la torcia che segue il puntatore
  (si ferma quando la sala non si vede): è scritta nell'HTML ed è sempre
  presente. Le altre sono contenuti in evidenza, scelti nella Dashboard
  della gestione: tabella `public.vetrina`
  (`20261121120000_vetrina_home.sql`, copia di riserva
  `data/vetrina.json`), una riga per slide, `tipo` `apertura` (una sola,
  non si elimina) o `contenuto`, che porta a un evento, a un corto o a una
  pagina del sito; titolo, testo, invito, immagine e colore vuoti si
  ricavano da lì (`ricavaSlide` in `home.js`). Il **lettering** (un PNG
  senza fondo, a maschera nel colore della slide) prende il posto del
  titolo scritto: quello caricato per la slide (colonna `lettering`,
  `20261121130000_vetrina_lettering.sql`, cartella `vetrina/` dello spazio
  immagini, caricato com'è) o, se la slide non ha un titolo suo, quello che
  il sito ha già (`letteringEvento` e `letteringOpera` in `dati.js`: il
  `logo` dell'evento, il lettering di LSS, il PNG in
  `assets/img/eventi/loghi/` col nome della pagina, il titolo grafico del
  corto); se il file non c'è resta il titolo scritto. Due colori per slide,
  scelti in Dashboard: `colore` per il titolo o il lettering, `colore_testo`
  (`20261121140000_vetrina_colore_testo.sql`) per la riga di testo e il
  tasto; con un testo scuro su una foto il velo diventa chiaro, e la
  scritta del tasto va in contrasto da sola (`coloreChiaro` in `home.js`). Il pubblico legge solo le slide
  attive, e una slide verso un evento o un corto non pubblicato non si
  vede. Finché i dati non arrivano (al massimo 1,2 secondi) la vetrina
  resta nascosta, così parte già dalla slide giusta; senza contenuti resta
  la sola sala, senza comandi. L'unico `h1` è in sola lettura ("CDL APS").
- **Il rullino della home**: fermandosi sopra una foto per 1,5 secondi
  (`ATTESA_LENTE` in `home.js`, solo con un puntatore vero) la foto si
  ingrandisce di una volta e mezza e mostra la didascalia (evento e data,
  corto e produzione, o la descrizione). Si sceglie in gestione, scheda Rullino (tabella
  `public.rullino`, `20261112200000_rullino_home.sql`; copia di riserva
  `data/rullino.json`, da aggiornare a mano come le altre). Tre
  provenienze: le gallerie delle pagine evento (lette dall'HTML della
  pagina: una galleria nuova compare da sola, senza loghi e partner), il
  fotogramma di ogni corto, altre foto caricate nella cartella `rullino/`
  dello spazio immagini. Ogni foto porta al suo evento (`evento_id`), al
  suo corto (`opera_id`) o a una pagina del sito (`pagina`, per le altre).
- **Contatti** (`contatti.html`): in cima il modulo con Netlify Forms
  (`#contatti`, la meta di "Contatti"), sotto Sostieni (`#socio`), che
  contiene anche il piede, come nella home. Il titolo Scrivici prende
  l'altezza della frase a fianco (`contatti.js`). Il tasto "Diventa socio"
  della barra porta invece a `vantaggi-tesseramento.html`. Tre moduli, uno per indirizzo
  (`contatti` → ciao@, `contatti-eventi` → eventi@, `contatti-produzione` →
  produzione@cdlaps.com): il motivo sceglie modulo e oggetto
  (`contatti.js`); `?motivo=short-talks` (l'id senza `motivo-`) lo preseleziona; il motivo "Diventare socio" non c'è più dal 17 novembre 2026, perché c'è la domanda di ammissione. Dopo l'invio Netlify
  apre `contatti.html#grazie`, che mostra la conferma: per questo anche i
  due moduli nascosti, che servono a Netlify per riconoscerli, hanno la
  stessa `action` (Netlify usa quella del modulo che riceve il messaggio).
  Il rilevamento dei moduli è attivo sul progetto e c'è una notifica email
  per modulo (Netlify → Forms → Form notifications); un modulo con un nome
  nuovo va riconosciuto da un deploy e ha bisogno della sua notifica. Netlify
  scarta come spam, senza mandare mail, molti invii fatti da browser
  automatici: le prove si fanno a mano. La casella in fondo è "Ho letto
  l'informativa" (campo `informativa`, il valore porta la versione del
  PDF; dal 17 novembre 2026 al posto di `consenso`, anche nei due moduli
  nascosti): è obbligatoria, ma dal 19 novembre 2026 (scelta dell'utente)
  si può spuntare senza aprire il PDF.
- **Caselle "dopo lettura"** (`caselleDopoLettura()` in `comune.js`): una
  casella con `data-dopo-lettura="<id del link>"` non si spunta finché il
  link non è stato aperto (clic o clic centrale); non è `disabled`, perché
  il browser non controllerebbe il `required`. La usa la domanda di
  ammissione (statuto e informativa); Contatti non più.
- **Documenti in PDF** (informative, statuto, modulo cartaceo) in
  `assets/doc/`, sorgenti HTML in `documenti/` (come rifarli:
  `documenti/README.md`). Una versione nuova prende un nome nuovo, per la
  cache di `/assets/*` e perché la versione letta resta registrata.
- **Domanda di ammissione a socio** (`vantaggi-tesseramento.html#associati`,
  `vantaggi-tesseramento.js`): la riceve una web app di Google Apps Script
  (`google/iscrizioni/`, progetto autonomo dell'account ciao@, indirizzo in
  `data-indirizzo` del modulo; vuoto = modulo non attivo), che scrive in
  `TESSERATI <anno>` senza numero di tessera e con `Pagato? = No`, crea il
  PDF riepilogativo e manda le mail a ciao@ e al candidato. Il tesoriere
  preme il tasto nella mail a ciao@ (pagina riservata a ciao@ con il
  numero da scrivere sulla tessera, poi "Conferma") o mette
  `Pagato? = Sì` nel foglio, e lo script assegna il numero e manda la
  conferma.
  **I numeri di tessera li assegna solo lo script**, anche alle righe
  scritte a mano (domande cartacee): nessuno li scrive in anticipo. Il
  numero è della persona: chi rinnova riprende il suo, un socio nuovo prende
  il successivo al più alto di tutte le schede `TESSERATI`. Nella
  pagina la domanda è una sezione a comparsa (`<details>`), aperta da sola
  su `#associati`; il modulo cartaceo è
  `assets/doc/domanda-ammissione-socio-<anno>.pdf`.
  IBAN e PayPal ("amici e familiari") compaiono solo dopo la risposta della
  web app. Quote (`QUOTE`) e versioni dei documenti stanno nelle proprietà
  dello script; `data-versione` delle caselle deve coincidere. Progetto,
  decisioni e casi limite: `storico/2026-11-17-piano-iscrizione-online.md`;
  installazione e lavoro del tesoriere: `google/iscrizioni/README.md`.
- `404.html` usa solo percorsi assoluti: Netlify la serve a qualsiasi
  profondità.
- **Pubblicazione**: dal 19 novembre 2026 il repository è
  `CDL-APS/cdl-website`, di un'organizzazione GitHub, ed è **pubblico**
  (Netlify gratuito non costruisce i repository privati delle
  organizzazioni). Netlify è ricollegato a quel repository e pubblica `main`
  a ogni push o merge. Con il repository pubblico non vale più il blocco
  "Unrecognized Git contributor" che fino a ottobre costringeva a unire con
  l'account `cdl-aps`. Essendo pubblico, **niente segreti né dati personali
  nel repository** (nemmeno nei commit: restano nella storia); gli
  indirizzi interni (`CLAUDE.md`, `storico/`, `google/`…) sono leggibili su
  GitHub, anche se il sito risponde 404.
  Si lavora su un branch (dal redesign, il 19 novembre 2026, nessun lavoro
  è in corso), si prova su un deploy di prova e si unisce con una pull
  request verso `main` (*Create a merge commit*). Deploy di prova: copiare
  i file del branch in una cartella pulita
  (`git ls-files -z -c -o --exclude-standard | xargs -0 -I{} rsync -R "{}" <cartella>/`),
  poi da lì `npx -y netlify-cli@17 deploy --dir . --site
  f4a10032-1dee-4d84-944d-8e2708a5c8cd --alias <nome-del-branch>`, che
  pubblica su `https://<nome-del-branch>--cdl-aps.netlify.app`. **Mai
  `--prod`.**
- Netlify pubblica tutta la radice: `netlify.toml` risponde 404 a
  `README.md`, `CLAUDE.md`, `supabase/`, `.github/`, `storico/`, `google/`,
  `documenti/` e `revisione-design-2026-11-11.md`. Nuovi file
  interni vanno aggiunti lì.
- `storico/` raccoglie i passaggi di consegne fra una sessione di lavoro e
  l'altra (handoff e specifiche di design), con la data nel nome.
- `netlify.toml` mantiene in vita gli indirizzi precedenti alla
  riorganizzazione (in particolare `/cortoteca/info_film2?film=...`, oggi
  `/opera.html?film=...`). Vanno conservati, e con loro i file a cui puntano
  (per esempio le nuvolette in `assets/img/nuvole/`, non più usate dalle
  pagine).
- CSS e JS sono richiamati con una versione nell'indirizzo
  (`base.css?v=2026-11-12`), perché Netlify li fa tenere in cache una
  settimana: quando li modifichi aggiorna la data in tutte le pagine
  (`sed -i '' 's/v=VECCHIA/v=NUOVA/g' *.html`).
- `assets/js/cornice.js` è il generatore interattivo di Long Story Short 2026:
  autonomo, con i propri dati incorporati, e alcune funzioni sono richiamate da
  attributi `onclick` nell'HTML — vanno mantenute globali. La pagina ha barra
  e piede del sito; il suo `<body>` ha la classe `pagina-cornice` (non
  `cornice`, che nel sito è la cornice delle immagini).

## Verifica prima di pubblicare

```bash
python3 -m json.tool data/opere.json > /dev/null  # le copie di riserva sono valide
python3 -m json.tool data/eventi.json > /dev/null
python3 -m json.tool data/rullino.json > /dev/null
python3 -m json.tool data/vetrina.json > /dev/null
python3 -m http.server 5500                        # poi http://localhost:5500
```

Aprire almeno home, produzioni, eventi e una pagina di un corto: sono le
pagine che dipendono dal database, e quindi le prime a rompersi. Con
`?riserva` nell'indirizzo (`dati.js`, `SOLO_RISERVA`) quella pagina legge
solo le copie in `data/` e una striscia rossa in basso lo dice: serve a
guardare un evento o una slide nuovi prima di scriverli nel database. Vale
solo per la pagina che ce l'ha nell'indirizzo. La gestione
si prova in locale con `storico/strumenti/gestione-finta.js`, che simula
anche le scritture sulla vetrina. Provare
anche la sala di Eventi (clic su una scheda, poi Esc e indietro), la
domanda di ammissione in Sostieni e le pagine a 375 px. Il server Python non manda
gli header di `netlify.toml`: la CSP di gestione e proposta si vede solo
online (o con un server che li aggiunga).
