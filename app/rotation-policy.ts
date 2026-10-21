// This trial changes presentation only. Free listings never expire or become paid.
export const FREE_ROTATION_START = '2026-10-21';
export const FREE_ROTATION_END_EXCLUSIVE = '2026-12-20';
export function freeRotationActive(date = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  return today >= FREE_ROTATION_START && today < FREE_ROTATION_END_EXCLUSIVE;
}
