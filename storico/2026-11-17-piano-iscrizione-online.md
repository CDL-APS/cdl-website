# Piano: domanda di ammissione a socio online (17 novembre 2026)

La pagina "Diventa socio" (`vantaggi-tesseramento.html`) raccoglie la domanda
di ammissione a socio. Il candidato sceglie come pagare la quota: PayPal,
bonifico o contanti. La domanda finisce nel libro soci con un PDF
riepilogativo, e arriva per mail a ciao@ e al candidato. Fa parte del
deploy del redesign, insieme alla privacy del modulo di Contatti; la
Cortoteca invece è in pausa (`storico/2026-11-17-cortoteca-in-pausa.md`).

Riscritto il 17 novembre dopo le risposte dell'utente. La prima versione,
dello stesso giorno, proponeva Netlify Forms e la copia a mano nel foglio.

## Decisioni (utente, 17 novembre 2026)

- **PayPal "amici e familiari"**, con paypal.me, sul conto intestato a CDL
  APS. Il collegamento non può imporre la modalità: prima del tasto, una riga
  ricorda di scegliere "amici e familiari".
- **Altre modalità**: bonifico (anche istantaneo) e contanti, con
  appuntamento. Nel foglio sono `PayPal`, `Bonifico` e `Cash`, i valori del
  menu di "Modalità pagamento".
- **Il pagamento lo conferma il tesoriere.** PayPal.me non avvisa nessuno
  quando arriva un pagamento, quindi lo stesso flusso vale per tutte le
  modalità:
  - alla domanda, una riga nel foglio con `Pagato? = No` e le mail con il PDF;
  - quando il tesoriere vede il pagamento e mette "Sì", lo script compila
    la data, assegna il numero di tessera e manda la mail "quota ricevuta".
  - Scartati: PayPal Checkout (conferma automatica, ma niente "amici e
    familiari" e circa 0,52 € di commissione su 5 €) e l'abbinamento con le
    notifiche IPN, fragile.
- **Quota**: 5 € fino al 31 dicembre 2026, per l'anno 2026. Dal 1° gennaio
  2027, 10 € per il 2027. Data di cambio e importi stanno nelle impostazioni
  dello script.
- **Numero di tessera (#)** assegnato **al pagamento**, non alla domanda:
  per l'art. 4 dello statuto il nuovo socio si annota nel libro dopo aver
  versato la quota. Si smette di scrivere i numeri in anticipo. La
  sincronizzazione verso Supabase salta le righe senza `#`, quindi in
  Supabase arriva solo chi ha pagato.
- **Campi**: quelli della domanda ufficiale (Google Doc
  `1ixyMoVRldNa2oLvQfNILGgCToWiyJ7OEjfmQoQylDk4`, scheda "Ufficiale"; PDF in
  Amministrazione/Associazione/Documenti Aps/DomandaAmmissioneSocio.pdf).
  Niente codice fiscale.
- **Minorenni**: niente modulo online, si rimanda al modulo cartaceo, che
  per l'art. 4 dello statuto va controfirmato da un genitore.
- **Informativa privacy**: un PDF apposta, collegato in fondo al modulo. La
  casella si può spuntare solo dopo averlo aperto. Lo stesso nel modulo di
  Contatti, con un'informativa sua.
- **Statuto**: testo semplice, identico all'ultima versione registrata; il
  timbro non serve per informare il candidato. Il PDF è collegato **solo dal
  modulo**, è escluso dai motori di ricerca (`X-Robots-Tag: noindex`) e non è
  citato altrove. Anche la sua casella si spunta solo dopo averlo aperto. Va
  inoltre in allegato alla mail di riepilogo.
  - Perché un link e non solo l'allegato: il candidato dichiara di
    conoscere lo statuto *prima* di inviare. Nessuna norma obbliga una
    piccola APS a pubblicarlo sul sito (art. 14 del Codice del Terzo settore:
    soglie di 100.000 € e 1 milione); per gli enti iscritti al RUNTS è
    comunque consultabile da chiunque.
- **Mail**: a ciao@ e al candidato, con il PDF riepilogativo allegato.

## Sul sito

### `vantaggi-tesseramento.html`

Nuova sezione `#associati` in fondo, prima di Sostieni, con:

- **Campi**: nome, cognome; luogo e data di nascita; comune di residenza,
  provincia, via, CAP; email, cellulare (facoltativo); "chi paga, se non sei
  tu" (facoltativo: serve al tesoriere per riconoscere il pagamento).
- **Modalità di pagamento** (radio): PayPal, bonifico (anche istantaneo),
  contanti con appuntamento.
- **Dichiarazioni**, dal testo ufficiale: chiede l'ammissione come socio
  ordinario; si impegna a rispettare statuto, regolamenti e delibere;
  dichiara di essere maggiorenne; se la domanda non è accolta, la quota
  viene restituita.
- **Due caselle "dopo lettura"**: statuto e informativa.
- **Campo trappola**, `<noscript>` (serve JavaScript, oppure il modulo
  cartaceo o una mail a ciao@), link "Sei minorenne?" al modulo cartaceo.
- **Pannello di conferma**, mostrato solo dopo la risposta `ok` del server.
  Mostra il codice della domanda (es. `D26-017`), importo e causale presi
  dalla risposta, e le istruzioni della modalità scelta:
  - PayPal: la riga "scegli *amici e familiari*" e il tasto **Vai a
    PayPal** (`paypal.me/<account>/<importo>EUR`, nella stessa scheda);
  - bonifico: IBAN, beneficiario e causale;
  - contanti: chi contattare per l'appuntamento.
  - **IBAN e PayPal non compaiono mai nella pagina statica**: così nessuno
    paga senza una domanda registrata.

### `assets/js/vantaggi-tesseramento.js` (nuovo)

- Controlla i campi: età di almeno 18 anni, CAP di 5 cifre, email.
- Genera una chiave di idempotenza in `sessionStorage` e disattiva il tasto
  all'invio.
- Invia con `fetch` in POST, `text/plain` con dentro JSON (Apps Script non
  risponde alle richieste preflight), all'indirizzo della web app preso da
  `data-indirizzo` sul form. Timeout di 45 s; **mai `mode: 'no-cors'`**,
  che renderebbe illeggibile la risposta.
- Senza `ok`: "Domanda non registrata, riprova o scrivi a ciao@", e niente
  istruzioni di pagamento.

### Caselle "dopo lettura": `caselleDopoLettura()` in `comune.js`

La usano Contatti e la domanda. Disabilita **da JavaScript** (non
nell'HTML: senza JS il modulo di Contatti deve continuare a funzionare) le
caselle legate a un link, e le abilita al `click` o all'`auxclick` sul link,
con il suggerimento "Apri l'informativa per poterla spuntare". La formula è
"Ho letto l'informativa", non "Acconsento": la base giuridica è la richiesta
dell'interessato o il rapporto associativo, non il consenso.

### Documenti, in `assets/doc/` (nuova cartella)

`/assets/*` ha una cache di 7 giorni: ogni nuova versione prende un nome
nuovo.

- `informativa-soci-v1.pdf`, `informativa-contatti-v1.pdf`;
- `statuto-cdl-aps-v1.pdf`: testo semplice dello statuto in vigore, senza
  date di registrazione o deposito (file sorgente su Drive:
  `Statuto_CDLAPS_2711`, ID `1-MNMFvCEigXHQkSxA6NIKs9PRaA_uH4h`; il timbrato è
  `Statuto_timbroADE_pdfa.pdf`);
- `domanda-ammissione-socio-2026.pdf`: il modulo cartaceo a 5 € (minorenni o chi non usa il sito), rifatto da `documenti/` con l'informativa nuova; nel 2027 un file nuovo a 10 €.

In `netlify.toml`, `X-Robots-Tag: noindex` sullo statuto.

### Il resto della pagina e del sito

- Gli stili `.modulo*` passano da `pages/contatti.css` a `components.css`,
  con in più `select`, `:disabled` e il pannello di conferma.
- "Diventa socio" del blocco Sostieni (home, Contatti, Vantaggi) porta a
  `vantaggi-tesseramento.html#associati`.
- Il testo `data-quota` del nastro della home diventa "Quota ridotta a 5 €
  fino al 31 dicembre".

## La web app: Google Apps Script

Codice nel repository in `google/iscrizioni/` (`Codice.gs`,
`appsscript.json` con `"timeZone": "Europe/Rome"`, modelli `domanda.html` e
`mail-*.html`), bloccato da `netlify.toml` come `supabase/`.

- **Progetto autonomo**, non legato al foglio: "Collega al sito" di
  `sincronizza-soci.gs` cancella tutti i trigger del proprio progetto, e
  questo non deve toccarli.
- Pubblicato dall'account ciao@ come web app: "esegui come me", "accesso:
  chiunque". Gli aggiornamenti si fanno modificando il deployment esistente
  (Gestisci deployment → modifica), altrimenti l'indirizzo cambia.

### Proprietà dello script

| Proprietà | Contenuto |
|---|---|
| `FOGLIO_ID` | Prima una **copia di prova** di "Gestione APS (fogli)", poi il foglio vero |
| `CARTELLA_DOMANDE_ID` | Cartella "Domande di ammissione" (Amministrazione/Associazione/Documenti Aps) |
| `DESTINATARIO` | ciao@cdlaps.com |
| `PAYPAL_ME` | `https://paypal.me/cdlaps` (verificato) |
| `IBAN` | Quello della domanda ufficiale, beneficiario CDL APS |
| `QUOTE` | `{"2026":5,"2027":10}`: l'anno è quello della data della domanda, a Roma |
| `INFORMATIVA`, `STATUTO` | Versioni in vigore, scritte nel PDF e nella riga; il server rifiuta una versione diversa |
| `STATUTO_FILE_ID` | Il PDF dello statuto da allegare alla mail del candidato |
| `ATTIVO` | Interruttore generale: se non è `si`, la web app risponde "modulo chiuso, scrivi a ciao@" |

### Alla domanda (`doPost`)

1. **Controlli in ingresso**: corpo sotto i 10 KB; campo trappola; tempo
   minimo di compilazione; limiti con `CacheService`, per email (con una
   chiave nuova) e globali (10 all'ora: oltre, "riprova più tardi");
   validazione e lunghezze di ogni campo; età calcolata dal server.
2. **Idempotenza**: con la stessa chiave risponde la stessa cosa, senza
   una seconda riga né una seconda mail. Con stessa email e stesso anno ma
   chiave diversa registra la domanda e la segna "possibile doppione".
   **La risposta non dice mai** se l'email è già di un socio.
3. **Sotto `LockService`**:
   - codice della domanda (`D<aa>-<nnn>`, contatore per anno);
   - scheda `TESSERATI <anno>`; se manca, la crea copiando intestazione,
     formati e convalide dell'anno prima;
   - prima riga libera dopo l'ultima con un nome (mai `appendRow` o
     `getLastRow`: celle formattate più in basso spostano la riga);
   - riga: Nome cognome, Data tesseramento (`Date`, formato `dd/MM/yyyy`),
     `Conferma assemblea? = No`, `Pagato? = No`, Modalità pagamento, Email,
     Note (codice, data e ora, versioni dei testi accettati, chi paga,
     eventuale "possibile doppione" o "socio nel <anno-1>"). **Senza `#`.**
   - Ogni testo scritto ha il prefisso `'`, contro l'iniezione di formule
     (`= + - @`).
4. **PDF riepilogativo**: da `HtmlService` (solo `<?= ?>`, che fa l'escape;
   mai `<?!= ?>`). Contiene il testo della domanda ufficiale con i dati, le
   dichiarazioni, data e ora del server, le versioni dei testi, la modalità
   di pagamento e il codice. Salvato in "Domande di ammissione" come
   `D26-017_NomeCognome.pdf` (nome ripulito da `/\:*?"<>|` e caratteri di
   controllo, al massimo 80 caratteri), collegato in "Link al modulo" con un
   collegamento normale (`RichTextValue`).
5. **Mail**, dopo aver controllato `MailApp.getRemainingDailyQuota()`:
   - a ciao@: oggetto "[Sito CDL] Domanda di ammissione – Nome Cognome –
     PayPal (da pagare)", `replyTo` del candidato, PDF allegato;
   - al candidato: testo fisso con il solo nome, PDF e statuto allegati,
     istruzioni di pagamento con codice e causale, "se non accolta la quota
     viene restituita", e la frase "Se non hai fatto tu questa domanda,
     ignora questa mail: senza pagamento non succede nulla".
   - Se la riga è scritta ma PDF o mail falliscono, la risposta resta `ok`
     (i dati sono salvati e le istruzioni stanno nella pagina), e il giro
     periodico riprova.
6. Le domande registrate stanno in `PropertiesService` (codice → email,
   anno, stato, PDF, mail inviate).

### Il tasto nella mail a ciao@ (aggiunto il 18 novembre 2026)

Richiesta dell'utente: accogliere la domanda dalla mail, come con gli
inviti di Calendar, e vedere subito il numero da scrivere sulla tessera
fisica.

- La mail a ciao@ ha il tasto "Quota ricevuta: accogli la domanda"
  (`URL_CONFERMA?codice=D26-017`). Apre una pagina della web app
  (`doGet` → `mostraConferma`, pagina scritta da `paginaConferma`) con i dati e, in
  grande, il numero che la persona prenderà (`numeroPerRiga`, senza
  scrivere niente). Aprirla non cambia nulla: antivirus e anteprime delle
  mail aprono i collegamenti da soli.
- "Quota ricevuta: conferma" (`confermaQuota`) porta una chiave usa e getta
  di 30 minuti (`CacheService`) e fa subito quello che fa il Sì nel foglio
  (`registraQuota(…, segnaPagato)`), più `Pagato? = Sì`. Se nel frattempo
  il numero mostrato è andato a un altro, la pagina lo dice e dà quello
  giusto.
- La pagina risponde solo all'account `DESTINATARIO`
  (`Session.getActiveUser()`): la mail a ciao@ ha "Rispondi a" il
  candidato, e in una risposta il collegamento finirebbe citato. Per questo
  c'è un secondo deployment, "Chiunque in cdlaps.com" (ciao@ è un account
  Workspace), oltre a quello "Chiunque" per il sito. A chi non è ciao@ va
  un testo semplice, mai una pagina HtmlService (da cui si potrebbero
  chiamare le funzioni con `google.script.run`).
- Niente tasto "Respingi" (decisione dell'utente): un rifiuto si gestisce a
  mano.

### Ogni minuto (`controllaPagamenti`)

Dal 18 novembre 2026 ogni minuto (prima ogni 10), e un Sì vale dopo 2
minuti (prima 9): il Sì nel foglio arriva in 3-4 minuti invece che in
10-20. Un giro non parte se il precedente non è finito; PDF e mail falliti
si riprovano ogni 10 minuti, al massimo 6 volte.

Un trigger a tempo, non `onEdit`: `onEdit` non scatta per le scritture da
script, dà valori vuoti su incolla e intervalli, e cerca le righe per
posizione.

- Considera solo le domande registrate dalla web app: le righe scritte a
  mano (domande cartacee, soci vecchi) non generano mail.
- Trova la riga dal codice nelle Note, quindi regge a righe riordinate o
  corrette a mano.
- Se `Pagato?` è "Sì" (scritto da computer o da telefono) e la mail non è
  ancora partita, sotto lock:
  - assegna il `#` successivo, come testo (`'036`);
  - compila "Data pagamento" se è vuota;
  - rinomina il PDF in `NNN_NomeCognome.pdf` e aggiorna il link;
  - manda a ciao@ e al candidato "quota ricevuta: domanda accolta, sarà
    ratificata dal direttivo", **una volta sola** (registro in
    `PropertiesService`: un Sì tolto e rimesso non manda una seconda mail).
- Un Sì messo per sbaglio e tolto entro 2 minuti non manda nulla.
- **Ogni mattina**, un riepilogo a ciao@ (solo se c'è qualcosa):
  - domande non pagate da più di 7 giorni;
  - domande non pagate da più di 30 giorni, da far decadere (riga tolta, PDF
    spostato in una cartella "Decadute");
  - domande pagate e non ancora ratificate ("Conferma assemblea?" su No) da
    più di 20 giorni: lo statuto chiede la ratifica entro 30;
  - mail o PDF da rifare.

### Correzione a `supabase/foglio/sincronizza-soci.gs`

`leggiScheda` deve fermarsi con un errore se un `#` compare due volte
nella stessa scheda: oggi la chiave in Supabase è `(anno, numero)`, e il
secondo socio sovrascrive il primo in silenzio. Dopo la modifica lo script
va reincollato nel foglio.

## Testi da preparare

Bozze come Google Doc nella cartella Documenti Aps, per i commenti del
direttivo; poi esportati in PDF in `assets/doc/`. Finché non sono approvati,
il sito usa PDF provvisori e il modulo resta chiuso (`ATTIVO`).

- **Informativa soci v1**, dal testo allegato alla domanda, aggiornato con:
  base giuridica (art. 6.1.b e 6.1.c GDPR); tempi di conservazione (domande
  non pagate: cancellate dopo 30 giorni più un margine; respinte: fino alla
  scadenza del ricorso più qualche mese); fornitori (Google per foglio e
  mail, PayPal, Netlify) e trasferimento extra-UE; contatti ciao@ e PEC;
  correzione del refuso "cdlprods@gmail.com.it".
- **Informativa contatti v1**: dati del modulo di Contatti, conservati su
  Netlify e nelle caselle dell'associazione, per rispondere.
- I testi della pagina, del PDF e delle mail.

## Casi coperti

Il flusso è stato controllato caso per caso il 17 novembre. In sintesi:

| Caso | Come è coperto |
|---|---|
| PayPal scelto, pagina chiusa senza pagare | La domanda c'è, `Pagato? = No`; riepilogo a 7 giorni, decadenza a 30 |
| Pagato senza causale, o da un altro conto | Codice della domanda nella causale; campo "chi paga"; il tesoriere confronta codice, nome, importo e data |
| Importo sbagliato, pagato due volte | "Sì" solo con la quota intera; differenze e rimborsi a mano (istruzioni per il tesoriere) |
| Bonifico mai arrivato, contanti | Stesso riepilogo dei non pagati; per i contanti la mail dice chi contattare |
| Doppio clic, ricarica, rete lenta | Tasto disattivato, chiave di idempotenza, controllo stessa email e stesso anno |
| Apps Script irraggiungibile | Niente istruzioni di pagamento senza `ok`: nessuno paga senza una domanda registrata |
| Mail fallita, quota MailApp finita | Riga salvata comunque, mail rifatta dal giro periodico, segnalata nel riepilogo |
| Già socio, rinnovo | La risposta è sempre la stessa; la riga è segnata nelle Note. Il rinnovo di chi è già socio non passa da qui (art. 3: lo status è permanente, basta pagare): voce nel da fare |
| Minorenne | Età calcolata dal server, dichiarazione di maggiore età, rimando al cartaceo |
| Domanda a dicembre pagata a gennaio | Anno e importo decisi alla domanda (2026, 5 €); la riga resta in `TESSERATI 2026` |
| Domanda respinta dopo il pagamento | Quota restituita (dichiarato nel modulo); reiezione motivata per iscritto, a mano |
| Spam, mail a terzi con l'indirizzo di altri | Trappola, tempo minimo, limiti per email e globali, mail al candidato a testo fisso con la frase di disconoscimento |
| Formule o HTML nei campi | Prefisso `'`, validazione, escape nel PDF e nelle mail, nome del file ripulito |
| Numeri di tessera concorrenti o doppi | `#` assegnato sotto lock; controllo dei doppioni in `sincronizza-soci.gs` |
| Senza JavaScript | `<noscript>` con il cartaceo e ciao@; Contatti funziona come oggi |

## Fuori dal codice (utente e direttivo)

- **Quota a 5 €**: deliberata dall'ultima assemblea ordinaria (risposta
  dell'utente, 18 novembre 2026).
- **Consiglieri delegati** all'accoglimento: sono quelli che hanno accesso
  alla casella ciao@ (risposta dell'utente, 18 novembre 2026), cioè chi
  riceve le domande e mette il "Sì"; il direttivo ratifica entro 30 giorni
  ("Conferma assemblea?", a mano: lo script non la compila mai, perché la
  ratifica è una delibera; dettagli in `google/iscrizioni/README.md`). La restituzione della quota a chi viene respinto
  è scritta nella pagina, nel modulo cartaceo e nell'informativa.
- **PayPal**: l'account è `@cdlaps` (verificato dall'utente il 18
  novembre 2026); nelle prove, controllare che `paypal.me/cdlaps/5EUR`
  apra il pagamento giusto.
- **RUNTS**: in regola (risposta dell'utente, 18 novembre 2026). Il PDF
  dello statuto non riporta date di registrazione o deposito.
- **Libro soci**: i numeri da 035 a 150 scritti in anticipo nelle righe
  vuote di `TESSERATI 2026` sono stati tolti il 18 novembre 2026. Da allora
  i numeri li assegna solo la web app, in ordine di pagamento, anche alle
  righe scritte a mano (`numeraRigheCartacee`); il riepilogo del mattino
  segnala i numeri doppi. Chi rinnova tiene il suo numero (decisione del
  18 novembre 2026, `numeroPerRiga`).
- **Account**: controllare che ciao@ possa pubblicare una web app con
  accesso "chiunque" (un amministratore Workspace può vietarlo) e scrivere
  nella cartella "Domande di ammissione", che non deve essere condivisa con
  "chiunque abbia il link".
- **Revisione di un professionista o del CSV** (Volontarimini), facoltativa:
  se la "domanda scritta" dell'art. 4 richiede la firma autografa.
  Casella, PDF generato dal server con data, ora e versioni dei testi, e
  mail all'indirizzo dichiarato formano una firma elettronica semplice
  (CAD, art. 20, comma 1-bis), valutata liberamente dal giudice.

## Verifica

Contro un deployment di prova della web app e la **copia** del foglio:

- una domanda per ogni modalità; doppio clic e ricarica; stessa email due
  volte; un minorenne; la rete staccata (niente istruzioni di pagamento);
  un nome con `=1+1`;
- "Sì" messo dal telefono, poi tolto e rimesso: una sola mail;
- `#` assegnato al pagamento, PDF rinominato, mail con gli allegati;
- la sincronizzazione di `sincronizza-soci.gs` sulla copia non importa le
  righe senza `#`.

Poi `/code-review` e `/security-review`, e le prove in
`storico/2026-11-14-prove-sito-online.md`, fino a un pagamento vero da 5 €.
