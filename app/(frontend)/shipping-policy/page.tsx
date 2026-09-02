'use client';

/**
 * SHIPPING & DELIVERY POLICY
 *
 * Required alongside the refund policy for Razorpay / PayU / Cashfree merchant
 * approval in India: a gateway needs stated dispatch and delivery timelines,
 * stated shipping charges and a stated serviceable area before it will approve
 * a live account.
 *
 * Layout matches /privacy-policy, /terms-conditions and /refund-policy exactly
 * - same surface, page head, `tv-prose` measure, section rhythm and motion.
 *
 * `LAST_UPDATED` is a constant rather than `new Date()`, for the same two
 * reasons given in /refund-policy: the date must reflect when the policy
 * changed, and today's date inside a client component risks a hydration
 * mismatch on timezone or locale.
 *
 * CONSISTENCY NOTE: section 4 states that shipping is included in the price.
 * That is not a copywriting choice - it matches the checkout, which hardcodes
 * `shipping = 0` when it builds the order (see app/api/orders/route.ts), and
 * the "shipping included" line already shown on /create-card. If shipping ever
 * starts being charged, all three have to change together.
 *
 * Every `[CONFIRM]` marker is a business decision the owner must make, and is
 * rendered as visible text so it cannot be shipped by accident.
 */

import type { ReactNode } from 'react';

import { PHONE_DISPLAY, SUPPORT_EMAIL, whatsappLink } from '@/lib/site-config';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';

const LAST_UPDATED = 'September 2, 2026';

type Section = {
  title: string;
  content?: string;
  bullets?: string[];
  body?: ReactNode;
};

export default function ShippingPolicyPage() {
  const sections: Section[] = [
    {
      title: '1. Overview',
      content:
        'Every Tapvyo card is personalised and made to order, so an order goes through two distinct stages: production, where your details are printed and your NFC chip is encoded, and delivery, where the finished card is shipped to you. The timelines below cover both. All timelines are quoted in working days, which excludes Sundays and public holidays.',
    },
    {
      title: '2. Production time before dispatch',
      content:
        'We need 2-4 working days [CONFIRM] to produce your card after your order and payment are confirmed. This covers proofing your details, printing the card, encoding the NFC chip with your profile link and quality-checking the tap before it is packed. Production starts from the point your details are final. If we need to come back to you for a clarification or a corrected file, the clock starts when you reply.',
    },
    {
      title: '3. Delivery timelines',
      content:
        'Delivery time is counted from dispatch, not from when the order was placed. Add the production time in section 2 to estimate the total time from order to doorstep.',
      bullets: [
        'Metro cities: 4-7 working days [CONFIRM] after dispatch. Covers Chennai, Bengaluru, Hyderabad, Mumbai, Delhi NCR, Kolkata, Pune and Ahmedabad.',
        'Non-metro cities and towns: 7-10 working days [CONFIRM] after dispatch.',
        'Remote and hard-to-reach pincodes: 10-14 working days [CONFIRM] after dispatch. Includes the North-East, Jammu & Kashmir, Ladakh, Andaman & Nicobar Islands, Lakshadweep and interior locations our courier partners classify as remote.',
      ],
    },
    {
      title: '4. Shipping charges',
      content:
        'Shipping is included in the price shown on the product page. There are no separate delivery charges, no handling fees and no surprise charges at checkout - the total you see before paying is the total you pay. This applies to all serviceable pincodes across India, including remote locations. The only situation in which a delivery-related charge can arise is a re-shipment after a failed delivery, described in section 8.',
    },
    {
      title: '5. Bulk orders',
      content:
        'Bulk orders of 25 cards or more are produced on a separate schedule and quoted individually, because production time scales with quantity and often involves a custom design step. As a guide, allow 7-12 working days [CONFIRM] for production before dispatch, plus the delivery time for your location from section 3. We confirm a firm dispatch date in writing when we send your design proof for approval. Bulk orders ship as a single consignment unless you ask us to split the delivery.',
    },
    {
      title: '6. Courier partners and tracking',
      content:
        'We ship through established courier partners: [CONFIRM - list your couriers, for example Blue Dart, Delhivery, DTDC, India Post]. We choose the partner based on which one services your pincode most reliably, so the courier handling your order may differ from a previous order. As soon as your card is dispatched we send you the courier name and tracking number by email and on WhatsApp, so you can follow the consignment directly with the courier. You can also see your courier and tracking number on your order page once it is available.',
    },
    {
      title: '7. Serviceable areas',
      content:
        'We deliver to all serviceable pincodes across India. If your pincode is not serviced by any of our courier partners we will contact you within one working day of your order to arrange an alternative or, if none is possible, to cancel and refund the order in full. International shipping: [CONFIRM - state whether you ship outside India, and if so to which countries, at what cost and with what customs-duty responsibility]. At present we do not advertise international delivery, so please contact us before ordering from outside India.',
    },
    {
      title: '8. Incorrect addresses and failed deliveries',
      content:
        'The delivery address you enter at checkout is the address we ship to, so please check it carefully - particularly the pincode, the house or flat number and a landmark. The following applies when a delivery cannot be completed.',
      bullets: [
        'If you notice a mistake in your address, contact us immediately. We can change it free of charge at any time before dispatch. After dispatch the address cannot be changed.',
        'Couriers normally attempt delivery two or three times. Please make sure the phone number you gave us is reachable, as couriers call before delivering.',
        'If delivery fails because the address was incorrect or incomplete, nobody was available across all attempts, or the consignment was refused, the parcel is returned to us as an RTO (Return to Origin).',
        'We will contact you when an RTO parcel reaches us and can re-ship it to a corrected address. Re-shipping is charged at actuals [CONFIRM - state your re-shipping charge, for example a flat Rs.99], payable before we send it out again, because the original shipping cost has already been incurred.',
        'A card returned as an RTO is not eligible for a refund, since it is personalised and cannot be resold. It remains available for re-shipping to you.',
      ],
    },
    {
      title: '9. Your digital profile goes live independently',
      content:
        'Your free digital profile does not wait for the courier. It is created and goes live as soon as your order details are confirmed, and we send you the link straight away - so you can start sharing your profile by link, QR code or WhatsApp while the physical card is still in production or in transit. The card, once it arrives, simply becomes a second way to open the same profile with a tap. Nothing about your profile depends on the card being delivered.',
    },
    {
      title: '10. Checking on a delivery',
      content:
        'If your order has passed the timeline above, or your tracking has not moved for more than three working days, contact us with your Order ID and we will take it up with the courier on your behalf. Your Order ID is in your order confirmation email and on your order page.',
      body: (
        <ul>
          <li>
            Email:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </li>
          <li>
            WhatsApp:{' '}
            <a
              href={whatsappLink(
                'Hi, I would like an update on the delivery of my Tapvyo order. My Order ID is: '
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {PHONE_DISPLAY}
            </a>
          </li>
        </ul>
      ),
    },
    {
      title: '11. Changes to this policy',
      content:
        'We may update this policy from time to time. The version published on this page at the moment you place your order is the version that applies to that order. The last updated date is shown at the top of this page.',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="tv-surface-bone tv-page-head pb-20 min-h-screen">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h1 className="tv-h2 mb-3">
              Shipping &amp; Delivery Policy
            </h1>
            <p className="tv-mono">
              Last updated: {LAST_UPDATED}
            </p>
          </motion.div>

          <div className="tv-prose">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="py-7 border-b border-[#12100C]/12 last:border-b-0"
              >
                <h2 className="tv-h3 mb-3">
                  {section.title}
                </h2>
                {section.content && (
                  <p className="tv-body">
                    {section.content}
                  </p>
                )}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {section.body}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
