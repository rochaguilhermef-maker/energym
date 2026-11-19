'use strict';
/* =====================================================================
   ENERGYM | Navegação e interações
   Parte: Rocha (frontend)
   Rotas, montagem das telas, folhas inferiores, avisos e ações dos botões
===================================================================== */
/* ---------------- roteamento ---------------- */
const TABS = [['inicio','Início','home'],['treinar','Treinar','zap'],['loja','Loja','gift'],['ranking','Ranking','trophy'],['perfil','Perfil','user']];
let route = 'inicio', param = null, ui = {cat:'Todos', rank:'semana', pick:null};
function go(r){ location.hash = '#/'+r; }
window.addEventListener('hashchange', onHash);
function onHash(){
  const [r, p] = (location.hash.replace(/^#\/?/,'') || 'inicio').split('/');
  if (S && r!=='sessao') { // tentou sair durante o treino
    history.replaceState(null,'','#/sessao'); askEndSession(); return;
  }
  if (!S && r==='sessao') { history.replaceState(null,'','#/treinar'); route='treinar'; param=null; render(); return; }
  route = r; param = p || null; render(true);
}

/* ---------------- render ---------------- */
const app = $('#app');
function render(resetScroll){
  if (!state || !state.user) { app.innerHTML = viewWelcome(); bindWelcome(); return; }
  const isTab = TABS.some(t=>t[0]===route);
  const views = {inicio:viewHome, treinar:viewTrain, loja:viewStore, ranking:viewRanking, perfil:viewProfile, historico:viewHistory, resumo:viewSummary, sessao:viewSession};
  const fn = views[route] || viewHome;
  const unread = state.notifications.filter(n=>!n.read).length;
  const top = route==='sessao' ? '' :
    isTab ? `<header class="topbar">
        <div class="brand">${logo()}<b>ENERGYM</b></div>
        <button class="pill" data-act="go" data-to="loja" aria-label="${fmt(state.points)} pontos. Abrir loja">${ic('zap')}<span class="num">${fmt(state.points)}</span></button>
        <button class="iconbtn" data-act="notifs" aria-label="Notificações${unread?`, ${unread} novas`:''}">${ic('bell')}${unread?'<span class="dot"></span>':''}</button>
      </header>`
    : `<header class="topbar">
        <button class="iconbtn" data-act="back" aria-label="Voltar">${ic('back')}</button>
        <span class="toptitle">${route==='historico'?'Histórico de treinos':'Resumo do treino'}</span>
      </header>`;
  const nav = (route==='sessao') ? '' : `<nav class="tabbar" aria-label="Navegação principal">${TABS.map(([id,l,i])=>
      `<a class="tab" href="#/${id}" ${(route===id||(route==='historico'&&id==='perfil')||(route==='resumo'&&id==='treinar'))?'aria-current="page"':''}><span class="ic">${ic(i)}</span>${l}</a>`).join('')}</nav>`;
  const prevScroll = $('.view') ? $('.view').scrollTop : 0;
  app.innerHTML = top + `<section class="view" id="view">${fn()}</section>` + nav;
  if (!resetScroll) $('#view').scrollTop = prevScroll;
  after();
}
function after(){
  if (route==='sessao') { drawSpark(); }
}


/* ---------------- folhas, avisos ---------------- */
function sheet(html, opts={}){
  closeSheet();
  const b = document.createElement('div'); b.className='backdrop'; b.id='backdrop';
  b.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" ${opts.id?`data-id="${opts.id}"`:''}>${html}</div>`;
  b.addEventListener('click', e=>{ if (e.target===b || e.target.closest('[data-close]')) closeSheet(); });
  $('#shell').appendChild(b);
  const f = b.querySelector('input,button.btn-lima,button'); if (f) setTimeout(()=>f.focus({preventScroll:true}), 50);
}
function closeSheet(){ const b=$('#backdrop'); if (b) b.remove(); }
let toastT;
function toast(msg){ const old=$('.toast'); if (old) old.remove(); clearTimeout(toastT);
  const t=document.createElement('div'); t.className='toast'; t.setAttribute('role','status'); t.innerHTML=ic('check')+`<span>${esc(msg)}</span>`;
  if (route==='sessao') t.classList.add('top');
  $('#shell').appendChild(t); toastT=setTimeout(()=>t.remove(), 2800); }
document.addEventListener('keydown', e=>{ if (e.key==='Escape') closeSheet(); });

function howSheet(){
  sheet(`<div class="grab"></div><h2 class="h2">Como você ganha pontos</h2>
    <ul class="list">
      <li><div class="tile">${ic('zap')}</div><div class="grow"><div class="t">Treino nos aparelhos geradores</div><div class="s">Cada 1 Wh medido pelo sensor vale ${PTS_PER_WH} pontos. Um treino de 30 min na bicicleta rende cerca de 120 pontos.</div></div></li>
      <li><div class="tile agua">${ic('footprints')}</div><div class="grow"><div class="t">Piso piezoelétrico</div><div class="s">Faça check-in na unidade: cada ${STEPS_PER_PT} passos no piso valem 1 ponto.</div></div></li>
      <li><div class="tile sol">${ic('users')}</div><div class="grow"><div class="t">Meta coletiva</div><div class="s">Quando a unidade bate a meta do mês, todos ganham +100 pontos.</div></div></li>
      <li><div class="tile">${ic('trophy')}</div><div class="grow"><div class="t">Níveis</div><div class="s">A cada ${WH_PER_LEVEL} Wh acumulados você sobe de nível, de Faísca até Rede nacional.</div></div></li>
    </ul>
    <p class="tiny faint">Regras de demonstração do projeto ENERGYM. Os valores finais dependem da calibração dos geradores.</p>
    <button class="btn btn-lima block" data-close>Entendi</button>`);
}

/* ---------------- ações ---------------- */
document.addEventListener('click', e=>{
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act;
  const A = {
    go: ()=> go(el.dataset.to),
    back: ()=> history.length>1 ? history.back() : go('inicio'),
    pick: ()=> { ui.pick = el.dataset.id; render(); },
    goal: ()=> { state.goal = +el.dataset.v; save(); render(); },
    pair: startPairing,
    'lgpd-on': ()=> { state.settings.lgpd = true; save(); closeSheet(); toast('Registro de dados ativado.'); startPairing(); },
    effort: ()=> { if (!S) return; S.effort = el.dataset.v; document.querySelectorAll('[data-act="effort"]').forEach(b=>b.setAttribute('aria-pressed', b.dataset.v===S.effort)); },
    speed: ()=> { state.speed = +el.dataset.v; save(); document.querySelectorAll('[data-act="speed"]').forEach(b=>b.setAttribute('aria-pressed', +b.dataset.v===state.speed)); },
    pause: ()=> { if (!S) return; S.paused = !S.paused;
      el.innerHTML = S.paused ? ic('play')+'Continuar' : ic('pause')+'Pausar';
      const sn = $('#s-sensor'); sn.className = 'sensor'+(S.paused?' off':''); sn.innerHTML = '<i></i>'+(S.paused?'Pausado':`Sensor ${S.m.tag} conectado`); },
    finish: finishSession,
    discard: discardSession,
    'end-ask': askEndSession,
    checkin: ()=> { const {steps, pts} = doCheckin(); render(); toast(`Check-in feito: ${steps} passos, +${pts} pontos.`); },
    cat: ()=> { ui.cat = el.dataset.v; render(); },
    product: ()=> openProduct(el.dataset.id),
    'go-train': ()=> { closeSheet(); go('treinar'); },
    redeem: ()=> redeem(el.dataset.id),
    code: ()=> showCode(el.dataset.id),
    how: howSheet,
    rank: ()=> { ui.rank = el.dataset.v; render(); },
    toggle: ()=> { const k = el.dataset.k; state.settings[k] = !state.settings[k]; save(); render();
      toast(k==='lgpd' ? (state.settings.lgpd?'Registro de dados ativado.':'Registro de dados desativado. Treinos não vão somar pontos.') : 'Preferência salva.'); },
    ach: ()=> { const x = ACH.find(q=>q.id===el.dataset.id), on = state.achievements[x.id];
      sheet(`<div class="center"><div class="tile" style="width:72px;height:72px;border-radius:24px;${on?'background:var(--lima);color:var(--sobre-lima)':''}">${ic(on?x.icon:'lock')}</div>
        <h2 class="h2">${x.name}</h2><p class="muted small">${x.desc}</p>
        <span class="tag ${on?'lima':''}">${on?'Desbloqueada em '+new Date(on).toLocaleDateString('pt-BR'):'Ainda bloqueada'}</span></div>
        <button class="btn btn-lima block" data-close>Fechar</button>`); },
    notifs: ()=> { const list = state.notifications;
      sheet(`<div class="grab"></div><h2 class="h2">Notificações</h2>
        ${list.length?`<ul class="list">${list.map(n=>`<li><div class="tile" style="width:38px;height:38px;border-radius:12px">${ic('bell')}</div><div class="grow"><div class="t" style="font-weight:${n.read?500:700}">${esc(n.text)}</div><div class="s">${shortDate(n.date)}</div></div></li>`).join('')}</ul>`:'<p class="muted">Nada por aqui ainda.</p>'}
        <button class="btn btn-linha block" data-close>Fechar</button>`);
      list.forEach(n=>n.read=true); save(); const d=$('.topbar .dot'); if (d) d.remove(); },
    'edit-name': ()=> { sheet(`<div class="grab"></div><h2 class="h2">Editar nome</h2>
        <label class="field"><span class="label">Nome</span><input class="input" id="newname" maxlength="40" value="${esc(state.user.name)}"></label>
        <button class="btn btn-lima block" data-act="save-name">Salvar nome</button><button class="btn btn-linha block" data-close>Cancelar</button>`); },
    'save-name': ()=> { const v = $('#newname').value.trim(); if (v.length<2) { $('#newname').focus(); return; }
      state.user.name = v; save(); closeSheet(); render(); toast('Nome salvo.'); },
    support: ()=> sheet(`<div class="grab"></div><h2 class="h2">Falar com a unidade</h2>
        <p class="muted small">${UNIT}. Atendimento de segunda a sábado, das 6h às 22h.</p>
        <div class="menu panel" style="padding-top:2px;padding-bottom:2px">
          <button data-act="soon" data-v="o chat">${ic('message')}<span class="grow">Chat no app</span>${ic('chevron','faint')}</button>
          <button data-act="soon" data-v="o WhatsApp">${ic('phone')}<span class="grow">WhatsApp da unidade</span>${ic('chevron','faint')}</button>
          <button data-act="soon" data-v="o SAC">${ic('info')}<span class="grow">SAC ENERGYM</span>${ic('chevron','faint')}</button>
        </div>
        <button class="btn btn-linha block" data-close>Fechar</button>`),
    soon: ()=> { closeSheet(); toast(`No protótipo, ${el.dataset.v} ainda não está conectado.`); },
    reset: ()=> sheet(`<div class="center"><h2 class="h2">Restaurar dados de demonstração?</h2><p class="muted small">Seus treinos, pontos e resgates feitos neste navegador voltam ao exemplo inicial.</p></div>
        <button class="btn btn-lima block" data-act="reset-ok">Restaurar dados</button><button class="btn btn-linha block" data-close>Cancelar</button>`),
    'reset-ok': ()=> { const n = state.user.name; state = seed(n); save(); closeSheet(); go('inicio'); render(true); toast('Dados de demonstração restaurados.'); },
    logout: ()=> { state.user = null; save(); closeSheet(); history.replaceState(null,'','#/'); render(true); },
  };
  if (A[a]) { e.preventDefault(); A[a](); }
});

/* ---------------- QR lateral (desktop) ---------------- */
(function asideQR(){
  const box = $('#aside-qr'); if (!box) return;
  if (location.protocol.startsWith('http')) box.innerHTML = `<div class="qr">${qrSVG(location.origin+location.pathname)}</div><p class="small" style="margin-top:10px">Aponte a câmera para abrir no celular.</p>`;
})();

/* ---------------- selo do Netlify ----------------
   Em projetos gratuitos o Netlify mostra o selo "Powered by Netlify" fixo no canto
   inferior direito. Aqui o app mede o selo e reserva esse espaço embaixo do menu,
   para nenhum botão ficar coberto. Se o selo sumir, o espaço volta a zero. */
function fitBadge(){
  const f = document.getElementById('nl-badge-frame'), shell = document.getElementById('shell');
  let need = 0;
  if (f && shell) {
    const cs = getComputedStyle(f), r = f.getBoundingClientRect(), s = shell.getBoundingClientRect();
    const visible = cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0;
    if (visible && r.left < s.right && r.right > s.left && r.top < s.bottom && r.bottom > s.top) need = Math.ceil(s.bottom - r.top);
  }
  need = Math.max(0, Math.min(need, 120));
  if (need !== fitBadge.v) { fitBadge.v = need; document.documentElement.style.setProperty('--badge', need+'px'); }
}
fitBadge(); setInterval(fitBadge, 800); window.addEventListener('resize', fitBadge);

/* ---------------- PWA ---------------- */
if ('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});

/* ---------------- início ---------------- */
if (state && state.user) checkAchievements();
onHash();
