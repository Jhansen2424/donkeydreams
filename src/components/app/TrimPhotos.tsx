"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Camera, Trash2, X, Loader2, ImagePlus } from "lucide-react";
import {
  addPhoto,
  compressImage,
  deletePhoto,
  getPhotosForVisit,
  type TrimPhoto,
} from "@/lib/trim-photos";

interface TrimPhotosProps {
  visitId: string;
}

export default function TrimPhotos({ visitId }: TrimPhotosProps) {
  const [photos, setPhotos] = useState<TrimPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    setPhotos(getPhotosForVisit(visitId));
  }, [visitId]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setError(null);
      try {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) continue;
          const dataUrl = await compressImage(file);
          addPhoto(visitId, dataUrl);
        }
        setPhotos(getPhotosForVisit(visitId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [visitId]
  );

  const handleDelete = (photoId: string) => {
    deletePhoto(visitId, photoId);
    setPhotos(getPhotosForVisit(visitId));
    setLightboxIdx(null);
  };

  return (
    <div className="mt-2">
      {/* Thumbnail strip */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setLightboxIdx(idx)}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-card-border hover:border-sand transition-colors group"
              aria-label="View photo"
            >
              <img
                src={photo.dataUrl}
                alt="Hoof trim"
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Upload button + hidden file input */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          // capture="environment" — opens rear camera on phones, falls back
          // to file picker on desktop
          capture="environment"
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
          ) : photos.length === 0 ? (
            <>
              <Camera className="w-3 h-3" />
              Add photos
            </>
          ) : (
            <>
              <ImagePlus className="w-3 h-3" />
              Add more
            </>
          )}
        </button>
        {photos.length > 0 && (
          <span className="text-[10px] text-warm-gray/60">
            {photos.length} photo{photos.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-600 mt-1.5">{error}</p>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && photos[lightboxIdx] && (
        <Lightbox
          photo={photos[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onDelete={() => handleDelete(photos[lightboxIdx].id)}
          onPrev={
            lightboxIdx > 0
              ? () => setLightboxIdx(lightboxIdx - 1)
              : undefined
          }
          onNext={
            lightboxIdx < photos.length - 1
              ? () => setLightboxIdx(lightboxIdx + 1)
              : undefined
          }
          index={lightboxIdx + 1}
          total={photos.length}
        />
      )}
    </div>
  );
}

interface LightboxProps {
  photo: TrimPhoto;
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
        <img
          src={photo.dataUrl}
          alt="Hoof trim"
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />

        {/* Header */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
            {index} / {total}
          </span>
          <div className="flex items-center gap-2">
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
            {new Date(photo.uploadedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
