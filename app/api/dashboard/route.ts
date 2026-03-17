import type { NextRequest } from "next/server";
import { GET as getAdminDashboard } from "../admin/dashboard/route";

export async function GET(request: NextRequest) {
  return getAdminDashboard(request);
}
