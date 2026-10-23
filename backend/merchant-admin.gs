/* Install in the existing requests project (which already sends confirmation mail).
 * Route doGet: if(e && e.parameter && e.parameter.merchant==='1') return merchantPage_(e.parameter);
 * Private sheets are never included in the public guide response.
 */
const MA_BOOK='1UNwIXPh62egYItv9JYzP3pfz1sPpDY4fMoyMDRWPJYI';
const MA_FIELDS=['PROMOCION_TITULO','PROMOCION_DETALLE','PROMOCION_INICIO','PROMOCION_FIN'];
function merchantPage_(p){
  const view=HtmlService.createTemplateFromFile('Administrar');
  view.token=/^[a-f0-9]{64}$/.test(String(p.token||''))?String(p.token):'';
  return view.evaluate().setTitle('Administrar mi negocio | Vitrina Cerca');
}
function maHash_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function maRandom_(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');}
function maEmail_(value){return String(value||'').trim().toLowerCase();}
function maYes_(value){return /^(si|sí)$/i.test(String(value||'').trim());}
function maSafe_(value){const s=String(value||'');return /^[=+\-@]/.test(s)?"'"+s:s;}
function maLock_(fn){const lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw Error('Hay otra operación en curso. Intentá nuevamente.');try{return fn();}finally{lock.releaseLock();}}
function maBook_(){return SpreadsheetApp.openById(MA_BOOK);}
function maRows_(sheet){if(!sheet||sheet.getLastRow()<2)return [];return sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues();}
function maTable_(book,name,headers){let s=book.getSheetByName(name);if(!s){s=book.insertSheet(name);s.appendRow(headers);s.setFrozenRows(1);}return s;}
function prepararAdministracionNegocios(){
  const book=maBook_();
  maTable_(book,'GESTORES_NEGOCIOS',['ID negocio','Correo responsable privado','Activo']);
  maTable_(book,'PROMOCIONES_GESTION',['ID negocio','Título','Detalle y condiciones','Inicio','Fin','Estado','Versión','Actualizado']);
  maTable_(book,'AUDITORIA_PROMOCIONES',['Fecha','ID negocio','Responsable (hash)','Acción','Versión','Antes (JSON)','Después (JSON)']);
  console.log('Administración preparada. Para fichas manuales, registrar ID y correo verificado en GESTORES_NEGOCIOS y Activo=Sí. No se envió ningún correo.');
}
function maBusiness_(book){
  const sheet=book.getSheetByName('NEGOCIOS');if(!sheet)throw Error('La guía no está disponible.');
  const rows=sheet.getDataRange().getValues(),header=rows.findIndex(r=>r.includes('ID')&&r.includes('NOMBRE')&&r.includes('PUBLICAR'));
  if(header<0)throw Error('La guía no está disponible.');const keys=rows[header].map(String);
  return {sheet,keys,rows:rows.slice(header+1).map((r,i)=>({row:header+i+2,data:keys.reduce((o,k,j)=>(o[k]=r[j],o),{})}))};
}
function maOwned_(book,email){
  const managers=maRows_(book.getSheetByName('GESTORES_NEGOCIOS'));
  const explicit=new Map(managers.map(r=>[String(r[0]),r]));
  const requests=maRows_(book.getSheetByName('SOLICITUDES'));
  return maBusiness_(book).rows.filter(item=>{
    const b=item.data,id=String(b.ID);if(!maYes_(b.PUBLICAR))return false;
    // An explicit assignment, including a disabled one, overrides the old request.
    if(explicit.has(id)){const r=explicit.get(id);return maYes_(r[2])&&maEmail_(r[1])===email;}
    return requests.some(r=>String(r[1])===id&&maEmail_(r[2])===email&&String(r[3])==='Aprobada');
  });
}
function maPrune_(props){const all=props.getProperties(),now=Date.now();Object.keys(all).filter(k=>/^ma:(token|session|limit):/.test(k)).forEach(k=>{try{if(JSON.parse(all[k]).expires<=now)props.deleteProperty(k);}catch(_){props.deleteProperty(k);}});}
function merchantRequestAccess(email,honeypot){
  const generic={ok:true,message:'Si ese correo está vinculado a una ficha publicada, recibirás un enlace. Revisá también spam. Si aún no está vinculado, contactá a la administración.'};
  email=maEmail_(email);if(honeypot||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>160)return generic;
  return maLock_(()=>{
    const props=PropertiesService.getScriptProperties();maPrune_(props);
    const day=Utilities.formatDate(new Date(),'America/Montevideo','yyyy-MM-dd'),hash=maHash_(email),key='ma:limit:'+day+':'+hash,globalKey='ma:limit:'+day+':all';
    const record=JSON.parse(props.getProperty(key)||'{"count":0,"last":0}'),global=JSON.parse(props.getProperty(globalKey)||'{"count":0}');
    if(record.count>=4||Date.now()-record.last<90000||global.count>=40)return generic;
    const expires=Date.now()+26*3600000;
    props.setProperty(key,JSON.stringify({count:record.count+1,last:Date.now(),expires}));
    props.setProperty(globalKey,JSON.stringify({count:global.count+1,expires}));
    if(!maOwned_(maBook_(),email).length||MailApp.getRemainingDailyQuota()<2)return generic;
    const raw=maRandom_(),tokenKey='ma:token:'+maHash_(raw),token={email,expires:Date.now()+20*60000};
    props.setProperty(tokenKey,JSON.stringify(token));
    const link=ScriptApp.getService().getUrl()+'?merchant=1&token='+raw;
    try{MailApp.sendEmail({to:email,name:'Vitrina Cerca',subject:'Tu acceso a Administrar mi negocio · Vitrina Cerca',body:'Solicitaste acceder a las promociones de tu negocio.\n\nAbrí este enlace y tocá Entrar de forma segura:\n'+link+'\n\nVence en 20 minutos y se puede usar una sola vez. No lo compartas. Al entrar se cerrarán tus sesiones anteriores.\nSi no lo solicitaste, ignorá este correo. Tu ficha no cambia.\n\nPodés pedir otro enlace en https://vitrinacerca.com/administrar/'});}catch(error){props.deleteProperty(tokenKey);console.error('No se pudo enviar un enlace de administración.');}
    return generic;
  });
}
function merchantRedeem(token){return maLock_(()=>{
  if(!/^[a-f0-9]{64}$/.test(String(token||'')))throw Error('El enlace no es válido. Solicitá otro.');
  const props=PropertiesService.getScriptProperties(),key='ma:token:'+maHash_(token),stored=props.getProperty(key),record=stored?JSON.parse(stored):null;
  if(!record||record.expires<=Date.now())throw Error('El enlace venció o ya fue utilizado. Solicitá otro.');
  if(!maOwned_(maBook_(),record.email).length)throw Error('El acceso ya no está habilitado. Contactá a la administración.');
  const all=props.getProperties();Object.keys(all).filter(k=>/^ma:(token|session):/.test(k)).forEach(k=>{try{if(JSON.parse(all[k]).email===record.email)props.deleteProperty(k);}catch(_){}});
  const session=maRandom_(),expires=Date.now()+60*60000;props.setProperty('ma:session:'+maHash_(session),JSON.stringify({email:record.email,expires}));
  return {session,expires};
});}
function maSession_(session){
  if(!/^[a-f0-9]{64}$/.test(String(session||'')))throw Error('Tu sesión terminó. Solicitá otro enlace.');
  const props=PropertiesService.getScriptProperties(),key='ma:session:'+maHash_(session),raw=props.getProperty(key),s=raw?JSON.parse(raw):null;
  if(!s||s.expires<=Date.now()){props.deleteProperty(key);throw Error('Tu sesión terminó. Solicitá otro enlace.');}return s;
}
function maDay_(value){return value instanceof Date?Utilities.formatDate(value,'America/Montevideo','yyyy-MM-dd'):String(value||'').slice(0,10);}
function maPromotion_(book,b){
  const rows=maRows_(book.getSheetByName('PROMOCIONES_GESTION')),r=rows.find(row=>String(row[0])===String(b.ID));
  return r?{title:String(r[1]),detail:String(r[2]),start:maDay_(r[3]),end:maDay_(r[4]),state:String(r[5]),version:Number(r[6])||0}:{title:String(b.PROMOCION_TITULO||''),detail:String(b.PROMOCION_DETALLE||''),start:maDay_(b.PROMOCION_INICIO),end:maDay_(b.PROMOCION_FIN),state:b.PROMOCION_TITULO?'Activa':'Sin promoción',version:0};
}
function merchantLoad(session){return maLock_(()=>{const s=maSession_(session),book=maBook_();return {expires:s.expires,businesses:maOwned_(book,s.email).map(item=>({id:String(item.data.ID),name:String(item.data.NOMBRE),promotion:maPromotion_(book,item.data)}))};});}
function maValidatePromotion_(p){
  const title=String(p.title||'').trim(),detail=String(p.detail||'').trim(),start=String(p.start||''),end=String(p.end||'');
  const date=value=>{const d=new Date(value+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(d)&&d.toISOString().slice(0,10)===value;};
  if(!title||title.length>100||!detail||detail.length>700)throw Error('Indicá un título (hasta 100 caracteres) y las condiciones (hasta 700).');
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(title+detail))throw Error('El texto contiene caracteres no válidos.');
  if(!date(start)||!date(end)||end<start)throw Error('Revisá las fechas de inicio y fin.');
  return {title,detail,start,end};
}
function merchantUpdate(session,id,action,payload){return maLock_(()=>{
  const s=maSession_(session),book=maBook_(),owned=maOwned_(book,s.email),item=owned.find(x=>String(x.data.ID)===String(id));
  if(!item)throw Error('No tenés permiso para administrar ese negocio.');
  if(!['save','pause','resume','remove'].includes(action))throw Error('Acción no válida.');
  const old=maPromotion_(book,item.data);if(!payload||Number(payload.version)!==old.version)throw Error('La promoción cambió en otra ventana. Volvé a cargar antes de guardar.');
  let next={...old,version:old.version+1};
  if(action==='save'){if(payload.consent!==true)throw Error('Confirmá que podés publicar esta promoción.');next={...next,...maValidatePromotion_(payload),state:'Activa'};}
  if(action==='pause'){if(!old.title)throw Error('No hay una promoción para pausar.');next.state='Pausada';}
  if(action==='resume'){maValidatePromotion_(old);const today=Utilities.formatDate(new Date(),'America/Montevideo','yyyy-MM-dd');if(old.end<today)throw Error('La promoción venció. Actualizá sus fechas antes de reactivarla.');next.state='Activa';}
  if(action==='remove')next={title:'',detail:'',start:'',end:'',state:'Retirada',version:next.version};
  const table=maBusiness_(book),columns=MA_FIELDS.map(k=>table.keys.indexOf(k)+1);
  if(columns[0]<1||columns.some((c,i)=>c!==columns[0]+i))throw Error('La administración debe preparar las columnas de promociones.');
  const sheet=maTable_(book,'PROMOCIONES_GESTION',['ID negocio','Título','Detalle y condiciones','Inicio','Fin','Estado','Versión','Actualizado']),rows=maRows_(sheet),index=rows.findIndex(r=>String(r[0])===String(id)),row=index<0?sheet.getLastRow()+1:index+2;
  const range=table.sheet.getRange(item.row,columns[0],1,4),previous=range.getValues();
  const stored=[String(id),next.title,next.detail,next.start,next.end,next.state,next.version,new Date()];
  const audit=maTable_(book,'AUDITORIA_PROMOCIONES',['Fecha','ID negocio','Responsable (hash)','Acción','Versión','Antes (JSON)','Después (JSON)']);
  // Only these four public cells can change. Base listing fields are never accepted.
  range.setValues([next.state==='Activa'?[next.title,next.detail,next.start,next.end].map(maSafe_):['','','','']]);
  try{sheet.getRange(row,1,1,8).setValues([stored.map(v=>typeof v==='string'?maSafe_(v):v)]);}
  catch(error){range.setValues(previous);throw error;}
  audit.appendRow([new Date(),String(id),maHash_(s.email),action,next.version,JSON.stringify(old),JSON.stringify(next)]);
  CacheService.getScriptCache().remove('salinas_publico_v4');
  return {promotion:next,message:'Cambio guardado. La guía puede tardar hasta tres minutos en actualizarse.'};
});}
function merchantLogout(session){if(/^[a-f0-9]{64}$/.test(String(session||'')))PropertiesService.getScriptProperties().deleteProperty('ma:session:'+maHash_(session));return true;}
