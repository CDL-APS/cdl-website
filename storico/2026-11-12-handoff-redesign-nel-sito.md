# Handoff — il redesign è nel sito (12 novembre 2026)

Passaggio di consegne dopo il porting descritto in
[`2026-11-12-piano-porting-redesign.md`](2026-11-12-piano-porting-redesign.md).
Le regole per chi tocca il codice sono in `CLAUDE.md`; le scelte visive in
[`2026-11-11-design-handoff.md`](2026-11-11-design-handoff.md).
Per chi riprende il lavoro: [`2026-11-12-handoff-correzioni-redesign.md`](2026-11-12-handoff-correzioni-redesign.md)
(stato a fine sessione, strumenti di verifica, cose imparate).

## Dove siamo

Tutto sta sul branch `redesign`, un commit per fase (da "Fase 0" a "Fase 8"),
pubblicato su GitHub (`origin/redesign`). La pull request verso `main` non è
ancora aperta: l'utente prova la gestione e continua le correzioni sul
branch. Il sito della radice è quello delle
anteprime approvate ("proposta G"); `anteprime/` non esiste più.

- Pagine pubbliche: `index.html`, `cortoteca.html`, `opera.html`,
  `eventi.html`, `produzioni.html`, `contatti.html` (nuova),
  `vantaggi-tesseramento.html`, `404.html` e le otto pagine degli eventi,
  statiche. `cornicenarrativa.html` resta con Tailwind, con barra e piede
  nuovi.
- Pagine riservate: `gestione.html` e `proponi.html` hanno barra, colori e
  carattere nuovi, stessi campi e flussi. Funzionano sotto la CSP.
- Fogli: `base.css` → `components.css` → `pages/<pagina>.css`; in più
  `pages/riservato.css` per le pagine riservate. Script: `dati.js`,
  `comune.js`, `corto.js`, uno per pagina; `barra.js` non c'è più.

## Decisioni prese (con l'utente, all'inizio)

1. Angoli arrotondati come nelle anteprime; documentazione corretta.
2. I testi riscritti nelle anteprime sono quelli ufficiali.
3. `opere.solo_scheda`: con la sola scheda la pagina del corto non promette
   lo streaming; la scrivono le funzioni di licenza, i redattori la cambiano.
4. `opere.colore`: colore della pagina del corto, campo in gestione.
5. Gestione e proposta: stile nuovo, stessi flussi.
6. Contatti con Netlify Forms, più la conferma `#grazie`.
7. Cornice narrativa invariata nel contenuto.

Scelte fatte durante il lavoro, da conoscere:

- **Voce corrente**: solo `aria-current="page"`, niente più `is-active`
  (resta solo sulle schede di gestione, lette da `gestione.js`). Le pagine
  dei corti accendono Cortoteca (pillola lilla), le pagine evento Eventi.
- **Pagina del corto**: rispetto all'anteprima ha in più le note di regia,
  il pulsante Letterboxd (icona del link esterno), i crediti completi
  (Produttore, Fotografia, Sceneggiatura, Montaggio, Trucco, Costumi,
  Scenografia, Colonna sonora, Suono, poi gli altri ruoli e gli interpreti) e
  la pillola "Streaming in arrivo" sullo schermo, se manca il video e l'opera
  non è "solo scheda".
- **Aree toccabili**: le pillole della Cortoteca (38 px) e della barra sotto
  i 640 px (40 px) restano della stessa misura, ma si toccano su 44 px grazie
  a uno pseudo-elemento; il marchio nella barra è alto 44 px.
- **Loghi degli eventi**: classi `marchio--<pagina>` in `evento.css`, con
  percorsi assoluti (un `url()` dentro una variabile si risolve rispetto al
  foglio che la usa). Gli style in linea della barra sono diventati classi.
- **Montserrat 800** ora si carica: i grassetti dei testi degli eventi (che
  nelle anteprime cadevano sul 900) sono appena più sottili.
- **Campo `pagina` degli eventi**: accetta solo il nome di un file del sito,
  in gestione (pattern) e nel sito (`paginaEvento`).

## Database

- `20261112170000_colore_e_solo_scheda.sql` — **applicata**. Colonne
  `colore` e `solo_scheda`, `approva_proposta` e `accetta_licenza_opera`
  aggiornate. Nessuna opera oggi ha una licenza collegata, quindi nessuna è
  "solo scheda".
- `20261112180000_colonne_pubbliche.sql` — **scritta, non applicata**. Toglie
  ad `anon` il `select` sulla tabella e lo concede sulle sole colonne
  pubbliche (niente `modificato_da`). Il sito oggi online usa `select=*`:
  applicandola prima del deploy, il sito vecchio ripiegherebbe sulle copie
  di riserva. **Va applicata subito dopo il primo deploy del redesign.**
  Provata in una transazione annullata: opere, interpreti ed eventi
  pubblicati restano leggibili, la sveglia (`eventi?select=id`) anche.
- Le copie di riserva in `data/` sono rigenerate dalla Data API (12 novembre)
  con le colonne nuove.

## Come è stato verificato

Con Chrome headless guidato via DevTools (script temporanei, non nel
repository):

- **Confronto con le anteprime**: foto di ogni pagina a 1440 e 375 px prima
  del porting, poi delle pagine nuove, con il movimento ridotto (immagini
  ferme) e confronto pixel per pixel. Differenze rimaste: solo quelle decise
  (icone dei link esterni, peso 800, pagina del corto, Cortoteca accesa).
- **1024 e 768 px**: tutte le pagine pubbliche e la cornice narrativa.
- **Dal vivo**: torcia e indice della home, passaggio dalla home a
  Produzioni, sala della Cortoteca (clic sulla still, Esc, avanti, crocetta,
  ricarica sull'indirizzo del corto), sala di Eventi (scheda e Long Story
  Short), strisce delle serate.
- **Movimento ridotto**: il clic sull'indice cambia pagina senza passaggio.
- **Supabase irraggiungibile**: le pagine si riempiono dai JSON; un'opera non
  pubblicata aggiunta alla copia non compare.
- **Titolo grafico, colore, sola scheda**: risposte di Supabase modificate
  nel browser (un titolo PNG, un carattere, un colore chiaro e uno scuro,
  un'opera "solo scheda"): galleria, lista e pagina del corto si comportano
  come previsto. Il database non è stato toccato.
- **CSP**: server locale che manda gli header di `netlify.toml` (anche su
  `/gestione` e `/proponi`), viste di gestione e proposta mostrate senza
  accesso: nessuna violazione.
- **404** da un percorso profondo (`/a/b/c`), **Contatti** con
  `?motivo=socio` (modulo e oggetto giusti) e `#grazie`.
- Console senza errori su tutte le pagine (resta l'avviso di Tailwind sulla
  cornice narrativa).

## Cosa non è stato verificato

- **Gestione con un accesso vero**: salvare un'opera con colore e "solo
  scheda", approvare una proposta, caricare un titolo PNG e un carattere
  nello spazio `immagini` e vederli in Cortoteca. Serve l'accesso di un
  redattore (password e codice 2FA, solo dell'utente).
- Safari e iOS reali; screen reader.
- L'invio dei moduli di Contatti (funziona solo su Netlify).
- Gli header veri di Netlify: in particolare se su `/proponi` il
  `Referrer-Policy: no-referrer` della regola specifica convive con quello
  della regola `/*` (il collegamento del socio sta nel frammento `#`, che
  non viene mai inviato, quindi il rischio è basso).

## Cosa resta da fare

La lista da spuntare, prima di unire e subito dopo il deploy, sta in cima a
`CLAUDE.md` ("Redesign: da fare prima e dopo il deploy"), così ogni sessione
di lavoro la vede. In breve: prove in gestione con un accesso vero, PR unita
da `cdl-aps`, poi la migrazione delle colonne pubbliche, le notifiche dei
moduli di Contatti su Netlify, il controllo degli header, i collegamenti dei
soci da rigenerare, "Secure password change" in Supabase, i quattro titoli
grafici da ricaricare come PNG, un giro su iPhone e Safari.

File non più mostrati da nessuna pagina, lasciati perché sono contenuti e
non codice: le locandine in `assets/img/eventi/*/locandina.jpg`, le foto
`lss-2026-copertina-sala.jpg` e `-sipario.jpg`, i marchi
`assets/img/brand/lss-mini.png` e `short-talks.png`. Le nuvole in
`assets/img/nuvole/` servono ai redirect.
