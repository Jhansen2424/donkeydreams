"use client";

// Attachments for a visit/entry (medical entries, hoof visits, and donkey
// Documents tabs all use this, keyed by `visitId`). Files live in the
// Document table (`linkedTo` = visitId) so they follow the RECORD, not the
// device — the old localStorage store meant photos only existed on the
// phone that took them. Any photos still stuck in this device's
// localStorage are migrated to the database on first open, then cleared.
//
// Images are compressed before upload; PDFs upload as-is (4 MB cap, same
// as the Documents drive). PDFs open in a new tab, where they can be
// printed for the binder.

import { useEffect, useState, useRef, useCallback } from "react";
import { Camera, Trash2, X, Loader2, ImagePlus, FileText, Printer } from "lucide-react";
import { compressImage, getPhotosForVisit, deletePhoto } from "@/lib/trim-photos";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

interface AttachmentMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface TrimPhotosProps {
  visitId: string;
  /** Wording for the empty-state button (default "Add photos"). */
  addLabel?: string;
}

// data URL → the raw base64 payload after the comma.
function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export default function TrimPhotos({ visitId, addLabel = "Add photos" }: TrimPhotosProps) {
  const [items, setItems] = useState<AttachmentMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?linkedTo=${encodeURIComponent(visitId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const body = (await res.json()) as { documents: AttachmentMeta[] };
      setItems(body.documents);
    } catch {
      // List stays as-is; upload/delete surface their own errors.
    }
  }, [visitId]);

  // Load from the DB, then migrate any photos this device still holds in
  // the old localStorage store (upload → remove locally → reload).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await reload();
      const legacy = getPhotosForVisit(visitId);
      if (legacy.length === 0 || cancelled) return;
      for (const photo of legacy) {
        try {
          const res = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `photo-${photo.uploadedAt.slice(0, 10)}.jpg`,
              mimeType: "image/jpeg",
              linkedTo: visitId,
              dataBase64: dataUrlToBase64(photo.dataUrl),
            }),
          });
          if (res.ok) deletePhoto(visitId, photo.id);
        } catch {
          // Leave the local copy in place; we'll retry next open.
        }
      }
      if (!cancelled) await reload();
    })();
    return () => {
      cancelled = true;
    };
  }, [visitId, reload]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setError(null);
      try {
        for (const file of Array.from(files)) {
          const isImage = file.type.startsWith("image/");
          const isPdf = file.type === "application/pdf";
          if (!isImage && !isPdf) {
            setError("Only photos and PDFs are supported.");
            continue;
          }
          let dataBase64: string;
          let mimeType: string;
          let name = file.name || "attachment";
          if (isImage) {
            const dataUrl = await compressImage(file);
            dataBase64 = dataUrlToBase64(dataUrl);
            mimeType = "image/jpeg";
            if (!/\.jpe?g$/i.test(name)) name = name.replace(/\.[^.]+$/, "") + ".jpg";
          } else {
            if (file.size > MAX_FILE_BYTES) {
              setError(`${file.name} is over the 4 MB limit for PDFs.`);
              continue;
            }
            dataBase64 = await fileToBase64(file);
            mimeType = "application/pdf";
          }
          const res = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, mimeType, linkedTo: visitId, dataBase64 }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body as { error?: string }).error || "Upload failed");
          }
        }
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [visitId, reload]
  );

  const handleDelete = async (id: string) => {
    setLightboxIdx(null);
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      await reload();
    }
  };

  const images = items.filter((i) => i.mimeType.startsWith("image/"));
  const pdfs = items.filter((i) => !i.mimeType.startsWith("image/"));

  return (
    <div className="mt-2">
      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setLightboxIdx(idx)}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-card-border hover:border-sand transition-colors group"
              aria-label="View photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/documents/${photo.id}`}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* PDF chips — open inline in a new tab (printable from there) */}
      {pdfs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pdfs.map((doc) => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg border border-card-border bg-cream/40 group"
            >
              <a
                href={`/api/documents/${doc.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-charcoal hover:text-sky-dark hover:underline"
                title="Open (then print or save from the viewer)"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
                {doc.name}
                <span className="text-warm-gray/60">{Math.max(1, Math.round(doc.size / 1024))} KB</span>
              </a>
              <a
                href={`/api/documents/${doc.id}`}
                target="_blank"
                rel="noreferrer"
                className="p-0.5 text-warm-gray/50 hover:text-charcoal"
                title="Open to print"
              >
                <Printer className="w-3 h-3" />
              </a>
              <button
                onClick={() => {
                  if (confirm(`Delete ${doc.name}?`)) void handleDelete(doc.id);
                }}
                className="p-0.5 text-warm-gray/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Upload button + hidden file input */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-warm-gray hover:text-charcoal hover:bg-cream rounded-md border border-card-border transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Uploading...
            </>
          ) : items.length === 0 ? (
            <>
              <Camera className="w-3 h-3" />
              {addLabel}
            </>
          ) : (
            <>
              <ImagePlus className="w-3 h-3" />
              Add more
            </>
          )}
        </button>
        {items.length > 0 && (
          <span className="text-[10px] text-warm-gray/60">
            {items.length} file{items.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-600 mt-1.5">{error}</p>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && images[lightboxIdx] && (
        <Lightbox
          photo={images[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onDelete={() => void handleDelete(images[lightboxIdx].id)}
          onPrev={
            lightboxIdx > 0
              ? () => setLightboxIdx(lightboxIdx - 1)
              : undefined
          }
          onNext={
            lightboxIdx < images.length - 1
              ? () => setLightboxIdx(lightboxIdx + 1)
              : undefined
          }
          index={lightboxIdx + 1}
          total={images.length}
        />
      )}
    </div>
  );
}

interface LightboxProps {
  photo: AttachmentMeta;
  onClose: () => void;
  onDelete: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  index: number;
  total: number;
}

function Lightbox({
  photo,
  onClose,
  onDelete,
  onPrev,
  onNext,
  index,
  total,
}: LightboxProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/documents/${photo.id}`}
          alt={photo.name}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />

        {/* Header */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
            {index} / {total}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={`/api/documents/${photo.id}`}
              target="_blank"
              rel="noreferrer"
              className="bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors"
              aria-label="Open full size (printable)"
              title="Open full size (printable)"
            >
              <Printer className="w-4 h-4" />
            </a>
            <button
              onClick={() => {
                if (confirm("Delete this photo?")) onDelete();
              }}
              className="bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors"
              aria-label="Delete photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prev / Next */}
        {onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2 rounded-full"
            aria-label="Previous photo"
          >
            ‹
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2 rounded-full"
            aria-label="Next photo"
          >
            ›
          </button>
        )}

        {/* Footer with date */}
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <p className="text-xs text-white/70">
            {new Date(photo.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
