import test from 'node:test';import assert from 'node:assert/strict';import {reportPeriodRange} from './reportPeriods.js';
test('daily date and a week crossing month and year boundaries',()=>{
 assert.deepEqual(reportPeriodRange('daily','2026-11-14','2026-11-14'),{start:'2026-11-14',end:'2026-11-14'});
 assert.deepEqual(reportPeriodRange('weekly','2026-01-01','2026-11-14'),{start:'2025-12-29',end:'2026-01-04'});
 assert.deepEqual(reportPeriodRange('weekly','2026-11-14','2026-11-14'),{start:'2026-11-09',end:'2026-11-14'});
});
test('calendar months include leap day and current periods stop today',()=>{
 assert.deepEqual(reportPeriodRange('monthly','2024-02','2026-11-14'),{start:'2024-02-01',end:'2024-02-29'});
 assert.deepEqual(reportPeriodRange('monthly','2026-11','2026-11-14'),{start:'2026-11-01',end:'2026-11-14'});
 for(const args of [['daily','2026-02-30'],['weekly','2026-12-01'],['monthly','2026-13'],['daily',''],['other','2026-11-01']])assert.equal(reportPeriodRange(...args,'2026-11-14'),null);
});
