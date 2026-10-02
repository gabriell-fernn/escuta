export const DURATIONS = [0.1,0.5,2,8,15];
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export const baseTitle=(s:string)=>s.replace(/\s*[([][^)\]]*[)\]]/g,'').replace(/\s+-\s+(remaster.*|radio.*|live.*|ao vivo.*|feat.*|version.*|edit.*)$/i,'').trim();
export function matches(answer:string,title:string,shortTitle?:string){const a=normalize(answer);return !!a&&[title,baseTitle(title),shortTitle].filter(Boolean).some(t=>normalize(t!)===a)}
export function nextStage(stage:number){return Math.min(stage+1,DURATIONS.length-1)}

export type SongGuess={id:number;title:string;shortTitle?:string;artist:string};
export function matchesGuess(answer:string,track:SongGuess,selected:SongGuess|null=null){
 if(!selected)return matches(answer,track.title,track.shortTitle);
 if(selected.id===track.id)return true;
 if(normalize(selected.artist)!==normalize(track.artist))return false;
 // Different releases can have different IDs and edition suffixes.
 return [selected.title,baseTitle(selected.title),selected.shortTitle].filter(Boolean).some(title=>matches(title!,track.title,track.shortTitle));
}
export function evaluateGuess(answer:string,track:SongGuess,stage:number,selected:SongGuess|null=null){
 const correct=matchesGuess(answer,track,selected);
 return {correct,stage:correct?stage:nextStage(stage)};
}
