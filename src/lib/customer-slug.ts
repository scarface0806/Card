import prisma from "@/lib/prisma";

export function buildCustomerSlug(customerId: string) {
  return `tapvyonfc-${customerId.slice(-6).toLowerCase()}`;
}

export async function generateUniqueCustomerSlug(customerId: string) {
  const baseSlug = buildCustomerSlug(customerId);
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.customer.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}