import { generateText, gateway, isStepCount, Output } from "ai";
import { issueSchema, type EditorialPayload } from "./editorial-schema";

const DEFAULT_MODEL = "openai/gpt-5.4-mini";

type SearchResult = { url: string };

function normalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || ["ref", "source"].includes(key)) {
      url.searchParams.delete(key);
    }
  }
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  return url.toString();
}

function collectSearchUrls(toolResults: readonly unknown[]) {
  const urls = new Set<string>();
  for (const item of toolResults) {
    if (!item || typeof item !== "object" || !("output" in item)) continue;
    const output = (item as { output?: { results?: SearchResult[] } }).output;
    for (const result of output?.results ?? []) {
      try {
        urls.add(normalizeUrl(result.url));
      } catch {
        // Invalid search-provider URLs are ignored and can never be published.
      }
    }
  }
  return urls;
}

function assertSourcesCameFromSearch(
  payload: EditorialPayload,
  searchedUrls: ReadonlySet<string>,
) {
  for (const story of payload.stories) {
    for (const source of story.sources) {
      if (!searchedUrls.has(normalizeUrl(source.url))) {
        throw new Error(`SOURCE_NOT_VERIFIED_BY_SEARCH:${source.url}`);
      }
    }
  }
}

export async function generateDailyIssue(date: string): Promise<EditorialPayload> {
  const model = process.env.AI_GATEWAY_MODEL || DEFAULT_MODEL;
  const research = await generateText({
    model,
    tools: {
      web_search: gateway.tools.perplexitySearch({
        maxResults: 20,
        maxTokensPerPage: 1600,
        maxTokens: 60000,
        searchLanguageFilter: ["en", "ru"],
        searchRecencyFilter: "day",
      }),
    },
    stopWhen: isStepCount(5),
    prompt: `Сегодня ${date}. Подготовь проверенный исследовательский пакет для ежедневного русскоязычного издания об ИИ.

Обязательно используй web_search. Ищи события последних 24 часов по отдельным направлениям: новые модели, агенты, приложения, исследования, бизнес и инфраструктура. Отбирай только новости, которые действительно меняют возможности, доступность, цены, лимиты, безопасность или рынок. Не добивай количество слабыми поводами.

Для каждого достойного сюжета зафиксируй: точный факт, время публикации, первичный источник (официальный анонс, документация или научная работа), независимое подтверждение при наличии, цены и ограничения, статус доступности, а также что остаётся заявлением компании. Не используй X как источник. Не придумывай факты и URL. Верни связный фактологический пакет с полными URL из результатов поиска.`,
  });

  const searchedUrls = collectSearchUrls(
    research.steps.flatMap(step => step.toolResults),
  );
  if (searchedUrls.size === 0) throw new Error("WEB_RESEARCH_RETURNED_NO_SOURCES");

  const draft = await generateText({
    model,
    output: Output.object({ schema: issueSchema }),
    prompt: `На основе исследовательского пакета ниже создай выпуск AI Signal Daily за ${date} на русском языке.

Редакционные правила:
- Выбери от 1 до 8 действительно значимых сюжетов. Шесть — нормальная цель, но никогда не добавляй слабую новость ради количества.
- Ровно одна история lead. Rank начинается с 1 без повторов.
- Категории только MODELS, AGENTS, APPS, RESEARCH, BUSINESS, INFRA.
- Slug — уникальный латинский kebab-case.
- Каждая статья содержит минимум 1000 русских символов; важные сюжеты 2500–5000. Пиши как знающий IT-журналист: естественный ритм, конкретные факты, без пресс-релизного тона, SEO-фраз и выдуманных выводов.
- Чётко отделяй подтверждённые факты, заявления компаний и анализ. Не меняй имена, даты, цены и лимиты.
- excerpt — несколько содержательных предложений с фактами, не рекламный тизер.
- takeaway — самостоятельный практический блок под заголовком «А что мне с этого?»: кому доступно, когда, сколько стоит, ограничения и конкретный способ попробовать. Если практического эффекта нет, скажи прямо.
- У каждой статьи должен быть минимум один PRIMARY. Используй только точные URL из пакета. Не добавляй X-ссылки; xPosts всегда пустой массив.
- Для image.url используй локальные иллюстрации /signal-1.svg … /signal-6.svg по rank. alt — содержательное описание, credit можно опустить.
- publishedAt указывай только если точное время есть в пакете; иначе опусти.
- verification: CONFIRMED только для подтверждённых фактов, COMPANY_CLAIM для непроверенной позиции компании, ANALYSIS для интерпретации.
- Не вставляй отдельный заголовок «А что мне с этого?» в body: его содержимое находится только в takeaway.

Перед финальным ответом выполни humanization pass и затем fact-preservation check.

ИССЛЕДОВАТЕЛЬСКИЙ ПАКЕТ:
${research.text}`,
  });

  const payload = issueSchema.parse({
    ...draft.output,
    date,
    stories: draft.output.stories.map(story => ({
      ...story,
      image: {
        ...story.image,
        url: `/signal-${((story.rank - 1) % 6) + 1}.svg`,
      },
    })),
  });
  assertSourcesCameFromSearch(payload, searchedUrls);
  return payload;
}
