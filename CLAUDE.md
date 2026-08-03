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
  Non ci sono moduli ES né bundler: le funzioni sono globali.
- **Immagini**: sempre sotto `assets/img/<categoria>/`, mai nella radice.
  Nomi in minuscolo con trattini.
- **Lingua**: interfaccia, commenti e nomi di file in italiano.

## Punti da conoscere

- `data/film.json` è l'unica fonte dei cortometraggi. `cortoteca.html` ne
  costruisce la griglia e `opera.html` la scheda di dettaglio; entrambe le
  pagine sono gusci vuoti riempiti a runtime. Una modifica al JSON si riflette
  su entrambe.
- `opera.html` legge il codice dell'opera dalla query string (`?film=codice`).
  Senza parametro mostra "Opera non trovata".
- Lo sfondo scuro usa un filtro SVG (`#burnt-bw-filter`) definito inline in
  ciascuna pagina che lo utilizza: il filtro deve stare nello stesso documento
  dell'elemento a cui si applica, non può essere spostato in un file esterno.
- `netlify.toml` mantiene in vita gli indirizzi precedenti alla
  riorganizzazione (in particolare `/cortoteca/info_film2?film=...`, oggi
  `/opera.html?film=...`). Vanno conservati.
- `assets/js/cornice.js` è il generatore interattivo di Long Story Short 2026:
  autonomo, con i propri dati incorporati, e alcune funzioni sono richiamate da
  attributi `onclick` nell'HTML — vanno mantenute globali.

## Verifica prima di pubblicare

```bash
python3 -m json.tool data/film.json > /dev/null   # il JSON è valido
python3 -m http.server 5500                        # poi controlla le pagine
```

Aprire almeno home, cortoteca e una scheda opera: sono le pagine che dipendono
da percorsi e dati esterni, e quindi le prime a rompersi.
