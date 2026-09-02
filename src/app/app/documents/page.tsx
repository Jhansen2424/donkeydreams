"use client";

// Documents — a Drive-style file area. Folders, drag-and-drop uploads,
// drag-to-move, rename, download, delete. Files live in the DB (4 MB cap
// per file — plenty for PDFs, scans, and spreadsheets).

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Upload,
  File as FileIcon,
  FileText,
  FileImage,
  FileSpreadsheet,
  Download,
  Pencil,
  Trash2,
  ChevronRight,
  Home,
  Loader2,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { compressImage } from "@/lib/trim-photos";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
// Photos bigger than this get resized/recompressed in the browser before
// uploading (longest edge 1600px, JPEG q0.8 — plenty for viewing and
// printing). Keeps huge phone photos small AND under the per-file cap.
const COMPRESS_IMAGES_OVER_BYTES = 500 * 1024;

interface DocFolder {
  id: string;
  name: string;
  parentId: string | null;
}

interface Doc {
  id: string;
  name: string;
  folderId: string | null;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Crumb {
  id: string;
  name: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return FileSpreadsheet;
  return FileIcon;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function DocumentsPage() {
  const { toastSuccess, toastError } = useToast();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [path, setPath] = useState<Crumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Folder id highlighted while an item is dragged over it ("" = root crumb).
  const [dropFolder, setDropFolder] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(
    async (folderId: string | null) => {
      try {
        const res = await fetch(
          `/api/documents${folderId ? `?folder=${encodeURIComponent(folderId)}` : ""}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        const body = (await res.json()) as {
          folders: DocFolder[];
          documents: Doc[];
          path: Crumb[];
        };
        setFolders(body.folders);
        setDocuments(body.documents);
        setPath(body.path);
      } catch (e) {
        toastError(e instanceof Error ? e.message : "Failed to load documents");
      } finally {
        setLoading(false);
      }
    },
    [toastError]
  );

  useEffect(() => {
    void reload(currentFolder);
  }, [currentFolder, reload]);

  const openFolder = (id: string | null) => {
    setLoading(true);
    setCurrentFolder(id);
  };

  // ── Uploads ──
  // Big photos are shrunk client-side before they leave the browser: resized
  // to 1600px longest edge and recompressed as JPEG. If compression somehow
  // doesn't help (already-optimized image), the original wins. Non-images
  // (PDFs, spreadsheets…) upload as-is. Formats the browser can't decode
  // (e.g. HEIC on some machines) quietly fall back to the original file.
  const prepareUpload = async (
    file: File
  ): Promise<{ name: string; mimeType: string; dataBase64: string; bytes: number }> => {
    if (file.type.startsWith("image/") && file.size > COMPRESS_IMAGES_OVER_BYTES) {
      try {
        const dataUrl = await compressImage(file, 1600, 0.8);
        const dataBase64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        const bytes = Math.floor((dataBase64.length * 3) / 4);
        if (bytes < file.size) {
          return {
            name: file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg",
            mimeType: "image/jpeg",
            dataBase64,
            bytes,
          };
        }
      } catch {
        // Undecodable image — fall through to the original bytes.
      }
    }
    return {
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      dataBase64: await fileToBase64(file),
      bytes: file.size,
    };
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    let done = 0;
    for (const file of list) {
      setUploading(`${file.name} (${done + 1} of ${list.length})`);
      try {
        const prepared = await prepareUpload(file);
        if (prepared.bytes > MAX_FILE_BYTES) {
          toastError(`${file.name} is over the ${formatBytes(MAX_FILE_BYTES)} limit — skipped.`);
          continue;
        }
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: prepared.name,
            folderId: currentFolder,
            mimeType: prepared.mimeType,
            dataBase64: prepared.dataBase64,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
        done++;
      } catch (e) {
        toastError(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    setUploading(null);
    if (done > 0) {
      toastSuccess(done === 1 ? "File uploaded." : `${done} files uploaded.`);
    }
    await reload(currentFolder);
  };

  // ── Folder + item actions ──
  const createFolder = async () => {
    const name = window.prompt("Folder name:");
    if (!name || !name.trim()) return;
    const res = await fetch("/api/documents/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), parentId: currentFolder }),
    });
    if (res.ok) await reload(currentFolder);
    else toastError("Could not create the folder.");
  };

  const renameItem = async (kind: "folder" | "document", id: string, current: string) => {
    const name = window.prompt("Rename to:", current);
    if (!name || !name.trim() || name.trim() === current) return;
    const url = kind === "folder" ? "/api/documents/folders" : "/api/documents";
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: name.trim() }),
    });
    if (res.ok) await reload(currentFolder);
    else toastError("Rename failed.");
  };

  const deleteItem = async (kind: "folder" | "document", id: string, name: string) => {
    const msg =
      kind === "folder"
        ? `Delete the folder "${name}" and everything inside it?`
        : `Delete "${name}"?`;
    if (!window.confirm(msg)) return;
    const url =
      kind === "folder"
        ? `/api/documents/folders?id=${encodeURIComponent(id)}`
        : `/api/documents?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) await reload(currentFolder);
    else toastError("Delete failed.");
  };

  const moveItem = async (
    kind: "folder" | "document",
    id: string,
    targetFolderId: string | null
  ) => {
    const url = kind === "folder" ? "/api/documents/folders" : "/api/documents";
    const payload =
      kind === "folder" ? { id, parentId: targetFolderId } : { id, folderId: targetFolderId };
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) await reload(currentFolder);
    else toastError((await res.json().catch(() => ({})))?.error ?? "Move failed.");
  };

  // ── Drag handling ──
  // Two drag flavors share the handlers: OS files dragged in (upload) and
  // in-app cards dragged onto folders (move). In-app drags carry a custom
  // mime type so we can tell them apart.
  const onItemDragStart = (e: React.DragEvent, kind: "folder" | "document", id: string) => {
    e.dataTransfer.setData("application/x-dd-item", JSON.stringify({ kind, id }));
    e.dataTransfer.effectAllowed = "move";
  };

  const dropPayload = (e: React.DragEvent): { kind: "folder" | "document"; id: string } | null => {
    const raw = e.dataTransfer.getData("application/x-dd-item");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { kind: "folder" | "document"; id: string };
    } catch {
      return null;
    }
  };

  const onFolderDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDropFolder(null);
    setDragOver(false);
    const item = dropPayload(e);
    if (item) {
      if (item.kind === "folder" && item.id === targetFolderId) return;
      await moveItem(item.kind, item.id, targetFolderId);
      return;
    }
    if (e.dataTransfer.files.length > 0 && targetFolderId === currentFolder) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="space-y-5 min-h-[70vh]"
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes("Files")) setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={(e) => void onFolderDrop(e, currentFolder)}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Documents</h1>
          <p className="text-sm text-warm-gray mt-0.5">
            Drag files anywhere on this page to upload · {formatBytes(MAX_FILE_BYTES)} max per
            file · big photos are compressed automatically
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={createFolder}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            New folder
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!!uploading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading…" : "Upload files"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Breadcrumb — crumbs are drop targets so dragging a card onto one
          moves it up the tree. */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button
          onClick={() => openFolder(null)}
          onDragOver={(e) => {
            e.preventDefault();
            setDropFolder("");
          }}
          onDragLeave={() => setDropFolder(null)}
          onDrop={(e) => void onFolderDrop(e, null)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-colors ${
            dropFolder === ""
              ? "bg-sky/20 text-sky-dark"
              : path.length === 0
                ? "text-charcoal"
                : "text-warm-gray hover:text-charcoal hover:bg-cream"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          Documents
        </button>
        {path.map((crumb, i) => (
          <span key={crumb.id} className="inline-flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-warm-gray/40" />
            <button
              onClick={() => openFolder(crumb.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setDropFolder(crumb.id);
              }}
              onDragLeave={() => setDropFolder(null)}
              onDrop={(e) => void onFolderDrop(e, crumb.id)}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                dropFolder === crumb.id
                  ? "bg-sky/20 text-sky-dark"
                  : i === path.length - 1
                    ? "text-charcoal"
                    : "text-warm-gray hover:text-charcoal hover:bg-cream"
              }`}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* Drop overlay hint */}
      {dragOver && (
        <div className="border-2 border-dashed border-sky rounded-xl bg-sky/5 p-6 text-center text-sm font-medium text-sky-dark">
          Drop files to upload to {path.length > 0 ? `"${path[path.length - 1].name}"` : "Documents"}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-warm-gray/60 text-center py-16">Loading…</p>
      ) : folders.length === 0 && documents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-card-border rounded-xl">
          <FolderOpen className="w-10 h-10 text-warm-gray/40 mx-auto mb-3" />
          <p className="text-warm-gray font-medium">This folder is empty</p>
          <p className="text-sm text-warm-gray/60 mt-1">
            Drag files here, or use the buttons above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders */}
          {folders.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                Folders
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {folders.map((f) => (
                  <div
                    key={f.id}
                    draggable
                    onDragStart={(e) => onItemDragStart(e, "folder", f.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropFolder(f.id);
                    }}
                    onDragLeave={() => setDropFolder(null)}
                    onDrop={(e) => void onFolderDrop(e, f.id)}
                    onClick={() => openFolder(f.id)}
                    className={`group flex items-center gap-2.5 px-3 py-3 bg-white rounded-xl border cursor-pointer transition-colors ${
                      dropFolder === f.id
                        ? "border-sky bg-sky/5"
                        : "border-card-border hover:bg-cream"
                    }`}
                  >
                    <Folder className="w-5 h-5 text-amber-500 shrink-0 fill-amber-100" />
                    <span className="text-sm font-medium text-charcoal truncate flex-1">
                      {f.name}
                    </span>
                    <span className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void renameItem("folder", f.id, f.name);
                        }}
                        title="Rename folder"
                        className="p-1 rounded text-warm-gray/60 hover:text-charcoal hover:bg-sand/30"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteItem("folder", f.id, f.name);
                        }}
                        title="Delete folder"
                        className="p-1 rounded text-warm-gray/60 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {documents.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                Files
              </p>
              <div className="bg-white rounded-xl border border-card-border divide-y divide-card-border">
                {documents.map((d) => {
                  const Icon = iconFor(d.mimeType);
                  return (
                    <div
                      key={d.id}
                      draggable
                      onDragStart={(e) => onItemDragStart(e, "document", d.id)}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-cream/50 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-sky shrink-0" />
                      <a
                        href={`/api/documents/${d.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 min-w-0"
                        title="Open"
                      >
                        <p className="text-sm font-medium text-charcoal truncate">{d.name}</p>
                        <p className="text-[11px] text-warm-gray/70">
                          {formatBytes(d.size)} ·{" "}
                          {new Date(d.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </a>
                      <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`/api/documents/${d.id}?download=1`}
                          title="Download"
                          className="p-1.5 rounded text-warm-gray/60 hover:text-charcoal hover:bg-sand/30"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => void renameItem("document", d.id, d.name)}
                          title="Rename"
                          className="p-1.5 rounded text-warm-gray/60 hover:text-charcoal hover:bg-sand/30"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => void deleteItem("document", d.id, d.name)}
                          title="Delete"
                          className="p-1.5 rounded text-warm-gray/60 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-warm-gray/60 mt-2">
                Tip: drag a file or folder onto a folder (or a breadcrumb) to move it.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
