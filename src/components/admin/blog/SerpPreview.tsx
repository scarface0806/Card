'use client';

import React from 'react';
import { SITE_URL } from '@/lib/site-config';

interface SerpPreviewProps {
  title: string;
  description: string;
  slug: string;
}

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

/**
 * How the post is likely to appear on a results page.
 *
 * Google truncates on pixel width, not character count, so this is an
 * indication rather than a guarantee — but it makes an over-long title
 * obvious before publishing rather than after.
 */
export default function SerpPreview({ title, description, slug }: SerpPreviewProps) {
  const displayUrl = `${SITE_URL.replace(/^https?:\/\//, '')}/blog/${slug || 'your-post-slug'}`;
  const shownTitle = truncate(title || 'Your post title', TITLE_LIMIT);
  const shownDescription = truncate(
    description || 'Your meta description appears here.',
    DESCRIPTION_LIMIT
  );

  return (
    <div className="tv-adm-panel tv-adm-panel-pad">
      <p className="tv-adm-label mb-3">Google preview</p>

      <div className="rounded-lg border border-[var(--tv-rule)] bg-[var(--tv-ink)] p-4">
        <p className="truncate text-xs text-[var(--tv-text-muted)]">{displayUrl}</p>
        <p className="mt-1 text-base font-medium text-[var(--tv-patina)]">{shownTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--tv-text-muted)]">{shownDescription}</p>
      </div>
    </div>
  );
}

function truncate(value: string, limit: number): string {
  const trimmed = value.trim();
  return trimmed.length > limit ? `${trimmed.slice(0, limit - 1).trimEnd()}…` : trimmed;
}

export { TITLE_LIMIT, DESCRIPTION_LIMIT };
