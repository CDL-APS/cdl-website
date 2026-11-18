# Piano — le pagine evento composte dalla gestione (12 novembre 2026)

Piano di lavoro concordato con l'utente a fine sessione, da eseguire a fasi.
Ogni fase si chiude con un controllo dell'utente prima della successiva.
Il passaggio di consegne della sessione è in
`storico/2026-11-12-handoff-gestione-e-rullino.md`.

## L'obiettivo

Oggi ogni pagina evento (`short-talks-1.html`, `blue-hour.html`,
`longstoryshort.html`…) è un file scritto a mano, con colore e logo in
`assets/css/pages/evento.css` (`evento--<pagina>`, `marchio--<pagina>`). Il
modulo evento della gestione compila campi che il sito non usa più
(copertina, miniatura, corti nati dall'evento).

Si vuole che un evento nuovo si pubblichi **dalla gestione**, senza file né
deploy: la pagina si compone da sola da un modello, con lo stesso disegno di
quelle di oggi.

## Decisioni prese con l'utente

- **La pagina si compone da sola** da un modello che legge il database (come
  `opera.html` per i corti), non un file generato da scaricare.
- **Le pagine già fatte si convertono** al modello, tutte e otto.
- **Flessibilità**: l'utente non vuole un modulo troppo schematico. Proposta
  (approvata come direzione, da confermare nei dettagli in fase 1): una
  **pagina a blocchi**. Il modulo è una pila di blocchi che si aggiungono,
  si ripetono e si riordinano; ogni tipo di blocco ha una sola resa, quella
  del sito. La libertà sta nella composizione e nelle righe libere, non in
  campi obbligati.
- Nel modulo evento: **via** "Immagini" (copertina e miniatura) e "Corti
  nati dall'evento"; **dentro** logo PNG (il titolo dell'evento), colore,
  link al post Instagram, foto del carosello.

## Le sfaccettature da coprire

Inventario delle pagine di oggi (classi del `<main>`):

| Pagina | Testata | Corpo |
|---|---|---|
| short-talks-1 | logo affiancato | 1 serata con titolo e nota, foto + post IG, corti collegati alla Cortoteca |
| short-talks-2 | logo sopra | 1 serata con titolo, foto + IG, corti collegati |
| short-talks-3-x-laiff | logo sopra | 1 serata con titolo e nota, foto + IG |
| short-talks-al-not-2025 | logo affiancato | 1 serata senza titolo, 3 blocchi di corti, foto + IG |
| short-talks-al-not-2026 | logo affiancato | come sopra |
| short-talks-off-1 | logo sopra | 4 serate, ognuna con titolo, nota, foto + IG; tag Instagram nelle note |
| blue-hour | logo affiancato | 1 serata senza titolo: elenco semplice (non numerato), una voce con un logo al posto del nome e i suoi corti annidati; tag IG |
| longstoryshort | lettering della serie + artwork della cover dietro la testata | galleria a tutta larghezza, testo + righe dei materiali, testo + elenco premi + vincitori (still, premi), partner |

Altre cose da tenere: il **colore** dell'evento (testi e fili), il **logo**
PNG usato come maschera nel colore, il passaggio dalla scheda di Eventi alla
pagina (il logo sale al suo posto), l'apertura dentro Eventi (la "sala"), i
corti con la freccia verso la Cortoteca, i tag Instagram che escono dal
sito, il rullino della home che pesca le foto delle gallerie.

## Il modello dei dati

Una migrazione nuova su `public.eventi` (con i `grant select (colonna)` ad
`anon` per le colonne nuove, vedi "Colonne pubbliche" in `CLAUDE.md`):

- `logo` — percorso del PNG nello spazio `immagini` (`eventi/<codice>/logo-…png`);
- `colore` — `#rrggbb`, come `opere.colore`;
- `instagram` — link al post dell'evento (facoltativo);
- `sfondo` — immagine facoltativa dietro la testata (l'artwork di LSS);
- `blocchi` — `jsonb`, un array di blocchi (vincolo: è un array).

Le foto nuove vanno in `immagini/eventi/<codice>/` (ridimensionate come le
altre). Le foto di oggi restano dove sono (`assets/img/eventi/<cartella>/`)
e i blocchi le citano col percorso `assets/…`, come fa già il rullino.

I tipi di blocco (forma indicativa, da fissare in fase 1):

- **testo** — `titolo?`, `testo` (paragrafi separati da una riga vuota;
  `**grassetto**`, `_corsivo_`, `[collegamento](indirizzo)`; i link
  Instagram diventano tag con l'icona del link esterno);
- **programma** — `titolo?`, `nota?`, `numerato` (sì/no), `voci`: ognuna
  `titolo`, `riga?` (testo libero: "regista · 12'", "musica dal vivo"…),
  `opera_id?` (freccia verso la Cortoteca), `logo?` (un logo al posto del
  nome, come a Blue Hour), `voci?` (corti annidati sotto una voce);
  `foto?` e `instagram?`: se ci sono, il blocco diventa una **serata** con
  la striscia di foto a fianco, come oggi;
- **foto** — `titolo?`, `foto` (percorso, descrizione), `instagram?`: la
  galleria a tutta larghezza (quella di LSS);
- **vincitori** — `testo?`, `voci`: `titolo`, `riga`, `still`, `premi`,
  `opera_id?`, `primo` (il blocco grande);
- **materiali** — `testo?`, `voci`: `titolo`, `indirizzo`;
- **partner** — `loghi`: immagine, nome, larghezza.

Il titolo dei blocchi resta facoltativo e, se manca, c'è comunque un titolo
nascosto per i lettori di schermo (come oggi per Galleria e Vincitori).

## La pagina modello

- **`evento.html?e=<codice>`**, con uno script suo (nome da decidere:
  `evento.js` non esiste ancora) che legge l'evento, ne disegna testata e
  blocchi con le classi che già esistono in `pages/evento.css`, e imposta
  colore e logo come variabili (al posto delle classi `evento--<pagina>`).
- **Testata**: logo affiancato o sopra il testo, deciso dalle proporzioni
  del PNG (oggi è scritto a mano con `hero--affiancato`).
- **La sala di Eventi** userà la stessa funzione di disegno (come
  `corto.js` serve sia `opera.html` sia la sala della Cortoteca), invece di
  scaricare il `<main>` di un file.
- **Indirizzi vecchi**: `short-talks-1.html` e gli altri restano validi con
  un redirect in `netlify.toml` verso `evento.html?e=…`. `paginaEvento()`
  (`dati.js`) restituirà l'indirizzo del modello per gli eventi con i
  blocchi; il campo `pagina` diventa superfluo.
- **Rullino**: la scheda Rullino prenderà le foto degli eventi dai blocchi
  nel database, non più dall'HTML delle pagine.
- **Eventi non pubblicati**: il modello usa la chiave pubblica e non li
  vede; per l'anteprima dalla gestione si decide in fase 2 (passando i dati
  dalla gestione, o leggendo con la sessione del redattore).

## Le fasi

1. **Database e modello, una pagina.** Migrazione; `evento.html` e il suo
   script; Short Talks #1 trascritta nei blocchi (dati in una migrazione,
   riproducibile). Controllo: le due versioni affiancate a 1440 e 375 px,
   differenze pixel per pixel, sala dentro Eventi, passaggio del logo.
   Qui si fissano con l'utente la forma dei blocchi e la sintassi del testo.
2. **Il modulo a blocchi in gestione.** Testata (logo con anteprima sul suo
   colore, colore, sfondo, Instagram); i blocchi: aggiungi per tipo, sposta,
   togli; programma con le voci (come il cast); foto con caricamento
   multiplo, ordine e descrizioni. Via "Immagini" e "Corti nati
   dall'evento". Anteprima. Controllo: l'utente crea un evento di prova.
3. **Conversione delle altre sette pagine** (Short Talks #2, LAIFF, Nòt
   2025 e 2026, OFF, Blue Hour, Long Story Short), ognuna confrontata con
   l'originale. Poi i redirect, la pulizia di `evento.css` (classi per
   pagina) e dei file HTML, l'aggiornamento di `CLAUDE.md` e del rullino.

## Stato (12 novembre 2026, notte)

- Fase 1 fatta: migrazione `20261112210000_eventi_a_blocchi.sql` applicata,
  `evento.html` + `modello-evento.js`, Short Talks #1 identica al pixel.
- Fase 2 fatta, da provare con un accesso vero: `gestione-eventi.js`.
  Forma dei blocchi e sintassi del testo approvate dall'utente ("alla
  peggio si cambia dopo"). Copertina e miniatura tolte solo dal modulo;
  `eventi_opere` resta nel database, il modulo non la mostra.
- Da fare: fase 3 (dopo il deploy del redesign, se l'utente è d'accordo).

## Domande aperte

- La sintassi del testo (asterischi e parentesi) va bene per chi compila, o
  serve un piccolo editor con i tasti grassetto e collegamento?
- Le colonne `copertina` e `miniatura`: si tolgono solo dal modulo o anche
  dal database? Oggi servono ancora come ripiego della scheda di Eventi
  senza logo e come foto del rullino.
- `eventi_opere` (corti nati dall'evento): la tabella resta, il modulo non
  la mostra più. Da decidere se eliminarla.
- Long Story Short ha pezzi suoi (lettering della serie, artwork): il
  modello li copre con logo e sfondo, ma va verificato in fase 3.

## Skill utili

- `frontend-design:frontend-design` per i dettagli della resa;
- `code-review` a fine fase 2;
- gli strumenti di confronto descritti nel passaggio di consegne.
