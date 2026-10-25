/* Reseña con descuento. Se abre desde el QR (resena.html?o=qr).
   La opinión llega por WhatsApp junto con el código, así el negocio puede verificarlo al recibir el pedido.
   Todo lo que cambia de un negocio a otro está en CONF. */
const CONF={
  negocio:'Distribuidora Pueyrredón',
  wa:window.WA_NUM,
  prefijo:'PY',
  pct:5,                         // % de descuento
  que:'en tu próximo pedido',
  dias:30,                       // validez del código
  google:'',                     // link "Pedir opiniones" del Perfil de Google; vacío = no se muestra
  destacados:['Atención','Precios','Variedad','Rapidez de entrega','Embalaje','Asesoramiento'],
};
const $=id=>document.getElementById(id);
const LBL=['','Muy mala','Mala','Regular','Buena','¡Excelente!'];
const KEY='resena_'+CONF.prefijo;
const src=new URLSearchParams(location.search).get('o')||'directo';
let stars=0;const picked=new Set();

const store={get(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}},set(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}};
const fmt=d=>d.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
function newCode(){const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789',r=crypto.getRandomValues(new Uint32Array(4));return CONF.prefijo+'-'+[...r].map(n=>A[n%A.length]).join('')}

/* Textos con el descuento configurado */
$('pct').textContent=CONF.pct+'%';$('what').textContent=CONF.que;
$('sub').textContent=`Contanos en un minuto y te damos un ${CONF.pct}% de descuento ${CONF.que}.`;
$('teaser').textContent=`Tu opinión vale ${CONF.pct}% OFF`;

/* Estrellas */
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

/* Destacados */
CONF.destacados.forEach(t=>{const c=document.createElement('button');c.type='button';c.className='chip';c.textContent=t;c.setAttribute('aria-pressed','false');
  c.onclick=()=>{picked.has(t)?picked.delete(t):picked.add(t);c.setAttribute('aria-pressed',picked.has(t));upd()};$('chips').append(c)});

/* Mensaje de WhatsApp: opinión + código */
let pending=null;
function message(code,until){
  const who=$('who').value.trim(),txt=$('txt').value.trim();
  return [`${'★'.repeat(stars)}${'☆'.repeat(5-stars)} Opinión para ${CONF.negocio}`,
    who&&`De: ${who}`,picked.size&&`${stars>=4?'Destaco':'A mejorar'}: ${[...picked].join(', ')}`,txt&&`"${txt}"`,
    `Mi código: ${code} (${CONF.pct}% OFF ${CONF.que}, válido hasta el ${fmt(until)})`].filter(Boolean).join('\n');
}
function upd(){
  const prev=store.get(),valid=prev&&new Date(prev.until)>new Date();
  const code=valid?prev.code:(pending?.code||newCode()),until=valid?new Date(prev.until):(pending?.until||new Date(Date.now()+CONF.dias*864e5));
  pending={code,until};$('send').href=waLink(message(code,until));
}
$('who').oninput=$('txt').oninput=upd;
['who','txt'].forEach(id=>{$(id).value=''});

$('send').onclick=e=>{
  if(!stars){e.preventDefault();return}
  upd();
  const rec={code:pending.code,until:pending.until.toISOString(),stars,who:$('who').value.trim(),msg:$('send').href};
  store.set(rec);track('resena_enviada',{estrellas:stars,origen:src,con_texto:!!$('txt').value.trim()});
  setTimeout(()=>showTicket(rec,true),250);
};

/* Paso 2 */
function showTicket(rec,fresh){
  $('paso1').hidden=true;$('paso2').hidden=false;
  $('code').textContent=rec.code;$('until').textContent='Válido hasta el '+fmt(new Date(rec.until));
  $('thanksEy').textContent=rec.who?`¡Gracias, ${rec.who}!`:'¡Gracias!';
  $('thanks').textContent=fresh?'Tu descuento ya está listo':'Ya tenés tu descuento';
  $('order').href=waLink(`Hola, quiero hacer un pedido. Tengo el código ${rec.code} de ${CONF.pct}% OFF.`);
  if(rec.msg){$('resend').href=rec.msg;$('resend').hidden=false}
  $('gbox').hidden=!(CONF.google&&rec.stars>=4);if(CONF.google)$('gbtn').href=CONF.google;
  window.scrollTo({top:0,behavior:fresh?'smooth':'auto'});
}
$('gbtn').onclick=()=>track('resena_google',{origen:src});
$('copy').onclick=async()=>{const c=$('code').textContent;
  try{await navigator.clipboard.writeText(c)}catch(e){const t=document.createElement('textarea');t.value=c;document.body.append(t);t.select();document.execCommand('copy');t.remove()}
  toast('Código copiado')};
$('again').onclick=()=>{$('paso2').hidden=true;$('paso1').hidden=false;stars=0;paint(0);picked.clear();
  document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed','false'));$('more').hidden=true;$('starsLbl').textContent='Tocá las estrellas';$('starsLbl').classList.remove('set');
  ['who','txt'].forEach(id=>{$(id).value=''});window.scrollTo({top:0})};
let tt;function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),1800)}

track('resena_abierta',{origen:src});
const prev=store.get();
if(prev&&new Date(prev.until)>new Date())showTicket(prev,false);
