import { notFound } from "next/navigation"; import { IssueHome } from "@/components/issue-home"; import { getIssue } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function IssuePage({params}:{params:Promise<{date:string}>}){const {date}=await params;const issue=await getIssue(date);if(!issue)notFound();return <IssueHome issue={issue}/>}
