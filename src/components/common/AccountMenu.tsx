'use client';

/**
 * ACCOUNT MENU - the header's logged-in control.
 *
 * Shows "Login" when signed out and an avatar/name dropdown with "My Orders"
 * and "Logout" when signed in.
 *
 * It renders NOTHING at all while the session is still being checked. That is
 * deliberate: flashing "Login" and then swapping it for the user's name is
 * worse than a brief gap, and the alternative - guessing from localStorage -
 * means trusting a value the page's own scripts can write.
 *
 * Logout goes through POST /api/auth/logout because the cookie is httpOnly and
 * cannot be cleared from JavaScript. The localStorage keys /login writes are
 * cleared too, so a stale copy of the old token is not left behind.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Package, User as UserIcon } from 'lucide-react';

import { ROUTES } from '@/utils/constants';
import {
  displayName,
  initialFor,
  useCurrentUser,
  type CurrentUser,
} from '@/hooks/useCurrentUser';

interface AccountMenuProps {
  /** Mobile panel renders full-width stacked links instead of a dropdown. */
  variant?: 'desktop' | 'mobile';
  /** Mobile panel closes itself after a navigation. */
  onNavigate?: () => void;
}

/**
 * The signed-in user's picture, with the initial as the fallback.
 *
 * The Google avatar was being fetched and stored all along - google-complete
 * saves `token.picture` onto User.avatar, and /api/auth/me returns it - but
 * the header only ever drew `initialFor(user)`, so a Google account showed a
 * letter instead of its photo. This renders the photo when there is one.
 *
 * FALLS BACK ON ERROR, not just on absence. A Google avatar URL can start
 * 404ing or 403ing later (the account changes its picture, or the signed URL
 * form changes), and a broken-image glyph in the header is worse than the
 * initial that was there before. `failed` flips on the first error and the
 * initial takes over.
 *
 * referrerPolicy="no-referrer" because googleusercontent rejects some requests
 * that carry a Referer header, which shows up as an avatar that loads
 * everywhere except production.
 */
function Avatar({ user, size = 32 }: { user: CurrentUser; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = user.avatar?.trim();

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className="flex items-center justify-center rounded-full bg-[#C9A961]/20 text-sm font-semibold text-[#C9A961]"
        style={{ width: size, height: size }}
      >
        {initialFor(user)}
      </span>
    );
  }

  // A data: URI cannot go through next/image - the optimizer parses `src` as a
  // URL or path and throws on one. Real rows in this database hold both kinds:
  // Google sign-in stores an https lh3.googleusercontent.com URL, while an
  // uploaded avatar is stored inline as base64. So the remote URL is optimised
  // and the inline one is rendered directly.
  if (!/^https?:\/\//i.test(src)) {
    return (
      // A data: URI is not something next/image can take - see the note above.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {
    // Even if the request fails, the local cleanup below still runs and the
    // next /api/auth/me will decide the real state.
  }

  try {
    // Written by /login and /signup. Removed here so no stale token copy
    // survives a logout.
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberMe');
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
  }
}

function MobileAccount({
  user,
  onNavigate,
}: {
  user: CurrentUser;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    router.push(ROUTES.HOME);
    router.refresh();
  };

  return (
    <div className="mt-6 space-y-3 border-t border-[#F1F3F1]/10 pt-6">
      <div className="flex items-center gap-3">
        <Avatar user={user} size={36} />
        <p className="tv-mono min-w-0 truncate">Signed in as {displayName(user)}</p>
      </div>

      <Link
        href="/my-orders"
        onClick={onNavigate}
        className="tv-btn tv-btn-secondary w-full"
      >
        <Package className="w-4 h-4" aria-hidden="true" />
        My Orders
      </Link>

      <button
        type="button"
        onClick={() => void handleLogout()}
        className="tv-btn tv-btn-secondary w-full"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Logout
      </button>
    </div>
  );
}

export default function AccountMenu({
  variant = 'desktop',
  onNavigate,
}: AccountMenuProps) {
  const router = useRouter();
  const { state } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Escape closes, and a click anywhere outside closes. Both are registered
  // only while the menu is open.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  // Session still unknown - only ever on the very first load of a page
  // session, because useCurrentUser now seeds from its module cache.
  //
  // The slot is RESERVED rather than collapsed. Returning null let the actions
  // row reflow the moment the answer arrived, which is the header "changing
  // design" as it settles. `invisible` is visibility:hidden, so this occupies
  // exactly the Login button's box - same classes, same label, same metrics -
  // without being seen or read out.
  if (state.status === 'loading') {
    if (variant === 'mobile') return null;
    return (
      <span aria-hidden="true" className="tv-btn tv-btn-secondary invisible">
        Login
      </span>
    );
  }

  if (state.status === 'signed-out') {
    if (variant === 'mobile') {
      return (
        // No separator rule: with the WhatsApp button gone this is simply the
        // second item in the panel's CTA stack, so it keeps that rhythm.
        <div className="mt-3">
          <Link
            href={ROUTES.LOGIN}
            onClick={onNavigate}
            className="tv-btn tv-btn-secondary w-full"
          >
            <UserIcon className="w-4 h-4" aria-hidden="true" />
            Login
          </Link>
        </div>
      );
    }

    // Outline button, not a navlink: this sits in the actions row where the
    // "Talk to our team" button used to be, and inherits that exact look
    // (border, padding, hover lift) from .tv-btn + .tv-btn-secondary.
    return (
      <Link href={ROUTES.LOGIN} className="tv-btn tv-btn-secondary">
        Login
      </Link>
    );
  }

  const user = state.user;

  if (variant === 'mobile') {
    return <MobileAccount user={user} onNavigate={onNavigate} />;
  }

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push(ROUTES.HOME);
    router.refresh();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="tv-focus flex min-h-[44px] items-center gap-2 rounded-full px-2 text-[#A9B5B0] hover:text-[#F1F3F1] transition-colors"
      >
        <Avatar user={user} size={32} />
        <span className="max-w-[10ch] truncate text-sm">{displayName(user)}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#F1F3F1]/12 bg-[#151C1A] shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-[#F1F3F1]/10 px-4 py-3">
            <Avatar user={user} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F1F3F1]">
                {displayName(user)}
              </p>
              <p className="truncate text-xs text-[#A9B5B0]">{user.email}</p>
            </div>
          </div>

          <Link
            href="/my-orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="tv-focus flex min-h-[44px] items-center gap-3 px-4 text-sm text-[#A9B5B0] transition-colors hover:bg-[#F1F3F1]/5 hover:text-[#F1F3F1]"
          >
            <Package className="h-4 w-4" aria-hidden="true" />
            My Orders
          </Link>

          {/* Admins reach their own panel from here rather than guessing the
              URL; a customer never sees this row. */}
          {user.role === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="tv-focus flex min-h-[44px] items-center gap-3 px-4 text-sm text-[#A9B5B0] transition-colors hover:bg-[#F1F3F1]/5 hover:text-[#F1F3F1]"
            >
              <UserIcon className="h-4 w-4" aria-hidden="true" />
              Admin panel
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
            className="tv-focus flex min-h-[44px] w-full items-center gap-3 border-t border-[#F1F3F1]/10 px-4 text-left text-sm text-[#A9B5B0] transition-colors hover:bg-[#F1F3F1]/5 hover:text-[#F1F3F1]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
