import { afterEach, describe, expect, it, vi } from "vitest";
import { searchStories } from "@/lib/db";

describe("local demo search", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns each story slug only once across demo archive days", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_BYPASS_LOCAL", "1");
    vi.stubEnv("DATABASE_URL", "");

    const results = await searchStories("Агенты");

    expect(results).toHaveLength(1);
    expect(results[0]?.slug).toBe("agents-long-horizon");
  });
});
