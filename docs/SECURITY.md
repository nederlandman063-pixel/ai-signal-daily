# Безопасность

- Читательские маршруты закрыты Auth.js; публичной регистрации нет.
- Editorial API проверяет отдельный серверный secret через constant-time comparison.
- Zod запрещает неизвестные категории, короткие статьи, локальные и не-HTTP источники, непроверенные X URL.
- SQL-параметры передаются через tagged templates; выпуск сохраняется транзакционно.
- `robots.txt` запрещает обход всего сайта, metadata выставляет noindex/nofollow/nosnippet.
- Секреты исключены `.gitignore`; `.env.example` содержит только имена и безопасный пример email.
- Ошибки API не возвращают SQL или значения секретов. Привилегированных `NEXT_PUBLIC_*` нет.

Перед production: поставить длинные случайные `AUTH_SECRET` и `EDITORIAL_API_SECRET`, хэшировать уникальный пароль bcrypt cost 12+, ограничить доступ к базе, включить Vercel Deployment Protection для preview и регулярно ротировать секреты.
