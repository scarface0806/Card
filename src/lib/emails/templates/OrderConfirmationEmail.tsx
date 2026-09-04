/**
 * Order confirmation - sent from the server-side payment-success path only.
 *
 * EVERY VALUE IN HERE COMES FROM THE SAVED ORDER ROW, which was itself built
 * server-side from a productId. Nothing is read from a request body or a query
 * string, so the email cannot show a different product or a different amount
 * from the one that was charged. The caller (send-order-email.ts) loads the
 * order by id and does that mapping; this file only lays it out.
 *
 * The two things this email exists to do: hand the customer a reference they
 * can copy, and show them exactly what we are about to print so they can catch
 * a typo before the card goes to production.
 *
 * Design notes
 * ------------
 * - Self-contained shell: this template does NOT use the shared
 *   OrderEmailLayout, so the shipped and delivered emails are not affected by
 *   any of the visual changes here. The shared layout still owns those.
 * - Tables only. All CSS is inline. 600px max width. System font stack with a
 *   serif heading stack for the editorial feel.
 * - No <img> for the brand mark: the dark header carries a styled wordmark so
 *   a client with images blocked (the default in Outlook and unknown-sender
 *   Gmail) still reads correctly. The product artwork IS an <img>, gated on
 *   productImageUrl being an absolute https URL, so a missing artwork never
 *   leaves a broken-image icon behind.
 * - The brand palette is the site's identity (dark navy surfaces) with an
 *   amber/gold accent. Buttons and the order reference use the accent so the
 *   customer has one obvious primary action without it blending into the
 *   header band.
 */

import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import {
  PHONE_DISPLAY,
  SITE_HOST,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  WHATSAPP_NUMBER,
} from "@/lib/site-config";

import { ProductImage } from "../components/OrderEmailLayout";
import type { OrderConfirmationEmailData } from "../types";

/**
 * Required wording. Do not soften it, do not move it into the footer - it is
 * the customer's only window to correct what gets printed.
 */
const PROOF_DEADLINE_LINE =
  "Reply to this email within 24 hours if anything is wrong, we print after that";

/**
 * Delivery timeline. The exact day count is a business decision the owner has
 * not finalised yet, so it is rendered as a clear placeholder rather than
 * guessing in customer-facing copy.
 */
const DELIVERY_TIMELINE_PLACEHOLDER = "[TODO: CONFIRM DELIVERY DAYS]";

/**
 * Policy page URLs. Absolute so the email works from any recipient domain.
 * Centralised here so all three links cannot drift apart.
 */
const TERMS_URL = `${SITE_URL}/terms-conditions`;
const REFUND_URL = `${SITE_URL}/refund-policy`;
const SHIPPING_URL = `${SITE_URL}/shipping-policy`;

const WHATSAPP_PROFILE_UPDATE_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I'd like to update the details on my Tapvyo card"
)}`;

// ---------------------------------------------------------------------------
// Style tokens - local to this template. The shared styles module is left
// untouched so the shipped and delivered emails keep their current look.
// ---------------------------------------------------------------------------

const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const FONT_SERIF =
  'Georgia, "Times New Roman", "Hoefler Text", Cambria, Times, serif';
const FONT_MONO =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

const C = {
  pageBg: "#f6f5f1",
  cardBg: "#ffffff",
  rule: "#e7e3d8",
  ruleSoft: "#efece4",
  ink: "#0f172a",
  bodyInk: "#1f2937",
  muted: "#5b6470",
  faint: "#8a8f99",
  headerBg: "#0b1220",
  headerInk: "#ffffff",
  headerMuted: "#c9b88a",
  accent: "#c98a1a",
  accentHover: "#a8740f",
  accentInk: "#ffffff",
  refBg: "#fff7e6",
  refBorder: "#f1c97a",
  refInk: "#3a2407",
  proofBg: "#fffbf2",
  proofBorder: "#f1c97a",
  proofInk: "#3a2407",
  warnBg: "#fff1f0",
  warnBorder: "#b3261e",
  warnInk: "#7a1310",
  infoBg: "#f4f1ea",
  infoBorder: "#d8cfb8",
  infoInk: "#3a3025",
} as const;

const body = {
  backgroundColor: C.pageBg,
  fontFamily: FONT_SANS,
  margin: "0",
  padding: "0",
  WebkitTextSizeAdjust: "100%" as const,
} as const;

const outer = { padding: "24px 12px" } as const;
const container = { maxWidth: "600px", width: "100%" } as const;
const card = {
  backgroundColor: C.cardBg,
  borderRadius: "10px",
  overflow: "hidden" as const,
} as const;

// Header band - the dark surface, the brand identity moment.
const header = {
  backgroundColor: C.headerBg,
  padding: "28px 32px 26px",
} as const;
const wordmark = {
  color: C.headerInk,
  fontFamily: FONT_SERIF,
  fontSize: "28px",
  fontWeight: 700,
  letterSpacing: "6px",
  lineHeight: "32px",
  margin: "0",
  textAlign: "center" as const,
} as const;
const wordmarkDot = {
  color: C.headerMuted,
  fontFamily: FONT_SERIF,
} as const;
const headerTagline = {
  color: C.headerMuted,
  fontFamily: FONT_SANS,
  fontSize: "12px",
  fontWeight: 400,
  letterSpacing: "2px",
  lineHeight: "18px",
  margin: "10px 0 0",
  textAlign: "center" as const,
  textTransform: "uppercase" as const,
} as const;
const headerRule = {
  borderTop: `1px solid ${C.headerMuted}`,
  borderLeft: "0",
  borderRight: "0",
  borderBottom: "0",
  margin: "0",
  opacity: 0.35,
  width: "48px",
} as const;
const headerRuleCell = { padding: "0 0 0", textAlign: "center" as const } as const;

// Body content area.
const content = { padding: "32px 32px 8px" } as const;
const contentFoot = { padding: "0 32px 32px" } as const;

const h1 = {
  color: C.ink,
  fontFamily: FONT_SERIF,
  fontSize: "26px",
  fontWeight: 700,
  lineHeight: "34px",
  margin: "0 0 12px",
} as const;
const paragraph = {
  color: C.bodyInk,
  fontFamily: FONT_SANS,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 18px",
} as const;
const smallParagraph = {
  color: C.muted,
  fontFamily: FONT_SANS,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 12px",
} as const;

const eyebrow = {
  color: C.accent,
  fontFamily: FONT_SANS,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "2px",
  lineHeight: "16px",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
} as const;

const label = {
  color: C.muted,
  fontFamily: FONT_SANS,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  lineHeight: "16px",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
} as const;
const value = {
  color: C.ink,
  fontFamily: FONT_SANS,
  fontSize: "15px",
  fontWeight: 600,
  lineHeight: "22px",
  margin: "0",
} as const;

// Order reference - the single most important string in the email.
const refPanel = {
  backgroundColor: C.refBg,
  border: `1px solid ${C.refBorder}`,
  borderRadius: "8px",
  margin: "0 0 24px",
  padding: "22px 18px",
} as const;
const refLabel = {
  color: C.refInk,
  fontFamily: FONT_SANS,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  margin: "0 0 8px",
  textAlign: "center" as const,
  textTransform: "uppercase" as const,
} as const;
const refValue = {
  color: C.refInk,
  fontFamily: FONT_MONO,
  fontSize: "26px",
  fontWeight: 700,
  letterSpacing: "3px",
  lineHeight: "34px",
  margin: "0",
  textAlign: "center" as const,
  wordBreak: "break-all" as const,
} as const;
const refHint = {
  color: C.muted,
  fontFamily: FONT_SANS,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "8px 0 0",
  textAlign: "center" as const,
} as const;

const panel = {
  backgroundColor: "#fbfaf6",
  border: `1px solid ${C.rule}`,
  borderRadius: "8px",
  margin: "0 0 20px",
  padding: "18px 20px",
} as const;

const proofPanel = {
  backgroundColor: C.proofBg,
  border: `1px solid ${C.proofBorder}`,
  borderLeft: `4px solid ${C.accent}`,
  borderRadius: "8px",
  margin: "0 0 20px",
  padding: "20px 22px",
} as const;
const proofHeading = {
  color: C.proofInk,
  fontFamily: FONT_SERIF,
  fontSize: "17px",
  fontWeight: 700,
  lineHeight: "24px",
  margin: "0 0 6px",
} as const;
const proofNote = {
  color: C.proofInk,
  fontFamily: FONT_SANS,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 16px",
} as const;

const warnPanel = {
  backgroundColor: C.warnBg,
  border: `1px solid ${C.warnBorder}`,
  borderRadius: "8px",
  margin: "0 0 24px",
  padding: "16px 18px",
} as const;
const warnText = {
  color: C.warnInk,
  fontFamily: FONT_SANS,
  fontSize: "15px",
  fontWeight: 700,
  lineHeight: "22px",
  margin: "0",
} as const;

const infoPanel = {
  backgroundColor: C.infoBg,
  border: `1px solid ${C.infoBorder}`,
  borderRadius: "8px",
  margin: "0 0 20px",
  padding: "18px 20px",
} as const;
const infoHeading = {
  color: C.infoInk,
  fontFamily: FONT_SERIF,
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "22px",
  margin: "0 0 8px",
} as const;
const infoText = {
  color: C.infoInk,
  fontFamily: FONT_SANS,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 10px",
} as const;
const infoTextLast = {
  color: C.infoInk,
  fontFamily: FONT_SANS,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
} as const;

const buttonPrimary = {
  backgroundColor: C.accent,
  borderRadius: "6px",
  color: C.accentInk,
  fontFamily: FONT_SANS,
  fontSize: "15px",
  fontWeight: 700,
  letterSpacing: "0.3px",
  padding: "14px 26px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block" as const,
} as const;
const buttonRow = { margin: "0 0 22px", textAlign: "center" as const } as const;
const buttonCaption = {
  color: C.muted,
  fontFamily: FONT_SANS,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "10px 0 0",
  textAlign: "center" as const,
} as const;
const linkInline = {
  color: C.accent,
  fontFamily: FONT_SANS,
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
} as const;

const hr = {
  borderColor: C.ruleSoft,
  borderTop: `1px solid ${C.ruleSoft}`,
  borderLeft: "0",
  borderRight: "0",
  borderBottom: "0",
  margin: "20px 0",
} as const;

const footerOuter = {
  backgroundColor: "#fbfaf6",
  borderTop: `1px solid ${C.rule}`,
  padding: "24px 32px 26px",
} as const;
const footerHeading = {
  color: C.ink,
  fontFamily: FONT_SERIF,
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: "20px",
  margin: "0 0 10px",
} as const;
const footerText = {
  color: C.bodyInk,
  fontFamily: FONT_SANS,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px",
} as const;
const footerTextMuted = {
  color: C.muted,
  fontFamily: FONT_SANS,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 8px",
} as const;
const footerLink = {
  color: C.accent,
  fontFamily: FONT_SANS,
  fontSize: "13px",
  textDecoration: "underline",
} as const;
const footerLinkRow = { margin: "0 0 6px" } as const;
const footerAddress = {
  color: C.muted,
  fontFamily: FONT_SANS,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "14px 0 0",
} as const;
const footerLegal = {
  color: C.faint,
  fontFamily: FONT_SANS,
  fontSize: "11px",
  lineHeight: "17px",
  margin: "16px 0 0",
} as const;

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function DetailRow({
  label: labelText,
  value: valueText,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <Section style={{ margin: last ? "0" : "0 0 12px" }}>
      <Text style={label}>{labelText}</Text>
      <Text style={value}>{valueText}</Text>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function orderConfirmationSubject(data: OrderConfirmationEmailData) {
  return `Your ${SITE_NAME} order is confirmed — ${data.productName} (${data.orderRef})`;
}

export function OrderConfirmationEmail(data: OrderConfirmationEmailData) {
  const {
    orderRef,
    trackUrl,
    productName,
    productTier,
    productImageUrl,
    quantity,
    amountPaid,
    proof,
    profileUrl,
  } = data;

  const previewText = `${SITE_NAME}: payment received for ${productName}. Your reference is ${orderRef}.`;

  return (
    <Html lang="en">
      <Head>
        <title>{previewText}</title>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Section style={outer}>
          <Container style={container}>
            <Section style={card}>
              {/* ----------------------------------------------------------------
                  Header band - dark navy, serif wordmark, amber rule, tagline.
                  The only place the brand is shown; rendered as text so an
                  image-blocked client still sees the brand.
              ---------------------------------------------------------------- */}
              <Section style={header}>
                <Text style={wordmark}>
                  {SITE_NAME.toUpperCase().slice(0, 3)}
                  <span style={wordmarkDot}>
                    {SITE_NAME.toUpperCase().slice(3)}
                  </span>
                </Text>
                <Section style={headerRuleCell}>
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    style={{
                      ...headerRule,
                      margin: "14px auto 0",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={headerRule}>&nbsp;</td>
                      </tr>
                    </tbody>
                  </table>
                </Section>
                <Text style={headerTagline}>Order confirmation</Text>
              </Section>

              {/* ----------------------------------------------------------------
                  Body
              ---------------------------------------------------------------- */}
              <Section style={content}>
                <Text style={eyebrow}>Payment received</Text>
                <Text style={h1}>
                  Your {SITE_NAME} card is on its way
                </Text>
                <Text style={paragraph}>
                  Thanks for ordering from {SITE_NAME}. We&rsquo;ve received your
                  payment and your card is queued for production. Save this
                  email &mdash; it has everything you need to track the order
                  and check what&rsquo;s being printed.
                </Text>

                {/* Tracking reference - the one thing every customer copies. */}
                <Section style={refPanel}>
                  <Text style={refLabel}>Your order reference</Text>
                  <Text style={refValue}>{orderRef}</Text>
                  <Text style={refHint}>
                    Quote this reference in any message about your order.
                  </Text>
                </Section>

                {/* Product artwork. Decoration only - name, tier and price
                    are repeated as text below, so a blocked image loses
                    nothing. The shared ProductImage component already
                    enforces width, height, alt and the absolute-https rule. */}
                <ProductImage src={productImageUrl} productName={productName} />

                {/* Order summary */}
                <Section style={panel}>
                  <DetailRow label="Card" value={productName} />
                  {productTier ? (
                    <DetailRow label="Card type" value={productTier} />
                  ) : null}
                  <DetailRow label="Quantity" value={String(quantity)} />
                  <DetailRow
                    label="Amount paid"
                    value={amountPaid}
                    last
                  />
                </Section>

                {/* Proof - the customer's submitted details. Visually loud
                    and placed BEFORE the "what happens next" copy because
                    fixing a typo now is free, and fixing one after the
                    card is printed costs money. */}
                <Section style={proofPanel}>
                  <Text style={proofHeading}>
                    Please check your details now
                  </Text>
                  <Text style={proofNote}>
                    These are the details exactly as you submitted them. This
                    is what gets printed on the card, so please read it for
                    typos &mdash; spelling, capitalisation, numbers and spacing
                    included.
                  </Text>
                  <DetailRow label="Name" value={proof.name} />
                  <DetailRow
                    label="Designation"
                    value={proof.designation || "Not given"}
                  />
                  <DetailRow
                    label="Company"
                    value={proof.company || "Not given"}
                  />
                  <DetailRow
                    label="Mobile"
                    value={proof.mobile || "Not given"}
                  />
                  <DetailRow
                    label="Email"
                    value={proof.email || "Not given"}
                    last
                  />
                </Section>

                {/* The 24-hour proofing deadline. The single most important
                    sentence in the email, kept verbatim and kept before the
                    "what happens next" block. */}
                <Section style={warnPanel}>
                  <Text style={warnText}>{PROOF_DEADLINE_LINE}</Text>
                </Section>

                {/* What happens next - delivery timeline placeholder. */}
                <Section style={infoPanel}>
                  <Text style={infoHeading}>What happens next</Text>
                  <Text style={infoText}>
                    Your card is programmed, printed, quality-checked and
                    shipped. Estimated delivery: {DELIVERY_TIMELINE_PLACEHOLDER}
                    .
                  </Text>
                  <Text style={infoTextLast}>
                    We&rsquo;ll email you the tracking number the moment it
                    leaves our studio.
                  </Text>
                </Section>

                {/* Digital profile link / explanation. */}
                <Section style={panel}>
                  <Text style={label}>Your free lifetime profile</Text>
                  {profileUrl ? (
                    <Text style={{ ...value, fontWeight: 400, margin: 0 }}>
                      <Link href={profileUrl} style={linkInline}>
                        {profileUrl}
                      </Link>
                    </Text>
                  ) : (
                    <Text style={{ ...smallParagraph, margin: 0 }}>
                      Your digital profile is created once we start production.
                      We&rsquo;ll email you the link &mdash; it&rsquo;s also
                      encoded on the card itself, so tapping the card always
                      opens the latest version.
                    </Text>
                  )}
                </Section>

                {/* Profile-update policy. Kept as its own block (not buried
                    in the footer) so it reads while the customer is still
                    looking at the proof section above. */}
                <Section style={infoPanel}>
                  <Text style={infoHeading}>
                    Need to change a detail later?
                  </Text>
                  <Text style={infoText}>
                    Profiles aren&rsquo;t self-editable. If you need to update
                    your name, number, links or anything else after the card
                    is printed, message us on WhatsApp and we&rsquo;ll make
                    the change for you.
                  </Text>
                  <Text style={infoText}>
                    Each update is a paid change &mdash;{" "}
                    <strong>₹49 per update</strong> &mdash; because the card
                    itself has to be reprogrammed. Please double-check the
                    details above now to avoid that charge.
                  </Text>
                  <Text style={infoTextLast}>
                    WhatsApp:{" "}
                    <Link
                      href={WHATSAPP_PROFILE_UPDATE_URL}
                      style={footerLink}
                    >
                      {PHONE_DISPLAY}
                    </Link>
                  </Text>
                </Section>

                {/* Track-order call to action. The button is the primary
                    visual, the bare URL is shown for clients that strip
                    buttons. */}
                <Section style={buttonRow}>
                  <Button href={trackUrl} style={buttonPrimary}>
                    Track my order
                  </Button>
                </Section>
                <Text style={buttonCaption}>
                  Or open this link directly:{" "}
                  <Link href={trackUrl} style={linkInline}>
                    {trackUrl}
                  </Link>
                </Text>
              </Section>

              <Section style={contentFoot}>
                <hr style={hr} />
              </Section>

              {/* ----------------------------------------------------------------
                  Footer - support, address, policy links, legal.
              ---------------------------------------------------------------- */}
              <Section style={footerOuter}>
                <Text style={footerHeading}>Need help with this order?</Text>
                <Text style={footerText}>
                  Email{" "}
                  <Link href={`mailto:${SUPPORT_EMAIL}`} style={footerLink}>
                    {SUPPORT_EMAIL}
                  </Link>{" "}
                  and a person will read it. Please include your order
                  reference {orderRef} in the subject.
                </Text>
                <Text style={footerText}>
                  WhatsApp{" "}
                  <Link
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    style={footerLink}
                  >
                    {PHONE_DISPLAY}
                  </Link>{" "}
                  &mdash; or save the number and message us: {PHONE_DISPLAY}
                </Text>

                <Text style={footerTextMuted}>Policies</Text>
                <Text style={footerLinkRow}>
                  <Link href={TERMS_URL} style={footerLink}>
                    Terms &amp; Conditions
                  </Link>
                  {"  ·  "}
                  <Link href={REFUND_URL} style={footerLink}>
                    Refund Policy
                  </Link>
                  {"  ·  "}
                  <Link href={SHIPPING_URL} style={footerLink}>
                    Shipping Policy
                  </Link>
                </Text>

                <Text style={footerAddress}>
                  {SITE_NAME} &middot; Tiruchirappalli, Tamil Nadu, India
                </Text>
                <Text style={footerLegal}>
                  You are getting this email because you placed an order at{" "}
                  <Link href={SITE_URL} style={footerLink}>
                    {SITE_HOST}
                  </Link>
                  . It is about that order only &mdash; we do not add order
                  addresses to any mailing list.
                </Text>
              </Section>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;
