-- Per la pagina di gestione: dice se chi ha fatto l'accesso è un redattore.
-- Risponde solo per l'utente stesso, senza rivelare chi altro lo sia.
-- security invoker: i permessi li porta privato.e_redattore(), già eseguibile
-- da authenticated. Chi non ha fatto l'accesso non può chiamarla.
create function public.sono_redattore()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select privato.e_redattore();
$$;

revoke all on function public.sono_redattore() from public, anon;
grant execute on function public.sono_redattore() to authenticated;
