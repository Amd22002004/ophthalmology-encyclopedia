# Модель `Clinic`

> Статус: **v1, заморожено**. Сверено с `prisma/schema.prisma`.

## 1. Структура

### Идентификация
| Поле | Тип | Назначение |
|---|---|---|
| `id` | `String` | PK, cuid |
| `slug` | `String` @unique | URL: `/clinics/[slug]` |
| `title` | `String` | Публичное название |
| `legalName` | `String?` | Юридическое наименование |
| `description` | `String?` | Описание |

### География
| Поле | Тип | Назначение |
|---|---|---|
| `city` | `String?` | Город |
| `region` | `String?` | Регион строкой — **legacy**, см. §5 |
| `regionId` | `String?` | FK → `Region` |
| `address` | `String?` | Адрес |
| `latitude` / `longitude` | `Float?` | Координаты |
| `mapEmbed` | `String?` | Встраиваемая карта |

### Классификация
| Поле | Тип | Назначение |
|---|---|---|
| `clinicType` | `String?` | Тип (`centre`, `cabinet`, `mntk`, `clinic`, `oms`) |
| `networkName` | `String?` | Название сети (напр. «Визус-1») |
| `status` | `String` = `"active"` | Статус записи |
| `omsEnabled` | `Boolean` = `false` | Работает по ОМС |
| `contractBased` | `Boolean` = `false` | Договорная |
| `specializationTags` | `String[]` | Теги специализаций — **тех. долг**, см. §5 |

### Контакты
| Поле | Тип | Назначение |
|---|---|---|
| `phones` | `String[]` | Телефоны (основное поле) |
| `phone` | `String?` | Один телефон — **legacy**, см. §5 |
| `email`, `website`, `appointmentUrl` | `String?` | Контакты и запись |
| `vkUrl`, `telegramUrl`, `youtubeUrl` | `String?` | Соцсети |
| `workingHours` | `String?` | Часы работы |
| `directorName` | `String?` | Руководитель |

### Юридические данные
| Поле | Тип | Назначение |
|---|---|---|
| `inn`, `kpp`, `ogrn` | `String?` | Реквизиты |
| `license` | `String?` | Номер лицензии |
| `licenseStatus` | `String?` | Статус лицензии |
| `licenseDate` | `DateTime?` | Дата выдачи |
| `foundedYear` | `Int?` | Год основания |

### Изображения и SEO
| Поле | Тип | Назначение |
|---|---|---|
| `logoUrl`, `coverImageUrl`, `facadeImageUrl` | `String?` | Изображения |
| `seoTitle`, `seoDescription`, `seoKeywords` | `String?` | SEO-переопределения |

## 2. Связи

| Связь | Тип | Таблица |
|---|---|---|
| → `Region` | прямая | `regionId` (`SetNull`) |
| ↔ `Specialty` | прямая | `ClinicOnSpecialty` |
| ↔ `Doctor` | прямая | `DoctorOnClinic` (доп. поле `role`) |
| ↔ `Disease` | прямая | `ClinicOnDisease` |
| ↔ `Procedure` | прямая | `ClinicOnProcedure` |
| ↔ `Equipment` | прямая | `ClinicOnEquipment` |
| ↔ `Supplier` | прямая | `ClinicOnSupplier` |
| ↔ `Publication` | прямая | `ClinicOnPublication` |
| → `ScientificWork` | **вычисляемая** | через врачей клиники |

## 3. Связь с врачами

Прямая, через `DoctorOnClinic`. Таблица несёт доп. поле `role` — роль врача именно
в этой клинике (врач может числиться в нескольких клиниках с разными ролями).

**Отображение (блок «Врачи клиники · N»):**
- максимум **4** врача, остальные — по ссылке «Показать всех N врачей →»;
- формат имени: «Фамилия И. О.»;
- подпись: `position`, при его отсутствии — `category` (**не стаж**);
- фото из `photoUrl`, при отсутствии — буквенный аватар (инициалы);
- загрузчик `getClinic` берёт `take: 12` врачей.

## 4. Связь с оборудованием

Прямая, через `ClinicOnEquipment` — «аппарат установлен в этой клинике».

**Отображение (блок «Оборудование клиники · N»):**
фото (`equipment.images[0]`), название, `manufacturer · country`, кнопка «Подробнее →»
на `/equipment/[slug]`. Связь двусторонняя: страница оборудования показывает блок
«Используется в клиниках».

**Блок «Научные работы врачей клиники»** — вычисляемый: собирается из
`clinic.doctors[].doctor.scientificWorks` с дедупликацией по `slug`. Подпись прямо
сообщает природу связи (работы **врачей**, а не самой клиники).

## 5. Известный технический долг

| Проблема | Описание |
|---|---|
| `specializationTags: String[]` | Помечено в схеме: планировалась миграция в `Specialization` + `ClinicOnSpecialization`. Сейчас параллельно существует связь `ClinicOnSpecialty` |
| Дублирование телефона | `phones: String[]` и `phone: String?`. Источник истины — `phones` |
| Дублирование региона | `region: String?` и `regionId → Region`. Источник истины — `regionId` |

## 6. Правила наполнения

1. `status = "active"` — клиника публикуется. Иные значения скрывают её из каталога.
2. `networkName` заполняется для сетевых клиник — используется для бейджа «Сеть «…»»
   на странице врача.
3. Юридические данные (`inn`, `ogrn`, `license`) заполняются только из официальных
   источников.
4. Связь `Clinic → Equipment` создаётся при подтверждении, что аппарат стоит именно
   в этой клинике.

## 7. SEO

- Canonical `/clinics/[slug]`; `seoTitle` / `seoDescription` переопределяют дефолт.
- Schema.org: `MedicalOrganization` + `BreadcrumbList`; при наличии FAQ — `FAQPage`.
- Двусторонняя перелинковка: врачи, оборудование, процедуры, заболевания, публикации.
