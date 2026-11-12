-- ==========================================================================
-- OPERE: COLORE DELLA PAGINA E SOLA SCHEDA — per il redesign del sito.
--
-- 1. colore: il colore della pagina del corto (scritte, fili, crocetta della
--    sala), scelto in gestione. Prima veniva solo dal titolo grafico in SVG,
--    che con i titoli in PNG o in un carattere tipografico non si può
--    leggere. Vuoto: il sito usa il colore dell'SVG locale, se c'è, o il
--    lilla. Formato #rrggbb in minuscolo.
-- 2. solo_scheda: il corto è in Cortoteca con la sola scheda, senza video,
--    per scelta del socio (licenza di tipo "scheda"). Il pubblico non può
--    leggere licenze: senza questa colonna la pagina prometterebbe uno
--    streaming "in arrivo" che non arriverà. La scrivono approva_proposta e
--    accetta_licenza_opera in base al tipo di licenza; i redattori possono
--    cambiarla dalla gestione (per esempio per le produzioni CDL, che non
--    hanno licenza).
--
-- Le due colonne sono pubbliche: vanno anche nell'elenco delle colonne
-- leggibili da anon (20261112220000_colonne_pubbliche.sql) e in
-- COLONNE_OPERE di assets/js/dati.js.
-- ==========================================================================

alter table public.opere
  add column colore text check (colore ~ '^#[0-9a-f]{6}$'),
  add column solo_scheda boolean not null default false;

comment on column public.opere.colore is
  'Colore della pagina del corto sul sito, #rrggbb minuscolo. Vuoto: colore del titolo grafico o lilla.';
comment on column public.opere.solo_scheda is
  'Vero se il corto è in Cortoteca con la sola scheda, senza streaming (licenza di tipo scheda, o scelta della redazione).';

-- Le opere che hanno oggi solo un'autorizzazione per la scheda
update public.opere o set solo_scheda = true
where exists (
    select 1 from public.licenze l
    where l.opera_id = o.id and l.revocata_il is null and l.tipo = 'scheda')
  and not exists (
    select 1 from public.licenze l
    where l.opera_id = o.id and l.revocata_il is null and l.tipo = 'streaming');

-- --------------------------------------------------------------------------
-- approva_proposta: porta anche il colore (dal modulo di gestione) e segna
-- la sola scheda quando il socio non ha accettato la licenza completa.
-- Il resto è identico alla versione di 20261112100000.
-- --------------------------------------------------------------------------
create or replace function public.approva_proposta(p_id bigint, p_opera jsonb, p_interpreti jsonb default '[]')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposta public.proposte;
  v_email text;
  v_o public.opere;
  v_opera_id bigint;
  v_streaming boolean;
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;

  select * into v_proposta from public.proposte where id = p_id for update;
  if v_proposta.id is null or v_proposta.stato <> 'inviata' then
    raise exception 'La proposta non è in attesa di revisione' using errcode = '55000';
  end if;

  select privato.normalizza_email(u.email) into v_email
  from auth.users u where u.id = v_proposta.autore;

  if not exists (
    select 1 from public.licenze where proposta_id = p_id and revocata_il is null
  ) then
    raise exception 'Manca la licenza: la proposta non può essere pubblicata' using errcode = '55000';
  end if;
  if not privato.email_in_regola(v_email) then
    raise exception 'Il socio non risulta in regola con la quota: aggiorna il foglio dei soci e riprova'
      using errcode = '55000';
  end if;

  v_o := jsonb_populate_record(null::public.opere, p_opera);
  v_streaming := exists (
    select 1 from public.licenze
    where proposta_id = p_id and revocata_il is null and tipo = 'streaming'
  );

  if coalesce(btrim(v_o.video_url), '') <> '' and not v_streaming then
    raise exception 'Il socio ha autorizzato la sola scheda: togli il collegamento al video'
      using errcode = '55000';
  end if;

  insert into public.opere
    (codice, titolo, anno, durata, regista, produzione, produzione_cdl,
     collaborazione_cdl, generi, tagline, sinossi, note_regia, fotogramma,
     video_url, letterboxd_url, sceneggiatura, produttore, fotografia,
     montaggio, colonna_sonora, scenografia, suono, trucco, costumi,
     altri_ruoli, titolo_png, titolo_font, colore, solo_scheda, pubblicata)
  values
    (v_o.codice, v_o.titolo, v_o.anno, v_o.durata, v_o.regista, v_o.produzione,
     coalesce(v_o.produzione_cdl, false), coalesce(v_o.collaborazione_cdl, false),
     coalesce(v_o.generi, '{}'), v_o.tagline, v_o.sinossi, v_o.note_regia,
     v_o.fotogramma, v_o.video_url, v_o.letterboxd_url, v_o.sceneggiatura,
     v_o.produttore, v_o.fotografia, v_o.montaggio, v_o.colonna_sonora,
     v_o.scenografia, v_o.suono, v_o.trucco, v_o.costumi,
     coalesce(v_o.altri_ruoli, '[]'), v_o.titolo_png, v_o.titolo_font,
     lower(nullif(btrim(v_o.colore), '')), not v_streaming,
     coalesce(v_o.pubblicata, true))
  returning id into v_opera_id;

  insert into public.interpreti (opera_id, posizione, nome, ruolo)
  select v_opera_id, i.posizione::smallint, btrim(i.voce ->> 'nome'), nullif(btrim(i.voce ->> 'ruolo'), '')
  from jsonb_array_elements(coalesce(p_interpreti, '[]'::jsonb)) with ordinality as i (voce, posizione)
  where coalesce(btrim(i.voce ->> 'nome'), '') <> '';

  update public.proposte
    set stato = 'approvata', opera_id = v_opera_id,
        decisa_il = now(), decisa_da = (select auth.uid()), nota_revisione = null
    where id = p_id;

  update public.licenze set opera_id = v_opera_id
    where proposta_id = p_id and revocata_il is null;

  insert into privato.opere_soci (opera_id, email) values (v_opera_id, v_email);

  return v_o.codice;
end;
$$;

-- --------------------------------------------------------------------------
-- accetta_licenza_opera: il socio accetta la licenza per un'opera già in
-- Cortoteca. Il tipo dipende dal video (com'era); in più l'opera ricorda se
-- la licenza copre solo la scheda. Il resto è identico alla versione di
-- 20261112100000.
-- --------------------------------------------------------------------------
create or replace function public.accetta_licenza_opera(
  p_opera_id bigint, p_nome text, p_risposte jsonb, p_consensi jsonb, p_versione text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titolo text;
  v_video text;
  v_tipo text;
  v_licenza bigint;
begin
  select o.titolo, o.video_url into v_titolo, v_video
  from privato.opere_soci os
  join public.opere o on o.id = os.opera_id
  where os.opera_id = p_opera_id and os.email = privato.email_utente();

  if v_titolo is null then
    raise exception 'Quest''opera non risulta tua' using errcode = '42501';
  end if;
  if privato.licenza_valida(p_opera_id) then
    raise exception 'Per quest''opera c''è già una licenza attiva' using errcode = '55000';
  end if;
  if not privato.email_in_regola(privato.email_utente()) then
    raise exception 'La quota associativa di quest''anno non risulta pagata' using errcode = '42501';
  end if;

  v_tipo := case when coalesce(btrim(v_video), '') = '' then 'scheda' else 'streaming' end;
  v_licenza := privato.registra_licenza(
    null, p_opera_id, v_titolo, p_nome, p_risposte, p_consensi, p_versione, v_tipo);

  update public.opere set solo_scheda = (v_tipo = 'scheda')
    where id = p_opera_id and solo_scheda is distinct from (v_tipo = 'scheda');

  return v_licenza;
end;
$$;
