'use client';

import { useEffect, useRef, useState } from 'react';

type Business = { id: string; nombre: string; zona: string; departamento?: string; departamento_region?: string; mapa_url?: string };
type Coordinates = { latitude: number; longitude: number };

function coordinatesOf(business: Business): Coordinates | null {
  if (!business.mapa_url) return null;
  try {
    const url = new URL(business.mapa_url);
    if (url.protocol !== 'https:' || !['google.com', 'www.google.com', 'maps.google.com', 'www.openstreetmap.org'].includes(url.hostname)) return null;
    const value = url.searchParams.get('query') || url.searchParams.get('q') || url.searchParams.get('ll') || '';
    const match = value.match(/^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/)
      || url.pathname.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
    if (!match) return null;
    const latitude = Number(match[1]), longitude = Number(match[2]);
    return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
  } catch { return null; }
}

let leafletLoader: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  const existing = (window as Window & { L?: any }).L;
  if (existing) return Promise.resolve(existing);
  if (leafletLoader) return leafletLoader;
  leafletLoader = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-vitrina-map]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.dataset.vitrinaMap = 'true';
      document.head.appendChild(css);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      const library = (window as Window & { L?: any }).L;
      if (library) resolve(library);
      else reject(new Error('No se pudo abrir el mapa.'));
    };
    script.onerror = () => reject(new Error('No se pudo abrir el mapa.'));
    document.head.appendChild(script);
  }).catch((error) => { leafletLoader = null; throw error; });
  return leafletLoader;
}

export default function BusinessMap({ businesses }: { businesses: Business[] }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const points = businesses.flatMap((business) => {
    const coordinates = coordinatesOf(business);
    return coordinates ? [{ business, coordinates }] : [];
  });
  const pointKey = points.map(({ business, coordinates }) => `${business.id}:${coordinates.latitude},${coordinates.longitude}`).join('|');

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !element.current) return;
      const instance = L.map(element.current, { scrollWheelZoom: false, zoomControl: false });
      L.control.zoom({ zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(instance);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(instance);
      instance.setView([-32.8, -55.8], 7);
      map.current = instance;
      markers.current = L.layerGroup().addTo(instance);
      setReady(true);
      requestAnimationFrame(() => instance.invalidateSize());
    }).catch(() => { if (!cancelled) setError('No se pudo cargar el mapa. Podés seguir usando la lista de negocios.'); });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !map.current || !markers.current) return;
    const L = (window as Window & { L?: any }).L;
    if (!L) return;
    markers.current.clearLayers();
    const bounds: Array<[number, number]> = [];
    for (const { business, coordinates } of points) {
      const position: [number, number] = [coordinates.latitude, coordinates.longitude];
      bounds.push(position);
      const icon = L.divIcon({ className: 'vitrina-map-pin', html: '<span aria-hidden="true"></span>', iconSize: [32, 40], iconAnchor: [16, 40] });
      const popup = document.createElement('div');
      popup.className = 'vitrina-map-popup';
      const title = document.createElement('strong');
      title.textContent = business.nombre;
      const location = document.createElement('span');
      location.textContent = [business.zona, business.departamento || business.departamento_region].filter(Boolean).join(' · ');
      const link = document.createElement('a');
      link.href = 'https://vitrinacerca.com/?negocio=' + encodeURIComponent(business.id);
      link.textContent = 'Ver ficha';
      popup.append(title, location, link);
      L.marker(position, { icon }).bindPopup(popup).addTo(markers.current);
    }
    if (bounds.length) map.current.fitBounds(L.latLngBounds(bounds), { padding: [42, 42], maxZoom: 14 });
    else map.current.setView([-32.8, -55.8], 7);
    map.current.invalidateSize();
  }, [ready, pointKey]);

  return <div className="business-map-panel" aria-label="Mapa de negocios publicados">
    <div className="business-map-heading"><div><strong>Negocios en el mapa</strong><span>{points.length ? points.length + ' ubicaciones visibles en esta búsqueda' : 'Sin ubicaciones visibles en esta búsqueda'}</span></div><p>Solo aparecen los negocios que eligieron mostrar su ubicación.</p></div>
    <div ref={element} className="business-map-canvas" role="region" aria-label="Mapa interactivo de negocios"/>
    {error && <p className="business-map-message" role="status">{error}</p>}
    {!points.length && <p className="business-map-message">Aún no hay negocios con ubicación exacta habilitada. Para agregar un pin, el negocio debe elegir «Mostrar en el mapa» y «Usar ubicación del local» en el formulario.</p>}
  </div>;
}
