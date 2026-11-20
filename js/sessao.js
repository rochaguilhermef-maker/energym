'use strict';
/* =====================================================================
   ENERGYM | Sessão de treino
   Parte: Arthur (backend)
   - Simula a leitura do sensor IoT do gerador (watts a cada 250 ms)
   - Acumula a energia (Wh), converte em pontos e grava o treino
===================================================================== */
let S = null;
function beginSession(mid){
  const m = machine(mid); state.lastMachine = mid; save();
  S = {m, goal:state.goal, effort:'moderado', sec:0, wh:0, watts:0, smooth:m.watts*.4, samples:[], paused:false, startedAt:new Date().toISOString(), peak:0};
  S.timer = setInterval(tick, 250);
  history.pushState(null,'','#/sessao'); route='sessao'; render(true);
}
function tick(){
  if (!S || S.paused) return;
  const dt = .25*state.speed;
  const target = S.m.watts*EFFORT[S.effort].k;
  S.smooth += (target - S.smooth)*.12;
  const w = Math.max(0, S.smooth*(.92 + Math.random()*.16));
  S.watts = w; S.peak = Math.max(S.peak, w); S.sec += dt; S.wh += w*dt/3600;
  S.samples.push(w); if (S.samples.length>90) S.samples.shift();
  updateSession();
}
function stopTimer(){ if (S && S.timer) clearInterval(S.timer); }
function finishSession(){
  if (!S) return; stopTimer(); closeSheet();
  if (S.wh < 0.3) { S=null; toast('Treino descartado: nenhuma energia foi registrada.'); go('treinar'); return; }
  const before = levelOf(state.totalWh);
  const wh = +S.wh.toFixed(1), pts = Math.floor(S.wh*PTS_PER_WH);
  const rec = {id:'h'+uid(), date:new Date().toISOString(), machine:S.m.id, sec:Math.round(S.sec), min:Math.round(S.sec/60), wh,
    wAvg: Math.round(S.wh/(S.sec/3600)) || 0, peak:Math.round(S.peak), kcal:kcalOf(wh), pts, effort:S.effort, goal:S.goal};
  state.history.push(rec); state.totalWh = +(state.totalWh + wh).toFixed(1); state.points += pts;
  const after = levelOf(state.totalWh);
  if (after>before) { rec.levelUp = after; notify(`Você subiu para o nível ${after}: ${levelName(after)}.`); }
  rec.unlocked = checkAchievements();
  notify(`Treino concluído: +${fmt(pts)} pontos com ${fmt(wh,1)} Wh.`);
  save(); S = null; go('resumo/'+rec.id);
}
function discardSession(){ stopTimer(); S=null; closeSheet(); toast('Treino descartado.'); go('treinar'); }
window.addEventListener('beforeunload', e=>{ if (S) { e.preventDefault(); e.returnValue=''; } });
