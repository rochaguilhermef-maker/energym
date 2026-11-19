'use strict';
/* =====================================================================
   ENERGYM | Dados do app
   Parte: Marcos (banco de dados e servidor)
   - Parâmetros de conversão e catálogos (aparelhos, produtos, ranking)
   - Persistência no navegador (localStorage) e dados de demonstração
   Os valores de conversão são de demonstração do projeto.
===================================================================== */
const STORE_KEY = 'energym.aluno.v1';
const PTS_PER_WH = 2;          // 1 Wh gerado = 2 pontos
const STEPS_PER_PT = 20;       // piso piezoelétrico: 20 passos = 1 ponto
const WH_PER_LEVEL = 500;      // a cada 500 Wh acumulados, sobe um nível
const DAILY_GOAL = 150;        // meta diária de energia (Wh)
const WH_PER_PHONE = 15;       // carga completa de um smartphone (aprox.)
const LED_W = 9;               // lâmpada LED de 9 W
const CO2_KG_PER_KWH = 0.04;   // fator de emissão estimado da rede (ajustável)
const UNIT = 'Energym Paulínia';

const LEVELS = ['Faísca','Centelha','Corrente','Dínamo','Gerador','Turbina','Usina','Hidrelétrica','Rede nacional'];
const MACHINES = [
  {id:'bike',     name:'Bicicleta ergométrica', tag:'BK-03', watts:120, icon:'bike'},
  {id:'esteira',  name:'Esteira não motorizada', tag:'ES-01', watts:90,  icon:'activity'},
  {id:'eliptico', name:'Elíptico',               tag:'EL-02', watts:100, icon:'cycle'},
  {id:'remo',     name:'Remo',                   tag:'RM-01', watts:110, icon:'waves'},
  {id:'puxador',  name:'Puxador com gerador',    tag:'PX-04', watts:65,  icon:'dumbbell'},
];
const EFFORT = {leve:{label:'Leve',k:.65}, moderado:{label:'Moderado',k:1}, intenso:{label:'Intenso',k:1.35}};
const PRODUCTS = [
  {id:'coq',      name:'Coqueteleira ENERGYM', cat:'Acessórios',  pts:800,  stock:14, icon:'cup',      tone:'lima',  desc:'600 ml, tampa rosqueável e mola misturadora.'},
  {id:'squeeze',  name:'Squeeze térmico',      cat:'Acessórios',  pts:700,  stock:11, icon:'bottle',   tone:'agua',  desc:'500 ml, mantém a água gelada durante o treino.'},
  {id:'toalha',   name:'Toalha de treino',     cat:'Acessórios',  pts:600,  stock:0,  icon:'towel',    tone:'sol',   desc:'Microfibra, secagem rápida.'},
  {id:'regata',   name:'Regata ENERGYM',       cat:'Vestuário',   pts:1200, stock:9,  icon:'tank',     tone:'folha', desc:'Dry fit, tamanhos P ao GG.'},
  {id:'camiseta', name:'Camiseta ENERGYM',     cat:'Vestuário',   pts:1500, stock:6,  icon:'shirt',    tone:'lima',  desc:'Algodão com poliéster reciclado.'},
  {id:'diaria',   name:'Diária para um amigo', cat:'Experiências',pts:900,  stock:99, icon:'ticket',   tone:'agua',  desc:'Leve alguém para treinar um dia com você.'},
  {id:'avaliacao',name:'Avaliação física',     cat:'Experiências',pts:1000, stock:99, icon:'clipboard',tone:'sol',   desc:'Bioimpedância e plano de treino com instrutor.'},
];
const RIVALS = [
  {name:'Camila R.', w:820, m:2310},{name:'Lucas P.', w:760, m:2105},{name:'Rafael M.', w:610, m:1540},
  {name:'Bruna S.', w:540, m:1722},{name:'Ana T.', w:430, m:1388},{name:'Diego L.', w:390, m:1205},{name:'Juliana F.', w:300, m:990},
];

/* ---------------- estado ---------------- */
let state = load();
function load(){ try { const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; } }
function save(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch(e){} }

function seed(name){
  const now = new Date(); const hist = [];
  const plan = [[0,'bike',32,1.0,7],[1,'esteira',25,.95,18],[2,'eliptico',40,1.0,7],[4,'remo',20,1.05,19],[5,'bike',35,1.1,8],[7,'puxador',22,1.0,18],[8,'bike',30,1.0,7],[10,'eliptico',38,.95,19],[12,'remo',24,1.0,8]];
  plan.forEach(([ago,mid,min,k,hour],i)=>{
    const m = machine(mid); const wAvg = Math.round(m.watts*k*(0.94+(i*37%9)/100));
    const wh = +(wAvg*min/60).toFixed(1);
    let d = addDays(now,-ago); d.setHours(hour, (i*13)%50, 0, 0);
    if (d > now) d = new Date(now.getTime()-45*60e3);
    hist.push({id:'h'+i, date:d.toISOString(), machine:mid, min, sec:min*60, wh, wAvg, kcal:kcalOf(wh), pts:Math.round(wh*PTS_PER_WH), effort:'moderado'});
  });
  const s = {
    v:1, user:{name:name||'Aluno', unit:UNIT, plan:'Mensal', since:addDays(now,-62).toISOString()},
    points:1240, totalWh: +(hist.reduce((a,h)=>a+h.wh,0)+1300).toFixed(1),
    history:hist, redemptions:[], stock:Object.fromEntries(PRODUCTS.map(p=>[p.id,p.stock])),
    checkins:{[dayKey(addDays(now,-1))]:612,[dayKey(addDays(now,-2))]:488},
    settings:{lgpd:true, notif:true, ranking:true}, speed:10, goal:60, lastMachine:'bike',
    achievements:{}, notifications:[{id:uid(), text:'Boas-vindas à ENERGYM! Treine nos aparelhos geradores e acompanhe sua energia aqui.', date:now.toISOString(), read:false}],
  };
  ACH.forEach(a=>{ if (a.test(s)) s.achievements[a.id]=now.toISOString(); });
  return s;
}

