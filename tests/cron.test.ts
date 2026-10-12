import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai-editor", () => ({ generateDailyIssue: vi.fn() }));
vi.mock("@/lib/db", () => ({
  getStoredIssue: vi.fn(),
  insertIssue: vi.fn(),
}));

import { GET } from "@/app/api/cron/publish/route";
import { getStoredIssue } from "@/lib/db";

describe("daily cron route", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.resetAllMocks();
  });

  it("rejects requests without the server-only cron secret", async () => {
    process.env.CRON_SECRET = "a-secure-cron-secret-value-123";
    const response = await GET(new Request("http://localhost/api/cron/publish"));
    expect(response.status).toBe(401);
    expect(getStoredIssue).not.toHaveBeenCalled();
  });

  it("returns without generation when today's issue already exists", async () => {
    process.env.CRON_SECRET = "a-secure-cron-secret-value-123";
    vi.mocked(getStoredIssue).mockResolvedValueOnce({ stories: [] } as never);
    const response = await GET(
      new Request("http://localhost/api/cron/publish", {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).result.status).toBe("already-published");
  });
});
