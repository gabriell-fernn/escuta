import {artistDirectory} from './artist-directory';

// Selecting difficulty must not make hundreds of upstream artist searches.
// Track discovery and preview playback still use the live music API.
export async function loadArtists(genre:string){return artistDirectory(genre)}
