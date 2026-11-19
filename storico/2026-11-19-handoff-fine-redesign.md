# Passaggio di consegne: redesign online, fine del lavoro (19 novembre 2026)

Per chi apre la prossima sessione. Il redesign è chiuso: niente è a metà.

## Dove siamo

- **Il redesign è online su cdlaps.com dal 19 novembre 2026** (PR #10,
  `redesign` → `main`). Il branch `redesign` non serve più: dopo che i suoi
  ultimi commit di documentazione sono in `main` si può cancellare.
- **Repository**: `CDL-APS/cdl-website`, reso **pubblico** il 19 novembre,
  perché il piano gratuito di Netlify non costruisce i repository privati
  delle organizzazioni. Netlify è ricollegato e pubblica `main` a ogni
  merge. Niente segreti né dati personali nei commit.
- **Fatto e controllato dopo il deploy**:
  - la migrazione `colonne_pubbliche`;
  - i controlli `curl` su header e redirect;
  - il modulo di Contatti, provato per intero dall'utente (funziona;
    l'impaginazione della mail di notifica non gli piace molto, è fra il
    "Da fare più avanti" di `CLAUDE.md`, forse);
  - il giro del sito da telefono.
- **Domanda di ammissione online**:
  - la web app (versione `2026-11-19a`) lavora sul foglio vero
    (`FOGLIO_ID`, `CARTELLA_DOMANDE_ID`, `STATUTO_URL`), e `verifica` è a
    posto;
  - sono già arrivate domande vere, con PayPal e con bonifico, tutte
    gestite bene fino alla tessera.
  - Nelle proprietà dello script restano tre voci delle prove
    (`domanda:D26-001`, `-002`, `-003`), innocue: l'utente può cancellarle
    quando vuole.
- **Lasciati perdere dall'utente**: le voci per il direttivo (delibera sui
  delegati all'accoglimento, ratifiche). Non riproporle.

## Prossimo lavoro: la Cortoteca

L'utente vuole aprire un branch per riprendere la Cortoteca. Si parte da
`storico/2026-11-17-cortoteca-in-pausa.md`, sezione "Come partire":
- branch `cortoteca` da `main`;
- cosa riaccendere e dove;
- interazioni con la domanda online;
- da fare congelato, compresi i titoli grafici in PNG, che sono solo una
  questione di ordine;
- prove e review da rifare.

## Altre cose aperte (in `CLAUDE.md`, "Da fare più avanti")

- **Dal 1° gennaio 2027 la quota passa a 10 €**:
  - nuovo modulo cartaceo;
  - via la quota ridotta dal nastro della home e da Sostieni.
- Gestione degli eventi e pagine evento dal database
  (`storico/2026-11-13-piano-eventi-gestione.md`).
- Donazioni in Sostieni.
- Rinnovo online per chi è già socio.
