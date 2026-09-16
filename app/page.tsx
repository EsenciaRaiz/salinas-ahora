'use client';

import { ArrowRight, BriefcaseBusiness, Clock3, HeartPulse, MapPin, MoonStar, Search, ShoppingBag, Sparkles, Star, Store, Utensils } from 'lucide-react';
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
};

type Advertisement = {
  id: string;
  anunciante: string;
  titulo: string;
  texto: string;
  imagen_url: string;
  enlace: string;
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

export default function Home() {
  const [filter, setFilter] = useState<Filter>('todos');
  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>(fallbackBusinesses);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(fallbackAdvertisements);
  const [configuration, setConfiguration] = useState<Record<string, string | number>>({});

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
      const matchesFilter = filter === 'todos' || (filter === 'ahora' && yes(business.abierto_ahora)) || (filter === 'noche' && yes(business.abierto_de_noche));
      const matchesCategory = category === 'Todos' || business.categoria === category;
      const matchesQuery = !normalized || `${business.nombre} ${business.categoria} ${business.descripcion} ${business.zona}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesCategory && matchesQuery;
    });
  }, [businesses, category, filter, query]);

  const nightCount = businesses.filter((business) => yes(business.abierto_de_noche)).length;
  const email = String(configuration.EMAIL_PUBLICAR || 'contacto@vitrinacerca.com');
  const currency = String(configuration.MONEDA || 'UYU');
  const basicPrice = String(configuration.PRECIO_BASICA || 190);
  const featuredPrice = String(configuration.PRECIO_DESTACADA || 490);
  const footerText = String(configuration.TEXTO_PIE || 'Guía independiente de comercios, servicios e historias locales.');

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Vitrina Cerca, inicio"><span className="brand-dot" /><span>VITRINA</span><strong>CERCA</strong></a>
        <nav aria-label="Navegación principal"><a href="#guia">Guía local</a><a href="#historias">Historias</a><a href="#publicar">Publicar</a></nav>
        <a className="header-cta" href="#publicar">Sumá tu negocio</a>
      </header>

      <section className="hero" id="inicio">
        <img src="/salinas-atardecer.png" alt="Comercios de una zona costera al atardecer" />
        <div className="hero-overlay" />
        <div className="hero-copy"><span className="eyebrow"><MapPin size={15} /> Uruguay · cerca de vos</span><h1>Tu zona,<br />a mano.</h1><p>Descubrí dónde comprar, comer y resolver lo cotidiano. También cuando cae la noche.</p></div>
        <div className="hero-status"><span><MoonStar size={18} /> Edición nocturna</span><strong>{nightCount} lugares abiertos hasta tarde</strong></div>
      </section>

      <section className="finder" id="guia" aria-labelledby="finder-title">
        <div className="finder-heading"><div><span className="section-kicker">GUÍA LOCAL EN TIEMPO REAL</span><h2 id="finder-title">¿Qué necesitás hoy?</h2></div><label className="search-box"><Search size={20} /><input type="search" placeholder="Buscar comercio o servicio" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
        <div className="quick-filters" aria-label="Filtrar por horario">
          <button className={filter === 'ahora' ? 'active' : ''} onClick={() => setFilter('ahora')}><span className="live-dot" /> Abierto ahora</button>
          <button className={filter === 'noche' ? 'active' : ''} onClick={() => setFilter('noche')}><MoonStar size={17} /> Abierto de noche</button>
          <button className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Ver todos</button>
        </div>
        <div className="category-row" aria-label="Filtrar por categoría">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>

        <div className="guide-layout">
          <div className="business-grid">
            {visible.map((business, index) => {
              const style = businessStyle(business.categoria, index);
              const Icon = style.icon;
              const href = businessLink(business);
              const open = yes(business.abierto_ahora);
              return (
                <article className={`business-card ${style.color}`} key={business.id || business.nombre}>
                  <div className="card-top"><span className="business-icon"><Icon size={22} /></span>{yes(business.destacado) && <span className="sponsored"><Star size={13} /> Destacado</span>}</div>
                  <span className="card-category">{business.categoria}</span><h3>{business.nombre}</h3><p>{business.descripcion}</p>
                  <div className="hours"><span className={open ? 'open' : 'later'}>{business.abierto_ahora ? (open ? 'Abierto ahora' : 'Cerrado ahora') : 'Horario a consultar'}</span><strong><Clock3 size={15} /> {businessHours(business)}</strong></div>
                  <div className="address"><MapPin size={15} /> {business.direccion || business.zona || 'Tu zona'}</div>
                  {href ? <a className="details" href={href} target="_blank" rel="noreferrer">Ver datos <ArrowRight size={16} /></a> : <span className="details">Próximamente</span>}
                </article>
              );
            })}
            {visible.length === 0 && <div className="empty-state"><Search size={28} /><h3>No encontramos coincidencias</h3><p>Probá otra categoría o buscá con menos palabras.</p></div>}
          </div>

          <aside className="ad-column" aria-label="Espacios patrocinados">
            {advertisements.length > 0 ? advertisements.map((ad) => <article className={`ad-card ${ad.imagen_url ? 'ad-card-media' : ''}`} key={ad.id || ad.anunciante}>{ad.imagen_url && <img src={ad.imagen_url} alt={ad.titulo || ad.anunciante} loading="lazy" />}<div className="ad-card-content"><span>PUBLICACIÓN PATROCINADA</span><h3>{ad.titulo}</h3><p>{ad.texto}</p><a href={ad.enlace || '#publicar'} target={ad.enlace ? '_blank' : undefined} rel={ad.enlace ? 'noreferrer' : undefined}>{ad.anunciante} <ArrowRight size={15} /></a></div></article>) : <div className="ad-card"><span>ESPACIO LOCAL</span><h3>Tu negocio puede estar acá</h3><p>Una presencia visible para vecinos que ya están buscando dónde comprar.</p><a href="#publicar">Conocer opciones <ArrowRight size={15} /></a></div>}
            <div className="night-note"><MoonStar size={24} /><strong>Tu zona de noche</strong><p>Una selección útil de gastronomía, farmacias y servicios con horario extendido.</p></div>
          </aside>
        </div>
      </section>

      <section className="editorial" id="historias"><div className="editorial-number">01</div><div><span className="section-kicker light">HISTORIAS DEL LUGAR</span><h2>Los comercios que hacen barrio.</h2></div><p>Retratos breves de emprendedores, oficios y rincones que construyen la identidad de cada comunidad.</p><a href="#guia">Leer la edición <ArrowRight size={18} /></a></section>

      <section className="pricing" id="publicar">
        <div className="pricing-intro"><span className="section-kicker">PUBLICÁ SIN GASTAR DE MÁS</span><h2>Más visibilidad.<br />Un precio de barrio.</h2><p>Empezá con una ficha clara y sumá promoción solamente cuando la necesites.</p></div>
        <div className="plans">
          <article><span>FICHA BÁSICA</span><h3>{currency} {basicPrice} <small>/ mes</small></h3><p>Datos, horarios, ubicación, WhatsApp y una fotografía.</p><a href={`mailto:${email}?subject=Quiero publicar mi negocio`}>Elegir básica</a></article>
          <article className="featured-plan"><span><Sparkles size={15} /> DESTACADO</span><h3>{currency} {featuredPrice} <small>/ mes</small></h3><p>Mejor posición, galería, sello destacado y aparición en selecciones.</p><a href={`mailto:${email}?subject=Quiero destacar mi negocio`}>Quiero destacar</a></article>
        </div>
      </section>

      <footer><div className="brand footer-brand"><span className="brand-dot" /><span>VITRINA</span><strong>CERCA</strong></div><p>{footerText}</p><span>© {new Date().getFullYear()} Vitrina Cerca</span></footer>
    </main>
  );
}
