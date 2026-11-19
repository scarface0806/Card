'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import {
  CARD_ORIENTATIONS,
  DEFAULT_ORIENTATION,
  type CardOrientation,
} from '@/lib/products/orientation';

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
  /**
   * Card shape. Drives the aspect ratio the artwork is shown in across the
   * catalogue, and whether the card is grouped with the horizontal set or the
   * vertical one below it.
   */
  orientation: CardOrientation;
  /**
   * "Customised Card": the customer uploads their own front and back artwork
   * at checkout and pays `designFee` on top of `price`. The total is computed
   * server-side from these two fields - nothing in the storefront hardcodes it.
   */
  isCustomDesign: boolean;
  /** Rupees. Only saved while isCustomDesign is ticked. */
  designFee: number;
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
  orientation: DEFAULT_ORIENTATION,
  isCustomDesign: false,
  designFee: 0,
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

    // Mirrors parseCustomDesignInput on the server, which is the real check.
    if (values.isCustomDesign && (!Number.isFinite(values.designFee) || values.designFee <= 0)) {
      setLocalError('Design fee must be greater than 0 for a customised design');
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
      orientation: values.orientation,
      isCustomDesign: values.isCustomDesign,
      designFee: values.isCustomDesign ? Number(values.designFee) : 0,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* tv-adm-field-label + tv-adm-input, not hand-rolled Tailwind.
          These fields were styled from a different palette entirely: a
          #151a2d blue-navy fill and an orange-400 focus border, sitting inside
          a green-and-brass admin panel. They now use the same field treatment
          as every other admin form, which also gets the correct focus ring and
          placeholder colour for free. */}
      <div>
        <label htmlFor="product-name" className="tv-adm-field-label mb-1.5 block">Name</label>
        <input
          id="product-name"
          type="text"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="tv-adm-input"
          placeholder="TapVyo Metal NFC"
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="product-description" className="tv-adm-field-label mb-1.5 block">Description</label>
        <textarea
          id="product-description"
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="tv-adm-textarea"
          placeholder="Premium digital card for professionals"
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="product-price" className="tv-adm-field-label mb-1.5 block">Price</label>
        <input
          id="product-price"
          type="number"
          value={values.price}
          onChange={(e) => handleChange('price', Number(e.target.value))}
          className="tv-adm-input"
          min={0}
          step="0.01"
          disabled={submitting}
        />
      </div>

      {/* CUSTOMISED DESIGN. Ticking this sends the product to its own
          "Customised card" section on /cards, asks the customer for front and
          back artwork at checkout, and adds the design fee to the total.
          Unrelated to the enquiry-only "custom" card type. */}
      <div>
        <label className="flex min-h-[44px] items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.isCustomDesign}
            onChange={(e) => setValues((prev) => ({ ...prev, isCustomDesign: e.target.checked }))}
            disabled={submitting}
            className="h-4 w-4 accent-[#C9A961]"
          />
          <span className="tv-adm-field-label">Customised design (customer uploads front &amp; back artwork)</span>
        </label>

        {values.isCustomDesign && (
          <div className="mt-2">
            <label htmlFor="product-design-fee" className="tv-adm-field-label mb-1.5 block">
              Design charge (₹, added to the price)
            </label>
            <input
              id="product-design-fee"
              type="number"
              value={values.designFee}
              onChange={(e) => setValues((prev) => ({ ...prev, designFee: Number(e.target.value) }))}
              className="tv-adm-input"
              min={1}
              step="1"
              disabled={submitting}
            />
            <p className="mt-2 text-xs text-[var(--tv-text-muted)]">
              Customer pays price + design charge
              {Number.isFinite(values.price) && values.designFee > 0
                ? ` = ₹${Number(values.price) + Number(values.designFee)}`
                : ''}
              .
            </p>
          </div>
        )}
      </div>

      {/* CARD SHAPE. Chosen before the uploads on purpose: it switches the two
          upload previews below to the matching aspect ratio, so the crop you
          see while uploading is the crop the storefront will show. */}
      <div>
        <span className="tv-adm-field-label mb-2 block">Card shape</span>
        <div className="flex flex-wrap gap-2">
          {CARD_ORIENTATIONS.map((option) => {
            const active = values.orientation === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setValues((prev) => ({ ...prev, orientation: option }))}
                aria-pressed={active}
                disabled={submitting}
                className={`tv-btn ${active ? 'tv-btn-primary' : 'tv-btn-secondary'} disabled:opacity-50`}
              >
                {/* A small proxy of the real shape, so the choice is visible
                    rather than only a word. */}
                <span
                  aria-hidden="true"
                  className="inline-block rounded-[2px] border-2 border-current"
                  style={
                    option === 'vertical'
                      ? { width: 11, height: 17 }
                      : { width: 17, height: 11 }
                  }
                />
                {option === 'vertical' ? 'Vertical' : 'Horizontal'}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[var(--tv-text-muted)]">
          Horizontal is the standard landscape card. Vertical is the same card
          stood on its end — it appears in its own group below the horizontal
          cards on the storefront.
        </p>
      </div>

      <div>
        <ImageUpload
          folder="admin/products"
          label="Product Image"
          aspectRatio={values.orientation === 'vertical' ? 'portrait' : 'landscape'}
          currentImageUrl={values.image || undefined}
          onUploadComplete={handleFrontUpload}
        />
        {productImagePublicId ? (
          <p className="mt-2 text-xs text-[var(--tv-text-muted)]">Cloudinary ID: {productImagePublicId}</p>
        ) : null}
      </div>

      <div>
        <ImageUpload
          folder="admin/products"
          label="Back Image (optional)"
          aspectRatio={values.orientation === 'vertical' ? 'portrait' : 'landscape'}
          currentImageUrl={values.backImage || undefined}
          onUploadComplete={handleBackUpload}
        />
        <p className="mt-2 text-xs text-[var(--tv-text-muted)]">
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
            className="tv-btn tv-btn-secondary mt-2 !min-h-[36px] !px-3 !text-xs disabled:opacity-50"
          >
            Remove back image
          </button>
        ) : null}
        {backImagePublicId ? (
          <p className="mt-2 text-xs text-[var(--tv-text-muted)]">Cloudinary ID: {backImagePublicId}</p>
        ) : null}
      </div>

      {localError ? (
        <p role="alert" className="text-sm text-[var(--tv-danger)]">{localError}</p>
      ) : null}

      {/* The submit button was bg-orange-500 - a colour that appears nowhere
          else in this admin - and Cancel was a hand-rolled outline. Both now
          use the shared button tiers, so the primary action reads as primary
          against the rest of the panel. */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="tv-btn tv-btn-primary disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="tv-btn tv-btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
