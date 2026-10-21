type ContactBusiness = { nombre: string; categoria: string; especialidad?: string; descripcion?: string };
export type ContactIntent = 'presupuesto' | 'producto' | 'disponibilidad' | 'turno' | 'menu' | 'consulta';

const normalized = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function businessContact(business: ContactBusiness) {
  const category = normalized(business.categoria);
  const activity = normalized(`${business.nombre} ${business.especialidad || ''} ${business.descripcion || ''}`);
  let intent: ContactIntent = 'consulta';
  if (/gastronom/.test(category)) intent = 'menu';
  else if (/salud|terapias|bienestar/.test(category)) intent = 'turno';
  else if (/educacion/.test(category)) intent = 'disponibilidad';
  else if (/compras/.test(category)) intent = 'producto';
  else if (/belleza/.test(category)) intent = /peluquer|manicur|estetic|maquillaje|depilacion/.test(activity) ? 'turno' : 'producto';
  else if (/turismo/.test(category) || /alojamiento|monoambiente|hospedaje|hotel|posada/.test(activity)) intent = 'disponibilidad';
  else if (/oficios|profesionales|hogar/.test(category) || /carpinter|herreri|reparaci|mantenimiento|arquitectura|desarrollo.*web|diseno.*web|paginas web|sitios web/.test(activity)) intent = 'presupuesto';

  const details: Record<ContactIntent, { label: string; request: string; fields: string[] }> = {
    presupuesto: { label: 'Pedir presupuesto', request: 'quisiera pedir un presupuesto', fields: ['Trabajo que necesito:', 'Localidad:', 'Medidas o detalles (si corresponde):', 'Para cuándo lo necesito:'] },
    producto: { label: 'Consultar producto', request: 'quisiera consultar por un producto', fields: ['Producto y cantidad:', 'Localidad:', '¿Tienen disponibilidad y cuál es el precio?', '¿Ofrecen retiro o envío?'] },
    disponibilidad: { label: 'Consultar disponibilidad', request: 'quisiera consultar disponibilidad', fields: ['Servicio o propuesta que me interesa:', 'Fecha o días que necesito:', 'Cantidad de personas (si corresponde):', '¿Cuál es el precio y cómo se coordina?'] },
    turno: { label: 'Consultar por un turno', request: 'quisiera consultar por un turno', fields: ['Servicio que me interesa:', 'Días y horarios que me sirven:', '¿Cuál es el precio y cómo se coordina?'] },
    menu: { label: 'Consultar menú', request: 'quisiera consultar el menú', fields: ['¿Me comparten el menú y los precios?', '¿Qué horarios y opciones de retiro o entrega tienen?'] },
    consulta: { label: 'Consultar por WhatsApp', request: 'quisiera hacer una consulta', fields: ['Me interesa:', 'Mi consulta:'] },
  };
  const detail = details[intent];
  const message = `Hola, encontré ${business.nombre} en Vitrina Cerca y ${detail.request}.\n\n${detail.fields.join('\n')}\n\n¡Gracias!`;
  return { intent, label: detail.label, message };
}

export function whatsappContactUrl(number: string, business: ContactBusiness) {
  return `https://wa.me/${number}?text=${encodeURIComponent(businessContact(business).message)}`;
}
