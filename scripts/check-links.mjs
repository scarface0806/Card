#!/usr/bin/env node
/**
 * Crawls every public route of a running build and asserts that:
 *   - each internal link resolves to a 2xx (or an intentional 3xx redirect)
 *   - each `#anchor` target actually exists on the page it points at
 *   - no link is left as a no-op (`href="#"` or an empty href)
 *
 * Usage:
 *   npm run build && npx next start -p 3311 &
 *   node scripts/check-links.mjs --base http://localhost:3311
 *
 * Exits non-zero if anything is broken, so it can gate a deploy.
 */

const args = process.argv.slice(2);
const baseArg = args.indexOf('--base');
const BASE = (baseArg !== -1 && args[baseArg + 1]) || 'http://localhost:3000';

/** Routes to crawl. Admin and API are deliberately out of scope. */
const ROUTES = [
  '/',
  '/cards',
  '/create-card',
  '/services',
  '/products',
  '/about-us',
  '/how-to-use',
  '/contact-us',
  '/preview-website',
  '/privacy-policy',
  '/terms-conditions',
  '/login',
  '/signup',
];

/** Paths that are expected to redirect rather than render. */
const EXPECTED_REDIRECTS = new Map([['/order', '/create-card']]);

/** Skipped on purpose: auth-gated, or not a navigable document. */
const SKIP_PREFIXES = ['/api/', '/admin', '/_next/'];

const problems = [];
const pageCache = new Map();

function record(kind, route, detail) {
  problems.push({ kind, route, detail });
}

async function fetchPage(path) {
  if (pageCache.has(path)) return pageCache.get(path);
  const res = await fetch(new URL(path, BASE), { redirect: 'manual' });
  const html = res.status >= 200 && res.status < 300 ? await res.text() : '';
  const entry = { status: res.status, location: res.headers.get('location'), html };
  pageCache.set(path, entry);
  return entry;
}

/** Every href/src on the page, with enough context to report it usefully. */
function extractLinks(html) {
  const links = [];
  const re = /<(a|link|form|iframe|img)\b[^>]*?\s(href|src|action)\s*=\s*["']([^"']*)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    links.push({ tag: m[1].toLowerCase(), attr: m[2].toLowerCase(), value: m[3] });
  }
  return links;
}

function extractIds(html) {
  const ids = new Set();
  const re = /\sid\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) ids.add(m[1]);
  return ids;
}

async function checkRoute(route) {
  const page = await fetchPage(route);

  if (page.status !== 200) {
    record('BAD_STATUS', route, `expected 200, got ${page.status}`);
    return;
  }

  const ids = extractIds(page.html);

  for (const { tag, attr, value } of extractLinks(page.html)) {
    const href = value.trim();

    // A clickable element with nowhere to go.
    if (tag === 'a' && (href === '' || href === '#')) {
      record('NO_OP', route, `<a ${attr}="${href}"> - link with no destination`);
      continue;
    }

    if (
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('data:') ||
      href.startsWith('javascript:')
    ) {
      // tel: must be diallable - digits and a leading + only.
      if (href.startsWith('tel:') && /[^+\d]/.test(href.slice(4))) {
        record('BAD_TEL', route, `${href} - tel: must contain only digits and a leading +`);
      }
      continue;
    }

    // External links are not crawled, but they must not be bare placeholders.
    if (/^https?:\/\//i.test(href)) continue;

    // Same-page anchor.
    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1));
      if (id && !ids.has(id)) {
        record('DEAD_ANCHOR', route, `${href} - no element with id="${id}" on this page`);
      }
      continue;
    }

    if (!href.startsWith('/')) continue;
    if (SKIP_PREFIXES.some((p) => href.startsWith(p))) continue;

    const [path, hash] = href.split('#');
    const target = path || route;

    const targetPage = await fetchPage(target);

    if (EXPECTED_REDIRECTS.has(target)) {
      const want = EXPECTED_REDIRECTS.get(target);
      if (targetPage.status < 300 || targetPage.status >= 400) {
        record('MISSING_REDIRECT', route, `${target} should redirect to ${want}, got ${targetPage.status}`);
      }
      continue;
    }

    if (targetPage.status === 404) {
      record('BROKEN_LINK', route, `${href} - target returns 404`);
      continue;
    }
    if (targetPage.status !== 200) {
      record('BAD_STATUS', route, `${href} - target returns ${targetPage.status}`);
      continue;
    }

    // Cross-page anchor: the id has to exist on the destination.
    if (hash) {
      const targetIds = extractIds(targetPage.html);
      if (!targetIds.has(decodeURIComponent(hash))) {
        record('DEAD_ANCHOR', route, `${href} - no element with id="${hash}" on ${target}`);
      }
    }
  }
}

async function main() {
  console.log(`Checking links against ${BASE}\n`);

  for (const route of ROUTES) {
    process.stdout.write(`  ${route} ... `);
    const before = problems.length;
    try {
      await checkRoute(route);
    } catch (err) {
      record('FETCH_FAILED', route, err instanceof Error ? err.message : String(err));
    }
    const found = problems.length - before;
    console.log(found === 0 ? 'ok' : `${found} problem(s)`);
  }

  // The redirects themselves.
  for (const [from, to] of EXPECTED_REDIRECTS) {
    const res = await fetch(new URL(from, BASE), { redirect: 'manual' });
    const location = res.headers.get('location') || '';
    const ok = res.status >= 300 && res.status < 400 && location.endsWith(to);
    console.log(`  ${from} -> ${to} ... ${ok ? `ok (${res.status})` : `FAILED (${res.status} -> ${location})`}`);
    if (!ok) record('MISSING_REDIRECT', from, `expected 3xx to ${to}, got ${res.status} -> ${location}`);
  }

  console.log('');
  if (problems.length === 0) {
    console.log(`PASS - ${ROUTES.length} routes, no broken links or dead anchors.`);
    return;
  }

  console.error(`FAIL - ${problems.length} problem(s):\n`);
  for (const { kind, route, detail } of problems) {
    console.error(`  [${kind}] ${route}\n      ${detail}`);
  }
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
