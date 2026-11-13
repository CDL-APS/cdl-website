-- ==========================================================================
-- EVENTI A BLOCCHI: la pagina di un evento si compone dal database.
--
-- Finora ogni pagina evento era un file HTML scritto a mano, con colore e
-- logo in assets/css/pages/evento.css. Da qui la pagina può nascere dalla
-- gestione: evento.html?e=<codice> legge l'evento e ne disegna testata e
-- blocchi (assets/js/modello-evento.js). Un evento usa il modello quando ha
-- una presentazione o almeno un blocco; gli altri restano sul loro file
-- (colonna pagina) finché non vengono convertiti.
-- Piano: storico/2026-11-12-piano-pagine-evento.md.
--
-- Colonne nuove, tutte pubbliche come il resto dell'evento (sono anche in
-- COLONNE_EVENTI di assets/js/dati.js e in 20261113200000_colonne_pubbliche.sql):
-- - logo: il PNG senza fondo che fa da titolo, usato come maschera nel
--   colore dell'evento. Un percorso nello spazio immagini
--   (eventi/<codice>/logo-…png) o, per gli eventi di prima, una copia nel
--   sito (assets/img/eventi/loghi/<pagina>.png);
-- - colore: #rrggbb minuscolo, come opere.colore;
-- - instagram: il post dell'evento; lo usano i blocchi con le foto che non
--   hanno un post loro;
-- - sfondo: immagine facoltativa dietro la testata (l'artwork di Long Story
--   Short);
-- - presentazione: il racconto accanto al logo. Paragrafi separati da una
--   riga vuota; **grassetto**, _corsivo_, [testo](indirizzo), @nome per un
--   profilo Instagram, righe che iniziano con "- " per un elenco;
-- - blocchi: la pila dei blocchi sotto la testata, un array jsonb. Ogni
--   blocco ha un "tipo"; i tipi e i loro campi sono descritti in
--   assets/js/modello-evento.js.
-- ==========================================================================

alter table public.eventi
  add column logo text check (logo ~ '^(eventi/|assets/img/eventi/)[a-z0-9/._-]+\.png$'),
  add column colore text check (colore ~ '^#[0-9a-f]{6}$'),
  add column instagram text check (instagram ~ '^https://(www\.)?instagram\.com/'),
  add column sfondo text check (sfondo ~ '^(eventi/|assets/img/eventi/)[a-z0-9/._-]+\.(jpe?g|png|webp)$'),
  add column presentazione text,
  add column blocchi jsonb not null default '[]' check (jsonb_typeof(blocchi) = 'array');

comment on column public.eventi.logo is
  'PNG senza fondo, titolo dell''evento: percorso nello spazio immagini o in assets/img/eventi/.';
comment on column public.eventi.colore is
  'Colore dell''evento sul sito (scritte, fili, logo), #rrggbb minuscolo.';
comment on column public.eventi.instagram is
  'Post Instagram dell''evento, per i blocchi con le foto che non ne hanno uno loro.';
comment on column public.eventi.sfondo is
  'Immagine facoltativa dietro la testata della pagina dell''evento.';
comment on column public.eventi.presentazione is
  'Il racconto accanto al logo, con la sintassi descritta in assets/js/modello-evento.js.';
comment on column public.eventi.blocchi is
  'I blocchi della pagina dell''evento, in ordine. Tipi e campi in assets/js/modello-evento.js.';

-- --------------------------------------------------------------------------
-- Short Talks #1 trascritta nei blocchi (la prima pagina convertita)
-- --------------------------------------------------------------------------
update public.eventi set
  logo = 'assets/img/eventi/loghi/short-talks-1.png',
  colore = '#ff7a41',
  instagram = 'https://www.instagram.com/p/C5_XntuoJj_/',
  presentazione = 'Il **18 aprile 2024**, al **C''entro Supercinema di Santarcangelo**, nasce **Short Talks**: il format con cui CDL porta in sala il cinema corto, combinando la proiezione di progetti indipendenti al dialogo con i giovani autori che li hanno realizzati. Il nome è un gioco di parole sull''inglese _small talk_, la conversazione leggera e informale, e richiama sia la brevità delle opere sia lo scambio diretto con il pubblico.',
  blocchi = jsonb_build_array(jsonb_build_object(
    'tipo', 'programma',
    'titolo', 'Doppia visione',
    'nota', 'Ogni proiezione è seguita dal dialogo con il regista e la troupe.',
    'gruppi', jsonb_build_array(jsonb_build_object(
      'numerato', true,
      'voci', jsonb_build_array(
        jsonb_build_object(
          'titolo', 'Relatività',
          'riga', 'Francesco Pasquinelli · CDL · 2024 · 10''',
          'opera_id', (select id from public.opere where codice = 'relativita')),
        jsonb_build_object(
          'titolo', 'Dettagli Temporanei',
          'riga', 'Christian Dei · LVDA Film · 2023 · 9''')))),
    'foto', jsonb_build_array(
      jsonb_build_object('immagine', 'assets/img/eventi/short-talks-1/serate/serata-18-04-01.jpg', 'larghezza', 1080, 'altezza', 1080),
      jsonb_build_object('immagine', 'assets/img/eventi/short-talks-1/serate/serata-18-04-02.jpg', 'larghezza', 1080, 'altezza', 1080),
      jsonb_build_object('immagine', 'assets/img/eventi/short-talks-1/serate/serata-18-04-03.jpg', 'larghezza', 1080, 'altezza', 1080),
      jsonb_build_object('immagine', 'assets/img/eventi/short-talks-1/serate/serata-18-04-04.jpg', 'larghezza', 1080, 'altezza', 1080)),
    'descrizione_foto', 'Foto della serata del 18 aprile'))
where codice = 'short-talks-1';
