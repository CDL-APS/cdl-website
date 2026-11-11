#!/usr/bin/env python3
"""Scrive le pagine delle anteprime C e D: barra e piede sono uguali in tutte,
quindi stanno qui una volta sola. File di prova, non fa parte del sito."""
import pathlib

QUI = pathlib.Path(__file__).parent
PIU = '<svg class="piu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>'
PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72L19 12 8 5.14Z"/></svg>'
OCCHIO = '<span class="occhio"><span class="pupilla"></span></span>'
LENTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>'
CARATTERI = {
    'c': 'family=Montserrat:wght@500;600;700;900',
    'd': 'family=Archivo:wdth,wght@62..125,900&family=Montserrat:wght@500;600;700',
}
FRASE = "CDL &egrave; un'associazione di promozione sociale che si occupa di sostenere, diffondere ed esplorare il cinema giovane e indipendente, attraverso la realizzazione di progetti cinematografici e l'organizzazione di eventi."
CORTOTECA = "La Cortoteca di CDL &egrave; lo spazio dedicato alle opere dei soci di CDL APS che ne fanno richiesta, ideata per scoprire progetti di cinema indipendente e conoscere realt&agrave; del territorio tramite lo streaming direttamente sul sito."
PAROLA_CORTOTECA = f'C<span class="o">{OCCHIO}</span>RT<span class="o">{OCCHIO}</span>TECA'


def fit(testo, classe=''):
    return f'<span class="fit{classe}" aria-hidden="true"><span class="fit-testo">{testo}</span></span>'


def testa(p, titolo, descrizione, corpo=''):
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
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?{CARATTERI[p]}&display=swap">
    <link rel="stylesheet" href="anteprime/comune.css">
    <link rel="stylesheet" href="anteprime/{p}.css">
</head>
<body{corpo}>

    <header class="nav">
        <div class="wrap nav__riga">
            <a class="skip-link" href="anteprime/{p}-{{pagina}}.html#top">Vai al contenuto</a>
            <a class="nav__logo" href="anteprime/{p}-home.html" aria-label="CDL, pagina iniziale"><span class="logo"></span></a>
            <a class="nav__voce" href="produzioni.html" style="--punto: var(--blu)">Produzioni</a>
            <a class="nav__voce" href="eventi.html" style="--punto: var(--arancio)">Eventi</a>
            <a class="nav__cortoteca" href="anteprime/{p}-cortoteca.html"{{corrente}}>{PLAY}Cortoteca</a>
            <a class="btn btn--pieno nav__socio" href="anteprime/{p}-home.html#socio">Diventa socio</a>
        </div>
    </header>
'''


def piede(p):
    return f'''
        <div class="piede">
            <div class="wrap piede__riga">
                <a href="anteprime/{p}-home.html" aria-label="CDL, pagina iniziale"><span class="logo"></span></a>
                <nav class="piede__elenchi" aria-label="Pagine e contatti">
                    <ul>
                        <li><a href="produzioni.html">Produzioni</a></li>
                        <li><a href="eventi.html">Eventi</a></li>
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


def sostieni(p):
    """Chiusura della home: l'invito a sostenere CDL e il piede."""
    return f'''
    <footer class="closing" id="socio">
        <div class="wrap sostieni">
            <h2>
                <span class="sr-only">Sostieni CDL</span>
                <span class="fit" aria-hidden="true"><span class="fit-testo">Sostieni<span class="logo"></span></span></span>
            </h2>
            <div class="grid sostieni__corpo">
                <div class="span-7">
                    <p class="sostieni__frase">Associarti a CDL significa contribuire attivamente al nostro progetto di diffusione della cultura cinematografica indipendente.</p>
                    <p class="sostieni__stato"><span class="rec"></span>Il tesseramento 2026 &egrave; aperto.</p>
                    <div class="btn-riga">
                        <a class="btn btn--pieno" href="https://wa.me/393493290864?text=Ciao,%20vorrei%20diventare%20socio%20di%20CDL%20APS" target="_blank" rel="noopener">Diventa socio</a>
                        <a class="btn" href="mailto:ciao@cdlaps.com?subject=Richiesta%20Diventare%20Socio">Scrivici</a>
                    </div>
                    <a class="link" href="vantaggi-tesseramento.html">Tutti i vantaggi per i soci {PIU}</a>
                </div>
                <a class="span-4 start-9 sostieni__tessera" href="vantaggi-tesseramento.html" aria-label="I vantaggi per i soci">
                    <img src="assets/img/partner/tessera-cdl.png" alt="" width="1080" height="1080" loading="lazy">
                </a>
            </div>
        </div>''' + piede(p)


def chiusura_cortoteca(p):
    return f'''
    <footer class="closing closing--breve">
        <div class="wrap">
            <p class="lead">{CORTOTECA}</p>
            <a class="btn btn--pieno" href="anteprime/{p}-home.html#socio">Diventa socio</a>
        </div>''' + piede(p)


def strumenti():
    return f'''<div class="strumenti">
                        <label class="campo" for="db-search">
                            {LENTE}
                            <span class="sr-only">Cerca un'opera</span>
                            <input type="search" id="db-search" placeholder="Cerca per titolo o regista" autocomplete="off">
                        </label>
                        <div class="ordine" role="group" aria-label="Ordina le opere">
                            <input type="radio" name="ordine" id="ordine-anno" value="anno" checked>
                            <label for="ordine-anno" class="scelta">Per anno</label>
                            <input type="radio" name="ordine" id="ordine-nome" value="nome">
                            <label for="ordine-nome" class="scelta">Per nome</label>
                        </div>
                    </div>'''


def scrivi(nome, *pezzi, pagina, corrente=''):
    html = ''.join(pezzi).replace('{pagina}', pagina).replace('{corrente}', corrente)
    (QUI / nome).write_text(html, encoding='utf-8')


# ---------------------------------------------------------------- C · Fasce
# posizione (x, y in % del marchio) e diametro (in % della sua larghezza)
OCCHI_C = [(9.5, 27, 9.2), (21, 79, 4.6), (52, 30, 5.4), (56.5, 68, 8), (77.5, 20, 6.6), (92, 80, 4.4)]
occhi_c = '\n'.join(
    f'                    <span class="occhio" style="--x:{x}%;--y:{y}%;--d:{d}%;--i:{i}"><span class="pupilla"></span></span>'
    for i, (x, y, d) in enumerate(OCCHI_C))

c_home = f'''
    <main id="top">
        <!-- APERTURA: il marchio a tutta larghezza, con gli occhi dell'icona
             che seguono il puntatore -->
        <section class="hero">
            <div class="wrap">
                <div class="marchio" role="img" aria-label="CDL">
                    <span class="lettera"></span><span class="lettera"></span><span class="lettera"></span>
{occhi_c}
                </div>
                <h1 class="claim">
                    <span class="sr-only">Cinema giovane e indipendente</span>
                    {fit('Cinema giovane e indipendente', ' solo-largo')}
                    {fit('Cinema giovane', ' solo-stretto')}
                    {fit('e indipendente', ' solo-stretto')}
                </h1>
                <div class="grid hero__piede">
                    <p class="lead span-7">{FRASE}</p>
                    <!-- Sul computer l'invito ai soci è già nella barra, nello stesso schermo:
                         qui compare solo su telefono, dove la barra non lo mostra -->
                    <div class="btn-riga span-5 hero__azioni">
                        <a class="btn btn--pieno" href="anteprime/c-cortoteca.html">{PLAY}Guarda i corti</a>
                        <a class="btn solo-telefono" href="anteprime/c-home.html#socio">Diventa socio</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- EVENTI: fascia arancio. Le ultime quattro serate, e a fianco la
             fotografia di quella su cui ci si trova. La riempie c.js. -->
        <section id="eventi" class="fondo-arancio">
            <div class="wrap">
                <h2 class="parola"><span class="sr-only">Eventi</span>{fit('Eventi')}</h2>
                <div class="grid sezione__corpo">
                    <div class="span-6">
                        <ol class="righe" id="elenco-eventi"></ol>
                        <a class="link elenco__tutti" href="eventi.html">Tutti gli eventi {PIU}</a>
                    </div>
                    <div class="span-6 start-7 cornice peek__cornice" id="cornice-eventi" aria-hidden="true"></div>
                </div>
            </div>
        </section>

        <!-- PRODUZIONI: fascia blu. Le ultime tre produzioni CDL. -->
        <section id="produzioni" class="fondo-blu">
            <div class="wrap">
                <h2 class="parola"><span class="sr-only">Produzioni</span>{fit('Produzioni')}</h2>
                <div class="grid sezione__corpo" id="tessere-produzioni"></div>
                <a class="link produzioni__tutti" href="produzioni.html">Tutte le produzioni {PIU}</a>
            </div>
        </section>

        <!-- CORTOTECA: fascia lilla, lo stesso colore della sua pagina. -->
        <section id="cortoteca" class="fondo-lilla">
            <div class="wrap">
                <h2 class="parola"><span class="sr-only">Cortoteca</span>{fit(PAROLA_CORTOTECA)}</h2>
                <div class="grid sezione__corpo">
                    <div class="span-5 cortoteca__testo">
                        <p class="lead">{CORTOTECA}</p>
                        <a class="btn btn--pieno" href="anteprime/c-cortoteca.html">Entra in Cortoteca</a>
                    </div>
                    <a class="span-6 start-7 cornice" id="corto-da-guardare" href="anteprime/c-cortoteca.html" hidden></a>
                </div>
            </div>
        </section>
    </main>
'''

c_corto = f'''
    <main id="top">
        <!-- Tutta la Cortoteca in uno schermo: il nome, l'indice delle opere
             e il palco con la scheda di quella su cui ci si trova -->
        <section class="hero">
            <div class="wrap">
                <h1 class="parola"><span class="sr-only">Cortoteca</span>{fit(PAROLA_CORTOTECA)}</h1>
                <div class="grid sezione__corpo">
                    <div class="span-5">
                        {strumenti()}
                        <ol class="righe" id="movie-grid"></ol>
                    </div>
                    <div class="span-6 start-7 palco" id="palco" hidden></div>
                </div>
            </div>
        </section>
    </main>
'''

scrivi('c-home.html',
       testa('c', 'CDL APS: cinema giovane e indipendente a Rimini (anteprima C)',
             'Associazione riminese che produce cortometraggi e organizza serate di cinema indipendente.'),
       c_home, sostieni('c'), pagina='home')
scrivi('c-cortoteca.html',
       testa('c', 'Cortoteca: i corti dei soci di CDL APS (anteprima C)',
             'I cortometraggi dei soci di CDL APS, da guardare in streaming sul sito.', ' class="fondo-lilla stanza"'),
       c_corto, chiusura_cortoteca('c'), pagina='cortoteca', corrente=' aria-current="page"')
print('C scritta')


# ------------------------------------------------------------- D · Pannelli
FRECCIA = PIU
# posizione (x, y in % dell'area) e diametro (in em) dei bulbi accanto al marchio
OCCHI_D = [(6, 6, 1.7), (38, 0, 0.9), (60, 34, 1.3), (86, 4, 1.05), (28, 62, 0.75), (84, 58, 0.85)]
occhi_d = '\n'.join(
    f'                        <span class="occhio" style="--x:{x}%;--y:{y}%;--d:{d}em;--i:{i}"><span class="pupilla"></span></span>'
    for i, (x, y, d) in enumerate(OCCHI_D))

MURO = [
    ('short-talks-al-not-2025.html', 'short-talks-al-not-2025/foto-3.jpg', 'Il pubblico in sala', 'c5'),
    ('longstoryshort.html', 'long-story-short-2026/foto-3.jpg', 'Una troupe al tramonto in riva al mare', 'c3'),
    ('short-talks-2.html', 'short-talks-2/foto-6.jpg', 'Tre spettatori fra le poltrone della sala', 'c4'),
    ('longstoryshort.html', 'long-story-short-2026/foto-4.jpg', 'Un operatore prepara la macchina da presa', 'c3'),
    ('short-talks-al-not-2025.html', 'short-talks-al-not-2025/foto-6.jpg', 'Il pubblico durante il dialogo con gli autori', 'c5'),
    ('blue-hour.html', 'blue-hour/foto-1.jpg', 'Il pubblico sulla sabbia sotto le lanterne blu', 'c4'),
]
muro = '\n'.join(
    f'                    <a class="cornice {c}" href="{h}"><img src="assets/img/eventi/{f}" alt="{a}" loading="lazy"></a>'
    for h, f, a, c in MURO)


def pannello(ident, fondo, nome, tutti, pagina, misura=''):
    parola = (f'<span class="parola-pari" data-misura-di="#parola-guida">{nome}</span>' if misura
              else f'<span class="fit" id="parola-guida"><span class="fit-testo">{nome}</span></span>')
    return f'''<article class="span-6 pannello {fondo}" id="{ident}">
                    <h2 class="pannello__parola">{parola}</h2>
                    <a class="pannello__voce" href="{pagina}" hidden>
                        <span class="cornice"></span>
                        <span class="pannello__titolo"><span></span></span>
                        <span class="pannello__dati"></span>
                    </a>
                    <a class="link" href="{pagina}">{tutti} {FRECCIA}</a>
                </article>'''


d_home = f'''
    <main id="top">
        <!-- APERTURA: marchio lilla su nero, gli occhi dell'icona intorno,
             la frase a tutta larghezza -->
        <section class="hero fondo-nero">
            <div class="wrap">
                <div class="grid hero__alto">
                    <div class="span-6 marchio" role="img" aria-label="CDL">
                        <span class="lettera"></span><span class="lettera"></span><span class="lettera"></span>
                    </div>
                    <div class="span-6 start-7 occhi" aria-hidden="true">
{occhi_d}
                    </div>
                </div>
                <h1 class="claim">
                    <span class="sr-only">Cinema giovane e indipendente</span>
                    {fit('Cinema giovane')}
                    {fit('e indipendente')}
                </h1>
                <div class="grid hero__piede">
                    <p class="lead span-7">{FRASE}</p>
                    <!-- Sul computer l'invito ai soci è già nella barra, nello stesso schermo:
                         qui compare solo su telefono, dove la barra non lo mostra -->
                    <div class="btn-riga span-5 hero__azioni">
                        <a class="btn btn--pieno" href="anteprime/d-cortoteca.html">{PLAY}Guarda i corti</a>
                        <a class="btn solo-telefono" href="anteprime/d-home.html#socio">Diventa socio</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- IL BIVIO: Eventi e Produzioni fianco a fianco, ognuno col suo
             colore e con l'ultima voce. Li riempie d.js. -->
        <section id="attivita" aria-label="Eventi e produzioni">
            <div class="wrap grid bivio">
                {pannello('pannello-eventi', 'fondo-arancio', 'Eventi', 'Tutti gli eventi', 'eventi.html', misura='si')}
                {pannello('pannello-produzioni', 'fondo-blu', 'Produzioni', 'Tutte le produzioni', 'produzioni.html')}
            </div>
        </section>

        <!-- CORTOTECA: fascia lilla, lo stesso colore della sua pagina -->
        <section id="cortoteca" class="fondo-lilla">
            <div class="wrap">
                <h2 class="parola parola--larga"><span class="sr-only">Cortoteca</span>{fit(PAROLA_CORTOTECA)}</h2>
                <div class="grid sezione__corpo">
                    <div class="span-5 cortoteca__testo">
                        <p class="lead">{CORTOTECA}</p>
                        <a class="btn btn--pieno" href="anteprime/d-cortoteca.html">Entra in Cortoteca</a>
                    </div>
                    <a class="span-6 start-7 cornice" id="corto-da-guardare" href="anteprime/d-cortoteca.html" hidden></a>
                </div>
            </div>
        </section>

        <!-- DALLE SALE E DAI SET: un muro di fotografie, ognuna porta al suo evento -->
        <section id="sale" aria-labelledby="titolo-sale">
            <div class="wrap">
                <h2 id="titolo-sale">Dalle sale e dai set</h2>
                <div class="muro">
{muro}
                </div>
            </div>
        </section>
    </main>
'''

d_corto = f'''
    <main id="top">
        <!-- Il nome e, subito, i corti che si possono guardare -->
        <section class="hero">
            <div class="wrap">
                <h1 class="parola parola--larga"><span class="sr-only">Cortoteca</span>{fit(PAROLA_CORTOTECA)}</h1>
                <div class="grid sezione__corpo" id="da-guardare"></div>
            </div>
        </section>

        <!-- L'indice di tutte le opere, da cercare e ordinare -->
        <section id="opere" aria-labelledby="titolo-opere">
            <div class="wrap">
                <div class="testa-riga">
                    <h2 id="titolo-opere">Tutte le opere</h2>
                    {strumenti()}
                </div>
                <ol class="indice" id="movie-grid"></ol>
            </div>
        </section>
    </main>
'''

scrivi('d-home.html',
       testa('d', 'CDL APS: cinema giovane e indipendente a Rimini (anteprima D)',
             'Associazione riminese che produce cortometraggi e organizza serate di cinema indipendente.'),
       d_home, sostieni('d'), pagina='home')
scrivi('d-cortoteca.html',
       testa('d', 'Cortoteca: i corti dei soci di CDL APS (anteprima D)',
             'I cortometraggi dei soci di CDL APS, da guardare in streaming sul sito.', ' class="fondo-lilla stanza"'),
       d_corto, chiusura_cortoteca('d'), pagina='cortoteca', corrente=' aria-current="page"')
print('D scritta')
