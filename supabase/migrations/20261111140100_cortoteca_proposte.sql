-- ==========================================================================
-- CORTOTECA, PARTE 2 — proposte dei soci, licenze, avvisi per i redattori.
--
-- Una proposta è la scheda di un corto compilata dal socio. Il suo contenuto
-- sta in "dati", un JSON con la stessa forma di public.opere più "interpreti"
-- (elenco di { nome, ruolo }) e "file_url" (dove prendere il file, per chi
-- non ha il video online). La validazione stretta avviene all'approvazione,
-- quando i dati entrano in public.opere e valgono i suoi vincoli.
--
-- Stati:  bozza → inviata ⇄ da_rivedere → approvata | rifiutata
--         ritirata (dal socio, in ogni momento)
-- Lo stato non si scrive mai direttamente: lo cambiano solo le funzioni qui
-- sotto, che controllano chi le chiama.
--
-- Le licenze sono un registro: si aggiungono, non si modificano. L'unico
-- cambiamento ammesso è la revoca, che valorizza revocata_il.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Proposte
-- --------------------------------------------------------------------------
create table public.proposte (
  id bigint generated always as identity primary key,
  autore uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stato text not null default 'bozza'
    check (stato in ('bozza', 'inviata', 'da_rivedere', 'approvata', 'rifiutata', 'ritirata')),
  dati jsonb not null default '{}'
    check (jsonb_typeof(dati) = 'object' and pg_column_size(dati) < 200000),
  -- Messaggio del redattore al socio (richiesta di modifiche, motivo del rifiuto)
  nota_revisione text,
  opera_id bigint references public.opere (id) on delete set null,
  inviata_il timestamptz,
  decisa_il timestamptz,
  decisa_da uuid references auth.users (id) on delete set null,
  creato_il timestamptz not null default now(),
  modificato_il timestamptz not null default now()
);

create index proposte_autore_idx on public.proposte (autore);
create index proposte_stato_idx on public.proposte (stato);

create trigger proposte_modificato_il
  before update on public.proposte
  for each row execute function privato.aggiorna_modificato_il();

-- Quante proposte ha già un utente: serve alla regola di inserimento, che non
-- può interrogare la propria tabella senza ricorsione
create function privato.numero_proposte(p_utente uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.proposte where autore = p_utente;
$$;

revoke all on function privato.numero_proposte(uuid) from public, anon;
grant execute on function privato.numero_proposte(uuid) to authenticated;

-- Il socio scrive solo "dati": autore e stato prendono i valori predefiniti
revoke all on public.proposte from anon, authenticated;
grant select, delete on public.proposte to authenticated;
grant insert (dati), update (dati) on public.proposte to authenticated;
grant select, insert, update, delete on public.proposte to service_role;

alter table public.proposte enable row level security;

create policy "Lettura: le proprie proposte, o tutte per i redattori"
  on public.proposte for select to authenticated
  using (autore = (select auth.uid()) or (select privato.e_redattore()));

create policy "Inserimento: bozze proprie, al massimo trenta"
  on public.proposte for insert to authenticated
  with check (
    autore = (select auth.uid())
    and stato = 'bozza'
    and (select privato.numero_proposte((select auth.uid()))) < 30
  );

create policy "Modifica: le proprie, finché sono bozze o da rivedere"
  on public.proposte for update to authenticated
  using (autore = (select auth.uid()) and stato in ('bozza', 'da_rivedere'))
  with check (autore = (select auth.uid()) and stato in ('bozza', 'da_rivedere'));

create policy "Eliminazione: le proprie bozze"
  on public.proposte for delete to authenticated
  using (autore = (select auth.uid()) and stato = 'bozza');

-- --------------------------------------------------------------------------
-- Testi di licenza e registro delle accettazioni
-- --------------------------------------------------------------------------
create table public.testi_licenza (
  versione text primary key,
  testo text not null,
  sha256 text not null,
  in_vigore_dal timestamptz not null default now()
);

comment on table public.testi_licenza is
  'Versioni del testo di licenza della Cortoteca. Vale l''ultima per data. '
  'Un testo non si corregge: se cambia, si aggiunge una versione.';

revoke all on public.testi_licenza from anon, authenticated;
grant select on public.testi_licenza to anon, authenticated;
grant select, insert, update, delete on public.testi_licenza to service_role;

alter table public.testi_licenza enable row level security;

create policy "Lettura: i testi di licenza sono pubblici"
  on public.testi_licenza for select to anon, authenticated
  using (true);

create table public.licenze (
  id bigint generated always as identity primary key,
  proposta_id bigint references public.proposte (id) on delete set null,
  opera_id bigint references public.opere (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  -- Fotografia dei dati al momento dell'accettazione
  titolo_opera text not null,
  nome_dichiarato text not null,
  email text not null,
  numero_tessera text,
  anno_tessera smallint,
  versione_testo text not null references public.testi_licenza (versione),
  sha256_testo text not null,
  risposte jsonb not null,
  uso_promozionale boolean not null default false,
  accettata_il timestamptz not null default now(),
  ip text,
  user_agent text,
  revocata_il timestamptz
);

create index licenze_user_idx on public.licenze (user_id);
create index licenze_opera_idx on public.licenze (opera_id);
create index licenze_proposta_idx on public.licenze (proposta_id);

comment on table public.licenze is
  'Registro delle licenze accettate dai soci. Nessuno scrive dalla Data API: '
  'le righe nascono in invia_proposta() e accetta_licenza_opera(), e cambiano '
  'solo con revoca_licenza().';

revoke all on public.licenze from anon, authenticated;
grant select on public.licenze to authenticated;
grant select, insert, update, delete on public.licenze to service_role;

alter table public.licenze enable row level security;

create policy "Lettura: le proprie licenze, o tutte per i redattori"
  on public.licenze for select to authenticated
  using (user_id = (select auth.uid()) or (select privato.e_redattore()));

-- --------------------------------------------------------------------------
-- Fotogrammi delle proposte: spazio privato, una cartella per utente. Lo
-- spazio pubblico "immagini" resta scrivibile solo dai redattori, che vi
-- copiano il fotogramma al momento dell'approvazione.
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proposte', 'proposte', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Proposte: ognuno vede i propri file, i redattori tutti"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'proposte'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select privato.e_redattore()))
  );

create policy "Proposte: ognuno carica nella propria cartella"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'proposte' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Proposte: ognuno elimina i propri file"
  on storage.objects for delete to authenticated
  using (bucket_id = 'proposte' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- --------------------------------------------------------------------------
-- Registrazione di una licenza (interna)
-- --------------------------------------------------------------------------
create function privato.registra_licenza(
  p_proposta_id bigint,
  p_opera_id bigint,
  p_titolo text,
  p_nome text,
  p_risposte jsonb,
  p_consensi jsonb,
  p_versione text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := privato.email_utente();
  v_socio privato.soci := privato.socio_di(v_email);
  v_testo public.testi_licenza;
  v_intestazioni jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  v_id bigint;
begin
  select * into v_testo
  from public.testi_licenza
  where in_vigore_dal <= now()
  order by in_vigore_dal desc
  limit 1;

  if v_testo.versione is null then
    raise exception 'Nessun testo di licenza in vigore' using errcode = '55000';
  end if;
  if p_versione is distinct from v_testo.versione then
    raise exception 'Il testo della licenza è cambiato: ricarica la pagina e rileggilo'
      using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_nome, ''))) < 5 then
    raise exception 'Scrivi nome e cognome per esteso' using errcode = '22023';
  end if;
  if not coalesce((p_consensi ->> 'licenza')::boolean, false)
     or not coalesce((p_consensi ->> 'dichiarazioni')::boolean, false)
     or not coalesce((p_consensi ->> 'informativa')::boolean, false) then
    raise exception 'Mancano le accettazioni obbligatorie' using errcode = '22023';
  end if;
  if jsonb_typeof(p_risposte) is distinct from 'object'
     or coalesce(p_risposte ->> 'veste', '') not in ('produttore', 'coproduttore', 'autorizzato')
     or jsonb_typeof(p_risposte -> 'musica') is distinct from 'array'
     or jsonb_array_length(p_risposte -> 'musica') = 0
     or not coalesce((p_risposte ->> 'interpreti_consenso')::boolean, false)
     or coalesce(p_risposte ->> 'minori', '') not in ('no', 'si_con_consenso') then
    raise exception 'Il questionario sui diritti non è completo' using errcode = '22023';
  end if;

  insert into public.licenze
    (proposta_id, opera_id, user_id, titolo_opera, nome_dichiarato, email,
     numero_tessera, anno_tessera, versione_testo, sha256_testo, risposte,
     uso_promozionale, ip, user_agent)
  values
    (p_proposta_id, p_opera_id, (select auth.uid()), p_titolo, btrim(p_nome), v_email,
     v_socio.numero, v_socio.anno, v_testo.versione, v_testo.sha256, p_risposte,
     coalesce((p_consensi ->> 'promozionale')::boolean, false),
     coalesce(v_intestazioni ->> 'cf-connecting-ip',
              nullif(btrim(split_part(v_intestazioni ->> 'x-forwarded-for', ',', 1)), ''),
              v_intestazioni ->> 'x-real-ip'),
     left(v_intestazioni ->> 'user-agent', 500))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function privato.registra_licenza(bigint, bigint, text, text, jsonb, jsonb, text)
  from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- Per il socio
-- --------------------------------------------------------------------------

-- Invia una proposta. Alla prima volta registra la licenza; a un nuovo invio
-- dopo una richiesta di modifiche la licenza già accettata resta valida, se
-- il testo in vigore è lo stesso (in quel caso i parametri p_ possono mancare).
create function public.invia_proposta(
  p_id bigint,
  p_nome text default null,
  p_risposte jsonb default null,
  p_consensi jsonb default null,
  p_versione text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposta public.proposte;
  v_dati jsonb;
  v_licenza bigint;
  v_anno integer;
begin
  select * into v_proposta
  from public.proposte
  where id = p_id and autore = (select auth.uid())
  for update;

  if v_proposta.id is null then
    raise exception 'Proposta non trovata' using errcode = '42501';
  end if;
  if v_proposta.stato not in ('bozza', 'da_rivedere') then
    raise exception 'Questa proposta è già stata inviata' using errcode = '55000';
  end if;
  if not privato.email_in_regola(privato.email_utente()) then
    raise exception 'La quota associativa di quest''anno non risulta pagata' using errcode = '42501';
  end if;

  v_dati := v_proposta.dati;
  v_anno := nullif(v_dati ->> 'anno', '')::integer;
  if coalesce(btrim(v_dati ->> 'titolo'), '') = ''
     or coalesce(btrim(v_dati ->> 'regista'), '') = ''
     or v_anno is null or v_anno not between 1900 and 2100
     or coalesce(btrim(v_dati ->> 'sinossi'), '') = ''
     or coalesce(btrim(v_dati ->> 'fotogramma'), '') = ''
     or (coalesce(v_dati ->> 'video_url', '') !~* '^https?://'
         and coalesce(v_dati ->> 'file_url', '') !~* '^https?://') then
    raise exception 'Mancano dati obbligatori: titolo, anno, regia, sinossi, fotogramma e un collegamento al video'
      using errcode = '22023';
  end if;

  -- Licenza già accettata per questa proposta sul testo oggi in vigore
  select l.id into v_licenza
  from public.licenze l
  where l.proposta_id = p_id and l.revocata_il is null
    and l.versione_testo = (
      select t.versione from public.testi_licenza t
      where t.in_vigore_dal <= now()
      order by t.in_vigore_dal desc limit 1
    )
  order by l.accettata_il desc
  limit 1;

  if v_licenza is null then
    v_licenza := privato.registra_licenza(
      p_id, null, v_dati ->> 'titolo', p_nome, p_risposte, p_consensi, p_versione);
  end if;

  update public.proposte
    set stato = 'inviata', inviata_il = now(), nota_revisione = null
    where id = p_id;

  return jsonb_build_object('licenza_id', v_licenza);
end;
$$;

revoke all on function public.invia_proposta(bigint, text, jsonb, jsonb, text) from public, anon;
grant execute on function public.invia_proposta(bigint, text, jsonb, jsonb, text) to authenticated;

-- Opere già in Cortoteca attribuite a chi chiama, con la loro licenza attiva
create function public.le_mie_opere()
returns table (
  opera_id bigint,
  codice text,
  titolo text,
  anno smallint,
  pubblicata boolean,
  licenza_id bigint,
  licenza_del timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, o.codice, o.titolo, o.anno, o.pubblicata, l.id, l.accettata_il
  from privato.opere_soci os
  join public.opere o on o.id = os.opera_id
  left join lateral (
    select x.id, x.accettata_il
    from public.licenze x
    where x.opera_id = o.id and x.revocata_il is null
    order by x.accettata_il desc
    limit 1
  ) l on true
  where os.email = privato.email_utente()
  order by o.anno desc, o.id desc;
$$;

revoke all on function public.le_mie_opere() from public, anon;
grant execute on function public.le_mie_opere() to authenticated;

-- Licenza per un'opera pubblicata prima che esistesse il registro: il socio
-- a cui un redattore l'ha attribuita la accetta senza rifare la scheda.
create function public.accetta_licenza_opera(
  p_opera_id bigint,
  p_nome text,
  p_risposte jsonb,
  p_consensi jsonb,
  p_versione text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titolo text;
begin
  select o.titolo into v_titolo
  from privato.opere_soci os
  join public.opere o on o.id = os.opera_id
  where os.opera_id = p_opera_id and os.email = privato.email_utente();

  if v_titolo is null then
    raise exception 'Quest''opera non risulta tua' using errcode = '42501';
  end if;
  if exists (select 1 from public.licenze where opera_id = p_opera_id and revocata_il is null) then
    raise exception 'Per quest''opera c''è già una licenza attiva' using errcode = '55000';
  end if;
  if not privato.email_in_regola(privato.email_utente()) then
    raise exception 'La quota associativa di quest''anno non risulta pagata' using errcode = '42501';
  end if;

  return privato.registra_licenza(null, p_opera_id, v_titolo, p_nome, p_risposte, p_consensi, p_versione);
end;
$$;

revoke all on function public.accetta_licenza_opera(bigint, text, jsonb, jsonb, text) from public, anon;
grant execute on function public.accetta_licenza_opera(bigint, text, jsonb, jsonb, text) to authenticated;

-- Revoca: l'opera esce subito dalla Cortoteca e la proposta risulta ritirata
create function public.revoca_licenza(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_licenza public.licenze;
begin
  update public.licenze
    set revocata_il = now()
    where id = p_id and user_id = (select auth.uid()) and revocata_il is null
    returning * into v_licenza;

  if v_licenza.id is null then
    raise exception 'Licenza non trovata o già revocata' using errcode = '42501';
  end if;

  if v_licenza.opera_id is not null then
    update public.opere set pubblicata = false where id = v_licenza.opera_id;
  end if;
  if v_licenza.proposta_id is not null then
    update public.proposte
      set stato = 'ritirata', decisa_il = now()
      where id = v_licenza.proposta_id;
  end if;
end;
$$;

revoke all on function public.revoca_licenza(bigint) from public, anon;
grant execute on function public.revoca_licenza(bigint) to authenticated;

-- Ritiro di una proposta inviata e non ancora pubblicata
create function public.ritira_proposta(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.proposte
    set stato = 'ritirata', decisa_il = now()
    where id = p_id and autore = (select auth.uid())
      and stato in ('inviata', 'da_rivedere', 'rifiutata');

  if not found then
    raise exception 'Proposta non trovata, o già pubblicata: in quel caso revoca la licenza'
      using errcode = '42501';
  end if;

  update public.licenze
    set revocata_il = now()
    where proposta_id = p_id and revocata_il is null;
end;
$$;

revoke all on function public.ritira_proposta(bigint) from public, anon;
grant execute on function public.ritira_proposta(bigint) to authenticated;

-- --------------------------------------------------------------------------
-- Per i redattori
-- --------------------------------------------------------------------------

-- Elenco delle proposte con ciò che serve alla revisione: chi è il socio,
-- se è in regola, quale licenza ha accettato
create function public.proposte_da_rivedere()
returns table (
  id bigint,
  stato text,
  dati jsonb,
  nota_revisione text,
  opera_id bigint,
  inviata_il timestamptz,
  autore uuid,
  socio_nome text,
  socio_email text,
  socio_numero text,
  socio_anno smallint,
  socio_pagato_il date,
  socio_in_regola boolean,
  licenza jsonb
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
    select p.id, p.stato, p.dati, p.nota_revisione, p.opera_id, p.inviata_il, p.autore,
           s.nome, privato.normalizza_email(u.email), s.numero, s.anno, s.data_pagamento,
           coalesce(privato.email_in_regola(u.email), false),
           (select to_jsonb(l) from public.licenze l
             where l.proposta_id = p.id
             order by l.accettata_il desc limit 1)
    from public.proposte p
    join auth.users u on u.id = p.autore
    left join lateral privato.socio_di(u.email) s on true
    where p.stato <> 'bozza'
    order by (p.stato = 'inviata') desc, p.inviata_il desc nulls last;
end;
$$;

revoke all on function public.proposte_da_rivedere() from public, anon;
grant execute on function public.proposte_da_rivedere() to authenticated;

create function public.chiedi_modifiche(p_id bigint, p_nota text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  if coalesce(btrim(p_nota), '') = '' then
    raise exception 'Scrivi al socio che cosa deve correggere' using errcode = '22023';
  end if;
  update public.proposte
    set stato = 'da_rivedere', nota_revisione = btrim(p_nota),
        decisa_il = now(), decisa_da = (select auth.uid())
    where id = p_id and stato = 'inviata';
  if not found then
    raise exception 'La proposta non è in attesa di revisione' using errcode = '55000';
  end if;
end;
$$;

create function public.rifiuta_proposta(p_id bigint, p_nota text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  if coalesce(btrim(p_nota), '') = '' then
    raise exception 'Indica il motivo del rifiuto' using errcode = '22023';
  end if;
  update public.proposte
    set stato = 'rifiutata', nota_revisione = btrim(p_nota),
        decisa_il = now(), decisa_da = (select auth.uid())
    where id = p_id and stato = 'inviata';
  if not found then
    raise exception 'La proposta non è in attesa di revisione' using errcode = '55000';
  end if;
  update public.licenze set revocata_il = now()
    where proposta_id = p_id and revocata_il is null;
end;
$$;

-- Approva: crea l'opera e il cast in un'unica transazione, collega licenza e
-- socio. p_opera ha i campi di public.opere così come il redattore li ha
-- rivisti (codice e fotogramma compresi: il fotogramma è già stato copiato
-- nello spazio pubblico dalla pagina di gestione).
create function public.approva_proposta(p_id bigint, p_opera jsonb, p_interpreti jsonb default '[]')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposta public.proposte;
  v_email text;
  v_o public.opere;
  v_opera_id bigint;
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;

  select * into v_proposta from public.proposte where id = p_id for update;
  if v_proposta.id is null or v_proposta.stato <> 'inviata' then
    raise exception 'La proposta non è in attesa di revisione' using errcode = '55000';
  end if;

  select privato.normalizza_email(u.email) into v_email
  from auth.users u where u.id = v_proposta.autore;

  if not exists (
    select 1 from public.licenze where proposta_id = p_id and revocata_il is null
  ) then
    raise exception 'Manca la licenza: la proposta non può essere pubblicata' using errcode = '55000';
  end if;
  if not privato.email_in_regola(v_email) then
    raise exception 'Il socio non risulta in regola con la quota: aggiorna il foglio dei soci e riprova'
      using errcode = '55000';
  end if;

  v_o := jsonb_populate_record(null::public.opere, p_opera);

  insert into public.opere
    (codice, titolo, anno, durata, regista, produzione, produzione_cdl,
     collaborazione_cdl, generi, tagline, sinossi, note_regia, fotogramma,
     video_url, letterboxd_url, sceneggiatura, produttore, fotografia,
     montaggio, colonna_sonora, scenografia, trucco, costumi, pubblicata)
  values
    (v_o.codice, v_o.titolo, v_o.anno, v_o.durata, v_o.regista, v_o.produzione,
     coalesce(v_o.produzione_cdl, false), coalesce(v_o.collaborazione_cdl, false),
     coalesce(v_o.generi, '{}'), v_o.tagline, v_o.sinossi, v_o.note_regia,
     v_o.fotogramma, v_o.video_url, v_o.letterboxd_url, v_o.sceneggiatura,
     v_o.produttore, v_o.fotografia, v_o.montaggio, v_o.colonna_sonora,
     v_o.scenografia, v_o.trucco, v_o.costumi, coalesce(v_o.pubblicata, true))
  returning id into v_opera_id;

  insert into public.interpreti (opera_id, posizione, nome, ruolo)
  select v_opera_id, i.posizione::smallint, btrim(i.voce ->> 'nome'), nullif(btrim(i.voce ->> 'ruolo'), '')
  from jsonb_array_elements(coalesce(p_interpreti, '[]'::jsonb)) with ordinality as i (voce, posizione)
  where coalesce(btrim(i.voce ->> 'nome'), '') <> '';

  update public.proposte
    set stato = 'approvata', opera_id = v_opera_id,
        decisa_il = now(), decisa_da = (select auth.uid()), nota_revisione = null
    where id = p_id;

  update public.licenze set opera_id = v_opera_id
    where proposta_id = p_id and revocata_il is null;

  insert into privato.opere_soci (opera_id, email) values (v_opera_id, v_email);

  return v_o.codice;
end;
$$;

-- Attribuisce a un socio un'opera già in archivio (p_email nullo: toglie
-- l'attribuzione). Serve per le opere pubblicate prima del registro.
create function public.assegna_socio(p_opera_id bigint, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := privato.normalizza_email(p_email);
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  if v_email is null then
    delete from privato.opere_soci where opera_id = p_opera_id;
    return;
  end if;
  if (privato.socio_di(v_email)).numero is null then
    raise exception 'Nessun socio con questo indirizzo' using errcode = '22023';
  end if;
  insert into privato.opere_soci (opera_id, email) values (p_opera_id, v_email)
  on conflict (opera_id) do update set email = excluded.email, nascosta_per_quota_il = null;
end;
$$;

-- Socio a cui è attribuita ogni opera, per l'elenco e il modulo di gestione
create function public.opere_titolari()
returns table (opera_id bigint, email text, nome text, in_regola boolean, licenza_attiva boolean)
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
    select os.opera_id, os.email, s.nome,
           coalesce(privato.email_in_regola(os.email), false),
           exists (select 1 from public.licenze l where l.opera_id = os.opera_id and l.revocata_il is null)
    from privato.opere_soci os
    left join lateral privato.socio_di(os.email) s on true;
end;
$$;

-- Nasconde un'opera perché il socio non ha rinnovato la quota, e se ne
-- ricorda: quando il socio torna in regola gli avvisi propongono di
-- ripubblicarla.
create function public.nascondi_per_quota(p_opera_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  update privato.opere_soci set nascosta_per_quota_il = now() where opera_id = p_opera_id;
  if not found then
    raise exception 'Quest''opera non è attribuita a un socio' using errcode = '22023';
  end if;
  update public.opere set pubblicata = false where id = p_opera_id;
end;
$$;

create function public.ripubblica_opera(p_opera_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  update privato.opere_soci set nascosta_per_quota_il = null where opera_id = p_opera_id;
  update public.opere set pubblicata = true where id = p_opera_id;
end;
$$;

revoke all on function
  public.chiedi_modifiche(bigint, text), public.rifiuta_proposta(bigint, text),
  public.approva_proposta(bigint, jsonb, jsonb), public.assegna_socio(bigint, text),
  public.opere_titolari(), public.nascondi_per_quota(bigint), public.ripubblica_opera(bigint)
  from public, anon;
grant execute on function
  public.chiedi_modifiche(bigint, text), public.rifiuta_proposta(bigint, text),
  public.approva_proposta(bigint, jsonb, jsonb), public.assegna_socio(bigint, text),
  public.opere_titolari(), public.nascondi_per_quota(bigint), public.ripubblica_opera(bigint)
  to authenticated;

-- --------------------------------------------------------------------------
-- Avvisi: ciò che richiede l'attenzione del direttivo
-- --------------------------------------------------------------------------
create function privato.riepilogo_avvisi()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'sincronizzazione', (
      select coalesce(i.valore, '{}'::jsonb)
             || jsonb_build_object('vecchia', i.valore is null
                  or (i.valore ->> 'quando')::timestamptz < now() - interval '2 days')
      from (select 1) uno
      left join privato.impostazioni i on i.chiave = 'sync_soci'
    ),
    'proposte_in_attesa', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', p.id, 'titolo', p.dati ->> 'titolo', 'inviata_il', p.inviata_il) order by p.inviata_il), '[]'::jsonb)
      from public.proposte p where p.stato = 'inviata'
    ),
    'non_in_regola', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'opera_id', o.id, 'titolo', o.titolo, 'socio', coalesce(s.nome, os.email)) order by o.titolo), '[]'::jsonb)
      from privato.opere_soci os
      join public.opere o on o.id = os.opera_id and o.pubblicata
      left join lateral privato.socio_di(os.email) s on true
      where not privato.email_in_regola(os.email)
    ),
    'da_ripubblicare', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'opera_id', o.id, 'titolo', o.titolo, 'socio', coalesce(s.nome, os.email)) order by o.titolo), '[]'::jsonb)
      from privato.opere_soci os
      join public.opere o on o.id = os.opera_id and not o.pubblicata
      left join lateral privato.socio_di(os.email) s on true
      where os.nascosta_per_quota_il is not null
        and privato.email_in_regola(os.email)
        and exists (select 1 from public.licenze l where l.opera_id = o.id and l.revocata_il is null)
    ),
    'senza_licenza', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'opera_id', o.id, 'titolo', o.titolo, 'socio', s.nome) order by o.titolo), '[]'::jsonb)
      from public.opere o
      left join privato.opere_soci os on os.opera_id = o.id
      left join lateral privato.socio_di(os.email) s on true
      where o.pubblicata and not o.produzione_cdl
        and not exists (select 1 from public.licenze l where l.opera_id = o.id and l.revocata_il is null)
    ),
    'revoche_recenti', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'titolo', l.titolo_opera, 'socio', l.nome_dichiarato, 'quando', l.revocata_il) order by l.revocata_il desc), '[]'::jsonb)
      from public.licenze l
      where l.revocata_il > now() - interval '30 days'
    )
  );
$$;

revoke all on function privato.riepilogo_avvisi() from public, anon, authenticated;

create function public.avvisi()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  return privato.riepilogo_avvisi();
end;
$$;

revoke all on function public.avvisi() from public, anon;
grant execute on function public.avvisi() to authenticated;

-- Gli stessi avvisi per lo script del foglio, che li manda per email al
-- direttivo quando cambiano. Richiede la chiave di sincronizzazione.
create function public.avvisi_per_foglio(p_chiave text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_attesa text;
begin
  select valore ->> 'impronta' into v_attesa
  from privato.impostazioni where chiave = 'sync_chiave';
  if v_attesa is null or p_chiave is null or privato.impronta(p_chiave) <> v_attesa then
    raise exception 'Chiave di sincronizzazione non valida' using errcode = '42501';
  end if;
  return privato.riepilogo_avvisi();
end;
$$;

revoke all on function public.avvisi_per_foglio(text) from public;
grant execute on function public.avvisi_per_foglio(text) to anon, authenticated, service_role;
