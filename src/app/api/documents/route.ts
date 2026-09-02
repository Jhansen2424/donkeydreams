import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Drive-style documents API. Files are stored as bytea in the DB with a
// per-file cap — big enough for PDFs, scans, and spreadsheets, and safely
// under serverless request-body limits.
export const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

// GET ?folder=<id> — list one folder (root when omitted). Returns the
// subfolders, the documents (without their bytes), and the breadcrumb path.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folder") || null;

    const [folders, documents] = await Promise.all([
      db.documentFolder.findMany({
        where: { parentId: folderId },
        orderBy: { name: "asc" },
      }),
      db.document.findMany({
        where: { folderId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          folderId: true,
          mimeType: true,
          size: true,
          uploadedBy: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // Breadcrumb: walk parentIds up to the root.
    const path: Array<{ id: string; name: string }> = [];
    let cursor = folderId;
    let guard = 0;
    while (cursor && guard++ < 20) {
      const f = await db.documentFolder.findUnique({ where: { id: cursor } });
      if (!f) break;
      path.unshift({ id: f.id, name: f.name });
      cursor = f.parentId;
    }

    return NextResponse.json({ folders, documents, path });
  } catch (error) {
    console.error("GET /api/documents failed:", error);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

// POST — upload one file: { name, folderId?, mimeType?, dataBase64 }.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, folderId, mimeType, dataBase64 } = body ?? {};
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }
    if (!dataBase64 || typeof dataBase64 !== "string") {
      return NextResponse.json({ error: "Missing 'dataBase64'" }, { status: 400 });
    }

    // Validate + measure by decoding; STORE the base64 text itself (the
    // schema keeps `data` as base64 TEXT — see the model comment).
    const decoded = Buffer.from(dataBase64, "base64");
    if (decoded.byteLength === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }
    if (decoded.byteLength > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File is too large — the limit is ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB per file.` },
        { status: 413 }
      );
    }

    const row = await db.document.create({
      data: {
        name,
        folderId: typeof folderId === "string" && folderId ? folderId : null,
        mimeType: typeof mimeType === "string" && mimeType ? mimeType : "application/octet-stream",
        size: decoded.byteLength,
        data: dataBase64,
        uploadedBy: typeof body.uploadedBy === "string" ? body.uploadedBy : "",
      },
      select: { id: true, name: true, folderId: true, mimeType: true, size: true, createdAt: true },
    });
    return NextResponse.json({ document: row }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents failed:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

// PATCH — rename and/or move a document: { id, name?, folderId? (null = root) }.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, folderId } = body ?? {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }
    const update: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) update.name = name.trim();
    if (folderId !== undefined) update.folderId = folderId || null;
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    const row = await db.document.update({
      where: { id },
      data: update,
      select: { id: true, name: true, folderId: true },
    });
    return NextResponse.json({ document: row });
  } catch (error) {
    console.error("PATCH /api/documents failed:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

// DELETE ?id= — remove one document.
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    await db.document.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/documents failed:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
