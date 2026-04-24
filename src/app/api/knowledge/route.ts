import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Knowledge base article CRUD. Articles are free-text markdown with tags and
// optional linkedAnimals. No unique human-readable identifier — callers must
// provide the cuid for PATCH / DELETE. GET returns the full list unless a
// `tag` filter is passed.

interface ApiArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  linkedAnimals: string[];
  createdAt: string;
  updatedAt: string;
}

function toApi(row: {
  id: string;
  title: string;
  content: string;
  tags: string[];
  linkedAnimals: string[];
  createdAt: Date;
  updatedAt: Date;
}): ApiArticle {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags,
    linkedAnimals: row.linkedAnimals,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const animal = searchParams.get("animal");
    const where: Record<string, unknown> = {};
    if (tag) where.tags = { has: tag };
    if (animal) where.linkedAnimals = { has: animal };
    const rows = await db.knowledgeArticle.findMany({
      where: where as Parameters<typeof db.knowledgeArticle.findMany>[0] extends { where?: infer W } ? W : never,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ articles: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/knowledge failed:", error);
    return NextResponse.json({ error: "Failed to load articles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, tags, linkedAnimals } = body ?? {};
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Missing 'title'" }, { status: 400 });
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing 'content'" }, { status: 400 });
    }
    const row = await db.knowledgeArticle.create({
      data: {
        title,
        content,
        tags: Array.isArray(tags) ? tags : [],
        linkedAnimals: Array.isArray(linkedAnimals) ? linkedAnimals : [],
      },
    });
    return NextResponse.json({ article: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/knowledge failed:", error);
    return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, content, tags, linkedAnimals } = body ?? {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }
    const update: Record<string, unknown> = {};
    if (typeof title === "string") update.title = title;
    if (typeof content === "string") update.content = content;
    if (Array.isArray(tags)) update.tags = tags;
    if (Array.isArray(linkedAnimals)) update.linkedAnimals = linkedAnimals;
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updatable fields in payload" }, { status: 400 });
    }
    const row = await db.knowledgeArticle.update({
      where: { id },
      data: update as Parameters<typeof db.knowledgeArticle.update>[0]["data"],
    });
    return NextResponse.json({ article: toApi(row) });
  } catch (error) {
    console.error("PATCH /api/knowledge failed:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    await db.knowledgeArticle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/knowledge failed:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
