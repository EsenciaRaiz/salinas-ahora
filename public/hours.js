// Shared by the registration form and the public guide.
export function normalizeHours(value) {
  const text = String(value || '').trim().toLowerCase().replace(/[\s,;]+$/g, '');
  if (!text) return '';
  if (/^(cerrado|cerrada)$/.test(text)) return 'Cerrado';
  if (/^(a consultar|consultar|horario a consultar|sin horario)$/.test(text)) return 'Horario a consultar';
  if (/^(24\s*(h|horas)|todo el d[ií]a)$/.test(text)) return '24 horas';
  const parts = text.split(/\s*(?:,|;|\by\b)\s*/);
  const result = [];
  for (const part of parts) {
    const match = part.match(/^(?:de\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(?:hs?\.?|horas)?\s*(?:[-–—]|a|hasta)\s*(?:las\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(?:hs?\.?|horas)?$/);
    if (!match) return null;
    const start = Number(match[1]) * 60 + Number(match[2] || 0);
    const end = Number(match[3]) * 60 + Number(match[4] || 0);
    if (Number(match[1]) > 23 || Number(match[3]) > 24 || Number(match[2] || 0) > 59 || Number(match[4] || 0) > 59 || end > 1440 || start === end) return null;
    const clock = (hour, minute) => `${hour.padStart(2, '0')}:${minute || '00'}`;
    result.push(`${clock(match[1], match[2])}-${clock(match[3], match[4])}`);
  }
  return result.join(', ');
}
