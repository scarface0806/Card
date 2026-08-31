import { slugify } from "@/lib/blog/slug";

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

const HEADING_PATTERN = /<(h2|h3)\b([^>]*)>([\s\S]*?)<\/\1>/gi;

function textOf(inner: string): string {
  return inner
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Give every H2/H3 in a post body a stable anchor id and return the list, so
 * the table of contents and the headings it points at are generated from one
 * pass over the same markup and cannot fall out of step.
 *
 * Runs on ALREADY-SANITIZED html (sanitize.ts strips author `id` attributes),
 * so every id here is one we derived — never one an author supplied.
 */
export function buildToc(html: string): { html: string; headings: TocHeading[] } {
  const headings: TocHeading[] = [];
  const used = new Map<string, number>();

  const withIds = html.replace(
    HEADING_PATTERN,
    (match, tag: string, attrs: string, inner: string) => {
      const text = textOf(inner);
      if (!text) return match;

      const base = slugify(text) || "section";
      const seen = used.get(base) ?? 0;
      used.set(base, seen + 1);
      const id = seen === 0 ? base : `${base}-${seen + 1}`;

      const level = tag.toLowerCase() === "h2" ? 2 : 3;
      headings.push({ id, text, level });

      return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
    }
  );

  return { html: withIds, headings };
}
