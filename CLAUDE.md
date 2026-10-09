# Note per chi lavora su questo progetto

Sito statico di CDL APS. Nessun build step, nessuna dipendenza npm: i file
sorgente sono quelli pubblicati. Netlify serve la radice del repository così
com'è.

## Convenzioni

- **CSS**: `base.css` (variabili di brand e fondamenta) → `components.css`
  (elementi su più pagine) → `pages/<pagina>.css` (specifico). I tre fogli si
  caricano sempre in quest'ordine. Non reintrodurre blocchi `<style>` inline
  nelle pagine: erano la causa principale della duplicazione precedente.
- **JS**: un file per pagina in `assets/js/`, caricato in fondo al `<body>`.
  Fanno eccezione due file comuni: `barra.js` (indicatore della barra, su
  tutte le pagine) e `opere.js` (lettura di `data/film.json`, da caricare
  prima dello script della pagina). Non ci sono moduli ES né bundler: le
  funzioni sono globali.
- **Identità visiva**: fondo chiaro, Montserrat 900 per i titoli, angoli
  squircle (vedi `components.css`). Tailwind e Lucide restano solo su
  `cornicenarrativa.html`, perché `cornice.js` costruisce i blocchi con
  quelle classi; altrove le icone sono SVG scritte nell'HTML.
- **Immagini**: sempre sotto `assets/img/<categoria>/`, mai nella radice.
  Nomi in minuscolo con trattini.
- **Lingua**: interfaccia, commenti e nomi di file in italiano.

## Punti da conoscere

- `data/film.json` è l'unica fonte dei cortometraggi. Lo leggono
  `cortoteca.html` (griglia), `opera.html` (scheda), `produzioni.html` (opere
  con `"cdl": true`) e la home (casella "L'ultima produzione CDL"): sono gusci
  riempiti a runtime, una modifica al JSON si riflette su tutte. `cdl` è un
  booleano; fra due produzioni dello stesso anno conta come più recente quella
  più in alto nel file.
- In home l'ultimo evento e la terza notizia sono ancora scritti a mano in
  `index.html`, così come la pagina `eventi.html`.
- `opera.html` legge il codice dell'opera dalla query string (`?film=codice`).
  Senza parametro mostra "Opera non trovata".
- `netlify.toml` mantiene in vita gli indirizzi precedenti alla
  riorganizzazione (in particolare `/cortoteca/info_film2?film=...`, oggi
  `/opera.html?film=...`). Vanno conservati, e con loro i file a cui puntano
  (per esempio le nuvolette in `assets/img/nuvole/`, non più usate dalle
  pagine).
- CSS e JS sono richiamati con una versione nell'indirizzo
  (`base.css?v=2026-10-09`), perché Netlify li fa tenere in cache una
  settimana: quando li modifichi aggiorna la data in tutte le pagine
  (`sed -i '' 's/v=VECCHIA/v=NUOVA/g' *.html`).
- `assets/js/cornice.js` è il generatore interattivo di Long Story Short 2026:
  autonomo, con i propri dati incorporati, e alcune funzioni sono richiamate da
  attributi `onclick` nell'HTML — vanno mantenute globali.

## Verifica prima di pubblicare

```bash
python3 -m json.tool data/film.json > /dev/null   # il JSON è valido
python3 -m http.server 5500                        # poi controlla le pagine
```

Aprire almeno home, cortoteca, produzioni e una scheda opera: sono le pagine
che dipendono da `data/film.json`, e quindi le prime a rompersi.
