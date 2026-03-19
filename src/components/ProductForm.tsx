'use client';

import React, { useEffect, useState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';

export type ProductFormValues = {
  name: string;
  description: string;
  price: number;
  image: string;
};

type ProductFormProps = {
  initialValues?: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel: string;
  submitting?: boolean;
  onCancel?: () => void;
};

const DEFAULT_VALUES: ProductFormValues = {
  name: '',
  description: '',
  price: 0,
  image: '',
};

export default function ProductForm({ initialValues, onSubmit, submitLabel, submitting = false, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(initialValues || DEFAULT_VALUES);
  const [localError, setLocalError] = useState<string | null>(null);
  const [productImagePublicId, setProductImagePublicId] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialValues || DEFAULT_VALUES);
    setLocalError(null);
  }, [initialValues]);

  const handleChange = (key: keyof ProductFormValues, value: string | number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.name.trim()) {
      setLocalError('Name is required');
      return;
    }

    if (!values.description.trim()) {
      setLocalError('Description is required');
      return;
    }

    if (!Number.isFinite(values.price) || values.price < 0) {
      setLocalError('Price must be a valid positive number');
      return;
    }

    if (!values.image.trim()) {
      setLocalError('Product image is required');
      return;
    }

    setLocalError(null);
    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      image: values.image,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-300 mb-1">Name</label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#151a2d] px-3 py-2 text-white outline-none focus:border-orange-400"
          placeholder="TapVyo Metal NFC"
          disabled={submitting}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Description</label>
        <textarea
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#151a2d] px-3 py-2 text-white outline-none focus:border-orange-400 min-h-[100px]"
          placeholder="Premium digital card for professionals"
          disabled={submitting}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Price</label>
        <input
          type="number"
          value={values.price}
          onChange={(e) => handleChange('price', Number(e.target.value))}
          className="w-full rounded-lg border border-white/10 bg-[#151a2d] px-3 py-2 text-white outline-none focus:border-orange-400"
          min={0}
          step="0.01"
          disabled={submitting}
        />
      </div>

      <div>
        <ImageUpload
          folder="admin/products"
          label="Product Image"
          aspectRatio="landscape"
          currentImageUrl={values.image || undefined}
          onUploadComplete={(url, publicId) => {
            setValues((prev) => ({ ...prev, image: url }));
            setProductImagePublicId(publicId);
            setLocalError(null);
          }}
        />
        {productImagePublicId ? (
          <p className="mt-2 text-xs text-gray-500">Cloudinary ID: {productImagePublicId}</p>
        ) : null}
      </div>

      {localError ? <p className="text-sm text-red-400">{localError}</p> : null}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
