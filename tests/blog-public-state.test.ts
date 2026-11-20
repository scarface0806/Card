import { describe, expect, it } from 'vitest';
import { formatIst, fromIstInput, postPublicState, toIstInput } from '@/lib/blog/public-state';

/**
 * The admin's Draft / Scheduled / Live label must say exactly what the public
 * blog does (publicWhere in src/lib/blog/queries.ts), and the IST publish-date
 * input must round-trip without moving a date into the future.
 */

const NOW = new Date('2026-11-20T12:00:00.000Z'); // 17:30 IST

describe('postPublicState', () => {
  it('DRAFT is draft, whatever the date', () => {
    expect(postPublicState('DRAFT', null, NOW)).toBe('draft');
    expect(postPublicState('DRAFT', '2026-01-01T00:00:00Z', NOW)).toBe('draft');
  });

  it('PUBLISHED with a past or current date is live', () => {
    expect(postPublicState('PUBLISHED', '2026-11-20T11:59:59Z', NOW)).toBe('live');
    expect(postPublicState('PUBLISHED', NOW, NOW)).toBe('live'); // publicWhere uses lte
  });

  it('PUBLISHED with a future date is scheduled (it 404s until then)', () => {
    expect(postPublicState('PUBLISHED', '2026-11-20T12:00:01Z', NOW)).toBe('scheduled');
  });

  it('PUBLISHED with no date, or a bad one, is not live', () => {
    expect(postPublicState('PUBLISHED', null, NOW)).toBe('draft');
    expect(postPublicState('PUBLISHED', 'not a date', NOW)).toBe('draft');
  });
});

describe('IST publish-date input', () => {
  it('shows a UTC instant as IST wall-clock time', () => {
    expect(toIstInput('2026-11-20T12:00:00.000Z')).toBe('2026-11-20T17:30');
    expect(toIstInput('2026-11-20T20:00:00.000Z')).toBe('2026-11-21T01:30'); // crosses midnight
    expect(toIstInput(null)).toBe('');
  });

  it('reads the input back as IST', () => {
    expect(fromIstInput('2026-11-20T17:30')).toBe('2026-11-20T12:00:00.000Z');
    expect(fromIstInput('')).toBeNull();
    expect(fromIstInput('2026-11-20')).toBeNull();
  });

  it('saving untouched never moves the date later (seconds are dropped)', () => {
    for (const iso of ['2026-11-20T12:00:00.000Z', '2026-11-20T12:00:59.999Z', '2026-03-01T18:29:30.000Z']) {
      const back = fromIstInput(toIstInput(iso))!;
      expect(new Date(back).getTime()).toBeLessThanOrEqual(new Date(iso).getTime());
      expect(new Date(iso).getTime() - new Date(back).getTime()).toBeLessThan(60_000);
    }
  });

  it('formats in IST', () => {
    expect(formatIst('2026-11-20T12:00:00.000Z')).toMatch(/20 Nov 2026.*5:30.*pm IST/i);
  });
});
