'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Copy, ExternalLink, Loader2, UploadCloud } from 'lucide-react';
import AdminToast from '@/components/admin/AdminToast';

interface GallerySlot {
  file: File | null;
  hoverText: string;
}

interface FormState {
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
  logo: File | null;
  profileImage: File | null;
  gallerySlots: GallerySlot[];
}

interface CreatedState {
  slug: string;
  link: string;
}

type ToastState = {
  variant: 'success' | 'error' | 'info';
  message: string;
};

const defaultGallerySlots = () => Array.from({ length: 6 }, () => ({ file: null, hoverText: '' }));

export default function CreateCustomerPage() {
  const [form, setForm] = useState<FormState>({
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
    logo: null,
    profileImage: null,
    gallerySlots: defaultGallerySlots(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [created, setCreated] = useState<CreatedState | null>(null);

  const logoPreview = useMemo(() => (form.logo ? URL.createObjectURL(form.logo) : null), [form.logo]);
  const profilePreview = useMemo(() => (form.profileImage ? URL.createObjectURL(form.profileImage) : null), [form.profileImage]);
  const galleryPreviews = useMemo(
    () => form.gallerySlots.map((slot) => (slot.file ? URL.createObjectURL(slot.file) : null)),
    [form.gallerySlots]
  );

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

  const handleTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setForm((current) => ({ ...current, [name]: checked }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = event.target;
    if (!files) return;

    if (name === 'logo' || name === 'profileImage') {
      setForm((current) => ({ ...current, [name]: files[0] || null }));
      return;
    }

    if (name.startsWith('galleryImage')) {
      const slotIndex = Number(name.replace('galleryImage', '')) - 1;
      setForm((current) => {
        const updatedSlots = [...current.gallerySlots];
        updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], file: files[0] || null };
        return { ...current, gallerySlots: updatedSlots };
      });
    }
  };

  const handleGalleryHoverText = (index: number, value: string) => {
    setForm((current) => {
      const updatedSlots = [...current.gallerySlots];
      updatedSlots[index] = { ...updatedSlots[index], hoverText: value };
      return { ...current, gallerySlots: updatedSlots };
    });
  };

  const copyLink = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.link);
      setToast({ variant: 'success', message: 'NFC link copied to clipboard' });
    } catch {
      setToast({ variant: 'error', message: 'Failed to copy NFC link' });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setToast(null);

    try {
      const body = new FormData();
      body.append('name', form.name);
      body.append('designation', form.designation);
      body.append('company', form.company);
      body.append('about', form.about);
      body.append('phone', form.phone);
      body.append('email', form.email);
      body.append('mailApiEndpoint', form.mailApiEndpoint);
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
      body.append('isActive', 'true');

      if (form.logo) body.append('logo', form.logo);
      if (form.profileImage) body.append('profileImage', form.profileImage);

      form.gallerySlots.forEach((slot, index) => {
        if (slot.file) {
          body.append(`galleryImage${index + 1}`, slot.file);
        }
        body.append(`galleryHoverText${index + 1}`, slot.hoverText);
      });

      const response = await fetch('/api/customers', {
        method: 'POST',
        credentials: 'include',
        body,
      });

      const rawPayload = await response.text();
      let payload: any = {};
      try {
        payload = rawPayload ? JSON.parse(rawPayload) : {};
      } catch {
        payload = {};
      }

      if (!response.ok) {
        const detailsMessage = typeof payload?.details?.message === 'string' ? payload.details.message : '';
        throw new Error(payload.error || detailsMessage || 'Failed to create customer');
      }

      setCreated({ slug: payload.slug, link: payload.link });
      setToast({ variant: 'success', message: 'Customer created and NFC link generated successfully' });
      setForm({
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
        logo: null,
        profileImage: null,
        gallerySlots: defaultGallerySlots(),
      });
    } catch (error) {
      setToast({ variant: 'error', message: error instanceof Error ? error.message : 'Failed to create customer' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Create NFC Customer</h1>
        <p className="mt-1 text-sm text-gray-400">This form creates the profile website, social icons, gallery cards, and NFC link.</p>
      </div>

      {toast ? <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

      {created ? (
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Generated NFC Link</p>
          <p className="mt-3 break-all text-base font-medium text-white">{created.link}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-orange-100">
              <Copy className="h-4 w-4" /> Copy Link
            </button>
            <Link href={created.link} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              <ExternalLink className="h-4 w-4" /> Open Profile
            </Link>
          </div>
        </section>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/5 bg-[#161b2e] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-200">Name
            <input name="name" value={form.name} onChange={handleTextChange} required className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Designation
            <input name="designation" value={form.designation} onChange={handleTextChange} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Company
            <input name="company" value={form.company} onChange={handleTextChange} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Phone
            <input name="phone" value={form.phone} onChange={handleTextChange} required className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Email
            <input name="email" type="email" value={form.email} onChange={handleTextChange} required className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Mail API Endpoint
            <input name="mailApiEndpoint" value={form.mailApiEndpoint} onChange={handleTextChange} placeholder="https://api.tapvyo.com/send-mail" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
          <label className="block text-sm font-medium text-gray-200">Address
            <input name="address" value={form.address} onChange={handleTextChange} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-200">About Us
          <textarea name="about" value={form.about} onChange={handleTextChange} className="mt-2 min-h-36 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
        </label>

        <label className="block text-sm font-medium text-gray-200">Google Maps Embed URL (optional)
          <input name="mapEmbedUrl" value={form.mapEmbedUrl} onChange={handleTextChange} placeholder="https://www.google.com/maps/embed?..." className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1424] px-4 py-3 text-white outline-none focus:border-orange-400" />
        </label>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0f1424] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Social Media Links</h3>
          {socialFields.map((field) => {
            const enabledKey = `${field.key}Enabled` as keyof FormState;
            const valueKey = field.key as keyof FormState;
            const enabled = Boolean(form[enabledKey]);
            return (
              <div key={field.key} className="grid gap-3 md:grid-cols-[130px_1fr] md:items-center">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-200">
                  <input type="checkbox" checked={enabled} onChange={(e) => handleToggleChange(enabledKey, e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-[#0f1424]" />
                  {field.label}
                </label>
                <input
                  value={String(form[valueKey] || '')}
                  onChange={(e) => handleTextChange({ target: { name: valueKey as string, value: e.target.value } } as ChangeEvent<HTMLInputElement>)}
                  disabled={!enabled}
                  placeholder={`${field.label} URL`}
                  className="w-full rounded-xl border border-white/10 bg-[#161b2e] px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                />
              </div>
            );
          })}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-[#0f1424] p-5 text-sm font-medium text-gray-200">
            <span className="mb-3 flex items-center gap-2 text-orange-300"><UploadCloud className="h-4 w-4" /> Logo Upload</span>
            <input type="file" name="logo" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-400" />
            {logoPreview ? <Image src={logoPreview} alt="Logo preview" width={200} height={120} className="mt-4 h-24 w-auto rounded-xl bg-white object-contain p-2" /> : null}
          </label>

          <label className="block rounded-2xl border border-dashed border-white/15 bg-[#0f1424] p-5 text-sm font-medium text-gray-200">
            <span className="mb-3 flex items-center gap-2 text-orange-300"><UploadCloud className="h-4 w-4" /> Profile Photo</span>
            <input type="file" name="profileImage" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-400" />
            {profilePreview ? <Image src={profilePreview} alt="Profile preview" width={180} height={180} className="mt-4 h-32 w-32 rounded-2xl object-cover" /> : null}
          </label>
        </div>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0f1424] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Gallery (6 Slots)</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {form.gallerySlots.map((slot, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-[#161b2e] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Image Box {index + 1}</p>
                <input type="file" name={`galleryImage${index + 1}`} accept="image/*" onChange={handleFileChange} className="block w-full text-xs text-gray-400 file:mr-2 file:rounded-full file:border-0 file:bg-orange-500 file:px-3 file:py-1.5 file:font-semibold file:text-white" />
                <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-[#0f1424]">
                  {galleryPreviews[index] ? (
                    <Image src={galleryPreviews[index] as string} alt={`Gallery ${index + 1}`} width={400} height={220} className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-xs font-semibold uppercase tracking-wider text-gray-500">No Image</div>
                  )}
                </div>
                <input value={slot.hoverText} onChange={(e) => handleGalleryHoverText(index, e.target.value)} placeholder="Hover text" className="mt-3 w-full rounded-lg border border-white/10 bg-[#0f1424] px-3 py-2 text-xs text-white outline-none focus:border-orange-400" />
              </div>
            ))}
          </div>
        </section>

        <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? 'Creating Customer...' : 'Create Customer and Generate NFC Link'}
        </button>
      </form>
    </main>
  );
}
