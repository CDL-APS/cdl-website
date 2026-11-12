# Sito CDL APS

Sito dell'associazione CDL APS (Rimini). È un sito **statico**: solo HTML, CSS
e JavaScript, senza server né database. Non c'è niente da installare né da
compilare — i file che vedi sono esattamente quelli che finiscono online.

---

## Come vederlo in locale

Apri la cartella in VS Code, poi clic destro su `index.html` → **Open with Live
Server**. Il sito si apre su `http://localhost:5500` e si ricarica da solo a
ogni salvataggio.

> **Serve un server, non basta il doppio clic sul file.** Le pagine leggono
> opere ed eventi dal database con richieste di rete, e la copia di riserva
> in `data/` con altre richieste che i browser bloccano quando la pagina è
> aperta come `file://`. Con Live Server funziona
> tutto. L'estensione è già fra quelle consigliate in `.vscode/extensions.json`:
> VS Code te la propone da solo la prima volta che apri il progetto.

In alternativa, da terminale nella cartella del progetto:

```bash
python3 -m http.server 5500
```

---

## Com'è organizzato

```
.
├── index.html                 Home
├── produzioni.html            Le produzioni CDL
├── eventi.html                Gli eventi CDL, divisi in blocchi per serie
├── longstoryshort.html        Pagina dell'evento Long Story Short
├── short-talks-1.html, …      Pagine degli altri eventi, una per evento (vedi sotto)
├── cornicenarrativa.html      Generatore del "biglietto" di LSS 2026
├── cortoteca.html             Archivio dei cortometraggi
├── opera.html                 Scheda di un singolo corto (opera.html?film=codice)
├── vantaggi-tesseramento.html Vantaggi per i soci
├── gestione.html              Pagina riservata ai redattori (non indicizzata)
├── proponi.html               Pagina dei soci per proporre un corto (non indicizzata)
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
├── assets/
│   ├── css/
│   │   ├── base.css           Colori, misure e tipografia del brand
│   │   ├── components.css     Pezzi ricorrenti: barra, riquadri, schede, piede
│   │   └── pages/             Uno per pagina, solo ciò che è specifico
│   ├── js/
│   │   ├── barra.js           Indicatore della barra, su tutte le pagine
│   │   ├── dati.js            Lettura di opere ed eventi, comune a più pagine
│   │   ├── home.js            Caselle "ultimo evento" e "ultima produzione"
│   │   ├── produzioni.js      Produzioni e collaborazioni CDL
│   │   ├── eventi.js          Blocchi della pagina Eventi
│   │   ├── riservato.js       Parti comuni a gestione e proponi
│   │   ├── gestione.js        Pagina dei redattori
│   │   ├── proponi.js         Pagina dei soci
│   │   ├── vendor/            Librerie di terzi copiate nel sito (supabase-js)
│   │   ├── cortoteca.js       Griglia, ricerca e ordinamento delle opere
│   │   ├── opera.js           Riempimento della scheda opera
│   │   └── cornice.js         Generatore del biglietto LSS
│   └── img/
│       ├── brand/             Logo, icona, favicon, marchi di LSS e Short Talks
│       ├── partner/           Loghi dei partner, tessera
│       ├── nuvole/            Nuvolette della vecchia home (servono ai redirect)
│       ├── sfondi/            Wallpaper della home
│       ├── eventi/            Copertine e miniature (copie locali); foto e
│       │                      locandine delle pagine evento, una cartella per evento
│       └── film/              Fotogrammi dei primi corti (copie locali)
│
├── netlify.toml               Redirect dai vecchi indirizzi e cache
└── robots.txt
```

**Regola pratica per il CSS**: se una regola serve a una sola pagina va in
`assets/css/pages/`; se ricorre su due o più pagine va in `components.css`.
`base.css` contiene solo i colori del brand e le fondamenta, e cambia di rado.

---

## Aggiungere o modificare opere ed eventi

Opere ed eventi stanno in un database **Supabase**, nell'organizzazione *CDL
APS* (account `ciao@cdlaps.com`). Non si modificano più file né si fa un push:

1. Vai su `cdlaps.com/gestione.html` e accedi con email e password.
2. Scegli *Opere* o *Eventi*, poi *Nuova opera* / *Nuovo evento*, oppure
   clicca su una voce esistente per modificarla.
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
- Un'opera con **Prodotta da CDL** ha il logo sulla card, compare fra le
  produzioni originali della pagina Produzioni e, se è la più recente, nella
  home. Fra due produzioni dello stesso anno conta come più recente l'ultima
  inserita.
- Un'opera con **Collaborazione CDL** (non prodotta da CDL, ma con il suo
  contributo) va nel blocco Collaborazioni della pagina Produzioni, che
  compare solo quando ce n'è almeno una. Le due spunte si escludono.
- In testa alla pagina Produzioni, a tutta larghezza, c'è il lavoro più
  recente fra produzioni e collaborazioni.
- Se manca il **video**, la scheda mostra "streaming in arrivo".
- Per togliere qualcosa dal sito senza perderlo, togli la spunta
  *Pubblicata* invece di eliminarlo.

### Pagine dei singoli eventi

Un evento diventa cliccabile, nella pagina Eventi e nella casella della home,
quando ha una **pagina dedicata**: il campo *Pagina dedicata* del modulo
contiene il nome del file, per esempio `short-talks-1.html`.

Le pagine degli eventi sono file HTML nella radice, tutte sullo stesso modello
(per una nuova si parte da una esistente): lo stile è in
`assets/css/pages/evento.css`, dove sta anche il colore d'accento di ogni
evento, mentre foto e locandina stanno in `assets/img/eventi/<codice>/`. Una
pagina nuova va online con una pull request, come il resto del sito; il campo
*Pagina dedicata* si compila solo dopo, altrimenti il riquadro porta a una
pagina che non c'è ancora.

### Chi può modificare

Gli account si creano dalla dashboard di Supabase: *Authentication* → *Users*
→ *Add user* → *Create new user*, con *Auto Confirm User* attivo. Un account
da solo non basta: va anche aggiunto ai redattori, dal *Table Editor*, schema
`privato`, tabella `redattori` (serve l'id dell'utente, che si copia dalla
lista degli utenti). Le regole del database lasciano scrivere solo chi è in
quella tabella.

### Copie di riserva

Se Supabase non risponde (per esempio perché il progetto gratuito è stato
messo in pausa dopo una settimana senza attività), il sito ripiega su
`data/opere.json` e `data/eventi.json` e sulle immagini in `assets/img/`.

Le copie non si aggiornano da sole: `data/opere.json` è ferma al giorno della
migrazione, `data/eventi.json` al 10 ottobre 2026. Per rinfrescare gli eventi
si scaricano le righe pubblicate dalla Data API, con la chiave pubblica di
`dati.js`, e si copiano in `assets/img/eventi/` le immagini nuove con lo
stesso nome che hanno nel bucket:

```bash
curl -s "https://rsspmqhhrykbmrkmwqcg.supabase.co/rest/v1/eventi?select=id,codice,titolo,data_inizio,data_fine,luogo,riassunto,descrizione,copertina,miniatura,pagina,serie&pubblicato=eq.true&order=id" -H "apikey: $(grep -o 'sb_publishable_[A-Za-z0-9_]*' assets/js/dati.js)" | python3 -m json.tool --indent 2 --no-ensure-ascii > data/eventi.json
```

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
