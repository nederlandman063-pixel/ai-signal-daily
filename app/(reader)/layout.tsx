import { Header } from "@/components/header";
import { getLatestIssue } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReaderLayout({children}:{children:React.ReactNode}) {
  const issue=await getLatestIssue();
  return <><Header stories={issue?.stories??[]} date={issue?.date}/>{children}</>;
}
