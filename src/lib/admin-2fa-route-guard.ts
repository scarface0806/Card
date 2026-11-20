/**
 * ADMIN_2FA_REQUIRED for routes that check the admin inline
 * (authenticate() + role === ADMIN) instead of using withAdmin().
 *
 * Call it AFTER the route's own admin check, and only on the admin branch of
 * a route customers also use. Returns the same 403 withAdmin() returns, or
 * null to carry on. Kept out of the routes because route files may only export
 * handlers (see CLAUDE.md).
 *
 * No DB query: the twoFactorEnabled claim is read from the same session token
 * authenticate() used (sessionClaimsFromRequest). With the switch off this is
 * a single env-var compare - the token is not even re-verified.
 */

import { NextResponse, type NextRequest } from 'next/server';

import { adminNeeds2faSetup, is2faExemptPath, isEnforcementOn } from '@/lib/admin-2fa-enforcement';
import { sessionClaimsFromRequest } from '@/lib/admin-session-token';

const MESSAGE = 'Two-factor authentication setup required';

export function admin2faSetupBlock(request: NextRequest): NextResponse | null {
  if (!isEnforcementOn()) return null;
  if (!adminNeeds2faSetup(sessionClaimsFromRequest(request))) return null;
  if (is2faExemptPath(new URL(request.url).pathname)) return null;
  return NextResponse.json({ success: false, message: MESSAGE, error: MESSAGE }, { status: 403 });
}
