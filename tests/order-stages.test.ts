import { describe, expect, it } from 'vitest';

import {
  ORDER_STAGES,
  isCancelledStatus,
  stageForStatus,
  stageIndex,
  type OrderStage,
} from '@/lib/order-stages';

/**
 * The timeline on /my-orders decides which stages are drawn as done from
 * `stageIndex(stage)`, so a wrong mapping silently tells a customer their card
 * has shipped when it has not. These tests pin the mapping.
 */

describe('ORDER_STAGES', () => {
  it('is the five customer-facing stages, in order', () => {
    expect(ORDER_STAGES.map((s) => s.key)).toEqual([
      'placed',
      'confirmed',
      'encoded',
      'shipped',
      'delivered',
    ]);
  });

  it('uses the business labels the spec asked for, not the enum names', () => {
    expect(ORDER_STAGES.map((s) => s.label)).toEqual([
      'Order Placed',
      'Design Confirmed',
      'Chip Encoded',
      'Shipped',
      'Delivered',
    ]);
  });

  it('gives every stage a blurb', () => {
    for (const stage of ORDER_STAGES) {
      expect(stage.blurb.length).toBeGreaterThan(0);
    }
  });
});

describe('stageForStatus', () => {
  it('maps each OrderStatus to the right stage', () => {
    expect(stageForStatus('PENDING')).toBe('placed');
    expect(stageForStatus('CONFIRMED')).toBe('confirmed');
    expect(stageForStatus('PROCESSING')).toBe('encoded');
    expect(stageForStatus('SHIPPED')).toBe('shipped');
    expect(stageForStatus('DELIVERED')).toBe('delivered');
  });

  it('parks cancelled and refunded at "placed" rather than advancing them', () => {
    // Neither ever reached production. The cancelled flag carries that fact
    // separately, so the stage must not imply progress.
    expect(stageForStatus('CANCELLED')).toBe('placed');
    expect(stageForStatus('REFUNDED')).toBe('placed');
  });

  it('is case-insensitive, so a lowercase stored status still maps', () => {
    expect(stageForStatus('shipped')).toBe('shipped');
    expect(stageForStatus('Delivered')).toBe('delivered');
  });

  it('falls back to "placed" for an unknown status rather than throwing', () => {
    expect(stageForStatus('SOMETHING_NEW')).toBe('placed');
    expect(stageForStatus('')).toBe('placed');
  });
});

describe('isCancelledStatus', () => {
  it('is true only for cancelled and refunded', () => {
    expect(isCancelledStatus('CANCELLED')).toBe(true);
    expect(isCancelledStatus('REFUNDED')).toBe(true);
    expect(isCancelledStatus('cancelled')).toBe(true);

    for (const ok of ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']) {
      expect(isCancelledStatus(ok)).toBe(false);
    }
  });
});

describe('stageIndex', () => {
  it('returns the position that drives the done/current highlight', () => {
    expect(stageIndex('placed')).toBe(0);
    expect(stageIndex('confirmed')).toBe(1);
    expect(stageIndex('encoded')).toBe(2);
    expect(stageIndex('shipped')).toBe(3);
    expect(stageIndex('delivered')).toBe(4);
  });

  it('increases monotonically through the lifecycle', () => {
    const lifecycle: OrderStage[] = [
      'placed',
      'confirmed',
      'encoded',
      'shipped',
      'delivered',
    ];
    const indexes = lifecycle.map(stageIndex);
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });

  it('marks exactly the stages up to the current one as done', () => {
    // This is the calculation OrderStageTimeline performs.
    const current = stageForStatus('SHIPPED');
    const done = ORDER_STAGES.map((_, i) => i <= stageIndex(current));
    expect(done).toEqual([true, true, true, true, false]);
  });
});
