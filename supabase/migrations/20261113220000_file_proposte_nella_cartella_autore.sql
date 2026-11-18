-- I redattori leggono un file dello spazio "proposte" solo se sta nella
-- cartella dell'autore della proposta inviata che lo cita.
--
-- Con 20261113180000_bozze_riservate.sql bastava che il nome del file
-- comparisse in una proposta inviata qualsiasi: un socio che conoscesse
-- l'identificativo e il nome di un file di un altro socio poteva citarlo
-- nella propria proposta e farlo leggere ai redattori (e, all'approvazione,
-- copiare nello spazio pubblico "immagini"). Rischio basso (i soci non vedono
-- né identificativi né nomi dei file altrui), chiuso lo stesso.
-- Dalla seconda review pre-deploy, 13 novembre 2026.

drop policy "Proposte: ognuno vede i propri file, i redattori quelli inviati" on storage.objects;

create policy "Proposte: ognuno vede i propri file, i redattori quelli inviati"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'proposte'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (
        (select privato.e_redattore())
        and exists (
          select 1 from public.proposte p
          where p.stato <> 'bozza'
            and (storage.foldername(name))[1] = p.autore::text
            and name in (p.dati ->> 'fotogramma', p.dati ->> 'titolo_png', p.dati ->> 'titolo_font')
        )
      )
    )
  );
