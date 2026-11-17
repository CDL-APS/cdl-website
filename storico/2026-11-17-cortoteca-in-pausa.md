# Cortoteca in pausa (dal 17 novembre 2026)

Il 17 novembre 2026 l'utente ha messo in pausa la Cortoteca, perché sono
cambiate le necessità dell'associazione. Il deploy del redesign esce con la
parte principale del sito e con la domanda di ammissione a socio online
(`storico/2026-11-17-piano-iscrizione-online.md`), **senza**:

- la galleria pubblica della Cortoteca, che però c'è sul sito vecchio, in
  `main`: col deploy sparisce;
- l'area socio (accesso dei soci, proposte dei corti, licenze);
- in gestione, le schede Dashboard, Proposte e Soci.

Questo documento dice cosa si spegne e dove, cosa resta acceso e come
riprendere. Il progetto completo della Cortoteca resta in
`storico/2026-11-11-cortoteca-infrastruttura.md`, e in `CLAUDE.md` alla
voce "Cortoteca, proposte dei soci".

## Cosa resta pubblico

- **`opera.html`, la pagina del corto.** La usano Produzioni (con il
  passaggio del fotogramma), il rullino della home, le pagine evento (le
  voci del programma) e i redirect `/cortoteca/info_film2?film=…`. Le schede
  dei corti dei soci (Verso Mare, Lupara Verde, Andrea) restano raggiungibili
  dalle pagine evento che li hanno proiettati, non da un elenco.
- `corto.js`, `dati.js`, `titoloGrafico()` e il resto di `comune.js`: sono
  di tutto il sito.

## Cosa si spegne, e dove

### Sito pubblico

| Dove | Cosa |
|---|---|
| Tutti gli HTML (barra) | Tolta la pillola `<a class="nav__cortoteca" href="cortoteca.html">`. "Diventa socio" resta a destra con `margin-left: auto` su `.nav .nav__socio` (`components.css`). |
| `index.html` | Tolti `li.sezione--cortoteca` dall'indice e gli occhi `.occhi-bordo`. L'indice resta su Eventi e Produzioni (`uguaglia()` regge con due voci). |
| `assets/js/dati.js` | `const CORTOTECA_ATTIVA = false`, accanto a `MODELLO_EVENTI`: l'interruttore letto da `home.js`, `corto.js`, `gestione.js` e `gestione-rullino.js`. |
| `assets/js/home.js` | Con l'interruttore spento: niente voce "In Cortoteca N opere" nel nastro; una foto del rullino legata a un'opera non pubblicata non porta da nessuna parte (prima andava a `cortoteca.html`); la didascalia dei corti non CDL dice "Cortometraggio" invece di "Cortoteca". |
| `assets/js/corto.js` | Con l'interruttore spento, la pagina del corto senza video non mostra la pillola "Streaming in arrivo": oggi è una promessa che non vale. |
| `vantaggi-tesseramento.html` | Tolta la voce "Cortoteca" fra i vantaggi e la parola nella descrizione. |
| `contatti.html` | Tolto il motivo "Un corto per la Cortoteca". |
| `404.html` | Tolto il tasto "Vai alla Cortoteca". |
| `opera.html` | Descrizione: "Un cortometraggio di CDL APS." |
| Pagine evento e `modello-evento.js` | L'etichetta "Nella Cortoteca" accanto ai corti del programma diventa "Scheda del corto". |
| `netlify.toml` | `/cortoteca.html`, `/cortoteca` e `/cortoteca/` → `/produzioni.html` (302, prima della regola `/cortoteca/*`). `/area-socio.html`, `/area-socio`, `/proponi.html` e `/proponi` → `/` (302, al posto dei 301 verso l'area socio). `/cortoteca/info_film2` resta com'è. |

I file `cortoteca.html`, `assets/js/cortoteca.js`,
`assets/css/pages/cortoteca.css`, `area-socio.html`, `assets/js/area-socio.js`
e `assets/css/pages/area-socio.css` **restano nel repository**: i redirect li
rendono irraggiungibili. Restano anche gli header di sicurezza
dell'area socio in `netlify.toml`, e le regole CSS di `.nav__cortoteca` e
degli occhi della home, inutili ma innocue.

### Gestione

| Dove | Cosa |
|---|---|
| `assets/js/gestione.js` | `SCHEDE_IN_SVILUPPO` comprende `dashboard`, `proposte` e `soci` oltre a `eventi`. Una scheda in pausa mostra solo l'avviso (`mostraInSviluppo`, con un testo per scheda) e nasconde cruscotto, pannello dei soci, rullino e bozze. La scheda di partenza è Opere. `caricaAvvisi()` non gira (niente rpc `avvisi`, niente contatori sulle schede, niente segno "Senza licenza"). Nel modulo opera il gruppo "Cortoteca" (titolare) resta nascosto e `preparaTitolare` non legge `elenco_soci` né `opere_titolari`: il titolare già registrato nel database non cambia. |
| `gestione.html` | Etichetta "In sviluppo" su Dashboard, Proposte e Soci, come su Eventi. Testi del modulo opera senza "Cortoteca". |
| `assets/js/gestione-rullino.js` | La provenienza "Cortoteca" si chiama "Fotogrammi delle opere" (sono i fotogrammi di tutte le opere, produzioni comprese); "Porta a" non offre più la pagina `cortoteca.html`. |

`riservato.js` non si tocca: le parti della Cortoteca restano lì, inutilizzate
dalla gestione, perché le usa anche `area-socio.js`.

## Cosa resta acceso

- **Supabase**: tabelle, funzioni, regole e bucket della Cortoteca
  (`proposte`, `licenze`, `testi_licenza`, `privato.soci`, inviti…) restano
  come sono, già applicati in produzione. Senza pagine che li usano sono
  innocui.
- **Edge Function `accesso-socio`**: resta pubblicata. Funziona solo con un
  collegamento personale valido, e nessuno ne crea di nuovi.
- **`supabase/foglio/sincronizza-soci.gs`** nel foglio "Gestione APS
  (fogli)": continua a sincronizzare i soci ogni notte e a ogni modifica,
  così alla ripresa il database è aggiornato. Gli **avvisi via mail**
  ("Cortoteca: cose da sistemare") vanno spenti durante la pausa: menu
  Cortoteca del foglio → Destinatari degli avvisi → lasciare vuoto (lo fa
  l'utente).
- La migrazione `20261113200000_colonne_pubbliche.sql` riguarda tutto il
  sito, non la Cortoteca: si applica comunque dopo il deploy.

## Da fare alla ripresa

1. Rimettere la pillola nella barra di tutte le pagine, la voce dell'indice
   in home (con gli occhi), le voci in Vantaggi, Contatti e 404.
   `git log` sul commit della pausa mostra esattamente cosa è stato tolto.
2. `CORTOTECA_ATTIVA = true` in `dati.js`: riaccende da solo anche le
   schede Dashboard, Proposte e Soci, la Dashboard come scheda di partenza,
   gli avvisi e il titolare delle opere in gestione. Poi togliere le
   etichette "In sviluppo" di quelle tre schede in `gestione.html` e
   rimettere la soglia di 520 px per Contatti nella barra
   (`components.css`).
3. `netlify.toml`: togliere i 302 di Cortoteca e area socio; rimettere i 301
   `/proponi` → `/area-socio.html`.
4. Riaccendere gli avvisi del foglio, e reincollare nel foglio
   `supabase/foglio/sincronizza-soci.gs` (dal 17 novembre si ferma con un
   errore se un numero di tessera compare due volte; durante la pausa non
   serve, perché i numeri li assegna la web app della domanda online).
5. Rifare `/code-review` e `/security-review` sul branch della ripresa:
   nel frattempo il database e la domanda di ammissione online (che scrive
   nello stesso libro soci) saranno cambiati.
6. Fare le prove della sezione qui sotto sul deploy di prova.
7. Dopo la pubblicazione: rigenerare dal sito online ("Nuovo collegamento",
   scheda Soci) i collegamenti dei soci creati in locale o sul deploy di
   prova, che puntano a `localhost` o a `redesign--cdl-aps.netlify.app`.

### Interazioni con la domanda di ammissione online

- La domanda online scrive nelle schede `TESSERATI <anno>` **senza numero
  di tessera** finché il tesoriere non segna il pagamento: la
  sincronizzazione salta le righe senza `#`, quindi in Supabase arrivano
  solo i soci che hanno pagato.
- `email_in_regola` guarda l'anno della scheda e `pagato`, non la data di
  pagamento: da ricontrollare alla ripresa insieme al cambio d'anno della
  domanda online (dal 1° gennaio).

## Da fare più avanti, congelato con la pausa

- Ordinamenti della Cortoteca: "Per nome", "Per regista" e "A-Z" (oggi
  "Per anno" e "Per nome"). "Per regista" raggruppa i corti sotto il nome di
  ciascun regista; il nome apre un pop-up con alcune informazioni sul
  regista, che ogni socio può modificare dall'area socio.
- Ricerca globale: cerca un nome in tutte le informazioni di un corto, non
  solo titolo e regista ("Andrea" trova il corto Andrea e tutti quelli con
  un attore o una maestranza che si chiama Andrea).
- Regolamento, licenza e delibera della Cortoteca: sono ancora bozze per il
  Consiglio direttivo (`storico/2026-11-11-cortoteca-infrastruttura.md`).

## Prove da fare alla ripresa

Spostate qui il 17 novembre da `storico/2026-11-14-prove-sito-online.md`.

### Pagine

- [ ] **Home, indice**: Eventi, Produzioni e Cortoteca hanno lo stesso
  corpo, centrati; al passaggio prendono il colore della sezione.
- [ ] **Cortoteca**: galleria, ordinamenti, ricerca; clic su una still: la
  sala del corto si apre sopra; Esc, crocetta e indietro la chiudono.
- [ ] `/proponi.html` e `/proponi` portano all'area socio (301).

### Gestione

- [ ] Dashboard: numeri, ultime attività, "Da sistemare" (solo cose da
  fare).
- [ ] Proposte: elenco delle proposte inviate; se un socio ha una bozza
  aperta compare la riga "Bozze in preparazione" con il solo nome.
- [ ] Soci: elenco, stato del collegamento accanto a ogni socio, nota dei
  soci senza email.

### Area socio (serve un socio di prova)

Il collegamento **non vale per le email dei redattori**: serve un socio nel
libro soci (foglio `TESSERATI <anno>`, con numero di tessera, poi
sincronizzazione) con un indirizzo diverso da quello di redattore, e in
regola con la quota se si vuole arrivare fino all'approvazione.

- [ ] Gestione → Soci → "Nuovo collegamento" per il socio di prova; copia
  il messaggio. Il collegamento punta al deploy di prova.
- [ ] Apri il collegamento (meglio da un altro browser o dal telefono): la
  pagina chiede subito la password, almeno 6 caratteri, da ripetere.
- [ ] Chiudi la pagina prima di sceglierla e riaprila: chiede ancora la
  password.
- [ ] Scelta la password: si entra nell'area socio. Esci.
- [ ] Rientra con email e password. Una password sbagliata dà un messaggio
  chiaro.
- [ ] Riapri lo stesso collegamento: non deve più funzionare (vale una volta
  sola). In gestione lo stato diventa "usato il…".
- [ ] "Nuovo collegamento" per un socio che ne ha già usato uno: la
  gestione chiede conferma.

### Proposta di un corto, dall'inizio alla fine

- [ ] Area socio: nuova proposta, scegli "Cortoteca" (streaming) o "sola
  scheda", compila (durata, anno, regia, sinossi e fotogramma sono
  obbligatori), aggiungi Letterboxd o IMDb, carica il fotogramma ed
  eventualmente il titolo grafico.
- [ ] Lascia la proposta a metà ed esci: in gestione la proposta **non**
  compare fra quelle da rivedere; c'è solo il nome del socio in "Bozze in
  preparazione".
- [ ] Rientra, rispondi al questionario, accetta il testo e invia.
- [ ] Gestione → Proposte: la proposta c'è con il fotogramma visibile.
  "Chiedi modifiche": il socio la ritrova da correggere, la corregge e la
  reinvia.
- [ ] "Approva e pubblica": l'opera nasce in Cortoteca con fotogramma,
  titolo grafico, tasti Letterboxd/IMDb; con la sola scheda la pagina non
  promette lo streaming.
- [ ] L'area socio mostra la proposta come approvata.

### Header e pulizia

- [ ] `curl -sI` su `/area-socio.html` e `/area-socio`: Content-Security-Policy,
  `Cache-Control: no-store`, `Referrer-Policy: no-referrer`.
- [ ] Cancellare l'opera nata dalla proposta di prova (o nasconderla) e la
  proposta, con la sua licenza (servono query sul database); togliere il
  socio di prova dal libro soci.
