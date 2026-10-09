-- public.rls_auto_enable() è la funzione con cui Supabase attiva in automatico
-- la RLS su ogni nuova tabella di public (opzione scelta alla creazione del
-- progetto). Scatta da sola come event trigger durante la creazione delle
-- tabelle: nessuno deve poterla chiamare dalla Data API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- La tabella dei redattori non ha regole di accesso apposta: nessun ruolo
-- della Data API deve leggerla o scriverla. Si gestisce dalla dashboard.
comment on table privato.redattori is
  'Chi può modificare opere ed eventi. Nessuna regola RLS di proposito: '
  'si gestisce solo dalla dashboard o in SQL.';
