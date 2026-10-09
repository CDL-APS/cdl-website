# Sito CDL APS

Sito dell'associazione CDL APS (Rimini). È un sito **statico**: solo HTML, CSS
e JavaScript, senza server né database. Non c'è niente da installare né da
compilare — i file che vedi sono esattamente quelli che finiscono online.

---

## Come vederlo in locale

Apri la cartella in VS Code, poi clic destro su `index.html` → **Open with Live
Server**. Il sito si apre su `http://localhost:5500` e si ricarica da solo a
ogni salvataggio.

> **Serve un server, non basta il doppio clic sul file.** Home, Cortoteca, Produzioni e schede
> opera leggono `data/film.json` con una richiesta di rete, che i browser
> bloccano quando la pagina è aperta come `file://`. Con Live Server funziona
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
├── produzioni.html            Le produzioni CDL (testo da scrivere)
├── eventi.html                Gli eventi CDL (da sviluppare)
├── longstoryshort.html        Pagina dell'evento Long Story Short
├── cornicenarrativa.html      Generatore del "biglietto" di LSS 2026
├── cortoteca.html             Archivio dei cortometraggi
├── opera.html                 Scheda di un singolo corto (opera.html?film=codice)
├── vantaggi-tesseramento.html Vantaggi per i soci
│
├── data/
│   └── film.json              Il database dei cortometraggi
│
├── assets/
│   ├── css/
│   │   ├── base.css           Colori, misure e tipografia del brand
│   │   ├── components.css     Pezzi ricorrenti: barra, riquadri, schede, piede
│   │   └── pages/             Uno per pagina, solo ciò che è specifico
│   ├── js/
│   │   ├── barra.js           Indicatore della barra, su tutte le pagine
│   │   ├── opere.js           Lettura di data/film.json, comune a più pagine
│   │   ├── home.js            Casella "L'ultima produzione CDL"
│   │   ├── produzioni.js      Elenco delle produzioni CDL
│   │   ├── cortoteca.js       Griglia, ricerca e ordinamento delle opere
│   │   ├── opera.js           Riempimento della scheda opera
│   │   └── cornice.js         Generatore del biglietto LSS
│   └── img/
│       ├── brand/             Logo, icona, favicon
│       ├── partner/           Loghi dei partner, tessera
│       ├── nuvole/            Nuvolette della vecchia home (servono ai redirect)
│       ├── sfondi/            Wallpaper della home
│       ├── eventi/            Copertina e miniatura di LSS 2026, alleggerite
│       └── film/              Fotogrammi dei corti
│
├── netlify.toml               Redirect dai vecchi indirizzi e cache
└── robots.txt
```

**Regola pratica per il CSS**: se una regola serve a una sola pagina va in
`assets/css/pages/`; se ricorre su due o più pagine va in `components.css`.
`base.css` contiene solo i colori del brand e le fondamenta, e cambia di rado.

---

## Aggiungere un cortometraggio alla Cortoteca

Non serve toccare l'HTML. Due passaggi:

1. Metti il fotogramma in `assets/img/film/` (formato `.jpg`, quadrato o 16:9,
   possibilmente sotto 1 MB).
2. Aggiungi una voce in `data/film.json` copiando una di quelle esistenti.

Campi importanti:

| Campo | A cosa serve |
|---|---|
| `codice` | Identificativo nell'indirizzo: `opera.html?film=quartolivello`. Minuscolo, senza spazi né accenti |
| `titolo`, `anno`, `regista`, `produzione` | Compaiono nella griglia e sono usati dalla ricerca |
| `still` | Percorso del fotogramma, es. `assets/img/film/miofilm.jpg` |
| `video_url` | Link YouTube o Vimeo. **Se lo lasci vuoto** la scheda mostra "streaming in arrivo" invece del player |
| `cdl` | `true` se è una produzione CDL, altrimenti `false` (senza virgolette). Le produzioni CDL hanno il logo sulla card, compaiono in Produzioni e la più recente va in home |
| `cast1`…`cast10` e `ruolo_cast1`…`ruolo_cast10` | Cast; le posizioni vuote vengono saltate |
| `sinossi`, `note_regia`, `tagline`, `letterboxd` | Facoltativi: se vuoti, la sezione non appare |

Salva, ricarica la pagina, e il corto è nell'archivio. Se è una produzione CDL
compare anche in Produzioni e, se è la più recente, nella casella "L'ultima
produzione CDL" della home: non c'è altro da aggiornare. Fra due produzioni
dello stesso anno conta come più recente quella più in alto nel file.

**Attenzione al JSON**: virgole e virgolette devono essere esatte, un errore
di battitura fa sparire l'intera Cortoteca. Prima di pubblicare, apri la
Cortoteca in locale e controlla che il corto compaia. Se vuoi una verifica
rapida del formato:

```bash
python3 -m json.tool data/film.json > /dev/null && echo "JSON valido"
```

---

## Pubblicazione

Il sito è ospitato su Netlify e si aggiorna da solo: ogni push sul ramo `main`
fa partire una nuova pubblicazione in un paio di minuti.

Per una modifica, meglio lavorare su un ramo dedicato e non direttamente su
`main` — Netlify genera un'anteprima con un indirizzo suo, così puoi vedere il
risultato prima che finisca sul sito pubblico.

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
