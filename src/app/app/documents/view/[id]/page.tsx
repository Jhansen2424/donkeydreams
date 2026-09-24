"use client";

// Full-page document viewer — the target of every "Open in new tab" link in
// the Documents drive. Before this page, opening a Word/Excel file in a new
// tab just triggered a download and the tab closed itself (dev note 9/24).
// Here everything renders IN the browser:
//   PDF / images  → native (iframe / img)
//   Word (.docx)  → converted to HTML client-side with mammoth
//   Excel (.xlsx) → parsed with SheetJS, one table per sheet
//   anything else → file card with a download button (no surprise download)

import { use, useEffect, useState } from "react";
import { Download, FileText, Loader2, Printer } from "lucide-react";

interface DocMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIMES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const url = `/api/documents/${id}`;

  const [meta, setMeta] = useState<DocMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Converted HTML for docx; array of { name, html } tables for xlsx.
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [sheets, setSheets] = useState<{ name: string; html: string }[] | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${url}?meta=1`, { cache: "no-store" });
        if (!res.ok) throw new Error("File not found");
        const m = (await res.json()) as DocMeta;
        if (cancelled) return;
        setMeta(m);
        document.title = m.name;

        if (m.mimeType === DOCX_MIME) {
          setConverting(true);
          const [mammoth, buf] = await Promise.all([
            import("mammoth"),
            fetch(url).then((r) => r.arrayBuffer()),
          ]);
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          if (!cancelled) setDocxHtml(result.value);
        } else if (XLSX_MIMES.includes(m.mimeType)) {
          setConverting(true);
          const [XLSX, buf] = await Promise.all([
            import("xlsx"),
            fetch(url).then((r) => r.arrayBuffer()),
          ]);
          const wb = XLSX.read(buf, { type: "array" });
          const out = wb.SheetNames.map((name) => ({
            name,
            html: XLSX.utils.sheet_to_html(wb.Sheets[name], { header: "", footer: "" }),
          }));
          if (!cancelled) setSheets(out);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load file");
      } finally {
        if (!cancelled) setConverting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, url]);

  const isImage = meta?.mimeType.startsWith("image/");
  const isPdf = meta?.mimeType === "application/pdf";
  const renderable =
    isImage || isPdf || docxHtml !== null || sheets !== null || converting;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-sidebar rounded-xl px-4 py-3 flex items-center gap-3 print:hidden">
        <FileText className="w-4 h-4 text-cream/60 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">
            {meta?.name ?? "Loading…"}
          </p>
          {meta && (
            <p className="text-[11px] text-cream/50">
              {formatBytes(meta.size)} ·{" "}
              {new Date(meta.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        {(docxHtml !== null || sheets !== null) && (
          <button
            onClick={() => window.print()}
            title="Print"
            className="p-2 rounded-lg text-cream/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        )}
        <a
          href={`${url}?download=1`}
          title="Download"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
      </div>

      {/* Body */}
      {error ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-sm text-warm-gray">{error}</p>
        </div>
      ) : !meta || converting ? (
        <div className="flex items-center justify-center p-8">
          <p className="inline-flex items-center gap-2 text-sm text-warm-gray">
            <Loader2 className="w-4 h-4 animate-spin" />
            {converting ? "Preparing preview…" : "Loading…"}
          </p>
        </div>
      ) : isPdf ? (
        <iframe
          src={url}
          title={meta.name}
          className="w-full min-h-[80vh] rounded-xl border border-card-border bg-white"
        />
      ) : isImage ? (
        <div className="flex items-start justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={meta.name} className="max-w-full rounded-xl shadow" />
        </div>
      ) : docxHtml !== null ? (
        <div
          className="doc-render max-w-3xl mx-auto bg-white rounded-xl border border-card-border shadow-sm px-8 py-10 print:border-0 print:shadow-none print:px-0 print:py-0"
          dangerouslySetInnerHTML={{ __html: docxHtml }}
        />
      ) : sheets !== null ? (
        <div className="space-y-6">
          {sheets.map((s) => (
            <div key={s.name} className="max-w-5xl mx-auto">
              {sheets.length > 1 && (
                <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1.5">
                  {s.name}
                </p>
              )}
              <div
                className="sheet-render bg-white rounded-xl border border-card-border shadow-sm overflow-x-auto p-4 print:border-0 print:shadow-none"
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            </div>
          ))}
        </div>
      ) : !renderable ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <FileText className="w-10 h-10 text-warm-gray/40 mx-auto" />
            <p className="text-sm text-warm-gray">
              This file type can&apos;t be shown in the browser.
            </p>
            <a
              href={`${url}?download=1`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light"
            >
              <Download className="w-4 h-4" />
              Download {meta.name}
            </a>
          </div>
        </div>
      ) : null}

      {/* Minimal typography for converted Word/Excel HTML (mammoth and
          SheetJS emit bare tags with no classes). */}
      <style jsx global>{`
        .doc-render h1 { font-size: 1.5rem; font-weight: 700; margin: 1.2em 0 0.5em; }
        .doc-render h2 { font-size: 1.25rem; font-weight: 700; margin: 1.1em 0 0.4em; }
        .doc-render h3 { font-size: 1.1rem; font-weight: 600; margin: 1em 0 0.4em; }
        .doc-render p { margin: 0.6em 0; line-height: 1.6; }
        .doc-render ul, .doc-render ol { margin: 0.6em 0; padding-left: 1.5em; }
        .doc-render ul { list-style: disc; }
        .doc-render ol { list-style: decimal; }
        .doc-render li { margin: 0.25em 0; line-height: 1.5; }
        .doc-render table { border-collapse: collapse; margin: 0.8em 0; }
        .doc-render td, .doc-render th { border: 1px solid #d8d2c7; padding: 4px 8px; }
        .doc-render img { max-width: 100%; height: auto; }
        .doc-render a { color: #2b7a9e; text-decoration: underline; }
        .sheet-render table { border-collapse: collapse; font-size: 0.8rem; }
        .sheet-render td { border: 1px solid #e4ded3; padding: 3px 8px; white-space: nowrap; }
      `}</style>
    </div>
  );
}
