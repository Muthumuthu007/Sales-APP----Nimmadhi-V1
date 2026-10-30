export function receiptPdfName(receipt) {
 const reference=String(receipt.billNo || receipt.workOrderNo || receipt.saleReferenceId || 'receipt').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,90);
 const collection=receipt.paymentId?`-payment-${String(receipt.paymentId).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,45)}`:'';
 return `Nimmadhi-${reference}${collection}.pdf`;
}
export function pageSlices(height,pageHeight,boundaries=[]) {
 const pages=[];let top=0;
 while(top<height){
  const maximum=Math.min(height,top+pageHeight);
  const safe=boundaries.filter(y=>y>top+pageHeight*.35 && y<=maximum);
  const bottom=maximum===height?height:(safe.length?Math.max(...safe):maximum);
  pages.push({top,height:bottom-top});top=bottom;
 }
 return pages;
}
export function downloadReceiptPdf(file) {
 const url=URL.createObjectURL(file);const link=document.createElement('a');
 link.href=url;link.download=file.name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export async function shareReceiptPdf(file,{shareApi=globalThis.navigator,download=downloadReceiptPdf}={}) {
 if(!file)throw new Error('The bill PDF is still being prepared.');
 if(shareApi?.share && shareApi?.canShare?.({files:[file]})){
  try {await shareApi.share({files:[file],title:'Nimmadhi Mattress bill'});return 'shared';}
  catch(error){if(error?.name==='AbortError')return 'cancelled';}
 }
 download(file);return 'downloaded';
}
export async function createReceiptPdf(element,receipt) {
 const [{default:html2canvas},{jsPDF}]=await Promise.all([import('html2canvas'),import('jspdf')]);
 await document.fonts?.ready;
 const host=document.createElement('div');host.setAttribute('aria-hidden','true');
 host.style.cssText='position:absolute;left:-12000px;top:0;width:794px;pointer-events:none;';
 const clone=element.cloneNode(true);clone.querySelectorAll('.paper-bill-actions,[data-pdf-ignore]').forEach(node=>node.remove());
 clone.style.cssText='width:794px;box-sizing:border-box;padding:28px;font-size:12px;border-radius:0;background:white;color:#111;overflow:visible;min-height:1080px;';
 clone.querySelectorAll('.paper-bill-top,.paper-bill-summary').forEach(node=>{node.style.gridTemplateColumns='1fr 1fr';node.style.gap='25px';});
 const header=clone.querySelector('.paper-bill-header');header.style.flexDirection='column';
 clone.querySelector('.paper-bill-contact')?.style.setProperty('flex-direction','row');
 clone.querySelector('.paper-bill-contact')?.style.setProperty('font-size','10px');
 clone.querySelector('.paper-bill-contact>span:first-child')?.style.setProperty('max-width','38%');
 host.appendChild(clone);document.body.appendChild(host);
 try {
  await Promise.all([...clone.querySelectorAll('img')].map(img=>img.decode()));
  const origin=clone.getBoundingClientRect().top;
  const boundaries=[...clone.querySelectorAll('header,section,tbody tr,footer')].map(node=>Math.ceil(node.getBoundingClientRect().bottom-origin));
  const canvas=await html2canvas(clone,{scale:2,backgroundColor:'#ffffff',logging:false,windowWidth:1000,scrollX:0,scrollY:0});
  const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  pdf.setProperties({title:`Nimmadhi bill ${receipt.billNo || receipt.workOrderNo || receipt.saleReferenceId || ''}`,author:'Nimmadhi Mattress'});
  const width=186,pageHeight=Math.floor(273/width*canvas.width);
  const pages=pageSlices(canvas.height,pageHeight,boundaries.map(y=>y*2));
  pages.forEach((page,index)=>{
   if(index)pdf.addPage();
   const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=page.height;
   const context=slice.getContext('2d');if(!context)throw new Error('Unable to create the bill PDF.');
   context.drawImage(canvas,0,page.top,canvas.width,page.height,0,0,canvas.width,page.height);
   pdf.addImage(slice.toDataURL('image/png'),'PNG',12,12,width,page.height/canvas.width*width);
   if(pages.length>1){pdf.setFontSize(8);pdf.text(`Page ${index+1} of ${pages.length}`,198,291,{align:'right'});}
   slice.width=0;slice.height=0;
  });
  return new File([pdf.output('blob')],receiptPdfName(receipt),{type:'application/pdf'});
 } finally {host.remove();}
}
