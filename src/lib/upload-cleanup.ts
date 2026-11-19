/**
 * Deletes checkout uploads that never became part of an order. SERVER-ONLY.
 *
 * WHY THIS EXISTS
 * Checkout uploads a profile photo or card artwork the moment a file is
 * picked - before any order exists (see /api/uploads/custom-card). A customer
 * who uploads and then leaves, or replaces an image, leaves files in
 * Cloudinary that nothing points at. Left alone they accumulate forever,
 * costing storage and keeping customers' photos we have no reason to hold.
 *
 * WHAT COUNTS AS ABANDONED - all three must hold:
 *  1. It is in one of the checkout folders (custom-cards/, profile-photos/).
 *     Admin product images, blog images etc. live elsewhere and are never
 *     listed, let alone deleted.
 *  2. It is older than MIN_AGE_MS (7 days). A checkout's form state lives in
 *     the browser tab and does not survive a reload, so an upload that old can
 *     no longer be attached to an order. The margin is deliberately generous.
 *  3. No Order references its public id - on ANY order, whatever its status.
 *     Unpaid, cancelled and refunded orders keep their images: an admin may
 *     still need to see what was submitted.
 *
 * FAIL SAFE
 * If Cloudinary cannot be listed or the orders cannot be read, the run stops
 * WITHOUT deleting anything. Deleting on partial information is the one
 * failure that cannot be undone.
 */

import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { UPLOAD_FOLDER_ROOTS } from "@/lib/custom-card-artwork";

export const MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Upper bound per run, so one bad run cannot empty a folder. */
export const MAX_DELETIONS_PER_RUN = 1000;

/** Cloudinary's delete_resources accepts up to 100 ids per call. */
const DELETE_BATCH = 100;

export interface UploadedResource {
  public_id: string;
  /** ISO timestamp from Cloudinary. */
  created_at: string;
}

/**
 * The uploads to delete, from a listing and the set of ids orders still use.
 * Pure, so the rules above can be tested without Cloudinary or a database.
 */
export function selectOrphans(
  resources: UploadedResource[],
  referenced: ReadonlySet<string>,
  now: number,
  options: { minAgeMs?: number; roots?: readonly string[]; limit?: number } = {}
): string[] {
  const minAgeMs = options.minAgeMs ?? MIN_AGE_MS;
  const roots = options.roots ?? Object.values(UPLOAD_FOLDER_ROOTS);
  const limit = options.limit ?? MAX_DELETIONS_PER_RUN;

  const orphans: string[] = [];
  for (const resource of resources) {
    const id = resource.public_id;
    // Belt and braces: the listing is already filtered by prefix.
    if (!roots.some((root) => id.startsWith(`${root}/`))) continue;
    if (referenced.has(id)) continue;

    const created = Date.parse(resource.created_at);
    // An unparseable date is treated as "too new": never delete on a guess.
    if (!Number.isFinite(created) || now - created < minAgeMs) continue;

    orphans.push(id);
    if (orphans.length >= limit) break;
  }
  return orphans;
}

/** Every public id under one folder root, following Cloudinary's pagination. */
async function listResources(root: string): Promise<UploadedResource[]> {
  const all: UploadedResource[] = [];
  let cursor: string | undefined;
  do {
    const page = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: `${root}/`,
      max_results: 500,
      next_cursor: cursor,
    });
    for (const resource of page.resources as UploadedResource[]) {
      all.push({ public_id: resource.public_id, created_at: resource.created_at });
    }
    cursor = page.next_cursor;
  } while (cursor);
  return all;
}

/** Public ids that some order still points at. */
async function referencedPublicIds(): Promise<Set<string>> {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customFrontPublicId: { not: null } },
        { customBackPublicId: { not: null } },
        { profileImagePublicId: { not: null } },
      ],
    },
    select: { customFrontPublicId: true, customBackPublicId: true, profileImagePublicId: true },
  });

  const ids = new Set<string>();
  for (const order of orders) {
    for (const id of [order.customFrontPublicId, order.customBackPublicId, order.profileImagePublicId]) {
      if (id) ids.add(id);
    }
  }
  return ids;
}

export interface CleanupReport {
  dryRun: boolean;
  scanned: number;
  referenced: number;
  deleted: string[];
  /** Ids Cloudinary reported it could not delete. */
  failed: string[];
}

export async function cleanupAbandonedUploads(options: { dryRun?: boolean } = {}): Promise<CleanupReport> {
  const dryRun = options.dryRun ?? false;

  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  // Both reads must succeed before anything is deleted (see FAIL SAFE).
  const listings = await Promise.all(Object.values(UPLOAD_FOLDER_ROOTS).map(listResources));
  const resources = listings.flat();
  const referenced = await referencedPublicIds();

  const orphans = selectOrphans(resources, referenced, Date.now());

  const report: CleanupReport = {
    dryRun,
    scanned: resources.length,
    referenced: referenced.size,
    deleted: [],
    failed: [],
  };

  if (dryRun || orphans.length === 0) {
    report.deleted = dryRun ? orphans : [];
    return report;
  }

  // A failed batch is recorded and the run moves on; this function only
  // throws BEFORE the first delete, so a thrown error always means "nothing
  // was deleted".
  for (let i = 0; i < orphans.length; i += DELETE_BATCH) {
    const batch = orphans.slice(i, i + DELETE_BATCH);
    try {
      const result = await cloudinary.api.delete_resources(batch, {
        type: "upload",
        resource_type: "image",
        invalidate: true,
      });
      const outcome = (result?.deleted ?? {}) as Record<string, string>;
      for (const id of batch) {
        if (outcome[id] === "deleted" || outcome[id] === "not_found") report.deleted.push(id);
        else report.failed.push(id);
      }
    } catch (error) {
      console.error("[cleanup-uploads] delete batch failed:", error instanceof Error ? error.message : error);
      report.failed.push(...batch);
    }
  }

  return report;
}
