# Handoff — correzioni del redesign, gestione, rullino della home (12 novembre 2026, sera)

Per la sessione che riprende da qui. Progetto `~/Code/CDL-Web`, branch
`redesign`. Il prossimo lavoro è il **piano delle pagine evento**
(`storico/2026-11-12-piano-pagine-evento.md`), a partire dalla fase 1, con
il via dell'utente. In parallelo l'utente continua a correggere il redesign
pagina per pagina.

## Da leggere prima (non ripetuto qui)

- `CLAUDE.md`: regole, convenzioni, la lista "da fare prima e dopo il
  deploy" (aggiornata in questa sessione) e la lista "Da fare più avanti".
- `storico/2026-11-12-piano-pagine-evento.md`: il piano concordato.
- `storico/2026-11-12-handoff-correzioni-redesign.md`: il passaggio
  precedente (strumenti di verifica, cose imparate). Questo lo aggiorna.

## Stato del codice

- Branch `redesign`, allineato a `origin/redesign` all'ultimo commit
  `6d3a7e5` (Documentazione: lista da spuntare per il deploy del redesign).
- **Nessun commit in questa sessione**: tutto il lavoro è nella copia
  locale, non committato (circa 42 file modificati più i nuovi
  `assets/js/gestione-rullino.js`, `data/rullino.json`,
  `assets/img/eventi/long-story-short-2026/artwork.jpg`,
  `supabase/migrations/20261112200000_rullino_home.sql`, i due documenti di
  `storico/` di oggi). L'utente decide quando committare.
- `storico/2026-11-12-handoff-redesign-nel-sito.md` aveva già una modifica
  non committata **prima** di questa sessione (due righe, dell'utente o di
  una sessione precedente): non toccata. Anche
  `storico/2026-11-12-handoff-correzioni-redesign.md` era non tracciato; qui
  gli è stata aggiunta solo la nota in cima.
- Versione di CSS e JS nelle pagine: `?v=2026-11-12zb`. Se si lavora in un
  altro giorno, nuova data ovunque (`sed` in `CLAUDE.md`).

## Database (progetto di produzione `rsspmqhhrykbmrkmwqcg`)

- **Applicata**: `20261112200000_rullino_home.sql` (tabella `rullino`,
  RLS, grant, le 8 foto di partenza). Il sito online non la usa, quindi non
  cambia nulla finché il redesign non è pubblicato. Verificato: lettura
  pubblica sì, scrittura senza accesso rifiutata, nessun avviso nuovo dagli
  advisor di Supabase.
- **Dati cambiati direttamente**, su richiesta dell'utente (si vedono già
  sul sito online): tagline di Interzona con il punto finale; colore
  `#a10000` di Relatività. Aggiornata anche `data/opere.json`.
- **Ancora da applicare**: `20261112180000_colonne_pubbliche.sql`, solo dopo
  il deploy (vedi `CLAUDE.md`). La tabella `rullino` ha un grant a livello di
  tabella e non ne è toccata.

## Cosa è stato fatto

In ordine sparso, tutto controllato nel browser (Chrome headless) a 1440 e
spesso a 375 px:

- **Pagine evento**: testi di Short Talks #1, #2, Nòt 2025/2026, LAIFF
  (blocco "In apertura" tolto, "I corti" come testata della serata);
  allineamento della striscia di foto col filo del primo elenco nelle serate
  senza testa (`evento.css`).
- **Long Story Short**: testi riscritti; galleria e vincitori senza titolo
  visibile; materiali spostati sotto la galleria; niente fili fra i
  blocchi; elenco dei premi (fonte: "LSS | Scaletta" e "LSS | Sviluppo" sul
  Drive); Path allineata alla griglia dei vincitori; **artwork della cover
  dietro la testata**, adattato al fondo (carta portata a `#f7f7f7`, grana
  tolta dove è vuota) e lungo fino al bordo inferiore della galleria.
- **Produzioni**: descrizione con grassetti; titolo grafico più grande;
  niente "spegnimento" delle schede al passaggio.
- **Contatti**: prima il modulo, poi Sostieni (che contiene il piede);
  "Scrivici" alto quanto la frase a fianco (`contatti.js`).
- **Sostieni** (home, Contatti, Vantaggi): un solo blocco uguale ovunque,
  quota ridotta in cima alla colonna, "Diventa socio" come quello della
  barra, "Contattaci" nero; in Vantaggi il rimando riporta in cima.
- **Barra**: "Diventa socio" porta a `vantaggi-tesseramento.html`.
- **Vantaggi**: testi, titoli arancio, spaziature uniformi, niente fili.
- **Cortoteca in arancio** (prova): una variabile `--cortoteca` in
  `base.css`; i titoli grafici delle opere prendono `opere.colore` (maschera)
  tranne in Produzioni; alone scuro sui titoli sopra le still.
- **Eventi**: blocco LSS in evidenza con grassetti e testo più largo;
  Short Talks con testo dal deck e "Mostra tutte le edizioni" (le prime 3);
  testo sotto "Altri eventi" (scritto dall'utente).
- **Home**: indice coi nomi misurati sul disegno delle lettere
  (`adattaPreciso` in `comune.js`, `data-preciso`): bordi ai margini entro
  1 px; al passaggio i 3 più recenti e "Vedi tutti…" (non sulla Cortoteca);
  tolto "Guarda i corti"; rullino senza titolo e **letto dal database**.
- **Piede** in tutte le pagine: solo logo e quattro righe di dati.
- **Gestione** nel nuovo design (campi come Contatti, fili sottili, numeri
  su schede bianche…), anche `riservato.css` (quindi `proponi.html`);
  tabella Soci allineata; bollino delle notifiche piccolo; ultime attività
  troncate a 10 con "Espandi"; tasto Indietro fra schede e moduli (history);
  **scheda Rullino** (`gestione-rullino.js`) con tre provenienze (Eventi
  lette dall'HTML delle pagine, Cortoteca, Altre foto caricate in
  `immagini/rullino/`), ordine, "Mescola".

## Cosa non è stato verificato

- **Tutte le scritture della gestione** (rullino: aggiungi, sposta, togli,
  Mescola, caricamento; salvataggi dei moduli dopo il restyling; tasto
  Indietro con dati veri): serve l'accesso di un redattore, solo l'utente ha
  password e 2FA. Le viste sono state viste con dati di esempio o con la
  lettura pubblica. La voce è nella lista di `CLAUDE.md`.
- Hover e movimenti dal vivo con il puntatore (solo simulati col focus).
- Safari e iPhone (già nella lista del deploy).

## Da sapere

- **Problemi aperti segnalati all'utente, senza risposta**:
  - col piede ridotto, sul telefono non c'è più un accesso a Contatti né a
    Instagram/YouTube dalla maggior parte delle pagine (la voce Contatti
    della barra è nascosta sotto i 760 px);
  - la Cortoteca arancio è una prova: in gestione l'aiuto del campo colore
    parla ancora di lilla; `CLAUDE.md` descrive ancora la Cortoteca lilla;
    sulla pagina di un corto la pillola Cortoteca accesa e "Diventa socio"
    sono identiche;
  - "Guarda" sulle opere con colore scuro (Relatività) ha la scritta nera
    poco leggibile;
  - i titoli arancio di Vantaggi sulla carta sono sotto il contrasto AA;
  - in `proponi.html` le etichette dei passi ("1 · IL CORTO") somigliano a
    eyebrow;
  - il tasto del rullino si chiama "Mescola" (l'utente aveva scritto
    "shuffle").
- `data/rullino.json` è la copia di riserva del rullino: non si aggiorna da
  sola, va rigenerata dal database (stessa forma della risposta REST).
- **Drive**: il connettore Google Drive del plugin fallisce
  (autenticazione). Funziona leggere i file `.gdoc`/`.gsheet` della copia
  sincronizzata (`~/Library/CloudStorage/GoogleDrive-…/Drive condivisi/`),
  prendere il `doc_id` e aprirli coi connettori Google Docs e Sheets. I
  materiali di LSS sono in "Eventi/7. Long Story Short…".
- **PDF**: `pdftoppm` non c'è; il testo si estrae con PDFKit di macOS
  (`pdftesto.swift`, sotto).
- **`letter-spacing` dei titoli** arriva ai `.fit` in px dal titolo che li
  contiene, non in em: non scala col corpo (vedi `adattaPreciso`).
- Il CSS dei moduli di gestione mette il filo fra i gruppi sulla legenda,
  non sul `fieldset` (la legenda lo interromperebbe).

## Strumenti (fuori dal repository)

Nella cartella degli strumenti del passaggio precedente,
`/var/folders/lj/v6tg1m8x7yxdhfvxfm2kn0000000gn/T/cdl-handoff-2026-11-12/strumenti/`
(temporanea: se sparisce, si riscrivono dalla descrizione), aggiunti:

- `cdp.mjs <url> <larghezza> <altezza> <png> [espressione]` — Chrome
  headless via DevTools: apre la pagina, valuta un'espressione (anche
  asincrona) e fotografa. Server locale: `python3 -m http.server 5511`.
- `anteprima-gestione.js` — da passare a `cdp.mjs` dopo `window.VISTA='…'`
  (`dashboard`, `opere`, `soci`, `opera`, `revisione`, `evento`,
  `accesso`): apre le viste di gestione senza accesso, con dati di esempio
  nello stesso markup di `gestione.js`.
- `inchiostro.py <png> y0:y1 …` — primo e ultimo pixel scuro per fascia
  (per misurare allineamenti).
- `artwork.py <sorgente> <uscita> <larghezza>` — adatta un'immagine al fondo
  del sito (carta → `#f7f7f7`, grana tolta dove è vuota).
- `testo_doc.py <json>` — testo leggibile da una risposta del connettore
  Google Docs salvata su file; `pdftesto.swift <pdf>` — testo di un PDF.

## Skill suggerite

- `frontend-design:frontend-design` — per la resa del modello delle pagine
  evento (fase 1 del piano).
- `code-review` — a fine fase 2 del piano e prima della pull request.
- `engineering:deploy-checklist` — al merge, con la lista in `CLAUDE.md`.
- `/handoff` (skill locale) — a fine sessione.
