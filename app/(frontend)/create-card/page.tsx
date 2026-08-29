import type { Metadata } from 'next';
import CreateCardClient from './CreateCardClient';
import { getDefaultTemplate, getTemplateBySlug } from '@/utils/cardTemplates';
import { SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `Create Your Digital Card | ${SITE_NAME}`,
  description:
    'Design and order your NFC business card in five steps. Enter your details, pick a template and check out - free lifetime digital profile included.',
  alternates: { canonical: '/create-card' },
};

/**
 * Server component so the page has real markup in the initial HTML.
 *
 * This used to be a `'use client'` page that read `useSearchParams()` inside a
 * `<Suspense>` boundary. On a statically prerendered route that triggers Next's
 * client-side-rendering bailout: the entire boundary is skipped on the server,
 * so the shipped HTML was nothing but a loading spinner and the main conversion
 * path was invisible to crawlers and to anyone on a slow connection.
 *
 * Reading `searchParams` here instead resolves the template server-side and
 * hands it down as a prop, so the form, heading and live preview are all
 * present on first paint.
 */
export default async function CreateCardPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string | string[] }>;
}) {
  const params = await searchParams;
  const slug = Array.isArray(params.template) ? params.template[0] : params.template;
  const template = (slug && getTemplateBySlug(slug)) || getDefaultTemplate();

  return <CreateCardClient template={template} />;
}
