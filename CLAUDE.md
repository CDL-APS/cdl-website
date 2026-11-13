# Note per chi lavora su questo progetto

Sito statico di CDL APS. Nessun build step, nessuna dipendenza npm: i file
sorgente sono quelli pubblicati. Netlify serve la radice del repository così
com'è.

**Vederlo in locale**: dalla cartella del progetto
`python3 -m http.server 5500`, poi `http://localhost:5500` (Ctrl+C per
fermarlo). Dentro Claude Code: `! python3 -m http.server 5500`.

## Redesign: da fare prima e dopo il deploy (togliere quando fatto)

Il redesign sta sul branch `redesign` (dettagli in
`storico/2026-11-12-handoff-redesign-nel-sito.md`). Finché questa lista non
è vuota, ricordala all'utente quando si parla di pubblicare.

Prima di unire:

- [x] Review del diff `main...redesign` con `/code-review` e
  `/security-review` (12 e 13 novembre): esiti in
  `storico/2026-11-12-review-pre-deploy.md`. Richiesta dall'utente:
  ricordargliela sempre prima di pubblicare; se dopo questa data si
  aggiunge altro lavoro al branch, va rifatta sul nuovo.
- [ ] Pull request `redesign` → `main`, unita da GitHub con l'account
  `cdl-aps` e un merge commit (vedi "Pubblicazione" più sotto).

Subito dopo il deploy:

- [ ] Applicare `supabase/migrations/20261112220000_colonne_pubbliche.sql`
  (non prima: il sito vecchio legge con `select=*` e ripiegherebbe sulle
  copie di riserva). Poi aprire home, Cortoteca, Eventi e Produzioni: in
  console non deve comparire "uso la copia di riserva".
- [ ] Netlify → Forms: attivare *Form detection* e una notifica email per
  modulo (`contatti` → ciao@, `contatti-eventi` → eventi@,
  `contatti-produzione` → produzione@cdlaps.com); un invio di prova per
  ogni motivo del modulo di Contatti.
- [ ] `curl -I` su `/gestione.html`, `/gestione`, `/proponi.html`,
  `/proponi`: devono avere la Content-Security-Policy e
  `Cache-Control: no-store`; su proponi anche `Referrer-Policy: no-referrer`.
- [ ] Rigenerare dal sito online ("Nuovo collegamento", scheda Soci) i
  collegamenti dei soci creati in locale: puntano a `localhost`.
- [ ] Supabase → Authentication: attivare "Secure password change" (in più:
  codice obbligatorio e inviti negati ai redattori sono già nel database).
- [ ] Ricaricare dalla gestione, come PNG, i titoli di Interzona, Quarto
  Livello, Relatività e Viva Revolution; poi togliere `TITOLI_GRAFICI` da
  `comune.js` e la cartella `assets/img/film/titoli/`.
- [ ] Un giro del sito su un iPhone e su Safari (mai provati su dispositivi
  veri).

## Da fare più avanti (non prioritario)

- [ ] Gestione degli eventi e pagine evento composte dal database: ferme
  dal 13 novembre 2026, escluse dal deploy del redesign. Il piano completo
  per riprenderle (cosa è spento e dove, cosa è emerso dalle verifiche,
  review, prove, conversione delle altre pagine) è in
  `storico/2026-11-13-piano-eventi-gestione.md`. Tre interruttori:
  `MODELLO_EVENTI` in `dati.js`, `SCHEDE_IN_SVILUPPO` in `gestione.js`,
  l'etichetta "In sviluppo" e i gruppi `hidden` in `gestione.html`.

- [ ] Sostieni: aggiungere la possibilità di fare una donazione, oltre a
  diventare socio (blocco arancio in home, Contatti e Vantaggi).
- [ ] Cortoteca, ordinamenti: diventano "Per nome", "Per regista" e "A-Z"
  (oggi "Per anno" e "Per nome"). "Per regista" raggruppa i corti in
  blocchi sotto il nome di ciascun regista; il nome apre un pop-up con
  alcune informazioni sul regista, che ogni socio può modificare entrando
  col proprio collegamento personale (come per `proponi.html`).
- [ ] Cortoteca, ricerca globale: cerca un nome in tutte le informazioni di
  un corto, non solo titolo e regista. Scrivendo "Andrea" escono il corto
  Andrea e tutti quelli con un attore o una maestranza che si chiama
  Andrea; per restringere si scrive una ricerca più precisa.
- [ ] Iscrizione online: quando ci sarà il modulo per associarsi solo per
  via telematica, metterlo sul sito con il pagamento integrato PayPal.

## Convenzioni

- **CSS**: `base.css` (colori, misure, griglia, titoli) → `components.css`
  (elementi su più pagine) → `pages/<pagina>.css` (specifico). I fogli si
  caricano sempre in quest'ordine. Eccezioni: `cortoteca.html` carica anche
  `pages/opera.css` (la sala del corto) ed `eventi.html` anche
  `pages/evento.css` (la sala dell'evento), prima del proprio;
  `gestione.html` e `proponi.html` caricano `pages/riservato.css` (barra e
  moduli comuni) prima del proprio. Non reintrodurre blocchi `<style>` nelle
  pagine. Gli attributi `style=` restano solo per i dati di una singola
  pagina pubblica (occhi `--x`/`--y`/`--d`, larghezze dei partner `--w`,
  proporzioni delle foto `--rapporto`); mai in gestione e proposta, dove la
  CSP li blocca. In fondo a `base.css` ci sono gli alias dei nomi vecchi
  (`--cdl-*`, `--riga`…), ormai solo per `proponi.css` e la cornice:
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
  `proponi.html`, dopo `dati.js`). La scheda Rullino di gestione sta in
  `gestione-rullino.js` e la pagina dell'evento (logo, colore, blocchi,
  anteprima) in `gestione-eventi.js`, caricati dopo `gestione.js` (ne usano
  client e stato). Non ci sono moduli ES né bundler: le
  funzioni sono globali. Le librerie di terzi stanno copiate in
  `assets/js/vendor/` con la versione nel nome.
- **Identità visiva** (dettagli in `storico/2026-11-11-design-handoff.md`):
  solo Montserrat (500–900, da Google Fonts con un `<link>`); titoli 900
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
  (le pagine dei corti accendono Cortoteca, le pagine evento e la cornice
  narrativa Eventi); il pallino colorato di una voce è una classe
  (`nav__voce--eventi`, `--produzioni`, `--contatti`). La Cortoteca ha la
  barra ridotta (solo Diventa socio) e il piede arancio.
- **Frecce**: ↗ per aprire un contenuto, → per andare a un elenco o a
  un'altra pagina del sito, l'icona del link esterno solo per ciò che porta
  fuori (Instagram e YouTube nel piede, i tag Instagram nelle pagine evento).
- **Titolo della scheda del browser**: "Pagina – CDL APS"; la home resta
  "CDL APS – Cinema giovane e indipendente a Rimini".
- **Immagini**: sempre sotto `assets/img/<categoria>/`, mai nella radice.
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
  "permission denied".
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
- **Colonne pubbliche.** `20261112220000_colonne_pubbliche.sql` limita `anon`
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
- **Cortoteca, proposte dei soci.** Progetto e motivazioni in
  `storico/2026-11-11-cortoteca-infrastruttura.md`; regolamento, licenza e
  delibera sono bozze per il Consiglio direttivo. In breve:
  - il socio entra in `proponi.html` con un collegamento personale
    (`proponi.html#invito=<64 caratteri>`) che un redattore copia dalla
    scheda Soci di gestione e gli manda a mano. La Edge Function
    `accesso-socio` (in `supabase/functions/`, senza verifica del JWT) lo
    scambia con una sessione. Niente password, niente email automatiche: è
    una scelta del direttivo;
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
    galleria, sala, pagina del corto e primo piano di Produzioni): prima
    `titolo_png`, poi `titolo_font` (caricato con `FontFace` dallo spazio
    `immagini`), poi gli SVG provvisori in `assets/img/film/titoli/` per i
    codici di `TITOLI_GRAFICI`, poi il titolo in Montserrat. Quei quattro
    SVG (Interzona, Quarto Livello, Relatività, Viva Revolution) vanno
    ricaricati dalla gestione come PNG, poi si tolgono `TITOLI_GRAFICI` e i
    file;
  - il **colore della pagina del corto** (`--titolo`): `opere.colore`
    (`#rrggbb`, campo in gestione), poi il colore dell'SVG provvisorio, poi
    l'arancio della Cortoteca. Un colore troppo scuro per il nero diventa
    il chiaro; sui pieni nel colore del corto (Guarda) la scritta diventa
    chiara se col nero non si leggerebbe (`--sul-titolo`). Se
    l'opera ha un colore, anche il titolo grafico lo prende (galleria, sala,
    pagina del corto: l'immagine fa da maschera); in Produzioni resta nero
    (`colora: false`).
- **Dashboard di gestione**: la prima scheda di `gestione.html`. "Da
  sistemare" compare solo lì e contiene solo ciò che chiede un'azione: le
  informazioni vanno altrove (ritiri e revoche fra le ultime attività, i
  soci senza email come nota nella scheda Soci); i numeri e le ultime attività arrivano da
  `public.cruscotto()`. Chi ha fatto l'ultima modifica a un'opera o a un
  evento lo scrive un trigger in `modificato_da`.
- **Header di sicurezza.** `netlify.toml` dà a `gestione.html` e
  `proponi.html` (e agli stessi indirizzi senza `.html`) una
  Content-Security-Policy: solo script del sito, solo connessioni verso il
  progetto Supabase, stili dal sito e da Google Fonts. Uno script, un font o
  un'immagine da un altro indirizzo in quelle pagine va aggiunto anche lì.
- `supabase/config.toml` tiene `verify_jwt = false` per `accesso-socio`:
  una pubblicazione dalla CLI non deve riattivare la verifica.
- I testi in `supabase/licenze/` devono restare identici byte per byte al
  database (`.editorconfig` impedisce all'editor di toccarli).
- `opera.html` legge il codice dell'opera dalla query string (`?film=codice`).
  Senza parametro mostra "Opera non trovata".
- **Le sale.** Un corto si apre dentro la Cortoteca e un evento dentro
  Eventi, sopra la pagina (`apriSala` in `cortoteca.js`, `apriEvento` in
  `eventi.js`): l'indirizzo diventa quello del corto o dell'evento, e
  indietro, Esc e la crocetta chiudono. Per questo `cortoteca.html` contiene
  il modello della pagina del corto (`<template id="modello-corto">`, da
  tenere allineato a `opera.html`) ed `eventi.html` scarica il `<main>`
  delle pagine evento. Dalla home, il clic su Eventi, Produzioni o Cortoteca
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
- La pagina Eventi divide gli eventi per `serie` (colonna di `eventi`, scelta
  dal modulo di gestione): l'ultima edizione con `long-story-short` va in
  evidenza col lettering, `short-talks` ha un blocco suo, gli eventi senza
  serie finiscono in "Altri eventi".
- La pagina Produzioni mette in evidenza il lavoro più recente, poi il
  blocco delle produzioni originali (`produzione_cdl`) e quello delle
  collaborazioni (`collaborazione_cdl`, nascosto finché è vuoto). Le due
  colonne di `opere` si escludono (vincolo nel database). Le schede
  (`.scheda-g`) stanno in `components.css`, condivise con Eventi.
- Eventi, Produzioni, Cortoteca, Vantaggi e 404 aprono con il nome della
  pagina a tutta larghezza (`.parola` con `.fit`, misurato da `adatta()`) e
  una presentazione (`.presentazione`) chiusa da un filo.
- La home ha quattro parti: l'apertura sulla sala vista dall'alto, al buio,
  con la torcia che segue il puntatore e il nastro delle ultime notizie;
  l'indice (Eventi, Produzioni, Cortoteca tutti dello stesso corpo, centrati
  e misurati sul disegno delle lettere con `data-preciso` e `data-uguali`:
  il nome più lungo tocca i margini; nel cambio di pagina il nome
  si allarga alla misura della testata; al passaggio prendono il colore della sezione e, tranne la
  Cortoteca, mostrano i tre più recenti e "Vedi tutti…");
  il rullino di fotografie, senza titolo; Sostieni in arancio. Nastro,
  elenchi e rullino li riempie `home.js`; il testo della quota ridotta del
  nastro sta in `data-quota`, nell'HTML.
- **Il rullino della home** si sceglie in gestione, scheda Rullino (tabella
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
  (`contatti.js`); `?motivo=socio` lo preseleziona. Dopo l'invio Netlify
  apre `contatti.html#grazie`, che mostra la conferma. Le notifiche email si
  impostano nel pannello di Netlify.
- `404.html` usa solo percorsi assoluti: Netlify la serve a qualsiasi
  profondità.
- **Pubblicazione**: Netlify costruisce solo i commit il cui autore è membro
  del team (l'account GitHub `cdl-aps`). Le pull request vanno unite da
  GitHub con quell'account, con un merge commit; un'unione fatta da un
  account personale blocca la pubblicazione di `main`. Le deploy preview
  falliscono per lo stesso motivo: non è un errore del codice. Conta l'autore
  dell'ultimo commit di `main`: dopo un push diretto da un account personale
  è bloccato anche un deploy caricato a mano (connettore o CLI). Si sblocca
  unendo con `cdl-aps` una pull request qualsiasi.
- Netlify pubblica tutta la radice: `netlify.toml` risponde 404 a
  `README.md`, `CLAUDE.md`, `supabase/`, `.github/` e `storico/`. Nuovi file
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
python3 -m http.server 5500                        # poi http://localhost:5500
```

Aprire almeno home, cortoteca, produzioni, eventi e una pagina di un corto:
sono le pagine che dipendono dal database, e quindi le prime a rompersi.
Provare anche una sala (clic su una still della Cortoteca e su una scheda di
Eventi, poi Esc e indietro) e le pagine a 375 px. Il server Python non manda
gli header di `netlify.toml`: la CSP di gestione e proposta si vede solo
online (o con un server che li aggiunga).
