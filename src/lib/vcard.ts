/**
 * vCARD 3.0 BUILDER
 *
 * Pure and environment-free: no DOM, no window, no fetch. It takes contact
 * data and returns a string, so it runs unchanged in a client component, in a
 * route handler, and under vitest. The download side of the feature lives in
 * src/components/profile/SaveContactButton.tsx.
 *
 * WHY 3.0 AND NOT 4.0
 * Apple Contacts and the Android/Google Contacts importer both read 3.0
 * reliably; 4.0 support is patchier on older iOS. The escaping rules applied
 * below are the ones RFC 6350 states for 4.0, which are identical in substance
 * to RFC 2426's for 3.0 - so the output satisfies both.
 *
 * THE THINGS THAT ACTUALLY BREAK vCARDS, all handled here:
 *
 *  - Unescaped delimiters. `;` separates the components of a structured value
 *    and `,` separates repeated values, so an organisation called
 *    "Acme Pvt Ltd, Chennai" silently splits ORG into two fields, and a name
 *    like "Smith; Jones" corrupts every field after it on that line. Text
 *    values are escaped by escapeText() below, ALWAYS.
 *  - LF instead of CRLF. The spec mandates CRLF, and iOS is strict about it -
 *    an LF-only file can import as a single blank contact.
 *  - Unfolded long lines. Lines longer than 75 octets must be folded. A
 *    Cloudinary PHOTO URL or a two-sentence NOTE exceeds that easily.
 *  - Empty properties. `TITLE:` with nothing after it is noise at best and an
 *    empty field in the user's address book at worst, so a property with no
 *    value is omitted entirely rather than emitted blank.
 *
 * URI-valued properties (URL, PHOTO) are deliberately NOT backslash-escaped:
 * they are URI values, not TEXT values, and escaping them would corrupt the
 * link. This is what the RFC requires.
 */

export interface VCardContact {
  /** Display name. Required - a vCard with no FN is not valid. */
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  /** Job title, e.g. "Managing Director". */
  title?: string | null;
  /** Company / organisation. */
  organization?: string | null;
  /** Any format; normalised to +91 E.164 where possible. */
  phone?: string | null;
  email?: string | null;
  /** The public profile URL - what the visitor should be able to reopen. */
  url?: string | null;
  /** Free-text address, written into ADR's locality component. */
  address?: string | null;
  /** Short bio. */
  note?: string | null;
  /** Absolute https URL of a profile photo, if one exists. */
  photoUrl?: string | null;
}

/** Max octets per line before folding, per RFC 6350 section 3.2. */
const MAX_LINE_OCTETS = 75;

/**
 * Escape a TEXT value.
 *
 * Order matters: the backslash must be doubled FIRST, otherwise the
 * backslashes introduced when escaping `,` and `;` would themselves be
 * escaped on a second pass and produce `\\,` instead of `\,`.
 *
 * CRLF, CR and LF are all collapsed to the literal two-character sequence
 * `\n`, which is how a line break inside a value is represented.
 */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/** UTF-8 byte length of a string - folding is defined in octets, not chars. */
function octetLength(value: string): number {
  // TextEncoder is available in every runtime this ships to (browser, node 18+,
  // edge), but a defensive fallback keeps a pure-string utility from throwing.
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }
  return unescape(encodeURIComponent(value)).length;
}

/**
 * Fold one content line to 75 octets, continuing with CRLF + a single space.
 *
 * Splits on character boundaries while measuring in octets, so a multi-byte
 * character is never cut in half - a folded line that splits a UTF-8 sequence
 * imports as replacement characters.
 */
export function foldLine(line: string): string {
  if (octetLength(line) <= MAX_LINE_OCTETS) return line;

  const pieces: string[] = [];
  let current = '';
  // A continuation line spends one octet on its leading space.
  let limit = MAX_LINE_OCTETS;

  // Array.from, not a plain index loop: it iterates by code point, so
  // surrogate pairs (emoji in a bio, for instance) stay intact.
  for (const char of Array.from(line)) {
    const charOctets = octetLength(char);
    if (octetLength(current) + charOctets > limit) {
      pieces.push(current);
      current = char;
      limit = MAX_LINE_OCTETS - 1;
    } else {
      current += char;
    }
  }
  if (current) pieces.push(current);

  return pieces.join('\r\n ');
}

/**
 * Normalise an Indian mobile number to E.164.
 *
 * Every price, address and phone number in this product is Indian, and numbers
 * are stored here without a country code (the live records hold 10 digits), so
 * a bare 10-digit number gets +91. A number that already carries 91 or a
 * longer international prefix is passed through with just a `+` ensured.
 * Returns null when there is nothing usable, so the caller omits TEL rather
 * than writing a half-formed number into someone's address book.
 */
export function toE164India(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Keep a leading + but drop every other non-digit (spaces, dashes, brackets).
  const hadPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (!digits) return null;
  if (hadPlus) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  // 0-prefixed STD form, e.g. 09876543210.
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;

  return `+${digits}`;
}

/**
 * Characters Windows reserves, plus both path separators.
 *
 * Built with the RegExp constructor and String.fromCharCode(92) rather than
 * written as a literal: a backslash inside a character class is a escaping
 * hazard that is easy to get wrong silently (`[\/...]` escapes the FORWARD
 * slash and matches no backslash at all), and a filename that keeps a
 * backslash is a real problem on Windows.
 */
const ILLEGAL_FILENAME_CHARS = new RegExp(
  // Doubled on purpose. The RegExp constructor parses this string as a
  // pattern, so a SINGLE backslash here would escape the `/` that follows it
  // and match no backslash at all - the exact mistake this indirection exists
  // to avoid. Two backslashes in the source pattern mean one literal
  // backslash in the character class. Covered by tests/vcard.test.ts.
  `[${String.fromCharCode(92).repeat(2)}/:*?"<>|]`,
  'g'
);

/**
 * Build the .vcf filename: `<Name>-Tapvyo.vcf`.
 *
 * Strips the characters Windows, macOS and Android all refuse in a filename,
 * plus control characters and path separators, then collapses whitespace runs
 * to a single hyphen. Falls back to "Contact" so the download is never named
 * "-Tapvyo.vcf" for a name made entirely of punctuation.
 */
export function vcardFilename(fullName: string, brand = 'Tapvyo'): string {
  const cleaned = (fullName || '')
    // Control characters, illegal in a filename on every platform. Written as
    // unicode escapes rather than literal bytes so this file stays plain text.
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // Reserved by Windows, or a path separator. Unicode letters are left
    // alone, so a Tamil or Devanagari name keeps its own script.
    .replace(ILLEGAL_FILENAME_CHARS, '')
    .trim()
    // Whitespace runs collapse to one hyphen: "Ravi   Kumar" -> "Ravi-Kumar".
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    // A leading dot would make it a hidden file on unix-likes.
    .replace(/^\.+/, '')
    .replace(/^-+|-+$/g, '');

  return `${cleaned || 'Contact'}-${brand}.vcf`;
}

/** Emit `NAME:value` (already-escaped), folded, or nothing when value is empty. */
function line(property: string, value: string): string | null {
  if (!value) return null;
  return foldLine(`${property}:${value}`);
}

/**
 * Serialise a contact as a vCard 3.0 document with CRLF line endings.
 *
 * FN is the only property always present: it is mandatory, and every other
 * property is omitted when its value is empty.
 */
export function buildVCard(contact: VCardContact): string {
  const {
    fullName,
    firstName,
    lastName,
    title,
    organization,
    phone,
    email,
    url,
    address,
    note,
    photoUrl,
  } = contact;

  const displayName = (fullName || '').trim() || 'Contact';

  // N is structured: family;given;additional;prefix;suffix. Each component is
  // escaped on its own, then joined with the raw `;` separators - escaping the
  // joined string would destroy the structure.
  const family = escapeText((lastName || '').trim());
  const given = escapeText((firstName || '').trim());
  const structuredName = `${family};${given};;;`;

  // ADR is structured too: po;ext;street;locality;region;postcode;country.
  // We hold one free-text address, so it goes in the street component and the
  // rest stay empty - putting it in `locality` would make address books
  // display it as the city.
  const adr = (address || '').trim()
    ? `;;${escapeText(address!.trim())};;;;`
    : '';

  const tel = toE164India(phone);

  const lines: (string | null)[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    line('N', structuredName),
    line('FN', escapeText(displayName)),
    line('TITLE', escapeText((title || '').trim())),
    line('ORG', escapeText((organization || '').trim())),
    tel ? foldLine(`TEL;TYPE=CELL:${tel}`) : null,
    line('EMAIL;TYPE=INTERNET', escapeText((email || '').trim())),
    // URI value - not escaped, see the file header.
    line('URL', (url || '').trim()),
    line('ADR;TYPE=WORK', adr),
    line('NOTE', escapeText((note || '').trim())),
    photoUrl && photoUrl.trim()
      ? foldLine(`PHOTO;VALUE=URI:${photoUrl.trim()}`)
      : null,
    'END:VCARD',
  ];

  // Trailing CRLF: the spec expects the final line to be terminated, and some
  // importers drop the last property without it.
  return `${lines.filter((l): l is string => l !== null).join('\r\n')}\r\n`;
}
