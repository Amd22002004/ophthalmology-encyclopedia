# Граф знаний — полная модель связей

> Главный документ архитектуры. Описывает **все** связи между сущностями.
> Сверен с `prisma/schema.prisma` построчно. Статус: **v1, заморожено**.

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
| **Clinic → ScientificWorks** | **вычисляемая** | `Clinic.doctors[].doctor.scientificWorks`, дедупликация по `slug` |

**Почему `Clinic → ScientificWorks` вычисляемая, а не прямая:** научная работа принадлежит
врачу. Клиника связана с ней ровно постольку, поскольку в ней работает автор. Заводить
`ScientificWorkOnClinic` — значит дублировать факт, который уже выражен цепочкой
`work.doctor → DoctorOnClinic → clinic`. Транзитивность здесь **логически корректна**:
утверждение «в этой клинике работает автор данной работы» истинно по построению.

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
 └─→ Procedures          (прямая, ProcedureOnEquipment)
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

**Намеренно отсутствует: `Equipment → ScientificWork`.**
`ScientificWork` описывает научную деятельность **врача**. Оборудование — самостоятельная
сущность. Привязка научной работы к аппарату — это другая предметная область
(клиническое исследование аппарата). Если она понадобится, создаётся **новая сущность
`ClinicalStudy`** (`Equipment → ClinicalStudy`), а `ScientificWork` для этого не
переиспользуется.

---

## 4. ScientificWork

```
ScientificWork
 ├─→ Doctor              (прямая, FK doctorId — автор, обязателен)
 ├─→ Diseases            (прямая, ScientificWorkOnDisease)   — тема работы
 ├─→ Procedures          (прямая, ScientificWorkOnProcedure) — тема работы
 └─→ Clinics             (ВЫЧИСЛЯЕМАЯ — через автора)
```

| Связь | Тип | Как получается |
|---|---|---|
| ScientificWork → Doctor | прямая, обязательная | `ScientificWork.doctorId` (`Cascade`) |
| ScientificWork ↔ Disease | прямая | `ScientificWorkOnDisease` |
| ScientificWork ↔ Procedure | прямая | `ScientificWorkOnProcedure` |
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
 └─→ Guidelines          (прямая, DiseaseOnClinicalGuideline)
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
 └─→ ScientificWorks     (прямая, ScientificWorkOnProcedure)
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
| `Regulation` | **связей нет** — самостоятельный документ |
| `HistoryEntry` | **связей нет** |
| `Innovation` | **связей нет** |

Отсутствие связей у `Regulation` / `HistoryEntry` / `Innovation` — текущее состояние.
Это не запрет: при появлении достоверных данных связи могут быть добавлены
(аддитивно, через новую join-таблицу + архитектурное решение).

---

## 11. Сводная таблица вычисляемых связей

Всего в системе **две** вычисляемые связи. Обе транзитивны через `Doctor` и обе
логически корректны.

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
| `Equipment → ScientificWork` | Разные предметные области: научная деятельность врача ≠ исследование аппарата | Создать новую сущность `ClinicalStudy` |
| `ScientificWork → Diseases` через врача | Даёт ложные медицинские связи (§4.2) | Никогда. Только прямая `ScientificWorkOnDisease` |
| `ScientificWork → Procedures` через врача | То же | Только прямая `ScientificWorkOnProcedure` |
| `Organization` (сущность целиком) | Модели не существует; роли закрыты `Supplier` / `Clinic` / строковыми полями | Отдельное архитектурное решение |

---

## 13. Инварианты графа

1. У `ScientificWork` **всегда** есть автор (`doctorId` — NOT NULL).
2. Удаление врача каскадно удаляет его научные работы (`onDelete: Cascade`),
   но НЕ удаляет его публикации (`Publication.doctorId` → `SetNull`).
3. Удаление справочника (`Region`, категории) не удаляет контент — FK ставится в `NULL`
   (`onDelete: SetNull`).
4. Все join-таблицы имеют составной первичный ключ `@@id([aId, bId])` — дубликат связи
   физически невозможен. Это то, что делает seed идемпотентным.
5. `EquipmentSpec` уникален по `@@unique([equipmentId, label])` — один параметр у аппарата
   не может задваиваться.
6. `ScientificWork` уникален по `@@unique([doctorId, title])` — у врача не может быть двух
   работ с одинаковым названием.
