-- ==========================================================================
-- VETRINA DELLA HOME — il primo blocco della pagina iniziale scorre in
-- orizzontale fra la sala vista dall'alto (l'apertura) e i contenuti in
-- evidenza, scelti nella Dashboard della gestione, che fa da indice di
-- tutte le pagine del sito. Una riga per slide, in ordine di posizione.
--
-- tipo:
--   'apertura'  → la sala, scritta nella pagina; una sola, non si elimina,
--                 ma si sposta come le altre;
--   'contenuto' → porta a uno (e uno solo) fra:
--                 evento_id → la pagina dell'evento;
--                 opera_id  → la pagina del corto;
--                 pagina    → una pagina del sito ('eventi.html', anche con
--                             un'ancora: 'vantaggi-tesseramento.html#associati').
-- titolo, testo, invito, immagine, colore: facoltativi. Vuoti, il sito li
--   ricava da ciò a cui la slide porta (titolo, data e luogo, copertina e
--   colore dell'evento; titolo, regia e fotogramma del corto; nome e colore
--   della sezione).
-- immagine: un file del sito ('assets/img/…') o un percorso nello spazio
--   immagini (le foto caricate dalla gestione stanno in vetrina/).
-- attiva: spenta, la slide resta nell'elenco della gestione ma la home non
--   la mostra (chi visita il sito non la legge nemmeno).
--
-- La tabella è nuova: i grant vanno dati qui (CLAUDE.md, "Tabelle nuove in
-- public"). Chi visita il sito legge le colonne che servono alla home.
-- ==========================================================================

create table public.vetrina (
  id bigint generated always as identity primary key,
  tipo text not null default 'contenuto' check (tipo in ('apertura', 'contenuto')),
  evento_id bigint references public.eventi (id) on delete cascade,
  opera_id bigint references public.opere (id) on delete cascade,
  pagina text check (pagina ~ '^[a-z0-9-]+\.html(#[a-z0-9-]+)?$'),
  titolo text check (titolo <> ''),
  testo text check (testo <> ''),
  invito text check (invito <> ''),
  immagine text check (immagine ~ '^(assets/img/|vetrina/|eventi/|opere/)[A-Za-z0-9/._-]+$' and immagine !~ '\.\.'),
  colore text check (colore ~ '^#[0-9a-f]{6}$'),
  attiva boolean not null default true,
  posizione integer not null default 0,
  creato_il timestamptz not null default now(),
  constraint vetrina_collegamento check (
    (tipo = 'apertura' and num_nonnulls(evento_id, opera_id, pagina) = 0)
    or (tipo = 'contenuto' and num_nonnulls(evento_id, opera_id, pagina) = 1)
  )
);

comment on table public.vetrina is
  'Le slide del primo blocco della home, in ordine di posizione: la sala (apertura) e i contenuti in evidenza scelti dalla gestione.';
comment on column public.vetrina.tipo is
  'apertura (la sala, una sola) o contenuto (porta a un evento, a un corto o a una pagina del sito).';
comment on column public.vetrina.pagina is
  'Una pagina del sito, anche con un''ancora (vantaggi-tesseramento.html#associati).';
comment on column public.vetrina.immagine is
  'File del sito (assets/img/…) o percorso nello spazio immagini (vetrina/…). Vuota: quella di ciò a cui la slide porta.';
comment on column public.vetrina.attiva is
  'Spenta, la home non mostra la slide.';

create unique index vetrina_una_apertura on public.vetrina (tipo) where tipo = 'apertura';
create index vetrina_posizione on public.vetrina (posizione);

alter table public.vetrina enable row level security;

create policy "Lettura: le slide attive"
  on public.vetrina for select to anon
  using (attiva);

create policy "Lettura: le slide attive, e tutte per i redattori"
  on public.vetrina for select to authenticated
  using (attiva or (select privato.e_redattore()));

create policy "Inserimento: solo redattori"
  on public.vetrina for insert to authenticated
  with check ((select privato.e_redattore()));

create policy "Modifica: solo redattori"
  on public.vetrina for update to authenticated
  using ((select privato.e_redattore()))
  with check ((select privato.e_redattore()));

-- l'apertura non si elimina
create policy "Eliminazione: solo redattori, non l'apertura"
  on public.vetrina for delete to authenticated
  using ((select privato.e_redattore()) and tipo = 'contenuto');

-- I permessi predefiniti dello schema public danno ad anon tutta la tabella
-- (anche creato_il, e la scrittura, che la RLS comunque nega): si tolgono e
-- restano le sole colonne che servono alla home
revoke all on public.vetrina from anon;
grant select (id, tipo, evento_id, opera_id, pagina, titolo, testo, invito, immagine, colore, attiva, posizione)
  on public.vetrina to anon;
grant select, insert, update, delete on public.vetrina to authenticated, service_role;

-- La sala, come oggi: la prima e per ora l'unica slide
insert into public.vetrina (tipo, posizione) values ('apertura', 1);
