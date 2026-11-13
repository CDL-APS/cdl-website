-- Le bozze delle proposte restano del socio finché non le invia.
--
-- Prima i redattori potevano leggere tutte le proposte e tutti i file dello
-- spazio "proposte", bozze comprese (la gestione non le mostrava, ma la
-- Data API sì). Da qui:
--   - un redattore legge una proposta solo da quando è stata inviata (stato
--     diverso da 'bozza'); il socio continua a leggere tutte le proprie;
--   - nello spazio "proposte" un redattore legge solo i file citati da una
--     proposta inviata (fotogramma, titolo_png, titolo_font);
--   - public.soci_con_bozze() dice alla gestione chi ha una bozza aperta,
--     solo il nome: niente titolo né contenuto.
-- Decisione dell'utente, 13 novembre 2026.

drop policy "Lettura: le proprie proposte, o tutte per i redattori" on public.proposte;

create policy "Lettura: le proprie proposte, o quelle inviate per i redattori"
  on public.proposte for select to authenticated
  using (
    autore = (select auth.uid())
    or ((select privato.e_redattore()) and stato <> 'bozza')
  );

drop policy "Proposte: ognuno vede i propri file, i redattori tutti" on storage.objects;

create policy "Proposte: ognuno vede i propri file, i redattori quelli inviati"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'proposte'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (
        (select privato.e_redattore())
        and exists (
          select 1 from public.proposte p
          where p.stato <> 'bozza'
            and name in (p.dati ->> 'fotogramma', p.dati ->> 'titolo_png', p.dati ->> 'titolo_font')
        )
      )
    )
  );

-- Chi ha una bozza in preparazione: il nome del socio (o l'email, se non è
-- più nel libro soci), una volta sola anche con più bozze.
create or replace function public.soci_con_bozze()
returns table (nome text)
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
    select distinct coalesce(s.nome, privato.normalizza_email(u.email))
    from public.proposte p
    join auth.users u on u.id = p.autore
    left join lateral privato.socio_di(u.email) s on true
    where p.stato = 'bozza'
    order by 1;
end;
$$;

revoke all on function public.soci_con_bozze() from public, anon;
grant execute on function public.soci_con_bozze() to authenticated;
