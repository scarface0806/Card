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
   * Validate Razorpay environment variables
   */
  validateEnvironment(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check RAZORPAY_KEY_ID
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      issues.push('❌ RAZORPAY_KEY_ID is not set');
    } else if (keyId.trim() !== keyId) {
      issues.push('⚠️ RAZORPAY_KEY_ID has leading/trailing spaces');
    } else if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
      issues.push('⚠️ RAZORPAY_KEY_ID does not start with rzp_test_ or rzp_live_');
    } else {
      this.log('SUCCESS', 'ENV', 'RAZORPAY_KEY_ID is valid', { keyId: keyId.substring(0, 15) + '...' });
    }

    // Check RAZORPAY_KEY_SECRET
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      issues.push('❌ RAZORPAY_KEY_SECRET is not set');
    } else if (keySecret.trim() !== keySecret) {
      issues.push('⚠️ RAZORPAY_KEY_SECRET has leading/trailing spaces');
    } else if (keySecret.length < 20) {
      issues.push('⚠️ RAZORPAY_KEY_SECRET seems too short (expected 20+ characters)');
    } else {
      this.log('SUCCESS', 'ENV', 'RAZORPAY_KEY_SECRET is valid', { length: keySecret.length });
    }

    // Check RAZORPAY_MODE
    const mode = process.env.RAZORPAY_MODE;
    if (!mode) {
      issues.push('⚠️ RAZORPAY_MODE is not set (defaulting to test)');
    } else if (mode !== 'test' && mode !== 'live') {
      issues.push(`⚠️ RAZORPAY_MODE is "${mode}" but should be "test" or "live"`);
    } else {
      this.log('SUCCESS', 'ENV', `RAZORPAY_MODE is set to "${mode}"`);
    }

    const valid = issues.length === 0;
    if (!valid) {
      this.log('WARN', 'ENV', 'Environment validation failed', { issues });
    } else {
      this.log('SUCCESS', 'ENV', 'All environment variables are valid');
    }

    return { valid, issues };
  }

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
