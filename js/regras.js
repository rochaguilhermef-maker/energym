'use strict';
/* =====================================================================
   ENERGYM | Regras de negócio
   Parte: Arthur (backend)
   - Conquistas, níveis, sequência de dias, calorias estimadas
   - Notificações, check-in no piso e resgate de recompensas
===================================================================== */
const ACH = [
  {id:'primeiro', name:'Primeira faísca',   desc:'Conclua seu primeiro treino gerador.',             icon:'zap',        test:s=>s.history.length>=1},
  {id:'sessao60', name:'Bateria cheia',     desc:'Gere 60 Wh em um único treino.',                    icon:'battery',    test:s=>s.history.some(h=>h.wh>=60)},
  {id:'piso',     name:'Passo a passo',     desc:'Faça check-in no piso piezoelétrico.',              icon:'footprints', test:s=>Object.keys(s.checkins).length>=1},
  {id:'seq3',     name:'Três dias seguidos',desc:'Treine ou faça check-in 3 dias em sequência.',      icon:'flame',      test:s=>streak(s)>=3},
  {id:'dez',      name:'Ritmo de usina',    desc:'Complete 10 treinos geradores.',                    icon:'activity',   test:s=>s.history.length>=10},
  {id:'kwh',      name:'Primeiro kWh',      desc:'Some 1 kWh gerado desde que entrou.',               icon:'plug',       test:s=>s.totalWh>=1000},
  {id:'resgate',  name:'Energia virou prêmio',desc:'Resgate sua primeira recompensa na loja.',        icon:'gift',       test:s=>s.redemptions.length>=1},
  {id:'kwh5',     name:'Microusina',        desc:'Some 5 kWh gerados.',                               icon:'sun',        test:s=>s.totalWh>=5000},
];


const kcalOf = wh => Math.round(wh*3.9);           // estimativa: eficiência humana ~22%
const levelOf = wh => Math.floor(wh/WH_PER_LEVEL)+1;
const levelName = l => LEVELS[Math.min(l-1, LEVELS.length-1)];

function weekWh(s, days=7){ const from = addDays(new Date(), -(days-1)); from.setHours(0,0,0,0);
  return s.history.filter(h=>new Date(h.date)>=from).reduce((a,h)=>a+h.wh,0); }
function todayWh(s){ const k=dayKey(); return s.history.filter(h=>dayKey(h.date)===k).reduce((a,h)=>a+h.wh,0); }
function streak(s){
  const days = new Set([...s.history.map(h=>dayKey(h.date)), ...Object.keys(s.checkins||{})]);
  let d = new Date(); if (!days.has(dayKey(d))) d = addDays(d,-1);
  let n=0; while (days.has(dayKey(d))) { n++; d = addDays(d,-1); } return n;
}
function notify(text){ state.notifications.unshift({id:uid(), text, date:new Date().toISOString(), read:false}); state.notifications = state.notifications.slice(0,30); }
function checkAchievements(){
  const fresh = [];
  ACH.forEach(a=>{ if (!state.achievements[a.id] && a.test(state)) { state.achievements[a.id]=new Date().toISOString(); fresh.push(a.id); notify(`Conquista desbloqueada: ${a.name}.`); } });
  return fresh;
}


/* Check-in no piso piezoelétrico: registra os passos do dia e converte em pontos */
function doCheckin(){
  const steps = 300 + Math.floor(Math.random()*600);  // simulação do sensor do piso
  state.checkins[dayKey()] = steps;
  const pts = Math.floor(steps/STEPS_PER_PT); state.points += pts;
  checkAchievements(); save();
  return {steps, pts};
}

/* Resgate na loja: valida saldo e estoque, desconta pontos e gera o código de retirada */
function doRedeem(pid){
  const p = product(pid); const stock = state.stock[p.id]??p.stock;
  if (state.points < p.pts || stock<=0) return null;
  const code = 'ENG-' + Math.random().toString(36).slice(2,7).toUpperCase().replace(/[^A-Z0-9]/g,'X');
  state.points -= p.pts; state.stock[p.id] = stock-1;
  const r = {id:uid(), pid:p.id, name:p.name, pts:p.pts, code, date:new Date().toISOString(), until:addDays(new Date(),7).toISOString(), status:'pendente'};
  state.redemptions.unshift(r);
  notify(`Resgate confirmado: ${p.name}. Código ${code}.`);
  checkAchievements(); save();
  return r;
}
