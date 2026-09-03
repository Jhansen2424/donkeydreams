"use client";

// Long free-text renderer used anywhere staff type or paste multi-paragraph
// text: preserves line breaks / blank lines exactly as entered
// (whitespace-pre-line) and collapses very long text behind Read more.

import { useState } from "react";

// Pasted text often carries runs of 3-4 blank lines between paragraphs
// (copy artifacts from docs/notes apps). Collapse any run down to ONE blank
// line so paragraphs read with normal spacing, while single line breaks stay
// exactly as typed.
export function normalizeParagraphs(text: string): string {
  return text.replace(/[ \t]*\r?\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export default function ExpandableText({
  text,
  className = "",
  clampChars = 400,
}: {
  text: string;
  className?: string;
  clampChars?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const normalized = normalizeParagraphs(text);
  const isLong = normalized.length > clampChars;
  const shown =
    expanded || !isLong ? normalized : normalized.slice(0, clampChars).trimEnd() + "…";
  return (
    <div>
      <p className={`whitespace-pre-line ${className}`}>{shown}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
