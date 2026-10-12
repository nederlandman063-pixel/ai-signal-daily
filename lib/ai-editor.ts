import { generateText, Output } from "ai";
import { issueSchema, type EditorialPayload } from "./editorial-schema";

const DEFAULT_MODEL = "inclusionai/ling-3.1-flash-free";
const LOOKBACK_MS = 36 * 60 * 60 * 1000;

const OFFICIAL_FEEDS = [
  { label: "OpenAI News", url: "https://openai.com/news/rss.xml" },
  { label: "Google AI", url: "https://blog.google/technology/ai/rss/" },
  { label: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml" },
  { label: "NVIDIA Technical Blog", url: "https://blogs.nvidia.com/blog/category/deep-learning/feed/" },
  { label: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml" },
  { label: "AWS Machine Learning Blog", url: "https://aws.amazon.com/blogs/machine-learning/feed/" },
  { label: "arXiv cs.AI", url: "https://rss.arxiv.org/rss/cs.AI" },
] as const;

type FeedItem = {
  feed: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
};

function decodeXml(value: string) {
  const named: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"', nbsp: " " };
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(x?[0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(code.toLowerCase().startsWith("x") ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10)))
    .replace(/&([a-z]+);/gi, (entity, key: string) => named[key] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

function element(block: string, names: string[]) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return decodeXml(match[1]);
  }
  return "";
}

function itemLink(block: string) {
  const textLink = element(block, ["link"]);
  if (textLink.startsWith("http")) return textLink;
  return decodeXml(block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ?? "");
}

export function parseFeed(xml: string, feed: string): FeedItem[] {
  const blocks = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  const items: FeedItem[] = [];
  for (const block of blocks) {
    const title = element(block, ["title"]);
    const url = itemLink(block);
    const date = new Date(element(block, ["pubDate", "published", "updated", "dc:date"]));
    const summary = element(block, ["content:encoded", "description", "summary", "content"]);
    if (!title || !url || !summary || Number.isNaN(date.getTime())) continue;
    try {
      if (new URL(url).protocol !== "https:") continue;
    } catch {
      continue;
    }
    items.push({ feed, title, url, publishedAt: date.toISOString(), summary: summary.slice(0, 2400) });
  }
  return items;
}

async function fetchOfficialNews(now: Date) {
  const responses = await Promise.allSettled(OFFICIAL_FEEDS.map(async feed => {
    const response = await fetch(feed.url, {
      headers: { "User-Agent": "AI-Signal-Daily/1.0 (+https://ai-signal-daily-mu.vercel.app)" },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 1800 },
    });
    if (!response.ok) throw new Error(`FEED_${response.status}`);
    return parseFeed(await response.text(), feed.label);
  }));

  const threshold = now.getTime() - LOOKBACK_MS;
  const items = responses
    .flatMap(result => result.status === "fulfilled" ? result.value : [])
    .filter(item => new Date(item.publishedAt).getTime() >= threshold)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 48);
  if (items.length === 0) throw new Error("OFFICIAL_FEEDS_RETURNED_NO_RECENT_ITEMS");
  return items;
}

function assertSourcesCameFromFeeds(payload: EditorialPayload, items: FeedItem[]) {
  const urls = new Set(items.map(item => item.url));
  for (const story of payload.stories) {
    for (const source of story.sources) {
      if (!urls.has(source.url)) throw new Error("SOURCE_NOT_VERIFIED_BY_FEED");
      if (source.type !== "PRIMARY") throw new Error("AUTOMATED_SOURCE_MUST_BE_PRIMARY");
    }
  }
}

export async function generateDailyIssue(date: string): Promise<EditorialPayload> {
  const items = await fetchOfficialNews(new Date(`${date}T23:59:59.999Z`));
  const packet = items.map((item, index) => `[${index + 1}] ${item.feed}\nTITLE: ${item.title}\nPUBLISHED: ${item.publishedAt}\nURL: ${item.url}\nSOURCE TEXT: ${item.summary}`).join("\n\n");
  const draft = await generateText({
    model: process.env.AI_GATEWAY_MODEL || DEFAULT_MODEL,
    maxOutputTokens: 30_000,
    output: Output.object({ schema: issueSchema }),
    prompt: `Создай выпуск AI Signal Daily за ${date} на русском языке только из официального пакета источников ниже.

- Выбери от 1 до 8 действительно значимых событий за последние 24–36 часов. Шесть — нормальная цель, но никогда не добавляй слабую новость ради количества.
- Не объединяй несвязанные публикации и не подставляй источник от другой новости. Если сильных событий мало, выпусти меньше историй.
- Ровно одна история lead. Rank начинается с 1 без повторов. Категории: MODELS, AGENTS, APPS, RESEARCH, BUSINESS, INFRA. Slug — латинский kebab-case.
- Каждая статья содержит минимум 1000 русских символов; важные сюжеты 2500–5000. Пиши как знающий IT-журналист, без пресс-релизного тона, SEO-фраз и выдуманных выводов.
- Не превращай заявления о качестве, скорости или превосходстве в подтверждённые факты. Не добавляй сведений из памяти модели. Сохраняй имена, даты, цены, числа и лимиты буквально.
- excerpt — несколько содержательных предложений. takeaway — практический блок «А что мне с этого?»: кому доступно, когда, сколько стоит, ограничения и способ попробовать. Если эффекта нет, скажи прямо.
- Для каждой истории используй только относящиеся к ней URL из пакета. Все sources имеют type PRIMARY и isPrimary true. xPosts всегда пустой массив.
- image.url — любой путь /signal-1.svg … /signal-6.svg; сервер исправит его по rank. alt — содержательное описание.
- publishedAt бери из PUBLISHED. verification чаще COMPANY_CLAIM; CONFIRMED — только для прямо указанного факта релиза или доступности, ANALYSIS — для интерпретации.
- Заголовок «А что мне с этого?» не вставляй в body: его содержимое находится только в takeaway.

Перед финальным ответом выполни humanization pass, затем fact-preservation check. Не публикуй ничего, чего нет в пакете.

ОФИЦИАЛЬНЫЙ ПАКЕТ:
${packet}`,
  });

  const payload = issueSchema.parse({
    ...draft.output,
    date,
    stories: draft.output.stories.map(story => ({
      ...story,
      image: { ...story.image, url: `/signal-${((story.rank - 1) % 6) + 1}.svg` },
    })),
  });
  assertSourcesCameFromFeeds(payload, items);
  return payload;
}
