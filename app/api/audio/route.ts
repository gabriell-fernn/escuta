import {deezer} from '@/lib/deezer';
import {previewUrl,rememberPreview,validPreview} from '@/lib/preview-urls';
export async function GET(request:Request){const id=new URL(request.url).searchParams.get('id');if(!id||!/^\d{1,16}$/.test(id))return new Response('Música inválida',{status:400});try{
 let url=previewUrl(id);const cached=!!url;
 async function refresh(){const track=await deezer('/track/'+id);if(!validPreview(track.preview))throw new Error();rememberPreview(id!,track.preview);return track.preview as string}
 if(!url)url=await refresh();
 let audio=await fetch(url,{signal:AbortSignal.timeout(15000)});
 if(!audio.ok&&cached){await audio.body?.cancel();audio=await fetch(await refresh(),{signal:AbortSignal.timeout(15000)})}
 if(!audio.ok)throw new Error();return new Response(audio.body,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}})
 }catch{return new Response('Prévia indisponível',{status:503})}}
