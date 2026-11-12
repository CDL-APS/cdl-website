# Review prima del deploy del redesign (12 novembre 2026, notte)

Fatta con la skill `code-review` (due revisori in parallelo: regole del
progetto in `CLAUDE.md` e specifiche in `storico/`) sul diff
`main...redesign` al commit `89093fe`. **Esclusi dal controllo**, su
richiesta dell'utente che li deve ancora provare: il modello delle pagine
evento (`modello-evento.js`, `evento.js`, `gestione-eventi.js`,
`evento.html`, `20261112210000_eventi_a_blocchi.sql`). Nessuna `security-review`
ancora.

## Controlli passati

Ogni file citato esiste; una sola versione `?v=` su tutte le pagine; barra e
piede allineati (varianti volute); `aria-current` e titoli della scheda
giusti; niente `<style>`, niente `style=` né handler inline in gestione e
proposta; niente scritte sotto gli 11 px; `grant` presenti nelle tabelle
nuove. `COLONNE_OPERE` e `COLONNE_EVENTI` di `dati.js` coincidono con
`20261112220000_colonne_pubbliche.sql` e esistono tutte in produzione;
`data/opere.json` e `data/eventi.json` identici al database; redirect vecchi
conservati; 404 sui file interni; CSP sui quattro indirizzi; impronte delle
licenze uguali al database.

## Già corretti (commit successivo alla review)

- **Scheda Rullino rotta**: `gestione-eventi.js`, caricato dopo
  `gestione-rullino.js`, ridefiniva le funzioni globali `sposta` e
  `disegnaGruppo` (frecce del rullino senza effetto, foto disponibili
  mostrate come testo). Rinominate nel file nuovo (`spostaDiUno`,
  `disegnaElencoVoci`); un controllo sui nomi globali di tutte le pagine non
  trova altre collisioni.
- `data/rullino.json` rigenerato dal database (13 foto, erano 8).
- Tolta dalla lista di `CLAUDE.md` la migrazione `eventi_a_blocchi`, già
  applicata.

## Da decidere con l'utente prima di unire

1. **Short Talks #1 va online col modello.** L'utente decide dopo le sue
   prove del modello degli eventi. Nel database ha già
   presentazione e blocchi: dal deploy home, Eventi e rullino portano a
   `evento.html?e=short-talks-1`. Nei controlli era identica al pixel alla
   pagina scritta a mano, ma l'utente non l'ha ancora provata. In
   alternativa si svuotano presentazione e blocchi (torna alla pagina
   scritta a mano).
2. ~~Contatti dal telefono~~ — risolto: "Contatti" è nel piede, sulla riga
   di Instagram e YouTube, su tutte le pagine (decisione dell'utente).

## Possono aspettare (dopo il deploy)

- **Rullino**: la lettura pubblica è `using (true)`, quindi la home mostra
  anche le foto di un corto nascosto (per quota) o di un evento non
  pubblicato; il collegamento ripiega su Cortoteca/Eventi ma la foto resta.
  Basta filtrare in `home.js` le foto il cui corto o evento non è fra quelli
  letti.
- **Colore in gestione**: col colore automatico il selettore del corto
  mostra ancora il lilla `#b9bbf8` (`gestione.js`, `gestione.html`).
- **Referrer-Policy di `/proponi`**: la regola generale `/*` di
  `netlify.toml` potrebbe sovrascrivere `no-referrer`; da guardare col
  `curl -I` già in lista (rischio basso: l'invito sta dopo il `#`).
- `home.js`: `<li style="--i:…">` non è fra gli usi di `style=` ammessi da
  `CLAUDE.md` (aggiungere `--i` alla regola o usare `style.setProperty`).
- `cornicenarrativa.html` non carica `comune.js` (oggi senza effetti).
- Le foto caricate dal Rullino si chiamano `rullino/<orario>.jpg`, non
  `<cartella>/<codice>-<campo>-<orario>.jpg` come dice `CLAUDE.md`: da
  documentare.
- Gestione: Indietro dalla revisione di una proposta non chiede conferma
  per le modifiche non salvate (`popstate` guarda solo opera ed evento).
- Commento in `gestione-rullino.js`: dice che i clic durante una scrittura
  "aspettano", invece vengono scartati.
- In produzione ci sono migrazioni `ponte_*` (1–3 novembre) senza file in
  `supabase/migrations/`.
- `.vscode/`, `.editorconfig`, `.gitignore` sono pubblicati (niente di
  sensibile).
- `proponi.html`: le etichette dei passi somigliano a eyebrow; l'utente ha
  detto che va bene così.
- Anteprima del video nella proposta (specifica Cortoteca §3.1): c'è solo il
  riconoscimento del collegamento; un iframe sarebbe bloccato dalla CSP.

## Giudizi sul codice (nessuna urgenza)

Codice ripetuto: il controllo del "clic semplice" in quattro file; la
chiusura delle sale in `cortoteca.js` ed `eventi.js`; l'immagine "nel sito
o nello spazio immagini" in tre punti; `meseAnno` accanto a
`dataBreve`/`dataLunga`; la cascata `evento_id`/`opera_id`/`pagina` del
rullino in quattro punti; `pubblicata`/`pubblicato` in più punti.
`luminosita` e `contrastoColNero` (`corto.js`) calcolano la luminanza in
due modi. `FRECCIA_SU` disegna ↗ (meglio `FRECCIA_APRI`). `comune.js`
raccoglie molte cose diverse. Il commento di esempio in `dati.js` cita
`select=*`.
