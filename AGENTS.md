# Офтальмологическая энциклопедия — AI entry point

Проект — доказательная энциклопедия и граф знаний. Достоверность, единственный
источник факта и двусторонние связи важнее скорости наполнения. Не придумывайте
факты, связи или медицинские выводы: пустое поле честнее неподтверждённого.

## Product First

Перед кодом оцените влияние решения на пользователя, архитектуру, граф знаний,
SEO, масштабируемость и единообразие интерфейса. Код является следствием
принятого продуктового решения, а не наоборот.

## Канонические источники

- Архитектура и инварианты: [`docs/architecture/`](./docs/architecture/).
- Фактическая модель данных: [`prisma/schema.prisma`](./prisma/schema.prisma).
- Текущий статус и история архитектуры: [`ROADMAP.md`](./docs/architecture/ROADMAP.md)
  и [`CHANGELOG.md`](./docs/architecture/CHANGELOG.md).
- Production-инфраструктура и runbook: [`PRODUCTION.md`](./docs/architecture/PRODUCTION.md).
- UI-философия: [`UI_GUIDELINES.md`](./docs/architecture/UI_GUIDELINES.md).
- Редакционная политика: [`CONTENT_GUIDELINES.md`](./docs/architecture/CONTENT_GUIDELINES.md).
- Семантический граф сущностей: [`ENTITY_GRAPH.md`](./docs/architecture/ENTITY_GRAPH.md).
- Правовая инфраструктура и аудит обработки данных: [`LEGAL.md`](./docs/architecture/LEGAL.md).
- Код, данные и файлы — фактическое состояние реализации. Документация не
  загружается автоматически: читайте только материалы, указанные подходящим Skill.

## Маршрутизация задач

Перед работой выберите один или несколько Skills из [`.agents/skills/`](./.agents/skills/).
Skills содержат алгоритм, а не вторую копию архитектуры.

| Задача | Skill |
| --- | --- |
| Новая сущность, поле, раздел или архитектурное решение | `project-architecture` + `entity-consistency` |
| Новая или изменённая энциклопедическая страница | `encyclopedia-editor` + `entity-consistency` + `content-quality` + `medical-seo` |
| Prisma schema, миграция или seed после схемы | `prisma-schema-safety` + `entity-consistency` |
| Новая связь или аудит полноты перелинковки | `knowledge-graph` + `entity-network` |
| Расследование Ассоциации и доказательная база | `investigation-publication` + `evidence-validation` + `knowledge-graph` + `entity-network` + `medical-seo` + `content-quality` |
| Новость, обвинение или юридически значимое утверждение | `evidence-validation` + `content-quality` + `medical-seo` |
| Нормативная база, юридический чек-лист или аудит медорганизации | `regulatory-compliance` + `evidence-validation` + применимые графовые Skills |
| Редактура публичного медицинского материала | `encyclopedia-editor` + `content-quality` + `medical-seo` |
| SEO, JSON-LD, canonical и внутренняя перелинковка | `medical-seo` |
| Визуальное изменение или UI-проверка | `ui-review` → `UI_GUIDELINES.md` + `visual-critic` |
| Контент, редактура или публичный текст | `content-quality` → `CONTENT_GUIDELINES.md` |
| Сущности, связи и полнота карточки | `knowledge-graph` → `ENTITY_GRAPH.md` + `entity-network` |
| Пользовательская функция или изменение сценария | `product-owner` + применимые технические Skills |
| Производительность страницы или загрузчиков | `performance-review` |
| Production-инфраструктура, сервер, PM2, nginx, SSL, PostgreSQL, env или rollback | `project-infrastructure` |
| Подготовка или выполнение production-деплоя | `project-infrastructure` + `production-deployment` + `performance-review` |
| Аудит после успешного production-деплоя | `release-audit` |
| Финальная проверка перед публикацией | `release-audit` или workflow `review-before-deploy` |
| Проверка необходимости обновить документацию | `documentation-maintenance` |
| Персональные данные, согласие, cookies и юридическая инфраструктура | `regulatory-compliance` + `project-architecture` + `medical-seo` |

Для повторяемых операций Antigravity использует [`.agents/workflows/`](./.agents/workflows/).
Workspace Rule в [`.agents/rules/`](./.agents/rules/) только подключает этот файл
и не дублирует его.

## Definition of Done

Считайте задачу завершённой только после самопроверки подходящими Skills. Зафиксируйте
результат каждого применимого пункта; для неприменимого укажите причину в отчёте.

- Пройдены production build и TypeScript-проверка.
- При затрагивании данных синхронизированы Prisma schema, client, миграции и seed.
- До реализации и перед сдачей проверен продуктовый эффект через `product-owner`,
  если менялся пользовательский сценарий.
- Для публичной страницы проверены SEO, canonical, OpenGraph, Schema.org и ссылки.
- Для UI проверены интерфейс, адаптивность и вывод `visual-critic`.
- Для новых или изменённых отношений проверен Knowledge Graph и обратные связи.
- Для расследований, новостей и юридически значимых утверждений проверена
  доказательная база через `evidence-validation`.
- Перед публикацией публичного изменения получен вывод `release-audit`.
- Проверена необходимость обновить архитектурную документацию, ROADMAP и CHANGELOG.
- Выполнена самопроверка каждым Skill из выбранной маршрутизации.
- Подготовлен краткий отчёт с проверками, ограничениями и неприменимыми пунктами.

Для задачи, изменяющей только AI-инфраструктуру, вместо build, TypeScript и Prisma
проверьте валидность Skills, ссылок, маршрутизации и отсутствие дублирования.

## Границы работы

- Предпочитайте добавление данных и достоверных связей изменению схемы.
- Перед изменением Next.js-кода прочитайте относящееся руководство из
  `node_modules/next/dist/docs/`.
- Не выполняйте внешние, destructive или production-действия без явного запроса
  пользователя и проверяемого runbook.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
