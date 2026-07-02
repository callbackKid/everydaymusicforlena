import type { Session } from '@supabase/supabase-js';
import type { AlbumData } from '../data';
import { supabase } from './supabase';

/** The three ratings Lena can give a song. */
export type Rating = 'more' | 'average' | 'no';

/** Lena's feedback on a song. `null` = no answer yet. */
export type Recommendation = Rating | null;

/** A raw row from the `songs` table (snake_case, as stored in Postgres). */
export interface SongRow {
  id: number;
  title: string;
  year: number;
  genre_line: string;
  youtube_id: string;
  youtube_playlist_id: string | null;
  spotify_url: string;
  artist_name: string;
  artist_role: string;
  artist_lifespan: string;
  artist_bio: string;
  artist_wikipedia_url: string;
  blurb_lead: string;
  blurb_tracks: string[];
  blurb_tail: string;
  played_on: string | null;
  recommendation: Recommendation;
}

/** Today's song, ready for the UI. `null` recommendation = not rated yet. */
export interface DailySong {
  id: number;
  album: AlbumData;
  recommendation: Recommendation;
}

/** Map a DB row into the nested shape the components expect. */
function rowToAlbum(row: SongRow): AlbumData {
  return {
    album: {
      title: row.title,
      year: row.year,
      genreLine: row.genre_line,
      youtubeId: row.youtube_id,
      youtubePlaylistId: row.youtube_playlist_id ?? undefined,
      spotifyUrl: row.spotify_url,
    },
    artist: {
      name: row.artist_name,
      role: row.artist_role,
      lifespan: row.artist_lifespan,
      bio: row.artist_bio,
      wikipediaUrl: row.artist_wikipedia_url,
    },
    albumBlurb: {
      lead: row.blurb_lead,
      tracks: row.blurb_tracks ?? [],
      tail: row.blurb_tail,
    },
  };
}

/**
 * Get the "song of the day". The `todays_song` DB function returns the song
 * already assigned to today, or picks a new unplayed one and marks it played.
 * Returns `null` when every song has been played.
 */
export async function fetchTodaysSong(): Promise<DailySong | null> {
  const { data, error } = await supabase.rpc('todays_song');
  if (error) throw error;

  const row = (data as SongRow[] | null)?.[0];
  if (!row) return null;

  return {
    id: row.id,
    album: rowToAlbum(row),
    recommendation: row.recommendation,
  };
}

/**
 * Read a specific song by id (numeric) or title (case-insensitive), without
 * touching `played_on`. Used by the hidden `?song=` preview so a song can be
 * viewed for testing without consuming a day. Returns `null` if none match.
 */
export async function fetchSongPreview(
  param: string,
): Promise<DailySong | null> {
  const term = param.trim();
  const base = supabase.from('songs').select('*');
  const query = /^\d+$/.test(term)
    ? base.eq('id', Number(term))
    : base.ilike('title', term);

  const { data, error } = await query.limit(1);
  if (error) throw error;

  const row = (data as SongRow[] | null)?.[0];
  if (!row) return null;

  return {
    id: row.id,
    album: rowToAlbum(row),
    recommendation: row.recommendation,
  };
}

/**
 * Save Lena's feedback for a song. Sends a PATCH to Supabase updating the
 * single `recommendation` column (the only column visitors may write).
 */
export async function setRecommendation(
  id: number,
  recommendation: Recommendation,
): Promise<void> {
  const { error } = await supabase
    .from('songs')
    .update({ recommendation })
    .eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Admin: managing songs (requires a logged-in Supabase user — see Admin.tsx).
// ---------------------------------------------------------------------------

/** The editable content fields of a song (everything except id/played_on/…). */
export interface SongInput {
  title: string;
  year: number | null;
  genre_line: string;
  youtube_id: string;
  youtube_playlist_id: string | null;
  spotify_url: string;
  artist_name: string;
  artist_role: string;
  artist_lifespan: string;
  artist_bio: string;
  artist_wikipedia_url: string;
  blurb_lead: string;
  blurb_tracks: string[];
  blurb_tail: string;
}

/** List every song (admin table view). */
export async function fetchAllSongs(): Promise<SongRow[]> {
  const { data, error } = await supabase.from('songs').select('*').order('id');
  if (error) throw error;
  return (data as SongRow[]) ?? [];
}

/** Insert a new song. Requires a logged-in admin session. */
export async function createSong(input: SongInput): Promise<SongRow> {
  const { data, error } = await supabase
    .from('songs')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as SongRow;
}

/** Update an existing song's content. Requires a logged-in admin session. */
export async function updateSong(
  id: number,
  input: SongInput,
): Promise<SongRow> {
  const { data, error } = await supabase
    .from('songs')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as SongRow;
}

// ---------------------------------------------------------------------------
// Auth (admin login)
// ---------------------------------------------------------------------------

/** Subscribe to the current session; fires immediately and on every change. */
export function onAuthChange(
  cb: (session: Session | null) => void,
): () => void {
  void supabase.auth.getSession().then(({ data }) => cb(data.session));
  const { data } = supabase.auth.onAuthStateChange((_event, session) =>
    cb(session),
  );
  return () => data.subscription.unsubscribe();
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
