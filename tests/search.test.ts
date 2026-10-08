import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/search/route";
import { searchStories } from "@/lib/db";

vi.mock("@/lib/db", () => ({ searchStories: vi.fn() }));

describe("public search API", () => {
  afterEach(() => vi.resetAllMocks());
  it("does not query the database for an invalid search", async () => {
    const response = await GET(new Request("http://localhost/api/search?q=x"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ results: [] });
    expect(searchStories).not.toHaveBeenCalled();
  });
  it("returns search results without reader authentication", async () => {
    vi.mocked(searchStories).mockResolvedValueOnce([{ slug: "story", title: "История", category: "MODELS" }]);
    const response = await GET(new Request("http://localhost/api/search?q=model"));
    expect(response.status).toBe(200);
    expect((await response.json()).results[0].slug).toBe("story");
  });
});
