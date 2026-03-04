import { NextResponse } from "next/server";

export function errorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

export function successResponse(
  data: Record<string, unknown> = {},
  status: number = 200
): NextResponse {
  return NextResponse.json(
    { success: true, ...data },
    { status }
  );
}
