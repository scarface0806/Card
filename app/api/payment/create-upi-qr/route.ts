import { NextRequest, NextResponse } from "next/server";
import { createPaymentOrderSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/responses";
import { getPaymentAdapterService } from "@/lib/payment-adapter";
import { getRazorpayService } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const parsed = createPaymentOrderSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("Order ID is required", 400);

    const paymentOrder = await getPaymentAdapterService().createPaymentOrder(parsed.data);
    const qrCode = await getRazorpayService().createQrCode({
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      description: `Payment for order ${parsed.data.existingOrderId}`,
      notes: {
        razorpayOrderId: paymentOrder.orderId,
        existingOrderId: parsed.data.existingOrderId,
      },
    });
    await getPaymentAdapterService().attachQrCode(paymentOrder.paymentLogId, qrCode.id);

    return NextResponse.json({
      success: true,
      orderId: paymentOrder.orderId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      qrCode: qrCode.short_url,
      qrImageUrl: qrCode.image_url,
      qrCodeId: qrCode.id,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to create UPI QR code", 400);
  }
}