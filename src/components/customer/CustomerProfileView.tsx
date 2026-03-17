'use client';

import { useEffect, useMemo, useState } from 'react';

type GalleryItem = {
  id: string;
  image: string;
  hoverText?: string | null;
  slot: number;
};

type CustomerProfile = {
  id: string;
  name: string;
  designation?: string | null;
  company?: string | null;
  about?: string | null;
  phone: string;
  email: string;
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
  mailApiEndpoint?: string | null;
  address?: string | null;
  mapEmbedUrl?: string | null;
  logo?: string | null;
  profileImage?: string | null;
  slug: string;
  galleries: GalleryItem[];
};

interface CustomerProfileViewProps {
  customer: CustomerProfile;
}

interface ContactFormState {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

const DEFAULT_ABOUT =
  "We are here to help you grow with an NFC-powered digital profile. Reach out through the contact form and we will respond shortly.";

type MailDeliveryMode = 'internal' | 'endpoint' | 'web3forms';

function normalizeUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

function normalizeMapEmbedSrc(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const iframeSrcMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  const candidate = (iframeSrcMatch?.[1] || trimmed).replace(/&amp;/g, '&').trim();

  if (!candidate || (!candidate.startsWith('http://') && !candidate.startsWith('https://'))) {
    return null;
  }

  try {
    const parsed = new URL(candidate);
    const isGoogleHost = parsed.hostname === 'google.com' || parsed.hostname === 'www.google.com' || parsed.hostname.endsWith('.google.com');
    const isEmbedPath = parsed.pathname.startsWith('/maps/embed');
    return isGoogleHost && isEmbedPath ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function hasExplicitMailEndpoint(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return trimmed.startsWith('/api/') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function isWeb3FormsAccessKey(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(trimmed);
}

function getMailDeliveryMode(value?: string | null): MailDeliveryMode {
  if (hasExplicitMailEndpoint(value)) return 'endpoint';
  if (isWeb3FormsAccessKey(value)) return 'web3forms';
  return 'internal';
}

export default function CustomerProfileView({ customer }: CustomerProfileViewProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [form, setForm] = useState<ContactFormState>({ name: '', phone: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    return () => {
      document.body.classList.remove('dark');
    };
  }, [theme]);

  const gallerySlots = useMemo(() => {
    const ordered = [...customer.galleries].sort((a, b) => a.slot - b.slot).slice(0, 3);
    if (ordered.length === 0) return [];
    if (ordered.length >= 3) return ordered;

    const missing = [] as GalleryItem[];
    for (let i = ordered.length + 1; i <= 3; i += 1) {
      missing.push({
        id: `placeholder-${i}`,
        slot: i,
        image: '/no-image-placeholder.svg',
        hoverText: 'No Image',
      });
    }
    return [...ordered, ...missing].sort((a, b) => a.slot - b.slot);
  }, [customer.galleries]);

  const socialLinks = useMemo(
    () => [
      { key: 'whatsapp', enabled: customer.whatsappEnabled, url: normalizeUrl(customer.whatsapp), title: 'WhatsApp', icon: 'fab fa-whatsapp' },
      { key: 'instagram', enabled: customer.instagramEnabled, url: normalizeUrl(customer.instagram), title: 'Instagram', icon: 'fab fa-instagram' },
      { key: 'facebook', enabled: customer.facebookEnabled, url: normalizeUrl(customer.facebook), title: 'Facebook', icon: 'fab fa-facebook-f' },
      { key: 'linkedin', enabled: customer.linkedinEnabled, url: normalizeUrl(customer.linkedin), title: 'LinkedIn', icon: 'fab fa-linkedin-in' },
      { key: 'behance', enabled: customer.behanceEnabled, url: normalizeUrl(customer.behance), title: 'Behance', icon: 'fab fa-behance' },
      { key: 'website', enabled: customer.websiteEnabled, url: normalizeUrl(customer.website), title: 'Website', icon: 'fas fa-globe' },
    ].filter((item) => item.enabled && item.url),
    [customer]
  );

  const mapEmbedSrc = useMemo(() => normalizeMapEmbedSrc(customer.mapEmbedUrl), [customer.mapEmbedUrl]);
  const shopName = customer.company?.trim() || '';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const mailMode = getMailDeliveryMode(customer.mailApiEndpoint);

      const leadResponse = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          skipEmail: mailMode !== 'internal',
        }),
      });

      const leadPayload = await leadResponse.json();
      if (!leadResponse.ok) {
        throw new Error(leadPayload.error || 'Failed to submit message');
      }

      if (mailMode === 'endpoint') {
        const endpoint = customer.mailApiEndpoint!.trim();
        const emailResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: customer.email,
            name: form.name,
            email: form.email,
            phone: form.phone,
            subject: form.subject,
            message: form.message,
          }),
        });

        if (!emailResponse.ok) {
          throw new Error('Failed to send lead email');
        }
      }

      if (mailMode === 'web3forms') {
        const web3Response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: customer.mailApiEndpoint!.trim(),
            name: form.name,
            phone: form.phone,
            email: form.email,
            subject: form.subject?.trim() || `New enquiry for ${customer.name}`,
            message: form.message,
            from_name: customer.name,
          }),
        });

        const web3Payload = await web3Response.json().catch(() => ({} as { message?: string }));
        if (!web3Response.ok) {
          throw new Error(web3Payload.message || 'Failed to send lead email');
        }
      }

      setFeedback({ type: 'success', text: 'Your message has been sent successfully' });
      setForm({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Failed to submit message' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
      <style jsx global>{`
        /* =============================================
           PREMIUM DESIGN SYSTEM — CSS Variables
           ============================================= */
        :root {
          --digi-bg: #F8FAFC;
          --digi-card: #FFFFFF;
          --digi-text-primary: #0F172A;
          --digi-text-secondary: #475569;
          --digi-text-muted: #94A3B8;
          --digi-border: #E2E8F0;
          --digi-accent: #14B8A6;
          --digi-accent-hover: #0D9488;
          --digi-accent-soft: rgba(20, 184, 166, 0.08);
          --digi-accent-border: rgba(20, 184, 166, 0.2);
          --digi-input-bg: #FFFFFF;
          --digi-input-border: #E2E8F0;
          --digi-input-focus: #14B8A6;
          --digi-surface: #F1F5F9;
          --digi-overlay: rgba(15, 23, 42, 0.7);
          --digi-radius: 16px;
          --digi-radius-sm: 12px;
          --digi-radius-xs: 10px;
          --digi-transition: 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
          --digi-font: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        body.dark {
          --digi-bg: #0B1120;
          --digi-card: #111827;
          --digi-text-primary: #F1F5F9;
          --digi-text-secondary: #94A3B8;
          --digi-text-muted: #64748B;
          --digi-border: #1F2937;
          --digi-accent: #2DD4BF;
          --digi-accent-hover: #5EEAD4;
          --digi-accent-soft: rgba(45, 212, 191, 0.08);
          --digi-accent-border: rgba(45, 212, 191, 0.16);
          --digi-input-bg: #0F172A;
          --digi-input-border: #1E293B;
          --digi-input-focus: #2DD4BF;
          --digi-surface: #0F172A;
          --digi-overlay: rgba(0, 0, 0, 0.8);
        }

        * { box-sizing: border-box; }
        body { background: var(--digi-bg); }

        /* =============================================
           PAGE SHELL
           ============================================= */
        .digi-page-shell {
          min-height: 100vh;
          width: 100%;
          background: var(--digi-bg);
          padding: 24px 16px 40px;
          font-family: var(--digi-font);
        }

        .digi-card-container {
          max-width: 1140px;
          margin: 0 auto;
          background: var(--digi-card);
          border-radius: var(--digi-radius);
          overflow: hidden;
          border: 1px solid var(--digi-border);
        }

        /* =============================================
           NAVBAR — Clean, minimal
           ============================================= */
        .digi-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          border-bottom: 1px solid var(--digi-border);
          background: var(--digi-card);
        }

        .digi-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .digi-nav-logo-img {
          max-height: 40px;
          width: auto;
          object-fit: contain;
        }

        .digi-shop-name {
          color: var(--digi-text-primary);
          font-size: 0.938rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .digi-nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* =============================================
           THEME TOGGLE — Sun/Moon icon button
           ============================================= */
        .digi-theme-toggle { position: relative; }
        .digi-theme-switch { display: none; }
        .digi-toggle-label { cursor: pointer; display: block; }

        .digi-toggle-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--digi-surface);
          border: 1px solid var(--digi-border);
          transition: all var(--digi-transition);
        }

        .digi-toggle-btn:hover {
          border-color: var(--digi-accent);
        }

        .digi-toggle-btn svg {
          width: 20px;
          height: 20px;
          transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .digi-sun-icon {
          color: #F59E0B;
          display: block;
        }

        .digi-moon-icon {
          color: var(--digi-accent);
          display: none;
        }

        body.dark .digi-sun-icon {
          display: none;
        }

        body.dark .digi-moon-icon {
          display: block;
        }

        body.dark .digi-toggle-btn {
          background: rgba(45, 212, 191, 0.08);
          border-color: rgba(45, 212, 191, 0.2);
        }

        /* =============================================
           PROFILE SECTION — Modern split layout
           ============================================= */
        .digi-main-content { padding: 0; }

        .digi-profile-section {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 48px;
          padding: 64px 48px;
          align-items: start;
          background: var(--digi-card);
        }

        .digi-profile-image img {
          width: 100%;
          border-radius: var(--digi-radius);
          object-fit: cover;
          aspect-ratio: 1/1;
          border: 1px solid var(--digi-border);
        }

        .digi-name {
          font-family: var(--digi-font);
          font-size: 2.25rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.15;
          margin: 0 0 8px;
          color: var(--digi-text-primary);
        }

        .digi-company {
          margin: 0 0 28px;
          font-size: 1.0625rem;
          font-weight: 400;
          color: var(--digi-text-secondary);
          letter-spacing: -0.005em;
        }

        .digi-about-title {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--digi-accent);
          margin: 0 0 10px;
        }

        .digi-about-text {
          margin: 0;
          color: var(--digi-text-secondary);
          font-size: 0.9375rem;
          line-height: 1.75;
          letter-spacing: 0.005em;
        }

        /* =============================================
           SOCIAL ICONS
           ============================================= */
        .digi-social-icons {
          margin-top: 28px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .digi-social-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 1rem;
          color: var(--digi-accent);
          background: var(--digi-accent-soft);
          border: 1px solid var(--digi-accent-border);
          transition: all var(--digi-transition);
        }

        .digi-social-icon:hover {
          background: var(--digi-accent);
          color: #fff;
          border-color: var(--digi-accent);
          transform: translateY(-2px);
        }

        /* =============================================
           GALLERY — Clean responsive grid
           ============================================= */
        .digi-works-section {
          padding: 80px 48px;
          background: var(--digi-surface);
          border-top: 1px solid var(--digi-border);
          border-bottom: 1px solid var(--digi-border);
        }

        .digi-works-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .digi-works-title {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--digi-text-primary);
        }

        .digi-works-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .digi-work-item {
          position: relative;
          border-radius: var(--digi-radius-sm);
          overflow: hidden;
          border: 1px solid var(--digi-border);
          transition: transform var(--digi-transition), border-color var(--digi-transition);
        }

        .digi-work-item:hover {
          transform: scale(1.02);
          border-color: var(--digi-accent);
        }

        .digi-work-item img {
          width: 100%;
          height: 240px;
          object-fit: cover;
          display: block;
          transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .digi-work-item:hover img {
          transform: scale(1.04);
        }

        .digi-work-overlay {
          position: absolute;
          inset: auto 0 0 0;
          background: linear-gradient(to top, var(--digi-overlay), transparent);
          color: white;
          padding: 20px 16px;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .digi-work-item:hover .digi-work-overlay {
          transform: translateY(0);
        }

        .digi-work-overlay p {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.005em;
        }

        /* =============================================
           CONTACT/FORM SECTION — Split layout
           ============================================= */
        .digi-form-section {
          padding: 80px 48px;
          background: var(--digi-card);
        }

        .digi-form-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .digi-form-main-title {
          margin: 0 0 12px;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--digi-text-primary);
        }

        .digi-form-subtitle {
          margin: 0;
          color: var(--digi-text-muted);
          font-size: 0.9375rem;
          line-height: 1.6;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
        }

        .digi-form-content {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 48px;
          align-items: start;
        }

        /* Contact details */
        .digi-talk-title {
          margin: 0 0 8px;
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--digi-text-primary);
        }

        .digi-talk-text {
          margin: 0 0 28px;
          color: var(--digi-text-secondary);
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .digi-contact-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .digi-contact-detail-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: var(--digi-radius-xs);
          background: var(--digi-surface);
          border: 1px solid var(--digi-border);
          transition: border-color var(--digi-transition);
        }

        .digi-contact-detail-item:hover {
          border-color: var(--digi-accent);
        }

        .digi-detail-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .digi-detail-icon.phone { background: var(--digi-accent); }
        .digi-detail-icon.email { background: var(--digi-accent); }
        .digi-detail-icon.location { background: var(--digi-accent); }

        .digi-contact-link {
          color: var(--digi-text-primary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.5;
          word-break: break-word;
          transition: color var(--digi-transition);
        }

        .digi-contact-link:hover {
          color: var(--digi-accent);
        }

        .digi-phone-numbers {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* =============================================
           FORM — Modern inputs
           ============================================= */
        .digi-contact-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .digi-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .digi-form-group input,
        .digi-form-group textarea {
          width: 100%;
          border: 1px solid var(--digi-input-border);
          border-radius: var(--digi-radius-xs);
          padding: 13px 16px;
          font-family: var(--digi-font);
          font-size: 0.875rem;
          background: var(--digi-input-bg);
          color: var(--digi-text-primary);
          outline: none;
          transition: border-color var(--digi-transition), box-shadow var(--digi-transition);
        }

        .digi-form-group input::placeholder,
        .digi-form-group textarea::placeholder {
          color: var(--digi-text-muted);
        }

        .digi-form-group input:focus,
        .digi-form-group textarea:focus {
          border-color: var(--digi-input-focus);
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
        }

        .digi-submit-btn {
          border: 0;
          border-radius: var(--digi-radius-xs);
          background: var(--digi-accent);
          color: #fff;
          padding: 13px 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--digi-font);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background var(--digi-transition), transform var(--digi-transition);
        }

        .digi-submit-btn:hover {
          background: var(--digi-accent-hover);
          transform: translateY(-1px);
        }

        .digi-submit-btn:active {
          transform: translateY(0);
        }

        .digi-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* =============================================
           MAP
           ============================================= */
        .digi-map-section {
          padding: 0 48px 48px;
          background: var(--digi-card);
        }

        .digi-map-section iframe {
          border-radius: var(--digi-radius-sm);
          border: 1px solid var(--digi-border);
        }

        /* =============================================
           FOOTER — Minimal
           ============================================= */
        .digi-footer {
          background: var(--digi-surface);
          color: var(--digi-text-muted);
          text-align: center;
          padding: 20px 24px;
          font-size: 0.8125rem;
          border-top: 1px solid var(--digi-border);
          letter-spacing: 0.005em;
        }

        .digi-brand-name {
          color: var(--digi-accent);
          text-decoration: none;
          font-weight: 600;
          transition: color var(--digi-transition);
        }

        .digi-brand-name:hover {
          color: var(--digi-accent-hover);
        }

        /* =============================================
           FEEDBACK MESSAGES
           ============================================= */
        .digi-message {
          border-radius: var(--digi-radius-xs);
          padding: 12px 16px;
          font-size: 0.8125rem;
          font-weight: 500;
          line-height: 1.5;
        }

        .digi-message.success {
          background: rgba(20, 184, 166, 0.08);
          color: #0D9488;
          border: 1px solid rgba(20, 184, 166, 0.15);
        }

        .digi-message.error {
          background: rgba(239, 68, 68, 0.08);
          color: #DC2626;
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        /* =============================================
           RESPONSIVE — Tablet
           ============================================= */
        @media (max-width: 900px) {
          .digi-page-shell { padding: 16px 12px 24px; }

          .digi-profile-section {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 48px 28px;
            text-align: center;
          }

          .digi-profile-image img {
            max-width: 280px;
            margin: 0 auto;
          }

          .digi-social-icons { justify-content: center; }

          .digi-form-content { grid-template-columns: 1fr; gap: 40px; }
          .digi-form-row { grid-template-columns: 1fr 1fr; }

          .digi-works-grid { grid-template-columns: repeat(2, 1fr); }

          .digi-works-section,
          .digi-form-section { padding-left: 28px; padding-right: 28px; }

          .digi-map-section { padding-left: 28px; padding-right: 28px; }

          .digi-navbar { padding: 14px 20px; }
        }

        /* =============================================
           RESPONSIVE — Mobile
           ============================================= */
        @media (max-width: 540px) {
          .digi-page-shell { padding: 12px 8px 20px; }

          .digi-profile-section { padding: 36px 20px; gap: 24px; }

          .digi-name { font-size: 1.75rem; }

          .digi-works-section { padding: 48px 20px; }
          .digi-works-grid { grid-template-columns: 1fr; }

          .digi-form-section { padding: 48px 20px; }
          .digi-form-row { grid-template-columns: 1fr; }

          .digi-map-section { padding: 0 20px 32px; }
        }
      `}</style>

      <div className="digi-page-shell">
      <div className="digi-card-container">
        <nav className="digi-navbar">
          <a href="#" className="digi-logo">
            <img src={customer.logo || '/no-image-placeholder.svg'} alt="Logo" className="digi-nav-logo-img" />
            {shopName ? <span className="digi-shop-name">{shopName}</span> : null}
          </a>
          <div className="digi-nav-right">
            <div className="digi-theme-toggle">
              <input
                type="checkbox"
                id="theme-switch"
                className="digi-theme-switch"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <label htmlFor="theme-switch" className="digi-toggle-label" aria-label="Toggle theme">
                <div className="digi-toggle-btn">
                  <svg className="digi-sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                  <svg className="digi-moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
              </label>
            </div>
          </div>
        </nav>

        <main className="digi-main-content">
          <section className="digi-profile-section" id="about">
            <div className="digi-profile-image">
              <img src={customer.profileImage || '/no-image-placeholder.svg'} alt={customer.name} />
            </div>
            <div className="digi-profile-info">
              <h1 className="digi-name">{customer.name}</h1>
              <p className="digi-company">{[customer.designation, customer.company].filter(Boolean).join(' · ') || 'NFC Digital Profile'}</p>

              <div className="digi-about-section">
                <h2 className="digi-about-title">About</h2>
                <p className="digi-about-text">{customer.about || DEFAULT_ABOUT}</p>
              </div>

              {socialLinks.length > 0 ? (
                <div className="digi-social-icons">
                  {socialLinks.map((social) => (
                    <a key={social.key} href={social.url || '#'} className="digi-social-icon" target="_blank" rel="noopener noreferrer" title={social.title}>
                      <i className={social.icon}></i>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          {gallerySlots.length > 0 ? (
            <section className="digi-works-section" id="works">
              <div className="digi-works-header">
                <h2 className="digi-works-title">Gallery</h2>
              </div>
              <div className="digi-works-grid">
                {gallerySlots.map((gallery, index) => (
                  <div key={gallery.id} className="digi-work-item">
                    <img src={gallery.image || '/no-image-placeholder.svg'} alt={`Gallery ${index + 1}`} />
                    <div className="digi-work-overlay">
                      <p>{gallery.hoverText || 'No Image'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="digi-form-section" id="contact">
            <div className="digi-form-header">
              <h2 className="digi-form-main-title">Get in Touch</h2>
              <p className="digi-form-subtitle">Have a question or want to work together? Send us a message and we&apos;ll get back to you shortly.</p>
            </div>

            <div className="digi-form-content">
              <div className="digi-form-left">
                <h3 className="digi-talk-title">Contact Details</h3>
                <p className="digi-talk-text">Reach out directly or fill in the form — we&apos;d love to hear from you.</p>

                <div className="digi-contact-details">
                  <div className="digi-contact-detail-item">
                    <div className="digi-detail-icon phone"><i className="fas fa-phone-alt"></i></div>
                    <div className="digi-phone-numbers">
                      <a href={`tel:${customer.phone}`} className="digi-contact-link">{customer.phone}</a>
                    </div>
                  </div>
                  <div className="digi-contact-detail-item">
                    <div className="digi-detail-icon email"><i className="fas fa-envelope"></i></div>
                    <a href={`mailto:${customer.email}`} className="digi-contact-link">{customer.email}</a>
                  </div>
                  {customer.address ? (
                    <div className="digi-contact-detail-item">
                      <div className="digi-detail-icon location"><i className="fas fa-map-marker-alt"></i></div>
                      <span className="digi-contact-link">{customer.address}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="digi-form-right">
                <form className="digi-contact-form" onSubmit={handleSubmit}>
                  <div className="digi-form-row">
                    <div className="digi-form-group">
                      <input type="text" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Your Name" required />
                    </div>
                    <div className="digi-form-group">
                      <input type="tel" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} placeholder="Phone Number" required />
                    </div>
                  </div>
                  <div className="digi-form-row">
                    <div className="digi-form-group">
                      <input type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} placeholder="Your Email" required />
                    </div>
                    <div className="digi-form-group">
                      <input type="text" value={form.subject} onChange={(e) => setForm((c) => ({ ...c, subject: e.target.value }))} placeholder="Subject" />
                    </div>
                  </div>
                  <div className="digi-form-group">
                    <textarea value={form.message} onChange={(e) => setForm((c) => ({ ...c, message: e.target.value }))} placeholder="Your Message" rows={5} required></textarea>
                  </div>

                  {feedback ? <div className={`digi-message ${feedback.type}`}>{feedback.text}</div> : null}

                  <button type="submit" className="digi-submit-btn" disabled={submitting}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"></path>
                    </svg>
                    <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              </div>
            </div>
          </section>

          {mapEmbedSrc ? (
            <section className="digi-map-section">
              <iframe
                src={mapEmbedSrc}
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </section>
          ) : null}
        </main>

        <footer className="digi-footer">
          <p className="digi-footer-copyright">
            &copy; {new Date().getFullYear()} All Rights Reserved. Designed &amp; Developed by{' '}
            <a href="https://tapvyo.com" target="_blank" rel="noopener noreferrer" className="digi-brand-name">Tapvyo.</a>
          </p>
        </footer>
      </div>
      </div>
    </>
  );
}
