/**
 * Generate unique slug for NFC profiles
 * Format: tapvyo-nfc-{randomString}
 */

export function generateProfileSlug(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `tapvyo-nfc-${timestamp}-${random}`;
}

/**
 * Generate a more readable slug from customer name
 */
export function generateReadableSlug(customerName: string): string {
  const cleanName = customerName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20);
  
  const random = Math.random().toString(36).substring(2, 6);
  return `tapvyo-nfc-${cleanName}-${random}`;
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^tapvyo-nfc-[a-z0-9-]+$/.test(slug);
}
