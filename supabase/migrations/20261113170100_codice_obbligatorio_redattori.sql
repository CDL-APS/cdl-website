-- Il codice di verifica (TOTP) diventa obbligatorio per i redattori.
--
-- Prima chi non l'aveva attivato entrava con la sola password
-- (20261111140200). Da qui la gestione richiede sempre una sessione di
-- livello aal2, nata da password più codice. Emerso dalla security review
-- del 13 novembre 2026; quel giorno l'unico redattore aveva già il codice.
--
-- Un redattore nuovo, entrato con la sola password, non è ancora
-- redattore per il database: public.redattore_senza_codice() lo dice alla
-- gestione, che gli mostra subito l'attivazione del codice. Attivato il
-- codice, la sessione passa ad aal2 ed entra. Chi perde il telefono va
-- sbloccato da chi amministra il progetto (Authentication → utente →
-- fattori), poi riattiva il codice.

create or replace function privato.e_redattore()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from privato.redattori where user_id = (select auth.uid())
  )
  and exists (
    select 1
    from jsonb_array_elements(coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb)) m
    where m ->> 'method' = 'password'
  )
  and coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2';
$$;

revoke all on function privato.e_redattore() from public;
grant execute on function privato.e_redattore() to anon, authenticated;

-- Per la gestione: redattore entrato con la password ma senza codice
-- attivo. Non dà nessun permesso, serve solo a mostrare l'attivazione.
create or replace function public.redattore_senza_codice()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from privato.redattori where user_id = (select auth.uid())
  )
  and exists (
    select 1
    from jsonb_array_elements(coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb)) m
    where m ->> 'method' = 'password'
  )
  and not exists (
    select 1 from auth.mfa_factors f
    where f.user_id = (select auth.uid()) and f.status = 'verified'
  );
$$;

revoke all on function public.redattore_senza_codice() from public, anon;
grant execute on function public.redattore_senza_codice() to authenticated;
