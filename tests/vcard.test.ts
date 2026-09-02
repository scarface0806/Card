import { describe, expect, it } from 'vitest';

import {
  buildVCard,
  escapeText,
  foldLine,
  toE164India,
  vcardFilename,
} from '@/lib/vcard';

/**
 * The point of these tests is the file format, not the happy path. A vCard
 * that "looks right" in a text editor still fails to import if a delimiter is
 * unescaped or the line endings are wrong, and neither is visible by eye.
 */

describe('escapeText', () => {
  it('escapes the two structural delimiters', () => {
    expect(escapeText('Acme Pvt Ltd, Chennai')).toBe('Acme Pvt Ltd\\, Chennai');
    expect(escapeText('Smith; Jones')).toBe('Smith\\; Jones');
  });

  it('doubles a backslash before anything else, so escapes are not re-escaped', () => {
    // A single pass in the wrong order turns "a\,b" into "a\\,b", which parses
    // as a literal backslash followed by a field separator.
    expect(escapeText('back\\slash')).toBe('back\\\\slash');
    expect(escapeText('a\\,b')).toBe('a\\\\\\,b');
  });

  it('collapses every newline form to a literal \\n sequence', () => {
    expect(escapeText('one\r\ntwo')).toBe('one\\ntwo');
    expect(escapeText('one\ntwo')).toBe('one\\ntwo');
    expect(escapeText('one\rtwo')).toBe('one\\ntwo');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeText('Managing Director')).toBe('Managing Director');
  });
});

describe('foldLine', () => {
  it('leaves a short line alone', () => {
    expect(foldLine('FN:Ravi Kumar')).toBe('FN:Ravi Kumar');
  });

  it('folds a long line with CRLF + a single space', () => {
    const long = `PHOTO;VALUE=URI:https://res.cloudinary.com/demo/image/upload/${'a'.repeat(120)}.jpg`;
    const folded = foldLine(long);

    expect(folded).toContain('\r\n ');

    // Every physical line must be within the 75-octet limit.
    for (const physical of folded.split('\r\n')) {
      expect(physical.length).toBeLessThanOrEqual(75);
    }

    // Unfolding (strip CRLF + one following space) must return the original.
    expect(folded.replace(/\r\n /g, '')).toBe(long);
  });

  it('never splits a multi-byte character across a fold', () => {
    // Each emoji is 4 UTF-8 octets, so a naive char-count fold would cut one
    // in half and produce replacement characters on import.
    const line = `NOTE:${'\u{1F600}'.repeat(40)}`;
    const folded = foldLine(line);

    for (const physical of folded.split('\r\n')) {
      expect(new TextEncoder().encode(physical).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, '')).toBe(line);
    expect(folded).not.toContain('�');
  });
});

describe('toE164India', () => {
  it('adds +91 to a bare 10-digit number', () => {
    expect(toE164India('7871361025')).toBe('+917871361025');
  });

  it('strips formatting before normalising', () => {
    expect(toE164India('78713 61025')).toBe('+917871361025');
    expect(toE164India('(787) 136-1025')).toBe('+917871361025');
  });

  it('keeps an already-international number', () => {
    expect(toE164India('+917871361025')).toBe('+917871361025');
    expect(toE164India('917871361025')).toBe('+917871361025');
  });

  it('drops a 0 STD prefix', () => {
    expect(toE164India('07871361025')).toBe('+917871361025');
  });

  it('returns null when there is nothing usable', () => {
    expect(toE164India('')).toBeNull();
    expect(toE164India('   ')).toBeNull();
    expect(toE164India(null)).toBeNull();
    expect(toE164India(undefined)).toBeNull();
    expect(toE164India('not a phone')).toBeNull();
  });
});

describe('vcardFilename', () => {
  it('joins the name to the brand', () => {
    expect(vcardFilename('Ravi Kumar')).toBe('Ravi-Kumar-Tapvyo.vcf');
  });

  it('collapses whitespace runs to one hyphen', () => {
    expect(vcardFilename('Ravi   Kumar')).toBe('Ravi-Kumar-Tapvyo.vcf');
  });

  it('removes path separators and Windows-reserved characters', () => {
    expect(vcardFilename('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij-Tapvyo.vcf');
  });

  it('falls back to Contact rather than producing a leading hyphen', () => {
    expect(vcardFilename('')).toBe('Contact-Tapvyo.vcf');
    expect(vcardFilename('///')).toBe('Contact-Tapvyo.vcf');
  });

  it('does not produce a hidden file from a leading dot', () => {
    expect(vcardFilename('.hidden').startsWith('.')).toBe(false);
  });

  it('keeps non-latin scripts', () => {
    expect(vcardFilename('ரவி')).toBe('ரவி-Tapvyo.vcf');
  });
});

describe('buildVCard', () => {
  const full = {
    fullName: 'Ravi Kumar',
    firstName: 'Ravi',
    lastName: 'Kumar',
    title: 'Managing Director',
    organization: 'Acme Pvt Ltd, Chennai',
    phone: '7871361025',
    email: 'ravi@example.com',
    url: 'https://tapvyo.com/card/ravi-kumar',
    address: 'Tiruchirappalli, Tamil Nadu, India',
    note: 'NFC cards; digital profiles.',
    photoUrl: 'https://res.cloudinary.com/demo/image/upload/ravi.jpg',
  };

  it('opens and closes correctly and declares 3.0', () => {
    const card = buildVCard(full);
    expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
    expect(card.endsWith('END:VCARD\r\n')).toBe(true);
  });

  it('uses CRLF everywhere and never a bare LF', () => {
    const card = buildVCard(full);
    expect(card).toContain('\r\n');
    // Remove every CRLF; any LF left over was a bare one.
    expect(card.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('escapes delimiters inside ORG, NOTE and ADR', () => {
    const card = buildVCard(full);
    expect(card).toContain('ORG:Acme Pvt Ltd\\, Chennai');
    expect(card).toContain('NOTE:NFC cards\\; digital profiles.');
    expect(card).toContain('ADR;TYPE=WORK:;;Tiruchirappalli\\, Tamil Nadu\\, India;;;;');
  });

  it('keeps N structured, escaping components but not the separators', () => {
    const card = buildVCard({ ...full, lastName: 'Kumar; Jr', firstName: 'Ravi' });
    expect(card).toContain('N:Kumar\\; Jr;Ravi;;;');
  });

  it('normalises TEL to +91 and marks it CELL', () => {
    expect(buildVCard(full)).toContain('TEL;TYPE=CELL:+917871361025');
  });

  it('writes the profile URL, not the personal website', () => {
    expect(buildVCard(full)).toContain('URL:https://tapvyo.com/card/ravi-kumar');
  });

  it('does not escape a URI value', () => {
    const card = buildVCard({
      ...full,
      url: 'https://example.com/a,b;c',
    });
    expect(card).toContain('URL:https://example.com/a,b;c');
  });

  it('includes PHOTO only when a photo URL exists', () => {
    expect(buildVCard(full)).toContain('PHOTO;VALUE=URI:');
    expect(buildVCard({ ...full, photoUrl: null })).not.toContain('PHOTO');
  });

  it('omits empty properties rather than emitting blank ones', () => {
    const card = buildVCard({ fullName: 'Solo' });
    expect(card).toContain('FN:Solo');
    for (const prop of ['TITLE', 'ORG', 'TEL', 'EMAIL', 'URL', 'ADR', 'NOTE', 'PHOTO']) {
      expect(card).not.toContain(`${prop}:`);
    }
  });

  it('always emits FN, even with no usable name', () => {
    expect(buildVCard({ fullName: '' })).toContain('FN:Contact');
  });

  it('contains every field the spec requires when all data is present', () => {
    const card = buildVCard(full);
    for (const prop of ['FN', 'N', 'TITLE', 'ORG', 'TEL', 'EMAIL', 'URL', 'ADR', 'NOTE', 'PHOTO']) {
      expect(card).toMatch(new RegExp(`(^|\r\n)${prop}[;:]`));
    }
  });
});
