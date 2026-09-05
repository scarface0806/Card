'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AdminToast from '@/components/admin/AdminToast';
import ImageUpload from '@/components/admin/ImageUpload';
import { isAbortError } from '@/lib/fetch-utils';

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
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="tv-adm-page-title">Edit Customer</h1>
          <p className="tv-adm-page-sub mt-1">Update profile details, social links, status, and gallery hover text.</p>
        </div>
        <Link href="/admin/customers" className="tv-btn tv-btn-secondary !min-h-[42px] !text-sm w-fit">
          Back to customers
        </Link>
      </div>

      {toast ? <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

      {/* One panel per group of fields, matching the rest of the admin. The
          whole form used to be a single undivided card, so a long page of
          inputs read as one undifferentiated wall. The repeated inline class
          strings are gone too - `.tv-adm-input` is the same declaration, kept
          in one place. */}
      <form onSubmit={handleSave} className="space-y-5">
        <section className="tv-adm-panel">
          <div className="tv-adm-panel-head">
            <h2 className="tv-adm-panel-title">Details</h2>
          </div>
          <div className="tv-adm-panel-pad grid gap-4 md:grid-cols-2">
            <label className="tv-adm-field-label">Name
              <input value={form.name} onChange={(e) => setText('name', e.target.value)} className="tv-adm-input mt-2" required />
            </label>
            <label className="tv-adm-field-label">Designation
              <input value={form.designation} onChange={(e) => setText('designation', e.target.value)} className="tv-adm-input mt-2" />
            </label>
            <label className="tv-adm-field-label">Company
              <input value={form.company} onChange={(e) => setText('company', e.target.value)} className="tv-adm-input mt-2" />
            </label>
            <label className="tv-adm-field-label">Phone
              {/* Digits and separators only - the field used to accept letters.
                  Editing this does NOT move the profile URL: the slug was fixed
                  when the customer was created and may already be written to a
                  physical NFC chip. */}
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setText('phone', e.target.value.replace(/[^0-9+() -]/g, ''))}
                className="tv-adm-input mt-2"
                required
                minLength={6}
                maxLength={30}
              />
            </label>
            <label className="tv-adm-field-label">Email
              <input type="email" value={form.email} onChange={(e) => setText('email', e.target.value)} className="tv-adm-input mt-2" required />
            </label>
            <label className="tv-adm-field-label">Mail API Key
              <input value={form.mailApiEndpoint} onChange={(e) => setText('mailApiEndpoint', e.target.value)} placeholder="d494ff75-8a82-40e6-b14a-d6d7056238d3" className="tv-adm-input mt-2" />
              <span className="tv-adm-meta mt-1.5 block text-xs normal-case tracking-normal">
                Leave empty and the profile shows no enquiry form - only phone, email and address.
              </span>
            </label>
            <label className="tv-adm-field-label">Status
              <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setToggle('isActive', e.target.value === 'active')} className="tv-adm-select mt-2">
                <option value="active">Active</option>
                <option value="inactive">Disabled</option>
              </select>
            </label>
          </div>
        </section>

        <section className="tv-adm-panel">
          <div className="tv-adm-panel-head">
            <h2 className="tv-adm-panel-title">About</h2>
          </div>
          <div className="tv-adm-panel-pad">
            <label className="tv-adm-field-label">About Us
              <textarea value={form.about} onChange={(e) => setText('about', e.target.value)} className="tv-adm-textarea mt-2" />
            </label>
          </div>
        </section>

        <section className="tv-adm-panel">
          <div className="tv-adm-panel-head">
            <h2 className="tv-adm-panel-title">Photo &amp; location</h2>
          </div>
          <div className="tv-adm-panel-pad grid gap-5 md:grid-cols-[240px_1fr] md:items-start">
            {/* The uploader used to span the full width of the form. A square
                aspect ratio across that width rendered the profile photo as an
                enormous block that pushed every field below it off screen. It
                is now a fixed thumbnail column with the address fields beside
                it, so the whole group fits on one screen. */}
            <ImageUpload
              folder="admin/customers"
              label="Customer Profile Photo"
              aspectRatio="square"
              currentImageUrl={form.imageUrl || undefined}
              onUploadComplete={(url) => setText('imageUrl', url)}
            />

            <div className="grid gap-4">
              <label className="tv-adm-field-label">Address
                <input value={form.address} onChange={(e) => setText('address', e.target.value)} className="tv-adm-input mt-2" />
              </label>
              <label className="tv-adm-field-label">Google Maps Embed URL
                <input value={form.mapEmbedUrl} onChange={(e) => setText('mapEmbedUrl', e.target.value)} placeholder="https://www.google.com/maps/embed?..." className="tv-adm-input mt-2" />
                <span className="tv-adm-meta mt-1.5 block text-xs normal-case tracking-normal">
                  Leave empty and the profile shows no map.
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="tv-adm-panel">
          <div className="tv-adm-panel-head">
            <h2 className="tv-adm-panel-title">Social links</h2>
            <span className="tv-adm-count">
              {socialFields.filter((field) => Boolean(form[`${field.key}Enabled` as keyof FormState])).length} enabled
            </span>
          </div>
          <div className="tv-adm-panel-pad space-y-3">
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
                <input value={value} disabled={!isEnabled} onChange={(e) => setText(valueKey, e.target.value)} placeholder={`${field.label} URL`} className="tv-adm-input disabled:cursor-not-allowed disabled:opacity-40" />
              </div>
            );
          })}
          </div>
        </section>

        <section className="tv-adm-panel">
          <div className="tv-adm-panel-head">
            <h2 className="tv-adm-panel-title">Gallery</h2>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--tv-text)]">
              <input type="checkbox" checked={form.enableGallery} onChange={(e) => setToggle('enableGallery', e.target.checked)} className="h-4 w-4 rounded border-[rgba(241,243,241,0.18)] bg-[rgba(7,10,9,0.55)]" />
              Enable gallery
            </label>
          </div>

          {form.enableGallery ? (
            <div className="tv-adm-panel-pad grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {form.gallery.map((item) => (
                <div key={item.slot} className="rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] p-3">
                  <p className="tv-adm-label">Image {item.slot}</p>
                  {/* Fixed 16:10 frame. The preview is a thumbnail confirming
                      which picture is in the slot, not a viewer. */}
                  <div className="mt-2 aspect-[16/10] overflow-hidden rounded-lg border border-[var(--tv-rule)] bg-[var(--tv-graphite)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.file ? URL.createObjectURL(item.file) : item.image || '/no-image-placeholder.svg'}
                      alt={`Gallery ${item.slot}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateGalleryFile(item.slot, e.target.files?.[0] || null)}
                    className="mt-3 block w-full text-xs text-[var(--tv-text-muted)] file:mr-2 file:rounded-full file:border-0 file:bg-[var(--tv-patina)] file:px-3 file:py-1.5 file:font-semibold file:text-[var(--tv-ink)]"
                  />
                  <input
                    value={item.hoverText}
                    onChange={(e) => updateGalleryHover(item.slot, e.target.value)}
                    placeholder={`Image ${item.slot} hover text`}
                    className="tv-adm-input mt-2"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="tv-adm-panel-pad">
              <p className="tv-adm-meta text-xs">Gallery is off. The profile shows no image strip.</p>
            </div>
          )}
        </section>

        {/* Actions sit on their own bar rather than floating under the last
            field, and the save button uses the standard gilded CTA - the old
            one carried `hover:from-*`/`hover:to-*` gradient stops on an element
            with no gradient, so its hover state did nothing at all. */}
        <div className="flex flex-col-reverse items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-end">
          <Link href="/admin/customers" className="tv-btn tv-btn-secondary !min-h-[42px] !text-sm justify-center">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="tv-btn tv-btn-gilded !min-h-[42px] !text-sm justify-center disabled:cursor-not-allowed disabled:opacity-70">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </main>
  );
}
