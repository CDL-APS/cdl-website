> **12 novembre 2026, sera** — superato da
> `storico/2026-11-12-handoff-gestione-e-rullino.md` (correzioni fatte in
> questa sessione, rullino della home, gestione nel nuovo design) e dal
> piano `storico/2026-11-12-piano-pagine-evento.md`.

# Handoff — per la prossima sessione: correzioni del redesign (12 novembre 2026)

Per la sessione che riprende da qui. Progetto: `~/Code/CDL-Web`, branch
`redesign`. Si riprende con l'utente che prova la gestione e continua a
correggere il redesign: il prossimo agente lo aiuta in queste correzioni e
lo accompagna verso il deploy.

## Da leggere prima di tutto (non ripetuto qui)

- `CLAUDE.md` — regole del progetto, aggiornate al nuovo design. **In cima
  c'è la lista "Redesign: da fare prima e dopo il deploy"**: va tenuta
  aggiornata lì e ricordata all'utente quando si parla di pubblicare.
- `storico/2026-11-12-handoff-redesign-nel-sito.md` — cosa è stato fatto,
  decisioni, migrazioni, come è stato verificato, cosa non lo è stato.
- `storico/2026-11-12-piano-porting-redesign.md` — il piano eseguito (fasi
  0–9). `storico/2026-11-11-design-handoff.md` — le specifiche visive.
- Commit: da `7212996` (Fase 0) a `6d3a7e5` (documentazione), un commit per
  fase: `git log --oneline 3a1429f..redesign`.

## Stato al momento del passaggio

- Branch `redesign` pubblicato su `origin/redesign`, pulito, allineato.
  **Pull request non aperta**: la apre l'agente solo se l'utente lo chiede;
  va unita da GitHub con l'account `cdl-aps` e un merge commit.
- Database (Supabase, progetto di produzione `rsspmqhhrykbmrkmwqcg`):
  `colore_e_solo_scheda` applicata; `20261112180000_colonne_pubbliche.sql`
  **da applicare solo subito dopo il deploy** (prima romperebbe il sito
  online, che usa `select=*`). Nessuna migrazione va applicata senza un sì
  dell'utente.
- L'utente sta provando la gestione con il suo accesso (password e 2FA: non
  inserirli mai al suo posto) e lavora in parallelo nello stesso
  repository: prima di committare, `git status` e `git diff` per non
  includere il suo lavoro in corso senza chiederlo.
- Server locale: `python3 -m http.server 5500` dalla radice, poi
  `http://localhost:5500` (era avviato dalla sessione precedente; se non
  risponde, riavviarlo). Il comando è anche in cima a `CLAUDE.md`: l'utente
  non se lo ricorda, va ricordato.
- In questo progetto c'è una skill locale `/handoff` (`.claude/skills/handoff/`,
  esclusa da git) che salva i passaggi di consegne in `storico/` in
  italiano; quella sincronizzata da claude.ai salva invece nella cartella
  temporanea del sistema (questo documento è nato lì ed è stato spostato).

## Cose imparate che non stanno nei documenti

- Le anteprime non esistono più: le pagine HTML della radice sono la fonte.
  Si modificano a mano; barra e piede sono ripetuti in ogni pagina.
- Ogni modifica a CSS o JS richiede di aggiornare `?v=` in tutte le pagine
  (oggi `2026-11-12`; se si cambia in un altro giorno, nuova data ovunque).
- La cascata conta: `components.css` viene prima dei fogli di pagina, quindi
  una regola di componente con la stessa specificità di `.btn` deve essere
  più forte (es. `.nav .nav__socio`). `main > section` di `components.css`
  si applica anche alle pagine riservate: lo annulla `riservato.css`.
- Un `url()` dentro una variabile CSS si risolve rispetto al foglio che usa
  la variabile, non a quello che la dichiara: i loghi degli eventi hanno
  percorsi assoluti.
- Sulla cornice narrativa (Tailwind) la `.grid` del sito si mescola con
  quella di Tailwind; il `<body>` ha la classe `pagina-cornice`.
- Il server locale sulla 5500 dell'utente si è fermato da solo durante la
  sessione: se una pagina non risponde, controllare prima il server.
- I commenti e i testi dell'interfaccia sono in italiano; mai "eyebrow"
  (etichette piccole in maiuscolo sopra i titoli).

## Strumenti di verifica (fuori dal repository)

Stanno nella cartella temporanea di macOS, che il sistema svuota col tempo:
`/var/folders/lj/v6tg1m8x7yxdhfvxfm2kn0000000gn/T/cdl-handoff-2026-11-12/`.
Se non ci sono più, si riscrivono seguendo la descrizione qui sotto.

In `strumenti/` (Node 23 e Python 3 con Pillow, nessuna dipendenza da
installare):

- `foto.mjs <spec.json>` — Chrome headless via DevTools: fotografa pagine
  intere o a passi (`move`, `click`, `clicksel`, `key`, `scroll`, `eval`,
  `shot`, `full`), raccoglie errori di console e richieste fallite,
  emula `prefers-reduced-motion`, blocca indirizzi (`blocca`) e sostituisce
  risposte (`sostituisci`: JSON trasformato o file locale). Così si sono
  provati titolo PNG, carattere, colore e sola scheda senza toccare il
  database.
- `spec.py <prefisso-url> <uscita> <ridotto 0/1> [pagine]` — genera le spec
  di tutte le pagine a 1440 e 375 px.
- `confronta.py prima dopo` e `affianca.py <nome> [y0 y1] [scala]` —
  differenze pixel per pixel e immagini affiancate.
- `server_csp.py <radice> <porta>` — serve il sito con gli header di
  `netlify.toml` (CSP compresa) e la 404 come Netlify.

In `foto-anteprime/`: le foto delle anteprime approvate (1440 e 375 px, con
movimento ridotto), l'unico riferimento visivo rimasto. Le anteprime stanno
comunque nella storia di git: `git show ea38542^:anteprime/<pagina>.html`.

Prima di consegnare una modifica con movimento (hover, scorrimento, sale),
provarla dal vivo con il puntatore, non solo con scatti fermi.

## Skill suggerite

- `taste-skill:design-taste-frontend` e `frontend-design:frontend-design` —
  per le correzioni visive del redesign; dove contraddicono il marchio
  (lilla, Montserrat 900 maiuscolo) vince il marchio.
- `anthropic-skills:built-in-browser` o `run` — per guardare le pagine
  insieme all'utente; in alternativa gli strumenti qui sopra.
- `code-review` — prima di aprire la pull request.
- `engineering:deploy-checklist` — al momento del merge, insieme alla lista
  in cima a `CLAUDE.md`.
- `/handoff` (skill locale del progetto) — a fine sessione, per lasciare il
  passaggio in `storico/`.
