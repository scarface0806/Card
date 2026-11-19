'use client';

import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertTriangle, CheckCircle2, RefreshCw, Upload } from 'lucide-react';
import type { CardOrientation } from '@/lib/products/orientation';
import {
  ARTWORK_FILE_NOTE,
  isBelowRecommended,
  recommendedArtworkSize,
} from '@/lib/products/custom-artwork-spec';
import type {
  CreateCardFormValues,
  UploadedArtwork,
} from '@/lib/validations/createCardFormSchema';

/**
 * Step 4 for a Customised Card: the customer's own front and back artwork.
 *
 * Each file is uploaded the moment it is picked, to POST
 * /api/uploads/custom-card, and only the returned { url, publicId, width,
 * height } is kept in the form. The order body therefore never carries an
 * image, and POST /api/orders can verify the URLs belong to this customer.
 *
 * The client-side type and size checks below are a courtesy so the customer
 * hears about a wrong file instantly; the route repeats both (and checks the
 * file's bytes), and it is the one that counts.
 *
 * Both slots are required - CreateCardClient refuses to leave step 4 until
 * both are filled and sets the field errors this component shows.
 */

type Side = 'front' | 'back';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

type SlotState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'error'; message: string };

function uploadArtwork(
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadedArtwork> {
  // XMLHttpRequest rather than fetch: fetch has no upload progress events.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads/custom-card');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let body: { error?: string } & Partial<UploadedArtwork> = {};
      try {
        body = JSON.parse(xhr.responseText || '{}');
      } catch {
        // fall through to the generic message
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.url && body.publicId) {
        resolve({
          url: body.url,
          publicId: body.publicId,
          width: Number(body.width) || 0,
          height: Number(body.height) || 0,
        });
      } else if (xhr.status === 401) {
        reject(new Error('Your session has expired. Please sign in again to upload.'));
      } else {
        reject(new Error(body.error || 'Upload failed. Please try again.'));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));

    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

export default function CustomArtworkForm({ orientation }: { orientation: CardOrientation }) {
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<CreateCardFormValues>();

  const artwork = watch('customArtwork');
  const [slots, setSlots] = useState<Record<Side, SlotState>>({
    front: { status: 'idle' },
    back: { status: 'idle' },
  });
  const inputs = { front: useRef<HTMLInputElement>(null), back: useRef<HTMLInputElement>(null) };

  const size = recommendedArtworkSize(orientation);

  const setSlot = (side: Side, state: SlotState) =>
    setSlots((prev) => ({ ...prev, [side]: state }));

  const handleFile = async (side: Side, file: File | undefined) => {
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setSlot(side, { status: 'error', message: 'Please choose a JPEG, PNG or WEBP image.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      setSlot(side, { status: 'error', message: 'That file is over 10MB. Please choose a smaller one.' });
      return;
    }

    setSlot(side, { status: 'uploading', progress: 0 });
    try {
      const uploaded = await uploadArtwork(file, (progress) =>
        setSlot(side, { status: 'uploading', progress })
      );
      setValue(`customArtwork.${side}`, uploaded, { shouldDirty: true });
      clearErrors(`customArtwork.${side}`);
      setSlot(side, { status: 'idle' });
    } catch (error) {
      setSlot(side, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.',
      });
    } finally {
      // Let the same file be picked again after an error.
      const input = inputs[side].current;
      if (input) input.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="tv-h3">Your card artwork</h2>
        <p className="tv-small mt-2 tv-measure-body">
          Upload the front and the back of your card. We print exactly what you
          upload, so check spelling and contact details before you continue.
        </p>
        <ul className="tv-small mt-3 list-disc pl-5 space-y-1">
          <li>{size.label}</li>
          <li>{ARTWORK_FILE_NOTE}</li>
        </ul>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {(['front', 'back'] as const).map((side) => {
          const current = artwork?.[side] ?? null;
          const slot = slots[side];
          const fieldError = errors.customArtwork?.[side]?.message;
          const label = side === 'front' ? 'Card front' : 'Card back';
          const inputId = `custom-artwork-${side}`;
          const statusId = `${inputId}-status`;
          const lowRes = current ? isBelowRecommended(orientation, current) : false;

          return (
            <div key={side}>
              <span className="tv-label">{label}</span>

              <input
                ref={inputs[side]}
                id={inputId}
                type="file"
                accept={ACCEPTED.join(',')}
                className="sr-only tv-dropzone-input"
                aria-describedby={statusId}
                aria-invalid={fieldError || slot.status === 'error' ? true : undefined}
                disabled={slot.status === 'uploading'}
                onChange={(event) => void handleFile(side, event.target.files?.[0])}
              />
              <label htmlFor={inputId} className="tv-dropzone min-h-[44px]">
                {current ? (
                  <span className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={current.url}
                      alt={`${label} artwork you uploaded`}
                      className="mx-auto max-h-48 max-w-full rounded-lg"
                    />
                    <span className="tv-mono mt-4 inline-flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                      Replace {side}
                    </span>
                  </span>
                ) : (
                  <span className="block">
                    <Upload className="w-6 h-6 mx-auto mb-3 text-[#C9A961]" aria-hidden="true" />
                    <span className="block text-[#F1F3F1] font-semibold text-sm">
                      Upload {side}
                    </span>
                    <span className="tv-mono mt-2 block">JPEG, PNG or WEBP</span>
                  </span>
                )}
              </label>

              {/* One live region per slot, so progress and errors are
                  announced without moving focus. */}
              <div id={statusId} aria-live="polite" className="mt-2">
                {slot.status === 'uploading' && (
                  <div>
                    <progress
                      value={slot.progress}
                      max={100}
                      aria-label={`${label} upload progress`}
                      className="w-full h-1.5 accent-[#C9A961]"
                    />
                    <p className="tv-small mt-1">Uploading… {slot.progress}%</p>
                  </div>
                )}
                {slot.status === 'error' && (
                  <p role="alert" className="tv-form-error flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    {slot.message}
                  </p>
                )}
                {slot.status !== 'error' && fieldError && (
                  <p role="alert" className="tv-form-error">{fieldError}</p>
                )}
                {slot.status === 'idle' && current && (
                  <p className="tv-small flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#4CAE89] shrink-0" aria-hidden="true" />
                    Uploaded ({current.width} × {current.height} px)
                  </p>
                )}
                {slot.status === 'idle' && lowRes && (
                  // A warning, not a block: the customer may knowingly accept a
                  // softer print, and refusing it would only lose the sale.
                  <p className="tv-small mt-1 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#C9A961]" aria-hidden="true" />
                    This image is smaller than {recommendedArtworkSize(orientation).width} ×{' '}
                    {recommendedArtworkSize(orientation).height} px, so it may print soft.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
