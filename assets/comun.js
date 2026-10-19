/* Medición de uso (Google Analytics) y datos de contacto, compartidos por todas las páginas.
   ID de medición de la propiedad "Distribuidora Pueyrredón". */
window.GA_ID='G-VE2V32DHY0';
if(!/X{6}/.test(GA_ID)){const s=document.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',GA_ID)}
window.track=(ev,p={})=>{try{if(window.gtag)gtag('event',ev,p)}catch(e){}};
window.WA_NUM='5491176033649';
window.waLink=t=>'https://wa.me/'+WA_NUM+'?text='+encodeURIComponent(t);
document.addEventListener('click',e=>{const a=e.target.closest('a[data-wa]');if(a)track('click_whatsapp',{desde:a.dataset.wa})});
