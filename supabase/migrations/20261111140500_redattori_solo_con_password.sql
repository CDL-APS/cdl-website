-- ==========================================================================
-- REDATTORI SOLO CON LA PASSWORD — un socio può essere anche redattore, con
-- lo stesso indirizzo. Il collegamento personale di proponi.html apre una
-- sessione per quell'indirizzo: senza questa regola varrebbe come chiave
-- della gestione. Da qui in poi una sessione è "da redattore" solo se è
-- nata dall'accesso con password (voce "password" nel campo amr del
-- token); quelle nate da un invito portano "otp" e restano da socio.
-- Sostituisce la definizione di 20261111140200, a cui aggiunge la
-- condizione di mezzo.
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
  and exists (
    select 1
    from jsonb_array_elements(coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb)) m
    where m ->> 'method' = 'password'
  )
  and (
    coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified'
    )
  );
$$;
