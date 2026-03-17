import { NextResponse } from "next/server";

/**
 * Success Response Format
 * Returns: { success: true, data: {...} }
 */
export function successResponse(
  data: Record<string, unknown> = {},
  status: number = 200
): NextResponse {
  const message = typeof data.message === "string" ? data.message : "OK";

  return NextResponse.json(
    {
      success: true,
      message,
      data,
      ...data,
    },
    { status }
  );
}

/**
 * Error Response Format
 * Returns: { success: false, error: "message" }
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  console.error(`[API Error ${status}] ${message}`, details);
  
  return NextResponse.json(
    { 
      success: false, 
      message,
      error: message,
      ...(details && { details })
    },
    { status }
  );
}
