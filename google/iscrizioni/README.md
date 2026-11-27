# Domanda di ammissione: la web app di Google Apps Script

Riceve le domande dal modulo di `vantaggi-tesseramento.html#associati`,
scrive nel libro soci ("Gestione APS (fogli)", schede `TESSERATI <anno>`),
crea il PDF riepilogativo e manda le mail. Come funziona e perché:
`storico/2026-11-17-piano-iscrizione-online.md`; il codice è commentato in
`Codice.gs`.

Tre file, da tenere uguali nel progetto Apps Script e qui:

- `Codice.gs`: tutto il codice (compresa la pagina del tasto nella mail a
  ciao@, `paginaConferma`);
- `domanda.html`: il modello del PDF. Nei modelli HtmlService i segni degli
  scriptlet non vanno scritti nemmeno nei commenti: Apps Script li esegue;
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
3. Incolla `Codice.gs`, aggiungi un file HTML `domanda` con
   `domanda.html`, sostituisci `appsscript.json`. Per copiarli, aprili in
   un editor di codice: TextEdit mostra i file `.html` impaginati, e
   copiando da lì si perde il codice (va bene una copia rinominata `.txt`).
4. Impostazioni progetto → Proprietà dello script:

   | Proprietà | Valore |
   |---|---|
   | `ATTIVO` | `si` per aprire il modulo; qualsiasi altro valore lo chiude |
   | `FOGLIO_ID` | l'ID della copia di prova; dopo le prove, quello del foglio vero (`11gpQLozzxZslkgSgdYFYLO1Ppni3jJGjDVTa_wxbJG0`) |
   | `CARTELLA_DOMANDE_ID` | l'ID della cartella "Domande di ammissione" (Amministrazione/Associazione/Documenti Aps); per le prove, una cartella di prova |
   | `DESTINATARIO` | `ciao@cdlaps.com` |
   | `PAYPAL_ME` | `https://paypal.me/cdlaps` (verificato il 18 novembre 2026) |
   | `IBAN` | l'IBAN di CDL APS (quello della domanda ufficiale) |
   | `BENEFICIARIO` | `CDL APS` (facoltativa) |
   | `QUOTE` | `{"2026":5,"2027":10}`: l'anno è quello del giorno della domanda |
   | `STATUTO` | `statuto-cdl-aps-v1`: uguale a `data-versione` della casella dello statuto in `vantaggi-tesseramento.html` |
   | `INFORMATIVA` | `informativa-soci-v1`: uguale a `data-versione` della casella dell'informativa |
   | `STATUTO_URL` | `https://cdlaps.com/assets/doc/statuto-cdl-aps-v1.pdf` (per le prove, l'indirizzo del deploy di prova) |
   | `URL_CONFERMA` | l'indirizzo `/exec` del secondo deployment (passo 7); senza, la mail a ciao@ non ha il tasto |

5. Esegui `installa` dall'editor e accetta i permessi: crea i due avvii
   automatici e scrive nel registro di esecuzione l'esito di `verifica`.
6. Esegui il deployment → Nuovo deployment → tipo "App web": esegui come
   "Me", accesso "Chiunque". Copia l'indirizzo che finisce con `/exec`.
7. Di nuovo Esegui il deployment → Nuovo deployment → "App web": esegui
   come "Me", accesso **"Chiunque in cdlaps.com"** (solo utenti del
   dominio). È il tasto della mail a ciao@: copia il suo `/exec` nella
   proprietà `URL_CONFERMA`. Prova: il collegamento di una mail aperto da
   una finestra anonima deve chiedere l'accesso a Google, e da un account
   diverso da ciao@ deve rispondere "riservata all'account".
8. Incolla l'indirizzo del **primo** deployment in `data-indirizzo` del
   modulo `#domanda` in `vantaggi-tesseramento.html` (senza, il modulo dice
   che la domanda dal sito non è ancora attiva).

## Aggiornare il codice

Incolla il codice nuovo (il codice che gira negli avvii automatici è
subito quello nuovo, quello dei due deployment no), poi Esegui il deployment → **Gestisci
deployment** → matita → Versione: "Nuova versione" → Esegui il deployment.
Con "Nuovo deployment" l'indirizzo cambierebbe e il sito smetterebbe di
funzionare. I deployment sono due (sito e tasto della mail): vanno
aggiornati tutti e due. Scrivi nella Descrizione il nome ("Sito", "Tasto
mail ciao@"), se no diventano "Senza titolo". Dopo, controlla che il tasto
della mail abbia ancora l'accesso "Chiunque in cdlaps.com" e il sito
"Chiunque", e che `…/exec` aperto senza niente dopo risponda con la
`versione` scritta in cima a `Codice.gs`. Se cambia `Codice.gs`, cambia
anche `VERSIONE`.

Non aggiungere pagine HtmlService pubbliche: da una pagina servita dalla
web app si può chiamare qualsiasi funzione senza `_` finale (oggi le
pagine le vede solo ciao@).

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

## Se le domande non arrivano

- **Colonne del foglio**: lo script trova le colonne di `TESSERATI <anno>`
  per nome (`INTESTAZIONI` in cima a `Codice.gs`). Se una viene rinominata,
  ogni domanda risponde "La domanda non è stata registrata" e si fermano
  anche i numeri di tessera (successo il 27 novembre 2026: "Conferma
  assemblea?" era diventata "DD?"). Si rimette il nome, oppure si cambia
  `INTESTAZIONI` e si aggiorna il codice. `verifica` dall'editor controlla
  tutte le colonne.
- **Limite per email**: 3 domande registrate al giorno con la stessa email,
  10 all'ora in tutto (`LIMITI`). Per sbloccare una persona oggi: scrivi la
  sua email in `sbloccaEmail`, esegui dall'editor, poi rimetti le virgolette
  vuote. Non serve aggiornare i deployment.

## Cosa fa il tesoriere

- Ogni domanda arriva a ciao@ con il PDF e compare in `TESSERATI <anno>`
  senza `#`, con `Pagato? = No` e, nelle Note, il codice della domanda
  (`Sito D26-017`, poi eventualmente il cellulare, chi paga e "possibile
  doppione"; le righe del 18 novembre 2026 hanno ancora `Domanda dal sito
  D26-001, …`): **non cancellare né cambiare l'inizio delle Note**, è da lì
  che lo script ritrova la riga. Le versioni di statuto e informativa
  accettate stanno nel PDF.
- **Il tasto nella mail vale per tutte le modalità** (PayPal, bonifico,
  contanti): è il modo più rapido. Il Sì nel foglio è l'alternativa.
- Quando arriva la quota intera (il codice è nella causale), premi
  **"Quota arrivata: accogli la domanda"** nella mail, da un browser dove
  sei entrato con ciao@. Si apre una pagina con i dati e, in grande, il
  numero di tessera da scrivere sulla tessera; aprirla non cambia niente.
  Con **"Quota arrivata: conferma"** lo script, subito: mette
  `Pagato? = Sì`, scrive il numero, compila "Data pagamento" se è vuota,
  rinomina il PDF `NNN_NomeCognome` e manda la conferma al candidato, con
  ciao@ in copia nascosta. Se nel frattempo quel numero è andato a
  qualcun altro, la pagina lo dice e dà quello giusto. Riaprire il
  collegamento dopo mostra "già accolta" con il numero.
- In alternativa, metti `Pagato? = Sì` nel foglio: in 3-4 minuti lo
  script fa le stesse cose (gira ogni minuto, e un Sì vale dopo che è
  rimasto 2 minuti: uno messo per sbaglio e tolto subito non manda nulla).
- **Domande cartacee** (minorenni, o chi non usa il sito): scrivi la riga a
  mano **senza `#`**, con il link al PDF firmato. Quando metti
  `Pagato? = Sì`, in 3-4 minuti lo script dà anche a quella riga il
  numero (quello di prima per chi rinnova, il successivo per un socio
  nuovo) e compila "Data pagamento" se è vuota (niente mail).
  Poi rinomina tu il PDF `NNN_NomeCognome`.
- **I numeri di tessera li assegna solo lo script**, in ordine di
  pagamento: non scriverli mai in anticipo, nemmeno sulle righe vuote
  (fino al 17 novembre 2026 c'erano i numeri da 035 a 150 già scritti:
  tolti). Un numero scritto a mano su una riga lo script non lo cambia.
- Il riepilogo di ogni mattina dice cosa resta da fare: domande non pagate,
  da far decadere, da ratificare, numeri di tessera doppi.
- **Accoglienza e ratifica** (art. 4 dello statuto): chi preme "Conferma"
  (o mette il Sì) accoglie la domanda come consigliere delegato
  (AO_2026_001, punto 3), e da quel momento la persona è socia: può entrare
  a un evento riservato con la tessera appena scritta. Entro 30 giorni il
  direttivo ratifica, con una delibera come le `DD_2026_00x` ("Conferma
  dell'associazione dei progressivi …"); poi si mette a mano
  `Conferma assemblea? = Sì`. Lo script non tocca mai quella colonna: non
  può fare una delibera, ma la controlla e la ricorda nel riepilogo.
- **Mittente**: tutte le mail partono a nome "CDL APS". Nella casella di
  ciao@ quelle mandate a ciao@ stesso compaiono comunque come "io": Gmail
  fa così con i messaggi che un account manda a se stesso.
- **Chi rinnova tiene il suo numero** (decisione del 18 novembre 2026):
  scrivi la riga nella scheda dell'anno nuovo senza `#`, con la stessa
  email dell'anno prima; al "Sì" lo script riprende il suo numero (senza
  email, cerca lo stesso nome e cognome). Un socio nuovo prende il numero
  dopo il più alto mai usato, in tutte le schede `TESSERATI`: i numeri non
  ripartono da 001 ogni anno.
