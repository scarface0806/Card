import { describe, expect, it } from 'vitest';
import { contactFormSchema } from './contactFormSchema';
import { createCardFormSchema, getStepFieldNames } from './createCardFormSchema';

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
  it('validates only the current step fields for step progression', () => {
    expect(getStepFieldNames(1)).toEqual([
      'personalDetails.name',
      'personalDetails.designation',
      'personalDetails.mobile',
      'personalDetails.email',
    ]);

    // Step 2 renders address and about, and the schema makes both required -
    // so both have to be gated here, or the customer reaches step 5 with a
    // form the full schema will reject. The Services Offered field that used
    // to sit between them was removed: it was required, yet nothing on the
    // profile or in the admin email ever rendered what it collected.
    expect(getStepFieldNames(2)).toEqual([
      'businessDetails.address',
      'businessDetails.about',
    ]);
    expect(getStepFieldNames(5)).toEqual(['payment.terms']);
  });

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
      },
      socialLinks: {},
      uploads: { profileImage: null },
      payment: { method: 'card', terms: false },
    });

    expect(result.success).toBe(false);
  });
});
