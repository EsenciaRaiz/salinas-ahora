import { useEffect, useRef, useState, type ReactNode } from 'react';
import { groupRotationItems } from './rotation-groups';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export const ROTATION_INTERVAL_MS = 4_000;

/** Keep every slide in the same grid cell so changing content never moves the page. */
export default function TimedRotator<T extends { id: string }>({ items, label, renderItem, className = '', groupBusinesses = false }: {
  items: T[]; label: string; renderItem: (item: T, index: number) => ReactNode; className?: string; groupBusinesses?: boolean;
}) {
  const [groupSize, setGroupSize] = useState(() => groupBusinesses ? (window.innerWidth > 1000 ? 3 : window.innerWidth > 700 ? 2 : 1) : 1);
  useEffect(() => {
    if (!groupBusinesses) return;
    const desktop = window.matchMedia('(min-width: 1001px)'), tablet = window.matchMedia('(min-width: 701px)');
    const update = () => setGroupSize(desktop.matches ? 3 : tablet.matches ? 2 : 1);
    update(); desktop.addEventListener('change', update); tablet.addEventListener('change', update);
    return () => { desktop.removeEventListener('change', update); tablet.removeEventListener('change', update); };
  }, [groupBusinesses]);
  const groups = groupRotationItems(items, groupSize);
  const pageCount = groups.length;
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
  useEffect(() => { setCurrent(0); }, [itemKeys, groupSize]);
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
  const running = !paused && !hovered && !focused && !reducedMotion && inView && !hidden && pageCount > 1;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setCurrent(index => (index + 1) % pageCount), ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [running, pageCount, itemKeys, current]);
  if (!items.length) return null;
  const active = current % pageCount;
  const move = (offset: number) => setCurrent((active + offset + pageCount) % pageCount);
  return <div ref={container} className={`timed-rotator ${className}`} role="region" aria-roledescription="carrusel" aria-label={label}>
    <div className="rotation-stage" aria-live="off"
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}>
      {groups.map((group, index) => <div key={group[0].id} className={`rotation-slide ${index === active ? 'is-current' : ''}`} aria-hidden={index !== active} inert={index !== active} role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${pageCount}`}>
        {groupBusinesses ? <div className="rotation-business-group" style={{ gridTemplateColumns: `repeat(${groupSize}, minmax(0, 1fr))` }}>{group.map((item, offset) => <div className="rotation-business-item" key={item.id}>{renderItem(item, index * groupSize + offset)}</div>)}</div> : renderItem(group[0], index)}
      </div>)}
    </div>
    {pageCount > 1 && <div className="rotation-controls" aria-label={`Controles de ${label}`}>
      <button type="button" onClick={() => move(-1)} aria-label={`Anterior en ${label}`}><ChevronLeft size={18}/></button>
      <span className="rotation-counter">{active + 1} / {pageCount}</span>
      <button type="button" onClick={() => move(1)} aria-label={`Siguiente en ${label}`}><ChevronRight size={18}/></button>
      {!reducedMotion && <button type="button" className="rotation-pause" onClick={() => setPaused(value => !value)} aria-label={`${paused ? 'Reanudar' : 'Pausar'} ${label}`} aria-pressed={paused}>{paused ? <Play size={15}/> : <Pause size={15}/>} {paused ? 'Reanudar' : 'Pausar'}</button>}
    </div>}
  </div>;
}
