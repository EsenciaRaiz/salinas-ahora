const endpoint='https://script.google.com/macros/s/AKfycbybDC2YTJj8oqoclwREuMQxFdd8szCNZprb3WAy6gwb4fjH7KnaIdXJExqNe93yFsejiQ/exec';
const cards=document.querySelector('#cards'),status=document.querySelector('#status'),locality=document.querySelector('#localidad'),entry=document.querySelector('#entrada'),more=document.querySelector('#more');
let events=[],limit=9,expiryTimer;
const languageSelect=document.querySelector('#language');
const languageCopy={
  es:{language:'Idioma',back:'Volver a la guía',eyebrow:'LA CARTELERA · VITRINA CERCA',title:'Qué pasa cerca',intro:'Ferias, talleres, encuentros y espectáculos para disfrutar de tu zona.',propose:'Proponer un evento',figcaption:'Encuentros, cultura y planes para compartir.',locality:'Localidad',allLocalities:'Todas las localidades',entry:'Entrada',allEntry:'Gratis y paga',free:'Gratis',paid:'Paga',paidEntry:'Entrada paga',loading:'Buscando próximos eventos…',moreEvents:'Ver más eventos',confirm:'Confirmá los detalles con el organizador antes de asistir.',localGuide:'Guía local',stories:'Historias',privacy:'Privacidad y correcciones',more:'Ver más',less:'Ver menos',posterView:'Ver cartel de ',poster:'Cartel de ',organizer:'Organiza: ',book:'Consultar / reservar',call:'Llamar al organizador',whatsapp:'Consultar por WhatsApp al organizador de ',share:'Compartir evento',shareWhatsApp:'Compartir por WhatsApp',copy:'Copiar enlace',link:'Enlace de ',copied:'Enlace copiado',copyManual:'Seleccioná y copiá el enlace.',otherOptions:'Más opciones',shareFallback:'Podés compartir por WhatsApp o copiar el enlace.',upcomingOne:'1 evento próximo',upcomingMany:' eventos próximos',noFilters:'No hay eventos que coincidan con esos filtros.',noEvents:'Todavía no hay eventos próximos publicados. ¿Tenés uno para compartir?',unavailable:'Este evento ya terminó o no está disponible. Podés consultar el resto de la agenda.',noLocality:'Todavía no hay eventos próximos publicados en {localidad}. Podés ver otras localidades o proponer uno.',allEvents:'Ver todos los eventos',loadError:'No pudimos cargar la cartelera. Probá recargar esta página en unos minutos.',shareMessage:'¡Mirá este evento que vi en Vitrina Cerca! 📍 {titulo} — {localidad}. Todos los detalles acá: ',pageTitle:'Eventos de la zona | Vitrina Cerca',imageAlt:'Ilustración de una feria y un encuentro musical entre pinos junto a la costa'},
  en:{language:'Language',back:'Back to the guide',eyebrow:'EVENTS · VITRINA CERCA',title:"What's happening nearby",intro:'Fairs, workshops, meetups and performances to enjoy in the area.',propose:'Suggest an event',figcaption:'Gatherings, culture and plans to share.',locality:'Town or city',allLocalities:'All towns and cities',entry:'Admission',allEntry:'Free and paid',free:'Free',paid:'Paid',paidEntry:'Paid admission',loading:'Looking for upcoming events…',moreEvents:'Show more events',confirm:'Check the details with the organizer before attending.',localGuide:'Local guide',stories:'Stories',privacy:'Privacy and corrections',more:'Show more',less:'Show less',posterView:'View full-size poster for ',poster:'Poster for ',organizer:'Organized by: ',book:'Details / booking',call:'Call the organizer',whatsapp:'Ask the organizer on WhatsApp about ',share:'Share event',shareWhatsApp:'Share on WhatsApp',copy:'Copy link',link:'Link to ',copied:'Link copied',copyManual:'Select and copy the link.',otherOptions:'More options',shareFallback:'You can share on WhatsApp or copy the link.',upcomingOne:'1 upcoming event',upcomingMany:' upcoming events',noFilters:'No events match these filters.',noEvents:'No upcoming events have been published yet. Have one to share?',unavailable:'This event has ended or is unavailable. See the rest of the calendar.',noLocality:'No upcoming events are published for {localidad} yet. Try another town or suggest an event.',allEvents:'See all events',loadError:'We could not load the events. Please try reloading this page in a few minutes.',shareMessage:'See this event on Vitrina Cerca! 📍 {titulo} — {localidad}. Details: ',pageTitle:'Events in Uruguay | Vitrina Cerca',imageAlt:'Illustration of a fair and musical gathering among pine trees by the coast'},
  pt:{language:'Idioma',back:'Voltar ao guia',eyebrow:'AGENDA · VITRINA CERCA',title:'O que acontece por perto',intro:'Feiras, oficinas, encontros e espetáculos para aproveitar na região.',propose:'Sugerir um evento',figcaption:'Encontros, cultura e passeios para compartilhar.',locality:'Localidade',allLocalities:'Todas as localidades',entry:'Entrada',allEntry:'Grátis e paga',free:'Grátis',paid:'Paga',paidEntry:'Entrada paga',loading:'Buscando próximos eventos…',moreEvents:'Ver mais eventos',confirm:'Confirme os detalhes com o organizador antes de participar.',localGuide:'Guia local',stories:'Histórias',privacy:'Privacidade e correções',more:'Ver mais',less:'Ver menos',posterView:'Ver cartaz de ',poster:'Cartaz de ',organizer:'Organização: ',book:'Consultar / reservar',call:'Ligar para o organizador',whatsapp:'Consultar o organizador pelo WhatsApp sobre ',share:'Compartilhar evento',shareWhatsApp:'Compartilhar pelo WhatsApp',copy:'Copiar link',link:'Link de ',copied:'Link copiado',copyManual:'Selecione e copie o link.',otherOptions:'Mais opções',shareFallback:'Você pode compartilhar pelo WhatsApp ou copiar o link.',upcomingOne:'1 próximo evento',upcomingMany:' próximos eventos',noFilters:'Nenhum evento corresponde a esses filtros.',noEvents:'Ainda não há próximos eventos publicados. Tem algum para compartilhar?',unavailable:'Este evento terminou ou não está disponível. Confira o restante da agenda.',noLocality:'Ainda não há próximos eventos publicados em {localidad}. Veja outras localidades ou sugira um evento.',allEvents:'Ver todos os eventos',loadError:'Não foi possível carregar a agenda. Tente atualizar a página em alguns minutos.',shareMessage:'Veja este evento no Vitrina Cerca! 📍 {titulo} — {localidad}. Detalhes: ',pageTitle:'Eventos no Uruguai | Vitrina Cerca',imageAlt:'Ilustração de uma feira e encontro musical entre pinheiros perto da costa'}
};
const requestedLanguage=new URLSearchParams(location.search).get('lang');
let language=['es','en','pt'].includes(requestedLanguage)?requestedLanguage:(()=>{try{return localStorage.getItem('vitrina-language')}catch{return null}})();
if(!['es','en','pt'].includes(language))language='es';
const tr=(key,values={})=>String(languageCopy[language][key]||languageCopy.es[key]||key).replace(/\{(\w+)\}/g,(_,name)=>values[name]??'');
const eventDate=()=>new Intl.DateTimeFormat(language==='es'?'es-UY':language==='pt'?'pt-BR':'en-US',{timeZone:'America/Montevideo',weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
function applyLanguage(){document.documentElement.lang=language==='es'?'es-UY':language==='pt'?'pt-BR':'en';document.title=tr('pageTitle');languageSelect.value=language;document.querySelector('#language-label').textContent=tr('language');document.querySelector('#back-guide').textContent=tr('back');for(const node of document.querySelectorAll('[data-i18n]'))node.textContent=tr(node.dataset.i18n);locality.options[0].textContent=tr('allLocalities');document.querySelector('.editorial-cover img').alt=tr('imageAlt');if(document.querySelector('.all-events'))document.querySelector('.all-events').textContent=tr('allEvents');}
applyLanguage();
languageSelect.addEventListener('change',()=>{language=languageSelect.value;try{localStorage.setItem('vitrina-language',language)}catch{}applyLanguage();render()});
const requestedEvent=new URLSearchParams(location.search).get('evento');
const requestedLocality=new URLSearchParams(location.search).get('localidad')?.trim().slice(0,80)||'';
if(requestedLocality&&!requestedEvent){const option=document.createElement('option');option.value=requestedLocality;option.textContent=requestedLocality;locality.append(option);locality.value=requestedLocality;}
const eventKey=event=>String(event.id||[event.titulo,event.inicio,event.localidad].join('|'));
const eventUrl=event=>'https://vitrinacerca.com/eventos/?evento='+encodeURIComponent(eventKey(event));
const eventMessage=event=>tr('shareMessage',{titulo:event.titulo,localidad:event.localidad});

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
  const visible=events.filter(event=>event.fin>Date.now()&&(!requestedEvent||eventKey(event)===requestedEvent)&&(!locality.value||event.localidad===locality.value)&&(!entry.value||event.entrada===entry.value));
  cards.replaceChildren();
  visible.slice(0,limit).forEach(event=>{
    const article=element('article','','card'),detail=document.createElement('details'),summary=document.createElement('summary'),body=element('div','','content');
    summary.append(element('span',event.localidad+' · '+(event.entrada==='Gratis'?tr('free'):tr('paidEntry')),'tag'),element('h2',event.titulo),element('time',eventDate().format(event.inicio),'event-time'),element('span',tr('more'),'more-label'));
    detail.append(summary);detail.addEventListener('toggle',()=>{summary.querySelector('.more-label').textContent=detail.open?tr('less'):tr('more')});
    const imageUrl=eventImageUrl(event.imagen_url);
    if(imageUrl){const poster=document.createElement('a'),image=document.createElement('img');poster.href=imageUrl;poster.target='_blank';poster.rel='noopener noreferrer';poster.className='poster-link';poster.setAttribute('aria-label',tr('posterView')+event.titulo);image.alt=tr('poster')+event.titulo;image.loading='lazy';image.decoding='async';image.width=640;image.height=420;image.referrerPolicy='no-referrer';poster.append(image);body.append(poster);detail.addEventListener('toggle',()=>{if(detail.open&&!image.src)image.src=imageUrl},{once:true})}
    const endTime=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Montevideo',hour:'2-digit',minute:'2-digit',hour12:false}).format(event.fin);
    const schedule=eventDate().format(event.inicio)+(endTime==='23:59'?'':' — '+eventDate().format(event.fin));
    body.append(element('p',schedule,'details'),element('p',[event.lugar,event.direccion].filter(Boolean).join(' · '),'details'),element('p',event.descripcion,'description'));if(event.organizador)body.append(element('p',tr('organizer')+event.organizador,'details'));
    const links=element('div','','links'),url=safeUrl(event.enlace);
    if(url){const link=element('a',tr('book'));link.href=url;link.target='_blank';link.rel='noopener noreferrer';links.append(link)}
    const phone=String(event.telefono||'').replace(/\D/g,'');if(phone.length>=8&&phone.length<=15){const link=element('a',tr('call'));link.href='tel:+'+phone;links.append(link)}
    const whatsapp=phone.startsWith('09')?'598'+phone.slice(1):phone;
    if(/^5989\d{7}$/.test(whatsapp)&&String(event.whatsapp||'').toLowerCase()==='si'){
      const link=element('a','','whatsapp-link'),icon=document.createElement('img');
      link.href='https://wa.me/'+whatsapp;link.target='_blank';link.rel='noopener noreferrer';
      icon.src='/eventos/whatsapp.svg';icon.alt='';icon.width=20;icon.height=20;icon.loading='lazy';
      link.append(icon,document.createTextNode('WhatsApp'));link.setAttribute('aria-label',tr('whatsapp')+event.titulo);links.append(link);
    }
    body.append(links);detail.append(body);article.append(detail);cards.append(article);
    const sharing=element('div','','event-sharing'),shareToggle=element('button',tr('share')),panel=element('div','','event-share-panel'),feedback=element('p','','share-feedback');
    shareToggle.type='button';shareToggle.setAttribute('aria-expanded','false');panel.hidden=true;
    const shareId='compartir-evento-'+encodeURIComponent(eventKey(event));panel.id=shareId;shareToggle.setAttribute('aria-controls',shareId);
    shareToggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;shareToggle.setAttribute('aria-expanded',String(!panel.hidden))});
    const wa=element('a',tr('shareWhatsApp'));wa.href='https://wa.me/?text='+encodeURIComponent(eventMessage(event)+eventUrl(event));wa.target='_blank';wa.rel='noopener noreferrer';
    const copy=element('button',tr('copy'));copy.type='button';feedback.setAttribute('role','status');
    const manual=element('input');manual.value=eventUrl(event);manual.readOnly=true;manual.setAttribute('aria-label',tr('link')+event.titulo);manual.hidden=true;
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(eventUrl(event));feedback.textContent=tr('copied');}catch{manual.hidden=false;manual.focus();manual.select();feedback.textContent=tr('copyManual')}});
    panel.append(wa,copy);
    if(navigator.share){const native=element('button',tr('otherOptions'));native.type='button';native.addEventListener('click',async()=>{try{await navigator.share({title:event.titulo,text:eventMessage(event),url:eventUrl(event)})}catch(error){if(error.name!=='AbortError')feedback.textContent=tr('shareFallback')}});panel.append(native)}
    panel.append(manual,feedback);sharing.append(shareToggle,panel);article.append(sharing);
    if(requestedEvent){detail.open=true;document.title=event.titulo+' | Vitrina Cerca';}
  });
  status.textContent=visible.length?(visible.length===1?tr('upcomingOne'):visible.length+tr('upcomingMany')):(events.some(event=>event.fin>Date.now())?tr('noFilters'):tr('noEvents'));
  if(requestedEvent&&!visible.length)status.textContent=tr('unavailable');
  else if(!visible.length&&locality.value)status.textContent=tr('noLocality',{localidad:locality.value});
  more.hidden=visible.length<=limit;
  clearTimeout(expiryTimer);
  const nextEnd=Math.min(...events.filter(event=>event.fin>Date.now()).map(event=>event.fin));
  if(Number.isFinite(nextEnd))expiryTimer=setTimeout(render,Math.min(nextEnd-Date.now()+100,2147483647));
}
if(requestedEvent){const all=element('a',tr('allEvents'));all.href='/eventos/';all.className='all-events';status.before(all);document.querySelector('.filters').hidden=true;}
for(const control of [locality,entry])control.addEventListener('change',()=>{limit=9;render()});more.addEventListener('click',()=>{limit+=9;render()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&events.length)render()});
function showEvents(items){const selected=locality.value;events=items.filter(event=>Number.isFinite(event.inicio)&&Number.isFinite(event.fin)).sort((a,b)=>a.inicio-b.inicio);const all=element('option',tr('allLocalities'));all.value='';locality.replaceChildren(all);[...new Set(events.map(event=>event.localidad))].sort().forEach(value=>{const option=element('option',value);option.value=value;locality.append(option)});if(selected&&!Array.from(locality.options).some(option=>option.value===selected)){const option=element('option',selected);option.value=selected;locality.append(option)}if(selected)locality.value=selected;render()}
try{const cached=JSON.parse(sessionStorage.getItem('vitrina-eventos-v1')||'null');if(cached&&Date.now()-cached.saved<300000&&Array.isArray(cached.events))showEvents(cached.events)}catch{}
try{const response=await fetch(endpoint+'?action=eventos',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();const data=await response.json();if(!data.correcto||!Array.isArray(data.eventos))throw Error();showEvents(data.eventos);try{sessionStorage.setItem('vitrina-eventos-v1',JSON.stringify({saved:Date.now(),events:data.eventos}))}catch{}}catch{if(!events.length)status.textContent=tr('loadError')}
