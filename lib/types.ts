export const categories = ["MODELS", "AGENTS", "APPS", "RESEARCH", "BUSINESS", "INFRA"] as const;
export type Category = (typeof categories)[number];
export type Verification = "CONFIRMED" | "COMPANY_CLAIM" | "ANALYSIS";

export type Source = {
  id?: string; label: string; url: string; type: "PRIMARY" | "CORROBORATING" | "ANALYSIS";
  isPrimary?: boolean; publishedAt?: string;
};
export type XPost = { author: string; url: string; verified: boolean; publishedAt?: string };
export type Story = {
  id?: string; rank: number; lead: boolean; category: Category; title: string; slug: string;
  dek: string; excerpt: string; body: string; takeaway: string; image: { url: string; alt: string; credit?: string };
  verification: Verification; publishedAt: string; readTime: number; sources: Source[]; xPosts: XPost[]; demo?: boolean;
};
export type Issue = { id?: string; date: string; title: string; summary: string; stories: Story[]; demo?: boolean };
export type ArchiveEntry = { date: string; title: string; storyCount: number; categories: Category[]; leadTitle: string; leadImageUrl: string; demo?: boolean };
