# Passaggio di consegne: la serata del 27 novembre, la vetrina della home, la Dashboard (21 novembre 2026)

Per chi apre la prossima sessione. Tutto è online su cdlaps.com (PR #12 e
#13, unite in `main`); niente è a metà. I dettagli stanno in `CLAUDE.md`,
qui c'è il riassunto e ciò che resta da fare.

## Cosa è cambiato

- **La serata per i soci del 27 novembre 2026** (`evento-interzona.html`,
  evento id 9, codice `evento-interzona`, titolo pubblico "Evento
  riservato ai soci"; "A/V LIVE SET" è solo la scritta grafica).
  - Una schermata sola, come il manifesto di Studio JAM: nero pieno `#000`,
    giallo acido, scritta glitch con un'entrata a scatti, righe VHS, conto
    alla rovescia alle 22, figura che emerge dal buio (video di 2 secondi,
    una volta sola), informazioni del post Instagram e il tasto "Associati".
  - Tutto in VT323. Niente fotogrammi del corto, niente coordinate, niente
    elenchi cosa/quando/dove: scelte dell'utente.
  - Materiale: Drive condiviso, cartella della serata in *Eventi* (post,
    manifesti, reel) e la grafica di Studio JAM.
  - **Il repository è pubblico**: in file, commenti e commit non va scritto
    che cosa si proietta alla serata (l'utente vuole che resti una
    sorpresa fino al 27). Il nome del file è una scelta dell'utente.
- **Pagina Eventi**: in evidenza la serata (blocco scritto nell'HTML,
  `data-evento`), subito sotto Long Story Short in un blocco suo, invariato.
- **Long Story Short** parla nel suo carattere, Inter (pagina e blocco in
  Eventi). L'utente pensava fosse un serif: le grafiche sul Drive sono
  tutte in Inter.
- **Vetrina della home**: il primo blocco scorre in orizzontale (la sala
  vista dall'alto e i contenuti in evidenza), con le linee che avanzano e
  la pausa. Tabella `public.vetrina` (lettering, due colori), più la
  colonna `carattere` degli eventi. Oggi: la serata, la sala, Long Story
  Short (lettering e testo neri).
- **Dashboard di gestione**: è l'indice del sito (`gestione-indice.js`):
  vetrina in cima, albero delle pagine sotto, scelta del carattere sugli
  eventi.
- **`?riserva`**: fa leggere a una pagina le copie in `data/`, con una
  striscia rossa che lo ricorda. Prima restava acceso per tutta la scheda,
  e la home non corrispondeva più alla gestione: non succede più.

## Database (tutto già applicato)

- `20261121120000_vetrina_home.sql`: tabella `vetrina`. Attenzione: i
  permessi predefiniti dello schema davano ad `anon` tutta la tabella; la
  migrazione li toglie e concede le sole colonne. Per ogni tabella nuova va
  controllato con la chiave pubblica.
- `20261121130000_vetrina_lettering.sql`: colonna `lettering`.
- `20261121140000_vetrina_colore_testo.sql`: colonna `colore_testo`.
- `20261121150000_carattere_eventi.sql`: colonna `carattere` degli eventi
  (Inter per LSS, VT323 per la serata).
- Copie di riserva allineate al database il 21 novembre: `data/eventi.json`
  (con la serata e `carattere`) e `data/vetrina.json`.

## Da fare

- **Dopo il 27 novembre**: aggiornare la pagina della serata (foto, nome
  vero, ciò che si può svelare), decidere cosa va in evidenza in Eventi
  (si riscrive il blocco in `eventi.html`) e togliere o cambiare la sua
  slide dalla Dashboard. Il conto alla rovescia diventa da solo "LIVE"
  durante la serata e poi la data.
- Il carattere di un evento sta in due posti: la colonna (per la slide) e
  il CSS della sua pagina (`evento.css`). Se lo si cambia dalla Dashboard,
  la pagina resta com'è finché non si cambia anche il CSS.
- La scheda Eventi della gestione è ancora "In sviluppo": un evento nuovo si
  scrive nel database a mano (come la serata, inserita via SQL).
- Il caricamento di immagini e lettering per le slide è stato provato con
  lo strumento finto (`storico/strumenti/gestione-finta.js`, che ora
  simula anche le scritture sulla vetrina), non ancora con un caricamento
  vero: se il primo dà errore, guardare le regole dello spazio `immagini`
  (la cartella è `vetrina/`).
- Restano validi i "Da fare più avanti" di `CLAUDE.md` (Cortoteca, gestione
  eventi, donazioni, quota 2027, rinnovo online).

## Come lavorare

Come sempre: un branch, un deploy di prova sull'alias del branch, una pull
request verso `main` unita con *Create a merge commit* (l'unione la fa
l'utente, o va autorizzata). Il branch `redesign` è tutto in `main`: si può
cancellare, come `evento-interzona` e `vetrina-ritocchi`.
