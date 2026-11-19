import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Abandoned-upload cleanup. The rules (folder, age, unreferenced) are tested
 * on the pure selectOrphans; the runner is tested against mocked Cloudinary
 * and Prisma for the property that matters most - it never deletes when it
 * could not see the whole picture.
 */

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-20T00:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * DAY).toISOString();

let listing: Record<string, { public_id: string; created_at: string }[]> = {};
let listingFails = false;
let orderRows: { customFrontPublicId: string | null; customBackPublicId: string | null; profileImagePublicId: string | null }[] = [];
const deleteResources = vi.fn(async (ids: string[]) => ({
  deleted: Object.fromEntries(ids.map((id) => [id, 'deleted'])),
}));

vi.mock('@/lib/cloudinary', () => ({
  isCloudinaryConfigured: () => true,
  default: {
    api: {
      resources: vi.fn(async ({ prefix }: { prefix: string }) => {
        if (listingFails) throw new Error('Cloudinary rate limited');
        return { resources: listing[prefix] ?? [], next_cursor: undefined };
      }),
      delete_resources: (ids: string[]) => deleteResources(ids),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: { order: { findMany: vi.fn(async () => orderRows) } },
}));

const { selectOrphans, cleanupAbandonedUploads, MIN_AGE_MS } = await import('@/lib/upload-cleanup');

beforeEach(() => {
  listing = {};
  listingFails = false;
  orderRows = [];
  deleteResources.mockClear();
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});

describe('selectOrphans', () => {
  const old = daysAgo(8);

  it('deletes old, unreferenced uploads in the checkout folders', () => {
    const result = selectOrphans(
      [
        { public_id: 'custom-cards/u1/a', created_at: old },
        { public_id: 'profile-photos/u1/b', created_at: old },
      ],
      new Set(),
      NOW
    );
    expect(result).toEqual(['custom-cards/u1/a', 'profile-photos/u1/b']);
  });

  it('keeps anything an order references', () => {
    const result = selectOrphans(
      [{ public_id: 'custom-cards/u1/used', created_at: old }],
      new Set(['custom-cards/u1/used']),
      NOW
    );
    expect(result).toEqual([]);
  });

  it('keeps anything younger than 7 days - the checkout may still be open', () => {
    expect(MIN_AGE_MS).toBe(7 * DAY);
    const result = selectOrphans(
      [{ public_id: 'profile-photos/u1/new', created_at: daysAgo(6) }],
      new Set(),
      NOW
    );
    expect(result).toEqual([]);
  });

  it('never touches other folders, even if they are listed', () => {
    const result = selectOrphans(
      [
        { public_id: 'admin/products/card', created_at: old },
        { public_id: 'custom-cards-evil/x', created_at: old },
      ],
      new Set(),
      NOW
    );
    expect(result).toEqual([]);
  });

  it('treats an unreadable date as too new', () => {
    expect(selectOrphans([{ public_id: 'custom-cards/u1/a', created_at: 'garbage' }], new Set(), NOW)).toEqual([]);
  });

  it('caps the number deleted in one run', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ public_id: `custom-cards/u/${i}`, created_at: old }));
    expect(selectOrphans(many, new Set(), NOW, { limit: 2 })).toHaveLength(2);
  });
});

describe('cleanupAbandonedUploads', () => {
  it('deletes only the orphans', async () => {
    listing = {
      'custom-cards/': [
        { public_id: 'custom-cards/u1/used', created_at: daysAgo(30) },
        { public_id: 'custom-cards/u1/orphan', created_at: daysAgo(30) },
      ],
      'profile-photos/': [{ public_id: 'profile-photos/u1/fresh', created_at: daysAgo(1) }],
    };
    orderRows = [{ customFrontPublicId: 'custom-cards/u1/used', customBackPublicId: null, profileImagePublicId: null }];

    const report = await cleanupAbandonedUploads();

    expect(deleteResources).toHaveBeenCalledTimes(1);
    expect(deleteResources).toHaveBeenCalledWith(['custom-cards/u1/orphan']);
    expect(report).toMatchObject({ dryRun: false, scanned: 3, referenced: 1, deleted: ['custom-cards/u1/orphan'], failed: [] });
  });

  it('reports without deleting on a dry run', async () => {
    listing = { 'custom-cards/': [{ public_id: 'custom-cards/u1/orphan', created_at: daysAgo(30) }] };

    const report = await cleanupAbandonedUploads({ dryRun: true });

    expect(deleteResources).not.toHaveBeenCalled();
    expect(report.deleted).toEqual(['custom-cards/u1/orphan']);
  });

  it('deletes nothing when Cloudinary cannot be listed', async () => {
    listingFails = true;
    await expect(cleanupAbandonedUploads()).rejects.toThrow();
    expect(deleteResources).not.toHaveBeenCalled();
  });

  it('deletes nothing when the orders cannot be read', async () => {
    listing = { 'custom-cards/': [{ public_id: 'custom-cards/u1/orphan', created_at: daysAgo(30) }] };
    const prisma = (await import('@/lib/prisma')).default as unknown as { order: { findMany: ReturnType<typeof vi.fn> } };
    prisma.order.findMany.mockRejectedValueOnce(new Error('db down'));

    await expect(cleanupAbandonedUploads()).rejects.toThrow('db down');
    expect(deleteResources).not.toHaveBeenCalled();
  });
});
