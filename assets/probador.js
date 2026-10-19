/* Probador mayorista: el comercio sube la foto de su cliente, ubica productos a medida real
   y exporta una imagen con SUS datos (sin marca de la distribuidora). Todo corre en el navegador. */
(()=>{
const $=id=>document.getElementById(id);
const IMGS=['portalampara','gota','gota-on','g125-ambar','g125-ambar-on','globo-claro','globo-claro-on','pera-clara','pera-clara-on','bulbo-claro','bulbo-claro-on',
  'aplique-cuadrado','aplique-arco','aplique-piramidal','aplique-caja','tortuga','tortuga-on','proyector-sensor','proyector-sensor-on'];
const IM={};
const BULBS={ // diámetro en cm
  g125:{img:'g125-ambar',name:'Globo G125 ámbar',w:12.5,c:[255,150,64]},
  globo:{img:'globo-claro',name:'Globo transparente',w:12.5,c:[255,190,120]},
  pera:{img:'pera-clara',name:'Pera transparente',w:6.4,c:[255,190,120]},
  bulbo:{img:'bulbo-claro',name:'Bulbo transparente',w:6,c:[255,190,120]},
};
const TONES={calida:[255,196,128],neutra:[255,234,208],fria:[218,232,255]};
const TONE_OPTS=[['calida','Cálida'],['neutra','Neutra'],['fria','Fría']];
/* Productos. q = búsqueda en el catálogo; thumb = foto real del producto. Medidas en cm. */
const PRODUCTS=[
  {sec:'Decoración',id:'guirnalda',type:'guirnalda',name:'Guirnalda con portalámparas',spec:'6 m · 10 E27  /  10 m · 20 E27',thumb:'il70',q:'guirnalda'},
  {sec:'Decoración',id:'colgante',type:'colgante',name:'Colgante con lámpara de filamento',spec:'Globo, pera o bulbo · E27',thumb:'il26',q:'filamento'},
  {sec:'Techo',id:'plafonr',type:'plafon',shape:'round',name:'Plafón LED redondo',spec:'Sobreponer o embutir · 12 a 30 cm',thumb:'il40',q:'artef. led red.'},
  {sec:'Techo',id:'plafonc',type:'plafon',shape:'square',name:'Plafón LED cuadrado',spec:'Sobreponer o embutir · 12 a 30 cm',thumb:'il39',q:'artef. led cuad.'},
  {sec:'Techo',id:'panel',type:'panel',name:'Panel LED',spec:'60 × 60 cm o 120 × 30 cm',thumb:'il42',q:'panel led'},
  {sec:'Techo',id:'spot',type:'spot',name:'Spot LED de embutir',spec:'Redondo o cuadrado',thumb:'il46',q:'spot dicro led empotrado'},
  {sec:'Pared',id:'apcuad',type:'photo',img:'aplique-cuadrado',w:7,beams:[[.62,.02,'up'],[.62,.98,'down']],name:'Aplique bidireccional cuadrado',spec:'Exterior · luz arriba y abajo',thumb:'il51',q:'bidireccional cuadrado',approx:1},
  {sec:'Pared',id:'aparco',type:'photo',img:'aplique-arco',w:16,beams:[[.2,.9,'down'],[.5,.95,'down'],[.8,.9,'down'],[.2,.05,'up'],[.5,0,'up'],[.8,.05,'up']],narrow:1,name:'Aplique bidireccional 6 W',spec:'Exterior · 6 haces de luz',thumb:'il53',q:'bidireccional 6w',approx:1},
  {sec:'Pared',id:'appir',type:'photo',img:'aplique-piramidal',w:8,beams:[[.58,.02,'up'],[.58,.98,'down']],name:'Aplique bidireccional piramidal',spec:'Exterior · luz arriba y abajo',thumb:'il55',q:'piramidal',approx:1},
  {sec:'Pared',id:'apcaja',type:'photo',img:'aplique-caja',w:11,beams:[[.6,.86,'down']],wide:1,name:'Aplique piramidal unidireccional',spec:'Exterior · luz hacia abajo',thumb:'il54',q:'piramidal',approx:1},
  {sec:'Pared',id:'tortuga',type:'photo',img:'tortuga',w:20,glow:[.5,.5],on:'tortuga-on',name:'Tortuga LED de exterior 12 W',spec:'Estanco · blanca',thumb:'il48',q:'estanco de exterior',approx:1},
  {sec:'Exterior',id:'reflector',type:'photo',img:'proyector-sensor',w:14,sizes:[['10 W',14],['30 W',19],['50 W',23]],flood:[.6,.33],on:'proyector-sensor-on',name:'Reflector LED con sensor',spec:'10, 30 y 50 W · negro',thumb:'il3',q:'con sensor',approx:1},
  {sec:'Cocina',id:'bajomesada',type:'bajo',name:'Listón LED bajo mesada',spec:'60, 90 y 120 cm · con tecla',thumb:'il64',q:'bajo mesada'},
];
const P=Object.fromEntries(PRODUCTS.map(p=>[p.id,p]));
const cv=$('cv'),cx=cv.getContext('2d');
let photo=null,pxPerCm=4,calibrated=false,items=[],sel=null,night=.86,drag=null,calMode=false,calLine=null;
const light=document.createElement('canvas'),lg=light.getContext('2d');
const loadImgs=()=>Promise.all([...IMGS.map(k=>['img/prob/'+k+'.png',k]),['img/logo-pueyrredon-blanco.png','logo']].map(([src,k])=>new Promise(r=>{const i=new Image();i.onload=()=>{IM[k]=i;r()};i.onerror=r;i.src=src})));

/* ---------- geometría ---------- */
const cm=(v,it)=>v*pxPerCm*(it?it.k:1);
const rad=d=>d*Math.PI/180;
function curvePts(it,n=120){const a=[];for(let i=0;i<=n;i++){const t=i/n;a.push([it.p1[0]+(it.p2[0]-it.p1[0])*t,it.p1[1]+(it.p2[1]-it.p1[1])*t+4*it.sag*t*(1-t)])}return a}
function curveLen(p){let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return L}
function atLen(p,d){let L=0;for(let i=1;i<p.length;i++){const s=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(L+s>=d){const f=(d-L)/s;return[p[i-1][0]+(p[i][0]-p[i-1][0])*f,p[i-1][1]+(p[i][1]-p[i-1][1])*f]}L+=s}return p[p.length-1]}
const midPt=it=>[(it.p1[0]+it.p2[0])/2,(it.p1[1]+it.p2[1])/2+it.sag];
const GUIR={6:{n:10,len:600},10:{n:20,len:1000}};
const SOCK_W=3.8;

/* Lámparas colgantes (guirnalda y colgante): posición, foto apagada y prendida */
function bulbsOf(it){
  if(it.type==='guirnalda'){const g=GUIR[it.m],p=curvePts(it),L=curveLen(p),sw=cm(SOCK_W,it),sh=sw*IM.portalampara.height/IM.portalampara.width,bw=cm(4.5,it),bh=bw*IM.gota.height/IM.gota.width,o=[];
    for(let i=1;i<=g.n;i++){const [x,y]=atLen(p,L*i/(g.n+1)),st=y-cm(.6,it),bt=st+sh-cm(2.2,it);o.push({img:IM.gota,lit:IM['gota-on'],x,y:bt+bh/2,w:bw,gx:x,gy:bt+bh*.7,sock:[x,st,sw,sh],c:[255,172,96]})}return o}
  if(it.type==='colgante'){const B=BULBS[it.bulb],img=IM[B.img],fh=cm(1.6,it),st=it.y+fh+cm(it.cable,it),sw=cm(SOCK_W,it),sh=sw*IM.portalampara.height/IM.portalampara.width,bw=cm(B.w,it),bh=bw*img.height/img.width,bt=st+sh-cm(2.2,it);
    return[{img,lit:IM[B.img+'-on'],x:it.x,y:bt+bh/2,w:bw,gx:it.x,gy:bt+bh*.6,sock:[it.x,st,sw,sh],c:B.c}]}
  return[];
}
/* Fuentes de luz de cada producto: las usan el mapa de luz y el brillo */
function emitters(it){
  const t=TONES[it.tone]||TONES.calida;
  if(it.type==='guirnalda'||it.type==='colgante'){const big=it.type==='colgante'?1:0;return bulbsOf(it).map(b=>({x:b.gx,y:b.gy,c:b.c,r:cm(big?160:95,it),i:big?.95:.85,core:cm(big?6:3.6,it)}))}
  if(it.type==='plafon'||it.type==='panel'||it.type==='spot'){const d=dimsOf(it),s=Math.max(d.w,d.h);return[{x:it.x,y:it.y+d.h*.25,c:t,r:Math.max(cm(140,it),s*5.5),i:1,core:s*.45}]}
  if(it.type==='bajo'){const n=Math.max(3,Math.round(it.len/20)),w=cm(it.len,it),a=rad(it.rot),o=[];
    for(let i=0;i<n;i++){const f=(i+.5)/n-.5;o.push({x:it.x+Math.cos(a)*w*f,y:it.y+Math.sin(a)*w*f,c:TONES.neutra,r:cm(70,it),i:.9,core:cm(2.2,it),cone:a,cw:.75})}return o}
  if(it.type==='photo'){const p=P[it.id],b=photoBox(it),o=[];
    (p.beams||[]).forEach(([fx,fy,dir])=>o.push({x:b.x+b.w*fx,y:b.y+b.h*fy,c:t,r:cm(p.narrow?70:95,it),i:1,core:cm(1.4,it),cone:dir==='up'?Math.PI:0,cw:p.wide?.7:(p.narrow?.26:.34)}));
    if(p.glow)o.push({x:b.x+b.w*p.glow[0],y:b.y+b.h*p.glow[1],c:t,r:cm(170,it),i:.95,core:b.w*.35});
    if(p.flood){o.push({x:b.x+b.w*p.flood[0],y:b.y+b.h*p.flood[1],c:t,r:cm(520,it)*(it.size/14),i:1,core:b.w*.25,cone:0,cw:1.1});o.push({x:b.x+b.w*p.flood[0],y:b.y+b.h*p.flood[1],c:t,r:cm(110,it),i:.7,core:b.w*.2})}
    return o}
  return[];
}
function photoBox(it){const p=P[it.id],img=IM[p.img],w=cm(it.size||p.w,it),h=w*img.height/img.width;return{x:it.x-w/2,y:it.y-h/2,w,h}}
function dimsOf(it){
  if(it.type==='plafon'){const s=cm(it.size,it);return{w:s,h:s*Math.cos(rad(it.tilt)),depth:it.mount==='sob'?cm(3.5,it):cm(.5,it)}}
  if(it.type==='panel'){const [a,b]=it.size==='120x30'?[120,30]:[60,60];return{w:cm(a,it),h:cm(b,it)*Math.cos(rad(it.tilt)),pw:cm(a,it),ph:cm(b,it),depth:cm(.9,it)}}
  if(it.type==='spot'){const s=cm(9,it);return{w:s,h:s*Math.cos(rad(it.tilt)),depth:cm(.6,it)}}
  return{w:0,h:0,depth:0};
}

/* ---------- dibujo ---------- */
function shadowOn(g,it,d=1){g.shadowColor='rgba(0,0,0,.36)';g.shadowBlur=cm(1.6*d,it);g.shadowOffsetX=cm(.8*d,it);g.shadowOffsetY=cm(1.6*d,it)}
function shadowOff(g){g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetX=0;g.shadowOffsetY=0}
function bulb(g,img,x,y,w,flip){const h=w*img.height/img.width;g.save();g.translate(x,y);if(flip)g.scale(1,-1);g.drawImage(img,-w/2,-h/2,w,h);g.restore()}
function cable(g,pts,it){g.lineCap='round';g.lineJoin='round';g.strokeStyle='#0e0e10';g.lineWidth=Math.max(1.5,cm(.65,it));g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke()}
/* Forma plana vista en perspectiva: se dibuja sobre el plano del techo (giro y luego achatado) */
function plane(g,it,fn){const sy=Math.cos(rad(it.tilt||0));g.save();g.translate(it.x,it.y);g.scale(1,sy);if(it.rot)g.rotate(rad(it.rot));fn();g.restore()}
function shapePath(g,shape,w,h,r){g.beginPath();if(shape==='round')g.ellipse(0,0,w/2,h/2,0,0,7);else g.roundRect(-w/2,-h/2,w,h,r)}
function drawFlat(g,it,lit){
  const sy=Math.cos(rad(it.tilt||0)),off=dimsOf(it).depth*Math.sin(rad(it.tilt||0)),t=TONES[it.tone]||TONES.neutra;
  let w,h,shape,rr;
  if(it.type==='plafon'){w=h=cm(it.size,it);shape=it.shape;rr=w*.06}
  else if(it.type==='panel'){const d=dimsOf(it);w=d.pw;h=d.ph;shape='square';rr=cm(.6,it)}
  else{w=h=cm(9,it);shape=it.shape;rr=w*.08}
  if(lit){ // difusor prendido
    g.save();g.globalAlpha=night;plane(g,it,()=>{const inset=it.type==='panel'?cm(1.4,it):(it.type==='spot'?w*.2:w*.05);
      const gr=g.createRadialGradient(0,0,0,0,0,Math.max(w,h)*.6);gr.addColorStop(0,'rgb(255,255,252)');gr.addColorStop(.7,`rgb(${t.map(v=>Math.min(255,v+30))})`);gr.addColorStop(1,`rgb(${t})`);
      g.fillStyle=gr;shapePath(g,shape,w-inset*2,h-inset*2,rr*.6);g.fill()});g.restore();return}
  // costado (solo los de sobreponer se ven con espesor)
  if(off>.5){g.save();g.translate(0,-off);shadowOn(g,it,1);plane(g,it,()=>{g.fillStyle='#cfd2d6';shapePath(g,shape,w,h,rr);g.fill()});shadowOff(g);g.restore();
    g.save();g.fillStyle='#bfc3c8';const steps=6;for(let i=1;i<steps;i++){g.save();g.translate(0,-off*i/steps);plane(g,it,()=>{shapePath(g,shape,w,h,rr);g.fill()});g.restore()}g.restore()}
  else{shadowOn(g,it,.4)}
  plane(g,it,()=>{
    // marco
    const fr=g.createLinearGradient(0,-h/2,0,h/2);fr.addColorStop(0,'#f4f5f6');fr.addColorStop(1,'#d9dcdf');g.fillStyle=fr;shapePath(g,shape,w,h,rr);g.fill();shadowOff(g);
    // difusor apagado
    const inset=it.type==='panel'?cm(1.4,it):(it.type==='spot'?w*.2:w*.05);
    const df=g.createLinearGradient(-w/2,-h/2,w/2,h/2);df.addColorStop(0,'#fbfbfa');df.addColorStop(1,'#e6e7e6');g.fillStyle=df;shapePath(g,shape,w-inset*2,h-inset*2,rr*.6);g.fill();
    g.strokeStyle='rgba(0,0,0,.10)';g.lineWidth=Math.max(.6,cm(.12,it));shapePath(g,shape,w-inset*2,h-inset*2,rr*.6);g.stroke();
    if(it.type==='spot'){g.fillStyle='#d4d6d8';shapePath(g,'round',w*.42,h*.42,0);g.fill();g.fillStyle='#f1efe8';shapePath(g,'round',w*.26,h*.26,0);g.fill()}
  });
}
function drawBajo(g,it,lit){
  const w=cm(it.len,it),h=Math.max(3,cm(2.2,it));g.save();g.translate(it.x,it.y);g.rotate(rad(it.rot));
  if(lit){g.globalAlpha=night;const t=TONES.neutra;g.fillStyle=`rgb(${t})`;g.beginPath();g.roundRect(-w/2+h*.3,h*.18,w-h*.6,h*.3,h*.15);g.fill();g.restore();return}
  shadowOn(g,it,.6);const gr=g.createLinearGradient(0,-h/2,0,h/2);gr.addColorStop(0,'#eceef0');gr.addColorStop(.5,'#c9cdd2');gr.addColorStop(1,'#9fa4aa');
  g.fillStyle=gr;g.beginPath();g.roundRect(-w/2,-h/2,w,h,h*.25);g.fill();shadowOff(g);
  g.fillStyle='#f6f6f4';g.beginPath();g.roundRect(-w/2+h*.3,h*.18,w-h*.6,h*.3,h*.15);g.fill();
  g.fillStyle='#e7e9ec';g.fillRect(-w/2,-h/2,h*.5,h);g.fillRect(w/2-h*.5,-h/2,h*.5,h);
  g.fillStyle='#2b2d30';g.beginPath();g.roundRect(w/2-h*1.6,-h*.28,h*.7,h*.46,h*.1);g.fill();
  g.restore();
}
function drawBody(g,it){
  g.save();
  if(it.type==='guirnalda'){const p=curvePts(it),bs=bulbsOf(it);shadowOn(g,it,1.6);cable(g,p,it);bs.forEach(b=>{bulb(g,b.img,b.x,b.y,b.w,1);const s=b.sock;g.drawImage(IM.portalampara,s[0]-s[2]/2,s[1],s[2],s[3])})}
  else if(it.type==='colgante'){const b=bulbsOf(it)[0],s=b.sock,fw=cm(9,it),fh=cm(1.6,it),x=it.x,y=it.y;shadowOn(g,it,1.2);
    const gr=g.createLinearGradient(x-fw/2,0,x+fw/2,0);gr.addColorStop(0,'#18181a');gr.addColorStop(.4,'#3a3a3d');gr.addColorStop(1,'#121213');
    g.fillStyle=gr;g.beginPath();g.moveTo(x-fw/2,y);g.lineTo(x+fw/2,y);g.bezierCurveTo(x+fw/2,y+fh*.9,x+fw*.2,y+fh,x,y+fh);g.bezierCurveTo(x-fw*.2,y+fh,x-fw/2,y+fh*.9,x-fw/2,y);g.fill();
    cable(g,[[x,y+fh*.8],[x,s[1]+cm(.5,it)]],it);bulb(g,b.img,b.x,b.y,b.w,1);g.drawImage(IM.portalampara,s[0]-s[2]/2,s[1],s[2],s[3])}
  else if(it.type==='plafon'||it.type==='panel'||it.type==='spot')drawFlat(g,it,false);
  else if(it.type==='bajo')drawBajo(g,it,false);
  else if(it.type==='photo'){const p=P[it.id],b=photoBox(it);shadowOn(g,it,.9);g.drawImage(IM[p.img],b.x,b.y,b.w,b.h)}
  g.restore();
}
/* Partes que brillan: se dibujan después del mapa de luz para que no se oscurezcan */
function emitPass(g){if(night<=0)return;items.forEach(it=>{
  if(it.type==='guirnalda'||it.type==='colgante'){g.save();g.globalAlpha=night;bulbsOf(it).forEach(b=>bulb(g,b.lit,b.x,b.y,b.w,1));g.restore()}
  else if(it.type==='plafon'||it.type==='panel'||it.type==='spot')drawFlat(g,it,true);
  else if(it.type==='bajo')drawBajo(g,it,true);
  else if(it.type==='photo'){const p=P[it.id];if(p.on&&IM[p.on]){const b=photoBox(it);g.save();g.globalAlpha=night;g.drawImage(IM[p.on],b.x,b.y,b.w,b.h);g.restore()}}
})}
/* Haz de luz en forma de cono (hacia abajo): cae con la distancia y se apaga hacia los costados, sin bordes duros */
const cone=document.createElement('canvas'),cg=cone.getContext('2d');
function coneImg(e,k){
  const R=Math.ceil(e.r),[r,gg,b]=e.c,h=Math.min(1.35,(e.cw||.36)*.95),col=a=>`rgba(${r},${gg},${b},${a})`;
  cone.width=2*R;cone.height=R;cg.globalCompositeOperation='source-over';cg.clearRect(0,0,2*R,R);
  const gr=cg.createRadialGradient(R,0,0,R,0,R);[[0,1],[.08,.8],[.22,.5],[.45,.22],[.7,.07],[1,0]].forEach(([t,v])=>gr.addColorStop(t,col((k*v).toFixed(3))));
  cg.fillStyle=gr;cg.fillRect(0,0,2*R,R);
  cg.globalCompositeOperation='destination-in';
  if(cg.createConicGradient){const f=h/(2*Math.PI),m=cg.createConicGradient(0,R,0);
    [[0,0],[.25-f,0],[.25-f*.6,.45],[.25-f*.25,.9],[.25,1],[.25+f*.25,.9],[.25+f*.6,.45],[.25+f,0],[1,0]].forEach(([t,v])=>m.addColorStop(Math.min(1,Math.max(0,t)),`rgba(0,0,0,${v})`));cg.fillStyle=m}
  else{const m=cg.createLinearGradient(0,0,2*R,0),w=Math.sin(h)*.5;m.addColorStop(0,'rgba(0,0,0,0)');m.addColorStop(Math.max(0,.5-w),'rgba(0,0,0,0)');m.addColorStop(.5,'#000');m.addColorStop(Math.min(1,.5+w),'rgba(0,0,0,0)');m.addColorStop(1,'rgba(0,0,0,0)');cg.fillStyle=m}
  cg.fillRect(0,0,2*R,R);return cone;
}
function lightPass(g,W,H){
  if(night<=0)return;
  if(light.width!==W||light.height!==H){light.width=W;light.height=H}
  const a=1-night*.86;lg.globalCompositeOperation='source-over';
  lg.fillStyle=`rgb(${Math.round(255*a*.80)},${Math.round(255*a*.83)},${Math.round(255*Math.min(1,a*1.0))})`;lg.fillRect(0,0,W,H);
  lg.globalCompositeOperation='lighter';
  items.forEach(it=>emitters(it).forEach(e=>{
    const k=night*e.i,[r,gg,b]=e.c;
    if(e.cone!==undefined){
      lg.save();lg.translate(e.x,e.y);lg.rotate(e.cone);lg.drawImage(coneImg(e,k),-e.r,0);lg.restore();
    }else{
      const gr=lg.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r);[[0,1],[.06,.86],[.14,.62],[.26,.4],[.42,.22],[.62,.09],[.82,.025],[1,0]].forEach(([t,v])=>gr.addColorStop(t,`rgba(${r},${gg},${b},${(k*v).toFixed(3)})`));
      lg.fillStyle=gr;lg.beginPath();lg.arc(e.x,e.y,e.r,0,7);lg.fill();
    }
  }));
  g.save();g.globalCompositeOperation='multiply';g.drawImage(light,0,0);g.restore();
}
function bloomPass(g){
  if(night<=0)return;g.save();g.globalCompositeOperation='screen';
  items.forEach(it=>emitters(it).forEach(e=>{if(e.cone!==undefined&&e.cw>1)return;const k=night*e.i,[r,gg,b]=e.c,R=e.core*2.6;
    const gr=g.createRadialGradient(e.x,e.y,0,e.x,e.y,R);gr.addColorStop(0,`rgba(255,${Math.min(255,gg+40)},${Math.min(255,b+80)},${.75*k})`);[[.15,.4],[.35,.15],[.6,.05],[1,0]].forEach(([t,v])=>gr.addColorStop(t,`rgba(${r},${gg},${b},${(k*v).toFixed(3)})`));
    g.fillStyle=gr;g.beginPath();g.arc(e.x,e.y,R,0,7);g.fill()}));
  g.restore();
}
function render(g=cx,forExport=false){
  if(!photo)return;const W=cv.width,H=cv.height;g.clearRect(0,0,W,H);g.drawImage(photo,0,0,W,H);
  items.forEach(it=>drawBody(g,it));lightPass(g,W,H);emitPass(g);bloomPass(g);
  if(!forExport){drawHandles(g);if(calLine)drawCal(g)}
}
const R=()=>cv.width/Math.max(1,cv.getBoundingClientRect().width);
function handle(g,x,y){const r=8*R();g.fillStyle='#fff';g.strokeStyle='#06518b';g.lineWidth=3*R();g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke()}
function drawHandles(g){
  if(!sel)return;g.save();
  if(sel.type==='guirnalda'){g.setLineDash([5*R(),5*R()]);g.strokeStyle='rgba(120,180,255,.9)';g.lineWidth=1.5*R();g.beginPath();g.moveTo(...sel.p1);g.lineTo(...sel.p2);g.stroke();g.setLineDash([]);handle(g,...sel.p1);handle(g,...sel.p2);handle(g,...midPt(sel))}
  else{const b=bbox(sel),pad=6*R();g.strokeStyle='#5aa9ff';g.lineWidth=1.5*R();g.strokeRect(b[0]-pad,b[1]-pad,b[2]-b[0]+pad*2,b[3]-b[1]+pad*2)}
  g.restore();
}
function drawCal(g){g.save();g.strokeStyle='#5cc8ff';g.lineWidth=3*R();g.beginPath();g.moveTo(...calLine[0]);g.lineTo(...calLine[1]);g.stroke();calLine.forEach(p=>{g.fillStyle='#5cc8ff';g.beginPath();g.arc(p[0],p[1],6*R(),0,7);g.fill()});g.restore()}
function bbox(it){
  if(it.type==='colgante'){const b=bulbsOf(it)[0],bh=b.w*b.img.height/b.img.width;return[it.x-Math.max(cm(4.5,it),b.w/2),it.y,it.x+Math.max(cm(4.5,it),b.w/2),b.y+bh/2]}
  if(it.type==='bajo'){const w=cm(it.len,it)/2,a=rad(it.rot),dx=Math.abs(Math.cos(a))*w+cm(1.5,it),dy=Math.abs(Math.sin(a))*w+cm(1.5,it);return[it.x-dx,it.y-dy,it.x+dx,it.y+dy]}
  if(it.type==='photo'){const b=photoBox(it);return[b.x,b.y,b.x+b.w,b.y+b.h]}
  const d=dimsOf(it),s=Math.max(d.w,it.type==='panel'?Math.hypot(d.pw,d.ph):d.w)/2,sy=Math.cos(rad(it.tilt||0)),off=d.depth*Math.sin(rad(it.tilt||0));
  return[it.x-s,it.y-s*sy-off,it.x+s,it.y+s*sy]
}

/* ---------- productos ---------- */
function newItem(id){
  const p=P[id],W=cv.width,H=cv.height,b={id,type:p.type,k:1,tone:'calida'};
  if(p.type==='guirnalda'){const span=Math.min(W*.8,cm(420));return{...b,m:6,p1:[W/2-span/2,H*.16],p2:[W/2+span/2,H*.16],sag:cm(40)}}
  if(p.type==='colgante')return{...b,x:W/2,y:H*.04,cable:60,bulb:'g125'};
  if(p.type==='plafon')return{...b,shape:p.shape,size:22,mount:'sob',tilt:62,rot:0,x:W/2,y:H*.22,tone:'neutra'};
  if(p.type==='panel')return{...b,size:'60x60',tilt:62,rot:0,x:W/2,y:H*.2,tone:'neutra'};
  if(p.type==='spot')return{...b,shape:'round',tilt:62,x:W/2,y:H*.2};
  if(p.type==='bajo')return{...b,len:60,rot:0,x:W/2,y:H*.4};
  return{...b,size:p.w,x:W/2,y:H*.4};
}
function addProduct(id){if(!photo){toast('Primero subí una foto del lugar');return}const it=newItem(id);items.push(it);select(it);track('producto_agregado',{producto:id});if(matchMedia('(max-width:900px)').matches)$('stage').scrollIntoView({behavior:'smooth',block:'start'})}
function select(it){sel=it;buildSel();render()}

function slider(lbl,min,max,step,val,fv,on){const f=document.createElement('label');f.className='field';
  f.innerHTML=`<span class="lab"><span>${lbl}</span><output></output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}">`;
  const o=f.querySelector('output'),i=f.querySelector('input');o.textContent=fv(val);i.oninput=()=>{o.textContent=fv(+i.value);on(+i.value);render();buildInfo()};return f}
function options(lbl,opts,cur,on,cls=''){const f=document.createElement('div');f.className='field';f.innerHTML=`<span class="lab"><span>${lbl}</span></span>`;
  const s=document.createElement('div');s.className='opts '+cls;opts.forEach(([v,t,img])=>{const b=document.createElement('button');b.type='button';b.innerHTML=(img?`<img src="${img}" alt="">`:'')+t;b.setAttribute('aria-pressed',v===cur);b.onclick=()=>{on(v);buildSel();render()};s.append(b)});f.append(s);return f}
function buildSel(){
  $('selEmpty').hidden=!!sel;$('selBox').hidden=!sel;if(!sel)return;const it=sel,p=P[it.id],c=$('selControls');
  $('selName').textContent=p.name;$('selImg').src='img/cat/'+p.thumb+'.jpg';$('selCat').href='catalogo.html#q='+encodeURIComponent(p.q);
  $('selWa').href=waLink(`Hola! Quiero consultar precio mayorista de: ${p.name}${it.type==='guirnalda'?` (${it.m} m)`:''}${it.type==='bajo'?` (${it.len} cm)`:''}${it.type==='plafon'?` (${it.size} cm)`:''}.`);
  c.innerHTML='';
  if(it.type==='guirnalda')c.append(options('Largo',[[6,'6 m · 10 lámparas'],[10,'10 m · 20 lámparas']],it.m,v=>it.m=v));
  if(it.type==='colgante'){c.append(options('Lámpara',Object.entries(BULBS).map(([k,b])=>[k,b.name.split(' ')[0],'img/prob/'+b.img+'.png']),it.bulb,v=>it.bulb=v,'bulbs'));c.append(slider('Largo del cable',10,150,5,it.cable,v=>v+' cm',v=>it.cable=v))}
  if(it.type==='plafon'){c.append(options('Medida',[[12,'12 cm'],[17,'17 cm'],[22,'22 cm'],[30,'30 cm']],it.size,v=>it.size=v));c.append(options('Colocación',[['sob','Sobreponer'],['emb','Embutir']],it.mount,v=>it.mount=v))}
  if(it.type==='panel')c.append(options('Medida',[['60x60','60 × 60 cm'],['120x30','120 × 30 cm']],it.size,v=>it.size=v));
  if(it.type==='spot')c.append(options('Forma',[['round','Redondo'],['square','Cuadrado']],it.shape,v=>it.shape=v));
  if(P[it.id].sizes)c.append(options('Potencia',P[it.id].sizes.map(([t,w])=>[w,t]),it.size,v=>it.size=v));
  if(it.type==='bajo')c.append(options('Largo',[[60,'60 cm'],[90,'90 cm'],[120,'120 cm']],it.len,v=>it.len=v));
  if(['plafon','panel','spot','photo'].includes(it.type)&&!(it.type==='photo'&&P[it.id].flood))c.append(options('Luz',TONE_OPTS,it.tone,v=>it.tone=v));
  if(it.id==='reflector')c.append(options('Luz',[['fria','Fría'],['calida','Cálida']],it.tone,v=>it.tone=v));
  if(['plafon','panel','spot'].includes(it.type))c.append(slider('Ángulo de vista',0,80,1,it.tilt,v=>v===0?'de frente':v+'°',v=>it.tilt=v));
  if(it.type==='panel'||(it.type==='plafon'&&it.shape==='square'))c.append(slider('Giro',-45,45,1,it.rot,v=>v+'°',v=>it.rot=v));
  if(it.type==='bajo')c.append(slider('Giro',-30,30,1,it.rot,v=>v+'°',v=>it.rot=v));
  c.append(slider('Tamaño en la foto',.3,3,.05,it.k,v=>Math.round(v*100)+'%',v=>it.k=v));
  buildInfo();
}
function buildInfo(){
  const el=$('info');if(!sel)return;el.className='note';const p=P[sel.id];
  if(sel.type==='guirnalda'){const g=GUIR[sel.m],len=curveLen(curvePts(sel))/(pxPerCm*sel.k),m=(len/100).toFixed(1).replace('.',',');
    if(len>g.len){el.className='note warn';el.textContent=`Así hacen falta unos ${m} m de cable y esta guirnalda mide ${sel.m} m. Acortá la caída o elegí la de 10 m.`}
    else el.textContent=`Usa unos ${m} m de los ${sel.m} m de cable. Se muestra con lámparas gota (se venden aparte).`;return}
  const T={colgante:'Florón, cable y portalámpara E27 con la lámpara elegida.',plafon:'Los de sobreponer tienen unos 3,5 cm de alto. Ajustá el ángulo para que coincida con el techo de la foto.',panel:'Panel de embutir de 4 cm de espesor. Ajustá el ángulo y el giro para alinearlo con el techo.',spot:'Spot de embutir de unos 9 cm. Ajustá el ángulo para que coincida con el techo.',bajo:'Listón de luz neutra (4000 K) con tecla de encendido.'};
  el.textContent=T[sel.type]||(p.approx?'Medida aproximada. Si sabés cuánto mide el lugar, usá Medir para que la escala sea exacta.':'');
}
$('dup').onclick=()=>{const c=JSON.parse(JSON.stringify(sel)),d=cm(25,sel);if(c.type==='guirnalda'){c.p1[1]+=d;c.p2[1]+=d}else c.x+=d;items.push(c);select(c)};
$('del').onclick=()=>{items=items.filter(i=>i!==sel);sel=null;buildSel();render()};

/* ---------- interacción ---------- */
function pos(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]}
const near=(p,q,r)=>Math.hypot(p[0]-q[0],p[1]-q[1])<r;
function hit(p){const r=20*R();
  for(let i=items.length-1;i>=0;i--){const it=items[i];
    if(it.type==='guirnalda'){if(near(p,it.p1,r))return{it,part:'p1'};if(near(p,it.p2,r))return{it,part:'p2'};if(near(p,midPt(it),r))return{it,part:'sag'};
      if(curvePts(it,80).some(q=>near(p,q,r)))return{it,part:'all'};if(bulbsOf(it).some(b=>near(p,[b.gx,b.gy],Math.max(r,cm(5,it)))))return{it,part:'all'}}
    else{const b=bbox(it),pad=10*R();if(p[0]>=b[0]-pad&&p[0]<=b[2]+pad&&p[1]>=b[1]-pad&&p[1]<=b[3]+pad)return{it,part:'all'}}}
  return null}
cv.addEventListener('pointerdown',e=>{const p=pos(e);cv.setPointerCapture(e.pointerId);
  if(calMode){calLine=[p,p];drag={cal:1};render();return}
  const h=hit(p);if(!h){sel=null;buildSel();render();return}
  if(sel!==h.it)select(h.it);drag={part:h.part,start:p,orig:JSON.parse(JSON.stringify(h.it))};cv.style.cursor='grabbing'});
cv.addEventListener('pointermove',e=>{if(!drag)return;const p=pos(e);
  if(drag.cal){calLine[1]=p;$('calOk').disabled=Math.hypot(calLine[1][0]-calLine[0][0],calLine[1][1]-calLine[0][1])<10*R();render();return}
  const it=sel,o=drag.orig,dx=p[0]-drag.start[0],dy=p[1]-drag.start[1];
  if(it.type==='guirnalda'){if(drag.part==='p1')it.p1=[o.p1[0]+dx,o.p1[1]+dy];else if(drag.part==='p2')it.p2=[o.p2[0]+dx,o.p2[1]+dy];else if(drag.part==='sag')it.sag=Math.max(0,o.sag+dy);else{it.p1=[o.p1[0]+dx,o.p1[1]+dy];it.p2=[o.p2[0]+dx,o.p2[1]+dy]}}
  else{it.x=o.x+dx;it.y=o.y+dy}render();buildInfo()});
const end=()=>{drag=null;cv.style.cursor='grab'};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);

/* ---------- foto ---------- */
function fit(){if(!photo)return;const st=$('stage'),cs=getComputedStyle(st),mob=matchMedia('(max-width:900px)').matches;
  const aw=st.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),ah=mob?Infinity:st.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
  const s=Math.min(aw/cv.width,ah/cv.height);cv.style.width=Math.floor(cv.width*s)+'px';cv.style.height=Math.floor(cv.height*s)+'px';render()}
function setPhoto(img){track('foto_subida');const max=2000,s=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
  cv.width=Math.round(img.naturalWidth*s);cv.height=Math.round(img.naturalHeight*s);photo=img;calibrated=false;pxPerCm=cv.width/400;items=[];sel=null;
  $('empty').hidden=true;cv.hidden=false;$('tools').hidden=false;$('hint').hidden=false;$('export').disabled=false;
  scaleNote();buildSel();fit()}
function readFile(f){if(!f||!f.type.startsWith('image/'))return;const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>setPhoto(i);i.src=r.result};r.readAsDataURL(f)}
$('file').onchange=e=>readFile(e.target.files[0]);$('file2').onchange=e=>readFile(e.target.files[0]);
const em=$('empty');['dragenter','dragover'].forEach(t=>$('stage').addEventListener(t,e=>{e.preventDefault();em.classList.add('over')}));
['dragleave','drop'].forEach(t=>$('stage').addEventListener(t,e=>{e.preventDefault();em.classList.remove('over')}));
$('stage').addEventListener('drop',e=>readFile(e.dataTransfer.files[0]));
window.addEventListener('resize',fit);

/* ---------- hora y escala ---------- */
document.querySelectorAll('#tools .seg button').forEach(b=>b.onclick=()=>{night=+b.dataset.n;track('cambio_hora',{modo:b.textContent.trim()});document.querySelectorAll('#tools .seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));render()});
function scaleNote(){$('scaleNote').textContent=calibrated?`Escala marcada: 1 m equivale a ${Math.round(pxPerCm*100)} px de la foto. Los productos están a medida real en ese plano.`:'Los productos se dibujan con su medida real. Para que la escala sea exacta, tocá Medir y marcá algo que conozcas, como una puerta (200 cm).'}
scaleNote();
$('calBtn').onclick=()=>{calMode=true;calLine=null;$('calBox').hidden=false;$('calOk').disabled=true;$('calBox').scrollIntoView({behavior:'smooth',block:'nearest'})};
function calEnd(){calMode=false;calLine=null;$('calBox').hidden=true;render()}
$('calCancel').onclick=calEnd;
$('calOk').onclick=()=>{track('medida_aplicada');const v=+$('calCm').value;if(calLine&&v>0){const old=pxPerCm;pxPerCm=Math.hypot(calLine[1][0]-calLine[0][0],calLine[1][1]-calLine[0][1])/v;calibrated=true;
  items.forEach(it=>{if(it.type==='guirnalda')it.sag*=pxPerCm/old});scaleNote();buildSel();toast('Medida aplicada')}calEnd()};

/* ---------- imagen para el cliente (solo con los datos del comercio) ---------- */
const shopEl=$('shop'),phoneEl=$('phone');
try{const s=JSON.parse(localStorage.getItem('probador-mayorista')||'{}');shopEl.value=s.shop||'';phoneEl.value=s.phone||''}catch(e){}
const savePrefs=()=>{try{localStorage.setItem('probador-mayorista',JSON.stringify({shop:shopEl.value,phone:phoneEl.value}))}catch(e){}};
shopEl.oninput=savePrefs;phoneEl.oninput=savePrefs;
$('export').onclick=()=>{
  track('imagen_creada',{productos:[...new Set(items.map(i=>i.id))].join(','),cantidad:items.length});
  const W=cv.width,H=cv.height,band=Math.round(Math.max(96,W*.085)),c=document.createElement('canvas');c.width=W;c.height=H+band;const g=c.getContext('2d');
  render(g,true);g.fillStyle='#062a47';g.fillRect(0,H,W,band);g.fillStyle='#e21e1f';g.fillRect(0,H,W,Math.max(2,band*.04));
  const pad=band*.3,shop=shopEl.value.trim(),phone=phoneEl.value.trim(),f=(w,px)=>`${w} ${Math.round(px)}px Barlow,system-ui,sans-serif`;g.textBaseline='middle';
  // Nuestra marca, bien visible; los datos del local a la derecha para que el cliente sepa dónde comprarlo
  const L=IM.logo,lh=band*.5,lw=L?lh*L.width/L.height:0;if(L)g.drawImage(L,pad,H+band*.1,lw,lh);
  const all=[...new Set(items.map(i=>P[i.id].name))],mw=shop||phone?W*.58:W-2*pad,tail='Simulación: la luz es aproximada';g.fillStyle='#a9c3db';g.font=f(500,band*.135);
  let line=all.length?all.join('  ·  ')+'   —   '+tail:tail;for(let n=all.length-1;n>0&&g.measureText(line).width>mw;n--)line=all.slice(0,n).join('  ·  ')+` y ${all.length-n} más   —   `+tail;
  g.fillText(line,pad,H+band*.8,mw);
  if(shop||phone){g.textAlign='right';const x=W-pad;
    g.fillStyle='#9cc7ea';g.font=f(600,band*.12);g.fillText('CONSULTÁ EN',x,H+band*.25);
    g.fillStyle='#fff';g.font=`700 ${Math.round(band*.24)}px "Barlow Semi Condensed",Barlow,system-ui,sans-serif`;g.fillText(shop||phone,x,H+band*.5,W*.38);
    if(shop&&phone){g.fillStyle='#dbe7f2';g.font=f(500,band*.16);g.fillText(phone,x,H+band*.76)}}
  const url=c.toDataURL('image/jpeg',.92);$('resImg').src=url;$('resDl').href=url;$('result').hidden=false};
$('resClose').onclick=()=>$('result').hidden=true;

let tt;function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,2200)}

/* ---------- lista de productos ---------- */
function buildCat(){const cat=$('cat');$('count').textContent=PRODUCTS.length+' productos';let sec='';
  PRODUCTS.forEach(p=>{if(p.sec!==sec){sec=p.sec;const h=document.createElement('h2');h.textContent=sec;cat.append(h)}
    const b=document.createElement('button');b.type='button';b.className='prod';b.setAttribute('aria-label','Agregar '+p.name);
    b.innerHTML=`<img src="img/cat/${p.thumb}.jpg" alt="" loading="lazy" width="64" height="64"><span><b>${p.name}</b><small>${p.spec}</small></span>`;b.onclick=()=>addProduct(p.id);cat.append(b)})}
buildCat();loadImgs().then(render);
})();
