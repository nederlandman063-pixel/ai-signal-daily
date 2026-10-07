import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/search/route";
import { auth } from "@/auth";
import { searchStories } from "@/lib/db";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ searchStories: vi.fn() }));

describe("private search API", () => {
  const authMock = vi.mocked(auth as () => Promise<{ user: { id: string }; expires: string } | null>);
  afterEach(() => { vi.resetAllMocks(); delete process.env.AUTH_BYPASS_LOCAL; });
  it("does not reveal results to an anonymous request", async () => {
    authMock.mockResolvedValueOnce(null);
    const response = await GET(new Request("http://localhost/api/search?q=model"));
    expect(response.status).toBe(401);
    expect(searchStories).not.toHaveBeenCalled();
  });
  it("returns search results to a signed-in reader", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "owner" }, expires: "2026-10-08T00:00:00Z" });
    vi.mocked(searchStories).mockResolvedValueOnce([{ slug: "story", title: "История", category: "MODELS" }]);
    const response = await GET(new Request("http://localhost/api/search?q=model"));
    expect(response.status).toBe(200);
    expect((await response.json()).results[0].slug).toBe("story");
  });
});
