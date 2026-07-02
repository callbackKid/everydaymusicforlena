import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  createSong,
  fetchAllSongs,
  onAuthChange,
  signIn,
  signOut,
  updateSong,
  type SongInput,
  type SongRow,
} from '../lib/songs';

// The form holds every field as a string (easier for inputs); it's converted
// to a SongInput on save. `blurb_tracks` is edited as a comma-separated line.
interface FormState {
  title: string;
  year: string;
  genre_line: string;
  youtube_id: string;
  youtube_playlist_id: string;
  spotify_url: string;
  artist_name: string;
  artist_role: string;
  artist_lifespan: string;
  artist_bio: string;
  artist_wikipedia_url: string;
  blurb_lead: string;
  blurb_tracks: string;
  blurb_tail: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  year: '',
  genre_line: '',
  youtube_id: '',
  youtube_playlist_id: '',
  spotify_url: '',
  artist_name: '',
  artist_role: '',
  artist_lifespan: '',
  artist_bio: '',
  artist_wikipedia_url: '',
  blurb_lead: '',
  blurb_tracks: '',
  blurb_tail: '.',
};

function rowToForm(row: SongRow): FormState {
  return {
    title: row.title ?? '',
    year: row.year != null ? String(row.year) : '',
    genre_line: row.genre_line ?? '',
    youtube_id: row.youtube_id ?? '',
    youtube_playlist_id: row.youtube_playlist_id ?? '',
    spotify_url: row.spotify_url ?? '',
    artist_name: row.artist_name ?? '',
    artist_role: row.artist_role ?? '',
    artist_lifespan: row.artist_lifespan ?? '',
    artist_bio: row.artist_bio ?? '',
    artist_wikipedia_url: row.artist_wikipedia_url ?? '',
    blurb_lead: row.blurb_lead ?? '',
    blurb_tracks: (row.blurb_tracks ?? []).join(', '),
    blurb_tail: row.blurb_tail ?? '',
  };
}

function formToInput(form: FormState): SongInput {
  return {
    title: form.title.trim(),
    year: form.year.trim() ? Number(form.year) : null,
    genre_line: form.genre_line.trim(),
    youtube_id: form.youtube_id.trim(),
    youtube_playlist_id: form.youtube_playlist_id.trim() || null,
    spotify_url: form.spotify_url.trim(),
    artist_name: form.artist_name.trim(),
    artist_role: form.artist_role.trim(),
    artist_lifespan: form.artist_lifespan.trim(),
    artist_bio: form.artist_bio.trim(),
    artist_wikipedia_url: form.artist_wikipedia_url.trim(),
    blurb_lead: form.blurb_lead,
    blurb_tracks: form.blurb_tracks
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    blurb_tail: form.blurb_tail,
  };
}

export function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthChange((s) => {
      setSession(s);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <div className="admin admin--center">Loading…</div>;
  }

  return session ? <AdminPanel /> : <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin admin--center">
      <form className="admin-login" onSubmit={submit}>
        <h1 className="admin-title">Admin</h1>
        <label className="admin-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="admin-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <div className="admin-error">{error}</div>}
        <button className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Log in'}
        </button>
        <a className="admin-exit" href="/">
          ← Back to site
        </a>
      </form>
    </div>
  );
}

function AdminPanel() {
  const [songs, setSongs] = useState<SongRow[] | null>(null);
  const [editing, setEditing] = useState<SongRow | 'new' | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setSongs(await fetchAllSongs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    }
  }

  useEffect(() => {
    let active = true;
    fetchAllSongs()
      .then((rows) => {
        if (active) setSongs(rows);
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Failed to load songs');
      });
    return () => {
      active = false;
    };
  }, []);

  if (editing) {
    return (
      <SongForm
        song={editing === 'new' ? null : editing}
        onDone={() => {
          setEditing(null);
          void load();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="admin">
      <div className="admin-bar">
        <h1 className="admin-title">Songs</h1>
        <div className="admin-bar__actions">
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => setEditing('new')}
          >
            + Add song
          </button>
          <button className="admin-btn" onClick={() => void signOut()}>
            Log out
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {songs === null ? (
        <p>Loading…</p>
      ) : songs.length === 0 ? (
        <p>No songs yet.</p>
      ) : (
        <ul className="admin-list">
          {songs.map((s) => (
            <li key={s.id} className="admin-row">
              <div>
                <strong>{s.title}</strong>{' '}
                <span className="admin-muted">
                  · {s.artist_name} · {s.year ?? '—'}
                </span>
                <div className="admin-muted admin-small">
                  played: {s.played_on ?? 'never'} · rating:{' '}
                  {s.recommendation ?? '—'}
                </div>
              </div>
              <button className="admin-btn" onClick={() => setEditing(s)}>
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}

      <a className="admin-exit" href="/">
        ← Back to site
      </a>
    </div>
  );
}

function SongForm({
  song,
  onDone,
  onCancel,
}: {
  song: SongRow | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    song ? rowToForm(song) : EMPTY_FORM,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const input = formToInput(form);
      if (song) {
        await updateSong(song.id, input);
      } else {
        await createSong(input);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setBusy(false);
    }
  }

  return (
    <div className="admin">
      <h1 className="admin-title">
        {song ? `Edit — ${song.title}` : 'New song'}
      </h1>
      <form className="admin-form" onSubmit={submit}>
        <Field
          label="Title *"
          value={form.title}
          onChange={(v) => set('title', v)}
          required
        />
        <Field
          label="Year"
          value={form.year}
          onChange={(v) => set('year', v)}
          type="number"
        />
        <Field
          label="Genre line"
          value={form.genre_line}
          onChange={(v) => set('genre_line', v)}
        />
        <Field
          label="YouTube video id *"
          value={form.youtube_id}
          onChange={(v) => set('youtube_id', v)}
          required
        />
        <Field
          label="YouTube playlist id (optional)"
          value={form.youtube_playlist_id}
          onChange={(v) => set('youtube_playlist_id', v)}
        />
        <Field
          label="Spotify URL"
          value={form.spotify_url}
          onChange={(v) => set('spotify_url', v)}
        />
        <Field
          label="Artist name *"
          value={form.artist_name}
          onChange={(v) => set('artist_name', v)}
          required
        />
        <Field
          label="Artist role"
          value={form.artist_role}
          onChange={(v) => set('artist_role', v)}
        />
        <Field
          label="Artist lifespan"
          value={form.artist_lifespan}
          onChange={(v) => set('artist_lifespan', v)}
        />
        <Field
          label="Artist bio"
          value={form.artist_bio}
          onChange={(v) => set('artist_bio', v)}
          textarea
        />
        <Field
          label="Artist Wikipedia URL"
          value={form.artist_wikipedia_url}
          onChange={(v) => set('artist_wikipedia_url', v)}
        />
        <Field
          label="Blurb — lead"
          value={form.blurb_lead}
          onChange={(v) => set('blurb_lead', v)}
          textarea
        />
        <Field
          label="Blurb — highlighted tracks (comma-separated)"
          value={form.blurb_tracks}
          onChange={(v) => set('blurb_tracks', v)}
        />
        <Field
          label="Blurb — tail"
          value={form.blurb_tail}
          onChange={(v) => set('blurb_tail', v)}
        />

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-form__actions">
          <button className="admin-btn admin-btn--primary" disabled={busy}>
            {busy ? 'Saving…' : song ? 'Save changes' : 'Create song'}
          </button>
          <button type="button" className="admin-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  textarea = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          required={required}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </label>
  );
}
