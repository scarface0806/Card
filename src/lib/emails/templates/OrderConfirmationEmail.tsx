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
 */

import * as React from "react";
import { Link, Section, Text } from "@react-email/components";

import {
  DetailRow,
  OrderEmailLayout,
  OrderReferenceBlock,
  ProductImage,
  TrackOrderCallToAction,
} from "../components/OrderEmailLayout";
import * as s from "../components/styles";
import type { OrderConfirmationEmailData } from "../types";

/**
 * Required wording. Do not soften it, do not move it into the footer - it is
 * the customer's only window to correct what gets printed.
 */
const PROOF_DEADLINE_LINE =
  "Reply to this email within 24 hours if anything is wrong, we print after that";

export function orderConfirmationSubject(data: OrderConfirmationEmailData) {
  return `Order confirmed - ${data.productName} - ${data.orderRef}`;
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

  return (
    <OrderEmailLayout
      preview={`Payment received for your ${productName}. Reference ${orderRef}.`}
      tagline="Order confirmation"
    >
      <Text style={s.h1}>Payment received &mdash; your order is confirmed</Text>
      <Text style={s.paragraph}>
        Thank you. We have your payment and your card is queued for printing.
      </Text>

      <OrderReferenceBlock orderRef={orderRef} />

      {/* Decoration only - the name, tier and price are all repeated as text
          below, so a client with images blocked loses nothing. */}
      <ProductImage src={productImageUrl} productName={productName} />

      <Section style={s.panel}>
        <DetailRow label="Card" value={productName} />
        {productTier ? <DetailRow label="Card type" value={productTier} /> : null}
        <DetailRow label="Quantity" value={String(quantity)} />
        <DetailRow label="Amount paid" value={amountPaid} last />
      </Section>

      <Section style={s.proofPanel}>
        <Text style={s.proofHeading}>Check this before we print</Text>
        <Text style={s.proofNote}>
          These are the details exactly as you submitted them. This is what gets
          printed on the card, so please read it for typos &mdash; spelling,
          capitalisation and spacing included.
        </Text>
        <DetailRow label="Name" value={proof.name} />
        <DetailRow label="Designation" value={proof.designation || "Not given"} />
        <DetailRow label="Company" value={proof.company || "Not given"} />
        <DetailRow label="Mobile" value={proof.mobile || "Not given"} />
        <DetailRow label="Email" value={proof.email || "Not given"} last />
      </Section>

      <Section style={s.alertPanel}>
        <Text style={s.alertText}>{PROOF_DEADLINE_LINE}</Text>
      </Section>

      <Section style={s.panel}>
        <Text style={s.label}>Your digital profile</Text>
        {profileUrl ? (
          <Text style={{ ...s.value, fontWeight: 400 }}>
            <Link href={profileUrl} style={s.link}>
              {profileUrl}
            </Link>
          </Text>
        ) : (
          <Text style={{ ...s.smallParagraph, margin: "0" }}>
            Your free lifetime profile is created once we start production. We
            will email you the link &mdash; it is also encoded on the card
            itself, so tapping the card always opens the latest version.
          </Text>
        )}
      </Section>

      <TrackOrderCallToAction trackUrl={trackUrl} />
    </OrderEmailLayout>
  );
}

export default OrderConfirmationEmail;
