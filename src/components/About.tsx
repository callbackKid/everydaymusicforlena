import type { AlbumData } from '../data';
import { Fragment } from 'react';

interface AboutProps {
  artist: AlbumData['artist'];
  album: Pick<AlbumData['album'], 'title'>;
  blurb: AlbumData['albumBlurb'];
}

export function About({ artist, album, blurb }: AboutProps) {
  return (
    <section className="about">
      <div className="divider">
        <div className="divider__line" />
        <div className="divider__label">About</div>
        <div className="divider__line" />
      </div>

      <h2>{artist.name}</h2>
      <div className="about__role">
        {artist.role} · {artist.lifespan}
      </div>
      <p>{artist.bio}</p>

      <h2 className="spaced">
        The album — <span className="italic">{album.title}</span>
      </h2>
      <p>
        {blurb.lead}
        {blurb.tracks.map((track, i) => (
          <Fragment key={track}>
            <span className="track">{track}</span>
            {i < blurb.tracks.length - 2
              ? ', '
              : i === blurb.tracks.length - 2
                ? ' and '
                : ''}
          </Fragment>
        ))}
        {blurb.tail}
      </p>

      <a
        className="wiki-link"
        href={artist.wikipediaUrl}
        target="_blank"
        rel="noopener"
      >
        Read more →
      </a>
    </section>
  );
}
