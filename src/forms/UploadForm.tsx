'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Upload, X } from 'lucide-react';

const uploadFields = [
  {
    key: 'profileImage',
    label: 'Profile Picture',
    description: 'Recommended size: 500x500px',
  },
  {
    key: 'logo',
    label: 'Company Logo',
    description: 'Recommended size: 500x500px',
  },
  {
    key: 'coverImage',
    label: 'Cover Image',
    description: 'Recommended size: 1200x400px',
  },
];

export default function UploadForm() {
  const { register } = useFormContext();

  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  const handleFileChange = (field: string, file: FileList) => {
    if (file && file[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({
          ...prev,
          [field]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file[0]);
    }
  };

  return (
    <div className="space-y-8">
      {uploadFields.map((field) => (
        <div key={field.key} className="border-2 border-gray-300 rounded-lg p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {field.label}
          </label>
          <p className="text-xs text-gray-500 mb-4">{field.description}</p>

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id={field.key}
              {...register(`uploads.${field.key as any}` as const)}
              onChange={(e) => handleFileChange(field.key, e.target.files!)}
            />
            <label
              htmlFor={field.key}
              className="block w-full border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-black transition-colors"
            >
              {previews[field.key] ? (
                <img
                  src={previews[field.key]}
                  alt={field.label}
                  className="max-w-xs mx-auto max-h-48 rounded"
                />
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">Click to upload</p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                </div>
              )}
            </label>
          </div>
        </div>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          Tip: Use high-quality images for the best results. All uploads are secure and encrypted.
        </p>
      </div>
    </div>
  );
}
