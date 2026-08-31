'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AdminToast from '@/components/admin/AdminToast';
import ImageUpload from '@/components/admin/ImageUpload';
import { isAbortError, logFetchError } from '@/lib/fetch-utils';

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
  profileImage?: string | null;
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
  imageUrl: string;
  isActive: boolean;
  enableGallery: boolean;
  gallery: Array<{ id: string; slot: number; image: string; hoverText: string; file: File | null }>;
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
  imageUrl: '',
  isActive: true,
  enableGallery: true,
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
    const controller = new AbortController();

    const loadCustomer = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/customers/${id}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        const payload = await response.json();
        if (controller.signal.aborted) return;

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to fetch customer');
        }

        const customer = payload.customer as CustomerDetail;
        const orderedGallery = [...(customer.galleries || [])].sort((a, b) => a.slot - b.slot).slice(0, 3);
        const normalizedGallery = Array.from({ length: 3 }, (_, idx) => {
          const slot = idx + 1;
          const existing = orderedGallery.find((item) => item.slot === slot);
          return {
            id: existing?.id || '',
            slot,
            image: existing?.image || '/no-image-placeholder.svg',
            hoverText: existing?.hoverText || '',
            file: null,
          };
        });

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
          imageUrl: customer.profileImage || '',
          isActive: Boolean(customer.isActive),
          enableGallery: normalizedGallery.some((item) => item.id),
          gallery: normalizedGallery,
        });
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return;
        setToast({ variant: 'error', message: error instanceof Error ? error.message : 'Failed to load customer' });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadCustomer();

    return () => controller.abort();
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

  const updateGalleryHover = (slot: number, hoverText: string) => {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.map((item) => (item.slot === slot ? { ...item, hoverText } : item)),
    }));
  };

  const updateGalleryFile = (slot: number, file: File | null) => {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.map((item) => (item.slot === slot ? { ...item, file } : item)),
    }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      const body = new FormData();
      body.append('name', form.name);
      body.append('designation', form.designation);
      body.append('company', form.company);
      body.append('about', form.about);
      body.append('phone', form.phone);
      body.append('email', form.email);
      body.append('mailApiEndpoint', form.mailApiEndpoint);
      body.append('mailApiKey', form.mailApiEndpoint);
      body.append('website', form.website);
      body.append('websiteEnabled', String(form.websiteEnabled));
      body.append('linkedin', form.linkedin);
      body.append('linkedinEnabled', String(form.linkedinEnabled));
      body.append('whatsapp', form.whatsapp);
      body.append('whatsappEnabled', String(form.whatsappEnabled));
      body.append('instagram', form.instagram);
      body.append('instagramEnabled', String(form.instagramEnabled));
      body.append('facebook', form.facebook);
      body.append('facebookEnabled', String(form.facebookEnabled));
      body.append('behance', form.behance);
      body.append('behanceEnabled', String(form.behanceEnabled));
      body.append('address', form.address);
      body.append('mapEmbedUrl', form.mapEmbedUrl);
      body.append('imageUrl', form.imageUrl);
      body.append('isActive', String(form.isActive));
      body.append('enableGallery', String(form.enableGallery));

      if (form.enableGallery) {
        form.gallery.forEach((item) => {
          if (item.id) {
            body.append(`galleryId${item.slot}`, item.id);
          }
          if (item.file) {
            body.append(`galleryImage${item.slot}`, item.file);
          }
          body.append(`galleryHoverText${item.slot}`, item.hoverText);
        });
      }

      const response = await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body,
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
        <Loader2 className="h-6 w-6 animate-spin text-[var(--tv-patina)]" />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="tv-adm-page-title">Edit Customer</h1>
        <p className="mt-1 text-sm text-[var(--tv-text-muted)]">Update profile details, social links, status, and gallery hover text.</p>
      </div>

      {toast ? <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="tv-adm-field-label">Name
            <input value={form.name} onChange={(e) => setText('name', e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]" required />
          </label>
          <label className="tv-adm-field-label">Designation
            <input value={form.designation} onChange={(e) => setText('designation', e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]" />
          </label>
          <label className="tv-adm-field-label">Company
            <input value={form.company} onChange={(e) => setText('company', e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]" />
          </label>
          <label className="tv-adm-field-label">Phone
            <input value={form.phone} onChange={(e) => setText('phone', e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]" required />
          </label>
          <label className="tv-adm-field-label">Email
            <input type="email" value={form.email} onChange={(e) => setText('email', e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]" required />
          </label>
          <label className="tv-adm-field-label">Mail API Key
            <input value={form.mailApiEndpoint} onChange={(e) => setText('mailApiEndpoint', e.target.value)} placeholder="d494ff75-8a82-40e6-b14a-d6d7056238d3" className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]" />
          </label>
          <label className="tv-adm-field-label">Status
            <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setToggle('isActive', e.target.value === 'active')} className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]">
              <option value="active">Active</option>
              <option value="inactive">Disabled</option>
            </select>
          </label>
        </div>

        <label className="tv-adm-field-label">About Us
          <textarea value={form.about} onChange={(e) => setText('about', e.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <ImageUpload
              folder="admin/customers"
              label="Customer Profile Photo"
              aspectRatio="square"
              currentImageUrl={form.imageUrl || undefined}
              onUploadComplete={(url) => setText('imageUrl', url)}
            />
          </div>

          <label className="tv-adm-field-label">Address
            <input value={form.address} onChange={(e) => setText('address', e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]" />
          </label>
          <label className="tv-adm-field-label">Google Maps Embed URL
            <input value={form.mapEmbedUrl} onChange={(e) => setText('mapEmbedUrl', e.target.value)} placeholder="https://www.google.com/maps/embed?..." className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-3 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]" />
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] p-4">
          <h3 className="tv-adm-label">Social Links</h3>
          {socialFields.map((field) => {
            const enabledKey = `${field.key}Enabled` as keyof FormState;
            const valueKey = field.key as keyof FormState;
            const isEnabled = Boolean(form[enabledKey]);
            const value = String(form[valueKey] || '');
            return (
              <div key={field.key} className="grid gap-3 lg:grid-cols-[120px_1fr] lg:items-center">
                <label className="inline-flex items-center gap-2 text-sm text-[var(--tv-text)]">
                  <input type="checkbox" checked={isEnabled} onChange={(e) => setToggle(enabledKey, e.target.checked)} className="h-4 w-4 rounded border-[rgba(241,243,241,0.18)] bg-[rgba(7,10,9,0.55)]" />
                  <span>{field.label}</span>
                </label>
                <input value={value} disabled={!isEnabled} onChange={(e) => setText(valueKey, e.target.value)} placeholder={`${field.label} URL`} className="w-full rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] px-4 py-2.5 text-sm text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)] disabled:cursor-not-allowed disabled:opacity-40" />
              </div>
            );
          })}
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="tv-adm-label">Gallery (3 Images)</h3>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--tv-text)]">
              <input type="checkbox" checked={form.enableGallery} onChange={(e) => setToggle('enableGallery', e.target.checked)} className="h-4 w-4 rounded border-[rgba(241,243,241,0.18)] bg-[rgba(7,10,9,0.55)]" />
              Enable Gallery
            </label>
          </div>

          {form.enableGallery ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {form.gallery.map((item) => (
                <div key={item.slot} className="rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tv-text-muted)]">Image {item.slot}</p>
                  <div className="mt-2 overflow-hidden rounded-lg border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)]">
                    <img
                      src={item.file ? URL.createObjectURL(item.file) : item.image || '/no-image-placeholder.svg'}
                      alt={`Gallery ${item.slot}`}
                      className="h-24 w-full object-cover"
                    />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateGalleryFile(item.slot, e.target.files?.[0] || null)}
                    className="mt-2 block w-full text-xs text-[var(--tv-text-muted)] file:mr-2 file:rounded-full file:border-0 file:bg-[var(--tv-patina)] file:px-3 file:py-1.5 file:font-semibold file:text-[var(--tv-text)]"
                  />
                  <input
                    value={item.hoverText}
                    onChange={(e) => updateGalleryHover(item.slot, e.target.value)}
                    placeholder={`Image ${item.slot} hover text`}
                    className="mt-2 w-full rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] px-3 py-2 text-sm text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.55)]"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--tv-brass)] px-5 py-3 text-sm font-semibold text-[var(--tv-ink)] transition hover:from-[var(--tv-brass)] hover:to-[var(--tv-brass)] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Customer'}
        </button>
      </form>
    </main>
  );
}
