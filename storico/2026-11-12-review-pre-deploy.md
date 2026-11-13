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

1. ~~Short Talks #1 va online col modello~~ — deciso il 13 novembre: no.
   Le pagine composte e la scheda Eventi della gestione sono ferme per
   questo deploy; Short Talks #1 resta sulla pagina scritta a mano, coi
   blocchi conservati nel database. Piano in
   `storico/2026-11-13-piano-eventi-gestione.md`.
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

## Security review (13 novembre 2026)

Fatta con la skill `security-review` sul diff `main...redesign` al commit
`c0e6325` (un agente per cercare, uno per verificare ciò che trova). Nessuna
vulnerabilità sopra la soglia. Un punto escluso dal filtro (confidenza 6/10),
corretto lo stesso su richiesta dell'utente:

- **Il collegamento personale di un socio che è anche redattore poteva
  diventare l'accesso alla gestione**: dalla sessione aperta da
  `accesso-socio` si può impostare una password (`auth.updateUser`) e poi
  entrare con email e password; per un redattore senza codice di verifica
  bastava. Non sfruttabile quel giorno (un solo redattore, col codice, e
  non fra i soci). Corretto con due migrazioni applicate in produzione:
  `20261113170000_inviti_non_per_redattori.sql` (nessun invito per l'email
  di un redattore, nemmeno se creato prima) e
  `20261113170100_codice_obbligatorio_redattori.sql` (`aal2` sempre
  richiesto; `redattore_senza_codice()` per l'attivazione al primo accesso).
  In gestione l'attivazione si apre da sola e "Disattiva il codice" non c'è
  più. Verificato con sessioni simulate nel database e in locale.

Controllato senza problemi: impostazioni di accesso (iscrizioni chiuse),
funzioni `security definer` (`search_path` vuoto, permessi), proposte e
licenze (stato solo tramite funzioni, licenze non falsificabili), inviti
(32 byte casuali, solo l'impronta), spazi `proposte` e `immagini`, XSS nelle
pagine pubbliche, in gestione e in proposta, dati personali dei soci,
nessuna chiave segreta nel repository.

## Seconda review (13 novembre 2026, sera)

Sul lavoro aggiunto dopo le review precedenti: code review (skill
`anthropic-skills:code-review`, standard e specifica in parallelo) su
`84bb79d...29612a7`, security review su `c0e6325...29612a7`; esclusi i file
del modello delle pagine evento.

**Sicurezza**: nessuna vulnerabilità sopra la soglia. Sotto la soglia
(confidenza 2/10): la regola dello spazio `proposte` dà ai redattori un file
citato da una proposta inviata anche se sta nella cartella di un altro
socio; si rafforza aggiungendo `(storage.foldername(name))[1] = p.autore::text`
alla sottoquery.

**Da correggere** (testi e documentazione):
- `gestione.js` righe 605, 1265 e 1318: l'elenco vuoto delle Proposte e le
  mail di "Chiedi modifiche" e di approvazione mandano il socio "dal tuo
  collegamento personale", che ora vale una volta sola: va detto di entrare
  nell'area socio con email e password.
- README, "Chi può modificare": non dice del codice obbligatorio e cita
  "Nuovo evento", oggi fermo.
- Conferma di "Nuovo collegamento": dice "ha scelto una password", ma
  `usato_il` dice solo che il collegamento è stato aperto.

**Deciso** con l'utente: "Secure password change" resta spento (chiederebbe
di riautenticarsi per cambiare password se l'accesso ha più di 24 ore: un
socio che apre il collegamento e sceglie la password il giorno dopo verrebbe
rifiutato).

**Corretti** (commit successivo): i tre testi di `gestione.js`, il README e
la conferma di "Nuovo collegamento"; la regola dello spazio `proposte` in
`20261113220000_file_proposte_nella_cartella_autore.sql` (applicata il 13
novembre).

**Giudizi** (nessuna urgenza): regola IMDb in quattro posti con regex non
identiche (HTML `/.+`, SQL `/`, corto.js senza `indirizzoSicuro()` e con
`/i`); 7 giorni e 6 caratteri ripetuti fra SQL, JS e HTML; validità del
collegamento calcolata due volte in `gestione.js`; blocco WhatsApp/mailto
ripetuto in `area-socio.html`; `passwordDaScegliere()` legge e scrive a
seconda dell'argomento; l'obbligo della password dipende da `localStorage`
(senza, il socio entra senza sceglierla: non è un confine di sicurezza);
commento fuori posto in `gestione.css`.
