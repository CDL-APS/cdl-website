-- ==========================================================================
-- DATI INIZIALI — le opere di data/film.json e Long Story Short 2026.
--
-- Generato da data/film.json il 2026-10-09. Le immagini vanno caricate a
-- parte nel bucket "immagini" con gli stessi percorsi (opere/<codice>.jpg,
-- eventi/lss-2026-*.jpg).
--
-- Relatività è inserita prima di Quarto Livello: fra due produzioni CDL dello
-- stesso anno conta come più recente l'ultima inserita, e la più recente è
-- Quarto Livello. I valori segnaposto del file ("/", e "NO" per la colonna
-- sonora di Lupara Verde) diventano campi vuoti.
-- ==========================================================================

insert into public.opere (codice, titolo, anno, regista, produzione, produzione_cdl, generi, tagline, sinossi, note_regia, fotogramma, video_url, letterboxd_url, sceneggiatura, produttore, fotografia, montaggio, colonna_sonora, scenografia, trucco, costumi, pubblicata)
values (
  'relativita',
  'Relatività',
  2024,
  'Francesco Pasquinelli',
  'CDL',
  true,
  array['thriller']::text[],
  'I ruoli sono effimeri, la verità è un palcoscenico grottesco',
  'Una serata fra amici accende un pensiero insolito, che porterà ad un''assurda conclusione.',
  'Il primo vero corto CDL. Citando la recensione dell''amico e critico Alessandro Della Porta: ''La relatività dell’uomo, maschera costante che non vogliamo togliere, mai''',
  'opere/relativita.jpg',
  'https://www.youtube.com/watch?v=l_Hdi3E3j5U&t=102s',
  'https://letterboxd.com/film/relativity-2024/',
  'Francesco Pasquinelli',
  'Francesco Pasquinelli, Elena Piccari, Matteo G. Bernardi',
  'Riccardo Montanini',
  'Anna Bellini',
  'Matteo G. Bernardi',
  'Elena Piccari, Simone Ruvioli',
  'Giulia Forti',
  'Elena Piccari, Simone Ruvioli',
  true
);

insert into public.opere (codice, titolo, anno, regista, produzione, produzione_cdl, generi, tagline, sinossi, note_regia, fotogramma, video_url, letterboxd_url, sceneggiatura, produttore, fotografia, montaggio, colonna_sonora, scenografia, trucco, costumi, pubblicata)
values (
  'quartolivello',
  'Quarto Livello',
  2024,
  'Francesco Pasquinelli',
  'CDL, Arkadia Studios',
  true,
  array['thriller', 'mistero']::text[],
  'Il cinema vero?',
  'Un regista insegue l''essenza del cinema, spingendosi oltre i limiti della creazione. Ma più si avvicina alla sua verità, più la realtà si confonde.',
  'Quarto Livello è il risultato di un ''incidente controllato'' tra influenze completamente casuali. In primis, l’ennesima visione di Funny Games e di altri capolavori del maestro Haneke, perché un po’ di sadismo non guasta; poi la passione viscerale per la rottura della quarta parete, ma senza troppi intellettualismi; infine, una serata all’Esperanto passata a guardare due poliziotti che cercavano di placare un tizio convinto che fumare indoor fosse un diritto inalienabile. Qualche altra chicca, qualche altra minuzia, ed eccolo qui.',
  'opere/quartolivello.jpg',
  null,
  'https://letterboxd.com/film/level-four/',
  'Francesco Pasquinelli',
  'Francesco Pasquinelli, Elena Piccari, Matteo G. Bernardi',
  'Matteo Cucci',
  'Luigiantonio Perri',
  'Matteo G. Bernardi',
  'Elena Piccari',
  'Arianna Ceccarelli',
  null,
  true
);

insert into public.opere (codice, titolo, anno, regista, produzione, produzione_cdl, generi, tagline, sinossi, note_regia, fotogramma, video_url, letterboxd_url, sceneggiatura, produttore, fotografia, montaggio, colonna_sonora, scenografia, trucco, costumi, pubblicata)
values (
  'versomare',
  'Verso Mare',
  2024,
  'Gabriele Rattini',
  'Gabriele Rattini',
  false,
  array['drammatico']::text[],
  '''Andiamo al mare. Si, andiamo al mare''',
  'Un ragazzo è intenzionato a togliersi la vita. Riaffiora però il ricordo di una giornata del suo passato, stravolta da un singolare incontro.',
  'Verso Mare nasce in un periodo di incertezze e dubbi paralizzanti. Analizza il viaggio per ritrovare se stessi, fidandosi del processo e apprezzando il raggiungimento dei piccoli traguardi. È un viaggio interiore attraverso paesaggi incontaminati, autentici templi naturali, che riflettono la ricerca di pace e si trasformano in palcoscenico di una possibile redenzione.',
  'opere/versomare.jpg',
  null,
  'https://letterboxd.com/film/towards-the-sea/',
  'Gabriele Rattini',
  'Gabriele Rattini',
  'Lorenzo Dellapasqua',
  'Gabriele Rattini',
  'Filippo Maria Cortellini',
  null,
  null,
  null,
  true
);

insert into public.opere (codice, titolo, anno, regista, produzione, produzione_cdl, generi, tagline, sinossi, note_regia, fotogramma, video_url, letterboxd_url, sceneggiatura, produttore, fotografia, montaggio, colonna_sonora, scenografia, trucco, costumi, pubblicata)
values (
  'luparaverde',
  'Lupara Verde',
  2025,
  'Gabriele Rattini',
  null,
  false,
  array['thriller']::text[],
  'È troppo tardi per riavere il Pianeta dalla nostra parte.',
  'Due criminali devono sbarazzarsi di un cadavere, trasportandolo attraverso una foresta che sembra ostacolare il loro cammino.',
  'Lupara Verde è un’allegoria del rapporto fra uomo e natura. Siamo stati, e continuiamo a essere, distruttori e portatori di morte nell’ecosistema. Forse oggi, le attenzioni quotidiane che riserviamo all’ambiente, non sono sufficienti a eliminare le sofferenze della natura e a cessare di subirne il malcontento.',
  'opere/luparaverde.jpg',
  null,
  'https://letterboxd.com/film/lupara-verde/',
  'Gabriele Rattini',
  'Gabriele Rattini',
  'Enea Maestri',
  'Gabriele Rattini',
  null,
  null,
  null,
  null,
  true
);

insert into public.opere (codice, titolo, anno, regista, produzione, produzione_cdl, generi, tagline, sinossi, note_regia, fotogramma, video_url, letterboxd_url, sceneggiatura, produttore, fotografia, montaggio, colonna_sonora, scenografia, trucco, costumi, pubblicata)
values (
  'andrea',
  'Andrea',
  2025,
  'Gabriele Rattini',
  'LVDA Film',
  false,
  array['drammatico']::text[],
  'È giusto restare, oppure partire?',
  'Un violinista di provincia, fortemente legato alla madre malata, deve partire per la città.',
  'L’opera è liberamente ispirata alla poesia “Eli e radghi” (Ali e radici) di Annalisa Teodorani: ''A t’ò niné / fin a fèt indurmantè / èli e ràdghi a l s’è invrucédi. / E t’una nòta pursì / da la nèbia l’è scap fùra / un pésgh in fiòur.''',
  'opere/andrea.jpg',
  null,
  'https://letterboxd.com/film/andrea-2025-1/',
  'Gabriele Rattini, Alessio Petrillo, Laura Caminati, Rebecca Renzi, Simona Bussi, Thomas Calisesi, Myriam Mosca, Andrea Bombardi',
  'Alessio Petrillo',
  'Matteo Cucci',
  'Gabriele Rattini',
  null,
  'Thomas Calisesi',
  'Rebecca Renzi, Simona Bussi',
  'Rebecca Renzi, Simona Bussi',
  true
);

-- Interpreti, nell'ordine di cast1…cast10
insert into public.interpreti (opera_id, posizione, nome, ruolo)
select o.id, v.posizione, v.nome, v.ruolo
from (values
  ('relativita', 1, 'Luca Canarecci', 'Alberto'),
  ('relativita', 2, 'Eleonora Casoni', 'Caterina'),
  ('relativita', 3, 'Enea Maestri', 'Claudio'),
  ('quartolivello', 1, 'Luca Canarecci', 'Regista, Alberto di Lucca'),
  ('quartolivello', 2, 'Angelica Giulianelli', 'Aiuto regia, Chiara Diavoletti'),
  ('quartolivello', 3, 'Nicolò Gorza', 'Poliziotto'),
  ('quartolivello', 4, 'Andrea Bombardi', 'Poliziotto'),
  ('quartolivello', 5, 'Gian Luca Neri', 'Locatore'),
  ('quartolivello', 6, 'Gianmarco Pironi', 'Attore'),
  ('quartolivello', 7, 'Alice Ronci', 'Attrice'),
  ('versomare', 1, 'Luca Canarecci', 'Ragazzo'),
  ('versomare', 2, 'Viola Dini', 'Ragazza'),
  ('luparaverde', 1, 'Luca Canarecci', 'Criminale giovane'),
  ('luparaverde', 2, 'Andrea Bombardi', 'Criminale adulto'),
  ('andrea', 1, 'Andrea Bombardi', 'Andrea'),
  ('andrea', 2, 'Laura Caminati', 'Mamma'),
  ('andrea', 3, 'Myriam Mosca', 'Ragazza della città'),
  ('andrea', 4, 'Thomas Calisesi', 'Andrea da ragazzo')
) as v (codice, posizione, nome, ruolo)
join public.opere o on o.codice = v.codice;

-- Long Story Short 2026
insert into public.eventi (codice, titolo, data_inizio, data_fine, luogo, riassunto, descrizione, copertina, miniatura, pagina, pubblicato)
values (
  'long-story-short-2026',
  'Long Story Short 2026',
  '2026-06-24',
  '2026-07-10',
  'Cinema Teatro Tiberio',
  'Produzione dal 24 al 28 giugno 2026 • Serata finale 10 luglio 2026, Cinema Teatro Tiberio',
  'Long Story Short è una sfida a tempo di brevi opere cinematografiche organizzata dall''associazione riminese CDL APS. L''evento si colloca a metà tra un laboratorio collettivo e un tradizionale contest di cortometraggi a tempo.',
  'eventi/lss-2026-copertina.jpg',
  'eventi/lss-2026-miniatura.jpg',
  'longstoryshort.html',
  true
);
