/** Validate API responses before exposing them to the game UI. */
export async function readApiJson<T>(response:Response):Promise<T>{
 const fallback=response.status===401||response.status===403||response.redirected
  ?'Sua sessão pode ter expirado. Atualize a página e entre novamente.'
  :response.status===404?'Não encontramos músicas para essa seleção. Altere o gênero ou a era e tente novamente.'
  :'O serviço de músicas não respondeu como esperado. Tente novamente em instantes.';
 const text=await response.text();
 let data:unknown;
 try{data=JSON.parse(text)}catch{throw new Error(fallback)}
 if(data===null||typeof data!=='object'||Array.isArray(data))throw new Error(fallback);
 if(!response.ok){const message=(data as {error?:unknown}).error;throw new Error(typeof message==='string'&&message.length<400?message:fallback)}
 return data as T;
}
