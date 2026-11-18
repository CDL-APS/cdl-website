-- ==========================================================================
-- SECONDO FATTORE PER I REDATTORI — chi ha attivato un'app di autenticazione
-- (TOTP) è redattore solo nelle sessioni in cui ha inserito anche il codice.
--
-- Il controllo sta nel database: con la sola password, un account che ha il
-- secondo fattore non scrive nulla nemmeno chiamando la Data API a mano.
-- Chi non l'ha ancora attivato continua a entrare con la password, così
-- nessuno resta chiuso fuori; l'attivazione si fa da gestione.html.
-- Quando tutti i redattori l'avranno attivato, si può renderlo obbligatorio
-- togliendo la seconda metà della condizione.
-- ==========================================================================

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
  and (
    coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified'
    )
  );
$$;

-- Per la pagina di gestione: distingue "non sei redattore" da "sei redattore
-- ma in questa sessione manca il codice"
create function public.redattore_senza_codice()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from privato.redattori where user_id = (select auth.uid())
  )
  and not privato.e_redattore();
$$;

revoke all on function public.redattore_senza_codice() from public, anon;
grant execute on function public.redattore_senza_codice() to authenticated;
