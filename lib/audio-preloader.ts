/** Only the current and upcoming preview live in memory; nothing is stored offline. */
export class AudioPreloader<T>{
 private entries=new Map<number,{controller:AbortController;promise:Promise<T>}>();
 private decode:(bytes:ArrayBuffer)=>Promise<T>;
 private request:typeof fetch;
 constructor(decode:(bytes:ArrayBuffer)=>Promise<T>,request:typeof fetch=(input,init)=>globalThis.fetch(input,init)){this.decode=decode;this.request=request}
 load(id:number):Promise<T>{
  const existing=this.entries.get(id);if(existing)return existing.promise;
  const controller=new AbortController();
  const entry:{controller:AbortController;promise:Promise<T>}={controller,promise:Promise.resolve(null as T)};
  entry.promise=(async()=>{const timer=setTimeout(()=>controller.abort(),25000);try{
   const response=await this.request('/api/audio?id='+id,{signal:controller.signal,cache:'no-store'});
   if(!response.ok)throw new Error('Prévia indisponível');
   const bytes=await response.arrayBuffer();if(controller.signal.aborted)throw new Error('Carregamento cancelado');
   const decoded=await this.decode(bytes);if(controller.signal.aborted)throw new Error('Carregamento cancelado');return decoded;
  }finally{clearTimeout(timer)}})().catch(error=>{if(this.entries.get(id)===entry)this.entries.delete(id);throw error});
  this.entries.set(id,entry);return entry.promise;
 }
 retain(ids:number[]){const keep=new Set(ids);for(const [id,entry]of this.entries){if(!keep.has(id)){entry.controller.abort();this.entries.delete(id)}}}
 clear(){this.retain([])}
}
