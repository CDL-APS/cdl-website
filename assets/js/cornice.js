const RETE = {
    ciano:   {nome:'Linea Ciano', tema:'Trasformazione', colore:'#00c8d4', key:'ciano',
              generi:['Road Movie','Thriller Psicologico','Rise-n-Fall'],
              fermate:['Darsena','Quattro Cavalli','Kennedy','Centro Studi','Aeroporto']},
    magenta: {nome:'Linea Magenta', tema:'Contrasto', colore:'#cc00a0', key:'magenta',
              generi:['Realismo Magico','Mockumentary','Distopico'],
              fermate:['Zona Industriale','Parco Marecchia','Borgo','Arco','Centro Studi','Spiaggia Libera']},
    gialla:  {nome:'Linea Gialla', tema:'Evidenza', colore:'#d4b800', key:'gialla',
              generi:['Documentario','Found Footage','Postmodernismo'],
              fermate:['Covignano','Parco della Cava','Arco','Stazione','Quattro Cavalli','Molo']}
};

const SCALI = {
    'ciano-magenta':'Centro Studi','magenta-ciano':'Centro Studi',
    'ciano-gialla':'Quattro Cavalli','gialla-ciano':'Quattro Cavalli',
    'magenta-gialla':'Arco','gialla-magenta':'Arco'
};

const TUTTI_CAPOLINEE = [
    {name:'Darsena',linea:'ciano'},{name:'Aeroporto',linea:'ciano'},
    {name:'Zona Industriale',linea:'magenta'},{name:'Spiaggia Libera',linea:'magenta'},
    {name:'Covignano',linea:'gialla'},{name:'Molo',linea:'gialla'}
];

const GENERI_INFO = {
    'Road Movie': {
        desc: "Il viaggio fisico come motore di mutamento interiore: la strada che consuma e ridefinisce chi la percorre.",
        comps: [["Into the Wild", "2007"], ["Paris, Texas", "1984"]]
    },
    'Thriller Psicologico': {
        desc: "Esplorare la degenerazione mentale causata da un attrito narrativo o morale.",
        comps: [["Il Cigno Nero", "2010"], ["Gone Girl", "2014"]]
    },
    'Rise-n-Fall': {
        desc: "Tracciare la traiettoria fisica e morale dell'ascesa e del crollo sistemico di un personaggio.",
        comps: [["Il Petroliere", "2007"], ["Quei bravi ragazzi", "1990"]]
    },
    'Realismo Magico': {
        desc: "La proiezione onirica o fantastica che contrasta con il rigore della struttura del reale.",
        comps: [["Otto e mezzo", "1963"], ["Amélie", "2001"]]
    },
    'Mockumentary': {
        desc: "La fiction che ruba lo stile del reale come espediente narrativo, manipolando l'osservatore.",
        comps: [["Lake Mungo", "2008"], ["Borat", "2006"]]
    },
    'Distopico': {
        desc: "La proiezione di un futuro alterato che si scontra e stride con le speranze di oggi.",
        comps: [["1984", "1984"], ["Brazil", "1985"]]
    },
    'Documentario': {
        desc: "Osservare il mondo circostante senza filtri artificiali, restituendone la verità strutturale.",
        comps: [["The Fire Within", "2022"], ["Dope Boys Alphabet", "2021"]]
    },
    'Found Footage': {
        desc: "Lasciare che siano i reperti d'archivio e le riprese casuali a raccontare l'opera.",
        comps: [["Creep", "2014"], ["Backrooms", "2026"]]
    },
    'Postmodernismo': {
        desc: "Raccontare il mondo frammentato di oggi con ironia, citazionismo e destrutturazione.",
        comps: [["Pulp Fiction", "1994"], ["Fight Club", "1999"]]
    }
};

let S = {
    capoEstratto: null,
    lineaEstratta: null,
    genere: null,
    strada: null,
    fermataDiretta: null,
    cambioCapoArrivo: null,
    cambioLineaArrivo: null,
    cambioFermata: null
};

// Stato della visualizzazione attiva su Mobile
let activeMobileTab = 'config';

function setMobileTab(tabId) {
    activeMobileTab = tabId;
    
    // Gestione visibilità delle sezioni
    const secConfig = document.getElementById('mobile-sec-config');
    const secOutput = document.getElementById('mobile-sec-output');
    const secMap = document.getElementById('mobile-sec-map');
    const capoHeroBox = document.getElementById('capo-hero-box');
    
    const isReady = S.genere && (
        (S.strada === 'diretta' && S.fermataDiretta) ||
        (S.strada === 'cambio' && S.cambioCapoArrivo && S.cambioLineaArrivo)
    );

    if (window.innerWidth < 1024) { // Solo sotto il breakpoint LG di Tailwind
        if (tabId === 'config') {
            secConfig.classList.remove('hidden');
            secOutput.classList.remove('hidden');
            // Nasconde pannello ticket e hero-box su config se non pronti o se completato
            capoHeroBox.classList.toggle('hidden', !S.capoEstratto || isReady);
            document.getElementById('biglietto').classList.add('hidden');
            document.getElementById('biglietto-placeholder').classList.add('hidden');
            secMap.classList.add('hidden');
        } else if (tabId === 'map') {
            secConfig.classList.add('hidden');
            secOutput.classList.add('hidden');
            secMap.classList.remove('hidden');
        } else if (tabId === 'ticket') {
            secConfig.classList.add('hidden');
            secOutput.classList.remove('hidden');
            secMap.classList.add('hidden');
            
            // SEZIONE BIGLIETTO: Mostra solo ed esclusivamente il biglietto!
            capoHeroBox.classList.add('hidden');
            
            if (isReady) {
                document.getElementById('biglietto').classList.remove('hidden');
                document.getElementById('biglietto-placeholder').classList.add('hidden');
                document.getElementById('ticket-badge').classList.add('hidden');
            } else {
                document.getElementById('biglietto').classList.add('hidden');
                document.getElementById('biglietto-placeholder').classList.remove('hidden');
            }
        }
    } else {
        // Ripristina la visualizzazione desktop standard
        secConfig.classList.remove('hidden');
        secOutput.classList.remove('hidden');
        secMap.classList.remove('hidden');
        // Su desktop, se il biglietto è pronto, nascondiamo l'hero box del capolinea per far risaltare solo il biglietto
        capoHeroBox.classList.toggle('hidden', !S.capoEstratto || isReady);
    }

    // Aggiornamento stile dei bottoni tab
    const tabs = ['config', 'map', 'ticket'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        if (btn) {
            if (t === tabId) {
                btn.classList.add('bg-black', 'text-white');
                btn.classList.remove('bg-white', 'text-black');
            } else {
                btn.classList.remove('bg-black', 'text-white');
                btn.classList.add('bg-white', 'text-black');
            }
        }
    });
}

function ramoTra(arr,fromIdx,toIdx){
    if(fromIdx===toIdx) return [];
    const step=fromIdx<toIdx?1:-1;
    const res=[];
    for(let i=fromIdx+step;i!==toIdx;i+=step){ res.push(arr[i]); }
    return res;
}

function calcolaPercorsoCambio(capoEstratto,lineaEstratta,capoArrivo,lineaArrivo){
    const lFrom=RETE[lineaEstratta], lTo=RETE[lineaArrivo];
    const scaloNome=SCALI[lineaEstratta+'-'+lineaArrivo];
    const idxFrom=lFrom.fermate.indexOf(capoEstratto);
    const idxScaloFrom=lFrom.fermate.indexOf(scaloNome);
    const ramoFrom=ramoTra(lFrom.fermate,idxFrom,idxScaloFrom);
    const idxTo=lTo.fermate.indexOf(capoArrivo);
    const idxScaloTo=lTo.fermate.indexOf(scaloNome);
    const ramoTo=ramoTra(lTo.fermate,idxScaloTo,idxTo);
    const fermateDisponibili=[
        ...ramoFrom.map(f=>({nome:f,linea:lineaEstratta})),
        ...ramoTo.map(f=>({nome:f,linea:lineaArrivo}))
    ];
    const percorsoBase=[
        {nome:capoEstratto,linea:lineaEstratta,tipo:'capo'},
        ...ramoFrom.map(f=>({nome:f,linea:lineaEstratta,tipo:'stop'})),
        {nome:scaloNome,linea:lineaEstratta,tipo:'scalo'},
        {nome:scaloNome,linea:lineaArrivo,tipo:'scalo-b'},
        ...ramoTo.map(f=>({nome:f,linea:lineaArrivo,tipo:'stop'})),
        {nome:capoArrivo,linea:lineaArrivo,tipo:'capo'}
    ];
    return {scaloNome,fermateDisponibili,percorsoBase};
}

function calcolaPercorsoDiretto(capoEstratto,lineaEstratta,fermata){
    const l=RETE[lineaEstratta];
    const altroCapo=l.fermate[0]===capoEstratto?l.fermate[l.fermate.length-1]:l.fermate[0];
    return [
        {nome:capoEstratto,linea:lineaEstratta,tipo:'capo'},
        {nome:fermata,linea:lineaEstratta,tipo:'stop'},
        {nome:altroCapo,linea:lineaEstratta,tipo:'capo'}
    ];
}

function isForbidden(a,f,b){
    const forb=[['Molo','Quattro Cavalli','Darsena'],['Darsena','Quattro Cavalli','Molo']];
    return forb.some(x=>(a===x[0]&&f===x[1]&&b===x[2])||(b===x[0]&&f===x[1]&&a===x[2]));
}
const CAMBIO_VIETATO=[['Aeroporto','Spiaggia Libera'],['Molo','Darsena']];
function isCambioVietato(a,b){ return CAMBIO_VIETATO.some(x=>(a===x[0]&&b===x[1])||(a===x[1]&&b===x[0])); }

function selezionaCapolinea(name,linea){
    S = {
        capoEstratto: name,
        lineaEstratta: linea,
        genere: null,
        strada: null,
        fermataDiretta: null,
        cambioCapoArrivo: null,
        cambioLineaArrivo: null,
        cambioFermata: null
    };
    
    // Rendi i box interattivi sbloccandoli con stile coerente
    document.getElementById('strada-container').classList.remove('opacity-40', 'pointer-events-none');
    document.getElementById('generi-container').classList.remove('opacity-40', 'pointer-events-none');
    document.getElementById('capo-hero-box').classList.remove('hidden');
    
    render();
    renderCapoSelect();
}

function renderCapoSelect(){
    const groups={ciano:[],magenta:[],gialla:[]};
    TUTTI_CAPOLINEE.forEach(c=>groups[c.linea].push(c));
    
    let html='';
    ['ciano','magenta','gialla'].forEach(lk=>{
        html+=`<div class="flex flex-col gap-1.5"><span class="text-[9px] font-black tracking-widest uppercase text-neutral-400 mb-1">${RETE[lk].nome}</span><div class="flex flex-wrap gap-1.5">`;
        html+=groups[lk].map(c=>{
            const active = S.capoEstratto===c.name;
            const bgCol = lk==='ciano' ? 'bg-[#00c8d4]' : (lk==='magenta' ? 'bg-[#cc00a0]' : 'bg-[#d4b800]');
            const textCol = active ? (lk==='magenta'?'text-white':'text-black') : 'text-black hover:bg-neutral-100';
            
            const dynamicClass = active 
                ? `${bgCol} ${textCol} border-2 border-black font-black` 
                : 'bg-white border-2 border-neutral-300';

            return `<button class="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${dynamicClass}" 
                            onclick="selezionaCapolinea('${c.name}','${c.linea}')">
                        <span class="dot-${lk}"></span>${c.name}
                    </button>`;
        }).join('');
        html+='</div></div>';
    });
    document.getElementById('capo-select').innerHTML=html;
}

// Funzione di rendering unificata per evitare qualsiasi blocco grafico
function render(){ 
    renderCapo(); 
    renderGeneri(); 
    renderStrade(); 
    renderPanels(); 
    renderMappa(); 
    renderBiglietto(); 
    
    // Forza il ricalcolo della visibilità per mobile basato sul tab attivo
    setMobileTab(activeMobileTab);
}

function renderCapo(){
    if (!S.lineaEstratta) return;
    const lk=S.lineaEstratta, l=RETE[lk];
    document.getElementById('capo-wm').textContent=S.capoEstratto.substring(0,3);
    const big=document.getElementById('capo-big'); 
    big.textContent=S.capoEstratto;
    
    const colMap={ciano:'text-[#00c8d4]',magenta:'text-[#cc00a0]',gialla:'text-[#d4b800]'};
    big.className=`text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight my-1 ${colMap[lk]}`;
    
    const pillCol = lk==='ciano' ? 'bg-[#00c8d4] text-black' : (lk==='magenta' ? 'bg-[#cc00a0] text-white' : 'bg-[#d4b800] text-black');
    document.getElementById('capo-pills').innerHTML=`<div class="px-2 py-0.5 text-[8px] font-black tracking-widest uppercase border border-black ${pillCol}">${l.nome}</div><div class="text-[9px] font-bold text-neutral-500 uppercase tracking-widest italic">TEMA: ${l.tema}</div>`;
}

function selGenere(g){ 
    S.genere=g; 
    render(); 
    checkCompletionAndNotify();
}

function renderGeneri(){
    if (!S.lineaEstratta) return;
    
    // Seleziona la linea corretta in base alla scelta della strada per mostrare i generi della linea finale se è stato effettuato un cambio
    const lk = (S.strada === 'cambio' && S.cambioLineaArrivo) ? S.cambioLineaArrivo : S.lineaEstratta;
    const l = RETE[lk];
    const activeBg = lk==='ciano' ? 'bg-[#00c8d4] text-black border-black' : (lk==='magenta' ? 'bg-[#cc00a0] text-white border-black' : 'bg-[#d4b800] text-black border-black');
    
    document.getElementById('generi').innerHTML=l.generi.map(g=>{
        const active = S.genere===g;
        const buttonClass = active 
            ? `${activeBg} font-black border-2` 
            : 'bg-white text-black border-2 border-neutral-300 hover:border-black font-semibold';
            
        return `<button class="px-2.5 py-1.5 text-[10px] sm:text-xs uppercase tracking-wider transition-all ${buttonClass}" onclick="selGenere('${g}')">${g}</button>`;
    }).join('');
    renderGenereInfo();
}

function renderGenereInfo(){
    const box=document.getElementById('genere-info');
    if(!S.genere || !GENERI_INFO[S.genere]){ 
        box.style.display='none'; 
        box.innerHTML=''; 
        return; 
    }
    const info=GENERI_INFO[S.genere];
    box.style.display='block';
    box.innerHTML=`
        <div class="font-black text-[10px] sm:text-xs uppercase tracking-widest text-black mb-1">${S.genere}</div>
        <div class="text-[11px] sm:text-xs text-neutral-600 leading-relaxed mb-3">${info.desc}</div>
        <div class="text-[8px] font-black tracking-widest uppercase text-neutral-400 mb-1.5">Cinematografia Consigliata</div>
        <div class="space-y-1.5">
          ${info.comps.map(c=>`<div class="flex justify-between text-[11px] border-b border-neutral-200 pb-1"><span class="font-bold text-black pr-2 leading-tight">${c[0]}</span><span class="text-neutral-400 font-medium shrink-0">${c[1]}</span></div>`).join('')}
        </div>`;
}

function renderStrade(){
    ['diretta','cambio'].forEach(s=>{
        const element = document.getElementById('strada-'+s);
        const checkIcon = element.querySelector('.check-icon');
        const isActive = S.strada===s;
        
        element.classList.toggle('bg-black', isActive);
        element.classList.toggle('text-white', isActive);
        
        const h4El = element.querySelector('h4');
        const pEl = element.querySelector('p');
        const iconEl = element.querySelector('svg');
        
        if (isActive) {
            h4El.classList.remove('text-black'); h4El.classList.add('text-white');
            pEl.classList.remove('text-neutral-500'); pEl.classList.add('text-neutral-300');
            iconEl.classList.remove('text-black'); iconEl.classList.add('text-white');
        } else {
            h4El.classList.remove('text-white'); h4El.classList.add('text-black');
            pEl.classList.remove('text-neutral-300'); pEl.classList.add('text-neutral-500');
            iconEl.classList.remove('text-white'); iconEl.classList.add('text-black');
        }
        
        if (checkIcon) {
            checkIcon.classList.toggle('opacity-0', !isActive);
            checkIcon.classList.toggle('opacity-100', isActive);
        }
    });
    
    const barCiano = S.lineaEstratta==='ciano' ? 'bg-[#00c8d4]' : (S.lineaEstratta==='magenta' ? 'bg-[#cc00a0]' : 'bg-[#d4b800]');
    document.getElementById('bar-diretta').className = `h-1 w-full mt-3 ${S.strada==='diretta' ? 'bg-white' : barCiano}`;
    document.getElementById('bar-cambio').className = `h-1 w-full mt-3 ${S.strada==='cambio' ? 'bg-white' : barCiano}`;
}

function scegliStrada(s){
    S.strada=s; S.fermataDiretta=null; S.cambioCapoArrivo=null; S.cambioLineaArrivo=null; S.cambioFermata=null;
    S.genere=null; // Reset del genere cinematografico per motivi di compatibilità con la nuova modalità
    render();
}

function renderPanels(){
    const lk=S.lineaEstratta, l=RETE[lk];
    
    const panelDiretta = document.getElementById('panel-diretta');
    const panelCambio = document.getElementById('panel-cambio');
    
    const isReady = S.genere && (
        (S.strada === 'diretta' && S.fermataDiretta) ||
        (S.strada === 'cambio' && S.cambioCapoArrivo && S.cambioLineaArrivo)
    );

    // Se completato, nascondi i pannelli di scelta per mostrare SOLO il biglietto pulito
    if (isReady) {
        panelDiretta.classList.add('hidden');
        panelCambio.classList.add('hidden');
        return;
    }

    panelDiretta.classList.toggle('hidden', S.strada!=='diretta');
    panelCambio.classList.toggle('hidden', S.strada!=='cambio');

    if(S.strada==='diretta' && l){
        const AltroCapo=l.fermate[0]===S.capoEstratto?l.fermate[l.fermate.length-1]:l.fermate[0];
        const intermedie=l.fermate.slice(1,l.fermate.length-1);
        
        document.getElementById('fermate-dirette').innerHTML=intermedie.map(f=>{
            const vietata=isForbidden(S.capoEstratto,f,AltroCapo);
            const active=S.fermataDiretta===f;
            
            const btnClass = vietata 
                ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed line-through' 
                : (active 
                    ? 'bg-black text-white border-black font-black' 
                    : 'bg-white text-black border-neutral-300 hover:border-black font-semibold');
            
            const onclick=vietata?'':`onclick="scegliFermataDiretta('${f}')"`;
            return `<button class="px-2.5 py-1.5 text-[10px] sm:text-xs uppercase tracking-wider transition-all border-2 ${btnClass}" ${onclick}>${f}</button>`;
        }).join('');
    }

    if(S.strada==='cambio'){
        const altriCapo=TUTTI_CAPOLINEE.filter(c=>c.linea!==lk);
        
        document.getElementById('cambio-capolinee').innerHTML=altriCapo.map(c=>{
            const vietato=isCambioVietato(S.capoEstratto,c.name);
            const active=S.cambioCapoArrivo===c.name;
            const col = c.linea;
            
            const activeStyle = active 
                ? (col==='ciano' ? 'bg-[#00c8d4] text-black border-black font-black' : (col==='magenta' ? 'bg-[#cc00a0] text-white border-black font-black' : 'bg-[#d4b800] text-black border-black font-black'))
                : 'bg-white text-black border-neutral-300 hover:border-black font-semibold';
            
            const btnClass = vietato 
                ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed line-through' 
                : activeStyle;
                
            const onclick=vietato?'':`onclick="scegliCambioCapo('${c.name}','${c.linea}')"`;
            
            return `<button class="px-2.5 py-1.5 text-[10px] sm:text-xs uppercase tracking-wider transition-all border-2 flex items-center gap-1.5 ${btnClass}" ${onclick}>
                <span class="dot-${col}"></span>${c.name}
                <span class="text-[8px] opacity-60 font-bold">(${RETE[col].nome.split(' ')[1].substring(0,3).toUpperCase()})</span>
              </button>`;
        }).join('');

        const step2 = document.getElementById('cambio-step2');
        if(S.cambioCapoArrivo&&S.cambioLineaArrivo){
            step2.classList.remove('hidden');
            const {fermateDisponibili}=calcolaPercorsoCambio(S.capoEstratto,lk,S.cambioCapoArrivo,S.cambioLineaArrivo);
            
            if(fermateDisponibili.length===0){
                document.getElementById('cambio-fermate').innerHTML='<span class="text-[11px] text-neutral-500 font-medium italic">Nessuna fermata intermedia su questo itinerario. Passaggio diretto tramite lo Scalo.</span>';
                S.cambioFermata = null; 
            } else {
                document.getElementById('cambio-fermate').innerHTML=fermateDisponibili.map(f=>{
                    const active=S.cambioFermata===f.nome;
                    const fCol = f.linea;
                    
                    const activeStyle = active 
                        ? 'bg-black text-white border-black font-black' 
                        : 'bg-white text-black border-neutral-300 hover:border-black font-semibold';
                        
                    return `<button class="px-2.5 py-1.5 text-[10px] sm:text-xs uppercase tracking-wider transition-all border-2 flex items-center gap-1.5 ${activeStyle}" onclick="scegliCambioFermata('${f.nome}')">
                        <span class="dot-${fCol}"></span>${f.nome}
                    </button>`;
                }).join('');
            }
        } else {
            step2.classList.add('hidden');
        }
    }
    
    setTimeout(() => { lucide.createIcons(); }, 10);
}

function scegliFermataDiretta(f){ 
    S.fermataDiretta=f; 
    render(); 
    checkCompletionAndNotify();
}
function scegliCambioCapo(nome,linea){ 
    S.cambioCapoArrivo=nome; 
    S.cambioLineaArrivo=linea; 
    S.cambioFermata=null; 
    S.genere=null; // Reset del genere cinematografico per forzare la selezione del genere della nuova linea
    render(); 
}
function scegliCambioFermata(f){ 
    S.cambioFermata=f; 
    render(); 
    checkCompletionAndNotify();
}

// Navigazione smart automatica quando il biglietto è sbloccato
function checkCompletionAndNotify() {
    const isReady = S.genere && (
        (S.strada === 'diretta' && S.fermataDiretta) ||
        (S.strada === 'cambio' && S.cambioCapoArrivo && S.cambioLineaArrivo)
    );
    if (isReady && window.innerWidth < 1024) {
        // Fai lampeggiare il badge sulla tab del biglietto e sposta l'utente lì per feedback immediato
        document.getElementById('ticket-badge').classList.remove('hidden');
        setTimeout(() => {
            setMobileTab('ticket');
        }, 300);
    }
}

const POS_CIANO={
    'Darsena':{x:50,y:55},'Quattro Cavalli':{x:130,y:55},'Kennedy':{x:320,y:55},
    'Centro Studi':{x:490,y:55},'Aeroporto':{x:640,y:55}
};
const POS_MAGENTA={
    'Zona Industriale':{x:50,y:130},'Parco Marecchia':{x:140,y:130},'Borgo':{x:220,y:130},
    'Arco':{x:290,y:130},'Centro Studi':{x:490,y:130},'Spiaggia Libera':{x:640,y:130}
};
const POS_GIALLA={
    'Covignano':{x:640,y:205},'Parco della Cava':{x:465,y:205},'Arco':{x:290,y:205},
    'Stazione':{x:210,y:205},'Quattro Cavalli':{x:130,y:205},'Molo':{x:50,y:205}
};
const LINEE_ORD={
    ciano:['Darsena','Quattro Cavalli','Kennedy','Centro Studi','Aeroporto'],
    magenta:['Zona Industriale','Parco Marecchia','Borgo','Arco','Centro Studi','Spiaggia Libera'],
    gialla:['Covignano','Parco della Cava','Arco','Stazione','Quattro Cavalli','Molo']
};

function getPos(f,linea){
    if(linea==='ciano')return POS_CIANO[f]||null;
    if(linea==='magenta')return POS_MAGENTA[f]||null;
    if(linea==='gialla')return POS_GIALLA[f]||null;
    return null;
}

function scaloCubic(nome,x,y1,y2){
    let dx=28;
    if(nome==='Arco') dx=-32;
    if(nome==='Quattro Cavalli') dx=42;
    if(nome==='Centro Studi') dx=30;
    const dy=y2-y1;
    return {cp1x:x+dx,cp1y:y1+dy*0.28, cp2x:x+dx,cp2y:y2-dy*0.28};
}

function connectorPath(nome,lkA,lkB){
    const pa=getPos(nome,lkA), pb=getPos(nome,lkB);
    const c=scaloCubic(nome,pa.x,pa.y,pb.y);
    return `M${pa.x},${pa.y} C${c.cp1x},${c.cp1y} ${c.cp2x},${c.cp2y} ${pb.x},${pb.y}`;
}

function renderMappa(){
    const svg=document.getElementById('map-svg');

    let percorso=null;
    if(S.strada==='diretta'&&S.fermataDiretta){
        percorso=calcolaPercorsoDiretto(S.capoEstratto,S.lineaEstratta,S.fermataDiretta);
    } else if(S.strada==='cambio'&&S.cambioCapoArrivo&&S.cambioLineaArrivo){
        percorso=calcolaPercorsoCambio(S.capoEstratto,S.lineaEstratta,S.cambioCapoArrivo,S.cambioLineaArrivo).percorsoBase;
    }

    const lineaAttiva=S.lineaEstratta;
    const hasCambio=S.strada==='cambio'&&S.cambioLineaArrivo;
    let html='';

    // Griglia tecnica
    [55,130,205].forEach(y=>{ html+=`<line x1="0" y1="${y}" x2="700" y2="${y}" stroke="rgba(255,255,255,.05)" stroke-width="1"/>`; });

    // Tracciamento linee della metropolitana (visibili sempre, più luminose se attive)
    ['ciano','magenta','gialla'].forEach(lk=>{
        const fermate=LINEE_ORD[lk], colore=RETE[lk].colore;
        const isActive= !lineaAttiva || lk===lineaAttiva||(hasCambio&&lk===S.cambioLineaArrivo);
        const op=isActive?'1':'0.15';
        for(let i=0;i<fermate.length-1;i++){
            const p1=getPos(fermate[i],lk), p2=getPos(fermate[i+1],lk);
            if(!p1||!p2)continue;
            html+=`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${colore}" stroke-width="4.5" opacity="${op}" stroke-linecap="round"/>`;
        }
    });

    // Connettori di interscambio
    const connStyle='fill="none" stroke="rgba(247,247,247,.5)" stroke-width="3.5" stroke-dasharray="1,8" stroke-linecap="round"';
    html+=`<path d="${connectorPath('Centro Studi','ciano','magenta')}" ${connStyle}/>`;
    html+=`<path d="${connectorPath('Quattro Cavalli','ciano','gialla')}" ${connStyle}/>`;
    html+=`<path d="${connectorPath('Arco','magenta','gialla')}" ${connStyle}/>`;

    // Stazioni Base (sempre visibili, evidenziate se attive)
    ['ciano','magenta','gialla'].forEach(lk=>{
        LINEE_ORD[lk].forEach((f,i)=>{
            const p=getPos(f,lk); if(!p)return;
            const isCapo=i===0||i===LINEE_ORD[lk].length-1;
            const colore=RETE[lk].colore;
            const isActive= !lineaAttiva || lk===lineaAttiva||(hasCambio&&lk===S.cambioLineaArrivo);
            const op=isActive?'1':'0.15';
            if(isCapo) html+=`<circle cx="${p.x}" cy="${p.y}" r="6" fill="${colore}" stroke="#1d1d1b" stroke-width="1.5" opacity="${op}"/>`;
            else html+=`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#1d1d1b" stroke="${colore}" stroke-width="2.5" opacity="${op}"/>`;
        });
    });

    // Nomi stazioni ed etichette
    ['ciano','magenta','gialla'].forEach(lk=>{
        const isActive= !lineaAttiva || lk===lineaAttiva||(hasCambio&&lk===S.cambioLineaArrivo);
        if(!isActive)return;
        LINEE_ORD[lk].forEach((f,i)=>{
            const p=getPos(f,lk); if(!p)return;
            const words=f.toUpperCase().split(' ');
            const above=(lk==='ciano');
            if(words.length>1){
                const y0=above?p.y-22:p.y+15;
                html+=`<text x="${p.x}" y="${y0}" font-family="Inter,sans-serif" font-size="7.5" font-weight="900" fill="#f7f7f7" text-anchor="middle" opacity="0.85" letter-spacing="0.08em"><tspan x="${p.x}" dy="0">${words[0]}</tspan><tspan x="${p.x}" dy="9.5">${words.slice(1).join(' ')}</tspan></text>`;
            } else {
                const y0=above?p.y-14:p.y+17;
                html+=`<text x="${p.x}" y="${y0}" font-family="Inter,sans-serif" font-size="7.5" font-weight="900" fill="#f7f7f7" text-anchor="middle" opacity="0.85" letter-spacing="0.08em">${words[0]}</text>`;
            }
        });
    });

    // EVIDENZIAZIONE PERCORSO ATTIVO SELEZIONATO
    if(percorso&&percorso.length>=2){
        for(let i=0;i<percorso.length-1;i++){
            const a=percorso[i], b=percorso[i+1];
            const pa=getPos(a.nome,a.linea), pb=getPos(b.nome,b.linea);
            if(!pa||!pb)continue;
            const isInterscambio=a.tipo&&b.tipo&&a.tipo.indexOf('scalo')===0&&b.tipo.indexOf('scalo')===0&&a.nome===b.nome;
            if(isInterscambio){
                const d=connectorPath(a.nome,a.linea,b.linea);
                html+=`<path d="${d}" fill="none" stroke="white" stroke-width="7" opacity="0.4" stroke-linecap="round"/>`;
                html+=`<path d="${d}" fill="none" stroke="${RETE[b.linea].colore}" stroke-width="4.5" stroke-linecap="round"/>`;
            } else {
                const colore=RETE[a.linea].colore;
                html+=`<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="white" stroke-width="7" opacity="0.4" stroke-linecap="round"/>`;
                html+=`<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="${colore}" stroke-width="4.5" stroke-linecap="round"/>`;
            }
        }

        const fermataEvid=S.strada==='cambio'?S.cambioFermata:S.strada==='diretta'?S.fermataDiretta:null;

        percorso.forEach(stop=>{
            const p=getPos(stop.nome,stop.linea); if(!p)return;
            const isCapo=stop.tipo==='capo';
            const isScalo=stop.tipo&&stop.tipo.indexOf('scalo')===0;
            const isSel=stop.nome===fermataEvid&&stop.tipo==='stop';
            const colore=RETE[stop.linea].colore;
            if(isScalo){
                html+=`<circle cx="${p.x}" cy="${p.y}" r="9.5" fill="#ff2222" stroke="white" stroke-width="2"/>`;
                html+=`<text x="${p.x}" y="${p.y+0.5}" font-family="Inter,sans-serif" font-size="7" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="middle">S</text>`;
            } else if(isCapo){
                html+=`<circle cx="${p.x}" cy="${p.y}" r="9" fill="${colore}" stroke="white" stroke-width="2"/>`;
                if(stop.nome===S.capoEstratto) html+=`<circle cx="${p.x}" cy="${p.y}" r="14" fill="none" stroke="white" stroke-width="2" opacity="0.75" stroke-dasharray="2,2"/>`;
            } else if(isSel){
                html+=`<circle cx="${p.x}" cy="${p.y}" r="8.5" fill="${colore}" stroke="white" stroke-width="2.5"/>`;
            } else {
                html+=`<circle cx="${p.x}" cy="${p.y}" r="5" fill="#1d1d1b" stroke="${colore}" stroke-width="2.5"/>`;
            }
        });

        // ANIMAZIONE DEL TRENO LUNGO IL PERCORSO
        let d='';
        for(let i=0;i<percorso.length;i++){
            const s=percorso[i], p=getPos(s.nome,s.linea); if(!p)continue;
            if(d===''){ d=`M ${p.x},${p.y}`; }
            else {
                const prev=percorso[i-1];
                const inter=prev&&prev.tipo&&s.tipo&&prev.tipo.indexOf('scalo')===0&&s.tipo.indexOf('scalo')===0&&prev.nome===s.nome;
                if(inter){
                    const c=scaloCubic(s.nome,p.x,getPos(prev.nome,prev.linea).y,p.y);
                    d+=` C ${c.cp1x},${c.cp1y} ${c.cp2x},${c.cp2y} ${p.x},${p.y}`;
                } else { d+=` L ${p.x},${p.y}`; }
            }
        }
        const pathId='tp-'+Date.now();
        html+=`<path id="${pathId}" d="${d}" fill="none" stroke="none"/>`;
        html+=`<circle r="5.5" fill="white" stroke="#000" stroke-width="1.5" opacity="0.95">
          <animateMotion dur="5.5s" repeatCount="indefinite" rotate="auto" calcMode="linear" keyPoints="0;1;0" keyTimes="0;0.5;1"><mpath href="#${pathId}"/></animateMotion>
        </circle>`;
    }

    svg.innerHTML=html;
}

function renderBiglietto(){
    const el=document.getElementById('biglietto');
    const lk=S.lineaEstratta;
    const isCambio=S.strada==='cambio'&&S.cambioCapoArrivo&&S.cambioLineaArrivo;
    const isDiretto=S.strada==='diretta'&&S.fermataDiretta;
    
    if(!S.genere||(!isCambio&&!isDiretto)){ el.classList.add('hidden'); return; }

    const acMap={ciano:'text-[#00c8d4]',magenta:'text-[#cc00a0]',gialla:'text-[#d4b800]'};
    let percorso, grid;

    if(isDiretto){
        const l=RETE[lk];
        const altroCapo=l.fermate[0]===S.capoEstratto?l.fermate[l.fermate.length-1]:l.fermate[0];
        percorso=[{nome:S.capoEstratto,role:'Partenza'},{nome:S.fermataDiretta,role:'Tratto Intermedio'},{nome:altroCapo,role:'Arrivo'}];
        
        grid=`
          <div class="border-l-2 border-stone-800 pl-2">
            <div class="text-[8px] font-black text-stone-500 uppercase tracking-wider">Linea</div>
            <div class="text-xs font-black uppercase tracking-tight ${acMap[lk]}">${RETE[lk].nome}</div>
          </div>
          <div class="border-l-2 border-stone-800 pl-2">
            <div class="text-[8px] font-black text-stone-500 uppercase tracking-wider">Tema Sviluppo</div>
            <div class="text-xs font-black uppercase text-stone-900 tracking-tight">${RETE[lk].tema}</div>
          </div>
          <div class="border-l-2 border-stone-800 pl-2">
            <div class="text-[8px] font-black text-stone-500 uppercase tracking-wider">Genere</div>
            <div class="text-xs font-black uppercase text-stone-900 tracking-tight whitespace-normal break-words">${S.genere}</div>
          </div>
          <div class="border-l-2 border-stone-800 pl-2">
            <div class="text-[8px] font-black text-stone-500 uppercase tracking-wider">Tragitto</div>
            <div class="text-xs font-black uppercase text-stone-600 tracking-tight">Diretto</div>
          </div>`;
    } else {
        const lkTo=S.cambioLineaArrivo;
        const {scaloNome,percorsoBase}=calcolaPercorsoCambio(S.capoEstratto,lk,S.cambioCapoArrivo,lkTo);
        
        percorso=percorsoBase
          .filter(s=>s.tipo==='capo'||s.tipo==='scalo'||(s.tipo==='stop'&&s.nome===S.cambioFermata))
          .map(s=>({
            nome:s.nome,
            role:s.tipo==='capo'?(s.nome===S.capoEstratto?'Partenza':'Arrivo'):s.tipo==='scalo'?'Cambio Linea':'Tratto Intermedio',
            red:s.tipo==='scalo'
          }));
          
        grid=`
          <div class="border-l-2 border-stone-800 pl-2">
            <div class="text-[8px] font-black text-stone-500 uppercase tracking-wider">Partenza</div>
            <div class="text-xs font-black uppercase tracking-tight ${acMap[lk]}">${RETE[lk].nome.split(' ')[1]}</div>
          </div>
          <div class="border-l-2 border-stone-800 pl-2">
            <div class="text-[8px] font-black text-stone-500 uppercase tracking-wider">Arrivo</div>
            <div class="text-xs font-black uppercase tracking-tight ${acMap[lkTo]}">${RETE[lkTo].nome.split(' ')[1]}</div>
          </div>
          <div class="border-l-2 border-stone-800 pl-2">
            <div class="text-[8px] font-black text-stone-500 uppercase tracking-wider">Genere</div>
            <div class="text-xs font-black uppercase text-stone-900 tracking-tight whitespace-normal break-words">${S.genere}</div>
          </div>
          <div class="border-l-2 border-stone-800 pl-2">
            <div class="text-[8px] font-black text-stone-500 uppercase tracking-wider">Scalo</div>
            <div class="text-xs font-black uppercase text-red-600 tracking-tight">${scaloNome}</div>
          </div>`;
    }

    document.getElementById('big-grid').innerHTML=grid;
    document.getElementById('big-perc').innerHTML=`
        <div class="text-[9px] font-black tracking-widest uppercase text-stone-500 mb-3">Itinerario Certificato</div>
        <div class="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2.5 sm:gap-2">
            ${percorso.map((s,i)=> `
                <div class="flex items-center gap-2">
                    <div class="border border-stone-800 px-3 py-1 bg-stone-100 flex flex-col justify-center">
                        <div class="text-[11px] font-black uppercase text-stone-900 tracking-tight leading-none">${s.nome}</div>
                        <div class="text-[7px] font-black uppercase ${s.red?'text-red-600':'text-stone-500'} tracking-wider mt-0.5">${s.role}</div>
                    </div>
                    ${i<percorso.length-1?'<div class="text-stone-400 text-xs font-bold rotate-90 sm:rotate-0"><i data-lucide="arrow-right" class="w-3 h-3 text-stone-800"></i></div>':''}
                </div>
            `).join('')}
        </div>
        <div class="mt-4 text-[10px] text-stone-600 font-medium italic flex items-start gap-2 border-t border-stone-300 pt-3">
            <i data-lucide="info" class="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5"></i>
            <span>Questo percorso è reversibile: il capolinea estratto può fungere sia da setting iniziale che da destinazione conclusiva del cortometraggio.</span>
        </div>
    `;

    el.classList.remove('hidden');
    el.style.animation='fadeIn 0.5s ease-out';
    setTimeout(() => { lucide.createIcons(); }, 10);
}

function resetAll() {
    S={capoEstratto:null,lineaEstratta:null,genere:null,strada:null,
       fermataDiretta:null,cambioCapoArrivo:null,cambioLineaArrivo:null,cambioFermata:null};
       
    document.getElementById('strada-container').classList.add('opacity-40', 'pointer-events-none');
    document.getElementById('generi-container').classList.add('opacity-40', 'pointer-events-none');
    document.getElementById('capo-hero-box').classList.add('hidden');
    document.getElementById('panel-diretta').classList.add('hidden');
    document.getElementById('panel-cambio').classList.add('hidden');
    document.getElementById('biglietto').classList.add('hidden');
    
    // Su mobile torna al primo tab in fase di reset
    setMobileTab('config');
    renderCapoSelect();
    renderMappa();
}

// Intercetta ridimensionamenti per ricalcolare visualizzazioni mobile/desktop
window.addEventListener('resize', () => {
    setMobileTab(activeMobileTab);
});

/* Inizializzazione Completa dell'Applicazione */
renderCapoSelect();
renderMappa();
setMobileTab('config');
lucide.createIcons();
