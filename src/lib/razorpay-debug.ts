/**
 * Razorpay Debug & Validation Utility
 * 
 * This utility provides comprehensive logging and validation for Razorpay
 * payment flow debugging. It tracks environment variables, API calls, and
 * payment state throughout the transaction.
 */

export interface DebugLog {
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  component: string;
  message: string;
  data?: any;
}

class RazorpayDebugger {
  private logs: DebugLog[] = [];
  private isEnabled: boolean = process.env.NODE_ENV !== 'production';

  /**
   * Log a message with optional data
   */
  log(level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR', component: string, message: string, data?: any) {
    const entry: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
    };

    this.logs.push(entry);

    // Always log to console in development
    if (this.isEnabled) {
      const icon = this.getIcon(level);
      console.log(`${icon} [${component}] ${message}`, data || '');
    }
  }

  /**
   * NOTE: environment validation used to live here. It read
   * the Razorpay key secret from the environment, and because this module is
   * imported by the client-side useRazorpayPayment hook, that identifier ended up
   * in the browser bundle. It now lives in the server-only razorpay-env-check.
   */

  /**
   * Get all debug logs
   */
  getLogs(): DebugLog[] {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Print logs summary
   */
  printSummary(): void {
    if (!this.isEnabled) return;

    console.group('📊 Razorpay Debug Summary');
    console.log(`Total logs: ${this.logs.length}`);
    console.log(`Errors: ${this.logs.filter(l => l.level === 'ERROR').length}`);
    console.log(`Warnings: ${this.logs.filter(l => l.level === 'WARN').length}`);
    console.groupEnd();
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
}

// Export singleton instance
export const razorpayDebugger = new RazorpayDebugger();
