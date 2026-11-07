'use client';

import { ArrowRight, CalendarDays, Share2, Heart, BriefcaseBusiness, Clock3, HeartPulse, MapPin, MoonStar, Phone, Search, ShoppingBag, Sparkles, Star, Store, Sun, Utensils } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { hasKnownHours, hoursLabel, isOpenNow, montevideoClock, openInPeriod, type TimeFilter } from './schedule';
import BusinessMap from './business-map';
import BusinessCardPhoto from './business-card-photo';
import BusinessSocials from './business-socials';
import TimedRotator from './timed-rotator';
import { businessContact, whatsappContactUrl, type ContactIntent } from './contact-intent';
import { BusinessFacts, Newsletter, MerchantTestimonials, type BusinessExtras, type Testimonial } from './business-features';
import HomeExplore, { type ExploreMode } from './home-explore';
import { coverageOf, servesDepartment, departments } from '../public/coverage.js';
import curatedBusinesses from './curated-businesses.json';

type Business = BusinessExtras & {
  id: string;
  destacado: string;
  plan: string;
  nombre: string;
  categoria: string;
  especialidad?: string;
  etiquetas_busqueda?: string;
  palabras_clave?: string;
  descripcion: string;
  direccion: string;
  zona: string;
  departamento?: string;
  departamento_region?: string;
  telefono: string;
  whatsapp: string;
  sitio_web: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  logo_url?: string;
  horario_lunes_a_viernes: string;
  horario_sabado: string;
  horario_domingo: string;
  abierto_ahora: string;
  abierto_de_noche: string;
  imagen_url?: string;
  imagen_descripcion?: string;
  imagen_ilustrativa?: boolean;
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
  ubicacion?: string;
  publicar?: string;
  zona?: string;
  inicio?: string;
  fin?: string;
  orden?: string | number;
  fecha_inicio?: string;
  fecha_fin?: string;
};

type PublicData = {
  testimonios?: Testimonial[];
  correcto: boolean;
  negocios: Business[];
  publicidad: Advertisement[];
  configuracion: Record<string, string | number>;
};

function AdRotator({ ads, label, renderAd }: { ads: Advertisement[]; label: string; renderAd: (ad: Advertisement) => ReactNode }) {
  return <TimedRotator items={ads} label={label} renderItem={renderAd} className="ad-rotation"/>;
}

function AvailableAd({ placement }: { placement: 'side' | 'stories' }) {
  return <article className={`ad-card ad-card-placeholder available-ad available-ad-${placement}`}>
    <div className="ad-card-content"><span>ESPACIO PUBLICITARIO DISPONIBLE</span><h3>Tu negocio puede estar acá</h3><p>{placement === 'side' ? 'Mostrá tu marca junto a los negocios de la guía.' : 'Acompañá las historias de nuestra zona con tu marca.'}</p><a href="/?planes=1">Consultar este espacio <ArrowRight size={15}/></a></div>
  </article>;
}

function cardSummary(value: string) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 145) return text;
  const firstSentence = text.match(/^.{45,145}?[.!?](?=\s|$)/)?.[0];
  if (firstSentence) return firstSentence;
  return `${text.slice(0, 142).replace(/\s+\S*$/, '')}…`;
}

const dataUrl = 'https://script.google.com/macros/s/AKfycbybDC2YTJj8oqoclwREuMQxFdd8szCNZprb3WAy6gwb4fjH7KnaIdXJExqNe93yFsejiQ/exec';
const submissionsEndpoint = 'https://script.google.com/macros/s/AKfycbzwe6W8twxuZ41hr2yipctyKBoqXNapkqOBLlXsurCA9aaWrm4RUr1uGYk6hIOTDx8a/exec';
const businessFormUrl = '/publicar/';
const businessUrl = (business: Business) => `https://vitrinacerca.com/?negocio=${encodeURIComponent(business.id)}`;
type ContactAction = 'whatsapp' | 'telefono' | 'sitio' | 'mapa' | 'visita';
function recordContact(business: Business, action: ContactAction, intent?: ContactIntent, source: 'guia' | 'ficha' = 'guia') {
  if (typeof window === 'undefined' || !['vitrinacerca.com','www.vitrinacerca.com'].includes(window.location.hostname)) return;
  if (!business.id) return;
  const parameters = new URLSearchParams({ metric: 'contacto', id: business.id, action });
  parameters.set('source',source);
  if (action === 'whatsapp' && intent) parameters.set('intent',intent);
  void fetch(`${submissionsEndpoint}?${parameters.toString()}`, { mode: 'no-cors', keepalive: true }).catch(() => undefined);
}

const demonstrationIds = new Set(['SAL001', 'SAL002', 'SAL003', 'SAL004']);
function withCuratedBusinesses(items: Business[]): Business[] {
  const ids = new Set(items.map((business) => business.id));
  return [...items, ...curatedBusinesses.filter((business) => !ids.has(business.id))];
}

const publicCacheKey = 'vitrina-public-data-v2';
function readCachedData(): PublicData | null {
  if (typeof window === 'undefined') return null;
  try {
    const embedded = document.getElementById('initial-guide-data')?.textContent;
    if (embedded) {
      const data = JSON.parse(embedded) as PublicData;
      if (data.correcto && Array.isArray(data.negocios)) return data;
    }
    const cached = JSON.parse(window.localStorage.getItem(publicCacheKey) || 'null') as { savedAt?: number; data?: PublicData } | null;
    if (!cached?.savedAt || Date.now() - cached.savedAt > 15 * 60 * 1000) return null;
    return cached.data?.correcto && Array.isArray(cached.data.negocios) ? cached.data : null;
  } catch { return null; }
}


const yes = (value: string) => ['si', 'sí', 'true', '1'].includes(String(value || '').trim().toLowerCase());
const normalizeSearch = (value: unknown) => String(value || '').toLocaleLowerCase('es-UY').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim();
const searchAliases: Record<string, string[]> = { arquitecto:['arquitectura','planos','proyecto','reforma','construccion'], arquitectura:['arquitecto','planos','proyecto'], herrero:['herreria','rejas','portones','soldadura','hierro','estructuras metalicas'], herreria:['herrero','rejas','portones','soldadura'], web:['pagina web','paginas web','sitio web','diseno web','desarrollo web'], pagina:['pagina web','paginas web','sitio web'], paginas:['paginas web','pagina web','sitio web'], celular:['telefono','smartphone','reparacion de celulares'], carpintero:['carpinteria','muebles','madera'] };
function businessMatchesQuery(business: Business, query: string, region: string) { const normalized=normalizeSearch(query); if(!normalized)return true; const haystack=normalizeSearch([business.nombre,business.categoria,business.especialidad,business.descripcion,business.etiquetas_busqueda,business.palabras_clave,business.zona,region,coverageOf(business).label].filter(Boolean).join(' ')); return normalized.split(/\s+/).filter(Boolean).every((term)=>haystack.includes(term)||(searchAliases[term]||[]).some((alias)=>haystack.includes(normalizeSearch(alias)))); }
function contactNumber(value?: string) {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.startsWith('598') ? digits.slice(3).replace(/^0/, '') : digits.replace(/^0/, '');
  return /^\d{8}$/.test(local) ? `598${local}` : '';
}
function websiteUrl(value?: string) {
  const source = String(value || '').trim();
  if (!source) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(source) ? source : `https://${source}`);
    return ['https:', 'http:'].includes(url.protocol) && /\./.test(url.hostname) ? url.href : '';
  } catch { return ''; }
}

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
function closedToday(business: Business, day: number) {
  const hours = day === 0 ? business.horario_domingo : day === 6 ? business.horario_sabado : business.horario_lunes_a_viernes;
  return /^cerrado$/i.test(String(hours || '').trim());
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
function activeByDate(item:{fecha_inicio?:string;fecha_fin?:string}, honorEnd=true) { const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Montevideo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const part=(type:string)=>parts.find((entry)=>entry.type===type)?.value||'00'; const today=`${part('year')}-${part('month')}-${part('day')}`; const start=String(item.fecha_inicio||'').slice(0,10), end=String(item.fecha_fin||'').slice(0,10); return (!start||start<=today)&&(!honorEnd||!end||end>=today); }
function orderOf(item:{orden?:string|number}) { const value=Number(item.orden); return Number.isFinite(value)&&value>0?value:9999; }
function featuredBusiness(business:Business) { return activeByDate(business) && (yes(business.destacado)||String(business.plan||'').toLowerCase().includes('destac')); }
type AdPlacement = 'cover' | 'side' | 'between' | 'stories' | 'footer';
function placementOf(ad: Advertisement): AdPlacement {
  const name = String(ad.ubicacion || '').toLocaleLowerCase('es-UY').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (name.includes('portada')) return 'cover';
  if (name.includes('entre resultados')) return 'between';
  if (name.includes('historias')) return 'stories';
  if (name.includes('pie de pagina')) return 'footer';
  return 'side';
}
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

type Language = 'es' | 'en' | 'pt';
const translations: Record<string, { en: string; pt: string }> = {
  'Compartí este negocio': { en: 'Share this business', pt: 'Compartilhe este negócio' },
  'Elegí cómo compartir el enlace a esta ficha.': { en: 'Choose how to share this listing.', pt: 'Escolha como compartilhar esta ficha.' },
  'Más opciones para compartir': { en: 'More sharing options', pt: 'Mais opções de compartilhamento' },
  'Copiar enlace': { en: 'Copy link', pt: 'Copiar link' },
  'Compartir por WhatsApp': { en: 'Share on WhatsApp', pt: 'Compartilhar pelo WhatsApp' },
  'Cerrar': { en: 'Close', pt: 'Fechar' },
  'Enlace de la ficha': { en: 'Listing link', pt: 'Link da ficha' },
  'Cargando ficha…': { en: 'Loading listing…', pt: 'Carregando ficha…' },
  'No pudimos cargar la ficha': { en: 'Could not load the listing', pt: 'Não foi possível carregar a ficha' },
  'No encontramos esta ficha': { en: 'Listing not found', pt: 'Ficha não encontrada' },
  'Un momento, por favor.': { en: 'One moment, please.', pt: 'Um momento, por favor.' },
  'Probá de nuevo en unos minutos.': { en: 'Please try again in a few minutes.', pt: 'Tente novamente em alguns minutos.' },
  'Puede que el negocio ya no esté publicado.': { en: 'This business may no longer be listed.', pt: 'Este negócio pode não estar mais publicado.' },
  'Explorar negocios': { en: 'Explore businesses', pt: 'Explorar negócios' },
  'Imagen ilustrativa': { en: 'Illustrative image', pt: 'Imagem ilustrativa' },
  'Fotos del negocio': { en: 'Business photos', pt: 'Fotos do negócio' },
  'Cargando la guía': { en: 'Loading the guide', pt: 'Carregando o guia' },
  'No pudimos cargar la guía': { en: 'Could not load the guide', pt: 'Não foi possível carregar o guia' },
  'Todavía no guardaste negocios': { en: 'No saved businesses yet', pt: 'Você ainda não salvou negócios' },
  'Aún no hay negocios nocturnos': { en: 'No businesses open at night yet', pt: 'Ainda não há negócios com horário noturno' },
  'No hay negocios abiertos ahora': { en: 'No businesses open now', pt: 'Nenhum negócio aberto agora' },
  'No encontramos coincidencias': { en: 'No matches found', pt: 'Nenhum resultado encontrado' },
  'Probá otro lugar, categoría u horario.': { en: 'Try another place, category or time.', pt: 'Tente outro lugar, categoria ou horário.' },
  'Todavía no se publicaron negocios con horario de noche. Podés elegir otro horario.': { en: 'No businesses with night hours have been listed yet. Try another time.', pt: 'Ainda não foram publicados negócios com horário noturno. Tente outro horário.' },
  'Todos': { en: 'All', pt: 'Todos' },
  'Tecnología': { en: 'Technology', pt: 'Tecnologia' },
  'Belleza': { en: 'Beauty', pt: 'Beleza' },
  'Servicios': { en: 'Services', pt: 'Serviços' },
  'Salud': { en: 'Health', pt: 'Saúde' },
  'Educación': { en: 'Education', pt: 'Educação' },
  'Oficios': { en: 'Trades', pt: 'Ofícios' },
  'Profesionales': { en: 'Professionals', pt: 'Profissionais' },
  'Compras': { en: 'Shopping', pt: 'Compras' },
  'Terapias y bienestar': { en: 'Therapies and wellness', pt: 'Terapias e bem-estar' },
  'Gastronomía': { en: 'Food and drink', pt: 'Gastronomia' },
  'Destacado': { en: 'Featured', pt: 'Destaque' },
  'Abierto ahora': { en: 'Open now', pt: 'Aberto agora' },
  'Cerrado hoy': { en: 'Closed today', pt: 'Fechado hoje' },
  'Cerrado ahora': { en: 'Closed now', pt: 'Fechado agora' },
  'Horario a consultar': { en: 'Ask for opening hours', pt: 'Consulte o horário' },
  'Ver ficha': { en: 'View listing', pt: 'Ver ficha' },
  'Llamar': { en: 'Call', pt: 'Ligar' },
  'Sitio web': { en: 'Website', pt: 'Site' },
  'Ver en el mapa': { en: 'View on map', pt: 'Ver no mapa' },
  'Guardar negocio': { en: 'Save business', pt: 'Salvar negócio' },
  'Guardado': { en: 'Saved', pt: 'Salvo' },
  'Quitar de favoritos': { en: 'Remove from favorites', pt: 'Remover dos favoritos' },
  'Compartir ficha': { en: 'Share listing', pt: 'Compartilhar ficha' },
  'Volver a la guía': { en: 'Back to the guide', pt: 'Voltar ao guia' },
  'Llamar al negocio': { en: 'Call business', pt: 'Ligar para o negócio' },
  'Visitar sitio web': { en: 'Visit website', pt: 'Visitar site' },
  'Ver todos los comercios y servicios': { en: 'See all businesses and services', pt: 'Ver todos os comércios e serviços' },
  'Los datos de las fichas fueron proporcionados por los negocios en español.': { en: 'Listing details were provided by businesses in Spanish.', pt: 'Os detalhes das fichas foram fornecidos pelos negócios em espanhol.' },
  'Explorá tu zona': { en: 'Explore your area', pt: 'Explore sua região' },
  'Historias': { en: 'Stories', pt: 'Histórias' },
  'Lugares': { en: 'Places', pt: 'Lugares' },
  'Salidas': { en: 'Outings', pt: 'Passeios' },
  'Eventos': { en: 'Events', pt: 'Eventos' },
  'Publicar': { en: 'List your business', pt: 'Anunciar' },
  'Sumá tu negocio': { en: 'Add your business', pt: 'Cadastre seu negócio' },
  'Ficha básica gratis, sin mensualidad ni vencimiento': { en: 'Free basic listing, no monthly fee or expiry', pt: 'Cadastro básico grátis, sem mensalidade ou prazo de validade' },
  'Uruguay · cerca de vos': { en: 'Uruguay · close to you', pt: 'Uruguai · perto de você' },
  'Lo que necesitás, más cerca.': { en: 'What you need, closer.', pt: 'O que você precisa, mais perto.' },
  'Comercios, servicios y planes con identidad local.': { en: 'Local businesses, services and things to do.', pt: 'Comércios, serviços e programas com identidade local.' },
  'Edición nocturna': { en: 'Night edition', pt: 'Edição noturna' },
  'Edición diurna': { en: 'Day edition', pt: 'Edição diurna' },
  'Descubrí lo mejor de tu zona': { en: 'Discover the best of your area', pt: 'Descubra o melhor da sua região' },
  'Ver negocios de noche': { en: 'See businesses open at night', pt: 'Ver negócios abertos à noite' },
  'Ver abiertos ahora': { en: 'See open now', pt: 'Ver abertos agora' },
  '¿Qué estás buscando?': { en: 'What are you looking for?', pt: 'O que você procura?' },
  'Negocio, servicio o plan': { en: 'Business, service or activity', pt: 'Negócio, serviço ou passeio' },
  'Zona · opcional': { en: 'Area · optional', pt: 'Região · opcional' },
  '¿En qué departamento?': { en: 'Which department?', pt: 'Qual departamento?' },
  'Todo Uruguay': { en: 'All Uruguay', pt: 'Todo o Uruguai' },
  '¿En qué barrio?': { en: 'Which neighborhood?', pt: 'Qual bairro?' },
  '¿En qué localidad?': { en: 'Which town?', pt: 'Qual localidade?' },
  'Todos los barrios': { en: 'All neighborhoods', pt: 'Todos os bairros' },
  'Todas las localidades': { en: 'All towns', pt: 'Todas as localidades' },
  'Elegí un departamento': { en: 'Choose a department', pt: 'Escolha um departamento' },
  '¿En qué horario?': { en: 'What time?', pt: 'Em qual horário?' },
  'Cualquier horario': { en: 'Any time', pt: 'Qualquer horário' },
  'Abiertos ahora': { en: 'Open now', pt: 'Abertos agora' },
  'Hoy de mañana · 6 a 12': { en: 'This morning · 6 am to noon', pt: 'Hoje de manhã · 6h às 12h' },
  'Hoy de tarde · 12 a 20': { en: 'This afternoon · noon to 8 pm', pt: 'Hoje à tarde · 12h às 20h' },
  'Hoy de noche · 20 a 6': { en: 'Tonight · 8 pm to 6 am', pt: 'Hoje à noite · 20h às 6h' },
  '¿Qué especialidad?': { en: 'Which specialty?', pt: 'Qual especialidade?' },
  'Todas las especialidades': { en: 'All specialties', pt: 'Todas as especialidades' },
  'Buscar': { en: 'Search', pt: 'Buscar' },
  'EXPLORÁ URUGUAY': { en: 'EXPLORE URUGUAY', pt: 'EXPLORE O URUGUAI' },
  'Elegí una localidad y descubrí qué hacer allí': { en: 'Choose a town and discover what to do there', pt: 'Escolha uma localidade e descubra o que fazer lá' },
  'Paseos, negocios, dónde comer y servicios para tu viaje o tu día a día.': { en: 'Places to visit, businesses, food and services for your trip or daily life.', pt: 'Passeios, negócios, onde comer e serviços para sua viagem ou seu dia a dia.' },
  'Ver la guía de esa localidad': { en: 'Explore this town', pt: 'Explorar esta localidade' },
  'Ver todos': { en: 'See all', pt: 'Ver todos' },
  'Lugares para visitar en Uruguay': { en: 'Places to visit in Uruguay', pt: 'Lugares para visitar no Uruguai' },
  'Mis favoritos': { en: 'My favorites', pt: 'Meus favoritos' },
  'De noche': { en: 'At night', pt: 'À noite' },
  'GUÍA LOCAL DE URUGUAY': { en: 'URUGUAY LOCAL GUIDE', pt: 'GUIA LOCAL DO URUGUAI' },
  'Negocios para tener a mano': { en: 'Businesses at your fingertips', pt: 'Negócios ao seu alcance' },
  'Negocios y servicios': { en: 'Businesses and services', pt: 'Comércios e serviços' },
  'Información útil': { en: 'Useful information', pt: 'Informações úteis' },
  'Buscá por negocio, oficio, producto, servicio, lugar y horario.': { en: 'Search by business, trade, product, service, place or opening hours.', pt: 'Busque por negócio, profissão, produto, serviço, lugar ou horário.' },
  'Los horarios publicados son habituales y pueden cambiar en feriados. «Abiertos ahora» se calcula con la hora de Uruguay.': { en: 'Opening hours may change on holidays. “Open now” uses Uruguay time.', pt: 'Os horários podem mudar nos feriados. “Abertos agora” usa o horário do Uruguai.' },
  'Buscar cerca de mí': { en: 'Search near me', pt: 'Buscar perto de mim' },
  'Actualizar mi ubicación': { en: 'Update my location', pt: 'Atualizar minha localização' },
  'Ver mapa': { en: 'View map', pt: 'Ver mapa' },
  'Ocultar mapa': { en: 'Hide map', pt: 'Ocultar mapa' },
  'La ubicación es opcional. Se usa solo para ordenar esta búsqueda.': { en: 'Location is optional and only sorts this search.', pt: 'A localização é opcional e só organiza esta busca.' },
  'DIRECTORIO LOCAL': { en: 'LOCAL DIRECTORY', pt: 'DIRETÓRIO LOCAL' },
  'Explorá la guía': { en: 'Explore the guide', pt: 'Explore o guia' },
  'Ver carrusel': { en: 'View carousel', pt: 'Ver carrossel' },
  'Ver negocios en lista': { en: 'View businesses as a list', pt: 'Ver negócios em lista' },
  'NEGOCIOS DESTACADOS': { en: 'FEATURED BUSINESSES', pt: 'NEGÓCIOS EM DESTAQUE' },
  'Destacados': { en: 'Featured', pt: 'Destaques' },
  'Cargando negocios…': { en: 'Loading businesses…', pt: 'Carregando negócios…' },
  'negocio encontrado': { en: 'business found', pt: 'negócio encontrado' },
  'negocios encontrados': { en: 'businesses found', pt: 'negócios encontrados' },
  'Mis favoritos · Ver todos': { en: 'My favorites · See all', pt: 'Meus favoritos · Ver todos' },
  'INSPIRACIÓN LOCAL': { en: 'LOCAL INSPIRATION', pt: 'INSPIRAÇÃO LOCAL' },
  'Historias para descubrir. Planes para disfrutar.': { en: 'Stories to discover. Things to enjoy.', pt: 'Histórias para descobrir. Passeios para aproveitar.' },
  'Lugares para visitar': { en: 'Places to visit', pt: 'Lugares para visitar' },
  'Negocios con historia': { en: 'Businesses with a story', pt: 'Negócios com história' },
  'Eventos · gratis y pagos': { en: 'Events · free and paid', pt: 'Eventos · grátis e pagos' },
  'Salidas y visitas': { en: 'Outings and visits', pt: 'Passeios e visitas' },
  'Elegí tu próximo plan': { en: 'Choose your next outing', pt: 'Escolha seu próximo passeio' },
  'SUMATE A VITRINA CERCA': { en: 'JOIN VITRINA CERCA', pt: 'FAÇA PARTE DA VITRINA CERCA' },
  'Tu próximo cliente puede estar cerca.': { en: 'Your next customer may be nearby.', pt: 'Seu próximo cliente pode estar perto.' },
  'Dale a tu negocio un lugar en la guía de tu zona. La ficha básica es gratuita.': { en: 'Put your business in the local guide. A basic listing is free.', pt: 'Coloque seu negócio no guia da sua região. O cadastro básico é grátis.' },
  'Conocé cómo publicar': { en: 'How to list your business', pt: 'Como cadastrar seu negócio' },
};
function translate(value: string, language: Language): string {
  return language === 'es' ? value : translations[value]?.[language] || value;
}

export default function Home() {
  const [language, setLanguage] = useState<Language>(() => { try { const stored=localStorage.getItem('vitrina-language'); return stored === 'en' || stored === 'pt' ? stored : 'es'; } catch { return 'es'; } });
  const t=(value: string)=>translate(value,language);
  const changeLanguage=(value: Language)=>{ setLanguage(value); try { localStorage.setItem('vitrina-language',value); } catch { /* Storage may be unavailable. */ } };
  useEffect(() => { document.documentElement.lang=language === 'pt' ? 'pt-BR' : language === 'en' ? 'en' : 'es-UY'; }, [language]);
  const [saved, setSaved] = useState<string[]>(() => { try { const items: unknown = JSON.parse(localStorage.getItem('vitrina-favorites') || '[]'); return Array.isArray(items) ? items.filter((item): item is string => typeof item === 'string') : []; } catch { return []; } });
  const [onlySaved, setOnlySaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const shareBusiness = async (business: Business) => {
    if (navigator.share) {
      try { await navigator.share({ title: business.nombre + ' en Vitrina Cerca', text: 'Conocé ' + business.nombre + ' en Vitrina Cerca.', url: businessUrl(business) }); return; }
      catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
    }
    setShareMessage(''); setShareOpen(true);
  };
  const copyBusinessLink = async (business: Business) => {
    try { await navigator.clipboard.writeText(businessUrl(business)); setShareMessage('Enlace copiado'); }
    catch { setShareMessage('Seleccioná y copiá el enlace de abajo.'); }
  };
  const [saveMessage, setSaveMessage] = useState('');
  const toggleSaved = (id: string) => {
    const removing = saved.includes(id);
    const next = removing ? saved.filter((item) => item !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem('vitrina-favorites', JSON.stringify(next)); setSaveMessage(removing ? 'Quitado de favoritos' : 'Guardado en favoritos'); }
    catch { setSaveMessage('Tus favoritos se conservarán solo mientras esta página esté abierta.'); }
  };
  useEffect(() => {
    if (!saveMessage) return;
    const timeout = window.setTimeout(() => setSaveMessage(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [saveMessage, saved]);
  const saveButton = (business: Business) => <button type="button" className={`save-business ${saved.includes(business.id) ? 'is-saved' : ''}`} aria-label={`${t(saved.includes(business.id) ? 'Quitar de favoritos' : 'Guardar negocio')}: ${business.nombre}`} aria-pressed={saved.includes(business.id)} onClick={() => toggleSaved(business.id)}><Heart size={17} aria-hidden="true"/><span>{t(saved.includes(business.id) ? 'Guardado' : 'Guardar negocio')}</span></button>;
  const saveConfirmation = <div className={`favorite-confirmation ${saveMessage ? 'is-visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">{saveMessage}</div>;
  const [exploreMode, setExploreMode] = useState<ExploreMode>('negocios');
  const [filter, setFilter] = useState<TimeFilter>('todos');
  const [category, setCategory] = useState('Todos');
  const [specialty, setSpecialty] = useState('');
  const [department, setDepartment] = useState(() => { const selected = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('departamento') || ''; return departments.includes(selected) ? selected : ''; });
  const [locality, setLocality] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('localidad') || '');
  const [query, setQuery] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('buscar') || '');
  const [cachedData] = useState<PublicData | null>(() => readCachedData());
  const [businesses, setBusinesses] = useState<Business[]>(() => cachedData ? withCuratedBusinesses(cachedData.negocios.filter((business) => !demonstrationIds.has(business.id))) : []);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(() => cachedData?.publicidad || []);
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>(cachedData ? 'ready' : 'loading');
  const [liveDataChecked, setLiveDataChecked] = useState(false);
  const [configuration, setConfiguration] = useState<Record<string, string | number>>(() => cachedData?.configuracion || {});
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => cachedData?.testimonios || []);
  const [isNight, setIsNight] = useState(() => { const hour = Math.floor(montevideoClock().minute / 60); return hour >= 20 || hour < 7; });
  const [clockTick, setClockTick] = useState(0);
  const [profileId] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('negocio') || '');
  const [showPlans] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('planes') === '1');
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [landscapeProfilePhoto, setLandscapeProfilePhoto] = useState(false);
  const [visitorLocation, setVisitorLocation] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [locationPromptPending, setLocationPromptPending] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let received = !!cachedData;
    const apply = (data: PublicData) => {
        if (!data.correcto || !Array.isArray(data.negocios)) throw new Error('Datos incompletos');
        setBusinesses(withCuratedBusinesses(data.negocios.filter((business) => !demonstrationIds.has(business.id))));
        setAdvertisements(Array.isArray(data.publicidad) ? data.publicidad : []);
        setConfiguration(data.configuracion || {});
        setTestimonials(data.testimonios || []);
        setDataStatus('ready');
        received = true;
        try { window.localStorage.setItem(publicCacheKey, JSON.stringify({ savedAt: Date.now(), data })); } catch { /* Storage may be unavailable. */ }
    };
    const fetchData = async (url: string) => {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo actualizar la guía');
      return response.json() as Promise<PublicData>;
    };
    let lastRefresh = Date.now();
    const refreshLive = async () => {
      lastRefresh = Date.now();
      try { apply(await fetchData(dataUrl)); } catch { if (!controller.signal.aborted && !received) setDataStatus('error'); }
      finally { if (!controller.signal.aborted) setLiveDataChecked(true); }
    };
    void (async () => {
      if (!document.getElementById('initial-guide-data')) {
        try { apply(await fetchData('/guide-data.json')); } catch { /* La copia puede no estar disponible. */ }
      }
      await refreshLive();
    })();
    const onVisible = () => { if (!document.hidden && Date.now() - lastRefresh > 60_000) void refreshLive(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { controller.abort(); document.removeEventListener('visibilitychange', onVisible); };
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

  const matchingBusiness = (business: Business, options: { time?: boolean; category?: boolean; department?: boolean; locality?: boolean; specialty?: boolean } = {}) => {
    if (!activeByDate(business, false)) return false;
    const normalized = query.trim().toLocaleLowerCase('es-UY');
    const region = business.departamento || business.departamento_region || '';
    return (!options.time || filter === 'todos' || (filter === 'ahora' ? isOpenNow(business, clock) : openInPeriod(business, clock, filter)))
      && (!options.category || category === 'Todos' || business.categoria === category)
      && (!options.specialty || !specialty || String(business.especialidad || '').trim() === specialty)
      && (!options.department || !department || (region.toLocaleLowerCase('es-UY') === department.toLocaleLowerCase('es-UY') || servesDepartment(business, department)))
      && (!options.locality || !locality || (String(business.zona || '').trim().toLocaleLowerCase('es-UY') === locality.toLocaleLowerCase('es-UY') || (!!department && servesDepartment(business, department))))
      && businessMatchesQuery(business, query, region);
  };
  const profile = useMemo(() => businesses.find((business) => business.id === profileId && activeByDate(business, false)), [businesses,profileId]);
  useEffect(() => {
    if (!profile || !yes(String(configuration.FICHAS_AMPLIADAS_ACTIVAS || ''))) return;
    const key = `vitrina-view:${profile.id}`;
    try {
      const last = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - last < 30 * 60 * 1000) return;
      sessionStorage.setItem(key,String(Date.now()));
    } catch { return; }
    recordContact(profile,'visita',undefined,'ficha');
  }, [profile?.id,configuration.FICHAS_AMPLIADAS_ACTIVAS]);
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
      ...(profile.zona === 'Atención online' ? { areaServed: 'Uruguay' } : { address: { '@type': 'PostalAddress', addressLocality: profile.zona, addressRegion: profile.departamento || profile.departamento_region, addressCountry: 'UY',
        ...(profile.mapa_url && profile.direccion ? { streetAddress: profile.direccion } : {}) } }),
    });
    document.head.appendChild(script);
    return () => { document.title = oldTitle; description?.setAttribute('content', oldDescription); canonical?.setAttribute('href', oldCanonical); script.remove(); };
  }, [profile]);
  const clock = useMemo(() => montevideoClock(), [clockTick]);
  const categories = ['Todos', ...Array.from(new Set(businesses.filter((business) => matchingBusiness(business, { time: true, department: true, locality: true })).map((business) => business.categoria).filter(Boolean)))];
  const availableSpecialties = Array.from(new Set(businesses.filter((business) => matchingBusiness(business, { time: true, category: true, department: true, locality: true })).map((business) => String(business.especialidad || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es-UY'));
  const availableTimes = new Set<TimeFilter>(['todos']);
  for (const business of businesses.filter((item) => matchingBusiness(item, { category: true, department: true, locality: true }))) {
    if (isOpenNow(business, clock)) availableTimes.add('ahora');
    for (const period of ['manana', 'tarde', 'noche'] as const) if (openInPeriod(business, clock, period)) availableTimes.add(period);
  }
  const visible = businesses.filter((business) => (!onlySaved || saved.includes(business.id)) && matchingBusiness(business, { time: true, category: true, department: true, locality: true, specialty: true }));
  useEffect(() => { if (specialty && !availableSpecialties.includes(specialty)) setSpecialty(''); }, [specialty, availableSpecialties.join('|')]);
  useEffect(() => { if (category !== 'Todos' && !categories.includes(category)) setCategory('Todos'); }, [category, categories.join('|')]);
  


  const byDistance = (a: Business, b: Business) => {
    if (!visitorLocation) return orderOf(a)-orderOf(b);
    const aCoords = businessCoordinates(a), bCoords = businessCoordinates(b);
    const aDistance = aCoords ? distanceKm(visitorLocation,aCoords) : Infinity;
    const bDistance = bCoords ? distanceKm(visitorLocation,bCoords) : Infinity;
    return aDistance-bDistance || orderOf(a)-orderOf(b);
  };
  const featuredVisible=useMemo(()=>visible.filter(featuredBusiness).sort(byDistance),[visible,visitorLocation]);
  const basicVisible=useMemo(()=>visible.filter((business)=>!featuredBusiness(business)).sort(byDistance),[visible,visitorLocation]);
  const guideVisible=basicVisible;
  const activeAdvertisements=useMemo(()=>advertisements.filter((ad)=>(ad.publicar === undefined || yes(ad.publicar)) && activeByDate({ fecha_inicio: ad.inicio || ad.fecha_inicio, fecha_fin: ad.fin || ad.fecha_fin })).sort((a,b)=>orderOf(a)-orderOf(b)),[advertisements]);
  const adsAt=(placement:AdPlacement)=>activeAdvertisements.filter((ad)=>placementOf(ad)===placement);
  const apexAd=activeAdvertisements.find((ad)=>`${ad.id} ${ad.anunciante} ${ad.titulo}`.toLowerCase().includes('apexmind'));
  const coverAds=adsAt('cover').sort((a,b)=>Number(b===apexAd)-Number(a===apexAd));
  const sideAds=apexAd && !adsAt('side').some((ad)=>ad.id===apexAd.id || `${ad.anunciante} ${ad.titulo}`.toLowerCase().includes('apexmind'))
    ? [{...apexAd,id:`${apexAd.id}-side`,ubicacion:'Lateral guía'},...adsAt('side')]
    : adsAt('side').sort((a,b)=>Number(`${b.anunciante} ${b.titulo}`.toLowerCase().includes('apexmind'))-Number(`${a.anunciante} ${a.titulo}`.toLowerCase().includes('apexmind')));
  const renderAdvertisement=(ad:Advertisement)=>{
    const imageUrl = ad.imagen_url || (ad.id === 'ADS002' ? '/esencia-raiz-aviso-editorial.webp' : '');
    const florProfile = ad.id === 'ADS005' ? businesses.find((business) => {
      const name = business.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const instagram = String(business.instagram || '').toLowerCase().replace(/\/$/, '');
      return instagram === 'https://www.instagram.com/floreriasalinas' || name.includes('floreria salinas');
    }) : undefined;
    const link = florProfile ? businessUrl(florProfile) : ad.enlace || '/?planes=1';
    const label = florProfile ? 'Ver ficha' : ad.id === 'ADS005' ? 'Ver Instagram' : ad.anunciante;
    return <article className={`ad-card ${imageUrl ? 'ad-card-media' : ''}`} data-ad-placement={placementOf(ad)} key={ad.id || ad.anunciante}>{imageUrl && <img src={driveImage(imageUrl,640)} alt={ad.titulo || ad.anunciante} loading="lazy" decoding="async" width="640" height="420" />}<div className="ad-card-content"><span>PUBLICACIÓN PATROCINADA</span><h3>{ad.titulo}</h3><p>{ad.texto}</p><a href={link} target="_blank" rel="noreferrer">{label} <ArrowRight size={15} /></a></div></article>;
  };
  const nightCount = businesses.filter((business) => activeByDate(business, false) && openInPeriod(business, clock, 'noche')).length;
  const email = String(configuration.EMAIL_PUBLICAR || 'contacto@vitrinacerca.com');
  const currency = String(configuration.MONEDA || 'UYU');
  const featuredPrice = String(configuration.PRECIO_DESTACADA || 490);
  const footerText = String(configuration.TEXTO_PIE || 'Guía independiente de comercios, servicios e historias locales.');
  const premiumPrice=String(configuration.PRECIO_PREMIUM||990);
  const basicDetail='Ficha en la guía, foto, datos, horarios, contacto y mapa opcional.';
  const featuredDetailRaw=String(configuration.DETALLE_DESTACADA||'');
  const featuredDetail=featuredDetailRaw && featuredDetailRaw !== 'Prioridad, mayor tamaño, sello destacado y presencia en selecciones.' ? featuredDetailRaw : 'Aparece en Destacados, con sello y prioridad en la guía.';
  const premiumDetailRaw=String(configuration.DETALLE_PREMIUM||'');
  const premiumDetail=premiumDetailRaw && premiumDetailRaw !== 'Portada editorial, campaña visual y ubicación publicitaria preferente.' ? premiumDetailRaw : 'Propuesta visual personalizada y espacio publicitario en la ubicación acordada. La duración se confirma antes de contratar.';
  const heroTitle=String(configuration.HERO_TITULO && configuration.HERO_TITULO !== 'Tu zona, a mano.' ? configuration.HERO_TITULO : 'Lo que necesitás, más cerca.');
  const heroText='Comercios, servicios y planes con identidad local.';
  const siteWhatsApp=String(configuration.WHATSAPP_PUBLICAR||'').replace(/\D/g,'');
  const whatsappPublicar=siteWhatsApp;
  const socialLinks=[{key:'instagram',label:'Instagram de Vitrina Cerca',url:String(configuration.INSTAGRAM_URL||'https://www.instagram.com/vitrinacerca/'),mark:'◎'},{key:'facebook',label:'Facebook de Vitrina Cerca',url:String(configuration.FACEBOOK_URL||'https://www.facebook.com/profile.php?id=61595227299132'),mark:'f'},{key:'tiktok',label:'TikTok',url:String(configuration.TIKTOK_URL||''),mark:'♪'},{key:'youtube',label:'YouTube',url:String(configuration.YOUTUBE_URL||''),mark:'▶'},{key:'linkedin',label:'LinkedIn',url:String(configuration.LINKEDIN_URL||''),mark:'in'},{key:'whatsapp',label:'WhatsApp',url:siteWhatsApp.length>=8?`https://wa.me/${siteWhatsApp}`:'',mark:''}].filter(({url})=>url.startsWith('https://'));
  const romansi = businesses.find((business) => business.id === 'SAL006' || business.nombre.toLowerCase().includes('romansi')); const romansiWhatsApp = String(romansi?.whatsapp || '').replace(/\D/g, ''); const romansiMessageUrl = romansiWhatsApp.length >= 8 ? `https://wa.me/${romansiWhatsApp}?text=${encodeURIComponent('Hola, vi Vitrina Cerca y quisiera consultar por diseño y desarrollo web.')}` : ''; const locateVisitor = () => {
    if (!navigator.geolocation) { setLocationMessage('Tu dispositivo no permite usar la ubicación.'); return; }
    setLocationPromptPending(true);
    setLocationMessage('Elegí una opción en el permiso del navegador. La ayuda en español sigue visible abajo.');
    window.setTimeout(() => navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setVisitorLocation({ latitude: coords.latitude, longitude: coords.longitude }); setLocationMessage('Mostramos primero los negocios con ubicación precisa más cercanos a vos.'); setLocationPromptPending(false); setShowLocationHelp(false); },
      () => { setLocationMessage('No pudimos acceder a tu ubicación. Podés seguir buscando por departamento y localidad.'); setLocationPromptPending(false); setShowLocationHelp(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    ), 100);
  };
  const showPeriod = (period: TimeFilter) => {
    setExploreMode('negocios');
    setOnlySaved(false);
    setSpecialty('');
    setFilter(period);
    setCategory('Todos');
    setDepartment('');
    setLocality('');
    setQuery('');
    document.getElementById('explore-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const renderBusinessCard = (business: Business, index: number, featured = false) => {
    const style = businessStyle(business.categoria, index);
    const Icon = style.icon;
    const mapHref = businessMapLink(business);
    const images = businessImages(business.imagen_url, 640);
    const open = isOpenNow(business, clock);
    const known = hasKnownHours(business, clock.day);
    const hours = hoursLabel(business, clock.day);
    const closed = closedToday(business, clock.day);
    const phone = contactNumber(business.telefono);
    const whatsapp = contactNumber(business.whatsapp);
    const contact = businessContact(business);
    const region = business.departamento || business.departamento_region || '';
    const site = websiteUrl(business.sitio_web);
    const logo = driveImage(business.logo_url, 160);
    return <article className={`business-card ${style.color} ${featured ? 'featured-business' : ''} ${String(business.estilo_tarjeta || '').toLowerCase() === 'editorial' ? 'card-editorial' : ''}`} key={business.id || business.nombre}>

      <BusinessCardPhoto images={images} name={business.nombre} category={business.categoria} altText={business.imagen_descripcion} illustrative={business.imagen_ilustrativa} Icon={Icon} />
      <div className="card-category"><span>{t(business.categoria)}{business.especialidad ? ` · ${business.especialidad}` : ''}</span>{featured && <span className="sponsored"><Star size={13} aria-hidden="true"/> {t("Destacado")}</span>}</div>
      <h3>{logo && <img className="business-logo" src={logo} alt="" loading="lazy" width="36" height="36" />}{business.nombre}</h3>
      <p>{cardSummary(featured && business.texto_destacado ? business.texto_destacado : coverageOf(business).description)}</p>
      <div className="hours"><span className={open ? 'open' : 'later'}>{t(open ? 'Abierto ahora' : closed ? 'Cerrado hoy' : known ? 'Cerrado ahora' : 'Horario a consultar')}</span>{known && <strong><Clock3 size={15} /> {hours}</strong>}</div>
      <div className="address"><MapPin size={15} /> {[business.zona, region].filter(Boolean).join(' · ') || 'Uruguay'}{coverageOf(business).label && <span className="coverage-label">{coverageOf(business).label}</span>}</div>
      <div className="card-actions">
        <a className={`details ${!whatsapp && !phone && !site ? 'primary-action' : ''}`} href={businessUrl(business)}>{t("Ver ficha")} <ArrowRight size={16} /></a>
        {whatsapp.length >= 8 && <a className="details whatsapp-action primary-action" href={whatsappContactUrl(whatsapp,business)} onClick={() => recordContact(business,'whatsapp',contact.intent)} title="Se abre WhatsApp con un mensaje que podés completar y enviar." aria-label={`${business.boton_texto || contact.label} a ${business.nombre} por WhatsApp`} target="_blank" rel="noreferrer"><img src="/eventos/whatsapp.svg" alt="" width="17" height="17"/> {business.boton_texto || contact.label}</a>}
        {phone.length >= 8 && <a className={`details ${!whatsapp ? 'primary-action' : ''}`} href={`tel:+${phone}`} onClick={() => recordContact(business,'telefono')}><Phone size={16}/> {t("Llamar")}</a>}
        {site && <a className={`details ${!whatsapp && !phone ? 'primary-action' : ''}`} href={site} onClick={() => recordContact(business,'sitio')} target="_blank" rel="noreferrer">{t("Sitio web")} <ArrowRight size={16} /></a>}
        {mapHref && <a className="map-link" href={mapHref} onClick={() => recordContact(business,'mapa')} target="_blank" rel="noreferrer"><MapPin size={15} /> {t("Ver en el mapa")}</a>}
        <BusinessSocials business={business}/>
        {saveButton(business)}
      </div>
    </article>;
  };

  const languagePicker=<label className="language-picker" aria-label="Idioma / Language"><select value={language} onChange={(event)=>changeLanguage(event.target.value as Language)}><option value="es">Español</option><option value="en">English</option><option value="pt">Português</option></select></label>;

  if (profileId) {
    const region = profile?.departamento || profile?.departamento_region || '';
    const images = businessImages(profile?.imagen_url);
    const image = images[selectedPhoto] || images[0];
    const mapHref = profile ? businessMapLink(profile) : '';
    const whatsapp = contactNumber(profile?.whatsapp);
    const contact = profile ? businessContact(profile) : null;
    const phone = contactNumber(profile?.telefono);
    const site = websiteUrl(profile?.sitio_web);
    const logo = driveImage(profile?.logo_url, 160);
    return <main className={isNight ? 'night-mode business-profile' : 'day-mode business-profile'}>
      <header className="site-header"><a className="brand" href="/" aria-label="Vitrina Cerca, inicio"><span className="brand-symbol"><img src={isNight ? '/marca-noche.svg' : '/marca-dia.svg'} alt="" width="34" height="34"/></span><span>VITRINA</span><strong>CERCA</strong></a><div className="header-actions">{languagePicker}<a className="header-cta" href="/#guia">{t("Volver a la guía")}</a></div></header>
      {saveConfirmation}
      <section className="profile-wrap" aria-live="polite">
        {!profile ? <div className="profile-empty"><h1>{!liveDataChecked ? t("Cargando ficha…") : dataStatus === 'error' ? t("No pudimos cargar la ficha") : t("No encontramos esta ficha")}</h1><p>{!liveDataChecked ? t("Un momento, por favor.") : dataStatus === 'error' ? t("Probá de nuevo en unos minutos.") : t("Puede que el negocio ya no esté publicado.")}</p><a href="/#guia">{t("Explorar negocios")} <ArrowRight size={17}/></a></div> : <>
          <div className={`profile-card ${landscapeProfilePhoto ? 'profile-card-landscape' : ''}`}>
            <div className={`profile-gallery ${image?.endsWith('.svg') ? 'logo-gallery' : ''}`}>
              {profile.imagen_ilustrativa && image && <span className="illustrative-image-label">{t("Imagen ilustrativa")}</span>}
              {image ? <img className="profile-image" src={image} alt={profile.imagen_descripcion || `Imagen de ${profile.nombre}`} decoding="async" fetchPriority="high" width="1200" height="800" onLoad={(event) => setLandscapeProfilePhoto(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight >= 1.5)}/> : <div className="profile-image profile-image-empty"><Store size={78}/></div>}
              {images.length > 1 && <div className="profile-thumbnails" aria-label={t('Fotos del negocio')}>{businessImages(profile?.imagen_url, 160).map((photo,index)=><button type="button" className={index===selectedPhoto?'selected':''} key={photo} onClick={()=>setSelectedPhoto(index)} aria-label={`Ver foto ${index+1}`}><img src={photo} alt="" loading="lazy" decoding="async" width="160" height="110"/></button>)}</div>}
            </div>
            <div className="profile-content">
              <span className="section-kicker">{t(profile.categoria)}{profile.especialidad ? ` · ${profile.especialidad}` : ''}{featuredBusiness(profile) ? ' · '+t('Destacado') : ''}</span>
              <h1>{logo && <img className="profile-logo" src={logo} alt="" width="56" height="56" />}{profile.nombre}</h1>
              <p className="profile-description">{coverageOf(profile).description}</p>{coverageOf(profile).label && <p className="profile-coverage">{coverageOf(profile).label}</p>}
              <div className="profile-facts"><div><Clock3 size={18}/><span>{closedToday(profile,clock.day) ? t('Cerrado hoy') : hasKnownHours(profile,clock.day) ? `${isOpenNow(profile,clock) ? t('Abierto ahora') : t('Cerrado ahora')} · ${businessHours(profile)}` : t('Horario a consultar')}</span></div><div><MapPin size={18}/><span>{[profile.zona,region].filter(Boolean).join(' · ') || 'Uruguay'}</span></div></div>
              <div className="profile-actions">
                {whatsapp.length >= 8 && contact && <a href={whatsappContactUrl(whatsapp,profile)} onClick={() => recordContact(profile,'whatsapp',contact.intent,'ficha')} target="_blank" rel="noreferrer"><img src="/eventos/whatsapp.svg" alt="" width="20" height="20"/> {contact.label}</a>}
                {phone.length >= 8 && <a className="profile-call" href={`tel:+${phone}`} onClick={() => recordContact(profile,'telefono')}><Phone size={19}/> {t('Llamar al negocio')}</a>}
                {site && <a className="profile-site" href={site} onClick={() => recordContact(profile,'sitio')} target="_blank" rel="noreferrer"><ArrowRight size={19}/> {t('Visitar sitio web')}</a>}
                {mapHref && <a href={mapHref} onClick={() => recordContact(profile,'mapa')} target="_blank" rel="noreferrer"><MapPin size={19}/> {t('Ver en el mapa')}</a>}
              </div>
              <div className="profile-utilities">
                {saveButton(profile)}
                <button type="button" className="share-business" aria-expanded={shareOpen} onClick={() => { setShareMessage(''); setShareOpen(open => !open); }}><Share2 size={17} aria-hidden="true"/> {t('Compartir ficha')}</button>
              </div>
              {shareOpen && <section className="share-business-panel" aria-label="Compartir esta ficha"><h2>{t("Compartí este negocio")}</h2><p>{t("Elegí cómo compartir el enlace a esta ficha.")}</p><div className="share-options">{typeof navigator.share === 'function' && <button type="button" onClick={() => shareBusiness(profile)}>{t("Más opciones para compartir")}</button>}<button type="button" onClick={() => copyBusinessLink(profile)}>{t("Copiar enlace")}</button><a href={'https://wa.me/?text=' + encodeURIComponent('Conocé ' + profile.nombre + ' en Vitrina Cerca: ' + businessUrl(profile))} target="_blank" rel="noopener noreferrer">{t("Compartir por WhatsApp")}</a><button type="button" onClick={() => setShareOpen(false)}>{t("Cerrar")}</button></div><label>{t("Enlace de la ficha")}<input readOnly value={businessUrl(profile)} onFocus={event => event.currentTarget.select()}/></label><p role="status">{shareMessage}</p></section>}
              <BusinessSocials business={profile}/>
              <BusinessFacts business={profile}/>
            </div>
          </div>
        </>}
      </section>
      <footer><div className="footer-main"><a className="brand footer-brand" href="/"><span>VITRINA</span><strong>CERCA</strong></a><p>Encontrá comercios y servicios cerca de vos.</p><a className="footer-privacy" href="/privacidad/">Privacidad y correcciones</a><a className="footer-privacy" href="/terminos-de-uso/">Términos de uso</a><a className="footer-privacy" href="/autorizacion-de-publicacion/">Autorización de publicación</a><a className="footer-privacy" href="/reglas-de-publicacion/">Reglas de publicación</a></div></footer>
    </main>;
  }

  if (showPlans) return <main className={isNight ? 'night-mode plans-page' : 'day-mode plans-page'}>
    <header className="site-header"><a className="brand" href="/" aria-label="Vitrina Cerca, inicio"><span className="brand-symbol"><img src={isNight ? '/marca-noche.svg' : '/marca-dia.svg'} alt="" width="34" height="34"/></span><span>VITRINA</span><strong>CERCA</strong></a><div className="header-actions">{languagePicker}<a className="header-cta" href="/">{t("Volver a la guía")}</a></div></header>
    <section className="pricing" id="publicar"><div className="pricing-intro"><span className="section-kicker">PARA NEGOCIOS Y SERVICIOS</span><h1>{String(configuration.TITULO_PLANES||'Mostrá tu negocio en Vitrina Cerca')}</h1><p>Tu ficha en el listado es gratuita. Si querés más visibilidad, podés elegir una publicidad paga.</p><a className="plans-direct" href={businessFormUrl}>Completar ficha para revisión <ArrowRight size={17}/></a></div><div className="plans three-plans"><article><span>FICHA EN LA GUÍA</span><h3>Gratis</h3><p><strong>Registrarte y aparecer en el listado no tiene costo ni fecha de vencimiento.</strong></p><p>{basicDetail}</p><p>Revisamos los datos antes de publicar. Podés solicitar correcciones.</p><a href={businessFormUrl}>Completar ficha gratis</a></article><article className="featured-plan"><span><Sparkles size={15}/> PUBLICIDAD DESTACADA</span><h3>{currency} {featuredPrice} <small>/ mes</small></h3><p>{featuredDetail} Es una opción publicitaria; tu ficha en el listado sigue siendo gratuita.</p><a href={whatsappPublicar?`https://wa.me/${whatsappPublicar}?text=Quiero%20una%20publicación%20destacada`:`mailto:${email}?subject=Quiero destacar mi negocio`}>{whatsappPublicar && <img src="/eventos/whatsapp.svg" alt="" width="19" height="19"/>} Quiero destacar</a></article><article className="premium-plan"><span><Star size={15}/> PUBLICIDAD PREMIUM</span><h3>{currency} {premiumPrice} <small>/ mes</small></h3><p>{premiumDetail}</p><a href={whatsappPublicar?`https://wa.me/${whatsappPublicar}?text=Quiero%20publicidad%20premium`:`mailto:${email}?subject=Quiero publicidad premium`}>{whatsappPublicar && <img src="/eventos/whatsapp.svg" alt="" width="19" height="19"/>} Consultar premium</a></article></div><p className="pricing-note">La ficha en el listado es gratuita. La publicidad destacada y los espacios publicitarios son opcionales y pagos. Antes de contratar una publicidad, confirmamos con vos su ubicación, duración, precio y medio de pago; no hay cobro ni renovación automática.</p></section>
    <section className="merchant-example" aria-labelledby="example-title"><span className="section-kicker">ASÍ FUNCIONA</span><h2 id="example-title">Tu ficha, con información para elegirte</h2><p>Nombre y fotos de tu negocio, rubro, localidad, horarios y medios de contacto. Podés sumar menú o catálogo, precios orientativos, cobertura, entregas y una historia breve: esos datos también están incluidos en la ficha gratuita.</p><p>Los anuncios pagos agregan difusión o ubicaciones publicitarias; no son necesarios para recibir consultas desde tu ficha.</p>{businesses.filter((business)=>!featuredBusiness(business)).slice(0,1).map((business)=><p key={business.id}>Mirá un ejemplo real de la guía: <a href={businessUrl(business)}>{business.nombre}</a>.</p>)}</section><MerchantTestimonials testimonials={testimonials} businesses={businesses}/><section className="contact-benefits" aria-labelledby="contact-benefits-title"><span className="section-kicker">INCLUIDO EN TU FICHA GRATUITA</span><h2 id="contact-benefits-title">Que te encuentren y te consulten.</h2><p>Si publicás tu WhatsApp, tu ficha tendrá un botón acorde a tu actividad: pedir presupuesto, consultar un producto, disponibilidad, menú o un turno.</p><p>Quien te encuentra puede completar un mensaje y enviártelo directamente. Vos respondés y acordás los detalles con tu cliente; no necesitás aprender a usar otro sistema.</p><p className="contact-measurement">Los clics en los botones indican interés. No confirman mensajes enviados, presupuestos aceptados, reservas ni ventas.</p></section><section className="placement-guide" aria-labelledby="placement-title"><div className="placement-intro"><span className="section-kicker">ESPACIOS PUBLICITARIOS</span><h2 id="placement-title">Dónde puede verse un anuncio</h2><p>Estos dibujos muestran posibles ubicaciones. Son ejemplos: el diseño y el tamaño finales pueden variar según el dispositivo.</p><p className="placement-current">La ficha en el listado es gratuita. La disponibilidad, duración y precio de cada espacio publicitario se confirman antes de contratar.</p></div><div className="placement-examples">{[{key:'cover',title:'Portada',description:'En la entrada del sitio.'},{key:'side',title:'Lateral de la guía',description:'Junto a las fichas de negocios.'},{key:'between',title:'Entre resultados',description:'Intercalado entre fichas.'},{key:'stories',title:'Historias',description:'Junto a los relatos locales.'},{key:'footer',title:'Pie de página',description:'Al final del sitio.'}].map((place)=><article className="placement-example" key={place.key}><div className={`placement-preview placement-${place.key}`} aria-hidden="true"><span className="preview-top">VITRINA CERCA</span><span className="preview-main">{place.key==='stories'?'Historias locales':'Negocios y servicios'}</span><span className="preview-ad">Anuncio</span><span className="preview-bottom">Más contenido</span></div><div className="placement-caption"><h3>{place.title}</h3><p>{place.description}</p><span className="placement-planned">Consultar disponibilidad</span></div></article>)}</div><p className="placement-terms">Antes de contratar un anuncio, confirmaremos por escrito su ubicación, duración, contenido y precio. La ficha gratuita no reserva un espacio publicitario.</p></section>
      <footer><div className="footer-main"><a className="brand footer-brand" href="/"><span>VITRINA</span><strong>CERCA</strong></a><p>Encontrá comercios y servicios cerca de vos.</p><a className="footer-privacy" href="/privacidad/">Privacidad y correcciones</a><a className="footer-privacy" href="/terminos-de-uso/">Términos de uso</a><a className="footer-privacy" href="/autorizacion-de-publicacion/">Autorización de publicación</a><a className="footer-privacy" href="/reglas-de-publicacion/">Reglas de publicación</a></div></footer>
  </main>;

  return (
    <main className={`homepage-redesign ${isNight ? 'night-mode' : 'day-mode'}`}>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Vitrina Cerca, inicio"><span className="brand-symbol"><img src={isNight ? '/marca-noche.svg' : '/marca-dia.svg'} alt="" width="34" height="34"/></span><span>VITRINA</span><strong>CERCA</strong></a>
        <nav aria-label="Navegación principal"><a href="#explorar">{t("Explorá tu zona")}</a><a href="/historias/">{t("Historias")}</a><a href="/?planes=1">{t("Publicar")}</a></nav>
        <div className="header-actions">{languagePicker}<div className="header-join">
          <a className="header-cta" href={businessFormUrl} aria-label={t("Sumá tu negocio")}>{t("Sumá tu negocio")} <ArrowRight size={15} aria-hidden="true" /></a>
          <span className="header-join-note">{t("Ficha básica gratis, sin mensualidad ni vencimiento")}</span>
        </div></div>
      </header>

      <section className="hero" id="inicio">
        <img src="/salinas-atardecer.webp" alt="Comercios de una zona costera al atardecer" fetchPriority="high" decoding="async" width="1600" height="900" />
        <div className="hero-overlay" />
        <div className="hero-copy"><span className="eyebrow"><MapPin size={15} /> {t("Uruguay · cerca de vos")}</span><h1>{language === "es" ? heroTitle : t("Lo que necesitás, más cerca.")}</h1><p>{language === "es" ? heroText : t("Comercios, servicios y planes con identidad local.")}</p></div>
        <button type="button" className={`hero-status ${isNight ? 'night' : 'day'}`} onClick={() => showPeriod(isNight ? 'noche' : 'ahora')}><span>{isNight ? <MoonStar size={18} /> : <Sun size={18} />} {t(isNight ? 'Edición nocturna' : 'Edición diurna')}</span><strong>{isNight ? language === 'en' ? `${nightCount} place${nightCount === 1 ? '' : 's'} open at night` : language === 'pt' ? `${nightCount} lugar${nightCount === 1 ? '' : 'es'} com horário noturno` : `${nightCount} ${nightCount === 1 ? 'lugar' : 'lugares'} con horario nocturno` : t('Descubrí lo mejor de tu zona')}</strong><small>{t(isNight ? 'Ver negocios de noche' : 'Ver abiertos ahora')} <ArrowRight size={14} /></small></button>
      </section>
      <section className="search-landing unified-search" aria-label="Explorá tu zona">
        <form className="finder-form" onSubmit={(event) => { event.preventDefault(); document.getElementById('explore-results')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <label>{t("¿Qué estás buscando?")}<input type="search" placeholder={exploreMode === 'negocios' ? t("Negocio, servicio o plan") : language === 'en' ? 'Name or keyword' : language === 'pt' ? 'Nome ou palavra-chave' : 'Nombre o palabra clave'} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label>{language === 'en' ? 'Department' : language === 'pt' ? 'Departamento' : 'Departamento'}<select value={department} onChange={(event) => { setDepartment(event.target.value); setLocality(''); }}><option value="">{t("Todo Uruguay")}</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>{language === 'en' ? 'Town or city' : language === 'pt' ? 'Localidade' : 'Localidad'}<input type="text" placeholder={language === 'en' ? 'Optional' : language === 'pt' ? 'Opcional' : 'Opcional'} value={locality} onChange={(event) => setLocality(event.target.value.slice(0,80))} disabled={!department} autoComplete="address-level2"/></label>
          {exploreMode === 'negocios' && <label>{t("¿En qué horario?")}<select value={filter} onChange={(event) => setFilter(event.target.value as TimeFilter)}><option value="todos">{t("Cualquier horario")}</option>{(availableTimes.has('ahora') || filter === 'ahora') && <option value="ahora">{t("Abiertos ahora")}</option>}{(availableTimes.has('manana') || filter === 'manana') && <option value="manana">{t("Hoy de mañana · 6 a 12")}</option>}{(availableTimes.has('tarde') || filter === 'tarde') && <option value="tarde">{t("Hoy de tarde · 12 a 20")}</option>}{(availableTimes.has('noche') || filter === 'noche') && <option value="noche">{t("Hoy de noche · 20 a 6")}</option>}</select></label>}
          <button type="submit"><Search size={19} /> {t("Buscar")}</button>
        </form>
        <div className="explore-tabs" aria-label={language === 'en' ? 'Explore by type' : language === 'pt' ? 'Explorar por tipo' : 'Explorar por tipo'}>
          <button type="button" aria-pressed={exploreMode === 'negocios'} className={exploreMode === 'negocios' ? 'selected' : ''} onClick={() => setExploreMode('negocios')}><Store size={19}/><span>{language === 'en' ? 'Businesses' : language === 'pt' ? 'Negócios' : 'Negocios'}<small>{language === 'en' ? 'Shops and services' : language === 'pt' ? 'Comércios e serviços' : 'Comercios y servicios'}</small></span></button>
          <button type="button" aria-pressed={exploreMode === 'lugares'} className={exploreMode === 'lugares' ? 'selected' : ''} onClick={() => setExploreMode('lugares')}><MapPin size={19}/><span>{language === 'en' ? 'Places' : language === 'pt' ? 'Lugares' : 'Lugares'}<small>{language === 'en' ? 'Visit and explore' : language === 'pt' ? 'Visitar e conhecer' : 'Para visitar'}</small></span></button>
          <button type="button" aria-pressed={exploreMode === 'salidas'} className={exploreMode === 'salidas' ? 'selected' : ''} onClick={() => setExploreMode('salidas')}><Sparkles size={19}/><span>{language === 'en' ? 'Outings' : language === 'pt' ? 'Passeios' : 'Salidas'}<small>{language === 'en' ? 'Ideas and experiences' : language === 'pt' ? 'Ideias e experiências' : 'Ideas y experiencias'}</small></span></button>
          <button type="button" aria-pressed={exploreMode === 'eventos'} className={exploreMode === 'eventos' ? 'selected' : ''} onClick={() => setExploreMode('eventos')}><CalendarDays size={19}/><span>{language === 'en' ? 'Events' : language === 'pt' ? 'Eventos' : 'Eventos'}<small>{language === 'en' ? 'What is coming up' : language === 'pt' ? 'O que vai acontecer' : 'Qué hay esta semana'}</small></span></button>
        </div>{saveConfirmation}
      </section>
      <section className="finder unified-finder" id="explorar" aria-label="Resultados de Vitrina Cerca"><div id="explore-results" role="region" aria-label="Resultados" tabIndex={-1}>
        {exploreMode === "negocios" ? <>

        <div className="finder-heading" id="guia"><h2 id="finder-title">{t("Negocios y servicios")}</h2></div>
        <div className="proximity"><button type="button" onClick={() => setShowLocationHelp((value) => !value)}><MapPin size={17}/> {t(visitorLocation ? 'Actualizar mi ubicación' : 'Buscar cerca de mí')}</button><button type="button" aria-expanded={showMap} aria-controls="mapa-negocios" onClick={() => setShowMap((value) => !value)}><MapPin size={17}/> {t(showMap ? 'Ocultar mapa' : 'Ver mapa')}</button><details className="guide-note"><summary>{t("Información útil")}</summary><p>{t("Los horarios publicados son habituales y pueden cambiar en feriados. «Abiertos ahora» se calcula con la hora de Uruguay.")}</p><p>{t("La ubicación es opcional. Se usa solo para ordenar esta búsqueda.")}</p></details>{locationMessage && <span role="status">{locationMessage}</span>}</div>
        {showMap && <div id="mapa-negocios"><BusinessMap businesses={visible}/></div>}
        {showLocationHelp && <div className="location-help"><strong>¿Querés usar tu ubicación para ordenar los negocios cercanos?</strong><p>Podés buscar por departamento y localidad sin compartirla. Si elegís usarla, el navegador mostrará un permiso en inglés. Esta traducción quedará visible mientras decidís:</p><ul><li><b>Allow this time</b> = Permitir solo esta vez.</li><li><b>Allow while visiting the site</b> = Permitir mientras visitás la página.</li><li><b>Never allow</b> = No permitir.</li></ul><div><button type="button" onClick={locateVisitor} disabled={locationPromptPending}>{locationPromptPending ? 'Esperando tu elección…' : 'Usar mi ubicación'}</button><button type="button" onClick={() => setShowLocationHelp(false)}>Seguir sin ubicación</button></div></div>}
        {locationPromptPending && <div className="location-permission-guide" role="status"><strong>Ayuda para el permiso del navegador</strong><span>Para permitir solo esta vez, elegí <b>Allow this time</b>.</span><span>Para continuar sin ubicación, elegí <b>Never allow</b>.</span></div>}
        <div className="business-toolbar" aria-label="Filtrar negocios"><label>{language === "en" ? "Category" : language === "pt" ? "Categoria" : "Rubro"}<select value={category} onChange={(event) => { setCategory(event.target.value); setSpecialty(""); }}>{categories.map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></label><button type="button" aria-pressed={filter === "ahora"} onClick={() => { setFilter(filter === "ahora" ? "todos" : "ahora"); setOnlySaved(false); }}><Clock3 size={16}/> {t("Abiertos ahora")}</button><button type="button" aria-pressed={onlySaved} onClick={() => setOnlySaved(value => !value)}><Heart size={16}/> {t("Mis favoritos")}{saved.length ? ` + (${saved.length})` : ""}</button><button type="button" onClick={() => { setCategory("Todos"); setSpecialty(""); setFilter("todos"); setOnlySaved(false); setQuery(""); }}>{t("Ver todos")}</button></div>

        {language !== "es" && <p className="language-content-note">{t("Los datos de las fichas fueron proporcionados por los negocios en español.")}</p>}
        <div id="listado" className="result-count" aria-live="polite">{dataStatus === 'loading' ? t('Cargando negocios…') : `${visible.length} ${t(visible.length === 1 ? 'negocio encontrado' : 'negocios encontrados')}`}{onlySaved && <button className="clear-saved-filter" type="button" onClick={() => setOnlySaved(false)}>{t("Mis favoritos · Ver todos")}</button>}</div>
        {featuredVisible.length > 0 && <section className="featured-section" aria-labelledby="featured-title"><div className="featured-heading"><span className="section-kicker">{t("NEGOCIOS DESTACADOS")}</span><h2 id="featured-title">{t("Destacados")}</h2></div><div className="business-grid" aria-label="Negocios destacados">{featuredVisible.map((business,index)=>renderBusinessCard(business,index,true))}</div></section>}

        <div className={`guide-layout ${!guideVisible.length && visible.length ? 'only-featured-results' : ''}`}>
          <div className="guide-results">{guideVisible.length > 0 && <div className="guide-subheading"><span className="section-kicker">{t("DIRECTORIO LOCAL")}</span><h2>{t("Explorá la guía")}</h2></div>}
            {guideVisible.length > 0 && <div id="guide-display"><div className="business-grid" aria-label="Negocios de la guía">{guideVisible.map((business,index)=>renderBusinessCard(business,index,false))}</div></div>}
            {adsAt('between').length > 0 && <div className="between-ad-slot"><AdRotator ads={adsAt('between')} label="Publicidad entre resultados" renderAd={renderAdvertisement}/></div>}
            {visible.length===0&&<div className="empty-state"><Search size={28}/><h3>{dataStatus === 'loading' ? t("Cargando la guía") : dataStatus === 'error' ? t("No pudimos cargar la guía") : onlySaved && saved.length === 0 ? t("Todavía no guardaste negocios") : filter === 'noche' ? t("Aún no hay negocios nocturnos") : filter === 'ahora' ? t("No hay negocios abiertos ahora") : t("No encontramos coincidencias")}</h3><p>{dataStatus === 'error' ? t("Probá de nuevo en unos minutos.") : dataStatus === 'loading' ? t("Un momento, por favor.") : onlySaved && saved.length === 0 ? 'Tocá el corazón de una ficha para tenerla a mano. Se guarda en este navegador.' : filter === 'noche' ? t("Todavía no se publicaron negocios con horario de noche. Podés elegir otro horario.") : t("Probá otro lugar, categoría u horario.")}</p></div>}
          </div>

          <aside className="ad-column" aria-label="Publicidad lateral">
            <AdRotator ads={sideAds} label="Publicidad lateral" renderAd={renderAdvertisement}/>
            <button type="button" className="night-note" onClick={() => showPeriod('noche')}><MoonStar size={24} /><strong>Tu zona de noche</strong><p>Descubrí los negocios con horario nocturno.</p><span>{t("Ver negocios de noche")} <ArrowRight size={15} /></span></button>
          </aside>
        </div>
        </> : <HomeExplore mode={exploreMode} department={department} locality={locality} query={query} language={language}/>}
      </div></section>

      <section className="hero-ad-section" aria-label="Publicidad de portada"><AdRotator ads={coverAds} label="Publicidad de portada" renderAd={renderAdvertisement}/></section>

      {!!adsAt('stories').length && <section className="hero-ad-section" aria-label="Publicidad junto a historias"><AdRotator ads={adsAt('stories')} label="Publicidad junto a historias" renderAd={renderAdvertisement}/></section>}
      {yes(String(configuration.RESUMEN_SEMANAL_ACTIVO || '')) && <Newsletter action={submissionsEndpoint}/>}
      <section className="merchant-invitation" aria-labelledby="merchant-title"><div><span className="section-kicker">{t("SUMATE A VITRINA CERCA")}</span><h2 id="merchant-title">{t("Tu próximo cliente puede estar cerca.")}</h2><p>{t("Dale a tu negocio un lugar en la guía de tu zona. La ficha básica es gratuita.")}</p><a href="/?planes=1">{t("Conocé cómo publicar")} <ArrowRight size={17}/></a></div></section>
      <footer>
        <div className="footer-ads" aria-label="Publicidad antes del pie de página"><AdRotator ads={adsAt('footer')} label="Publicidad antes del pie de página" renderAd={renderAdvertisement}/></div>
        <div className="footer-main">
          <a className="brand footer-brand" href="/" aria-label="Vitrina Cerca, inicio"><span>VITRINA</span><strong>CERCA</strong></a>
          <p>{footerText}</p>
          {socialLinks.length > 0 && <nav className="social-links" aria-label="Redes sociales de Vitrina Cerca">{socialLinks.map(({key,label,url,mark})=><a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={`social-${key}`}>{key==='instagram'?<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>:key==='facebook'?<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.5A24 24 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v9z"/></svg>:key==='whatsapp'?<img src="/eventos/whatsapp.svg" alt="" width="22" height="22"/>:<span aria-hidden="true">{mark}</span>}</a>)}</nav>}
          <nav className="footer-links" aria-label="Información de Vitrina Cerca"><a className="footer-publish" href="/?planes=1">Opciones para publicar <ArrowRight size={16}/></a><a href="/administrar/">Administrar mi negocio</a><a href="/directorio/">Directorio</a><a href="/lugares/">{t("Lugares para visitar")}</a><a href="/salidas/">Salidas y experiencias</a><a href="/eventos/">{t("Eventos")}</a><a href="/historias/">{t("Historias")}</a><a href="/privacidad/">Privacidad y correcciones</a><a href="/terminos-de-uso/">Términos de uso</a><a href="/autorizacion-de-publicacion/">Autorización de publicación</a><a href="/reglas-de-publicacion/">Reglas de publicación</a></nav>
        </div>
        <div className="footer-strip"><span>Apoyá lo local, hacemos un mejor Uruguay ♡</span><strong>Negocios reales · Comunidad que crece · Un Uruguay más cerca</strong><span>© {new Date().getFullYear()} Vitrina Cerca</span>{romansiMessageUrl && <a className="footer-credit-brand" href={romansiMessageUrl} target="_blank" rel="noopener noreferrer" aria-label="Consultar a ROMANSI por diseño y desarrollo web mediante WhatsApp"><img src="/romansi-logo.svg" alt="ROMANSI Estudio Digital" loading="lazy" width="150" height="54" /></a>}</div>
      </footer>
    </main>
  );
}
