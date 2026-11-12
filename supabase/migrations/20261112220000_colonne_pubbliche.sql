-- ==========================================================================
-- COLONNE PUBBLICHE di opere ed eventi.
--
-- Chi visita il sito (ruolo anon, chiave pubblica) legge opere ed eventi
-- pubblicati. Fino a qui poteva leggerne tutte le colonne, compresa
-- modificato_da (l'identificativo del redattore che ha fatto l'ultima
-- modifica) e le date di lavoro. Da qui legge solo le colonne che il sito
-- mostra, le stesse elencate in assets/js/dati.js (COLONNE_OPERE,
-- COLONNE_EVENTI). Una colonna nuova da mostrare va aggiunta in entrambi i
-- posti.
--
-- Con i permessi per colonna "select=*" non funziona più per anon: va
-- applicata solo quando il sito pubblicato usa già l'elenco esplicito (il
-- dati.js del redesign). Prima, il sito online ripiegherebbe sulle copie di
-- riserva in data/.
--
-- La sveglia di GitHub (.github/workflows/sveglia-supabase.yml) legge
-- eventi?select=id: id resta leggibile. Le regole RLS non cambiano.
-- Viene dopo 20261112210000_eventi_a_blocchi.sql, di cui elenca le colonne:
-- un revoke sulla tabella toglie anche i permessi per colonna dati prima.
-- authenticated (gestione e soci) e service_role mantengono i permessi
-- sulla tabella intera.
-- ==========================================================================

revoke select on public.opere from anon;
grant select (
  id, codice, titolo, anno, durata, regista, produzione, produzione_cdl, collaborazione_cdl,
  generi, tagline, sinossi, note_regia, fotogramma, video_url, letterboxd_url,
  sceneggiatura, produttore, fotografia, montaggio, colonna_sonora, scenografia, trucco, costumi,
  suono, altri_ruoli, titolo_png, titolo_font, colore, solo_scheda, pubblicata
) on public.opere to anon;

revoke select on public.eventi from anon;
grant select (
  id, codice, titolo, data_inizio, data_fine, luogo, riassunto, descrizione,
  copertina, miniatura, pagina, serie, pubblicato,
  logo, colore, instagram, sfondo, presentazione, blocchi
) on public.eventi to anon;
