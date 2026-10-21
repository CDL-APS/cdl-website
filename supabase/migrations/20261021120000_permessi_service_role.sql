-- ==========================================================================
-- PERMESSI DI service_role — dal 30 ottobre 2026 Supabase non dà più in
-- automatico l'accesso della Data API alle tabelle nuove di public, anche
-- quando lo schema si ricrea dalle migrazioni (progetto nuovo, branch,
-- `supabase db reset`). anon e authenticated hanno già i loro grant nello
-- schema iniziale; qui si aggiunge il ruolo della chiave segreta, che il sito
-- non usa ma che deve poter lavorare su un progetto ricreato da zero.
-- Sul progetto attuale non cambia nulla: quei permessi li aveva già.
-- ==========================================================================

grant select, insert, update, delete
  on public.opere, public.interpreti, public.eventi, public.eventi_opere
  to service_role;
