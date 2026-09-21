import type {
  RegulationEditionSeed,
  RegulationProvisionSeed,
  RegulationSeed,
  RegulationSourceSeed,
  RegulatoryCheckSeed,
} from "./types";

const VERIFIED_AT = "2026-08-13";
const PUBLISHED_AT = "2026-08-13";

const URLS = {
  nocLegalBase:
    "https://minzdrav.gov.ru/special/open/supervision/format/nezavisimaya-sistema-otsenki-kachestva-okazaniya-uslug-meditsinskimi-organizatsiyami",
  order956: "https://publication.pravo.gov.ru/document/0001201502260018",
  order118: "https://publication.pravo.gov.ru/document/0001202504110006",
  order201: "https://publication.pravo.gov.ru/document/0001201805240005",
  order201Card:
    "https://minzdrav.gov.ru/documents/9567-prikaz-ministerstva-zdravoohraneniya-rossiyskoy-federatsii-ot-4-maya-2018-g-201n-ob-utverzhdenii-pokazateley-harakterizuyuschih-obschie-kriterii-otsenki-kachestva-usloviy-okazaniya-uslug-meditsinskimi-organizatsiyami-v-otnoshenii-kotoryh-provoditsya-nezavisimaya-otsenka",
  order197:
    "https://minzdrav.gov.ru/documents/9568-prikaz-ministerstva-zdravoohraneniya-rossiyskoy-federatsii-ot-28-aprelya-2018-g-197n-ob-utverzhdenii-perechnya-vidov-meditsinskih-organizatsiy-v-sootvetstvii-s-nomenklaturoy-meditsinskih-organizatsiy-v-otnoshenii-kotoryh-ne-provoditsya-nezavisimaya-otsenka-kachestva-usloviy-okazaniya-imi-uslug",
  order615: "https://publication.pravo.gov.ru/document/0001201910030027",
  order344: "https://publication.pravo.gov.ru/document/0001201810120032",
  order408: "https://publication.pravo.gov.ru/document/0001202409240008",
  law181Current: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102038362&rdk=79",
  law293: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=605695730",
  law552: "https://publication.pravo.gov.ru/document/0001202512290040",
  order802: "https://publication.pravo.gov.ru/document/0001201512090027",
  order210: "https://publication.pravo.gov.ru/document/0001202505200003",
  resolution1006: "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102159769",
  resolution736: "https://publication.pravo.gov.ru/document/0001202305120025",
  resolution659: "https://publication.pravo.gov.ru/document/0001202606010083",
} as const;

type CheckInput = Omit<
  RegulatoryCheckSeed,
  "isPublished" | "publishedAt" | "sortOrder"
>;

function publicCheck(input: CheckInput, sortOrder = 0): RegulatoryCheckSeed {
  return {
    ...input,
    isPublished: true,
    publishedAt: PUBLISHED_AT,
    sortOrder,
  };
}

type ProvisionInput = Omit<
  RegulationProvisionSeed,
  "isPublished" | "publishedAt" | "sortOrder" | "checks"
> & { checks: CheckInput[] };

function publicProvision(input: ProvisionInput, sortOrder = 0): RegulationProvisionSeed {
  return {
    ...input,
    checks: input.checks.map((item, index) => publicCheck(item, index)),
    isPublished: true,
    publishedAt: PUBLISHED_AT,
    sortOrder,
  };
}

function source(
  title: string,
  url: string,
  editionKey: string,
  sortOrder = 0,
  kind: RegulationSourceSeed["kind"] = "OFFICIAL_PUBLICATION",
): RegulationSourceSeed {
  return {
    kind,
    title,
    url,
    isOfficial: true,
    isPublished: true,
    publishedAt: PUBLISHED_AT,
    editionKey,
    sortOrder,
  };
}

type ActInput = Omit<
  RegulationSeed,
  "jurisdiction" | "isPublished" | "publishedAt" | "seoTitle" | "seoDescription"
>;

function act(input: ActInput): RegulationSeed {
  return {
    ...input,
    jurisdiction: "Российская Федерация",
    isPublished: true,
    publishedAt: PUBLISHED_AT,
    seoTitle: `${input.number}: период действия и проверочные вопросы`,
    seoDescription:
      `${input.title}: официальный источник, применимая редакция и нейтральные вопросы для проверки условий оказания услуг.`,
  };
}

function edition(input: Omit<RegulationEditionSeed, "isPublished" | "publishedAt">): RegulationEditionSeed {
  return { ...input, isPublished: true, publishedAt: PUBLISHED_AT };
}

const websiteCheck: CheckInput = {
  key: "official-website-information",
  question:
    "Размещена ли на официальном сайте медицинской организации информация, требуемая применимой к проверяемому периоду редакцией перечня?",
  factToEstablish:
    "Наличие, содержание и дата размещения информации именно на официальном сайте в проверяемый период.",
  primaryEvidenceType:
    "Архивная копия официального сайта с датой фиксации, первичная публикационная запись организации и применимая редакция перечня.",
  officialSearchUrl: URLS.nocLegalBase,
  officialSearchLabel: "Нормативная база НОК Минздрава России",
  nonCompliancePattern:
    "Документированное отсутствие обязательной информации на официальном сайте в применимый период; вывод не переносится автоматически на физический стенд.",
  evidenceThreshold:
    "Датированная фиксация официального сайта и применимая редакция акта. Один текущий снимок не доказывает историческое состояние.",
  applicabilityNote:
    "Приказы 956н и 118н регулируют официальный сайт. Обязанность для информационного стенда требует отдельного первичного нормативного основания.",
};

const calculationCheck: CheckInput = {
  key: "indicator-calculation",
  question:
    "По какой действовавшей редакции порядка и на основании каких исходных данных рассчитан показатель независимой оценки?",
  factToEstablish:
    "Редакция порядка расчёта, исходные наблюдения, формула и воспроизводимый результат для конкретного цикла.",
  primaryEvidenceType:
    "Расчёт оператора, массив исходных данных, версия методики и протокол общественного совета.",
  nonCompliancePattern:
    "Не является самостоятельным нарушением медицинской организации: приказ регулирует расчёт показателей.",
  evidenceThreshold:
    "Полный воспроизводимый расчёт по редакции, действовавшей в проверяемый период; локальная оценка от 1 до 10 сама по себе недостаточна.",
  applicabilityNote:
    "Порядок расчёта не создаёт из каждой строки рабочего бланка отдельную обязанность клиники.",
};

const accessibilityCheck = (
  key: string,
  question: string,
  factToEstablish: string,
): CheckInput => ({
  key,
  question,
  factToEstablish,
  primaryEvidenceType:
    "Проектная и исполнительная документация объекта, акт обследования доступности, локальный порядок помощи и датированные материалы фактического состояния.",
  nonCompliancePattern:
    "Подтверждённое несоответствие точному применимому требованию с учётом разумного приспособления и альтернативного способа оказания услуги.",
  evidenceThreshold:
    "Первичный документ и фактическая проверка, относящиеся к тому же объекту, услуге и периоду; одиночное наблюдение без проверки альтернатив недостаточно.",
  applicabilityNote:
    "Проверяется по редакции и отраслевому порядку, действовавшим в дату события; формулировка локального бланка не расширяет норму.",
});

const paidServicesCheck: CheckInput = {
  key: "paid-services-information",
  question:
    "Предоставлена ли потребителю предусмотренная применимой редакцией правил информация о платных медицинских услугах до заключения договора?",
  factToEstablish:
    "Состав информации, способ и момент её предоставления, перечень и цены услуг, а также сведения об исполнителе и медицинских работниках.",
  primaryEvidenceType:
    "Договор и приложения, утверждённый прейскурант, датированная версия сайта/стенда и локальные документы информирования потребителя.",
  nonCompliancePattern:
    "Документированное отсутствие конкретной обязательной информации в применимом канале и периоде; неприменимый исторический или будущий акт не используется.",
  evidenceThreshold:
    "Совокупность первичных документов за проверяемый период, позволяющая установить содержание информации до заключения конкретного договора.",
  applicabilityNote:
    "Применимо только при оказании платных медицинских услуг; строки рабочего бланка не заменяют текст действовавших правил.",
};

export const INDEPENDENT_CONTROL_REGULATIONS: RegulationSeed[] = [
  act({
    slug: "minzdrav-order-956n-2014",
    title: "Приказ Минздрава России № 956н об информации для независимой оценки качества",
    summary:
      "Исторический перечень информации для официальных сайтов медицинских организаций; не устанавливает автоматически тот же перечень для физического стенда.",
    documentType: "Приказ Минздрава России",
    number: "956н",
    adoptedAt: "2014-12-30",
    issuingAuthority: "Министерство здравоохранения Российской Федерации",
    officialPublicationUrl: URLS.order956,
    legalStatus: "EXPIRED",
    effectiveFrom: "2015-03-09",
    effectiveTo: "2025-08-31",
    topicSlugs: ["public-medical-information", "independent-quality-assessment"],
    sources: [source("Официальное опубликование приказа № 956н", URLS.order956, "historical-2015-03-09")],
    editions: [edition({
      key: "historical-2015-03-09",
      title: "Историческая редакция, действовавшая до 31.08.2025",
      effectiveFrom: "2015-03-09",
      effectiveTo: "2025-08-31",
      legalStatus: "EXPIRED",
      transitionNote: "С 01.09.2025 заменена приказом Минздрава России № 118н; к событиям после этой даты не применяется.",
      officialTextUrl: URLS.order956,
      verifiedAt: VERIFIED_AT,
      historicalUseAllowed: true,
      verificationNote:
        "Период подтверждён официальным опубликованием и переходом к приказу № 118н. Исторический вывод требует датированного состояния сайта.",
      provisions: [publicProvision({
        key: "official-website-information",
        topicSlug: "public-medical-information",
        locator: "Приложение № 2, пункты 1–48.3",
        title: "Исторический перечень информации на официальном сайте",
        requirement:
          "В период действия приказа официальный сайт медицинской организации содержит информацию в составе и форме, предусмотренных приложением № 2.",
        applicability:
          "Только к официальному сайту и событиям с 09.03.2015 по 31.08.2025; физический стенд проверяется отдельно.",
        effectiveFrom: "2015-03-09",
        effectiveTo: "2025-08-31",
        checks: [websiteCheck],
      })],
    })],
  }),
  act({
    slug: "minzdrav-order-118n-2025",
    title: "Приказ Минздрава России № 118н об информации для независимой оценки качества условий",
    summary:
      "Действующий с 01.09.2025 перечень информации для официальных сайтов, заменивший приказ № 956н без ретроактивного применения.",
    documentType: "Приказ Минздрава России",
    number: "118н",
    adoptedAt: "2025-03-13",
    issuingAuthority: "Министерство здравоохранения Российской Федерации",
    officialPublicationUrl: URLS.order118,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2025-09-01",
    effectiveTo: "2031-02-28",
    topicSlugs: ["public-medical-information", "independent-quality-assessment"],
    sources: [source("Официальное опубликование приказа № 118н", URLS.order118, "current-2025-09-01")],
    editions: [edition({
      key: "current-2025-09-01",
      title: "Редакция, действующая с 01.09.2025",
      effectiveFrom: "2025-09-01",
      effectiveTo: "2031-02-28",
      legalStatus: "IN_FORCE",
      transitionNote: "Применяется с 01.09.2025 и не используется для ретроактивной оценки более раннего сайта.",
      officialTextUrl: URLS.order118,
      verifiedAt: VERIFIED_AT,
      historicalUseAllowed: false,
      verificationNote: "Проверены дата вступления в силу и конечная дата действия по официальному опубликованию.",
      provisions: [publicProvision({
        key: "official-website-information",
        topicSlug: "public-medical-information",
        locator: "Приложение № 2",
        title: "Действующий перечень информации на официальном сайте",
        requirement:
          "С 01.09.2025 официальный сайт медицинской организации проверяется по составу и форме информации, установленным приказом № 118н.",
        applicability:
          "Только к официальному сайту и событиям с 01.09.2025; исторические строки локального бланка сначала сопоставляются с новым перечнем.",
        effectiveFrom: "2025-09-01",
        effectiveTo: "2031-02-28",
        checks: [websiteCheck],
      })],
    })],
    relations: [{
      targetSlug: "minzdrav-order-956n-2014",
      type: "REPLACES",
      legalEffectFrom: "2025-09-01",
      note: "Приказ № 118н заменил исторический перечень приказа № 956н с 01.09.2025.",
      officialSourceUrl: URLS.order118,
      isPublished: true,
    }],
  }),
  act({
    slug: "minzdrav-order-201n-2018",
    title: "Приказ Минздрава России № 201н о показателях независимой оценки качества условий",
    summary:
      "Показатели открытости информации, комфортности и доступности услуг для инвалидов; показатели НОК не являются автоматическими правилами нарушения.",
    documentType: "Приказ Минздрава России",
    number: "201н",
    adoptedAt: "2018-05-04",
    issuingAuthority: "Министерство здравоохранения Российской Федерации",
    officialPublicationUrl: URLS.order201,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2018-06-04",
    topicSlugs: ["independent-quality-assessment", "public-medical-information", "healthcare-accessibility"],
    sources: [
      source("Официальное опубликование приказа № 201н", URLS.order201, "current-2018-06-04"),
      source("Действующая карточка приказа № 201н на сайте Минздрава России", URLS.order201Card, "current-2018-06-04", 1, "OFFICIAL_GUIDANCE"),
    ],
    editions: [edition({
      key: "current-2018-06-04",
      title: "Редакция, действующая с 04.06.2018",
      effectiveFrom: "2018-06-04",
      legalStatus: "IN_FORCE",
      transitionNote: "На 13.08.2026 официальный источник не подтверждает прекращение действия приказа.",
      officialTextUrl: URLS.order201,
      verifiedAt: VERIFIED_AT,
      historicalUseAllowed: true,
      verificationNote:
        "Проверены официальное опубликование (регистрация Минюста 23.05.2018 № 51156) и действующая карточка Минздрава; акт об отмене не установлен.",
      provisions: [
        publicProvision({
          key: "indicator-1-1",
          topicSlug: "public-medical-information",
          locator: "Показатель 1.1",
          title: "Соответствие открытой информации установленным требованиям",
          requirement:
            "Показатель НОК характеризует соответствие информации о деятельности организации, размещённой на общедоступных информационных ресурсах, установленным содержанию и форме.",
          applicability:
            "Используется как показатель условий оказания услуг, а не как самостоятельный автоматический вывод о нарушении.",
          checks: [{
            key: "assess-indicator-1-1",
            question: "Какая информация и в каком канале оценивалась по показателю 1.1, и соответствует ли она применимому первичному перечню?",
            factToEstablish: "Канал, состав, доступность и применимая нормативная база информации в дату оценки.",
            primaryEvidenceType: "Датированный снимок ресурса или стенда, протокол наблюдения и применимый перечень информации.",
            nonCompliancePattern: "Показатель НОК фиксируется как результат оценки условий; сам по себе не доказывает правонарушение.",
            evidenceThreshold: "Раздельная фиксация каждого канала и ссылка на точную применимую норму; суммарного балла недостаточно.",
            applicabilityNote: "Официальный сайт и физический стенд не смешиваются; обязанность каждого канала подтверждается отдельно.",
          }],
        }),
        publicProvision({
          key: "indicator-2-1",
          topicSlug: "independent-quality-assessment",
          locator: "Показатель 2.1",
          title: "Комфортность условий и время ожидания",
          requirement: "Показатель НОК характеризует комфортность условий предоставления услуг, включая время ожидания.",
          applicability: "Оценивается методически в конкретном цикле; отдельные примеры из бланка не становятся универсальными обязанностями.",
          checks: [{
            key: "assess-indicator-2-1",
            question: "Какие условия комфортности и данные о времени ожидания подтверждены репрезентативными наблюдениями и документами цикла?",
            factToEstablish: "Фактические условия, период наблюдения, показатели ожидания и применимость к конкретной услуге.",
            primaryEvidenceType: "Протоколы наблюдений, журнал/информационная система очереди, локальные документы и датированные фото условий.",
            nonCompliancePattern: "Результат показателя НОК, а не автоматический юридический вывод по одному посещению.",
            evidenceThreshold: "Наблюдения и данные охватывают репрезентативный период; единичный визит не доказывает отсутствие очередей.",
            applicabilityNote: "Гардероб, места для колясок и каждый перечисленный канал записи требуют отдельной проверки применимости.",
          }],
        }, 1),
        publicProvision({
          key: "indicator-3-1",
          topicSlug: "healthcare-accessibility",
          locator: "Показатель 3.1",
          title: "Оснащение территории и помещений для доступности инвалидов",
          requirement: "Показатель НОК характеризует оборудование территории и помещений с учётом потребностей инвалидов.",
          applicability: "Методический показатель сопоставляется с точной обязанностью 181-ФЗ и отраслевым порядком применимого периода.",
          checks: [accessibilityCheck("assess-indicator-3-1", "Какие элементы доступности объекта фактически имеются и какое правовое требование применимо к объекту и периоду?", "Пандусы или платформы, парковка, лифты, поручни, дверные проёмы, кресла-коляски и санитарные помещения с учётом альтернативных мер.")],
        }, 2),
        publicProvision({
          key: "indicator-3-2",
          topicSlug: "healthcare-accessibility",
          locator: "Показатель 3.2",
          title: "Условия доступности услуг для инвалидов",
          requirement: "Показатель НОК характеризует доступность получения услуг инвалидами, включая информацию, перевод и сопровождение.",
          applicability: "Методический показатель не расширяет отраслевую норму на универсальную обязанность о любой услуге на дому.",
          checks: [accessibilityCheck("assess-indicator-3-2", "Какие способы доступного получения услуги и информации предусмотрены для конкретных ограничений и подтверждены в проверяемый период?", "Дублирование информации, Брайль, перевод, сопровождение обученным персоналом и применимый альтернативный способ оказания услуги.")],
        }, 3),
      ],
    })],
  }),
  act({
    slug: "minzdrav-order-197n-2018",
    title: "Приказ Минздрава России № 197н о видах организаций, для которых НОК не проводится",
    summary: "Перечень исключённых видов медицинских организаций является обязательной предварительной проверкой, но не доказывает включение иной конкретной клиники в НОК.",
    documentType: "Приказ Минздрава России",
    number: "197н",
    adoptedAt: "2018-04-28",
    issuingAuthority: "Министерство здравоохранения Российской Федерации",
    officialPublicationUrl: URLS.order197,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2018-06-09",
    topicSlugs: ["independent-quality-assessment"],
    sources: [
      source("Официальная карточка приказа № 197н", URLS.order197, "initial-2018-06-09", 0, "OFFICIAL_GUIDANCE"),
      source("Официальное опубликование изменений приказом № 615н", URLS.order615, "amended-2019-10-14", 1),
    ],
    editions: [
      edition({
        key: "initial-2018-06-09",
        title: "Первоначальная редакция",
        effectiveFrom: "2018-06-09",
        effectiveTo: "2019-10-13",
        legalStatus: "EXPIRED",
        transitionNote: "С 14.10.2019 применяется редакция с изменениями приказа № 615н.",
        officialTextUrl: URLS.order197,
        verifiedAt: VERIFIED_AT,
        historicalUseAllowed: true,
        verificationNote: "Исторический период отделён от редакции после приказа № 615н.",
        provisions: [publicProvision({
          key: "excluded-organization-types",
          topicSlug: "independent-quality-assessment",
          locator: "Перечень видов медицинских организаций",
          title: "Исключение отдельных видов организаций из НОК",
          requirement: "Независимая оценка не проводится в отношении видов медицинских организаций, прямо включённых в перечень.",
          applicability: "Предварительная проверка вида точного юридического лица по редакции до 14.10.2019.",
          effectiveFrom: "2018-06-09",
          effectiveTo: "2019-10-13",
          checks: [{
            key: "exclusion-check",
            question: "Относилось ли точное юридическое лицо в проверяемый год к виду организации, исключённому действовавшей редакцией перечня?",
            factToEstablish: "Организационно-правовая идентичность и вид организации по номенклатуре в конкретном году.",
            primaryEvidenceType: "ЕГРЮЛ, лицензия, учредительные документы и действовавшая номенклатура/перечень.",
            nonCompliancePattern: "Не формирует нарушение: положительный результат означает неприменимость официальной НОК.",
            evidenceThreshold: "Однозначное совпадение точного юридического лица и вида из применимой редакции перечня.",
            applicabilityNote: "Отсутствие вида в перечне исключений само по себе не доказывает участие организации в НОК.",
          }],
        })],
      }),
      edition({
        key: "amended-2019-10-14",
        title: "Редакция с изменениями приказа № 615н",
        effectiveFrom: "2019-10-14",
        legalStatus: "IN_FORCE",
        transitionNote: "Изменения приказа № 615н применяются с 14.10.2019.",
        officialTextUrl: URLS.order615,
        verifiedAt: VERIFIED_AT,
        historicalUseAllowed: true,
        verificationNote: "Переход подтверждён официальным опубликованием приказа № 615н от 03.10.2019.",
        provisions: [publicProvision({
          key: "excluded-organization-types",
          topicSlug: "independent-quality-assessment",
          locator: "Перечень видов медицинских организаций в редакции приказа № 615н",
          title: "Действующий перечень исключённых видов организаций",
          requirement: "Независимая оценка не проводится в отношении видов медицинских организаций, прямо включённых в действующую редакцию перечня.",
          applicability: "Предварительная проверка вида точного юридического лица с 14.10.2019.",
          effectiveFrom: "2019-10-14",
          checks: [{
            key: "exclusion-check",
            question: "Относилось ли точное юридическое лицо в проверяемый год к виду организации, исключённому редакцией после приказа № 615н?",
            factToEstablish: "Организационно-правовая идентичность и вид организации по действующей номенклатуре.",
            primaryEvidenceType: "ЕГРЮЛ, лицензия, учредительные документы и действующая номенклатура/перечень.",
            nonCompliancePattern: "Не формирует нарушение: положительный результат означает неприменимость официальной НОК.",
            evidenceThreshold: "Однозначное совпадение точного юридического лица и вида из применимой редакции перечня.",
            applicabilityNote: "Отсутствие вида в перечне исключений само по себе не доказывает участие организации в НОК.",
          }],
        })],
      }),
    ],
  }),
  act({
    slug: "mintrud-order-344n-2018",
    title: "Приказ Минтруда России № 344н о едином порядке расчёта показателей НОК",
    summary: "Порядок расчёта показателей независимой оценки; не является самостоятельной обязанностью конкретной медицинской организации.",
    documentType: "Приказ Минтруда России",
    number: "344н",
    adoptedAt: "2018-05-30",
    issuingAuthority: "Министерство труда и социальной защиты Российской Федерации",
    officialPublicationUrl: URLS.order344,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2018-10-23",
    topicSlugs: ["independent-quality-assessment"],
    sources: [
      source("Официальное опубликование приказа № 344н", URLS.order344, "initial-2018-10-23"),
      source("Официальное опубликование изменений приказом № 408н", URLS.order408, "amended-2024-10-05", 1),
    ],
    editions: [
      edition({
        key: "initial-2018-10-23",
        title: "Редакция до изменений приказом № 408н",
        effectiveFrom: "2018-10-23",
        effectiveTo: "2024-10-04",
        legalStatus: "EXPIRED",
        transitionNote: "С 05.10.2024 применяется редакция с изменениями приказа № 408н.",
        officialTextUrl: URLS.order344,
        verifiedAt: VERIFIED_AT,
        historicalUseAllowed: true,
        verificationNote: "Исторический период отделён от изменений 2024 года.",
        provisions: [publicProvision({
          key: "indicator-calculation",
          topicSlug: "independent-quality-assessment",
          locator: "Единый порядок расчёта показателей",
          title: "Исторический порядок расчёта показателей",
          requirement: "Оператор рассчитывает показатели НОК по единому порядку и исходным данным соответствующего цикла.",
          applicability: "К расчётам с 23.10.2018 по 04.10.2024; не является самостоятельной нормой поведения клиники.",
          effectiveFrom: "2018-10-23",
          effectiveTo: "2024-10-04",
          checks: [calculationCheck],
        })],
      }),
      edition({
        key: "amended-2024-10-05",
        title: "Редакция с изменениями приказа № 408н",
        effectiveFrom: "2024-10-05",
        legalStatus: "IN_FORCE",
        transitionNote: "Изменения приказа № 408н применяются с 05.10.2024.",
        officialTextUrl: URLS.order408,
        verifiedAt: VERIFIED_AT,
        historicalUseAllowed: true,
        verificationNote: "Переход подтверждён официальным опубликованием приказа № 408н.",
        provisions: [publicProvision({
          key: "indicator-calculation",
          topicSlug: "independent-quality-assessment",
          locator: "Единый порядок расчёта показателей в редакции приказа № 408н",
          title: "Действующий порядок расчёта показателей",
          requirement: "Оператор рассчитывает показатели НОК по действующей редакции единого порядка и исходным данным цикла.",
          applicability: "К расчётам с 05.10.2024; не является самостоятельной нормой поведения клиники.",
          effectiveFrom: "2024-10-05",
          checks: [calculationCheck],
        })],
      }),
    ],
  }),
  act({
    slug: "federal-law-181-fz",
    title: "Федеральный закон № 181-ФЗ «О социальной защите инвалидов в Российской Федерации»",
    summary: "Общая правовая основа доступности объектов и услуг; отраслевые способы исполнения в здравоохранении проверяются по применимому приказу Минздрава.",
    documentType: "Федеральный закон",
    number: "181-ФЗ",
    adoptedAt: "1995-11-24",
    issuingAuthority: "Российская Федерация",
    officialPublicationUrl: URLS.law181Current,
    legalStatus: "IN_FORCE",
    effectiveFrom: "1995-11-24",
    topicSlugs: ["healthcare-accessibility"],
    sources: [
      source("Официальный сводный текст Федерального закона № 181-ФЗ, редакция на 13.08.2026", URLS.law181Current, "consolidated-2026-08-13", 0, "OFFICIAL_CONSOLIDATED_TEXT"),
      source("Федеральный закон от 10.07.2023 № 293-ФЗ, сформировавший редакцию статьи 15 с 01.01.2024", URLS.law293, "consolidated-2026-08-13", 1, "OFFICIAL_PUBLICATION"),
      source("Федеральный закон от 29.12.2025 № 552-ФЗ о будущей редакции статьи 15", URLS.law552, "future-2026-09-01", 2, "OFFICIAL_PUBLICATION"),
    ],
    editions: [
      edition({
        key: "consolidated-2026-08-13",
        title: "Действующая редакция статьи 15 с 01.01.2024 по 31.08.2026, проверена 13.08.2026",
        effectiveFrom: "2024-01-01",
        effectiveTo: "2026-08-31",
        legalStatus: "IN_FORCE",
        transitionNote: "Для события до 01.01.2024 требуется отдельная архивная редакция статьи 15; текущая формулировка не применяется ретроактивно. С 01.09.2026 применяется редакция Федерального закона № 552-ФЗ.",
        officialTextUrl: URLS.law181Current,
        verifiedAt: VERIFIED_AT,
        historicalUseAllowed: false,
        verificationNote: "Проверены официальный сводный текст и Федеральный закон № 293-ФЗ: последняя вступившая в силу поправка к статье 15 действует с 01.01.2024. Редакция № 552-ФЗ на дату проверки ещё не вступила в силу.",
        provisions: [publicProvision({
          key: "article-15-accessibility",
          topicSlug: "healthcare-accessibility",
          locator: "Статья 15",
          title: "Доступность объектов и услуг для инвалидов",
          requirement: "Организации обеспечивают предусмотренные законом условия доступности объектов, информации, сопровождения и услуг для инвалидов.",
          applicability: "К конкретному объекту, услуге, категории ограничений и событиям с 01.01.2024 по 31.08.2026 с учётом отраслевого порядка и допустимых альтернатив.",
          effectiveFrom: "2024-01-01",
          effectiveTo: "2026-08-31",
          checks: [accessibilityCheck("accessible-object-and-service", "Какие условия доступности обязан обеспечить конкретный объект и услуга в проверяемый период и какими документами подтверждено их исполнение?", "Применимые требования к объекту, информации, сопровождению и способу получения услуги для конкретной категории инвалидности.")],
        })],
      }),
      edition({
        key: "future-2026-09-01",
        title: "Будущая редакция статьи 15 с 01.09.2026",
        effectiveFrom: "2026-09-01",
        legalStatus: "FUTURE",
        transitionNote: "Федеральный закон № 552-ФЗ опубликован, но на дату проверки 13.08.2026 ещё не вступил в силу и не применяется к более ранним событиям.",
        officialTextUrl: URLS.law552,
        verifiedAt: VERIFIED_AT,
        historicalUseAllowed: false,
        verificationNote: "Дата вступления будущей редакции проверена по статье 3 Федерального закона № 552-ФЗ.",
        provisions: [publicProvision({
          key: "article-15-accessibility-future",
          topicSlug: "healthcare-accessibility",
          locator: "Статья 15 в редакции Федерального закона № 552-ФЗ",
          title: "Доступность объектов и услуг для инвалидов с 01.09.2026",
          requirement: "Условия доступности объекта и услуг проверяются по редакции статьи 15, вступающей в силу 01.09.2026, без распространения её новых положений на прошлые события.",
          applicability: "Только к событиям с 01.09.2026; переходные положения для отдельных объектов проверяются отдельно.",
          effectiveFrom: "2026-09-01",
          checks: [accessibilityCheck("accessible-object-and-service-future", "Какие требования будущей редакции статьи 15 применимы к конкретному объекту и событию после 01.09.2026?", "Дата события, категория объекта, применимые переходные положения и точный способ обеспечения доступности.")],
        })],
      }),
    ],
  }),
  act({
    slug: "minzdrav-order-802n-2015",
    title: "Приказ Минздрава России № 802н о доступности объектов и услуг здравоохранения для инвалидов",
    summary: "Исторический отраслевой порядок доступности, действовавший до 31.08.2025.",
    documentType: "Приказ Минздрава России",
    number: "802н",
    adoptedAt: "2015-11-12",
    issuingAuthority: "Министерство здравоохранения Российской Федерации",
    officialPublicationUrl: URLS.order802,
    legalStatus: "EXPIRED",
    effectiveFrom: "2016-01-01",
    effectiveTo: "2025-08-31",
    topicSlugs: ["healthcare-accessibility"],
    sources: [source("Официальное опубликование приказа № 802н", URLS.order802, "historical-2016-01-01")],
    editions: [edition({
      key: "historical-2016-01-01",
      title: "Историческая редакция до 31.08.2025",
      effectiveFrom: "2016-01-01",
      effectiveTo: "2025-08-31",
      legalStatus: "EXPIRED",
      transitionNote: "С 01.09.2025 заменена приказом № 210н.",
      officialTextUrl: URLS.order802,
      verifiedAt: VERIFIED_AT,
      historicalUseAllowed: true,
      verificationNote: "Историческая применимость ограничена периодом до 31.08.2025.",
      provisions: [publicProvision({
        key: "paragraph-4-accessibility",
        topicSlug: "healthcare-accessibility",
        locator: "Пункт 4",
        title: "Исторические условия доступности объектов и услуг здравоохранения",
        requirement: "Медицинская организация обеспечивает предусмотренные пунктом 4 способы доступности объекта, информации, сопровождения и получения услуг.",
        applicability: "К событиям с 01.01.2016 по 31.08.2025 и только в объёме точной формулировки пункта 4.",
        effectiveFrom: "2016-01-01",
        effectiveTo: "2025-08-31",
        checks: [accessibilityCheck("historical-healthcare-accessibility", "Какие способы доступности из пункта 4 были применимы к объекту и услуге в исторический период?", "Конкретные способы доступности, предусмотренные пунктом 4, и их фактическое исполнение.")],
      })],
    })],
  }),
  act({
    slug: "minzdrav-order-210n-2025",
    title: "Приказ Минздрава России № 210н о доступности объектов и услуг здравоохранения для инвалидов",
    summary: "Действующий с 01.09.2025 отраслевой порядок доступности, заменивший приказ № 802н.",
    documentType: "Приказ Минздрава России",
    number: "210н",
    adoptedAt: "2025-04-14",
    issuingAuthority: "Министерство здравоохранения Российской Федерации",
    officialPublicationUrl: URLS.order210,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2025-09-01",
    effectiveTo: "2031-08-31",
    topicSlugs: ["healthcare-accessibility"],
    sources: [source("Официальное опубликование приказа № 210н", URLS.order210, "current-2025-09-01")],
    editions: [edition({
      key: "current-2025-09-01",
      title: "Редакция, действующая с 01.09.2025",
      effectiveFrom: "2025-09-01",
      effectiveTo: "2031-08-31",
      legalStatus: "IN_FORCE",
      transitionNote: "Применяется с 01.09.2025 вместо приказа № 802н и не применяется ретроактивно.",
      officialTextUrl: URLS.order210,
      verifiedAt: VERIFIED_AT,
      historicalUseAllowed: false,
      verificationNote: "Проверены официальный источник и период действия 01.09.2025–31.08.2031.",
      provisions: [publicProvision({
        key: "paragraph-1-accessibility",
        topicSlug: "healthcare-accessibility",
        locator: "Пункт 1",
        title: "Действующие условия доступности объектов и услуг здравоохранения",
        requirement: "С 01.09.2025 медицинские организации обеспечивают доступность объектов и услуг в порядке, установленном приказом № 210н.",
        applicability: "К событиям с 01.09.2025 по 31.08.2031 и в объёме точной формулировки пункта 1.",
        effectiveFrom: "2025-09-01",
        effectiveTo: "2031-08-31",
        checks: [accessibilityCheck("current-healthcare-accessibility", "Какие способы доступности из пункта 1 применимы к объекту и услуге после 01.09.2025?", "Конкретные способы доступности, предусмотренные пунктом 1, и их фактическое исполнение.")],
      })],
    })],
    relations: [{
      targetSlug: "minzdrav-order-802n-2015",
      type: "REPLACES",
      legalEffectFrom: "2025-09-01",
      note: "Приказ № 210н заменил приказ № 802н с 01.09.2025.",
      officialSourceUrl: URLS.order210,
      isPublished: true,
    }],
  }),
  act({
    slug: "government-resolution-1006-2012",
    title: "Постановление Правительства РФ № 1006 о платных медицинских услугах",
    summary: "Исторические правила предоставления платных медицинских услуг, действовавшие до 31.08.2023.",
    documentType: "Постановление Правительства РФ",
    number: "1006",
    adoptedAt: "2012-10-04",
    issuingAuthority: "Правительство Российской Федерации",
    officialPublicationUrl: URLS.resolution1006,
    legalStatus: "EXPIRED",
    effectiveFrom: "2013-01-01",
    effectiveTo: "2023-08-31",
    topicSlugs: ["paid-medical-services", "public-medical-information"],
    sources: [source("Официальный сводный текст постановления № 1006", URLS.resolution1006, "historical-2013-01-01", 0, "OFFICIAL_CONSOLIDATED_TEXT")],
    editions: [edition({
      key: "historical-2013-01-01",
      title: "Исторические правила до 31.08.2023",
      effectiveFrom: "2013-01-01",
      effectiveTo: "2023-08-31",
      legalStatus: "EXPIRED",
      transitionNote: "С 01.09.2023 заменены правилами постановления № 736.",
      officialTextUrl: URLS.resolution1006,
      verifiedAt: VERIFIED_AT,
      historicalUseAllowed: true,
      verificationNote: "Историческое применение ограничено периодом до 31.08.2023.",
      provisions: [publicProvision({
        key: "paid-services-information",
        topicSlug: "paid-medical-services",
        locator: "Правила, пункты 11–17",
        title: "Историческая информация о платных медицинских услугах",
        requirement: "Исполнитель предоставляет потребителю установленную правилами информацию об услугах, ценах, условиях и исполнителях.",
        applicability: "К договорам и информированию в период с 01.01.2013 по 31.08.2023.",
        effectiveFrom: "2013-01-01",
        effectiveTo: "2023-08-31",
        checks: [paidServicesCheck],
      })],
    })],
  }),
  act({
    slug: "government-resolution-736-2023",
    title: "Постановление Правительства РФ № 736 о платных медицинских услугах",
    summary: "Действующие на 13.08.2026 правила предоставления платных медицинских услуг; прекращают действие 31.08.2026.",
    documentType: "Постановление Правительства РФ",
    number: "736",
    adoptedAt: "2023-05-11",
    issuingAuthority: "Правительство Российской Федерации",
    officialPublicationUrl: URLS.resolution736,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2023-09-01",
    effectiveTo: "2026-08-31",
    topicSlugs: ["paid-medical-services", "public-medical-information"],
    sources: [source("Официальное опубликование постановления № 736", URLS.resolution736, "current-2023-09-01")],
    editions: [edition({
      key: "current-2023-09-01",
      title: "Редакция, действующая до 31.08.2026",
      effectiveFrom: "2023-09-01",
      effectiveTo: "2026-08-31",
      legalStatus: "IN_FORCE",
      transitionNote: "С 01.09.2026 применяются новые правила постановления № 659; ретроактивная замена запрещена.",
      officialTextUrl: URLS.resolution736,
      verifiedAt: VERIFIED_AT,
      historicalUseAllowed: true,
      verificationNote: "На 13.08.2026 правила действуют; конечная дата 31.08.2026 сохранена явно.",
      provisions: [publicProvision({
        key: "paid-services-information",
        topicSlug: "paid-medical-services",
        locator: "Правила, пункты 12–18",
        title: "Информация о платных медицинских услугах",
        requirement: "Исполнитель предоставляет потребителю информацию, предусмотренную пунктами 12–18 Правил, до заключения договора.",
        applicability: "К договорам и информированию с 01.09.2023 по 31.08.2026.",
        effectiveFrom: "2023-09-01",
        effectiveTo: "2026-08-31",
        checks: [paidServicesCheck],
      })],
    })],
    relations: [{
      targetSlug: "government-resolution-1006-2012",
      type: "REPLACES",
      legalEffectFrom: "2023-09-01",
      note: "Постановление № 736 заменило исторические правила постановления № 1006.",
      officialSourceUrl: URLS.resolution736,
      isPublished: true,
    }],
  }),
  act({
    slug: "government-resolution-659-2026",
    title: "Постановление Правительства РФ № 659 о платных медицинских услугах",
    summary: "Будущие правила, вступающие в силу 01.09.2026; на 13.08.2026 не применяются.",
    documentType: "Постановление Правительства РФ",
    number: "659",
    adoptedAt: "2026-05-29",
    issuingAuthority: "Правительство Российской Федерации",
    officialPublicationUrl: URLS.resolution659,
    legalStatus: "FUTURE",
    effectiveFrom: "2026-09-01",
    effectiveTo: "2031-08-31",
    topicSlugs: ["paid-medical-services", "public-medical-information"],
    sources: [source("Официальное опубликование постановления № 659", URLS.resolution659, "future-2026-09-01")],
    editions: [edition({
      key: "future-2026-09-01",
      title: "Будущая редакция с 01.09.2026",
      effectiveFrom: "2026-09-01",
      effectiveTo: "2031-08-31",
      legalStatus: "FUTURE",
      transitionNote: "На 13.08.2026 ещё не действует и не применяется к более ранним событиям.",
      officialTextUrl: URLS.resolution659,
      verifiedAt: VERIFIED_AT,
      historicalUseAllowed: false,
      verificationNote: "Проверены официальный источник и будущий период 01.09.2026–31.08.2031.",
      provisions: [publicProvision({
        key: "paid-services-information",
        topicSlug: "paid-medical-services",
        locator: "Правила, раздел об информации исполнителя и потребителя",
        title: "Будущая информация о платных медицинских услугах",
        requirement: "С 01.09.2026 исполнитель предоставляет потребителю информацию в составе и порядке новых Правил.",
        applicability: "Только к договорам и информированию с 01.09.2026; до этой даты применяется постановление № 736.",
        effectiveFrom: "2026-09-01",
        effectiveTo: "2031-08-31",
        checks: [paidServicesCheck],
      })],
    })],
    relations: [{
      targetSlug: "government-resolution-736-2023",
      type: "REPLACES",
      legalEffectFrom: "2026-09-01",
      note: "Постановление № 659 заменяет правила постановления № 736 с 01.09.2026.",
      officialSourceUrl: URLS.resolution659,
      isPublished: true,
    }],
  }),
];
