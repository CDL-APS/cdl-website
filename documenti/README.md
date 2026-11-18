# Documenti in PDF del sito (sorgenti)

I PDF in `assets/doc/` nascono da questi file HTML (stile comune in
`documento.css`). Cartella interna: `netlify.toml` risponde 404.

| Sorgente | PDF | Dove si usa |
|---|---|---|
| `informativa-contatti-v1.html` | `assets/doc/informativa-contatti-v1.pdf` | modulo di Contatti |
| `informativa-soci-v1.html` | `assets/doc/informativa-soci-v1.pdf` | domanda di ammissione (e copiata nel modulo cartaceo) |
| `domanda-ammissione-socio-2026.html` | `assets/doc/domanda-ammissione-socio-2026.pdf` | modulo cartaceo, link nella domanda |
| `statuto-cdl-aps-v1.html` | `assets/doc/statuto-cdl-aps-v1.pdf` | domanda di ammissione (link e allegato alla mail) |

Il modulo cartaceo (per i minorenni, o per chi non usa il sito) è
`domanda-ammissione-socio-<anno>.html` → `assets/doc/domanda-ammissione-socio-<anno>.pdf`:
un foglio A4 fronte e retro. Sul fronte la domanda, con le sezioni e i
testi della domanda dal sito (Chi sei, Contatti, Metodo di pagamento,
dichiarazioni), il riquadro per i minorenni e quello riservato
all'associazione (numero di tessera); sul retro, su due colonne, una
copia dell'informativa per i soci, da tenere uguale a
`informativa-soci-v1.html`. Deve restare in due facciate: dopo una
modifica, controlla il numero di pagine del PDF. Ogni anno (o quota) nuovo: file nuovo e link
nuovo in `vantaggi-tesseramento.html`.

Per rifare un PDF, dalla cartella del progetto (serve Google Chrome):

```bash
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
f=informativa-soci-v1
"$C" --headless=new --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf="assets/doc/$f.pdf" "file://$PWD/documenti/$f.html"
```

**Una versione nuova prende un nome nuovo** (`-v2`): `/assets/*` resta in
cache una settimana, e la versione letta è registrata nelle domande e nei
messaggi. Con un nome nuovo vanno cambiati anche il link e il valore della
casella nel modulo (Contatti: `value` della casella `informativa`; domanda:
`data-versione`) e, per la domanda, le proprietà `INFORMATIVA` / `STATUTO`
della web app (`google/iscrizioni/README.md`).

Le due informative sono state riviste dall'utente il 17 novembre 2026; un
ultimo controllo del testo è nella lista "Prima di unire" di `CLAUDE.md`.
Una correzione prima della pubblicazione può tenere lo stesso nome; dopo,
nome e versione nuovi.
