import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const data={
 NEGOCIOS:[['ID','NOMBRE','PUBLICAR','PROMOCION_TITULO','PROMOCION_DETALLE','PROMOCION_INICIO','PROMOCION_FIN','WHATSAPP'],['A','Negocio A','Sí','','','','','099123456'],['B','Negocio B','Sí','','','','','099000000']],
 SOLICITUDES:[['Fecha','ID','Correo','Estado'],['','A','owner@example.com','Aprobada'],['','B','other@example.com','Aprobada'],['','B','attacker@example.com','Pendiente']],
 GESTORES_NEGOCIOS:[['ID','Correo','Activo']],
 PROMOCIONES_GESTION:[['ID','Título','Detalle','Inicio','Fin','Estado','Versión','Actualizado']],
 AUDITORIA_PROMOCIONES:[['Fecha','ID','Hash','Acción','Versión','Antes','Después']]
};
const sheets=new Map();
function makeSheet(name){const rows=data[name]|| (data[name]=[]);return {getLastRow:()=>rows.length,getLastColumn:()=>Math.max(0,...rows.map(r=>r.length)),getDataRange(){return {getValues:()=>structuredClone(rows)};},getRange(row,col,height=1,width=1){return {getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row-1+i]?.[col-1+j]??'')),setValues(values){values.forEach((r,i)=>{rows[row-1+i]??=[];r.forEach((v,j)=>rows[row-1+i][col-1+j]=v);});return this;}};},appendRow:r=>rows.push(structuredClone(r)),setFrozenRows(){}};}
Object.keys(data).forEach(n=>sheets.set(n,makeSheet(n)));
const properties=new Map(),sent=[];
const context=vm.createContext({console,Date,Map,JSON,Error,Number,String,Object,Array,RegExp,Math,
 SpreadsheetApp:{openById:()=>({getSheetByName:n=>sheets.get(n),insertSheet:n=>{const sheet=makeSheet(n);sheets.set(n,sheet);return sheet;}})},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
 CacheService:{getScriptCache:()=>({remove(){}})},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k)||null,setProperty:(k,v)=>properties.set(k,v),deleteProperty:k=>properties.delete(k),getProperties:()=>Object.fromEntries(properties)})},
 Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,value)=>Array.from(crypto.createHash('sha256').update(value).digest()),formatDate:(date,zone,format)=>format==='yyyy-MM-dd'?new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date):''},
 MailApp:{getRemainingDailyQuota:()=>100,sendEmail:mail=>sent.push(mail)},ScriptApp:{getService:()=>({getUrl:()=> 'https://script.google.com/macros/s/test/exec'})}
});
vm.runInContext(fs.readFileSync(new URL('../backend/merchant-admin.gs',import.meta.url),'utf8'),context);
const run=(name,...args)=>context[name](...args);
const token=()=>new URL(sent.at(-1).body.match(/https:\/\/script[^\s]+/)[0]).searchParams.get('token');
run('merchantRequestAccess','attacker@example.com','');assert.equal(sent.length,0,'pending request cannot claim a published business');
run('merchantRequestAccess','owner@example.com','');assert.equal(sent.length,1);const first=token();
assert.ok(!JSON.stringify(Object.fromEntries(properties)).includes(first),'only hashed credentials are stored');
const session=run('merchantRedeem',first).session;assert.throws(()=>run('merchantRedeem',first),/utilizado/,'magic links are single use');
assert.equal(run('merchantLoad',session).businesses.length,1);
const future={title:'Beneficio de prueba',detail:'10 % sobre productos seleccionados. Consultar stock.',start:'2099-01-01',end:'2099-01-31',version:0,consent:true};
assert.throws(()=>run('merchantUpdate',session,'B','save',future),/permiso/,'foreign business rejected');
assert.throws(()=>run('merchantUpdate',session,'A','save',{...future,consent:false}),/Confirmá/);
assert.throws(()=>run('merchantUpdate',session,'A','save',{...future,start:'2099-02-30'}),/fechas/);
assert.throws(()=>run('merchantUpdate',session,'A','save',{...future,title:'x'.repeat(101)}),/título/);
run('merchantUpdate',session,'A','save',{...future,name:'Hijacked',PUBLICAR:'No'});
assert.equal(data.NEGOCIOS[1][1],'Negocio A');assert.equal(data.NEGOCIOS[1][2],'Sí');assert.equal(data.NEGOCIOS[1][7],'099123456');assert.equal(data.NEGOCIOS[2][3],'');
assert.equal(data.NEGOCIOS[1][3],future.title);
assert.throws(()=>run('merchantUpdate',session,'A','save',future),/otra ventana/,'stale revision rejected');
run('merchantUpdate',session,'A','pause',{version:1});assert.equal(data.NEGOCIOS[1][3],'');assert.equal(run('merchantLoad',session).businesses[0].promotion.title,future.title);
run('merchantUpdate',session,'A','resume',{version:2});assert.equal(data.NEGOCIOS[1][3],future.title);
run('merchantUpdate',session,'A','remove',{version:3});assert.deepEqual(data.NEGOCIOS[1].slice(3,7),['','','','']);
assert.equal(data.AUDITORIA_PROMOCIONES.length,5);
run('merchantUpdate',session,'A','save',{...future,version:4,start:'2020-01-01',end:'2020-01-02'});
run('merchantUpdate',session,'A','pause',{version:5});assert.throws(()=>run('merchantUpdate',session,'A','resume',{version:6}),/venció/);
data.GESTORES_NEGOCIOS.push(['A','owner@example.com','No']);assert.equal(run('merchantLoad',session).businesses.length,0,'revocation takes effect immediately');
data.GESTORES_NEGOCIOS.pop();
run('merchantLogout',session);assert.throws(()=>run('merchantLoad',session),/sesión/);
run('merchantRequestAccess','other@example.com','');const second=token();const key='ma:token:'+run('maHash_',second);const value=JSON.parse(properties.get(key));value.expires=Date.now()-1;properties.set(key,JSON.stringify(value));assert.throws(()=>run('merchantRedeem',second),/venció/);
const mailCount=sent.length;run('merchantRequestAccess','other@example.com','');assert.equal(sent.length,mailCount,'email cooldown prevents repeated sends');
console.log('OK: ownership, pending requests, one-time/expired links, hashed credentials, revocation, logout, validation, conflicts, pause/resume/remove, unchanged base listing, audit and mail throttling.');
