import { describe, expect, it } from 'vitest';
import { contactFormSchema } from './contactFormSchema';
import { createCardFormSchema } from './createCardFormSchema';

describe('contactFormSchema', () => {
  it('accepts valid Indian mobile and trimmed email', () => {
    const result = contactFormSchema.safeParse({
      name: '  Jane Doe  ',
      phone: '+91 9876543210',
      email: '  JANE@EXAMPLE.COM  ',
      subject: 'support',
      message: 'Hello there this is a valid message.',
      website: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Jane Doe');
      expect(result.data.phone).toBe('9876543210');
      expect(result.data.email).toBe('jane@example.com');
    }
  });

  it('rejects invalid mobile and short messages', () => {
    const result = contactFormSchema.safeParse({
      name: 'Jane Doe',
      phone: '1234567890',
      email: 'jane@example.com',
      subject: 'support',
      message: 'short',
      website: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('createCardFormSchema', () => {
  it('accepts valid card details', () => {
    const result = createCardFormSchema.safeParse({
      personalDetails: {
        name: 'Jane Doe',
        designation: 'Marketing Lead',
        company: 'Acme Inc',
        mobile: '9876543210',
        email: 'jane@acme.com',
      },
      businessDetails: {
        address: '123 MG Road, Bengaluru',
        website: 'https://acme.com',
        about: 'We build digital experiences',
        services: 'Branding and web design',
      },
      socialLinks: {
        instagram: '@janedoe',
        facebook: '',
        linkedin: '',
        youtube: '',
      },
      uploads: { profileImage: null },
      payment: { method: 'card', terms: true },
    });

    expect(result.success).toBe(true);
  });

  it('rejects unchecked terms and invalid name', () => {
    const result = createCardFormSchema.safeParse({
      personalDetails: {
        name: 'Jane123',
        designation: 'Marketing Lead',
        company: 'Acme Inc',
        mobile: '9876543210',
        email: 'jane@acme.com',
      },
      businessDetails: {
        address: '123 MG Road, Bengaluru',
        website: 'https://acme.com',
        about: 'We build digital experiences',
        services: 'Branding and web design',
      },
      socialLinks: {},
      uploads: { profileImage: null },
      payment: { method: 'card', terms: false },
    });

    expect(result.success).toBe(false);
  });
});
