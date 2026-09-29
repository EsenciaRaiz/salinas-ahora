export const departments = ['Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida','Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro','Rivera','Rocha','Salto','San José','Soriano','Tacuarembó','Treinta y Tres'];
// A readable final line preserves coverage in the existing spreadsheet description.
export function coverageOf(business) {
  const description = String(business.descripcion || '');
  const match = description.match(/(?:^|\n)Zona de atención: ([^\n]+)\.$/);
  const value = match?.[1] || '';
  const country = value === 'Todo Uruguay';
  const regions = value.split(', ').filter(region => departments.includes(region));
  const valid = country || (regions.length > 0 && regions.join(', ') === value);
  return { country: valid && country, regions: valid ? regions : [], description: valid ? description.slice(0, match.index).trim() : description,
    label: valid ? `Atiende en ${country ? 'todo Uruguay' : regions.join(', ')}` : '' };
}
export function servesDepartment(business, department) {
  const area = coverageOf(business);
  return area.country || area.regions.includes(department);
}
export function withCoverage(description, mode, regions) {
  const selected = departments.filter(region => regions.includes(region));
  if (mode === 'varios' && !selected.length) throw Error('Marcá al menos un departamento donde atendés.');
  const value = mode === 'pais' ? 'Todo Uruguay' : mode === 'varios' ? selected.join(', ') : '';
  const result = String(description || '').trim() + (value ? `\nZona de atención: ${value}.` : '');
  // The public description allows 500 characters; the coverage line is metadata
  // appended for compatibility with existing spreadsheet rows and search pages.
  if (result.length > 750) throw Error('La descripción y las zonas de atención son demasiado largas. Acortá la descripción e intentá de nuevo.');
  return result;
}
