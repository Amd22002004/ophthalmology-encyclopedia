---
name: production-deployment
description: "Готовить и выполнять безопасный production-деплой энциклопедии с проверкой build, Prisma, SQL, PM2 и rollback. Использовать только когда пользователь явно запросил деплой или production-проверку."
---

# Production deployment

## Обязательное чтение

Прочитайте [`design-principles.md`](../../../docs/architecture/design-principles.md),
[`ROADMAP.md`](../../../docs/architecture/ROADMAP.md), [`README.md`](../../../README.md),
актуальные `package.json`, `prisma/schema.prisma` и
[`PRODUCTION.md`](../../../docs/architecture/PRODUCTION.md). Сведения о целевом
окружении берите через `project-infrastructure`; не исследуйте сервер заново без
признаков устаревшего runbook или диагностической задачи.

## Алгоритм

1. Подтвердите целевой сервер, ветку или revision, способ доступа, окно работ и
   явное разрешение на внешние действия.
2. Проверьте чистоту и состав релиза, окружение по `PRODUCTION.md`, секреты без их
   раскрытия и план отката до любых изменений на сервере.
3. Выполните локальные `prisma validate`, typecheck, lint и production build.
4. При изменении schema получите SQL через `prisma migrate diff`, проверьте его на
   destructive операции и применяйте только согласованную аддитивную миграцию.
5. Сделайте резервную копию или иной документированный rollback-артефакт, затем
   следуйте `PRODUCTION.md` для доставки и PM2 reload/restart.
6. Проверьте статус PM2, логи, health/ключевые маршруты и реальную схему БД.
7. Отчитайте отдельно локальные проверки и подтверждённые production-факты; при
   отсутствии любого подтверждения не называйте деплой завершённым.
