/**
 * Razorpay Payment Flow API Test Script
 * 
 * This script tests the Razorpay payment API endpoints without modifying existing code.
 * 
 * Usage in Node.js:
 * - import { testPaymentFlow } from '@/scripts/test-razorpay-flow'
 * - testPaymentFlow('ORDER_ID_HERE')
 * 
 * Or run directly:
 * - npx ts-node scripts/test-razorpay-flow.ts
 */

import prisma from '@/lib/prisma';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class RazorpayFlowTester {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Test complete payment flow
   */
  async testCompleteFlow(orderId: string, amount: number = 100): Promise<TestResult[]> {
    console.log('\n📋 Starting Razorpay Payment Flow Test\n');
    console.log(`📌 Order ID: ${orderId}`);
    console.log(`💰 Amount: ₹${amount}\n`);

    // Step 1: Check order exists
    await this.checkOrderExists(orderId);

    // Step 2: Create Razorpay order
    const orderData = await this.testCreateOrder(orderId, amount);

    // Step 3: Print results
    this.printResults();

    return this.results;
  }

  /**
   * Check if order exists in database
   */
  private async checkOrderExists(orderId: string): Promise<void> {
    try {
      console.log('Step 1️⃣ : Checking order exists in database...');

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, total: true, guestEmail: true, guestName: true },
      });

      if (!order) {
        this.addResult({
          step: 'Check Order',
          success: false,
          message: 'Order not found in database',
          error: `No order found with ID: ${orderId}`,
        });
        return;
      }

      this.addResult({
        step: 'Check Order',
        success: true,
        message: 'Order found successfully',
        data: {
          orderId: order.id,
          total: order.total,
          email: order.guestEmail,
          name: order.guestName,
        },
      });

      console.log(`   ✅ Order found: ${order.guestName} (₹${order.total})\n`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.addResult({
        step: 'Check Order',
        success: false,
        message: 'Error checking order',
        error: errorMsg,
      });
    }
  }

  /**
   * Test create order endpoint
   */
  private async testCreateOrder(orderId: string, amount: number): Promise<any> {
    try {
      console.log('Step 2️⃣ : Testing POST /api/payment/create-razorpay-order...');

      const response = await fetch(`${this.baseUrl}/api/payment/create-razorpay-order`, {
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

      const data = await response.json();

      if (!response.ok) {
        this.addResult({
          step: 'Create Razorpay Order',
          success: false,
          message: `API returned ${response.status}`,
          error: data.error || JSON.stringify(data),
        });
        console.log(`   ❌ Failed: ${response.status}\n`);
        return null;
      }

      this.addResult({
        step: 'Create Razorpay Order',
        success: true,
        message: 'Razorpay order created successfully',
        data: {
          razorpayOrderId: data.razorpay_order_id,
          amount: data.amount,
          currency: data.currency,
          razorpayKey: data.razorpay_key?.substring(0, 15) + '...',
        },
      });

      console.log(`   ✅ Order created: ${data.razorpay_order_id}`);
      console.log(`   💰 Amount: ${data.amount} paise (₹${data.amount / 100})`);
      console.log(`   🔑 Key: ${data.razorpay_key?.substring(0, 15)}...\n`);

      // Check payment log was created
      await this.checkPaymentLog(orderId, data.razorpay_order_id);

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.addResult({
        step: 'Create Razorpay Order',
        success: false,
        message: 'Error calling create order endpoint',
        error: errorMsg,
      });
      console.log(`   ❌ Error: ${errorMsg}\n`);
      return null;
    }
  }

  /**
   * Check if payment log was created
   */
  private async checkPaymentLog(orderId: string, razorpayOrderId: string): Promise<void> {
    try {
      console.log('Step 3️⃣ : Checking payment log was created...');

      const paymentLog = await prisma.paymentLog.findFirst({
        where: {
          existingOrderId: orderId,
          razorpayOrderId,
        },
      });

      if (!paymentLog) {
        this.addResult({
          step: 'Check Payment Log',
          success: false,
          message: 'Payment log not found in database',
        });
        console.log(`   ❌ Payment log not found\n`);
        return;
      }

      this.addResult({
        step: 'Check Payment Log',
        success: true,
        message: 'Payment log created successfully',
        data: {
          paymentLogId: paymentLog.id,
          status: paymentLog.status,
          amount: paymentLog.amount,
          createdAt: paymentLog.createdAt,
        },
      });

      console.log(`   ✅ Payment log created`);
      console.log(`   📊 Status: ${paymentLog.status}`);
      console.log(`   💾 Log ID: ${paymentLog.id?.toString().substring(0, 15)}...\n`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.addResult({
        step: 'Check Payment Log',
        success: false,
        message: 'Error checking payment log',
        error: errorMsg,
      });
    }
  }

  /**
   * Add result
   */
  private addResult(result: TestResult): void {
    this.results.push(result);
  }

  /**
   * Print results
   */
  private printResults(): void {
    console.log('\n📊 Test Results Summary\n');
    console.log('─'.repeat(60));

    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.filter(r => !r.success).length;

    this.results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. ${result.step}`);
      console.log(`   ${result.message}`);

      if (result.data) {
        console.log(`   Data:`, JSON.stringify(result.data, null, 4));
      }

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      console.log();
    });

    console.log('─'.repeat(60));
    console.log(`✅ Passed: ${successCount}  |  ❌ Failed: ${failureCount}  |  Total: ${this.results.length}\n`);

    if (failureCount > 0) {
      console.log('⚠️  Some tests failed. Check the errors above.\n');
    } else {
      console.log('🎉 All tests passed!\n');
    }
  }

  /**
   * Export results as JSON
   */
  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Get results
   */
  getResults(): TestResult[] {
    return this.results;
  }
}

/**
 * Run complete test
 */
export async function testPaymentFlow(orderId: string, amount: number = 100) {
  const tester = new RazorpayFlowTester(process.env.APP_URL || 'http://localhost:3000');
  return await tester.testCompleteFlow(orderId, amount);
}

// Export for direct Node.js execution
if (require.main === module) {
  const orderId = process.argv[2];
  if (!orderId) {
    console.log('Usage: npx ts-node scripts/test-razorpay-flow.ts <ORDER_ID> [AMOUNT]');
    process.exit(1);
  }

  const amount = process.argv[3] ? parseInt(process.argv[3]) : 100;
  testPaymentFlow(orderId, amount)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
