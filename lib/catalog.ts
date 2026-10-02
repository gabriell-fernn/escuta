import {songTier} from './popularity';
import {GENRES} from './genre-seeds';
export const ERAS=[{id:'any',label:'Qualquer era'},{id:'classic',label:'Clássicas (antes de 2000)'},{id:'2000',label:'Anos 2000'},{id:'2010',label:'Anos 2010'},{id:'2020',label:'Anos 2020'}];
export const LEVELS=[{id:'easy',label:'Fácil',hint:'Grandes artistas e seus maiores hits'},{id:'medium',label:'Médio',hint:'Artistas populares e sucessos menos óbvios'},{id:'hard',label:'Difícil',hint:'Artistas de menor alcance e faixas menos populares'},{id:'expert',label:'Especialista',hint:'Artistas de nicho e faixas pouco conhecidas'},{id:'impossible',label:'Impossível',hint:'Os artistas e faixas menos populares do catálogo'}];
export type Filters={genre:string;era:string;difficulty:string};
export const DEFAULT_FILTERS:Filters={genre:'all',era:'any',difficulty:'easy'};
export function inEra(date:string,era:string){if(era==='any')return true;const year=Number(date?.slice(0,4));if(!Number.isInteger(year)||year<1900)return false;if(era==='classic')return year<2000;return year>=Number(era)&&year<Number(era)+10;}
export function difficultyPool<T extends {rank:number}>(tracks:T[],level:string){const values=[...new Set(tracks.map(t=>t.rank))].sort((a,b)=>b-a);if(values.length<5)return [];const i=LEVELS.findIndex(l=>l.id===level);if(i<0)return [];const ranks=new Set(values.slice(Math.floor(i*values.length/5),Math.floor((i+1)*values.length/5)));return tracks.filter(t=>ranks.has(t.rank));}
export function validFilters(f:Filters){return GENRES.some(g=>g.id===f.genre)&&ERAS.some(e=>e.id===f.era)&&LEVELS.some(l=>l.id===f.difficulty)}
export const genreLabel=(name:string)=>({'All':'Todos os gêneros','Pop':'Pop','Rock':'Rock','Rap/Hip Hop':'Rap / Hip-hop','Dance':'Dance','R&B':'R&B','Alternative':'Alternativo','Electro':'Eletrônica','Folk':'Folk','Reggae':'Reggae','Jazz':'Jazz','Classical':'Música erudita','Films/Games':'Trilhas sonoras','Metal':'Metal','Soul & Funk':'Soul / Funk','African Music':'Música africana','Asian Music':'Música asiática','Brazilian Music':'Música brasileira','Indian Music':'Música indiana','Latin Music':'Música latina','Country':'Country','Blues':'Blues','Kids':'Infantil'}[name]||name);

/** One global cut keeps the five levels strictly ordered, then artists alternate so one star cannot fill the queue. */
export function balancedDifficultyPool<T extends {rank:number;artist:string}>(tracks:T[],level:string,random:()=>number=Math.random):T[]{
 const levelIndex=LEVELS.findIndex(l=>l.id===level);if(levelIndex<0)return [];
 const groups=new Map<string,T[]>();for(const track of tracks){const group=groups.get(track.artist)||[];group.push(track);groups.set(track.artist,group)}
 const shuffled=<V,>(items:V[])=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy};
 let selection=songTier(tracks,level);
 if(new Set(selection.map(t=>t.artist)).size<Math.min(3,groups.size))selection=[...groups.values()].flatMap(group=>songTier(group,level));
 const chosen=new Set(selection);
 const pools=shuffled([...groups.values()].map(group=>shuffled(group.filter(t=>chosen.has(t)))).filter(group=>group.length));
 const output:T[]=[];const longest=Math.max(0,...pools.map(g=>g.length));for(let i=0;i<longest;i++)for(const group of pools)if(group[i])output.push(group[i]);return output;
}
