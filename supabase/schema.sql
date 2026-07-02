-- ============================================================================
-- everydaymusicforlena — Supabase setup
-- Run this ONCE in your Supabase project: Dashboard -> SQL Editor -> New query
-- -> paste this whole file -> Run.
-- Safe to re-run: it only creates things if they don't already exist.
-- ============================================================================

-- 1) The songs table -------------------------------------------------------
create table if not exists public.songs (
  id                    bigint generated always as identity primary key,
  title                 text    not null,
  year                  int,
  genre_line            text,
  youtube_id            text    not null,
  youtube_playlist_id   text,
  spotify_url           text,
  artist_name           text    not null,
  artist_role           text,
  artist_lifespan       text,
  artist_bio            text,
  artist_wikipedia_url  text,
  blurb_lead            text,
  blurb_tracks          text[]  not null default '{}',
  blurb_tail            text    default '.',
  -- The calendar day this song was served as "song of the day".
  -- NULL = never played yet.
  played_on             date,
  -- Lena's feedback: 'more' / 'average' / 'no'. NULL = no answer yet.
  recommendation        text check (recommendation in ('more', 'average', 'no')),
  created_at            timestamptz not null default now()
);

-- 2) "One new song a day" picker ------------------------------------------
-- Returns today's song. If none has been assigned today, it atomically picks
-- a random UNPLAYED song, marks it played, and returns it. Returns no rows
-- once every song has been played. SECURITY DEFINER lets it set played_on
-- even though the public (anon) role can't write that column directly.
create or replace function public.todays_song()
returns setof public.songs
language plpgsql
security definer
set search_path = public
as $$
declare
  picked public.songs;
begin
  -- Already have a song for today?
  select * into picked from public.songs where played_on = current_date limit 1;
  if found then
    return next picked;
    return;
  end if;

  -- Otherwise grab a random unplayed song (locked so two visits can't race).
  select * into picked
    from public.songs
    where played_on is null
    order by random()
    limit 1
    for update skip locked;

  if not found then
    return;  -- everything has been played
  end if;

  update public.songs set played_on = current_date where id = picked.id;
  picked.played_on := current_date;
  return next picked;
end;
$$;

-- 3) Security --------------------------------------------------------------
alter table public.songs enable row level security;

-- Public visitors may READ songs and UPDATE only the `recommendation` column.
revoke all on public.songs from anon;
grant select on public.songs to anon;
grant update (recommendation) on public.songs to anon;
grant execute on function public.todays_song() to anon;

drop policy if exists songs_select_anon on public.songs;
create policy songs_select_anon on public.songs
  for select to anon using (true);

drop policy if exists songs_update_recommendation_anon on public.songs;
create policy songs_update_recommendation_anon on public.songs
  for update to anon using (true) with check (true);

-- Admin: any logged-in (authenticated) user may fully manage songs. Create
-- your admin account in Supabase -> Authentication -> Users -> Add user.
grant select, insert, update, delete on public.songs to authenticated;
grant execute on function public.todays_song() to authenticated;

drop policy if exists songs_admin_all on public.songs;
create policy songs_admin_all on public.songs
  for all to authenticated using (true) with check (true);

-- 4) Seed: the "Cat" album (only inserts if the table is empty) ------------
insert into public.songs (
  title, year, genre_line, youtube_id, youtube_playlist_id, spotify_url,
  artist_name, artist_role, artist_lifespan, artist_bio, artist_wikipedia_url,
  blurb_lead, blurb_tracks, blurb_tail
)
select
  'Cat', 1976, 'Hiroshi Suzuki — Japanese jazz-funk',
  '-OKeEuUQ6Hw', 'OLAK5uy_nauJCebu6gmc-QRbs71xDGpaGSLJltDLA',
  'https://open.spotify.com/intl-fr/track/3Cy7TTqMH2nWiwVXEesD45',
  'Hiroshi Suzuki', 'Trombonist', '1933–2020',
  'A Japanese jazz trombonist who moved to the U.S. at 38 to play with drummer Buddy Rich, settling in Las Vegas. In 1975 he returned home to Japan and, reunited with old bandmates, recorded five long, easygoing tracks over a two-day session at Nippon Columbia Studio in Tokyo.',
  'https://en.wikipedia.org/wiki/Hiroshi_Suzuki_(trombonist)',
  'Released in 1976, Cat went almost unnoticed at the time — but decades later it became one of the most sought-after Japanese jazz records around, beloved for its laid-back, jazz-funk grooves. Suzuki''s smooth trombone weaves through electric piano, saxophone and a warm rhythm section across five stretched-out cuts: ',
  array['Romance', 'Shrimp Dance', 'Walk Tall', 'Cat', 'Kuro To Shiro'],
  '.'
where not exists (select 1 from public.songs);

-- 5) More songs (each guarded by youtube_id, so re-running is safe) --------
insert into public.songs (
  title, year, genre_line, youtube_id, youtube_playlist_id, spotify_url,
  artist_name, artist_role, artist_lifespan, artist_bio, artist_wikipedia_url,
  blurb_lead, blurb_tracks, blurb_tail
)
select
  'Black Focus', 2016, 'Yussef Kamaal — London jazz-funk & broken beat',
  '4D8YPDdsxYU', null,
  'https://open.spotify.com/intl-fr/album/6pDAh84nyNU7x3xje9G03I',
  'Yussef Kamaal', 'London jazz duo', '2008–2017',
  'A short-lived but hugely influential London duo — drummer Yussef Dayes and keyboardist Kamaal Williams (Henry Wu). Steeped equally in the city''s jazz scene and in jungle, garage and grime, they recorded just one album together before splitting in 2017.',
  'https://en.wikipedia.org/wiki/Yussef_Kamaal',
  'Released in 2016 on Brownswood Recordings, Black Focus became a landmark of London''s new jazz wave — spiritual jazz-funk and broken beat shot through with the pulse of jungle, garage and grime. Across ten tracks, Yussef Dayes'' restless drums lock into Kamaal Williams'' hazy Rhodes on standout cuts like ',
  array['Black Focus', 'Strings of Light', 'Remembrance', 'Lowrider', 'Joint 17'],
  '.'
where not exists (select 1 from public.songs where youtube_id = '4D8YPDdsxYU');

insert into public.songs (
  title, year, genre_line, youtube_id, youtube_playlist_id, spotify_url,
  artist_name, artist_role, artist_lifespan, artist_bio, artist_wikipedia_url,
  blurb_lead, blurb_tracks, blurb_tail
)
select
  'Amparo', 1970, 'Antônio Carlos Jobim — Brazilian bossa nova & jazz',
  'LxdcIokj1Xk', null,
  'https://open.spotify.com/intl-fr/track/3D4xY8ldSzNHDMP4Zynady',
  'Antônio Carlos Jobim', 'Composer & pianist', '1927–1994',
  'The Brazilian composer, pianist and songwriter who — with João Gilberto and others — created bossa nova and carried it to the world, writing standards like "The Girl from Ipanema". Born in Rio de Janeiro, his warm, unhurried harmony reshaped 20th-century popular song.',
  'https://en.wikipedia.org/wiki/Antonio_Carlos_Jobim',
  'A melancholy gem from Jobim''s 1970 album Stone Flower, arranged by Eumir Deodato and recorded at Rudy Van Gelder''s studio. Originally written for the film The Adventurers, "Amparo" drifts on Hubert Laws'' piercing flute and Jobim''s moody piano — unhurried, wistful and quietly gorgeous.',
  array[]::text[],
  ''
where not exists (select 1 from public.songs where youtube_id = 'LxdcIokj1Xk');

-- Herbie Hancock — "Hang Up Your Hang Ups". Inserted as today's song of the
-- day (played_on = current_date), so todays_song() serves it immediately.
insert into public.songs (
  title, year, genre_line, youtube_id, youtube_playlist_id, spotify_url,
  artist_name, artist_role, artist_lifespan, artist_bio, artist_wikipedia_url,
  blurb_lead, blurb_tracks, blurb_tail, played_on
)
select
  'Hang Up Your Hang Ups', 1975, 'Herbie Hancock — American jazz-funk',
  'd7kRlufrZJo', null,
  'https://open.spotify.com/intl-fr/track/22G8rQDLJTeJzjQWXZErre',
  'Herbie Hancock', 'Pianist & composer', 'b. 1940',
  'The American pianist, keyboardist and composer who reshaped jazz across six decades — from Miles Davis'' groundbreaking 1960s quintet to the platinum-selling funk of Head Hunters and the electro hit "Rockit". Born in Chicago, Hancock has blended jazz, funk and electronics like no one else.',
  'https://en.wikipedia.org/wiki/Herbie_Hancock',
  'The opening track from Herbie Hancock''s 1975 album Man-Child, "Hang Up Your Hang Ups" is a slice of tightly arranged jazz-funk built on Wah Wah Watson''s talking guitar and a punchy horn-driven groove. Endlessly sampled by hip-hop and dance producers, it remains one of Hancock''s most beloved funk workouts.',
  array[]::text[],
  '', current_date
where not exists (select 1 from public.songs where youtube_id = 'd7kRlufrZJo');

-- Make sure Hang Up Your Hang Ups is the ONLY song marked for today, so
-- todays_song() serves it unambiguously (clears any other song already
-- assigned to the current date).
update public.songs
set played_on = null
where played_on = current_date
  and youtube_id <> 'd7kRlufrZJo';

insert into public.songs (
  title, year, genre_line, youtube_id, youtube_playlist_id, spotify_url,
  artist_name, artist_role, artist_lifespan, artist_bio, artist_wikipedia_url,
  blurb_lead, blurb_tracks, blurb_tail
)
select
  'Structuralism', 2019, 'Alfa Mist — East London jazz & hip-hop',
  'wMxl405ZQvQ', null,
  'https://open.spotify.com/intl-fr/album/38XUFMsLLAttgWdD40CTaL',
  'Alfa Mist', 'Pianist & producer', 'Newham, East London',
  'A self-taught pianist, producer and composer from Newham, East London, who came up making grime and hip-hop before moving to the piano. A quietly central figure in the new UK jazz scene, his music folds jazz harmony into hip-hop''s haze and introspection.',
  'https://en.wikipedia.org/wiki/Alfa_Mist',
  'Released in 2019, Structuralism is Alfa Mist''s warm, brooding third album — self-produced, built on rolling Rhodes and live horns, and threaded with the introspection of the London scene he helped shape. Its eight tracks drift between jazz and hip-hop on standout cuts like ',
  array['.44', 'Falling', 'Mulago', 'Retainer', 'Door'],
  '.'
where not exists (select 1 from public.songs where youtube_id = 'wMxl405ZQvQ');

insert into public.songs (
  title, year, genre_line, youtube_id, youtube_playlist_id, spotify_url,
  artist_name, artist_role, artist_lifespan, artist_bio, artist_wikipedia_url,
  blurb_lead, blurb_tracks, blurb_tail
)
select
  'Kind of Blue', 1959, 'Miles Davis — American modal jazz',
  'vDqULFUg6CY', null,
  'https://open.spotify.com/intl-fr/track/0aWMVrwxPNYkKmFthzmpRi',
  'Miles Davis', 'Trumpeter & bandleader', '1926–1991',
  'The American trumpeter, bandleader and composer at the center of nearly every major shift in jazz — bebop, cool, modal and fusion — across four decades. Born in Illinois and raised in East St. Louis, Davis surrounded himself with era-defining players and kept reinventing the music around him.',
  'https://en.wikipedia.org/wiki/Miles_Davis',
  'Recorded in 1959 and still the best-selling jazz album ever made, Kind of Blue distilled modal jazz into something calm, spacious and endlessly listenable. With John Coltrane, Cannonball Adderley and Bill Evans alongside him, Davis stretched out across five unhurried classics: ',
  array['So What', 'Freddie Freeloader', 'Blue in Green', 'All Blues', 'Flamenco Sketches'],
  '.'
where not exists (select 1 from public.songs where youtube_id = 'vDqULFUg6CY');

insert into public.songs (
  title, year, genre_line, youtube_id, youtube_playlist_id, spotify_url,
  artist_name, artist_role, artist_lifespan, artist_bio, artist_wikipedia_url,
  blurb_lead, blurb_tracks, blurb_tail
)
select
  'The World Is Yours', 2018, 'Ashley Henry — UK jazz piano',
  'JHZNSWtm4gY', null,
  'https://open.spotify.com/intl-fr/track/0Vaot48F85IudjfqLHBSmZ',
  'Ashley Henry', 'Pianist & composer', 'South London',
  'A South London pianist and composer, one of the standout voices of the new British jazz generation. Classically trained yet steeped in hip-hop and soul, Henry moves easily between jazz tradition and the sounds he grew up on.',
  'https://ashleyhenry.bandcamp.com',
  'A luminous jazz-piano reworking of Nas'' 1994 hip-hop classic, recorded with The RE: Ensemble for Henry''s 2018 Easter EP. Rolling piano, warm horns and a patient groove turn the rap anthem into something spacious and hopeful.',
  array[]::text[],
  ''
where not exists (select 1 from public.songs where youtube_id = 'JHZNSWtm4gY');

insert into public.songs (
  title, year, genre_line, youtube_id, youtube_playlist_id, spotify_url,
  artist_name, artist_role, artist_lifespan, artist_bio, artist_wikipedia_url,
  blurb_lead, blurb_tracks, blurb_tail
)
select
  'Moanin''', 1960, 'Charles Mingus — American hard bop & gospel jazz',
  '__OSyznVDOY', null,
  'https://open.spotify.com/intl-fr/track/3rFzc8CLVDZ7OOtFa2jPYP',
  'Charles Mingus', 'Bassist & composer', '1922–1979',
  'The American bassist, composer and bandleader who fused hard bop, gospel, blues and free jazz into music of enormous force and feeling. Born in Arizona and raised in Watts, Los Angeles, Mingus was as celebrated for his volcanic temperament as for being one of jazz''s greatest composers.',
  'https://en.wikipedia.org/wiki/Charles_Mingus',
  'The barnstorming opener of Mingus'' 1960 album Blues & Roots, "Moanin''" rides Pepper Adams'' growling baritone sax into a raucous, gospel-drenched blues. It''s Mingus at his most joyous and physical — church music with the roof torn off.',
  array[]::text[],
  ''
where not exists (select 1 from public.songs where youtube_id = '__OSyznVDOY');

insert into public.songs (
  title, year, genre_line, youtube_id, youtube_playlist_id, spotify_url,
  artist_name, artist_role, artist_lifespan, artist_bio, artist_wikipedia_url,
  blurb_lead, blurb_tracks, blurb_tail
)
select
  'Turiya and Ramakrishna', 1970, 'Alice Coltrane — American spiritual jazz',
  'jOkBpSItuP8', null,
  'https://open.spotify.com/intl-fr/track/4DVu7YgHVJaeN0C7HNpy2q',
  'Alice Coltrane', 'Pianist, harpist & composer', '1937–2007',
  'The American pianist, harpist, organist and composer who became one of spiritual jazz''s guiding lights. Born Alice McLeod in Detroit and married to John Coltrane, she wove jazz together with Indian classical music and Hindu devotion, later leading an ashram as Swamini Turiyasangitananda.',
  'https://en.wikipedia.org/wiki/Alice_Coltrane',
  'A serene, blues-tinged meditation from Alice Coltrane''s 1970 album Ptah, the El Daoud, "Turiya and Ramakrishna" rides her rolling, gospel-inflected piano over a slow, prayerful groove. Named for a state of pure consciousness and a Hindu mystic, it''s spiritual jazz at its most intimate and calming.',
  array[]::text[],
  ''
where not exists (select 1 from public.songs where youtube_id = 'jOkBpSItuP8');
