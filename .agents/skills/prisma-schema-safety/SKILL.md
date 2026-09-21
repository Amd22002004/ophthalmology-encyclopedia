---
name: prisma-schema-safety
description: "Безопасно изменять Prisma schema, миграции, generated client и seed. Использовать перед любым изменением prisma/schema.prisma, добавлением модели, поля, relation, индекса, миграции или data backfill."
---

# Безопасность Prisma schema

## Обязательное чтение

Прочитайте [`overview.md`](../../../docs/architecture/overview.md),
[`design-principles.md`](../../../docs/architecture/design-principles.md),
[`graph-model.md`](../../../docs/architecture/graph-model.md), относящийся документ
сущности, [`CHANGELOG.md`](../../../docs/architecture/CHANGELOG.md) и актуальные
[`prisma/schema.prisma`](../../../prisma/schema.prisma), [`prisma/seed.ts`](../../../prisma/seed.ts).

## Алгоритм

1. Подтвердите архитектурное решение через `project-architecture`; для наполнения
   данных схему не меняйте.
2. Сравните предлагаемое изменение с фактической schema, миграциями и seed.
3. Проектируйте только аддитивное изменение: nullable-поле, таблицу, индекс или
   новую join-таблицу. Не выполняйте `DROP`, `TRUNCATE`, `RENAME`, сужение типа и
   не удаляйте данные без отдельного явного одобрения.
4. Получите SQL через `prisma migrate diff`, проверьте его вручную на destructive
   операции и только после этого применяйте согласованный путь миграции.
5. Сгенерируйте Prisma Client, выполните `npm run prisma:validate`, typecheck и
   production build. Seed запускайте дважды только в разрешённой среде и проверяйте
   идемпотентность.
6. Не утверждайте, что production-БД обновлена, пока не проверены реальная БД,
   SQL и результат применения.
7. Передайте изменения в `documentation-maintenance`.
