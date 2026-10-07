# Editorial API

## Публикация

`POST /api/editorial/issues`

Заголовок: `Authorization: Bearer <EDITORIAL_API_SECRET>`. Content-Type: `application/json`. Запись выпуска, статей и источников выполняется одной транзакцией. Успех: `201`. Ошибки: `401` — токен, `422` — контракт, `409` — дата или slug уже существуют, `500` — база.

```json
{
  "date": "2026-10-01",
  "title": "Название выпуска",
  "summary": "Краткая редакционная рамка выпуска",
  "stories": [{
    "rank": 1,
    "lead": true,
    "category": "MODELS",
    "title": "Заголовок",
    "slug": "story-slug",
    "dek": "Вводный абзац",
    "excerpt": "Несколько полезных предложений для раскрытия карточки",
    "body": "Текст статьи длиной не менее 1000 символов",
    "takeaway": "Содержимое обязательного блока «А что мне с этого?»",
    "image": { "url": "https://example.com/image.jpg", "alt": "Описание", "credit": "Автор" },
    "verification": "CONFIRMED",
    "publishedAt": "2026-10-01T10:00:00Z",
    "readTime": 5,
    "sources": [{ "label": "Документация", "url": "https://example.com/source", "type": "PRIMARY", "isPrimary": true, "publishedAt": "2026-10-01T08:00:00Z" }],
    "xPosts": [{ "author": "@author", "url": "https://x.com/author/status/1", "verified": true }]
  }]
}
```

Категории: `MODELS`, `AGENTS`, `APPS`, `RESEARCH`, `BUSINESS`, `INFRA`. Статусы: `CONFIRMED`, `COMPANY_CLAIM`, `ANALYSIS`. В выпуске ровно один lead; slug и rank уникальны. Каждой статье нужен первичный источник, body от 1000 символов и практический takeaway от 120 символов. Изображение — локальный путь к файлу или HTTPS URL. X-запись принимается только с `verified: true` и ссылкой вида `https://x.com/<author>/status/<id>`. Проверка подлинности и смысла поста до отправки лежит на редакторе; URL без ручной проверки публиковать нельзя.

Проверка: `GET /api/editorial/issues/YYYY-MM-DD` с тем же Bearer token.

Редакционный процесс: **RESEARCH → PRIMARY-SOURCE VERIFICATION → CROSS-CHECK → ARTICLE DRAFT → HUMANIZATION PASS → FACT-PRESERVATION CHECK → PUBLISH**. Humanization убирает повторяющиеся AI-обороты, рекламные формулировки, искусственные выводы, лишние заголовки и тире. Он меняет ритм текста, но никогда не меняет имена, даты, цены, лимиты и фактические утверждения.
