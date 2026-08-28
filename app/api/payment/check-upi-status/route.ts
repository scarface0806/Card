import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/responses";
import { getPaymentAdapterService } from "@/lib/payment-adapter";

const statusSchema = z.object({
  existingOrderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayQrCodeId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("Invalid payment status request", 400);

    const result = await getPaymentAdapterService().checkCapturedPayment(parsed.data);
    return NextResponse.json(result, { status: result.success ? 200 : 202 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to check payment status", 400);
  }
}