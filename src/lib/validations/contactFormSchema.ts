import { z } from 'zod';

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const sanitizePhone = (raw: string) => {
  const digits = raw.replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('91') && digits.length > 10) return digits.slice(2);
  if (digits.startsWith('0') && digits.length > 10) return digits.slice(1);
  return digits;
};

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(50, 'Please enter your name').refine((value) => /^[A-Za-z][A-Za-z\s.'-]*$/.test(value), { message: 'Name can only contain letters' }).refine((value) => !/\d/.test(value), { message: 'Name cannot contain numbers' }),
  phone: z.string().transform((value) => sanitizePhone(value)).pipe(z.string().min(1, 'Please enter your phone number').refine((value) => value.length === 10, { message: 'Enter a valid 10-digit mobile number' }).refine((value) => /^[6-9]\d{9}$/.test(value), { message: 'Mobile number must start with 6, 7, 8 or 9' }).refine((value) => !/^([0-9])\1{9}$/.test(value), { message: 'Enter a valid mobile number' })),
  email: z.string().trim().transform((value) => value.toLowerCase()).pipe(z.string().min(1, 'Please enter your email').max(254, 'Enter a valid email address (example: name@domain.com)').refine((value) => emailRegex.test(value), { message: 'Enter a valid email address (example: name@domain.com)' })),
  subject: z.string().trim().refine((value) => value !== '' && value !== 'Select a subject', { message: 'Please select a subject' }),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(1000, 'Message cannot exceed 1000 characters'),
  website: z.string().trim().default(''),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
