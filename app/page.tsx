'use client';

import { ArrowRight, BriefcaseBusiness, Clock3, HeartPulse, MapPin, MessageCircle, MoonStar, Search, ShoppingBag, Sparkles, Star, Store, Sun, Utensils } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { hasKnownHours, hoursLabel, isOpenNow, montevideoClock, openInPeriod, type TimeFilter } from './schedule';

type Business = {
  id: string;
  destacado: string;
  plan: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  zona: string;
  departamento?: string;
  departamento_region?: string;
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
const businessFormUrl = 'https://script.google.com/macros/s/AKfycbzwe6W8twxuZ41hr2yipctyKBoqXNapkqOBLlXsurCA9aaWrm4RUr1uGYk6hIOTDx8a/exec';

const demonstrationIds = new Set(['SAL001', 'SAL002', 'SAL003', 'SAL004']);

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
  return hoursLabel(business, montevideoClock().day);
}

function driveImage(value?: string) { const source=String(value||'').trim(); if(!source) return ''; const match=source.match(/(?:\/d\/|[?&]id=)([-\w]{20,})/); return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200` : source; }
function businessMapLink(business: Business) {
  const custom = String(business.mapa_url || '').trim();
  if (!custom) return '';
  try {
    const url = new URL(custom);
    if (url.protocol !== 'https:' || !['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'www.openstreetmap.org'].includes(url.hostname)) return '';
    return url.toString();
  } catch { return ''; }
}
function activeByDate(item:{fecha_inicio?:string;fecha_fin?:string}) { const today=new Date().toISOString().slice(0,10); return (!item.fecha_inicio||item.fecha_inicio<=today)&&(!item.fecha_fin||item.fecha_fin>=today); }
function orderOf(item:{orden?:string|number}) { const value=Number(item.orden); return Number.isFinite(value)&&value>0?value:9999; }
function featuredBusiness(business:Business) { return yes(business.destacado)||String(business.plan||'').toLowerCase().includes('destac'); }
type Coordinates = { latitude: number; longitude: number };
function businessCoordinates(business: Business): Coordinates | null {
  const map = businessMapLink(business);
  if (!map) return null;
  try {
    const url = new URL(map);
    const value = url.searchParams.get('query') || url.searchParams.get('q') || url.searchParams.get('ll') || '';
    const match = value.match(/^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/)
      || url.pathname.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
    if (!match) return null;
    const latitude = Number(match[1]), longitude = Number(match[2]);
    return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
  } catch { return null; }
}
function distanceKm(a: Coordinates, b: Coordinates) {
  const radians = Math.PI / 180;
  const angle = (b.latitude-a.latitude)*radians, sideways = (b.longitude-a.longitude)*radians;
  const arc = Math.sin(angle/2)**2 + Math.cos(a.latitude*radians)*Math.cos(b.latitude*radians)*Math.sin(sideways/2)**2;
  return 12742*Math.asin(Math.sqrt(arc));
}

export default function Home() {
  const [filter, setFilter] = useState<TimeFilter>('todos');
  const [category, setCategory] = useState('Todos');
  const [department, setDepartment] = useState('');
  const [query, setQuery] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [configuration, setConfiguration] = useState<Record<string, string | number>>({});
  const [isNight, setIsNight] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [visitorLocation, setVisitorLocation] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(dataUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo actualizar la guía');
        return response.json() as Promise<PublicData>;
      })
      .then((data) => {
        if (!data.correcto || !Array.isArray(data.negocios)) throw new Error('Datos incompletos');
        setBusinesses(data.negocios.filter((business) => !demonstrationIds.has(business.id)));
        setAdvertisements(Array.isArray(data.publicidad) ? data.publicidad : []);
        setConfiguration(data.configuracion || {});
        setDataStatus('ready');
      })
      .catch(() => setDataStatus('error'));
    return () => controller.abort();
  }, []);

  useEffect(() => { const updateEdition=()=>{ const hour=Math.floor(montevideoClock().minute/60); setIsNight(hour>=20||hour<7); setClockTick((value)=>value+1); }; updateEdition(); const timer=window.setInterval(updateEdition,60000); return()=>window.clearInterval(timer); }, []);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: object, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'filter_local_businesses',
      title: 'Filtrar comercios locales',
      description: 'Actualiza la guía visible para mostrar comercios por franja horaria.',
      inputSchema: { type: 'object', properties: { schedule: { type: 'string', enum: ['todos', 'ahora', 'manana', 'tarde', 'noche'] } }, required: ['schedule'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const schedule = (input as { schedule?: string })?.schedule;
        if (!['todos', 'ahora', 'manana', 'tarde', 'noche'].includes(schedule || '')) throw new Error('Horario no válido');
        setFilter(schedule as TimeFilter);
        return { filter: schedule, status: 'updated' };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(businesses.map((business) => business.categoria).filter(Boolean)))], [businesses]);
  const departments = ['Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida','Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro','Rivera','Rocha','Salto','San José','Soriano','Tacuarembó','Treinta y Tres'];
  const clock = useMemo(() => montevideoClock(), [clockTick]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return businesses.filter((business) => {
      if (!activeByDate(business)) return false;
      const matchesFilter = filter === 'todos' || (filter === 'ahora' ? isOpenNow(business, clock) : openInPeriod(business, clock, filter));
      const matchesCategory = category === 'Todos' || business.categoria === category;
      const region = business.departamento || business.departamento_region || '';
      const matchesDepartment = !department || region.toLocaleLowerCase('es-UY') === department.toLocaleLowerCase('es-UY');
      const matchesQuery = !normalized || `${business.nombre} ${business.categoria} ${business.descripcion} ${business.zona} ${region}`.toLocaleLowerCase('es-UY').includes(normalized);
      return matchesFilter && matchesCategory && matchesDepartment && matchesQuery;
    });
  }, [businesses, category, department, filter, query, clock]);

  const byDistance = (a: Business, b: Business) => {
    if (!visitorLocation) return orderOf(a)-orderOf(b);
    const aCoords = businessCoordinates(a), bCoords = businessCoordinates(b);
    const aDistance = aCoords ? distanceKm(visitorLocation,aCoords) : Infinity;
    const bDistance = bCoords ? distanceKm(visitorLocation,bCoords) : Infinity;
    return aDistance-bDistance || orderOf(a)-orderOf(b);
  };
  const featuredVisible=useMemo(()=>visible.filter(featuredBusiness).sort(byDistance),[visible,visitorLocation]);
  const basicVisible=useMemo(()=>visible.filter((business)=>!featuredBusiness(business)).sort(byDistance),[visible,visitorLocation]);
  const activeAdvertisements=useMemo(()=>advertisements.filter(activeByDate).sort((a,b)=>orderOf(a)-orderOf(b)),[advertisements]);
  const nightCount = businesses.filter((business) => openInPeriod(business, clock, 'noche')).length;
  const email = String(configuration.EMAIL_PUBLICAR || 'contacto@vitrinacerca.com');
  const currency = String(configuration.MONEDA || 'UYU');
  const basicPrice = String(configuration.PRECIO_BASICA || 190);
  const featuredPrice = String(configuration.PRECIO_DESTACADA || 490);
  const footerText = String(configuration.TEXTO_PIE || 'Guía independiente de comercios, servicios e historias locales.');
  const premiumPrice=String(configuration.PRECIO_PREMIUM||990);
  const basicDetail=String(configuration.DETALLE_BASICA||'Ficha en la guía, foto, datos, horarios, contacto y mapa opcional.');
  const featuredDetail=String(configuration.DETALLE_DESTACADA||'Prioridad, mayor tamaño, sello destacado y presencia en selecciones.');
  const premiumDetail=String(configuration.DETALLE_PREMIUM||'Portada editorial, campaña visual y ubicación publicitaria preferente.');
  const heroTitle=String(configuration.HERO_TITULO||'Tu zona, a mano.');
  const heroText=String(configuration.HERO_TEXTO||'Descubrí dónde comprar, comer y resolver lo cotidiano. También cuando cae la noche.');
  const whatsappPublicar=String(configuration.WHATSAPP_PUBLICAR||'').replace(/\D/g,'');
  const socialLinks=[{key:'instagram',label:'Instagram',url:String(configuration.INSTAGRAM_URL||''),mark:'IG'},{key:'facebook',label:'Facebook',url:String(configuration.FACEBOOK_URL||''),mark:'f'},{key:'linkedin',label:'LinkedIn',url:String(configuration.LINKEDIN_URL||''),mark:'in'},{key:'youtube',label:'YouTube',url:String(configuration.YOUTUBE_URL||''),mark:'▶'},{key:'whatsapp',label:'WhatsApp',url:whatsappPublicar?`https://wa.me/${whatsappPublicar}`:'',mark:'WA'}].filter((item)=>item.url);
  const locateVisitor = () => {
    if (!navigator.geolocation) { setLocationMessage('Tu dispositivo no permite usar la ubicación.'); return; }
    setLocationMessage('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setVisitorLocation({ latitude: coords.latitude, longitude: coords.longitude }); setLocationMessage('Mostramos primero los negocios con ubicación precisa más cercanos a vos.'); },
      () => setLocationMessage('No pudimos acceder a tu ubicación. Podés seguir buscando por departamento.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };
  const renderBusinessCard = (business: Business, index: number, featured = false) => {
    const style = businessStyle(business.categoria, index);
    const Icon = style.icon;
    const mapHref = businessMapLink(business);
    const image = driveImage(business.imagen_url);
    const open = isOpenNow(business, clock);
    const known = hasKnownHours(business, clock.day);
    const phone = String(business.telefono || '').replace(/\D/g, '');
    const whatsapp = String(business.whatsapp || '').replace(/\D/g, '');
    const region = business.departamento || business.departamento_region || '';
    const site = /^https?:\/\//i.test(business.sitio_web || '') ? business.sitio_web : '';
    return <article className={`business-card ${style.color} ${featured ? 'featured-business' : ''} ${String(business.estilo_tarjeta || '').toLowerCase()}`} key={business.id || business.nombre}>
      {image && <img className="business-photo" src={image} alt={`Imagen de ${business.nombre}`} loading="lazy" />}
      <div className="card-top"><span className="business-icon"><Icon size={22} /></span>{featured && <span className="sponsored"><Star size={13} /> Destacado</span>}</div>
      <span className="card-category">{business.categoria}</span>
      <h3>{business.nombre}</h3>
      <p>{featured && business.texto_destacado ? business.texto_destacado : business.descripcion}</p>
      <div className="hours"><span className={open ? 'open' : 'later'}>{open ? 'Abierto ahora' : known ? 'Cerrado ahora' : 'Horario a consultar'}</span><strong><Clock3 size={15} /> {businessHours(business)}</strong></div>
      <div className="address"><MapPin size={15} /> {[business.zona, region].filter(Boolean).join(' · ') || 'Uruguay'}</div>
      <div className="card-actions">
        {whatsapp.length >= 8 && <a className="details" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp <ArrowRight size={16} /></a>}
        {phone.length >= 8 && <a className="details" href={`tel:${phone}`}>Llamar <ArrowRight size={16} /></a>}
        {site && <a className="details" href={site} target="_blank" rel="noreferrer">Sitio web <ArrowRight size={16} /></a>}
        {mapHref && <a className="map-link" href={mapHref} target="_blank" rel="noreferrer"><MapPin size={15} /> Ver en el mapa</a>}
      </div>
    </article>;
  };

  return (
    <main className={isNight ? 'night-mode' : 'day-mode'}>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Vitrina Cerca, inicio"><span className="brand-symbol">{isNight ? <MoonStar size={24} /> : <Sun size={24} />}</span><span>VITRINA</span><strong>CERCA</strong></a>
        <nav aria-label="Navegación principal"><a href="#guia">Guía local</a><a href="#historias">Historias</a><a href="#publicar">Publicar</a></nav>
        <a className="header-cta" href={businessFormUrl}>Sumá tu negocio</a>
      </header>

      <section className="hero" id="inicio">
        <img src="/salinas-atardecer.png" alt="Comercios de una zona costera al atardecer" />
        <div className="hero-overlay" />
        <div className="hero-copy"><span className="eyebrow"><MapPin size={15} /> Uruguay · cerca de vos</span><h1>{heroTitle}</h1><p>{heroText}</p></div>
        <div className={`hero-status ${isNight ? 'night' : 'day'}`}><span>{isNight ? <MoonStar size={18} /> : <Sun size={18} />} {isNight ? 'Edición nocturna' : 'Edición diurna'}</span><strong>{isNight ? `${nightCount} lugares abiertos hasta tarde` : 'Descubrí lo mejor de tu zona'}</strong></div>
      </section>

      <section className="finder" id="guia" aria-labelledby="finder-title">
        <form className="finder-form" onSubmit={(event) => { event.preventDefault(); document.getElementById('listado')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <label>¿Qué estás buscando?<input type="search" placeholder="Ej.: farmacia, peluquería" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label>¿En qué departamento?<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Todo Uruguay</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>¿En qué horario?<select value={filter} onChange={(event) => setFilter(event.target.value as TimeFilter)}><option value="todos">Cualquier horario</option><option value="ahora">Abiertos ahora</option><option value="manana">Hoy de mañana · 6 a 12</option><option value="tarde">Hoy de tarde · 12 a 20</option><option value="noche">Hoy de noche · 20 a 6</option></select></label>
          <button type="submit"><Search size={19} /> Buscar</button>
        </form>
        <div className="finder-heading"><div><span className="section-kicker">GUÍA LOCAL DE URUGUAY</span><h2 id="finder-title">¿Qué necesitás hoy?</h2><p>Buscá por negocio, lugar y horario. Los destacados aparecen primero.</p></div></div>
        <p className="finder-note">Los horarios publicados son habituales y pueden cambiar en feriados. «Abiertos ahora» se calcula con la hora de Uruguay.</p>
        <div className="proximity"><button type="button" onClick={locateVisitor}><MapPin size={17}/> {visitorLocation ? 'Actualizar mi ubicación' : 'Buscar cerca de mí'}</button><span role="status">{locationMessage || 'La ubicación es opcional. Se usa solo para ordenar esta búsqueda.'}</span></div>
        <div className="category-row" aria-label="Filtrar por categoría">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>

        <div id="listado" className="result-count" aria-live="polite">{dataStatus === 'loading' ? 'Cargando negocios…' : `${visible.length} ${visible.length === 1 ? 'negocio encontrado' : 'negocios encontrados'}`}</div>
        {featuredVisible.length > 0 && <section className="featured-section" aria-labelledby="featured-title"><div className="featured-heading"><span className="section-kicker">NEGOCIOS DESTACADOS</span><h2 id="featured-title">Destacados</h2><p>Negocios que aparecen primero en la guía.</p></div><div className="featured-grid">{featuredVisible.map((business,index)=>renderBusinessCard(business,index,true))}</div></section>}

        <div className="guide-layout">
          <div><div className="guide-subheading"><span className="section-kicker">DIRECTORIO LOCAL</span><h2>Todos los negocios</h2></div><div className="business-grid">{basicVisible.map((business,index)=>renderBusinessCard(business,index,false))}{visible.length===0&&<div className="empty-state"><Search size={28}/><h3>{dataStatus === 'loading' ? 'Cargando la guía' : dataStatus === 'error' ? 'No pudimos cargar la guía' : 'No encontramos coincidencias'}</h3><p>{dataStatus === 'error' ? 'Probá de nuevo en unos minutos.' : dataStatus === 'loading' ? 'Un momento, por favor.' : 'Probá otra categoría, horario o departamento.'}</p></div>}</div></div>

          <aside className="ad-column" aria-label="Espacios patrocinados">
            {activeAdvertisements.length > 0 ? activeAdvertisements.map((ad) => <article className={`ad-card ${ad.imagen_url ? 'ad-card-media' : ''}`} key={ad.id || ad.anunciante}>{ad.imagen_url && <img src={ad.imagen_url} alt={ad.titulo || ad.anunciante} loading="lazy" />}<div className="ad-card-content"><span>PUBLICACIÓN PATROCINADA</span><h3>{ad.titulo}</h3><p>{ad.texto}</p><a href={ad.enlace || '#publicar'} target={ad.enlace ? '_blank' : undefined} rel={ad.enlace ? 'noreferrer' : undefined}>{ad.anunciante} <ArrowRight size={15} /></a></div></article>) : <div className="ad-card"><span>ESPACIO LOCAL</span><h3>Tu negocio puede estar acá</h3><p>Una presencia visible para vecinos que ya están buscando dónde comprar.</p><a href="#publicar">Conocer opciones <ArrowRight size={15} /></a></div>}
            <div className="night-note"><MoonStar size={24} /><strong>Tu zona de noche</strong><p>Una selección útil de gastronomía, farmacias y servicios con horario extendido.</p></div>
          </aside>
        </div>
      </section>

      <section className="editorial" id="historias"><div className="editorial-number">01</div><div><span className="section-kicker light">HISTORIAS DEL LUGAR</span><h2>Los comercios que hacen barrio.</h2></div><p>Retratos breves de emprendedores, oficios y rincones que construyen la identidad de cada comunidad.</p><a href="#guia">Leer la edición <ArrowRight size={18} /></a></section>

      <section className="pricing" id="publicar"><div className="pricing-intro"><span className="section-kicker">PLANES DE PUBLICACIÓN</span><h2>{String(configuration.TITULO_PLANES||'Elegí cómo mostrar tu negocio')}</h2><p>{String(configuration.SUBTITULO_PLANES||'Opciones claras para cada etapa, sin ocupar la portada.')}</p></div><div className="plans three-plans"><article><span>FICHA BÁSICA</span><h3>{currency} {basicPrice} <small>/ mes</small></h3><p>{basicDetail}</p><a href={businessFormUrl}>Completar ficha</a></article><article className="featured-plan"><span><Sparkles size={15}/> DESTACADA</span><h3>{currency} {featuredPrice} <small>/ mes</small></h3><p>{featuredDetail}</p><a href={whatsappPublicar?`https://wa.me/${whatsappPublicar}?text=Quiero%20una%20publicación%20destacada`:`mailto:${email}?subject=Quiero destacar mi negocio`}>Quiero destacar</a></article><article className="premium-plan"><span><Star size={15}/> PREMIUM</span><h3>{currency} {premiumPrice} <small>/ mes</small></h3><p>{premiumDetail}</p><a href={whatsappPublicar?`https://wa.me/${whatsappPublicar}?text=Quiero%20publicidad%20premium`:`mailto:${email}?subject=Quiero publicidad premium`}>Consultar premium</a></article></div></section>

      <footer><div className="footer-main"><div className="brand footer-brand"><span className="brand-dot"/><span>VITRINA</span><strong>CERCA</strong></div><p>{footerText}</p>{socialLinks.length>0&&<nav className="social-links" aria-label="Redes sociales">{socialLinks.map(({key,label,url,mark})=><a key={key} href={url} target="_blank" rel="noreferrer" aria-label={label} title={label}><span aria-hidden="true">{mark}</span></a>)}</nav>}</div><div className="footer-strip"><span>Apoyá lo local, hacemos un mejor Uruguay ♡</span><strong>Negocios reales · Comunidad que crece · Un Uruguay más cerca</strong><span>© {new Date().getFullYear()} Vitrina Cerca</span></div></footer>
    </main>
  );
}
