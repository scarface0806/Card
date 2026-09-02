/**
 * Resend client and envelope configuration.
 *
 * SERVER-ONLY. RESEND_API_KEY is read here and nowhere else. This module must
 * never be imported from a client component - it is used only by route
 * handlers and by the send orchestration in ./send-order-email.ts. The key is
 * never returned in a response body and must never be given a NEXT_PUBLIC_
 * prefix.
 *
 * RESEND_API_KEY is the one required value and its getter throws when unset.
 * That is deliberate: the callers all run inside the send orchestration's
 * try/catch, which turns the throw into a `failed` email_log row instead of a
 * broken order. The envelope getters below never throw - they fall back to a
 * verified From and the support reply-to, so a missing variable degrades the
 * envelope instead of killing the send.
 */

import { Resend } from "resend";

import { getRequiredEnv } from "@/lib/env";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site-config";

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(getRequiredEnv("RESEND_API_KEY"));
  }
  return client;
}

/**
 * The only verified sending domain on this Resend account.
 *
 * A From address on any other domain comes back as "The <domain> domain is not
 * verified" and nothing is delivered. That is exactly what a stale
 * EMAIL_FROM=orders@tapvyo.com produced in production: tapvyo.com is not
 * registered at all, so it can never be verified, and a subdomain verification
 * would not cover a root-domain From anyway (or the reverse).
 */
const VERIFIED_SENDING_DOMAIN = "tricomakes.in";

/**
 * Fallback From address, used when the environment sets no From at all.
 *
 * A default rather than a throw, because an unset variable used to take down
 * every send. The display name stays the brand; only the domain is the
 * verified one.
 */
const DEFAULT_EMAIL_FROM = `${SITE_NAME} <noreply@${VERIFIED_SENDING_DOMAIN}>`;

/**
 * From address, from RESEND_FROM_EMAIL.
 *
 * The value may be a bare address ("orders@tricomakes.in") or an addressed
 * form ("Tapvyo <noreply@tricomakes.in>"); a bare address gets a display name
 * so inboxes show the brand rather than the mailbox.
 *
 * EMAIL_FROM is the legacy name for the same setting and is still read second,
 * so an environment that only has the old variable keeps working. Setting
 * RESEND_FROM_EMAIL in Vercel therefore overrides a stale EMAIL_FROM without
 * having to delete it first.
 */
export function getEmailFrom(): string {
  const configured =
    process.env.RESEND_FROM_EMAIL?.trim() || process.env.EMAIL_FROM?.trim();

  if (!configured) return DEFAULT_EMAIL_FROM;

  const from = configured.includes("<")
    ? configured
    : `${SITE_NAME} Orders <${configured}>`;

  warnIfDomainUnverified(from);
  return from;
}

/**
 * Warn, server-side, when the configured From is on a domain Resend will
 * reject. The address is still used exactly as configured - the provider is the
 * authority on verification, not this constant - but the log now names the
 * variable to fix instead of only repeating the provider's message.
 */
function warnIfDomainUnverified(from: string): void {
  const domain = from
    .split("@")
    .pop()
    ?.replace(/>.*$/, "")
    .trim()
    .toLowerCase();

  if (!domain || domain === VERIFIED_SENDING_DOMAIN) return;

  console.warn(
    '[resend] From address is on "' +
      domain +
      '", which is not verified on this Resend account (only ' +
      VERIFIED_SENDING_DOMAIN +
      " is). Every send will be rejected. Set RESEND_FROM_EMAIL to something like: " +
      DEFAULT_EMAIL_FROM
  );
}

/**
 * Reply-to. A real, monitored mailbox - the order confirmation tells customers
 * to reply within 24 hours to correct what gets printed, so this is never a
 * noreply address even when From is. EMAIL_REPLY_TO overrides it; the default
 * is the support address in site-config.
 */
export function getEmailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;
}

/**
 * Optional blind copy of every order email, so the business sees what the
 * customer saw.
 *
 * Optional on purpose: while the sending domain is unverified, Resend only
 * delivers to the account owner, and a bcc to anything else would fail the
 * whole send - taking the customer's copy down with it. Unset means no bcc.
 *
 * Blind rather than cc so the customer never sees an internal address.
 */
export function getEmailBcc(): string | null {
  const configured = process.env.EMAIL_BCC?.trim();
  return configured ? configured : null;
}
