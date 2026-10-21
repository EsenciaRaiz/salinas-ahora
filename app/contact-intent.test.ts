import assert from 'node:assert/strict';
import { businessContact, whatsappContactUrl } from './contact-intent.ts';

const cases = [
  { nombre: 'Herrería del barrio', categoria: 'Oficios', intent: 'presupuesto' },
  { nombre: 'HOUSEUY', categoria: 'Profesionales', especialidad: 'ARQUITECTURA', intent: 'presupuesto' },
  { nombre: 'FTCel Reparaciones', categoria: 'Tecnología', intent: 'presupuesto' },
  { nombre: 'ROMANSI', categoria: 'Servicios', descripcion: 'Diseño y desarrollo de páginas web', intent: 'presupuesto' },
  { nombre: 'Alojamiento Salinas', categoria: 'Servicios', intent: 'disponibilidad' },
  { nombre: 'Clases de matemática', categoria: 'Educación', intent: 'disponibilidad' },
  { nombre: 'Clases para arquitectura', categoria: 'Educación', descripcion: 'Apoyo a estudiantes de arquitectura', intent: 'disponibilidad' },
  { nombre: 'Esencia Raíz', categoria: 'Belleza', descripcion: 'Cosmética artesanal', intent: 'producto' },
  { nombre: 'Salón Ana', categoria: 'Belleza', descripcion: 'Peluquería', intent: 'turno' },
  { nombre: 'Enfermería a domicilio', categoria: 'Salud', intent: 'turno' },
  { nombre: 'Florería', categoria: 'Compras', intent: 'producto' },
  { nombre: 'Café', categoria: 'Gastronomía', intent: 'menu' },
  { nombre: 'Otro servicio', categoria: 'Otra', intent: 'consulta' },
];
for (const example of cases) assert.equal(businessContact(example).intent, example.intent, example.nombre);
const business = { nombre: 'José & Hijos + Diseño', categoria: 'Oficios' };
const result = businessContact(business);
const link = new URL(whatsappContactUrl('59899123456', business));
assert.equal(link.origin, 'https://wa.me');
assert.equal(link.pathname, '/59899123456');
assert.equal(link.searchParams.get('text'), result.message);
assert.equal([...link.searchParams.keys()].length, 1);
assert.match(result.message, /Localidad:/);
assert.match(result.message, /José & Hijos \+ Diseño/);
const health = businessContact({ nombre: 'Enfermería', categoria: 'Salud' });
assert.doesNotMatch(health.message, /diagn[oó]stico|historia cl[ií]nica|s[ií]ntomas/i);
console.log(cases.length + ' rubros y codificación de WhatsApp verificados.');
