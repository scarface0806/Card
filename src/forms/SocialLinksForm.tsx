'use client';

import { useFormContext } from 'react-hook-form';
import { Info } from 'lucide-react';
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
      <header>
        <span className="tv-eyebrow">Step 03</span>
        <h2 className="tv-h3 mt-3">Social links</h2>
        <p className="tv-small mt-2 tv-measure-body">
          Each link you add becomes a tappable button on your profile. All four are
          optional.
        </p>
      </header>

      <hr className="tv-rule" />

      <div className="space-y-5">
        {socialLinks.map((social) => (
          <Input
            key={social.key}
            label={social.label}
            placeholder={social.placeholder}
            type="url"
            inputMode="url"
            {...register(`socialLinks.${social.key as any}` as const, validation.url)}
            error={
              ((errors.socialLinks as any)?.[social.key]?.message as string) || undefined
            }
          />
        ))}
      </div>

      <div className="tv-notice">
        <Info className="tv-notice-icon w-4 h-4" aria-hidden="true" />
        <p>
          Leave a field blank if you don&apos;t have a profile on that platform — the
          button simply won&apos;t appear.
        </p>
      </div>
    </div>
  );
}
