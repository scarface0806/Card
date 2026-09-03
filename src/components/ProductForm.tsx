'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';

export type ProductFormValues = {
  name: string;
  description: string;
  price: number;
  image: string;
  /**
   * The back of the card. Optional, unlike the front: a product without one
   * simply does not offer the flip on the storefront. Empty string means
   * "none", and the API writes that through as null.
   */
  backImage: string;
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
  backImage: '',
};

export default function ProductForm({ initialValues, onSubmit, submitLabel, submitting = false, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(initialValues || DEFAULT_VALUES);
  const [localError, setLocalError] = useState<string | null>(null);
  const [productImagePublicId, setProductImagePublicId] = useState<string | null>(null);
  const [backImagePublicId, setBackImagePublicId] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialValues || DEFAULT_VALUES);
    setLocalError(null);
  }, [initialValues]);

  const handleChange = (key: keyof ProductFormValues, value: string | number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * ImageUpload calls this from an effect that lists `onUploadComplete` in its
   * dependency array, so the callback has to be referentially stable AND has
   * to leave state untouched when the URL has not actually changed. An inline
   * arrow that always built a fresh object re-rendered the form, handed
   * ImageUpload a new function identity, re-ran its effect, and looped. Two
   * uploaders on this form made that twice as easy to hit.
   */
  const handleFrontUpload = useCallback((url: string, publicId: string) => {
    setValues((prev) => (prev.image === url ? prev : { ...prev, image: url }));
    setProductImagePublicId(publicId);
    setLocalError(null);
  }, []);

  const handleBackUpload = useCallback((url: string, publicId: string) => {
    setValues((prev) => (prev.backImage === url ? prev : { ...prev, backImage: url }));
    setBackImagePublicId(publicId);
  }, []);

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

    // Deliberately no validation on backImage: it is optional, and an empty
    // string is a legitimate value meaning "this card has no back".
    setLocalError(null);
    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      image: values.image,
      backImage: values.backImage.trim(),
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
          onUploadComplete={handleFrontUpload}
        />
        {productImagePublicId ? (
          <p className="mt-2 text-xs text-gray-500">Cloudinary ID: {productImagePublicId}</p>
        ) : null}
      </div>

      <div>
        <ImageUpload
          folder="admin/products"
          label="Back Image (optional)"
          aspectRatio="landscape"
          currentImageUrl={values.backImage || undefined}
          onUploadComplete={handleBackUpload}
        />
        <p className="mt-2 text-xs text-gray-500">
          Shown when a customer flips the card on the storefront. Leave empty and
          the card simply does not flip.
        </p>
        {values.backImage ? (
          <button
            type="button"
            onClick={() => {
              setValues((prev) => ({ ...prev, backImage: '' }));
              setBackImagePublicId(null);
            }}
            disabled={submitting}
            className="mt-2 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5 disabled:opacity-50"
          >
            Remove back image
          </button>
        ) : null}
        {backImagePublicId ? (
          <p className="mt-2 text-xs text-gray-500">Cloudinary ID: {backImagePublicId}</p>
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
