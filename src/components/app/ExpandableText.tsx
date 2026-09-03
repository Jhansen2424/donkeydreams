"use client";

// Long free-text renderer used anywhere staff type or paste multi-paragraph
// text: preserves line breaks / blank lines exactly as entered
// (whitespace-pre-line) and collapses very long text behind Read more.

import { useState } from "react";

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
  const isLong = text.length > clampChars;
  const shown =
    expanded || !isLong ? text : text.slice(0, clampChars).trimEnd() + "…";
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
