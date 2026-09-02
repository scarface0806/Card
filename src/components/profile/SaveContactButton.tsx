'use client';

/**
 * SAVE CONTACT / SHARE PROFILE — the two profile actions.
 *
 * Two small components rather than one block, because the three profile
 * surfaces (/preview-website, CustomerProfileView, CardProfileView) lay their
 * hero CTA rows out differently and one of them also puts Save contact in the
 * sticky profile bar. Each takes `className` so the calling surface keeps its
 * own button variant - gilded on a real profile, primary on the demo - and
 * this file never decides what a button looks like.
 *
 * The vCard itself is built by src/lib/vcard.ts, which is pure and unit
 * tested. Everything here is the browser half: Blob, object URL, anchor click,
 * Web Share, clipboard.
 *
 * DOWNLOAD MECHANICS - the three things that break a .vcf download:
 *
 *  1. Revoking the object URL synchronously after .click(). The download has
 *     not necessarily started yet, so revoking immediately can abort it. The
 *     revoke is deferred instead.
 *  2. Not putting the anchor in the document. Firefox ignores a click on a
 *     detached anchor, so the anchor is appended and then removed.
 *  3. A missing `type`. Blob type is text/vcard, which is what iOS keys off to
 *     offer "Add to Contacts" rather than showing the file as plain text.
 *
 * iOS Safari supports the `download` attribute from iOS 13. On anything older
 * the file opens in a viewer instead of downloading, which still lets the user
 * add the contact; there is no silent failure either way.
 */

import { useState } from 'react';
import { Check, Download, Share2 } from 'lucide-react';

import { buildVCard, vcardFilename, type VCardContact } from '@/lib/vcard';

interface SaveContactButtonProps {
  contact: VCardContact;
  /** Button classes, supplied by the calling surface. */
  className?: string;
  /** Defaults to "Save contact". */
  label?: string;
  /** Trailing element - lets a caller swap the icon for an arrow glyph. */
  children?: React.ReactNode;
}

export function SaveContactButton({
  contact,
  className = 'tv-btn tv-btn-gilded',
  label = 'Save contact',
  children,
}: SaveContactButtonProps) {
  const [saved, setSaved] = useState(false);

  const download = () => {
    const vcard = buildVCard(contact);
    // No BOM. It would help Windows Contacts guess the encoding, but a BOM
    // ahead of BEGIN:VCARD makes some parsers fail to recognise the file at
    // all - and iOS Safari and Android Chrome are the platforms that matter
    // here. The charset is declared on the blob type instead.
    const blob = new Blob([vcard], {
      type: 'text/vcard;charset=utf-8',
    });
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = vcardFilename(contact.fullName);
    // Detached anchors are ignored by Firefox - see note 2 in the header.
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Deferred, not immediate - see note 1 in the header.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <button type="button" onClick={download} className={className}>
        {saved ? (
          <Check className="w-[18px] h-[18px]" aria-hidden="true" />
        ) : (
          <Download className="w-[18px] h-[18px]" aria-hidden="true" />
        )}
        {saved ? 'Contact saved' : label}
        {children}
      </button>

      {/* Announced without shifting the layout, matching ShareButtons. */}
      <span role="status" aria-live="polite" className="sr-only">
        {saved ? 'Contact file downloaded' : ''}
      </span>
    </>
  );
}

interface ShareProfileButtonProps {
  /** Shown in the native share sheet. */
  title: string;
  text?: string;
  /**
   * Absolute URL to share. Optional: when omitted the current location is
   * used, which is what a visitor on a real profile wants. Passing it
   * explicitly keeps the component testable and lets the demo page share a
   * canonical URL rather than a localhost one.
   */
  url?: string;
  className?: string;
  label?: string;
}

export function ShareProfileButton({
  title,
  text,
  url,
  className = 'tv-btn tv-btn-secondary',
  label = 'Share profile',
}: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const shareUrl = url || window.location.href;

    // navigator.share is unavailable on desktop Chrome/Firefox and throws
    // NotAllowedError outside a secure context, so the clipboard path is a
    // real code path rather than a rare fallback.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // AbortError means the user dismissed the sheet - that is a completed
        // interaction, not a failure, so it must NOT fall through to copying a
        // link they just chose not to share. Any other error does fall
        // through, which is why this returns rather than rethrowing.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused (insecure context, permissions).
      // Fails quietly, exactly as ShareButtons does.
    }
  };

  return (
    <>
      <button type="button" onClick={() => void share()} className={className}>
        {copied ? (
          <Check className="w-[18px] h-[18px]" aria-hidden="true" />
        ) : (
          <Share2 className="w-[18px] h-[18px]" aria-hidden="true" />
        )}
        {copied ? 'Link copied' : label}
      </button>

      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Profile link copied to clipboard' : ''}
      </span>
    </>
  );
}

export default SaveContactButton;
