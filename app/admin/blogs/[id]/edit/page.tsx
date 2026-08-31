'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import BlogForm from '@/components/admin/blog/BlogForm';
import AdminToast from '@/components/admin/AdminToast';
import { isAbortError } from '@/lib/fetch-utils';
import type { PostDetail } from '@/lib/blog/types';

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const [post, setPost] = useState<PostDetail | null>(null);
  const [previewToken, setPreviewToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/blogs/${id}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load post');
        if (controller.signal.aborted) return;

        setPost(payload.post);
        setPreviewToken(payload.previewToken || '');
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <main className="space-y-5">
        <div className="tv-adm-skeleton h-10 w-56 rounded-lg" />
        <div className="tv-adm-skeleton h-64 w-full rounded-xl" />
        <span className="sr-only">Loading post…</span>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="space-y-5">
        <AdminToast message={error || 'Post not found'} variant="error" />
        <Link href="/admin/blogs" className="tv-btn tv-btn-secondary !min-h-[42px] !text-sm w-fit">
          Back to posts
        </Link>
      </main>
    );
  }

  return <BlogForm postId={id} initial={post} initialPreviewToken={previewToken} />;
}
