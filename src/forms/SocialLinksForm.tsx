'use client';

import { useFormContext } from 'react-hook-form';
import Input from '@/components/Input';
import { validation } from '@/utils/validators';

const socialLinks = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/channel/username' },
];

export default function SocialLinksForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6">
      {socialLinks.map((social) => (
        <Input
          key={social.key}
          label={social.label}
          placeholder={social.placeholder}
          type="url"
          {...register(`socialLinks.${social.key as any}` as const, validation.url)}
          error={
            ((errors.socialLinks as any)?.[social.key]?.message as string) || undefined
          }
        />
      ))}
      <p className="text-sm text-gray-500 mt-4">
        Leave blank if you don't have a social media account on that platform
      </p>
    </div>
  );
}
