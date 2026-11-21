-- ==========================================================================
-- VETRINA DELLA HOME — il lettering di una slide: un PNG senza fondo (la
-- scritta del titolo disegnata, come il lettering di Long Story Short o il
-- logo di un evento). Se c'è, in home prende il posto del titolo scritto,
-- usato come maschera nel colore della slide; il titolo resta per chi usa
-- un lettore di schermo. Si carica com'è dalla Dashboard della gestione,
-- nella cartella vetrina/ dello spazio immagini, o è un file del sito.
-- ==========================================================================

alter table public.vetrina
  add column lettering text
  check (lettering ~ '^(assets/img/|vetrina/|eventi/)[A-Za-z0-9/._-]+\.png$' and lettering !~ '\.\.');

comment on column public.vetrina.lettering is
  'PNG senza fondo che sostituisce il titolo scritto (file del sito o percorso nello spazio immagini).';

grant select (lettering) on public.vetrina to anon;
