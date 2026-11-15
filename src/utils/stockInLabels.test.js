import { Buffer } from 'node:buffer';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {transform} from 'esbuild';
const source=await readFile(new URL('./unitLabel.ts',import.meta.url),'utf8');const {code}=await transform(source,{loader:'ts',format:'esm',target:'es2022'});const labels=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('stock-in uses one complete print page per QR with the existing 89 by 45 format',()=>{
 const markup=Array.from({length:5},(_,i)=>`<div class="unit-product-label"><div class="unit-label-fields">P-${i+1}</div></div>`);const html=labels.unitLabelPrintDocument(markup,89,45);
 assert.equal((html.match(/<div class="unit-label-page">/g)||[]).length,5);assert.match(html,/@page\{size:89mm 45mm;margin:0\}/);assert.match(html,/page-break-after:always/);assert.match(html,/await.*prepareLabelPrintPages/s);assert.match(html,/Nothing has been printed/);assert.ok(html.indexOf('await (')<html.indexOf('window.print()'));
});
test('incomplete batches or invalid printer dimensions stop before printing',()=>{
 for(const [markup,width,height] of [[[],89,45],[[''],89,45],[['label'],0,45],[['label'],89,0]])assert.throws(()=>labels.unitLabelPrintDocument(markup,width,height));
});
test('label defaults retain unknown manufacturing facts for user confirmation',()=>{
 const value=labels.initialUnitLabel('FINE PILLOWS',700);assert.equal(value.commodity,'FINE');assert.equal(value.quality,'PILLOWS');assert.equal(value.size,'');assert.equal(value.manufacturing_month,'');assert.equal(value.mrp,'700');assert.equal(labels.manufacturingMonthLabel('2026-11'),'11.2026');
});
