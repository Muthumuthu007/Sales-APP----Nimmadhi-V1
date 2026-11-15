export function baseThickness(name){
 const match=String(name || '').match(/^\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\s*[xX×]\s*(\d+(?:\.\d+)?)(?=\s|$)/);
 return match && Number(match[1])>0?Number(match[1]):null;
}
export function customOrderSize(name,size){
 const thickness=baseThickness(name);if(thickness===null)throw Error('The base product thickness is unavailable. Ask the admin to check this product before customizing it.');
 const factor=size.unit==='cm'?2.54:1;
 const length=Number(size.length),width=Number(size.width);
 if(!Number.isFinite(length)||!Number.isFinite(width)||length<=0||width<=0)throw Error('Enter a positive length and width.');
 return {length:Math.round((length/factor+Number.EPSILON)*100)/100,width:Math.round((width/factor+Number.EPSILON)*100)/100,thickness,unit:'inches'};
}
