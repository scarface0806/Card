/**
 * Razorpay Payment Hook
 *
 * This hook handles Razorpay payment integration seamlessly.
 * It plugs into the existing order flow without any UI changes.
 *
 * Usage in order page:
 * - const { initiatePayment, isLoading, error, status } = useRazorpayPayment();
 * - In Place Order button click: await initiatePayment(orderData)
 *
 * The hook never decides on its own that a payment succeeded. Checkout's handler
 * callback runs in the browser and is spoofable, so the result is whatever
 * /api/payment/verify says after recomputing the signature server-side.
 */

import { useState, useCallback, useRef } from 'react';
import { razorpayDebugger } from '@/lib/razorpay-debug';

const CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

interface PaymentOrderData {
  existingOrderId: string; // Order ID from database
  userEmail: string;
  userName: string;
  userPhone?: string;
  paymentMethod?: string; // 'card', 'upi', 'wallet'
}

/** What actually happened, so the page can show the right UI. */
export type PaymentStatus =
  | 'idle'
  | 'loading_checkout'
  | 'creating_order'
  | 'awaiting_payment'
  | 'verifying'
  | 'succeeded'
  | 'cancelled'
  | 'failed'
  | 'verification_failed';

interface PaymentResponse {
  success: boolean;
  status: PaymentStatus;
  message?: string;
  paymentId?: string;
}

/** Resolves once the Checkout script is on the page, or false if it will not load. */
function loadCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  // Already loaded and evaluated.
  if ((window as any).Razorpay) return Promise.resolve(true);

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${CHECKOUT_SCRIPT_SRC}"]`
  );

  const script = existing ?? document.createElement('script');

  const settled = new Promise<boolean>((resolve) => {
    script.addEventListener('load', () => resolve(Boolean((window as any).Razorpay)), { once: true });
    script.addEventListener('error', () => resolve(false), { once: true });
  });

  if (!existing) {
    script.src = CHECKOUT_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }

  return settled;
}

export function useRazorpayPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('idle');

  // Guards against a double-click creating two Razorpay orders. A ref rather
  // than state because it has to be correct synchronously, before React renders.
  const inFlight = useRef(false);

  const initiatePayment = useCallback(
    async (data: PaymentOrderData): Promise<PaymentResponse> => {
      if (inFlight.current) {
        razorpayDebugger.log('WARN', 'useRazorpayPayment', 'Payment already in progress, ignoring duplicate call');
        return { success: false, status: 'awaiting_payment', message: 'A payment is already in progress' };
      }

      inFlight.current = true;
      setError(null);
      setIsLoading(true);

      const finish = (result: PaymentResponse): PaymentResponse => {
        inFlight.current = false;
        setIsLoading(false);
        setStatus(result.status);
        setError(result.success ? null : result.message ?? null);
        return result;
      };

      try {
        razorpayDebugger.log('INFO', 'useRazorpayPayment', 'Payment flow started', {
          existingOrderId: data.existingOrderId,
        });

        // Step 1: Load Checkout and wait for it. `new window.Razorpay()` before
        // this resolves is the classic "Razorpay is not defined" crash.
        setStatus('loading_checkout');
        const scriptLoaded = await loadCheckoutScript();

        if (!scriptLoaded) {
          razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Checkout script failed to load');
          return finish({
            success: false,
            status: 'failed',
            message:
              'We could not load the secure payment window. Check your internet connection or any ad blocker, then try again.',
          });
        }

        // Step 2: Create the order server-side. The amount comes from the DB.
        setStatus('creating_order');
        const response = await fetch('/api/payment/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            existingOrderId: data.existingOrderId,
            userEmail: data.userEmail,
            userName: data.userName,
            userPhone: data.userPhone,
          }),
        });

        const orderData = await response.json().catch(() => null);

        if (!response.ok || !orderData?.orderId) {
          const message = orderData?.error || orderData?.message || 'Could not start the payment. Please try again.';
          razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Order creation failed', { status: response.status });
          return finish({ success: false, status: 'failed', message });
        }

        razorpayDebugger.log('SUCCESS', 'useRazorpayPayment', 'Payment order created', {
          razorpayOrderId: orderData.orderId,
        });

        // Step 3: Open Checkout. Resolution is deferred to whichever callback fires.
        setStatus('awaiting_payment');

        return await new Promise<PaymentResponse>((resolve) => {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.keyId,
            amount: orderData.amount, // integer paise, from the server
            currency: orderData.currency || 'INR',
            order_id: orderData.orderId, // server-created order id
            name: 'Tapvyo',
            description: 'NFC Digital Card Purchase',
            prefill: {
              name: data.userName,
              email: data.userEmail,
              contact: data.userPhone,
            },
            notes: {
              existingOrderId: data.existingOrderId,
            },
            theme: {
              color: '#0f2e25',
            },
            handler: async (checkoutResponse: any) => {
              razorpayDebugger.log('INFO', 'useRazorpayPayment', 'Checkout handler fired', {
                paymentId: checkoutResponse.razorpay_payment_id,
                orderId: checkoutResponse.razorpay_order_id,
              });

              setStatus('verifying');

              try {
                const verifyRes = await fetch('/api/payment/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    existingOrderId: data.existingOrderId,
                    razorpayPaymentId: checkoutResponse.razorpay_payment_id,
                    razorpayOrderId: checkoutResponse.razorpay_order_id,
                    razorpaySignature: checkoutResponse.razorpay_signature,
                  }),
                });

                const verification = await verifyRes.json().catch(() => null);

                // Only the server's verdict counts.
                if (verifyRes.ok && verification?.success) {
                  razorpayDebugger.log('SUCCESS', 'useRazorpayPayment', 'Payment verified by server');
                  resolve(
                    finish({
                      success: true,
                      status: 'succeeded',
                      message: 'Payment successful',
                      paymentId: checkoutResponse.razorpay_payment_id,
                    })
                  );
                  return;
                }

                razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Server rejected the payment');
                resolve(
                  finish({
                    success: false,
                    status: 'verification_failed',
                    message: `We could not confirm your payment. If money has left your account, contact support with payment ID ${checkoutResponse.razorpay_payment_id} and we will sort it out.`,
                    paymentId: checkoutResponse.razorpay_payment_id,
                  })
                );
              } catch {
                razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Verification request failed');
                resolve(
                  finish({
                    success: false,
                    status: 'verification_failed',
                    message: `We could not reach our servers to confirm your payment. If money has left your account, contact support with payment ID ${checkoutResponse.razorpay_payment_id}.`,
                    paymentId: checkoutResponse.razorpay_payment_id,
                  })
                );
              }
            },
            modal: {
              ondismiss: () => {
                razorpayDebugger.log('WARN', 'useRazorpayPayment', 'Checkout dismissed by user');
                resolve(
                  finish({
                    success: false,
                    status: 'cancelled',
                    message: 'Payment cancelled. Your order is saved - you can pay again whenever you are ready.',
                  })
                );
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);

          rzp.on('payment.failed', (failure: any) => {
            razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Payment failed', {
              code: failure?.error?.code,
              paymentId: failure?.error?.metadata?.payment_id,
            });

            resolve(
              finish({
                success: false,
                status: 'failed',
                message:
                  failure?.error?.description ||
                  'Your payment could not be completed. No money has been taken - please try another card or method.',
              })
            );
          });

          rzp.open();
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Payment initiation failed', { error: errorMsg });
        return finish({ success: false, status: 'failed', message: errorMsg });
      }
    },
    []
  );

  return {
    initiatePayment,
    isLoading,
    error,
    status,
  };
}
