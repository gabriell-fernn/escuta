// Metadata only: never store audio on the server. Expiring links are refreshed on failure.
const urls=new Map<string,{url:string;until:number}>();
export function validPreview(value:unknown):value is string{if(typeof value!=='string')return false;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname.endsWith('.dzcdn.net')||u.hostname.endsWith('.deezer.com'))}catch{return false}}
export function rememberPreview(id:string|number,url:unknown){if(!validPreview(url))return;if(urls.size>=1000)urls.delete(urls.keys().next().value!);urls.set(String(id),{url,until:Date.now()+10*60*1000})}
export function previewUrl(id:string){const entry=urls.get(id);if(entry&&entry.until>Date.now())return entry.url;urls.delete(id);return null}
