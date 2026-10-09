/* ==========================================================================
   OPERE — lettura di data/film.json, comune alle pagine che mostrano i corti:
   home (ultima produzione), Cortoteca, Produzioni e scheda opera.

   Va caricato prima dello script della pagina, che ne usa le funzioni.
   ========================================================================== */

const PERCORSO_DATABASE = 'data/film.json';

async function caricaOpere() {
  const response = await fetch(PERCORSO_DATABASE);
  if (!response.ok) throw new Error('Database non trovato');
  return response.json();
}

/* Le opere prodotte da CDL ("cdl": true), dalla più recente.
   A parità di anno resta l'ordine del file: fra due produzioni dello stesso
   anno conta come più recente quella che in film.json sta più in alto. */
function produzioniCdl(opere) {
  return opere.filter((o) => o.cdl === true).sort((a, b) => b.anno - a.anno);
}

/* Primo genere della lista, con l'iniziale maiuscola: "thriller, mistero"
   diventa "Thriller" */
function generePrincipale(opera) {
  const primo = (opera.genere || '').split(',')[0].trim();
  return primo.charAt(0).toUpperCase() + primo.slice(1);
}
