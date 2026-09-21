---
name: documentation-maintenance
description: "Проверять и обновлять архитектурную документацию, ROADMAP и CHANGELOG после изменения модели, графа, маршрутов или готовности механизма. Использовать в конце архитектурной задачи, schema change, новой сущности, нового раздела или существенного изменения поведения."
---

# Поддержка документации

## Обязательное чтение

Прочитайте [`overview.md`](../../../docs/architecture/overview.md),
[`graph-model.md`](../../../docs/architecture/graph-model.md),
[`design-principles.md`](../../../docs/architecture/design-principles.md),
[`UI_GUIDELINES.md`](../../../docs/architecture/UI_GUIDELINES.md),
[`CONTENT_GUIDELINES.md`](../../../docs/architecture/CONTENT_GUIDELINES.md),
[`ENTITY_GRAPH.md`](../../../docs/architecture/ENTITY_GRAPH.md),
[`ROADMAP.md`](../../../docs/architecture/ROADMAP.md),
[`CHANGELOG.md`](../../../docs/architecture/CHANGELOG.md), релевантный документ
сущности и фактические изменённые файлы.

## Алгоритм

1. Сопоставьте каждое изменение с документацией, которая описывает этот инвариант,
   модель, связь, маршрут или готовность.
2. Обновите `overview.md` и `graph-model.md` только при изменении модели или графа;
   обновите документ сущности при изменении её контракта или отображения.
   `UI_GUIDELINES.md`, `CONTENT_GUIDELINES.md` и `ENTITY_GRAPH.md` обновляйте только
   когда меняется соответствующий SSOT, а не ради пересказа выполненной задачи.
3. Обновите `ROADMAP.md` только когда фактическая готовность механизма или статус
   наполнения изменились; не выдавайте план за реализованный факт.
4. Добавьте в `CHANGELOG.md` только архитектурно значимое решение и его причину.
5. Не копируйте те же правила в README, Skills или несколько документов. Оставьте
   ссылку на единственный источник истины.
6. Проверьте ссылки, даты, статусы и соответствие `prisma/schema.prisma` и коду.
7. Если изменений документации не требуется, явно зафиксируйте основание в отчёте.
