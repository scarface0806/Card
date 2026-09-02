'use client';

/**
 * CURRENT USER, read from the session cookie via /api/auth/me.
 *
 * WHY NOT localStorage: the session cookie is httpOnly, which is the whole
 * point - JavaScript cannot read it, so an XSS cannot steal it. Asking the
 * server who we are is therefore both the correct and the only sound way to
 * know. /login also writes a copy of the JWT into localStorage today, and
 * anything that trusts that copy is trusting a value an attacker's script
 * could have written. Nothing in this hook reads it.
 *
 * A 401 is a normal, expected answer, not an error: it means "logged out".
 *
 * fetchCurrentUser is deliberately separate from the hook and touches no
 * React state. That keeps the network call testable on its own and keeps the
 * only setState calls in one obvious place.
 */

import { useCallback, useEffect, useState } from 'react';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
}

type State =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: CurrentUser };

/**
 * Label to show in the header.
 *
 * /api/auth/me substitutes the literal string "Admin User" for a null name
 * (it predates this hook and the admin panel relies on it), which would
 * mislabel a customer who never gave a name. The email's local part is a
 * better answer than a wrong one, so that placeholder is treated as absent.
 */
export function displayName(user: CurrentUser): string {
  const name = user.name?.trim();
  if (name && name !== 'Admin User') return name;
  return user.email.split('@')[0] || user.email;
}

export function initialFor(user: CurrentUser): string {
  return displayName(user).trim().charAt(0).toUpperCase() || '?';
}

/**
 * Who the session cookie belongs to, or null when there is no usable session.
 *
 * Returns null rather than throwing for every "not signed in" shape - 401 (no
 * cookie), 403 (deactivated), 404 (user deleted) and a network failure all
 * mean the same thing to a header: show the logged-out state.
 */
export async function fetchCurrentUser(
  signal?: AbortSignal
): Promise<CurrentUser | null> {
  const response = await fetch('/api/auth/me', {
    signal,
    credentials: 'same-origin',
    // The header must reflect the CURRENT session, so this must not be served
    // from the HTTP cache after a login or a logout.
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const payload = await response.json();
  if (!payload?.user?.id) return null;

  return {
    id: payload.user.id,
    email: payload.user.email,
    name: payload.user.name ?? null,
    role: payload.user.role,
    avatar: payload.user.avatar ?? null,
  };
}

export function useCurrentUser() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const apply = useCallback((user: CurrentUser | null) => {
    setState(user ? { status: 'signed-in', user } : { status: 'signed-out' });
  }, []);

  useEffect(() => {
    // AbortController so a fast navigation away cannot resolve into a setState
    // on an unmounted component.
    const controller = new AbortController();

    fetchCurrentUser(controller.signal)
      .then((user) => {
        if (controller.signal.aborted) return;
        apply(user);
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return;
        apply(null);
      });

    return () => controller.abort();
  }, [apply]);

  /** Re-check the session, e.g. after a login or logout in the same tab. */
  const refresh = useCallback(async () => {
    try {
      apply(await fetchCurrentUser());
    } catch {
      apply(null);
    }
  }, [apply]);

  return { state, refresh };
}
