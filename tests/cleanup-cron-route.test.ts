import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** GET /api/cron/cleanup-uploads - the auth gate in front of a delete job. */

const cleanup = vi.fn(async ({ dryRun }: { dryRun?: boolean }) => ({
  dryRun: Boolean(dryRun),
  scanned: 2,
  referenced: 1,
  deleted: ['custom-cards/u/x'],
  failed: [],
}));

vi.mock('@/lib/upload-cleanup', () => ({
  cleanupAbandonedUploads: (options: { dryRun?: boolean }) => cleanup(options),
}));

const { GET } = await import('../app/api/cron/cleanup-uploads/route');
const { NextRequest } = await import('next/server');

function call(path: string, auth?: string) {
  const headers = new Headers();
  if (auth) headers.set('authorization', auth);
  return GET(new NextRequest(`https://tapvyo.in${path}`, { headers }));
}

beforeEach(() => {
  process.env.CRON_SECRET = 'test-cron-secret';
  cleanup.mockClear();
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe('GET /api/cron/cleanup-uploads', () => {
  it('refuses to run when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await call('/api/cron/cleanup-uploads', 'Bearer anything');
    expect(res.status).toBe(503);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('rejects a missing or wrong secret', async () => {
    expect((await call('/api/cron/cleanup-uploads')).status).toBe(401);
    expect((await call('/api/cron/cleanup-uploads', 'Bearer wrong')).status).toBe(401);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('runs with the right secret', async () => {
    const res = await call('/api/cron/cleanup-uploads', 'Bearer test-cron-secret');
    expect(res.status).toBe(200);
    expect(cleanup).toHaveBeenCalledWith({ dryRun: false });
  });

  it('passes dryRun through', async () => {
    await call('/api/cron/cleanup-uploads?dryRun=1', 'Bearer test-cron-secret');
    expect(cleanup).toHaveBeenCalledWith({ dryRun: true });
  });

  it('reports a failure without claiming success', async () => {
    cleanup.mockRejectedValueOnce(new Error('cloudinary down'));
    const res = await call('/api/cron/cleanup-uploads', 'Bearer test-cron-secret');
    expect(res.status).toBe(500);
  });
});
