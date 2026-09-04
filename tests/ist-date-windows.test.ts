import { describe, expect, it } from 'vitest';

import {
  istStartOfToday,
  istStartOfMonth,
  istStartOfPreviousMonth,
} from '@/lib/ist-date-windows';

/**
 * IST is a fixed +05:30 offset. These tests pin the wall-clock boundaries so
 * a future change to the helper (or a TZ change in the host environment)
 * cannot silently shift the dashboard by an hour.
 */

function istAsUtc(y: number, mo: number, d: number, h = 0, mi = 0, s = 0) {
  return new Date(Date.UTC(y, mo - 1, d, h, mi, s) - (5 * 60 + 30) * 60_000);
}

describe('istStartOfToday', () => {
  it('returns 00:00 IST of the IST date `now` falls in', () => {
    // 2026-09-04 19:00 UTC == 2026-09-05 00:30 IST -> IST today = 2026-09-05
    const w = istStartOfToday(new Date('2026-09-04T19:00:00Z'));
    expect(w.startYmd).toBe('2026-09-05');
    expect(w.startUtc.toISOString()).toBe('2026-09-04T18:30:00.000Z');
    expect(w.startUtc.getTime()).toBe(istAsUtc(2026, 9, 5).getTime());
  });

  it('includes orders at 00:30 IST (must not be yesterday)', () => {
    // 00:30 IST on 2026-09-05 == 2026-09-04 19:00 UTC; this order must be >= todayStart
    const orderAt = new Date('2026-09-04T19:00:00Z');
    const w = istStartOfToday(orderAt);
    expect(orderAt.getTime() >= w.startUtc.getTime()).toBe(true);
  });

  it('includes orders at 23:45 IST (must not be tomorrow)', () => {
    // 23:45 IST on 2026-09-04 == 2026-09-04 18:15 UTC; this order must be < next-day start
    const orderAt = new Date('2026-09-04T18:15:00Z');
    const w = istStartOfToday(orderAt);
    const nextDay = istStartOfToday(new Date('2026-09-04T18:30:01Z'));
    expect(orderAt.getTime() >= w.startUtc.getTime()).toBe(true);
    expect(orderAt.getTime() < nextDay.startUtc.getTime()).toBe(true);
  });

  it('rolls forward at IST midnight (05:30 UTC)', () => {
    // 2026-10-01 00:00 UTC == 2026-10-01 05:30 IST -> IST today is 2026-10-01
    const w = istStartOfToday(new Date('2026-10-01T00:00:00Z'));
    expect(w.startYmd).toBe('2026-10-01');
    expect(w.startUtc.toISOString()).toBe('2026-09-30T18:30:00.000Z');
  });
});

describe('istStartOfMonth', () => {
  it('returns 00:00 IST on the 1st of the IST month', () => {
    // 2026-09-04 19:00 UTC is in IST month 2026-09 -> start = 2026-09-01 00:00 IST
    const w = istStartOfMonth(new Date('2026-09-04T19:00:00Z'));
    expect(w.startYm).toBe('2026-09');
    expect(w.startUtc.toISOString()).toBe('2026-08-31T18:30:00.000Z');
  });

  it('includes orders on the 1st at 00:15 IST (must be this month, not previous)', () => {
    // 00:15 IST on 2026-09-01 == 2026-08-31 18:45 UTC; this order must be >= monthStart
    const orderAt = new Date('2026-08-31T18:45:00Z');
    const w = istStartOfMonth(new Date('2026-08-31T18:50:00Z'));
    expect(orderAt.getTime() >= w.startUtc.getTime()).toBe(true);
  });
});

describe('istStartOfPreviousMonth', () => {
  it('returns 00:00 IST on the 1st of the month BEFORE', () => {
    const w = istStartOfPreviousMonth(new Date('2026-09-30T18:15:00Z'));
    expect(w.startYm).toBe('2026-08');
    expect(w.startUtc.toISOString()).toBe('2026-07-31T18:30:00.000Z');
  });

  it('wraps across the year boundary', () => {
    const w = istStartOfPreviousMonth(new Date('2026-01-15T00:00:00Z'));
    expect(w.startYm).toBe('2025-12');
  });
});
