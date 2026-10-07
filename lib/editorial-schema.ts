import { z } from "zod";
import { categories } from "./types";

const httpUrl = z.url().superRefine((value, ctx) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) ctx.addIssue({ code: "custom", message: "Допустимы только HTTP(S) URL" });
  if (["localhost", "localhost.", "127.0.0.1", "0.0.0.0", "[::1]"].includes(url.hostname.toLowerCase())) ctx.addIssue({ code: "custom", message: "Локальные URL запрещены" });
});

const imageUrl = z.string().refine(value => {
  if (/^\/[a-zA-Z0-9/_-]+\.(?:jpg|jpeg|png|webp|avif|svg)$/.test(value)) return true;
  const parsed = httpUrl.safeParse(value);
  return parsed.success && new URL(value).protocol === "https:";
}, "Изображение должно быть локальным файлом или HTTPS URL");

export const sourceSchema = z.object({
  label: z.string().trim().min(2).max(160), url: httpUrl,
  type: z.enum(["PRIMARY", "CORROBORATING", "ANALYSIS"]),
  isPrimary: z.boolean().optional(), publishedAt: z.iso.datetime().optional(),
}).superRefine((source, ctx) => {
  if (["x.com", "www.x.com"].includes(new URL(source.url).hostname.toLowerCase())) ctx.addIssue({ code: "custom", path: ["url"], message: "Публикации X добавляйте в xPosts после проверки" });
  if (source.isPrimary && source.type !== "PRIMARY") ctx.addIssue({ code: "custom", path: ["isPrimary"], message: "Первичный источник должен иметь тип PRIMARY" });
});

export const xPostSchema = z.object({
  author: z.string().regex(/^@[A-Za-z0-9_]{1,15}$/), url: httpUrl, verified: z.literal(true),
  publishedAt: z.iso.datetime().optional(),
}).superRefine((post, ctx) => {
  const host = new URL(post.url).hostname.toLowerCase();
  if (host !== "x.com" && host !== "www.x.com") ctx.addIssue({ code: "custom", path: ["url"], message: "URL подтверждённого поста должен вести на x.com" });
  const path = new URL(post.url).pathname;
  if (!new RegExp(`^/${post.author.slice(1)}/status/[0-9]+/?$`, "i").test(path)) ctx.addIssue({ code: "custom", path: ["url"], message: "URL должен содержать автора и ID публикации" });
});

export const storySchema = z.object({
  rank: z.number().int().positive(), lead: z.boolean(), category: z.enum(categories),
  title: z.string().trim().min(10).max(220), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  dek: z.string().trim().min(40).max(500), excerpt: z.string().trim().min(100).max(1000),
  body: z.string().trim().min(1000, "Текст статьи должен содержать минимум 1000 символов"),
  takeaway: z.string().trim().min(120).max(2000),
  image: z.object({ url: imageUrl, alt: z.string().trim().min(5).max(240), credit: z.string().trim().max(160).optional() }),
  verification: z.enum(["CONFIRMED", "COMPANY_CLAIM", "ANALYSIS"]),
  publishedAt: z.iso.datetime().optional(), readTime: z.number().int().min(1).max(60).optional(),
  sources: z.array(sourceSchema).min(1), xPosts: z.array(xPostSchema).default([]),
}).superRefine((story, ctx) => {
  if (!story.sources.some(source => source.type === "PRIMARY")) ctx.addIssue({ code: "custom", path: ["sources"], message: "Нужен хотя бы один первичный источник" });
  const xUrls = story.body.match(/https?:\/\/(?:www\.)?x\.com\/[^\s)]+/gi) ?? [];
  for (const url of xUrls) if (!story.xPosts.some(post => post.url === url)) ctx.addIssue({ code: "custom", path: ["body"], message: "X URL в тексте должен присутствовать в проверенных xPosts" });
});

export const issueSchema = z.object({
  date: z.iso.date(), title: z.string().trim().min(5).max(180), summary: z.string().trim().min(40).max(700),
  stories: z.array(storySchema).min(1).max(20),
}).superRefine((issue, ctx) => {
  const slugs = new Set<string>(); const ranks = new Set<number>(); let leads = 0;
  issue.stories.forEach((story, i) => {
    if (slugs.has(story.slug)) ctx.addIssue({ code: "custom", path: ["stories", i, "slug"], message: "Slug должен быть уникальным в выпуске" });
    if (ranks.has(story.rank)) ctx.addIssue({ code: "custom", path: ["stories", i, "rank"], message: "Rank должен быть уникальным" });
    slugs.add(story.slug); ranks.add(story.rank); if (story.lead) leads++;
  });
  if (leads !== 1) ctx.addIssue({ code: "custom", path: ["stories"], message: "В выпуске должна быть ровно одна главная история" });
});

export type EditorialPayload = z.infer<typeof issueSchema>;
