'use client';

import { useFormContext } from 'react-hook-form';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import { validation } from '@/utils/validators';

export default function BusinessDetailsForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6">
      <header>
        <span className="tv-eyebrow">Step 02</span>
        <h2 className="tv-h3 mt-3">Your business</h2>
        <p className="tv-small mt-2 tv-measure-body">
          Everything here appears on your digital profile page, not on the physical card.
        </p>
      </header>

      <hr className="tv-rule" />

      <Input
        label="Address"
        required
        placeholder="123 Street, City, Country"
        autoComplete="street-address"
        {...register('businessDetails.address', {
          required: 'Address is required',
        })}
        error={errors.businessDetails && 'address' in errors.businessDetails ? (errors.businessDetails?.address?.message as string) : ''}
      />

      <Input
        label="Website URL"
        placeholder="https://yourwebsite.com"
        type="url"
        inputMode="url"
        hint="Optional"
        {...register('businessDetails.website', validation.url)}
        error={errors.businessDetails && 'website' in errors.businessDetails ? (errors.businessDetails?.website?.message as string) : ''}
      />

      <TextArea
        label="Business Description"
        placeholder="Tell us about your business..."
        rows={4}
        {...register('businessDetails.about')}
        error={errors.businessDetails && 'about' in errors.businessDetails ? (errors.businessDetails?.about?.message as string) : ''}
      />

      <TextArea
        label="Services Offered"
        placeholder="List your services or products"
        rows={4}
        {...register('businessDetails.services')}
        error={errors.businessDetails && 'services' in errors.businessDetails ? (errors.businessDetails?.services?.message as string) : ''}
      />

      <Input
        label="Google Location Link"
        placeholder="https://maps.google.com/..."
        type="url"
        inputMode="url"
        hint="Optional — adds a Get directions button to your profile."
        {...register('businessDetails.googleLocation', validation.url)}
        error={errors.businessDetails && 'googleLocation' in errors.businessDetails ? (errors.businessDetails?.googleLocation?.message as string) : ''}
      />
    </div>
  );
}
