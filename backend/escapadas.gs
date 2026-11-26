/* Escapadas: administraci�n exclusiva del propietario de la planilla. */
const ESC_HEADERS_=['ID','ESTADO','TITULO','TIPO','DESCRIPCION','PAIS','REGION','LOCALIDAD','DIRECCION','PRECIO','MONEDA','UNIDAD','SERVICIOS','CONDICIONES','WHATSAPP','ENLACE','IMAGENES','DESTACADO','ACTUALIZADO','VERSION'];
function escOwner_(){
  const email=Session.getActiveUser().getEmail();
  const owner=DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId()).getOwner();
  if(!email||!owner||email.toLowerCase()!==owner.getEmail().toLowerCase())throw Error('Este panel es exclusivo de la administraci�n. Ingres� con la cuenta propietaria de la planilla.');
}
function escSheet_(){
  const book=SpreadsheetApp.getActiveSpreadsheet();let sheet=book.getSheetByName('ESCAPADAS');
  if(!sheet){sheet=book.insertSheet('ESCAPADAS');sheet.appendRow(ESC_HEADERS_);sheet.setFrozenRows(1);sheet.getRange(1,1,1,ESC_HEADERS_.length).setBackground('#116078').setFontColor('#ffffff').setFontWeight('bold');sheet.setColumnWidths(1,ESC_HEADERS_.length,160);sheet.setColumnWidth(3,240);sheet.setColumnWidth(5,350);sheet.getRange('A1').setNote('Administrar desde el panel web. Solo Publicada es visible; Borrador y Pausada permanecen ocultas.');}
  const headers=sheet.getRange(1,1,1,ESC_HEADERS_.length).getValues()[0];
  if(headers.join('|')!==ESC_HEADERS_.join('|'))throw Error('La estructura de ESCAPADAS cambi�. Revisala antes de guardar.');return sheet;
}
function escRecords_(sheet){return sheet&&sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,ESC_HEADERS_.length).getValues().map((r,i)=>({row:i+2,data:ESC_HEADERS_.reduce((o,k,j)=>(o[k]=r[j] instanceof Date?r[j].toISOString():r[j],o),{})})):[];}
function escPublic_(){
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ESCAPADAS');
  const rows=escRecords_(sheet).filter(r=>r.data.ESTADO==='Publicada').map(r=>r.data);
  return respuestaJson_(JSON.stringify({correcto:true,escapadas:rows}));
}
function escPanel_(){
  try{escOwner_();return HtmlService.createHtmlOutputFromFile('EscapadasAdmin').setTitle('Administrar escapadas | Vitrina Cerca');}
  catch(error){return HtmlService.createHtmlOutput('<h1>Acceso de administraci�n</h1><p>Ingres� con la cuenta propietaria de Vitrina Cerca para administrar las escapadas.</p>');}
}
function escLoad(){escOwner_();return escRecords_(escSheet_()).map(r=>r.data);}
function escText_(v,max,required){const t=String(v==null?'':v).trim();if(t.length>max||(required&&!t)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(t))throw Error('Revis� los campos obligatorios y su extensi�n.');return t;}
function escValidate_(p){
  if(!p||typeof p!=='object')throw Error('Propuesta no v�lida.');const out={};
  const limits={TITULO:100,TIPO:30,DESCRIPCION:1800,PAIS:20,REGION:80,LOCALIDAD:80,DIRECCION:180,PRECIO:20,MONEDA:3,UNIDAD:30,SERVICIOS:500,CONDICIONES:1000,WHATSAPP:20,ENLACE:500};
  Object.keys(limits).forEach(k=>out[k]=escText_(p[k],limits[k],['TITULO','TIPO','DESCRIPCION','PAIS','REGION','LOCALIDAD','WHATSAPP'].includes(k)));
  if(!['Alojamiento','Experiencia','Paseo','Gastronom�a'].includes(out.TIPO)||!['Uruguay','Argentina','Brasil'].includes(out.PAIS))throw Error('Eleg� un tipo de propuesta y un pa�s v�lido.');
  out.WHATSAPP=out.WHATSAPP.replace(/\D/g,'');if(!/^\d{10,15}$/.test(out.WHATSAPP))throw Error('Ingres� WhatsApp con c�digo de pa�s.');
  if(out.ENLACE&&!/^https:\/\/[^\s]+$/i.test(out.ENLACE))throw Error('El enlace debe comenzar con https://.');
  if(out.PRECIO&&(!/^\d+(?:[.,]\d{1,2})?$/.test(out.PRECIO)||Number(out.PRECIO.replace(',','.'))<=0))throw Error('El precio debe ser un n�mero mayor a cero o quedar vac�o para consultar.');
  if(out.PRECIO&&(!['UYU','ARS','BRL','USD'].includes(out.MONEDA)||!['Por persona','Por noche','Por grupo','Por actividad'].includes(out.UNIDAD)))throw Error('Complet� moneda y unidad del precio.');
  out.DESTACADO=p.DESTACADO===true?'S�':'No';return out;
}
function escSave(p,photos){
  escOwner_();const data=escValidate_(p);if(!['Borrador','Publicada','Pausada'].includes(p.ESTADO))throw Error('Estado no v�lido.');
  if(!Array.isArray(photos)||photos.length>4)throw Error('Pod�s subir hasta cuatro fotos.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);let uploaded=[];
  try{
    const sheet=escSheet_(),rows=escRecords_(sheet),old=p.ID?rows.find(r=>r.data.ID===p.ID):null;
    if(p.ID&&!old)throw Error('No se encontr� la escapada.');if(old&&Number(p.VERSION)!==Number(old.data.VERSION))throw Error('La escapada cambi� en otra ventana. Volv� a cargarla antes de guardar.');
    const id=old?old.data.ID:Utilities.getUuid();
    let images=old?String(old.data.IMAGENES||''):'';
    if(photos.length){
      const checked=photos.map(photo=>{if(!photo||photo.mime!=='image/jpeg'||!/^[-A-Za-z0-9+/=]+$/.test(String(photo.data||''))||photo.data.length>700000)throw Error('Foto no v�lida o demasiado grande.');const bytes=Utilities.base64Decode(photo.data);if(bytes.length>500000||bytes.length<100||(bytes[0]&255)!==255||(bytes[1]&255)!==216)throw Error('La foto debe ser JPEG de hasta 500 KB.');return bytes;});
      const props=PropertiesService.getScriptProperties();let folderId=props.getProperty('ESC_IMAGE_FOLDER');let folder=folderId?DriveApp.getFolderById(folderId):DriveApp.createFolder('Vitrina Cerca - Fotos de escapadas');if(!folderId)props.setProperty('ESC_IMAGE_FOLDER',folder.getId());
      checked.forEach((bytes,i)=>{const file=folder.createFile(Utilities.newBlob(bytes,'image/jpeg','escapada-'+id+'-'+Utilities.getUuid()+'.jpg'));uploaded.push(file);file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);});
      images=uploaded.map(file=>'https://drive.google.com/thumbnail?id='+file.getId()+'&sz=w1200').join('|');
    }
    if(p.ESTADO==='Publicada'&&!images)throw Error('Agreg� al menos una foto antes de publicar.');
    const next=Object.assign(data,{ID:id,ESTADO:p.ESTADO,IMAGENES:images,ACTUALIZADO:new Date().toISOString(),VERSION:old?Number(old.data.VERSION)+1:1});
    const safe=v=>typeof v==='string'&&/^[=+\-@]/.test(v)?"'"+v:v;
    sheet.getRange(old?old.row:sheet.getLastRow()+1,1,1,ESC_HEADERS_.length).setValues([ESC_HEADERS_.map(k=>safe(next[k]))]);return next;
  }catch(error){uploaded.forEach(file=>{try{file.setTrashed(true);}catch(_){}});throw error;}finally{lock.releaseLock();}
}
