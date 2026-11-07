const status = document.querySelector('#status'), cards = document.querySelector('#experience-cards');
const languageSelect = document.querySelector('#language');
const messages = {
  "es": {
    "guide": "Explorar la guía",
    "kicker": "SALIDAS Y EXPERIENCIAS",
    "title": "Ideas para salir y recorrer Uruguay",
    "intro": "Descubrí paseos por tu cuenta, eventos y experiencias organizadas. Elegí el plan que mejor vaya con vos.",
    "proposal": "Explorar paseos",
    "placesTitle": "Paseos por tu cuenta",
    "placesIntro": "Plazas, costa, patrimonio y naturaleza",
    "eventsTitle": "Eventos",
    "eventsIntro": "Actividades gratuitas y con entrada",
    "hostedTitle": "Experiencias con anfitrión",
    "hostedIntro": "Visitas y actividades con reserva",
    "nextKicker": "EXPERIENCIAS CON ANFITRIÓN",
    "experiences": "Propuestas para reservar",
    "loading": "Cargando propuestas…",
    "invitationKicker": "¿TENÉS UNA PROPUESTA PARA COMPARTIR?",
    "invitationTitle": "Tu propuesta puede estar acá",
    "invitationText": "Sumá una visita, taller, recorrido o actividad con una ficha básica gratuita.",
    "invitationDetails": "Mostranos fotos autorizadas, qué incluye, precio, duración y cómo reservar. Revisás la ficha antes de publicarla.",
    "submit": "Sumar mi propuesta gratis",
    "events": "Agenda de eventos",
    "stories": "Historias",
    "privacy": "Privacidad y correcciones",
    "footer": "La ficha básica es gratuita. Cada experiencia tiene el precio y las condiciones que informa su anfitrión.",
    "empty": "Aún no hay experiencias con anfitrión publicadas. Mientras tanto, explorá paseos y eventos en todo Uruguay.",
    "error": "No pudimos cargar las propuestas. Probá de nuevo en unos minutos.",
    "includes": "Incluye",
    "price": "Precio por persona",
    "duration": "Duración",
    "days": "Días y reserva",
    "families": "Para familias",
    "alcohol": "Sin alcohol",
    "confirmed": "Información confirmada por el anfitrión",
    "availability": "Consultar disponibilidad",
    "directions": "Cómo llegar",
    "pageTitle": "Salidas y experiencias | Vitrina Cerca",
    "pageDescription": "Paseos por cuenta propia, eventos y experiencias con anfitriones para recorrer Uruguay."
  },
  "en": {
    "guide": "Explore the guide",
    "kicker": "OUTINGS AND EXPERIENCES",
    "title": "Ideas for exploring Uruguay",
    "intro": "Discover self-guided outings, events and hosted experiences. Choose the plan that suits you.",
    "proposal": "Explore places",
    "placesTitle": "Explore on your own",
    "placesIntro": "Squares, coast, heritage and nature",
    "eventsTitle": "Events",
    "eventsIntro": "Free and ticketed activities",
    "hostedTitle": "Hosted experiences",
    "hostedIntro": "Visits and activities to book",
    "nextKicker": "HOSTED EXPERIENCES",
    "experiences": "Experiences to book",
    "loading": "Loading experiences…",
    "invitationKicker": "HAVE AN EXPERIENCE TO SHARE?",
    "invitationTitle": "Your experience can be here",
    "invitationText": "Add a visit, workshop, tour or activity with a free basic listing.",
    "invitationDetails": "Send approved photos, what is included, price, duration and how to book. You can review the listing before it is published.",
    "submit": "Add my experience for free",
    "events": "Events calendar",
    "stories": "Stories",
    "privacy": "Privacy and corrections",
    "footer": "The basic listing is free. Each host sets the price and conditions for their experience.",
    "empty": "No hosted experiences have been published yet. Meanwhile, explore outings and events across Uruguay.",
    "error": "We could not load the experiences. Please try again in a few minutes.",
    "includes": "Includes",
    "price": "Price per person",
    "duration": "Duration",
    "days": "Days and booking",
    "families": "For families",
    "alcohol": "Alcohol-free options",
    "confirmed": "Information confirmed by the host",
    "availability": "Check availability",
    "directions": "Directions",
    "pageTitle": "Outings and experiences | Vitrina Cerca",
    "pageDescription": "Self-guided outings, events and hosted experiences across Uruguay."
  },
  "pt": {
    "guide": "Explorar o guia",
    "kicker": "PASSEIOS E EXPERIÊNCIAS",
    "title": "Ideias para explorar o Uruguai",
    "intro": "Descubra passeios por conta própria, eventos e experiências organizadas. Escolha o plano ideal para você.",
    "proposal": "Explorar passeios",
    "placesTitle": "Passeios por conta própria",
    "placesIntro": "Praças, litoral, patrimônio e natureza",
    "eventsTitle": "Eventos",
    "eventsIntro": "Atividades gratuitas e pagas",
    "hostedTitle": "Experiências com anfitrião",
    "hostedIntro": "Visitas e atividades com reserva",
    "nextKicker": "EXPERIÊNCIAS COM ANFITRIÃO",
    "experiences": "Propostas para reservar",
    "loading": "Carregando propostas…",
    "invitationKicker": "TEM UMA PROPOSTA PARA COMPARTILHAR?",
    "invitationTitle": "Sua proposta pode estar aqui",
    "invitationText": "Adicione uma visita, oficina, passeio ou atividade com uma ficha básica gratuita.",
    "invitationDetails": "Envie fotos autorizadas, o que está incluído, preço, duração e como reservar. Você revisa a ficha antes da publicação.",
    "submit": "Adicionar minha proposta grátis",
    "events": "Agenda de eventos",
    "stories": "Histórias",
    "privacy": "Privacidade e correções",
    "footer": "A ficha básica é gratuita. Cada anfitrião informa o preço e as condições da experiência.",
    "empty": "Ainda não há experiências com anfitrião publicadas. Enquanto isso, explore passeios e eventos em todo o Uruguai.",
    "error": "Não foi possível carregar as propostas. Tente novamente em alguns minutos.",
    "includes": "Inclui",
    "price": "Preço por pessoa",
    "duration": "Duração",
    "days": "Dias e reserva",
    "families": "Para famílias",
    "alcohol": "Sem álcool",
    "confirmed": "Informações confirmadas pelo anfitrião",
    "availability": "Consultar disponibilidade",
    "directions": "Como chegar",
    "pageTitle": "Passeios e experiências | Vitrina Cerca",
    "pageDescription": "Passeios por conta própria, eventos e experiências com anfitriões no Uruguai."
  }
};
let language = 'es', experiences = [], loadError = false, loading = true;
try { const saved = localStorage.getItem('vitrina-language'); if (saved in messages) language = saved; } catch {}
const tr = key => messages[language][key];
const https = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
const text = (tag, value, parent) => { const node = document.createElement(tag); node.textContent = value; parent.append(node); return node; };
function render() {
  document.documentElement.lang = language === 'es' ? 'es-UY' : language === 'pt' ? 'pt-BR' : 'en';
  document.title = tr('pageTitle');
  document.querySelector('meta[name="description"]').content = tr('pageDescription');
  languageSelect.value = language;
  for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = tr(element.dataset.i18n);
  status.hidden = experiences.length > 0;
  status.textContent = loading ? tr('loading') : loadError ? tr('error') : experiences.length ? '' : tr('empty');
  cards.replaceChildren();
  for (const item of experiences) {
    const card = document.createElement('article'); card.className = 'card';
    const photo = document.createElement('img'); photo.src = https(item.foto); photo.alt = item.nombre; photo.loading = 'lazy'; photo.width = 640; photo.height = 360; card.append(photo);
    const content = document.createElement('div'); content.className = 'card-content'; card.append(content);
    text('small', item.localidad || 'Canelones', content); text('h3', item.nombre, content); text('p', item.descripcion, content);
    const facts = document.createElement('dl'); content.append(facts);
    for (const [label, value] of [[tr('includes'), item.incluye], [tr('price'), item.precio], [tr('duration'), item.duracion], [tr('days'), item.dias], [tr('families'), item.familias], [tr('alcohol'), item.sin_alcohol]]) { text('dt', label, facts); text('dd', value, facts); }
    text('p', tr('confirmed') + ': ' + item.confirmado_el, content);
    const actions = document.createElement('div'); actions.className = 'actions'; content.append(actions);
    for (const [label, url, style] of [[tr('availability'), item.consulta_url, 'button'], [tr('directions'), item.mapa_url, 'button secondary']]) { const link = text('a', label, actions); link.href = https(url); link.className = style; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    cards.append(card);
  }
}
languageSelect.addEventListener('change', () => { language = languageSelect.value in messages ? languageSelect.value : 'es'; try { localStorage.setItem('vitrina-language', language); } catch {} render(); });
render();
try {
  const response = await fetch('/salidas/experiencias.json');
  if (!response.ok) throw new Error('No disponible');
  const data = await response.json();
  experiences = (Array.isArray(data.experiencias) ? data.experiencias : []).filter(item => item.aprobada === true && item.fotos_autorizadas === true && item.nombre && item.descripcion && item.confirmado_el && https(item.foto) && https(item.consulta_url) && https(item.mapa_url) && item.precio && item.duracion && item.dias && item.incluye && item.familias && item.sin_alcohol);
} catch { loadError = true; }
loading = false;
render();
