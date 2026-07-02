interface VideoEmbedProps {
  /** YouTube embed URL (single video or `videoseries?list=…`). */
  embedUrl: string;
  /** Fallback watch URL, shown as a link under the player. */
  watchUrl: string;
  /** Album title, used for the iframe accessible title. */
  title: string;
}

/**
 * Plays the album inline via a YouTube <iframe>. We embed the album playlist
 * (see `youtubeEmbedUrl`) because the individual "Cat" topic upload disallows
 * embedding (Error 153). If YouTube still blocks the frame, the "Watch on
 * YouTube" link below always works.
 */
export function VideoEmbed({ embedUrl, title }: VideoEmbedProps) {
  return (
    <div className="poster">
      <div className="poster__frame">
        <iframe
          className="poster__iframe"
          src={embedUrl}
          title={`${title} — video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
