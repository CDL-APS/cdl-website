-- ==========================================================================
-- RULLINO DELLA HOME — le foto che scorrono in home, scelte dalla gestione
-- (scheda Rullino) fra tre provenienze: le gallerie delle pagine evento, le
-- still dei corti, altre foto caricate apposta.
--
-- immagine: un file del sito ('assets/img/…', le gallerie delle pagine
--   evento) o un percorso nello spazio immagini di Supabase (fotogrammi dei
--   corti, copertine degli eventi, foto caricate nella cartella rullino/).
-- Dove porta il clic, al più uno dei tre:
--   evento_id → la pagina dell'evento (o Eventi, se non ne ha una);
--   opera_id  → la pagina del corto;
--   pagina    → una pagina del sito ('contatti.html'), per le altre foto.
-- posizione: l'ordine nel rullino.
--
-- Tutti leggono (la home); scrivono solo i redattori. La tabella è nuova:
-- i grant vanno dati qui (vedi CLAUDE.md, "Tabelle nuove in public").
-- ==========================================================================

create table public.rullino (
  id bigint generated always as identity primary key,
  immagine text not null check (immagine <> ''),
  descrizione text not null default '',
  evento_id bigint references public.eventi (id) on delete set null,
  opera_id bigint references public.opere (id) on delete set null,
  pagina text check (pagina ~ '^[a-z0-9-]+\.html$'),
  posizione integer not null default 0,
  creato_il timestamptz not null default now(),
  constraint rullino_un_solo_collegamento check (num_nonnulls(evento_id, opera_id, pagina) <= 1)
);

comment on table public.rullino is
  'Le foto del rullino della home, in ordine di posizione. Le sceglie la redazione dalla gestione.';
comment on column public.rullino.immagine is
  'File del sito (assets/img/…) o percorso nello spazio immagini.';
comment on column public.rullino.descrizione is
  'Testo alternativo della foto.';
comment on column public.rullino.pagina is
  'Per le foto senza evento né corto: la pagina del sito a cui porta il clic.';

create index rullino_posizione on public.rullino (posizione);

alter table public.rullino enable row level security;

create policy "Lettura: tutti"
  on public.rullino for select to anon, authenticated
  using (true);

create policy "Inserimento: solo redattori"
  on public.rullino for insert to authenticated
  with check ((select privato.e_redattore()));

create policy "Modifica: solo redattori"
  on public.rullino for update to authenticated
  using ((select privato.e_redattore()))
  with check ((select privato.e_redattore()));

create policy "Eliminazione: solo redattori"
  on public.rullino for delete to authenticated
  using ((select privato.e_redattore()));

grant select on public.rullino to anon;
grant select, insert, update, delete on public.rullino to authenticated, service_role;

-- Il rullino com'era scritto a mano in index.html
insert into public.rullino (immagine, descrizione, evento_id, posizione)
select v.immagine, v.descrizione, e.id, v.posizione
from (values
  (1, 'short-talks-al-not-2026', 'assets/img/eventi/short-talks-al-not-2026/foto-6.jpg', 'Spettatori fra le poltrone del Supercinema'),
  (2, 'long-story-short-2026', 'assets/img/eventi/long-story-short-2026/foto-3.jpg', 'Una troupe al tramonto in riva al mare'),
  (3, 'short-talks-al-not-2025', 'assets/img/eventi/short-talks-al-not-2025/foto-3.jpg', 'Il pubblico in sala'),
  (4, 'long-story-short-2026', 'assets/img/eventi/long-story-short-2026/foto-4.jpg', 'Un operatore prepara la macchina da presa'),
  (5, 'short-talks-2', 'assets/img/eventi/short-talks-2/foto-4.jpg', 'Un biglietto di Short Talks davanti alle poltrone della sala'),
  (6, 'short-talks-off-1', 'assets/img/eventi/short-talks-off-1/foto-2.jpg', 'Un autore risponde alle domande del pubblico'),
  (7, 'blue-hour', 'assets/img/eventi/blue-hour/foto-1.jpg', 'Il pubblico sulla sabbia sotto le lanterne blu'),
  (8, 'short-talks-al-not-2025', 'assets/img/eventi/short-talks-al-not-2025/foto-6.jpg', 'Il pubblico durante il dialogo con gli autori')
) as v (posizione, codice, immagine, descrizione)
join public.eventi e on e.codice = v.codice;
