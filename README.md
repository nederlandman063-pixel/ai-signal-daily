# AI Signal Daily

Закрытое русскоязычное AI-издание на Next.js 16. Главная страница показывает последний выпуск, архив хранит предыдущие дни, а защищённый editorial API принимает новые выпуски без изменения кода.

## Локальный запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

Создайте PostgreSQL и примените `db/migrations/001_initial.sql`. Сгенерируйте `AUTH_SECRET` командой `npx auth secret`. Сформируйте bcrypt-хэш пароля владельца с cost 12 или выше в доверенной среде и задайте его как `ADMIN_PASSWORD_HASH`; не вводите сам пароль аргументом команды, чтобы он не сохранился в истории shell. Для локальной визуальной разработки допустимо временно запустить `AUTH_BYPASS_LOCAL=1 npm run dev`; эта ветка кода работает только при `NODE_ENV=development` и показывает явно помеченный вымышленный образец. Production без базы показывает пустое состояние до первой публикации.

## Переменные окружения

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `EDITORIAL_API_SECRET`

Секреты задаются в Vercel, не в Git. `NEXT_PUBLIC_*` для привилегированных значений не используется.

## Проверки

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

В реальном выпуске применяйте только проверенные статьи. Подписание X-публикации полем `verified: true` — утверждение редактора после ручной проверки URL и содержания; сервер дополнительно проверяет домен и структуру ссылки.

Подробности: [архитектура](docs/ARCHITECTURE.md), [редакционный API](docs/EDITORIAL_API.md), [безопасность](docs/SECURITY.md), [деплой](docs/DEPLOYMENT.md).
