import {rememberPreview} from './preview-urls';
import {deezer} from './deezer';
import {inEra} from './catalog';
import {artistPage} from './genre-seeds';
import {baseTitle,normalize} from './game';
export type Song={id:number;title:string;shortTitle:string;artist:string;link:string;rank:number;artistFans:number;year:number;cover:string;key:string};
export type CatalogResult={tracks:Song[];pages:number;stats:{requestedArtists:number;resolvedArtists:number;failedRequests:number;rawTracks:number;uniqueTracks:number;eligibleTracks:number;albumsChecked:number}};
const cache=new Map<string,{until:number;value:CatalogResult}>();
const pending=new Map<string,Promise<CatalogResult>>();
const artistCache=new Map<string,number>();
const MAX_ALBUM_LOOKUPS=40;
export function songKey(title:string,artist:string){return normalize(artist)+':'+normalize(baseTitle(title))}
export function deduplicate(tracks:Song[]){const best=new Map<string,Song>();for(const t of tracks){const old=best.get(t.key);if(!old||t.rank>old.rank)best.set(t.key,t)}return [...best.values()]}
async function artistId(name:string){const saved=artistCache.get(name);if(saved)return saved;const data=await deezer('/search/artist?q='+encodeURIComponent(name)+'&limit=25');const exact=(data.data||[]).filter((a:any)=>normalize(a.name)===normalize(name)).sort((a:any,b:any)=>(b.nb_fan||0)-(a.nb_fan||0))[0];if(!exact)return null;artistCache.set(name,exact.id);return exact.id as number}
export async function catalog(genre:string,era:string,page=0,artistIds:number[]=[]):Promise<CatalogResult>{const selection=artistPage(genre,page);const key=[genre,era,...artistIds,page%Math.max(selection.pages,1)].join(':');const existing=cache.get(key);if(existing&&existing.until>Date.now())return existing.value;if(pending.has(key))return pending.get(key)!;const job=build(genre,era,page,artistIds).then(value=>{if(value.tracks.length>=25){if(cache.size>=60)cache.delete(cache.keys().next().value!);cache.set(key,{until:Date.now()+10*60*1000,value})}return value}).finally(()=>pending.delete(key));pending.set(key,job);return job;}
async function build(genre:string,era:string,page:number,artistIds:number[]=[]):Promise<CatalogResult>{const selection=artistPage(genre,page);const artists:(string|number)[]=artistIds.length?artistIds:selection.artists;const pages=selection.pages;const stats={requestedArtists:artists.length,resolvedArtists:0,failedRequests:0,rawTracks:0,uniqueTracks:0,eligibleTracks:0,albumsChecked:0};
 const results=await Promise.allSettled(artists.map(async name=>{const id=typeof name==='number'?name:await artistId(name);if(!id)return [];const artist=await deezer('/artist/'+id);if(!Number.isFinite(artist.nb_fan))return [];stats.resolvedArtists++;const data=await deezer('/artist/'+id+'/top?limit=100');const tracks=Array.isArray(data.data)?data.data:[];stats.rawTracks+=tracks.length;return tracks.filter((t:any)=>t.artist?.id===id&&t.preview&&t.readable!==false&&Number.isFinite(t.rank)&&t.album?.id).map((t:any)=>({...t,artistFans:artist.nb_fan}))}));
 stats.failedRequests=results.filter(r=>r.status==='rejected').length;if(stats.failedRequests===artists.length&&artists.length)throw new Error('catalog_unavailable');
 const byArtist=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);const raw:any[]=[];const longest=Math.max(0,...byArtist.map(g=>g.length));for(let i=0;i<longest;i++)for(const group of byArtist)if(group[i])raw.push(group[i]);
 let candidates=raw;stats.uniqueTracks=deduplicate(raw.map(toSong)).length;
 if(era!=='any'){
  // One call per artist returns every release date, so the era filter keeps the
  // full per-artist list instead of collapsing each artist into a few tracks.
  const dates=new Map<number,string>();
  const collect=(listing:{data?:{id:number;release_date?:string}[]})=>{for(const album of listing.data||[])if(album.id&&album.release_date)dates.set(album.id,album.release_date)};
  await Promise.allSettled([...new Set<number>(raw.map(t=>t.artist.id))].map(async id=>{const listing=await deezer('/artist/'+id+'/albums?limit=100');stats.albumsChecked++;collect(listing);if((listing.total||0)>(listing.data?.length||0)){const more=await deezer('/artist/'+id+'/albums?limit=100&index=100');stats.albumsChecked++;collect(more)}}));
  // Guest spots and compilations sit outside the artist listing: fetch a bounded,
  // artist-interleaved remainder so no performer owns the whole budget.
  const missing=[...new Set<number>(raw.map(t=>t.album.id))].filter(id=>!dates.has(id)).slice(0,MAX_ALBUM_LOOKUPS);
  for(let start=0;start<missing.length;start+=4){await Promise.allSettled(missing.slice(start,start+4).map(async id=>{const a=await deezer('/album/'+id);stats.albumsChecked++;if(a.release_date)dates.set(id,a.release_date)}))}
  if(raw.length&&!dates.size)throw new Error('metadata_unavailable');
  candidates=raw.filter(t=>{const release=dates.get(t.album.id);return !!release&&inEra(release,era)}).map(t=>({...t,year:Number(dates.get(t.album.id)!.slice(0,4))}));
 }
 const tracks=deduplicate(candidates.map(toSong));stats.eligibleTracks=tracks.length;return {tracks,pages,stats};
}
function toSong(t:any):Song{rememberPreview(t.id,t.preview);const album=t.album||{};const md5=album.md5_image;return {id:t.id,title:t.title,shortTitle:t.title_short||t.title,artist:t.artist.name,link:t.link,rank:t.rank,artistFans:t.artistFans||0,year:t.year||0,cover:album.cover_big||album.cover_medium||album.cover||(md5?`https://cdn-images.dzcdn.net/images/cover/${md5}/500x500-000000-80-0-0.jpg`:''),key:songKey(t.title_short||t.title,t.artist.name)}}
