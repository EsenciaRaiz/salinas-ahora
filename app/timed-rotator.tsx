import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export const ROTATION_INTERVAL_MS = 4_000;

/** Keep every slide in the same grid cell so changing content never moves the page. */
export default function TimedRotator<T extends { id: string }>({ items, label, renderItem, className = '' }: {
  items: T[]; label: string; renderItem: (item: T, index: number) => ReactNode; className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const itemKeys = items.map(item => item.id).join('|');
  const hasItems = items.length > 0;
  useEffect(() => { setCurrent(0); }, [itemKeys]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setHidden(document.hidden);
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = new IntersectionObserver(entries => setInView((entries[0]?.intersectionRatio ?? 0) >= 0.2), { threshold: 0.2 });
    if (container.current) observer.observe(container.current);
    return () => { observer.disconnect(); preference.removeEventListener('change', updatePreference); document.removeEventListener('visibilitychange', updateVisibility); };
  }, [hasItems]);
  const running = !paused && !hovered && !focused && !reducedMotion && inView && !hidden && items.length > 1;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setCurrent(index => (index + 1) % items.length), ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [running, items.length, itemKeys, current]);
  if (!items.length) return null;
  const active = current % items.length;
  const move = (offset: number) => setCurrent((active + offset + items.length) % items.length);
  return <div ref={container} className={`timed-rotator ${className}`} role="region" aria-roledescription="carrusel" aria-label={label}>
    <div className="rotation-stage" aria-live="off"
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}>
      {items.map((item, index) => <div key={item.id} className={`rotation-slide ${index === active ? 'is-current' : ''}`} aria-hidden={index !== active} inert={index !== active} role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${items.length}`}>
        {renderItem(item, index)}
      </div>)}
    </div>
    {items.length > 1 && <div className="rotation-controls" aria-label={`Controles de ${label}`}>
      <button type="button" onClick={() => move(-1)} aria-label={`Anterior en ${label}`}><ChevronLeft size={18}/></button>
      <span className="rotation-counter">{active + 1} / {items.length}</span>
      <button type="button" onClick={() => move(1)} aria-label={`Siguiente en ${label}`}><ChevronRight size={18}/></button>
      {!reducedMotion && <button type="button" className="rotation-pause" onClick={() => setPaused(value => !value)} aria-label={`${paused ? 'Reanudar' : 'Pausar'} ${label}`} aria-pressed={paused}>{paused ? <Play size={15}/> : <Pause size={15}/>} {paused ? 'Reanudar' : 'Pausar'}</button>}
    </div>}
  </div>;
}
