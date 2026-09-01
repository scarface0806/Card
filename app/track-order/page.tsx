import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';

import TrackOrderClient from './TrackOrderClient';

/**
 * Public order tracking. No login.
 *
 * `?ref=` comes from the confirmation email and prefills the reference field.
 * It is only a convenience: the lookup still requires the mobile number, so a
 * forwarded email on its own opens nothing. The reference is read here on the
 * server purely to seed the input - no lookup happens on render.
 */
export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawRef = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  const initialRef = (rawRef || '').trim().toUpperCase().slice(0, 64);

  return (
    <>
      <Navbar />
      <main className="tv-hero min-h-screen pt-32 pb-24">
        <div className="site-container">
          <div className="max-w-xl mx-auto space-y-8">
            <div className="space-y-3">
              <p className="tv-eyebrow">Order tracking</p>
              <h1 className="tv-h2">Where is my card?</h1>
              <p className="tv-lead">
                Enter your order reference and the mobile number you gave at
                checkout. Both have to match the same order.
              </p>
            </div>

            <TrackOrderClient initialRef={initialRef} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
