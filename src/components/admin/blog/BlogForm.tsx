'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ExternalLink, Loader2, Trash2, X } from 'lucide-react';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/blog/RichTextEditor';
import SerpPreview, { DESCRIPTION_LIMIT, TITLE_LIMIT } from '@/components/admin/blog/SerpPreview';
import { slugify } from '@/lib/blog/slug';
import { BLOG_UPLOAD_FOLDER } from '@/lib/blog/upload-client';
import type { PostDetail, PostImageData } from '@/lib/blog/types';

type TabKey = 'content' | 'media' | 'seo' | 'publish';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'content', label: 'Content' },
  { key: 'media', label: 'Media' },
  { key: 'seo', label: 'SEO' },
  { key: 'publish', label: 'Publish' },
];

const EXCERPT_LIMIT = 320;

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

  const previewHref = useMemo(
    () => (postId && previewToken ? `/blog/preview/${postId}?token=${previewToken}` : null),
    [postId, previewToken]
  );

  async function save(publish: boolean) {
    const nextStatus = publish ? 'PUBLISHED' : form.status;

    const validationError = validate(form, nextStatus);
    if (validationError) {
      setToast({ variant: 'error', message: validationError });
      return;
    }

    setSaving(true);
    setToast(null);

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
      setToast({
        variant: 'success',
        message: publish ? 'Post published' : isEdit ? 'Post saved' : 'Draft created',
      });

      if (!isEdit && payload.post?.id) {
        router.replace(`/admin/blogs/${payload.post.id}/edit`);
        return;
      }

      // The saved slug can differ from the typed one if it collided.
      if (payload.post?.slug) {
        setForm((current) => ({ ...current, slug: payload.post.slug, status: nextStatus }));
      }
      router.refresh();
    } catch (error) {
      setToast({ variant: 'error', message: error instanceof Error ? error.message : 'Failed to save post' });
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
          <h1 className="tv-adm-page-title">{isEdit ? 'Edit post' : 'New post'}</h1>
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
                className="admin-form-input"
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="How NFC business cards actually work"
                maxLength={160}
              />
            </Field>

            <Field label="Slug" required hint="Lowercase words separated by hyphens. Changing it on a live post keeps the old URL working with a redirect.">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="admin-form-input"
                  value={form.slug}
                  onChange={(event) => {
                    slugTouched.current = true;
                    set('slug', event.target.value.toLowerCase());
                  }}
                  placeholder="how-nfc-business-cards-work"
                />
                <SlugStatus state={slugState} />
              </div>
              <p className="tv-adm-meta mt-1.5 text-xs">/blog/{form.slug || 'your-post-slug'}</p>
            </Field>

            <Field label="Excerpt" required hint="Shown on the blog listing and used as the meta description fallback.">
              <textarea
                className="tv-adm-textarea"
                value={form.excerpt}
                onChange={(event) => set('excerpt', event.target.value)}
                maxLength={EXCERPT_LIMIT}
                rows={3}
              />
              <Counter value={form.excerpt.length} limit={EXCERPT_LIMIT} />
            </Field>
          </div>

          <div className="tv-adm-panel tv-adm-panel-pad space-y-3">
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
          <div className="tv-adm-panel tv-adm-panel-pad space-y-5">
            <ImageUpload
              folder={BLOG_UPLOAD_FOLDER}
              label="Cover image"
              aspectRatio="landscape"
              currentImageUrl={form.coverImage?.url}
              onUploadComplete={(url, publicId, meta) =>
                set('coverImage', {
                  url,
                  publicId,
                  alt: form.coverImage?.alt ?? '',
                  width: meta?.width ?? 1200,
                  height: meta?.height ?? 630,
                })
              }
            />

            <Field
              label="Cover alt text"
              required
              hint="Describes the image for screen readers and search engines. A post cannot be published without it."
            >
              <input
                className="admin-form-input"
                value={form.coverImage?.alt ?? ''}
                onChange={(event) =>
                  set('coverImage', form.coverImage ? { ...form.coverImage, alt: event.target.value } : null)
                }
                disabled={!form.coverImage}
                placeholder="A metal NFC business card held above a phone"
                maxLength={200}
              />
            </Field>

            {form.coverImage && (
              <button
                type="button"
                onClick={() => set('coverImage', null)}
                className="tv-adm-action tv-adm-action--danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove cover image
              </button>
            )}
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
                    <li key={image.publicId} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt="" className="h-10 w-14 rounded border border-[var(--tv-rule)] object-cover" />
                      <span className="truncate text-xs text-[var(--tv-text-muted)]">{image.alt || image.publicId}</span>
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
                className="admin-form-input"
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

            <Field label="Canonical URL" hint="Only set this if the post was first published elsewhere.">
              <input
                className="admin-form-input"
                value={form.canonicalUrl}
                onChange={(event) => set('canonicalUrl', event.target.value)}
                placeholder="https://example.com/original-article"
                inputMode="url"
              />
            </Field>

            <Field label="Social share image" hint="Overrides the cover image on social cards. 1200x630 works best.">
              <input
                className="admin-form-input"
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
              label="Publish date"
              hint="Leave blank to publish immediately. A future date holds the post back until then."
            >
              <input
                type="datetime-local"
                className="admin-form-input"
                value={form.publishedAt}
                onChange={(event) => set('publishedAt', event.target.value)}
              />
            </Field>

            <Field label="Author" required>
              <input
                className="admin-form-input"
                value={form.authorName}
                onChange={(event) => set('authorName', event.target.value)}
                maxLength={80}
              />
            </Field>

            <Field label="Tags" hint="Comma separated. Each tag gets its own archive page.">
              <input
                className="admin-form-input"
                value={form.tags}
                onChange={(event) => set('tags', event.target.value)}
                placeholder="nfc, business cards, networking"
              />
            </Field>

            <Field label="Category">
              <input
                className="admin-form-input"
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
      <span className="tv-adm-meta inline-flex flex-shrink-0 items-center gap-1.5 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking
      </span>
    );
  }

  if (state.available === null) return null;

  return state.available ? (
    <span className="tv-adm-badge tv-adm-badge--patina flex-shrink-0">
      <Check className="h-3 w-3" />
      Available
    </span>
  ) : (
    <span className="tv-adm-badge tv-adm-badge--danger flex-shrink-0">
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
    publishedAt: toLocalInput(initial?.publishedAt ?? null),
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
function validate(form: FormState, status: 'DRAFT' | 'PUBLISHED'): string | null {
  if (form.title.trim().length < 3) return 'Title must be at least 3 characters.';
  if (form.excerpt.trim().length < 20) return 'Excerpt must be at least 20 characters.';
  if (!form.content.trim() || form.content === '<p></p>') return 'The post has no content yet.';
  if (!form.authorName.trim()) return 'An author name is required.';

  if (status === 'PUBLISHED') {
    if (!form.coverImage) return 'A published post needs a cover image.';
    if (!form.coverImage.alt.trim()) return 'The cover image needs alt text before publishing.';
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
    publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    metaTitle: form.metaTitle.trim(),
    metaDescription: form.metaDescription.trim(),
    ogImage: form.ogImage.trim(),
    canonicalUrl: form.canonicalUrl.trim(),
    noindex: form.noindex,
  };
}

/** ISO -> the local `datetime-local` format, which has no timezone suffix. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
