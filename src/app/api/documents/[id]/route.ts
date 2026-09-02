import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Serve a document's bytes. `?download=1` forces a save dialog; otherwise
// the browser opens viewable types (PDFs, images) inline.
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const row = await db.document.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { searchParams } = new URL(req.url);
    const download = searchParams.get("download") === "1";
    const disposition = `${download ? "attachment" : "inline"}; filename="${row.name.replace(/"/g, "'")}"`;

    // `data` is stored as base64 text — decode to real bytes here.
    const bytes = Buffer.from(row.data, "base64");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": row.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET /api/documents/[id] failed:", error);
    return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
  }
}
