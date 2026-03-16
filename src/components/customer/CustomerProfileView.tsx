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

export default function CustomerProfileView({ customer }: CustomerProfileViewProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
          skipEmail: true,
        }),
      });

      const leadPayload = await leadResponse.json();
      if (!leadResponse.ok) {
        throw new Error(leadPayload.error || 'Failed to submit message');
      }

      const endpoint = customer.mailApiEndpoint?.trim() || '/api/send-lead-mail';
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

      let emailPayload: { error?: string } = {};
      try {
        emailPayload = await emailResponse.json();
      } catch {
        emailPayload = {};
      }

      if (!emailResponse.ok) {
        throw new Error(emailPayload.error || 'Failed to send email');
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
        :root {
          --primary-green: #00b894;
          --primary-red: #e74c3c;
          --dark-bg: #2d3436;
          --white: #ffffff;
          --light-gray: #f5f6fa;
          --gray: #636e72;
          --dark-text: #2d3436;
          --border-color: #e0e0e0;
          --card-bg: #ffffff;
          --body-bg: #f0f0f0;
        }

        body.dark {
          --white: #0d0d1a;
          --light-gray: #1a1a2e;
          --gray: #8b8b9e;
          --dark-text: #f0f0f5;
          --border-color: rgba(0, 184, 148, 0.15);
          --card-bg: #12121f;
          --body-bg: #08080f;
        }

        * { box-sizing: border-box; }
        body { background: var(--body-bg); }

        .digi-card-container {
          max-width: 1000px;
          margin: 20px auto;
          background: var(--white);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .digi-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
          border-bottom: 1px solid var(--border-color);
          background: var(--white);
        }

        .digi-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .digi-nav-logo-img {
          max-height: 45px;
          width: auto;
          object-fit: contain;
        }

        .digi-shop-name {
          color: var(--dark-text);
          font-size: 1rem;
          font-weight: 700;
          line-height: 1;
        }

        .digi-nav-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .digi-theme-toggle {
          position: relative;
        }

        .digi-theme-switch {
          display: none;
        }

        .digi-toggle-label {
          cursor: pointer;
          display: block;
        }

        .digi-toggle-bg {
          width: 80px;
          height: 40px;
          background: linear-gradient(180deg, #f9d976 0%, #f39f86 50%, #e8b574 100%);
          border-radius: 40px;
          position: relative;
          overflow: hidden;
          transition: all 0.5s ease;
        }

        .digi-toggle-circle {
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          top: 4px;
          left: 4px;
          background: #fff;
          transition: transform 0.35s ease;
        }

        body.dark .digi-toggle-bg {
          background: linear-gradient(180deg, #1f2a44 0%, #121a2f 100%);
        }

        body.dark .digi-toggle-circle {
          transform: translateX(40px);
          background: #d2ddff;
        }

        .digi-main-content { padding: 0; }

        .digi-profile-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 35px;
          padding: 48px 40px;
          align-items: center;
        }

        .digi-profile-image img {
          width: 100%;
          border-radius: 22px;
          object-fit: cover;
          aspect-ratio: 1/1;
        }

        .digi-name { font-size: 2rem; margin: 0 0 6px; color: #1c1c1c; }
        .digi-company { margin: 0 0 22px; font-size: 1.1rem; color: #666; }
        .digi-about-title { margin: 0 0 10px; }
        .digi-about-text { margin: 0; color: #4a4a4a; line-height: 1.7; }

        .digi-social-icons {
          margin-top: 22px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .digi-social-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #00b894;
          background: rgba(0, 184, 148, 0.1);
          border: 1px solid rgba(0, 184, 148, 0.2);
          transition: all 0.3s ease;
        }

        .digi-social-icon:hover { transform: translateY(-2px); background: #00b894; color: white; }

        .digi-works-section { padding: 45px 40px; background: #fbfbfb; }
        .digi-works-header { text-align: center; margin-bottom: 24px; }
        .digi-works-title { margin: 0 0 8px; }
        .digi-works-subtitle { margin: 0; color: #666; }

        .digi-works-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .digi-work-item {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
        }

        .digi-work-item img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          display: block;
        }

        .digi-work-overlay {
          position: absolute;
          inset: auto 0 0 0;
          background: linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0));
          color: white;
          padding: 16px 14px;
          transform: translateY(100%);
          transition: transform 0.25s ease;
        }

        .digi-work-item:hover .digi-work-overlay { transform: translateY(0); }
        .digi-work-overlay h4 { margin: 0 0 4px; font-size: 0.95rem; }
        .digi-work-overlay p { margin: 0; font-size: 0.82rem; opacity: 0.9; }

        .digi-form-section { padding: 45px 40px; }
        .digi-form-header { text-align: center; margin-bottom: 30px; }
        .digi-form-main-title { margin: 0 0 10px; }
        .digi-form-subtitle { margin: 0; color: #666; }

        .digi-form-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }

        .digi-talk-title { margin: 0 0 10px; }
        .digi-talk-text { margin: 0 0 20px; color: #666; }

        .digi-contact-details { display: flex; flex-direction: column; gap: 12px; }
        .digi-contact-detail-item { display: flex; align-items: flex-start; gap: 12px; }
        .digi-detail-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
          margin-top: 2px;
        }
        .digi-detail-icon.phone { background: #2d9cdb; }
        .digi-detail-icon.email { background: #eb5757; }
        .digi-detail-icon.location { background: #27ae60; }

        .digi-contact-link {
          color: #2d3436;
          text-decoration: none;
          line-height: 1.6;
          word-break: break-word;
        }

        .digi-contact-link:hover { color: #00b894; }

        .digi-phone-numbers { display: flex; flex-direction: column; gap: 3px; }

        .digi-contact-form { display: flex; flex-direction: column; gap: 12px; }
        .digi-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .digi-form-group input,
        .digi-form-group textarea {
          width: 100%;
          border: 1.5px solid #dadada;
          border-radius: 10px;
          padding: 12px 13px;
          font: inherit;
          outline: none;
          transition: border-color .2s ease;
        }
        .digi-form-group input:focus,
        .digi-form-group textarea:focus { border-color: #00b894; }

        .digi-submit-btn {
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
          color: white;
          padding: 12px 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .digi-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .digi-map-section { padding: 0 40px 40px; }
        .digi-map-section iframe { border-radius: 14px; }

        .digi-footer {
          background: #111;
          color: #ddd;
          text-align: center;
          padding: 18px 20px;
          font-size: 0.92rem;
        }

        .digi-brand-name { color: #00cec9; text-decoration: none; }

        .digi-message {
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.88rem;
        }

        .digi-message.success { background: rgba(39, 174, 96, 0.12); color: #27ae60; }
        .digi-message.error { background: rgba(235, 87, 87, 0.12); color: #eb5757; }

        @media (max-width: 900px) {
          .digi-profile-section,
          .digi-form-content,
          .digi-form-row { grid-template-columns: 1fr; }

          .digi-works-grid { grid-template-columns: repeat(2, 1fr); }
          .digi-profile-section,
          .digi-works-section,
          .digi-form-section,
          .digi-map-section { padding-left: 20px; padding-right: 20px; }
        }

        @media (max-width: 540px) {
          .digi-works-grid { grid-template-columns: 1fr; }
        }
      `}</style>

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
                <div className="digi-toggle-bg">
                  <div className="digi-toggle-circle"></div>
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
              <p className="digi-company">{[customer.designation, customer.company].filter(Boolean).join(' | ') || 'NFC Digital Profile'}</p>

              <div className="digi-about-section">
                <h2 className="digi-about-title">About Us</h2>
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
                <h2 className="digi-works-title">Our Works</h2>
                <p className="digi-works-subtitle">Take a look at some of our completed projects</p>
              </div>
              <div className="digi-works-grid">
                {gallerySlots.map((gallery, index) => (
                  <div key={gallery.id} className="digi-work-item">
                    <img src={gallery.image || '/no-image-placeholder.svg'} alt={`Gallery ${index + 1}`} />
                    <div className="digi-work-overlay">
                      <h4>Work {index + 1}</h4>
                      <p>{gallery.hoverText || 'No Image'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="digi-form-section" id="contact">
            <div className="digi-form-header">
              <h2 className="digi-form-main-title">We are ready to Help You</h2>
              <p className="digi-form-subtitle">Please use the form below. We are ready to hear your thoughts and answer your questions.</p>
            </div>

            <div className="digi-form-content">
              <div className="digi-form-left">
                <h3 className="digi-talk-title">Let&apos;s talk with us</h3>
                <p className="digi-talk-text">Questions, comments, or suggestions? Fill the form and we&apos;ll contact you shortly.</p>

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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"></path>
                    </svg>
                    <span>{submitting ? 'Sending...' : 'Send'}</span>
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
    </>
  );
}
