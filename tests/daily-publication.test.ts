import { describe, expect, it, vi } from "vitest";
import { publishDailyIssue } from "@/lib/daily-publication";
import type { EditorialPayload } from "@/lib/editorial-schema";
import type { Issue } from "@/lib/types";

const payload = { date: "2026-10-12" } as EditorialPayload;

describe("daily publication", () => {
  it("does not generate or save a duplicate issue date", async () => {
    const generateIssue = vi.fn();
    const saveIssue = vi.fn();
    const existing = { stories: [{}, {}] } as Issue;

    const result = await publishDailyIssue("2026-10-12", {
      findIssue: vi.fn().mockResolvedValue(existing),
      generateIssue,
      saveIssue,
    });

    expect(result).toEqual({
      status: "already-published",
      date: "2026-10-12",
      storyCount: 2,
    });
    expect(generateIssue).not.toHaveBeenCalled();
    expect(saveIssue).not.toHaveBeenCalled();
  });

  it("saves a generated issue through the database dependency", async () => {
    const saveIssue = vi.fn().mockResolvedValue({
      id: "issue-id",
      date: payload.date,
      storyCount: 6,
    });

    const result = await publishDailyIssue(payload.date, {
      findIssue: vi.fn().mockResolvedValue(null),
      generateIssue: vi.fn().mockResolvedValue(payload),
      saveIssue,
    });

    expect(saveIssue).toHaveBeenCalledWith(payload);
    expect(result.status).toBe("published");
  });
});
