import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {readApiJson} from '../lib/api-client.ts';
for(const [name,status,body] of [['HTML 404',404,'<!DOCTYPE html><h1>Not found</h1>'],['HTML 200',200,'<html>Sign in</html>'],['empty 503',503,''],['malformed JSON',200,'{'],['unexpected array',200,'[]']]){
 test(name+' never leaks a parsing error',async()=>{await assert.rejects(()=>readApiJson(new Response(body,{status})),e=>e instanceof Error&&!(e instanceof SyntaxError)&&!e.message.includes('JSON.parse'))});
}
test('valid catalog is preserved',async()=>{assert.deepEqual(await readApiJson(Response.json({tracks:[{id:1}]})),{tracks:[{id:1}]})});
test('valid server error is preserved',async()=>{await assert.rejects(()=>readApiJson(Response.json({error:'Fonte indisponível'},{status:503})),/Fonte indisponível/)});
test('empty filtered catalog is JSON 200, not a hosting 404',async()=>{
 const code=ts.transpileModule(readFileSync(new URL('../app/api/music/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};new Function('require','exports',code)(name=>name==='@/lib/music-catalog'?{catalog:async()=>({tracks:[],pages:3,stats:{}})}:{balancedDifficultyPool:()=>[],validFilters:()=>true},exports);
 const response=await exports.GET(new Request('https://test.local/api/music?genre=pop&era=any&difficulty=easy&artists=1,2'));
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const data=await readApiJson(response);assert.equal(data.code,'NO_MATCHING_TRACKS');assert.deepEqual(data.tracks,[]);assert.equal(typeof data.error,'string');
});
