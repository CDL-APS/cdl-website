-- ==========================================================================
-- CORTOTECA, PARTE 1 — soci, inviti e controllo della quota.
--
-- Il libro soci resta sul foglio Google "Gestione APS (fogli)". Uno script
-- dentro il foglio (supabase/foglio/sincronizza-soci.gs) manda qui poche
-- colonne della scheda TESSERATI <anno> chiamando public.sincronizza_soci()
-- con una chiave condivisa. Nel database della chiave c'è solo l'impronta.
--
-- Un socio entra in proponi.html con un collegamento personale creato da un
-- redattore (public.crea_invito): niente password e niente email automatiche.
-- La Edge Function "accesso-socio" scambia il collegamento con una sessione.
--
-- "In regola" = quota pagata per l'anno in corso; fino al sessantesimo
-- giorno dell'anno vale anche quella dell'anno precedente.
--
-- Tutto ciò che riguarda le persone sta nello schema "privato", che la Data
-- API non espone: ci si arriva solo dalle funzioni qui sotto.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Tabelle
-- --------------------------------------------------------------------------
create table privato.impostazioni (
  chiave text primary key,
  valore jsonb not null,
  modificato_il timestamptz not null default now()
);

comment on table privato.impostazioni is
  'Valori di servizio: impronta della chiave di sincronizzazione '
  '(sync_chiave) ed esito dell''ultima sincronizzazione dei soci (sync_soci).';

create table privato.soci (
  anno smallint not null check (anno between 2020 and 2100),
  -- Numero di tessera così com'è nel foglio, per esempio "008"
  numero text not null,
  nome text not null,
  -- Minuscola e senza spazi. Può mancare: quel socio non può ricevere inviti
  email text,
  pagato boolean not null default false,
  data_pagamento date,
  data_tesseramento date,
  sincronizzato_il timestamptz not null default now(),
  -- Valorizzato quando la riga sparisce dal foglio
  rimosso_il timestamptz,
  primary key (anno, numero)
);

create index soci_email_idx on privato.soci (email);

comment on table privato.soci is
  'Copia di servizio della scheda TESSERATI <anno> del foglio soci. La fonte '
  'resta il foglio: questa tabella si riscrive a ogni sincronizzazione.';

create table privato.inviti (
  email text primary key,
  -- SHA-256 del collegamento personale: il collegamento in chiaro non si conserva
  impronta text not null unique,
  creato_il timestamptz not null default now(),
  creato_da uuid references auth.users (id) on delete set null,
  usato_il timestamptz
);

comment on table privato.inviti is
  'Collegamenti personali per proponi.html, uno per socio. Crearne uno nuovo '
  'annulla il precedente.';

-- A chi appartiene un''opera della Cortoteca. Sta qui e non in public.opere
-- perché quella tabella è letta per intero da chiunque visiti il sito.
create table privato.opere_soci (
  opera_id bigint primary key references public.opere (id) on delete cascade,
  email text not null,
  -- Valorizzato quando un redattore nasconde l'opera perché la quota non è
  -- stata rinnovata: serve a riproporla quando il socio torna in regola
  nascosta_per_quota_il timestamptz
);

alter table privato.impostazioni enable row level security;
alter table privato.soci enable row level security;
alter table privato.inviti enable row level security;
alter table privato.opere_soci enable row level security;

revoke all on privato.impostazioni, privato.soci, privato.inviti, privato.opere_soci
  from anon, authenticated;

-- --------------------------------------------------------------------------
-- Funzioni interne
-- --------------------------------------------------------------------------
create function privato.oggi()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Rome')::date;
$$;

create function privato.impronta(p_testo text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(p_testo, 'UTF8')), 'hex');
$$;

create function privato.normalizza_email(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(lower(btrim(p_email)), '');
$$;

-- Giorni dall'inizio dell'anno in cui vale ancora la quota dell'anno prima
create function privato.giorni_tolleranza()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 60;
$$;

create function privato.email_in_regola(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from privato.soci s
    where s.email = privato.normalizza_email(p_email)
      and s.pagato
      and s.rimosso_il is null
      and (
        s.anno = extract(year from privato.oggi())
        or (
          s.anno = extract(year from privato.oggi()) - 1
          and privato.oggi() < make_date(extract(year from privato.oggi())::int, 1, 1)
                               + privato.giorni_tolleranza()
        )
      )
  );
$$;

-- Email dell'utente che fa la richiesta
create function privato.email_utente()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select privato.normalizza_email(u.email)
  from auth.users u
  where u.id = (select auth.uid());
$$;

-- Riga più recente del libro soci per un indirizzo
create function privato.socio_di(p_email text)
returns privato.soci
language sql
stable
security definer
set search_path = ''
as $$
  select s
  from privato.soci s
  where s.email = privato.normalizza_email(p_email)
    and s.rimosso_il is null
  order by s.anno desc
  limit 1;
$$;

revoke all on function
  privato.oggi(), privato.impronta(text), privato.normalizza_email(text),
  privato.giorni_tolleranza(), privato.email_in_regola(text),
  privato.email_utente(), privato.socio_di(text)
  from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- Per il socio: chi sono e se sono in regola
-- --------------------------------------------------------------------------
create function public.stato_socio()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_email text := privato.email_utente();
  v_socio privato.soci;
begin
  if v_email is null then
    raise exception 'Accesso richiesto' using errcode = '42501';
  end if;
  v_socio := privato.socio_di(v_email);
  return jsonb_build_object(
    'email', v_email,
    'socio', v_socio.numero is not null,
    'nome', v_socio.nome,
    'numero', v_socio.numero,
    'anno', v_socio.anno,
    'in_regola', privato.email_in_regola(v_email),
    'anno_corrente', extract(year from privato.oggi())
  );
end;
$$;

revoke all on function public.stato_socio() from public, anon;
grant execute on function public.stato_socio() to authenticated;

-- --------------------------------------------------------------------------
-- Per i redattori: elenco dei soci, inviti, esito della sincronizzazione
-- --------------------------------------------------------------------------
create function public.elenco_soci()
returns table (
  anno smallint,
  numero text,
  nome text,
  email text,
  pagato boolean,
  data_pagamento date,
  in_regola boolean,
  invito_creato_il timestamptz,
  ultimo_accesso timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  return query
    select s.anno, s.numero, s.nome, s.email, s.pagato, s.data_pagamento,
           coalesce(privato.email_in_regola(s.email), false),
           i.creato_il, i.usato_il
    from privato.soci s
    left join privato.inviti i on i.email = s.email
    where s.rimosso_il is null
      and (
        s.anno = extract(year from privato.oggi())
        -- dell'anno prima, solo chi non ha ancora una riga quest'anno
        or (
          s.anno = extract(year from privato.oggi()) - 1
          and not exists (
            select 1 from privato.soci n
            where n.anno = s.anno + 1 and n.rimosso_il is null
              and (n.email = s.email or n.nome = s.nome)
          )
        )
      )
    order by s.anno desc, s.numero;
end;
$$;

revoke all on function public.elenco_soci() from public, anon;
grant execute on function public.elenco_soci() to authenticated;

-- Crea (o rigenera) il collegamento personale di un socio e lo restituisce
-- una volta sola: nel database resta l'impronta.
create function public.crea_invito(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := privato.normalizza_email(p_email);
  v_segreto text;
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  if v_email is null or (privato.socio_di(v_email)).numero is null then
    raise exception 'Nessun socio con questo indirizzo' using errcode = '22023';
  end if;

  v_segreto := encode(extensions.gen_random_bytes(32), 'hex');

  insert into privato.inviti (email, impronta, creato_da)
  values (v_email, privato.impronta(v_segreto), (select auth.uid()))
  on conflict (email) do update
    set impronta = excluded.impronta,
        creato_il = now(),
        creato_da = excluded.creato_da,
        usato_il = null;

  return v_segreto;
end;
$$;

revoke all on function public.crea_invito(text) from public, anon;
grant execute on function public.crea_invito(text) to authenticated;

-- Solo per la Edge Function "accesso-socio" (chiave segreta): dato un
-- collegamento, dice a quale socio appartiene.
create function public.verifica_invito(p_segreto text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_socio privato.soci;
begin
  update privato.inviti
    set usato_il = now()
    where impronta = privato.impronta(p_segreto)
    returning email into v_email;

  if v_email is null then
    return null;
  end if;

  v_socio := privato.socio_di(v_email);
  if v_socio.numero is null then
    return null;
  end if;

  return jsonb_build_object('email', v_email, 'nome', v_socio.nome);
end;
$$;

revoke all on function public.verifica_invito(text) from public, anon, authenticated;
grant execute on function public.verifica_invito(text) to service_role;

-- --------------------------------------------------------------------------
-- Sincronizzazione dal foglio. La chiama lo script del foglio con la chiave
-- pubblica del sito più la chiave condivisa: senza quella non fa nulla.
-- p_righe: [{ "numero", "nome", "email", "pagato", "data_pagamento",
--             "data_tesseramento" }], date in formato AAAA-MM-GG.
-- --------------------------------------------------------------------------
create function public.sincronizza_soci(p_chiave text, p_anno integer, p_righe jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attesa text;
  v_riga jsonb;
  v_numero text;
  v_nome text;
  v_email text;
  v_numeri text[] := '{}';
  v_senza_email text[] := '{}';
  v_scartate integer := 0;
  v_rimossi integer;
  v_esito jsonb;
begin
  select valore ->> 'impronta' into v_attesa
  from privato.impostazioni where chiave = 'sync_chiave';

  if v_attesa is null or p_chiave is null
     or privato.impronta(p_chiave) <> v_attesa then
    raise exception 'Chiave di sincronizzazione non valida' using errcode = '42501';
  end if;

  if p_anno is null
     or abs(p_anno - extract(year from privato.oggi())::int) > 1 then
    raise exception 'Anno non valido: %', p_anno using errcode = '22023';
  end if;

  if jsonb_typeof(p_righe) <> 'array' or jsonb_array_length(p_righe) = 0 then
    raise exception 'Nessuna riga: la sincronizzazione non cancella l''elenco' using errcode = '22023';
  end if;

  for v_riga in select * from jsonb_array_elements(p_righe) loop
    v_numero := nullif(btrim(v_riga ->> 'numero'), '');
    v_nome := nullif(btrim(v_riga ->> 'nome'), '');
    if v_numero is null or v_nome is null then
      v_scartate := v_scartate + 1;
      continue;
    end if;

    v_email := privato.normalizza_email(v_riga ->> 'email');
    if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      v_email := null;
    end if;
    if v_email is null then
      v_senza_email := v_senza_email || (v_numero || ' ' || v_nome);
    end if;

    insert into privato.soci
      (anno, numero, nome, email, pagato, data_pagamento, data_tesseramento,
       sincronizzato_il, rimosso_il)
    values
      (p_anno, v_numero, v_nome, v_email,
       coalesce((v_riga ->> 'pagato')::boolean, false),
       nullif(v_riga ->> 'data_pagamento', '')::date,
       nullif(v_riga ->> 'data_tesseramento', '')::date,
       now(), null)
    on conflict (anno, numero) do update
      set nome = excluded.nome,
          email = excluded.email,
          pagato = excluded.pagato,
          data_pagamento = excluded.data_pagamento,
          data_tesseramento = excluded.data_tesseramento,
          sincronizzato_il = excluded.sincronizzato_il,
          rimosso_il = null;

    v_numeri := v_numeri || v_numero;
  end loop;

  update privato.soci
    set rimosso_il = now()
    where anno = p_anno and rimosso_il is null and numero <> all (v_numeri);
  get diagnostics v_rimossi = row_count;

  v_esito := jsonb_build_object(
    'anno', p_anno,
    'quando', now(),
    'righe', coalesce(array_length(v_numeri, 1), 0),
    'scartate', v_scartate,
    'senza_email', to_jsonb(v_senza_email),
    'rimossi', v_rimossi
  );

  insert into privato.impostazioni (chiave, valore)
  values ('sync_soci', v_esito)
  on conflict (chiave) do update set valore = excluded.valore, modificato_il = now();

  return v_esito;
end;
$$;

revoke all on function public.sincronizza_soci(text, integer, jsonb) from public;
grant execute on function public.sincronizza_soci(text, integer, jsonb) to anon, authenticated, service_role;
