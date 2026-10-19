/* Catálogo sin precios: rubros, buscador y "Tu consulta" que se envía por WhatsApp. */
(()=>{
const $=id=>document.getElementById(id);
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PLUS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const LIGHT=8; // los primeros rubros son de iluminación; después, material eléctrico
let CAT=[],ALL=[],view={r:null,q:''},open=new Set();

/* ---------- consulta (se guarda en este navegador) ---------- */
let bag={};
try{bag=JSON.parse(localStorage.getItem('consulta')||'{}')}catch(e){}
const saveBag=()=>{try{localStorage.setItem('consulta',JSON.stringify(bag))}catch(e){}};
const label=it=>{const g=norm(it.g),n=norm(it.n);if(g.replace(/[^a-z0-9]/g,'').includes(n.replace(/[^a-z0-9]/g,'')))return it.g;const first=g.split(/[^a-z0-9]+/).find(w=>w.length>2)||'';return n.includes(first)?it.n:`${it.g} – ${it.n}`};
function message(){
  const shop=$('shop').value.trim();
  const rows=Object.values(bag).map(it=>`• ${it.q?it.q+' × ':''}${label(it)}${it.c?` (cód. ${it.c})`:''}`);
  return `Hola! Quiero consultar precios mayoristas${shop?` para ${shop}`:''}:\n${rows.join('\n')}\nGracias.`;
}
function paintBag(){
  const n=Object.keys(bag).length;$('bag').hidden=!n;$('bagN').textContent=n;$('bagS').textContent=n===1?'1 producto · ver lista':`${n} productos · ver lista`;
  const href=n?waLink(message()):'#';$('bagSend').href=href;$('send').href=href;
  const ul=$('sheetList');ul.innerHTML='';
  Object.entries(bag).forEach(([k,it])=>{const li=document.createElement('li');
    li.innerHTML=`<div class="n">${esc(it.n)}<small>${esc(it.g)}${it.c?' · cód. '+esc(it.c):''}</small></div><input type="number" min="1" inputmode="numeric" placeholder="Cant." aria-label="Cantidad" value="${it.q||''}"><button class="rm" type="button" aria-label="Quitar">${X}</button>`;
    li.querySelector('input').oninput=e=>{it.q=e.target.value.replace(/\D/g,'');saveBag();$('send').href=$('bagSend').href=waLink(message())};
    li.querySelector('.rm').onclick=()=>{delete bag[k];saveBag();paintBag();syncButtons();if(!Object.keys(bag).length)$('sheet').close()};
    ul.append(li)});
}
function toggle(it,btn){
  const k=it.k;if(bag[k]){delete bag[k]}else{bag[k]={g:it.g,n:it.n,c:it.c||'',q:''};track('agregar_consulta',{producto:label(it).slice(0,100)});toast('Agregado a tu consulta')}
  saveBag();paintBag();setBtn(btn,!!bag[k]);
}
function setBtn(b,on){b.setAttribute('aria-pressed',on);b.innerHTML=(on?CHECK:PLUS)+`<span class="lbl">${on?'Agregado':'Agregar'}</span>`;b.setAttribute('aria-label',(on?'Quitar de':'Agregar a')+' la consulta')}
function syncButtons(){document.querySelectorAll('.add[data-k]').forEach(b=>setBtn(b,!!bag[b.dataset.k]))}
$('bagOpen').onclick=()=>{paintBag();$('sheet').showModal()};
$('clear').onclick=()=>{bag={};saveBag();paintBag();syncButtons();$('sheet').close()};
$('shop').oninput=()=>{try{localStorage.setItem('comercio',$('shop').value)}catch(e){}paintBag()};
try{$('shop').value=localStorage.getItem('comercio')||''}catch(e){}
[$('send'),$('bagSend')].forEach(a=>a.addEventListener('click',()=>track('enviar_consulta',{cantidad:Object.keys(bag).length})));
$('sheet').addEventListener('click',e=>{if(e.target===$('sheet'))$('sheet').close()});

/* ---------- listado ---------- */
function rubNav(){
  const nav=$('rubs');nav.innerHTML='';
  CAT.forEach((r,i)=>{if(i===LIGHT){const s=document.createElement('div');s.className='sep';nav.append(s)}
    const b=document.createElement('button');b.type='button';b.dataset.r=r.id;b.innerHTML=`<span>${esc(r.name)}</span><small>${r.count}</small>`;
    b.onclick=()=>{$('q').value='';go({r:r.id,q:''});if(matchMedia('(max-width:900px)').matches)window.scrollTo({top:$('list').offsetTop-130,behavior:'smooth'})};nav.append(b)});
}
function highlight(t,terms){let s=esc(t);if(!terms.length)return s;terms.forEach(w=>{if(w.length<2)return;const re=new RegExp('('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');s=s.replace(re,'\u0001$1\u0002')});return s.replace(/\u0001/g,'<mark>').replace(/\u0002/g,'</mark>')}
function groupCard(r,g,items,terms,showRub){
  const el=document.createElement('article');el.className='grp'+(g.img?' ph':'');
  const key=r.id+'|'+g.name;const lim=open.has(key)||terms.length?items.length:8;
  el.innerHTML=`<div class="grp-head">${g.img?`<img src="img/cat/${g.img}" alt="" loading="lazy" width="96" height="96">`:''}<div>${showRub?`<span class="rub-tag">${esc(r.name)}</span>`:''}<h3>${highlight(g.name,terms)}</h3><small>${items.length} ${items.length===1?'variante':'variantes'}</small></div></div><ul class="items"></ul>`;
  const ul=el.querySelector('ul');
  if(items.length===1&&norm(items[0].n).replace(/[^a-z0-9]/g,'')===norm(g.name).replace(/^(aplique|lampara de|lampara)\s*/,'').replace(/[^a-z0-9]/g,'')){
    const it=items[0],b=document.createElement('button');b.type='button';b.className='add';b.dataset.k=it.k;setBtn(b,!!bag[it.k]);b.onclick=()=>toggle(it,b);
    el.querySelector('small').textContent=it.c?'cód. '+it.c:'';el.querySelector('.grp-head').append(b);ul.remove();el.classList.add('one');return el}
  items.slice(0,lim).forEach(it=>{const li=document.createElement('li');
    li.innerHTML=`<div><span class="n">${highlight(it.n,terms)}</span>${it.c?`<span class="c">cód. ${highlight(it.c,terms)}</span>`:''}</div>`;
    const b=document.createElement('button');b.type='button';b.className='add';b.dataset.k=it.k;setBtn(b,!!bag[it.k]);b.onclick=()=>toggle(it,b);li.append(b);ul.append(li)});
  if(items.length>lim){const li=document.createElement('li');li.className='more';li.innerHTML=`<button type="button">Ver ${items.length-lim} más</button>`;li.querySelector('button').onclick=()=>{open.add(key);render()};ul.append(li)}
  return el;
}
function render(){
  const list=$('list');list.innerHTML='';
  document.querySelectorAll('#rubs button').forEach(b=>b.setAttribute('aria-pressed',!view.q&&b.dataset.r===view.r));
  const head=document.createElement('div');head.className='list-head';
  if(view.q){
    const terms=norm(view.q).split(/\s+/).filter(Boolean);
    const hits=ALL.filter(it=>terms.every(w=>it.s.includes(w)));
    head.innerHTML=`<h2>Resultados</h2><span>${hits.length?hits.length+' productos':''}</span>`;list.append(head);
    if(!hits.length){const e=document.createElement('div');e.className='empty';e.innerHTML=`<b>No encontramos “${esc(view.q)}”</b>Probá con otra palabra o consultanos directo por WhatsApp: también trabajamos productos que no están en la lista.`;list.append(e);return}
    const by=new Map();hits.slice(0,500).forEach(it=>{const k=it.ri+'|'+it.gi;if(!by.has(k))by.set(k,[]);by.get(k).push(it)});
    [...by.entries()].slice(0,80).forEach(([k,items])=>{const [ri,gi]=k.split('|').map(Number);list.append(groupCard(CAT[ri],CAT[ri].groups[gi],items,view.q.split(/\s+/),true))});
    return;
  }
  const r=CAT.find(x=>x.id===view.r)||CAT[0];
  head.innerHTML=`<h2>${esc(r.name)}</h2><span>${r.count} productos</span>`;list.append(head);
  r.groups.forEach((g,gi)=>list.append(groupCard(r,g,g.items.map((it,ii)=>it._),[],false)));
}
function go(v){view=v;const h=v.q?'#q='+encodeURIComponent(v.q):'#r='+v.r;if(location.hash!==h)history.replaceState(null,'',h);render()}
let qt;$('q').addEventListener('input',e=>{clearTimeout(qt);const q=e.target.value.trim();qt=setTimeout(()=>{if(q.length>=2){go({r:view.r,q});track('busqueda',{termino:q.slice(0,60)})}else if(!q)go({r:view.r||CAT[0].id,q:''})},220)});
function fromHash(){const p=new URLSearchParams(location.hash.slice(1));const q=p.get('q')||'';if(q)$('q').value=q;return{r:p.get('r')||CAT[0].id,q}}

let tt;function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,1600)}

fetch('catalogo.json').then(r=>r.json()).then(d=>{
  CAT=d;
  CAT.forEach((r,ri)=>{r.count=0;r.groups.forEach((g,gi)=>{g.items.forEach(it=>{const o={n:it.n,c:it.c||'',g:g.name,ri,gi,k:(g.name+'|'+it.n+'|'+(it.c||'')).slice(0,240)};o.s=norm([r.name,g.name,it.n,it.c||''].join(' '));it._=o;ALL.push(o);r.count++})})});
  rubNav();go(fromHash());paintBag();
  window.addEventListener('hashchange',()=>{const v=fromHash();if(v.q!==view.q||v.r!==view.r){view=v;render()}});
}).catch(()=>{$('list').innerHTML='<div class="empty"><b>No se pudo cargar el catálogo</b>Revisá tu conexión y volvé a intentar.</div>'});
})();
