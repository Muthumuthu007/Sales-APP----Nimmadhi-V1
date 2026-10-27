export const paymentMethods=['CASH','UPI','CARD'];
export function splitPayments(values) {
 const parts=[];let total=0;
 for(const method of paymentMethods){
  const text=String(values[method] ?? '').trim();
  if(!text)continue;
  if(!/^\d{1,10}(\.\d{1,2})?$/.test(text))return null;
  const [whole,fraction='']=text.split('.');const paise=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(paise>0){parts.push({paymentMethod:method,amount:paise/100});total+=paise;}
 }
 return {payments:parts,total:total/100};
}
export function paymentDescription(parts) {return (parts || []).map(p=>`${p.paymentMethod}: ₹${Number(p.amount).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`).join(' + ');}
