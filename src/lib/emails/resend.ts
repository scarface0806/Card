/**
 * Resend client and envelope configuration.
 *
 * SERVER-ONLY. RESEND_API_KEY is read here and nowhere else. This module must
 * never be imported from a client component - it is used only by route
 * handlers and by the send orchestration in ./send-order-email.ts. The key is
 * never returned in a response body and must never be given a NEXT_PUBLIC_
 * prefix.
 *
 * Every getter throws when misconfigured. That is deliberate: the callers all
 * run inside the send orchestration's try/catch, which turns the throw into a
 * `failed` email_log row instead of a broken order.
 */

import { Resend } from "resend";

import { getRequiredEnv } from "@/lib/env";
import { SITE_NAME } from "@/lib/site-config";

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(getRequiredEnv("RESEND_API_KEY"));
  }
  return client;
}

/**
 * From address. EMAIL_FROM may be a bare address ("orders@tricomakes.in") or an
 * addressed form ("Tapvyo Orders <orders@tricomakes.in>"); a bare address gets a
 * display name so inboxes show the brand rather than the mailbox.
 *
 * The sending domain must be verified in Resend. tricomakes.in is verified;
 * tapvyo.com is not registered at all, so it can never be. A subdomain
 * verification does not cover a root domain (or the reverse).
 */
export function getEmailFrom(): string {
  const configured = getRequiredEnv("EMAIL_FROM").trim();
  return configured.includes("<")
    ? configured
    : `${SITE_NAME} Orders <${configured}>`;
}

/** Reply-to. A real, monitored mailbox - there is no noreply address anywhere. */
export function getEmailReplyTo(): string {
  return getRequiredEnv("EMAIL_REPLY_TO").trim();
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
