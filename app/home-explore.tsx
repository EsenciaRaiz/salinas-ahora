import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';

export type ExploreMode = 'negocios' | 'lugares' | 'salidas' | 'eventos';
type Language = 'es' | 'en' | 'pt';
type Place = { id: string; nombre: string; localidad: string; departamento: string; tipo: string; resumen: string; foto_archivo?: string; foto_autor?: string; foto_licencia?: string; foto_fuente?: string; foto_licencia_url?: string };
type Outing = { id?: string; nombre: string; localidad?: string; departamento?: string; descripcion?: string; imagen_url?: string };
type Event = { id?: string; titulo: string; localidad: string; departamento?: string; entrada?: string; inicio: number; fin: number; imagen_url?: string };
const eventsEndpoint = 'https://script.google.com/macros/s/AKfycbybDC2YTJj8oqoclwREuMQxFdd8szCNZprb3WAy6gwb4fjH7KnaIdXJExqNe93yFsejiQ/exec';
const norm = (value: unknown) => String(value || '').toLocaleLowerCase('es-UY').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const photoUrl = (file?: string) => file ? 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(file) + '?width=960' : '';
const actualImage = (value?: string) => { try { if (!value) return ''; const url = new URL(value); if (url.protocol !== 'https:') return ''; if (url.hostname === 'drive.google.com' || url.hostname === 'docs.google.com') { const id = url.pathname.split('/d/')[1]?.split('/')[0] || url.searchParams.get('id'); return id && /^[A-Za-z0-9_-]{20,}$/.test(id) ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w960' : ''; } return url.href; } catch { return ''; } };
const text = {
  es: { places:'Lugares para visitar', outings:'Salidas y paseos', events:'Eventos próximos', allPlaces:'Ver todos los lugares', allOutings:'Ver todas las salidas', allEvents:'Ver toda la agenda', noPlaces:'Todavía no hay lugares cargados para esta búsqueda.', noOutings:'Aún no hay salidas organizadas publicadas aquí. Podés empezar por estos paseos públicos.', noEvents:'No hay eventos próximos publicados para esta búsqueda.', loading:'Cargando propuestas…', error:'No pudimos cargar esta información. Probá la guía completa.', free:'Gratis', paid:'Con costo', explore:'Ver paseo', view:'Ver detalles', plans:'Paseos que podés hacer por tu cuenta', source:'La información de cada lugar se verifica antes de publicarse.' },
  en: { places:'Places to visit', outings:'Outings and trips', events:'Upcoming events', allPlaces:'See all places', allOutings:'See all outings', allEvents:'See all events', noPlaces:'No places are listed for this search yet.', noOutings:'No organized outings are listed here yet. You can start with these public places.', noEvents:'No upcoming events are listed for this search.', loading:'Loading ideas…', error:'We could not load this information. Try the full guide.', free:'Free', paid:'Paid', explore:'View outing', view:'View details', plans:'Self-guided public outings', source:'Place information is verified before publication.' },
  pt: { places:'Lugares para visitar', outings:'Passeios', events:'Próximos eventos', allPlaces:'Ver todos os lugares', allOutings:'Ver todos os passeios', allEvents:'Ver a agenda', noPlaces:'Ainda não há lugares cadastrados para esta busca.', noOutings:'Ainda não há passeios organizados aqui. Você pode começar por estes lugares públicos.', noEvents:'Não há próximos eventos publicados para esta busca.', loading:'Carregando sugestões…', error:'Não foi possível carregar estas informações. Consulte o guia completo.', free:'Grátis', paid:'Pago', explore:'Ver passeio', view:'Ver detalhes', plans:'Passeios públicos por conta própria', source:'As informações de cada lugar são verificadas antes da publicação.' },
};
export default function HomeExplore({ mode, department, locality, query, language }: { mode: ExploreMode; department: string; locality: string; query: string; language: Language }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [outings, setOutings] = useState<Outing[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const copy = text[language];
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    const tasks: Promise<unknown>[] = [];
    if (mode === 'lugares' || mode === 'salidas' || mode === 'eventos') {
      tasks.push(fetch('/lugares/lugares.json', { signal: controller.signal }).then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => setPlaces(Array.isArray(data) ? data : [])));
    }
    if (mode === 'salidas') {
      tasks.push(fetch('/salidas/experiencias.json', { signal: controller.signal }).then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => setOutings(Array.isArray(data?.experiencias) ? data.experiencias : [])));
    }
    if (mode === 'eventos') {
      tasks.push(fetch(eventsEndpoint + '?action=eventos', { signal: controller.signal }).then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => { if (!data.correcto || !Array.isArray(data.eventos)) throw Error(); setEvents(data.eventos); }));
    }
    Promise.all(tasks).then(() => { if (!controller.signal.aborted) setStatus('ready'); }).catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [mode]);
  const matchingPlaces = useMemo(() => places.filter(place =>
    (!department || place.departamento === department) &&
    (!locality || norm(place.localidad) === norm(locality)) &&
    (!query || norm([place.nombre, place.tipo, place.resumen, place.localidad].join(' ')).includes(norm(query)))
  ), [places, department, locality, query]);
  const matchingOutings = useMemo(() => outings.filter(item =>
    (!department || item.departamento === department) &&
    (!locality || norm(item.localidad) === norm(locality)) &&
    (!query || norm([item.nombre, item.descripcion, item.localidad].join(' ')).includes(norm(query)))
  ), [outings, department, locality, query]);
  const matchingEvents = useMemo(() => events.filter(item =>
    Number(item.fin) > Date.now() &&
    (!locality || norm(item.localidad) === norm(locality)) &&
    (!department || item.departamento === department || (!item.departamento && places.some(place => place.departamento === department && norm(place.localidad) === norm(item.localidad)))) &&
    (!query || norm([item.titulo, item.localidad, item.entrada].join(' ')).includes(norm(query)))
  ).sort((a,b) => Number(a.inicio) - Number(b.inicio)), [events, places, department, locality, query]);
  const params = new URLSearchParams();
  if (department) params.set('departamento', department);
  if (locality) params.set('localidad', locality);
  if (language !== 'es') params.set('lang', language);
  const suffix = params.size ? '?' + params.toString() : '';
  const heading = mode === 'eventos' ? copy.events : mode === 'salidas' ? copy.outings : copy.places;
  const fullHref = (mode === 'eventos' ? '/eventos/' : mode === 'salidas' ? '/salidas/' : '/lugares/') + suffix;
  const allLabel = mode === 'eventos' ? copy.allEvents : mode === 'salidas' ? copy.allOutings : copy.allPlaces;
  const date = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-UY', { timeZone:'America/Montevideo', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  const renderPlace = (place: Place) => <article className={`explore-result-card ${place.foto_archivo ? 'has-photo' : 'without-photo'}`} key={place.id}>
    {place.foto_archivo ? <div className="explore-result-image"><img src={photoUrl(place.foto_archivo)} alt={`Fotografía de ${place.nombre}, ${place.localidad}`} loading="lazy" decoding="async" width="640" height="360"/></div> : <div className="explore-result-image is-empty"><span>{place.tipo}</span></div>}
    <div className="explore-result-copy"><span>{place.localidad} · {place.departamento}</span><h3>{place.nombre}</h3><p>{place.resumen}</p><a className="explore-card-action" href={'/lugares/?' + new URLSearchParams({ departamento:place.departamento, localidad:place.localidad, ...(language === 'es' ? {} : { lang:language }) }).toString()}>{copy.explore} <ArrowRight size={15}/></a>{place.foto_fuente && <div className="photo-credit"><a href={place.foto_fuente} target="_blank" rel="noopener noreferrer">Foto: {place.foto_autor}</a><span> · </span><a href={place.foto_licencia_url} target="_blank" rel="noopener noreferrer">{place.foto_licencia}</a></div>}</div>
  </article>;
  return <div className="home-explore-results" aria-live="polite">
    <div className="home-explore-heading"><div><span className="section-kicker">{department ? [locality, department].filter(Boolean).join(' · ') : 'URUGUAY'}</span><h2>{heading}</h2></div><a href={fullHref}>{allLabel} <ArrowRight size={16}/></a></div>
    {status === 'loading' && <p className="explore-message">{copy.loading}</p>}
    {status === 'error' && <p className="explore-message">{copy.error} <a href={fullHref}>{allLabel}</a></p>}
    {status === 'ready' && mode === 'lugares' && (matchingPlaces.length ? <div className="explore-result-grid">{matchingPlaces.slice(0,12).map(renderPlace)}</div> : <p className="explore-message">{copy.noPlaces} <a href="/lugares/">{copy.allPlaces}</a></p>)}
    {status === 'ready' && mode === 'salidas' && <>{matchingOutings.length ? <div className="explore-result-grid">{matchingOutings.slice(0,8).map((item,index) => <a className="explore-result-card" href={fullHref} key={item.id || index}>{actualImage(item.imagen_url) && <div className="explore-result-image"><img src={actualImage(item.imagen_url)} alt={item.nombre} loading="lazy" decoding="async" width="640" height="360"/></div>}<div className="explore-result-copy"><span>{item.localidad || item.departamento || 'Uruguay'}</span><h3>{item.nombre}</h3><p>{item.descripcion}</p><b>{copy.view} <ArrowRight size={15}/></b></div></a>)}</div> : <><p className="explore-message">{copy.noOutings}</p>{matchingPlaces.length > 0 && <><h3 className="explore-inline-heading">{copy.plans}</h3><div className="explore-result-grid">{matchingPlaces.slice(0,4).map(renderPlace)}</div></>}</>}</>}
    {status === 'ready' && mode === 'eventos' && (matchingEvents.length ? <div className="explore-result-grid">{matchingEvents.slice(0,8).map((item,index) => <a className="explore-result-card" key={item.id || index} href={'/eventos/?evento=' + encodeURIComponent(String(item.id || [item.titulo,item.inicio,item.localidad].join('|')))}>{actualImage(item.imagen_url) && <div className="explore-result-image"><img src={actualImage(item.imagen_url)} alt={item.titulo} loading="lazy" decoding="async" width="540" height="360"/></div>}<div className="explore-result-copy"><span><CalendarDays size={13}/>{date.format(Number(item.inicio))} · {item.localidad}</span><h3>{item.titulo}</h3><p>{item.entrada === 'Gratis' ? copy.free : copy.paid}</p><b>{copy.view} <ArrowRight size={15}/></b></div></a>)}</div> : <p className="explore-message">{copy.noEvents} <a href={fullHref}>{copy.allEvents}</a></p>)}
  </div>;
}
