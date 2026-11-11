/* ANTEPRIMA E — nastro di notizie, note dell'indice, rullino che scorre, e
   la lista della Cortoteca. Si appoggia a comune.js e ai dati
   veri (assets/js/dati.js).
   File di prova: non fa parte del sito pubblicato. */

function voceNastro(testo, href) {
  return `<span class="nastro__voce"><a href="${esc(href)}">${esc(testo)}</a><span class="logo" aria-hidden="true"></span></span>`;
}

/* Home: le note dell'indice (l'ultima cosa accaduta in ogni sezione) e il
   nastro, che racconta le stesse cose scorrendo */
async function home() {
  const [eventi, opere] = await Promise.all([caricaEventi().catch(() => []), caricaOpere().catch(() => [])]);
  const [evento] = eventi;
  const [produzione] = produzioniCdl(opere);
  const guardabili = daGuardare(opere).length;

  const nota = (id, testo) => { document.getElementById('nota-' + id).textContent = testo; };
  const voci = [];
  if (evento) {
    nota('eventi', `Ultimo evento: ${evento.titolo}, ${dataLunga(evento.data_inizio)}`);
    voci.push(voceNastro(`Ultimo evento: ${evento.titolo}, ${dataLunga(evento.data_inizio)}`, indirizzoSicuro(evento.pagina) || 'eventi.html'));
  }
  if (produzione) {
    nota('produzioni', `Ultima produzione: ${produzione.titolo}, ${produzione.anno}`);
    voci.push(voceNastro(`Ultima produzione: ${produzione.titolo} (${produzione.anno})`, indirizzoOpera(produzione)));
  }
  if (opere.length) {
    nota('cortoteca', `${opere.length} opere dei soci, ${guardabili} da guardare ora`);
    voci.push(voceNastro(`In Cortoteca ${opere.length} opere, ${guardabili} da guardare ora`, 'anteprime/e-cortoteca.html'));
  }
  voci.push(voceNastro('Il tesseramento 2026 è aperto', 'anteprime/e-home.html#socio'));

  const nastro = document.getElementById('nastro');
  nastro.querySelector('.scorre__pista').innerHTML = voci.join('');
  preparaScorre(nastro);
}

/* Cortoteca, vista a lista: una riga per opera con miniatura, anno e stato */
function listaConMiniature(scelte, contenitore) {
  const elenco = document.createElement('ol');
  elenco.className = 'indice';
  scelte.forEach((o) => {
    const li = document.createElement('li');
    const stato = streamingDisponibile(o)
      ? `<span class="voce__stato voce__stato--play">${PLAY}Guarda</span>`
      : '<span class="voce__stato">In arrivo</span>';
    li.innerHTML = `
      <a class="voce" href="${esc(indirizzoOpera(o))}">
        <span class="cornice"></span>
        <span>
          <span class="voce__titolo"><span>${esc(o.titolo)}</span></span>
          <span class="voce__dati">${esc([generePrincipale(o), 'Regia di ' + o.regista].filter(Boolean).join(' · '))}</span>
        </span>
        <span class="voce__anno">${esc(o.anno)}</span>
        ${stato}
      </a>`;
    li.querySelector('.cornice').append(nuovaImmagine(o.fotogramma));
    elenco.append(li);
  });
  contenitore.append(elenco);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('opere')) avviaCortoteca({ lista: listaConMiniature });
  if (document.getElementById('nastro')) {
    home().catch(console.error);
    preparaScorre(document.getElementById('sale'));
  }
});
