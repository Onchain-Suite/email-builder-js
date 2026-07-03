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
import { apiCredentials, authHeaders, diagnoseAuthFailure, findErrorMessage, getApiBaseUrl } from '../../../../../api/config';

export function getImageUploadEndpoint(): string {
  return import.meta.env.VITE_IMAGE_UPLOAD_URL ?? `${getApiBaseUrl()}/assets`;
}

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
    response = await fetch(getImageUploadEndpoint(), {
      method: 'POST',
      body: formData,
      credentials: apiCredentials(),
      headers: authHeaders({ orgScoped: true }), // assets are org-scoped
    });
  } catch {
    throw new Error(
      `Upload request never reached the server — usually the backend CORS policy blocking this editor origin (${window.location.origin}), or no network.`
    );
  }

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const serverMessage = findErrorMessage(json);
    if (response.status === 401 || response.status === 403) {
      const diagnosis = await diagnoseAuthFailure();
      throw new Error(`Upload → ${response.status}${serverMessage ? ` ("${serverMessage}")` : ''}. ${diagnosis}`);
    }
    if (response.status === 404) {
      throw new Error(
        'Upload → 404: the /assets endpoint does not exist on this backend deployment. The asset-library migration may not be deployed yet.'
      );
    }
    if (response.status === 413) {
      throw new Error('Image is too large for the server.');
    }
    throw new Error(serverMessage ?? `Upload failed (${response.status}). Please try again.`);
  }

  const url = findUrl(json);
  if (!url) {
    throw new Error('Upload succeeded but the server response did not include a URL.');
  }
  return url;
}
