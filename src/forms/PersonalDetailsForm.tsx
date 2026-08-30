'use client';

import { useFormContext } from 'react-hook-form';
import Input from '@/components/Input';
import { validation } from '@/utils/validators';

export default function PersonalDetailsForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6">
      <header>
        <span className="tv-eyebrow">Step 01</span>
        <h2 className="tv-h3 mt-3">Who is the card for?</h2>
        <p className="tv-small mt-2 tv-measure-body">
          This is the name and title printed on the card and shown at the top of your
          digital profile.
        </p>
      </header>

      <hr className="tv-rule" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Full Name"
          required
          placeholder="John Doe"
          autoComplete="name"
          {...register('personalDetails.name', validation.name)}
          error={errors.personalDetails && 'name' in errors.personalDetails ? (errors.personalDetails?.name?.message as string) : ''}
        />
        <Input
          label="Designation"
          required
          placeholder="CEO / Manager / Developer"
          autoComplete="organization-title"
          {...register('personalDetails.designation', {
            required: 'Designation is required',
          })}
          error={errors.personalDetails && 'designation' in errors.personalDetails ? (errors.personalDetails?.designation?.message as string) : ''}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Company"
          placeholder="Your company name"
          autoComplete="organization"
          hint="Optional"
          {...register('personalDetails.company')}
        />
        <Input
          label="Mobile"
          required
          placeholder="9876543210"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          {...register('personalDetails.mobile', validation.phone)}
          error={errors.personalDetails && 'mobile' in errors.personalDetails ? (errors.personalDetails?.mobile?.message as string) : ''}
        />
      </div>

      <Input
        label="Email"
        required
        placeholder="you@example.com"
        type="email"
        inputMode="email"
        autoComplete="email"
        hint="Your order confirmation and profile link are sent here."
        {...register('personalDetails.email', validation.email)}
        error={errors.personalDetails && 'email' in errors.personalDetails ? (errors.personalDetails?.email?.message as string) : ''}
      />
    </div>
  );
}
