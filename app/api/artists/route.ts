import {ARTISTS} from '@/lib/genre-seeds';
import {artistDirectory} from '@/lib/artist-directory';
export async function GET(request:Request){const genre=new URL(request.url).searchParams.get('genre')||'';if(!Object.hasOwn(ARTISTS,genre))return Response.json({error:'Gênero inválido.'},{status:400});try{return Response.json({artists:await artistDirectory(genre)},{headers:{'Cache-Control':'private, max-age=3600'}})}catch{return Response.json({error:'Não foi possível consultar a popularidade dos artistas. Tente novamente.'},{status:503})}}
