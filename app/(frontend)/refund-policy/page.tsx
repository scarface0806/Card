'use client';

/**
 * REFUND & CANCELLATION POLICY
 *
 * Required for Razorpay / PayU / Cashfree merchant approval in India: a payment
 * gateway will not activate a live account without a reachable, specific refund
 * policy on the merchant's own domain.
 *
 * Layout is deliberately identical to /privacy-policy and /terms-conditions -
 * same surface, same page head, same `tv-prose` measure, same section rhythm
 * and the same per-section motion. The one structural addition is the optional
 * `bullets` / `body` fields on a section, because a refund policy has to state
 * enumerated conditions and a working contact link; `.tv-prose li` and
 * `.tv-prose a` are already defined in globals.css, so both inherit the page's
 * existing typography rather than introducing any new styling.
 *
 * `LAST_UPDATED` is a hardcoded constant, NOT `new Date()`. Two reasons: a
 * policy's last-updated date must be the date the terms actually changed, not
 * the date the visitor happened to load the page; and rendering today's date
 * inside a client component is a hydration mismatch waiting to happen when the
 * server and the browser disagree on timezone or locale.
 *
 * Every `[CONFIRM]` marker below is a business decision the owner must make.
 * They are rendered as visible text on purpose - they are impossible to miss
 * and must all be resolved before this page goes in front of a gateway.
 */

import type { ReactNode } from 'react';

import {
  PHONE_DISPLAY,
  REPLACEMENT_GUARANTEE_DAYS,
  SUPPORT_EMAIL,
  whatsappLink,
} from '@/lib/site-config';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';

const LAST_UPDATED = 'November 16, 2026';

type Section = {
  title: string;
  content?: string;
  bullets?: string[];
  body?: ReactNode;
};

export default function RefundPolicyPage() {
  const sections: Section[] = [
    {
      title: '1. Overview',
      content:
        'Every Tapvyo NFC card is personalised and made to order. Your name, designation, company, artwork and the unique profile link written to the card\'s chip are applied to that specific card for you alone, which means a finished card cannot be resold or restocked. This policy explains exactly when an order can be cancelled, when a refund is available, and when we replace a card instead of refunding it. It applies to all orders placed through our website.',
    },
    {
      title: '2. Cancellation window',
      content:
        'You may cancel your order for a full refund within 24 hours [CONFIRM] of placing it, provided we have not yet started encoding the chip or sent your card to print. To cancel, email or WhatsApp us with your Order ID as described in section 9. If production has not begun, we will confirm the cancellation and refund the full amount paid.',
    },
    {
      title: '3. Once production has started',
      content:
        'Once the chip has been encoded or the card has gone to print, the order can no longer be cancelled and is not eligible for a refund. This is because the card is personalised and made to order: it carries your details and your profile link, and it has no resale value to anyone else. We will always tell you if production has already started when you contact us.',
    },
    {
      title: '4. Custom-design and bulk orders',
      content:
        'Custom-design orders and bulk orders of 25 cards or more are non-cancellable and non-refundable once you have approved the design proof. Design approval is the point at which we commit materials and production time to your order. Please check the proof carefully - spelling of names, designations, phone numbers and company details - before approving it, because corrections after approval require a new order.',
    },
    // TODO(owner): review this section before publishing. It is DRAFT wording
    // for the 30-day NFC replacement guarantee advertised next to every "Get
    // your card" button (REPLACEMENT_GUARANTEE_TEXT in site-config.ts). Check
    // the window, the 48-hour transit-damage deadline, who pays return
    // shipping, and whether you want the old card back. Kept as section 5 so
    // the "section 6 / 9" cross-references elsewhere on this page still hold.
    {
      title: `5. Free replacement guarantee and damaged cards`,
      content: `NFC not working? We replace it free within ${REPLACEMENT_GUARANTEE_DAYS} days. If the NFC chip on your card does not respond when tapped within ${REPLACEMENT_GUARANTEE_DAYS} days of delivery, we will send you a new card free of charge, including shipping. Replacement, not a refund, is the remedy for these cases - you receive a working card at no additional cost.`,
      bullets: [
        `The ${REPLACEMENT_GUARANTEE_DAYS}-day window starts on the delivery date shown in your order tracking.`,
        'It covers a chip that does not respond on a phone with NFC hardware switched on. Your card also carries a QR code on the back, which opens the same profile on any phone.',
        'If your card arrives physically damaged in transit, report it within 48 hours [CONFIRM] of delivery so we can file a claim with the courier.',
        'Damage caused after delivery is not covered - see section 7.',
        'To claim, contact us using the details in section 9 with your Order ID and the evidence described in section 6.',
      ],
    },
    {
      title: '6. Evidence required for a damage claim',
      content:
        'For any damage or non-working-chip claim we need photographs, or a short unboxing video, clearly showing the following. Please keep the outer packaging until the claim is resolved - a courier damage claim cannot be filed without it.',
      bullets: [
        'The shipping label on the outer packaging, with the tracking number readable.',
        'The unopened package before you open it, if you are reporting transit damage.',
        'The damaged card itself, with the damage clearly visible.',
        'For a non-working chip: a short video of the card being tapped against a phone with NFC switched on.',
      ],
    },
    {
      title: '7. What is not covered',
      content:
        'The following are not eligible for a refund or a free replacement. In several of these cases we can still reprint your card at a reduced charge [CONFIRM] - contact us and we will tell you the cost before you commit.',
      bullets: [
        'Incorrect details that were submitted by you at checkout and printed as supplied - please proofread carefully before paying.',
        'A change of mind about the design, colour or finish after production has started.',
        'Damage caused after delivery, including bending, cutting, drilling, scratching, submersion in water or exposure to heat.',
        'A chip that stops working because the card was physically damaged in use.',
        'Inability to read the card on a device that has no NFC hardware, or that has NFC switched off. Your card also carries a QR code and a profile link, which work on any phone.',
        'Delays caused by an incorrect or incomplete delivery address supplied at checkout. See our Shipping & Delivery Policy.',
      ],
    },
    {
      title: '8. Refund method and processing time',
      content:
        'Approved refunds are issued to the original payment method only - the same card, UPI ID, wallet or bank account used to pay. We cannot redirect a refund to a different account, and we do not issue refunds in cash or as store credit unless you specifically ask for credit instead. Once a refund is approved, we process it within 5-7 working days. Your bank or card issuer may then take a further 2-5 working days to post the amount to your statement, which is outside our control. Any payment-gateway fee deducted at the time of the original transaction is refunded along with the order amount.',
    },
    {
      title: '9. How to raise a cancellation, refund or replacement request',
      content:
        'Contact us using either channel below and always include your Order ID - it is in your order confirmation email and on your order page. Without an Order ID we cannot locate your order. Please also include a one-line description of the problem, and the photographs or video described in section 6 if you are claiming damage.',
      body: (
        <ul>
          <li>
            Email:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </li>
          <li>
            WhatsApp:{' '}
            <a
              href={whatsappLink('Hi, I need help with my Tapvyo order. My Order ID is: ')}
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
      title: '10. The free digital profile',
      content:
        'Every Tapvyo card includes a free lifetime digital profile. It is bundled with the card at no separate charge, so there is no separate amount to refund for it and no subscription to cancel. If your card order is cancelled and refunded before production, the associated profile is deactivated at the same time. A refund of a card does not entitle you to a separate refund for the profile, because nothing was charged for it.',
    },
    {
      title: '11. Profile update charges',
      content:
        'Profiles are not self-editable. Updates are made by our team on request via WhatsApp and are charged ₹49 per request, as set out in section 7 of our Terms & Conditions.',
      bullets: [
        'The ₹49 profile update charge is a service fee and is non-refundable once the requested update has been applied to your profile.',
        'If Tapvyo is unable to complete a requested update, the ₹49 charge for that request is refunded in full, by the method described in section 8.',
        'If we make a mistake carrying out your request, we will correct it at no further charge.',
        'The update charge is separate from the card price and does not affect any refund or replacement entitlement relating to the physical card itself.',
      ],
    },
    {
      title: '12. Changes to this policy',
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
              Refund &amp; Cancellation Policy
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
