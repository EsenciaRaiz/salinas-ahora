'use client';

import { ArrowRight, BriefcaseBusiness, Clock3, Facebook, HeartPulse, Instagram, Linkedin, MapPin, MessageCircle, MoonStar, Search, ShoppingBag, Sparkles, Star, Store, Sun, Utensils, Youtube } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Filter = 'todos' | 'ahora' | 'noche';

type Business = {
  id: string;
  destacado: string;
  plan: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  zona: string;
  telefono: string;
  whatsapp: string;
  sitio_web: string;
  horario_lunes_a_viernes: string;
  horario_sabado: string;
  horario_domingo: string;
  abierto_ahora: string;
  abierto_de_noche: string;
  imagen_url?: string;
  mapa_url?: string;
  texto_destacado?: string;
  orden?: string | number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estilo_tarjeta?: string;
  boton_texto?: string;
};

type Advertisement = {
  id: string;
  anunciante: string;
  titulo: string;
  texto: string;
  imagen_url: string;
  enlace: string;
  tipo_publicidad?: string;
  orden?: string | number;
  fecha_inicio?: string;
  fecha_fin?: string;
};

type PublicData = {
  correcto: boolean;
  negocios: Business[];
  publicidad: Advertisement[];
  configuracion: Record<string, string | number>;
};

const dataUrl = 'https://script.google.com/macros/s/AKfycbybDC2YTJj8oqoclwREuMQxFdd8szCNZprb3WAy6gwb4fjH7KnaIdXJExqNe93yFsejiQ/exec';

const fallbackBusinesses: Business[] = [
  { id: 'SAL001', destacado: 'Sí', plan: 'Destacada', nombre: 'La Esquina Café', categoria: 'Gastronomía', descripcion: 'Café, meriendas y cocina casera', direccion: 'Av. Julieta 1842', zona: 'Salinas', telefono: '', whatsapp: '', sitio_web: '', horario_lunes_a_viernes: '08:00–22:30', horario_sabado: '08:00–22:30', horario_domingo: '08:00–22:30', abierto_ahora: 'Sí', abierto_de_noche: 'Sí' },
  { id: 'SAL002', destacado: 'No', plan: 'Básica', nombre: 'Farmacia del Este', categoria: 'Salud', descripcion: 'Turno extendido todos los días', direccion: 'Ruta Interbalnearia km 38', zona: 'Salinas', telefono: '', whatsapp: '', sitio_web: '', horario_lunes_a_viernes: '09:00–00:00', horario_sabado: '09:00–00:00', horario_domingo: '09:00–00:00', abierto_ahora: 'Sí', abierto_de_noche: 'Sí' },
  { id: 'SAL003', destacado: 'No', plan: 'Básica', nombre: 'Mercado Salinas', categoria: 'Compras', descripcion: 'Almacén, frutas y productos locales', direccion: 'Yaguareté esq. Colón', zona: 'Salinas', telefono: '', whatsapp: '', sitio_web: '', horario_lunes_a_viernes: '08:30–21:00', horario_sabado: '08:30–21:00', horario_domingo: '08:30–21:00', abierto_ahora: 'Sí', abierto_de_noche: 'No' },
  { id: 'SAL004', destacado: 'Sí', plan: 'Destacada', nombre: 'Brasa Costera', categoria: 'Gastronomía', descripcion: 'Parrilla y cocina abierta de noche', direccion: 'Rambla Costanera 612', zona: 'Salinas', telefono: '', whatsapp: '', sitio_web: '', horario_lunes_a_viernes: '19:00–01:30', horario_sabado: '19:00–01:30', horario_domingo: '19:00–01:30', abierto_ahora: 'No', abierto_de_noche: 'Sí' },
];

const fallbackAdvertisements: Advertisement[] = [
  { id: 'UYPROP001', anunciante: 'Ver propiedades en UYProp', titulo: 'Tu próximo hogar puede estar más cerca', texto: 'Explorá casas, apartamentos y oportunidades inmobiliarias en la costa y distintos puntos de Uruguay.', imagen_url: 'https://drive.google.com/thumbnail?id=1v6yBiX6XpKAzdE9NOKMWRo0o1eoX7dY-&sz=w900', enlace: 'https://uyprop.com/#propiedades' },
];

const yes = (value: string) => ['si', 'sí', 'true', '1'].includes(String(value || '').trim().toLowerCase());

function businessStyle(category: string, index: number) {
  const normalized = category.toLowerCase();
  if (normalized.includes('gastronom')) return { icon: Utensils, color: 'coral' };
  if (normalized.includes('salud')) return { icon: HeartPulse, color: 'blue' };
  if (normalized.includes('compra')) return { icon: ShoppingBag, color: 'yellow' };
  if (normalized.includes('servicio')) return { icon: BriefcaseBusiness, color: 'navy' };
  return { icon: Store, color: ['coral', 'blue', 'yellow', 'navy'][index % 4] };
}

function businessHours(business: Business) {
  const day = new Date().getDay();
  if (day === 0) return business.horario_domingo || 'Horario a consultar';
  if (day === 6) return business.horario_sabado || 'Horario a consultar';
  return business.horario_lunes_a_viernes || 'Horario a consultar';
}

function businessLink(business: Business) {
  if (business.sitio_web) return business.sitio_web;
  const whatsapp = business.whatsapp.replace(/\D/g, '');
  if (whatsapp) return `https://wa.me/${whatsapp}`;
  const phone = business.telefono.replace(/\D/g, '');
  return phone ? `tel:${phone}` : '';
}

function driveImage(value?: string) { const source=String(value||'').trim(); if(!source) return ''; const match=source.match(/(?:\/d\/|[?&]id=)([-\w]{20,})/); return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200` : source; }
function businessMapLink(business: Business) { const custom=String(business.mapa_url||'').trim(); if(custom) return custom; const query=[business.direccion,business.zona,'Uruguay'].filter(Boolean).join(', '); return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : ''; }
function activeByDate(item:{fecha_inicio?:string;fecha_fin?:string}) { const today=new Date().toISOString().slice(0,10); return (!item.fecha_inicio||item.fecha_inicio<=today)&&(!item.fecha_fin||item.fecha_fin>=today); }
function orderOf(item:{orden?:string|number}) { const value=Number(item.orden); return Number.isFinite(value)&&value>0?value:9999; }
function featuredBusiness(business:Business) { return yes(business.destacado)||String(business.plan||'').toLowerCase().includes('destac'); }

export default function Home() {
  const [filter, setFilter] = useState<Filter>('todos');
  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>(fallbackBusinesses);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(fallbackAdvertisements);
  const [configuration, setConfiguration] = useState<Record<string, string | number>>({});
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(dataUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo actualizar la guía');
        return response.json() as Promise<PublicData>;
      })
      .then((data) => {
        if (!data.correcto || !Array.isArray(data.negocios)) return;
        setBusinesses(data.negocios);
        setAdvertisements(Array.isArray(data.publicidad) && data.publicidad.length > 0 ? data.publicidad : fallbackAdvertisements);
        setConfiguration(data.configuracion || {});
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => { const updateEdition=()=>{ const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:'America/Montevideo'}).format(new Date())); setIsNight(hour>=19||hour<7); }; updateEdition(); const timer=window.setInterval(updateEdition,60000); return()=>window.clearInterval(timer); }, []);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: object, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'filter_local_businesses',
      title: 'Filtrar comercios locales',
      description: 'Actualiza la guía visible para mostrar todos los comercios, los abiertos ahora o los que atienden de noche.',
      inputSchema: { type: 'object', properties: { schedule: { type: 'string', enum: ['todos', 'ahora', 'noche'] } }, required: ['schedule'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const schedule = (input as { schedule?: string })?.schedule;
        if (!['todos', 'ahora', 'noche'].includes(schedule || '')) throw new Error('Horario no válido');
        setFilter(schedule as Filter);
        return { filter: schedule, status: 'updated' };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(businesses.map((business) => business.categoria).filter(Boolean)))], [businesses]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return businesses.filter((business) => {
      if (!activeByDate(business)) return false;
      const matchesFilter = filter === 'todos' || (filter === 'ahora' && yes(business.abierto_ahora)) || (filter === 'noche' && yes(business.abierto_de_noche));
      const matchesCategory = category === 'Todos' || business.categoria === category;
      const matchesQuery = !normalized || `${business.nombre} ${business.categoria} ${business.descripcion} ${business.zona}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesCategory && matchesQuery;
    });
  }, [businesses, category, filter, query]);

  const featuredVisible=useMemo(()=>visible.filter(featuredBusiness).sort((a,b)=>orderOf(a)-orderOf(b)),[visible]);
  const basicVisible=useMemo(()=>visible.filter((business)=>!featuredBusiness(business)).sort((a,b)=>orderOf(a)-orderOf(b)),[visible]);
  const activeAdvertisements=useMemo(()=>advertisements.filter(activeByDate).sort((a,b)=>orderOf(a)-orderOf(b)),[advertisements]);
  const nightCount = businesses.filter((business) => yes(business.abierto_de_noche)).length;
  const email = String(configuration.EMAIL_PUBLICAR || 'contacto@vitrinacerca.com');
  const currency = String(configuration.MONEDA || 'UYU');
  const basicPrice = String(configuration.PRECIO_BASICA || 190);
  const featuredPrice = String(configuration.PRECIO_DESTACADA || 490);
  const footerText = String(configuration.TEXTO_PIE || 'Guía independiente de comercios, servicios e historias locales.');
  const premiumPrice=String(configuration.PRECIO_PREMIUM||990);
  const basicDetail=String(configuration.DETALLE_BASICA||'Ficha en la guía, foto, datos, horarios, contacto y mapa.');
  const featuredDetail=String(configuration.DETALLE_DESTACADA||'Prioridad, mayor tamaño, sello destacado y presencia en selecciones.');
  const premiumDetail=String(configuration.DETALLE_PREMIUM||'Portada editorial, campaña visual y ubicación publicitaria preferente.');
  const heroTitle=String(configuration.HERO_TITULO||'Tu zona, a mano.');
  const heroText=String(configuration.HERO_TEXTO||'Descubrí dónde comprar, comer y resolver lo cotidiano. También cuando cae la noche.');
  const whatsappPublicar=String(configuration.WHATSAPP_PUBLICAR||'').replace(/\D/g,'');
  const socialLinks=[{key:'instagram',label:'Instagram',url:String(configuration.INSTAGRAM_URL||''),icon:Instagram},{key:'facebook',label:'Facebook',url:String(configuration.FACEBOOK_URL||''),icon:Facebook},{key:'linkedin',label:'LinkedIn',url:String(configuration.LINKEDIN_URL||''),icon:Linkedin},{key:'youtube',label:'YouTube',url:String(configuration.YOUTUBE_URL||''),icon:Youtube},{key:'whatsapp',label:'WhatsApp',url:whatsappPublicar?`https://wa.me/${whatsappPublicar}`:'',icon:MessageCircle}].filter((item)=>item.url);
  const renderBusinessCard=(business:Business,index:number,featured=false)=>{ const style=businessStyle(business.categoria,index); const Icon=style.icon; const href=businessLink(business); const mapHref=businessMapLink(business); const image=driveImage(business.imagen_url); const open=yes(business.abierto_ahora); return <article className={`business-card ${style.color} ${featured?'featured-business':''} ${String(business.estilo_tarjeta||'').toLowerCase()}`} key={business.id||business.nombre}>{image&&<img className="business-photo" src={image} alt={`Imagen de ${business.nombre}`} loading="lazy"/>}<div className="card-top"><span className="business-icon"><Icon size={22}/></span>{featured&&<span className="sponsored"><Star size={13}/> Destacado</span>}</div><span className="card-category">{business.categoria}</span><h3>{business.nombre}</h3><p>{featured&&business.texto_destacado?business.texto_destacado:business.descripcion}</p><div className="hours"><span className={open?'open':'later'}>{business.abierto_ahora?(open?'Abierto ahora':'Cerrado ahora'):'Horario a consultar'}</span><strong><Clock3 size={15}/> {businessHours(business)}</strong></div><div className="address"><MapPin size={15}/> {business.direccion||business.zona||'Tu zona'}</div><div className="card-actions">{href?<a className="details" href={href} target="_blank" rel="noreferrer">{business.boton_texto||'Ver más'} <ArrowRight size={16}/></a>:<span className="details">Ver más</span>}{mapHref&&<a className="map-link" href={mapHref} target="_blank" rel="noreferrer"><MapPin size={15}/> Cómo llegar</a>}</div></article>; };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Vitrina Cerca, inicio"><span className="brand-symbol">{isNight ? <MoonStar size={24} /> : <Sun size={24} />}</span><span>VITRINA</span><strong>CERCA</strong></a>
        <nav aria-label="Navegación principal"><a href="#guia">Guía local</a><a href="#historias">Historias</a><a href="#publicar">Publicar</a></nav>
        <a className="header-cta" href="#publicar">Sumá tu negocio</a>
      </header>

      <section className="hero" id="inicio">
        <img src="/salinas-atardecer.png" alt="Comercios de una zona costera al atardecer" />
        <div className="hero-overlay" />
        <div className="hero-copy"><span className="eyebrow"><MapPin size={15} /> Uruguay · cerca de vos</span><h1>{heroTitle}</h1><p>{heroText}</p></div>
        <div className={`hero-status ${isNight ? 'night' : 'day'}`}><span>{isNight ? <MoonStar size={18} /> : <Sun size={18} />} {isNight ? 'Edición nocturna' : 'Edición diurna'}</span><strong>{isNight ? `${nightCount} lugares abiertos hasta tarde` : 'Descubrí lo mejor de tu zona'}</strong></div>
      </section>

      <section className="finder" id="guia" aria-labelledby="finder-title">
        <div className="finder-heading"><div><span className="section-kicker">GUÍA LOCAL EN TIEMPO REAL</span><h2 id="finder-title">¿Qué necesitás hoy?</h2></div><label className="search-box"><Search size={20} /><input type="search" placeholder="Buscar comercio o servicio" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
        <div className="quick-filters" aria-label="Filtrar por horario">
          <button className={filter === 'ahora' ? 'active' : ''} onClick={() => setFilter('ahora')}><span className="live-dot" /> Abierto ahora</button>
          <button className={filter === 'noche' ? 'active' : ''} onClick={() => setFilter('noche')}><MoonStar size={17} /> Abierto de noche</button>
          <button className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Ver todos</button>
        </div>
        <div className="category-row" aria-label="Filtrar por categoría">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>

        {featuredVisible.length > 0 && <section className="featured-section" aria-labelledby="featured-title"><div className="featured-heading"><span className="section-kicker">SELECCIÓN EDITORIAL</span><h2 id="featured-title">Destacados de la semana</h2><p>Negocios con mayor visibilidad y propuestas elegidas para descubrir primero.</p></div><div className="featured-grid">{featuredVisible.map((business,index)=>renderBusinessCard(business,index,true))}</div></section>}

        <div className="guide-layout">
          <div><div className="guide-subheading"><span className="section-kicker">DIRECTORIO LOCAL</span><h2>Todos los negocios</h2></div><div className="business-grid">{basicVisible.map((business,index)=>renderBusinessCard(business,index,false))}{visible.length===0&&<div className="empty-state"><Search size={28}/><h3>No encontramos coincidencias</h3><p>Probá otra categoría o buscá con menos palabras.</p></div>}</div></div>

          <aside className="ad-column" aria-label="Espacios patrocinados">
            {activeAdvertisements.length > 0 ? activeAdvertisements.map((ad) => <article className={`ad-card ${ad.imagen_url ? 'ad-card-media' : ''}`} key={ad.id || ad.anunciante}>{ad.imagen_url && <img src={ad.imagen_url} alt={ad.titulo || ad.anunciante} loading="lazy" />}<div className="ad-card-content"><span>PUBLICACIÓN PATROCINADA</span><h3>{ad.titulo}</h3><p>{ad.texto}</p><a href={ad.enlace || '#publicar'} target={ad.enlace ? '_blank' : undefined} rel={ad.enlace ? 'noreferrer' : undefined}>{ad.anunciante} <ArrowRight size={15} /></a></div></article>) : <div className="ad-card"><span>ESPACIO LOCAL</span><h3>Tu negocio puede estar acá</h3><p>Una presencia visible para vecinos que ya están buscando dónde comprar.</p><a href="#publicar">Conocer opciones <ArrowRight size={15} /></a></div>}
            <div className="night-note"><MoonStar size={24} /><strong>Tu zona de noche</strong><p>Una selección útil de gastronomía, farmacias y servicios con horario extendido.</p></div>
          </aside>
        </div>
      </section>

      <section className="editorial" id="historias"><div className="editorial-number">01</div><div><span className="section-kicker light">HISTORIAS DEL LUGAR</span><h2>Los comercios que hacen barrio.</h2></div><p>Retratos breves de emprendedores, oficios y rincones que construyen la identidad de cada comunidad.</p><a href="#guia">Leer la edición <ArrowRight size={18} /></a></section>

      <section className="pricing" id="publicar"><div className="pricing-intro"><span className="section-kicker">PLANES DE PUBLICACIÓN</span><h2>{String(configuration.TITULO_PLANES||'Elegí cómo mostrar tu negocio')}</h2><p>{String(configuration.SUBTITULO_PLANES||'Opciones claras para cada etapa, sin ocupar la portada.')}</p></div><div className="plans three-plans"><article><span>FICHA BÁSICA</span><h3>{currency} {basicPrice} <small>/ mes</small></h3><p>{basicDetail}</p><a href={whatsappPublicar?`https://wa.me/${whatsappPublicar}?text=Quiero%20publicar%20una%20ficha%20básica`:`mailto:${email}?subject=Quiero publicar mi negocio`}>Elegir básica</a></article><article className="featured-plan"><span><Sparkles size={15}/> DESTACADA</span><h3>{currency} {featuredPrice} <small>/ mes</small></h3><p>{featuredDetail}</p><a href={whatsappPublicar?`https://wa.me/${whatsappPublicar}?text=Quiero%20una%20publicación%20destacada`:`mailto:${email}?subject=Quiero destacar mi negocio`}>Quiero destacar</a></article><article className="premium-plan"><span><Star size={15}/> PREMIUM</span><h3>{currency} {premiumPrice} <small>/ mes</small></h3><p>{premiumDetail}</p><a href={whatsappPublicar?`https://wa.me/${whatsappPublicar}?text=Quiero%20publicidad%20premium`:`mailto:${email}?subject=Quiero publicidad premium`}>Consultar premium</a></article></div></section>

      <footer><div className="footer-main"><div className="brand footer-brand"><span className="brand-dot"/><span>VITRINA</span><strong>CERCA</strong></div><p>{footerText}</p>{socialLinks.length>0&&<nav className="social-links" aria-label="Redes sociales">{socialLinks.map(({key,label,url,icon:SocialIcon})=><a key={key} href={url} target="_blank" rel="noreferrer" aria-label={label} title={label}><SocialIcon size={19}/></a>)}</nav>}</div><div className="footer-strip"><span>Apoyá lo local, hacemos un mejor Uruguay ♡</span><strong>Negocios reales · Comunidad que crece · Un Uruguay más cerca</strong><span>© {new Date().getFullYear()} Vitrina Cerca</span></div></footer>
    </main>
  );
}
