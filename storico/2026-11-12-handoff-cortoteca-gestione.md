# Handoff — Cortoteca dei soci e gestione (12 novembre 2026)

Passaggio di consegne dopo due giorni di lavoro sull'infrastruttura della
Cortoteca. Il progetto e le motivazioni stanno in
`storico/2026-11-11-cortoteca-infrastruttura.md`; le regole per chi tocca il
codice in `CLAUDE.md`. Qui: com'è la situazione, cosa resta, cosa non fare.

## Dove siamo

Tutto sta sul branch `redesign`, insieme al redesign del sito (le due cose
andranno online insieme, con una pull request unita dall'account `cdl-aps`).

Il database è **già in produzione**: migrazioni da
`20261111140000_cortoteca_soci.sql` a `20261112100100_cruscotto_gestione.sql`,
applicate e salvate in `supabase/migrations/`. Edge Function `accesso-socio`
pubblicata. Il `gestione.html` oggi online è quello vecchio.

**Attenzione:** l'amministratore ha attivato il codice di verifica (2FA). La
gestione vecchia, ancora online, non sa chiederlo: con quella non si salva più
niente. Fino alla pubblicazione si usa quella in locale
(`python3 -m http.server 5500`, poi `http://localhost:5500/gestione.html`).

Fatto dall'amministratore:
- script `supabase/foglio/sincronizza-soci.gs` incollato nel foglio "Gestione
  APS (fogli)", foglio collegato, 34 soci 2026 sincronizzati (uno senza email);
- opere attribuite ai soci; percorso del socio provato una volta con il suo
  collegamento (proposta di prova inviata e ritirata, poi una bozza "ddd").

## Cosa c'è

- **`proponi.html`** (pagina del socio): entra con
  `proponi.html#invito=<64 caratteri>`. Modulo in 4 passi con salvataggio
  automatico. Al passo 3 il socio sceglie **streaming** (licenza completa,
  versione `1`) o **sola scheda** (autorizzazione breve, versione `scheda-1`):
  da quella scelta dipendono domande e testo del passo 4. Durata
  obbligatoria; troupe con ruoli fissi (fotografia, sceneggiatura, montaggio,
  produttore, colonna sonora, scenografia, suono, costumi) più ruoli liberi
  (`altri_ruoli`); titolo grafico facoltativo in PNG o come file del font.
- **`gestione.html`**: barra come quella del sito, schede Dashboard,
  Proposte, Opere, Eventi, Soci; pulsante "Sicurezza 2FA". La Dashboard
  raccoglie "Da sistemare", i numeri e le ultime attività
  (`public.cruscotto()`). Revisione delle proposte nel modulo opera: approva,
  chiedi modifiche, rifiuta; all'approvazione fotogramma e titolo grafico
  passano dallo spazio privato `proposte` a `immagini`.
- **Testi da accettare**: `supabase/licenze/cortoteca-v1.txt` e
  `cortoteca-scheda-v1.txt`, uguali a `public.testi_licenza` (colonna
  `sha256`). Bozze per il Consiglio direttivo (delibera, regolamento, licenza,
  autorizzazione per la scheda, punti per il legale) nel documento claude.ai
  "Cortoteca — regolamento, licenza e delibera (bozze)":
  https://claude.ai/artifact/X1Xt6aXTpwaiU2b8BG7UL5

## Cosa resta

1. **Redesign, Cortoteca pubblica**: mostrare il titolo grafico (`titolo_png`
   come immagine, `titolo_font` con un `@font-face` caricato dallo spazio
   `immagini`, cartella `titoli/`); per le opere senza video non scrivere più
   "streaming in arrivo" se il socio ha scelto la sola scheda (la scheda ha
   `video_url` vuoto e una licenza di tipo `scheda`: per saperlo serve una
   colonna o una vista pubblica, oggi `licenze` non è leggibile da `anon`).
2. **Socio che vuole aggiungere lo streaming** a un corto pubblicato con la
   sola scheda: oggi passa dal direttivo. Il pezzo che manca è un pulsante
   "Aggiungi il video" nella pagina del socio (accetta la licenza
   `streaming` per l'opera e manda il collegamento al video in revisione).
3. **Consiglio direttivo**: approvare delibera, regolamento, licenza e
   autorizzazione; farli leggere a un legale prima di consegnare gli inviti;
   nominare almeno un secondo redattore (account dalla dashboard di Supabase
   più una riga in `privato.redattori`).
4. **Foglio dei soci**: aggiungere l'email mancante; impostare i destinatari
   degli avvisi (menu Cortoteca); togliere le schede con credenziali in chiaro
   (in entrambi i fogli dell'amministrazione) e cambiare quelle password.
5. **Collegamenti ai soci**: vanno creati dal sito online (in locale
   puntano a `localhost`). Rigenerare con "Nuovo collegamento" quelli fatti in
   locale.

## Da sapere

- Le prove del percorso del socio e della gestione sono state fatte con un
  backend finto nel browser e, per il database, in transazioni annullate con
  utenti simulati. Il classificatore dei permessi blocca la creazione di soci
  o redattori di prova nel database: non insistere, chiedere all'utente.
- Gli avvisi di Supabase sulle funzioni SECURITY DEFINER sono attesi: ogni
  funzione controlla chi la chiama. La protezione dalle password trapelate
  richiede il piano Pro. Lo schema `ponte` non fa parte di questo lavoro.
- Il collegamento personale aperto in `https://localhost` non funziona: il
  server locale parla solo `http`.
