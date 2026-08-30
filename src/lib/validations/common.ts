export const normalizeDigitString = (value: string) => value.replace(/\D+/g, '');

export const normalizeNameValue = (value: string) =>
  value.replace(/\s+/g, ' ').trim();

export const normalizeEmailValue = (value: string) =>
  value.trim().toLowerCase();

export const normalizeUrlValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const sanitizePhoneValue = (value: string) => {
  const digits = value.replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.length > 2 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length > 1 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

export const sanitizeNameValue = (value: string) =>
  value.replace(/[^A-Za-z\s.'-]/g, '').replace(/\s+/g, ' ').trim();

export const sanitizeCompanyValue = (value: string) =>
  value.replace(/[^A-Za-z0-9 &.,'-]/g, '').replace(/\s+/g, ' ').trim();

export const sanitizeLinkValue = (value: string) => value.trim().replace(/\s+/g, '');
