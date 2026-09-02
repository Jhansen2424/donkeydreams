import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Folder management for the Documents drive.

// Walk up from `folderId` and return true when `ancestorId` is on the path —
// used to block moving a folder into itself or its own subtree.
async function isDescendantOf(folderId: string | null, ancestorId: string): Promise<boolean> {
  let cursor = folderId;
  let guard = 0;
  while (cursor && guard++ < 20) {
    if (cursor === ancestorId) return true;
    const f = await db.documentFolder.findUnique({ where: { id: cursor } });
    cursor = f?.parentId ?? null;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, parentId } = body ?? {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }
    const row = await db.documentFolder.create({
      data: {
        name: name.trim(),
        parentId: typeof parentId === "string" && parentId ? parentId : null,
      },
    });
    return NextResponse.json({ folder: row }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents/folders failed:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

// PATCH — rename and/or move: { id, name?, parentId? (null = root) }.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, parentId } = body ?? {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }
    const update: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) update.name = name.trim();
    if (parentId !== undefined) {
      const target = parentId || null;
      if (target && (await isDescendantOf(target, id))) {
        return NextResponse.json(
          { error: "Can't move a folder inside itself." },
          { status: 400 }
        );
      }
      update.parentId = target;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    const row = await db.documentFolder.update({ where: { id }, data: update });
    return NextResponse.json({ folder: row });
  } catch (error) {
    console.error("PATCH /api/documents/folders failed:", error);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}

// DELETE ?id= — remove a folder AND everything inside it (subfolders +
// documents). Collects the subtree breadth-first, then deletes bottom-up.
// No transactions (Neon HTTP driver) — sequential deletes.
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });

    const subtree: string[] = [id];
    for (let i = 0; i < subtree.length && i < 200; i++) {
      const kids = await db.documentFolder.findMany({
        where: { parentId: subtree[i] },
        select: { id: true },
      });
      subtree.push(...kids.map((k) => k.id));
    }

    const docs = await db.document.deleteMany({ where: { folderId: { in: subtree } } });
    for (const folderId of [...subtree].reverse()) {
      await db.documentFolder.delete({ where: { id: folderId } }).catch(() => {});
    }
    return NextResponse.json({ ok: true, deletedDocuments: docs.count, deletedFolders: subtree.length });
  } catch (error) {
    console.error("DELETE /api/documents/folders failed:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
