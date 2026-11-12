#!/usr/bin/env python3
"""Scrive le pagine dell'anteprima del nuovo sito: barra e piede sono uguali
in tutte, quindi stanno qui una volta sola. Le pagine degli eventi si leggono
da quelle attuali del sito. File di prova, non fa parte del sito."""
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
    associarsi (per ora così sulla Cortoteca)."""
    if solo_socio:
        return '            <!-- Per ora la barra della Cortoteca porta solo l\'invito ad associarsi -->'
    if p == 'g':
        # Le voci accanto al marchio, Cortoteca e socio a destra
        return f'''            <a class="nav__voce" href="eventi.html" style="--punto: var(--blu)">Eventi</a>
            <a class="nav__voce" href="produzioni.html" style="--punto: var(--lilla)">Produzioni</a>
            <a class="nav__voce nav__voce--contatti" href="anteprime/contatti.html#contatti" style="--punto: var(--arancio)">Contatti</a>
            <a class="nav__cortoteca" href="anteprime/cortoteca.html"{{corrente}}>{PLAY}Cortoteca</a>'''
    return f'''            <a class="nav__voce" href="eventi.html" style="--punto: var(--blu)">Eventi</a>
            <a class="nav__voce" href="produzioni.html" style="--punto: var(--lilla)">Produzioni</a>
            <a class="nav__cortoteca" href="anteprime/cortoteca.html"{{corrente}}>{PLAY}Cortoteca</a>'''


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
            <a class="skip-link" href="anteprime/{{pagina}}.html#top">Vai al contenuto</a>
            <a class="nav__logo" href="anteprime/home.html" aria-label="CDL, pagina iniziale"><span class="logo"></span></a>
{voci_barra(p, solo_socio)}
            <a class="btn btn--pieno nav__socio" href="anteprime/home.html#socio">Diventa socio</a>
        </div>
    </header>
'''


def piede(p, classe=''):
    return f'''
        <div class="piede{classe}">
            <div class="wrap piede__riga">
                <a href="anteprime/home.html" aria-label="CDL, pagina iniziale"><span class="logo"></span></a>
                <nav class="piede__elenchi" aria-label="Pagine e contatti">
                    <ul>
                        <li><a href="eventi.html">Eventi</a></li>
                        <li><a href="produzioni.html">Produzioni</a></li>
                        <li><a href="anteprime/cortoteca.html">Cortoteca</a></li>
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
    # I contatti del piede sono la meta della voce Contatti della barra
    html = html.replace('<ul>\n                        <li><a href="https://instagram.com',
                        '<ul id="contatti">\n                        <li><a href="https://instagram.com')
    # Ogni pagina del sito che ha la sua anteprima porta a quella
    html = (html.replace('href="eventi.html"', 'href="anteprime/eventi.html"')
                .replace('href="produzioni.html"', 'href="anteprime/produzioni.html"'))
    # Diventa socio porta in cima alla pagina Contatti
    html = html.replace('href="anteprime/home.html#socio"', 'href="anteprime/contatti.html"')
    # Nell'invito arancio si scrive solo dal modulo di Contatti
    html = (html.replace('href="https://wa.me/393493290864?text=Ciao,%20vorrei%20diventare%20socio%20di%20CDL%20APS" target="_blank" rel="noopener"',
                         'href="anteprime/contatti.html?motivo=socio#contatti"')
                .replace('href="mailto:ciao@cdlaps.com?subject=Richiesta%20Diventare%20Socio"',
                         'href="anteprime/contatti.html#contatti"'))
    # Pagine degli eventi, vantaggi e corti
    for evento in ('longstoryshort', 'short-talks-1', 'short-talks-2', 'short-talks-off-1', 'blue-hour',
                   'short-talks-al-not-2025', 'short-talks-3-x-laiff', 'short-talks-al-not-2026'):
        html = html.replace(f'href="{evento}.html"', f'href="anteprime/{evento}.html"')
    html = (html.replace('href="vantaggi-tesseramento.html"', 'href="anteprime/vantaggi.html"')
                .replace('href="opera.html?film=', 'href="anteprime/opera.html?film='))
    if pagina == 'contatti':
        html = html.replace('<a class="nav__voce nav__voce--contatti" href="anteprime/contatti.html#contatti"',
                            '<a class="nav__voce nav__voce--contatti" href="anteprime/contatti.html#contatti" aria-current="page"')
    voce = ({'eventi': 'eventi', 'produzioni': 'produzioni'}.get(pagina)
            or ('eventi' if 'class="pagina-evento' in html else None))
    if voce:
        html = html.replace(f'<a class="nav__voce" href="anteprime/{voce}.html"',
                            f'<a class="nav__voce" href="anteprime/{voce}.html" aria-current="page"')
    (QUI / nome).write_text(html, encoding='utf-8')


# ------------------------------------------------------ Il rullino della home
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


titolo_sostieni = '''<h2>
                <span class="sr-only">Sostieni CDL</span>
                <span class="fit" aria-hidden="true"><span class="fit-testo">Sostieni<span class="logo"></span></span></span>
            </h2>'''


def pagina_cortoteca_g(modello=''):
    """Cortoteca G: il nome, la frase a tutta larghezza, il filo, poi
    strumenti e opere"""
    return f'''
    <main id="top">
        <section class="hero hero--cortoteca">
            <div class="wrap">
                <h1 class="parola"><span class="sr-only">Cortoteca</span>{fit('Cortoteca')}</h1>
                <p class="presentazione">{CORTOTECA}</p>
                {strumenti(True)}
                <div id="opere"></div>
            </div>
        </section>{modello}
    </main>
'''


def chiusura_cortoteca_g(elenco):
    """In fondo alla Cortoteca G restano solo gli occhi, dietro il piede"""
    return f'''
    <footer class="closing closing--breve closing--occhi">
        <div class="wrap grid">
            <div class="span-3 start-10 occhi-chiusura occhi-chiusura--piede" aria-hidden="true">
{occhi(elenco, 16)}
            </div>
        </div>''' + piede('g', ' piede--lilla')


# --------------------------------------------------------------- La home
# L'apertura è la sala vista dall'alto, con al piede il nastro delle
# notizie; sotto, l'indice grande, il rullino (si ferma al passaggio o col
# fuoco) e Sostieni. La Cortoteca ha la barra ridotta all'invito ad
# associarsi.
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
                <h1 class="marchio">
                    <span class="lettera" aria-hidden="true"></span><span class="lettera" aria-hidden="true"></span><span class="lettera" aria-hidden="true"></span><span class="sr-only">CDL APS</span>
                </h1>
                <p class="lead">{FRASE}</p>
                <!-- Sul computer l'invito ai soci è già nella barra: qui compare solo su telefono -->
                <div class="btn-riga">
                    <a class="btn btn--pieno" href="anteprime/cortoteca.html">{PLAY}Guarda i corti</a>
                    <a class="btn solo-telefono" href="anteprime/home.html#socio">Diventa socio</a>
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
                    {sezione_g('cortoteca', 'Cortoteca', 'anteprime/cortoteca.html', CORTOTECA_O, elenco=False)}
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

scrivi('home.html',
       testa('g', 'CDL APS: cinema giovane e indipendente a Rimini (anteprima)',
             'Associazione riminese che produce cortometraggi e organizza serate di cinema indipendente.'),
       g_home, sostieni('g', titolo_sostieni, QUOTA), pagina='home')
print('Home scritta')


# --------------------------------------- le pagine Eventi e Produzioni
# Pagine a colore pieno, come la sezione della home quando ci si passa
# sopra: Eventi blu con le scritte azzurre, Produzioni lilla con le scritte
# nere. Si aprono col nome a tutta larghezza, nello stesso punto in cui la
# transizione dalla home lo lascia; tutto il resto lo riempie g.js dai dati.
FRECCIA_SU = '<svg class="freccia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>'


LSS_FOTO = [
    ('foto-1', "Il lancio al Cinema Teatro Tiberio, con il titolo di Long Story Short sullo schermo"),
    ('foto-2', "La domanda sulla cornice narrativa proiettata in sala durante il lancio"),
    ('foto-3', "Una troupe al tramonto in riva al mare"),
    ('foto-4', "Un operatore prepara la macchina da presa"),
    ('foto-5', "Riprese all'aperto con la giraffa per il microfono"),
    ('foto-6', "Una troupe in strada con il pannello riflettente"),
    ('foto-7', "Una troupe al montaggio"),
    ('foto-8', "La serata finale sul palco del Cinema Teatro Tiberio"),
    ('foto-9', "Il pubblico all'ingresso del Cinema Teatro Tiberio per la serata finale"),
]
RULLINO_LSS = '\n'.join(
    f'                        <a class="cornice" href="longstoryshort.html"><img src="assets/img/eventi/long-story-short-2026/{f}.jpg" alt="{a}" width="960" height="1200" loading="lazy"></a>'
    for f, a in LSS_FOTO)


def testata_pagina(nome, presentazione):
    return f'''
    <main id="top">
        <section class="hero hero--pagina">
            <div class="wrap">
                <h1 class="parola"><span class="sr-only">{nome}</span>{fit(nome)}</h1>
                <div class="presentazione entra">{''.join(f'<p>{r}</p>' for r in presentazione)}</div>
            </div>
        </section>'''


PRESENTA_EVENTI = [
    'Proponiamo eventi per la valorizzazione della cultura cinematografica locale, in sala e altrove. '
    'Il cinema come arte trasversale ha la possibilit&agrave; di raccontare il territorio attraverso i talenti che lo vivono.']
PRESENTA_PRODUZIONI = [
    'Organizziamo produzioni cinematografiche indipendenti, dalla scrittura alla post-produzione, '
    'per costruire attivamente una rete di talenti sul territorio. '
    'Vogliamo anche riportare l&rsquo;attenzione sul medium del cortometraggio, '
    'che ha il potere di raccontare una storia nello spazio di pochi minuti.',
    'I nostri soci possono chiederci una prima consulenza di produzione gratuita.']


g_eventi = testata_pagina('Eventi', PRESENTA_EVENTI) + f'''

        <!-- IN EVIDENZA: Long Story Short, col solo lettering su tre righe e
             la breve descrizione (la mette g.js), e sotto le fotografie della
             sua pagina che scorrono -->
        <section class="blocco-pagina entra" aria-labelledby="titolo-evidenza">
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="titolo-evidenza">In evidenza</h2>
                <a class="evidenza grid" id="evidenza" href="longstoryshort.html">
                    <span class="marchio-serie marchio-serie--lss span-5" role="img" aria-label="Long Story Short"></span>
                    <span class="evidenza__testo span-5 start-8">
                        <span class="evidenza__descrizione" id="evidenza-descrizione"></span>
                        <span class="evidenza__freccia">{FRECCIA_SU}</span>
                    </span>
                </a>
            </div>
            <div class="rullino scorre" aria-label="Fotografie di Long Story Short 2026">
                <div class="scorre__finestra">
                    <div class="scorre__pista">
{RULLINO_LSS}
                    </div>
                </div>
            </div>
        </section>

        <!-- Le edizioni di Short Talks, dalla più recente. In cima il format in
             due righe e l'invito a portarlo in sala, che porta al modulo di
             Contatti col motivo già scelto -->
        <section class="blocco-pagina blocco-pagina--diviso entra" id="blocco-short-talks" aria-labelledby="titolo-short-talks" hidden>
            <div class="wrap">
                <h2 class="sr-only" id="titolo-short-talks">Short Talks</h2>
                <div class="serie-descrizione">
                    <p><strong>Short Talks</strong> &egrave; il primo format firmato CDL, nato per portare il cortometraggio in sala e farlo incontrare con il suo pubblico, attraverso il dialogo con chi l&rsquo;ha realizzato.</p>
                    <p><a class="rimando-testo" href="anteprime/contatti.html?motivo=short-talks#contatti">Contattaci</a> per portare Short Talks nel tuo cinema.</p>
                </div>
                <ul class="schede"></ul>
            </div>
        </section>

        <!-- Tutto il resto: gli eventi senza serie -->
        <section class="blocco-pagina blocco-pagina--diviso entra" id="blocco-altri" aria-labelledby="titolo-altri" hidden>
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="titolo-altri">Altri eventi</h2>
                <ul class="schede"></ul>
            </div>
        </section>
    </main>
'''

g_produzioni = testata_pagina('Produzioni', PRESENTA_PRODUZIONI) + f'''

        <!-- IN EVIDENZA: il lavoro più recente. Il fotogramma grande, chiuso da
             un filo nero; a fianco il titolo (graficato in nero, se c'è), la
             frase e i dati -->
        <section class="blocco-pagina entra" aria-labelledby="titolo-evidenza">
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="titolo-evidenza">In evidenza</h2>
                <div class="primo-piano grid" id="primo-piano" hidden>
                    <a class="cornice span-8" tabindex="-1" aria-hidden="true"></a>
                    <div class="primo-piano__testo span-4">
                        <h3 class="primo-piano__titolo"></h3>
                        <p class="primo-piano__frase"></p>
                        <p class="primo-piano__dati"></p>
                        <a class="btn btn--pieno primo-piano__azione"></a>
                    </div>
                </div>
                <p class="avviso" id="avviso-produzioni" hidden></p>
            </div>
        </section>

        <!-- Le produzioni originali (produzione_cdl), dalla più recente -->
        <section class="blocco-pagina entra" id="blocco-produzioni" aria-labelledby="titolo-produzioni" hidden>
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="titolo-produzioni">Produzioni originali</h2>
                <ul class="schede"></ul>
            </div>
        </section>

        <!-- Le collaborazioni (collaborazione_cdl): il blocco compare con la prima -->
        <section class="blocco-pagina entra" id="blocco-collaborazioni" aria-labelledby="titolo-collaborazioni" hidden>
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="titolo-collaborazioni">Collaborazioni</h2>
                <ul class="schede"></ul>
            </div>
        </section>

    </main>
'''

scrivi('eventi.html',
       testa('g', 'Eventi – CDL APS (anteprima)',
             'Proiezioni, dialoghi con gli autori e una sfida a tempo di cortometraggi: gli eventi di CDL APS.',
             ' class="pagina-colore pagina-eventi"'),
       g_eventi, '\n    <footer>' + piede('g'), pagina='eventi')
scrivi('produzioni.html',
       testa('g', 'Produzioni – CDL APS (anteprima)',
             'I cortometraggi prodotti da CDL APS e quelli a cui ha collaborato.',
             ' class="pagina-colore pagina-produzioni"'),
       g_produzioni, '\n    <footer>' + piede('g'), pagina='produzioni')
print('Eventi e Produzioni scritte')


# ------------------------------------------- la pagina del singolo corto
# Prova su Quarto Livello: fondo nero, lo schermo col fotogramma e il titolo
# graficato, poi frase, sinossi, dati e crediti. Il colore della pagina è
# quello del titolo (lo ricava g.js dal file del titolo). Si arriva dalla
# galleria della Cortoteca con un'animazione: il fotogramma cresce fino a
# diventare lo schermo di questa pagina.
CORTO = '''
        <section class="hero hero--corto">
            <div class="wrap">
                <h1 class="sr-only" id="titolo-corto">Opera</h1>
                <div class="still schermo" id="schermo">
                    <span class="cornice"></span>
                    <span class="targa" id="schermo-titolo"></span>
                </div>
            </div>
        </section>

        <section class="blocco-pagina entra" aria-label="Il corto">
            <div class="wrap grid corto" id="corto" hidden>
                <div class="corto__testo span-7">
                    <p class="corto__frase" id="corto-frase"></p>
                    <p class="corto__sinossi" id="corto-sinossi"></p>
                </div>
                <dl class="corto__dati span-4 start-9" id="corto-dati"></dl>
            </div>
            <div class="wrap">
                <p class="avviso" id="corto-avviso" hidden>Opera non trovata.</p>
            </div>
        </section>

        <section class="blocco-pagina blocco-pagina--diviso entra" aria-labelledby="titolo-crediti" id="blocco-crediti" hidden>
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="titolo-crediti">Crediti</h2>
                <dl class="crediti" id="crediti"></dl>
            </div>
        </section>
'''

g_opera = '\n    <main id="top">\n' + CORTO + '    </main>\n'

scrivi('opera.html',
       testa('g', 'Opera – CDL APS (anteprima)',
             'Un cortometraggio della Cortoteca di CDL APS.',
             ' class="pagina-corto"'),
       g_opera, '\n    <footer>' + piede('g'), pagina='opera')
print('pagina del corto scritta')


# ------------------------------------------------------ la pagina Contatti
# In cima l'invito a sostenere CDL, lo stesso blocco arancio che chiude la
# home: è la meta di "Diventa socio". Più in basso il modulo di contatto,
# meta della voce "Contatti" (#contatti). Il modulo è una prima proposta: per
# l'invio si appoggia a Netlify Forms (data-netlify), che funziona solo sul
# sito pubblicato.
#
# Il destinatario dipende dal motivo. Netlify manda le notifiche per modulo,
# non per campo: ci sono quindi tre moduli, uno per indirizzo, e g.js cambia
# il form-name del modulo visibile secondo il motivo scelto. L'indirizzo di
# ciascuno si imposta su Netlify (Forms → Form notifications):
#   contatti             → ciao@cdlaps.com (anche senza JavaScript)
#   contatti-eventi      → eventi@cdlaps.com
#   contatti-produzione  → produzione@cdlaps.com
# L'oggetto della mail è il campo nascosto "subject", che Netlify usa per le
# notifiche: g.js lo compone col motivo e il nome di chi scrive.
# (codice, testo del bottone, modulo, oggetto della mail)
MOTIVI = [
    ('informazioni', 'Informazioni', 'contatti', 'Richiesta di informazioni'),
    ('socio', 'Diventare socio', 'contatti', 'Richiesta di tesseramento'),
    ('short-talks', 'Short Talks nel tuo cinema', 'contatti-eventi', 'Short Talks nel tuo cinema'),
    ('cortoteca', 'Un corto per la Cortoteca', 'contatti', 'Proposta di un corto per la Cortoteca'),
    ('collaborazione', 'Collaborare a una produzione', 'contatti-produzione', 'Proposta di produzione in collaborazione'),
    ('altro', 'Altro', 'contatti', 'Messaggio dal sito'),
]
scelte_motivo = '\n'.join(
    f'''                            <input type="radio" name="motivo" id="motivo-{v}" value="{t}" data-modulo="{m}" data-oggetto="{o}"{' checked' if i == 0 else ''}>
                            <label for="motivo-{v}" class="scelta">{t}</label>'''
    for i, (v, t, m, o) in enumerate(MOTIVI))
# Gli altri due moduli esistono solo perché Netlify li riconosca al deploy:
# stessi campi, nascosti, mai compilati
moduli_gemelli = '\n'.join(
    f'''                <form name="{m}" data-netlify="true" netlify-honeypot="campo-trappola" hidden>
                    <input name="campo-trappola"><input name="subject"><input name="motivo"><input name="nome"><input name="email"><textarea name="messaggio"></textarea><input name="consenso">
                </form>'''
    for m in ('contatti-eventi', 'contatti-produzione'))

g_contatti = f'''
    <main id="top">
        <!-- SOSTIENI: lo stesso invito che chiude la home, qui in apertura -->
        <section class="closing fondo-arancio contatti-testa" id="socio">
            <div class="wrap sostieni">
                <h1>
                    <span class="sr-only">Sostieni CDL</span>
                    <span class="fit" aria-hidden="true"><span class="fit-testo">Sostieni<span class="logo"></span></span></span>
                </h1>
                <div class="grid sostieni__corpo">
                    <div class="span-7">
                        <p class="sostieni__frase">{SOSTIENI}</p>
                        <p class="sostieni__stato"><span class="rec"></span>{QUOTA}</p>
                        <div class="btn-riga">
                            <a class="btn btn--pieno" href="anteprime/contatti.html?motivo=socio#contatti">Diventa socio</a>
                            <a class="btn" href="anteprime/contatti.html#contatti">Scrivici</a>
                        </div>
                        <a class="link" href="vantaggi-tesseramento.html">Tutti i vantaggi per i soci {FRECCIA}</a>
                    </div>
                    <a class="span-4 start-9 sostieni__tessera" href="vantaggi-tesseramento.html" aria-label="I vantaggi per i soci">
                        <img src="assets/img/partner/tessera-cdl.png" alt="" width="1080" height="1080">
                    </a>
                </div>
            </div>
        </section>

        <!-- CONTATTI: si scrive solo dal modulo, che arriva per email. In alto
             il titolo con una riga, sotto il modulo a tutta larghezza -->
        <section class="contatti" id="contatti" aria-labelledby="titolo-contatti">
            <div class="wrap">
                <div class="contatti__testa">
                    <h2 id="titolo-contatti">Scrivici</h2>
                    <p class="contatti__frase">Per una domanda, un'idea, un corto da proporre o una sala che vorrebbe ospitare Short Talks: scrivici qui, ti rispondiamo per email.</p>
                </div>

                <form class="modulo" name="contatti" method="POST" action="anteprime/contatti.html#grazie" data-netlify="true" netlify-honeypot="campo-trappola">
                    <input type="hidden" name="form-name" value="contatti">
                    <input type="hidden" name="subject" value="[Sito CDL] Messaggio dal sito">
                    <p class="sr-only"><label>Non compilare questo campo: <input name="campo-trappola" tabindex="-1" autocomplete="off"></label></p>

                    <fieldset class="modulo__gruppo">
                        <legend>Di che cosa vuoi parlarci?</legend>
                        <div class="modulo__motivi">
{scelte_motivo}
                        </div>
                    </fieldset>

                    <div class="modulo__coppia">
                        <label class="modulo__campo">
                            <span>Nome</span>
                            <input type="text" name="nome" autocomplete="name" required>
                        </label>
                        <label class="modulo__campo">
                            <span>Email</span>
                            <input type="email" name="email" autocomplete="email" required>
                        </label>
                    </div>
                    <label class="modulo__campo">
                        <span>Messaggio</span>
                        <textarea name="messaggio" rows="6" required></textarea>
                    </label>
                    <div class="modulo__piede">
                        <label class="modulo__consenso">
                            <input type="checkbox" name="consenso" required>
                            <span>Acconsento al trattamento dei dati per ricevere una risposta.</span>
                        </label>
                        <button class="btn btn--pieno" type="submit">Invia il messaggio {FRECCIA}</button>
                    </div>
                </form>
{moduli_gemelli}
            </div>
        </section>
    </main>
'''

scrivi('contatti.html',
       testa('g', 'Contatti – CDL APS (anteprima)',
             'Come diventare socio di CDL APS e come scriverci.',
             ' class="pagina-contatti"'),
       g_contatti, '\n    <footer>' + piede('g'), pagina='contatti')
print('Contatti scritta')


# La Cortoteca G apre i corti al suo interno: porta con sé il modello della
# pagina del corto, che g.js riempie e mostra sopra la galleria
MODELLO_CORTO = f'''
        <!-- Modello della pagina del corto: la Cortoteca lo apre al suo interno -->
        <template id="modello-corto">
            <div class="sala-corto pagina-corto" role="dialog" aria-modal="true" aria-labelledby="titolo-corto">
                <button class="sala-corto__chiudi" type="button" aria-label="Chiudi e torna alla Cortoteca"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
{CORTO}            </div>
        </template>
'''
scrivi('cortoteca.html',
       testa('g', 'Cortoteca: i corti dei soci di CDL APS (anteprima)',
             'I cortometraggi dei soci di CDL APS, da guardare in streaming sul sito.',
             ' class="fondo-sala stanza barra-ridotta"', solo_socio=True),
       pagina_cortoteca_g(MODELLO_CORTO),
       chiusura_cortoteca_g([('22%', '-6px', '52px'), ('52%', '2px', '34px'), ('80%', '-10px', '44px')]),
       pagina='cortoteca')


# ------------------------------------------------- le pagine degli eventi
# Le pagine statiche degli eventi, ridisegnate: in cima la grafica
# dell'evento (la stessa della sua scheda in Eventi, che cresce fin qui),
# sotto il nome, il racconto e i dati; poi programma, materiali e fotografie.
# Il contenuto si legge dalle pagine attuali, così resta uno solo.
import json
import re
import struct

EVENTI_DB = {e['pagina']: e for e in json.loads((QUI.parent / 'data/eventi.json').read_text(encoding='utf-8'))}
PAGINE_EVENTO = ['longstoryshort.html', 'short-talks-1.html', 'short-talks-2.html', 'short-talks-off-1.html',
                 'blue-hour.html', 'short-talks-al-not-2025.html', 'short-talks-3-x-laiff.html',
                 'short-talks-al-not-2026.html']
MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto',
        'settembre', 'ottobre', 'novembre', 'dicembre']
FRECCIA_FUORI = ('<svg class="freccia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" '
                 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/>'
                 '<path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/></svg>')


def quando(evento):
    """24 giugno – 10 luglio 2026; 18 aprile 2024"""
    a = [int(x) for x in evento['data_inizio'].split('-')]
    if not evento.get('data_fine'):
        return f'{a[2]} {MESI[a[1] - 1]} {a[0]}'
    b = [int(x) for x in evento['data_fine'].split('-')]
    inizio = f'{a[2]} {MESI[a[1] - 1]}' + (f' {a[0]}' if a[0] != b[0] else '')
    return f'{inizio} &ndash; {b[2]} {MESI[b[1] - 1]} {b[0]}'


def senza_commenti(testo):
    return re.sub(r'\s*<!--.*?-->', '', testo, flags=re.S)


def rullino_evento(contenuto):
    """Le fotografie della galleria, in fila, ognuna con le sue proporzioni"""
    foto = []
    for img in re.findall(r'<img [^>]*>', contenuto):
        w = re.search(r'width="(\d+)"', img).group(1)
        h = re.search(r'height="(\d+)"', img).group(1)
        foto.append(f'                        <span class="cornice" style="--rapporto: {w} / {h}">{img}</span>')
    crediti = re.search(r'<p class="galleria-crediti">(.*?)</p>', contenuto, re.S)
    return '\n'.join(foto), (crediti.group(1) if crediti else '')


def materiali_evento(contenuto):
    """I materiali dell'edizione: una riga ciascuno, con la freccia giusta"""
    righe = []
    for attributi, titolo in re.findall(r'<a (href="[^"]*"[^>]*?) class="[^"]*">.*?<h3 class="scheda-titolo">(.*?)</h3>', contenuto, re.S):
        fuori = 'target="_blank"' in attributi
        righe.append(f'''                    <li><a class="riga-g" {attributi}>
                        <span class="riga-g__titolo">{titolo}</span>
                        <span class="riga-g__freccia">{FRECCIA_FUORI if fuori else FRECCIA_SU}</span>
                    </a></li>''')
    return '                <ul class="righe-g">\n' + '\n'.join(righe) + '\n                </ul>'


def blocco_evento(ident, titolo, contenuto, testa=True):
    """Un blocco col suo titoletto; senza (testa=False) il titolo resta solo
    per i lettori di schermo"""
    intestazione = (f'<h2 class="blocco-pagina__testa" id="{ident}">{titolo}</h2>' if testa
                    else f'<h2 class="sr-only" id="{ident}">{titolo}</h2>')
    return f'''
        <section class="blocco-pagina blocco-pagina--diviso entra" aria-labelledby="{ident}">
            <div class="wrap">
                {intestazione}
{contenuto}
            </div>
        </section>
'''


def blocco_galleria(contenuto):
    foto, crediti = rullino_evento(contenuto)
    nota = f'\n            <div class="wrap"><p class="rullino__crediti">{crediti}</p></div>' if crediti else ''
    return f'''
        <section class="blocco-pagina blocco-pagina--diviso entra" aria-labelledby="blocco-galleria">
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="blocco-galleria">Galleria</h2>
            </div>
            <div class="rullino rullino--evento scorre">
                <div class="scorre__finestra">
                    <div class="scorre__pista">
{foto}
                    </div>
                </div>
            </div>{nota}
        </section>
'''


# I vincitori di Long Story Short 2026, dal documento delle premiazioni (Drive
# "Eventi", Valutazione progetti). Regia e durata dal volantino della serata
# finale; le still sono in assets/img/eventi/long-story-short-2026/vincitori/.
# Ogni corto ha vinto almeno un premio: per primo il Miglior film, poi gli
# altri dal più premiato.
VINCITORI_LSS = [
    ('path', 'Path', 'Lorenzo Muccioli', 12, 'Un uomo col fez rosso legge un foglio a una scrivania',
     ['Miglior film', 'Menzione per l&rsquo;interpretazione &middot; Enrico Battarra']),
    ('emilio', 'Emilio', 'Luca Canarecci', 12, 'Un ragazzo e un uomo sulla banchina del porto',
     ['Miglior regia &middot; Luca Canarecci', 'Miglior montaggio &middot; Cristian Morello e Gabriele Rattini',
      'Menzione per l&rsquo;interpretazione &middot; Gabriele Rattini']),
    ('scintille', 'Scintille', 'Leonardo Paganelli', 12, 'Un ragazzo con gli occhiali da sole controluce sul fiume',
     ['Miglior interpretazione &middot; Sophia Anna Losito', 'Miglior fotografia &middot; Jacopo Todoli']),
    ('capolinea', 'Capolinea', 'Vittoria Casarini', 4, 'Un uomo tatuato tende un telo di plastica davanti al mare',
     ['Miglior sonoro &middot; Alessandro Fabbri',
      'Premio stampa &ldquo;Nuovi Sguardi&rdquo; &middot; giuria stampa The Soundcheck']),
    ('umanita-perduta', 'L&rsquo;Umanit&agrave; Perduta', 'Ivan Petrovi&#263;-Poljak', 11, 'Una ragazza seduta nell&rsquo;erba, sotto il fucile di una sentinella',
     ['Miglior soggetto &middot; Ivan Petrovi&#263;-Poljak']),
    ('solo-per-l-estate', 'Solo per l&rsquo;estate', 'Manuel Baggiarini', 10, 'Un ragazzo legge un giornale fra i teli di plastica, visto dall&rsquo;alto',
     ['Miglior produzione &middot; troupe I Fondo Perduto']),
    ('le-cose-che-restano', 'Le Cose che Restano', 'Gabriele Montanaro', 11, 'Due ragazzi al porto turistico, al tramonto',
     ['Menzione per la produzione &middot; Gabriele Montanaro e Mari Colavalle']),
]


def vincitore(codice, titolo, regia, minuti, alt, premi, primo=False):
    elenco = '\n'.join(f'                                <li>{p}</li>' for p in premi)
    return f'''                    <li class="vincitore{' vincitore--primo' if primo else ''}">
                        <span class="cornice"><img src="assets/img/eventi/long-story-short-2026/vincitori/{codice}.jpg" alt="{alt}" loading="lazy"></span>
                        <div class="vincitore__testo">
                            <h3 class="vincitore__corto">{titolo}</h3>
                            <p class="vincitore__dati">{regia} &middot; {minuti}&rsquo;</p>
                            <ul class="vincitore__premi">
{elenco}
                            </ul>
                        </div>
                    </li>'''


VINCITORI = f'''
        <!-- VINCITORI: i sette corti della prima edizione, ognuno coi suoi
             premi; Path, Miglior film, apre il blocco più grande -->
        <section class="blocco-pagina blocco-pagina--diviso entra" aria-labelledby="blocco-vincitori">
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="blocco-vincitori">Vincitori</h2>
                <ul class="vincitori">
{chr(10).join(vincitore(*v, primo=(i == 0)) for i, v in enumerate(VINCITORI_LSS))}
                </ul>
            </div>
        </section>
'''


# I partner della prima edizione: i loghi della cartella Grafica/Loghi del
# Drive "Eventi" (senza LSSxRCF e Rimini Creative Field), tutti in nero e
# rifilati; ognuno ha la sua larghezza, perché pesino tutti uguale
PARTNER_LSS = '''
        <section class="blocco-pagina blocco-pagina--diviso entra" aria-labelledby="blocco-partner">
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="blocco-partner">Partner</h2>
                <ul class="partner">
                    <li><img src="assets/img/eventi/long-story-short-2026/partner/cinema-teatro-tiberio.png" alt="Cinema Teatro Tiberio" style="--w: 124px" loading="lazy"></li>
                    <li><img src="assets/img/eventi/long-story-short-2026/partner/arkadia-studios.png" alt="Arkadia Studios" style="--w: 148px" loading="lazy"></li>
                    <li><img src="assets/img/eventi/long-story-short-2026/partner/la-valigia-dell-attore.png" alt="La Valigia dell&rsquo;Attore" style="--w: 75px" loading="lazy"></li>
                    <li><img src="assets/img/eventi/long-story-short-2026/partner/studio-jam.png" alt="Studio JAM" style="--w: 121px" loading="lazy"></li>
                    <li><img src="assets/img/eventi/long-story-short-2026/partner/the-soundcheck.png" alt="The Soundcheck" style="--w: 182px" loading="lazy"></li>
                    <li><img src="assets/img/eventi/long-story-short-2026/partner/caffe-il-borgo.png" alt="Caff&egrave; Il Borgo" style="--w: 97px" loading="lazy"></li>
                    <li><img src="assets/img/eventi/long-story-short-2026/partner/comune-di-rimini.png" alt="Comune di Rimini" style="--w: 134px" loading="lazy"></li>
                    <li><img src="assets/img/eventi/long-story-short-2026/partner/rimini-citta-della-cultura.svg" alt="Rimini citt&agrave; della cultura" style="--w: 124px" loading="lazy"></li>
                    <li><img src="assets/img/eventi/long-story-short-2026/partner/geco.png" alt="Dipartimento per le Politiche Giovanili, Regione Emilia-Romagna e GECO" style="--w: 240px" loading="lazy"></li>
                </ul>
            </div>
        </section>
'''


# Il racconto di Long Story Short nella pagina nuova (quella attuale del sito
# resta com'è)
LSS_PARAGRAFI = '''<p><strong>Long Story Short</strong> &egrave; una sfida a tempo di brevi opere cinematografiche, a met&agrave; tra un laboratorio collettivo e un tradizionale contest di cortometraggi a tempo, in cui ogni troupe scrive, gira e monta un corto originale in pochi giorni.</p>
                    <p>Dal <strong>24 al 28 giugno 2026</strong> sette troupe, composte da pi&ugrave; di settanta partecipanti fra i 16 e i 35 anni, girano fra Rimini e dintorni. L&rsquo;evento di lancio, mercoled&igrave; 24 al <em>Cinema Teatro Tiberio</em>, svela la cornice narrativa che fa da contenitore ai cortometraggi e assegna a ogni troupe percorso e genere; alle 20:30 partono i quattro giorni di produzione.</p>
                    <p>La serata finale, il <strong>10 luglio 2026</strong> al <em>Cinema Teatro Tiberio</em>, restituisce al pubblico i sette corti in sala, con le premiazioni della giuria di settore e della giuria stampa, il tutto seguito da una festa nel chiostro.</p>'''


# Ritocchi ai testi delle pagine attuali: (com'è, come diventa)
RITOCCHI = {
    'short-talks-3-x-laiff.html': [(" · Prima proiezione pubblica, fuori concorso", '')],
}

# Racconti riscritti per l'anteprima (le altre pagine tengono quello attuale)
TESTI_EVENTO = {
    'short-talks-off-1.html': '<p>Fra aprile e maggio 2025 Short Talks esce dalla solita sala: nasce cos&igrave; '
                              '<strong>Short Talks OFF</strong>, lo spin-off del format, con quattro appuntamenti al '
                              '<strong>Centro Polifunzionale Il Pallone</strong> di Bologna.</p>',
}


def tag(nome):
    """Il profilo Instagram di chi ha suonato o collaborato a una serata"""
    return f'<a class="tag-ig" href="https://www.instagram.com/{nome}/" target="_blank" rel="noopener">@{nome}</a>'


# Sotto il titolo di ogni serata, nell'ordine della pagina: al posto dei nomi
# i tag di chi ha suonato o collaborato
NOTE_SERATE = {
    'short-talks-off-1.html': [
        f'Musica: {tag("bwude")}',
        f'Con {tag("sayonarafilm")} e {tag("50hinbarca")} &middot; Musica: {tag("argine_____")}',
        f'Musica: {tag("argine_____")}',
        f'Musica: {tag("teo_love_unity")}',
    ],
}


# Le foto di ogni serata, accanto al suo programma: sono quelle del post
# Instagram della serata (instagram.com/p/<codice>/), salvate in
# assets/img/eventi/<pagina>/serate/serata-<gg-mm>-<nn>.jpg. Una voce per
# gruppo del programma, nello stesso ordine; prendono il posto della galleria
# e della locandina.
POST_SERATE = {
    'short-talks-off-1.html': [
        ('30 aprile', '30-04', 'DJPqBVaIf1K'),
        ('8 maggio', '08-05', 'DJkAuLyIxsr'),
        ('15 maggio', '15-05', 'DJzRXcoohgx'),
        ('22 maggio', '22-05', 'DKK3W1ro9F1'),
    ],
    'blue-hour.html': [
        ('24 agosto', '24-08', 'DOY4pdDCBPO'),
    ],
    # un post solo per tutto il programma
    'short-talks-1.html': [('18 aprile', '18-04', 'C5_XntuoJj_')],
    'short-talks-2.html': [('23 dicembre', '23-12', 'DExh3JboXF0')],
    'short-talks-al-not-2025.html': [('31 agosto', '31-08', 'DQcZEIEjNWi')],
    'short-talks-3-x-laiff.html': [('14 dicembre', '14-12', 'DSnN3muDDuW')],
    'short-talks-al-not-2026.html': [('29 agosto', '29-08', 'Dc09JGuiLzy')],
}

# Il logo di Short Talks OFF al posto del nome, nel colore della pagina come
# il logo in cima (il PNG è in parte bianco e sulla carta non si vedrebbe)
LOGO_OFF = ('<span class="marchio-serie marchio-serie--evento marchio-voce" role="img" aria-label="Short Talks OFF" '
            'style="--marchio: url(/assets/img/eventi/loghi/short-talks-off-1.png); --ar: 5.6940"></span>')

# Programmi riscritti per l'anteprima: un elenco unico, senza numeri. Una
# voce può portare i suoi corti (titolo, dati, codice della Cortoteca o
# None): sotto il sottotitolo, nel formato solito, numerati.
PROGRAMMI = {
    'blue-hour.html': [
        ('DJ set', f'{tag("bwude")}, {tag("jb.revolution")}'),
        ('Mostre fotografiche', f'{tag("nellafos.chia")}, {tag("mono.no.aware_ph")}'),
        ('Clothing exhibition', tag('provvisorioclothing')),
        (LOGO_OFF, 'Proiezione di tre cortometraggi e dialogo con gli autori.', [
            ('Estate &rsquo;05', 'Francesco Pasquinelli &middot; CDL &middot; 2025 &middot; 10\'', None),
            ('La Partenza', 'Alessio Petrillo &middot; CDL e Arkadia Studios &middot; 2025 &middot; 5\'', None),
            ('Movimento', 'Luca Canarecci &middot; 2025 &middot; 9\'', None),
        ]),
    ],
}
NELLA_CORTOTECA = ('<span class="programma-cortoteca"><span>Nella Cortoteca</span> <svg viewBox="0 0 24 24" fill="none" '
                   'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
                   '<path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg></span>')


def voce_corto(titolo, dati, codice):
    """Un corto nel formato solito; se è nella Cortoteca, la riga ci porta"""
    if codice:
        return (f'<li><a class="programma-voce" href="opera.html?film={codice}"><span class="programma-titolo">{titolo}</span>'
                f'<span class="programma-dati">{dati}</span>{NELLA_CORTOTECA}</a></li>')
    return (f'<li><div class="programma-voce"><span class="programma-titolo">{titolo}</span>'
            f'<span class="programma-dati">{dati}</span></div></li>')


def programma_scritto(voci):
    """Un programma scritto qui: un elenco solo, senza numeri"""
    righe = []
    for titolo, dati, *corti in voci:
        sotto = ''
        if corti:
            sotto = ('\n                        <ol class="programma-lista programma-lista--corti">\n'
                     + '\n'.join('                            ' + voce_corto(*c) for c in corti[0])
                     + '\n                        </ol>')
        righe.append(f'''                    <li>
                        <div class="programma-voce">
                            <span class="programma-titolo">{titolo}</span>
                            <span class="programma-dati">{dati}</span>
                        </div>{sotto}
                    </li>''')
    return ('                <div class="programma-gruppo">\n'
            '                <ul class="programma-lista programma-lista--semplice">\n'
            + '\n'.join(righe) + '\n                </ul>\n                </div>')


TASTO_PRIMA = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" '
               'stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>')
TASTO_DOPO = TASTO_PRIMA.replace('m15 18-6-6 6-6', 'm9 18 6-6-6-6')


def rientra(testo, spazi=24):
    return re.sub(r'\n\s*', '\n' + ' ' * spazi, testo.strip())


def serata_con_foto(base, testa, lista, giorno, data, codice):
    """Una serata: titolo e note (se ci sono), l'elenco e, alla sua stessa
    altezza, la striscia delle foto del suo post; i comandi alla riga del
    titolo o, senza titolo, sotto la striscia"""
    foto = sorted((QUI.parent / f'assets/img/eventi/{base}/serate').glob(f'serata-{data}-*.jpg'))
    righe_foto = []
    for n, f in enumerate(foto, 1):
        larghezza, altezza = jpeg_misure(f)
        righe_foto.append(
            f'                            <img src="assets/img/eventi/{base}/serate/{f.name}" '
            f'alt="Foto della serata del {giorno}, {n} di {len(foto)}" width="{larghezza}" height="{altezza}"'
            + ('' if n <= 4 else ' loading="lazy"') + '>')
    immagini = '\n'.join(righe_foto)
    parte_testa = ''
    if testa:
        parte_testa = f'''
                    <div class="serata__testa">
                        {rientra(testa)}
                    </div>'''
    classe = 'serata giostra' + ('' if testa else ' serata--senza-testa')
    return f'''                <div class="{classe}">{parte_testa}
                    <div class="serata__lista">
                        {rientra(lista)}
                    </div>
                    <div class="giostra__foto">
                        <div class="giostra__pista" tabindex="0" role="group" aria-label="Foto della serata del {giorno}">
{immagini}
                        </div>
                    </div>
                    <div class="giostra__comandi">
                        <span class="giostra__avanzamento" aria-hidden="true"><span class="giostra__linea"></span></span>
                        <button class="giostra__tasto" type="button" aria-label="Foto precedenti">{TASTO_PRIMA}</button>
                        <button class="giostra__tasto" type="button" aria-label="Foto successive">{TASTO_DOPO}</button>
                        <a class="giostra__post" href="https://www.instagram.com/p/{codice}/" target="_blank" rel="noopener">Vedi su Instagram {FRECCIA_FUORI}</a>
                    </div>
                </div>'''


def jpeg_misure(percorso):
    """Larghezza e altezza di un JPEG, lette dall'intestazione"""
    dati = percorso.read_bytes()
    i = 2
    while i < len(dati):
        marcatore, lunghezza = dati[i + 1], struct.unpack('>H', dati[i + 2:i + 4])[0]
        if marcatore in (0xC0, 0xC1, 0xC2):
            altezza, larghezza = struct.unpack('>HH', dati[i + 5:i + 9])
            return larghezza, altezza
        i += 2 + lunghezza
    raise ValueError(percorso)


def serate_con_foto(nome, contenuto):
    """Il programma con le foto dei post accanto. Un post per gruppo: ogni
    gruppo è una serata col suo titolo. Un post solo per più gruppi: i gruppi
    stanno uno sotto l'altro e la striscia li accompagna tutti."""
    base = nome.removesuffix('.html')
    gruppi = re.findall(r'<div class="programma-gruppo">.*?</[ou]l>\s*</div>', contenuto, re.S)
    post = POST_SERATE[nome]
    if len(post) == 1 and len(gruppi) > 1:
        tutti = '\n'.join(gruppi)
        return serata_con_foto(base, None, tutti, *post[0])
    assert len(gruppi) == len(post), nome
    serate = []
    for gruppo, voce in zip(gruppi, post):
        testa = re.search(r'<h3.*?</h3>\s*(<p class="programma-gruppo-nota">.*?</p>)?', gruppo, re.S)
        lista = re.search(r'<([ou]l) class="programma-lista.*?</\1>', gruppo, re.S).group(0)
        serate.append(serata_con_foto(base, testa.group(0) if testa else None, lista, *voce))
    return '\n'.join(serate)


def pagina_evento(nome):
    src = (QUI.parent / nome).read_text(encoding='utf-8')
    main = senza_commenti(re.search(r'<main>(.*?)</main>', src, re.S).group(1))
    titolo_scheda = re.search(r'<title>(.*?)</title>', src).group(1).replace(' – CDL APS', '')
    descrizione = re.search(r'<meta name="description" content="([^"]*)"', src).group(1)
    classe = re.search(r'<body class="evento (evento--[a-z0-9-]+)"', src)
    classe = classe.group(1) if classe else 'evento--' + nome.removesuffix('.html')
    titolo = re.search(r'<h1>(.*?)</h1>', main, re.S).group(1)
    corpo = re.search(r'<div class="corpo">\s*(.*?)\s*</div>\s*</div>', main, re.S).group(1)
    evento = EVENTI_DB.get(nome)
    base = nome.removesuffix('.html')

    # In cima il logo dell'evento (un PNG senza fondo), nel colore
    # dell'evento come il lettering di Long Story Short. Senza logo il nome
    # resta il titolo della pagina.
    titolo_testo = re.sub("<[^>]+>", "", titolo)
    logo = QUI.parent / f'assets/img/eventi/loghi/{base}.png'
    affiancato = False
    if logo.exists():
        larghezza, altezza = struct.unpack('>II', logo.read_bytes()[16:24])
        # Accanto al logo il racconto ci sta solo se il logo non è una riga
        # lunga (Short Talks #2, LAIFF e OFF restano sopra il testo)
        affiancato = larghezza / altezza < 2.5
        marchio = (f'<h1 class="evento-g__marchio" id="titolo-evento"><span class="sr-only">{titolo_testo}</span>'
                   f'<span class="marchio-serie marchio-serie--evento" data-arrivo aria-hidden="true" '
                   f'style="--marchio: url(/assets/img/eventi/loghi/{base}.png); --ar: {larghezza / altezza:.4f}"></span></h1>')
    else:
        marchio = f'<h1 class="evento-g__titolo" id="titolo-evento">{titolo}</h1>'

    # Il racconto: quello della pagina attuale, o quello riscritto qui
    corpo = TESTI_EVENTO.get(nome, corpo)
    # Ritocchi ai testi della pagina attuale, solo per l'anteprima
    for vecchio, nuovo in RITOCCHI.get(nome, []):
        assert vecchio in main, (nome, vecchio)
        main = main.replace(vecchio, nuovo)

    # I blocchi della pagina attuale, ognuno col suo titoletto
    blocchi = {}
    pezzi = re.split(r'<h2 class="titoletto">(.*?)</h2>', main)
    for testa_blocco, contenuto in zip(pezzi[1::2], pezzi[2::2]):
        contenuto = re.sub(r'\s*</section>\s*$', '', contenuto.strip())
        if testa_blocco == 'Galleria':
            # con le foto accanto alle serate la galleria non serve
            if nome not in POST_SERATE:
                blocchi['Galleria'] = blocco_galleria(contenuto)
        elif testa_blocco.startswith('Materiali'):
            blocchi['Materiali'] = blocco_evento('blocco-materiali', testa_blocco, materiali_evento(contenuto))
        else:
            ident = 'blocco-' + re.sub(r'[^a-z]+', '-', testa_blocco.lower()).strip('-')
            for nota in NOTE_SERATE.get(nome, []):
                contenuto = re.sub(r'(<p class="programma-gruppo-nota">)(?!<!--fatta-->).*?(</p>)',
                                   lambda m: m.group(1) + '<!--fatta-->' + nota + m.group(2), contenuto, count=1)
            contenuto = contenuto.replace('<!--fatta-->', '')
            programma = testa_blocco == 'Programma'
            if programma and nome in PROGRAMMI:
                contenuto = programma_scritto(PROGRAMMI[nome])
            if programma and nome in POST_SERATE:
                contenuto = serate_con_foto(nome, contenuto)
            else:
                contenuto = '                ' + contenuto
            # il programma si presenta da sé: il titoletto resta ai lettori di schermo
            blocchi[testa_blocco] = blocco_evento(ident, testa_blocco, contenuto, testa=not programma)

    if nome == 'longstoryshort.html':
        corpo = LSS_PARAGRAFI
        # Long Story Short: il lettering in cima, in nero sulla carta (è lì
        # che arriva quello della pagina Eventi), i tre paragrafi a tutta
        # larghezza, la galleria, i vincitori e, in fondo, i materiali
        blocchi['Materiali'] = blocchi['Materiali'].replace(">Materiali dell'edizione<", '>Materiali della prima edizione<')
        corpo_html = f'''
    <main id="top">
        <section class="hero hero--evento hero--marchio">
            <div class="wrap">
                <h1 class="evento-g__marchio" id="titolo-evento"><span class="sr-only">{re.sub("<[^>]+>", "", titolo)}</span><span class="marchio-serie marchio-serie--lss" data-arrivo aria-hidden="true"></span></h1>
                <div class="presentazione entra">
                    {corpo}
                </div>
            </div>
        </section>
{blocchi['Galleria']}{VINCITORI}{blocchi['Materiali']}{PARTNER_LSS}    </main>
'''
    else:
        corpo_html = f'''
    <main id="top">
        <!-- Come Long Story Short: in cima il logo dell'evento (è qui che
             arriva quello della scheda di Eventi) e il racconto, con quando e
             dove scritti dentro: a fianco se il logo è raccolto, sotto se è
             una riga lunga -->
        <section class="hero hero--evento hero--marchio{' hero--affiancato' if affiancato else ''}">
            <div class="wrap">
                {marchio}
                <div class="presentazione entra">
                    {corpo}
                </div>
            </div>
        </section>
{''.join(blocchi.values())}    </main>
'''
    scrivi(nome,
           testa('g', f'{titolo_scheda} – CDL APS (anteprima)', descrizione,
                 f' class="pagina-evento {classe}"'),
           corpo_html, '\n    <footer>' + piede('g'), pagina=base)


for nome in PAGINE_EVENTO:
    pagina_evento(nome)
print('pagine degli eventi scritte')


# ------------------------------------------------------ Vantaggi per i soci
# Il nome a tutta larghezza su due righe, la presentazione, poi i vantaggi
# divisi in tre blocchi, a righe col filo come le schede. In fondo l'invito
# arancio della home, che porta al modulo di Contatti.
def vantaggio(titolo, testo, href='', logo='', fuori=False):
    freccia = (FRECCIA_FUORI if fuori else FRECCIA) if href else ''
    tag = 'a' if href else 'div'
    attr = f' href="{href}"' + (' target="_blank" rel="noopener"' if fuori else '') if href else ''
    figura = f'<img class="vantaggio-g__logo" src="assets/img/partner/{logo}" alt="" loading="lazy">' if logo else ''
    return f'''                    <li><{tag} class="vantaggio-g"{attr}>
                        {figura}<span class="vantaggio-g__titolo">{titolo}{f'<span class="vantaggio-g__freccia">{freccia}</span>' if freccia else ''}</span>
                        <span class="vantaggio-g__testo">{testo}</span>
                    </{tag}></li>'''


def blocco_vantaggi(ident, titolo, voci, diviso=True):
    return f'''
        <section class="blocco-pagina{' blocco-pagina--diviso' if diviso else ''} entra" aria-labelledby="{ident}">
            <div class="wrap">
                <h2 class="blocco-pagina__testa" id="{ident}">{titolo}</h2>
                <ul class="vantaggi-g">
{chr(10).join(voci)}
                </ul>
            </div>
        </section>
'''


g_vantaggi = f'''
    <main id="top">
        <section class="hero hero--pagina">
            <div class="wrap">
                <h1 class="parola"><span class="sr-only">Vantaggi per i soci</span>{fit('Vantaggi')}{fit('per i soci')}</h1>
                <div class="presentazione entra"><p>CDL &egrave; una realt&agrave; indipendente che esplora, sostiene e diffonde il cinema giovane, realizzando cortometraggi e organizzando eventi cinematografici. Ai soci riserviamo servizi che crescono con l&rsquo;associazione.</p></div>
            </div>
        </section>
''' + blocco_vantaggi('titolo-supporto', 'Cinema indipendente e supporto', [
    vantaggio('Sviluppo di nuovi progetti', 'Collabora alle produzioni originali, o ricevi supporto logistico e creativo per la tua prossima idea. La prima consulenza di produzione &egrave; gratuita.'),
    vantaggio('Cortoteca', 'L&rsquo;archivio delle opere realizzate dai soci, da guardare in streaming sul sito.', 'anteprime/cortoteca.html'),
], diviso=False) + blocco_vantaggi('titolo-partner', 'I nostri partner', [
    vantaggio('C&rsquo;entro Supercinema', 'Prezzo ridotto nelle sale di Santarcangelo di Romagna per tutta la stagione.', 'https://www.centrosupercinema.com/', 'supercinema.png', True),
    vantaggio('Arkadia Studios', 'Il 15% di sconto sul noleggio dell&rsquo;attrezzatura da Arkadia Rental.', 'https://arkadiastudios.it/rental-noleggio/', 'arkadia.png', True),
    vantaggio('Alcatraz', 'Il 5% di sconto sull&rsquo;editoria nella storica fumetteria riminese.', 'https://www.alcatraz.shop/', 'alcatraz.png', True),
]) + blocco_vantaggi('titolo-comunita', 'Eventi e comunit&agrave;', [
    vantaggio('Eventi dedicati', 'Anteprime, incontri e workshop tecnici riservati ai tesserati.'),
    vantaggio('Il tuo nome sul grande schermo', 'I nomi dei soci scorrono nei titoli proiettati prima e dopo ogni nostro evento pubblico.'),
]) + '    </main>\n'

scrivi('vantaggi.html',
       testa('g', 'Vantaggi per i soci – CDL APS (anteprima)',
             'Cosa riserva CDL APS ai suoi soci: supporto ai progetti, la Cortoteca, sconti dai partner ed eventi dedicati.',
             ' class="pagina-vantaggi"'),
       g_vantaggi,
       sostieni('g', titolo_sostieni, QUOTA),
       pagina='vantaggi')
print('Vantaggi scritta')


# ------------------------------------------------------------ Pagina 404
# Il nome a tutta larghezza; nelle O di NON TROVATA due occhi che cercano.
NON_TROVATA = f'N<span class="o">O{OCCHIO_O}</span>N TR<span class="o">O{OCCHIO_O}</span>VATA'
g_404 = f'''
    <main id="top">
        <section class="hero hero--pagina hero--smarrita">
            <div class="wrap">
                <h1 class="parola"><span class="sr-only">Pagina non trovata</span>{fit('Pagina')}{fit(NON_TROVATA)}</h1>
                <div class="presentazione entra"><p>L&rsquo;indirizzo che hai aperto non esiste, o la pagina &egrave; stata spostata.</p></div>
                <div class="btn-riga smarrita__azioni entra">
                    <a class="btn btn--pieno" href="anteprime/home.html">Torna alla home {FRECCIA}</a>
                    <a class="btn" href="anteprime/cortoteca.html">Vai alla Cortoteca {FRECCIA}</a>
                </div>
            </div>
        </section>
    </main>
'''
scrivi('404.html',
       testa('g', 'Pagina non trovata – CDL APS (anteprima)', 'La pagina cercata non esiste o è stata spostata.',
             ' class="pagina-smarrita"'),
       g_404, '\n    <footer>' + piede('g'), pagina='404')
print('404 scritta')
