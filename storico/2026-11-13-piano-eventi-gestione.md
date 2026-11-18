# Piano — riprendere la gestione degli eventi e le pagine composte (13 novembre 2026)

Per il prossimo agente che riprende la gestione degli eventi. Il deploy del
redesign esce **senza**: la scheda Eventi della gestione è ferma ("In
sviluppo") e ogni evento usa la sua pagina scritta a mano. Questo documento
dice cosa c'è già, cosa è spento e come, cosa è emerso dalle verifiche e
cosa resta da fare, in ordine.

Da leggere prima, oltre a `CLAUDE.md`:

- `storico/2026-11-12-piano-pagine-evento.md` — il piano originale (forma dei
  blocchi, inventario delle otto pagine, fasi 1–3, domande aperte);
- `storico/2026-11-12-handoff-gestione-e-rullino.md` — come sono nati
  modello, modulo a blocchi e rullino;
- `storico/2026-11-12-review-pre-deploy.md` — la prima review, che **ha
  escluso** il modello degli eventi;
- in cima a `assets/js/modello-evento.js` — tipi di blocco e sintassi del
  testo.

## Perché è in pausa

Il 12 novembre sono state fatte le fasi 1 e 2 del piano originale: il
modello `evento.html?e=<codice>` e il modulo a blocchi in gestione. Il 13,
prima del deploy, l'utente ha deciso di non pubblicarli:

- il modulo a blocchi **non è mai stato provato con un accesso vero**
  (caricamento di logo e foto nello spazio `immagini`, salvataggio dei
  blocchi, anteprima, eliminazione);
- il codice del modello **non è mai stato rivisto** (né `/code-review` né
  `/security-review`): la review pre-deploy l'ha escluso apposta;
- la verifica da telefono della gestione (13 novembre, con l'accesso
  simulato) ha trovato diversi problemi di impaginazione nella gestione, e
  il modulo evento a blocchi su telefono non è mai stato guardato;
- l'utente non aveva tempo per le prove prima della pubblicazione.

## Cosa è spento, e dove (tre interruttori)

| Dove | Cosa | Effetto |
|---|---|---|
| `assets/js/dati.js` | `const MODELLO_EVENTI = false` | `conModello()` dà sempre falso: `paginaEvento()` dà il file scritto a mano, la sala di Eventi scarica il `<main>` del file, la scheda Rullino legge le gallerie dall'HTML, la scheda di Eventi non usa le foto dei blocchi. `evento.html?e=<codice>` rimanda al file scritto a mano o, se non c'è, dice "evento non trovato" (`evento.js`). |
| `assets/js/gestione.js` | `SCHEDE_IN_SVILUPPO = new Set(['eventi'])` | La scheda Eventi mostra un avviso al posto dell'elenco, niente "Nuovo evento", `apriEvento()` esce subito. |
| `gestione.html` | `<span class="g-sviluppo">In sviluppo</span>` nella scheda Eventi; gruppi "Pagina dell'evento" e "Blocchi" e tasto Anteprima con `hidden`; gruppo "Immagini" (miniatura, copertina) rimesso | L'etichetta nella barra. Il modulo, se riaperto con il solo `MODELLO_EVENTI` spento, è quello delle pagine scritte a mano: miniatura e copertina, niente blocchi. I campi nascosti restano nel modulo, così un salvataggio conserva quello che c'è nel database. |

Nel database **non è cambiato niente**: la migrazione
`20261112210000_eventi_a_blocchi.sql` è applicata (colonne `logo`, `colore`,
`instagram`, `sfondo`, `presentazione`, `blocchi`) e Short Talks #1 ha già
presentazione e blocchi. Col modello acceso si comporrebbe da lì invece che
da `short-talks-1.html`.

Mentre la scheda è ferma, un evento nuovo o una correzione si fanno a mano:
riga in `public.eventi` (dashboard di Supabase o SQL), pagina HTML sul
modello di `longstoryshort.html`, colore e logo in `pages/evento.css`, poi
il campo `pagina`. Aggiornare anche `data/eventi.json`.

## Cosa c'è già (codice)

- `evento.html` + `assets/js/evento.js` — la pagina modello; legge l'evento
  pubblicato con la chiave pubblica, o i dati dell'anteprima da
  `localStorage` (`cdl-anteprima-evento`).
- `assets/js/modello-evento.js` — disegno di testata e blocchi
  (`componiEvento`, `vestiEvento`, `blocchiEvento`, `serata`, `striscia`,
  `voceProgramma`), sintassi del testo (`inRiga`, `inParagrafi`,
  `REGOLE_RIGA`), logo affiancato o sopra secondo le proporzioni
  (`LOGO_AFFIANCATO = 2.5`), corti collegati alla Cortoteca
  (`opereCollegate`). Usato anche dalla sala di `eventi.html`.
- `assets/js/gestione-eventi.js` — il modulo a blocchi: logo PNG con
  anteprima nel colore, colore, presentazione, Instagram, sfondo, blocchi
  `programma` e `testo` (aggiungi, sposta, togli; voci con corto della
  Cortoteca; foto con caricamento multiplo, ordine e descrizione),
  `caricaFileEvento()` che carica logo e foto in `immagini/eventi/<codice>/`,
  anteprima. **I blocchi di altri tipi** (foto, vincitori, materiali,
  partner: servono a Long Story Short) **non si modificano dal modulo**: li
  mostra come "non si modifica ancora da qui".
- `assets/css/pages/evento.css` — stili condivisi fra pagine scritte a mano e
  modello; `pages/gestione.css` — stili del modulo (`.g-blocco`,
  `.g-blocchi`, `.g-logo-evento`, `.g-riga-voce`).

## Cosa è emerso dalle verifiche (13 novembre)

Dalla review del 13 novembre e dal controllo da telefono:

1. **Campi nascosti e validazione.** I gruppi nascosti con `hidden` hanno
   campi con `pattern` e `type="url"` (Instagram dell'evento e delle serate,
   colore). Il browser li valida comunque: un valore non valido nel database
   bloccherebbe "Salva" con un errore che non si vede. Oggi i valori sono
   validi; se si torna a nascondere gruppi, usare `disabled` sul `fieldset`
   (i valori si leggono e si salvano lo stesso: `leggiModulo()` scorre
   `modulo.elements` senza guardare `disabled`, e i campi `disabled` sono
   esclusi dalla validazione).
2. **`evento.html` senza pagina scritta a mano.** Corretto: col modello
   spento dice "evento non trovato". Col modello acceso un evento senza
   presentazione né blocchi e senza `pagina` si compone lo stesso (solo
   testata): decidere se va bene.
3. **Ripieghi che dipendono dal modello.** La scheda di Eventi senza logo e
   senza miniatura usa la prima foto dei blocchi (`eventi.js`, riga ~79,
   `fotoEvento()` in `dati.js`); la scheda Rullino prende le foto dai blocchi
   se l'evento ha il modello (`gestione-rullino.js`, riga ~369). Il rullino
   della home contiene già foto di Short Talks #1 scelte dai blocchi: i
   percorsi `assets/img/eventi/short-talks-1/…` esistono anche nel file
   scritto a mano, quindi restano valide; verificarlo quando si riaccende.
4. **Gestione da telefono.** Corretti il 13: barra delle schede (sfuma a
   destra, la scheda attiva si centra, sotto i 960 px va su una seconda
   riga), righe degli elenchi (segni sotto il titolo), tasti di Soci, piede
   fisso dei moduli più compatto, email nascosta sotto i 1200 px. **Mai
   guardati su telefono**: il modulo evento a blocchi (`.g-blocco`,
   `.g-riga-voce` con quattro colonne che sotto i 760 px diventano una,
   comandi sposta/togli, striscia delle foto) e l'anteprima. Con
   l'etichetta "In sviluppo" tolta la barra si accorcia: rimisurare le
   soglie (960 e 1200 px).
5. **Mai rivisto**: tutto il codice elencato sopra. In particolare per la
   `/security-review`: `inRiga()` (collegamenti `[testo](indirizzo)` → deve
   passare da `indirizzoSicuro()`; `@nome` → tag Instagram), `collegamento()`,
   la validazione di `POST_INSTAGRAM`, i percorsi delle foto
   (`immagineEvento()` in `dati.js` accetta solo `assets/img/eventi/…` ed
   `eventi/…`), la lettura dell'anteprima da `localStorage` (dati del
   redattore, ma la pagina è pubblica: niente HTML non passato da `esc()`),
   il caricamento nello spazio `immagini` (le regole di `storage.objects`
   stanno in `20261009120000_schema_iniziale.sql`: chi può scrivere in
   `eventi/`?).
6. **Domande aperte** (dal piano originale, ancora aperte): sintassi del
   testo o piccolo editor; colonne `copertina` e `miniatura` (oggi di nuovo
   nel modulo, perché servono alla scheda e al rullino); tabella
   `eventi_opere` (corti nati dall'evento, nessuna interfaccia); i pezzi
   propri di Long Story Short (lettering della serie, artwork, vincitori,
   materiali, partner).

## Il lavoro, in ordine

Ogni passo si chiude con un controllo dell'utente prima del successivo.

### 1. Riaccendere in locale (branch nuovo da `main`)

- `MODELLO_EVENTI = true` in `dati.js`; togliere `'eventi'` da
  `SCHEDE_IN_SVILUPPO` e lo `<span class="g-sviluppo">` in `gestione.html`;
  togliere `hidden` ai gruppi "Pagina dell'evento" e "Blocchi" e al tasto
  Anteprima.
- Decidere con l'utente se il gruppo "Immagini" (miniatura e copertina)
  resta accanto ai blocchi (domanda aperta 6).
- Controllare in locale: Eventi (scheda e sala di Short Talks #1, che torna
  composta), `evento.html?e=short-talks-1`, home (elenco e rullino),
  `short-talks-1.html` invariata.

### 2. Review del modello

- `/code-review` sul diff del modello (i file del paragrafo "Cosa c'è già" e
  la migrazione `20261112210000_eventi_a_blocchi.sql`), con le regole di
  `CLAUDE.md`.
- `/security-review` sugli stessi file, con i punti del n. 5 qui sopra.
- Correggere, poi aggiornare `storico/` con gli esiti.

### 3. Prove

- **Con l'accesso simulato** (l'agente, prima dell'utente):
  `storico/strumenti/gestione-finta.js` apre la gestione con una sessione
  finta e le risposte di Supabase servite dalle copie di riserva, senza
  scrivere niente. Estenderlo al modulo evento: aprire Short Talks #1,
  aggiungere e spostare blocchi, voci, foto (le scritture vengono bloccate e
  stampate: controllare il contenuto di `blocchi` che il modulo
  manderebbe). Misure e schermate a 375, 414, 600, 768, 1024 px.
- **Con l'accesso vero** (solo l'utente): un evento di prova con logo,
  colore, presentazione, un programma con un corto della Cortoteca e qualche
  foto, un testo; Anteprima prima di salvare; salvarlo pubblicato,
  guardarlo in Eventi (sala) e da `evento.html?e=<codice>`; modificarlo
  (spostare una foto, togliere un blocco); eliminarlo. Controllare in
  Supabase che le foto tolte non restino orfane in `immagini/eventi/<codice>/`
  (oggi nessuno le cancella: decidere se serve).
- Telefono: le pagine composte e la sala a 375 px, come le pagine scritte a
  mano (vedi la lista di controllo in `CLAUDE.md`).

### 4. Fase 3 del piano originale: convertire le altre sette pagine

Short Talks #2, LAIFF, Nòt 2025 e 2026, OFF, Blue Hour, Long Story Short.
Per ciascuna: dati nei blocchi con una migrazione (riproducibile, come per
Short Talks #1), confronto con l'originale a 1440 e 375 px, sala, passaggio
del logo. Long Story Short richiede i blocchi `foto`, `vincitori`,
`materiali`, `partner` anche nel modulo (oggi solo nel modello). Poi:

- redirect in `netlify.toml` dai file vecchi a `evento.html?e=…` (tenere i
  file finché i redirect non sono online);
- pulizia di `pages/evento.css` (classi `evento--<pagina>` e
  `marchio--<pagina>`), dei file HTML e del campo `pagina`;
- la scheda Rullino legge le foto solo dai blocchi; aggiornare
  `data/rullino.json` e `data/eventi.json`.

### 5. Pubblicare

- Verifica prima di pubblicare (`CLAUDE.md`), `/code-review` del diff
  completo, pull request unita con `cdl-aps` e un merge commit.
- Aggiornare `CLAUDE.md`: togliere la voce "Pagine evento composte dal
  database" da "Da fare più avanti", riscrivere il paragrafo omonimo in
  "Punti da conoscere" (niente più pausa), togliere `SCHEDE_IN_SVILUPPO` se
  vuoto e `MODELLO_EVENTI` se non serve più.

## Strumenti

- `storico/strumenti/gestione-finta.js` — gestione con accesso simulato (uso
  nel commento in cima). Richiede `puppeteer-core` installato fuori dal
  repository e Chrome. Non scrive nel database.
- Per le pagine pubbliche bastano Chrome headless e lo stesso
  `puppeteer-core`: misure di scorrimento orizzontale, aree sotto i 44 px,
  scritte sotto gli 11 px, schermate a pagina intera (attenzione: nelle
  schermate a pagina intera gli elementi `position: sticky`, come il piede
  dei moduli, compaiono a metà pagina; guardare anche la sola finestra).
