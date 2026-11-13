-- Il collegamento personale dei soci vale una volta sola e per 7 giorni.
--
-- Fino a qui il collegamento (area-socio.html#invito=…) era la chiave
-- dell'area socio: non scadeva e si poteva riusare. Da qui serve solo a
-- scegliere la password, al primo accesso o quando il socio l'ha
-- dimenticata; poi si entra con email e password. Un collegamento già usato
-- o più vecchio di 7 giorni non apre più niente: se finisce in una chat
-- sbagliata non serve a nessuno. Il consumo è un solo update, così due
-- aperture contemporanee non possono usarlo entrambe.
-- Decisione dell'utente, 13 novembre 2026 (prima del deploy del redesign).
--
-- Resta da 20261113170000: nessun collegamento per l'email di un redattore.

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
  -- usato adesso, o mai: solo se non è già stato usato e non è scaduto
  update privato.inviti i
    set usato_il = now()
    where i.impronta = privato.impronta(p_segreto)
      and i.usato_il is null
      and i.creato_il > now() - interval '7 days'
    returning i.email into v_email;

  -- invito sconosciuto, già usato, scaduto, o di un redattore: nessuna sessione
  if v_email is null or privato.email_di_redattore(v_email) then
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

comment on table privato.inviti is
  'Collegamenti personali per area-socio.html, uno per socio: valgono una volta '
  'sola e per 7 giorni, servono a scegliere la password. Crearne uno nuovo '
  'annulla il precedente. Si conserva solo l''impronta del segreto.';
