/**
 * Razorpay Payment Flow Debugging Utility (Frontend)
 * 
 * This utility provides comprehensive debugging for Razorpay payment flow
 * including environment checks, API testing, and payment flow validation.
 * 
 * Usage in browser console:
 * - window.razorpayDebugFrontend.checkEnvironment()
 * - window.razorpayDebugFrontend.testCreateOrder(orderId, amount)
 * - window.razorpayDebugFrontend.testVerifyPayment(...)
 * - window.razorpayDebugFrontend.printReport()
 */

interface DebugLogEntry {
  timestamp: string;
  component: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
  data?: any;
}

class RazorpayFrontendDebugger {
  private logs: DebugLogEntry[] = [];
  private razorpayKey: string | null = null;

  /**
   * Log message
   */
  private log(level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR', component: string, message: string, data?: any) {
    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      component,
      level,
      message,
      data,
    };

    this.logs.push(entry);

    const icon = this.getIcon(level);
    const style = this.getStyle(level);
    console.log(`%c${icon} [${component}] ${message}`, style, data || '');
  }

  /**
   * Check if Razorpay script is loaded
   */
  checkRazorpayScript(): boolean {
    const isLoaded = typeof (window as any).Razorpay !== 'undefined';
    if (isLoaded) {
      this.log('SUCCESS', 'Frontend', 'Razorpay script loaded successfully');
    } else {
      this.log('ERROR', 'Frontend', 'Razorpay script NOT loaded. Add this to your HTML: <script src="https://checkout.razorpay.com/v1/checkout.js"></script>');
    }
    return isLoaded;
  }

  /**
   * Test creating a Razorpay order
   */
  async testCreateOrder(orderId: string, amount: number = 100) {
    this.log('INFO', 'TestAPI', 'Creating test order', { orderId, amount });

    try {
      const response = await fetch('/api/payment/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          existingOrderId: orderId,
          amount,
          userEmail: 'test@example.com',
          userPhone: '9876543210',
          userName: 'Test User',
        }),
      });

      this.log('INFO', 'TestAPI', 'Create order response received', { status: response.status });

      if (!response.ok) {
        const errorData = await response.json();
        this.log('ERROR', 'TestAPI', 'Create order failed', { status: response.status, error: errorData });
        return null;
      }

      const data = await response.json();
      this.log('SUCCESS', 'TestAPI', 'Order created successfully', {
        razorpayOrderId: data.razorpay_order_id,
        razorpayKey: data.razorpay_key?.substring(0, 15) + '...' || 'NOT PROVIDED',
        amount: data.amount,
        currency: data.currency,
      });

      this.razorpayKey = data.razorpay_key;
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.log('ERROR', 'TestAPI', 'Create order error', { error: errorMsg });
      return null;
    }
  }

  /**
   * Test opening Razorpay checkout
   */
  async testOpenCheckout(orderData: any) {
    if (!this.checkRazorpayScript()) {
      return;
    }

    if (!orderData || !orderData.razorpay_order_id || !orderData.razorpay_key) {
      this.log('ERROR', 'TestCheckout', 'Invalid order data for checkout', { orderData });
      return;
    }

    this.log('INFO', 'TestCheckout', 'Opening Razorpay checkout', {
      orderId: orderData.razorpay_order_id,
      amount: orderData.amount,
    });

    try {
      const options = {
        key: orderData.razorpay_key,
        order_id: orderData.razorpay_order_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Test Card Payment',
        description: 'Testing Razorpay integration',
        handler: (response: any) => {
          this.log('SUCCESS', 'TestCheckout', 'Payment handler called', {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature?.substring(0, 16) + '...',
          });
          this.testVerifyPayment(
            orderData.paymentLogId || 'unknown',
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9876543210',
        },
        notes: {
          note_key: 'Test payment from debugging utility',
        },
        theme: {
          color: '#0f2e25',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', (response: any) => {
        this.log('ERROR', 'TestCheckout', 'Payment failed', {
          code: response.error.code,
          description: response.error.description,
          reason: response.error.reason,
          source: response.error.source,
        });
      });

      this.log('INFO', 'TestCheckout', 'Triggering checkout open');
      rzp.open();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.log('ERROR', 'TestCheckout', 'Checkout error', { error: errorMsg });
    }
  }

  /**
   * Test verifying a payment
   */
  async testVerifyPayment(
    existingOrderId: string,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) {
    this.log('INFO', 'TestVerify', 'Verifying payment', {
      existingOrderId,
      razorpayOrderId,
      razorpayPaymentId,
    });

    try {
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

      this.log('INFO', 'TestVerify', 'Verify response received', { status: response.status });

      if (!response.ok) {
        const errorData = await response.json();
        this.log('ERROR', 'TestVerify', 'Verification failed', { status: response.status, error: errorData });
        return null;
      }

      const data = await response.json();
      if (data.success) {
        this.log('SUCCESS', 'TestVerify', 'Payment verified successfully', {
          paymentId: data.paymentId,
          message: data.message,
        });
      } else {
        this.log('WARN', 'TestVerify', 'Payment verification failed', {
          message: data.message,
        });
      }

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.log('ERROR', 'TestVerify', 'Verification error', { error: errorMsg });
      return null;
    }
  }

  /**
   * Get all logs
   */
  getLogs(): DebugLogEntry[] {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    console.clear();
    this.log('INFO', 'Debug', 'Logs cleared');
  }

  /**
   * Print formatted report
   */
  printReport(): void {
    console.group('📊 Razorpay Debug Report');
    console.log(`Total Log Entries: ${this.logs.length}`);
    console.log(`Errors: ${this.logs.filter(l => l.level === 'ERROR').length}`);
    console.log(`Warnings: ${this.logs.filter(l => l.level === 'WARN').length}`);
    console.log(`Success: ${this.logs.filter(l => l.level === 'SUCCESS').length}`);
    console.log(`Info: ${this.logs.filter(l => l.level === 'INFO').length}`);
    console.groupEnd();

    console.group('📋 All Logs');
    this.logs.forEach((log) => {
      const icon = this.getIcon(log.level);
      console.log(`${icon} [${log.timestamp}] [${log.component}] ${log.message}`, log.data || '');
    });
    console.groupEnd();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private getIcon(level: string): string {
    const icons = {
      INFO: 'ℹ️',
      SUCCESS: '✅',
      WARN: '⚠️',
      ERROR: '❌',
    };
    return icons[level as keyof typeof icons] || '•';
  }

  private getStyle(level: string): string {
    const styles = {
      INFO: 'color: #0066cc; font-weight: bold;',
      SUCCESS: 'color: #00cc00; font-weight: bold;',
      WARN: 'color: #ff9900; font-weight: bold;',
      ERROR: 'color: #cc0000; font-weight: bold;',
    };
    return styles[level as keyof typeof styles] || 'color: #000;';
  }
}

// Export singleton instance and attach to window for browser console access
const razorpayDebugFrontend = new RazorpayFrontendDebugger();

if (typeof window !== 'undefined') {
  (window as any).razorpayDebugFrontend = razorpayDebugFrontend;
}

export default razorpayDebugFrontend;
