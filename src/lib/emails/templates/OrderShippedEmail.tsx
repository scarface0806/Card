/**
 * Shipped notice - sent when an admin moves the order to SHIPPED.
 *
 * Courier name and tracking number are required by the send orchestration
 * before this is rendered at all, so the template never has to hedge about a
 * missing courier: a blank one fails into email_log instead.
 */

import * as React from "react";
import { Link, Section, Text } from "@react-email/components";

import {
  DetailRow,
  OrderEmailLayout,
  OrderReferenceBlock,
  TrackOrderCallToAction,
} from "../components/OrderEmailLayout";
import * as s from "../components/styles";
import type { OrderShippedEmailData } from "../types";

export function orderShippedSubject(data: OrderShippedEmailData) {
  return `Your Tapvyo card has shipped - ${data.orderRef}`;
}

export function OrderShippedEmail(data: OrderShippedEmailData) {
  const {
    orderRef,
    trackUrl,
    courierName,
    trackingNumber,
    trackingUrl,
    expectedDelivery,
  } = data;

  return (
    <OrderEmailLayout
      preview={`On its way with ${courierName}. Tracking number ${trackingNumber}.`}
      tagline="Shipping update"
    >
      <Text style={s.h1}>Your card is on its way</Text>
      <Text style={s.paragraph}>
        Your order has left us and is now with the courier.
      </Text>

      <OrderReferenceBlock orderRef={orderRef} />

      <Section style={s.panel}>
        <DetailRow label="Courier" value={courierName} />
        <DetailRow label="Tracking number" value={trackingNumber} />
        <DetailRow
          label="Expected delivery"
          value={expectedDelivery || "The courier will confirm the date"}
          last={!trackingUrl}
        />
        {trackingUrl ? (
          <Section style={{ margin: "0" }}>
            <Text style={s.label}>Track with the courier</Text>
            <Text style={{ ...s.value, fontWeight: 400 }}>
              <Link href={trackingUrl} style={s.link}>
                {trackingUrl}
              </Link>
            </Text>
          </Section>
        ) : null}
      </Section>

      <TrackOrderCallToAction trackUrl={trackUrl} />
    </OrderEmailLayout>
  );
}

export default OrderShippedEmail;
