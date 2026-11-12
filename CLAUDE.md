# Note per chi lavora su questo progetto

Sito statico di CDL APS. Nessun build step, nessuna dipendenza npm: i file
sorgente sono quelli pubblicati. Netlify serve la radice del repository così
com'è.

## Convenzioni

- **CSS**: `base.css` (variabili di brand e fondamenta) → `components.css`
  (elementi su più pagine) → `pages/<pagina>.css` (specifico). I tre fogli si
  caricano sempre in quest'ordine. Non reintrodurre blocchi `<style>` inline
  nelle pagine: erano la causa principale della duplicazione precedente.
- **JS**: un file per pagina in `assets/js/`, caricato in fondo al `<body>`.
  Fanno eccezione tre file comuni: `barra.js` (indicatore della barra, su
  tutte le pagine), `dati.js` (lettura di opere ed eventi, da caricare prima
  dello script della pagina) e `riservato.js` (parti condivise da
  `gestione.html` e `proponi.html`, dopo `dati.js`). Non ci sono moduli ES né
  bundler: le funzioni sono globali. Le librerie di terzi stanno copiate in
  `assets/js/vendor/` con la versione nel nome.
- **Identità visiva**: fondo carta, Montserrat 900 molto grande per i titoli,
  Instrument Serif in corsivo per tagline e frasi d'apertura, Inter per il
  testo. Le fotografie sono a spigolo vivo e non portano pannelli sopra: le
  scritte stanno sotto o accanto, appese a un filetto nero. Il lavanda del
  marchio si usa a campiture piene (fascia del sostegno, bollini). Etichette
  mai sotto gli 11 px (`--etichetta`), aree toccabili di almeno 44 px.
  Tailwind e Lucide restano solo su `cornicenarrativa.html`, perché
  `cornice.js` costruisce i blocchi con quelle classi; altrove le icone sono
  SVG scritte nell'HTML.
- **Barra e piede** sono ripetuti in ogni pagina: una modifica va portata su
  tutti i file HTML. Nella barra la voce della pagina corrente ha la classe
  `is-active` (le schede opera accendono Cortoteca, le pagine evento Eventi).
- **Frecce**: ↗ per aprire un contenuto, → per andare a un elenco o a
  un'altra pagina del sito, l'icona del link esterno solo per ciò che porta
  fuori.
- **Titolo della scheda del browser**: "Pagina – CDL APS".
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
  apposta). Se Supabase non risponde, ripiega su `data/opere.json` e
  `data/eventi.json`, copie di riserva con la stessa forma delle tabelle; le
  immagini, se mancano nel bucket `immagini`, ripiegano su `assets/img/`.
  La chiave segreta (*secret* / *service_role*) non va mai nel repository.
- Le pagine che leggono i dati (home, cortoteca, produzioni, eventi, opera)
  sono gusci riempiti a runtime. I testi arrivano da un modulo: nei modelli
  HTML vanno sempre passati da `esc()`, e i collegamenti da
  `indirizzoSicuro()`.
- Fra due produzioni CDL dello stesso anno conta come più recente quella
  inserita per ultima (id più alto).
- `gestione.html` è la pagina dei redattori: accesso con email e password
  via Supabase Auth, più il codice di un'app di autenticazione per chi l'ha
  attivato (pulsante Sicurezza 2FA). Le scritture sono protette dalla RLS, non
  dalla pagina. Le immagini caricate vengono ridimensionate a 2000 px e
  salvate come `<cartella>/<codice>-<campo>-<orario>.jpg` nel bucket
  `immagini`.
- **Chi è redattore** lo decide `privato.e_redattore()`: utente in
  `privato.redattori`, sessione nata dall'accesso con password (voce
  `password` nel campo `amr` del token) e, se l'utente ha un codice di
  verifica attivo, sessione di livello `aal2`. La condizione sulla password
  impedisce che il collegamento personale di un socio, che è anche redattore,
  apra la gestione.
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
    li copia in `immagini`.
- **Dashboard di gestione**: la prima scheda di `gestione.html`. "Da
  sistemare" compare solo lì; i numeri e le ultime attività arrivano da
  `public.cruscotto()`. Chi ha fatto l'ultima modifica a un'opera o a un
  evento lo scrive un trigger in `modificato_da`.
- **Header di sicurezza.** `netlify.toml` dà a `gestione.html` e
  `proponi.html` una Content-Security-Policy: solo script del sito, solo
  connessioni verso il progetto Supabase. Uno script, un font o
  un'immagine da un altro indirizzo in quelle pagine va aggiunto anche lì.
- `opera.html` legge il codice dell'opera dalla query string (`?film=codice`).
  Senza parametro mostra "Opera non trovata".
- Le pagine dei singoli eventi (`short-talks-1.html`, `blue-hour.html`…) sono
  statiche, sul modello di `longstoryshort.html`, e condividono
  `pages/evento.css`, dove sta anche il colore d'accento di ciascuna (classe
  sul `<body>`). Il riquadro dell'evento porta lì solo se il campo `pagina`
  del database contiene il nome del file: si compila quando la pagina è già
  online.
- La pagina Eventi divide gli eventi per `serie` (colonna di `eventi`, scelta
  dal modulo di gestione): l'ultima edizione con `long-story-short` va in
  primo piano col marchio, `short-talks` ha un blocco col suo lettering, gli
  eventi senza serie finiscono in "Altri eventi".
- La pagina Produzioni mette in primo piano il lavoro più recente, poi il
  blocco delle produzioni originali (`produzione_cdl`) e quello delle
  collaborazioni (`collaborazione_cdl`, nascosto finché è vuoto). Le due
  colonne di `opere` si escludono (vincolo nel database). Primo piano,
  titoli dei blocchi e griglia stanno in `components.css`, condivisi con
  Eventi.
- Eventi, Produzioni e Cortoteca aprono con la stessa testata
  (`.testa-pagina`): nome della pagina a caratteri cubitali e una riga di
  presentazione.
- La home ha quattro parti: apertura a tutto schermo sulla foto di sala,
  attività recenti (riempite da `home.js`), il rullino di fotografie degli
  eventi (scritto a mano in `index.html`: ogni foto porta alla pagina del suo
  evento) e la fascia lavanda del sostegno.
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
  (`base.css?v=2026-10-09`), perché Netlify li fa tenere in cache una
  settimana: quando li modifichi aggiorna la data in tutte le pagine
  (`sed -i '' 's/v=VECCHIA/v=NUOVA/g' *.html`).
- `assets/js/cornice.js` è il generatore interattivo di Long Story Short 2026:
  autonomo, con i propri dati incorporati, e alcune funzioni sono richiamate da
  attributi `onclick` nell'HTML — vanno mantenute globali.

## Verifica prima di pubblicare

```bash
python3 -m json.tool data/opere.json > /dev/null  # le copie di riserva sono valide
python3 -m json.tool data/eventi.json > /dev/null
python3 -m http.server 5500                        # poi controlla le pagine
```

Aprire almeno home, cortoteca, produzioni, eventi e una scheda opera: sono le
pagine che dipendono dal database, e quindi le prime a rompersi.
