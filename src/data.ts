/** Greeting shown at the top of the card (same for every song). */
export const GREETING =
  "Hi Lena! Here's some new music for you today. Have a great day, you’ve got this!";

/**
 * The shape a song takes once loaded from the database and mapped for the UI.
 * See `src/lib/songs.ts` for the DB row -> AlbumData mapping.
 */
export interface AlbumData {
  album: {
    title: string;
    year: number;
    genreLine: string;
    /** YouTube video id used for the poster thumbnail + link. */
    youtubeId: string;
    /** Optional YouTube playlist id (album auto-playlist). */
    youtubePlaylistId?: string;
    spotifyUrl: string;
  };
  artist: {
    name: string;
    role: string;
    lifespan: string;
    bio: string;
    wikipediaUrl: string;
  };
  /** Rich description of the record. `tracks` are highlighted inline. */
  albumBlurb: {
    lead: string;
    tracks: string[];
    tail: string;
  };
}

/** Build a watch URL from the album's video + optional playlist. */
export function youtubeWatchUrl(a: AlbumData['album']): string {
  const base = `https://www.youtube.com/watch?v=${a.youtubeId}`;
  return a.youtubePlaylistId ? `${base}&list=${a.youtubePlaylistId}` : base;
}

/** YouTube-hosted thumbnail for the video poster. */
export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * URL for an inline <iframe> player. Prefers the album playlist
 * (`videoseries?list=…`): the auto-generated album playlist is normally
 * embeddable and plays the whole record, whereas the individual "topic"
 * video often refuses to embed (Error 150/153).
 */
export function youtubeEmbedUrl(a: AlbumData['album']): string {
  return a.youtubePlaylistId
    ? `https://www.youtube.com/embed/videoseries?list=${a.youtubePlaylistId}`
    : `https://www.youtube.com/embed/${a.youtubeId}`;
}
