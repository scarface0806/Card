interface PostBodyProps {
  /** Sanitized HTML with heading ids already injected. */
  html: string;
}

/**
 * The article body.
 *
 * `dangerouslySetInnerHTML` is safe here for one specific reason: this markup
 * has been through `sanitizePostHtml` on the way into the database, so the tag
 * and attribute set is one we chose, not one an author supplied. Nothing on
 * this path renders unsanitized content.
 */
export default function PostBody({ html }: PostBodyProps) {
  return (
    <div className="tv-prose tv-prose-article" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
