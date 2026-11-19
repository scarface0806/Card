/**
 * Browser-side upload for checkout images: the profile photo (every product)
 * and Customised Card artwork. Both go to POST /api/uploads/custom-card, which
 * stores them in the customer's own Cloudinary folder for that purpose and
 * returns where. Only that result is kept in the form - never the File - so
 * the order body stays small and POST /api/orders can verify ownership.
 *
 * XMLHttpRequest rather than fetch: fetch has no upload progress events.
 */

export type CheckoutUploadPurpose = 'artwork' | 'profile';

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export const CHECKOUT_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const CHECKOUT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Quick client-side check so a wrong file is reported instantly. The route
 * repeats it (and checks the file's bytes); it is the one that counts.
 */
export function precheckUpload(file: File): string | null {
  if (!CHECKOUT_UPLOAD_TYPES.includes(file.type)) return 'Please choose a JPEG, PNG or WEBP image.';
  if (file.size > CHECKOUT_UPLOAD_MAX_BYTES) return 'That file is over 10MB. Please choose a smaller one.';
  return null;
}

export function uploadCheckoutImage(
  file: File,
  purpose: CheckoutUploadPurpose,
  onProgress: (percent: number) => void
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads/custom-card');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let body: { error?: string } & Partial<UploadedImage> = {};
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
    form.append('purpose', purpose);
    xhr.send(form);
  });
}
