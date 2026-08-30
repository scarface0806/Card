'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Upload, ShieldCheck, RefreshCw } from 'lucide-react';

const uploadFields = [
  {
    key: 'profileImage',
    label: 'Profile Picture',
    description: 'Square image, at least 500 x 500px. JPG or PNG.',
  },
];

export default function UploadForm() {
  const { register } = useFormContext();

  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  const readPreview = (field: string, files: FileList | null) => {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({
          ...prev,
          [field]: reader.result as string,
        }));
      };
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <span className="tv-eyebrow">Step 04</span>
        <h2 className="tv-h3 mt-3">Your photo</h2>
        <p className="tv-small mt-2 tv-measure-body">
          Shown at the top of your digital profile. You can change it later from your
          dashboard.
        </p>
      </header>

      <hr className="tv-rule" />

      {uploadFields.map((field) => {
        // The registration is destructured so the preview reader can run
        // *alongside* react-hook-form's own onChange. Spreading register() and
        // then declaring onChange after it silently replaced RHF's handler, so
        // the chosen file was never written into the form state and never
        // reached the order.
        const { onChange: registerOnChange, ...registration } = register(
          `uploads.${field.key as any}` as const
        );

        return (
          <div key={field.key}>
            <span className="tv-label">{field.label}</span>
            <p className="tv-small mb-3">{field.description}</p>

            <input
              type="file"
              accept="image/*"
              id={field.key}
              className="sr-only tv-dropzone-input"
              {...registration}
              onChange={(e) => {
                registerOnChange(e);
                readPreview(field.key, e.target.files);
              }}
            />
            <label htmlFor={field.key} className="tv-dropzone">
              {previews[field.key] ? (
                <span className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previews[field.key]}
                    alt={`${field.label} preview`}
                    className="mx-auto max-h-48 max-w-full rounded-lg"
                  />
                  <span className="tv-mono mt-4 inline-flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    Replace image
                  </span>
                </span>
              ) : (
                <span className="block">
                  <Upload
                    className="w-6 h-6 mx-auto mb-3 text-[#C9A961]"
                    aria-hidden="true"
                  />
                  <span className="block text-[#F1F3F1] font-semibold text-sm">
                    Click to upload
                  </span>
                  <span className="tv-mono mt-2 block">or drag and drop</span>
                </span>
              )}
            </label>
          </div>
        );
      })}

      <div className="tv-notice tv-notice-patina">
        <ShieldCheck className="tv-notice-icon w-4 h-4" aria-hidden="true" />
        <p>
          <span className="tv-notice-title">Uploads are encrypted in transit</span>
          Use a high-resolution image — it is printed at the size it is supplied, so a
          small file will look soft.
        </p>
      </div>
    </div>
  );
}
