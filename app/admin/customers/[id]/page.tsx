'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AdminToast from '@/components/admin/AdminToast';

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
    let active = true;

    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/customers/${id}`, {
          credentials: 'include',
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || payload?.message || 'Failed to fetch customer');
        }

        if (!active) return;
        setCustomer(payload.customer || null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch customer');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const profileLink = useMemo(() => {
    if (!customer?.slug) return '';
    return `/card/${customer.slug}`;
  }, [customer?.slug]);

  if (loading) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Customer Detail</h1>
        <AdminToast variant="error" message={error} onClose={() => setError(null)} />
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Customer Detail</h1>
        <p className="text-sm text-gray-400">Customer not found.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{customer.name}</h1>
          <p className="mt-1 text-sm text-gray-400">Slug: {customer.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/customers/${customer.id}/edit`} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
            Edit
          </Link>
          <Link href={profileLink} target="_blank" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            Open Profile
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#161b2e] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">Contact</h2>
          <p className="text-sm text-gray-200">Email: {customer.email}</p>
          <p className="text-sm text-gray-200">Phone: {customer.phone}</p>
          <p className="text-sm text-gray-200">Status: {customer.isActive ? 'Active' : 'Disabled'}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161b2e] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">Business</h2>
          <p className="text-sm text-gray-200">Designation: {customer.designation || '-'}</p>
          <p className="text-sm text-gray-200">Company: {customer.company || '-'}</p>
          <p className="text-sm text-gray-200">Website: {customer.website || '-'}</p>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#161b2e] p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">About</h2>
        <p className="text-sm leading-relaxed text-gray-200">{customer.about || 'No description provided.'}</p>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#161b2e] p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">Gallery</h2>
        {customer.galleries?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customer.galleries.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#101729] p-3">
                <img src={item.image} alt={item.hoverText || `Gallery ${item.slot}`} className="h-32 w-full rounded-md object-cover" />
                <p className="mt-2 text-xs text-gray-400">Slot {item.slot}</p>
                <p className="text-xs text-gray-300">{item.hoverText || '-'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No gallery items available.</p>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-[#161b2e] p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">Recent Leads</h2>
        {customer.leads?.length ? (
          <div className="space-y-3">
            {customer.leads.map((lead) => (
              <div key={lead.id} className="rounded-lg border border-white/10 bg-[#101729] p-3">
                <p className="text-sm font-medium text-white">{lead.name}</p>
                <p className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-gray-300">{lead.phone} {lead.email ? `| ${lead.email}` : ''}</p>
                <p className="mt-1 text-sm text-gray-200">{lead.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No leads captured yet.</p>
        )}
      </section>
    </main>
  );
}
