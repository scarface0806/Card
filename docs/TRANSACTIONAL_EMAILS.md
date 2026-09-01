# Transactional order emails & /track-order

Three customer emails, sent through [Resend](https://resend.com) with
[React Email](https://react.email) templates, plus a public order-tracking page.

| Email | Trigger | Code |
| --- | --- | --- |
| Order confirmation | Server-side payment success | `src/lib/payment-adapter.ts` (`verifyPayment`, `checkCapturedPayment`) |
| Shipped | Admin sets status `SHIPPED` | `app/api/orders/[id]/route.ts`, `app/api/admin/orders/[id]/route.ts` |
| Delivered | Admin sets status `DELIVERED` | same two routes |

Marketing email, newsletters and SMS/WhatsApp notifications are out of scope here.
The existing SMTP/nodemailer path in `src/lib/email.ts` still handles leads and
newsletters and was deliberately left alone.

---

## Setup checklist

### 1. Create the `email_log` indexes

The idempotency guarantee **is** the unique index on `(orderId, type)`. Without
it, a webhook retry or a double-clicked admin button sends two emails.

Safest option — create the indexes directly (purely additive):

```js
// mongosh against the production database
db.email_log.createIndex({ orderId: 1, type: 1 }, { unique: true })
db.email_log.createIndex({ orderId: 1 })
```

Alternative — `npx prisma db push`. Note that on MongoDB this **syncs** indexes:
it will drop indexes that are not declared in `prisma/schema.prisma`. Check the
cluster's existing indexes before running it against production.

The new `Order` columns are all optional, so no backfill is needed. Existing
orders have `recipientEmail = null` and will log a `failed` email row explaining
that rather than mailing the account address.

### 2. Environment variables

Set these in Vercel for **Production, Preview and Development**:

| Variable | Server-only | Value |
| --- | --- | --- |
| `RESEND_API_KEY` | **yes — secret** | from the Resend dashboard |
| `EMAIL_FROM` | yes | `orders@tapvyo.com` |
| `EMAIL_REPLY_TO` | yes | `tapvyo@gmail.com` |
| `NEXT_PUBLIC_SITE_URL` | no (already used) | `https://tapvyo.com` |

`RESEND_API_KEY` is read in `src/lib/emails/resend.ts` and nowhere else. It must
never be given a `NEXT_PUBLIC_` prefix.

`/track-order` needs no extra service: its rate-limit counters live in the
`rate_limits` collection of the same Atlas cluster, which every serverless
instance shares (the in-process limiter in `src/lib/rate-limit.ts` would give
each instance its own budget, so an enumerator could just spread requests).
With `DATABASE_URL` unset or the cluster unreachable, `/track-order` **refuses
every lookup** (503) rather than running unlimited.

### 3. Verify the domain in Resend

Sending as `orders@tapvyo.com` requires verifying the **root** domain
`tapvyo.com` in Resend. A subdomain verification (e.g. `mail.tapvyo.com`) does
**not** cover a root-domain From address.

> **Status check:** as of the last look, the only verified domain on this Resend
> account is `tricomakes.in` (region `ap-northeast-1`). **`tapvyo.com` is not on
> the account at all.** Add it under Domains -> Add Domain, choosing the **root**
> domain. Until it is verified, `EMAIL_FROM=orders@tapvyo.com` is rejected with a
> 403 and every send lands as a `failed` row in `email_log`.

DNS records, exactly as Resend issues them for your region. `tapvyo.com` will
most likely be issued `ap-northeast-1` to match the existing domain, but read the
region off Resend's page rather than assuming:

| Type | Name | Value | Notes |
| --- | --- | --- | --- |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF for the Resend sending subdomain |
| MX | `send` | `feedback-smtp.<region>.amazonses.com` (priority 10) — e.g. `feedback-smtp.ap-northeast-1.amazonses.com` | bounce/complaint feedback |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSq...` (from Resend) | DKIM |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@tapvyo.com` | start at `p=none`, tighten later |

Three things that break this in practice:

1. **Only one SPF record may exist per name.** If `tapvyo.com` already has an
   SPF record for Google Workspace or Zoho, you must **merge** it, not add a
   second one:
   `v=spf1 include:_spf.google.com include:amazonses.com ~all`
   Two separate SPF TXT records is a permanent failure, not a warning.
2. **Cloudflare must be set to DNS only** (grey cloud) for these records.
   Proxying them breaks verification.
3. Keep the feedback `MX` on the `send` subdomain. Do not put it on the root, or
   you will divert your real inbound mail.

---

## Design notes

**Email failure never fails an order.** Every public function in
`src/lib/emails/send-order-email.ts` returns a result object and never throws.
Sends fire *after* the order write has committed, so a slow or dead provider
cannot time out checkout or roll anything back. A failure becomes a `failed`
row in `email_log` and a server log line.

**Idempotency is at the database level.** A send claims its `(orderId, type)`
row by inserting it with status `pending`. A duplicate insert fails with P2002,
so the second caller returns without sending. The admin resend *updates* that
row back to `pending` instead of inserting a second one — which is why a
permanently failed send can be retried without ever dropping the constraint.

**Recipient address.** Order mail goes to `Order.recipientEmail`, the address
typed into the checkout form. There is deliberately no fallback to the
logged-in account email: the person paying is often not the person whose card is
being printed. A missing `recipientEmail` produces a `failed` row that says so.

**Client compatibility.** Table layout only (React Email `Section`/`Row`/
`Column` compile to `<table>`), all styles inline, 600px max width, system
fonts, no `<style>` block, no flexbox or grid, and no images at all — so an
image-blocking client loses nothing. `tests/order-email-templates.test.ts`
asserts each of these.

**Plain text** is rendered from the same component via
`render(<Email/>, { plainText: true })`, so it cannot drift from the HTML.

## Admin

`/admin/orders` → view an order. The drawer has:

- **Shipping & Tracking** — courier, tracking number, tracking URL and the
  expected delivery window. Fill these in *before* marking the order shipped;
  the shipped email refuses to send without a courier and tracking number and
  records a `failed` row instead of mailing a half-empty notice.
- **Customer Emails** — per-type state (not sent / sent at / failed with the
  error) and a resend button, backed by `POST /api/admin/orders/:id/emails`.

The lifecycle button now runs
`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`. `PROCESSING → DELIVERED`
is still accepted by the API, so nothing that relied on the old jump breaks.
