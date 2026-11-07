const cards = document.querySelector('#cards');
const department = document.querySelector('#department');
const locality = document.querySelector('#locality');
const localityOptions = document.querySelector('#locality-options');
const type = document.querySelector('#type');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');
const destinationActions = document.querySelector('#destination-actions');
const destinationName = document.querySelector('#destination-name');
const directionsLink = document.querySelector('#directions-link');
const seeThingsLink = document.querySelector('#see-things-link');

const languageSelect = document.querySelector('#language');
const languageKey = 'vitrina-language';
let language = 'es';
try { const saved = localStorage.getItem(languageKey); if (['es','en','pt'].includes(saved)) language = saved; } catch {}
const copy = {
  es: {
    title:'Lugares para visitar en Uruguay | Vitrina Cerca',
    description:'Plazas públicas, parques, miradores, historia y arquitectura en distintas localidades de Uruguay. Elegí departamento y tipo de paseo.',
    skip:'Ir a los lugares',navBusinesses:'Negocios y servicios',navEvents:'Eventos',navExperiences:'Experiencias',
    heroEyebrow:'PASEOS EN URUGUAY',heroTitle:'Encontrá tu próximo paseo',
    heroIntro:'Elegí un destino y descubrí lugares reales para visitar.',
    heroPrimary:'Elegir destino',heroSecondary:'Buscar negocios',
    exploreEyebrow:'PLANIFICÁ TU VISITA',exploreTitle:'Elegí adónde ir',
    exploreIntro:'Plazas, patrimonio, costa y naturaleza en los 19 departamentos.',
    where:'Departamento',locality:'Localidad',interest:'Tipo de lugar',allDepartments:'Todos los departamentos',
    localityPlaceholder:'Escribí o elegí una localidad',allInterests:'Todos los intereses',
    destinationEyebrow:'TU DESTINO',destinationIntro:'Elegí cómo llegar y explorá lo que ya encontramos allí.',
    directions:'Cómo llegar',seeThings:'Qué hacer allí',
    serviceEyebrow:'PARA RESOLVER LO QUE NECESITÁS',services:'Negocios y servicios',serviceLink:'Ver todos los negocios y servicios',
    eventEyebrow:'PARA SUMAR A TU PLAN',events:'Próximos eventos',eventLink:'Ver la agenda de eventos',
    empty:'Todavía no publicamos paseos para esta selección. Probá otro destino o tipo de lugar.',
    nextEyebrow:'TODO EN UN MISMO LUGAR',nextTitle:'Después del paseo, seguí explorando.',
    nextIntro:'Encontrá comercios y servicios locales, eventos y experiencias desde Vitrina Cerca.',
    nextBusinesses:'Buscar negocios',nextEvents:'Ver eventos',
    footer:'Los recorridos son sugerencias para hacer por espacios públicos. Verificá el acceso y los horarios antes de visitar interiores.',
    privacy:'Privacidad y correcciones',contentNote:'',
    servicesIn:'Negocios y servicios en ',placeOne:'lugar o paseo disponible',placeMany:'lugares y paseos disponibles',
    map:'Ver mapa',source:'Fuente oficial',listingOne:'ficha disponible',listingMany:'fichas disponibles',
    inGuide:' en la guía',noBusinesses:'Todavía no hay fichas para esta selección. Podés consultar la guía completa.',
    businessError:'No pudimos cargar las fichas. Abrí la guía para ver los negocios.',businessLoading:'Buscando fichas de la guía…',
    chooseLocality:'Elegí una localidad para ver sus eventos; la agenda no filtra por departamento.',
    eventOne:'evento próximo',eventMany:'eventos próximos',noEvents:'Todavía no hay eventos próximos para esta selección.',
    eventError:'No pudimos cargar la agenda. Abrila para consultar eventos.',eventLoading:'Buscando eventos próximos…',
    details:'Ver recorrido y datos prácticos',free:'Gratis',paid:'Entrada paga',placesError:'No pudimos cargar los lugares. Volvé a intentar más tarde.',placesLoading:'Cargando lugares…'
  },
  en: {
    title:'Places to visit in Uruguay | Vitrina Cerca',
    description:'Discover public squares, parks, viewpoints, history and architecture across Uruguay.',
    skip:'Skip to places',navBusinesses:'Businesses and services',navEvents:'Events',navExperiences:'Experiences',
    heroEyebrow:'OUTINGS IN URUGUAY',heroTitle:'Find your next outing',
    heroIntro:'Choose a destination and discover real places to visit.',
    heroPrimary:'Choose a destination',heroSecondary:'Find businesses',
    exploreEyebrow:'PLAN YOUR VISIT',exploreTitle:'Choose a destination',
    exploreIntro:'Squares, heritage, coast and nature across all 19 departments.',
    where:'Department',locality:'Town or city',interest:'Type of place',allDepartments:'All departments',
    localityPlaceholder:'Type or choose a town or city',allInterests:'All interests',
    destinationEyebrow:'YOUR DESTINATION',destinationIntro:'Get directions and explore what we have found here.',
    directions:'Get directions',seeThings:'Things to do here',
    serviceEyebrow:'FOR EVERYDAY NEEDS',services:'Businesses and services',serviceLink:'See all businesses and services',
    eventEyebrow:'ADD TO YOUR PLAN',events:'Upcoming events',eventLink:'See the event calendar',
    empty:'No outings published for this selection yet. Try another destination or type of place.',
    nextEyebrow:'EVERYTHING IN ONE PLACE',nextTitle:'Keep exploring after your outing.',
    nextIntro:'Find local businesses, services, events and experiences on Vitrina Cerca.',
    nextBusinesses:'Find businesses',nextEvents:'See events',
    footer:'These routes suggest public spaces to explore. Check access and opening hours before entering buildings.',
    privacy:'Privacy and corrections',contentNote:'Place descriptions and business details are currently provided in Spanish.',
    servicesIn:'Businesses and services in ',placeOne:'place or outing available',placeMany:'places and outings available',
    map:'View map',source:'Official source',listingOne:'listing available',listingMany:'listings available',
    inGuide:' in the directory',noBusinesses:'No listings yet for this selection. You can browse the full directory.',
    businessError:'Could not load business listings. Open the directory to browse them.',businessLoading:'Loading business listings…',
    chooseLocality:'Choose a town or city to see its events; the calendar cannot filter by department.',
    eventOne:'upcoming event',eventMany:'upcoming events',noEvents:'No upcoming events for this selection yet.',
    eventError:'Could not load the calendar. Open it to browse events.',eventLoading:'Loading upcoming events…',
    details:'Route and practical details',free:'Free',paid:'Paid admission',placesError:'Could not load places. Please try again later.',placesLoading:'Loading places…'
  },
  pt: {
    title:'Lugares para visitar no Uruguai | Vitrina Cerca',
    description:'Descubra praças públicas, parques, mirantes, história e arquitetura em todo o Uruguai.',
    skip:'Ir para os lugares',navBusinesses:'Comércios e serviços',navEvents:'Eventos',navExperiences:'Experiências',
    heroEyebrow:'PASSEIOS NO URUGUAI',heroTitle:'Encontre seu próximo passeio',
    heroIntro:'Escolha um destino e descubra lugares reais para visitar.',
    heroPrimary:'Escolher destino',heroSecondary:'Buscar negócios',
    exploreEyebrow:'PLANEJE SUA VISITA',exploreTitle:'Escolha um destino',
    exploreIntro:'Praças, patrimônio, litoral e natureza nos 19 departamentos.',
    where:'Departamento',locality:'Cidade ou localidade',interest:'Tipo de lugar',allDepartments:'Todos os departamentos',
    localityPlaceholder:'Digite ou escolha uma cidade',allInterests:'Todos os interesses',
    destinationEyebrow:'SEU DESTINO',destinationIntro:'Veja como chegar e explore o que já encontramos aqui.',
    directions:'Como chegar',seeThings:'O que fazer aqui',
    serviceEyebrow:'PARA O QUE VOCÊ PRECISA',services:'Comércios e serviços',serviceLink:'Ver todos os comércios e serviços',
    eventEyebrow:'PARA INCLUIR NO SEU ROTEIRO',events:'Próximos eventos',eventLink:'Ver a agenda de eventos',
    empty:'Ainda não publicamos passeios para esta seleção. Tente outro destino ou tipo de lugar.',
    nextEyebrow:'TUDO EM UM SÓ LUGAR',nextTitle:'Depois do passeio, continue explorando.',
    nextIntro:'Encontre comércios e serviços locais, eventos e experiências na Vitrina Cerca.',
    nextBusinesses:'Buscar comércios',nextEvents:'Ver eventos',
    footer:'Os roteiros sugerem espaços públicos para visitar. Confirme o acesso e os horários antes de entrar em edifícios.',
    privacy:'Privacidade e correções',contentNote:'As descrições dos lugares e os dados dos comércios ainda estão em espanhol.',
    servicesIn:'Comércios e serviços em ',placeOne:'lugar ou passeio disponível',placeMany:'lugares e passeios disponíveis',
    map:'Ver mapa',source:'Fonte oficial',listingOne:'ficha disponível',listingMany:'fichas disponíveis',
    inGuide:' no guia',noBusinesses:'Ainda não há fichas para esta seleção. Você pode consultar o guia completo.',
    businessError:'Não foi possível carregar as fichas. Abra o guia para ver os comércios.',businessLoading:'Carregando fichas do guia…',
    chooseLocality:'Escolha uma cidade para ver os eventos; a agenda não filtra por departamento.',
    eventOne:'próximo evento',eventMany:'próximos eventos',noEvents:'Ainda não há próximos eventos para esta seleção.',
    eventError:'Não foi possível carregar a agenda. Abra-a para consultar os eventos.',eventLoading:'Carregando próximos eventos…',
    details:'Ver roteiro e informações práticas',free:'Grátis',paid:'Entrada paga',placesError:'Não foi possível carregar os lugares. Tente novamente mais tarde.',placesLoading:'Carregando lugares…'
  }
};
const t = (key) => copy[language][key];
const typeNames = {
  en: {'Arquitectura':'Architecture','Historia':'History','Costa':'Coast','Plazas y parques':'Squares and parks','Miradores':'Viewpoints','Naturaleza':'Nature','Arte urbano':'Street art'},
  pt: {'Arquitectura':'Arquitetura','Historia':'História','Costa':'Litoral','Plazas y parques':'Praças e parques','Miradores':'Mirantes','Naturaleza':'Natureza','Arte urbano':'Arte urbana'}
};
const typeLabel = (name) => typeNames[language]?.[name] || name;
const photoUrl = (file) => file ? 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(file) + '?width=960' : '';

const staticText = {
  '.skip':'skip','.top nav a:nth-child(1)':'navBusinesses','.top nav a:nth-child(2)':'navEvents','.top nav a:nth-child(3)':'navExperiences',
  '.hero-copy .eyebrow':'heroEyebrow','.hero-copy h1':'heroTitle','.hero-copy p':'heroIntro',
  '#explore-title':'exploreTitle',
  '#destination-actions .eyebrow':'destinationEyebrow','#destination-actions p':'destinationIntro',
  '#directions-link':'directions','#see-things-link':'seeThings',
  '#empty':'empty',
  'footer p':'footer','footer a':'privacy'
};
function translateStatic() {
  document.documentElement.lang = language === 'es' ? 'es-UY' : language === 'en' ? 'en' : 'pt-BR';
  languageSelect.value = language;
  document.title = t('title');
  document.querySelector('meta[name="description"]').content = t('description');
  for (const [selector,key] of Object.entries(staticText)) {
    const element = document.querySelector(selector);
    if (element) element.textContent = t(key);
  }
  document.querySelector('.filters label:nth-child(1)').firstChild.textContent = t('where');
  document.querySelector('.filters label:nth-child(2)').firstChild.textContent = t('locality');
  document.querySelector('.filters label:nth-child(3)').firstChild.textContent = t('interest');
  locality.placeholder = t('localityPlaceholder');
  const note = document.querySelector('#content-language-note');
  note.hidden = language === 'es';
  note.textContent = t('contentNote');
}

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
let placesLoaded = false;
let placesLoadFailed = false;
const requested = new URLSearchParams(location.search);
department.replaceChildren(option('', t('allDepartments')), ...departments.map((item) => option(item, item)));
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
    (visible.length === 1 ? t('placeOne') : t('placeMany'));
  empty.hidden = visible.length !== 0;
  cards.innerHTML = visible.map((place) => {
    const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place.mapa);
    const photo = place.foto_archivo ? '<div class="card-visual"><img src="' + escapeHtml(photoUrl(place.foto_archivo)) +
      '" alt="' + escapeHtml('Fotografía de ' + place.nombre + ', ' + place.localidad) +
      '" loading="lazy" decoding="async" width="640" height="360"><span>' +
      escapeHtml(typeLabel(place.tipo)) + '</span></div>' :
      '<div class="card-visual is-empty"><span>' + escapeHtml(typeLabel(place.tipo)) + '</span></div>';
    const credit = place.foto_fuente ? '<div class="photo-credit"><a href="' + escapeHtml(place.foto_fuente) +
      '" target="_blank" rel="noopener noreferrer">Foto: ' + escapeHtml(place.foto_autor) +
      '</a> · <a href="' + escapeHtml(place.foto_licencia_url) +
      '" target="_blank" rel="noopener noreferrer">' + escapeHtml(place.foto_licencia) + '</a></div>' : '';
    return '<article class="card">' + photo + '<div class="card-body"><span class="card-meta">' +
      escapeHtml(place.ubicacion_visible || place.localidad) + ' · ' + escapeHtml(place.departamento) +
      '</span><h3>' + escapeHtml(place.nombre) + '</h3><p>' + escapeHtml(place.resumen) +
      '</p><details><summary>' + t('details') + '</summary><p class="route">' +
      escapeHtml(place.recorrido) + '</p><p class="note">' + escapeHtml(place.nota) +
      '</p></details>' + credit + '<div class="card-links"><a href="' + escapeHtml(map) +
      '" target="_blank" rel="noopener noreferrer">' + t('map') + '</a><a class="source" href="' +
      escapeHtml(place.url) + '" target="_blank" rel="noopener noreferrer">' + t('source') + '</a></div></div></article>';
  }).join('');
}
translateStatic();
count.textContent = t('placesLoading');
languageSelect.addEventListener('change', () => {
  language = languageSelect.value;
  try { localStorage.setItem(languageKey, language); } catch {}
  translateStatic();
  department.options[0].textContent = t('allDepartments');
  type.options[0].textContent = t('allInterests');
  for (const entry of type.options) if (entry.value) entry.textContent = typeLabel(entry.value);
  if (placesLoaded) render();
  else count.textContent = t(placesLoadFailed ? 'placesError' : 'placesLoading');
});
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
    placesLoaded = true;
    type.replaceChildren(option('', t('allInterests')),
      ...unique(places.map((place) => place.tipo)).map((item) => option(item, typeLabel(item))));
    updateLocalityOptions();
    render();
  })
  .catch(() => { placesLoadFailed = true; count.textContent = t('placesError'); });

