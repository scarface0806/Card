'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, CheckCircle2, ExternalLink, Loader2, Trash2, X } from 'lucide-react';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/blog/RichTextEditor';
import SerpPreview, { DESCRIPTION_LIMIT, TITLE_LIMIT } from '@/components/admin/blog/SerpPreview';
import { slugify } from '@/lib/blog/slug';
import { SITE_URL } from '@/lib/site';
import { BLOG_UPLOAD_FOLDER } from '@/lib/blog/upload-client';
import type { PostDetail, PostImageData } from '@/lib/blog/types';
import { formatIst, fromIstInput, postPublicState, toIstInput } from '@/lib/blog/public-state';

type TabKey = 'content' | 'media' | 'seo' | 'publish';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'content', label: 'Content' },
  { key: 'media', label: 'Media' },
  { key: 'seo', label: 'SEO' },
  { key: 'publish', label: 'Publish' },
];

const EXCERPT_LIMIT = 320;
const COVER_ALT_LIMIT = 200;

/** "tapvyo.in" - the canonical origin without its scheme, for the slug preview. */
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');

interface BlogFormProps {
  /** Absent on create, present on edit. */
  postId?: string;
  initial?: PostDetail;
  initialPreviewToken?: string;
}

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: PostImageData | null;
  galleryImages: PostImageData[];
  tags: string;
  category: string;
  authorName: string;
  authorAvatar: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  noindex: boolean;
};

type SlugState = { checking: boolean; available: boolean | null; reason: string | null };

/** A failed client-side check: what to say, and where the field lives. */
type ValidationIssue = { message: string; tab: TabKey; fieldId: string };

/**
 * The banner at the top of the form. A save problem used to be a toast in a
 * corner that was easy to miss, so a "Save & Publish" that failed validation
 * left the post a draft without the admin noticing.
 */
type Banner =
  | { tone: 'danger'; message: string }
  | { tone: 'patina' | 'brass'; message: string; href?: string };

/** What was last SAVED - drives the header badge and the slug warning. */
type SavedState = { status: string; publishedAt: string | null; slug: string };

export default function BlogForm({ postId, initial, initialPreviewToken }: BlogFormProps) {
  const router = useRouter();
  const isEdit = Boolean(postId);

  const [tab, setTab] = useState<TabKey>('content');
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [slugState, setSlugState] = useState<SlugState>({ checking: false, available: null, reason: null });
  const [previewToken, setPreviewToken] = useState(initialPreviewToken ?? '');
  const [banner, setBanner] = useState<Banner | null>(null);
  const [saved, setSaved] = useState<SavedState>(() => ({
    status: initial?.status ?? 'DRAFT',
    publishedAt: initial?.publishedAt ?? null,
    slug: initial?.slug ?? '',
  }));

  // Field to focus once its tab has rendered. A ref, so setting it never
  // causes a render of its own; the banner/tab state change that accompanies
  // it does, and the effect below runs after that render commits.
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    const element = document.getElementById(id);
    element?.scrollIntoView({ block: 'center' });
    element?.focus({ preventScroll: true });
  });

  // "Now" for the Draft / Scheduled / Live labels, refreshed so a scheduled
  // post flips to Live on screen when its time comes (no Date.now() in render).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const savedPublic = isEdit ? postPublicState(saved.status, saved.publishedAt, new Date(now)) : 'draft';
  // The date that WILL be saved, as typed (IST).
  const typedPublishIso = fromIstInput(form.publishedAt);
  const typedIsFuture = typedPublishIso !== null && new Date(typedPublishIso).getTime() > now;
  // Changing a saved slug records a redirect from the old one (recordSlugChange
  // on the PATCH route); only worth saying when the old URL is actually live.
  const liveSlugChanged = savedPublic === 'live' && Boolean(saved.slug) && form.slug.trim() !== saved.slug;

  // Once the admin edits the slug by hand, the title stops driving it — an
  // auto-rewrite at that point would silently discard a deliberate choice.
  const slugTouched = useRef(Boolean(initial?.slug));

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const handleTitleChange = (value: string) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugTouched.current ? current.slug : slugify(value),
    }));
  };

  // Debounced availability check. Purely advisory: the save path re-checks and
  // the unique index is what actually decides.
  useEffect(() => {
    const slug = form.slug.trim();
    if (!slug) {
      setSlugState({ checking: false, available: null, reason: null });
      return;
    }

    setSlugState((current) => ({ ...current, checking: true }));
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ slug, ...(postId ? { excludeId: postId } : {}) });
        const response = await fetch(`/api/admin/blogs/slug-check?${params}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        const payload = await response.json();
        if (controller.signal.aborted) return;
        setSlugState({ checking: false, available: Boolean(payload.available), reason: payload.reason ?? null });
      } catch {
        if (!controller.signal.aborted) setSlugState({ checking: false, available: null, reason: null });
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [form.slug, postId]);

  const registerInlineImage = useCallback((image: PostImageData) => {
    setForm((current) => ({ ...current, galleryImages: [...current.galleryImages, image] }));
  }, []);

  /**
   * ImageUpload calls onUploadComplete from an effect that lists it as a
   * dependency, so it must be referentially stable AND leave state untouched
   * when nothing changed - same rule as ProductForm.tsx. The old inline arrow
   * was a new function every render and always built a new coverImage, so
   * the effect re-ran forever and fought the alt-text input. The functional
   * updater also keeps the alt the admin is typing instead of a stale copy.
   */
  const handleCoverUpload = useCallback(
    (url: string, publicId: string, meta?: { width: number | null; height: number | null }) => {
      setForm((current) => {
        const previous = current.coverImage;
        if (previous && previous.url === url && previous.publicId === publicId) return current;
        return {
          ...current,
          coverImage: {
            url,
            publicId,
            alt: previous?.alt ?? '',
            width: meta?.width ?? 1200,
            height: meta?.height ?? 630,
          },
        };
      });
    },
    []
  );

  const handleCoverRemove = useCallback(() => set('coverImage', null), [set]);

  // Display only: a cover with no alt text is flagged before the save-time
  // validation refuses to publish it.
  const coverAltMissing = Boolean(form.coverImage) && !form.coverImage?.alt.trim();

  const previewHref = useMemo(
    () => (postId && previewToken ? `/blog/preview/${postId}?token=${previewToken}` : null),
    [postId, previewToken]
  );

  async function save(publish: boolean) {
    const nextStatus = publish ? 'PUBLISHED' : form.status;

    // A failed check is shown as a banner AND takes the admin to the field:
    // switch to its tab and focus it, so nothing stays a draft unnoticed.
    const issue = validate(form, nextStatus);
    if (issue) {
      setToast(null);
      setBanner({
        tone: 'danger',
        message: publish ? `Not published: ${issue.message}` : issue.message,
      });
      setTab(issue.tab);
      pendingFocus.current = issue.fieldId;
      return;
    }

    setSaving(true);
    setToast(null);
    setBanner(null);

    try {
      const response = await fetch(isEdit ? `/api/admin/blogs/${postId}` : '/api/admin/blogs', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(toPayload(form, nextStatus)),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to save post');

      if (payload.previewToken) setPreviewToken(payload.previewToken);

      // Say what the PUBLIC will now see, from what the server saved (its
      // slug can differ from the typed one after a collision, and an empty
      // date was stamped server-side).
      const savedPost = payload.post as { slug?: string; status?: string; publishedAt?: string | null } | undefined;
      const savedState = savedPost?.slug
        ? postPublicState(savedPost.status ?? nextStatus, savedPost.publishedAt ?? null)
        : null;
      if (publish && savedPost?.slug && savedState === 'live') {
        setBanner({ tone: 'patina', message: 'Post published. It is live at', href: `/blog/${savedPost.slug}` });
      } else if (savedPost?.slug && savedState === 'scheduled' && savedPost.publishedAt) {
        setBanner({
          tone: 'brass',
          message: `Saved and scheduled for ${formatIst(savedPost.publishedAt)}. /blog/${savedPost.slug} will 404 until then.`,
        });
      } else {
        setToast({
          variant: 'success',
          message: publish ? 'Post published' : isEdit ? 'Post saved' : 'Draft created',
        });
      }

      if (!isEdit && payload.post?.id) {
        // Keep writing in the editor, but with the posts list behind it.
        //
        // Replacing the create page straight with the editor left the browser's
        // Back arrow dead whenever /admin/blogs/new was the tab's first entry —
        // a refresh part-way through writing, a bookmark, or the sign-in
        // redirect all produce that. The list hands over to the editor instead
        // (see app/admin/blogs/page.tsx), so Back always has somewhere real to
        // land. It has to be two separate router commits: replaceState alone
        // keeps the create page's tree, which then renders an empty new-post
        // form under the list's URL.
        //
        // The create page is deliberately left out of the history stack — a
        // second save from a restored form would write a duplicate post rather
        // than update the one just created.
        router.replace(`/admin/blogs?created=${payload.post.id}`);
        return;
      }

      // The saved slug can differ from the typed one if it collided.
      if (payload.post?.slug) {
        setForm((current) => ({
          ...current,
          slug: payload.post.slug,
          status: nextStatus,
          // Show the date the server actually stored (it stamps "now" when
          // publishing with the field empty).
          publishedAt: toIstInput(payload.post.publishedAt ?? null),
        }));
        setSaved({
          status: payload.post.status ?? nextStatus,
          publishedAt: payload.post.publishedAt ?? null,
          slug: payload.post.slug,
        });
      }
      router.refresh();
    } catch (error) {
      // Same banner as a validation problem: a failed save must be obvious.
      setBanner({ tone: 'danger', message: error instanceof Error ? error.message : 'Failed to save post' });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!postId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/blogs/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to delete post');

      router.push('/admin/blogs');
      router.refresh();
    } catch (error) {
      setToast({ variant: 'error', message: error instanceof Error ? error.message : 'Failed to delete post' });
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="tv-adm-page-title">{isEdit ? 'Edit post' : 'New post'}</h1>
            {/* What the public sees right now, from the last SAVE. */}
            {savedPublic === 'live' ? (
              <span className="tv-adm-badge tv-adm-badge--patina">Live</span>
            ) : savedPublic === 'scheduled' && saved.publishedAt ? (
              <span className="tv-adm-badge tv-adm-badge--brass">Scheduled · {formatIst(saved.publishedAt)}</span>
            ) : (
              <span className="tv-adm-badge tv-adm-badge--neutral">Draft</span>
            )}
          </div>
          <p className="tv-adm-page-sub mt-1">
            {isEdit ? 'Update the post, its media and how it appears in search.' : 'Write the post, then save it as a draft or publish it.'}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
          <Link href="/admin/blogs" className="tv-btn tv-btn-secondary !min-h-[42px] !text-sm">
            Back to posts
          </Link>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving}
            className="tv-btn tv-btn-secondary !min-h-[42px] !text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="tv-btn tv-btn-gilded !min-h-[42px] !text-sm disabled:opacity-60"
          >
            Save &amp; Publish
          </button>
        </div>
      </div>

      {/* A future publish date holds the post back: say so next to Publish. */}
      {typedIsFuture && typedPublishIso ? (
        <div className="tv-adm-alert tv-adm-alert--brass" role="status">
          <AlertTriangle className="tv-adm-alert-icon mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">
            This post is scheduled and will 404 until {formatIst(typedPublishIso)}.{' '}
            <button
              type="button"
              onClick={() => set('publishedAt', toIstInput(new Date()))}
              className="tv-adm-action tv-adm-action--brass min-h-[44px]"
            >
              Publish now
            </button>
          </p>
        </div>
      ) : null}

      {banner ? (
        <div
          className={`tv-adm-alert tv-adm-alert--${banner.tone}`}
          role={banner.tone === 'danger' ? 'alert' : 'status'}
        >
          {banner.tone === 'danger' ? (
            <AlertTriangle className="tv-adm-alert-icon mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="tv-adm-alert-icon mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <p className="min-w-0 flex-1 break-words">
            {banner.message}
            {'href' in banner && banner.href ? (
              <>
                {' '}
                <a
                  href={banner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tv-mono normal-case underline underline-offset-2"
                >
                  {SITE_HOST}
                  {banner.href}
                </a>
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => setBanner(null)}
            aria-label="Dismiss"
            className="tv-adm-action tv-adm-action--icon min-h-[44px] min-w-[44px] shrink-0"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {toast && <AdminToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}

      <div className="tv-adm-tabs" role="tablist" aria-label="Post sections">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={tab === entry.key}
            onClick={() => setTab(entry.key)}
            className="tv-adm-tab"
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="space-y-5">
          <div className="tv-adm-panel tv-adm-panel-pad space-y-5">
            <Field label="Title" required>
              <input
                id="post-title"
                className="tv-adm-input min-h-[44px]"
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="How NFC business cards actually work"
                maxLength={160}
              />
            </Field>

            <Field label="Slug" required hint="Lowercase words separated by hyphens. Changing it on a live post keeps the old URL working with a redirect.">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="tv-adm-input min-h-[44px] min-w-0 flex-1"
                  value={form.slug}
                  onChange={(event) => {
                    slugTouched.current = true;
                    set('slug', event.target.value.toLowerCase());
                  }}
                  placeholder="how-nfc-business-cards-work"
                />
                <SlugStatus state={slugState} />
              </div>
              {/* The post's public URL, under the input it is built from. normal-case
                  because tv-mono uppercases and a slug is always lowercase;
                  break-all so a long slug wraps instead of scrolling at 375px. */}
              <p className="tv-adm-meta mt-1.5 text-xs">
                <span className="tv-mono normal-case break-all">
                  {SITE_HOST}/blog/{form.slug || 'your-post-slug'}
                </span>
              </p>
              {/* Display only. The PATCH route records the redirect when the
                  slug actually changes on save (recordSlugChange). */}
              {liveSlugChanged ? (
                <p className="mt-1.5 text-xs text-[var(--tv-brass)]">
                  This post is live. The old URL <span className="tv-mono normal-case break-all">/blog/{saved.slug}</span>{' '}
                  will redirect here once you save.
                </p>
              ) : null}
            </Field>

            <Field label="Excerpt" required hint="Shown on the blog listing and used as the meta description fallback.">
              <textarea
                id="post-excerpt"
                className="tv-adm-textarea"
                value={form.excerpt}
                onChange={(event) => set('excerpt', event.target.value)}
                maxLength={EXCERPT_LIMIT}
                rows={3}
              />
              <Counter value={form.excerpt.length} limit={EXCERPT_LIMIT} />
            </Field>
          </div>

          {/* tabIndex -1: a validation failure can focus the section. */}
          <div id="post-content" tabIndex={-1} className="tv-adm-panel tv-adm-panel-pad space-y-3 outline-none">
            <p className="tv-adm-field-label">Content</p>
            <RichTextEditor
              value={form.content}
              onChange={(html) => set('content', html)}
              onError={(message) => setToast({ variant: 'error', message })}
              onImageUploaded={registerInlineImage}
            />
          </div>
        </div>
      )}

      {tab === 'media' && (
        <div className="space-y-5">
          {/* Uploader ~60% / alt text ~40% side by side on lg+, stacked below. */}
          <div className="tv-adm-panel tv-adm-panel-pad grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
            <div id="post-cover" tabIndex={-1} className="min-w-0 outline-none">
              <ImageUpload
                folder={BLOG_UPLOAD_FOLDER}
                label="Cover image"
                aspectRatio="landscape"
                currentImageUrl={form.coverImage?.url}
                alt={form.coverImage?.alt}
                onUploadComplete={handleCoverUpload}
                onRemove={handleCoverRemove}
              />
            </div>

            <div className="min-w-0">
              <Field
                label="Cover alt text"
                required
                hint={
                  form.coverImage
                    ? 'Describes the image for screen readers and search engines. A post cannot be published without it.'
                    : 'Upload a cover image first'
                }
              >
                <input
                  id="post-cover-alt"
                  className={`tv-adm-input min-h-[44px] disabled:cursor-not-allowed disabled:opacity-60 ${
                    coverAltMissing ? 'border-[var(--tv-brass)]' : ''
                  }`}
                  value={form.coverImage?.alt ?? ''}
                  onChange={(event) =>
                    set('coverImage', form.coverImage ? { ...form.coverImage, alt: event.target.value } : null)
                  }
                  disabled={!form.coverImage}
                  aria-invalid={coverAltMissing || undefined}
                  placeholder={form.coverImage ? 'A metal NFC business card held above a phone' : ''}
                  maxLength={COVER_ALT_LIMIT}
                />
                {coverAltMissing ? (
                  <p className="mt-1.5 text-xs text-[var(--tv-brass)]">Required before publishing</p>
                ) : null}
                <Counter value={(form.coverImage?.alt ?? '').length} limit={COVER_ALT_LIMIT} />
              </Field>
            </div>
          </div>

          <div className="tv-adm-panel">
            <div className="tv-adm-panel-head">
              <h3 className="tv-adm-panel-title">Inline images</h3>
              <span className="tv-adm-count">{form.galleryImages.length} tracked</span>
            </div>
            <div className="tv-adm-panel-pad">
              <p className="tv-adm-meta text-xs">
                Images inserted from the editor are recorded here with their Cloudinary id, so deleting the
                post also deletes them. Removing an image from the body drops it on the next save.
              </p>
              {form.galleryImages.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {form.galleryImages.map((image) => (
                    <li key={image.publicId} className="flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt="" className="h-12 w-16 shrink-0 rounded border border-[var(--tv-rule)] object-cover" />
                      <span
                        className="min-w-0 flex-1 truncate text-xs text-[var(--tv-text-muted)]"
                        title={image.alt || image.publicId}
                      >
                        {image.alt || image.publicId}
                      </span>
                      {!image.alt ? (
                        <span className="tv-adm-badge tv-adm-badge--brass shrink-0">alt missing</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'seo' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="tv-adm-panel tv-adm-panel-pad space-y-5">
            <Field label="Meta title" hint="Falls back to the post title.">
              <input
                className="tv-adm-input min-h-[44px]"
                value={form.metaTitle}
                onChange={(event) => set('metaTitle', event.target.value)}
                maxLength={70}
                placeholder={form.title}
              />
              <Counter value={form.metaTitle.length} limit={TITLE_LIMIT} />
            </Field>

            <Field label="Meta description" hint="Falls back to the excerpt.">
              <textarea
                className="tv-adm-textarea"
                value={form.metaDescription}
                onChange={(event) => set('metaDescription', event.target.value)}
                maxLength={200}
                rows={3}
                placeholder={form.excerpt}
              />
              <Counter value={form.metaDescription.length} limit={DESCRIPTION_LIMIT} />
            </Field>

            <Field label="Canonical URL" hint="Leave empty. The canonical is always this post's own URL; any other value is rejected on save.">
              <input
                className="tv-adm-input min-h-[44px]"
                value={form.canonicalUrl}
                onChange={(event) => set('canonicalUrl', event.target.value)}
                placeholder="Leave empty"
                inputMode="url"
              />
            </Field>

            <Field label="Social share image" hint="Overrides the cover image on social cards. 1200x630 works best.">
              <input
                className="tv-adm-input min-h-[44px]"
                value={form.ogImage}
                onChange={(event) => set('ogImage', event.target.value)}
                placeholder="https://res.cloudinary.com/…"
                inputMode="url"
              />
            </Field>

            <label className="tv-check">
              <input
                type="checkbox"
                checked={form.noindex}
                onChange={(event) => set('noindex', event.target.checked)}
              />
              <span className="text-sm text-[var(--tv-text)]">
                Hide from search engines (noindex)
              </span>
            </label>
          </div>

          <SerpPreview
            title={form.metaTitle || form.title}
            description={form.metaDescription || form.excerpt}
            slug={form.slug}
          />
        </div>
      )}

      {tab === 'publish' && (
        <div className="space-y-5">
          <div className="tv-adm-panel tv-adm-panel-pad space-y-5">
            <Field label="Status">
              <div className="flex gap-2">
                {(['DRAFT', 'PUBLISHED'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => set('status', option)}
                    aria-pressed={form.status === option}
                    className="tv-adm-page-btn !px-4"
                  >
                    {option === 'DRAFT' ? 'Draft' : 'Published'}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label="Publish date (IST)"
              hint="Leave blank to publish immediately. A future date holds the post back until then. Always India time, whatever this computer's timezone."
            >
              <input
                id="post-published-at"
                type="datetime-local"
                className="tv-adm-input min-h-[44px]"
                value={form.publishedAt}
                onChange={(event) => set('publishedAt', event.target.value)}
              />
              {typedIsFuture && typedPublishIso ? (
                <p className="mt-1.5 text-xs text-[var(--tv-brass)]">
                  Scheduled: /blog/{form.slug || 'your-post-slug'} will 404 until {formatIst(typedPublishIso)}.{' '}
                  <button
                    type="button"
                    onClick={() => set('publishedAt', toIstInput(new Date()))}
                    className="tv-adm-action tv-adm-action--brass min-h-[44px]"
                  >
                    Publish now
                  </button>
                </p>
              ) : null}
            </Field>

            <Field label="Author" required>
              <input
                id="post-author"
                className="tv-adm-input min-h-[44px]"
                value={form.authorName}
                onChange={(event) => set('authorName', event.target.value)}
                maxLength={80}
              />
            </Field>

            <Field label="Tags" hint="Comma separated. Each tag gets its own archive page.">
              <input
                className="tv-adm-input min-h-[44px]"
                value={form.tags}
                onChange={(event) => set('tags', event.target.value)}
                placeholder="nfc, business cards, networking"
              />
            </Field>

            <Field label="Category">
              <input
                className="tv-adm-input min-h-[44px]"
                value={form.category}
                onChange={(event) => set('category', event.target.value)}
                maxLength={60}
              />
            </Field>

            {previewHref && (
              <a href={previewHref} target="_blank" rel="noopener noreferrer" className="tv-adm-action tv-adm-action--patina w-fit">
                <ExternalLink className="h-3.5 w-3.5" />
                Preview as draft
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>

          {isEdit && (
            <div className="tv-adm-panel tv-adm-panel-pad">
              <p className="tv-adm-field-label">Danger zone</p>
              <p className="tv-adm-meta mt-1 text-xs">
                Deleting removes the post, its view history and every Cloudinary image it owns.
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="tv-adm-action tv-adm-action--danger mt-3"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete post
              </button>
            </div>
          )}
        </div>
      )}

      <AdminConfirmPanel
        open={confirmDelete}
        tone="danger"
        title="Delete this post?"
        description="The post, its view history and its Cloudinary images are removed permanently. This cannot be undone."
        confirmText="Delete post"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="tv-adm-field-label">
        {label}
        {required && <span className="tv-label-req"> *</span>}
      </p>
      {children}
      {hint && <p className="tv-adm-meta mt-1.5 text-xs">{hint}</p>}
    </div>
  );
}

function Counter({ value, limit }: { value: number; limit: number }) {
  const over = value > limit;
  return (
    <p className={`mt-1.5 text-xs tabular-nums ${over ? 'text-[var(--tv-danger)]' : 'text-[var(--tv-text-muted)]'}`}>
      {value} / {limit}
      {over ? ' — likely to be truncated' : ''}
    </p>
  );
}

function SlugStatus({ state }: { state: SlugState }) {
  if (state.checking) {
    return (
      <span className="tv-adm-meta inline-flex shrink-0 items-center gap-1.5 self-start text-xs sm:self-auto">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking
      </span>
    );
  }

  if (state.available === null) return null;

  return state.available ? (
    <span className="tv-adm-badge tv-adm-badge--patina shrink-0 self-start sm:self-auto">
      <Check className="h-3 w-3" />
      Available
    </span>
  ) : (
    <span className="tv-adm-badge tv-adm-badge--danger shrink-0 self-start sm:self-auto">
      <X className="h-3 w-3" />
      {state.reason || 'Taken'}
    </span>
  );
}

function toFormState(initial?: PostDetail): FormState {
  return {
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    excerpt: initial?.excerpt ?? '',
    content: initial?.content ?? '',
    coverImage: initial?.coverImage ?? null,
    galleryImages: initial?.galleryImages ?? [],
    tags: (initial?.tags ?? []).join(', '),
    category: initial?.category ?? '',
    authorName: initial?.authorName ?? 'Tapvyo',
    authorAvatar: initial?.authorAvatar ?? '',
    status: initial?.status ?? 'DRAFT',
    // IST wall-clock time, whatever the browser's timezone. The old
    // toLocalInput used the browser's zone, so the label could not say IST.
    publishedAt: toIstInput(initial?.publishedAt ?? null),
    metaTitle: initial?.metaTitle ?? '',
    metaDescription: initial?.metaDescription ?? '',
    ogImage: initial?.ogImage ?? '',
    canonicalUrl: initial?.canonicalUrl ?? '',
    noindex: initial?.noindex ?? false,
  };
}

/**
 * Client-side gate on the rules that would otherwise only surface as a 400.
 * The server validates the same things again — this exists so the admin is
 * told what is missing before a round trip, not instead of the check.
 */
function validate(form: FormState, status: 'DRAFT' | 'PUBLISHED'): ValidationIssue | null {
  // Each issue names the tab and the field, so the form can take the admin
  // straight to it instead of leaving a message they might not see.
  if (form.title.trim().length < 3) {
    return { message: 'Title must be at least 3 characters.', tab: 'content', fieldId: 'post-title' };
  }
  if (form.excerpt.trim().length < 20) {
    return { message: 'Excerpt must be at least 20 characters.', tab: 'content', fieldId: 'post-excerpt' };
  }
  if (!form.content.trim() || form.content === '<p></p>') {
    return { message: 'The post has no content yet.', tab: 'content', fieldId: 'post-content' };
  }
  if (!form.authorName.trim()) {
    return { message: 'An author name is required.', tab: 'publish', fieldId: 'post-author' };
  }
  if (form.publishedAt && !fromIstInput(form.publishedAt)) {
    return { message: 'The publish date is not a valid date.', tab: 'publish', fieldId: 'post-published-at' };
  }

  if (status === 'PUBLISHED') {
    if (!form.coverImage) {
      return { message: 'A published post needs a cover image.', tab: 'media', fieldId: 'post-cover' };
    }
    if (!form.coverImage.alt.trim()) {
      return { message: 'The cover image needs alt text before publishing.', tab: 'media', fieldId: 'post-cover-alt' };
    }
  }

  return null;
}

function toPayload(form: FormState, status: 'DRAFT' | 'PUBLISHED') {
  const content = form.content;

  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    excerpt: form.excerpt.trim(),
    content,
    coverImage: form.coverImage,
    // Only images still present in the body are worth tracking. Anything the
    // admin deleted out of the content becomes an orphan the server cleans up.
    galleryImages: form.galleryImages.filter((image) => content.includes(image.url)),
    tags: form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    category: form.category.trim(),
    authorName: form.authorName.trim(),
    authorAvatar: form.authorAvatar.trim(),
    status,
    // The input is IST wall-clock time (see src/lib/blog/public-state.ts).
    publishedAt: fromIstInput(form.publishedAt),
    metaTitle: form.metaTitle.trim(),
    metaDescription: form.metaDescription.trim(),
    ogImage: form.ogImage.trim(),
    canonicalUrl: form.canonicalUrl.trim(),
    noindex: form.noindex,
  };
}

