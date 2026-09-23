'use client';

import { ArrowRight, BriefcaseBusiness, Clock3, HeartPulse, MapPin, MessageCircle, MoonStar, Phone, Search, ShoppingBag, Sparkles, Star, Store, Sun, Utensils } from 'lucide-react';
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
const businessUrl = (business: Business) => `https://vitrinacerca.com/?negocio=${encodeURIComponent(business.id)}`;
type ContactAction = 'whatsapp' | 'telefono' | 'sitio' | 'mapa';
function recordContact(business: Business, action: ContactAction) {
  if (!business.id) return;
  const parameters = new URLSearchParams({ metric: 'contacto', id: business.id, action });
  void fetch(`${businessFormUrl}?${parameters.toString()}`, { mode: 'no-cors', keepalive: true }).catch(() => undefined);
}

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

function driveImage(value?: string, width=1200) { const source=String(value||'').split('|')[0].trim(); if(!source) return ''; const match=source.match(/(?:\/d\/|[?&]id=)([-\w]{20,})/); return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${width}` : source; }
function businessImages(value?: string, width=1200) { return String(value||'').split('|').map((item)=>driveImage(item,width)).filter(Boolean).slice(0,4); }
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
  const [locality, setLocality] = useState('');
  const [query, setQuery] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [configuration, setConfiguration] = useState<Record<string, string | number>>({});
  const [isNight, setIsNight] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [profileId] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('negocio') || '');
  const [showPlans] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('planes') === '1');
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [visitorLocation, setVisitorLocation] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [locationPromptPending, setLocationPromptPending] = useState(false);

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

  const matchingBusiness = (business: Business, options: { time?: boolean; category?: boolean; department?: boolean; locality?: boolean } = {}) => {
    if (!activeByDate(business)) return false;
    const normalized = query.trim().toLocaleLowerCase('es-UY');
    const region = business.departamento || business.departamento_region || '';
    return (!options.time || filter === 'todos' || (filter === 'ahora' ? isOpenNow(business, clock) : openInPeriod(business, clock, filter)))
      && (!options.category || category === 'Todos' || business.categoria === category)
      && (!options.department || !department || region.toLocaleLowerCase('es-UY') === department.toLocaleLowerCase('es-UY'))
      && (!options.locality || !locality || String(business.zona || '').trim().toLocaleLowerCase('es-UY') === locality.toLocaleLowerCase('es-UY'))
      && (!normalized || `${business.nombre} ${business.categoria} ${business.descripcion} ${business.zona} ${region}`.toLocaleLowerCase('es-UY').includes(normalized));
  };
  const profile = useMemo(() => businesses.find((business) => business.id === profileId && activeByDate(business)), [businesses,profileId]);
  useEffect(() => {
    if (!profile) return;
    const oldTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const oldDescription = description?.content || '';
    const oldCanonical = canonical?.href || '';
    document.title = `${profile.nombre} en Vitrina Cerca | ${profile.zona || 'Uruguay'}`;
    description?.setAttribute('content', profile.descripcion);
    canonical?.setAttribute('href', businessUrl(profile));
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'business-schema';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'LocalBusiness',
      name: profile.nombre, description: profile.descripcion, url: businessUrl(profile),
      ...(profile.imagen_url ? { image: driveImage(profile.imagen_url) } : {}),
      ...(profile.telefono ? { telephone: profile.telefono } : {}),
      address: { '@type': 'PostalAddress', addressLocality: profile.zona, addressRegion: profile.departamento || profile.departamento_region, addressCountry: 'UY',
        ...(profile.mapa_url && profile.direccion ? { streetAddress: profile.direccion } : {}) },
    });
    document.head.appendChild(script);
    return () => { document.title = oldTitle; description?.setAttribute('content', oldDescription); canonical?.setAttribute('href', oldCanonical); script.remove(); };
  }, [profile]);
  const departments = ['Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida','Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro','Rivera','Rocha','Salto','San José','Soriano','Tacuarembó','Treinta y Tres'];
  const clock = useMemo(() => montevideoClock(), [clockTick]);
  const categories = ['Todos', ...Array.from(new Set(businesses.filter((business) => matchingBusiness(business, { time: true, department: true, locality: true })).map((business) => business.categoria).filter(Boolean)))];
  const availableDepartments = new Set(businesses.filter((business) => matchingBusiness(business, { time: true, category: true })).map((business) => business.departamento || business.departamento_region || ''));
  const availableLocalities = Array.from(new Set(businesses.filter((business) => matchingBusiness(business, { time: true, category: true, department: true })).map((business) => String(business.zona || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es-UY'));
  const availableTimes = new Set<TimeFilter>(['todos']);
  for (const business of businesses.filter((item) => matchingBusiness(item, { category: true, department: true, locality: true }))) {
    if (isOpenNow(business, clock)) availableTimes.add('ahora');
    for (const period of ['manana', 'tarde', 'noche'] as const) if (openInPeriod(business, clock, period)) availableTimes.add(period);
  }
  const visible = businesses.filter((business) => matchingBusiness(business, { time: true, category: true, department: true, locality: true }));
  useEffect(() => { if (category !== 'Todos' && !categories.includes(category)) setCategory('Todos'); }, [category, categories.join('|')]);
  useEffect(() => { if (filter !== 'todos' && !availableTimes.has(filter)) setFilter('todos'); }, [filter, [...availableTimes].join('|')]);
  useEffect(() => { if (department && !availableDepartments.has(department)) setDepartment(''); }, [department, [...availableDepartments].join('|')]);
  useEffect(() => { if (locality && !availableLocalities.some((item) => item.toLocaleLowerCase('es-UY') === locality.toLocaleLowerCase('es-UY'))) setLocality(''); }, [locality, availableLocalities.join('|')]);

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
    setLocationPromptPending(true);
    setLocationMessage('Elegí una opción en el permiso del navegador. La ayuda en español sigue visible abajo.');
    window.setTimeout(() => navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setVisitorLocation({ latitude: coords.latitude, longitude: coords.longitude }); setLocationMessage('Mostramos primero los negocios con ubicación precisa más cercanos a vos.'); setLocationPromptPending(false); setShowLocationHelp(false); },
      () => { setLocationMessage('No pudimos acceder a tu ubicación. Podés seguir buscando por departamento y localidad.'); setLocationPromptPending(false); setShowLocationHelp(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    ), 100);
  };
  const renderBusinessCard = (business: Business, index: number, featured = false) => {
    const style = businessStyle(business.categoria, index);
    const Icon = style.icon;
    const mapHref = businessMapLink(business);
    const image = driveImage(business.imagen_url, 640);
    const open = isOpenNow(business, clock);
    const known = hasKnownHours(business, clock.day);
    const phone = String(business.telefono || '').replace(/\D/g, '');
    const whatsapp = String(business.whatsapp || '').replace(/\D/g, '');
    const region = business.departamento || business.departamento_region || '';
    const site = /^https?:\/\//i.test(business.sitio_web || '') ? business.sitio_web : '';
    return <article className={`business-card ${style.color} ${featured ? 'featured-business' : ''} ${String(business.estilo_tarjeta || '').toLowerCase()}`} key={business.id || business.nombre}>
      {image ? <div className={`business-photo-frame ${image.endsWith('.svg') ? 'logo-frame' : ''}`}><img className="business-photo" src={image} alt={`Imagen de ${business.nombre}`} loading="lazy" decoding="async" width="640" height="420" /></div> : <div className="business-photo business-photo-placeholder" aria-label="Este negocio todavía no tiene foto" role="img"><Icon size={64} strokeWidth={1.4} aria-hidden="true" /><span>{business.categoria || 'Negocio local'}</span></div>}
      <div className="card-top"><span className="business-icon"><Icon size={22} /></span>{featured && <span className="sponsored"><Star size={13} /> Destacado</span>}</div>
      <span className="card-category">{business.categoria}</span>
      <h3>{business.nombre}</h3>
      <p>{featured && business.texto_destacado ? business.texto_destacado : business.descripcion}</p>
      <div className="hours"><span className={open ? 'open' : 'later'}>{open ? 'Abierto ahora' : known ? 'Cerrado ahora' : 'Horario a consultar'}</span><strong><Clock3 size={15} /> {businessHours(business)}</strong></div>
      <div className="address"><MapPin size={15} /> {[business.zona, region].filter(Boolean).join(' · ') || 'Uruguay'}</div>
      <div className="card-actions">
        <a className="details" href={businessUrl(business)}>Ver ficha <ArrowRight size={16} /></a>
        {whatsapp.length >= 8 && <a className="details" href={`https://wa.me/${whatsapp}`} onClick={() => recordContact(business,'whatsapp')} target="_blank" rel="noreferrer">WhatsApp <ArrowRight size={16} /></a>}
        {phone.length >= 8 && <a className="details" href={`tel:${phone}`} onClick={() => recordContact(business,'telefono')}><Phone size={16}/> Llamar</a>}
        {site && <a className="details" href={site} onClick={() => recordContact(business,'sitio')} target="_blank" rel="noreferrer">Sitio web <ArrowRight size={16} /></a>}
        {mapHref && <a className="map-link" href={mapHref} onClick={() => recordContact(business,'mapa')} target="_blank" rel="noreferrer"><MapPin size={15} /> Ver en el mapa</a>}
      </div>
    </article>;
  };

  if (profileId) {
    const region = profile?.departamento || profile?.departamento_region || '';
    const images = businessImages(profile?.imagen_url);
    const image = images[selectedPhoto] || images[0];
    const mapHref = profile ? businessMapLink(profile) : '';
    const whatsapp = String(profile?.whatsapp || '').replace(/\D/g, '');
    const phone = String(profile?.telefono || '').replace(/\D/g, '');
    const site = /^https?:\/\//i.test(profile?.sitio_web || '') ? profile?.sitio_web : '';
    return <main className={isNight ? 'night-mode business-profile' : 'day-mode business-profile'}>
      <header className="site-header"><a className="brand" href="/" aria-label="Vitrina Cerca, inicio"><span className="brand-symbol">{isNight ? <MoonStar size={24} /> : <Sun size={24} />}</span><span>VITRINA</span><strong>CERCA</strong></a><a className="header-cta" href="/#guia">Volver a la guía</a></header>
      <section className="profile-wrap" aria-live="polite">
        {!profile ? <div className="profile-empty"><h1>{dataStatus === 'loading' ? 'Cargando ficha…' : 'No encontramos esta ficha'}</h1><p>{dataStatus === 'loading' ? 'Un momento, por favor.' : 'Puede que el negocio ya no esté publicado.'}</p><a href="/#guia">Explorar negocios <ArrowRight size={17}/></a></div> : <>
          <div className="profile-card">
            <div className={`profile-gallery ${image?.endsWith('.svg') ? 'logo-gallery' : ''}`}>
              {image ? <img className="profile-image" src={image} alt={`Imagen de ${profile.nombre}`} decoding="async" fetchPriority="high" width="1200" height="800"/> : <div className="profile-image profile-image-empty"><Store size={78}/></div>}
              {images.length > 1 && <div className="profile-thumbnails" aria-label="Fotos del negocio">{businessImages(profile?.imagen_url, 160).map((photo,index)=><button type="button" className={index===selectedPhoto?'selected':''} key={photo} onClick={()=>setSelectedPhoto(index)} aria-label={`Ver foto ${index+1}`}><img src={photo} alt="" loading="lazy" decoding="async" width="160" height="110"/></button>)}</div>}
            </div>
            <div className="profile-content">
              <span className="section-kicker">{profile.categoria}{featuredBusiness(profile) ? ' · Destacado' : ''}</span>
              <h1>{profile.nombre}</h1>
              <p className="profile-description">{profile.descripcion}</p>
              <div className="profile-facts"><div><Clock3 size={18}/><span>{hasKnownHours(profile,clock.day) ? `${isOpenNow(profile,clock) ? 'Abierto ahora' : 'Cerrado ahora'} · ${businessHours(profile)}` : 'Horario a consultar'}</span></div><div><MapPin size={18}/><span>{[profile.zona,region].filter(Boolean).join(' · ') || 'Uruguay'}</span></div></div>
              <div className="profile-actions">
                {whatsapp.length >= 8 && <a href={`https://wa.me/${whatsapp}`} onClick={() => recordContact(profile,'whatsapp')} target="_blank" rel="noreferrer"><MessageCircle size={19}/> Escribir por WhatsApp</a>}
                {phone.length >= 8 && <a className="profile-call" href={`tel:+${phone}`} onClick={() => recordContact(profile,'telefono')}><Phone size={19}/> Llamar al negocio</a>}
                {site && <a className="profile-site" href={site} onClick={() => recordContact(profile,'sitio')} target="_blank" rel="noreferrer"><ArrowRight size={19}/> Visitar sitio web</a>}
                {mapHref && <a href={mapHref} onClick={() => recordContact(profile,'mapa')} target="_blank" rel="noreferrer"><MapPin size={19}/> Ver en el mapa</a>}
              </div>
              {phone.length >= 8 && <p className="profile-phone">Teléfono: +{phone}</p>}
            </div>
          </div>
        </>}
      </section>
      <footer><div className="footer-main"><a className="brand footer-brand" href="/"><span>VITRINA</span><strong>CERCA</strong></a><p>Encontrá comercios y servicios cerca de vos.</p></div></footer>
    </main>;
  }

  if (showPlans) return <main className={isNight ? 'night-mode plans-page' : 'day-mode plans-page'}>
    <header className="site-header"><a className="brand" href="/" aria-label="Vitrina Cerca, inicio"><span className="brand-symbol">{isNight ? <MoonStar size={24} /> : <Sun size={24} />}</span><span>VITRINA</span><strong>CERCA</strong></a><a className="header-cta" href="/">Volver a la guía</a></header>
    <section className="pricing" id="publicar"><div className="pricing-intro"><span className="section-kicker">PARA NEGOCIOS Y SERVICIOS</span><h1>{String(configuration.TITULO_PLANES||'Mostrá tu negocio en Vitrina Cerca')}</h1><p>{String(configuration.SUBTITULO_PLANES||'Elegí la presencia que mejor acompañe a tu negocio.')}</p><a className="plans-direct" href={businessFormUrl}>Completar ficha para revisión <ArrowRight size={17}/></a></div><div className="plans three-plans"><article><span>FICHA BÁSICA</span><h3>{currency} {basicPrice} <small>/ mes</small></h3><p>{basicDetail}</p><a href={businessFormUrl}>Completar ficha</a></article><article className="featured-plan"><span><Sparkles size={15}/> DESTACADA</span><h3>{currency} {featuredPrice} <small>/ mes</small></h3><p>{featuredDetail}</p><a href={whatsappPublicar?`https://wa.me/${whatsappPublicar}?text=Quiero%20una%20publicación%20destacada`:`mailto:${email}?subject=Quiero destacar mi negocio`}>Quiero destacar</a></article><article className="premium-plan"><span><Star size={15}/> PREMIUM</span><h3>{currency} {premiumPrice} <small>/ mes</small></h3><p>{premiumDetail}</p><a href={whatsappPublicar?`https://wa.me/${whatsappPublicar}?text=Quiero%20publicidad%20premium`:`mailto:${email}?subject=Quiero publicidad premium`}>Consultar premium</a></article></div></section>
    <footer><div className="footer-main"><a className="brand footer-brand" href="/"><span>VITRINA</span><strong>CERCA</strong></a><p>Encontrá comercios y servicios cerca de vos.</p></div></footer>
  </main>;

  return (
    <main className={isNight ? 'night-mode' : 'day-mode'}>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Vitrina Cerca, inicio"><span className="brand-symbol">{isNight ? <MoonStar size={24} /> : <Sun size={24} />}</span><span>VITRINA</span><strong>CERCA</strong></a>
        <nav aria-label="Navegación principal"><a href="#guia">Guía local</a><a href="#historias">Historias</a><a href="/?planes=1">Publicar</a></nav>
        <a className="header-cta" href={businessFormUrl}>Sumá tu negocio</a>
      </header>

      <section className="hero" id="inicio">
        <img src="/salinas-atardecer.webp" alt="Comercios de una zona costera al atardecer" fetchPriority="high" decoding="async" width="1600" height="900" />
        <div className="hero-overlay" />
        <div className="hero-copy"><span className="eyebrow"><MapPin size={15} /> Uruguay · cerca de vos</span><h1>{heroTitle}</h1><p>{heroText}</p></div>
        <div className={`hero-status ${isNight ? 'night' : 'day'}`}><span>{isNight ? <MoonStar size={18} /> : <Sun size={18} />} {isNight ? 'Edición nocturna' : 'Edición diurna'}</span><strong>{isNight ? `${nightCount} lugares abiertos hasta tarde` : 'Descubrí lo mejor de tu zona'}</strong></div>
      </section>

      <section className="finder" id="guia" aria-labelledby="finder-title">
        <form className="finder-form" onSubmit={(event) => { event.preventDefault(); document.getElementById('listado')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <label>¿Qué estás buscando?<input type="search" placeholder="Ej.: farmacia, peluquería" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label>¿En qué departamento?<select value={department} onChange={(event) => { setDepartment(event.target.value); setLocality(''); }}><option value="">Todo Uruguay</option>{departments.filter((item) => availableDepartments.has(item)).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>{department === 'Montevideo' ? '¿En qué barrio?' : '¿En qué localidad?'}<select value={locality} onChange={(event) => setLocality(event.target.value)} disabled={!department || availableLocalities.length === 0}><option value="">{department ? department === 'Montevideo' ? 'Todos los barrios' : 'Todas las localidades' : 'Elegí un departamento'}</option>{department && availableLocalities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>¿En qué horario?<select value={filter} onChange={(event) => setFilter(event.target.value as TimeFilter)}><option value="todos">Cualquier horario</option>{availableTimes.has('ahora') && <option value="ahora">Abiertos ahora</option>}{availableTimes.has('manana') && <option value="manana">Hoy de mañana · 6 a 12</option>}{availableTimes.has('tarde') && <option value="tarde">Hoy de tarde · 12 a 20</option>}{availableTimes.has('noche') && <option value="noche">Hoy de noche · 20 a 6</option>}</select></label>
          <button type="submit"><Search size={19} /> Buscar</button>
        </form>
        <div className="finder-heading"><div><span className="section-kicker">GUÍA LOCAL DE URUGUAY</span><h2 id="finder-title">¿Qué necesitás hoy?</h2><p>Buscá por negocio, lugar y horario. Los destacados aparecen primero.</p></div></div>
        <p className="finder-note">Los horarios publicados son habituales y pueden cambiar en feriados. «Abiertos ahora» se calcula con la hora de Uruguay.</p>
        <div className="proximity"><button type="button" onClick={() => setShowLocationHelp((value) => !value)}><MapPin size={17}/> {visitorLocation ? 'Actualizar mi ubicación' : 'Buscar cerca de mí'}</button><span role="status">{locationMessage || 'La ubicación es opcional. Se usa solo para ordenar esta búsqueda.'}</span></div>
        {showLocationHelp && <div className="location-help"><strong>¿Querés usar tu ubicación para ordenar los negocios cercanos?</strong><p>Podés buscar por departamento y localidad sin compartirla. Si elegís usarla, el navegador mostrará un permiso en inglés. Esta traducción quedará visible mientras decidís:</p><ul><li><b>Allow this time</b> = Permitir solo esta vez.</li><li><b>Allow while visiting the site</b> = Permitir mientras visitás la página.</li><li><b>Never allow</b> = No permitir.</li></ul><div><button type="button" onClick={locateVisitor} disabled={locationPromptPending}>{locationPromptPending ? 'Esperando tu elección…' : 'Usar mi ubicación'}</button><button type="button" onClick={() => setShowLocationHelp(false)}>Seguir sin ubicación</button></div></div>}
        {locationPromptPending && <div className="location-permission-guide" role="status"><strong>Ayuda para el permiso del navegador</strong><span>Para permitir solo esta vez, elegí <b>Allow this time</b>.</span><span>Para continuar sin ubicación, elegí <b>Never allow</b>.</span></div>}
        <div className="category-row" aria-label="Filtrar por categoría">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>

        <div id="listado" className="result-count" aria-live="polite">{dataStatus === 'loading' ? 'Cargando negocios…' : `${visible.length} ${visible.length === 1 ? 'negocio encontrado' : 'negocios encontrados'}`}</div>
        {featuredVisible.length > 0 && <section className="featured-section" aria-labelledby="featured-title"><div className="featured-heading"><span className="section-kicker">NEGOCIOS DESTACADOS</span><h2 id="featured-title">Destacados</h2></div><div className="featured-grid">{featuredVisible.map((business,index)=>renderBusinessCard(business,index,true))}</div></section>}

        <div className="guide-layout">
          <div><div className="guide-subheading"><span className="section-kicker">DIRECTORIO LOCAL</span><h2>Todos los negocios</h2></div><div className="business-grid">{basicVisible.map((business,index)=>renderBusinessCard(business,index,false))}{visible.length===0&&<div className="empty-state"><Search size={28}/><h3>{dataStatus === 'loading' ? 'Cargando la guía' : dataStatus === 'error' ? 'No pudimos cargar la guía' : 'No encontramos coincidencias'}</h3><p>{dataStatus === 'error' ? 'Probá de nuevo en unos minutos.' : dataStatus === 'loading' ? 'Un momento, por favor.' : 'Probá otro lugar, categoría u horario.'}</p></div>}</div></div>

          <aside className="ad-column" aria-label="Espacios patrocinados">
            {activeAdvertisements.length > 0 ? activeAdvertisements.map((ad) => <article className={`ad-card ${ad.imagen_url ? 'ad-card-media' : ''}`} key={ad.id || ad.anunciante}>{ad.imagen_url && <img src={ad.imagen_url} alt={ad.titulo || ad.anunciante} loading="lazy" />}<div className="ad-card-content"><span>PUBLICACIÓN PATROCINADA</span><h3>{ad.titulo}</h3><p>{ad.texto}</p><a href={ad.enlace || '/?planes=1'} target={ad.enlace ? '_blank' : undefined} rel={ad.enlace ? 'noreferrer' : undefined}>{ad.anunciante} <ArrowRight size={15} /></a></div></article>) : <div className="ad-card"><span>ESPACIO LOCAL</span><h3>Tu negocio puede estar acá</h3><p>Una presencia visible para vecinos que ya están buscando dónde comprar.</p><a href="/?planes=1">Conocer opciones <ArrowRight size={15} /></a></div>}
            <div className="night-note"><MoonStar size={24} /><strong>Tu zona de noche</strong><p>Una selección útil de gastronomía, farmacias y servicios con horario extendido.</p></div>
          </aside>
        </div>
      </section>

      <section className="editorial" id="historias"><div className="editorial-number">01</div><div><span className="section-kicker light">HISTORIAS DEL LUGAR</span><h2>Los comercios que hacen barrio.</h2></div><p>Retratos breves de emprendedores, oficios y rincones que construyen la identidad de cada comunidad.</p><a href="#guia">Leer la edición <ArrowRight size={18} /></a></section>

      <footer><div className="footer-main"><div className="brand footer-brand"><span className="brand-dot"/><span>VITRINA</span><strong>CERCA</strong></div><p>{footerText}</p><a className="footer-publish" href="/?planes=1">Opciones para publicar <ArrowRight size={16}/></a>{socialLinks.length>0&&<nav className="social-links" aria-label="Redes sociales">{socialLinks.map(({key,label,url,mark})=><a key={key} href={url} target="_blank" rel="noreferrer" aria-label={label} title={label}><span aria-hidden="true">{mark}</span></a>)}</nav>}</div><div className="footer-strip"><span>Apoyá lo local, hacemos un mejor Uruguay ♡</span><strong>Negocios reales · Comunidad que crece · Un Uruguay más cerca</strong><span>© {new Date().getFullYear()} Vitrina Cerca</span></div></footer>
    </main>
  );
}
