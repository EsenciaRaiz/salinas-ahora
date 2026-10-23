const status = document.querySelector('#status'), cards = document.querySelector('#experiences');
const https = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
const text = (tag, value, parent) => { const node = document.createElement(tag); node.textContent = value; parent.append(node); return node; };
try {
  const response = await fetch('/salidas/experiencias.json');
  if (!response.ok) throw new Error('No disponible');
  const data = await response.json();
  const experiences = (Array.isArray(data.experiencias) ? data.experiencias : []).filter(item => item.aprobada === true && item.fotos_autorizadas === true && item.nombre && item.descripcion && item.confirmado_el && https(item.foto) && https(item.consulta_url) && https(item.mapa_url) && item.precio && item.duracion && item.dias && item.incluye && item.familias && item.sin_alcohol);
  status.hidden = experiences.length > 0;
  if (experiences.length) document.querySelector('.cover .button').textContent = 'Ver propuestas';
  status.textContent = 'Estamos reuniendo propuestas de bodegas de Canelones. Las publicaremos con sus precios, recorridos y condiciones confirmados por cada anfitrión.';
  for (const item of experiences) {
    const card = document.createElement('article'); card.className = 'card';
    const photo = document.createElement('img'); photo.src = https(item.foto); photo.alt = item.nombre; photo.loading = 'lazy'; photo.width = 640; photo.height = 360; card.append(photo);
    const content = document.createElement('div'); content.className = 'card-content'; card.append(content);
    text('small', item.localidad || 'Canelones', content); text('h3', item.nombre, content); text('p', item.descripcion, content);
    const facts = document.createElement('dl'); content.append(facts);
    for (const [label, value] of [['Incluye', item.incluye], ['Precio por persona', item.precio], ['Duración', item.duracion], ['Días y reserva', item.dias], ['Para familias', item.familias], ['Sin alcohol', item.sin_alcohol]]) { text('dt', label, facts); text('dd', value, facts); }
    text('p', `Información confirmada por el anfitrión: ${item.confirmado_el}`, content);
    const actions = document.createElement('div'); actions.className = 'actions'; content.append(actions);
    for (const [label, url, style] of [['Consultar disponibilidad', item.consulta_url, 'button'], ['Cómo llegar', item.mapa_url, 'button secondary']]) { const link = text('a', label, actions); link.href = https(url); link.className = style; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    cards.append(card);
  }
} catch { status.textContent = 'No pudimos cargar las propuestas. Probá de nuevo en unos minutos.'; }
