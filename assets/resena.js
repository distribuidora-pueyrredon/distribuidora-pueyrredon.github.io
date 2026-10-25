/* Regalo + reseña en Google. Se abre desde el QR de cada tarjeta: resena.html?p=K7QM3XPA
   El pase lo valida la planilla de Google de Pueyrredón (script en Extensiones → Apps Script):
   el primer celular que escanea recibe un código de un solo uso y desde otro celular no se ve nada.
   El beneficio, la vigencia y el link de Google se cambian en la pestaña Campaña de la planilla. */
const CONF={
  negocio:'Distribuidora Pueyrredón',
  api:'',                        // URL de la aplicación web de la planilla (Implementar → Aplicación web)
  google:'https://g.page/r/Ca6bT8VCs-9wEBM/review',   // por si la planilla no responde
  beneficio:'5% OFF',detalle:'en tu próximo pedido',
  destacados:['Atención','Precios','Variedad','Rapidez de entrega','Embalaje','Asesoramiento'],
};
const $=id=>document.getElementById(id);
const LBL=['','Muy mala','Mala','Regular','Buena','¡Excelente!'];
const KEY='resena_pase',DEV='resena_cel';
const QS=new URLSearchParams(location.search),src=QS.get('p')?'tarjeta':(QS.get('o')||'directo');
const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const fmt=d=>d.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
const rnd=n=>[...crypto.getRandomValues(new Uint8Array(n))].map(x=>'abcdefghijkmnpqrstuvwxyz23456789'[x%32]).join('');
const cel=store.get(DEV)||(()=>{const v=rnd(16);store.set(DEV,v);return v})();
let stars=0,codigo='';const picked=new Set();

/* Opinión privada por WhatsApp (para lo que haya que mejorar) */
$('teaser').textContent='Tu opinión nos ayuda';
$('sub').textContent='Contanos en privado cómo te atendimos. Nos llega directo por WhatsApp.';
$('send').lastChild.textContent='Enviar mi opinión';
$('send').nextElementSibling.textContent='Tu opinión nos llega por WhatsApp.';
const sb=[...$('stars').children];
const paint=n=>sb.forEach((b,i)=>b.classList.toggle('on',i<n));
sb.forEach(b=>{
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z"/></svg>';
  b.onmouseenter=()=>paint(+b.dataset.v);b.onmouseleave=()=>paint(stars);
  b.onclick=()=>{stars=+b.dataset.v;paint(stars);sb.forEach(x=>x.setAttribute('aria-checked',x===b));
    $('starsLbl').textContent=LBL[stars];$('starsLbl').classList.add('set');
    const first=$('more').hidden;$('more').hidden=false;
    $('txt').placeholder=stars>=4?'¿Qué te gustó?':'¿Qué podemos mejorar?';
    document.querySelector('.rs-q').textContent=stars>=4?'¿Qué destacás?':'¿En qué tenemos que mejorar?';
    if(first){track('resena_estrellas',{estrellas:stars,origen:src});setTimeout(()=>$('more').scrollIntoView({behavior:'smooth',block:'start'}),60)}
    upd()};
});
CONF.destacados.forEach(t=>{const c=document.createElement('button');c.type='button';c.className='chip';c.textContent=t;c.setAttribute('aria-pressed','false');
  c.onclick=()=>{picked.has(t)?picked.delete(t):picked.add(t);c.setAttribute('aria-pressed',picked.has(t));upd()};$('chips').append(c)});
function upd(){
  const who=$('who').value.trim(),txt=$('txt').value.trim();
  $('send').href=waLink([`${'★'.repeat(stars)}${'☆'.repeat(5-stars)} Opinión para ${CONF.negocio}`,
    who&&`De: ${who}`,picked.size&&`${stars>=4?'Destaco':'A mejorar'}: ${[...picked].join(', ')}`,txt&&`"${txt}"`].filter(Boolean).join('\n'));
}
$('who').oninput=$('txt').oninput=upd;
['who','txt'].forEach(id=>{$(id).value=''});
$('send').onclick=e=>{
  if(!stars){e.preventDefault();return}
  upd();track('resena_enviada',{estrellas:stars,origen:src,con_texto:!!$('txt').value.trim()});
  setTimeout(()=>{$('paso1').hidden=true;$('paso2').hidden=false;window.scrollTo({top:0});toast('¡Gracias! Recibimos tu opinión')},250);
};
$('again').onclick=()=>{$('paso2').hidden=true;$('paso1').hidden=false;stars=0;paint(0);picked.clear();
  document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed','false'));$('more').hidden=true;$('starsLbl').textContent='Tocá las estrellas';$('starsLbl').classList.remove('set');
  ['who','txt'].forEach(id=>{$(id).value=''});window.scrollTo({top:0})};

/* Paso 2: beneficio validado por la planilla */
document.body.classList.add('modo-google');
$('acts').before($('gbox'));$('again').textContent='¿Algo para mejorar? Contanos en privado';
$('paso1').hidden=true;$('paso2').hidden=false;$('gbox').hidden=false;$('gbtn').href=CONF.google;

function beneficio(r){
  const b=String(r.beneficio||CONF.beneficio).trim(),m=b.match(/^(.*\S)\s+(OFF)$/i);
  $('pct').textContent=m?m[1]:b;$('pct').parentElement.classList.toggle('largo',!m);
  $('pct').nextElementSibling.hidden=!m;$('what').textContent=r.detalle??CONF.detalle;
  if(r.google)$('gbtn').href=r.google;
}
function estado(cls,ey,h1,txt){
  document.body.classList.remove('validando','con-codigo','sin-tarjeta');document.body.classList.add(cls);
  $('thanksEy').textContent=ey;$('thanks').textContent=h1;$('howUse').textContent=txt||'';$('howUse').hidden=!txt;
  $('ticket').hidden=cls!=='con-codigo'&&cls!=='validando';$('copy').hidden=cls!=='con-codigo';$('retry').hidden=true;
  $('order').href=waLink(codigo&&cls==='con-codigo'?`Hola, quiero hacer un pedido. Tengo el código ${codigo} de ${$('pct').textContent} ${$('pct').nextElementSibling.hidden?'':'OFF'}`.trim()+'.':'Hola, quiero hacer un pedido.');
  $('order').lastChild.textContent=cls==='con-codigo'?'Hacer un pedido con descuento':'Hacer un pedido';
  $('gbox').querySelector('p').innerHTML='<b>¿Nos dejás tu reseña en Google Maps?</b> Nos ayuda a que otros comercios nos encuentren.'+(cls==='con-codigo'?' Es opcional: el regalo ya es tuyo.':'');
}
function sinTarjeta(){
  estado('sin-tarjeta','Distribuidora Pueyrredón','¡Gracias por elegirnos!');
}
const MOTIVO={
  usado:['Esta tarjeta ya se usó','El beneficio ya se entregó','Cada tarjeta da un solo beneficio, en el primer celular que la escanea.'],
  canjeado:['¡Gracias por tu compra!','Ya usaste tu beneficio','Este código ya se aplicó en un pedido.'],
  vencido:['Tu código venció','Este beneficio ya no está vigente','Si tenés una tarjeta nueva, escaneala para ver tu beneficio.'],
  invalido:['No reconocemos esta tarjeta','Revisá que el QR sea de una tarjeta de Pueyrredón','Si el problema sigue, escribinos por WhatsApp.'],
  agotado:['Distribuidora Pueyrredón','Se terminaron los beneficios de esta promoción',''],
  agotado_hoy:['Distribuidora Pueyrredón','Por hoy se terminaron los beneficios','Volvé a escanear mañana.'],
  inactiva:['Distribuidora Pueyrredón','La promoción terminó','¡Gracias por elegirnos!'],
};
function mostrar(r){
  beneficio(r);
  if(r.ok){
    codigo=r.codigo;estado('con-codigo','¡Gracias por elegirnos!',r.nuevo?'Tu regalo está listo':'Tu regalo','Mostrá esta pantalla o pasanos el código al hacer tu pedido.');
    $('code').textContent=r.codigo;$('until').textContent=`Válido hasta el ${fmt(new Date(r.vence))} · un solo uso`;
    if(r.nuevo)track('resena_codigo',{origen:src});
  }else if(MOTIVO[r.motivo]){codigo='';estado('sin-tarjeta',...MOTIVO[r.motivo]);track('resena_rechazo',{motivo:r.motivo})}
  else if(r.motivo==='sin_pase')sinTarjeta();
  else falla();
}
function falla(){
  estado('sin-tarjeta','Sin conexión','No pudimos validar tu tarjeta','Revisá tu conexión y probá de nuevo.');$('retry').hidden=false;
}
let n=0;
function api(q,cb){
  if(!CONF.api){cb(null);return}
  const fn='rs_cb'+(++n),s=document.createElement('script');let done=false;
  const fin=r=>{if(done)return;done=true;delete window[fn];s.remove();cb(r)};
  window[fn]=fin;s.onerror=()=>fin(null);setTimeout(()=>fin(null),15000);
  s.src=CONF.api+(CONF.api.includes('?')?'&':'?')+new URLSearchParams({...q,d:cel,cb:fn});document.head.append(s);
}
function validar(q){
  estado('validando','Un momento','Validando tu tarjeta…');$('code').textContent='······';$('until').textContent='Consultando…';
  api(q,r=>r?mostrar(r):(q.f?sinTarjeta():falla()));
}
$('retry').onclick=()=>arranque();
$('gbtn').onclick=()=>{track('resena_google',{origen:src});if(codigo)api({a:'google',c:codigo},()=>{})};
$('copy').onclick=async()=>{const c=$('code').textContent;
  try{await navigator.clipboard.writeText(c)}catch(e){const t=document.createElement('textarea');t.value=c;document.body.append(t);t.select();document.execCommand('copy');t.remove()}
  toast('Código copiado')};
let tt;function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),1800)}

/* El pase queda guardado en este celular (no en el link) para volver a ver el código */
const qp=(QS.get('p')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
if(qp){store.set(KEY,qp);history.replaceState(null,'',location.pathname)}
track('resena_abierta',{origen:src});
function arranque(){
  const p=store.get(KEY);beneficio({});
  if(p)validar({p});else if(src==='qr')validar({f:1});else sinTarjeta();
}
arranque();
