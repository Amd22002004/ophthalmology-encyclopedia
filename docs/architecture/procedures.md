# Модель `Procedure`

> Статус: **v1, заморожено**. Сверено с `prisma/schema.prisma`.

## 1. Структура

| Поле | Тип | Назначение |
|---|---|---|
| `id` | `String` | PK, cuid |
| `slug` | `String` @unique | URL: `/procedures/[slug]` |
| `title` | `String` | Название |
| `summary` | `String?` | Краткое описание (карточки, meta description) |
| `description` | `String?` | Полное описание |
| `categoryId` | `String?` | FK → `ProcedureCategory` |
| `createdAt` / `updatedAt` | `DateTime` | Служебные |

Модель намеренно компактная: `Procedure` — это **узел графа**, её ценность в связях,
а не в объёме собственных полей.

### Про `slug`

Латинские названия сохраняются как есть (`lasik`, `femto-lasik`, `smile-pro`, `slt`),
кириллические — транслитерируются (`krosslinking`, `vitrektomiya`,
`fakoemulsifikatsiya-katarakty`).

## 2. Связи

Все связи `Procedure` — **прямые**, вычисляемых нет.

| Связь | Тип | Таблица | Смысл |
|---|---|---|---|
| → `ProcedureCategory` | прямая | `categoryId` (`SetNull`) | Категория |
| ↔ `Disease` | прямая | `DiseaseOnProcedure` | Что лечит |
| ↔ `Doctor` | прямая | `DoctorOnProcedure` | Кто выполняет |
| ↔ `Clinic` | прямая | `ClinicOnProcedure` | Где выполняется |
| ↔ `Equipment` | прямая | `ProcedureOnEquipment` | На каком оборудовании |
| ↔ `Publication` | прямая | `PublicationOnProcedure` | Редакционные материалы |
| ↔ `ScientificWork` | прямая | `ScientificWorkOnProcedure` | Научные работы **по теме** |

### Разница между `DoctorOnProcedure` и `ScientificWorkOnProcedure`

| Связь | Утверждение |
|---|---|
| `DoctorOnProcedure` | «Врач выполняет эту процедуру» |
| `ScientificWorkOnProcedure` | «Работа **исследует** эту методику» |

Не выводятся друг из друга. См. [`graph-model.md`](./graph-model.md) §4.2.

## 3. Правила использования

1. **Одна процедура — одна сущность.** Не заводить дубликаты под разные формулировки.
   Если процедуры нет в справочнике — её нужно добавить, а не подменять близкой.
2. **Конкретность.** В справочнике живут конкретные методики (`smile-pro`,
   `femto-lasik`), а не обобщения вроде «лазерная коррекция зрения». Обобщённые
   формулировки не имеют собственной страницы и не могут быть узлом графа.
3. **Связь с оборудованием — по документации производителя.**
   Пример: `ZEISS VisuMax 800` связан с `femto-lasik` (формирование лоскута), но
   **не** с `lasik` — последний выполняется эксимерным лазером.
4. Связь `Procedure ↔ ScientificWork` — только если методика реально исследуется
   в работе.

## 4. Правила отображения

Страница процедуры (`procedure-template.tsx`), сайдбар:

| Блок | Источник |
|---|---|
| Заболевания | `DiseaseOnProcedure` |
| Врачи | `DoctorOnProcedure` |
| **Научные работы** | `ScientificWorkOnProcedure` (мета: тип · автор · год) |
| Оборудование | `ProcedureOnEquipment` |

## 5. SEO

- Canonical `/procedures/[slug]`; description из `summary`.
- Schema.org: `MedicalProcedure` + `BreadcrumbList`.
- Двусторонняя перелинковка со всеми связанными сущностями.
