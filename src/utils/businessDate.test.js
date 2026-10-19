import test from 'node:test';
import assert from 'node:assert/strict';
import {businessDate} from './businessDate.js';
test('India midnight uses next day while UTC is still yesterday',()=>{
 assert.equal(businessDate(new Date('2026-10-17T18:30:00Z')),'2026-10-18');
 assert.equal(businessDate(new Date('2026-10-18T00:00:00Z')),'2026-10-18');
 assert.equal(businessDate(new Date('2026-10-17T18:29:59Z')),'2026-10-17');
});
test('India business date handles month year and leap day boundaries',()=>{
 assert.equal(businessDate(new Date('2026-12-31T19:00:00Z')),'2027-01-01');
 assert.equal(businessDate(new Date('2024-02-28T18:30:00Z')),'2024-02-29');
});
