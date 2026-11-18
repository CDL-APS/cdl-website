-- ==========================================================================
-- LICENZA DELLA CORTOTECA, VERSIONE 1 — il testo che il socio accetta online.
-- Generato da supabase/licenze/cortoteca-v1.txt: i due devono restare uguali.
-- Un testo in vigore non si corregge: per cambiarlo si aggiunge una versione
-- nuova con un'altra migrazione, e le licenze già accettate restano legate a
-- questa. La colonna sha256 è l'impronta del testo, calcolata qui.
--
-- BOZZA: da approvare in Consiglio direttivo prima di consegnare gli inviti.
-- ==========================================================================

insert into public.testi_licenza (versione, testo, sha256)
select '1', v.testo, encode(sha256(convert_to(v.testo, 'UTF8')), 'hex')
from (values ($licenza$LICENZA PER LA PUBBLICAZIONE IN CORTOTECA
Versione 1

Questa licenza è un accordo fra chi la accetta (il «Concedente») e CDL APS, associazione di promozione sociale con sede in Viale Laurana 13, 47921 Rimini, codice fiscale 91200080405 («CDL»). Riguarda il cortometraggio descritto nella proposta a cui l'accettazione è unita (l'«Opera»).

1. Che cosa autorizza
Il Concedente autorizza CDL a pubblicare l'Opera nella Cortoteca, la sezione del sito cdlaps.com dedicata ai cortometraggi dei soci. In concreto CDL può:
a) mettere l'Opera a disposizione del pubblico, in modo che chiunque possa vederla in streaming quando vuole, mostrando nel sito il video che il Concedente ha caricato su YouTube o su Vimeo;
b) se il Concedente lo chiede, caricare il file dell'Opera sul canale YouTube o Vimeo di CDL, come video non in elenco, e mostrarlo nel sito allo stesso modo;
c) riprodurre l'Opera nella sola misura tecnicamente necessaria ai punti a) e b);
d) pubblicare nella scheda dell'Opera il titolo, i testi, i crediti e il fotogramma forniti dal Concedente.

2. Che cosa non autorizza
Ogni diritto non elencato all'articolo 1 resta al Concedente. CDL non può far scaricare l'Opera, proiettarla in pubblico, iscriverla a festival, cederla o concederla a terzi, né usarla a fini commerciali. Per ogni altro uso serve un accordo scritto a parte.

3. Uso promozionale
Solo se il Concedente lo autorizza con la casella dedicata, CDL può usare il fotogramma ed estratti dell'Opera non più lunghi di 30 secondi sui propri canali social e nei propri materiali, per far conoscere l'Opera e la Cortoteca, indicando sempre il titolo e la regia. Il Concedente può ritirare questa autorizzazione in ogni momento, anche lasciando l'Opera in Cortoteca.

4. Caratteri della licenza
La licenza è:
a) non esclusiva: il Concedente resta libero di usare l'Opera e di concederla ad altri;
b) gratuita: nessuna delle parti deve un compenso all'altra. Il Concedente dichiara di scegliere liberamente la gratuità, per far conoscere la propria Opera;
c) valida in tutto il mondo, perché il sito è raggiungibile ovunque;
d) a tempo indeterminato, fino alla revoca.

5. Integrità e crediti
CDL pubblica l'Opera senza tagli, aggiunte o modifiche e indica titolo, regia e crediti come forniti dal Concedente. Corregge gli errori su semplice segnalazione.

6. Revoca
Il Concedente può revocare la licenza in ogni momento e senza dare motivazioni, dalla propria pagina personale o scrivendo a ciao@cdlaps.com. CDL toglie l'Opera dalla Cortoteca entro 15 giorni dalla revoca; nello stesso termine elimina il video dal proprio canale, se lo aveva caricato a norma dell'articolo 1, lettera b).

7. Pubblicazione e rimozione
CDL non è obbligata a pubblicare l'Opera. Può nasconderla o toglierla nei casi previsti dal Regolamento della Cortoteca, in particolare quando riceve una contestazione o quando il Concedente non rinnova la quota associativa, informandone il Concedente.

8. Dichiarazioni del Concedente
Il Concedente dichiara che:
a) ha organizzato la produzione dell'Opera, oppure agisce con il consenso scritto di chi l'ha prodotta e di ogni altro coproduttore;
b) gli autori del soggetto, della sceneggiatura, della regia e delle musiche sono d'accordo con la pubblicazione dell'Opera in streaming;
c) per le musiche presenti nell'Opera dispone delle autorizzazioni necessarie alla diffusione online, e ha indicato nel questionario se gli autori sono iscritti a una società di gestione dei diritti (per esempio SIAE o Soundreef);
d) gli interpreti e le persone riconoscibili nell'Opera hanno acconsentito per iscritto alla sua diffusione online; per i minori hanno acconsentito i genitori o chi ne fa le veci;
e) l'Opera non viola diritti di altri né norme di legge, e non è vincolata da accordi che ne vietano la pubblicazione in Cortoteca;
f) le risposte date nel questionario sui diritti sono vere. Il questionario fa parte di questa licenza.

9. Contestazioni
Se un terzo contesta la pubblicazione dell'Opera, CDL ne informa il Concedente e può nascondere l'Opera finché la questione non è chiarita. Se una dichiarazione dell'articolo 8 risulta non vera, il Concedente tiene CDL indenne dalle richieste dei terzi che ne derivano.

10. Come si accetta e come si prova
Il Concedente accetta la licenza online, dopo essere entrato con il collegamento personale ricevuto da CDL, scrivendo il proprio nome e cognome e spuntando le caselle di accettazione. CDL registra il testo accettato e la sua versione, le risposte al questionario, la data e l'ora, l'indirizzo IP e il tipo di browser. La registrazione non può essere modificata. Il Concedente può rileggere e scaricare in ogni momento, dalla propria pagina personale, il testo accettato e la ricevuta dell'accettazione.

11. Dati personali
CDL tratta i dati del Concedente e delle persone indicate nei crediti secondo l'informativa pubblicata nella pagina di proposta.

12. Legge applicabile e versioni
La licenza è regolata dalla legge italiana. Per le controversie vale il giudice indicato dalla legge. Se CDL adotta una nuova versione di questo testo, l'Opera resta regolata dalla versione accettata, finché il Concedente non ne accetta un'altra.$licenza$)) as v (testo);
