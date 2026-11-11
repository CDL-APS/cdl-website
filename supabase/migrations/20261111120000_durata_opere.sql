-- ==========================================================================
-- DURATA DELLE OPERE — in minuti interi. Facoltativa: le opere già inserite
-- restano senza finché un redattore non la compila dal modulo di gestione.
-- Nella Cortoteca compare nella riga sotto il titolo ("14 min").
-- La colonna eredita i permessi della tabella: nessun grant da aggiungere.
-- ==========================================================================

alter table public.opere
  add column durata integer,
  add constraint opere_durata_positiva check (durata is null or durata between 1 and 600);

comment on column public.opere.durata is
  'Durata in minuti interi. Facoltativa.';
