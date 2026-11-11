# Specifiche di design — il nuovo sito CDL APS

*11 novembre 2026. Descrive le anteprime in `anteprime/` (generate da
`genera.py`, stili in `comune.css` + `g.css`, comportamenti in `comune.js` +
`g.js`). Serve a chi dovrà portare il redesign nel sito pubblicato. Lo stato
del lavoro è in [`2026-11-11-handoff.md`](2026-11-11-handoff.md).*

## Panoramica

Un sito editoriale per un'associazione di cinema: poche parole, scritte
enormi, fotografie a spigolo vivo. Ogni sezione ha un fondo pieno suo
(Eventi blu, Produzioni lilla, Cortoteca nera, Contatti arancio) e chi
naviga ci *entra*: il colore si allarga dalla home, la still diventa lo
schermo del corto, la grafica dell'evento diventa la sua testata. Il
contenuto si apre spesso sopra la pagina di partenza (sale), con un indirizzo
proprio, così non si perde il posto.

Regole che valgono ovunque:
- **Mai eyebrow**: nessuna etichetta piccola maiuscola sopra un titolo. Un
  titoletto di sezione ("Galleria", "Vincitori") è un titolo, non un'etichetta.
- Etichette mai sotto gli 11 px, aree toccabili di almeno 44 px.
- Frecce: ↗ apre un contenuto, → porta a un elenco o a un'altra pagina,
  l'icona del link esterno solo per ciò che esce dal sito.
- Foto a spigolo vivo (raggio 0), spesso chiuse da un filo nero di 2 px.

## Layout

| Elemento | Regola |
|---|---|
| Contenitore | `.wrap`: `min(100% − 2 × --gut, 1280px)`, centrato |
| Griglia | `.grid`: 12 colonne, `--gap`; classi `span-N` / `start-N` |
| Barra | fissa, alta `--nav`; il contenuto parte da `--nav + 40px` (24 px sotto 640) |
| Testata di pagina | nome a tutta larghezza (`.fit`, si adatta alla riga) → presentazione a tutta larghezza (`.presentazione`, filo sotto) → blocchi |
| Blocco | `.blocco-pagina`; `--diviso` aggiunge filo e respiro sopra |
| Ritmo verticale (1440) | fine blocco → filo 86 px; filo → titoletto 64 px; titoletto → contenuto 28 px; ultimo blocco → piede 158 px |
| Ritmo verticale (375) | 48 / 37 / 28 / 96 px |

## Token

| Token | Valore | Uso |
|---|---|---|
| `--nero` | #1d1d1b | testo, fili forti, fondo della Cortoteca (`--nero-sala` #000) |
| `--chiaro` | #f7f7f7 | carta: fondo delle pagine di contenuto |
| `--lilla` | #b9bbf8 | marchio; Produzioni (fondo), Cortoteca (scritte) |
| `--blu` / `--azzurro` | #004aad / #84f1f7 | Eventi: fondo / scritte |
| `--arancio` | #ff751f | Sostieni e Contatti; dettagli del modulo |
| `--rosso` | #ff0000 | hover dei pulsanti pieni dove non c'è un accento di sezione |
| `--tenue` | inchiostro al 74% | testi secondari, dati |
| `--filo` | inchiostro al 20% | fili sottili fra blocchi e righe |
| `--evento` | colore della grafica dell'evento (LSS: nero) | intestazioni, fili e numeri delle pagine evento |
| `--titolo` | colore del titolo graficato del corto | intestazioni e fili della pagina del corto |
| `--nav` | 72 px (56 sotto 640) | altezza barra |
| `--gut` | 80 / 48 / 20 px | margine laterale (desktop / sotto 1024 / sotto 640) |
| `--gap` | 24 / 12 px | spazio fra colonne |
| `--ease` | cubic-bezier(0.22, 1, 0.36, 1) | hover e piccoli movimenti |
| `--f-titoli` | Montserrat 900, maiuscolo, spaziatura −0,04 em, interlinea 0,94 | tutti i titoli |
| testo | Montserrat 500–600, 16–19 px, interlinea 1,5–1,6 | corpo |
| presentazione | 21–31 px (`clamp`), 600, interlinea 1,3 | frase sotto i nomi di pagina |

## Componenti

| Componente | Dove | Note |
|---|---|---|
| Barra (`.nav`) | tutte | marchio, Eventi · Produzioni · Contatti a sinistra (pallino del colore di sezione), Cortoteca e Diventa socio a destra, alti uguali (44 px), socio col bordo nero. Sotto 520 px Contatti sparisce; sotto 760 Diventa socio. La Cortoteca mostra solo Diventa socio |
| Nome di pagina (`.parola` + `.fit`) | Eventi, Produzioni, Cortoteca, Vantaggi, 404 | la scritta riempie la riga; `adatta()` ricalcola il corpo |
| Indice della home (`.sezione`) | home | tre righe giganti; al passaggio la sezione si colora col suo fondo e mostra un breve elenco (ultimi eventi/produzioni); nella Cortoteca gli occhi si aprono nelle O |
| Rullino (`.scorre`) | home, Eventi, eventi | fotografie che scorrono; si fermano al passaggio o col fuoco |
| Scheda (`.scheda-g`) | Eventi, Produzioni | cornice 16:10, filo, titolo 900, dati in `--tenue`; le altre schede arretrano (35%) al passaggio |
| Still della Cortoteca (`.still`) | Cortoteca | titolo (graficato se c'è) sovrapposto; al passaggio il titolo sparisce, le altre still si oscurano, il puntatore si nasconde |
| Schermo (`.schermo`) | corto | still 16:9 con titolo; se c'è lo streaming diventa il lettore (disco "Guarda" al posto del puntatore) |
| Testata evento (`.locandina-g`) | eventi | grafica vettoriale 16:10 a tutta larghezza, filo nero; per LSS il lettering (`.marchio-serie--lss`, max 720 px) |
| Programma | eventi | gruppi in 1–2 colonne; righe numerate 01, 02… col colore dell'evento; i corti in Cortoteca hanno ↗ |
| Vincitori (`.vincitori`) | LSS | tre per riga; il Miglior film su tutta la riga (still 8/12, testo 4/12, premio in maiuscolo grande) |
| Partner (`.partner`) | LSS | loghi tutti neri, larghezza calcolata per pesare uguale (`--w`), al centro di caselle a fili, 3 per riga (2 sul telefono) |
| Righe (`.riga-g`) | LSS, materiali | titolo 900 grande e freccia in un cerchio da 48 px |
| Sostieni (`.closing.fondo-arancio`) | home, Vantaggi, testata di Contatti | "SOSTIENI" + logo a tutta larghezza, frase, stato della quota, Diventa socio e Scrivici (portano al modulo) |
| Modulo Contatti (`.modulo`) | Contatti | motivo a pillole (scelta: arancio con bordo nero), nome ed email affiancati, messaggio, consenso + Invia |

## Stati e interazioni

| Elemento | Stato | Comportamento |
|---|---|---|
| Pulsante pieno | hover | sale di 1 px, fondo nel colore d'accento della sezione (rosso di riserva) |
| Pulsante | premuto | scende di 1 px e si stringe al 98,5% (90 ms) |
| Link con freccia | hover | la freccia si sposta di 3–4 px nella sua direzione |
| Foto in cornice | hover | ingrandimento 1,025 dentro la cornice (0,6 s) |
| Scheda | hover | le altre schede al 35% |
| Still Cortoteca | hover / fuoco | titolo a 0, altre still oscurate, puntatore nascosto (solo puntatore fine) |
| Pillola del modulo | scelta | fondo arancio, bordo nero 2 px |
| Invia | premuto / invio | fondo arancio; testo "Invio in corso…" |
| Sala (corto o evento) | aperta | pagina sopra la pagina, indirizzo cambiato; crocetta tonda (44 px) nel margine destro, nel colore del corto o dell'evento; Esc, indietro e crocetta chiudono |

## Comportamento responsive

| Larghezza | Cambia |
|---|---|
| > 1024 | griglie a 3 colonne, testi a fianco delle immagini |
| ≤ 1023 | `--gut` 48; schede, vincitori e vantaggi a 2 colonne; testo sotto l'immagine (primo piano, Path) |
| ≤ 767 | programma a una colonna |
| ≤ 759 | sparisce Diventa socio dalla barra; piede a una colonna |
| ≤ 639 | `--nav` 56, `--gut` 20, `--gap` 12; tutto a una colonna; partner a 2 |
| ≤ 519 | sparisce Contatti dalla barra |

## Movimento

| Elemento | Quando | Animazione | Durata | Curva |
|---|---|---|---|---|
| Home → Eventi/Produzioni | clic sul nome | il colore copre lo schermo, il nome sale dove la pagina d'arrivo ha il titolo (corpo passato con `sessionStorage`) | 820 ms | cubic-bezier(0.65, 0, 0.25, 1) |
| Still → corto | clic sulla still | velo nero; la still cresce fino allo schermo (`--nav + 40`, larga quanto il contenuto); si apre la sala e parte il video | 820 ms | idem |
| Scheda/LSS → evento | clic | velo carta; la grafica (o il lettering, che passa dall'azzurro al nero) sale al suo posto nella pagina dell'evento | 820 ms | idem |
| Chiusura sala | indietro / Esc / crocetta | dissolvenza | 320 ms (riserva 450) | ease-out |
| Blocchi | caricamento | `.entra`: salgono appena e compaiono | 0,8 s, ritardo 0,12 s | `--ease` |
| Occhi | puntatore | le pupille seguono il puntatore, ogni tanto sbattono le palpebre | continuo | — |
| Rullini | sempre | scorrimento orizzontale continuo | 48–70 s per giro | lineare |

Con `prefers-reduced-motion` i passaggi diventano cambi di pagina diretti, le
sale si aprono senza animazione e i rullini si fermano.

## Casi limite

- **Dati che non arrivano**: `dati.js` ripiega su `data/*.json`; le immagini
  mancanti nel bucket ripiegano su `assets/img/`. I blocchi senza schede
  restano nascosti (`hidden`).
- **Evento senza grafica**: la scheda mostra la fotografia del database.
- **Corto senza titolo graficato**: titolo in Montserrat 900; colore della
  pagina lilla di riserva. Senza streaming lo schermo resta un'immagine.
- **Corto non trovato**: `opera.html` senza parametro mostra "Opera non
  trovata".
- **Sala che non si carica** (evento): si cambia pagina normalmente.
- **Titoli lunghi**: i nomi `.fit` si rimpiccioliscono per stare su una riga;
  i titoli delle schede vanno a capo (`text-wrap: balance`).
- **Rete lenta**: la pagina dell'evento si comincia a leggere al passaggio
  del puntatore; la copia ingrandita resta sopra finché l'immagine d'arrivo
  non è decodificata (massimo 400 ms).

## Accessibilità

- Link "Vai al contenuto" come primo elemento della barra; `aria-current`
  sulla voce della sezione corrente.
- I nomi `.fit` sono `aria-hidden` con il testo vero in `.sr-only`; il
  lettering LSS è un `h1` con testo nascosto.
- Le sale sono `role="dialog"` con `aria-modal` e `aria-labelledby`; il fuoco
  va sulla crocetta all'apertura e torna all'elemento cliccato alla chiusura.
- Le copie dei rullini sono `aria-hidden` e fuori dal Tab.
- Le pillole del modulo sono radio veri (`fieldset` + `legend`), con anello di
  fuoco nero; i campi hanno etichette visibili.
- Loghi dei partner con `alt` col nome; still dei vincitori con `alt`
  descrittivo.
- Da verificare: contrasto delle scritte azzurre sul blu e delle intestazioni
  colorate degli eventi più chiari (arancio di Short Talks al Nòt 2025);
  ordine di lettura con screen reader nelle sale.
