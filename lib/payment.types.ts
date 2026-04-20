/**
 * Payment Adapter Layer - TypeScript Types
 * 
 * Provides type-safe interfaces for payment operations
 */

/**
 * Razorpay API Types
 */
export namespace Razorpay {
  export interface OrderCreateRequest {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, any>;
  }

  export interface OrderResponse {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    offer_id: string | null;
    status: string;
    attempts: number;
    notes: Record<string, any>;
    created_at: number;
  }

  export interface PaymentAuthorizationPayload {
    payment: {
      id: string;
      entity: string;
      order_id: string;
      amount: number;
      currency: string;
      status: string;
      description: string | null;
      amount_refunded: number;
      refund_status: string | null;
      captured: boolean;
      card_id: string | null;
      bank: string | null;
      wallet: string | null;
      vpa: string | null;
      email: string;
      contact: string;
      notes: Record<string, any>;
      fee: number;
      tax: number;
      error_code: string | null;
      error_description: string | null;
      error_source: string | null;
      error_reason: string | null;
      error_step: string | null;
      error_field: string | null;
      acquirer_data: Record<string, any>;
      created_at: number;
    };
  }

  export interface WebhookPayload {
    event:
      | "payment.authorized"
      | "payment.captured"
      | "payment.failed"
      | "order.paid";
    created_at: number;
    payload: PaymentAuthorizationPayload | Record<string, any>;
  }
}

/**
 * Payment Adapter Service Types
 */
export namespace PaymentAdapter {
  export interface CreatePaymentRequest {
    existingOrderId: string;
    amount?: number;
    userEmail?: string;
    userPhone?: string;
    userName?: string;
  }

  export interface CreatePaymentResponse {
    success: boolean;
    razorpay_order_id: string;
    razorpay_key: string;
    amount: number;
    currency: string;
    paymentLogId: string;
  }

  export interface VerifyPaymentRequest {
    existingOrderId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }

  export interface VerifyPaymentResponse {
    success: boolean;
    message: string;
    paymentId?: string;
  }

  export interface PaymentLogEntry {
    id: string;
    existingOrderId: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    currency: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    userEmail?: string;
    userPhone?: string;
    userName?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
}

/**
 * Frontend Types
 */
export namespace Frontend {
  export interface RazorpayCheckoutOptions {
    key: string;
    order_id: string;
    amount: number;
    currency: string;
    name?: string;
    description?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    handler?: (response: RazorpayPaymentResponse) => void;
    modal?: {
      ondismiss?: () => void;
    };
  }

  export interface RazorpayPaymentResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }
}

/**
 * API Response Types
 */
export namespace API {
  export interface SuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
  }

  export interface ErrorResponse {
    success: false;
    error: string;
    message?: string;
    code?: string;
  }

  export interface PaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
}

/**
 * Helper type guards
 */
export function isRazorpayPaymentResponse(
  obj: any
): obj is Frontend.RazorpayPaymentResponse {
  return (
    obj &&
    typeof obj.razorpay_payment_id === "string" &&
    typeof obj.razorpay_order_id === "string" &&
    typeof obj.razorpay_signature === "string"
  );
}

export function isPaymentLogEntry(obj: any): obj is PaymentAdapter.PaymentLogEntry {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.existingOrderId === "string" &&
    typeof obj.razorpayOrderId === "string" &&
    typeof obj.amount === "number" &&
    typeof obj.status === "string"
  );
}

/**
 * Utility types for common patterns
 */
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";
export type RazorpayOrderStatus = string;
export type RazorpayPaymentStatus = string;

/**
 * Custom errors for payment operations
 */
export class PaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export class RazorpayApiError extends PaymentError {
  constructor(message: string, details?: any) {
    super("RAZORPAY_API_ERROR", message, details);
    this.name = "RazorpayApiError";
  }
}

export class PaymentVerificationError extends PaymentError {
  constructor(message: string, details?: any) {
    super("PAYMENT_VERIFICATION_ERROR", message, details);
    this.name = "PaymentVerificationError";
  }
}

export class OrderNotFoundError extends PaymentError {
  constructor(orderId: string) {
    super("ORDER_NOT_FOUND", `Order not found: ${orderId}`, { orderId });
    this.name = "OrderNotFoundError";
  }
}

export class InvalidAmountError extends PaymentError {
  constructor(amount: any) {
    super("INVALID_AMOUNT", `Invalid amount: ${amount}`, { amount });
    this.name = "InvalidAmountError";
  }
}
