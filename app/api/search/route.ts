import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchStories } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user && !(process.env.NODE_ENV === "development" && process.env.AUTH_BYPASS_LOCAL === "1")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) return NextResponse.json({ results: [] }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ results: await searchStories(query) }, { headers: { "Cache-Control": "no-store" } });
}
