-- ==========================================================================
-- SCHEMA INIZIALE — opere della Cortoteca, interpreti, eventi, e chi è
-- autorizzato a modificarli.
--
-- Regole di accesso (Row Level Security):
--   - chiunque visiti il sito legge solo ciò che è pubblicato;
--   - i redattori leggono tutto, bozze comprese, e possono scrivere;
--   - qualsiasi altro account, anche se autenticato, non scrive nulla.
-- Distinguere i redattori dagli altri account serve già ora: le proposte dei
-- soci, in futuro, passeranno da account che non sono redattori.
--
-- I redattori stanno nello schema "privato", che la Data API non espone: si
-- aggiungono dalla dashboard (Table Editor, schema privato) o in SQL con
--   insert into privato.redattori (user_id, nome) values ('<uuid>', 'Nome');
-- dove <uuid> è l'id dell'utente in Authentication → Users.
-- ==========================================================================

create schema if not exists privato;
revoke all on schema privato from public;
grant usage on schema privato to anon, authenticated;

-- --------------------------------------------------------------------------
-- Redattori
-- --------------------------------------------------------------------------
create table privato.redattori (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  creato_il timestamptz not null default now()
);

alter table privato.redattori enable row level security;
revoke all on privato.redattori from anon, authenticated;

-- Vero se chi fa la richiesta è un redattore. security definer perché la
-- tabella dei redattori non è leggibile da anon e authenticated; per anon
-- auth.uid() è nullo e la risposta è sempre falso.
create function privato.e_redattore()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from privato.redattori where user_id = (select auth.uid())
  );
$$;

revoke all on function privato.e_redattore() from public;
grant execute on function privato.e_redattore() to anon, authenticated;

-- Aggiorna modificato_il a ogni modifica di una riga
create function privato.aggiorna_modificato_il()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.modificato_il := now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- Opere (prende il posto di data/film.json)
-- --------------------------------------------------------------------------
create table public.opere (
  id bigint generated always as identity primary key,
  -- Identificativo nell'indirizzo: opera.html?film=<codice>
  codice text not null unique check (codice ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titolo text not null,
  anno smallint not null check (anno between 1900 and 2100),
  regista text not null,
  produzione text,
  -- Prodotta da CDL: logo sulla card, elenco Produzioni, casella in home
  produzione_cdl boolean not null default false,
  generi text[] not null default '{}',
  tagline text,
  sinossi text,
  note_regia text,
  -- Percorso nel bucket "immagini", per esempio opere/quartolivello.jpg
  fotogramma text,
  video_url text,
  letterboxd_url text,
  -- Troupe
  sceneggiatura text,
  produttore text,
  fotografia text,
  montaggio text,
  colonna_sonora text,
  scenografia text,
  trucco text,
  costumi text,
  -- Le nuove opere nascono come bozze: si vedono solo dopo la pubblicazione
  pubblicata boolean not null default false,
  creato_il timestamptz not null default now(),
  modificato_il timestamptz not null default now()
);

comment on table public.opere is
  'Cortometraggi della Cortoteca. Fra due produzioni CDL dello stesso anno, '
  'la più recente è quella inserita per ultima (id più alto).';

create trigger opere_modificato_il
  before update on public.opere
  for each row execute function privato.aggiorna_modificato_il();

-- Cast: una riga per interprete, nell'ordine dato da "posizione"
create table public.interpreti (
  id bigint generated always as identity primary key,
  opera_id bigint not null references public.opere (id) on delete cascade,
  posizione smallint not null check (posizione > 0),
  nome text not null,
  ruolo text,
  unique (opera_id, posizione)
);

-- --------------------------------------------------------------------------
-- Eventi
-- --------------------------------------------------------------------------
create table public.eventi (
  id bigint generated always as identity primary key,
  codice text not null unique check (codice ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titolo text not null,
  data_inizio date not null,
  data_fine date check (data_fine is null or data_fine >= data_inizio),
  luogo text,
  -- Riga breve per le card: date e luogo scritti come vanno mostrati
  riassunto text,
  descrizione text,
  -- Percorsi nel bucket "immagini"
  copertina text,
  miniatura text,
  -- Pagina dedicata dell'evento, se ne ha una (es. longstoryshort.html)
  pagina text,
  pubblicato boolean not null default false,
  creato_il timestamptz not null default now(),
  modificato_il timestamptz not null default now()
);

create trigger eventi_modificato_il
  before update on public.eventi
  for each row execute function privato.aggiorna_modificato_il();

-- Corti nati da un evento (per esempio durante Long Story Short)
create table public.eventi_opere (
  evento_id bigint not null references public.eventi (id) on delete cascade,
  opera_id bigint not null references public.opere (id) on delete cascade,
  primary key (evento_id, opera_id)
);

create index eventi_opere_opera_id_idx on public.eventi_opere (opera_id);

-- --------------------------------------------------------------------------
-- Permessi di base: la Data API vede le tabelle, le righe le filtra la RLS.
-- anon (chi visita il sito) può solo leggere.
-- --------------------------------------------------------------------------
revoke all on public.opere, public.interpreti, public.eventi, public.eventi_opere
  from anon, authenticated;
grant select on public.opere, public.interpreti, public.eventi, public.eventi_opere
  to anon, authenticated;
grant insert, update, delete on public.opere, public.interpreti, public.eventi, public.eventi_opere
  to authenticated;

alter table public.opere enable row level security;
alter table public.interpreti enable row level security;
alter table public.eventi enable row level security;
alter table public.eventi_opere enable row level security;

-- Opere
create policy "Lettura: opere pubblicate, o tutte per i redattori"
  on public.opere for select to anon, authenticated
  using (pubblicata or (select privato.e_redattore()));

create policy "Inserimento: solo redattori"
  on public.opere for insert to authenticated
  with check ((select privato.e_redattore()));

create policy "Modifica: solo redattori"
  on public.opere for update to authenticated
  using ((select privato.e_redattore()))
  with check ((select privato.e_redattore()));

create policy "Eliminazione: solo redattori"
  on public.opere for delete to authenticated
  using ((select privato.e_redattore()));

-- Interpreti: visibili se l'opera è visibile
create policy "Lettura: interpreti di opere pubblicate, o tutti per i redattori"
  on public.interpreti for select to anon, authenticated
  using (
    (select privato.e_redattore())
    or exists (
      select 1 from public.opere o
      where o.id = interpreti.opera_id and o.pubblicata
    )
  );

create policy "Inserimento: solo redattori"
  on public.interpreti for insert to authenticated
  with check ((select privato.e_redattore()));

create policy "Modifica: solo redattori"
  on public.interpreti for update to authenticated
  using ((select privato.e_redattore()))
  with check ((select privato.e_redattore()));

create policy "Eliminazione: solo redattori"
  on public.interpreti for delete to authenticated
  using ((select privato.e_redattore()));

-- Eventi
create policy "Lettura: eventi pubblicati, o tutti per i redattori"
  on public.eventi for select to anon, authenticated
  using (pubblicato or (select privato.e_redattore()));

create policy "Inserimento: solo redattori"
  on public.eventi for insert to authenticated
  with check ((select privato.e_redattore()));

create policy "Modifica: solo redattori"
  on public.eventi for update to authenticated
  using ((select privato.e_redattore()))
  with check ((select privato.e_redattore()));

create policy "Eliminazione: solo redattori"
  on public.eventi for delete to authenticated
  using ((select privato.e_redattore()));

-- Collegamenti evento-opera: visibili se lo sono entrambi
create policy "Lettura: collegamenti fra elementi pubblicati, o tutti per i redattori"
  on public.eventi_opere for select to anon, authenticated
  using (
    (select privato.e_redattore())
    or (
      exists (select 1 from public.eventi e where e.id = eventi_opere.evento_id and e.pubblicato)
      and exists (select 1 from public.opere o where o.id = eventi_opere.opera_id and o.pubblicata)
    )
  );

create policy "Inserimento: solo redattori"
  on public.eventi_opere for insert to authenticated
  with check ((select privato.e_redattore()));

create policy "Eliminazione: solo redattori"
  on public.eventi_opere for delete to authenticated
  using ((select privato.e_redattore()));

-- --------------------------------------------------------------------------
-- Immagini: bucket pubblico in lettura (fotogrammi, copertine), scrittura
-- solo per i redattori. Massimo 5 MB a file, solo formati immagine web.
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('immagini', 'immagini', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Immagini: i redattori le vedono nell'elenco"
  on storage.objects for select to authenticated
  using (bucket_id = 'immagini' and (select privato.e_redattore()));

create policy "Immagini: i redattori le caricano"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'immagini' and (select privato.e_redattore()));

create policy "Immagini: i redattori le sostituiscono"
  on storage.objects for update to authenticated
  using (bucket_id = 'immagini' and (select privato.e_redattore()))
  with check (bucket_id = 'immagini' and (select privato.e_redattore()));

create policy "Immagini: i redattori le eliminano"
  on storage.objects for delete to authenticated
  using (bucket_id = 'immagini' and (select privato.e_redattore()));
