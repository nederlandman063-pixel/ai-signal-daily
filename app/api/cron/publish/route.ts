import { NextResponse } from "next/server";
import { generateDailyIssue } from "@/lib/ai-editor";
import { publishDailyIssue } from "@/lib/daily-publication";
import { getStoredIssue, insertIssue } from "@/lib/db";
import { verifyBearer } from "@/lib/security";

export const maxDuration = 300;

export function publicationFailureCode(error: unknown) {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : undefined;
  if (statusCode && Number.isInteger(statusCode)) return `AI_GATEWAY_${statusCode}`;

  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : "";
  if (name === "ZodError" || name.includes("NoObjectGenerated")) {
    return "EDITORIAL_VALIDATION";
  }
  if (
    message === "SOURCE_NOT_VERIFIED_BY_FEED" ||
    message === "AUTOMATED_SOURCE_MUST_BE_PRIMARY"
  ) {
    return "SOURCE_PROVENANCE";
  }
  if (message === "OFFICIAL_FEEDS_RETURNED_NO_RECENT_ITEMS") {
    return "EMPTY_RESEARCH";
  }
  if (/customer_verification_required/i.test(message)) {
    return "AI_GATEWAY_VERIFICATION_REQUIRED";
  }
  if (/insufficient_funds|quota_for_entity_exceeded/i.test(message)) {
    return "AI_GATEWAY_CREDITS_REQUIRED";
  }
  return "UNKNOWN";
}

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
    const reason = publicationFailureCode(error);
    console.error(
      "Daily publication failed",
      reason,
    );
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PUBLICATION_FAILED",
          message: "Автоматический выпуск не опубликован: проверка качества не пройдена",
          reason,
        },
      },
      { status: 500 },
    );
  }
}
