import { IssueHome } from "@/components/issue-home";
import { getLatestIssue } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function Page(){const issue=await getLatestIssue();return issue?<IssueHome issue={issue}/>:<main className="empty-issue"><div className="eyebrow"><i/>AI SIGNAL DAILY</div><h1>Первый сигнал<br/>скоро появится.</h1><p>Выпуск ещё не опубликован. После проверки источников он появится здесь автоматически.</p></main>}
