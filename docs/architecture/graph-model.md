# Граф знаний — полная модель связей

> Главная карта семантических связей Knowledge Graph. Точный физический список
> relation и полей задаёт `prisma/schema.prisma`; приватные операционные детали
> раскрываются в профильных документах. Расширение v1.5 для независимого контроля
> отражает текущую schema и прошедшую 2026-08-13 локальную интеграционную проверку.
> Состояние production этим документом не удостоверяется.

## Легенда

| Обозначение | Значение |
|---|---|
| **Прямая** | Связь физически существует в БД (FK или join-таблица) |
| **Вычисляемая** | Связи в БД нет; список собирается в загрузчике через промежуточную сущность |
| **Намеренно отсутствует** | Связь сознательно НЕ создана. Причина указана — это архитектурное решение, а не недоработка |

---

## 1. Doctor

```
Doctor
 ├─→ Region              (прямая, FK regionId)
 ├─→ Specialties         (прямая, DoctorOnSpecialty)
 ├─→ Clinics             (прямая, DoctorOnClinic — с полем role)
 ├─→ Diseases            (прямая, DoctorOnDisease)      — направления врача
 ├─→ Procedures          (прямая, DoctorOnProcedure)    — что выполняет
 ├─→ Equipment           (прямая, DoctorOnEquipment)    — на чём работает
 ├─→ ScientificWorks     (прямая, FK ScientificWork.doctorId)
 └─→ Publications        (прямая, FK Publication.doctorId, nullable)
```

| Связь | Тип | Таблица / поле |
|---|---|---|
| Doctor → Region | прямая | `Doctor.regionId` → `Region` (`onDelete: SetNull`) |
| Doctor ↔ Specialty | прямая | `DoctorOnSpecialty` |
| Doctor ↔ Clinic | прямая | `DoctorOnClinic` (доп. поле `role`) |
| Doctor ↔ Disease | прямая | `DoctorOnDisease` |
| Doctor ↔ Procedure | прямая | `DoctorOnProcedure` |
| Doctor ↔ Equipment | прямая | `DoctorOnEquipment` |
| Doctor → ScientificWork | прямая, 1:N | `ScientificWork.doctorId` (`onDelete: Cascade`) |
| Doctor → Publication | прямая, 1:N | `Publication.doctorId` (nullable, `onDelete: SetNull`) |

**Семантика:** `Doctor → Diseases` означает **направления работы врача**, а НЕ темы его
научных работ. Это разные вещи (см. §4).

---

## 2. Clinic

```
Clinic
 ├─→ Region              (прямая, FK regionId)
 ├─→ Specialties         (прямая, ClinicOnSpecialty)
 ├─→ Doctors             (прямая, DoctorOnClinic)
 ├─→ Diseases            (прямая, ClinicOnDisease)
 ├─→ Procedures          (прямая, ClinicOnProcedure)
 ├─→ Equipment           (прямая, ClinicOnEquipment)
 ├─→ Suppliers           (прямая, ClinicOnSupplier)
 ├─→ Publications        (прямая, ClinicOnPublication)
 ├─→ Investigations      (прямая, InvestigationOnClinic)
 ├─→ RegulatoryAssessments (прямая, FK assessment.clinicId)
 ├─→ IndependentControlAssessments (прямая, составная связь с InvestigationOnClinic)
 ├─→ Appeals             (прямая, FK appeal.clinicId)
 └─→ ScientificWorks     (ВЫЧИСЛЯЕМАЯ — через врачей клиники)
```

| Связь | Тип | Как получается |
|---|---|---|
| Clinic → Region | прямая | `Clinic.regionId` |
| Clinic ↔ Specialty | прямая | `ClinicOnSpecialty` |
| Clinic ↔ Doctor | прямая | `DoctorOnClinic` |
| Clinic ↔ Disease | прямая | `ClinicOnDisease` |
| Clinic ↔ Procedure | прямая | `ClinicOnProcedure` |
| Clinic ↔ Equipment | прямая | `ClinicOnEquipment` |
| Clinic ↔ Supplier | прямая | `ClinicOnSupplier` |
| Clinic ↔ Publication | прямая | `ClinicOnPublication` |
| Clinic ↔ Investigation | прямая | `InvestigationOnClinic` |
| Clinic → RegulatoryAssessment | прямая, 1:N | `InvestigationRegulatoryAssessment.clinicId` (nullable) |
| Clinic → IndependentControlAssessment | прямая через evidence-edge | `[investigationId, clinicId]` → `InvestigationOnClinic` (nullable), затем `assessments` |
| Clinic → Appeal | прямая, 1:N | `Appeal.clinicId` (nullable) |
| **Clinic → ScientificWorks** | **вычисляемая** | `Clinic.doctors[].doctor.scientificWorks`, дедупликация по `slug` |

**Почему `Clinic → ScientificWorks` вычисляемая, а не прямая:** научная работа принадлежит
врачу. Клиника связана с ней ровно постольку, поскольку в ней работает автор. Заводить
`ScientificWorkOnClinic` — значит дублировать факт, который уже выражен цепочкой
`work.doctor → DoctorOnClinic → clinic`. Транзитивность здесь **логически корректна**:
утверждение «в этой клинике работает автор данной работы» истинно по построению.

`ClinicOnEquipment` означает подтверждённую установку модели в клинике. Упоминание
модели или конкретного экземпляра в расследовании не создаёт эту связь. Seed
ALLEGRETTO её намеренно не создаёт и не обновляет; уже существующая строка БД, если
она есть, остаётся отдельным риском достоверности до проверки первичного документа.

---

## 3. Equipment

```
Equipment
 ├─→ EquipmentCategory   (прямая, FK categoryId)
 ├─→ Supplier            (прямая, FK supplierId)
 ├─→ Specs               (прямая, 1:N EquipmentSpec)
 ├─→ Clinics             (прямая, ClinicOnEquipment)
 ├─→ Doctors             (прямая, DoctorOnEquipment)
 ├─→ Diseases            (прямая, DiseaseOnEquipment)
 ├─→ Procedures          (прямая, ProcedureOnEquipment)
 ├─→ ScientificWorks     (прямая, ScientificWorkOnEquipment)
 ├─→ Investigations      (прямая, InvestigationOnEquipment)
 └─→ InvestigationInstances (прямая, FK instance.equipmentId)
```

| Связь | Тип | Таблица / поле |
|---|---|---|
| Equipment → EquipmentCategory | прямая | `Equipment.categoryId` (`SetNull`) |
| Equipment → Supplier | прямая | `Equipment.supplierId` (`SetNull`) |
| Equipment → EquipmentSpec | прямая, 1:N | `EquipmentSpec.equipmentId` (`Cascade`), `@@unique([equipmentId, label])` |
| Equipment ↔ Clinic | прямая | `ClinicOnEquipment` |
| Equipment ↔ Doctor | прямая | `DoctorOnEquipment` |
| Equipment ↔ Disease | прямая | `DiseaseOnEquipment` |
| Equipment ↔ Procedure | прямая | `ProcedureOnEquipment` |
| Equipment ↔ ScientificWork | прямая | `ScientificWorkOnEquipment` |
| Equipment ↔ Investigation | прямая | `InvestigationOnEquipment` |
| Equipment → InvestigationEquipmentInstance | прямая, 1:N | `InvestigationEquipmentInstance.equipmentId` (nullable) |

**Правило:** `Equipment ↔ ScientificWork` создаётся только когда первичный документ
научной работы прямо называет оборудование, использованное в методике или клиническом
случае. Нельзя выводить эту связь через процедуру, клинику или профиль врача.

Если нужно хранить внешние клинические исследования конкретного аппарата без врача
как автора проекта — это по-прежнему отдельная предметная область `ClinicalStudy`,
а не переиспользование `ScientificWork`.

---

## 4. ScientificWork

```
ScientificWork
 ├─→ Doctor              (прямая, FK doctorId — автор, обязателен)
 ├─→ Diseases            (прямая, ScientificWorkOnDisease)   — тема работы
 ├─→ Procedures          (прямая, ScientificWorkOnProcedure) — тема работы
 ├─→ Equipment           (прямая, ScientificWorkOnEquipment) — прямо указанное оборудование
 └─→ Clinics             (ВЫЧИСЛЯЕМАЯ — через автора)
```

| Связь | Тип | Как получается |
|---|---|---|
| ScientificWork → Doctor | прямая, обязательная | `ScientificWork.doctorId` (`Cascade`) |
| ScientificWork ↔ Disease | прямая | `ScientificWorkOnDisease` |
| ScientificWork ↔ Procedure | прямая | `ScientificWorkOnProcedure` |
| ScientificWork ↔ Equipment | прямая | `ScientificWorkOnEquipment` |
| **ScientificWork → Clinics** | **вычисляемая** | `work.doctor.clinics[].clinic` |

### 4.1 Прямой связи `ScientificWork → Clinic` НЕТ — и это осознанно

Клиники определяются **только через автора**: `work.doctor → DoctorOnClinic → Clinic`.
На UI такой блок подписывается «**Клиники автора**» — подпись отражает суть связи.

### 4.2 Почему заболевания и процедуры — ПРЯМЫЕ, а не через врача

Это ключевое архитектурное правило, полученное из реального дефекта.

**Правило:** научная работа связывается только с теми заболеваниями и процедурами,
которые **реально исследуются в работе**.

**Обоснование (реальный пример из данных):**

| | Значение |
|---|---|
| Тема диссертации | «Экспресс кросслинкинг при кератэктазиях» |
| Направления автора (`DoctorOnDisease`) | Косоглазие, Катаракта, Птоз |
| Процедуры автора (`DoctorOnProcedure`) | Хирургия косоглазия, Блефаропластика, Факоэмульсификация |

Если бы `ScientificWork → Diseases` вычислялась через врача, то на странице «Катаракта»
появилась бы диссертация про кросслинкинг, а на странице диссертации — «Косоглазие» и
«Птоз». Это медицинская дезинформация.

Фактические связи работы: `Кератоконус` (заболевание), `Кросслинкинг` (процедура) —
ровно то, что исследовано.

> **Транзитивная связь через врача означает «работы врачей, которые лечат это
> заболевание», а НЕ «работы про это заболевание».** Разные утверждения — разные связи.

---

## 5. Disease

```
Disease
 ├─→ DiseaseCategory     (прямая, FK categoryId)
 ├─→ Procedures          (прямая, DiseaseOnProcedure)
 ├─→ Doctors             (прямая, DoctorOnDisease)
 ├─→ Clinics             (прямая, ClinicOnDisease)
 ├─→ Equipment           (прямая, DiseaseOnEquipment)
 ├─→ Publications        (прямая, PublicationOnDisease)
 ├─→ ScientificWorks     (прямая, ScientificWorkOnDisease)
 ├─→ Guidelines          (прямая, DiseaseOnClinicalGuideline)
 └─→ Investigations      (прямая, InvestigationOnDisease)
```

Все связи `Disease` — прямые. Вычисляемых нет.

---

## 6. Procedure

```
Procedure
 ├─→ ProcedureCategory   (прямая, FK categoryId)
 ├─→ Diseases            (прямая, DiseaseOnProcedure)
 ├─→ Doctors             (прямая, DoctorOnProcedure)
 ├─→ Clinics             (прямая, ClinicOnProcedure)
 ├─→ Equipment           (прямая, ProcedureOnEquipment)
 ├─→ Publications        (прямая, PublicationOnProcedure)
 ├─→ ScientificWorks     (прямая, ScientificWorkOnProcedure)
 ├─→ Investigations      (прямая, InvestigationOnProcedure)
 └─→ RegulatoryAssessments (прямая, FK assessment.procedureId)
```

Все связи `Procedure` — прямые.

---

## 7. Publication

```
Publication
 ├─→ Doctor              (прямая, FK doctorId — nullable)
 ├─→ Diseases            (прямая, PublicationOnDisease)
 ├─→ Procedures          (прямая, PublicationOnProcedure)
 └─→ Clinics             (прямая, ClinicOnPublication)
```

Автор может быть указан двумя способами: связью `doctorId` (врач в системе) либо
строкой `authorName` (внешний автор). См. [`publications.md`](./publications.md).

---

## 8. Supplier

```
Supplier
 ├─→ Equipment           (прямая, 1:N Equipment.supplierId)
 ├─→ EquipmentCategories (прямая, SupplierOnEquipmentCategory)
 └─→ Clinics             (прямая, ClinicOnSupplier)
```

---

## 9. Справочники

| Модель | Обратные связи |
|---|---|
| `Region` | `Doctor[]`, `Clinic[]` |
| `Specialty` | `DoctorOnSpecialty`, `ClinicOnSpecialty` |
| `DiseaseCategory` | `Disease[]` |
| `ProcedureCategory` | `Procedure[]` |
| `EquipmentCategory` | `Equipment[]`, `SupplierOnEquipmentCategory` |

## 10. Прочие контентные сущности

| Модель | Связи |
|---|---|
| `ClinicalGuideline` | ↔ `Disease` (`DiseaseOnClinicalGuideline`) |
| `Regulation` | `RegulationEdition`, `RegulationSource`, ↔ `RegulationTopic`, направленные `RegulationRelation` |
| `HistoryEntry` | **связей нет** |
| `Innovation` | **связей нет** |

Отсутствие связей у `HistoryEntry` / `Innovation` — текущее состояние.
Это не запрет: при появлении достоверных данных связи могут быть добавлены
(аддитивно, через новую join-таблицу + архитектурное решение).

### 10.1 Нормативный граф и расследования

```text
Regulation
 ├─→ RegulationEdition
 │    ├─→ RegulationProvision -> RegulationTopic
 │    │    ├─→ RegulatoryCheck
 │    │    │    ├─→ InvestigationRegulatoryAssessment
 │    │    │    └─→ IndependentControlCriterionNorm
 │    │    └─→ RegulationEquipmentRequirement
 │    ├─→ RegulationSource (optional editionId)
 │    └─→ InvestigationRegulatoryAssessment (appliedEditionId)
 ├─→ RegulationSource
 ├─↔ RegulationTopic (RegulationOnTopic)
 └─→ RegulationRelation -> Regulation

Investigation
 ├─→ InvestigationEquipmentInstance -> Equipment (optional model)
 │    ├─→ InvestigationEquipmentInstanceEvidence -> InvestigationDocument
 │    ├─→ InvestigationTimelineEvent
 │    ├─→ InvestigationRegistryCheck
 │    └─→ InvestigationRegulatoryAssessment
 ├─→ InvestigationRegulatoryAssessment -> RegulatoryCheck
 │    ├─→ RegulationEdition (optional appliedEdition)
 │    ├─→ Clinic (optional)
 │    ├─→ Procedure (optional)
 │    ├─→ InvestigationEquipmentInstance (optional)
 │    ├─→ InvestigationAssessmentEvidence -> InvestigationDocument
 │    └─→ InvestigationRegistryCheck
 ├─→ InvestigationIndependentControlAssessment
 │    ├─→ IndependentControlCriterion
 │    ├─→ IndependentControlCriterionNorm (optional applied link)
 │    ├─→ InvestigationOnClinic (optional)
 │    └─→ InvestigationIndependentControlEvidence -> InvestigationDocument
 ├─→ InvestigationDocument
 ├─→ InvestigationTimelineEvent
 └─→ InvestigationRegistryCheck -> InvestigationDocument (optional snapshot)
```

`RegulationSource` — SSOT официального источника. Поля
`Regulation.officialPublicationUrl` и `RegulationEdition.officialTextUrl` являются
контролируемыми проекциями, а `Regulation.sourceUrl` — legacy-совместимость; они не
образуют независимые источники истины. Публичный `RegulationSource` требует
`isOfficial`, собственного publication gate и, при заполненном `editionId`,
публичной родительской редакции.

Составные FK с `investigationId` не позволяют связать assessment, instance,
document, timeline event, registry check и snapshot из разных расследований.
Прикладной аудит дополнительно проверяет принадлежность `clinicId` / `procedureId`
расследованию, наличие модели instance в `InvestigationOnEquipment` и совпадение
`appliedEditionId` с редакцией положения выбранного `RegulatoryCheck`.

Evidence-validation выполняется по узлам: Investigation, section, timeline,
document, assessment и связи Investigation с clinic/equipment/disease/procedure
имеют собственный `evidenceValidatedAt`; идентификация instance проходит через
валидированную `InvestigationEquipmentInstanceEvidence`, а registry check — через
валидированный snapshot-документ. Первичное доказательство assessment дополнительно
требует `isPrimary` и `provenanceVerifiedAt`.
Роль доказательства должна совпадать со статусом: `SUPPORTS` для `CONFIRMED` /
`LIKELY_NON_COMPLIANCE`, `REFUTES` для `NOT_CONFIRMED` / `COMPLIANT`; `CONTEXT`
итоговый статус не доказывает. Редакция не применима при пустом `verifiedAt`, а
событие до `verifiedAt` допускается только при явном `historicalUseAllowed = true`.

Физические обратные Prisma-связи нормативной цепочки доступны для внутреннего
аудита. Публичное отображение намеренно однонаправленно:
`Investigation -> Regulation`; `/regulations` не показывает обратные ссылки на
клиники и расследования даже после evidence-validation. Подробная семантика:
[`regulations.md`](./regulations.md).

### 10.2 Контентный контур Investigation

| Связь | Физическая реализация |
|---|---|
| `Investigation -> Section` | `InvestigationSection.investigationId` |
| `Investigation -> TimelineEvent` | `InvestigationTimelineEvent.investigationId` |
| `Investigation -> Document` | `InvestigationDocument.investigationId` |
| `Investigation ↔ Clinic` | `InvestigationOnClinic` + собственный publication/evidence gate связи |
| `Investigation ↔ Equipment` | `InvestigationOnEquipment` + собственный publication/evidence gate связи |
| `Investigation ↔ Disease` | `InvestigationOnDisease` + собственный publication/evidence gate связи |
| `Investigation ↔ Procedure` | `InvestigationOnProcedure` + собственный publication/evidence gate связи |
| `Investigation ↔ News` | `NewsOnInvestigation` |
| `Investigation -> EquipmentInstance` | `InvestigationEquipmentInstance.investigationId` |
| `Investigation -> RegulatoryAssessment` | `InvestigationRegulatoryAssessment.investigationId` |
| `Investigation -> IndependentControlAssessment` | `InvestigationIndependentControlAssessment.investigationId` |
| `Investigation -> RegistryCheck` | `InvestigationRegistryCheck.investigationId` |
| `Investigation -> Appeal` | `Appeal.investigationId` (nullable) |

`Section`, `TimelineEvent` и `Document` имеют собственные publication/evidence
поля. Прямые M:N связи с clinic/equipment/disease/procedure не доказывают содержание
оценки: assessment хранит свой факт, период и optional ссылки отдельно.

### 10.3 Методика независимого контроля

```text
IndependentControlMethodology
 ├─→ IndependentControlSource
 └─→ IndependentControlCriterion
      ├─→ IndependentControlCriterionNorm -> RegulatoryCheck
      └─→ InvestigationIndependentControlAssessment
           └─→ InvestigationIndependentControlEvidence
                -> InvestigationDocument
```

`IndependentControlMethodology` — владелец ненормативного рабочего инструмента,
его библиографии и критериев. `IndependentControlSource` не переносит право на
внешний официальный материал на локальный DOC: публичный файл допускается только
при отдельном подтверждённом основании прав.

`IndependentControlCriterionNorm` — направленная связь критерия с уже существующим
`RegulatoryCheck`; локальный `sourceLocator` не становится `locator` нормы.
Составной FK `[appliedCriterionNormId, criterionId]` не позволяет применить связь
другого критерия. Составные FK доказательной связи и optional clinic-связи сохраняют
same-Investigation invariant.

Публичные переходы разрешены как `/independent-control -> Regulation` и
`Investigation -> IndependentControlCriterion`. Обратные витрины на
`/regulations` и из методики в расследования намеренно отсутствуют. Полный контракт:
[`independent-control.md`](./independent-control.md).

---

## 11. Сводная таблица вычисляемых связей

В медицинском каталожном графе используются следующие вычисляемые связи. Обе
транзитивны через `Doctor` и логически корректны.

| Связь | Цепочка | Почему корректна |
|---|---|---|
| `ScientificWork → Clinics` | `work.doctor.clinics[].clinic` | «Клиники автора работы» — факт по построению |
| `Clinic → ScientificWorks` | `clinic.doctors[].doctor.scientificWorks` | «Работы врачей этой клиники» — факт по построению |

Обратите внимание: обе подписаны на UI так, чтобы читатель понимал природу связи
(«Клиники автора», «Научные работы врачей клиники»), а не принимал её за прямую.

---

## 12. Сводная таблица намеренно отсутствующих связей

| Связь | Почему отсутствует | Что делать, если понадобится |
|---|---|---|
| `ScientificWork → Clinic` (прямая) | Дублировала бы факт, выраженный через автора | Не создавать. Использовать вычисление через `doctor` |
| `Equipment → ScientificWork` без прямого упоминания в работе | Ложный вывод через процедуру, врача или клинику | Связь не создавать; для внешних исследований аппарата нужна `ClinicalStudy` |
| `ScientificWork → Diseases` через врача | Даёт ложные медицинские связи (§4.2) | Никогда. Только прямая `ScientificWorkOnDisease` |
| `ScientificWork → Procedures` через врача | То же | Только прямая `ScientificWorkOnProcedure` |
| `Regulation → Investigation` в публичном UI | Нарушает нейтральность нормативной базы и может превратить служебную обратную связь в обвинительную витрину | Оставить физическую связь для аудита; публично показывать только `Investigation → Regulation` |
| `Regulation → IndependentControlCriterion` в публичном UI | Критерий методики не является частью акта и обратная витрина смешала бы норму с инструментом оценки | Оставить физическую связь для внутренней проверки; публично показывать только `IndependentControlCriterion → Regulation` |
| `IndependentControlMethodology → Investigation` | Методика сама по себе не устанавливает применение к конкретной организации | Показывать только отдельные прошедшие gate оценки внутри `Investigation` |
| `Organization` (сущность целиком) | Модели не существует; роли закрыты `Supplier` / `Clinic` / строковыми полями | Отдельное архитектурное решение |

---

## 13. Инварианты графа

1. У `ScientificWork` **всегда** есть автор (`doctorId` — NOT NULL).
2. Удаление врача каскадно удаляет его научные работы (`onDelete: Cascade`),
   но НЕ удаляет его публикации (`Publication.doctorId` → `SetNull`).
3. Удаление справочника (`Region`, категории) не удаляет контент — FK ставится в `NULL`
   (`onDelete: SetNull`).
4. Чистые M:N join-таблицы используют составной первичный ключ
   `@@id([aId, bId])`. Edge-модели с собственными метаданными могут использовать
   surrogate `id` и отдельный `@@unique`; уникальность нужно проверять по фактической
   schema, а идемпотентность seed — по тому же уникальному ключу.
5. `EquipmentSpec` уникален по `@@unique([equipmentId, label])` — один параметр у аппарата
   не может задваиваться.
6. `ScientificWork` уникален по `@@unique([doctorId, title])` — у врача не может быть двух
   работ с одинаковым названием.
7. `ScientificWorkOnEquipment` создаётся только из первичного текста работы; связь
   нельзя выводить транзитивно через процедуру, клинику или автора.
8. `InvestigationTimelineEvent`, `InvestigationRegulatoryAssessment`,
   `InvestigationAssessmentEvidence`, `InvestigationIndependentControlAssessment`,
   `InvestigationIndependentControlEvidence`,
   `InvestigationEquipmentInstanceEvidence` и `InvestigationRegistryCheck` не
   связывают узлы разных расследований: составные relation используют один
   `investigationId`.
9. `ClinicOnEquipment` не создаётся из `InvestigationOnEquipment` или
   `InvestigationEquipmentInstance`; это разные утверждения.
10. Публичная двусторонность имеет защитное исключение: нормативная карточка не
    показывает связанные расследования, клиники или экземпляры.
11. Локатор критерия независимого контроля не является locator нормы; нормативное
    основание существует только через проверенный `IndependentControlCriterionNorm`.
12. Ненормативный критерий не допускает `CONFIRMED`,
    `LIKELY_NON_COMPLIANCE` или `COMPLIANT`; подтверждающий вывод или вывод о
    соответствии требует `DIRECT_NORM`, применённую edition-bound связь и
    достаточное доказательство.

---

## 14. Реестр обращений вне публичного графа

`Appeal` — приватная операционная сущность. Связь `Investigation 1:N Appeal` означает
классификацию обращения по расследованию; nullable-связь `Clinic 1:N Appeal` —
внутреннюю классификацию по подтверждённой карточке клиники.

Поля `reportedDoctorName` и `reportedEquipmentName` сохраняют сведения со слов
заявителя и намеренно не связаны с `Doctor` и `Equipment`. До проверки сотрудником
они не являются фактом Knowledge Graph и не выводятся на публичных страницах.

Полная прикладная архитектура реестра: [`appeals.md`](./appeals.md).
