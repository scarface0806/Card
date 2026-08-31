'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, FileText, PenLine, Plus, RotateCw } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import StatCard from '@/components/admin/StatCard';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import BlogViewsChart from '@/components/admin/blog/BlogViewsChart';
import { isAbortError } from '@/lib/fetch-utils';
import type { AdminPostRow, BlogStats, TopPost, ViewsPoint } from '@/lib/blog/types';

const PER_PAGE = 10;

type Filters = {
  search: string;
  status: 'ALL' | 'DRAFT' | 'PUBLISHED';
  tag: string;
  sort: 'newest' | 'oldest' | 'views';
  page: number;
};

const initialFilters: Filters = { search: '', status: 'ALL', tag: '', sort: 'newest', page: 1 };

export default function AdminBlogsPage() {
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [posts, setPosts] = useState<AdminPostRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminPostRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [stats, setStats] = useState<BlogStats | null>(null);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [series, setSeries] = useState<ViewsPoint[]>([]);

  const fetchPosts = useCallback(
    async (query: Filters, signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          search: query.search,
          status: query.status,
          tag: query.tag,
          sort: query.sort,
          page: String(query.page),
          perPage: String(PER_PAGE),
        });

        const response = await fetch(`/api/admin/blogs?${params}`, {
          credentials: 'include',
          signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load posts');
        if (signal?.aborted) return;

        setPosts(payload.posts || []);
        setTotal(payload.total || 0);
        setTotalPages(payload.totalPages || 1);
      } catch (err) {
        if (signal?.aborted || isAbortError(err)) return;
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/admin/blogs/stats', { credentials: 'include', signal });
      const payload = await response.json();
      if (!response.ok || signal?.aborted) return;

      setStats(payload.stats ?? null);
      setTopPosts(payload.topPosts || []);
      setSeries(payload.series || []);
    } catch (err) {
      // Analytics are supporting detail; the list is the page's job.
      if (!signal?.aborted && !isAbortError(err)) console.error(err);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(filters, controller.signal);
    return () => controller.abort();
  }, [fetchPosts, filters]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  const patch = (next: Partial<Filters>) =>
    setFilters((current) => ({ ...current, page: 1, ...next }));

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/blogs/${pendingDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to delete post');

      setSuccess(`Deleted "${pendingDelete.title}"`);
      setPendingDelete(null);
      fetchPosts(filters);
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'coverImage',
      label: 'Cover',
      width: '84px',
      render: (_value: unknown, row: AdminPostRow) =>
        row.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.coverImage.url}
            alt=""
            className="h-10 w-16 rounded border border-[var(--tv-rule)] object-cover"
          />
        ) : (
          <span className="tv-adm-empty-icon !h-10 !w-16 !rounded">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
        ),
    },
    {
      key: 'title',
      label: 'Post',
      render: (_value: unknown, row: AdminPostRow) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[var(--tv-text)]">{row.title}</p>
          <p className="tv-adm-meta truncate text-xs">/blog/{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_value: unknown, row: AdminPostRow) => (
        <StatusBadge
          status={row.status === 'PUBLISHED' ? 'active' : 'pending'}
          label={row.status === 'PUBLISHED' ? 'Published' : 'Draft'}
        />
      ),
    },
    {
      key: 'publishedAt',
      label: 'Published',
      render: (_value: unknown, row: AdminPostRow) =>
        row.publishedAt ? new Date(row.publishedAt).toLocaleDateString() : '—',
    },
    {
      key: 'views',
      label: 'Views',
      align: 'right' as const,
      render: (_value: unknown, row: AdminPostRow) => (
        <span className="tabular-nums text-[var(--tv-text)]">
          {row.views.toLocaleString()}
          <span className="tv-adm-meta ml-1 text-xs">({row.uniqueViews.toLocaleString()} unique)</span>
        </span>
      ),
    },
  ];

  return (
    <main className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="tv-adm-page-title">Blogs</h1>
          <p className="tv-adm-page-sub mt-1">Write posts, publish them, and see what people read.</p>
        </div>

        <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              fetchPosts(filters);
              fetchStats();
            }}
            className="tv-btn tv-btn-secondary !min-h-[42px] !text-sm"
          >
            <RotateCw className="h-4 w-4" />
            Refresh
          </button>
          <Link href="/admin/blogs/new" className="tv-btn tv-btn-gilded !min-h-[42px] !text-sm">
            <Plus className="h-4 w-4" />
            New post
          </Link>
        </div>
      </div>

      {error && <AdminToast message={error} variant="error" onClose={() => setError(null)} />}
      {success && <AdminToast message={success} variant="success" onClose={() => setSuccess(null)} />}

      <div className="admin-card-grid">
        <StatCard label="Total posts" value={stats?.totalPosts ?? 0} icon={<FileText className="h-4 w-4" />} color="blue" />
        <StatCard label="Published" value={stats?.publishedPosts ?? 0} icon={<PenLine className="h-4 w-4" />} color="green" description={`${stats?.draftPosts ?? 0} drafts`} />
        <StatCard label="Total views" value={stats?.totalViews ?? 0} icon={<Eye className="h-4 w-4" />} color="teal" />
        <StatCard label="Views, last 30 days" value={stats?.viewsLast30Days ?? 0} icon={<Eye className="h-4 w-4" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <BlogViewsChart series={series} />
        </div>

        <div className="tv-adm-panel">
          <div className="tv-adm-panel-head">
            <h3 className="tv-adm-panel-title">Top posts</h3>
            <span className="tv-adm-count">by views</span>
          </div>
          <div className="tv-adm-panel-pad">
            {topPosts.length === 0 ? (
              <div className="tv-adm-empty">
                <p className="tv-adm-meta">No views recorded yet.</p>
              </div>
            ) : (
              <ol className="space-y-3">
                {topPosts.map((post, index) => (
                  <li key={post.id} className="flex items-start gap-3">
                    <span className="tv-adm-meta w-4 flex-shrink-0 text-xs tabular-nums">{index + 1}</span>
                    <Link
                      href={`/admin/blogs/${post.id}/edit`}
                      className="min-w-0 flex-1 truncate text-sm text-[var(--tv-text)] hover:text-[var(--tv-patina)]"
                    >
                      {post.title}
                    </Link>
                    <span className="flex-shrink-0 text-sm tabular-nums text-[var(--tv-patina)]">
                      {post.views.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      <div className="admin-filter-bar">
        <input
          type="search"
          value={filters.search}
          onChange={(event) => patch({ search: event.target.value })}
          placeholder="Search by title or slug"
          aria-label="Search posts"
        />
        <select
          value={filters.status}
          onChange={(event) => patch({ status: event.target.value as Filters['status'] })}
          aria-label="Filter by status"
        >
          <option value="ALL">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        <input
          type="text"
          value={filters.tag}
          onChange={(event) => patch({ tag: event.target.value })}
          placeholder="Filter by tag"
          aria-label="Filter by tag"
        />
        <select
          value={filters.sort}
          onChange={(event) => patch({ sort: event.target.value as Filters['sort'] })}
          aria-label="Sort posts"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="views">Most viewed</option>
        </select>
      </div>

      {loading ? (
        <div className="tv-adm-panel tv-adm-panel-pad space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="tv-adm-skeleton h-12 w-full rounded-lg" />
          ))}
          <span className="sr-only">Loading posts…</span>
        </div>
      ) : (
        <>
          <DataTable<AdminPostRow>
            title="Posts"
            columns={columns}
            data={posts}
            // The API already paginates, so DataTable renders exactly what it
            // was handed and the pager below drives the page.
            itemsPerPage={PER_PAGE}
            onView={(row) => window.open(`/blog/${row.slug}`, '_blank', 'noopener,noreferrer')}
            onEdit={(row) => router.push(`/admin/blogs/${row.id}/edit`)}
            onDelete={(row) => setPendingDelete(row)}
          />

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="tv-adm-meta text-xs">
                Page <span className="text-[var(--tv-text)] tabular-nums">{filters.page}</span> of{' '}
                <span className="text-[var(--tv-text)] tabular-nums">{totalPages}</span> ·{' '}
                <span className="text-[var(--tv-text)] tabular-nums">{total}</span> posts
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilters((c) => ({ ...c, page: Math.max(1, c.page - 1) }))}
                  disabled={filters.page === 1}
                  className="tv-adm-page-btn !min-w-0 !px-1.5"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setFilters((c) => ({ ...c, page }))}
                    aria-current={page === filters.page ? 'page' : undefined}
                    className="tv-adm-page-btn"
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFilters((c) => ({ ...c, page: Math.min(totalPages, c.page + 1) }))}
                  disabled={filters.page === totalPages}
                  className="tv-adm-page-btn !min-w-0 !px-1.5"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AdminConfirmPanel
        open={Boolean(pendingDelete)}
        tone="danger"
        title="Delete this post?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" and its Cloudinary images are removed permanently. This cannot be undone.`
            : ''
        }
        confirmText="Delete post"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
