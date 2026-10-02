import {GENRES} from '@/lib/genre-seeds';
export async function GET(){return Response.json({genres:GENRES.filter(g=>g.id!=='all')},{headers:{'Cache-Control':'public, max-age=3600'}})}
