# Blog module

Public blog at `/blog`, managed from `/admin/blogs`. Built on the same Prisma
+ MongoDB data layer, the same admin auth, and the same Cloudinary upload route
as the rest of the panel.

---

## How to publish a blog post

1. **Sign in** at `/admin/login` with an `ADMIN` account, then open
   **Blogs** in the sidebar.
2. **New post** → the form opens on the **Content** tab.
3. **Content**
   - Type the **title**. The slug fills in automatically; edit it if you want a
     shorter URL. A green *Available* pill means the slug is free.
   - Write the **excerpt** (20–320 characters). It appears on the listing and
     becomes the meta description if you do not set one.
   - Write the body in the editor. Use **H2** for main sections and **H3** for
     subsections — the table of contents on the public post is built from them.
     There is no H1 button on purpose: the post title is the page's only H1.
   - Inserting an image asks for **alt text**. It is required.
4. **Media** → upload a **cover image** (drag and drop, or click) and fill in
   the **cover alt text**. Both are required before a post can be published.
   Landscape images around 1200×630 look best and double as the social card.
5. **SEO** → optional. Meta title and description have live counters (60 / 160);
   the Google preview beside them shows roughly how the result will read. Leave
   the canonical URL blank unless the article was first published elsewhere.
6. **Publish** → set the **author**, add comma-separated **tags** (each tag gets
   its own archive page at `/blog/tag/<tag>`), and optionally a category.
   - **Save** keeps it as a draft.
   - **Save & Publish** makes it live.
   - Setting a **future publish date** and publishing schedules the post: it
     stays hidden until that time passes.
   - **Preview as draft** opens the post exactly as it will look, at a
     token-protected URL that is never indexed.
7. The post appears at `/blog/<slug>` within a minute (pages revalidate every
   60 seconds).

### Changing a slug after publishing

Edit the slug and save. The old URL keeps working — it is recorded in
`post_slug_redirects` and redirects permanently to the new one, so no inbound
link or search result breaks.

### Deleting a post

Delete from the list row or the **Publish** tab. This removes the post, its
view history, its slug redirects, and every Cloudinary image it owned.

---

## Where the numbers come from

- **Views** — one per reader session per post. Counted by a fire-and-forget
  `POST /api/blog/<slug>/view` from the post page.
- **Unique views** — distinct sessions. A returning session adds a view but not
  a unique view.
- Known bot user agents are filtered, the endpoint is rate limited to 30
  requests per minute per IP, and repeat hits from one session inside 30
  seconds are treated as one page view.
- IPs and session ids are stored only as SHA-256 digests peppered with
  `JWT_SECRET`. No raw IP address is written anywhere.
- Public post pages **do not** show a view counter unless
  `NEXT_PUBLIC_BLOG_SHOW_VIEWS=true`. The admin list always shows it.

---

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | yes | Or `CLOUDINARY_URL` instead. Server-only. |
| `JWT_SECRET` | yes | Already required by admin auth. Also peppers view hashes and signs preview tokens. |
| `NEXT_PUBLIC_SITE_URL` | production | Canonicals, OG URLs, sitemap and RSS. |
| `NEXT_PUBLIC_BLOG_SHOW_VIEWS` | no | `true` shows view counts publicly. Default off. |

After pulling these changes, run `npx prisma generate`. The new collections
(`posts`, `post_views`, `post_slug_redirects`) are created by MongoDB on first
write; run `npx prisma db push` if you want the indexes created up front.

---

## Manual test checklist

Run before deploying. `[ ]` each one.

### Admin — access control
- [ ] Signed out, `/admin/blogs` redirects to `/admin/login`.
- [ ] Signed in as a `CUSTOMER`, `/admin/blogs` redirects to `/unauthorized`.
- [ ] Signed out, `GET /api/admin/blogs` returns 401 (not a post list).
- [ ] Signed out, `DELETE /api/admin/blogs/<id>` returns 401.

### Admin — create and edit
- [ ] Typing a title fills the slug; editing the slug by hand stops it being
      overwritten by further title edits.
- [ ] A slug already in use shows the red *Already in use* pill.
- [ ] Saving with an empty body is refused with a readable message.
- [ ] **Save & Publish** without a cover image is refused.
- [ ] **Save & Publish** with a cover image but blank alt text is refused.
- [ ] After a first save, the URL becomes `/admin/blogs/<id>/edit` and a second
      save updates that same post rather than creating a duplicate.
- [ ] Editor: H2, H3, bold, italic, underline, bullet list, numbered list,
      blockquote, inline code, link, image, YouTube embed all work.
- [ ] Inserting an image and cancelling the alt-text prompt does **not** insert
      it, and shows a message saying alt text is required.

### Admin — list and analytics
- [ ] Search by title and by slug both narrow the list.
- [ ] Status filter, tag filter and the three sort orders all work.
- [ ] Pagination appears past 10 posts and the page buttons change the rows.
- [ ] Stat cards, top-posts list and the 30-day chart render (zero state
      included, with no posts and no views).
- [ ] Delete asks for confirmation, and the post is gone from the list and from
      `/blog` afterwards.
- [ ] After deleting, the post's images are gone from the Cloudinary
      `admin/blog` folder.

### Public — content
- [ ] `/blog` lists only published posts, newest first, with the newest one
      featured.
- [ ] A draft is **not** on `/blog` and `/blog/<draft-slug>` returns 404.
- [ ] A post with a future publish date does not appear until that time.
- [ ] `/blog/<slug>` shows breadcrumb, one H1, cover image, author, date and
      reading time.
- [ ] Table of contents lists every H2/H3, and clicking an entry scrolls to
      that heading clear of the sticky navbar.
- [ ] Body typography (headings, lists, quotes, code, images, embeds) matches
      the rest of the site.
- [ ] Share buttons open WhatsApp, LinkedIn and X with the right URL; **copy
      link** copies it.
- [ ] Prev/next and up to three related posts appear and link correctly.
- [ ] Tag chips go to `/blog/tag/<tag>`; that page lists only that tag.
- [ ] `/blog/tag/<nonexistent>` returns 404.
- [ ] Pagination: `/blog/page/2` works past 9 posts; `/blog/page/1` and
      `/blog/page/999` return 404.
- [ ] **Blog** appears in the footer Support column and links to `/blog`.
- [ ] Nothing was added to the header nav.

### SEO
- [ ] View source on a post: exactly one `<h1>`, a `<link rel="canonical">`,
      `og:title` / `og:description` / `og:image`, and `twitter:card`.
- [ ] JSON-LD on a post validates as `BlogPosting` + `BreadcrumbList`
      (search.google.com/test/rich-results).
- [ ] JSON-LD on `/blog` validates as `Blog`.
- [ ] A post with **noindex** ticked emits `<meta name="robots" content="noindex">`.
- [ ] `/sitemap.xml` contains `/blog`, every published post with its own
      `lastmod`, every tag page, and still contains all 11 original static
      routes.
- [ ] `/robots.txt` allows `/blog` and disallows `/admin` and `/api/`.
- [ ] `/blog/rss.xml` is valid RSS and lists the published posts.
- [ ] Change a published post's slug, then load the **old** URL — it redirects
      permanently to the new one.
- [ ] Every image on a post has non-empty `alt`.

### View tracking
- [ ] Open a post: its view count in admin goes up by exactly 1.
- [ ] Reload the same tab: the count does **not** go up again.
- [ ] In dev with React strict mode: still exactly 1, not 2.
- [ ] Open the post in a new private window: the count goes up by 1 and unique
      views also goes up by 1.
- [ ] With `NEXT_PUBLIC_BLOG_SHOW_VIEWS` unset, no view counter is visible on
      the public post.
- [ ] Blocking `/api/blog/*` in devtools does not break the page in any way.

### Build
- [ ] `npm run build` completes with no errors.
- [ ] `npx tsc --noEmit` is clean.
- [ ] `npm run lint` reports no new errors.
