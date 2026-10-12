-- ==========================================================================
-- COLLABORAZIONI CDL — le opere a cui CDL ha contribuito senza produrle.
-- Nella pagina Produzioni stanno nel blocco "Collaborazioni", sotto le
-- produzioni originali; il blocco compare solo quando ce n'è almeno una.
-- Si spunta dal modulo di gestione. Un'opera è o una produzione CDL o una
-- collaborazione, non entrambe.
-- ==========================================================================

alter table public.opere
  add column collaborazione_cdl boolean not null default false,
  add constraint opere_produzione_o_collaborazione
    check (not (produzione_cdl and collaborazione_cdl));

comment on column public.opere.collaborazione_cdl is
  'Opera a cui CDL ha collaborato senza produrla: blocco Collaborazioni della pagina Produzioni.';
