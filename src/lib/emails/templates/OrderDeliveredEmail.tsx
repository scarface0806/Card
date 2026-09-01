/**
 * Delivered notice - sent when an admin moves the order to DELIVERED.
 * Deliberately short: confirm it landed, and make it easy to tell us if the
 * cards are wrong.
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";

import {
  OrderEmailLayout,
  OrderReferenceBlock,
} from "../components/OrderEmailLayout";
import * as s from "../components/styles";
import type { OrderDeliveredEmailData } from "../types";

export function orderDeliveredSubject(data: OrderDeliveredEmailData) {
  return `Delivered - ${data.orderRef}`;
}

export function OrderDeliveredEmail(data: OrderDeliveredEmailData) {
  const { orderRef } = data;

  return (
    <OrderEmailLayout
      preview={`Order ${orderRef} is marked delivered. Tap and go.`}
      tagline="Delivery confirmation"
    >
      <Text style={s.h1}>Your order has been delivered</Text>
      <Text style={s.paragraph}>
        Our courier has marked this order delivered. Tap your card on any phone
        to share your profile &mdash; no app needed on either side.
      </Text>

      <OrderReferenceBlock orderRef={orderRef} />

      <Section style={s.panel}>
        <Text style={{ ...s.paragraph, margin: "0" }}>
          Something wrong with the cards &mdash; a misprint, damage in transit,
          or a chip that will not read? Reply to this email with the reference
          above and we will sort it out.
        </Text>
      </Section>
    </OrderEmailLayout>
  );
}

export default OrderDeliveredEmail;
