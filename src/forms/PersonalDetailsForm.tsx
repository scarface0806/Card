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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name *"
          placeholder="John Doe"
          autoComplete="name"
          {...register('personalDetails.name', validation.name)}
          error={errors.personalDetails && 'name' in errors.personalDetails ? (errors.personalDetails?.name?.message as string) : ''}
        />
        <Input
          label="Designation *"
          placeholder="CEO/Manager/Developer"
          autoComplete="organization-title"
          {...register('personalDetails.designation', {
            required: 'Designation is required',
          })}
          error={errors.personalDetails && 'designation' in errors.personalDetails ? (errors.personalDetails?.designation?.message as string) : ''}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Company"
          placeholder="Your Company Name (Optional)"
          autoComplete="organization"
          {...register('personalDetails.company')}
        />
        <Input
          label="Mobile *"
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
        label="Email *"
        placeholder="you@example.com"
        type="email"
        inputMode="email"
        autoComplete="email"
        {...register('personalDetails.email', validation.email)}
        error={errors.personalDetails && 'email' in errors.personalDetails ? (errors.personalDetails?.email?.message as string) : ''}
      />
    </div>
  );
}
