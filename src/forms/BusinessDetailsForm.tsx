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
      <Input
        label="Address *"
        placeholder="123 Street, City, Country"
        {...register('businessDetails.address', {
          required: 'Address is required',
        })}
        error={errors.businessDetails && 'address' in errors.businessDetails ? (errors.businessDetails?.address?.message as string) : ''}
      />

      <Input
        label="Website URL"
        placeholder="https://yourwebsite.com"
        type="url"
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
        label="Google Location Link (Optional)"
        placeholder="https://maps.google.com/..."
        type="url"
        {...register('businessDetails.googleLocation', validation.url)}
        error={errors.businessDetails && 'googleLocation' in errors.businessDetails ? (errors.businessDetails?.googleLocation?.message as string) : ''}
      />
    </div>
  );
}
