'use strict';
/* =====================================================================
   ENERGYM | Utilidades gerais (formatação, datas, buscas nos catálogos)
   Parte: Marcos (banco de dados e servidor)
===================================================================== */
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n, d=0) => Number(n).toLocaleString('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const dayKey = (d=new Date()) => { const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
const addDays = (d, n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const machine = id => MACHINES.find(m=>m.id===id) || MACHINES[0];
const product = id => PRODUCTS.find(p=>p.id===id);
const firstName = n => String(n||'').trim().split(/\s+/)[0] || 'Aluno';
const uid = () => Math.random().toString(36).slice(2,9);
const shortDate = iso => { const d=new Date(iso); const t=dayKey(), y=dayKey(addDays(new Date(),-1)), k=dayKey(d);
  const hh=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  if (k===t) return `Hoje, ${hh}`; if (k===y) return `Ontem, ${hh}`;
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+`, ${hh}`; };
const mmss = sec => { sec=Math.floor(sec); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60;
  return (h?h+':'+String(m).padStart(2,'0'):String(m).padStart(2,'0'))+':'+String(s).padStart(2,'0'); };
const greeting = () => { const h=new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };
