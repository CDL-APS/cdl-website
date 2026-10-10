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
  tutte le pagine) e `dati.js` (lettura di opere ed eventi, da caricare prima
  dello script della pagina). Non ci sono moduli ES né bundler: le
  funzioni sono globali.
- **Identità visiva**: fondo chiaro, Montserrat 900 per i titoli, angoli
  squircle (vedi `components.css`). Tailwind e Lucide restano solo su
  `cornicenarrativa.html`, perché `cornice.js` costruisce i blocchi con
  quelle classi; altrove le icone sono SVG scritte nell'HTML.
- **Immagini**: sempre sotto `assets/img/<categoria>/`, mai nella radice.
  Nomi in minuscolo con trattini.
- **Lingua**: interfaccia, commenti e nomi di file in italiano.

## Punti da conoscere

- **Opere ed eventi stanno su Supabase** (progetto dell'organizzazione CDL
  APS). Schema e dati iniziali sono in `supabase/migrations/`: ogni modifica
  allo schema va aggiunta lì come nuovo file, oltre che applicata. Le regole
  di accesso (RLS) danno a chiunque la sola lettura di ciò che è pubblicato;
  scrive solo chi è in `privato.redattori`.
- `dati.js` legge dalla Data API con la chiave pubblica (sta nel sito
  apposta). Se Supabase non risponde, ripiega su `data/opere.json` e
  `data/eventi.json`, copie di riserva con la stessa forma delle tabelle; le
  immagini, se mancano nel bucket `immagini`, ripiegano su `assets/img/`.
  La chiave segreta (*secret* / *service_role*) non va mai nel repository.
- Le pagine che leggono i dati (home, cortoteca, produzioni, eventi, opera)
  sono gusci riempiti a runtime. I testi arrivano da un modulo: nei modelli
  HTML vanno sempre passati da `esc()`, e i collegamenti da
  `indirizzoSicuro()`.
- Fra due produzioni CDL dello stesso anno conta come più recente quella
  inserita per ultima (id più alto).
- `gestione.html` è la pagina dei redattori: accesso con email e password
  via Supabase Auth, client `supabase-js` da CDN (versione fissata). Le
  scritture sono protette dalla RLS, non dalla pagina. Le immagini caricate
  vengono ridimensionate a 2000 px e salvate come
  `<cartella>/<codice>-<campo>-<orario>.jpg` nel bucket `immagini`.
- `opera.html` legge il codice dell'opera dalla query string (`?film=codice`).
  Senza parametro mostra "Opera non trovata".
- **Pubblicazione**: Netlify costruisce solo i commit il cui autore è membro
  del team (l'account GitHub `cdl-aps`). Le pull request vanno unite da
  GitHub con quell'account, con un merge commit; un'unione fatta da un
  account personale blocca la pubblicazione di `main`. Le deploy preview
  falliscono per lo stesso motivo: non è un errore del codice.
- Netlify pubblica tutta la radice: `netlify.toml` risponde 404 a
  `README.md`, `CLAUDE.md` e `supabase/`. Nuovi file interni vanno aggiunti
  lì.
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
python3 -m json.tool data/opere.json > /dev/null  # la copia di riserva è valida
python3 -m http.server 5500                        # poi controlla le pagine
```

Aprire almeno home, cortoteca, produzioni, eventi e una scheda opera: sono le
pagine che dipendono dal database, e quindi le prime a rompersi.
