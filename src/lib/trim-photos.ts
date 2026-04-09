/**
 * Client-side storage for hoof-trim photos.
 *
 * Demo implementation — photos are stored as compressed JPEG data URLs in
 * localStorage, keyed by CareVisit.id. This is intended for client demos
 * only. When the app gets a real backend, swap this out for an upload
 * handler that posts to object storage and returns a URL.
 *
 * Storage shape:
 *   localStorage["dd:trim-photos:v1"] = JSON.stringify({
 *     [careVisitId]: TrimPhoto[]
 *   })
 */

const STORAGE_KEY = "dd:trim-photos:v1";

export interface TrimPhoto {
  id: string;
  visitId: string;
  dataUrl: string; // compressed JPEG data URL
  uploadedAt: string; // ISO datetime
  caption?: string;
}

type Store = Record<string, TrimPhoto[]>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    // Quota exceeded — surface to caller via thrown error
    throw new Error(
      "Photo storage is full. Delete older photos before adding new ones."
    );
  }
}

export function getPhotosForVisit(visitId: string): TrimPhoto[] {
  const store = readStore();
  return store[visitId] ?? [];
}

export function getAllPhotosForAnimal(visitIds: string[]): TrimPhoto[] {
  const store = readStore();
  const out: TrimPhoto[] = [];
  for (const id of visitIds) {
    if (store[id]) out.push(...store[id]);
  }
  return out.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function addPhoto(visitId: string, dataUrl: string, caption?: string): TrimPhoto {
  const store = readStore();
  const photo: TrimPhoto = {
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    visitId,
    dataUrl,
    uploadedAt: new Date().toISOString(),
    caption,
  };
  if (!store[visitId]) store[visitId] = [];
  store[visitId].push(photo);
  writeStore(store);
  return photo;
}

export function deletePhoto(visitId: string, photoId: string): void {
  const store = readStore();
  if (!store[visitId]) return;
  store[visitId] = store[visitId].filter((p) => p.id !== photoId);
  if (store[visitId].length === 0) delete store[visitId];
  writeStore(store);
}

/**
 * Compress a File (from <input type="file"> or camera capture) to a JPEG
 * data URL. Resizes the longest edge to maxDimension and uses the given
 * JPEG quality.
 *
 * Returns a data URL like "data:image/jpeg;base64,..."
 */
export async function compressImage(
  file: File,
  maxDimension = 1280,
  quality = 0.75
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const targetW = Math.round(bitmap.width * ratio);
  const targetH = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();

  return canvas.toDataURL("image/jpeg", quality);
}
