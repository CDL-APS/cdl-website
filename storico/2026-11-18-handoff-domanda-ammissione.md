# Passaggio di consegne: Cortoteca in pausa e domanda di ammissione (18 novembre 2026)

Per chi riprende il lavoro sul branch `redesign`. La lista vera di cosa
manca è "Redesign: da fare" in cima a `CLAUDE.md`; qui c'è il contesto per
ripartire senza rileggere la conversazione.

## Dove siamo

- Commit su `redesign` (ultimo: le correzioni delle review), già su GitHub, e caricato sul deploy di
  prova `https://redesign--cdl-aps.netlify.app` (CLI di Netlify, sito
  `f4a10032-1dee-4d84-944d-8e2708a5c8cd`, `--alias redesign`, mai
  `--prod`). Controllati lì con `curl`: i 302 di Cortoteca e area socio, i
  404 su `google/`, `documenti/`, `storico/`, `CLAUDE.md`, lo
  `X-Robots-Tag: noindex` dello statuto, CSP e `no-store` di gestione.
- Fatti e controllati a occhio in locale (desktop e 375 px): pausa della
  Cortoteca, informativa obbligatoria in Contatti, sezione "Domanda di
  ammissione a socio" in Vantaggi (a comparsa), PDF in `assets/doc/`.
- **Aggiornamento del 18 novembre sera**: web app installata con ciao@ e
  provata sulla copia del foglio (sezione 4 delle prove, tutto a posto
  tranne il pagamento PayPal vero, rimandato a dopo il deploy). In
  `data-indirizzo` c'è l'indirizzo del deployment "Sito". Cambiati dopo le
  review: tasto nella mail a ciao@, testi più colloquiali, Note corte
  (`Sito D26-003`), giro ogni minuto con il Sì valido dopo 2 minuti,
  mittente "CDL APS". "Conferma assemblea?" resta a mano: è la ratifica del
  direttivo (art. 4 dello statuto), lo script la ricorda e basta.

## Decisioni prese con l'utente (17-18 novembre)

- La Cortoteca è in pausa ed esce dal deploy:
  `storico/2026-11-17-cortoteca-in-pausa.md`.
- Domanda online solo per maggiorenni; per i minorenni il modulo cartaceo
  (`domanda-ammissione-socio-2026.pdf`, 5 €).
- Pagamento: PayPal "amici e familiari", bonifico istantaneo o contanti.
  Il tesoriere mette `Pagato? = Sì`, e lo script assegna il numero,
  compila la data e manda la conferma.
- **Numeri di tessera**: li assegna solo lo script, in ordine di
  pagamento, anche alle righe scritte a mano. **Chi rinnova tiene il suo
  numero** (`numeroPerRiga`: stessa email, o stesso nome se manca l'email);
  i nuovi soci continuano dal più alto mai usato in tutte le schede
  `TESSERATI`. Il 18 novembre sono stati tolti dal foglio vero i numeri
  035-150 scritti in anticipo sulle righe vuote.
- Quota 5 € fino al 31 dicembre 2026, poi 10 € (proprietà `QUOTE`).
  Deliberata dall'ultima assemblea ordinaria.
- Delegati all'accoglimento: chi ha accesso a ciao@.
- **Tasto nella mail a ciao@** (18 novembre, dopo le review): apre una
  pagina riservata all'account ciao@ con il numero da scrivere sulla
  tessera fisica; "Conferma" accoglie subito la domanda. Serve un secondo
  deployment "Chiunque in cdlaps.com" (`URL_CONFERMA`). Niente tasto
  "Respingi". Le review della web app si decidono dopo le prove.
- Statuto: testo semplice, senza date di registrazione o deposito
  (`statuto-cdl-aps-v1.pdf`); link solo dal modulo, `noindex`, allegato
  alla mail. Lo statuto è in regola sul RUNTS.
- Informative, statuto e modulo cartaceo: riletti e approvati
  dall'utente il 18 novembre (rilettura finale fatta).
- Contatti: tolto il motivo "Diventare socio".

## Prossimi passi, in ordine

1. ~~`/code-review` e `/security-review`~~: fatte il 18 novembre, con le
   correzioni (esiti in fondo a `storico/2026-11-12-review-pre-deploy.md`).
2. Installare la web app con l'account ciao@, **guidando l'utente un passo
   alla volta** (cosa aprire, cosa cliccare, cosa incollare):
   `google/iscrizioni/README.md`, prima su una **copia** del foglio soci.
   L'account PayPal è `paypal.me/cdlaps` (verificato).
3. Mettere l'indirizzo `/exec` in `data-indirizzo`, ricaricare il deploy
   di prova e fare le prove della sezione 4 di
   `storico/2026-11-14-prove-sito-online.md`, fino a un pagamento vero da
   5 €; poi il resto della lista.
4. Pull request `redesign` → `main`, unita con l'account `cdl-aps` e un
   merge commit; poi la lista "Subito dopo il deploy" di `CLAUDE.md`
   (fra cui la web app che passa al foglio vero).

## Da ricordare

- Dal 1° gennaio 2027: modulo cartaceo a 10 € (file nuovo), via la quota
  ridotta dal nastro della home e da Sostieni (voce in `CLAUDE.md`, "Da
  fare più avanti").
- `supabase/foglio/sincronizza-soci.gs` (controllo dei numeri doppi) va
  reincollato nel foglio solo alla ripresa della Cortoteca.
- Gli avvisi "Cortoteca: cose da sistemare" del foglio: se c'erano
  destinatari, vanno svuotati dal menu Cortoteca del foglio.
- Mai leggere le schede con le password nei fogli dell'amministrazione.
