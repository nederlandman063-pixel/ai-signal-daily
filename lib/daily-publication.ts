import type { EditorialPayload } from "./editorial-schema";
import type { Issue } from "./types";

export type DailyPublicationDependencies = {
  findIssue: (date: string) => Promise<Issue | null>;
  generateIssue: (date: string) => Promise<EditorialPayload>;
  saveIssue: (payload: EditorialPayload) => Promise<{
    id: string;
    date: string;
    storyCount: number;
  }>;
};

export async function publishDailyIssue(
  date: string,
  dependencies: DailyPublicationDependencies,
) {
  const existing = await dependencies.findIssue(date);
  if (existing) {
    return {
      status: "already-published" as const,
      date,
      storyCount: existing.stories.length,
    };
  }

  const payload = await dependencies.generateIssue(date);
  const result = await dependencies.saveIssue(payload);
  return { status: "published" as const, ...result };
}
