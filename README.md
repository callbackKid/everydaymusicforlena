# For Lena — a little music page

A single-page gift site presenting Hiroshi Suzuki's 1976 album _Cat_: a warm greeting, a spinning vinyl, links to Spotify and YouTube, a click-to-play video poster, and a short note about the artist and album.

Built with **Vite + React + TypeScript**.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Project structure

```
for-lena/
├── index.html              # HTML shell + Google Fonts (DM Serif Display, Spectral)
├── src/
│   ├── main.tsx            # React entry
│   ├── App.tsx             # page composition
│   ├── data.ts             # all content + types (edit this to change the music)
│   ├── index.css           # styles
│   └── components/
│       ├── Vinyl.tsx        # animated record
│       ├── ListenButtons.tsx
│       ├── VideoPoster.tsx  # click-to-play YouTube poster
│       └── About.tsx        # artist + album blurb
└── ...config
```

## Changing the music

Everything is driven by one typed object in [`src/data.ts`](src/data.ts) — swap the
`greeting`, `album` (title, year, YouTube id, Spotify URL) and `artist` fields and the
whole page updates.

## Why the video is a poster, not an embed

The _Cat_ upload is a YouTube auto-generated "topic" video, which disallows inline
embedding (Error 153). `VideoPoster` shows the real thumbnail and opens the video and
album playlist on YouTube — reliable in any browser, including a locally-served build.
