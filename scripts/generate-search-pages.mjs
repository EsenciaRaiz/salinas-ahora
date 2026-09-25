import { mkdir, writeFile } from 'node:fs/promises';

const endpoint = 'https://script.google.com/macros/s/AKfycbybDC2YTJj8oqoclwREuMQxFdd8szCNZprb3WAy6gwb4fjH7KnaIdXJExqNe93yFsejiQ/exec';
const origin = 'https://vitrinacerca.com';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const escapeXml = escapeHtml;
const demoIds = new Set(['SAL001', 'SAL002', 'SAL003', 'SAL004']);
const businessUrl = (business) => `${origin}/?negocio=${encodeURIComponent(business.id)}`;

let businesses = [];
let publicData = null;
try {
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Respuesta ${response.status}`);
  const data = await response.json();
  if (!data.correcto || !Array.isArray(data.negocios)) throw new Error('Respuesta incompleta');
  publicData = data;
  businesses = data.negocios.filter((business) => business.id && business.nombre && !demoIds.has(business.id));
} catch (error) {
  console.warn(`Directorio de búsqueda: no se pudo actualizar (${error.message}). Se conserva el archivo anterior.`);
  process.exit(0);
}

const entries = businesses.map((business) => `<li><a href="${escapeHtml(businessUrl(business))}">${escapeHtml(business.nombre)}</a><span>${escapeHtml([business.categoria, business.zona, business.departamento || business.departamento_region].filter(Boolean).join(' · '))}</span><p>${escapeHtml(business.descripcion)}</p></li>`).join('\n');
const structuredData = JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Directorio de negocios y servicios de Uruguay | Vitrina Cerca', url: `${origin}/directorio/`, mainEntity: { '@type': 'ItemList', itemListElement: businesses.map((business, index) => ({ '@type': 'ListItem', position: index + 1, name: business.nombre, url: businessUrl(business) })) } }).replace(/</g, '\\u003c');
const directory = `<!doctype html><html lang="es-UY"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Directorio de negocios y servicios en Uruguay | Vitrina Cerca</title><meta name="description" content="Explorá negocios y servicios publicados en Vitrina Cerca por categoría y localidad."><link rel="canonical" href="${origin}/directorio/"><link rel="icon" href="/favicon.svg"><script type="application/ld+json">${structuredData}</script><style>:root{font-family:Arial,sans-serif;color:#102a43;background:#f7f5ef}*{box-sizing:border-box}body{margin:0}main{max-width:860px;margin:auto;padding:32px 22px 65px}a{color:#116078}.brand{font-weight:900;text-decoration:none}.brand strong{color:#ef6a5b}h1{font:500 clamp(38px,6vw,55px)/1.08 Georgia,serif;margin:38px 0 14px}p{line-height:1.55;color:#40586d}ul{list-style:none;padding:0;display:grid;gap:12px}li{background:#fff;border:1px solid #d7e1e2;padding:19px}li a{font:600 23px Georgia,serif}li span{display:block;margin-top:7px;font-size:13px;color:#526578}li p{margin:10px 0 0}footer{margin-top:34px}</style></head><body><main><a class="brand" href="/">VITRINA <strong>CERCA</strong></a><h1>Negocios y servicios de Uruguay</h1><p>Estas son las fichas publicadas. Para buscar por horario, categoría o cercanía, usá la <a href="/#guia">guía interactiva</a>.</p><ul>${entries}</ul><footer><a href="/privacidad/">Privacidad y correcciones</a></footer></main></body></html>`;

const lastmod = new Date().toISOString().slice(0, 10);
const pages = [`${origin}/`, `${origin}/directorio/`, `${origin}/privacidad/`, `${origin}/terminos-de-uso/`, `${origin}/autorizacion-de-publicacion/`, `${origin}/reglas-de-publicacion/`, ...businesses.map(businessUrl)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((url) => `  <url><loc>${escapeXml(url)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
await mkdir('public/directorio', { recursive: true });
await writeFile('public/directorio/index.html', directory);
await writeFile('public/sitemap.xml', sitemap);
await writeFile('public/guide-data.json', JSON.stringify(publicData));
console.log(`Directorio de búsqueda actualizado: ${businesses.length} negocios publicados.`);
