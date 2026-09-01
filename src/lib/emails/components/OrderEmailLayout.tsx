/**
 * Shared shell for every transactional order email: header, body card, and the
 * support block. Defined once here so the three templates cannot drift apart.
 *
 * Structure is tables only - Container, Section, Row and Column all compile to
 * <table>. No raw <div> is used for layout, and there is no <style> block, so
 * the same markup renders in Gmail mobile and in Outlook's Word engine.
 *
 * There is no logo image anywhere in these emails on purpose: the brand shows
 * as a text wordmark, so a client that blocks images loses nothing at all.
 */

import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import {
  PHONE_DISPLAY,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  WHATSAPP_NUMBER,
} from "@/lib/site-config";

import * as s from "./styles";

export interface OrderEmailLayoutProps {
  /** Inbox preview line. Keep under ~90 characters. */
  preview: string;
  /** Short line under the wordmark, giving the email its context. */
  tagline: string;
  children: React.ReactNode;
}

export function OrderEmailLayout({
  preview,
  tagline,
  children,
}: OrderEmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <title>{preview}</title>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={s.body}>
        <Section style={s.outer}>
          <Container style={s.container}>
            <Section style={s.header}>
              <Text style={s.wordmark}>{SITE_NAME.toUpperCase()}</Text>
              <Text style={s.headerTagline}>{tagline}</Text>
            </Section>

            <Section style={s.card}>
              <Section style={s.content}>{children}</Section>

              <Section style={s.footer}>
                <Text style={s.footerHeading}>Need help with this order?</Text>
                <Text style={s.footerText}>
                  Email{" "}
                  <Link href={`mailto:${SUPPORT_EMAIL}`} style={s.link}>
                    {SUPPORT_EMAIL}
                  </Link>{" "}
                  and a person will read it.
                </Text>
                <Text style={s.footerText}>
                  WhatsApp{" "}
                  <Link href={`https://wa.me/${WHATSAPP_NUMBER}`} style={s.link}>
                    {PHONE_DISPLAY}
                  </Link>{" "}
                  &mdash; or save the number and message us: {PHONE_DISPLAY}
                </Text>
                <Text style={s.legal}>
                  You are getting this email because you placed an order at{" "}
                  <Link href={SITE_URL} style={s.link}>
                    {SITE_URL.replace(/^https?:\/\//, "")}
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

/**
 * The order reference block. Large, high contrast, wide letter spacing, plain
 * selectable text in a single element - never an image and never split across
 * elements, because customers copy this string to track their order.
 */
export function OrderReferenceBlock({ orderRef }: { orderRef: string }) {
  return (
    <Section style={s.refPanel}>
      <Text style={s.refLabel}>Your tracking reference</Text>
      <Text style={s.refValue}>{orderRef}</Text>
      <Text style={s.refHint}>
        Quote this reference in any message about your order.
      </Text>
    </Section>
  );
}

/**
 * Call to action for the public tracking page. Renders a button AND the bare
 * URL as visible text, because some clients strip the button entirely.
 */
export function TrackOrderCallToAction({ trackUrl }: { trackUrl: string }) {
  return (
    <Section style={{ margin: "0 0 22px" }}>
      <Text style={{ margin: "0 0 14px" }}>
        <Link href={trackUrl} style={s.button}>
          Track my order
        </Link>
      </Text>
      <Text style={s.smallParagraph}>
        Or open this link directly:{" "}
        <Link href={trackUrl} style={s.link}>
          {trackUrl}
        </Link>
      </Text>
      <Text style={s.smallParagraph}>
        You will be asked for the mobile number you gave at checkout.
      </Text>
    </Section>
  );
}

/**
 * The product artwork, as sold.
 *
 * Renders nothing at all when there is no absolute https URL - a broken image
 * icon is worse than no image. When it does render, every surrounding element
 * still carries the product name and price as text, so a client with images
 * blocked (which is the default in Outlook and in Gmail for unknown senders)
 * loses decoration and no information.
 *
 * Explicit width and height, and a real alt, because both are required for the
 * blocked-image case to lay out sensibly. 552 = the 600px container less its
 * 2x24px padding, at the 1.586:1 card ratio.
 */
export function ProductImage({
  src,
  productName,
}: {
  src: string | null;
  productName: string;
}) {
  if (!src) return null;

  return (
    <Section style={{ margin: "0 0 20px" }}>
      <Img
        src={src}
        alt={`${productName} NFC card`}
        width="552"
        height="348"
        style={{
          borderRadius: "8px",
          display: "block",
          height: "auto",
          maxWidth: "100%",
          width: "100%",
        }}
      />
    </Section>
  );
}

/** A labelled value inside a panel. */
export function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <Section style={{ margin: last ? "0" : "0 0 14px" }}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </Section>
  );
}
