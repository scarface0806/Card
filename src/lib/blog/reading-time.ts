import { htmlToPlainText } from "@/lib/blog/sanitize";

/** Words per minute for adult non-technical prose. */
const WORDS_PER_MINUTE = 200;

/**
 * Reading time in whole minutes, computed from the post body.
 *
 * Always derived server-side on write so the number in the database matches
 * the content it describes — a client-supplied value could not be trusted to.
 */
export function readingTimeMinutes(html: string): number {
  const words = htmlToPlainText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
