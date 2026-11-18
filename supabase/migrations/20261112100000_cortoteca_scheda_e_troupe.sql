-- ==========================================================================
-- CORTOTECA, PARTE 3 — proposte senza streaming, troupe libera, titolo
-- grafico, durata obbligatoria.
--
-- 1. Una proposta può chiedere la sola scheda (titolo, testi, crediti,
--    fotogramma) senza mettere il corto in streaming. Anche la scheda va
--    autorizzata: fotogramma, testi e grafica del titolo sono protetti dal
--    diritto d'autore e nel fotogramma possono comparire persone. Per questo
--    c'è un secondo testo, più breve, di tipo "scheda"; la licenza completa è
--    di tipo "streaming". Il tipo lo sceglie il socio con dati.modalita.
--    Un'opera con il video ha bisogno di una licenza "streaming"; senza video
--    basta una delle due (privato.licenza_valida).
-- 2. Troupe: nuova colonna "suono" e "altri_ruoli", elenco libero di
--    { ruolo, nome } per i ruoli che non hanno una colonna.
-- 3. Titolo grafico, facoltativo: un PNG (titolo_png) o il file di un
--    carattere tipografico (titolo_font), nello spazio "immagini".
-- 4. All'invio la durata è obbligatoria.
--
-- Il testo della licenza "streaming" versione 1 non cambia: copre già il
-- titolo, e la dichiarazione sul carattere tipografico entra nel questionario
-- (che fa parte della licenza, articolo 8 f).
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Opere: colonne nuove
-- --------------------------------------------------------------------------
alter table public.opere
  add column suono text,
  add column altri_ruoli jsonb not null default '[]'
    check (jsonb_typeof(altri_ruoli) = 'array'),
  add column titolo_png text,
  add column titolo_font text;

comment on column public.opere.altri_ruoli is
  'Ruoli della troupe senza una colonna propria: elenco di { ruolo, nome }, nell''ordine di pubblicazione.';
comment on column public.opere.titolo_png is
  'Percorso nello spazio "immagini" del titolo in PNG, per mostrarlo con la grafica del corto.';
comment on column public.opere.titolo_font is
  'Percorso nello spazio "immagini" del carattere tipografico del titolo (TTF, OTF, WOFF, WOFF2).';

-- Gli spazi accettano anche i file dei caratteri
update storage.buckets
  set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp',
                                 'font/ttf', 'font/otf', 'font/woff', 'font/woff2']
  where id in ('proposte', 'immagini');

-- --------------------------------------------------------------------------
-- Due tipi di testo e di licenza
-- --------------------------------------------------------------------------
alter table public.testi_licenza
  add column tipo text not null default 'streaming' check (tipo in ('streaming', 'scheda'));

alter table public.licenze
  add column tipo text not null default 'streaming' check (tipo in ('streaming', 'scheda'));

comment on column public.licenze.tipo is
  '"streaming": licenza completa, il corto si guarda in Cortoteca. "scheda": solo titolo, testi, crediti e fotogramma.';

insert into public.testi_licenza (versione, tipo, testo, sha256)
select 'scheda-1', 'scheda', v.testo, encode(sha256(convert_to(v.testo, 'UTF8')), 'hex')
from (values ($testo$AUTORIZZAZIONE ALLA PUBBLICAZIONE DELLA SCHEDA IN CORTOTECA
Versione scheda-1

Questa autorizzazione è un accordo fra chi la accetta (il «Concedente») e CDL APS, associazione di promozione sociale con sede in Viale Laurana 13, 47921 Rimini, codice fiscale 91200080405 («CDL»). Riguarda il cortometraggio descritto nella proposta a cui l'accettazione è unita (l'«Opera»). Vale quando l'Opera non si può guardare in Cortoteca: per renderla visibile in streaming il Concedente accetta a parte la Licenza per la pubblicazione in Cortoteca.

1. Che cosa autorizza
Il Concedente autorizza CDL a pubblicare nella Cortoteca, la sezione del sito cdlaps.com dedicata ai cortometraggi dei soci, una scheda dell'Opera con:
a) il titolo, anche nella grafica o nel carattere tipografico forniti dal Concedente;
b) la sinossi, la tagline e le note di regia;
c) i crediti di troupe e cast;
d) il fotogramma.
CDL non pubblica e non diffonde l'Opera.

2. Che cosa non autorizza
Ogni diritto non elencato all'articolo 1 resta al Concedente. CDL non può usare i materiali della scheda fuori dalla Cortoteca, cederli a terzi né usarli a fini commerciali, salvo quanto previsto all'articolo 3. Per ogni altro uso serve un accordo scritto a parte.

3. Uso promozionale
Solo se il Concedente lo autorizza con la casella dedicata, CDL può usare il fotogramma e il titolo sui propri canali social e nei propri materiali, per far conoscere l'Opera e la Cortoteca, indicando sempre il titolo e la regia. Il Concedente può ritirare questa autorizzazione in ogni momento, anche lasciando la scheda in Cortoteca.

4. Caratteri dell'autorizzazione
L'autorizzazione è:
a) non esclusiva: il Concedente resta libero di usare i materiali e di concederli ad altri;
b) gratuita: nessuna delle parti deve un compenso all'altra. Il Concedente dichiara di scegliere liberamente la gratuità, per far conoscere la propria Opera;
c) valida in tutto il mondo, perché il sito è raggiungibile ovunque;
d) a tempo indeterminato, fino alla revoca.

5. Integrità e crediti
CDL pubblica i materiali come forniti dal Concedente. Può solo ridimensionarli, ritagliarli o convertirli nel formato necessario alla corretta visualizzazione nel sito, senza alterarne il contenuto. Indica titolo, regia e crediti come forniti dal Concedente e corregge gli errori su semplice segnalazione.

6. Revoca
Il Concedente può revocare l'autorizzazione in ogni momento e senza dare motivazioni, dalla propria pagina personale o scrivendo a ciao@cdlaps.com. CDL toglie la scheda dalla Cortoteca entro 15 giorni dalla revoca.

7. Pubblicazione e rimozione
CDL non è obbligata a pubblicare la scheda. Può nasconderla o toglierla nei casi previsti dal Regolamento della Cortoteca, in particolare quando riceve una contestazione o quando il Concedente non rinnova la quota associativa, informandone il Concedente.

8. Dichiarazioni del Concedente
Il Concedente dichiara che:
a) ha organizzato la produzione dell'Opera, oppure agisce con il consenso scritto di chi l'ha prodotta e di ogni altro coproduttore;
b) gli autori dei testi, del fotogramma e della grafica del titolo sono d'accordo con la loro pubblicazione nella scheda;
c) se fornisce il file di un carattere tipografico, la sua licenza ne consente l'uso su un sito web;
d) le persone riconoscibili nel fotogramma hanno acconsentito alla sua pubblicazione; per i minori hanno acconsentito i genitori o chi ne fa le veci;
e) i materiali non violano diritti di altri né norme di legge, e nessun accordo ne vieta la pubblicazione in Cortoteca;
f) le risposte date nel questionario sono vere. Il questionario fa parte di questa autorizzazione.

9. Contestazioni
Se un terzo contesta la pubblicazione della scheda, CDL ne informa il Concedente e può nasconderla finché la questione non è chiarita. Se una dichiarazione dell'articolo 8 risulta non vera, il Concedente tiene CDL indenne dalle richieste dei terzi che ne derivano.

10. Come si accetta e come si prova
Il Concedente accetta l'autorizzazione online, dopo essere entrato con il collegamento personale ricevuto da CDL, scrivendo il proprio nome e cognome e spuntando le caselle di accettazione. CDL registra il testo accettato e la sua versione, le risposte al questionario, la data e l'ora, l'indirizzo IP e il tipo di browser. La registrazione non può essere modificata. Il Concedente può rileggere e scaricare in ogni momento, dalla propria pagina personale, il testo accettato e la ricevuta dell'accettazione.

11. Dati personali
CDL tratta i dati del Concedente e delle persone indicate nei crediti secondo l'informativa pubblicata nella pagina di proposta.

12. Legge applicabile e versioni
L'autorizzazione è regolata dalla legge italiana. Per le controversie vale il giudice indicato dalla legge. Se CDL adotta una nuova versione di questo testo, la scheda resta regolata dalla versione accettata, finché il Concedente non ne accetta un'altra. Se il Concedente accetta anche la Licenza per la pubblicazione in Cortoteca per la stessa Opera, da quel momento la scheda è regolata anche da quella.
$testo$)) as v (testo);

-- Testo in vigore per un tipo
create function privato.testo_in_vigore(p_tipo text)
returns public.testi_licenza
language sql
stable
security definer
set search_path = ''
as $$
  select t.* from public.testi_licenza t
  where t.tipo = p_tipo and t.in_vigore_dal <= now()
  order by t.in_vigore_dal desc
  limit 1;
$$;

revoke all on function privato.testo_in_vigore(text) from public, anon, authenticated;

-- Un'opera è coperta se ha una licenza attiva adatta: "streaming" se ha il
-- video, di qualsiasi tipo se non lo ha
create function privato.licenza_valida(p_opera_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.licenze l
    join public.opere o on o.id = l.opera_id
    where l.opera_id = p_opera_id and l.revocata_il is null
      and (l.tipo = 'streaming' or coalesce(btrim(o.video_url), '') = '')
  );
$$;

revoke all on function privato.licenza_valida(bigint) from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- Registrazione di una licenza: ora con il tipo
-- --------------------------------------------------------------------------
drop function privato.registra_licenza(bigint, bigint, text, text, jsonb, jsonb, text);

create function privato.registra_licenza(
  p_proposta_id bigint,
  p_opera_id bigint,
  p_titolo text,
  p_nome text,
  p_risposte jsonb,
  p_consensi jsonb,
  p_versione text,
  p_tipo text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := privato.email_utente();
  v_socio privato.soci := privato.socio_di(v_email);
  v_testo public.testi_licenza := privato.testo_in_vigore(p_tipo);
  v_intestazioni jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  v_id bigint;
begin
  if v_testo.versione is null then
    raise exception 'Nessun testo in vigore per questo tipo di pubblicazione' using errcode = '55000';
  end if;
  if p_versione is distinct from v_testo.versione then
    raise exception 'Il testo da accettare è cambiato: ricarica la pagina e rileggilo'
      using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_nome, ''))) < 5 then
    raise exception 'Scrivi nome e cognome per esteso' using errcode = '22023';
  end if;
  if not coalesce((p_consensi ->> 'licenza')::boolean, false)
     or not coalesce((p_consensi ->> 'dichiarazioni')::boolean, false)
     or not coalesce((p_consensi ->> 'informativa')::boolean, false) then
    raise exception 'Mancano le accettazioni obbligatorie' using errcode = '22023';
  end if;
  if jsonb_typeof(p_risposte) is distinct from 'object'
     or coalesce(p_risposte ->> 'veste', '') not in ('produttore', 'coproduttore', 'autorizzato') then
    raise exception 'Il questionario sui diritti non è completo' using errcode = '22023';
  end if;
  if p_tipo = 'streaming' and (
       jsonb_typeof(p_risposte -> 'musica') is distinct from 'array'
       or jsonb_array_length(p_risposte -> 'musica') = 0
       or not coalesce((p_risposte ->> 'interpreti_consenso')::boolean, false)
       or coalesce(p_risposte ->> 'minori', '') not in ('no', 'si_con_consenso')) then
    raise exception 'Il questionario sui diritti non è completo' using errcode = '22023';
  end if;
  if p_tipo = 'scheda'
     and coalesce(p_risposte ->> 'persone_fotogramma', '') not in ('nessuna', 'consenso', 'minori_consenso') then
    raise exception 'Indica se nel fotogramma compaiono persone riconoscibili' using errcode = '22023';
  end if;

  insert into public.licenze
    (proposta_id, opera_id, user_id, titolo_opera, nome_dichiarato, email,
     numero_tessera, anno_tessera, versione_testo, sha256_testo, risposte,
     uso_promozionale, ip, user_agent, tipo)
  values
    (p_proposta_id, p_opera_id, (select auth.uid()), p_titolo, btrim(p_nome), v_email,
     v_socio.numero, v_socio.anno, v_testo.versione, v_testo.sha256, p_risposte,
     coalesce((p_consensi ->> 'promozionale')::boolean, false),
     coalesce(v_intestazioni ->> 'cf-connecting-ip',
              nullif(btrim(split_part(v_intestazioni ->> 'x-forwarded-for', ',', 1)), ''),
              v_intestazioni ->> 'x-real-ip'),
     left(v_intestazioni ->> 'user-agent', 500),
     p_tipo)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function privato.registra_licenza(bigint, bigint, text, text, jsonb, jsonb, text, text)
  from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- Invio: durata obbligatoria, streaming o sola scheda
-- --------------------------------------------------------------------------
create or replace function public.invia_proposta(
  p_id bigint,
  p_nome text default null,
  p_risposte jsonb default null,
  p_consensi jsonb default null,
  p_versione text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposta public.proposte;
  v_dati jsonb;
  v_licenza bigint;
  v_anno integer;
  v_durata integer;
  v_video boolean;
  v_file boolean;
  v_modalita text;
  v_font boolean;
begin
  select * into v_proposta
  from public.proposte
  where id = p_id and autore = (select auth.uid())
  for update;

  if v_proposta.id is null then
    raise exception 'Proposta non trovata' using errcode = '42501';
  end if;
  if v_proposta.stato not in ('bozza', 'da_rivedere') then
    raise exception 'Questa proposta è già stata inviata' using errcode = '55000';
  end if;
  if not privato.email_in_regola(privato.email_utente()) then
    raise exception 'La quota associativa di quest''anno non risulta pagata' using errcode = '42501';
  end if;

  v_dati := v_proposta.dati;
  v_anno := case when v_dati ->> 'anno' ~ '^\d{4}$' then (v_dati ->> 'anno')::integer end;
  v_durata := case when v_dati ->> 'durata' ~ '^\d{1,3}$' then (v_dati ->> 'durata')::integer end;
  v_video := coalesce(v_dati ->> 'video_url', '') ~* '^https?://';
  v_file := coalesce(v_dati ->> 'file_url', '') ~* '^https?://';
  v_modalita := coalesce(nullif(v_dati ->> 'modalita', ''),
                         case when v_video or v_file then 'streaming' end);
  v_font := coalesce(btrim(v_dati ->> 'titolo_font'), '') <> '';

  if coalesce(btrim(v_dati ->> 'titolo'), '') = ''
     or coalesce(btrim(v_dati ->> 'regista'), '') = ''
     or v_anno is null or v_anno not between 1900 and 2100
     or v_durata is null or v_durata not between 1 and 600
     or coalesce(btrim(v_dati ->> 'sinossi'), '') = ''
     or coalesce(btrim(v_dati ->> 'fotogramma'), '') = '' then
    raise exception 'Mancano dati obbligatori: titolo, anno, durata, regia, sinossi e fotogramma'
      using errcode = '22023';
  end if;
  if v_modalita is null or v_modalita not in ('streaming', 'scheda') then
    raise exception 'Scegli se il corto si potrà guardare in Cortoteca o se proponi la sola scheda'
      using errcode = '22023';
  end if;
  if v_modalita = 'streaming' and not (v_video or v_file) then
    raise exception 'Per lo streaming serve il collegamento al video, o quello da cui scaricare il file'
      using errcode = '22023';
  end if;
  if v_modalita = 'scheda' and (v_video or v_file) then
    raise exception 'Hai scelto la sola scheda: togli il collegamento al video, oppure scegli lo streaming'
      using errcode = '22023';
  end if;

  -- Licenza già accettata per questa proposta: dello stesso tipo, sul testo
  -- oggi in vigore e, se c'è un carattere tipografico, con la dichiarazione
  -- sulla sua licenza
  select l.id into v_licenza
  from public.licenze l
  where l.proposta_id = p_id and l.revocata_il is null
    and l.tipo = v_modalita
    and l.versione_testo = (privato.testo_in_vigore(v_modalita)).versione
    and (not v_font or coalesce((l.risposte ->> 'font_web')::boolean, false))
  order by l.accettata_il desc
  limit 1;

  if v_licenza is null then
    if v_font and not coalesce((p_risposte ->> 'font_web')::boolean, false) then
      raise exception 'Conferma che la licenza del carattere tipografico ne consente l''uso su un sito web'
        using errcode = '22023';
    end if;
    v_licenza := privato.registra_licenza(
      p_id, null, v_dati ->> 'titolo', p_nome, p_risposte, p_consensi, p_versione, v_modalita);
  end if;

  update public.proposte
    set stato = 'inviata', inviata_il = now(), nota_revisione = null
    where id = p_id;

  return jsonb_build_object('licenza_id', v_licenza, 'tipo', v_modalita);
end;
$$;

-- --------------------------------------------------------------------------
-- Opere già online: il tipo dipende dal video
-- --------------------------------------------------------------------------
drop function public.le_mie_opere();

create function public.le_mie_opere()
returns table (
  opera_id bigint,
  codice text,
  titolo text,
  anno smallint,
  pubblicata boolean,
  serve text,
  licenza_id bigint,
  licenza_del timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, o.codice, o.titolo, o.anno, o.pubblicata,
         case when coalesce(btrim(o.video_url), '') = '' then 'scheda' else 'streaming' end,
         l.id, l.accettata_il
  from privato.opere_soci os
  join public.opere o on o.id = os.opera_id
  left join lateral (
    select x.id, x.accettata_il
    from public.licenze x
    where x.opera_id = o.id and x.revocata_il is null
      and (x.tipo = 'streaming' or coalesce(btrim(o.video_url), '') = '')
    order by x.accettata_il desc
    limit 1
  ) l on true
  where os.email = privato.email_utente()
  order by o.anno desc, o.id desc;
$$;

revoke all on function public.le_mie_opere() from public, anon;
grant execute on function public.le_mie_opere() to authenticated;

create or replace function public.accetta_licenza_opera(
  p_opera_id bigint,
  p_nome text,
  p_risposte jsonb,
  p_consensi jsonb,
  p_versione text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titolo text;
  v_video text;
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

  return privato.registra_licenza(
    null, p_opera_id, v_titolo, p_nome, p_risposte, p_consensi, p_versione,
    case when coalesce(btrim(v_video), '') = '' then 'scheda' else 'streaming' end);
end;
$$;

-- --------------------------------------------------------------------------
-- Approvazione: colonne nuove, e niente video con la sola scheda
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

  if coalesce(btrim(v_o.video_url), '') <> '' and not exists (
    select 1 from public.licenze
    where proposta_id = p_id and revocata_il is null and tipo = 'streaming'
  ) then
    raise exception 'Il socio ha autorizzato la sola scheda: togli il collegamento al video'
      using errcode = '55000';
  end if;

  insert into public.opere
    (codice, titolo, anno, durata, regista, produzione, produzione_cdl,
     collaborazione_cdl, generi, tagline, sinossi, note_regia, fotogramma,
     video_url, letterboxd_url, sceneggiatura, produttore, fotografia,
     montaggio, colonna_sonora, scenografia, suono, trucco, costumi,
     altri_ruoli, titolo_png, titolo_font, pubblicata)
  values
    (v_o.codice, v_o.titolo, v_o.anno, v_o.durata, v_o.regista, v_o.produzione,
     coalesce(v_o.produzione_cdl, false), coalesce(v_o.collaborazione_cdl, false),
     coalesce(v_o.generi, '{}'), v_o.tagline, v_o.sinossi, v_o.note_regia,
     v_o.fotogramma, v_o.video_url, v_o.letterboxd_url, v_o.sceneggiatura,
     v_o.produttore, v_o.fotografia, v_o.montaggio, v_o.colonna_sonora,
     v_o.scenografia, v_o.suono, v_o.trucco, v_o.costumi,
     coalesce(v_o.altri_ruoli, '[]'), v_o.titolo_png, v_o.titolo_font,
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
-- Gestione: "licenza attiva" vuol dire adatta all'opera
-- --------------------------------------------------------------------------
create or replace function public.opere_titolari()
returns table (opera_id bigint, email text, nome text, in_regola boolean, licenza_attiva boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privato.e_redattore() then
    raise exception 'Riservato ai redattori' using errcode = '42501';
  end if;
  return query
    select os.opera_id, os.email, s.nome,
           coalesce(privato.email_in_regola(os.email), false),
           privato.licenza_valida(os.opera_id)
    from privato.opere_soci os
    left join lateral privato.socio_di(os.email) s on true;
end;
$$;
