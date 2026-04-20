/**
 * Razorpay Payment Hook
 * 
 * This hook handles Razorpay payment integration seamlessly.
 * It plugs into the existing order flow without any UI changes.
 * 
 * Usage in order page:
 * - const { initiatePayment, isLoading, error } = useRazorpayPayment();
 * - In Place Order button click: await initiatePayment(orderData)
 */

import { useState, useCallback, useEffect } from 'react';
import { razorpayDebugger } from '@/lib/razorpay-debug';

interface PaymentOrderData {
  existingOrderId: string; // Order ID from database
  amount: number; // Amount in ₹ (will be converted to paise)
  userEmail: string;
  userName: string;
  userPhone?: string;
  paymentMethod?: string; // 'card', 'upi', 'wallet'
}

interface PaymentResponse {
  success: boolean;
  message?: string;
  paymentId?: string;
  orderId?: string;
}

export function useRazorpayPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  /**
   * Load Razorpay script if not already loaded
   */
  const loadRazorpayScript = useCallback(async () => {
    if (isScriptLoaded) return true;

    try {
      razorpayDebugger.log('INFO', 'useRazorpayPayment', 'Loading Razorpay script');

      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          razorpayDebugger.log('SUCCESS', 'useRazorpayPayment', 'Razorpay script loaded');
          setIsScriptLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Failed to load Razorpay script');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    } catch (err) {
      razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Error loading script', { error: String(err) });
      return false;
    }
  }, [isScriptLoaded]);

  /**
   * Create Razorpay order via backend API
   */
  const createRazorpayOrder = useCallback(
    async (data: PaymentOrderData): Promise<any> => {
      try {
        razorpayDebugger.log('INFO', 'useRazorpayPayment.createOrder', 'Creating Razorpay order', {
          existingOrderId: data.existingOrderId,
          amount: data.amount,
        });

        const response = await fetch('/api/payment/create-razorpay-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            existingOrderId: data.existingOrderId,
            amount: data.amount,
            userEmail: data.userEmail,
            userName: data.userName,
            userPhone: data.userPhone,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          razorpayDebugger.log('ERROR', 'useRazorpayPayment.createOrder', 'API error', {
            status: response.status,
            error: errorData,
          });
          throw new Error(errorData.error || 'Failed to create order');
        }

        const orderData = await response.json();
        razorpayDebugger.log('SUCCESS', 'useRazorpayPayment.createOrder', 'Order created', {
          razorpayOrderId: orderData.razorpay_order_id,
          amount: orderData.amount,
        });

        return orderData;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        razorpayDebugger.log('ERROR', 'useRazorpayPayment.createOrder', 'Order creation error', {
          error: errorMsg,
        });
        throw err;
      }
    },
    []
  );

  /**
   * Verify payment signature with backend
   */
  const verifyPayment = useCallback(
    async (
      existingOrderId: string,
      razorpayPaymentId: string,
      razorpayOrderId: string,
      razorpaySignature: string
    ): Promise<PaymentResponse> => {
      try {
        razorpayDebugger.log('INFO', 'useRazorpayPayment.verify', 'Verifying payment', {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
        });

        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            existingOrderId,
            razorpayPaymentId,
            razorpayOrderId,
            razorpaySignature,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          razorpayDebugger.log('ERROR', 'useRazorpayPayment.verify', 'Verification failed', {
            status: response.status,
            error: errorData,
          });
          throw new Error(errorData.error || 'Payment verification failed');
        }

        const result = await response.json();
        razorpayDebugger.log('SUCCESS', 'useRazorpayPayment.verify', 'Payment verified', {
          paymentId: result.paymentId,
        });

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        razorpayDebugger.log('ERROR', 'useRazorpayPayment.verify', 'Verification error', {
          error: errorMsg,
        });
        throw err;
      }
    },
    []
  );

  /**
   * Initiate payment flow (main function to call from Place Order button)
   */
  const initiatePayment = useCallback(
    async (data: PaymentOrderData): Promise<PaymentResponse> => {
      return new Promise(async (resolve) => {
        setError(null);
        setIsLoading(true);

        try {
          razorpayDebugger.log('INFO', 'useRazorpayPayment.initiatePayment', 'Payment flow started', {
            existingOrderId: data.existingOrderId,
            amount: data.amount,
          });

          // Step 1: Load Razorpay script
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            const error = 'Failed to load Razorpay script. Please check your internet connection.';
            setError(error);
            setIsLoading(false);
            resolve({ success: false, message: error });
            return;
          }

          // Step 2: Create Razorpay order
          const orderData = await createRazorpayOrder(data);

          // Step 3: Open checkout
          razorpayDebugger.log('INFO', 'useRazorpayPayment.initiatePayment', 'Opening Razorpay checkout');

          // SECURITY: Use key from API response instead of environment variable
          // This ensures frontend always uses the correct public key
          const razorpayKey = orderData.razorpay_key;
          
          if (!razorpayKey) {
            throw new Error('Razorpay key not received from backend');
          }

          const options = {
            key: razorpayKey,
            amount: orderData.amount, // in paise
            currency: 'INR',
            name: 'Tapvyo',
            description: 'NFC Digital Card Purchase',
            order_id: orderData.razorpay_order_id,
            prefill: {
              name: data.userName,
              email: data.userEmail,
              contact: data.userPhone,
            },
            notes: {
              existingOrderId: data.existingOrderId,
              paymentMethod: data.paymentMethod || 'card',
            },
            theme: {
              color: '#0f2e25',
            },
            handler: async (response: any) => {
              razorpayDebugger.log('SUCCESS', 'useRazorpayPayment', 'Payment handler called', {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });

              try {
                // Step 4: Verify payment signature
                const verificationResult = await verifyPayment(
                  data.existingOrderId,
                  response.razorpay_payment_id,
                  response.razorpay_order_id,
                  response.razorpay_signature
                );

                if (verificationResult.success) {
                  razorpayDebugger.log('SUCCESS', 'useRazorpayPayment', 'Payment completed successfully');
                  setIsLoading(false);
                  resolve({ success: true, message: 'Payment successful', paymentId: response.razorpay_payment_id });
                } else {
                  throw new Error(verificationResult.message || 'Payment verification failed');
                }
              } catch (verifyErr) {
                const errorMsg = verifyErr instanceof Error ? verifyErr.message : 'Verification error';
                razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Verification error', { error: errorMsg });
                setError(errorMsg);
                setIsLoading(false);
                resolve({ success: false, message: errorMsg });
              }
            },
            modal: {
              ondismiss: () => {
                razorpayDebugger.log('WARN', 'useRazorpayPayment', 'Checkout dismissed by user');
                setIsLoading(false);
                resolve({ success: false, message: 'Payment cancelled by user' });
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);

          rzp.on('payment.failed', (response: any) => {
            const errorMsg = response.error?.description || 'Payment failed';
            razorpayDebugger.log('ERROR', 'useRazorpayPayment', 'Payment failed', {
              code: response.error?.code,
              description: response.error?.description,
            });
            setError(errorMsg);
            setIsLoading(false);
            resolve({ success: false, message: errorMsg });
          });

          razorpayDebugger.log('INFO', 'useRazorpayPayment', 'Triggering checkout open');
          rzp.open();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
          razorpayDebugger.log('ERROR', 'useRazorpayPayment.initiatePayment', 'Payment initiation failed', {
            error: errorMsg,
          });
          setError(errorMsg);
          setIsLoading(false);
          resolve({ success: false, message: errorMsg });
        }
      });
    },
    [loadRazorpayScript, createRazorpayOrder, verifyPayment]
  );

  return {
    initiatePayment,
    isLoading,
    error,
    isScriptLoaded,
  };
}
