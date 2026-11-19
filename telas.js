'use strict';
/* =====================================================================
   ENERGYM | Telas do app
   Parte: Rocha (frontend)
   Início, treinar, treino ao vivo, resumo, histórico, loja, ranking e perfil
===================================================================== */
/* ---------------- telas ---------------- */
function viewWelcome(){
  const known = state && state.history && state.history.length;
  return `<div class="welcome">
    <div>${logo('logo')}</div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="word">ENERGYM</div>
      <div class="pitch">Seu treino gera energia. A energia vira pontos.</div>
      <p class="muted">Pareie com os aparelhos geradores, acompanhe em tempo real quanto você produz e troque seus pontos por produtos da marca na unidade.</p>
    </div>
    <form id="wform" class="stack" novalidate>
      <label class="field"><span class="label">Seu nome</span>
        <input class="input" id="wname" autocomplete="given-name" maxlength="40" placeholder="Como quer ser chamado" value="${known?esc(state.user?.name||''):''}"></label>
      <label class="field"><span class="label">Unidade</span>
        <select class="input" id="wunit"><option>Energym Paulínia (unidade piloto)</option></select></label>
      <label class="check"><input type="checkbox" id="wlgpd" checked>
        <span>Autorizo o registro da energia gerada e dos dados de execução dos meus treinos, conforme a LGPD. Posso mudar isso no perfil quando quiser.</span></label>
      <div class="err" id="werr" role="alert"></div>
      <button class="btn btn-lima block" type="submit">${ic('zap')}Entrar no app</button>
      <p class="tiny faint" style="text-align:center">Protótipo acadêmico. Os dados de demonstração ficam salvos só neste navegador.</p>
    </form>
  </div>`;
}
function bindWelcome(){
  $('#wform').addEventListener('submit', e=>{
    e.preventDefault();
    const name = $('#wname').value.trim();
    if (name.length < 2) { $('#werr').textContent = 'Digite seu nome para continuar.'; $('#wname').focus(); return; }
    if (state && state.history) { state.user = {...(state.user||{}), name, unit:UNIT, plan:'Mensal', since:state.user?.since||new Date().toISOString()}; }
    else state = seed(name);
    state.settings.lgpd = $('#wlgpd').checked;
    save(); route='inicio'; history.replaceState(null,'','#/inicio'); render(true);
    toast(`Olá, ${firstName(name)}! Bora gerar energia.`);
  });
}

function cellsHTML(frac, n=10, cls=''){
  frac = Math.max(0, Math.min(1, frac)); let out='';
  for (let i=0;i<n;i++){ const f = frac*n - i;
    out += f>=1 ? '<i class="on"></i>' : f>0 ? `<i class="part" style="--p:${Math.round(f*100)}%"></i>` : '<i></i>'; }
  return `<div class="cells ${cls}" aria-hidden="true">${out}</div>`;
}

function viewHome(){
  const s = state, tWh = todayWh(s), lvl = levelOf(s.totalWh), into = s.totalWh % WH_PER_LEVEL;
  const days = [...Array(7)].map((_,i)=>addDays(new Date(), i-6));
  const perDay = days.map(d=>s.history.filter(h=>dayKey(h.date)===dayKey(d)).reduce((a,h)=>a+h.wh,0));
  const maxDay = Math.max(60, ...perDay);
  const initials = ['D','S','T','Q','Q','S','S'];
  const checked = s.checkins[dayKey()];
  const recent = s.history.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  const str = streak(s);
  const phones = tWh / WH_PER_PHONE;
  return `<div class="stack">
    <div>
      <p class="muted">${greeting()}, ${esc(firstName(s.user.name))}</p>
      <h1 class="h1">Nível ${lvl}: ${levelName(lvl)}</h1>
    </div>

    <div class="hero" role="group" aria-label="Energia gerada hoje">
      ${logo('mark', true)}
      <div class="sub">Energia que você gerou hoje</div>
      <div style="margin:6px 0 14px"><span class="big num">${fmt(tWh,1)}</span><span class="unit">Wh</span></div>
      ${cellsHTML(tWh/DAILY_GOAL, 10, 'dark')}
      <div class="between sub" style="margin-top:10px">
        <span>Meta do dia: ${DAILY_GOAL} Wh</span>
        <span>${phones>=1 ? `${fmt(Math.floor(phones))} ${Math.floor(phones)===1?'celular carregado':'celulares carregados'}` : 'Comece um treino para encher'}</span>
      </div>
    </div>

    <div class="stats3">
      <button class="stat" data-act="go" data-to="loja"><span>${ic('zap')}</span><span class="v">${fmt(s.points)}</span><span class="k">pontos para trocar</span></button>
      <div class="stat"><span>${ic('flame')}</span><span class="v">${str} ${str===1?'dia':'dias'}</span><span class="k">de sequência</span></div>
      <button class="stat" data-act="go" data-to="perfil"><span>${ic('gauge')}</span><span class="v">${fmt(WH_PER_LEVEL-into)} Wh</span><span class="k">para o nível ${lvl+1}</span></button>
    </div>

    <button class="btn btn-lima block" data-act="go" data-to="treinar">${ic('zap')}Começar treino gerador</button>

    <div class="panel hrow">
      <div class="tile agua">${ic('footprints')}</div>
      <div class="grow">
        <div class="strong">${checked ? `${fmt(checked)} passos no piso hoje` : 'Piso piezoelétrico'}</div>
        <div class="small muted">${checked ? `Viraram +${fmt(Math.floor(checked/STEPS_PER_PT))} pontos na sua conta.` : 'Seus passos na recepção e nos corredores também geram energia.'}</div>
      </div>
      ${checked ? `<span class="tag lima">${ic('check')}Feito</span>` : `<button class="btn btn-mata sm" data-act="checkin">Check-in</button>`}
    </div>

    <div class="panel">
      <div class="between"><h2 class="h2">Sua semana</h2><span class="small muted">${fmt(weekWh(s),1)} Wh em 7 dias</span></div>
      <div class="week" role="img" aria-label="Energia gerada por dia nos últimos 7 dias">
        ${days.map((d,i)=>`<div class="b ${i===6?'hoje':''}"><div class="bar" style="height:${Math.max(4, perDay[i]/maxDay*88)}px" title="${fmt(perDay[i],1)} Wh"></div><span>${initials[d.getDay()]}</span></div>`).join('')}
      </div>
    </div>

    <div class="panel stack" style="gap:12px">
      <div class="between"><div><h2 class="h2">Energia da unidade</h2><div class="small muted">${UNIT}, hoje</div></div><div class="tile sol">${ic('sun')}</div></div>
      <div class="hrow" style="align-items:flex-end"><span class="num lima" style="font-size:44px;line-height:1;font-weight:600">71%</span><span class="small muted" style="padding-bottom:4px">do consumo de hoje veio da própria academia</span></div>
      <div class="mix" aria-hidden="true"><span style="flex:62;background:var(--sol)"></span><span style="flex:27;background:var(--lima)"></span><span style="flex:11;background:var(--agua)"></span></div>
      <div class="legend"><span><b style="background:var(--sol)"></b>Solar 62%</span><span><b style="background:var(--lima)"></b>Alunos 27%</span><span><b style="background:var(--agua)"></b>Piso 11%</span></div>
    </div>

    <div class="panel">
      <div class="between"><h2 class="h2">Últimos treinos</h2><a class="link" href="#/historico">Ver todos</a></div>
      ${historyList(recent)}
    </div>
    <p class="tiny faint">Valores de energia da unidade, CO₂ e equivalências são estimativas de demonstração.</p>
  </div>`;
}
function historyList(items){
  if (!items.length) return `<p class="muted small" style="padding-top:10px">Nenhum treino ainda. Comece um e a energia aparece aqui.</p>`;
  return `<ul class="list">${items.map(h=>{ const m=machine(h.machine); return `<li>
    <a href="#/resumo/${h.id}" class="tile" aria-label="Ver resumo">${ic(m.icon)}</a>
    <div class="grow"><div class="t">${m.name}</div><div class="s">${shortDate(h.date)}, ${Math.round(h.sec/60)} min, ${h.wAvg} W médios</div></div>
    <div class="r"><div class="lima strong">+${fmt(h.pts)} pts</div><div class="s">${fmt(h.wh,1)} Wh</div></div></li>`; }).join('')}</ul>`;
}

function viewTrain(){
  const pick = ui.pick || state.lastMachine || 'bike'; ui.pick = pick; const m = machine(pick);
  return `<div class="stack">
    <div><h1 class="h1">Treinar</h1><p class="lead">Escolha o aparelho e treine normalmente. O sensor do gerador mede a energia do seu movimento e transforma em pontos.</p></div>
    <div class="machines" role="radiogroup" aria-label="Aparelho">
      ${MACHINES.map(x=>`<button class="machine" role="radio" aria-checked="${x.id===pick}" data-act="pick" data-id="${x.id}">
        <span class="tile">${ic(x.icon)}</span>
        <span class="grow"><span class="strong" style="display:block">${x.name}</span><span class="small muted">Sensor ${x.tag}, gera cerca de ${x.watts} W</span></span>
        <span class="chk">${x.id===pick?ic('check'):''}</span></button>`).join('')}
    </div>
    <div class="stack" style="gap:8px">
      <span class="label">Meta de energia deste treino</span>
      <div class="seg" role="group" aria-label="Meta de energia">${[30,60,90].map(g=>`<button data-act="goal" data-v="${g}" aria-pressed="${state.goal===g}">${g} Wh</button>`).join('')}</div>
      <span class="small muted">${state.goal} Wh equivalem a ${fmt(state.goal/WH_PER_PHONE,0)} cargas de celular e valem ${fmt(state.goal*PTS_PER_WH)} pontos.</span>
    </div>
    <div class="panel flat hrow">
      <div class="tile agua">${ic('info')}</div>
      <div class="small muted grow">Sem o celular? O sensor registra o treino pela sua matrícula e os pontos aparecem aqui depois.</div>
    </div>
    <div class="dock"><button class="btn btn-lima block" data-act="pair">${ic('radio')}Parear com ${m.tag} e começar</button></div>
  </div>`;
}


/* ---------------- sessão ao vivo: telas ---------------- */
function startPairing(){
  if (!state.settings.lgpd) { return sheet(`<div class="center">${'<div class="tile sol" style="width:60px;height:60px;border-radius:20px">'+ic('shield')+'</div>'}
      <h2 class="h2">Ative o registro de dados</h2>
      <p class="muted small">Para medir a energia e somar pontos, o app precisa registrar os dados do seu treino. Você autorizou não registrar.</p></div>
      <button class="btn btn-lima block" data-act="lgpd-on">Autorizar e continuar</button>
      <button class="btn btn-linha block" data-close>Agora não</button>`); }
  const m = machine(ui.pick || 'bike');
  sheet(`<div class="center">
      <div class="radar" id="radar"><div class="core">${ic('radio')}</div></div>
      <h2 class="h2" id="pair-t">Procurando o sensor ${m.tag}</h2>
      <p class="muted small" id="pair-s">Fique perto do aparelho ${m.name.toLowerCase()} e comece a se mover.</p>
    </div>
    <button class="btn btn-linha block" data-close>Cancelar</button>`, {id:'pairing'});
  setTimeout(()=>{
    const r = $('#radar'); if (!r) return;
    r.classList.add('done'); r.querySelector('.core').innerHTML = ic('check');
    $('#pair-t').textContent = `Conectado ao ${m.tag}`; $('#pair-s').textContent = 'Começando a medir a energia...';
    setTimeout(()=>{ if (!$('#radar')) return; closeSheet(); beginSession(m.id); }, 800);
  }, 1700);
}
function viewSession(){
  if (!S) return '';
  return `<div class="live">
    <div class="between" style="padding-top:calc(14px + var(--safe-t))">
      <div><div class="strong">${S.m.name}</div><span class="sensor ${S.paused?'off':''}" id="s-sensor"><i></i>${S.paused?'Pausado':`Sensor ${S.m.tag} conectado`}</span></div>
      <button class="iconbtn" data-act="end-ask" aria-label="Encerrar treino">${ic('close')}</button>
    </div>
    <div class="clock" id="s-time" aria-live="off">${mmss(S.sec)}</div>
    <div class="core">
      <div class="vcells" id="s-cells" role="img" aria-label="Progresso da meta de energia">${'<i></i>'.repeat(12)}</div>
      <div style="display:flex;flex-direction:column;flex:1;min-width:0">
        <div class="watts" id="s-watts">0</div>
        <div class="wl">watts agora</div>
        <div class="mini">
          <div><div class="v" id="s-wh">0,0</div><div class="k">Wh gerados</div></div>
          <div><div class="v lima" id="s-pts">+0</div><div class="k">pontos</div></div>
          <div><div class="v" id="s-goal">0%</div><div class="k">da meta de ${S.goal} Wh</div></div>
          <div><div class="v" id="s-kcal">0</div><div class="k">kcal (estim.)</div></div>
        </div>
      </div>
    </div>
    <canvas id="s-spark" aria-hidden="true"></canvas>
    <div class="panel hrow" style="padding:14px 16px"><div class="tile">${ic('phone')}</div><div class="grow small" id="s-eq">Pedale para começar a gerar.</div></div>
    <div class="stack" style="gap:8px">
      <span class="label">Intensidade</span>
      <div class="seg" role="group" aria-label="Intensidade">${Object.entries(EFFORT).map(([k,v])=>`<button data-act="effort" data-v="${k}" aria-pressed="${S.effort===k}">${v.label}</button>`).join('')}</div>
    </div>
    <div class="hrow">
      <button class="btn btn-mata" style="flex:1" data-act="pause" id="s-pause">${S.paused?ic('play')+'Continuar':ic('pause')+'Pausar'}</button>
      <button class="btn btn-lima" style="flex:1.4" data-act="finish">${ic('stop')}Finalizar</button>
    </div>
    <div class="between tiny faint"><span>Velocidade da demonstração</span>
      <span class="hrow" style="gap:6px">${[1,10,30].map(v=>`<button class="chip" style="padding:5px 11px" data-act="speed" data-v="${v}" aria-pressed="${state.speed===v}">${v}x</button>`).join('')}</span></div>
  </div>`;
}
function updateSession(){
  if (!S || route!=='sessao') return;
  const set = (id, v) => { const el=document.getElementById(id); if (el) el.textContent=v; };
  set('s-time', mmss(S.sec)); set('s-watts', Math.round(S.watts)); set('s-wh', fmt(S.wh,1));
  set('s-pts', '+'+fmt(Math.floor(S.wh*PTS_PER_WH))); set('s-kcal', fmt(kcalOf(S.wh)));
  const frac = Math.min(1, S.wh/S.goal); set('s-goal', Math.floor(frac*100)+'%');
  const cells = document.querySelectorAll('#s-cells i');
  cells.forEach((c,i)=>{ const idx = 11-i; c.className = idx < Math.min(12,Math.ceil(frac*12)) ? 'on'+(idx===Math.ceil(frac*12)-1 && frac<1?' top':'') : ''; });
  const phones = S.wh/WH_PER_PHONE, led = S.wh/LED_W;
  set('s-eq', S.wh<0.5 ? 'Pedale para começar a gerar.' : phones>=1 ? `Já dá para carregar ${fmt(phones,1)} ${phones<2?'celular':'celulares'} ou manter uma lâmpada LED acesa por ${fmt(led,1)} h.` : `Isso mantém uma lâmpada LED de 9 W acesa por ${fmt(led*60,0)} minutos.`);
  if (frac>=1 && !S.goalHit) { S.goalHit = true; toast('Meta do treino batida! Continue se quiser.'); }
  drawSpark();
}
function drawSpark(){
  const c = document.getElementById('s-spark'); if (!c || !S) return;
  const dpr = window.devicePixelRatio||1, w = c.clientWidth, h = c.clientHeight;
  if (c.width !== w*dpr) { c.width = w*dpr; c.height = h*dpr; }
  const x = c.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h);
  const data = S.samples.slice(-48), max = S.m.watts*1.6, n = 48, bw = w/n;
  data.forEach((v,i)=>{ const bh = Math.max(2, v/max*(h-4)); const xi = (n-data.length+i)*bw;
    x.fillStyle = i===data.length-1 ? '#BBFB46' : `rgba(187,251,70,${.18+.5*(i/data.length)})`;
    x.fillRect(xi+1, h-bh, Math.max(1,bw-2), bh); });
}
function askEndSession(){
  if (!S) return;
  sheet(`<div class="center"><h2 class="h2">Encerrar o treino?</h2>
    <p class="muted small">Você gerou ${fmt(S.wh,1)} Wh até agora. Finalize para somar ${fmt(Math.floor(S.wh*PTS_PER_WH))} pontos, ou descarte o treino.</p></div>
    <button class="btn btn-lima block" data-act="finish">Finalizar e somar pontos</button>
    <button class="btn btn-linha block" data-act="discard">Descartar treino</button>
    <button class="btn block" data-close>Continuar treinando</button>`);
}
function viewSummary(){
  const h = state.history.find(x=>x.id===param);
  if (!h) return `<p class="muted">Treino não encontrado.</p>`;
  const m = machine(h.machine), lvl = levelOf(state.totalWh), into = state.totalWh % WH_PER_LEVEL;
  const unlocked = (h.unlocked||[]).map(id=>ACH.find(a=>a.id===id)).filter(Boolean);
  return `<div class="stack">
    <div class="center" style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding-top:6px">
      <div class="tile burst" style="width:76px;height:76px;border-radius:26px;background:var(--lima);color:var(--sobre-lima)">${ic('check')}</div>
      <h1 class="h1">Treino concluído</h1>
      <p class="muted">${m.name}, ${shortDate(h.date).toLowerCase()}</p>
    </div>
    <div class="hero" style="text-align:center">
      ${logo('mark', true)}
      <div class="sub">Pontos ganhos</div>
      <div><span class="big num">+${fmt(h.pts)}</span><span class="unit">pts</span></div>
      <div class="sub">Saldo atual: ${fmt(state.points)} pontos</div>
    </div>
    <div class="grid2">
      <div class="stat"><span>${ic('battery')}</span><span class="v">${fmt(h.wh,1)} Wh</span><span class="k">energia gerada</span></div>
      <div class="stat"><span>${ic('clock')}</span><span class="v">${mmss(h.sec)}</span><span class="k">tempo de treino</span></div>
      <div class="stat"><span>${ic('gauge')}</span><span class="v">${h.wAvg} W</span><span class="k">potência média${h.peak?`, pico de ${h.peak} W`:''}</span></div>
      <div class="stat"><span>${ic('flame')}</span><span class="v">${fmt(h.kcal)} kcal</span><span class="k">gasto estimado</span></div>
    </div>
    <div class="panel hrow"><div class="tile">${ic('phone')}</div><div class="grow small">Essa energia carrega <b>${fmt(h.wh/WH_PER_PHONE,1)} celulares</b> e evita cerca de ${fmt(h.wh/1000*CO2_KG_PER_KWH*1000,1)} g de CO₂.</div></div>
    ${h.levelUp ? `<div class="panel hrow" style="border:1.5px solid var(--lima)"><div class="tile" style="background:var(--lima);color:var(--sobre-lima)">${ic('trophy')}</div><div class="grow"><div class="strong">Você subiu para o nível ${h.levelUp}</div><div class="small muted">Agora você é ${levelName(h.levelUp)}.</div></div></div>`:''}
    ${unlocked.map(a=>`<div class="panel hrow"><div class="tile" style="background:var(--lima);color:var(--sobre-lima)">${ic(a.icon)}</div><div class="grow"><div class="strong">Conquista: ${a.name}</div><div class="small muted">${a.desc}</div></div></div>`).join('')}
    <div class="panel stack" style="gap:10px">
      <div class="between"><span class="strong">Nível ${lvl}: ${levelName(lvl)}</span><span class="small muted">faltam ${fmt(WH_PER_LEVEL-into)} Wh</span></div>
      ${cellsHTML(into/WH_PER_LEVEL, 20, 'thin')}
    </div>
    <button class="btn btn-lima block" data-act="go" data-to="loja">${ic('gift')}Ver recompensas</button>
    <button class="btn btn-linha block" data-act="go" data-to="inicio">Voltar ao início</button>
  </div>`;
}

function viewHistory(){
  const all = state.history.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const tot = all.reduce((a,h)=>a+h.wh,0);
  return `<div class="stack">
    <div class="stats3">
      <div class="stat"><span class="v">${all.length}</span><span class="k">treinos registrados</span></div>
      <div class="stat"><span class="v">${fmt(tot/1000,2)}</span><span class="k">kWh nesses treinos</span></div>
      <div class="stat"><span class="v">${fmt(all.reduce((a,h)=>a+h.pts,0))}</span><span class="k">pontos ganhos</span></div>
    </div>
    <div class="panel">${historyList(all)}</div>
  </div>`;
}

function viewStore(){
  const cats = ['Todos', ...new Set(PRODUCTS.map(p=>p.cat))];
  const list = PRODUCTS.filter(p=>ui.cat==='Todos'||p.cat===ui.cat);
  const reds = state.redemptions;
  return `<div class="stack">
    <div><h1 class="h1">Loja de recompensas</h1><p class="lead">Troque seus pontos por produtos ENERGYM e retire na recepção da unidade.</p></div>
    <div class="panel between">
      <div><div class="label">Seu saldo</div><div class="num lima" style="font-size:40px;line-height:1.1;font-weight:600">${fmt(state.points)} <span style="font-size:20px">pts</span></div></div>
      <button class="btn btn-mata sm" data-act="how">${ic('info')}Como ganhar</button>
    </div>
    <div class="chips" role="group" aria-label="Categorias">${cats.map(c=>`<button class="chip" data-act="cat" data-v="${c}" aria-pressed="${ui.cat===c}">${c}</button>`).join('')}</div>
    <div class="grid2">
      ${list.map(p=>{ const stock = state.stock[p.id]??p.stock; const lack = p.pts - state.points; const out = stock<=0;
        return `<article class="prod ${lack>0||out?'lock':''}">
          <div class="img ${p.tone}">${ic(p.icon)}</div>
          <div class="meta"><div class="nm">${p.name}</div><div class="pts">${fmt(p.pts)} pts</div>
            <div class="tiny muted">${out?'Esgotado na unidade':stock>50?'Disponível':`${stock} em estoque`}</div></div>
          ${out ? `<button class="btn btn-linha" disabled>Esgotado</button>`
            : lack>0 ? `<button class="btn btn-linha" data-act="product" data-id="${p.id}">Faltam ${fmt(lack)}</button>`
            : `<button class="btn btn-lima" data-act="product" data-id="${p.id}">Resgatar</button>`}
        </article>`; }).join('')}
    </div>
    <div class="panel">
      <h2 class="h2">Meus resgates</h2>
      ${reds.length ? `<ul class="list" style="margin-top:6px">${reds.map(r=>{ const p=product(r.pid); return `<li>
        <div class="tile">${ic(p?p.icon:'gift')}</div>
        <div class="grow"><div class="t">${r.name}</div><div class="s">${r.status==='retirado'?'Retirado':'Retire até '+new Date(r.until).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div></div>
        <button class="btn btn-mata sm" data-act="code" data-id="${r.id}">${ic('qr')}Código</button></li>`; }).join('')}</ul>`
      : `<p class="small muted" style="margin-top:6px">Quando você resgatar algo, o código para retirada fica guardado aqui.</p>`}
    </div>
  </div>`;
}
function openProduct(pid){
  const p = product(pid), lack = p.pts - state.points;
  sheet(`<div class="grab"></div>
    <div class="prod" style="padding:0;background:none"><div class="img ${p.tone}" style="height:150px">${ic(p.icon)}</div></div>
    <div><h2 class="h2">${p.name}</h2><p class="muted small">${p.desc}</p></div>
    <div class="between"><span class="num lima" style="font-size:32px;font-weight:600">${fmt(p.pts)} pts</span><span class="small muted">Saldo: ${fmt(state.points)}</span></div>
    ${lack>0 ? `<div class="panel flat small">Faltam <b>${fmt(lack)} pontos</b>. Isso é cerca de ${fmt(Math.ceil(lack/PTS_PER_WH))} Wh, ou ${Math.ceil(lack/120)} ${Math.ceil(lack/120)===1?'treino':'treinos'} de 30 minutos na bicicleta.</div>
      <button class="btn btn-lima block" data-act="go-train">${ic('zap')}Treinar agora</button>`
    : `<button class="btn btn-lima block" data-act="redeem" data-id="${p.id}">Resgatar por ${fmt(p.pts)} pontos</button>
       <p class="tiny faint" style="text-align:center">Você retira o produto na recepção da ${UNIT} em até 7 dias.</p>`}
    <button class="btn btn-linha block" data-close>Fechar</button>`);
}
function redeem(pid){
  const r = doRedeem(pid); if (!r) return;
  closeSheet(); render(); showCode(r.id, true);
}
function qrSVG(text){ try { const q = qrcode(0,'M'); q.addData(text); q.make(); return q.createSvgTag({cellSize:4, margin:0, scalable:true}); } catch(e){ return ''; } }
function showCode(rid, fresh){
  const r = state.redemptions.find(x=>x.id===rid); if (!r) return;
  sheet(`<div class="grab"></div>
    <div class="center">
      ${fresh?`<div class="tile burst" style="width:56px;height:56px;border-radius:20px;background:var(--lima);color:var(--sobre-lima)">${ic('check')}</div><h2 class="h2">Resgate confirmado</h2>`:`<h2 class="h2">Código de retirada</h2>`}
      <p class="muted small">${r.name}, ${fmt(r.pts)} pontos</p>
    </div>
    <div class="qrbox" aria-label="QR code de retirada">${qrSVG(`ENERGYM|${r.code}|${state.user.name}|${r.pid}`)}</div>
    <div class="center"><div class="code">${r.code}</div>
      <p class="small muted">Mostre este código na recepção da ${UNIT} até ${new Date(r.until).toLocaleDateString('pt-BR')}.</p></div>
    <button class="btn btn-lima block" data-close>Pronto</button>`);
}

function viewRanking(){
  const mode = ui.rank, me = mode==='semana' ? weekWh(state,7) : weekWh(state,30);
  const show = state.settings.ranking;
  const rows = [...RIVALS.map(r=>({name:r.name, wh: mode==='semana'?r.w:r.m})), {name: show?firstName(state.user.name)+' (você)':'Você (oculto)', wh: Math.round(me), me:true}]
    .sort((a,b)=>b.wh-a.wh).map((r,i)=>({...r,pos:i+1}));
  const top = rows.slice(0,3), order = [top[1],top[0],top[2]];
  const heights = {1:120,2:92,3:72};
  const total = 81600 + Math.round(weekWh(state,30)), goal = 120000;
  return `<div class="stack">
    <div><h1 class="h1">Ranking</h1><p class="lead">Quem mais gerou energia na ${UNIT}.</p></div>
    <div class="seg" role="group" aria-label="Período">${[['semana','Últimos 7 dias'],['mes','Últimos 30 dias']].map(([k,l])=>`<button data-act="rank" data-v="${k}" aria-pressed="${mode===k}">${l}</button>`).join('')}</div>
    <div class="podium">
      ${order.map(r=>r?`<div class="p ${r.pos===1?'p1':''} ${r.me?'me':''}">
        <div class="avatar ${r.pos===1?'lima':''} ${r.me?'ring':''}">${esc(r.name[0])}</div>
        <div style="min-width:0;max-width:100%"><div class="nm">${esc(r.name)}</div><div class="tiny muted">${fmt(r.wh)} Wh</div></div>
        <div class="ped" style="height:${heights[r.pos]}px">${r.pos}</div></div>`:'<div></div>').join('')}
    </div>
    <div class="panel" style="padding-top:8px;padding-bottom:8px">
      <ul class="list rank">${rows.slice(3).map(r=>`<li class="${r.me?'me':''}">
        <span class="pos">${r.pos}</span><span class="avatar ${r.me?'lima':''}" style="width:36px;height:36px;font-size:16px">${esc(r.name[0])}</span>
        <span class="grow t ${r.me?'lima':''}">${esc(r.name)}</span><span class="strong ${r.me?'lima':''}">${fmt(r.wh)} Wh</span></li>`).join('')}</ul>
    </div>
    <div class="panel stack" style="gap:12px">
      <div class="hrow"><div class="tile">${ic('users')}</div><div class="grow"><div class="strong">Meta coletiva do mês</div><div class="small muted">${fmt(total/1000,1)} de ${goal/1000} kWh gerados pelos alunos</div></div></div>
      ${cellsHTML(total/goal, 20, 'thin')}
      <div class="small lima strong">Se a unidade bater a meta, todos ganham +100 pontos.</div>
    </div>
    ${show?'':`<p class="small muted">Seu nome está oculto para os outros alunos. Você pode mudar isso no perfil.</p>`}
  </div>`;
}

function viewProfile(){
  const s = state, lvl = levelOf(s.totalWh), into = s.totalWh % WH_PER_LEVEL;
  const toggles = [['lgpd','shield','Registrar dados de treino','Necessário para medir energia e somar pontos (LGPD).'],
                   ['notif','bell','Avisos de metas e prêmios','Quando subir de nível ou liberar uma recompensa.'],
                   ['ranking','trophy','Mostrar meu nome no ranking','Se desligar, você aparece como oculto.']];
  return `<div class="stack">
    <div class="hrow" style="gap:16px">
      <div class="avatar lima" style="width:68px;height:68px;font-size:30px">${esc(firstName(s.user.name)[0].toUpperCase())}</div>
      <div class="grow"><h1 class="h2" style="font-size:26px">${esc(s.user.name)}</h1><div class="small muted">Plano ${s.user.plan}, ${UNIT}</div>
        <span class="tag lima" style="margin-top:6px">${ic('zap')}Nível ${lvl}: ${levelName(lvl)}</span></div>
      <button class="iconbtn" data-act="edit-name" aria-label="Editar nome">${ic('edit')}</button>
    </div>
    <div class="stats3">
      <div class="stat"><span>${ic('activity')}</span><span class="v">${s.history.length}</span><span class="k">treinos</span></div>
      <div class="stat"><span>${ic('battery')}</span><span class="v">${fmt(s.totalWh/1000,2)}</span><span class="k">kWh gerados</span></div>
      <div class="stat"><span>${ic('leaf')}</span><span class="v">${fmt(s.totalWh/1000*CO2_KG_PER_KWH*1000,0)} g</span><span class="k">CO₂ evitado (estim.)</span></div>
    </div>
    <div class="panel stack" style="gap:10px">
      <div class="between"><span class="strong">Rumo ao nível ${lvl+1}: ${levelName(lvl+1)}</span><span class="small muted">${fmt(into)}/${WH_PER_LEVEL} Wh</span></div>
      ${cellsHTML(into/WH_PER_LEVEL, 20, 'thin')}
    </div>
    <div class="panel">
      <div class="between" style="margin-bottom:14px"><h2 class="h2">Conquistas</h2><span class="small muted">${Object.keys(s.achievements).length} de ${ACH.length}</span></div>
      <div class="ach">${ACH.map(a=>{ const on=!!s.achievements[a.id]; return `<button class="badge ${on?'on':''}" data-act="ach" data-id="${a.id}"><span class="md">${ic(on?a.icon:'lock')}</span>${a.name}</button>`; }).join('')}</div>
    </div>
    <div class="panel">
      <h2 class="h2" style="margin-bottom:4px">Privacidade e avisos</h2>
      ${toggles.map(([k,i,t,d])=>`<div class="setting"><div class="tile" style="width:38px;height:38px;border-radius:12px">${ic(i)}</div>
        <div class="grow"><div class="strong small" style="font-size:14px">${t}</div><div class="tiny muted">${d}</div></div>
        <button class="switch" role="switch" aria-checked="${!!s.settings[k]}" aria-label="${t}" data-act="toggle" data-k="${k}"></button></div>`).join('')}
    </div>
    <div class="panel menu" style="padding-top:4px;padding-bottom:4px">
      <button data-act="go" data-to="historico">${ic('history')}<span class="grow">Histórico de treinos</span>${ic('chevron','faint')}</button>
      <button data-act="how">${ic('info')}<span class="grow">Como funcionam os pontos</span>${ic('chevron','faint')}</button>
      <button data-act="support">${ic('message')}<span class="grow">Falar com a unidade</span>${ic('chevron','faint')}</button>
      <button data-act="reset">${ic('restore')}<span class="grow">Restaurar dados de demonstração</span>${ic('chevron','faint')}</button>
      <button data-act="logout">${ic('logout')}<span class="grow">Sair</span></button>
    </div>
  </div>`;
}

