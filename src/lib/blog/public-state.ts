/**
 * What the PUBLIC sees for a post, in the admin's words: Draft, Scheduled or
 * Live. Client-safe (no imports), shared by the editor and the posts list so
 * the two can never disagree.
 *
 * The rule mirrors publicWhere() in src/lib/blog/queries.ts, which stays the
 * single source of truth on the server: a post is public only when it is
 * PUBLISHED and its publishedAt is set and not in the future. The admin list
 * used to label every PUBLISHED post "Published", so a post scheduled for
 * later - which 404s until then - looked live.
 *
 * Publish dates are entered and shown in IST (Asia/Kolkata, UTC+05:30, no
 * daylight saving), whatever timezone the admin's browser is in.
 */

export type PostPublicState = 'draft' | 'scheduled' | 'live';

export function postPublicState(
  status: string,
  publishedAt: string | Date | null | undefined,
  now: Date = new Date()
): PostPublicState {
  if (status !== 'PUBLISHED' || !publishedAt) return 'draft';
  const at = publishedAt instanceof Date ? publishedAt : new Date(publishedAt);
  if (Number.isNaN(at.getTime())) return 'draft';
  return at.getTime() <= now.getTime() ? 'live' : 'scheduled';
}

const IST_OFFSET_MS = 330 * 60_000;

/** ISO -> "YYYY-MM-DDTHH:mm" in IST, for a datetime-local input. */
export function toIstInput(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);
}

/**
 * "YYYY-MM-DDTHH:mm" read as IST -> ISO string, or null when empty/invalid.
 * Seconds are dropped, so a value loaded with toIstInput and saved untouched
 * comes back at or before the original - never later, so it cannot quietly
 * push a live post into the future.
 */
export function fromIstInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const IST_FORMAT = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** "20 Nov 2026, 6:23 pm IST" */
export function formatIst(iso: string | Date): string {
  const date = iso instanceof Date ? iso : new Date(iso);
  return `${IST_FORMAT.format(date)} IST`;
}
