# Sito CDL APS

Sito dell'associazione CDL APS (Rimini). È un sito **statico**: solo HTML, CSS
e JavaScript, senza server né database. Non c'è niente da installare né da
compilare — i file che vedi sono esattamente quelli che finiscono online.

---

## Come vederlo in locale

Da terminale, nella cartella del progetto:

```bash
cd ~/Code/CDL-Web
python3 -m http.server 5500
```

poi apri `http://localhost:5500` nel browser (Ctrl+C nel terminale per
fermarlo). Dentro Claude Code basta scrivere `! python3 -m http.server 5500`.

In alternativa, apri la cartella in VS Code, poi clic destro su `index.html` →
**Open with Live Server**: si apre sullo stesso indirizzo e si ricarica da solo
a ogni salvataggio.

> **Serve un server, non basta il doppio clic sul file.** Le pagine leggono
> opere ed eventi dal database con richieste di rete, e la copia di riserva
> in `data/` con altre richieste che i browser bloccano quando la pagina è
> aperta come `file://`. Con Live Server funziona
> tutto. L'estensione è già fra quelle consigliate in `.vscode/extensions.json`:
> VS Code te la propone da solo la prima volta che apri il progetto.

---

## Com'è organizzato

```
.
├── index.html                 Home
├── produzioni.html            Le produzioni CDL
├── eventi.html                Gli eventi CDL, divisi in blocchi per serie
├── contatti.html              Diventa socio e modulo per scriverci (Netlify Forms)
├── longstoryshort.html        Pagina dell'evento Long Story Short
├── short-talks-1.html, …      Pagine degli altri eventi, una per evento (vedi sotto)
├── cornicenarrativa.html      Generatore del "biglietto" di LSS 2026
├── cortoteca.html             Archivio dei cortometraggi (in pausa: rimanda a Produzioni)
├── opera.html                 Pagina di un singolo corto (opera.html?film=codice)
├── vantaggi-tesseramento.html Vantaggi per i soci e domanda di ammissione online
├── 404.html                   Pagina non trovata (percorsi assoluti)
├── gestione.html              Pagina riservata ai redattori (non indicizzata)
├── area-socio.html            Area socio: accesso con password, proposte (in pausa: rimanda alla home)
│
├── data/                      Copie di riserva del database (vedi sotto)
│   ├── opere.json
│   └── eventi.json
│
├── supabase/
│   ├── migrations/            Struttura del database, un file SQL per modifica
│   ├── functions/             Edge Function (accesso dei soci alla Cortoteca)
│   ├── licenze/               Testi della licenza della Cortoteca, uno per versione
│   └── foglio/                Script da incollare nel foglio dei soci (Apps Script)
│
├── google/iscrizioni/         Web app Apps Script della domanda di ammissione (vedi il suo README)
├── documenti/                 Sorgenti HTML dei PDF in assets/doc/ (informative, statuto)
│
├── assets/
│   ├── css/
│   │   ├── base.css           Colori, misure, griglia e titoli del brand
│   │   ├── components.css     Pezzi ricorrenti: barra, pulsanti, cornici, schede, piede
│   │   └── pages/             Uno per pagina, solo ciò che è specifico
│   │                          (riservato.css: comune a gestione e area socio)
│   ├── js/
│   │   ├── dati.js            Lettura di opere ed eventi, comune a più pagine
│   │   ├── comune.js          Scritte a tutta larghezza, occhi, rullini, schede,
│   │   │                      titolo grafico, passaggi fra le pagine
│   │   ├── corto.js           La pagina del corto (opera.html e la sala della Cortoteca)
│   │   ├── home.js            Torcia, nastro delle notizie, indice
│   │   ├── cortoteca.js       Galleria e lista, ricerca, ordine, la sala
│   │   ├── opera.js           opera.html: legge ?film= e riempie la pagina
│   │   ├── eventi.js          Blocchi della pagina Eventi e la sala dell'evento
│   │   ├── produzioni.js      Produzioni e collaborazioni CDL
│   │   ├── contatti.js        Modulo di Contatti: destinatario e oggetto
│   │   ├── riservato.js       Parti comuni a gestione e area socio
│   │   ├── gestione.js        Pagina dei redattori
│   │   ├── area-socio.js      Area socio
│   │   ├── vendor/            Librerie di terzi copiate nel sito (supabase-js)
│   │   └── cornice.js         Generatore del biglietto LSS
│   └── img/
│       ├── brand/             Logo, icona, favicon, lettering di LSS
│       ├── partner/           Loghi dei partner, tessera
│       ├── nuvole/            Nuvolette della vecchia home (servono ai redirect)
│       ├── sfondi/            Wallpaper della home
│       ├── eventi/            Copertine e miniature (copie locali); loghi degli
│       │                      eventi (loghi/), foto delle pagine evento, una
│       │                      cartella per evento
│       └── film/              Fotogrammi dei primi corti (copie locali) e titoli
│                              grafici provvisori (titoli/)
│
├── netlify.toml               Redirect dai vecchi indirizzi e cache
└── robots.txt
```

**Regola pratica per il CSS**: se una regola serve a una sola pagina va in
`assets/css/pages/`; se ricorre su due o più pagine va in `components.css`.
`base.css` contiene solo i colori del brand e le fondamenta, e cambia di rado.
Due pagine caricano anche il foglio di un'altra, perché la mostrano al loro
interno: `cortoteca.html` carica `pages/opera.css` (la sala del corto) ed
`eventi.html` carica `pages/evento.css` (la sala dell'evento).

---

## Aggiungere o modificare opere ed eventi

Opere ed eventi stanno in un database **Supabase**, nell'organizzazione *CDL
APS* (account `ciao@cdlaps.com`). Non si modificano più file né si fa un push:

1. Vai su `cdlaps.com/gestione.html` e accedi con email, password e il
   codice dell'app di autenticazione (al primo accesso la pagina chiede di
   attivarla).
2. Scegli *Opere*, poi *Nuova opera*, oppure clicca su un'opera esistente
   per modificarla. La scheda *Eventi* è ferma ("In sviluppo"): per ora gli
   eventi si cambiano dalla dashboard di Supabase.
3. Compila i campi e scegli l'immagine: viene ridimensionata e caricata da
   sola.
4. Spunta **Pubblicata** quando è pronta e salva. Senza spunta resta una
   bozza, visibile solo nella pagina di gestione.

Le modifiche sono online subito, senza ripubblicare il sito. Alcune cose da
sapere:

- Il **codice** è l'identificativo nell'indirizzo (`opera.html?film=codice`).
  Si genera dal titolo e dopo il primo salvataggio non si cambia più, per non
  rompere i link già condivisi.
- La **serie** di un evento decide dove compare nella pagina Eventi:
  l'ultima edizione di Long Story Short sta in primo piano, le edizioni di
  Short Talks hanno un blocco loro, gli eventi senza serie finiscono fra gli
  altri eventi.
- Un'opera con **Prodotta da CDL** compare fra le produzioni originali della
  pagina Produzioni e nell'elenco breve della home. Fra due produzioni dello
  stesso anno conta come più recente l'ultima inserita.
- Un'opera con **Collaborazione CDL** (non prodotta da CDL, ma con il suo
  contributo) va nel blocco Collaborazioni della pagina Produzioni, che
  compare solo quando ce n'è almeno una. Le due spunte si escludono.
- In testa alla pagina Produzioni, a tutta larghezza, c'è il lavoro più
  recente fra produzioni e collaborazioni.
- Se manca il **video**, la pagina del corto dice "Streaming in arrivo"
  (non durante la pausa della Cortoteca, dal 17 novembre 2026),
  a meno che l'opera sia segnata **Solo la scheda** (il socio ha autorizzato
  la sola scheda, o la redazione ha deciso così): allora la pagina mostra la
  scheda e basta.
- Il **colore della pagina** del corto si sceglie nel modulo dell'opera; se
  manca, è quello del titolo grafico o il lilla.
- Il **titolo grafico** (PNG o carattere tipografico) si carica nel modulo
  dell'opera e compare in Cortoteca, nella pagina del corto e in Produzioni.
- Per togliere qualcosa dal sito senza perderlo, togli la spunta
  *Pubblicata* invece di eliminarlo.

### Pagine dei singoli eventi

Un evento diventa cliccabile, nella pagina Eventi e nella home, quando ha
una **pagina dedicata**: il campo *Pagina dedicata* del modulo contiene il
nome del file, per esempio `short-talks-1.html` (solo un file del sito: la
pagina Eventi lo apre al suo interno).

Le pagine degli eventi sono file HTML nella radice, tutte sullo stesso modello
(per una nuova si parte da una esistente): lo stile è in
`assets/css/pages/evento.css`, dove stanno anche il colore di ogni evento
(classe `evento--<pagina>` sul `<body>`) e il suo logo (classe
`marchio--<pagina>`, PNG senza fondo in `assets/img/eventi/loghi/<pagina>.png`,
lo stesso che compare nella scheda di Eventi). Le foto stanno in
`assets/img/eventi/<codice>/`. Una pagina nuova va online con una pull
request, come il resto del sito; il campo *Pagina dedicata* si compila solo
dopo, altrimenti la scheda porta a una pagina che non c'è ancora.

### Il modulo di Contatti

`contatti.html` usa Netlify Forms: tre moduli, uno per destinatario
(`contatti` → ciao@, `contatti-eventi` → eventi@, `contatti-produzione` →
produzione@cdlaps.com). Il motivo scelto decide il modulo e l'oggetto della
mail (`contatti.js`). Le notifiche email, una per modulo, stanno nel pannello
di Netlify, *Forms → Form notifications*; dopo l'invio la pagina mostra la
conferma (`contatti.html#grazie`). In locale il modulo non invia nulla.

### Chi può modificare

Gli account si creano dalla dashboard di Supabase: *Authentication* → *Users*
→ *Add user* → *Create new user*, con *Auto Confirm User* attivo. Un account
da solo non basta: va anche aggiunto ai redattori, dal *Table Editor*, schema
`privato`, tabella `redattori` (serve l'id dell'utente, che si copia dalla
lista degli utenti). Le regole del database lasciano scrivere solo chi è in
quella tabella, e solo con il codice dell'app di autenticazione: il redattore
nuovo lo attiva al primo accesso, e chi cambia o perde il telefono va
sbloccato da Supabase (*Authentication* → utente → fattori). Un redattore non
può usare il collegamento dei soci: se vuole proporre corti come socio, usa
un altro indirizzo nel libro soci.

### Copie di riserva

Se Supabase non risponde (per esempio perché il progetto gratuito è stato
messo in pausa dopo una settimana senza attività), il sito ripiega su
`data/opere.json` e `data/eventi.json` e sulle immagini in `assets/img/`.

Le copie non si aggiornano da sole: sono ferme al 12 novembre 2026. Per
rinfrescarle si scaricano le righe pubblicate dalla Data API con la stessa
richiesta del sito (colonne e chiave pubblica di `dati.js`), e si copiano in
`assets/img/` le immagini nuove con lo stesso nome che hanno nel bucket. Con
Node, dalla cartella del progetto:

```bash
node -e "
const fs = require('fs');
eval(fs.readFileSync('assets/js/dati.js', 'utf8').replace(/^const /gm, 'var '));
const h = { headers: { apikey: SUPABASE_CHIAVE } };
fetch(SUPABASE_URL + '/rest/v1/opere?' + QUERY_OPERE, h).then((r) => r.json())
  .then((d) => fs.writeFileSync('data/opere.json', JSON.stringify(d, null, 2) + '\n'));
fetch(SUPABASE_URL + '/rest/v1/eventi?select=' + COLONNE_EVENTI + '&pubblicato=eq.true&order=data_inizio.desc', h)
  .then((r) => r.json()).then((d) => fs.writeFileSync('data/eventi.json', JSON.stringify(d, null, 2) + '\n'));
"
```

Anche se la copia contenesse opere non pubblicate, il sito le scarta.

---

## Pubblicazione

Il sito è ospitato su Netlify e si aggiorna da solo: ogni commit sul ramo
`main` fa partire una nuova pubblicazione in un paio di minuti.

**Attenzione a chi firma il commit.** Con il piano Netlify attuale e il
repository privato, Netlify costruisce solo i commit il cui autore è membro
del team Netlify, cioè l'account GitHub `cdl-aps`. Gli altri vengono
rifiutati ("Build blocked: Unrecognized Git contributor"), e da quel momento
anche *Trigger deploy* fallisce, perché ricostruisce lo stesso commit.

Il modo di lavorare quindi è:

1. Le modifiche si fanno su un ramo dedicato, da qualsiasi account, e si apre
   una pull request verso `main`.
2. La pull request si unisce **da GitHub, con l'account `cdl-aps`**,
   scegliendo *Create a merge commit*: il commit di unione è a nome
   dell'associazione e la pubblicazione parte. Approvarla da un altro account
   non basta, conta chi clicca *Merge*.

Le anteprime delle pull request (deploy preview) falliscono per lo stesso
motivo quando i commit del ramo sono di un account personale: è normale, non
indica un errore nel codice. Per vedere le modifiche prima di pubblicarle si
usa il server locale.

Netlify guarda l'autore dell'**ultimo commit di `main`**: se è un account
personale, per esempio dopo un push diretto, resta tutto bloccato, compreso
un deploy caricato a mano dal connettore o dalla CLI di Netlify. Per
sbloccare basta unire con `cdl-aps` una pull request qualsiasi: il commit di
unione pubblica `main` così com'è, compresi i commit precedenti.

**Redesign (novembre 2026)**: le cose da fare prima di unire il branch
`redesign` e subito dopo il deploy (una migrazione da applicare, la prova
dei moduli di Contatti, i controlli sugli header…) sono in cima a `CLAUDE.md`,
come lista da spuntare.

`netlify.toml` contiene i redirect dai vecchi indirizzi: **non vanno rimossi**,
servono a non rompere i link già condivisi su Instagram e nelle chat.

---

## Nota su Tailwind

Solo la cornice narrativa carica ancora Tailwind e le icone Lucide da CDN,
cioè da un server esterno, con un `<script>` nell'`<head>`: il suo script
costruisce i blocchi con classi Tailwind. Due conseguenze da tenere a mente:
quella pagina non funziona offline, e Tailwind in versione CDN è più lento di
una versione compilata. Tutte le altre pagine usano solo i fogli in
`assets/css/` e icone SVG scritte nell'HTML.
