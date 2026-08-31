'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AdminToast from '@/components/admin/AdminToast';
import { isAbortError } from '@/lib/fetch-utils';

type GalleryItem = {
  id: string;
  slot: number;
  image: string;
  hoverText?: string | null;
};

type LeadItem = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  createdAt: string;
};

type CustomerDetail = {
  id: string;
  name: string;
  designation?: string | null;
  company?: string | null;
  about?: string | null;
  phone: string;
  email: string;
  slug: string;
  isActive: boolean;
  website?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  behance?: string | null;
  mapEmbedUrl?: string | null;
  profileImage?: string | null;
  logo?: string | null;
  galleries: GalleryItem[];
  leads: LeadItem[];
  createdAt: string;
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/customers/${id}`, {
          credentials: 'include',
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || payload?.message || 'Failed to fetch customer');
        }

        if (controller.signal.aborted) return;
        setCustomer(payload.customer || null);
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch customer');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [id]);

  const profileLink = useMemo(() => {
    if (!customer?.slug) return '';
    return `/card/${customer.slug}`;
  }, [customer?.slug]);

  if (loading) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--tv-patina)]" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-4">
        <h1 className="tv-adm-page-title">Customer Detail</h1>
        <AdminToast variant="error" message={error} onClose={() => setError(null)} />
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="space-y-4">
        <h1 className="tv-adm-page-title">Customer Detail</h1>
        <p className="text-sm text-[var(--tv-text-muted)]">Customer not found.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="tv-adm-page-title">{customer.name}</h1>
          <p className="mt-1 text-sm text-[var(--tv-text-muted)]">Slug: {customer.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/customers/${customer.id}/edit`} className="rounded-lg bg-[var(--tv-patina)] px-4 py-2 text-sm font-semibold text-[var(--tv-text)] hover:bg-[var(--tv-patina)]">
            Edit
          </Link>
          <Link href={profileLink} target="_blank" className="rounded-lg border border-[rgba(241,243,241,0.18)] px-4 py-2 text-sm font-semibold text-[var(--tv-text)] hover:bg-[rgba(241,243,241,0.06)]">
            Open Profile
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-4">
          <h2 className="tv-adm-label mb-3">Contact</h2>
          <p className="text-sm text-[var(--tv-text)]">Email: {customer.email}</p>
          <p className="text-sm text-[var(--tv-text)]">Phone: {customer.phone}</p>
          <p className="text-sm text-[var(--tv-text)]">Status: {customer.isActive ? 'Active' : 'Disabled'}</p>
        </div>

        <div className="rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-4">
          <h2 className="tv-adm-label mb-3">Business</h2>
          <p className="text-sm text-[var(--tv-text)]">Designation: {customer.designation || '-'}</p>
          <p className="text-sm text-[var(--tv-text)]">Company: {customer.company || '-'}</p>
          <p className="text-sm text-[var(--tv-text)]">Website: {customer.website || '-'}</p>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-4">
        <h2 className="tv-adm-label mb-3">About</h2>
        <p className="text-sm leading-relaxed text-[var(--tv-text)]">{customer.about || 'No description provided.'}</p>
      </section>

      <section className="rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-4">
        <h2 className="tv-adm-label mb-3">Gallery</h2>
        {customer.galleries?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customer.galleries.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] p-3">
                <img src={item.image} alt={item.hoverText || `Gallery ${item.slot}`} className="h-32 w-full rounded-md object-cover" />
                <p className="mt-2 text-xs text-[var(--tv-text-muted)]">Slot {item.slot}</p>
                <p className="text-xs text-[var(--tv-text)]">{item.hoverText || '-'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--tv-text-muted)]">No gallery items available.</p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-4">
        <h2 className="tv-adm-label mb-3">Recent Leads</h2>
        {customer.leads?.length ? (
          <div className="space-y-3">
            {customer.leads.map((lead) => (
              <div key={lead.id} className="rounded-lg border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] p-3">
                <p className="text-sm font-medium text-[var(--tv-text)]">{lead.name}</p>
                <p className="text-xs text-[var(--tv-text-muted)]">{new Date(lead.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-[var(--tv-text)]">{lead.phone} {lead.email ? `| ${lead.email}` : ''}</p>
                <p className="mt-1 text-sm text-[var(--tv-text)]">{lead.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--tv-text-muted)]">No leads captured yet.</p>
        )}
      </section>
    </main>
  );
}
