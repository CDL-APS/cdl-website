# Prove sul sito online prima del deploy del redesign

Da fare sul deploy di prova **https://redesign--cdl-aps.netlify.app**
(branch `redesign`, caricato a mano con la CLI di Netlify, senza `--prod`):
`cdlaps.com` resta il sito vecchio finché la pull request non è unita.

Aggiornata il 17 novembre 2026: la Cortoteca è in pausa
(`storico/2026-11-17-cortoteca-in-pausa.md`, dove sono finite le prove di
area socio e proposte) e il deploy comprende la domanda di ammissione online
(`storico/2026-11-17-piano-iscrizione-online.md`). Le prove si fanno quando
Cortoteca in pausa, privacy di Contatti e domanda di ammissione sono
finite, rivedute e caricate sul deploy di prova.

Da sapere prima di cominciare:

- **Il database è quello vero.** Modifiche alle opere e al rullino fatte qui
  restano. Le cose create solo per provare vanno cancellate alla fine
  (ultima sezione).
- **I moduli di Contatti mandano mail vere** a ciao@, eventi@ e
  produzione@cdlaps.com; la domanda di ammissione manda mail vere a ciao@ e
  all'indirizzo scritto nel modulo.
- **Se il branch cambia**, il deploy di prova non si aggiorna da solo: va
  ricaricato.
- Accanto a ogni problema annota pagina, dispositivo e larghezza (telefono,
  computer), e se puoi una schermata.

Dispositivi: almeno un **iPhone con Safari** (il sito non è mai stato
provato su un dispositivo vero), **Safari sul Mac** e un altro browser sul
computer (Chrome o Firefox).

## 1. Pagine pubbliche

Su telefono e computer. Provate dall'utente il 18-19 novembre 2026 su computer e telefono: tutto a
posto.

- [x] **Home**: si vede la sala al buio e la torcia segue il dito o il
  puntatore; il nastro delle notizie scorre (senza voci sulla Cortoteca).
- [x] **Home, indice**: Eventi e Produzioni hanno lo stesso corpo,
  centrati. Al passaggio (sul computer) prendono il colore della sezione e
  mostrano i tre più recenti; al clic il colore si allarga prima di cambiare
  pagina.
- [x] **Home**: il rullino di fotografie scorre e ogni foto porta al suo
  evento o al suo corto; Sostieni in arancio, piede in fondo.
- [x] **Eventi**: Long Story Short in evidenza, Short Talks, Altri eventi.
  Clic su una scheda: l'evento si apre sopra la pagina; Esc, crocetta
  (sul telefono in basso a destra) e il tasto indietro la chiudono.
- [x] **Pagine evento** aperte da sole (Long Story Short, Short Talks #1 e
  le altre, Blue Hour): foto, gallerie, tag Instagram toccabili; accanto ai
  corti del programma "Scheda del corto", che apre la pagina del corto.
- [x] **Produzioni**: lavoro più recente in evidenza con il titolo
  grafico, poi produzioni originali e collaborazioni; clic su un corto: il
  fotogramma vola al posto della copertina.
- [x] **Pagina di un corto** aperta da sola (es. `/opera.html?film=interzona`):
  titolo grafico nel colore del corto, crediti (interpreti a tutta riga sul
  telefono), Guarda dove c'è il video, i tasti **Letterboxd** e **IMDb**
  dove ci sono, nessuna pillola "Streaming in arrivo".
- [x] **Vantaggi del tesseramento** e **Contatti**: testi, Sostieni, piede;
  "Diventa socio" di Sostieni porta alla domanda di ammissione e la apre.
  In Contatti non c'è più il motivo "Diventare socio".
- [x] **Cornice narrativa** (`/cornicenarrativa.html`): il generatore di
  Long Story Short funziona.
- [x] **404**: un indirizzo inventato (es. `/non-esiste`) mostra la pagina
  404 del sito, anche più in profondità (`/a/b/c`).
- [x] Barra: nessuna voce Cortoteca; "Diventa socio" resta a destra; la
  voce della pagina corrente è accesa; sul telefono Contatti si raggiunge
  dal piede.
- [x] Nessuna pagina scorre di lato sul telefono.

## 2. Indirizzi vecchi e redirect

Controllati con `curl` sul deploy di prova il 18 novembre 2026: tutti a posto.

- [x] `/cortoteca/info_film2?film=interzona` apre la pagina del corto.
- [x] `/cortoteca.html`, `/cortoteca` e `/cortoteca/` portano a Produzioni.
- [x] `/area-socio.html`, `/area-socio`, `/proponi.html` e `/proponi`
  portano alla home.
- [x] `/CLAUDE.md`, `/README.md`, `/storico/`, `/supabase/config.toml`,
  `/google/iscrizioni/Codice.gs` rispondono "non trovato".

## 3. Modulo di Contatti (mail vere)

- [x] **Informativa**: la casella "Ho letto l'informativa" si spunta anche
  senza aprire il link (dal 19 novembre 2026); il link apre il PDF in
  un'altra scheda. Senza spuntarla il messaggio non parte.

Un invio per ogni motivo, scritto a mano (gli invii automatici Netlify li
scarta come spam). Per ognuno: dopo l'invio compare "Messaggio inviato" e
arriva la mail all'indirizzo giusto, con oggetto "[Sito CDL] … – <nome>" e
la versione dell'informativa letta.

- [x] Informazioni → ciao@
- [x] Short Talks nel tuo cinema → eventi@
- [x] Collaborare a una produzione → produzione@
- [x] Altro → ciao@
- [x] **Risposta alla mail**: premi "Rispondi" su una delle mail arrivate.
  Il destinatario proposto deve essere l'indirizzo di chi ha scritto, non
  `formresponses@netlify.com` né la casella dell'associazione. Se non lo
  è, per rispondere bisogna copiare l'indirizzo dal testo della mail:
  annotalo, si può valutare di cambiare il modo di inviare.

Alla fine, se vuoi, cancella gli invii di prova da Netlify → Forms.

## 4. Domanda di ammissione a socio (mail vere, foglio di prova)

Prima delle prove sul sito online, la web app punta alla **copia di prova**
del foglio soci (`FOGLIO_ID` nelle proprietà dello script). Usa un tuo
indirizzo come email del candidato.

- [x] La sezione "Domanda di ammissione a socio" è chiusa aprendo
  Vantaggi; si apre col + e da sola con `#associati`. Il link "modulo
  cartaceo" apre il PDF a 5 €.
- [x] Le caselle di statuto e informativa si spuntano solo dopo aver aperto
  i due PDF; lo statuto non compare in nessun'altra pagina.
- [x] Una data di nascita da minorenne: il modulo non parte e rimanda al
  modulo cartaceo.
- [x] **PayPal**: invia; compare la conferma con codice, importo (5 €),
  causale, la riga su "amici e familiari" e il tasto Vai a PayPal, che apre
  il pagamento giusto (non serve pagare in questa prova). Arrivano le due
  mail (ciao@ e candidato) con il PDF, e al candidato anche lo statuto.
  Nel foglio: riga nuova senza `#`, `Pagato? = No`, `PayPal`, link al PDF.
- [x] **Bonifico**: la conferma mostra IBAN, beneficiario e causale; riga
  con `Bonifico`.
- [x] **Contanti**: la conferma dice chi contattare; riga con `Cash`.
- [x] Doppio clic sul tasto, e ricarica dopo l'invio: una sola riga, una
  sola coppia di mail.
- [x] Stessa email una seconda volta (modulo ricompilato): la risposta è
  normale, la riga è segnata "possibile doppione".
- [x] Rete staccata al momento dell'invio: messaggio "non registrata", e
  nessuna istruzione di pagamento.
- [x] **Tasto nella mail a ciao@**: aperto da ciao@, mostra i dati e il
  numero di tessera in grande, e nel foglio non cambia niente. Aperto da
  una finestra anonima chiede l'accesso a Google; da un altro account
  risponde "riservata all'account". "Conferma": subito `Pagato? = Sì`, il
  `#` uguale a quello mostrato, la data, il PDF rinominato, la mail "quota
  ricevuta". Ricaricando: "già accolta" con il numero, nessuna seconda
  mail. Il modulo del sito continua a funzionare (deployment "Chiunque").
- [x] Su un'altra domanda, nel foglio di prova metti `Pagato? = Sì` (anche dal telefono): entro
  4 minuti compaiono il `#`, la data di pagamento, il PDF rinominato
  `NNN_NomeCognome`, e arriva "quota ricevuta" a ciao@ e al candidato.
  Togli e rimetti il Sì: nessuna seconda mail.
- [x] **Riga a mano** (come una domanda cartacea): nome, niente `#`,
  `Pagato? = Sì`. Entro 4 minuti prende il numero successivo e la data di
  pagamento, senza mail.
- [x] **Rinnovo**: riga a mano con nome ed email di un socio già numerato
  (nella copia di prova, in una scheda `TESSERATI 2027` copiata da quella
  del 2026), `Pagato? = Sì`: riprende il suo numero. Un nome nuovo prende
  il successivo al più alto delle due schede.
- [x] Scrivi a mano un numero già usato su un'altra riga: il riepilogo del
  mattino dopo lo segnala fra i "numeri di tessera usati due volte".
- [ ] **Una prova vera** (decisione dell'utente, 18 novembre: la fa con un amico che si tessera, per valutare anche l'esperienza; quindi dopo il deploy, sul foglio vero): una domanda con PayPal e un pagamento reale da
  5 € come "amici e familiari", fino alla mail "quota ricevuta". Poi la
  web app passa al foglio vero (vedi `CLAUDE.md`, dopo il deploy).

## 5. Gestione (redattori)

Provata dall'utente il 19 novembre 2026: a posto (si è aperta sulla
Dashboard, probabilmente per un indirizzo con `#dashboard`; lasciato stare).

- [x] Accesso con email, password e codice dell'app di autenticazione.
- [x] La gestione si apre su Opere. Dashboard, Proposte, Soci ed Eventi
  mostrano solo "In sviluppo", anche aperte dall'indirizzo (`#dashboard`,
  `#proposte`, `#soci`), senza pannelli vuoti.
- [x] Opere: apri un'opera, cambia un campo innocuo, salva, controlla sul
  sito, rimetti com'era. Il campo **IMDb** accetta solo indirizzi imdb.com.
  Il gruppo "Cortoteca" (titolare) non compare.
- [x] Rullino: l'ordine e le foto si vedono; un cambio si vede in home; la
  provenienza dei fotogrammi si chiama "Fotogrammi delle opere".
- [x] Sul telefono: barra delle schede su due righe con la scheda attiva in
  vista, moduli leggibili, tasti grandi abbastanza.
- [x] Esci, e la pagina torna all'accesso.

## 6. Header (opzionale, dal Terminale)

Controllati il 18 novembre 2026 sul deploy di prova: tutti a posto.

```bash
U=https://redesign--cdl-aps.netlify.app
for p in /gestione.html /gestione; do echo "== $p"; curl -sI "$U$p" | grep -i "content-security\|cache-control"; done
curl -sI "$U/assets/doc/statuto-cdl-aps-v1.pdf" | grep -i "x-robots"
for p in /cortoteca /area-socio /proponi; do echo "== $p"; curl -sI "$U$p" | grep -i "^HTTP\|^location"; done
```

Gestione con Content-Security-Policy e `Cache-Control: no-store`; lo statuto
con `X-Robots-Tag: noindex`; i tre indirizzi con 302 verso Produzioni e la
home.

## 7. Pulizia dopo le prove

- [ ] Invii di prova del modulo di Contatti in Netlify → Forms.
- [ ] Righe e PDF delle domande di prova: nella copia del foglio si
  possono lasciare; dal foglio vero e dalla cartella "Domande di
  ammissione" vanno tolti (e la quota di prova restituita, se serve).
