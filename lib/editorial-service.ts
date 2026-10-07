import type { EditorialPayload } from "./editorial-schema";

export interface IssueWriter { transaction<T>(work: () => Promise<T>): Promise<T>; insertIssue(payload: EditorialPayload): Promise<{id:string}> }
export async function publishWithTransaction(writer: IssueWriter, payload: EditorialPayload) {
  return writer.transaction(() => writer.insertIssue(payload));
}
