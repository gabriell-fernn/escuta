const MAX_CONCURRENT=4;
const RETRY_DELAYS=[400,1200];
let active=0;
const waiters:(()=>void)[]=[];
async function acquire(){if(active<MAX_CONCURRENT){active++;return}await new Promise<void>(resolve=>waiters.push(resolve));active++}
function release(){active--;waiters.shift()?.()}
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export async function deezer(path:string){
 let error:unknown;
 for(let attempt=0;attempt<=RETRY_DELAYS.length;attempt++){
  await acquire();
  try{
   const r=await fetch('https://api.deezer.com'+path,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
   if(!r.ok)throw new Error('Fonte indisponível');
   const body=await r.text();let data:any;
   try{data=JSON.parse(body)}catch{throw new Error('A fonte de músicas retornou uma resposta inválida')}
   if(!data||typeof data!=='object'||Array.isArray(data)||data.error)throw new Error('Fonte indisponível');
   return data;
  }catch(e){error=e}finally{release()}
  await sleep(RETRY_DELAYS[attempt]??0);
 }
 throw error;
}
