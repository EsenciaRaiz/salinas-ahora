export type Hours = {
  horario_lunes_a_viernes?: string;
  horario_sabado?: string;
  horario_domingo?: string;
};

export type TimeFilter = 'todos' | 'ahora' | 'manana' | 'tarde' | 'noche';

type Clock = { day: number; minute: number };
type Interval = { start: number; end: number };

export function montevideoClock(date = new Date()): Clock {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return {
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday),
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function hoursForDay(business: Hours, day: number): string {
  if (day === 0) return business.horario_domingo || '';
  if (day === 6) return business.horario_sabado || '';
  return business.horario_lunes_a_viernes || '';
}

function parseHours(value: string): Interval[] {
  const text = value.trim().toLowerCase();
  if (/^(24\s*h|24\s*horas|todo el día)$/.test(text)) return [{ start: 0, end: 1440 }];
  if (!text || /cerrado|consultar|sin horario/.test(text)) return [];
  const intervals: Interval[] = [];
  const pattern = /\b([01]?\d|2[0-3]):([0-5]\d)\s*[-–—]\s*([01]?\d|2[0-4]):([0-5]\d)\b/g;
  for (const match of text.matchAll(pattern)) {
    const start = Number(match[1]) * 60 + Number(match[2]);
    const end = Number(match[3]) * 60 + Number(match[4]);
    if (end > 1440 || (end === 1440 && match[4] !== '00') || start === end) continue;
    intervals.push({ start, end: end <= start ? end + 1440 : end });
  }
  return intervals;
}

function intervalsForDay(business: Hours, day: number): Interval[] {
  return parseHours(hoursForDay(business, day));
}

export function hasKnownHours(business: Hours, day: number): boolean {
  return intervalsForDay(business, day).length > 0;
}

export function hoursLabel(business: Hours, day: number): string {
  return hoursForDay(business, day) || 'Horario a consultar';
}

export function isOpenNow(business: Hours, clock: Clock): boolean {
  if (intervalsForDay(business, clock.day).some(({ start, end }) => clock.minute >= start && clock.minute < end)) return true;
  const yesterday = (clock.day + 6) % 7;
  return intervalsForDay(business, yesterday).some(({ end }) => end > 1440 && clock.minute < end - 1440);
}

export function openInPeriod(business: Hours, clock: Clock, filter: Exclude<TimeFilter, 'todos' | 'ahora'>): boolean {
  const periods = { manana: [360, 720], tarde: [720, 1200], noche: [1200, 1800] } as const;
  const [from, to] = periods[filter];
  return [-1, 0, 1].some((offset) =>
    intervalsForDay(business, (clock.day + offset + 7) % 7)
      .some(({ start, end }) => start + offset * 1440 < to && end + offset * 1440 > from));
}
