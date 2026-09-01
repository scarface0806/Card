import { describe, expect, it } from 'vitest';
import { render } from '@react-email/render';

import { OrderConfirmationEmail } from '@/lib/emails/templates/OrderConfirmationEmail';
import { OrderDeliveredEmail } from '@/lib/emails/templates/OrderDeliveredEmail';
import { OrderShippedEmail } from '@/lib/emails/templates/OrderShippedEmail';

/**
 * Email client compatibility, as assertions rather than good intentions.
 *
 * Gmail on mobile strips a <style> block's layout rules; Outlook renders
 * through Word, which supports neither flexbox nor grid. Anything on the
 * forbidden list below produces an email that looks broken in one of the two
 * clients this store actually has to work in.
 *
 * Templates are plain functions returning elements, so no JSX is needed here.
 */

const ORDER_REF = 'ORD-ABC123-XY9Z';
const TRACK_URL = 'https://tapvyo.com/track-order?ref=ORD-ABC123-XY9Z';

const confirmation = OrderConfirmationEmail({
  orderRef: ORDER_REF,
  trackUrl: TRACK_URL,
  templateName: 'Premium Metal',
  quantity: 2,
  amountPaid: '₹1,598.00 INR',
  proof: { name: 'Jane Doe', designation: 'Founder', company: 'Acme Pvt Ltd' },
});

const shipped = OrderShippedEmail({
  orderRef: ORDER_REF,
  trackUrl: TRACK_URL,
  courierName: 'Delhivery',
  trackingNumber: 'DL1234567890',
  trackingUrl: 'https://delhivery.com/track/DL1234567890',
  expectedDelivery: '12 Sep 2026 to 15 Sep 2026',
});

const delivered = OrderDeliveredEmail({
  orderRef: ORDER_REF,
  trackUrl: TRACK_URL,
});

const EMAILS = [
  { name: 'confirmation', element: confirmation },
  { name: 'shipped', element: shipped },
  { name: 'delivered', element: delivered },
];

describe.each(EMAILS)('$name email', ({ element }) => {
  it('renders a non-empty plain-text body from the same component', async () => {
    const text = await render(element, { plainText: true });

    expect(text.trim().length).toBeGreaterThan(50);
    // The reference has to survive into the text part too - it is the one
    // thing a customer needs from this email.
    expect(text).toContain(ORDER_REF);
  });

  it('uses table layout, not flexbox or grid', async () => {
    const html = await render(element);

    expect(html).toContain('<table');
    expect(html).not.toMatch(/display\s*:\s*flex/i);
    expect(html).not.toMatch(/display\s*:\s*grid/i);
    expect(html).not.toMatch(/display\s*:\s*inline-flex/i);
  });

  it('carries no stylesheet, style block or web font', async () => {
    const html = await render(element);

    expect(html).not.toMatch(/<style/i);
    expect(html).not.toMatch(/<link/i);
    expect(html).not.toMatch(/@import/i);
    expect(html).not.toMatch(/fonts\.googleapis\.com/i);
    expect(html).not.toMatch(/fonts\.gstatic\.com/i);
    expect(html).not.toMatch(/@font-face/i);
  });

  it('is centered at a 600px maximum width', async () => {
    const html = await render(element);

    expect(html).toMatch(/max-width\s*:\s*600px/i);
    expect(html).toContain('align="center"');
  });

  it('is fully readable with images blocked', async () => {
    const html = await render(element);

    // The simplest way to guarantee it: there are no images at all. If one is
    // ever added it must carry both an alt attribute and an explicit width.
    const images = html.match(/<img\b[^>]*>/gi) ?? [];
    for (const img of images) {
      expect(img).toMatch(/\salt=/i);
      expect(img).toMatch(/\swidth=/i);
    }
  });

  it('shows the order reference as one contiguous, selectable string', async () => {
    const html = await render(element);

    // Not split across elements and not inside an image.
    expect(html).toContain(ORDER_REF);
  });
});

describe('confirmation email content', () => {
  it('carries the 24 hour proofing line verbatim, outside the footer', async () => {
    const html = await render(confirmation);
    const text = await render(confirmation, { plainText: true });
    const line =
      'Reply to this email within 24 hours if anything is wrong, we print after that';

    expect(html).toContain(line);
    expect(text).toContain(line);

    // It must appear before the support/footer block, not inside it.
    expect(html.indexOf(line)).toBeLessThan(html.indexOf('Need help with this order?'));
  });

  it('shows the submitted details for proofing', async () => {
    const text = await render(confirmation, { plainText: true });

    expect(text).toContain('Jane Doe');
    expect(text).toContain('Founder');
    expect(text).toContain('Acme Pvt Ltd');
    expect(text).toContain('Premium Metal');
    expect(text).toContain('1,598.00');
  });

  it('offers the tracking page as a button AND as bare visible text', async () => {
    const html = await render(confirmation);
    const text = await render(confirmation, { plainText: true });

    // Two occurrences in the HTML: the styled call to action and the plain URL
    // shown for clients that strip buttons.
    const occurrences = html.split(TRACK_URL).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
    expect(text).toContain(TRACK_URL);
  });

  it('gives both support channels, with no noreply address', async () => {
    const text = await render(confirmation, { plainText: true });

    expect(text).toContain('hello@tapvyo.com');
    expect(text).toContain('+91 78713 61025');
    expect(text.toLowerCase()).not.toContain('noreply');
    expect(text.toLowerCase()).not.toContain('no-reply');

    const html = await render(confirmation);
    expect(html).toContain('https://wa.me/917871361025');
  });
});

describe('shipped email content', () => {
  it('carries courier, tracking number and the delivery window', async () => {
    const text = await render(shipped, { plainText: true });

    expect(text).toContain('Delhivery');
    expect(text).toContain('DL1234567890');
    expect(text).toContain('12 Sep 2026 to 15 Sep 2026');
  });
});
