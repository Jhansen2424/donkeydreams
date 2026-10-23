import { NextRequest, NextResponse } from "next/server";
import { storedPhoto } from "@/lib/animal-photos";

// GET ?slug=&v=<md5> → one stored donkey photo as an image file. The URL
// changes whenever the photo does, so phones may cache it forever.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const hash = searchParams.get("v");
  if (!slug || !hash || !/^[0-9a-f]{32}$/.test(hash)) {
    return NextResponse.json({ error: "Missing 'slug' or 'v'" }, { status: 400 });
  }
  try {
    const dataUrl = await storedPhoto(slug, hash);
    const m = dataUrl?.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/);
    if (!m) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    // Only ever serve it as a picture, whatever the stored value claims.
    const type = /^image\/(jpeg|png|webp|gif|avif|heic|heif)$/i.test(m[1]) ? m[1] : "application/octet-stream";
    const bytes = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /api/animals/photo failed:", error);
    return NextResponse.json({ error: "Failed to load photo" }, { status: 500 });
  }
}
