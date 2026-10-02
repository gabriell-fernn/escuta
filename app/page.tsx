'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {AudioLines,Play,Square,SkipForward,Headphones,HelpCircle,Search,Volume2,LoaderCircle,Check,RotateCcw} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {loadArtists} from '@/lib/artist-client';
import {artistTier,shuffled,type RankedArtist} from '@/lib/popularity';
import {AudioPreloader} from '@/lib/audio-preloader';
import {readApiJson} from '@/lib/api-client';
import {DURATIONS,evaluateGuess,nextStage,type SongGuess} from '@/lib/game';
import {SidebarProvider,SidebarTrigger} from '@/components/ui/sidebar';
import {GameFilters} from '@/components/game/filters';
import {SongSearch} from '@/components/game/song-search';
import {DEFAULT_FILTERS,LEVELS,ERAS,type Filters} from '@/lib/catalog';
type Track={key:string;id:number;title:string;shortTitle:string;artist:string;link:string;cover:string};
const format=(n:number)=>String(n).replace('.',',');
export default function Home(){
 const [track,setTrack]=useState<Track|null>(null),[stage,setStage]=useState(0),[guess,setGuess]=useState(''),[notice,setNotice]=useState(''),[result,setResult]=useState<'won'|'revealed'|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[playing,setPlaying]=useState(false),[audioLoading,setAudioLoading]=useState(false),[volume,setVolume]=useState(75);
 const [selectedGuess,setSelectedGuess]=useState<SongGuess|null>(null);
 const [filters,setFilters]=useState<Filters>(DEFAULT_FILTERS);
 const currentTrack=useRef<Track|null>(null);
 const queue=useRef<Track[]>([]),seen=useRef(new Map<string,Set<string>>()),ctx=useRef<AudioContext|null>(null),source=useRef<AudioBufferSourceNode|null>(null),gain=useRef<GainNode|null>(null),generation=useRef(0),roundGeneration=useRef(0);
 const levelArtists=useRef(new Map<string,RankedArtist[]>());
 const catalogPages=useRef(new Map<string,number>());
 const preloader=useRef<AudioPreloader<AudioBuffer>|null>(null);
 if(!preloader.current)preloader.current=new AudioPreloader(async bytes=>{if(!ctx.current)ctx.current=new AudioContext();return ctx.current.decodeAudioData(bytes)});
 const stop=useCallback(()=>{generation.current++;if(source.current){source.current.onended=null;try{source.current.stop()}catch{} source.current.disconnect();source.current=null}setPlaying(false);setAudioLoading(false)},[]);
 const newRound=useCallback(async()=>{
  const request=++roundGeneration.current;const previous=currentTrack.current;queue.current=queue.current.filter(t=>t.id!==previous?.id&&t.key!==previous?.key);stop();setLoading(true);setError('');setTrack(null);setResult(null);setStage(0);setGuess('');setSelectedGuess(null);setNotice('');
  try{
   const filterKey=JSON.stringify(filters);const visited=()=>{const history=seen.current.get(filterKey);if(history)return history;const fresh=new Set<string>();seen.current.set(filterKey,fresh);return fresh};let artists=levelArtists.current.get(filterKey);if(!artists){artists=shuffled(artistTier(await loadArtists(filters.genre),filters.difficulty));levelArtists.current.set(filterKey,artists)}if(request!==roundGeneration.current)return;if(!artists.length)throw new Error('Nenhum artista disponível para este nível.');let attempts=0,recycled=false;const pages=Math.ceil(artists.length/8);
   while(!queue.current.length&&attempts<pages){
    const page=catalogPages.current.get(filterKey)||0;
    const r=await fetch('/api/music?'+new URLSearchParams({...filters,page:String(page),artists:artists.slice(page*8,page*8+8).map(a=>a.id).join(',')}),{headers:{Accept:'application/json'},cache:'no-store'});
    const d=await readApiJson<{tracks:Track[];error?:string;code?:string;pages?:number}>(r);
    if(request!==roundGeneration.current)return;
    if(!Array.isArray(d.tracks))throw new Error(d.error||'O catálogo retornou uma resposta incompleta.');
     attempts++;catalogPages.current.set(filterKey,(page+1)%pages);
     queue.current=d.tracks.filter(t=>!visited().has(t.key)&&t.id!==previous?.id&&t.key!==previous?.key).slice(0,8);
     if(!queue.current.length&&d.tracks.length&&!recycled){
      recycled=true;visited().clear();
      queue.current=d.tracks.filter(t=>t.id!==previous?.id&&t.key!==previous?.key).slice(0,8);
     }
   }
   if(request!==roundGeneration.current)return;
    const next=queue.current.shift();if(!next)throw new Error('Não há músicas inéditas disponíveis para esses filtros nesta sessão. Experimente outro gênero, era ou dificuldade.');
    visited().add(next.key);currentTrack.current=next;setTrack(next);return next.id;
  }catch(e){if(request===roundGeneration.current)setError(e instanceof Error?e.message:'Não foi possível carregar uma música.')}
  finally{if(request===roundGeneration.current)setLoading(false)}
 },[stop,filters]);
 useEffect(()=>{queue.current=[];void newRound();return()=>{roundGeneration.current++;stop();preloader.current?.clear()}},[newRound,stop]);
 useEffect(()=>{if(!track)return;const upcoming=queue.current[0];const loader=preloader.current!;loader.retain([track.id,...(upcoming?[upcoming.id]:[])]);let active=true;void loader.load(track.id).then(()=>{if(active&&upcoming)void loader.load(upcoming.id).catch(()=>{})}).catch(()=>{});return()=>{active=false}},[track]);
 useEffect(()=>()=>{preloader.current?.clear();void ctx.current?.close();ctx.current=null},[]);
 useEffect(()=>{if(gain.current&&ctx.current)gain.current.gain.setValueAtTime(volume/100,ctx.current.currentTime)},[volume]);
 useEffect(()=>{const onHide=()=>{if(document.hidden)stop()};document.addEventListener('visibilitychange',onHide);return()=>document.removeEventListener('visibilitychange',onHide)},[stop]);
 async function playAt(id:number,offset:number,end?:number){const token=++generation.current;setAudioLoading(true);try{if(!ctx.current)ctx.current=new AudioContext();const context=ctx.current;await context.resume();const decoded=await preloader.current!.load(id);if(token!==generation.current)return;const s=context.createBufferSource();s.buffer=decoded;const g=context.createGain();g.gain.value=volume/100;s.connect(g);g.connect(context.destination);gain.current=g;source.current=s;s.onended=()=>{if(token===generation.current){setPlaying(false);source.current=null}s.disconnect();g.disconnect()};setAudioLoading(false);setPlaying(true);const stopAt=Math.min(end??decoded.duration,decoded.duration);s.start(0,Math.min(offset,decoded.duration),Math.max(0.05,stopAt-offset))}catch(error){if(token!==generation.current)return;setAudioLoading(false);setPlaying(false);throw error}}
 async function play(){if(!track||loading)return;if(playing||audioLoading){stop();return}setNotice('');try{await playAt(track.id,0,DURATIONS[stage])}catch{setNotice('Não foi possível tocar esta prévia. Tente ouvir novamente ou troque de música.')}}
 function submit(value=guess,selection:SongGuess|null=selectedGuess){
  if(!track||loading||result||!value.trim())return {accepted:false};
  const outcome=evaluateGuess(value,track,stage,selection);stop();
   if(outcome.correct){setResult('won');setNotice('');void playAt(track.id,DURATIONS[stage]).catch(()=>{})}
  else{
   setStage(outcome.stage);
   setNotice('');
   setGuess('');setSelectedGuess(null);
   document.getElementById('guess')?.focus();
  }
  return {accepted:true,correct:outcome.correct,seconds:DURATIONS[outcome.stage]};
 }
 function skip(){if(!track||result||stage===4)return;stop();setStage(s=>nextStage(s));setNotice('');}
 const actions=useRef({submit,skip,newRound});actions.current={submit,skip,newRound};
 useEffect(()=>{const mc=(document as any).modelContext;if(!mc?.registerTool)return;const lifecycle=new AbortController();for(const tool of [{name:'guess_song',title:'Tentar adivinhar a música',description:'Envia um palpite; um erro libera o próximo trecho, até 15 segundos.',inputSchema:{type:'object',properties:{title:{type:'string',minLength:1}},required:['title'],additionalProperties:false},execute:(input:any)=>{if(typeof input?.title!=='string'||!input.title.trim())throw new Error('Informe o nome da música');return actions.current.submit(input.title,null)}},{name:'skip_song_stage',title:'Liberar mais áudio',description:'Avança um estágio do trecho, até 15 segundos.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>{actions.current.skip();return {requested:true}}}]){try{Promise.resolve(mc.registerTool({...tool,annotations:{readOnlyHint:false,untrustedContentHint:false}},{signal:lifecycle.signal})).catch(()=>{})}catch{}}return()=>lifecycle.abort()},[]);
 return <SidebarProvider className="game-viewport"><GameFilters value={filters} onChange={setFilters} onReroll={newRound} loading={loading}/><div className={'shell game-shell'+(result?' has-result':'')}><header className="topbar"><div className="brand"><SidebarTrigger aria-label="Abrir ou fechar filtros" title="Filtros"/><AudioLines size={29} strokeWidth={2.5}/>escuta<span style={{color:'var(--primary)'}}>.</span></div><Dialog><DialogTrigger asChild><button className="help"><HelpCircle size={17}/> Como jogar</button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Seu ouvido é o desafio.</DialogTitle><DialogDescription>Reconheça a música com o menor trecho possível.</DialogDescription></DialogHeader><div className="instructions"><p>1. Aperte play. Você começa com apenas <strong>0,1 segundo</strong>.</p><p>2. Digite o nome da música. Use <strong>↑↓</strong> para navegar nas sugestões e <strong>Enter</strong> para completar o nome — o foco vai para o botão <strong>Tentar</strong> e outro <strong>Enter</strong> envia. Você pode ouvir e tentar quantas vezes quiser. Acentos e pontuação não atrapalham.</p><p>3. Precisa de mais? Um palpite errado ou o botão <strong>Pular</strong> libera o próximo tempo: 0,5, 2, 8 e 15 segundos.</p><p>No último tempo, continue tentando ou revele a resposta. Cada rodada usa o início de uma prévia da Deezer.</p></div></DialogContent></Dialog></header>
 <main className="stage"><div className="game-heading"><div className="eyebrow"><span>DESAFIO MUSICAL</span></div><h1>Qual é a música?</h1><div className="active-filters"><span>{LEVELS.find(l=>l.id===filters.difficulty)?.label}</span><span>{ERAS.find(e=>e.id===filters.era)?.label}</span></div><p className="intro">Um pedacinho já é suficiente?<br/>Dê o play e confie no seu ouvido.</p></div>
 <section className="player" aria-label="Player do desafio"><div className="player-top"><span>OUÇA O TRECHO</span><span className="tag">{result?'Rodada finalizada':`ETAPA ${stage+1} DE 5`}</span></div><div className={'wave '+(playing?'active':'')} aria-hidden="true">{Array.from({length:65},(_,i)=><span key={i} className={i<([5,13,26,44,65][stage])?'lit':''} style={{height:18+Math.round(Math.abs(Math.sin(i*1.73)*Math.cos(i*.29))*66),animationDelay:`${i*17}ms`}}/>)}</div><div className="play-row"><button className="play" onClick={play} disabled={!track||loading} aria-label={playing?'Parar trecho':audioLoading?'Cancelar carregamento':`Ouvir ${format(DURATIONS[stage])} segundos`}>{audioLoading?<LoaderCircle className="animate-spin" size={25}/>:playing?<Square size={21} fill="currentColor"/>:<Play size={25} fill="currentColor" style={{marginLeft:3}}/>}</button><div><div className="time">{format(DURATIONS[stage])}s<small>/ 15s</small></div><div className="repeat">{loading?'Buscando uma música…':audioLoading?'Carregando áudio…':playing?'Ouvindo o trecho':'Repita quantas vezes quiser'}</div></div><div className="volume"><Volume2 size={19}/><Slider aria-label="Volume" min={0} max={100} step={1} value={[volume]} onValueChange={v=>setVolume(v[0])}/></div></div><div className="steps" aria-label="Tempos do desafio">{DURATIONS.map((d,i)=><div key={d} aria-current={stage===i?'step':undefined} className={'step '+(i<=stage?'unlocked ':'')+(i===stage?'current':'')}>{format(d)}s</div>)}</div></section>
 {/* eslint-disable-next-line @next/next/no-img-element */}
 {error?<div className="error-box" role="alert">{error}<br/><button onClick={()=>void newRound()}>Tentar novamente</button></div>:result&&track?<section className="result animate-in fade-in-0 zoom-in-95 duration-300" aria-live="polite"><div className="art"><span className="cover placeholder" aria-hidden="true"><Headphones size={34}/></span>{track.cover&&<img className="cover" src={track.cover} alt={`Capa de ${track.title}`} onError={e=>{e.currentTarget.style.display='none'}}/>}</div><h2>{track.title}</h2><p>{track.artist}</p><div className="badge">{result==='won'?`ACERTOU EM ${format(DURATIONS[stage])}S!`:'ESSA ERA A MÚSICA'}</div><a href={track.link} target="_blank" rel="noopener noreferrer">Ouvir na Deezer</a><button className="next" onClick={()=>void newRound()}>Próxima música</button></section>:<><form className="guess" onSubmit={e=>{e.preventDefault();submit()}}><div className="input-row"><SongSearch key={track?.id||"empty"} value={guess} selected={selectedGuess} onChange={(text,item)=>{setGuess(text);setSelectedGuess(item)}} disabled={!track||loading}/><button id="guess-submit" className="submit" disabled={!guess.trim()||!track||loading}>Tentar</button></div></form>{notice&&<p role="status" className={'notice '+(notice.startsWith('Não')?'error':'')}>{notice}</p>}{stage<4?<button className="skip" onClick={skip} disabled={!track||loading}><SkipForward size={18}/>Pular</button>:<button className="skip" disabled={!track} onClick={()=>{if(!track)return;stop();setResult('revealed');void playAt(track.id,0).catch(()=>{})}}>Revelar resposta</button>}{notice.startsWith('Não foi possível tocar')&&<button className="help" style={{margin:'16px auto'}} onClick={()=>void newRound()}><RotateCcw size={16}/>Trocar música indisponível</button>}</>}
 </main><footer className="footer"><span style={{display:'flex',alignItems:'center',gap:7}}><Headphones size={15}/>Melhor com fones de ouvido.</span><span>Prévias de músicas via <a href="https://www.deezer.com" target="_blank" rel="noopener noreferrer"><strong>DEEZER</strong></a></span></footer></div></SidebarProvider>
}
