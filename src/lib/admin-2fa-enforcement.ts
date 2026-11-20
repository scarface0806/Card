/**
 * ADMIN_2FA_REQUIRED enforcement - pure helpers, no imports, so proxy.ts
 * (edge-compatible) and withAdmin() (Node) share exactly the same rules.
 *
 * When ADMIN_2FA_REQUIRED is exactly 'true', an admin whose session token does
 * not carry twoFactorEnabled: true can reach only /admin/security and the APIs
 * it needs to enrol. Everything else redirects (pages, proxy.ts) or answers
 * 403 (APIs, withAdmin).
 *
 * No database query: the flag rides in the session JWT, minted by
 * src/lib/admin-session-token.ts. A token WITHOUT the claim (every session
 * issued before this feature) counts as "not enrolled", so turning the switch
 * on sends existing admins to enrol rather than silently letting them through.
 *
 * Off by default. The env var is read on every call (no caching), so tests
 * and a redeploy with a changed value take effect immediately.
 */

export function isEnforcementOn(): boolean {
  return process.env.ADMIN_2FA_REQUIRED === 'true';
}

const STATIC_EXTENSIONS = /\.(png|jpg|svg|ico|css|js|woff|woff2)$/i;

/**
 * Paths an admin without 2FA may still use while enforcement is on: the
 * security page itself, the enrolment / password APIs it calls, sign-in and
 * sign-out, and static assets. Do NOT add admin data routes here.
 */
export function is2faExemptPath(pathname: string): boolean {
  if (pathname === '/admin/security' || pathname.startsWith('/admin/security/')) return true;
  if (pathname.startsWith('/api/admin/security/2fa/')) return true;
  if (pathname === '/api/admin/security/password') return true;
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname === '/api/admin/login' || pathname === '/api/admin/login/2fa') return true;
  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) return true;
  return STATIC_EXTENSIONS.test(pathname);
}

/** True when this session must enrol in 2FA before doing anything else. */
export function adminNeeds2faSetup(
  payload: { role?: unknown; twoFactorEnabled?: unknown } | null | undefined
): boolean {
  return isEnforcementOn() && payload?.role === 'ADMIN' && payload?.twoFactorEnabled !== true;
}
