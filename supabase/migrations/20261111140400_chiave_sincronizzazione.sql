-- ==========================================================================
-- CHIAVE DI SINCRONIZZAZIONE — la genera lo script del foglio dei soci
-- (menu Cortoteca → Collega al sito) e non esce mai da Google. Al sito si
-- comunica solo la sua impronta SHA-256, che un redattore incolla in
-- gestione.html, scheda Soci. Rifare il collegamento sostituisce la chiave.
-- ==========================================================================

create function public.imposta_chiave_sync(p_impronta text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  if p_impronta is null or lower(btrim(p_impronta)) !~ '^[0-9a-f]{64}$' then
    raise exception 'L''impronta è fatta di 64 caratteri fra cifre e lettere da a a f' using errcode = '22023';
  end if;
  insert into privato.impostazioni (chiave, valore)
  values ('sync_chiave', jsonb_build_object('impronta', lower(btrim(p_impronta))))
  on conflict (chiave) do update set valore = excluded.valore, modificato_il = now();
end;
$$;

revoke all on function public.imposta_chiave_sync(text) from public, anon;
grant execute on function public.imposta_chiave_sync(text) to authenticated;
