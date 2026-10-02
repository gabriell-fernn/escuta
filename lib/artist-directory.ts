import snapshot from './artist-snapshot.json';
import type {RankedArtist} from './popularity';

// Verified Deezer metadata, bundled with the app so provider failures cannot
// block artist selection. This stores IDs and fan counts, never audio.
export const popularityCapturedAt = snapshot.capturedAt;
export function artistDirectory(genre:string):RankedArtist[]{
 const genres=snapshot.genres as Record<string,RankedArtist[]>;
 const artists=genre==='all'?Object.values(genres).flat():Object.hasOwn(genres,genre)?genres[genre]:[];
 return artists.map(artist=>({...artist}));
}
