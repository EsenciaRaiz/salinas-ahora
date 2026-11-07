import { servesDepartment, coverageOf } from '/coverage.js';
const cards = document.querySelector('#cards');
const department = document.querySelector('#department');
const locality = document.querySelector('#locality');
const localityOptions = document.querySelector('#locality-options');
const type = document.querySelector('#type');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');
const serviceLink = document.querySelector('#service-link');
const serviceTitle = document.querySelector('#service-title');
const serviceStatus = document.querySelector('#service-status');
const serviceResults = document.querySelector('#service-results');
const eventStatus = document.querySelector('#event-status');
const eventResults = document.querySelector('#event-results');
const eventLink = document.querySelector('#event-link');
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
let businesses = null;
let events = null;
let businessLoadFailed = false;
let eventLoadFailed = false;
const requested = new URLSearchParams(location.search);
department.replaceChildren(option('', 'Todos los departamentos'), ...departments.map((item) => option(item, item)));
if (departments.includes(requested.get('departamento'))) department.value = requested.get('departamento');
locality.value = requested.get('localidad') || '';

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
    ? 'Negocios y servicios en ' + chosenLocality
    : selectedDepartment ? 'Negocios y servicios en ' + selectedDepartment : 'Negocios y servicios';
  eventLink.href = '/eventos/' + (chosenLocality ? '?localidad=' + encodeURIComponent(chosenLocality) : '');

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
      escapeHtml(place.ubicacion_visible || place.localidad) + ' · ' + escapeHtml(place.departamento) + ' · ' +
      escapeHtml(place.tipo) + '</span><h3>' + escapeHtml(place.nombre) + '</h3><p>' +
      escapeHtml(place.resumen) + '</p><p class="route">' + escapeHtml(place.recorrido) +
      '</p><p class="note">' + escapeHtml(place.nota) +
      '</p><div class="card-links"><a href="' + escapeHtml(map) +
      '" target="_blank" rel="noopener noreferrer">Ver en mapa ↗</a><a class="source" href="' +
      escapeHtml(place.url) + '" target="_blank" rel="noopener noreferrer">Fuente oficial ↗</a></div></article>';
  }).join('');
  renderConnections();
}
const item = (href, heading, description) => {
  const link = document.createElement('a');
  link.className = 'connected-item';
  link.href = href;
  const title = document.createElement('strong');
  title.textContent = heading;
  const detail = document.createElement('span');
  detail.textContent = description;
  link.append(title, detail);
  return link;
};
const eventKey = (event) => String(event.id || [event.titulo, event.inicio, event.localidad].join('|'));
const eventDate = new Intl.DateTimeFormat('es-UY', { timeZone: 'America/Montevideo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
function renderConnections() {
  const selectedDepartment = department.value;
  const chosenLocality = locality.value.trim();
  if (businesses) {
    const matching = businesses.filter((business) => {
      const homeDepartment = String(business.departamento || business.departamento_region || '');
      const homeLocality = String(business.zona || '');
      if (!selectedDepartment && !chosenLocality) return true;
      if (chosenLocality && normalize(homeLocality) === normalize(chosenLocality) &&
          (!selectedDepartment || homeDepartment === selectedDepartment)) return true;
      return !!selectedDepartment && (homeDepartment === selectedDepartment || servesDepartment(business, selectedDepartment))
        && (!chosenLocality || servesDepartment(business, selectedDepartment));
    });
    serviceStatus.textContent = matching.length
      ? matching.length + ' ' + (matching.length === 1 ? 'ficha disponible' : 'fichas disponibles') + ' en la guía'
      : 'Todavía no hay fichas para esta selección. Podés consultar la guía completa.';
    serviceResults.replaceChildren(...matching.slice(0, 3).map((business) => {
      const coverage = coverageOf(business);
      return item('/?negocio=' + encodeURIComponent(business.id),
        business.nombre, [business.categoria, coverage.label || [business.zona, business.departamento || business.departamento_region].filter(Boolean).join(' · ')].filter(Boolean).join(' · '));
    }));
  } else {
    serviceStatus.textContent = businessLoadFailed ? 'No pudimos cargar las fichas. Abrí la guía para ver los negocios.' : 'Buscando fichas de la guía…';
  }
  if (events) {
    if (selectedDepartment && !chosenLocality) {
      eventStatus.textContent = 'Elegí una localidad para ver sus eventos; la agenda no filtra por departamento.';
      eventResults.replaceChildren();
    } else {
      const matching = events.filter((event) => Number(event.fin) > Date.now() &&
        (!chosenLocality || normalize(event.localidad) === normalize(chosenLocality)))
        .sort((a, b) => Number(a.inicio) - Number(b.inicio));
      eventStatus.textContent = matching.length
        ? matching.length + ' ' + (matching.length === 1 ? 'evento próximo' : 'eventos próximos')
        : 'Todavía no hay eventos próximos para esta selección.';
      eventResults.replaceChildren(...matching.slice(0, 3).map((event) =>
        item('/eventos/?evento=' + encodeURIComponent(eventKey(event)),
          event.titulo, [event.localidad, eventDate.format(Number(event.inicio)),
            event.entrada === 'Gratis' ? 'Gratis' : 'Entrada paga'].join(' · '))));
    }
  } else {
    eventStatus.textContent = eventLoadFailed ? 'No pudimos cargar la agenda. Abrila para consultar eventos.' : 'Buscando eventos próximos…';
  }
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

fetch('/guide-data.json', { cache: 'no-store' })
  .then((response) => { if (!response.ok) throw Error('No se pudo cargar la guía'); return response.json(); })
  .then((data) => { businesses = data.correcto && Array.isArray(data.negocios) ? data.negocios : []; renderConnections(); })
  .catch(() => { businessLoadFailed = true; renderConnections(); });
fetch('https://script.google.com/macros/s/AKfycbybDC2YTJj8oqoclwREuMQxFdd8szCNZprb3WAy6gwb4fjH7KnaIdXJExqNe93yFsejiQ/exec?action=eventos',
  { cache: 'no-store', signal: AbortSignal.timeout(15000) })
  .then((response) => { if (!response.ok) throw Error('No se pudo cargar la agenda'); return response.json(); })
  .then((data) => { events = data.correcto && Array.isArray(data.eventos) ? data.eventos : []; renderConnections(); })
  .catch(() => { eventLoadFailed = true; renderConnections(); });
