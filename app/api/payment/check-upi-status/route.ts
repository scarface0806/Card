import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/responses";
import { authenticate } from "@/lib/auth-middleware";
import { getPaymentAdapterService } from "@/lib/payment-adapter";

const statusSchema = z.object({
  existingOrderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayQrCodeId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // MONEY ROUTE - a verified session is mandatory. proxy.ts gates this path
    // too, but the handler must refuse on its own so the guarantee does not
    // depend on a matcher list staying in step with this directory.
    const { user } = await authenticate(request);
    if (!user) {
      return errorResponse("You must be signed in to pay for an order.", 401);
    }

    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("Invalid payment status request", 400);

    const result = await getPaymentAdapterService().checkCapturedPayment(parsed.data);
    return NextResponse.json(result, { status: result.success ? 200 : 202 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to check payment status", 400);
  }
}