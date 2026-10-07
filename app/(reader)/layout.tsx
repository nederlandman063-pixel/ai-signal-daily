import { Header } from "@/components/header";
import { getLatestIssue } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReaderLayout({children}:{children:React.ReactNode}) {
  const session=await auth();
  if (!session?.user && !(process.env.NODE_ENV === "development" && process.env.AUTH_BYPASS_LOCAL === "1")) redirect("/login");
  const issue=await getLatestIssue();
  return <><Header stories={issue?.stories??[]} date={issue?.date}/>{children}</>;
}
