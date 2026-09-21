---
name: project-infrastructure
description: "Использовать для любых задач про production-инфраструктуру энциклопедии: deploy, production, release, PM2, nginx, SSL, certbot, VPS, сервер, PostgreSQL, Prisma db push, restart, rollback, env и проверку production. Skill читает docs/architecture/PRODUCTION.md как SSOT и запрещает повторно исследовать стабильную инфраструктуру без причины."
---

# Project infrastructure

## Область ответственности

Используйте этот Skill как вход в production-инфраструктуру проекта. Он не выполняет
релиз вместо `production-deployment` и не оценивает производительность вместо
`performance-review`.

Единственный источник фактов об окружении:
[`docs/architecture/PRODUCTION.md`](../../../docs/architecture/PRODUCTION.md).

## Главное правило

Если пользователь не просил изменить инфраструктуру, не исследуйте сервер заново:

- не ищите путь проекта;
- не определяйте PM2-процесс;
- не ищите nginx-конфиг;
- не проверяйте SSL/certbot для обычного деплоя;
- не угадывайте порт, hostname, cwd или схему доставки;
- не выводите env-секреты.

Используйте значения и команды из `PRODUCTION.md`.

## Когда повторная проверка допустима

Проверяйте сервер read-only только если:

1. пользователь сообщил, что инфраструктура изменилась;
2. `PRODUCTION.md` отсутствует или явно противоречит фактической ошибке;
3. задача является диагностикой production-проблемы;
4. пользователь явно попросил обновить production-документацию.

В отчёте отделяйте факты из `PRODUCTION.md` от свежих read-only проверок.

## Алгоритм

1. Прочитайте `docs/architecture/PRODUCTION.md` полностью.
2. Определите тип задачи:
   - релиз приложения -> подключите `production-deployment`;
   - производительность -> подключите `performance-review`;
   - nginx/SSL/PM2/PostgreSQL/ENV -> оставайтесь в рамках этого Skill и выполняйте
     только запрошенное;
   - Prisma/schema/data -> дополнительно подключите `prisma-schema-safety`.
3. До внешних действий проверьте, есть ли явное разрешение пользователя на
   production-изменения.
4. Следуйте `PRODUCTION.md` как runbook. Не подменяйте его командами из памяти.
5. Если документ устарел, остановитесь, зафиксируйте расхождение и предложите
   обновить `PRODUCTION.md` перед дальнейшей работой.
6. После infrastructure-задачи проверьте, нужно ли обновить `PRODUCTION.md`,
   `AGENTS.md`, deployment workflow или связанные Skills.

## Разделение с production-deployment

`project-infrastructure` отвечает на вопрос «как устроен production».
`production-deployment` отвечает на вопрос «как безопасно выпустить релиз».

Не дублируйте команды и параметры окружения в этом Skill. Если нужно изменить
инфраструктурный факт, меняйте `PRODUCTION.md`.
