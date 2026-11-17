# Domanda di ammissione: la web app di Google Apps Script

Riceve le domande dal modulo di `vantaggi-tesseramento.html#associati`,
scrive nel libro soci ("Gestione APS (fogli)", schede `TESSERATI <anno>`),
crea il PDF riepilogativo e manda le mail. Come funziona e perché:
`storico/2026-11-17-piano-iscrizione-online.md`; il codice è commentato in
`Codice.gs`.

Tre file, da tenere uguali nel progetto Apps Script e qui:

- `Codice.gs`: tutto il codice;
- `domanda.html`: il modello del PDF;
- `appsscript.json`: fuso orario (Europe/Rome), permessi, web app
  (nell'editor: Impostazioni progetto → "Mostra il file manifest
  appsscript.json nell'editor").

## Installazione (una volta)

Con l'account **ciao@cdlaps.com** (le mail partono da lì; deve poter
modificare il foglio e la cartella "Domande di ammissione"):

1. Prima una **copia di prova** del foglio "Gestione APS (fogli)" (File →
   Crea una copia), senza la scheda delle password: le prove si fanno lì.
2. script.google.com → Nuovo progetto, nome "CDL – Domande di ammissione".
   **Non** dal menu Estensioni del foglio: deve restare un progetto a sé
   (vedi in cima a `Codice.gs`).
3. Incolla `Codice.gs`, aggiungi un file HTML `domanda` con `domanda.html`,
   sostituisci `appsscript.json`.
4. Impostazioni progetto → Proprietà dello script:

   | Proprietà | Valore |
   |---|---|
   | `ATTIVO` | `si` per aprire il modulo; qualsiasi altro valore lo chiude |
   | `FOGLIO_ID` | l'ID della copia di prova; dopo le prove, quello del foglio vero (`11gpQLozzxZslkgSgdYFYLO1Ppni3jJGjDVTa_wxbJG0`) |
   | `CARTELLA_DOMANDE_ID` | l'ID della cartella "Domande di ammissione" (Amministrazione/Associazione/Documenti Aps); per le prove, una cartella di prova |
   | `DESTINATARIO` | `ciao@cdlaps.com` |
   | `PAYPAL_ME` | `https://paypal.me/<account>`, da verificare (`cdlaps` nella domanda ufficiale) |
   | `IBAN` | l'IBAN di CDL APS (quello della domanda ufficiale) |
   | `BENEFICIARIO` | `CDL APS` (facoltativa) |
   | `QUOTE` | `{"2026":5,"2027":10}`: l'anno è quello del giorno della domanda |
   | `STATUTO` | `statuto-cdl-aps-v1`: uguale a `data-versione` della casella dello statuto in `vantaggi-tesseramento.html` |
   | `INFORMATIVA` | `informativa-soci-v1`: uguale a `data-versione` della casella dell'informativa |
   | `STATUTO_URL` | `https://cdlaps.com/assets/doc/statuto-cdl-aps-v1.pdf` (per le prove, l'indirizzo del deploy di prova) |

5. Esegui `installa` dall'editor e accetta i permessi: crea i due avvii
   automatici e scrive nel registro di esecuzione l'esito di `verifica`.
6. Esegui il deployment → Nuovo deployment → tipo "App web": esegui come
   "Me", accesso "Chiunque". Copia l'indirizzo che finisce con `/exec`.
7. Incolla l'indirizzo in `data-indirizzo` del modulo `#domanda` in
   `vantaggi-tesseramento.html` (senza, il modulo dice che la domanda dal
   sito non è ancora attiva).

## Aggiornare il codice

Incolla il codice nuovo, poi Esegui il deployment → **Gestisci
deployment** → matita → Versione: "Nuova versione" → Esegui il deployment.
Con "Nuovo deployment" l'indirizzo cambierebbe e il sito smetterebbe di
funzionare.

## Cambiare documenti, quota o anno

- **Statuto o informativa nuovi**: nuovo PDF in `assets/doc/` con un nome
  nuovo, link e `data-versione` nuovi in `vantaggi-tesseramento.html`, e la
  stessa versione nelle proprietà `STATUTO` / `INFORMATIVA`. Finché non
  coincidono, il server rifiuta le domande ("i documenti sono stati
  aggiornati").
- **Quota**: proprietà `QUOTE`, e `data-quote` sul modulo (solo per il testo
  in cima alla sezione).
- **Anno nuovo**: niente da fare. Alla prima domanda dell'anno lo script
  crea `TESSERATI <anno>` copiando intestazioni, formati e menu dell'anno
  prima, senza i dati.

## Cosa fa il tesoriere

- Ogni domanda arriva a ciao@ con il PDF e compare in `TESSERATI <anno>`
  senza `#`, con `Pagato? = No` e, nelle Note, il codice della domanda
  (`Domanda dal sito D26-017, …`): **non cancellare né cambiare l'inizio
  delle Note**, è da lì che lo script ritrova la riga.
- Quando arriva la quota intera (il codice è nella causale), metti
  `Pagato? = Sì`. Dopo 10-20 minuti lo script assegna il numero di tessera,
  compila "Data pagamento" se è vuota, rinomina il PDF `NNN_NomeCognome` e
  manda la conferma al candidato, con ciao@ in copia nascosta. Un Sì messo
  per sbaglio e tolto entro pochi minuti non manda nulla.
- **Domande cartacee** (minorenni, o chi non usa il sito): scrivi la riga a
  mano **senza `#`**, con il link al PDF firmato. Quando metti
  `Pagato? = Sì`, dopo 10-20 minuti lo script dà anche a quella riga il
  numero (quello di prima per chi rinnova, il successivo per un socio
  nuovo) e compila "Data pagamento" se è vuota (niente mail).
  Poi rinomina tu il PDF `NNN_NomeCognome`.
- **I numeri di tessera li assegna solo lo script**, in ordine di
  pagamento: non scriverli mai in anticipo, nemmeno sulle righe vuote
  (fino al 17 novembre 2026 c'erano i numeri da 035 a 150 già scritti:
  tolti). Un numero scritto a mano su una riga lo script non lo cambia.
- Il riepilogo di ogni mattina dice cosa resta da fare: domande non pagate,
  da far decadere, da ratificare, numeri di tessera doppi.
- **Chi rinnova tiene il suo numero** (decisione del 18 novembre 2026):
  scrivi la riga nella scheda dell'anno nuovo senza `#`, con la stessa
  email dell'anno prima; al "Sì" lo script riprende il suo numero (senza
  email, cerca lo stesso nome e cognome). Un socio nuovo prende il numero
  dopo il più alto mai usato, in tutte le schede `TESSERATI`: i numeri non
  ripartono da 001 ogni anno.
