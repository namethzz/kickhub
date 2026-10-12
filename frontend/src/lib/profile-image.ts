import { api, type PublicPlayer } from './api';
import { coverRect } from './image-fit';

export type ImageKind = 'avatar' | 'cover';
export type SocialProvider = 'google' | 'facebook';

// Output sizes and byte caps mirror Backend/services/profileImageService.js (avatar 1 MB, cover 2 MB).
export const IMAGE_SPEC: Record<ImageKind, { width: number; height: number; maxBytes: number }> = {
  avatar: { width: 512, height: 512, maxBytes: 1024 * 1024 },
  cover: { width: 1200, height: 400, maxBytes: 2 * 1024 * 1024 },
};
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// The original may be large (phone photos); only the resized copy is uploaded.
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export const assetUrl = (path?: string) => (path ? `${import.meta.env.VITE_API_URL || ''}${path}` : '');

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
      await image.decode();
      return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) };
    } catch {
      URL.revokeObjectURL(url);
      throw new Error('เปิดไฟล์รูปนี้ไม่ได้ กรุณาเลือกไฟล์ JPG, PNG หรือ WebP อื่น');
    }
  }
}

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));

/** Center-crops and shrinks the chosen photo to a JPEG small enough for the API. */
export async function prepareImage(file: File, kind: ImageKind): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error('รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('ไฟล์รูปใหญ่เกินไป กรุณาเลือกรูปที่เล็กกว่า 20 MB');
  const spec = IMAGE_SPEC[kind];
  const decoded = await decode(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('เบราว์เซอร์นี้ย่อรูปไม่ได้ กรุณาลองเบราว์เซอร์อื่น');
    // JPEG has no transparency; paint white first so transparent PNGs do not turn black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, spec.width, spec.height);
    context.imageSmoothingQuality = 'high';
    const rect = coverRect(decoded.width, decoded.height, spec.width, spec.height);
    context.drawImage(decoded.source, rect.x, rect.y, rect.width, rect.height);
    for (const quality of [0.88, 0.8, 0.7, 0.6, 0.5]) {
      const blob = await toBlob(canvas, quality);
      if (blob && blob.size <= spec.maxBytes) return blob;
    }
    throw new Error('ย่อรูปให้เล็กพอไม่ได้ กรุณาเลือกรูปอื่น');
  } finally {
    decoded.release();
  }
}

export const uploadImage = (kind: ImageKind, blob: Blob) =>
  api<PublicPlayer>(`/api/v2/me/${kind}`, { method: 'PUT', headers: { 'Content-Type': blob.type }, body: blob });
export const removeImage = (kind: ImageKind) => api<PublicPlayer>(`/api/v2/me/${kind}`, { method: 'DELETE' });
export const importSocialPhoto =(provider: SocialProvider) =>
  api<PublicPlayer>('/api/v2/me/avatar/social', { method: 'POST', body: JSON.stringify({ provider }) });
