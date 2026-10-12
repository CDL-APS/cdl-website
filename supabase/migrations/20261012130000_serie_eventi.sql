-- ==========================================================================
-- SERIE DEGLI EVENTI — decide in quale blocco della pagina Eventi compare un
-- evento: l'ultima edizione di Long Story Short sta in primo piano, le
-- edizioni di Short Talks hanno un blocco loro, tutto il resto (serie vuota)
-- finisce fra gli altri eventi. Si sceglie dal modulo di gestione.
-- ==========================================================================

alter table public.eventi
  add column serie text check (serie in ('long-story-short', 'short-talks'));

comment on column public.eventi.serie is
  'Serie dell''evento (long-story-short, short-talks) o vuota per gli altri eventi: decide il blocco della pagina Eventi.';

-- Gli eventi già presenti. Short Talks OFF e Blue Hour restano senza serie:
-- vanno fra gli altri eventi.
update public.eventi set serie = 'long-story-short'
  where codice = 'long-story-short-2026';

update public.eventi set serie = 'short-talks'
  where codice in ('short-talks-1', 'short-talks-2', 'short-talks-al-not-2025',
                   'short-talks-3-x-laiff', 'short-talks-al-not-2026');
