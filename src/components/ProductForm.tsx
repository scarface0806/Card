'use client';

import React, { useCallback, useState } from 'react';
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

/**
 * Money inputs keep the RAW STRING the admin typed and are parsed only on
 * submit. They used to be numbers updated with Number(e.target.value):
 * Number("") is 0, so clearing snapped back to 0, and React does not rewrite a
 * type="number" input whose parsed value is unchanged, so a leading "0" stayed
 * on screen and typing appended to it ("05555555").
 */

/** Digits and at most one ".", max 2 decimals, no leading zeros ("0555" -> "555", "0.5" kept). */
function sanitizePrice(raw: string): string {
  let s = raw.replace(/[^0-9.]/g, '');
  const dot = s.indexOf('.');
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  if (s.startsWith('.')) s = `0${s}`;
  return s.replace(/^0+(?=\d)/, '');
}

/** Whole rupees: digits only, no leading zeros. */
function sanitizeWholeRupees(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

/** The typed string as a number, or null when empty / not a number. */
function parseMoney(input: string): number | null {
  if (!input.trim()) return null;
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** The editable strings for an incoming product (empty for a new one). */
function moneyInputsFor(initial?: ProductFormValues) {
  return {
    price: initial ? String(initial.price) : '',
    designFee: initial && initial.designFee > 0 ? String(initial.designFee) : '',
  };
}

export default function ProductForm({ initialValues, onSubmit, submitLabel, submitting = false, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(initialValues || DEFAULT_VALUES);
  const [priceInput, setPriceInput] = useState(() => moneyInputsFor(initialValues).price);
  const [designFeeInput, setDesignFeeInput] = useState(() => moneyInputsFor(initialValues).designFee);
  const [localError, setLocalError] = useState<string | null>(null);
  const [productImagePublicId, setProductImagePublicId] = useState<string | null>(null);
  const [backImagePublicId, setBackImagePublicId] = useState<string | null>(null);

  /**
   * Reset when a DIFFERENT product comes in. The admin page builds
   * initialValues inline, so it is a new object on every parent render; an
   * effect keyed on its identity reset the form (and would wipe a half-typed
   * price) whenever the page re-rendered, e.g. when `saving` flipped. Keyed on
   * content instead, and adjusted during render rather than in an effect, so
   * there is no extra paint with the old values.
   */
  const initialKey = JSON.stringify(initialValues ?? null);
  const [syncedKey, setSyncedKey] = useState(initialKey);
  if (syncedKey !== initialKey) {
    setSyncedKey(initialKey);
    setValues(initialValues || DEFAULT_VALUES);
    const inputs = moneyInputsFor(initialValues);
    setPriceInput(inputs.price);
    setDesignFeeInput(inputs.designFee);
    setLocalError(null);
  }

  const parsedPrice = parseMoney(priceInput);
  const parsedDesignFee = parseMoney(designFeeInput);

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

  // The uploader's own Remove clears the saved field too (it used to clear
  // only its preview; the back image needed a second, separate button).
  const handleFrontRemove = useCallback(() => {
    setValues((prev) => ({ ...prev, image: '' }));
    setProductImagePublicId(null);
  }, []);

  const handleBackRemove = useCallback(() => {
    setValues((prev) => ({ ...prev, backImage: '' }));
    setBackImagePublicId(null);
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

    // Parsed here, and only here: the inputs hold the raw text.
    const price = parsedPrice;
    if (price === null) {
      setLocalError('Price is required');
      return;
    }
    if (price < 0) {
      setLocalError('Price must be a valid positive number');
      return;
    }

    if (!values.image.trim()) {
      setLocalError('Product image is required');
      return;
    }

    // Mirrors parseCustomDesignInput on the server, which is the real check.
    const designFee = parsedDesignFee;
    if (values.isCustomDesign && (designFee === null || designFee <= 0)) {
      setLocalError('Design fee must be greater than 0 for a customised design');
      return;
    }

    // Deliberately no validation on backImage: it is optional, and an empty
    // string is a legitimate value meaning "this card has no back".
    setLocalError(null);
    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
      price,
      image: values.image,
      backImage: values.backImage.trim(),
      orientation: values.orientation,
      isCustomDesign: values.isCustomDesign,
      designFee: values.isCustomDesign && designFee !== null ? designFee : 0,
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
        {/* type="text", not "number": no spinner, no mouse-wheel price
            changes, and the raw text is what the admin typed. */}
        <div className="relative">
          <span className="tv-adm-meta pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" aria-hidden="true">
            ₹
          </span>
          <input
            id="product-price"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*([.][0-9]{0,2})?"
            autoComplete="off"
            value={priceInput}
            onChange={(e) => setPriceInput(sanitizePrice(e.target.value))}
            className="tv-adm-input min-h-[44px] pl-8"
            placeholder="599"
            aria-describedby="product-price-formatted"
            disabled={submitting}
          />
        </div>
        {/* The amount as customers will read it, so an extra digit shows. */}
        <p id="product-price-formatted" className="tv-mono mt-1.5 min-h-[1rem] text-xs normal-case" aria-live="polite">
          {parsedPrice !== null ? formatINR(parsedPrice) : ''}
        </p>
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
            <div className="relative">
              <span className="tv-adm-meta pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" aria-hidden="true">
                ₹
              </span>
              <input
                id="product-design-fee"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={designFeeInput}
                onChange={(e) => setDesignFeeInput(sanitizeWholeRupees(e.target.value))}
                className="tv-adm-input min-h-[44px] pl-8"
                placeholder="100"
                aria-describedby="product-design-fee-formatted"
                disabled={submitting}
              />
            </div>
            <p id="product-design-fee-formatted" className="tv-mono mt-1.5 min-h-[1rem] text-xs normal-case" aria-live="polite">
              {parsedDesignFee !== null ? formatINR(parsedDesignFee) : ''}
            </p>
            {parsedPrice !== null && parsedDesignFee !== null ? (
              <p className="mt-2 text-xs text-[var(--tv-text-muted)]">
                Customer pays price + design charge = {formatINR(parsedPrice + parsedDesignFee)}.
              </p>
            ) : null}
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

      {/* Front and back side by side on md+, stacked on mobile. */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <ImageUpload
            folder="admin/products"
            label="Product Image"
            aspectRatio={values.orientation === 'vertical' ? 'portrait' : 'landscape'}
            currentImageUrl={values.image || undefined}
            alt={values.name ? `${values.name} — front` : undefined}
            onUploadComplete={handleFrontUpload}
            onRemove={handleFrontRemove}
          />
          {productImagePublicId ? (
            <p className="tv-mono mt-2 truncate text-xs normal-case" title={productImagePublicId}>
              Cloudinary ID: {productImagePublicId}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <ImageUpload
            folder="admin/products"
            label="Back Image (optional)"
            aspectRatio={values.orientation === 'vertical' ? 'portrait' : 'landscape'}
            currentImageUrl={values.backImage || undefined}
            alt={values.name ? `${values.name} — back` : undefined}
            onUploadComplete={handleBackUpload}
            onRemove={handleBackRemove}
          />
          <p className="mt-2 text-xs text-[var(--tv-text-muted)]">
            Shown when a customer flips the card on the storefront. Leave empty and
            the card simply does not flip.
          </p>
          {backImagePublicId ? (
            <p className="tv-mono mt-2 truncate text-xs normal-case" title={backImagePublicId}>
              Cloudinary ID: {backImagePublicId}
            </p>
          ) : null}
        </div>
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
