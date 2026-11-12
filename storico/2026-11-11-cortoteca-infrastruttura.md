# Cortoteca — progetto dell'infrastruttura

*11 novembre 2026. Documento di progetto: niente di quanto segue è stato
ancora costruito. Raccoglie lo stato rilevato, l'architettura proposta, le
alternative scartate e le decisioni che restano a chi dirige l'associazione.
La parte legale è una ricognizione di fonti pubbliche, non un parere: il testo
della licenza va fatto leggere a un avvocato prima di metterlo online.*

## 0. Decisioni prese e cosa è stato costruito (12 novembre 2026)

Le decisioni del § 8, prese dopo la prima stesura, cambiano alcune parti del
progetto. Dove il testo qui sotto le contraddice, vale questa sezione.

| Decisione | Effetto sul progetto |
|---|---|
| Video solo su YouTube o Vimeo | Nessun hosting proprio, nessuna licenza SIAE a carico di CDL. Il § 5 resta come motivazione. |
| Tolleranza di 60 giorni dall'inizio dell'anno | `privato.giorni_tolleranza()` |
| Socio che non rinnova: corto nascosto previa conferma di un amministratore | Nessuna azione automatica: la gestione lo segnala in "Da sistemare" e un redattore preme "Nascondi". Al rinnovo propone "Ripubblica". |
| Nessuna email automatica | **Cambia l'accesso dei soci.** Niente codice via email (§ 3.1, punto 1) e niente server di posta (§ 7): il socio entra con un collegamento personale che un redattore copia dalla scheda Soci e gli manda a mano (WhatsApp, email). Nessuna ricevuta via email: il socio la rilegge e la scarica dalla sua pagina. Gli avvisi al direttivo partono, se li si vuole, dallo script del foglio (un'email solo quando cambia qualcosa). |

Costruito e provato: tabelle, funzioni e regole di accesso (migrazioni
`20261111140000`–`20261111140500`), Edge Function `accesso-socio`, testo
della licenza versione 1 in database, `proponi.html`, nuove schede di
`gestione.html` (Proposte, Soci, Da sistemare, Sicurezza), script del foglio
`supabase/foglio/sincronizza-soci.gs`, Content-Security-Policy delle due
pagine. Il codice di verifica per i redattori è facoltativo finché qualcuno
non lo attiva; da lì in poi è imposto dal database.

Le bozze per il Consiglio (regolamento, licenza, delibera, punti per il
legale) stanno nel documento "Cortoteca — regolamento, licenza e delibera
(bozze)" su claude.ai.

## 1. Stato rilevato

| Cosa | Com'è oggi |
|---|---|
| Sito | Statico su Netlify, nessun build step. Redesign in corso in `anteprime/` (branch `redesign`). |
| Database | Supabase, piano gratuito, regione `eu-west-1`. 7 opere tutte pubblicate (2 con video, entrambe su YouTube), 8 eventi. 13 MB di database, 14,5 MB di immagini. |
| Accessi | Un solo account, che è anche l'unico redattore. Iscrizioni pubbliche disattivate (verificato sull'endpoint di Auth). Nessun secondo fattore. |
| Regole di accesso | RLS attiva su tutte le tabelle; scrive solo chi è in `privato.redattori`; lo schema `privato` non è esposto dalla Data API. Il controllo di sicurezza di Supabase non segnala nulla su queste tabelle. |
| Raccolta dati dei corti | Google Form "CORTOTECA" (Drive Amministrazione → Sito): 6 risposte. Una formula genera un JSON che poi va copiato a mano. Il modulo chiede nome e numero di tessera ma **non chiede nulla sui diritti**. |
| Soci | File "Gestione APS (fogli)", scheda `TESSERATI 2026`: 34 righe, tutte con "Pagato? Sì", 33 con email (una mancante, una con uno spazio in coda). Colonne: #, Nome cognome, Data tesseramento, Conferma assemblea?, Link al modulo, Pagato?, Modalità pagamento, Data pagamento, Email, Tessera?, Gruppo WA?, Volontario?, Note. |
| Posta | `cdlaps.com` è su Google Workspace (MX Google), DNS su Aruba. Supabase usa ancora il server di posta di prova. |

## 2. Requisiti

**Funzionali**

1. Un socio propone un corto da solo: dati, fotogramma, collegamento al video,
   concessione dei diritti.
2. Il redattore non ricopia nulla: legge, corregge se serve, approva.
3. Il sistema sa se chi propone è socio in regola con la quota dell'anno.
4. Di ogni corto pubblicato resta la prova di chi ha concesso cosa, quando e
   su quale testo.
5. Il socio può ritirare il corto in ogni momento.

**Non funzionali**

- Scala: decine di soci, qualche proposta al mese, un catalogo di decine di
  corti. Nessun problema di carico: i vincoli veri sono costo e manutenzione.
- Costo: zero euro al mese, salvo scelta diversa sul video (§ 5).
- Manutenzione: una persona, non sempre la stessa. Niente che richieda un
  server da tenere acceso o un build step.
- Dati personali: il minimo indispensabile, in Europa.

**Vincoli**

- Stack esistente: HTML/CSS/JS senza bundler, Supabase, Netlify, GitHub.
- Netlify pubblica solo i commit dell'account `cdl-aps`.
- Piano gratuito di Supabase: va in pausa dopo 7 giorni di inattività, non ha
  copie di sicurezza automatiche, file fino a 50 MB.

## 3. Architettura proposta

```
  SOCIO                        REDATTORE                     VISITATORE
  proponi.html                 gestione.html                 cortoteca / opera
  codice via email             password + codice TOTP        chiave pubblica
     │                             │                             │
     ▼                             ▼                             ▼
 ┌────────────────────── Supabase (eu-west-1) ───────────────────────────┐
 │  Auth: utenti creati solo dalla sincronizzazione o dalla dashboard     │
 │                                                                        │
 │  public.proposte ──── approva_proposta() ───▶ public.opere, interpreti │
 │  public.licenze  (solo aggiunta, mai modifica)                         │
 │  public.testi_licenza (versioni del testo accettabile)                 │
 │  privato.soci  ◀── Edge Function «soci» ◀── Apps Script nel foglio     │
 │                                                                        │
 │  Storage: «proposte» (privato) ── copia all'approvazione ──▶ «immagini»│
 │  Edge Function «posta»: ricevute e avvisi                              │
 └────────────────────────────────────────────────────────────────────────┘
     video: YouTube o Vimeo, incorporato, parte al clic sul fotogramma
```

### 3.1 Il percorso del socio (`proponi.html`)

1. **Accesso senza password.** Il socio scrive la sua email e riceve un codice
   a sei cifre (con il collegamento equivalente). Funziona solo per gli
   indirizzi presenti nel libro soci: gli account li crea la sincronizzazione,
   le iscrizioni pubbliche restano chiuse come oggi. La pagina risponde sempre
   "se l'indirizzo è quello di un socio, è partita un'email", così non rivela
   chi è socio.
2. **Socio non in regola.** Entra, ma vede "la quota 2026 non risulta pagata"
   con il rimando al rinnovo: sa perché non può proporre.
3. **Modulo in quattro passi, salvato a ogni campo.** Si può chiudere e
   riprendere da un altro dispositivo.
   - *Il corto*: titolo, anno, durata, regia, generi (da un elenco, non testo
     libero), tagline, sinossi, note di regia.
   - *Troupe e cast*: righe che si aggiungono, non sette coppie fisse.
   - *Materiali*: fotogramma (ridimensionato nel browser con il codice che
     `gestione.js` ha già), collegamento YouTube o Vimeo con anteprima
     immediata, Letterboxd. Chi non ha il video online lascia un collegamento
     al file.
   - *Diritti*: questionario e accettazione della licenza (§ 6.3).
4. **Invio.** Il socio riceve subito per email la ricevuta con il testo
   integrale accettato; una copia va a `ciao@cdlaps.com`.
5. **Dopo.** "Le mie proposte": stato, richieste di modifica, ritiro.

### 3.2 Il percorso del redattore (`gestione.html`)

Una terza scheda, **Proposte**, con il numero di quelle in attesa. All'arrivo
di una proposta parte un'email ai redattori.

La scheda di revisione mostra la proposta com'è destinata ad apparire e, a
fianco, i controlli già fatti dalla macchina:

- socio n. 008, quota pagata il 21/03/2026 (dal foglio, con l'ora dell'ultima
  sincronizzazione);
- licenza accettata, versione e data;
- il collegamento video si apre;
- il fotogramma ha risoluzione sufficiente;
- avvisi dal questionario (per esempio "musica di repertorio", "minori nel
  cast", "opera tratta da un'opera altrui").

Ogni campo si corregge sul posto. Tre azioni:

- **Approva e pubblica**: una funzione del database crea l'opera e il cast in
  un'unica transazione, copia il fotogramma nello spazio pubblico, avvisa il
  socio con il collegamento alla scheda. Rifiuta se manca la licenza o se il
  socio non è in regola.
- **Chiedi modifiche**: una nota al socio, che corregge e rinvia.
- **Rifiuta**, con motivo.

### 3.3 Modello dei dati

```
privato.soci            anno, numero, nome, email, pagato, data_pagamento,
                        data_tesseramento, user_id, sincronizzato_il, rimosso_il
                        unico (anno, numero) · non esposta dalla Data API

public.proposte         id, autore → auth.users, stato, dati jsonb,
                        nota_revisione, opera_id → opere, date
                        stato: bozza → inviata ⇄ da_rivedere → approvata
                                                             → rifiutata
                               (ritirata, dal socio)

public.licenze          id, proposta_id, opera_id, user_id, nome_dichiarato,
                        email, numero_tessera, versione_testo, sha256_testo,
                        risposte jsonb, accettata_il, ip, user_agent,
                        revocata_il

public.testi_licenza    versione, testo, sha256, in_vigore_dal
```

- `proposte.dati` è un JSON con la stessa forma di `opere` più gli interpreti:
  una bozza è incompleta per natura e il modulo può cambiare senza migrazioni.
  La validazione stretta avviene all'approvazione, dove valgono i vincoli di
  `opere`.
- **RLS.** Il socio vede e modifica solo le proprie proposte, e solo finché
  sono `bozza` o `da_rivedere`. Lo stato non si cambia scrivendo la colonna:
  passa da funzioni (`invia_proposta`, `ritira_proposta`, `approva_proposta`)
  che controllano chi chiama. I redattori vedono tutto.
- **Licenze.** Nessuno, nemmeno un redattore, le modifica o le elimina dalla
  Data API. L'accettazione la scrive `invia_proposta`, che registra ora del
  server, indirizzo IP e browser letti dalla richiesta, e la versione del
  testo in vigore. La revoca valorizza `revocata_il`.
- **Fotogrammi delle proposte** in un bucket privato `proposte`, cartella per
  utente. Quello pubblico `immagini` resta scrivibile solo dai redattori:
  altrimenti ogni socio potrebbe pubblicare file sotto l'indirizzo di CDL.
- Ogni migrazione di tabella nuova porta i suoi `grant` (regola in `CLAUDE.md`).

### 3.4 Incrocio con il foglio dei soci

Il foglio resta la fonte: nessuno cambia abitudini.

**Meccanismo scelto: lo script dentro il foglio spinge i dati.** Uno script
Apps Script legato a "Gestione APS (fogli)" legge la scheda `TESSERATI <anno>`
e manda a una Edge Function solo sei colonne (numero, nome, email, pagato,
data pagamento, data tesseramento). Parte a ogni modifica del foglio, una
volta per notte e da una voce di menu "Sincronizza soci ora". Se fallisce,
Google manda una mail. La Edge Function verifica un segreto condiviso,
aggiorna `privato.soci`, segna come rimosse le righe sparite e crea l'account
ai soci nuovi.

**Alternativa scartata: Supabase legge il foglio con un account di servizio
Google.** Richiede un progetto Google Cloud e, soprattutto, dà a quell'account
la lettura dell'intero file, compresa la scheda `PASSWORD`. Con lo script,
Supabase non ha alcun accesso al Drive.

"In regola" significa: riga nell'anno corrente con `Pagato?` = Sì. Due regole
vanno decise dal direttivo (§ 8): la tolleranza a inizio anno e cosa succede a
un corto già pubblicato quando l'autore non rinnova.

In gestione compare lo stato della sincronizzazione ("34 soci, aggiornato due
ore fa"), con un avviso se è più vecchio di due giorni.

Tre ritocchi al foglio lo rendono affidabile: email obbligatoria (ne manca
una), menu a tendina Sì/No su `Pagato?`, intestazioni stabili. Lo script cerca
le colonne per nome e si ferma con un errore chiaro se ne manca una.

## 4. La pagina di gestione

**È sicura nell'impianto.** La protezione non sta nella pagina ma nel
database: chi non è redattore non scrive nulla, qualunque cosa faccia il
browser. Le iscrizioni sono chiuse, la chiave nel sito è quella pubblica, la
tabella dei redattori non è raggiungibile dalla Data API.

**Punti deboli, in ordine di peso:**

1. Solo password, nessun secondo fattore. La verifica delle password
   compromesse è disattivata (sul piano gratuito non si può attivare).
2. `supabase-js` arriva da un CDN senza controllo di integrità e la pagina non
   ha una Content-Security-Policy. La sessione sta nel browser: uno script
   estraneo la potrebbe leggere.
3. Con le proposte entrano nel database testi scritti da terzi, che il
   redattore apre da autenticato. Oggi i modelli HTML passano da `esc()`:
   deve restare vero per ogni campo nuovo, e la CSP serve da seconda barriera.
4. Un solo redattore: se perde l'accesso, il recupero password passa dal
   server di posta di prova, che scrive solo ai membri dell'organizzazione
   Supabase.

**Come si colloca.** Diventa il retrobottega dell'intero flusso: Proposte,
Opere, Eventi, più due viste di sola lettura (Soci, con lo stato della
sincronizzazione; Licenze). `proponi.html` è la porta dei soci, `gestione.html`
quella dei redattori: stesso sistema di accesso, ruoli diversi. Un socio che
apre gestione vede già oggi "account non abilitato".

**Interventi previsti:**

- Secondo fattore TOTP obbligatorio per i redattori, imposto dal database:
  `privato.e_redattore()` risponde vero solo se la sessione è di livello
  `aal2`. Senza codice, l'account non scrive nemmeno chiamando la Data API a
  mano.
- `supabase-js` copiato in `assets/js/` invece che caricato dal CDN, e una CSP
  in `netlify.toml` per `gestione.html` e `proponi.html` (script solo dal
  sito, connessioni solo verso il progetto Supabase, nessun inserimento in
  frame).
- Un secondo redattore.
- Posta vera per Auth (§ 7).

## 5. Dove sta il video

| | YouTube o Vimeo incorporato | Hosting proprio (es. Bunny Stream) |
|---|---|---|
| Costo | Zero | Pochi euro al mese a questa scala (da verificare sul listino) |
| Per il socio | Incolla un collegamento | Carica il file dal modulo |
| Aspetto | Lettore altrui, possibili suggerimenti a fine video | Lettore proprio, nessuna pubblicità |
| Musica tutelata | La licenza la tiene la piattaforma | Serve una licenza SIAE a nome di CDL (§ 6.2) |
| Chi mette a disposizione l'opera | Chi ha caricato il video | CDL |
| Lavoro | Nessuno: è il sistema attuale | Caricamento a blocchi, transcodifica, lettore |

**Proposta: restare sull'incorporamento**, con il lettore in modalità senza
cookie e avvio al clic (il redesign lo fa già). Il campo `video_url` resta
com'è, quindi passare a un hosting proprio in futuro tocca solo `getEmbedUrl`
e la scheda opera. Chi non ha un canale manda il file e CDL lo carica come
"non in elenco" sul proprio canale: in quel caso è CDL a pubblicare, e la
licenza deve coprire anche questo.

## 6. Diritti: cosa chiedere e se basta un consenso online

### 6.1 Chi deve concedere

- **Il produttore.** Nell'opera cinematografica l'esercizio dei diritti di
  utilizzazione economica spetta a chi ha organizzato la produzione (art. 45
  l. 633/1941), e comprende le forme di comunicazione al pubblico arrivate
  dopo, salvo patto contrario (Cass. 16771/2012). Il produttore ha inoltre un
  diritto proprio sulla messa a disposizione online (art. 78-ter). In un corto
  autoprodotto di solito è il regista; se c'è una casa di produzione o più
  coproduttori, serve la loro autorizzazione. Fra le opere già online
  compaiono "LVDA Film" e "Arkadia Studios".
- **I coautori** (soggetto, sceneggiatura, musica, regia: art. 44) conservano
  i diritti morali: crediti corretti, nessun taglio o rimontaggio.
- **La musica** è il punto più delicato. Musica originale di un autore non
  iscritto a una società di gestione: basta il suo consenso. Autore iscritto a
  SIAE o Soundreef: i diritti di diffusione li amministra la società, il socio
  non può rinunciarvi per lui. Brani preesistenti: servono la licenza di
  sincronizzazione dell'editore e quella del discografico, estese all'online
  (quelle "solo festival" non bastano). Librerie musicali: va controllato che
  la licenza copra la pubblicazione su siti di terzi.
- **Gli interpreti.** Hanno diritti connessi sulla loro prestazione (art. 80
  ss.) e il diritto all'immagine (art. 96-97; art. 10 c.c.). Per i minori
  firmano i genitori. Un tribunale ha condannato nel 2026 un teatro per aver
  messo online due spettacoli senza il consenso degli artisti, pur senza alcun
  guadagno: la clausola che consentiva riprese "per usi propri" non copriva la
  diffusione pubblica in rete. Il consenso deve nominare lo streaming.
- **Opere altrui dentro il corto**: testi da cui è tratto, opere d'arte
  inquadrate, filmati d'archivio.

### 6.2 Obblighi che ricadono su CDL

- **SIAE.** Per il video on demand con contenuti musicali su un sito proprio
  SIAE prevede una licenza; le condizioni note escludono però film e
  documentari, che seguono un'altra strada. Con l'incorporamento da YouTube la
  questione non si pone per CDL. Se si sceglie l'hosting proprio, va chiesto a
  `musica.online@siae.it` prima di partire, compreso l'equo compenso degli
  autori del film (art. 46-bis).
- **AGCOM.** I cataloghi a richiesta sono soggetti a segnalazione di inizio
  attività (delibera 295/23/CONS), ma il regolamento esclude i servizi
  prestati nell'esercizio di attività non economiche. Un archivio gratuito,
  aperto a tutti e senza pubblicità ne sta ragionevolmente fuori. Se un giorno
  l'accesso fosse riservato a chi paga la quota, va ricontrollato. *Punto da
  verificare sul testo dell'allegato A.*
- **Responsabilità.** CDL sceglie e rivede ciò che pubblica: risponde come
  editore, non come semplice ospite. Servono un indirizzo per le segnalazioni
  su ogni scheda e la rimozione rapida.
- **Dati personali.** Informativa per chi propone (titolare, finalità, basi
  giuridiche, tempi di conservazione, responsabili esterni: Supabase, Google,
  fornitore di posta, Netlify). Oggi il sito non ha una pagina sulla privacy,
  e serve già per il modulo Contatti del redesign. Licenze conservate per la
  durata della pubblicazione più dieci anni; dati dei soci solo per l'anno in
  corso e il precedente.

### 6.3 Cosa contiene la concessione

**Questionario** (risposte registrate insieme all'accettazione):

1. In che veste concedi: produttore unico; coproduttore con il consenso
   scritto degli altri; autore con l'autorizzazione del produttore.
2. Musica: originale di autore non iscritto; originale di autore iscritto a
   SIAE o altra società; brani preesistenti con licenza che copre l'online;
   libreria musicale; nessuna.
3. Interpreti e persone riprese: tutti hanno acconsentito per iscritto alla
   diffusione online; ci sono minori, con il consenso dei genitori.
4. Il corto è tratto o ispirato da un'opera altrui? Con quale autorizzazione?
5. Vincoli in corso: esclusive con distributori, festival che richiedono
   l'anteprima.
6. Contenuti sensibili da segnalare a chi guarda.

**Clausole della licenza:**

- opera identificata; diritti elencati uno per uno, perché sono indipendenti
  fra loro (art. 19): riproduzione nei limiti tecnici della pubblicazione,
  messa a disposizione del pubblico in streaming su `cdlaps.com`, senza
  download;
- non esclusiva, gratuita (scelta dichiarata in modo esplicito), senza limiti
  di territorio, a tempo indeterminato;
- **revoca in ogni momento**, con rimozione entro un termine fisso (per
  esempio 15 giorni);
- nessuna modifica dell'opera; crediti come indicati dall'autore;
- uso promozionale di fotogramma ed estratti brevi sui canali di CDL, come
  consenso separato e facoltativo;
- divieto per CDL di cedere la licenza a terzi;
- garanzie del socio sulle risposte del questionario e manleva verso CDL;
- facoltà di CDL di rimuovere l'opera;
- legge italiana, **senza** deroghe al foro né limitazioni di responsabilità.

### 6.4 Basta un consenso online?

**Sì, per una licenza non esclusiva e gratuita, a queste condizioni.**

- La legge non impone una forma per la validità. Chiede che la trasmissione
  dei diritti sia *provata* per iscritto (art. 110): la forma serve alla
  prova, non all'esistenza dell'accordo, e la regola è riferita anche alle
  licenze.
- Un'accettazione con casella e registrazione è un documento informatico con
  firma elettronica semplice. Non ha l'efficacia della scrittura privata, che
  spetta a firma digitale, qualificata, avanzata o a un processo con
  identificazione tipo SPID; il suo valore è "liberamente valutabile in
  giudizio" per sicurezza, integrità e immodificabilità (art. 20, c. 1-bis,
  CAD). Non può però essere respinto solo perché elettronico (art. 25
  reg. eIDAS).
- Per questo conta **come** si raccoglie il consenso. Il progetto prevede:
  accesso con email verificata e coincidente con il libro soci; nome e cognome
  digitati; caselle separate e non preselezionate; ora del server, IP e
  browser; versione e impronta del testo; ricevuta immediata con il testo
  integrale a entrambe le parti; registro che nessuno può modificare.
- **Le clausole vessatorie restano fuori.** Per l'art. 1341, c. 2, c.c.
  richiedono un'approvazione specifica per iscritto, e l'orientamento
  prevalente non ritiene sufficiente una spunta. Da qui l'assenza di deroghe
  al foro e di limitazioni di responsabilità.
- **Il limite vero non è la firma.** Il rischio concreto non è il socio che
  nega di aver accettato (gli basta revocare), ma un terzo — musicista,
  attore, coproduttore — che non ha mai dato il consenso. Nessun modulo
  online protegge da questo: la manleva dà solo una rivalsa sul socio. Per
  questo il questionario e la rimozione rapida contano più della firma.
- Per accordi diversi (esclusive, distribuzione, compensi) serve un contratto
  firmato.

**Le sette opere già online** non hanno alcuna concessione registrata. Si
regolarizzano con lo stesso passo "Diritti": l'autore riceve un collegamento,
risponde al questionario, accetta. Le sei passate dal modulo Google portano
già nome e numero di tessera.

## 7. Affidabilità e gestione

- **Posta.** Senza un server SMTP proprio Supabase scrive solo ai membri
  dell'organizzazione: i codici ai soci non partirebbero. Due strade: un
  servizio transazionale con chiave dedicata e revocabile (tre record DNS su
  Aruba), oppure la casella Google Workspace con una password per app (nessun
  DNS, ma una credenziale della casella dentro Supabase). Proposta: la prima.
- **Copie.** Il piano gratuito non fa backup. Le licenze sono prove: la
  ricevuta inviata a `ciao@cdlaps.com` ne è la copia indipendente. In più,
  un'esportazione scaricabile da gestione (opere, proposte, licenze), che
  aggiorna anche `data/opere.json`.
- **Pausa del progetto.** Resta il flusso `sveglia-supabase.yml`.
- **Abuso.** I codici partono solo verso indirizzi di soci, con i limiti di
  frequenza di Supabase; se servisse, un captcha sulla richiesta del codice.
- **Cosa rivedere crescendo.** Oltre il centinaio di corti o con video
  propri: piano a pagamento di Supabase (backup, protezione password),
  hosting video dedicato, licenza SIAE. Se i redattori diventano molti: ruoli
  distinti (chi rivede, chi pubblica).

## 8. Decisioni che restano all'associazione

1. **Video**: incorporamento da YouTube/Vimeo (proposto) o hosting proprio.
2. **Tolleranza a inizio anno**: fino a quando vale la tessera dell'anno
   prima (per esempio fino al 31 marzo, o fino all'assemblea).
3. **Socio che non rinnova**: il corto resta finché non viene ritirato
   (proposto), oppure esce dal catalogo.
4. **Canale di posta** per codici e ricevute.
5. **Chi è il secondo redattore.**
6. **Regolamento della Cortoteca** approvato dal direttivo, a cui la licenza
   rimanda, e revisione del testo da parte di un legale.

## 9. Fasi

0. **Premesse** (nessun codice del flusso): decisioni del § 8, posta, secondo
   fattore e secondo redattore, `supabase-js` in locale e CSP, credenziali
   fuori dai fogli, testo della licenza, pagina privacy.
1. **Dati**: migrazioni (`soci`, `proposte`, `licenze`, `testi_licenza`,
   bucket), Edge Function `soci`, script nel foglio.
2. **`proponi.html`**: accesso, modulo, invio, ricevuta. È una pagina
   pubblica: nasce già nella nuova identità.
3. **Gestione**: scheda Proposte, approvazione, avvisi, viste Soci e Licenze.
4. **Regolarizzazione** delle sette opere esistenti.
5. *(Facoltativa)* hosting video proprio.

Le fasi 1–3 non dipendono dal redesign delle pagine pubbliche e possono
procedere in parallelo.

## Fonti

- Art. 107-110 l. 633/1941: [filodiritto.com](https://www.filodiritto.com/codici/legge-sulla-protezione-del-diritto-dautore-e-di-altri-diritti-connessi-al-suo-esercizio-l-22-aprile-1941-n-633/capo-ii-trasmissione-dei-diritti-di-utilizzazione)
- Art. 45 e 46 l. 633/1941: [brocardi.it, art. 45](https://brocardi.it/legge-diritto-autore/titolo-i/capo-iv/sezione-iii/art45.html), [art. 46](https://www.brocardi.it/legge-diritto-autore/titolo-i/capo-iv/sezione-iii/art46.html); Cass. 16771/2012: [massima](https://brocardi.it/massimario/75792.html)
- Art. 20 CAD: [brocardi.it](https://www.brocardi.it/codice-dell-amministrazione-digitale/capo-ii/sezione-i/art20.html); commento: [agendadigitale.eu](https://www.agendadigitale.eu/documenti/il-valore-probatorio-del-documento-informatico-cosa-dice-la-normativa/)
- Clausole vessatorie e contratti online: [diritto.it](https://www.diritto.it/i-contratti-point-and-click/), [edotto.com](https://edotto.com/articolo/contratti-telematici-la-spunta-non-basta-per-le-clausole-vessatorie)
- Spettacoli online senza consenso degli artisti: [iusletter.com](https://iusletter.com/dalla-redazione/diritto-dellimpresa/diritto-dautore/spettacoli-su-youtube-senza-consenso-lente-risponde-anche-se-non-ha-guadagnato-nulla/)
- SIAE, musica in streaming: [siae.it](https://www.siae.it/it/utilizzatori/online/musica-streaming-download/); licenza multimediale: [ufficiomarchibrevetti.it](https://ufficiomarchibrevetti.it/2021/06/la-licenza-multimediale-streaming/)
- AGCOM, delibera 295/23/CONS: [testo](https://www.agcom.it/sites/default/files/migration/delibera/Delibera%20295-23-CONS.pdf), [sintesi Newslinet](https://www.newslinet.com/media-agcom-del-n-295-23-cons-nuova-disciplina-aut-fornitura-servizi-media-a-v-e-radio-via-sat-su-altri-mezzi-com-elettr-e-a-richiesta/)
- Supabase, posta di Auth: [supabase.com](https://supabase.com/docs/guides/auth/auth-smtp)
- Incorporamento e comunicazione al pubblico: Corte di giustizia UE, C-348/13 (BestWater) e C-392/19 (VG Bild-Kunst) — citate a memoria, non riverificate.
- Art. 44, 78-ter, 80, 96-97 l. 633/1941, art. 1341 e 2725 c.c., art. 25 reg. UE 910/2014: citati a memoria dal testo di legge, da far confermare al legale.
