import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const compile=(file,resolve)=>{const exports={};new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(resolve,exports);return exports};
function harness(file,overrides){let cursor=0;const slots=[];const hooks={useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v]},useRef(value){const i=cursor++;if(!(i in slots))slots[i]={current:value};return slots[i]},useEffect(){},useCallback(fn){return fn}};const exports=compile(file,id=>id==='react'?hooks:overrides[id]??(id==='react/jsx-runtime'?require(id):new Proxy({},{get:(_,key)=>key})));return {render(name,props){cursor=0;return exports[name](props)}}}
function find(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of [node.props?.children].flat(Infinity)){const match=find(child,predicate);if(match)return match}return null}
test('sidebar reroll changes the actual track, excludes the current audio ID and resets the snippet',async()=>{
 const original=globalThis.fetch;let requests=0;
 const song=(id,key)=>({id,key,title:'Song '+id,shortTitle:'Song '+id,artist:'Artist',link:''});
 globalThis.fetch=async()=>{requests++;return {tracks:[song(1,'a'),song(1,'duplicate'),song(2,'b'),song(3,'c')]}};
 try{
 const game=compile('lib/game.ts',require);
 const h=harness('app/page.tsx',{'@/lib/game':game,'@/lib/catalog':{DEFAULT_FILTERS:{genre:'all',era:'any',difficulty:'easy'},LEVELS:[{id:'easy',label:'Fácil'}],ERAS:[{id:'any',label:'Qualquer era'}]},'@/lib/artist-client':{loadArtists:async()=>[{id:7}]},'@/lib/popularity':{artistTier:a=>a,shuffled:a=>a},'@/lib/audio-preloader':{AudioPreloader:class{}},'@/lib/api-client':{readApiJson:async r=>r}});
 const render=()=>h.render('default');
 const reroll=()=>find(render(),n=>n.type==='GameFilters').props.onReroll();
 assert.equal(await reroll(),1);
 find(render(),n=>n.props?.className==='skip').props.onClick();
 assert.equal(find(render(),n=>n.props?.className==='play').props['aria-label'],'Ouvir 0,5 segundos');
 assert.equal(await reroll(),2);
 assert.equal(find(render(),n=>n.type==='SongSearch').key,'2');
 assert.equal(find(render(),n=>n.props?.className==='play').props['aria-label'],'Ouvir 0,1 segundos');
 assert.equal(await reroll(),3);assert.equal(requests,1);
 }finally{globalThis.fetch=original}
});
test('reroll button calls its action once and confirms only after the new song resolves',async()=>{
 let resolve,calls=0;const promise=new Promise(r=>resolve=r);
 const h=harness('components/game/filters.tsx',{'@/lib/genre-seeds':{GENRES:[]},'@/lib/catalog':{ERAS:[],LEVELS:[]},'@/components/ui/sidebar':{Sidebar:'Sidebar',SidebarContent:'SidebarContent',useSidebar:()=>({setOpenMobile(){}})}});
 const props={value:{genre:'all',era:'any',difficulty:'easy'},loading:false,onChange(){},onReroll(){calls++;return promise}};
 const button=()=>find(h.render('GameFilters',props),n=>n.props?.className==='reroll-song');
 button().props.onClick();button().props.onClick();assert.equal(calls,1);assert.equal(button().props.disabled,true);
 resolve(42);await promise;await Promise.resolve();
 assert.equal(button().props.disabled,false);assert.equal(button().props.children.at(-1),'Música trocada');
});
test('an exhausted pool recycles songs instead of ending the session',async()=>{
 const original=globalThis.fetch;let requests=0;
 const song=(id,key)=>({id,key,title:'Song '+id,shortTitle:'Song '+id,artist:'Artist',link:''});
 globalThis.fetch=async()=>{requests++;return {tracks:[song(1,'a'),song(2,'b'),song(3,'c')]}};
 try{
  const game=compile('lib/game.ts',require);
  const h=harness('app/page.tsx',{'@/lib/game':game,'@/lib/catalog':{DEFAULT_FILTERS:{genre:'all',era:'any',difficulty:'easy'},LEVELS:[{id:'easy',label:'Fácil'}],ERAS:[{id:'any',label:'Qualquer era'}]},'@/lib/artist-client':{loadArtists:async()=>[{id:7}]},'@/lib/popularity':{artistTier:a=>a,shuffled:a=>a},'@/lib/audio-preloader':{AudioPreloader:class{}},'@/lib/api-client':{readApiJson:async r=>r}});
  const render=()=>h.render('default');
  const reroll=()=>find(render(),n=>n.type==='GameFilters').props.onReroll();
  const served=[];
  for(let round=0;round<6;round++){const id=await reroll();assert.notEqual(id,undefined,'round '+round+' ran out of songs');served.push(id)}
  assert.equal(find(render(),n=>n.props?.className==='error-box'),null);
  assert(requests>=3,'the queue never went back to the catalog');
  assert(served.every(id=>[1,2,3].includes(id)));
 }finally{globalThis.fetch=original}
});
