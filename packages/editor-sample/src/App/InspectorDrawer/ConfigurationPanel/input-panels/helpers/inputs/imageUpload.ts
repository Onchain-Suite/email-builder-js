/**
 * Image upload — Onchain Suite asset library.
 *
 * Uploads go to `POST {API_BASE}/assets` (multipart: `file`, `kind=image`,
 * `label`), which stores the file in Azure Blob (public container) and
 * returns the hosted asset row `{ url, ... }`. Hosted https URLs give the
 * best email deliverability and pass the email HTML sanitizer.
 *
 * Configuration (all optional, via Vite env — see src/App/api/config.ts):
 * - VITE_API_BASE_URL      — API base, defaults to the production backend.
 * - VITE_IMAGE_UPLOAD_URL  — full override of the upload endpoint URL.
 * - VITE_API_AUTH_TOKEN    — sent as `Authorization: Bearer <token>` for
 *                            non-cookie (embedded/server) contexts. By
 *                            default the browser session cookie is used
 *                            (`credentials: "include"`).
 */
import { API_BASE_URL, authHeaders, findErrorMessage } from '../../../../../api/config';

export const IMAGE_UPLOAD_ENDPOINT: string = import.meta.env.VITE_IMAGE_UPLOAD_URL ?? `${API_BASE_URL}/assets`;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']);

function findUrl(obj: unknown): string | null {
  if (typeof obj !== 'object' || obj === null) {
    return null;
  }
  const record = obj as Record<string, unknown>;
  for (const key of ['url', 'secure_url', 'location', 'imageUrl']) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  for (const key of ['data', 'asset', 'result', 'file']) {
    const nested = findUrl(record[key]);
    if (nested) {
      return nested;
    }
  }
  return null;
}

/**
 * Uploads an image to the asset library and returns its hosted https URL.
 * Throws an Error with a user-readable message on failure.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Unsupported file type. Use PNG, JPEG, GIF, WebP, or SVG.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image is too large (max 5MB).');
  }

  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('kind', 'image');
  formData.append('label', file.name);

  let response: Response;
  try {
    response = await fetch(IMAGE_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: authHeaders(),
    });
  } catch {
    throw new Error('Upload failed: could not reach the server. Check your connection and try again.');
  }

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Upload not authorized. Please sign in to your Onchain Suite account and try again.');
    }
    if (response.status === 413) {
      throw new Error('Image is too large for the server.');
    }
    throw new Error(findErrorMessage(json) ?? `Upload failed (${response.status}). Please try again.`);
  }

  const url = findUrl(json);
  if (!url) {
    throw new Error('Upload succeeded but the server response did not include a URL.');
  }
  return url;
}
