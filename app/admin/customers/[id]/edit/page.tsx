'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AdminToast from '@/components/admin/AdminToast';

interface GalleryItem {
  id: string;
  slot: number;
  image: string;
  hoverText?: string | null;
}

interface CustomerDetail {
  id: string;
  name: string;
  designation?: string | null;
  company?: string | null;
  about?: string | null;
  phone: string;
  email: string;
  mailApiEndpoint?: string | null;
  website?: string | null;
  websiteEnabled: boolean;
  linkedin?: string | null;
  linkedinEnabled: boolean;
  whatsapp?: string | null;
  whatsappEnabled: boolean;
  instagram?: string | null;
  instagramEnabled: boolean;
  facebook?: string | null;
  facebookEnabled: boolean;
  behance?: string | null;
  behanceEnabled: boolean;
  address?: string | null;
  mapEmbedUrl?: string | null;
  isActive: boolean;
  galleries: GalleryItem[];
}

type ToastState = { variant: 'success' | 'error' | 'info'; message: string };

type FormState = {
  name: string;
  designation: string;
  company: string;
  about: string;
  phone: string;
  email: string;
  mailApiEndpoint: string;
  website: string;
  websiteEnabled: boolean;
  linkedin: string;
  linkedinEnabled: boolean;
  whatsapp: string;
  whatsappEnabled: boolean;
  instagram: string;
  instagramEnabled: boolean;
  facebook: string;
  facebookEnabled: boolean;
  behance: string;
  behanceEnabled: boolean;
  address: string;
  mapEmbedUrl: string;
  isActive: boolean;
  gallery: Array<{ id: string; slot: number; hoverText: string }>;
};

const emptyForm: FormState = {
  name: '',
  designation: '',
  company: '',
  about: '',
  phone: '',
  email: '',
  mailApiEndpoint: '',
  website: '',
  websiteEnabled: false,
  linkedin: '',
  linkedinEnabled: false,
  whatsapp: '',
  whatsappEnabled: false,
  instagram: '',
  instagramEnabled: false,
  facebook: '',
  facebookEnabled: false,
  behance: '',
  behanceEnabled: false,
  address: '',
  mapEmbedUrl: '',
  isActive: true,
  gallery: [],
};

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    let active = true;

    const loadCustomer = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/customers/${id}`, { credentials: 'include' });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to fetch customer');
        }

        const customer = payload.customer as CustomerDetail;
        const orderedGallery = [...(customer.galleries || [])].sort((a, b) => a.slot - b.slot);

        if (!active) return;
        setForm({
          name: customer.name || '',
          designation: customer.designation || '',
          company: customer.company || '',
          about: customer.about || '',
          phone: customer.phone || '',
          email: customer.email || '',
          mailApiEndpoint: customer.mailApiEndpoint || '',
          website: customer.website || '',
          websiteEnabled: Boolean(customer.websiteEnabled),
          linkedin: customer.linkedin || '',
          linkedinEnabled: Boolean(customer.linkedinEnabled),
          whatsapp: customer.whatsapp || '',
          whatsappEnabled: Boolean(customer.whatsappEnabled),
          instagram: customer.instagram || '',
          instagramEnabled: Boolean(customer.instagramEnabled),
          facebook: customer.facebook || '',
          facebookEnabled: Boolean(customer.facebookEnabled),
          behance: customer.behance || '',
          behanceEnabled: Boolean(customer.behanceEnabled),
          address: customer.address || '',
          mapEmbedUrl: customer.mapEmbedUrl || '',
          isActive: Boolean(customer.isActive),
          gallery: orderedGallery.map((item) => ({
            id: item.id,
            slot: item.slot,
            hoverText: item.hoverText || '',
          })),
        });
      } catch (error) {
        if (!active) return;
        setToast({ variant: 'error', message: error instanceof Error ? error.message : 'Failed to load customer' });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCustomer();
    return () => {
      active = false;
    };
  }, [id]);

  const socialFields = useMemo(
    () => [
      { key: 'linkedin', label: 'LinkedIn' },
      { key: 'whatsapp', label: 'WhatsApp' },
      { key: 'instagram', label: 'Instagram' },
      { key: 'facebook', label: 'Facebook' },
      { key: 'behance', label: 'Behance' },
      { key: 'website', label: 'Website' },
    ],
    []
  );

  const setText = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setToggle = (key: keyof FormState, value: boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateGalleryHover = (id: string, hoverText: string) => {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.map((item) => (item.id === id ? { ...item, hoverText } : item)),
    }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update customer');
      }

      setToast({ variant: 'success', message: 'Customer updated successfully' });
      setTimeout(() => {
        router.push('/admin/customers');
      }, 600);
    } catch (error) {
      setToast({ variant: 'error', message: error instanceof Error ? error.message : 'Failed to update customer' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Edit Customer</h1>
        <p className="mt-1 text-sm text-gray-400">Update profile details, social links, status, and gallery hover text.</p>
      </div>

      {toast ? <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-white/5 bg-[#161b2e] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-200">Name
            <input value={form.name} onChange={(e) => setText('name', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" required />
          </label>
          <label className="block text-sm font-medium text-gray-200">Designation
            <input value={form.designation} onChange={(e) => setText('designation', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Company
            <input value={form.company} onChange={(e) => setText('company', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Phone
            <input value={form.phone} onChange={(e) => setText('phone', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" required />
          </label>
          <label className="block text-sm font-medium text-gray-200">Email
            <input type="email" value={form.email} onChange={(e) => setText('email', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" required />
          </label>
          <label className="block text-sm font-medium text-gray-200">Mail API Endpoint
            <input value={form.mailApiEndpoint} onChange={(e) => setText('mailApiEndpoint', e.target.value)} placeholder="https://api.tapvyo.com/send-mail" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Status
            <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setToggle('isActive', e.target.value === 'active')} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400">
              <option value="active">Active</option>
              <option value="inactive">Disabled</option>
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-200">About Us
          <textarea value={form.about} onChange={(e) => setText('about', e.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-200">Address
            <input value={form.address} onChange={(e) => setText('address', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Google Maps Embed URL
            <input value={form.mapEmbedUrl} onChange={(e) => setText('mapEmbedUrl', e.target.value)} placeholder="https://www.google.com/maps/embed?..." className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-[#0f1424] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Social Links</h3>
          {socialFields.map((field) => {
            const enabledKey = `${field.key}Enabled` as keyof FormState;
            const valueKey = field.key as keyof FormState;
            const isEnabled = Boolean(form[enabledKey]);
            const value = String(form[valueKey] || '');
            return (
              <div key={field.key} className="grid gap-3 md:grid-cols-[120px_1fr] md:items-center">
                <label className="inline-flex items-center gap-2 text-sm text-gray-200">
                  <input type="checkbox" checked={isEnabled} onChange={(e) => setToggle(enabledKey, e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-[#0f1424]" />
                  <span>{field.label}</span>
                </label>
                <input value={value} disabled={!isEnabled} onChange={(e) => setText(valueKey, e.target.value)} placeholder={`${field.label} URL`} className="w-full rounded-xl border border-white/10 bg-[#161b2e] px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40" />
              </div>
            );
          })}
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-[#0f1424] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Gallery Hover Text</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {form.gallery.map((item) => (
              <label key={item.id} className="block text-sm font-medium text-gray-200">Slot {item.slot}
                <input value={item.hoverText} onChange={(e) => updateGalleryHover(item.id, e.target.value)} placeholder="Hover text" className="mt-2 w-full rounded-xl border border-white/10 bg-[#161b2e] px-4 py-2.5 text-white outline-none focus:border-orange-400" />
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Customer'}
        </button>
      </form>
    </main>
  );
}
