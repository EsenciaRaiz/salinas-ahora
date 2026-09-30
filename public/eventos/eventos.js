const endpoint='https://script.google.com/macros/s/AKfycbybDC2YTJj8oqoclwREuMQxFdd8szCNZprb3WAy6gwb4fjH7KnaIdXJExqNe93yFsejiQ/exec';
const cards=document.querySelector('#cards'),status=document.querySelector('#status'),locality=document.querySelector('#localidad'),entry=document.querySelector('#entrada'),more=document.querySelector('#more');
let events=[],limit=9,expiryTimer;
const date=new Intl.DateTimeFormat('es-UY',{timeZone:'America/Montevideo',weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
function safeUrl(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:''}catch{return ''}}
function eventImageUrl(value){
  const source=safeUrl(value);
  if(!source)return '';
  const url=new URL(source);
  if(url.hostname==='drive.google.com'||url.hostname==='docs.google.com'){
    const id=url.pathname.match(/\/d\/([\w-]{20,})/)?.[1]||url.searchParams.get('id');
    if(id&&/^[\w-]{20,}$/.test(id))return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`;
  }
  return source;
}
function element(tag,text,className){const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node}
function render(){
  const visible=events.filter(event=>event.fin>Date.now()&&(!locality.value||event.localidad===locality.value)&&(!entry.value||event.entrada===entry.value));
  cards.replaceChildren();
  visible.slice(0,limit).forEach(event=>{
    const article=element('article','','card'),detail=document.createElement('details'),summary=document.createElement('summary'),body=element('div','','content');
    summary.append(element('span',event.localidad+' · '+(event.entrada==='Gratis'?'Gratis':'Entrada paga'),'tag'),element('h2',event.titulo),element('time',date.format(event.inicio),'event-time'),element('span','Ver más','more-label'));
    detail.append(summary);detail.addEventListener('toggle',()=>{summary.querySelector('.more-label').textContent=detail.open?'Ver menos':'Ver más'});
    const imageUrl=eventImageUrl(event.imagen_url);
    if(imageUrl){const poster=document.createElement('a'),image=document.createElement('img');poster.href=imageUrl;poster.target='_blank';poster.rel='noopener noreferrer';poster.className='poster-link';poster.setAttribute('aria-label','Ver cartel de '+event.titulo+' en tamaño completo');image.alt='Cartel de '+event.titulo;image.loading='lazy';image.decoding='async';image.width=640;image.height=420;image.referrerPolicy='no-referrer';poster.append(image);body.append(poster);detail.addEventListener('toggle',()=>{if(detail.open&&!image.src)image.src=imageUrl},{once:true})}
    body.append(element('p',date.format(event.inicio)+' — '+date.format(event.fin),'details'),element('p',[event.lugar,event.direccion].filter(Boolean).join(' · '),'details'),element('p',event.descripcion,'description'),element('p','Organiza: '+event.organizador,'details'));
    const links=element('div','','links'),url=safeUrl(event.enlace);
    if(url){const link=element('a','Consultar / reservar');link.href=url;link.target='_blank';link.rel='noopener noreferrer';links.append(link)}
    const phone=String(event.telefono||'').replace(/\D/g,'');if(phone.length>=8&&phone.length<=15){const link=element('a','Llamar al organizador');link.href='tel:+'+phone;links.append(link)}
    const whatsapp=phone.startsWith('09')?'598'+phone.slice(1):phone;
    if(/^5989\d{7}$/.test(whatsapp)&&String(event.whatsapp||'').toLowerCase()==='si'){
      const link=element('a','','whatsapp-link'),icon=document.createElement('img');
      link.href='https://wa.me/'+whatsapp;link.target='_blank';link.rel='noopener noreferrer';
      icon.src='/eventos/whatsapp.svg';icon.alt='';icon.width=20;icon.height=20;icon.loading='lazy';
      link.append(icon,document.createTextNode('WhatsApp'));link.setAttribute('aria-label','Consultar por WhatsApp al organizador de '+event.titulo);links.append(link);
    }
    if(navigator.share){const share=element('button','Compartir');share.type='button';share.addEventListener('click',()=>navigator.share({title:event.titulo,text:event.titulo+' · '+event.localidad+' · '+date.format(event.inicio),url:'https://vitrinacerca.com/eventos/'}).catch(()=>{}));links.append(share)}
    body.append(links);detail.append(body);article.append(detail);cards.append(article);
  });
  status.textContent=visible.length?visible.length+' evento'+(visible.length===1?'':'s')+' próximo'+(visible.length===1?'':'s'):(events.some(event=>event.fin>Date.now())?'No hay eventos con estos filtros.':'Todavía no hay próximos eventos publicados. ¿Tenés uno para compartir?');
  more.hidden=visible.length<=limit;
  clearTimeout(expiryTimer);
  const nextEnd=Math.min(...events.filter(event=>event.fin>Date.now()).map(event=>event.fin));
  if(Number.isFinite(nextEnd))expiryTimer=setTimeout(render,Math.min(nextEnd-Date.now()+100,2147483647));
}
for(const control of [locality,entry])control.addEventListener('change',()=>{limit=9;render()});more.addEventListener('click',()=>{limit+=9;render()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&events.length)render()});
function showEvents(items){const selected=locality.value;events=items.filter(event=>Number.isFinite(event.inicio)&&Number.isFinite(event.fin)).sort((a,b)=>a.inicio-b.inicio);const all=element('option','Todas las localidades');all.value='';locality.replaceChildren(all);[...new Set(events.map(event=>event.localidad))].sort().forEach(value=>{const option=element('option',value);option.value=value;locality.append(option)});if([...locality.options].some(option=>option.value===selected))locality.value=selected;render()}
try{const cached=JSON.parse(sessionStorage.getItem('vitrina-eventos-v1')||'null');if(cached&&Date.now()-cached.saved<300000&&Array.isArray(cached.events))showEvents(cached.events)}catch{}
try{const response=await fetch(endpoint+'?action=eventos',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();const data=await response.json();if(!data.correcto||!Array.isArray(data.eventos))throw Error();showEvents(data.eventos);try{sessionStorage.setItem('vitrina-eventos-v1',JSON.stringify({saved:Date.now(),events:data.eventos}))}catch{}}catch{if(!events.length)status.textContent='No pudimos cargar la cartelera. Probá recargar esta página en unos minutos.'}
