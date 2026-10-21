const form = document.getElementById('business-form');
const dialog = document.getElementById('card-preview-dialog');
const content = document.getElementById('card-preview-content');
let imageUrls = [];
function render() {
  imageUrls.forEach(URL.revokeObjectURL); imageUrls = [];
  const value = name => String(form.elements.namedItem(name)?.value || '').trim();
  const el = (tag, text, className) => { const node = document.createElement(tag); node.textContent = text; if(className) node.className = className; return node; };
  content.replaceChildren();
  const card = el('article', '', 'preview-business');
  const file = document.getElementById('photo').files[0];
  if(file && /^image\/(jpeg|png|webp)$/.test(file.type)) { const img = document.createElement('img'); const url = URL.createObjectURL(file); imageUrls.push(url); img.src = url; img.alt = 'Foto elegida para tu negocio'; card.append(img); }
  else card.append(el('div', 'Tu foto aparecerá acá', 'preview-photo-empty'));
  if(value('estilo_tarjeta') === 'Editorial') card.classList.add('preview-editorial');
  const body = el('div', '', 'preview-business-body');
  const logoFile = document.getElementById('logo').files[0];
  if(logoFile && /^image\/(jpeg|png|webp)$/.test(logoFile.type)) { const image = document.createElement('img'); const url=URL.createObjectURL(logoFile); imageUrls.push(url); image.src=url; image.alt='Logo de tu negocio'; image.className='preview-logo'; body.append(image); }
  body.append(el('small', [value('categoria'), value('especialidad')].filter(Boolean).join(' · ') || 'Tu rubro'), el('h3', value('nombre') || 'Nombre de tu negocio'), el('p', value('descripcion') || 'La descripción de tus productos o servicios aparecerá acá.'));
  body.append(el('p', document.getElementById('solo-online').checked ? 'Atención online · Uruguay' : [value('localidad'), value('departamento')].filter(Boolean).join(' · ') || 'Tu localidad'));
  const hours = [['horario_lunes_a_viernes','Lun. a vie.'],['horario_sabado','Sábado'],['horario_domingo','Domingo']];
  hours.forEach(([name,label]) => { if(value(name)) body.append(el('p', `${label}: ${value(name)}`)); });
  const actions = el('div', '', 'preview-contact');
  [['whatsapp','Consultar por WhatsApp'],['telefono','Llamar'],['sitio_web','Sitio web']].forEach(([name,label]) => { if(value(name)) actions.append(el('span',label)); });
  actions.append(el('span','Ver ficha')); body.append(actions); card.append(body); content.append(card);
  const details = el('section', '', 'preview-more');
  const photos = el('div','','preview-gallery');
  Array.from(document.getElementById('photo').files).slice(1,4).filter(file => /^image\/(jpeg|png|webp)$/.test(file.type)).forEach(file => { const image=document.createElement('img'); const url=URL.createObjectURL(file); imageUrls.push(url); image.src=url; image.alt='Otra foto de tu negocio'; photos.append(image); });
  details.append(photos);
  const coverageMode = document.getElementById('coverage-mode').value;
  const regions = Array.from(document.querySelectorAll('#coverage-regions input:checked')).map(input => input.value);
  if(coverageMode==='pais' || regions.length) details.append(el('h4','Zona de atención'),el('p',coverageMode==='pais'?'Todo Uruguay':regions.join(', ')));
  if(document.getElementById('mostrarMapa').checked && value('direccion')) details.append(el('h4','Dirección'),el('p',value('direccion')));
  [['whatsapp','WhatsApp'],['telefono','Teléfono'],['sitio_web','Sitio web']].forEach(([name,label]) => { if(value(name)) details.append(el('h4',label),el('p',value(name))); });
  [['menu_url','Menú o catálogo'],['precios_orientativos','Precios orientativos'],['productos_destacados','Productos destacados'],['entregas','Entregas y retiro'],['zona_cobertura','Zona de atención'],['instagram','Instagram'],['facebook','Facebook']].forEach(([name,label]) => { if(value(name)) details.append(el('h4',label),el('p',value(name))); });
  if(form.elements.historia_consentimiento.checked && value('historia_negocio')) details.append(el('h4',value('persona_nombre') || 'Nuestra historia'),el('p',value('historia_negocio')));
  if(value('promocion_titulo')) details.append(el('h4',value('promocion_titulo')),el('p',value('promocion_detalle')),el('p',[value('promocion_inicio'),value('promocion_fin')].filter(Boolean).join(' — ')));
  content.append(details);
}
let opener;
document.querySelectorAll('#open-card-preview, [data-card-preview]').forEach(button => button.addEventListener('click', () => { opener=button; render(); dialog.showModal(); }));
document.getElementById('close-card-preview').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { imageUrls.forEach(URL.revokeObjectURL); imageUrls=[]; opener?.focus(); });
