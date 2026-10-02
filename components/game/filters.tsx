'use client';
import {useEffect,useRef,useState} from 'react';
import {GENRES} from '@/lib/genre-seeds';
import {LayoutGrid,X,RotateCcw,LoaderCircle,Check} from 'lucide-react';
import {Sidebar,SidebarContent,useSidebar} from '@/components/ui/sidebar';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {ERAS,LEVELS,type Filters} from '@/lib/catalog';

export function GameFilters({value,onChange,onReroll,loading}:{value:Filters;onChange:(f:Filters)=>void;onReroll:()=>Promise<number|undefined>;loading:boolean}){
 const {setOpenMobile}=useSidebar();
 const [rerolling,setRerolling]=useState(false),[changed,setChanged]=useState(false);
 const busy=useRef(false);
 useEffect(()=>{if(!changed)return;const timer=setTimeout(()=>setChanged(false),2200);return()=>clearTimeout(timer)},[changed]);
 async function reroll(){
  if(busy.current||loading)return;
  busy.current=true;setRerolling(true);setChanged(false);
  try{const id=await onReroll();if(id!==undefined)setChanged(true)}
  finally{busy.current=false;setRerolling(false)}
 }

 function change(next:Partial<Filters>){
  const updated={...value,...next};
  if(updated.genre!==value.genre||updated.era!==value.era||updated.difficulty!==value.difficulty)onChange(updated);
 }
 return <Sidebar className="game-sidebar">
  <SidebarContent className="filter-content">
   <button type="button" className="mobile-close" onClick={()=>setOpenMobile(false)} aria-label="Fechar filtros"><X size={20}/></button>
   <div className="filter-field"><label htmlFor="genre">Gênero</label>
    <Select value={value.genre} onValueChange={genre=>change({genre})}>
     <SelectTrigger id="genre"><LayoutGrid size={16} aria-hidden="true"/><SelectValue/></SelectTrigger>
     <SelectContent>{GENRES.map(g=><SelectItem key={g.id} value={g.id}>{g.id==='all'?'Todos':g.label}</SelectItem>)}</SelectContent>
    </Select>
   </div>
   <div className="filter-field"><label htmlFor="era">Era</label>
    <Select value={value.era} onValueChange={era=>change({era})}>
     <SelectTrigger id="era"><LayoutGrid size={16} aria-hidden="true"/><SelectValue/></SelectTrigger>
     <SelectContent>{ERAS.map(e=><SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}</SelectContent>
    </Select>
   </div>
   <div className="difficulty-section" role="group" aria-labelledby="difficulty-label">
    <span id="difficulty-label" className="filter-label">Dificuldade</span>
    <div className="difficulty-options">{LEVELS.map(level=><button type="button" key={level.id} className="difficulty-option" aria-pressed={value.difficulty===level.id} onClick={()=>change({difficulty:level.id})}>{level.label}</button>)}</div>
   </div>
   <div className="filter-bottom"><button type="button" className="reroll-song" disabled={loading||rerolling} onClick={()=>void reroll()} aria-live="polite" aria-busy={rerolling}>{rerolling?<LoaderCircle size={16} className="animate-spin" aria-hidden="true"/>:changed?<Check size={16} aria-hidden="true"/>:<RotateCcw size={16} aria-hidden="true"/>}{rerolling?'Sorteando…':changed?'Música trocada':'Sortear outra música'}</button></div>
  </SidebarContent>
 </Sidebar>;
}
