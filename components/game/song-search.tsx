'use client';
import {readApiJson} from '@/lib/api-client';
import type {SongGuess} from '@/lib/game';
import {useEffect,useRef,useState} from 'react';
import {Combobox,ComboboxInput,ComboboxContent,ComboboxList,ComboboxItem} from '@/components/ui/combobox';

type Props={value:string;selected:SongGuess|null;onChange:(value:string,selected:SongGuess|null)=>void;disabled:boolean};
export function SongSearch({value,selected,onChange,disabled}:Props){
 const [items,setItems]=useState<SongGuess[]>([]),[open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const highlighted=useRef<SongGuess|null>(null);
 useEffect(()=>{
  const query=value.trim();const controller=new AbortController();setItems([]);setError('');highlighted.current=null;
  if(query.length<2||disabled||selected){setLoading(false);return()=>controller.abort()}
  setLoading(true);
  const timer=setTimeout(async()=>{
   try{
    const r=await fetch('/api/search?q='+encodeURIComponent(query),{signal:controller.signal,headers:{Accept:'application/json'}});
    const d=await readApiJson<{tracks:SongGuess[]}>(r);
    if(!Array.isArray(d.tracks))throw Error();
    if(!controller.signal.aborted){setItems(d.tracks);if(document.activeElement?.id==='guess')setOpen(true)}
   }catch{if(!controller.signal.aborted)setError('Sugestões indisponíveis. Você pode digitar e tentar.')}
   finally{if(!controller.signal.aborted)setLoading(false)}
  },300);
  return()=>{clearTimeout(timer);controller.abort()};
 },[value,selected,disabled]);
 const focusTry=()=>globalThis.document?.getElementById('guess-submit')?.focus();
 return <div className="song-search"><Combobox<SongGuess>
  items={items} filter={null} modal={false} value={selected} inputValue={value} autoHighlight={'always' as unknown as boolean}
  open={open&&value.trim().length>=2&&!disabled&&!selected}
  onOpenChange={next=>{setOpen(next);if(!next)highlighted.current=null}}
  onItemHighlighted={item=>{highlighted.current=item??null}}
  onInputValueChange={(text,details)=>{
   // Item selection has its own callback. Do not let a later input-sync
   // callback erase the selected track or restore the old query.
   if(details.reason!=='input-change'&&details.reason!=='input-clear')return;
   highlighted.current=null;onChange(text,null);setOpen(true);
  }}
  onValueChange={item=>{if(item){onChange(item.title,item);highlighted.current=null;setOpen(false);focusTry()}}}
  itemToStringLabel={item=>item.title} isItemEqualToValue={(a,b)=>a.id===b.id}>
  <ComboboxInput id="guess" aria-label="Nome da música" autoComplete="off" placeholder="Digite o nome da música" showTrigger={false} disabled={disabled}
   onChange={event=>{highlighted.current=null;onChange(event.currentTarget.value,null);setOpen(true)}}
   onFocus={()=>{if(value.trim().length>=2&&!selected)setOpen(true)}}
   onKeyDownCapture={event=>{
    if(event.key!=='Enter'||event.nativeEvent.isComposing)return;
    event.preventDefault();event.stopPropagation();
    if(disabled||event.repeat)return;
    const item=(open&&!selected?highlighted.current:null)||selected;
    highlighted.current=null;setOpen(false);
    // Fill from the ref: React state from selection is not yet committed.
    if(item)onChange(item.title,item);
    focusTry();
   }}/>
  <ComboboxContent className="song-suggestions" side="top" sideOffset={8}>
   {loading?<p role="status" className="suggestion-status">Buscando músicas…</p>:error?<p role="status" className="suggestion-status">{error}</p>:items.length===0?<p className="suggestion-status">Nenhuma sugestão. Você ainda pode tentar esse nome.</p>:null}
   <ComboboxList>{(item:SongGuess)=><ComboboxItem key={item.id} value={item}><div><strong>{item.title}</strong><small>{item.artist}</small></div></ComboboxItem>}</ComboboxList>
  </ComboboxContent>
 </Combobox></div>;
}
