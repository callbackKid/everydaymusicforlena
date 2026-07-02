import { useEffect, useState } from 'react';
import { GREETING, youtubeEmbedUrl, youtubeWatchUrl } from './data';
import {
  fetchSongPreview,
  fetchTodaysSong,
  setRecommendation,
  type DailySong,
  type Rating,
} from './lib/songs';
import { ListenButtons } from './components/ListenButtons';
import { VideoEmbed } from './components/VideoEmbed';
import { About } from './components/About';
import { Feedback } from './components/Feedback';
import { Admin } from './components/Admin';

type Status = 'loading' | 'ready' | 'empty' | 'error';

const params = new URLSearchParams(window.location.search);
// A hidden `?song=` param (id or title) previews one specific song without
// running the daily picker: no `played_on` write, no rating buttons. Handy for
// testing; invisible in normal use.
const previewParam = params.get('song');
// A hidden `?admin` param opens the (login-gated) song editor.
const adminMode = params.has('admin');

export default function App() {
  if (adminMode) return <Admin />;
  return <SiteApp />;
}

function SiteApp() {
  const [status, setStatus] = useState<Status>('loading');
  const [song, setSong] = useState<DailySong | null>(null);
  const isPreview = previewParam !== null;

  useEffect(() => {
    let active = true;
    const load = previewParam
      ? fetchSongPreview(previewParam)
      : fetchTodaysSong();
    load
      .then((result) => {
        if (!active) return;
        setSong(result);
        setStatus(result ? 'ready' : 'empty');
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load song:', err);
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleRate(value: Rating) {
    if (!song) return;
    await setRecommendation(song.id, value);
    setSong({ ...song, recommendation: value });
  }

  return (
    <main className="page">
      <div className="column">
        {isPreview && (
          <div className="preview-bar">
            Preview{previewParam ? ` — “${previewParam}”` : ''} · not saved as
            today’s song · <a href="/">exit</a>
          </div>
        )}

        <div className="card">
          <h1 className="greeting">{GREETING}</h1>

          {status === 'loading' && (
            <p className="card__note">Finding today’s music…</p>
          )}

          {status === 'error' && (
            <p className="card__note">
              Something went wrong loading the song. Please refresh in a moment.
            </p>
          )}

          {status === 'empty' && (
            <p className="card__note">
              {isPreview
                ? `No song matches “${previewParam}”.`
                : 'You’ve heard every song so far — check back soon for more. 🎶'}
            </p>
          )}

          {status === 'ready' && song && (
            <SongCard
              song={song}
              onRate={handleRate}
              showFeedback={!isPreview}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function SongCard({
  song,
  onRate,
  showFeedback,
}: {
  song: DailySong;
  onRate: (value: Rating) => Promise<void>;
  showFeedback: boolean;
}) {
  const { album: a, artist, albumBlurb } = song.album;
  const watchUrl = youtubeWatchUrl(a);

  return (
    <>
      <div className="vinyl-block">
        <div className="album-title-block">
          <div className="album-title">
            {a.title} <span className="year">· {a.year}</span>
          </div>
          <div className="album-genre">{a.genreLine}</div>
        </div>
      </div>

      <ListenButtons spotifyUrl={a.spotifyUrl} youtubeUrl={watchUrl} />

      <VideoEmbed
        embedUrl={youtubeEmbedUrl(a)}
        watchUrl={watchUrl}
        title={a.title}
      />

      {showFeedback && <Feedback value={song.recommendation} onRate={onRate} />}

      <About artist={artist} album={{ title: a.title }} blurb={albumBlurb} />
    </>
  );
}
