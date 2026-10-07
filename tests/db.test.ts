import { afterEach, describe, expect, it, vi } from "vitest";
import { insertIssue } from "@/lib/db";
import type { EditorialPayload } from "@/lib/editorial-schema";

const state = vi.hoisted(() => ({ failSource: false, calls: [] as string[], committed: false, rolledBack: false }));
vi.mock("postgres", () => ({ default: () => ({ begin: async (work: (tx: unknown) => Promise<unknown>) => {
  state.calls.push("BEGIN");
  const tx = async (parts: TemplateStringsArray) => {
    const sql = parts.join("?");
    if (sql.includes("INSERT INTO issues")) { state.calls.push("ISSUE"); return [{ id: "issue-id", issue_date: "2026-10-01" }]; }
    if (sql.includes("INSERT INTO stories")) { state.calls.push("STORY"); return [{ id: "story-id" }]; }
    if (sql.includes("INSERT INTO sources")) { state.calls.push("SOURCE"); if (state.failSource) throw new Error("source insert failed"); return []; }
    if (sql.includes("INSERT INTO x_posts")) { state.calls.push("X_POST"); return []; }
    throw new Error("unexpected SQL");
  };
  try { const result = await work(tx); state.committed = true; return result; }
  catch (error) { state.rolledBack = true; throw error; }
} }) }));

const issue: EditorialPayload = {
  date: "2026-10-01", title: "Тестовый выпуск", summary: "Выпуск для проверки атомарного сохранения связанного набора записей.",
  stories: [{ rank: 1, lead: true, category: "MODELS", title: "Тестовая история модели", slug: "test-story", dek: "Подробная подводка к тестовой истории о новой модели.", excerpt: "Подробный фрагмент тестовой истории о новой модели и её технических свойствах с достаточным количеством фактов.", body: "А".repeat(1000), takeaway: "Обычному пользователю пока ничего менять не нужно. Разработчик может проверить результат в безопасной песочнице, ограничив стоимость и время выполнения.", image: { url: "/signal-1.svg", alt: "Абстрактная иллюстрация" }, verification: "CONFIRMED", sources: [{ label: "Первоисточник", url: "https://example.com", type: "PRIMARY" }], xPosts: [] }],
};

describe("issue persistence transaction", () => {
  afterEach(() => { delete process.env.DATABASE_URL; state.failSource = false; state.calls = []; state.committed = false; state.rolledBack = false; });
  it("stores issue, story and source before commit", async () => {
    process.env.DATABASE_URL = "configured-by-test";
    const result = await insertIssue(issue);
    expect(result).toEqual({ id: "issue-id", date: issue.date, storyCount: 1 });
    expect(state.calls).toEqual(["BEGIN", "ISSUE", "STORY", "SOURCE"]);
    expect(state.committed).toBe(true);
  });
  it("rolls back when a source cannot be saved", async () => {
    process.env.DATABASE_URL = "configured-by-test";
    state.failSource = true;
    await expect(insertIssue(issue)).rejects.toThrow("source insert failed");
    expect(state.rolledBack).toBe(true);
    expect(state.committed).toBe(false);
  });
});
