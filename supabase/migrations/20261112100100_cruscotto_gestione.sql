-- ==========================================================================
-- CRUSCOTTO DI GESTIONE — la prima scheda di gestione.html: ciò che è da
-- sistemare, qualche numero e le ultime cose successe.
--
-- Per sapere chi ha modificato un'opera o un evento, le due tabelle
-- ricordano l'ultimo utente che le ha toccate (modificato_da, scritto da un
-- trigger: dalla pagina non si può falsare).
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Chi ha fatto l'ultima modifica
-- --------------------------------------------------------------------------
alter table public.opere add column modificato_da uuid references auth.users (id) on delete set null;
alter table public.eventi add column modificato_da uuid references auth.users (id) on delete set null;

create function privato.segna_autore_modifica()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.modificato_da := (select auth.uid());
  return new;
end;
$$;

create trigger opere_modificato_da
  before insert or update on public.opere
  for each row execute function privato.segna_autore_modifica();

create trigger eventi_modificato_da
  before insert or update on public.eventi
  for each row execute function privato.segna_autore_modifica();

-- Nome da mostrare per un utente: quello dei redattori, il socio, o l'email
create function privato.nome_utente(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select r.nome from privato.redattori r where r.user_id = p_id),
    (select s.nome from auth.users u, lateral privato.socio_di(u.email) s where u.id = p_id),
    (select u.email from auth.users u where u.id = p_id)
  );
$$;

revoke all on function privato.nome_utente(uuid) from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- Avvisi: un'opera senza licenza dice quale le serve
-- --------------------------------------------------------------------------
create or replace function privato.riepilogo_avvisi()
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
        and privato.licenza_valida(o.id)
    ),
    'senza_licenza', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'opera_id', o.id, 'titolo', o.titolo, 'socio', s.nome,
        'serve', case when coalesce(btrim(o.video_url), '') = '' then 'scheda' else 'streaming' end,
        'solo_scheda', exists (select 1 from public.licenze l
                               where l.opera_id = o.id and l.revocata_il is null and l.tipo = 'scheda'))
        order by o.titolo), '[]'::jsonb)
      from public.opere o
      left join privato.opere_soci os on os.opera_id = o.id
      left join lateral privato.socio_di(os.email) s on true
      where o.pubblicata and not o.produzione_cdl
        and not privato.licenza_valida(o.id)
    ),
    'revoche_recenti', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'titolo', l.titolo_opera, 'socio', l.nome_dichiarato, 'quando', l.revocata_il) order by l.revocata_il desc), '[]'::jsonb)
      from public.licenze l
      where l.revocata_il > now() - interval '30 days'
    )
  );
$$;

-- --------------------------------------------------------------------------
-- Cruscotto: numeri e ultime attività, solo per i redattori
-- --------------------------------------------------------------------------
create function public.cruscotto(p_quante integer default 40)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_anno integer := extract(year from privato.oggi())::integer;
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'numeri', jsonb_build_object(
      'opere_online', (select count(*) from public.opere where pubblicata),
      'corti_soci', (select count(*) from public.opere o
                     join privato.opere_soci os on os.opera_id = o.id where o.pubblicata),
      'con_video', (select count(*) from public.opere where pubblicata and coalesce(btrim(video_url), '') <> ''),
      'proposte_in_attesa', (select count(*) from public.proposte where stato = 'inviata'),
      'bozze_soci', (select count(*) from public.proposte where stato in ('bozza', 'da_rivedere')),
      'soci', (select count(*) from privato.soci where anno = v_anno and rimosso_il is null),
      'soci_in_regola', (select count(*) from privato.soci s
                         where s.anno = v_anno and s.rimosso_il is null
                           and privato.email_in_regola(s.email)),
      'collegamenti', (select count(*) from privato.inviti),
      'collegamenti_usati', (select count(*) from privato.inviti where usato_il is not null),
      'eventi_online', (select count(*) from public.eventi where pubblicato)
    ),
    'attivita', (
      select coalesce(jsonb_agg(a order by a.quando desc), '[]'::jsonb)
      from (
        select * from (
          -- Proposte inviate dai soci
          select p.inviata_il as quando, 'proposta' as tipo,
                 privato.nome_utente(p.autore) || ' ha inviato «' || coalesce(p.dati ->> 'titolo', 'senza titolo') || '»' as testo
          from public.proposte p where p.inviata_il is not null
          union all
          -- Decisioni sulle proposte, e ritiri
          select p.decisa_il, 'decisione',
                 case p.stato
                   when 'approvata' then '«' || coalesce(p.dati ->> 'titolo', '') || '» approvata da ' || coalesce(privato.nome_utente(p.decisa_da), 'un redattore')
                   when 'rifiutata' then '«' || coalesce(p.dati ->> 'titolo', '') || '» rifiutata da ' || coalesce(privato.nome_utente(p.decisa_da), 'un redattore')
                   when 'da_rivedere' then 'Chieste modifiche a «' || coalesce(p.dati ->> 'titolo', '') || '» da ' || coalesce(privato.nome_utente(p.decisa_da), 'un redattore')
                   when 'ritirata' then privato.nome_utente(p.autore) || ' ha ritirato la proposta «' || coalesce(p.dati ->> 'titolo', '') || '»'
                 end
          from public.proposte p
          where p.decisa_il is not null and p.stato in ('approvata', 'rifiutata', 'da_rivedere', 'ritirata')
          union all
          -- Licenze accettate e revocate
          select l.accettata_il, 'licenza',
                 l.nome_dichiarato || ' ha accettato ' ||
                 case l.tipo when 'scheda' then 'l''autorizzazione per la scheda' else 'la licenza' end ||
                 ' per «' || l.titolo_opera || '»'
          from public.licenze l
          union all
          select l.revocata_il, 'revoca',
                 l.nome_dichiarato || ' ha revocato ' ||
                 case l.tipo when 'scheda' then 'l''autorizzazione' else 'la licenza' end ||
                 ' per «' || l.titolo_opera || '»'
          from public.licenze l where l.revocata_il is not null
          union all
          -- Collegamenti personali
          select i.creato_il, 'collegamento',
                 'Collegamento personale per ' || coalesce(s.nome, i.email) ||
                 coalesce(', creato da ' || privato.nome_utente(i.creato_da), '')
          from privato.inviti i
          left join lateral privato.socio_di(i.email) s on true
          union all
          -- Opere ed eventi modificati
          select o.modificato_il, 'opera',
                 '«' || o.titolo || '» ' ||
                 case when o.modificato_il - o.creato_il < interval '2 seconds' then 'aggiunta' else 'modificata' end ||
                 coalesce(' da ' || privato.nome_utente(o.modificato_da), '')
          from public.opere o
          union all
          select e.modificato_il, 'evento',
                 'Evento «' || e.titolo || '» ' ||
                 case when e.modificato_il - e.creato_il < interval '2 seconds' then 'aggiunto' else 'modificato' end ||
                 coalesce(' da ' || privato.nome_utente(e.modificato_da), '')
          from public.eventi e
          union all
          -- Opere nascoste per la quota
          select os.nascosta_per_quota_il, 'quota',
                 '«' || o.titolo || '» nascosta: quota non rinnovata'
          from privato.opere_soci os join public.opere o on o.id = os.opera_id
          where os.nascosta_per_quota_il is not null
          union all
          -- Ultima sincronizzazione del foglio dei soci
          select (i.valore ->> 'quando')::timestamptz, 'foglio',
                 'Foglio dei soci sincronizzato' || coalesce(': ' || (i.valore ->> 'righe') || ' soci del ' || (i.valore ->> 'anno'), '')
          from privato.impostazioni i where i.chiave = 'sync_soci' and i.valore ? 'quando'
        ) tutte
        where tutte.quando is not null and tutte.testo is not null
        order by tutte.quando desc
        limit least(greatest(coalesce(p_quante, 40), 1), 200)
      ) a
    )
  );
end;
$$;

revoke all on function public.cruscotto(integer) from public, anon;
grant execute on function public.cruscotto(integer) to authenticated;
