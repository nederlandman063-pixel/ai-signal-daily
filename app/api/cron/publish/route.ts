import { NextResponse } from "next/server";
import { generateDailyIssue } from "@/lib/ai-editor";
import { publishDailyIssue } from "@/lib/daily-publication";
import { getStoredIssue, insertIssue } from "@/lib/db";
import { verifyBearer } from "@/lib/security";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyBearer(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Недействительный cron token" } },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const date = new Date().toISOString().slice(0, 10);
  try {
    const result = await publishDailyIssue(date, {
      findIssue: getStoredIssue,
      generateIssue: generateDailyIssue,
      saveIssue: insertIssue,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error(
      "Daily publication failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PUBLICATION_FAILED",
          message: "Автоматический выпуск не опубликован: проверка качества не пройдена",
        },
      },
      { status: 500 },
    );
  }
}
