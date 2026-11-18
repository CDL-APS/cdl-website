-- IMDb accanto a Letterboxd nella pagina del corto.
--
-- Colonna opere.imdb_url (facoltativa, solo indirizzi imdb.com), nel modulo
-- di gestione e in quello della proposta. approva_proposta la porta
-- dalla proposta all'opera; il resto della funzione è identico alla
-- versione di 20261112170000 (create or replace: i permessi restano).
-- La lettura pubblica (anon) è nell'elenco di
-- 20261113200000_colonne_pubbliche.sql e in COLONNE_OPERE di dati.js.

alter table public.opere add column imdb_url text
  constraint opere_imdb_url_valido check (imdb_url is null or imdb_url ~ '^https://(www\.|m\.)?imdb\.com/');

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
     video_url, letterboxd_url, imdb_url, sceneggiatura, produttore, fotografia,
     montaggio, colonna_sonora, scenografia, suono, trucco, costumi,
     altri_ruoli, titolo_png, titolo_font, colore, solo_scheda, pubblicata)
  values
    (v_o.codice, v_o.titolo, v_o.anno, v_o.durata, v_o.regista, v_o.produzione,
     coalesce(v_o.produzione_cdl, false), coalesce(v_o.collaborazione_cdl, false),
     coalesce(v_o.generi, '{}'), v_o.tagline, v_o.sinossi, v_o.note_regia,
     v_o.fotogramma, v_o.video_url, v_o.letterboxd_url, v_o.imdb_url, v_o.sceneggiatura,
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
