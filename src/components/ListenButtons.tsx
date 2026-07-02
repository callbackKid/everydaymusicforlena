interface ListenButtonsProps {
  spotifyUrl: string;
  youtubeUrl: string;
}

export function ListenButtons({ spotifyUrl, youtubeUrl }: ListenButtonsProps) {
  return (
    <div className="listen">
      <a
        className="btn btn--spotify"
        href={spotifyUrl}
        target="_blank"
        rel="noopener"
      >
        <span className="glyph">♪</span>
        Play on Spotify
      </a>
      <a
        className="btn btn--youtube"
        href={youtubeUrl}
        target="_blank"
        rel="noopener"
      >
        <svg
          className="yt-glyph"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="#ff0000"
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
          />
          <path fill="#fff" d="M9.545 15.568V8.432L15.818 12z" />
        </svg>
        Watch on YouTube
      </a>
    </div>
  );
}
