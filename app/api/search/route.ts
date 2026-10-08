import { NextResponse } from "next/server";
import { searchStories } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) return NextResponse.json({ results: [] }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ results: await searchStories(query) }, { headers: { "Cache-Control": "no-store" } });
}
