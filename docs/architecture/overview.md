# Архитектура энциклопедии — общий обзор

> **Статус:** архитектура **v1.5 — нормативный граф, независимый контроль и
> безопасная публикация `ScientificWork`** зафиксирована в текущем исходном
> дереве. Для независимого контроля реализованы и локально проверены schema,
> corpus, publication gates, loaders, search и UI, включая двойной seed и
> desktop/mobile; эта запись не удостоверяет состояние production.
> Дата фиксации v1: 2026-07-15. Аддитивное расширение ScientificWork ↔ Equipment:
> 2026-08-06; приватный реестр обращений: 2026-08-07; нормативный граф:
> 2026-08-12; единый publication gate научных работ: 2026-08-12; независимый
> контроль качества условий: 2026-08-13. Источник истины:
> `prisma/schema.prisma` + эта документация.
> Любое изменение схемы допускается только после отдельного архитектурного решения
> с одновременным обновлением этих документов.

## 1. Назначение

Офтальмологическая энциклопедия — профессиональный справочник, в котором медицинская
информация связана в **граф знаний**, а не разложена по изолированным каталогам.

Ключевое отличие от типового каталога клиник: самостоятельные публичные сущности
(врач, заболевание, процедура, аппарат, научная работа, нормативный акт) — узлы
графа со своими страницами. Подчинённые, доказательные и edge-модели отображаются в
контексте владельца. Достоверность связей — главный актив проекта; ложная связь
обесценивает энциклопедию сильнее, чем её отсутствие.

## 2. Состав сущностей

### 2.1 Самостоятельные публичные сущности

Публичная запись имеет стабильный `slug` и страницу. Nullable `slug` у legacy-
совместимых строк (например, `ScientificWork`) означает, что строка без `slug` не
попадает в публичный маршрут. Для `ScientificWork` наличие slug недостаточно:
каталог, detail, обратные связи, поиск, счётчики и sitemap используют единый gate
публикации, доказательной проверки и прав на локальные ассеты. Полный контракт —
в [`publications.md`](./publications.md).

| Модель | Назначение | Раздел |
|---|---|---|
| `Disease` | Заболевание | `/diseases/[slug]` |
| `Procedure` | Процедура / методика лечения | `/procedures/[slug]` |
| `Doctor` | Врач | `/doctors/[slug]` |
| `Clinic` | Клиника | `/clinics/[slug]` |
| `Equipment` | Оборудование | `/equipment/[slug]` |
| `ScientificWork` | Научная работа врача (диссертация, патент, статья…) | `/publications/[slug]` |
| `Publication` | Редакционный / журнальный материал | `/publications/[slug]` |
| `Supplier` | Поставщик оборудования | `/suppliers/[slug]` |
| `ClinicalGuideline` | Клиническая рекомендация | `/guidelines/[slug]` |
| `Regulation` | Нормативный документ | `/regulations/[slug]` |
| `HistoryEntry` | Материал по истории офтальмологии | `/history/[slug]` |
| `Innovation` | Материал об инновациях | `/innovations/[slug]` |
| `Investigation` | Расследование Ассоциации | `/investigations/[slug]` |
| `News` | Редакционная входная точка | `/news/[slug]` |

### 2.1.1 Операционный контур событий

Публичные конференции реализуются через операционные модели `Event`,
`EventSpeaker`, `EventTalk` и приватный реестр регистрации. Они не являются
самостоятельными медицинскими узлами графа и не создают новые `Doctor` или
`Clinic`; подтверждённые связи со существующими врачами могут использоваться
только как редакционная ссылка спикера. Постоянные QR-маршруты, snapshot-fallback,
публикационные флаги и юридический gate регистрации описаны в
[`events.md`](./events.md).

### 2.2 Подчинённые и контекстные сущности

| Модель | Принадлежит | Назначение |
|---|---|---|
| `EquipmentSpec` | `Equipment` | Строка таблицы техпараметров (группа/параметр/значение) |
| `RegulationEdition` | `Regulation` | Проверенная редакция и период действия |
| `RegulationSource` | `Regulation` / `RegulationEdition` | SSOT официального источника акта или редакции |
| `RegulationProvision` | `RegulationEdition` | Атомарная норма с точным структурным указателем |
| `RegulatoryCheck` | `RegulationProvision` | Рабочий вопрос, факт и тип первичного документа |
| `RegulationEquipmentRequirement` | `RegulationProvision` | Строка стандарта оснащения подразделения |
| `InvestigationEquipmentInstance` | `Investigation` | Конкретный экземпляр, не свойство модели Equipment |
| `InvestigationRegulatoryAssessment` | `Investigation` | Применение нормы к факту, периоду и доказательствам |
| `InvestigationAssessmentEvidence` | `InvestigationRegulatoryAssessment` | Роль документа в оценке и проверка происхождения |
| `InvestigationEquipmentInstanceEvidence` | `InvestigationEquipmentInstance` | Первичный документ идентификации экземпляра |
| `InvestigationRegistryCheck` | `Investigation` | Воспроизводимая попытка официального реестрового поиска |
| `InvestigationSection` / `InvestigationTimelineEvent` / `InvestigationDocument` | `Investigation` | Публичные доказательные узлы расследования |
| `IndependentControlMethodology` | `/independent-control` | Ненормативная методика и библиографическая карточка рабочего инструмента |
| `IndependentControlSource` | `IndependentControlMethodology` | Локальный или официальный источник с отдельным правовым gate файла |
| `IndependentControlCriterion` | `IndependentControlMethodology` | Проверяемый критерий, вопрос, первичный документ и граница применимости |
| `IndependentControlCriterionNorm` | `IndependentControlCriterion` / `RegulatoryCheck` | Проверенная связь критерия с точной нормативной редакцией |
| `InvestigationIndependentControlAssessment` | `Investigation` / `IndependentControlCriterion` | Применение критерия к клинике, периоду и доказательствам |
| `InvestigationIndependentControlEvidence` | `InvestigationIndependentControlAssessment` | Роль документа того же расследования в оценке критерия |

### 2.3 Справочники (таксономия)

| Модель | Назначение |
|---|---|
| `Specialty` | Специальность (врачи, клиники) |
| `DiseaseCategory` | Категория заболеваний |
| `ProcedureCategory` | Категория процедур |
| `EquipmentCategory` | Категория оборудования |
| `Region` | Регион |
| `RegulationTopic` | Контролируемая тема нормативного аудита |

### 2.4 Служебные

| Модель | Назначение |
|---|---|
| `AdminUser` + enum `AdminRole` | Учётная запись админ-панели; session version и hash-only `AdminPasswordResetToken` |
| `Appeal` | Приватное обращение и его классификация |
| `AppealAttachment` | Метаданные приватного вложения |
| `AppealNote` | Внутренний комментарий сотрудника |
| `AppealStatusHistory` | История изменения статуса |
| `AppealNotification` | Outbox email-уведомления с per-recipient retry state |
| `AppealConsentTemplate` | Версионируемая конфигурация согласия |
| `CooperationApplication` + history/notes/notifications/attachment | Приватная заявка на сотрудничество; не является узлом графа и не создаёт автоматически профиль или членство |
| `User` + `Invitation` + `PasswordResetToken` | Учётная запись и hash-only auth lifecycle участника; не публичные узлы графа |
| `CooperationEntityMatch` + `UserDoctorLink` + `UserClinicAccess` | Подтверждаемая access-связь заявки/User с существующим Doctor/Clinic; не медицинские связи графа |
| `InvitationDelivery` + `AuthRateLimitBucket` + `AuthAuditEvent` | Delivery, rate limit и audit инфраструктура P1.1 без raw secrets |

Почтовые outbox-модели используют один общий runtime-контракт: сохранённые
`recipients` и `deliveredRecipients`, lock lease и backoff. Это не новая сущность
графа и не дублирование операционных заявок.

### 2.5 Связующие и edge-модели

`DiseaseOnProcedure`, `DoctorOnDisease`, `DoctorOnProcedure`, `DoctorOnSpecialty`,
`DoctorOnClinic`, `DoctorOnEquipment`, `ClinicOnSpecialty`, `ClinicOnSupplier`,
`ClinicOnDisease`, `ClinicOnProcedure`, `ClinicOnPublication`, `ClinicOnEquipment`,
`ProcedureOnEquipment`, `DiseaseOnEquipment`, `SupplierOnEquipmentCategory`,
`ScientificWorkOnDisease`, `ScientificWorkOnProcedure`, `ScientificWorkOnEquipment`,
`PublicationOnDisease`, `PublicationOnProcedure`, `DiseaseOnClinicalGuideline`,
`InvestigationOnClinic`, `InvestigationOnEquipment`, `InvestigationOnDisease`,
`InvestigationOnProcedure`, `NewsOnInvestigation`.

Четыре `InvestigationOn*` связи с clinic/equipment/disease/procedure являются
публикуемыми доказательными edge-узлами и имеют собственные `isPublished`,
`publishedAt` и `evidenceValidatedAt`; видимость родителя их не заменяет.

Нормативный и расследовательский граф дополнительно использует
`RegulationOnTopic`, `RegulationRelation`, `IndependentControlCriterionNorm`,
`InvestigationAssessmentEvidence`, `InvestigationIndependentControlEvidence` и
`InvestigationEquipmentInstanceEvidence`. Это edge-модели с разной семантикой:
чистые M:N связи используют составной ключ, а связь с собственными правовыми или
доказательными метаданными может иметь отдельный `id` / `@@unique`.

### 2.6 ⚠️ Сущность `Organization` не существует

В постановке задачи упоминалась сущность `Organization`. **В схеме её нет и никогда не было.**
Документация описывает только фактическое состояние `prisma/schema.prisma`.

Роли, которые могла бы играть `Organization`, сейчас закрыты иначе:

- организация-поставщик → `Supplier`;
- медицинская организация → `Clinic` (с полями `legalName`, `inn`, `kpp`, `ogrn`, `license`);
- организация-место защиты научной работы → строковое поле `ScientificWork.organization`;
- производитель оборудования → строковое поле `Equipment.manufacturer`.

Если в будущем потребуется единый справочник юрлиц — это **новое архитектурное решение**,
а не «доописание» существующей модели.

## 3. Схема верхнего уровня

```
                         ┌───────────────┐
                         │    Region     │
                         └───────┬───────┘
                        ┌────────┴────────┐
                        ▼                 ▼
                  ┌──────────┐      ┌──────────┐
      Specialty ──│  Doctor  │──────│  Clinic  │── Supplier
                  └────┬─────┘      └────┬─────┘
        ┌──────────────┼──────────┬──────┴───────┐
        ▼              ▼          ▼              ▼
  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐
  │  Disease  │──│ Procedure │──│Equipment │  │Publication│
  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └───────────┘
        │              │             │
        │              │        ┌────┴──────────┐
        │              │        │ EquipmentSpec │
        │              │        └───────────────┘
        └──────┬───────┘
               ▼
      ┌────────────────┐        ┌───────────────────┐
      │ ScientificWork │────────│      Doctor       │
      └────────────────┘ автор  └───────────────────┘

┌────────────┐   ┌─────────┐   ┌───────────┐   ┌───────────────┐
│ Regulation │──▶│ Edition │──▶│ Provision │──▶│ RegulatoryCheck│
└────────────┘   └─────────┘   └───────────┘   └───────┬───────┘
                              ┌────────────────────────┼──────────────┐
                              ▼                        ▼              ▼
                    ┌───────────────────┐    ┌──────────────────┐  ┌──────────┐
                    │  Критерий оценки  │───▶│   Investigation  │──│ Evidence │
                    └─────────▲─────────┘    │ assessment/facts │  └──────────┘
                              │              └──────────────────┘
                    ┌─────────┴─────────┐
                    │  Методика оценки  │
                    └───────────────────┘
```

Полная и точная карта связей — в [`graph-model.md`](./graph-model.md).

## 4. Принципы построения графа знаний

1. **Связь отражает реальность, а не удобство.** Если факт не подтверждён источником —
   связи нет. Пустой раздел лучше ложного.
2. **Двусторонность по умолчанию.** Если A ссылается на B, страница B показывает A.
   Защитное исключение: `/regulations` остаётся нейтральным и не показывает
   расследования, клиники и экземпляры; публичная связь идёт только
   `Investigation -> Regulation`.
3. **Связь именуется по смыслу.** «Заболевания в исследовании» и «Направления врача» —
   разные вещи и разные связи, даже если ведут на один и тот же `Disease`.
4. **Транзитивность — только когда она логически верна.** Клиники научной работы
   выводятся через автора (это правда: автор действительно там работает). Заболевания
   работы через автора выводить нельзя — направления врача ≠ тема его работы.
5. **Данные не дублируются.** У факта один владелец (SSOT).

Для нормативных источников SSOT — `RegulationSource`; scalar URL в `Regulation` и
`RegulationEdition` используются только как контролируемые проекции или legacy-
совместимость. Методика независимого контроля не становится нормативным владельцем:
`IndependentControlCriterionNorm` лишь связывает её критерий с существующим
`RegulatoryCheck`. Для расследований действует same-Investigation invariant:
instance, assessment, evidence document, timeline event, registry check и snapshot
не смешиваются между материалами.

Подробнее — в [`design-principles.md`](./design-principles.md).

## 5. Правила расширения системы

**Разрешено без архитектурного решения:**
- добавлять записи любых сущностей (seed / админ-панель);
- добавлять связи между существующими сущностями;
- добавлять характеристики оборудования (`EquipmentSpec`), изображения, PDF;
- менять отображение (UI), не меняя модель данных.

**Требует отдельного архитектурного решения:**
- добавление/удаление/переименование полей существующих моделей;
- создание новых сущностей;
- создание альтернативной модели для уже покрытой предметной области
  (например, второй модели оборудования);
- изменение семантики существующей связи.

**Порядок изменения схемы (если оно всё же обосновано):**
1. Обосновать, почему задача не решается данными в текущей модели.
2. Обновить соответствующий документ в `docs/architecture/`.
3. Изменение должно быть **аддитивным** (новые nullable-поля / новые таблицы).
4. Проверить SQL через `prisma migrate diff` — не должно быть
   `DROP` / `TRUNCATE` / `RENAME` / `ALTER COLUMN` / `DELETE FROM`.

## 6. Карта документации

| Документ | О чём |
|---|---|
| [`graph-model.md`](./graph-model.md) | **Главный документ.** Полная карта связей: прямые, вычисляемые, намеренно отсутствующие |
| [`doctors.md`](./doctors.md) | Модель `Doctor` |
| [`clinics.md`](./clinics.md) | Модель `Clinic` |
| [`diseases.md`](./diseases.md) | Модель `Disease` |
| [`procedures.md`](./procedures.md) | Модель `Procedure` |
| [`equipment.md`](./equipment.md) | Модель `Equipment` + `EquipmentSpec` (заморожена) |
| [`publications.md`](./publications.md) | `ScientificWork` vs `Publication` |
| [`design-principles.md`](./design-principles.md) | Общие принципы проекта |
| [`PRODUCTION.md`](./PRODUCTION.md) | Production-инфраструктура, runbook деплоя и rollback |
| [`UI_GUIDELINES.md`](./UI_GUIDELINES.md) | UI-философия и правила Design System |
| [`CONTENT_GUIDELINES.md`](./CONTENT_GUIDELINES.md) | Редакционная политика и качество публичного текста |
| [`ENTITY_GRAPH.md`](./ENTITY_GRAPH.md) | Семантическая модель связей и критерии полной карточки |
| [`appeals.md`](./appeals.md) | Приватный реестр обращений, безопасность, статусы и граница с Knowledge Graph |
| [`participant-auth.md`](./participant-auth.md) | P1.1 participant auth, invitation и подтверждаемый доступ к Doctor/Clinic |
| [`regulations.md`](./regulations.md) | Нормативный граф, временная применимость и evidence-gated оценки расследований |
| [`independent-control.md`](./independent-control.md) | Ненормативная методика, 80 критериев, формальная применимость и evidence-gated проверки |
