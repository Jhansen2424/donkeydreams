import { NextResponse } from "next/server";

export const revalidate = 600; // cache for 10 minutes

type IGMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
};

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "INSTAGRAM_ACCESS_TOKEN not configured" },
      { status: 500 }
    );
  }

  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=16&access_token=${token}`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Instagram API error", details: text },
        { status: res.status }
      );
    }
    const json = (await res.json()) as { data: IGMedia[] };
    return NextResponse.json({ data: json.data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch Instagram feed", details: String(err) },
      { status: 500 }
    );
  }
}
