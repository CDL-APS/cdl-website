-- ==========================================================================
-- VETRINA DELLA HOME — il colore del testo di una slide: la riga sotto il
-- titolo e il tasto dell'invito. Vuoto, chiaro (o il colore delle scritte
-- della sezione, per una pagina senza foto). Il colore del titolo, e del
-- lettering, resta nella colonna colore.
-- ==========================================================================

alter table public.vetrina
  add column colore_testo text check (colore_testo ~ '^#[0-9a-f]{6}$');

comment on column public.vetrina.colore_testo is
  'Colore della riga di testo e del tasto della slide (#rrggbb). Vuoto: quello della sezione o il chiaro.';

grant select (colore_testo) on public.vetrina to anon;
