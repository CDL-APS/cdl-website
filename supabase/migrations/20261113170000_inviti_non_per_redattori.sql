-- Il collegamento personale dei soci non vale per i redattori.
--
-- accesso-socio apre una sessione per l'utente che ha l'email dell'invito.
-- Se quell'utente è anche redattore, da quella sessione si potrebbe
-- impostare una password nuova (auth.updateUser) e poi entrare nella
-- gestione con email e password: la regola di 20261111140500 (sessione nata
-- da una password) non basta a impedirlo. Emerso dalla security review del
-- 13 novembre 2026.
--
-- Da qui: crea_invito rifiuta l'email di un redattore e verifica_invito non
-- la riconosce (nemmeno per un invito creato prima). Un redattore che è
-- anche socio entra solo dalla gestione; per proporre un corto alla
-- Cortoteca come socio usa un altro indirizzo nel libro soci.

create or replace function privato.email_di_redattore(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from privato.redattori r
    join auth.users u on u.id = r.user_id
    where privato.normalizza_email(u.email) = privato.normalizza_email(p_email)
  );
$$;

revoke all on function privato.email_di_redattore(text) from public, anon, authenticated;

create or replace function public.crea_invito(p_email text)
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
  if privato.email_di_redattore(v_email) then
    raise exception 'È l''indirizzo di un redattore: il collegamento personale non vale per la gestione. Per proporre corti come socio serve un altro indirizzo nel libro soci.' using errcode = '22023';
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

create or replace function public.verifica_invito(p_segreto text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_socio privato.soci;
begin
  select i.email into v_email
    from privato.inviti i
    where i.impronta = privato.impronta(p_segreto);

  -- invito sconosciuto, o di un redattore: nessuna sessione
  if v_email is null or privato.email_di_redattore(v_email) then
    return null;
  end if;

  v_socio := privato.socio_di(v_email);
  if v_socio.numero is null then
    return null;
  end if;

  update privato.inviti set usato_il = now() where email = v_email;

  return jsonb_build_object('email', v_email, 'nome', v_socio.nome);
end;
$$;

revoke all on function public.verifica_invito(text) from public, anon, authenticated;
grant execute on function public.verifica_invito(text) to service_role;
