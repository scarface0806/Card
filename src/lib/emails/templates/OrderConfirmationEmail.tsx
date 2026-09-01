/**
 * Order confirmation - sent from the server-side payment-success path only.
 *
 * The two things this email exists to do: hand the customer a reference they
 * can copy, and show them exactly what we are about to print so they can catch
 * a typo before the card goes to production.
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";

import {
  DetailRow,
  OrderEmailLayout,
  OrderReferenceBlock,
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
  return `Order confirmed - ${data.orderRef}`;
}

export function OrderConfirmationEmail(data: OrderConfirmationEmailData) {
  const { orderRef, trackUrl, templateName, quantity, amountPaid, proof } = data;

  return (
    <OrderEmailLayout
      preview={`Payment received. Your order reference is ${orderRef}.`}
      tagline="Order confirmation"
    >
      <Text style={s.h1}>Payment received &mdash; your order is confirmed</Text>
      <Text style={s.paragraph}>
        Thank you. We have your payment and your card is queued for printing.
      </Text>

      <OrderReferenceBlock orderRef={orderRef} />

      <Section style={s.panel}>
        <DetailRow label="Card template" value={templateName} />
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
        <DetailRow label="Company" value={proof.company || "Not given"} last />
      </Section>

      <Section style={s.alertPanel}>
        <Text style={s.alertText}>{PROOF_DEADLINE_LINE}</Text>
      </Section>

      <TrackOrderCallToAction trackUrl={trackUrl} />
    </OrderEmailLayout>
  );
}

export default OrderConfirmationEmail;
