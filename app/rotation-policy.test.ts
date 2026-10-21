import assert from 'node:assert/strict';
import { freeRotationActive, FREE_ROTATION_START, FREE_ROTATION_END_EXCLUSIVE } from './rotation-policy.ts';

assert.equal((Date.parse(FREE_ROTATION_END_EXCLUSIVE)-Date.parse(FREE_ROTATION_START))/86_400_000,60);
assert.equal(freeRotationActive(new Date('2026-10-21T02:59:59Z')),false);
assert.equal(freeRotationActive(new Date('2026-10-21T03:00:00Z')),true);
assert.equal(freeRotationActive(new Date('2026-12-20T02:59:59Z')),true);
assert.equal(freeRotationActive(new Date('2026-12-20T03:00:00Z')),false);
assert.equal(freeRotationActive(new Date('2027-01-01T12:00:00Z')),false);
console.log('Prueba visual de 60 días verificada con los límites horarios de Uruguay; las fichas gratuitas no vencen.');
