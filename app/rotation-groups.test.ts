import assert from 'node:assert/strict';
import { groupRotationItems } from './rotation-groups.ts';
const businesses = Array.from({length:7}, (_, id) => ({id:String(id)}));
for (const size of [1,2,3]) {
 const pages = groupRotationItems(businesses,size);
 assert.deepEqual(pages.flat(), businesses, 'Every business must appear once, in order, at every screen size');
 assert.ok(pages.every(page => page.length > 0 && page.length <= size));
 assert.equal(pages.length, Math.ceil(businesses.length / size));
}
assert.deepEqual(groupRotationItems([],3),[]);
assert.deepEqual(groupRotationItems(businesses.slice(0,1),3),[businesses.slice(0,1)]);
console.log('Rotación de 1, 2 y 3 negocios: sin duplicados ni omisiones y con última página incompleta válida.');
