'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertTriangle, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import {
  CHECKOUT_UPLOAD_TYPES,
  precheckUpload,
  uploadCheckoutImage,
} from '@/lib/checkout-upload-client';
import type { CreateCardFormValues } from '@/lib/validations/createCardFormSchema';

/**
 * Step 4: the profile photo shown at the top of the digital profile.
 *
 * WHY IT UPLOADS ON SELECT
 * This used to register the <input type="file"> straight into the form, so
 * the value was a FileList. The order is sent as JSON, and JSON.stringify
 * turns a File into {} - so for every order, on every product, the photo
 * never reached the server; the admin received an empty object. The file is
 * now uploaded the moment it is picked (POST /api/uploads/custom-card,
 * purpose "profile"), and only the returned { url, publicId, width, height }
 * is kept in the form. POST /api/orders verifies the URL is this customer's
 * own upload and stores it on the order.
 *
 * Optional, as before: no photo is a valid order.
 */
type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'error'; message: string };

export default function UploadForm({
  onBusyChange,
}: {
  /** Told while an upload is in flight, so checkout can hold "Continue". */
  onBusyChange?: (busy: boolean) => void;
}) {
  const { watch, setValue } = useFormContext<CreateCardFormValues>();
  const photo = watch('uploads.profileImage');
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = state.status === 'uploading';
  useEffect(() => {
    onBusyChange?.(busy);
    // Leaving the step mid-upload unmounts this form; clear the flag so
    // "Continue" is not left stuck. The upload itself still finishes and is
    // written into the form.
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    const problem = precheckUpload(file);
    if (problem) {
      setState({ status: 'error', message: problem });
      return;
    }

    setState({ status: 'uploading', progress: 0 });
    try {
      const uploaded = await uploadCheckoutImage(file, 'profile', (progress) =>
        setState({ status: 'uploading', progress })
      );
      setValue('uploads.profileImage', uploaded, { shouldDirty: true });
      setState({ status: 'idle' });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.',
      });
    } finally {
      // Let the same file be picked again after an error.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const inputId = 'profileImage';
  const statusId = 'profileImage-status';

  return (
    <div className="space-y-6">
      <header>
        <span className="tv-eyebrow">Step 04</span>
        <h2 className="tv-h3 mt-3">Your photo</h2>
        <p className="tv-small mt-2 tv-measure-body">
          Shown at the top of your digital profile. Pick the one you want us to
          publish — changing it later is a ₹49 update request on WhatsApp.
        </p>
      </header>

      <hr className="tv-rule" />

      <div>
        <span className="tv-label">Profile Picture</span>
        <p className="tv-small mb-3">Square image, at least 500 x 500px. JPEG, PNG or WEBP, up to 10MB.</p>

        <input
          ref={inputRef}
          type="file"
          accept={CHECKOUT_UPLOAD_TYPES.join(',')}
          id={inputId}
          className="sr-only tv-dropzone-input"
          aria-describedby={statusId}
          aria-invalid={state.status === 'error' ? true : undefined}
          disabled={busy}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <label htmlFor={inputId} className="tv-dropzone">
          {photo?.url ? (
            <span className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt="Profile picture preview"
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

        <div id={statusId} aria-live="polite" className="mt-2">
          {state.status === 'uploading' && (
            <div>
              <progress
                value={state.progress}
                max={100}
                aria-label="Profile picture upload progress"
                className="w-full h-1.5 accent-[#C9A961]"
              />
              <p className="tv-small mt-1">Uploading… {state.progress}%</p>
            </div>
          )}
          {state.status === 'error' && (
            <p role="alert" className="tv-form-error flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {state.message}
            </p>
          )}
        </div>

        {photo?.url && state.status !== 'uploading' && (
          <button
            type="button"
            onClick={() => setValue('uploads.profileImage', null, { shouldDirty: true })}
            className="tv-btn-tertiary mt-2"
          >
            Remove photo
          </button>
        )}
      </div>

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
