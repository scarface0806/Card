import sanitizeHtml from "sanitize-html";

/**
 * Server-side sanitiser for post bodies.
 *
 * Everything written in the admin editor passes through this on the way IN to
 * the database, so what is stored is already safe and the public page can
 * render it with dangerouslySetInnerHTML without trusting the editor, the
 * clipboard, or whatever a paste from Word dragged along with it.
 *
 * The allowed set is deliberately the exact tag list the editor can produce —
 * nothing wider. `id` and `class` are NOT allowed through: heading ids are
 * derived server-side in toc.ts so they can never be author-controlled, and
 * styling comes from `.tv-prose` rather than from inline markup.
 */
const YOUTUBE_HOSTS = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"];

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4",
    "strong", "b", "em", "i", "u", "s", "sub", "sup",
    "a",
    "ul", "ol", "li",
    "blockquote",
    "code", "pre",
    "img", "figure", "figcaption",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    iframe: ["src", "title", "width", "height", "allow", "allowfullscreen"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["https"],
    iframe: ["https"],
  },
  // A YouTube embed is the only third-party frame the editor offers, so it is
  // the only host a frame may point at.
  allowedIframeHostnames: YOUTUBE_HOSTS,
  allowIframeRelativeUrls: false,
  // Anything not on the list is dropped along with its text, rather than
  // having its text spliced into the surrounding paragraph.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  transformTags: {
    // Every outbound link gets rel="noopener noreferrer". Without it a
    // target="_blank" link hands the opened tab a handle on ours.
    a: (tagName, attribs) => {
      const href = attribs.href || "";
      const isExternal = /^https?:\/\//i.test(href);

      return {
        tagName,
        attribs: {
          ...attribs,
          ...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {}),
        },
      };
    },
    // Below-the-fold body images are always lazy — the cover image above the
    // fold is a separate next/image and is not part of this HTML.
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: "lazy" },
    }),
  },
};

export function sanitizePostHtml(dirty: string): string {
  return sanitizeHtml(dirty, options);
}

/**
 * Strip all markup down to readable text. Used for reading time, the excerpt
 * fallback and the meta-description fallback — never for rendering.
 */
export function htmlToPlainText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
