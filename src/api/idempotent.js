// Retain an opaque operation ID across timeouts and reloads. Customer data is
// hashed locally; only the digest and UUID are kept in this tab's session.
export async function idempotentPost(api, path, data, store = sessionStorage) {
 const owner=store.getItem('username')||'';
 const bytes=new TextEncoder().encode(JSON.stringify({owner,path,data}));
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 const key=`pending-write:${hash}`;
 let requestId=data.requestId || store.getItem(key);
 if(!requestId){requestId=crypto.randomUUID();store.setItem(key,requestId);}
 const response=await api.post(path,{...data,requestId},{headers:{'Idempotency-Key':requestId}});
 store.removeItem(key);
 return response;
}
