import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function compile(file,resolve=require){const exports={};new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(resolve,exports);return exports}
const {evaluateGuess}=compile('lib/game.ts');
const track={id:42,title:'Halo',shortTitle:'Halo',artist:'Beyoncé'};
test('selected result accepts the exact track and alternate releases of the same song',()=>{
 assert(evaluateGuess('Halo',track,0,track).correct);
 assert(evaluateGuess('Halo (Remastered)',track,0,{...track,id:123,title:'Halo (Remastered)'}).correct);
 assert.equal(evaluateGuess('Halo',track,0,{id:99,title:'Halo',artist:'Other artist'}).correct,false);
 assert.equal(evaluateGuess('halo',track,0).stage,0);
});
test('wrong guesses advance exactly one stage and remain at 15 seconds',()=>{
 for(let stage=0;stage<5;stage++)assert.deepEqual(evaluateGuess('Wrong',track,stage),{correct:false,stage:Math.min(stage+1,4)});
 assert.deepEqual(evaluateGuess(' ',track,0),{correct:false,stage:1}); // UI rejects empty submissions.
});
function searchHarness(){
 let slots=[],cursor=0,props={value:'hal',selected:null,disabled:false};const submissions=[];
 const React={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next}]},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i]},useEffect(){}};
 const ui=Object.fromEntries(['Combobox','ComboboxInput','ComboboxContent','ComboboxList','ComboboxItem'].map(x=>[x,x]));
 const {SongSearch}=compile('components/game/song-search.tsx',id=>id==='react'?React:id==='@/lib/api-client'?{}:id==='@/components/ui/combobox'?ui:require(id));
 props.onChange=(value,selected)=>{props={...props,value,selected}};
 props.onSubmit=(value,selected)=>submissions.push({value,selected});
 function render(){cursor=0;const root=SongSearch(props).props.children;return {root:root.props,input:root.props.children[0].props}}
 function enter(input,extra={}){let prevented=0,stopped=0;input.onKeyDownCapture({key:'Enter',nativeEvent:{isComposing:false},repeat:false,preventDefault(){prevented++},stopPropagation(){stopped++},...extra});return {prevented,stopped}}
 return {render,enter,submissions,props:()=>props};
}
function focusStub(){const calls=[];const previous=globalThis.document;globalThis.document={getElementById:id=>({focus(){calls.push(id)}})};return {calls,restore(){if(previous===undefined)delete globalThis.document;else globalThis.document=previous}}}
test('click selection persists its identity despite combobox input synchronization; Enter focuses Tentar without submitting',()=>{
 const h=searchHarness(),f=focusStub();try{
  let view=h.render();
  view.root.onValueChange(track);
  view.root.onInputValueChange('hal',{reason:'none'});
  assert.equal(h.props().value,'Halo');assert.equal(h.props().selected.id,42);
  assert.deepEqual(f.calls,['guess-submit']);
  f.calls.length=0;
  view=h.render();assert.deepEqual(h.enter(view.input),{prevented:1,stopped:1});
  assert.deepEqual(h.submissions,[]);
  assert.deepEqual(f.calls,['guess-submit']);
  // The form button receives exactly the same controlled selection.
  assert.equal(h.props().selected,track);
 }finally{f.restore()}
});
test('Enter on a highlighted suggestion completes the full title and moves focus to Tentar',()=>{
 const h=searchHarness(),f=focusStub();try{
  h.render().root.onOpenChange(true);const view=h.render();
  view.root.onItemHighlighted(track);
  assert.deepEqual(h.enter(view.input),{prevented:1,stopped:1});
  assert.deepEqual(h.submissions,[]);
  assert.equal(h.props().value,'Halo');assert.equal(h.props().selected,track);
  assert.deepEqual(f.calls,['guess-submit']);
 }finally{f.restore()}
});
test('editing a selected song clears its identity; free text Enter only focuses Tentar',()=>{
 const h=searchHarness(),f=focusStub();try{
  h.render().root.onValueChange(track);let view=h.render();
  view.root.onInputValueChange('another',{reason:'input-change'});f.calls.length=0;view=h.render();h.enter(view.input);
  assert.deepEqual(h.submissions,[]);
  assert.equal(h.props().value,'another');assert.equal(h.props().selected,null);
  assert.deepEqual(f.calls,['guess-submit']);
  const focused=f.calls.length;
  h.enter(view.input,{repeat:true});h.enter(view.input,{nativeEvent:{isComposing:true}});
  assert.equal(f.calls.length,focused);assert.equal(h.submissions.length,0);
 }finally{f.restore()}
});
test('typing and refocusing reopen suggestions; popup uses the space above the fixed-height form',()=>{
 const h=searchHarness();let view=h.render();
 view.input.onChange({currentTarget:{value:'rain'}});
 view=h.render();assert.equal(h.props().value,'rain');assert.equal(view.root.open,true);assert.equal(view.root.autoHighlight,'always');
 view.root.onOpenChange(false);view=h.render();assert.equal(view.root.open,false);
 view.input.onFocus();view=h.render();assert.equal(view.root.open,true);
 assert.equal(view.root.children[1].props.side,'top');
});
