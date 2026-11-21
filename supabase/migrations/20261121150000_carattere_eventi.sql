-- ==========================================================================
-- IL CARATTERE DI UN EVENTO — alcuni eventi parlano col carattere della
-- loro grafica invece che in Montserrat: Long Story Short in Inter (quello
-- del lettering), la serata del 27 novembre 2026 in VT323. La pagina
-- dell'evento lo dichiara nel suo CSS (evento.css); questa colonna lo dice
-- al resto del sito, a cominciare dalla vetrina della home, dove la slide
-- dell'evento usa lo stesso carattere. Vuota: Montserrat, come il sito.
-- I caratteri ammessi sono quelli che home.js sa caricare (CARATTERI).
-- ==========================================================================

alter table public.eventi
  add column carattere text check (carattere in ('Inter', 'VT323'));

comment on column public.eventi.carattere is
  'Il carattere della grafica dell''evento (Inter, VT323); vuoto: Montserrat, come il sito.';

-- chi visita il sito legge le colonne una per una (20261113200000_colonne_pubbliche.sql)
grant select (carattere) on public.eventi to anon;

update public.eventi set carattere = 'Inter' where codice = 'long-story-short-2026';
update public.eventi set carattere = 'VT323' where codice = 'evento-interzona';
