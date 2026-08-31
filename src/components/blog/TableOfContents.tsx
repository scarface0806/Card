'use client';

import React, { useEffect, useState } from 'react';
import type { TocHeading } from '@/lib/blog/toc';

interface TableOfContentsProps {
  headings: TocHeading[];
}

/**
 * Sticky contents list, built from the same pass that gave the headings their
 * ids — so an entry here always points at a heading that exists.
 *
 * The active-section highlight is the only reason this is a client component.
 */
export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    // The top band of the viewport is the "current" zone: a heading becomes
    // active once it reaches roughly a quarter down the screen, which matches
    // where a reader's eye actually is.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="lg:sticky lg:top-28">
      <p className="tv-eyebrow mb-4">On this page</p>
      <ul className="space-y-1 border-l border-[var(--tv-rule)]">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? 'location' : undefined}
              className="tv-toc-link tv-focus"
              data-level={heading.level}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
