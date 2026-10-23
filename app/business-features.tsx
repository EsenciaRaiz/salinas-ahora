import { useState } from 'react';
import { ArrowRight, MapPin, Tag, Mail } from 'lucide-react';

export type BusinessExtras = {
  menu_url?: string; precios_orientativos?: string; productos_destacados?: string;
  entregas?: string; zona_cobertura?: string; persona_nombre?: string; historia_negocio?: string;
  promocion_titulo?: string; promocion_detalle?: string; promocion_inicio?: string; promocion_fin?: string;
};
type Entry = BusinessExtras & { id: string; nombre: string; zona: string; categoria: string; descripcion: string; imagen_url?: string };
export type Testimonial = { id: string; nombre_publico: string; negocio_id: string; texto: string };
export function MerchantTestimonials({ testimonials, businesses }: { testimonials: Testimonial[]; businesses: Entry[] }) {
  const verified = testimonials.filter(item=>item.texto && item.nombre_publico && businesses.some(business=>business.id===item.negocio_id));
  if(!verified.length)return null;
  return <section className="merchant-example" aria-labelledby="testimonials-title"><span className="section-kicker">EXPERIENCIAS REALES</span><h2 id="testimonials-title">Lo cuentan los comercios</h2>{verified.slice(0,3).map(item=><figure key={item.id}><blockquote>{item.texto}</blockquote><figcaption>{item.nombre_publico} · <a href={`/?negocio=${encodeURIComponent(item.negocio_id)}`}>{businesses.find(business=>business.id===item.negocio_id)?.nombre}</a></figcaption></figure>)}</section>;
}
export const uruguayDay = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export function currentPromotion(entry: BusinessExtras, today = uruguayDay()) {
  const start = String(entry.promocion_inicio || '').slice(0, 10), end = String(entry.promocion_fin || '').slice(0, 10);
  const valid = (value: string) => { const parsed = new Date(value+'T12:00:00Z'); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value; };
  return !!entry.promocion_titulo && valid(start) && valid(end) && start <= today && end >= today && end >= start;
}
export function safePublicUrl(value?: string) {
  try { const url = new URL(String(value || '')); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''; } catch { return ''; }
}
const profile = (entry: Entry) => `/?negocio=${encodeURIComponent(entry.id)}`;
function photo(value?: string) {
  const first = String(value || '').split('|')[0].trim();
  const id = first.match(/(?:\/d\/|[?&]id=)([-\w]{20,})/)?.[1];
  return safePublicUrl(id ? `https://drive.google.com/thumbnail?id=${id}&sz=w640` : first);
}

export function BusinessFacts({ business }: { business: BusinessExtras }) {
  const menu = safePublicUrl(business.menu_url);
  const promotion = currentPromotion(business);
  if (![menu,business.precios_orientativos,business.productos_destacados,business.entregas,business.zona_cobertura,business.historia_negocio,promotion].some(Boolean)) return null;
  return <div className="business-extra-facts">
    {promotion && <div className="promotion-card"><span className="section-kicker">BENEFICIO VIGENTE</span><h2>{business.promocion_titulo}</h2><p>{business.promocion_detalle}</p><small>Hasta {String(business.promocion_fin).slice(0,10).split('-').reverse().join('/')} inclusive. Consultá condiciones y disponibilidad con el comercio.</small></div>}
    {menu && <a className="extra-menu" href={menu} target="_blank" rel="noopener noreferrer">Ver menú o catálogo <ArrowRight size={16}/></a>}
    {business.precios_orientativos && <div><h2>Precios orientativos</h2><p>{business.precios_orientativos}</p><small>Confirmá el precio vigente con el negocio.</small></div>}
    {business.productos_destacados && <div><h2>Productos y servicios destacados</h2><p>{business.productos_destacados}</p></div>}
    {business.entregas && <div><h2>Entregas y retiros</h2><p>{business.entregas}</p></div>}
    {business.zona_cobertura && <div><h2>Zona de atención</h2><p>{business.zona_cobertura}</p></div>}
    {business.historia_negocio && <div><span className="section-kicker">DETRÁS DEL MOSTRADOR</span><h2>{business.persona_nombre ? `Conocé a ${business.persona_nombre}` : 'Nuestra historia'}</h2><p>{business.historia_negocio}</p></div>}
  </div>;
}

export function LocalDiscoveries({ businesses }: { businesses: Entry[] }) {
  const today = uruguayDay();
  const week = Math.floor(Date.parse(today) / 604800000);
  const ordered = [...businesses].sort((a,b)=>a.id.localeCompare(b.id));
  const selected = ordered.length ? Array.from({length:Math.min(3,ordered.length)},(_,i)=>ordered[(week+i)%ordered.length]) : [];
  const promotions = businesses.filter(entry=>currentPromotion(entry,today));
  const stories = businesses.filter(entry=>entry.historia_negocio);
  return <>
    {!!selected.length && <section className="weekly-discovery" aria-labelledby="weekly-title"><div className="discovery-heading"><div><span className="section-kicker">UNA SELECCIÓN QUE CAMBIA CADA SEMANA</span><h2 id="weekly-title">Descubrimientos de la semana</h2></div><a href="/eventos/">Planes para el fin de semana <ArrowRight size={16}/></a></div><p className="selection-explainer">Conocé distintas propuestas de la guía. Esta selección rota semanalmente; no es un ranking ni una valoración.</p><div className="discovery-grid">{selected.map(entry=><a key={entry.id} className="discovery-card" href={profile(entry)}>{photo(entry.imagen_url) && <img src={photo(entry.imagen_url)} alt={`Imagen publicada por ${entry.nombre}`} loading="lazy" width="640" height="420"/>}<div><span>{entry.zona || 'URUGUAY'} · {entry.categoria}</span><h3>{entry.nombre}</h3><p>{entry.descripcion.slice(0,140)}</p><b>Conocer el negocio <ArrowRight size={16}/></b></div></a>)}</div></section>}
    {!!promotions.length && <section className="local-promotions" aria-labelledby="promotions-title"><span className="section-kicker">PROPUESTAS CON FECHA</span><h2 id="promotions-title">Beneficios para aprovechar</h2><div className="discovery-grid">{promotions.map(entry=><a className="promotion-card" key={entry.id} href={profile(entry)}><Tag size={20}/><h3>{entry.promocion_titulo}</h3><p>{entry.promocion_detalle}</p><strong>{entry.nombre} · {entry.zona}</strong><small>Vigente hasta {String(entry.promocion_fin).slice(0,10).split('-').reverse().join('/')} inclusive. Consultá condiciones con el comercio.</small><b>Ver propuesta <ArrowRight size={16}/></b></a>)}</div></section>}
    {<section id="historias-negocios" className="merchant-stories" aria-labelledby="merchant-stories-title"><span className="section-kicker">PERSONAS DE NUESTRA ZONA</span><h2 id="merchant-stories-title">Negocios con historia</h2>{!stories.length && <p>Estamos reuniendo historias de quienes dan vida a nuestros barrios. <a href="/publicar/">Proponé la historia de tu negocio gratis →</a></p>}<div className="discovery-grid">{stories.slice(0,3).map(entry=><a className="discovery-card" key={entry.id} href={profile(entry)}>{photo(entry.imagen_url) && <img src={photo(entry.imagen_url)} alt={`Imagen publicada por ${entry.nombre}`} loading="lazy" width="640" height="420"/>}<div><span>{entry.zona}</span><h3>{entry.persona_nombre || entry.nombre}</h3><p>{entry.historia_negocio?.slice(0,160)}</p><b>Leer su historia <ArrowRight size={16}/></b></div></a>)}</div></section>}
  </>;
}

export function Newsletter({ action }: { action: string }) {
  const [opened,setOpened] = useState(false);
  return <section className="newsletter-signup" aria-labelledby="newsletter-title"><Mail size={28}/><div><span className="section-kicker">ESTA SEMANA, CERCA TUYO</span><h2 id="newsletter-title">Un correo para descubrir tu zona</h2><p>Historias, propuestas y beneficios de la guía. Suscripción voluntaria, con confirmación por correo y opción para darte de baja.</p><button type="button" onClick={()=>setOpened(!opened)} aria-expanded={opened}>Quiero recibir el resumen <ArrowRight size={16}/></button>{opened && <form action={action} method="POST" target="_blank"><input type="hidden" name="growth_action" value="subscribe"/><label>Tu correo<input type="email" name="email" required maxLength={160} autoComplete="email"/></label><label>Localidad de interés (opcional)<input name="locality" maxLength={80}/></label><label className="newsletter-consent"><input type="checkbox" name="consent" value="si" required/> Quiero recibir el resumen semanal y leí el <a href="/privacidad/" target="_blank" rel="noopener noreferrer">aviso de privacidad</a>.</label><input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="form-honeypot"/><button type="submit">Enviar solicitud de suscripción</button><p>Se abrirá la confirmación en otra pestaña. La suscripción se activa cuando confirmás el enlace del correo.</p></form>}</div></section>;
}
