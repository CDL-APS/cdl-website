#!/usr/bin/env python3
"""Scrive le pagine delle anteprime E e F: barra e piede sono uguali in tutte,
quindi stanno qui una volta sola. File di prova, non fa parte del sito."""
import pathlib

QUI = pathlib.Path(__file__).parent
PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72L19 12 8 5.14Z"/></svg>'
# → verso un elenco o un'altra pagina
FRECCIA = '<svg class="freccia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg>'
LENTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>'
ICONA_LISTA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'
ICONA_GALLERIA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>'
ICONA_FERMA = '<svg class="icona-ferma" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.5" height="14" rx="1"/><rect x="13.5" y="5" width="4.5" height="14" rx="1"/></svg>'
ICONA_RIPRENDI = PLAY.replace('<svg', '<svg class="icona-riprendi"')
CARATTERI = 'family=Montserrat:wght@500;600;700;900'
FRASE = "CDL &egrave; un'associazione di promozione sociale che si occupa di sostenere, diffondere ed esplorare il cinema giovane e indipendente, attraverso la realizzazione di progetti cinematografici e l'organizzazione di eventi."
CORTOTECA = "La Cortoteca di CDL &egrave; lo spazio dedicato alle opere dei soci di CDL APS che ne fanno richiesta, ideata per scoprire progetti di cinema indipendente e conoscere realt&agrave; del territorio tramite lo streaming direttamente sul sito."
SOSTIENI = "Associarti a CDL significa contribuire attivamente al nostro progetto di diffusione della cultura cinematografica indipendente."


def fit(testo, classe=''):
    return f'<span class="fit{classe}" aria-hidden="true"><span class="fit-testo">{testo}</span></span>'


def occhi(elenco, rientro=20):
    """Occhi sparsi: (x, y, diametro), con le unità scritte per esteso."""
    spazio = ' ' * rientro
    return '\n'.join(
        f'{spazio}<span class="occhio" style="--x:{x};--y:{y};--d:{d}"><span class="pupilla"></span></span>'
        for x, y, d in elenco)


def voci_barra(p, solo_socio):
    """Le voci della barra. Con solo_socio restano il marchio e l'invito ad
    associarsi (per ora così sulla Cortoteca della proposta G)."""
    if solo_socio:
        return '            <!-- Per ora la barra della Cortoteca porta solo l\'invito ad associarsi -->'
    return f'''            <a class="nav__voce" href="eventi.html" style="--punto: var(--blu)">Eventi</a>
            <a class="nav__voce" href="produzioni.html" style="--punto: var(--lilla)">Produzioni</a>
            <a class="nav__cortoteca" href="anteprime/{p}-cortoteca.html"{{corrente}}>{PLAY}Cortoteca</a>'''


def testa(p, titolo, descrizione, corpo='', solo_socio=False):
    return f'''<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>{titolo}</title>
    <meta name="description" content="{descrizione}">
    <meta name="robots" content="noindex">
    <!-- Anteprima: gli indirizzi relativi partono dalla radice del sito -->
    <base href="/">
    <link rel="icon" type="image/png" href="assets/img/brand/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?{CARATTERI}&display=swap">
    <link rel="stylesheet" href="anteprime/comune.css">
    <link rel="stylesheet" href="anteprime/{p}.css">
</head>
<body{corpo}>

    <header class="nav">
        <div class="wrap nav__riga">
            <a class="skip-link" href="anteprime/{p}-{{pagina}}.html#top">Vai al contenuto</a>
            <a class="nav__logo" href="anteprime/{p}-home.html" aria-label="CDL, pagina iniziale"><span class="logo"></span></a>
{voci_barra(p, solo_socio)}
            <a class="btn btn--pieno nav__socio" href="anteprime/{p}-home.html#socio">Diventa socio</a>
        </div>
    </header>
'''


def piede(p, classe=''):
    return f'''
        <div class="piede{classe}">
            <div class="wrap piede__riga">
                <a href="anteprime/{p}-home.html" aria-label="CDL, pagina iniziale"><span class="logo"></span></a>
                <nav class="piede__elenchi" aria-label="Pagine e contatti">
                    <ul>
                        <li><a href="eventi.html">Eventi</a></li>
                        <li><a href="produzioni.html">Produzioni</a></li>
                        <li><a href="anteprime/{p}-cortoteca.html">Cortoteca</a></li>
                        <li><a href="vantaggi-tesseramento.html">Vantaggi per i soci</a></li>
                    </ul>
                    <ul>
                        <li><a href="https://instagram.com/cdl_aps" target="_blank" rel="noopener">Instagram</a></li>
                        <li><a href="https://www.youtube.com/@cdl_aps" target="_blank" rel="noopener">YouTube</a></li>
                        <li><a href="mailto:ciao@cdlaps.com">ciao@cdlaps.com</a></li>
                    </ul>
                </nav>
                <p class="piede__dati">Associazione di promozione del cinema giovane e indipendente<br>
                CDL APS &bull; Viale Laurana 13, Rimini, 47921 &bull; CF: 91200080405 &bull; 2026</p>
            </div>
        </div>
    </footer>

    <script src="assets/js/dati.js"></script>
    <script src="anteprime/comune.js"></script>
    <script src="anteprime/{p}.js"></script>
</body>
</html>
'''


def sostieni(p, titolo, stato='Il tesseramento 2026 &egrave; aperto.'):
    """Chiusura della home: l'invito a sostenere CDL, in arancio, e il piede."""
    return f'''
    <footer class="closing fondo-arancio" id="socio">
        <div class="wrap sostieni">
            {titolo}
            <div class="grid sostieni__corpo">
                <div class="span-7">
                    <p class="sostieni__frase">{SOSTIENI}</p>
                    <p class="sostieni__stato"><span class="rec"></span>{stato}</p>
                    <div class="btn-riga">
                        <a class="btn btn--pieno" href="https://wa.me/393493290864?text=Ciao,%20vorrei%20diventare%20socio%20di%20CDL%20APS" target="_blank" rel="noopener">Diventa socio</a>
                        <a class="btn" href="mailto:ciao@cdlaps.com?subject=Richiesta%20Diventare%20Socio">Scrivici</a>
                    </div>
                    <a class="link" href="vantaggi-tesseramento.html">Tutti i vantaggi per i soci {FRECCIA}</a>
                </div>
                <a class="span-4 start-9 sostieni__tessera" href="vantaggi-tesseramento.html" aria-label="I vantaggi per i soci">
                    <img src="assets/img/partner/tessera-cdl.png" alt="" width="1080" height="1080" loading="lazy">
                </a>
            </div>
        </div>''' + piede(p)


def chiusura_cortoteca(p, classe, elenco):
    """Chiusura della Cortoteca: che cos'è, l'invito ad associarsi e, nella
    colonna libera a destra, i suoi occhi."""
    return f'''
    <footer class="closing closing--breve">
        <div class="wrap grid">
            <div class="span-8">
                <p class="lead">{CORTOTECA}</p>
                <a class="btn btn--pieno" href="anteprime/{p}-home.html#socio">Diventa socio</a>
            </div>
            <div class="span-3 start-10 occhi-chiusura{classe}" aria-hidden="true">
{occhi(elenco, 16)}
            </div>
        </div>''' + piede(p, ' piede--lilla')


def strumenti(prima_galleria=False):
    """Ricerca, vista e ordine. Con prima_galleria la galleria è la vista
    predefinita e viene per prima; la lista si chiede con ?vista=lista."""
    lista = f'''<input type="radio" name="vista" id="vista-lista" value="lista"{'' if prima_galleria else ' checked'}>
                        <label for="vista-lista" class="scelta">{ICONA_LISTA}Lista</label>'''
    galleria = f'''<input type="radio" name="vista" id="vista-galleria" value="galleria"{' checked' if prima_galleria else ''}>
                        <label for="vista-galleria" class="scelta">{ICONA_GALLERIA}Galleria</label>'''
    viste = f'{galleria}\n                        {lista}' if prima_galleria else f'{lista}\n                        {galleria}'
    return f'''<div class="strumenti">
                    <label class="campo" for="db-search">
                        {LENTE}
                        <span class="sr-only">Cerca un'opera</span>
                        <input type="search" id="db-search" placeholder="Cerca per titolo o regista" autocomplete="off">
                    </label>
                    <div class="scelte scelte--vista" role="group" aria-label="Vista">
                        {viste}
                    </div>
                    <div class="scelte" role="group" aria-label="Ordina le opere">
                        <input type="radio" name="ordine" id="ordine-anno" value="anno" checked>
                        <label for="ordine-anno" class="scelta">Per anno</label>
                        <input type="radio" name="ordine" id="ordine-nome" value="nome">
                        <label for="ordine-nome" class="scelta">Per nome</label>
                    </div>
                </div>'''


def scrivi(nome, *pezzi, pagina, corrente=''):
    html = ''.join(pezzi).replace('{pagina}', pagina).replace('{corrente}', corrente)
    (QUI / nome).write_text(html, encoding='utf-8')


# -------------------------------------------------------- E · Indice grande
RULLINO = [
    ('short-talks-al-not-2026.html', 'short-talks-al-not-2026/foto-6.jpg', 'Spettatori fra le poltrone del Supercinema'),
    ('longstoryshort.html', 'long-story-short-2026/foto-3.jpg', 'Una troupe al tramonto in riva al mare'),
    ('short-talks-al-not-2025.html', 'short-talks-al-not-2025/foto-3.jpg', 'Il pubblico in sala'),
    ('longstoryshort.html', 'long-story-short-2026/foto-4.jpg', 'Un operatore prepara la macchina da presa'),
    ('short-talks-2.html', 'short-talks-2/foto-4.jpg', 'Un biglietto di Short Talks davanti alle poltrone della sala'),
    ('short-talks-off-1.html', 'short-talks-off-1/foto-2.jpg', 'Un autore risponde alle domande del pubblico'),
    ('blue-hour.html', 'blue-hour/foto-1.jpg', 'Il pubblico sulla sabbia sotto le lanterne blu'),
    ('short-talks-al-not-2025.html', 'short-talks-al-not-2025/foto-6.jpg', 'Il pubblico durante il dialogo con gli autori'),
]


def rullino(cursore=''):
    return '\n'.join(
        f'                    <a class="cornice" href="{h}"{cursore}><img src="assets/img/eventi/{f}" alt="{a}" loading="lazy"></a>'
        for h, f, a in RULLINO)


def portone(ident, nome, pagina, colore, scritta):
    return f'''<li>
                        <a class="portone" href="{pagina}" style="--colore: var(--{colore}); --scritta: var(--{scritta})">
                            <h2 class="portone__nome"><span class="sr-only">{nome}</span>{fit(nome)}</h2>
                            <span class="portone__riga">
                                <span class="portone__nota" id="nota-{ident}"></span>
                                <span class="portone__freccia">{FRECCIA}</span>
                            </span>
                        </a>
                    </li>'''


e_home = f'''
    <main id="top">
        <!-- APERTURA: il marchio a tutta larghezza, la frase su una riga, e al
             piede il nastro delle ultime notizie -->
        <section class="hero hero--home">
            <div class="wrap">
                <div class="marchio" role="img" aria-label="CDL">
                    <span class="lettera"></span><span class="lettera"></span><span class="lettera"></span>
                </div>
                <h1 class="claim">
                    <span class="sr-only">Cinema giovane e indipendente</span>
                    {fit('Cinema giovane e indipendente', ' solo-largo')}
                    {fit('Cinema giovane', ' solo-stretto')}
                    {fit('e indipendente', ' solo-stretto')}
                </h1>
                <div class="grid hero__piede">
                    <p class="lead span-7">{FRASE}</p>
                    <!-- Sul computer l'invito ai soci è già nella barra: qui compare solo su telefono -->
                    <div class="btn-riga span-5 hero__azioni">
                        <a class="btn btn--pieno" href="anteprime/e-cortoteca.html">{PLAY}Guarda i corti</a>
                        <a class="btn solo-telefono" href="anteprime/e-home.html#socio">Diventa socio</a>
                    </div>
                </div>
            </div>
            <div class="nastro scorre" id="nastro" role="group" aria-label="Ultime notizie">
                <div class="scorre__pista"></div>
                <button class="scorre__pausa" type="button" aria-pressed="false">
                    <span class="sr-only">Ferma lo scorrimento delle notizie</span>{ICONA_FERMA}{ICONA_RIPRENDI}
                </button>
            </div>
        </section>

        <!-- L'INDICE GRANDE: le tre sezioni del sito, ognuna col nome a tutta
             larghezza e l'ultima cosa accaduta. Le note le mette e.js. -->
        <section id="indice" aria-label="Le sezioni del sito">
            <div class="wrap">
                <ul class="portoni">
                    {portone('eventi', 'Eventi', 'eventi.html', 'blu', 'azzurro')}
                    {portone('produzioni', 'Produzioni', 'produzioni.html', 'lilla', 'nero')}
                    {portone('cortoteca', 'Cortoteca', 'anteprime/e-cortoteca.html', 'nero', 'lilla')}
                </ul>
            </div>
        </section>

        <!-- DALLE SALE E DAI SET: il rullino scorre piano; ogni foto porta al suo evento -->
        <section id="sale" class="scorre" aria-labelledby="titolo-sale">
            <div class="wrap testa-riga">
                <h2 id="titolo-sale">Dalle sale e dai set</h2>
                <button class="btn scorre__pausa" type="button" aria-pressed="false"><span data-testo>Ferma</span><span class="sr-only"> lo scorrimento delle fotografie</span></button>
            </div>
            <div class="scorre__finestra">
                <div class="scorre__pista">
{rullino()}
                </div>
            </div>
        </section>
    </main>
'''

e_titolo_sostieni = '''<h2>
                <span class="sr-only">Sostieni CDL</span>
                <span class="fit" aria-hidden="true"><span class="fit-testo">Sostieni<span class="logo"></span></span></span>
            </h2>'''


def pagina_cortoteca(lettura='', prima_galleria=False):
    """La pagina della Cortoteca è la stessa nelle due proposte: il nome a
    tutta larghezza, gli strumenti, le opere. Cambia come sono disegnate."""
    return f'''
    <main id="top">
        <section class="hero hero--cortoteca">
            <div class="wrap">
                <h1 class="parola"><span class="sr-only">Cortoteca</span>{fit('Cortoteca')}</h1>
                {strumenti(prima_galleria)}{lettura}
                <div id="opere"></div>
            </div>
        </section>
    </main>
'''


scrivi('e-home.html',
       testa('e', 'CDL APS: cinema giovane e indipendente a Rimini (anteprima E)',
             'Associazione riminese che produce cortometraggi e organizza serate di cinema indipendente.'),
       e_home, sostieni('e', e_titolo_sostieni), pagina='home')
scrivi('e-cortoteca.html',
       testa('e', 'Cortoteca: i corti dei soci di CDL APS (anteprima E)',
             'I cortometraggi dei soci di CDL APS, da guardare in streaming sul sito.', ' class="fondo-sala stanza"'),
       pagina_cortoteca(),
       chiusura_cortoteca('e', '', [('30%', '34%', '58px'), ('62%', '70%', '36px'), ('84%', '24%', '44px')]),
       pagina='cortoteca', corrente=' aria-current="page"')
print('E scritta')


# ----------------------------------------------------------------- F · Sala
rullino_f = rullino(' data-cursore="Apri"')


def porta(ident, nome, pagina, colore, scritta):
    return f'''<li>
                        <a class="porta" href="{pagina}" style="--colore: var(--{colore}); --scritta: var(--{scritta})">
                            <h2 class="porta__nome">{nome}</h2>
                            <p class="porta__nota" id="nota-{ident}"></p>
                            <span class="porta__foto cornice" id="foto-{ident}"></span>
                            <span class="porta__freccia">{FRECCIA}</span>
                        </a>
                    </li>'''


f_home = f'''
    <main id="top">
        <!-- APERTURA: la sala vista dall'alto, al buio. Una luce segue il
             puntatore, come la torcia della maschera. -->
        <section class="hero hero--sala">
            <img class="hero__foto" src="assets/img/sfondi/wallpaper-cdl.jpg" alt="" width="2400" height="1601" fetchpriority="high">
            <div class="hero__buio" aria-hidden="true"></div>
            <div class="wrap">
                <div class="marchio" role="img" aria-label="CDL">
                    <span class="lettera"></span><span class="lettera"></span><span class="lettera"></span>
                </div>
                <h1 class="claim">Cinema giovane e indipendente</h1>
                <p class="lead">{FRASE}</p>
                <!-- Sul computer l'invito ai soci è già nella barra: qui compare solo su telefono -->
                <div class="btn-riga">
                    <a class="btn btn--pieno" href="anteprime/f-cortoteca.html">{PLAY}Guarda i corti</a>
                    <a class="btn solo-telefono" href="anteprime/f-home.html#socio">Diventa socio</a>
                </div>
            </div>
        </section>

        <!-- L'INDICE: le tre sezioni del sito, ognuna con l'ultima cosa
             accaduta. Le note e le fotografie le mette f.js. -->
        <section id="indice" aria-label="Le sezioni del sito">
            <div class="wrap">
                <ul class="porte">
                    {porta('eventi', 'Eventi', 'eventi.html', 'blu', 'azzurro')}
                    {porta('produzioni', 'Produzioni', 'produzioni.html', 'lilla', 'nero')}
                    {porta('cortoteca', 'Cortoteca', 'anteprime/f-cortoteca.html', 'nero', 'lilla')}
                </ul>
            </div>
        </section>

        <!-- DALLE SALE E DAI SET: il rullino scorre piano; ogni foto porta al suo evento -->
        <section id="sale" class="scorre" aria-labelledby="titolo-sale">
            <div class="wrap testa-riga">
                <h2 id="titolo-sale">Dalle sale e dai set</h2>
                <button class="btn scorre__pausa" type="button" aria-pressed="false"><span data-testo>Ferma</span><span class="sr-only"> lo scorrimento delle fotografie</span></button>
            </div>
            <div class="scorre__finestra">
                <div class="scorre__pista">
{rullino_f}
                </div>
            </div>
        </section>
    </main>
'''

f_titolo_sostieni = '<h2 class="sostieni__titolo">Sostieni <span class="logo" role="img" aria-label="CDL"></span></h2>'

scrivi('f-home.html',
       testa('f', 'CDL APS: cinema giovane e indipendente a Rimini (anteprima F)',
             'Associazione riminese che produce cortometraggi e organizza serate di cinema indipendente.'),
       f_home, sostieni('f', f_titolo_sostieni), pagina='home')
scrivi('f-cortoteca.html',
       testa('f', 'Cortoteca: i corti dei soci di CDL APS (anteprima F)',
             'I cortometraggi dei soci di CDL APS, da guardare in streaming sul sito.', ' class="fondo-sala stanza"'),
       pagina_cortoteca('\n                <p class="lettura" id="lettura" aria-live="polite"></p>'),
       chiusura_cortoteca('f', ' occhi-chiusura--piede', [('22%', '-6px', '52px'), ('52%', '2px', '34px'), ('80%', '-10px', '44px')]),
       pagina='cortoteca', corrente=' aria-current="page"')
print('F scritta')


# ------------------------------------------------- G · E e F messe insieme
# L'apertura è la sala di F, con al piede il nastro di E; sotto, l'indice
# grande, il rullino e Sostieni di E. Il rullino non ha più il pulsante: si
# ferma al passaggio o col fuoco. La Cortoteca è quella di F, con la barra
# ridotta all'invito ad associarsi e le informazioni accanto all'opera.
QUOTA = 'La quota associativa &egrave; stata ridotta per gli ultimi mesi del 2026.'


def sezione_g(ident, nome, pagina, testo=None, elenco=True):
    """Una riga dell'indice: il nome a tutta larghezza, che porta alla
    sezione, e sotto lo spazio dove al passaggio compare l'elenco breve
    (lo riempie g.js). testo permette di scrivere il nome con dei pezzi
    marcati, come le O della Cortoteca."""
    lista = (f'''
                        <ul class="sezione__elenco" id="elenco-{ident}" aria-label="{nome}: i più recenti"></ul>'''
             if elenco else '\n                        <div class="sezione__elenco" aria-hidden="true"></div>')
    return f'''<li class="sezione sezione--{ident}">
                        <h2 class="sezione__nome"><a href="{pagina}"><span class="sr-only">{nome}</span><span class="fit" aria-hidden="true"><span class="fit-testo">{testo or nome}</span></span></a></h2>{lista}
                    </li>'''


OCCHIO_O = '<span class="occhio"><span class="pupilla"></span></span>'
# Nelle due O della Cortoteca stanno due occhi, che si aprono al passaggio
CORTOTECA_O = f'C<span class="o">O{OCCHIO_O}</span>RT<span class="o">O{OCCHIO_O}</span>TECA'
# Altri occhi aspettano fuori dai bordi della pagina
OCCHI_BORDO = occhi([('0%', '26%', '58px'), ('0%', '64%', '36px'), ('100%', '16%', '44px'), ('100%', '78%', '62px')], 16)

g_home = f'''
    <main id="top">
        <!-- APERTURA: la sala vista dall'alto, al buio, con la torcia che segue
             il puntatore; al piede il nastro delle ultime notizie -->
        <section class="hero hero--sala">
            <img class="hero__foto" src="assets/img/sfondi/wallpaper-cdl.jpg" alt="" width="2400" height="1601" fetchpriority="high">
            <div class="hero__buio" aria-hidden="true"></div>
            <div class="wrap">
                <div class="marchio" role="img" aria-label="CDL">
                    <span class="lettera"></span><span class="lettera"></span><span class="lettera"></span>
                </div>
                <h1 class="claim">Cinema giovane e indipendente</h1>
                <p class="lead">{FRASE}</p>
                <!-- Sul computer l'invito ai soci è già nella barra: qui compare solo su telefono -->
                <div class="btn-riga">
                    <a class="btn btn--pieno" href="anteprime/g-cortoteca.html">{PLAY}Guarda i corti</a>
                    <a class="btn solo-telefono" href="anteprime/g-home.html#socio">Diventa socio</a>
                </div>
            </div>
            <div class="nastro scorre" id="nastro" role="group" aria-label="Ultime notizie">
                <div class="scorre__pista"></div>
                <button class="scorre__pausa" type="button" aria-pressed="false">
                    <span class="sr-only">Ferma lo scorrimento delle notizie</span>{ICONA_FERMA}{ICONA_RIPRENDI}
                </button>
            </div>
        </section>

        <!-- L'INDICE: le tre sezioni del sito, solo i nomi a tutta larghezza.
             Al passaggio su un nome tutta la sezione prende il suo colore e
             sotto compare l'elenco breve dei più recenti (lo mette g.js). La
             Cortoteca non ha elenco: si aprono gli occhi, nelle O e ai bordi. -->
        <section id="indice" aria-label="Le sezioni del sito">
            <div class="occhi-bordo" aria-hidden="true">
{OCCHI_BORDO}
            </div>
            <div class="wrap">
                <ul class="sezioni">
                    {sezione_g('eventi', 'Eventi', 'eventi.html')}
                    {sezione_g('produzioni', 'Produzioni', 'produzioni.html')}
                    {sezione_g('cortoteca', 'Cortoteca', 'anteprime/g-cortoteca.html', CORTOTECA_O, elenco=False)}
                </ul>
            </div>
        </section>

        <!-- DALLE SALE E DAI SET: il rullino scorre piano e si ferma al
             passaggio o col fuoco; ogni foto porta al suo evento -->
        <section id="sale" class="scorre" aria-labelledby="titolo-sale">
            <div class="wrap testa-riga">
                <h2 id="titolo-sale">Dalle sale e dai set</h2>
            </div>
            <div class="scorre__finestra">
                <div class="scorre__pista">
{rullino()}
                </div>
            </div>
        </section>
    </main>
'''

scrivi('g-home.html',
       testa('g', 'CDL APS: cinema giovane e indipendente a Rimini (anteprima G)',
             'Associazione riminese che produce cortometraggi e organizza serate di cinema indipendente.'),
       g_home, sostieni('g', e_titolo_sostieni, QUOTA), pagina='home')
scrivi('g-cortoteca.html',
       testa('g', 'Cortoteca: i corti dei soci di CDL APS (anteprima G)',
             'I cortometraggi dei soci di CDL APS, da guardare in streaming sul sito.',
             ' class="fondo-sala stanza barra-ridotta"', solo_socio=True),
       pagina_cortoteca(prima_galleria=True),
       chiusura_cortoteca('g', ' occhi-chiusura--piede', [('22%', '-6px', '52px'), ('52%', '2px', '34px'), ('80%', '-10px', '44px')]),
       pagina='cortoteca')
print('G scritta')
