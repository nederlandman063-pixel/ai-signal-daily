# Деплой на Vercel

1. Импортировать GitHub-репозиторий в Vercel с framework preset Next.js.
2. Подключить PostgreSQL (рекомендуется Neon из Vercel Marketplace). Интеграция должна создать `DATABASE_URL`; миграция применяется автоматически при следующем build.
3. Добавить `EDITORIAL_API_SECRET` и `CRON_SECRET` как Production Secrets. `AI_GATEWAY_MODEL` можно оставить пустым или задать как Config. Не добавлять значения в GitHub.
4. Настроить production branch `main`; остальные ветки останутся preview.
5. Оставить Production публичным. Deployment Protection можно включить для Preview, но не для Production. Проверить главную, archive/article/search, `robots.txt` и защищённый cron. Cron из `vercel.json` запускается ежедневно в 07:00 UTC.
6. Публиковать production после успешного `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Для удалённых изображений используйте доверенное хранилище с HTTPS. Внешние изображения сейчас отдаются непосредственно из браузера без referrer; Next Image оптимизация для них отключена, чтобы авторизованный редактор мог безопасно сменить медиаисточник без изменения кода. Для максимальной скорости перенесите изображения в доверенный CDN и добавьте его hostname в `next.config.ts`.

AI Gateway аутентифицируется через Vercel OIDC без `OPENAI_API_KEY`. Для первого платного запроса аккаунту Vercel может потребоваться подтверждённый способ оплаты или положительный баланс AI Gateway Credits. Если кредитов нет, cron безопасно завершится ошибкой и не изменит текущий выпуск.
