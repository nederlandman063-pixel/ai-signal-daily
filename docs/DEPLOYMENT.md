# Деплой на Vercel

1. Импортировать GitHub-репозиторий в Vercel с framework preset Next.js.
2. Создать PostgreSQL (Neon, Supabase или другой совместимый сервис), применить миграцию `db/migrations/001_initial.sql`.
3. Добавить все переменные из `.env.example` в Production и Preview. Не добавлять их в GitHub.
4. Настроить production branch `main`; остальные ветки останутся preview.
5. Оставить Production публичным. Deployment Protection можно включить для Preview, но не для Production. Проверить главную, публикацию тестового выпуска, archive/article/search и `robots.txt`.
6. Публиковать production после успешного `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Для удалённых изображений используйте доверенное хранилище с HTTPS. Внешние изображения сейчас отдаются непосредственно из браузера без referrer; Next Image оптимизация для них отключена, чтобы авторизованный редактор мог безопасно сменить медиаисточник без изменения кода. Для максимальной скорости перенесите изображения в доверенный CDN и добавьте его hostname в `next.config.ts`.
