# Tapvyo — CLAUDE.md

Tapvyo (https://tapvyo.in, Madurai, India) sells NFC business cards (₹599) that open a
hosted digital profile at `tapvyo.in/card/<slug>`.

**Trust the code over `docs/` and the root `*_SUMMARY.md` files.** Most of `docs/` is
stale (e.g. `DESIGN_SYSTEM.md` and `PREMIUM_DESIGN_SYSTEM.md` describe a design system
the code no longer uses; guest checkout docs are out of date). `docs/BLOG.md` is mostly
accurate.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript. `proxy.ts` at the root is the
  Next 16 name for middleware.
- Tailwind v4 via `@tailwindcss/postcss`; all styling lives in `app/globals.css`.
  `tailwind.config.ts` is legacy and **not loaded** under v4.
- MongoDB via Prisma 5 (`prisma/schema.prisma`) **and** the raw `mongodb` driver
  (`src/lib/mongodb.ts`, `getMongoDb()`). `mongoose` is a dependency but unused.
- Razorpay (payments), Cloudinary (admin image uploads), Resend + nodemailer (email),
  TipTap (blog editor), framer-motion, lucide-react. Hosted on Vercel.

## Commands

```bash
npm run dev          # next dev
npm run build        # next build (postinstall runs prisma generate)
npm run lint         # eslint (flat config; most rules are warnings)
npm test             # vitest run (tests/**/*.test.ts, node env)
npm run check:links  # scripts/check-links.mjs
npm run dev:db | setup:local | seed:admin | prisma:seed
```

If the local Prisma client is out of date with the schema, `npx prisma generate`.

## Layout

- `app/(frontend)/` — home (`page.tsx` server + `HomeClient.tsx`), login/signup/password
  reset, `dashboard`, `my-orders`, `create-card` (checkout), `card/[slug]` (public
  profiles), contact-us, how-to-use, the four policy pages. Its `layout.tsx` is a client
  layout wrapping `AuthProvider` + `ProductProvider`.
- `app/` top level — `cards` (catalogue), `services`, `about-us`, `blog`, `admin`, `api`,
  `order-success`, `track-order`, `preview-website` (demo profile), `sitemap.ts`,
  `robots.ts`.
- `src/components` (UI), `src/sections` (homepage blocks), `src/layouts` (Navbar,
  Footer), `src/forms` (checkout steps), `src/services` (client API wrappers),
  `src/hooks`, `src/utils` (`ROUTES` in `constants.ts`), `src/lib` (server/domain logic).
- Path alias: `@/*` → `./src/*` only. The repo-root `components/` folder is dead code.

## Single sources of truth

- **`src/lib/site-config.ts`** — business name, phone (`PHONE_E164` for hrefs,
  `PHONE_DISPLAY` for text), `WHATSAPP_NUMBER`, `whatsappLink()`, `SUPPORT_EMAIL`,
  `ADDRESS`, social profiles, `CANONICAL_ORIGIN`, plus marketing config (trust stats,
  testimonials, delivery times, replacement guarantee). Never hardcode contact details
  or these claims elsewhere.
- `src/lib/site.ts` — SEO origin (`SITE_URL` = `CANONICAL_ORIGIN`) and the `BUSINESS`
  NAP object; only references site-config values.
- Anything a crawler reads (canonicals, OG, sitemap, robots, JSON-LD, RSS) uses
  `CANONICAL_ORIGIN` / `@/lib/site` `SITE_URL`, **never an env var**. The env-driven
  `SITE_URL` in site-config is only for links the app hands out (emails, QR, share).

## Data model (Prisma, MongoDB)

User, Product, Order (+ OrderItem), Card + CardLead (legacy profiles), Customer + Gallery
+ Lead (current admin-managed profiles), PaymentLog, EmailLog, MainWebsiteLead,
NewsletterSubscriber, Newsletter, Post / PostView / PostSlugRedirect, PasswordResetToken.
The raw driver is also used for: `rate_limits` (TTL), `contacts` (no Prisma model),
password-reset tokens, and several order/customer/lead routes.

## Profiles

`app/(frontend)/card/[slug]/page.tsx` looks up a **Customer** first
(`CustomerProfileView`), then falls back to a legacy **Card** (`CardProfileView`).
Inactive → `CardInactiveScreen`. Customers are created by an admin at
`/admin/customers/create`; slug = last 5 phone digits (+ `-1`, `-2`…), see
`src/lib/customer-slug.ts`. Cards are auto-created when an admin sets an order to
CONFIRMED. vCard: `src/lib/vcard.ts`.

## Auth

Custom JWT is the real session: `src/lib/auth.ts` (bcrypt + jsonwebtoken), httpOnly
`auth-token` cookie, routes under `app/api/auth/*`. next-auth is used **only** for Google
sign-in, then `/api/auth/google-complete` converts it to the app's `auth-token`.
`proxy.ts` (jose) guards `/dashboard`, `/create-card`, `/my-orders` (login required) and
`/admin/*` (role ADMIN). Admin API routes use `withAdmin` from
`src/lib/auth-middleware.ts`. Roles: ADMIN, CUSTOMER.
**Only `/api/admin/login` may mint a role-ADMIN token** (plus the dev-only mock branch
in `/api/auth/login`, gated on `NODE_ENV === 'development'`). `/api/auth/login` returns
403 for an ADMIN account (after the password check) and `google-complete` redirects an
ADMIN to `/admin/login?error=use-password` with no cookie — proxy.ts and `withAdmin`
trust any ADMIN token, so a new token-minting route must never sign `user.role` blindly.

## Orders & payments

`/create-card` (5-step form, login required) → `POST /api/orders` (price computed
server-side from the Product; client price ignored) → Razorpay checkout
(`src/hooks/useRazorpayPayment.ts`, `/api/payment/order`) → `POST /api/payment/verify`
(HMAC). `verifyPayment` in `src/lib/payment-adapter.ts` is idempotent (conditional
PaymentLog claim), marks the order PAID, sends the customer confirmation (Resend,
de-duplicated via EmailLog) and the admin alert. The Razorpay **webhook only updates
PaymentLog** — it does not fulfil. Then `/order-success?orderId=`.

**Customised Card** (`Product.isCustomDesign` + `designFee`, both optional; null = off).
Unrelated to `cardType: "custom"`, which is the enquiry-only "talk to our team" tier.
Price = `orderTotalFor()` in `src/lib/products/presentation.ts` (sale price + fee); on
`SelectedProduct` / `CardDesign`, `price` is that all-in amount and `cardPrice` /
`designFee` are the breakdown. Customers upload front/back to
`POST /api/uploads/custom-card` (login, per-user Mongo rate limit, magic-byte check,
10MB, Cloudinary `custom-cards/<userId>/`); `POST /api/orders` accepts only URLs in that
folder (`resolveCustomDesignOrder` in `src/lib/custom-card-artwork.ts`) and stores
`designFee` + `custom*ImageUrl/PublicId` on the Order. Shared Mongo rate limiter:
`src/lib/mongo-rate-limit.ts`.

**Checkout uploads** (profile photo for every product, artwork for Customised Card)
upload on select via `src/lib/checkout-upload-client.ts` → the same route with
`purpose` `profile` (folder `profile-photos/<userId>/`) or `artwork`. The form holds
`{url, publicId, width, height}`, never a File (a File in the JSON order body
serialises to `{}`). The order stores `profileImageUrl/PublicId` after
`resolveProfilePhoto`. A daily Vercel Cron (`vercel.json` →
`/api/cron/cleanup-uploads`, needs `CRON_SECRET`) deletes uploads in those two folders
older than 7 days that no order references (`src/lib/upload-cleanup.ts`).

Email: Resend (`src/lib/emails/*`) for order/status/password-reset/admin alerts;
nodemailer (`src/lib/email.ts`, SMTP env vars not in `.env.example`) for leads,
newsletters and the NFC-link email.

## Analytics

`src/components/GoogleAnalytics.tsx` (GA4, default `G-PMLBD2Q7ZQ`) and
`src/components/MetaPixel.tsx` (default pixel `1451245263542276`, autoConfig off), both
in the root layout, production-only, excluded on `/admin` and `/dashboard`.
All custom events go through `trackEvent()` in `src/lib/analytics.ts`, which sends the
GA event and the matching Meta standard event. WhatsApp / tel / mailto clicks are tracked
by one delegated listener; tag a link's container with `data-analytics-location` to set
its `location`. Purchase is sent once per order from `/order-success`.

## Conventions

- Design system: the `tv-*` classes in `app/globals.css` (`tv-h2`, `tv-body`, `tv-small`,
  `tv-mono`, `tv-eyebrow`, `tv-btn tv-btn-gilded|secondary|tertiary`, `tv-panel`,
  `tv-surface-ink|graphite|bone`, `tv-section`, `tv-prose`…). Colours: brass `#C9A961`,
  bone `#F1F3F1`, ink `#12100C`. Fonts: Fraunces (display), Manrope (body),
  JetBrains Mono (mono). Use these; don't introduce new palettes.
- Client pages get metadata from a sibling `layout.tsx` calling `pageMetadata()`
  (`src/lib/page-metadata.ts`).
- Policy pages have a hardcoded `LAST_UPDATED` — bump it whenever the wording changes.
- Comments explain *why*, often referencing a past bug; keep that style and don't delete
  them casually.
- Never assert unverified marketing claims (ratings, customer counts, encryption,
  testimonials). Social proof comes from config in `site-config.ts` and hides when empty.
- Tap targets `min-h-[44px]`; respect `prefers-reduced-motion`.
- Do not expose secrets in `NEXT_PUBLIC_*` vars.

## Known issues

- `prisma/seed.js` and `scripts/setup-local.js` contain a hardcoded fallback admin
  email/password and print it — should be removed.
- Route and page files may only export what Next allows (`GET`, `default`, `metadata`,
  …); a stray exported helper fails the build's type check. Keep helpers unexported or
  in `src/lib`.
- `next build` needs a reachable `DATABASE_URL` (it prerenders blog and catalogue pages)
  and network access to Google Fonts.
