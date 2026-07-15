# Модель `Disease`

> Статус: **v1, заморожено**. Сверено с `prisma/schema.prisma`.

## 1. Структура

| Поле | Тип | Назначение |
|---|---|---|
| `id` | `String` | PK, cuid |
| `slug` | `String` @unique | URL: `/diseases/[slug]`. Транслит кириллицы: `miopiya`, `keratokonus` |
| `title` | `String` | Название |
| `summary` | `String?` | Краткое описание (карточки каталога, meta description) |
| `description` | `String?` | Полное описание |
| `icdCode` | `String?` | Код МКБ-10 |
| `symptoms` | `String[]` | Симптомы списком |
| `diagnostics` | `String?` | Диагностика |
| `treatment` | `String?` | Лечение и коррекция |
| `categoryId` | `String?` | FK → `DiseaseCategory` |
| `createdAt` / `updatedAt` | `DateTime` | Служебные |

### Про `slug`

Слаги — **транслитерация кириллицы**, а не английский перевод:
`miopiya` (не `myopia`), `astigmatizm` (не `astigmatism`), `keratokonus`.
Правило единое для всех заболеваний. Английские варианты дадут 404.

## 2. Связи

Все связи `Disease` — **прямые**, вычисляемых нет.

| Связь | Тип | Таблица | Смысл |
|---|---|---|---|
| → `DiseaseCategory` | прямая | `categoryId` (`SetNull`) | Категория |
| ↔ `Procedure` | прямая | `DiseaseOnProcedure` | Чем лечится |
| ↔ `Doctor` | прямая | `DoctorOnDisease` | Врачи по направлению |
| ↔ `Clinic` | прямая | `ClinicOnDisease` | Где лечат |
| ↔ `Equipment` | прямая | `DiseaseOnEquipment` | Каким оборудованием |
| ↔ `Publication` | прямая | `PublicationOnDisease` | Редакционные материалы |
| ↔ `ScientificWork` | прямая | `ScientificWorkOnDisease` | Научные работы **по теме** |
| ↔ `ClinicalGuideline` | прямая | `DiseaseOnClinicalGuideline` | Клинические рекомендации |

### Разница между `DoctorOnDisease` и `ScientificWorkOnDisease`

Обе ведут к `Disease`, но это **разные утверждения**:

| Связь | Утверждение |
|---|---|
| `DoctorOnDisease` | «Врач работает по этому направлению» |
| `ScientificWorkOnDisease` | «Работа **исследует** это заболевание» |

Их нельзя выводить друг из друга. Подробное обоснование с реальным примером —
[`graph-model.md`](./graph-model.md) §4.2.

## 3. Правила наполнения

1. `slug` — транслит кириллического названия, стабилен (не меняется при правке `title`).
2. `icdCode` — только из официального справочника МКБ-10.
3. `symptoms` — список коротких формулировок, не сплошной текст.
4. Связь `Disease ↔ Equipment` создаётся, если аппарат применяется при этом
   заболевании по документации производителя.
5. Связь `Disease ↔ ScientificWork` создаётся **только** если заболевание реально
   исследуется в работе.

## 4. Правила перелинковки

Двусторонность обязательна. Страница заболевания показывает (сайдбар,
`disease-template.tsx`):

| Блок | Источник |
|---|---|
| Врачи | `DoctorOnDisease` |
| Клинические рекомендации | `DiseaseOnClinicalGuideline` |
| Публикации | `PublicationOnDisease` |
| Процедуры | `DiseaseOnProcedure` |
| **Научные работы** | `ScientificWorkOnDisease` (мета: тип · автор · год) |
| **Оборудование** | `DiseaseOnEquipment` (мета: производитель) |

Пустые блоки не рендерятся.

## 5. SEO

- Canonical `/diseases/[slug]`; description из `summary`.
- Schema.org: `MedicalCondition` (+ `code` / `MedicalCode` `ICD-10` при наличии
  `icdCode`) + `BreadcrumbList`.
- Заголовки блоков — реальные heading-теги.
