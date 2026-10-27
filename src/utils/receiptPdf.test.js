import test from 'node:test';import assert from 'node:assert/strict';
import {receiptPdfName,shareReceiptPdf,pageSlices} from './receiptPdf.js';
test('receipt PDF filename uses bill identity safely',()=>{
 assert.equal(receiptPdfName({workOrderNo:'ORD-0034'}),'Nimmadhi-ORD-0034.pdf');
 assert.equal(receiptPdfName({billNo:'a/b:c'}),'Nimmadhi-a-b-c.pdf');
});
test('shares PDF file rather than an SMS text summary',async()=>{
 const file=new File(['sample'],'bill.pdf',{type:'application/pdf'});let sent;
 const result=await shareReceiptPdf(file,{shareApi:{canShare:({files})=>files[0]===file,share:async payload=>{sent=payload;}},download:()=>assert.fail('No download when shared')});
 assert.equal(result,'shared');assert.equal(sent.files[0].type,'application/pdf');assert.equal(sent.text,undefined);
});
test('unsupported file share downloads PDF and cancellation does not download',async()=>{
 const file={name:'receipt.pdf'};let downloads=0;
 assert.equal(await shareReceiptPdf(file,{shareApi:{},download:()=>downloads++}),'downloaded');
 assert.equal(downloads,1);
 const cancelled={canShare:()=>true,share:async()=>{throw {name:'AbortError'};}};
 assert.equal(await shareReceiptPdf(file,{shareApi:cancelled,download:()=>downloads++}),'cancelled');assert.equal(downloads,1);
});
test('multipage bill slices preserve row boundaries and every pixel exactly once',()=>{
 const pages=pageSlices(2600,1000,[800,950,1750,1900,2500]);
 assert.deepEqual(pages,[{top:0,height:950},{top:950,height:950},{top:1900,height:700}]);
 assert.equal(pages.reduce((sum,p)=>sum+p.height,0),2600);
});
