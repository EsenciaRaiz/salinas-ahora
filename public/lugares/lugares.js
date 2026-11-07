const cards = document.querySelector('#cards');
const department = document.querySelector('#department');
const locality = document.querySelector('#locality');
const localityOptions = document.querySelector('#locality-options');
const type = document.querySelector('#type');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');
const serviceLink = document.querySelector('#service-link');
const serviceTitle = document.querySelector('#service-title');
const destinationActions = document.querySelector('#destination-actions');
const destinationName = document.querySelector('#destination-name');
const directionsLink = document.querySelector('#directions-link');
const seeThingsLink = document.querySelector('#see-things-link');

const departments = ["Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores","Florida","Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro","Rivera","Rocha","Salto","San José","Soriano","Tacuarembó","Treinta y Tres"];
const option = (value, label) => {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = label;
  return element;
};
const unique = (items) => [...new Set(items)].sort((a, b) => a.localeCompare(b, 'es-UY'));
const normalize = (value) => String(value || '').trim().toLocaleLowerCase('es-UY')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

let places = [];
department.replaceChildren(option('', 'Todos los departamentos'), ...departments.map((item) => option(item, item)));

function updateLocalityOptions() {
  const matchingLocalities = unique(places
    .filter((place) => !department.value || place.departamento === department.value)
    .map((place) => place.localidad));
  localityOptions.replaceChildren(...matchingLocalities.map((item) => option(item, item)));
}

function render() {
  const selectedDepartment = department.value;
  const chosenLocality = locality.value.trim();

  const matchedPlace = places.find((place) =>
    normalize(place.localidad) === normalize(chosenLocality) &&
    (!selectedDepartment || place.departamento === selectedDepartment));
  const destinationDepartment = selectedDepartment || matchedPlace?.departamento || '';
  const params = new URLSearchParams();
  if (destinationDepartment) params.set('departamento', destinationDepartment);
  if (chosenLocality && destinationDepartment) params.set('localidad', chosenLocality);
  else if (chosenLocality) params.set('buscar', chosenLocality);
  serviceLink.href = '/' + (params.size ? '?' + params.toString() : '') + '#guia';
  serviceTitle.textContent = chosenLocality
    ? '¿Buscás algo útil en ' + chosenLocality + '?'
    : '¿Buscás algo útil en esta zona?';

  destinationActions.hidden = !chosenLocality;
  if (chosenLocality) {
    destinationName.textContent = chosenLocality + (destinationDepartment ? ' · ' + destinationDepartment : '');
    const destination = [chosenLocality,
      normalize(chosenLocality) === normalize(destinationDepartment) ? '' : destinationDepartment,
      'Uruguay'].filter(Boolean).join(', ');
    directionsLink.href = 'https://www.google.com/maps/dir/?api=1&destination='
      + encodeURIComponent(destination);
  }

  const visible = places.filter((place) =>
    (!selectedDepartment || place.departamento === selectedDepartment) &&
    (!chosenLocality || normalize(place.localidad) === normalize(chosenLocality)) &&
    (!type.value || place.tipo === type.value));
  count.textContent = visible.length + ' ' +
    (visible.length === 1 ? 'lugar o paseo disponible' : 'lugares y paseos disponibles');
  empty.hidden = visible.length !== 0;
  cards.innerHTML = visible.map((place) => {
    const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place.mapa);
    return '<article class="card"><span class="card-meta">' +
      escapeHtml(place.localidad) + ' · ' + escapeHtml(place.departamento) + ' · ' +
      escapeHtml(place.tipo) + '</span><h3>' + escapeHtml(place.nombre) + '</h3><p>' +
      escapeHtml(place.resumen) + '</p><p class="route">' + escapeHtml(place.recorrido) +
      '</p><p class="note">' + escapeHtml(place.nota) +
      '</p><div class="card-links"><a href="' + escapeHtml(map) +
      '" target="_blank" rel="noopener noreferrer">Ver en mapa ↗</a><a class="source" href="' +
      escapeHtml(place.url) + '" target="_blank" rel="noopener noreferrer">Fuente oficial ↗</a></div></article>';
  }).join('');
}
document.querySelector('#filters').addEventListener('submit', (event) => {
  event.preventDefault();
  render();
  count.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
department.addEventListener('change', () => { locality.value = ''; updateLocalityOptions(); render(); });
locality.addEventListener('input', render);
type.addEventListener('change', render);
seeThingsLink.addEventListener('click', () => { type.value = ''; render(); });
fetch('/lugares/lugares.json')
  .then((response) => { if (!response.ok) throw Error('No se pudo cargar la guía'); return response.json(); })
  .then((data) => {
    places = Array.isArray(data) ? data : [];
    type.replaceChildren(option('', 'Todos los intereses'),
      ...unique(places.map((place) => place.tipo)).map((item) => option(item, item)));
    updateLocalityOptions();
    render();
  })
  .catch(() => { count.textContent = 'No pudimos cargar los lugares. Volvé a intentar más tarde.'; });
