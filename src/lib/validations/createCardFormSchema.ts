import { z } from 'zod';

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const mobileRegex = /^[6-9]\d{9}$/;

const sanitizePhone = (value: string) => {
  const digits = value.replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('91') && digits.length > 10) return digits.slice(2);
  if (digits.startsWith('0') && digits.length > 10) return digits.slice(1);
  return digits;
};

const urlOrHandleSchema = z.string().trim().default('').refine((value) => !value || /^(https?:\/\/)/i.test(value) || /^@?[A-Za-z0-9._-]+$/.test(value), { message: 'Enter a valid link (example: https://yoursite.com)' });

export const createCardFormSchema = z.object({
  personalDetails: z.object({
    name: z.string().trim().min(2, 'Please enter your name').max(50, 'Please enter your name').refine((value) => /^[A-Za-z][A-Za-z\s.'-]*$/.test(value), { message: 'Name can only contain letters' }).refine((value) => !/\d/.test(value), { message: 'Name cannot contain numbers' }),
    designation: z.string().trim().min(2, 'Designation is required').max(80, 'Designation is required'),
    company: z.string().trim().max(80, 'Company too long').default(''),
    mobile: z.string().transform((value) => sanitizePhone(value)).pipe(z.string().min(1, 'Please enter your phone number').refine((value) => value.length === 10, { message: 'Enter a valid 10-digit mobile number' }).refine((value) => mobileRegex.test(value), { message: 'Mobile number must start with 6, 7, 8 or 9' }).refine((value) => !/^([0-9])\1{9}$/.test(value), { message: 'Enter a valid mobile number' })),
    email: z.string().trim().transform((value) => value.toLowerCase()).pipe(z.string().min(1, 'Please enter your email').max(254, 'Enter a valid email address (example: name@domain.com)').refine((value) => emailRegex.test(value), { message: 'Enter a valid email address (example: name@domain.com)' })),
  }),
  businessDetails: z.object({
    address: z.string().trim().min(5, 'Address is required').max(120, 'Address is too long'),
    website: urlOrHandleSchema,
    about: z.string().trim().min(10, 'Please enter a short business description').max(500, 'Description too long').default(''),
    services: z.string().trim().min(3, 'Please list your services').max(500, 'Services too long').default(''),
    googleLocation: urlOrHandleSchema,
  }),
  socialLinks: z.object({
    instagram: urlOrHandleSchema,
    facebook: urlOrHandleSchema,
    linkedin: urlOrHandleSchema,
    youtube: urlOrHandleSchema,
  }).default({
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: '',
  }),
  uploads: z.object({
    profileImage: z.any().nullable().optional(),
    logo: z.any().nullable().optional(),
  }).default({}),
  payment: z.object({
    method: z.string().default('card'),
    terms: z.boolean().refine((value) => value === true, { message: 'Please accept the terms to continue' }),
  }),
});

export type CreateCardFormValues = z.infer<typeof createCardFormSchema>;
