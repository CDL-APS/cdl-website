# Prove sul sito online prima del deploy del redesign

Da fare sul deploy di prova **https://redesign--cdl-aps.netlify.app**
(branch `redesign`, caricato a mano con la CLI di Netlify, senza `--prod`):
`cdlaps.com` resta il sito vecchio finché la pull request non è unita.

Da sapere prima di cominciare:

- **Il database è quello vero.** Proposte, collegamenti, modifiche alle
  opere e al rullino fatti qui restano. Le cose create solo per provare
  vanno cancellate alla fine (ultima sezione).
- **I moduli di Contatti mandano mail vere** a ciao@, eventi@ e
  produzione@cdlaps.com.
- **Se il branch cambia**, il deploy di prova non si aggiorna da solo: va
  ricaricato.
- Accanto a ogni problema annota pagina, dispositivo e larghezza (telefono,
  computer), e se puoi una schermata.

Dispositivi: almeno un **iPhone con Safari** (il sito non è mai stato
provato su un dispositivo vero), **Safari sul Mac** e un altro browser sul
computer (Chrome o Firefox).

## 1. Pagine pubbliche

Su telefono e computer:

- [ ] **Home**: si vede la sala al buio e la torcia segue il dito o il
  puntatore; il nastro delle notizie scorre.
- [ ] **Home, indice**: Eventi, Produzioni e Cortoteca hanno lo stesso
  corpo, centrati. Al passaggio (sul computer) prendono il colore della
  sezione ed Eventi e Produzioni mostrano i tre più recenti; al clic il
  colore si allarga prima di cambiare pagina.
- [ ] **Home**: il rullino di fotografie scorre e ogni foto porta al suo
  evento o al suo corto; Sostieni in arancio, piede in fondo.
- [ ] **Eventi**: Long Story Short in evidenza, Short Talks, Altri eventi.
  Clic su una scheda: l'evento si apre sopra la pagina; Esc, crocetta
  (sul telefono in basso a destra) e il tasto indietro la chiudono.
- [ ] **Pagine evento** aperte da sole (Long Story Short, Short Talks #1 e
  le altre, Blue Hour): foto, gallerie, tag Instagram toccabili.
- [ ] **Produzioni**: lavoro più recente in evidenza con il titolo
  grafico, poi produzioni originali e collaborazioni.
- [ ] **Cortoteca**: galleria, ordinamenti, ricerca; clic su una still: la
  sala del corto si apre sopra; Esc, crocetta e indietro la chiudono.
- [ ] **Pagina di un corto** aperta da sola (es. `/opera.html?film=interzona`):
  titolo grafico nel colore del corto, crediti (interpreti a tutta riga sul
  telefono), Guarda, e i tasti **Letterboxd** e **IMDb** dove ci sono.
- [ ] **Vantaggi del tesseramento** e **Contatti**: testi, Sostieni, piede.
- [ ] **Cornice narrativa** (`/cornicenarrativa.html`): il generatore di
  Long Story Short funziona.
- [ ] **404**: un indirizzo inventato (es. `/non-esiste`) mostra la pagina
  404 del sito, anche più in profondità (`/a/b/c`).
- [ ] Barra: la voce della pagina corrente è accesa; sul telefono Contatti
  si raggiunge dal piede.
- [ ] Nessuna pagina scorre di lato sul telefono.

## 2. Indirizzi vecchi

- [ ] `/cortoteca/info_film2?film=interzona` apre la pagina del corto.
- [ ] `/proponi.html` e `/proponi` portano all'area socio.
- [ ] `/CLAUDE.md`, `/README.md`, `/storico/`, `/supabase/config.toml`
  rispondono "non trovato".

## 3. Modulo di Contatti (mail vere)

Un invio per ogni motivo, scritto a mano (gli invii automatici Netlify li
scarta come spam). Per ognuno: dopo l'invio compare "Messaggio inviato" e
arriva la mail all'indirizzo giusto, con oggetto "[Sito CDL] … – <nome>".

- [ ] Informazioni → ciao@
- [ ] Diventare socio → ciao@ (anche da `/contatti.html?motivo=socio`, che
  lo preseleziona)
- [ ] Short Talks nel tuo cinema → eventi@
- [ ] Un corto per la Cortoteca → ciao@
- [ ] Collaborare a una produzione → produzione@
- [ ] Altro → ciao@
- [ ] Rispondendo alla mail, la risposta va a chi ha scritto (se no, va
  copiato l'indirizzo dal messaggio: da annotare).

Alla fine, se vuoi, cancella gli invii di prova da Netlify → Forms.

## 4. Gestione (redattori)

- [ ] Accesso con email, password e codice dell'app di autenticazione.
- [ ] Dashboard: numeri, ultime attività, "Da sistemare" (solo cose da
  fare).
- [ ] Opere: apri un'opera, cambia un campo innocuo, salva, controlla sul
  sito, rimetti com'era. Il campo **IMDb** accetta solo indirizzi imdb.com.
- [ ] Eventi: mostra "In sviluppo" (voluto, per questo deploy).
- [ ] Rullino: l'ordine e le foto si vedono; un cambio si vede in home.
- [ ] Proposte: elenco delle proposte inviate; se un socio ha una bozza
  aperta compare la riga "Bozze in preparazione" con il solo nome.
- [ ] Soci: elenco, stato del collegamento accanto a ogni socio, nota dei
  soci senza email.
- [ ] Sul telefono: barra delle schede su due righe con la scheda attiva in
  vista, moduli leggibili, tasti grandi abbastanza.
- [ ] Esci, e la pagina torna all'accesso.

## 5. Area socio (serve un socio di prova)

Il collegamento **non vale per le email dei redattori**: serve un socio nel
libro soci (foglio `TESSERATI 2026`, poi sincronizzazione) con un indirizzo
diverso dal tuo di redattore, e in regola con la quota se vuoi arrivare fino
all'approvazione.

- [ ] Gestione → Soci → "Nuovo collegamento" per il socio di prova; copia
  il messaggio. Il collegamento punta a `redesign--cdl-aps.netlify.app`.
- [ ] Apri il collegamento (meglio da un altro browser o dal telefono): la
  pagina chiede subito la password, almeno 6 caratteri, da ripetere.
- [ ] Chiudi la pagina prima di sceglierla e riaprila: chiede ancora la
  password.
- [ ] Scelta la password: si entra nell'area socio. Esci.
- [ ] Rientra con email e password. Una password sbagliata dà un messaggio
  chiaro.
- [ ] Riapri lo stesso collegamento: non deve più funzionare (vale una volta
  sola). In gestione lo stato diventa "usato il…".
- [ ] "Nuovo collegamento" per un socio che ne ha già usato uno: la
  gestione chiede conferma (serve se ha dimenticato la password).

## 6. Proposta di un corto, dall'inizio alla fine

Con il socio di prova, poi con la gestione.

- [ ] Area socio: nuova proposta, scegli "Cortoteca" (streaming) o "sola
  scheda", compila (durata, anno, regia, sinossi e fotogramma sono
  obbligatori), aggiungi Letterboxd o IMDb, carica il fotogramma ed
  eventualmente il titolo grafico.
- [ ] Lascia la proposta a metà (si salva da sola: "Modifiche da salvare…"
  poi salvata) ed esci: in gestione la proposta **non** compare fra
  quelle da rivedere; c'è solo il nome del socio in "Bozze in
  preparazione".
- [ ] Rientra, rispondi al questionario, accetta il testo e invia.
- [ ] Gestione → Proposte: la proposta c'è con il fotogramma visibile.
  Prova "Chiedi modifiche": il socio la ritrova da correggere, la corregge
  e la reinvia.
- [ ] "Approva e pubblica": l'opera nasce in Cortoteca con
  fotogramma, titolo grafico, tasti Letterboxd/IMDb; con la sola scheda la
  pagina non promette lo streaming.
- [ ] L'area socio mostra la proposta come approvata.

## 7. Header di sicurezza (opzionale, dal Terminale)

```bash
U=https://redesign--cdl-aps.netlify.app
for p in /gestione.html /gestione /area-socio.html /area-socio; do echo "== $p"; curl -sI "$U$p" | grep -i "content-security\|cache-control\|referrer"; done
```

Gestione e area socio devono avere Content-Security-Policy e
`Cache-Control: no-store`; l'area socio anche `Referrer-Policy:
no-referrer`. (Verificato il 13 novembre, da ricontrollare solo se cambia
`netlify.toml`.)

## 8. Pulizia dopo le prove

- [ ] Cancellare l'opera nata dalla proposta di prova (o nasconderla) e la
  proposta stessa, con la sua licenza: chiedi a Claude, servono query sul
  database.
- [ ] Il socio di prova: toglierlo dal libro soci se non serve più.
- [ ] Invii di prova del modulo di Contatti in Netlify → Forms.
- [ ] I collegamenti creati dalla prova puntano al deploy di prova: dopo il
  deploy vanno rifatti dal sito vero (già nella lista di `CLAUDE.md`).
