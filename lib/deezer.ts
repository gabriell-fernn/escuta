export async function deezer(path:string){
 const r=await fetch('https://api.deezer.com'+path,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new Error('Fonte indisponível');
 const body=await r.text();let data:any;
 try{data=JSON.parse(body)}catch{throw new Error('A fonte de músicas retornou uma resposta inválida')}
 if(!data||typeof data!=='object'||Array.isArray(data)||data.error)throw new Error('Fonte indisponível');
 return data;
}
