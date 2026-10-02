import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function load(file){
 file=path.resolve(file);
 if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','exports',code)(id=>load(path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts'))),exports);
 return exports;
}
test('every genre and difficulty loads with the network unavailable',async()=>{
 const previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw new Error('Provider unavailable')};
 try{
  const {loadArtists}=load('lib/artist-client.ts');
  const {artistTier,DIFFICULTY_IDS}=load('lib/popularity.ts');
  const groups=await Promise.all(['all','pop','hiphop','rock','rnb','country','kpop'].map(g=>loadArtists(g)));
  assert.equal(groups[0].length,216);
  for(const [index,artists] of groups.entries()){
   assert.equal(artists.length,index===0?216:36);
   assert.equal(new Set(artists.map(a=>a.id)).size,artists.length);
   assert(artists.every(a=>Number.isSafeInteger(a.id)&&a.id>0&&a.name&&Number.isFinite(a.fans)&&a.fans>=0));
   const tiers=DIFFICULTY_IDS.map(l=>artistTier(artists,l));
   assert(tiers.every(t=>t.length>=7));
   for(let i=1;i<tiers.length;i++)assert(Math.max(...tiers[i].map(a=>a.fans))<=Math.min(...tiers[i-1].map(a=>a.fans)));
  }
  assert.equal(calls,0);
  groups[1][0].fans=-1;
  assert((await loadArtists('pop'))[0].fans>=0);
  assert.deepEqual(await loadArtists('__proto__'),[]);
 }finally{globalThis.fetch=previous}
});
