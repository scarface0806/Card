/**
 * Video card links - the three slots that sit under the gallery.
 *
 * The gallery stores uploaded files in its own `galleries` collection because
 * each slot owns an image on disk. A video slot owns nothing: it is a pasted
 * URL. So these live as an embedded list on the customer document, which keeps
 * the update path to a single `$set` and means a customer delete takes the
 * links with it without a cascade.
 *
 * Only the id is stored-as-typed; the thumbnail is derived from it at render
 * time off YouTube's own image host, so nothing has to be uploaded or kept in
 * sync when a video is swapped.
 */

export const VIDEO_LINK_SLOTS = 3;

export type VideoLink = {
  slot: number;
  url: string;
  title?: string | null;
};

/**
 * Pulls the 11-character video id out of every YouTube URL shape we are likely
 * to be handed: a desktop watch link, a youtu.be share link, an embed src
 * copied out of an iframe, a Shorts or /live permalink, or the bare id itself.
 * Anything else returns null and the slot falls back to a plain link card.
 */
export function extractYouTubeId(url?: string | null) {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  const segments = parsed.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    return isVideoId(segments[0]) ? segments[0] : null;
  }

  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtube-nocookie.com') {
    return null;
  }

  const queryId = parsed.searchParams.get('v');
  if (isVideoId(queryId)) return queryId;

  // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
  if (['embed', 'shorts', 'live', 'v'].includes(segments[0]) && isVideoId(segments[1])) {
    return segments[1];
  }

  return null;
}

function isVideoId(value?: string | null): value is string {
  return typeof value === 'string' && /^[\w-]{11}$/.test(value);
}

/**
 * hqdefault is the one thumbnail size YouTube generates for every video -
 * maxresdefault 404s on anything that was not uploaded in HD, which would show
 * a broken image on exactly the older videos most likely to be linked here.
 */
export function youTubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function youTubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Reads the `videoUrl1..3` / `videoTitle1..3` pairs the admin forms post. */
export function parseVideoLinksFromFormData(formData: FormData): VideoLink[] {
  const links: VideoLink[] = [];

  for (let slot = 1; slot <= VIDEO_LINK_SLOTS; slot += 1) {
    const url = String(formData.get(`videoUrl${slot}`) || '').trim();
    if (!url) continue;

    const title = String(formData.get(`videoTitle${slot}`) || '').trim();
    links.push({ slot, url, title: title || null });
  }

  return links;
}

/**
 * Accepts whatever the database or a JSON body hands back - an older customer
 * document has no `videoLinks` field at all - and returns a clean, slot-ordered
 * list with the empty slots dropped.
 */
export function normalizeVideoLinks(value: unknown): VideoLink[] {
  if (!Array.isArray(value)) return [];

  const links: VideoLink[] = [];

  value.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;

    const record = item as { slot?: unknown; url?: unknown; title?: unknown };
    const url = typeof record.url === 'string' ? record.url.trim() : '';
    if (!url) return;

    const slot =
      typeof record.slot === 'number' && record.slot >= 1 && record.slot <= VIDEO_LINK_SLOTS
        ? record.slot
        : index + 1;
    const title = typeof record.title === 'string' ? record.title.trim() : '';

    links.push({ slot, url, title: title || null });
  });

  return links.sort((a, b) => a.slot - b.slot).slice(0, VIDEO_LINK_SLOTS);
}
