import type {
  RegulationLegalStatusSeed,
  RegulationProvisionSeed,
  RegulationSeed,
  RegulationSourceKindSeed,
  RegulationSourceSeed,
  RegulatoryCheckSeed,
} from "./types";

const VERIFIED_AT = "2026-08-12";
const PUBLISHED_AT = "2026-08-12";

const RZN_LICENSE_REGISTER = "https://roszdravnadzor.gov.ru/services/licenses";
const RZN_MEDICAL_DEVICE_REGISTER = "https://roszdravnadzor.gov.ru/services/misearch";
const RZN_WITHDRAWAL_REGISTER = "https://www.roszdravnadzor.gov.ru/services/withdrawalmd";

type CheckInput = Omit<
  RegulatoryCheckSeed,
  "isPublished" | "publishedAt" | "sortOrder" | "evidenceThreshold"
> & {
  evidenceThreshold?: string;
};

function check(input: CheckInput, sortOrder = 0): RegulatoryCheckSeed {
  return {
    ...input,
    evidenceThreshold:
      input.evidenceThreshold ??
      "Применимая к дате события редакция нормы и первичный документ либо официальная реестровая запись. Отрицательный поиск, отсутствие документа в полученном комплекте и сообщение третьего лица сами по себе недостаточны; проверяется и альтернативная версия.",
    isPublished: true,
    publishedAt: PUBLISHED_AT,
    sortOrder,
  };
}

type ProvisionInput = Omit<
  RegulationProvisionSeed,
  "isPublished" | "publishedAt" | "sortOrder" | "checks"
> & {
  checks: CheckInput[];
};

function provision(input: ProvisionInput, sortOrder = 0): RegulationProvisionSeed {
  return {
    ...input,
    checks: input.checks.map((item, index) => check(item, index)),
    isPublished: true,
    publishedAt: PUBLISHED_AT,
    sortOrder,
  };
}

type SourceInput = {
  kind: RegulationSourceKindSeed;
  title: string;
  url: string;
  sourceDate?: string;
  sortOrder?: number;
};

type RegulationInput = {
  slug: string;
  title: string;
  summary: string;
  content?: string;
  documentType: string;
  number: string;
  adoptedAt: string;
  issuingAuthority: string;
  officialPublicationUrl: string;
  legalStatus: RegulationLegalStatusSeed;
  effectiveFrom: string;
  effectiveTo?: string;
  topicSlugs: string[];
  mainSource: SourceInput;
  additionalSources?: SourceInput[];
  edition: {
    key: string;
    title: string;
    effectiveFrom: string;
    effectiveTo?: string;
    legalStatus: RegulationLegalStatusSeed;
    transitionNote: string;
    officialTextUrl: string;
    historicalUseAllowed: boolean;
    verificationNote: string;
    provisions: RegulationProvisionSeed[];
  };
};

function regulation(input: RegulationInput): RegulationSeed {
  const sources: RegulationSourceSeed[] = [input.mainSource, ...(input.additionalSources ?? [])].map(
    (source, index) => ({
      kind: source.kind,
      title: source.title,
      url: source.url,
      isOfficial: true,
      isPublished: true,
      publishedAt: PUBLISHED_AT,
      sourceDate: source.sourceDate,
      editionKey: input.edition.key,
      sortOrder: source.sortOrder ?? index,
    }),
  );

  return {
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    content: input.content,
    documentType: input.documentType,
    number: input.number,
    adoptedAt: input.adoptedAt,
    issuingAuthority: input.issuingAuthority,
    jurisdiction: "Российская Федерация",
    officialPublicationUrl: input.officialPublicationUrl,
    legalStatus: input.legalStatus,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    isPublished: true,
    publishedAt: PUBLISHED_AT,
    seoTitle: `${input.number}: требования и вопросы для проверки`,
    seoDescription: `${input.title}: период действия, точные положения, официальный источник и нейтральные вопросы для проверки медицинской организации.`,
    topicSlugs: input.topicSlugs,
    sources,
    editions: [
      {
        key: input.edition.key,
        title: input.edition.title,
        effectiveFrom: input.edition.effectiveFrom,
        effectiveTo: input.edition.effectiveTo,
        legalStatus: input.edition.legalStatus,
        transitionNote: input.edition.transitionNote,
        officialTextUrl: input.edition.officialTextUrl,
        verifiedAt: VERIFIED_AT,
        historicalUseAllowed: input.edition.historicalUseAllowed,
        verificationNote: input.edition.verificationNote,
        isPublished: true,
        publishedAt: PUBLISHED_AT,
        provisions: input.edition.provisions,
      },
    ],
  };
}

const FEDERAL_LAW_99_CURRENT_TEXT =
  "https://pravo.gov.ru/proxy/ips/?docbody=&nd=102147413";

const MINZDRAV_ORDER_866N_CURRENT_TEXT =
  "https://www.roszdravnadzor.gov.ru/i/upload/images/2025/7/17/1752757733.38032-1-468422.rtf";

const GOVERNMENT_RESOLUTION_1650_TEXT =
  "https://www.roszdravnadzor.gov.ru/i/upload/images/2022/6/21/1655829541.90958-1-36114.docx";

const GOVERNMENT_RESOLUTION_145_TEXT =
  "https://www.roszdravnadzor.gov.ru/i/upload/images/2022/10/24/1666611512.41938-1-22235.docx";

const ROSZDRAVNADZOR_ORDER_756_TEXT =
  "https://www.roszdravnadzor.gov.ru/i/upload/images/2022/3/1/1646121108.07992-1-174526.pdf";

const ROSZDRAVNADZOR_ORDER_26_PUBLICATION =
  "https://publication.pravo.gov.ru/document/0001202602190020";

/**
 * Дополнительный проверенный корпус. Он намеренно не является перечнем всех
 * актов Росздравнадзора: включены только нормы с точным локатором, периодом,
 * официальным HTTPS-источником и проверяемым первичным документом.
 */
export const EXTENDED_REGULATIONS: RegulationSeed[] = [
  regulation({
    slug: "federal-law-99-fz",
    title: "Федеральный закон № 99-ФЗ «О лицензировании отдельных видов деятельности»",
    summary:
      "Рамочная норма о лицензировании медицинской деятельности; конкретные работы, услуги, адреса и лицензионные требования устанавливаются специальными актами.",
    content:
      "Пункт 46 отвечает только на вопрос, относится ли медицинская деятельность к лицензируемым видам. Он не заменяет проверку Положения о лицензировании, классификатора работ и исторического состояния реестра лицензий.",
    documentType: "Федеральный закон",
    number: "99-ФЗ",
    adoptedAt: "2011-05-04",
    issuingAuthority: "Российская Федерация",
    officialPublicationUrl: FEDERAL_LAW_99_CURRENT_TEXT,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2011-11-03",
    topicSlugs: ["medical-activity-licensing"],
    mainSource: {
      kind: "OFFICIAL_CONSOLIDATED_TEXT",
      title: "Официальный консолидированный текст по состоянию на 01.03.2026",
      url: FEDERAL_LAW_99_CURRENT_TEXT,
      sourceDate: "2026-03-01",
    },
    edition: {
      key: "current-2026-03-01",
      title: "Текущий проверенный срез по состоянию на 01.03.2026",
      effectiveFrom: "2026-03-01",
      legalStatus: "IN_FORCE",
      transitionNote:
        "Для события до 01.03.2026 требуется архивная редакция закона и действовавшие тогда специальные правила лицензирования.",
      officialTextUrl: FEDERAL_LAW_99_CURRENT_TEXT,
      historicalUseAllowed: false,
      verificationNote:
        "По официальному консолидированному тексту сверены только статья 12 часть 1 пункт 46 и общий срок вступления закона в силу по статье 24. Карточка не подтверждает состав конкретных работ, адресов или лицензионных требований для более раннего события.",
      provisions: [
        provision({
          key: "article-12-part-1-item-46",
          topicSlug: "medical-activity-licensing",
          locator: "Статья 12, часть 1, пункт 46",
          title: "Медицинская деятельность как лицензируемый вид деятельности",
          requirement:
            "Медицинская деятельность относится к видам деятельности, на которые требуется лицензия, с прямо указанным в пункте 46 исключением для деятельности определённых организаций частной системы здравоохранения на территории инновационного центра «Сколково».",
          applicability:
            "К проверяемому юридическому лицу или индивидуальному предпринимателю и фактически осуществлявшейся медицинской деятельности. Точный состав работ, услуг, адресов и исключений устанавливается по специальным актам и редакциям, действовавшим на дату события.",
          effectiveFrom: "2026-03-01",
          checks: [
            {
              key: "medical-activity-license-at-event-date",
              question:
                "Охватывала ли действовавшая на дату события лицензия именно проверяемое лицо, адрес и фактически выполнявшиеся медицинские работы (услуги), с учётом применимых исключений?",
              factToEstablish:
                "Лицензиат, адрес места деятельности, перечень работ (услуг), дата возникновения права и статус записи на дату события.",
              primaryEvidenceType:
                "Официальная выписка из реестра лицензий, включая историческое состояние на дату события, и документы, идентифицирующие фактически выполненную медицинскую работу (услугу).",
              officialSearchUrl: RZN_LICENSE_REGISTER,
              officialSearchLabel: "Единый реестр лицензий Росздравнадзора",
              nonCompliancePattern:
                "Документированное осуществление лицензируемой медицинской деятельности вне подтверждённого объёма права после проверки исключений и архивного состояния реестра; отсутствие результата одного поиска не является достаточным выводом.",
            },
          ],
        }),
      ],
    },
  }),

  regulation({
    slug: "minzdrav-order-866n-2021",
    title: "Приказ Минздрава России № 866н о классификаторе работ (услуг), составляющих медицинскую деятельность",
    summary:
      "Классификатор связывает работу по офтальмологии с видом медицинской помощи и условиями её оказания для корректной проверки объёма лицензии.",
    content:
      "Строки классификатора не доказывают сами по себе, что конкретная организация выполняла указанную работу. Сначала устанавливаются фактическая услуга, вид помощи, условия и адрес, затем они сопоставляются с лицензией.",
    documentType: "Приказ Минздрава России",
    number: "866н",
    adoptedAt: "2021-08-19",
    issuingAuthority: "Министерство здравоохранения Российской Федерации",
    officialPublicationUrl: MINZDRAV_ORDER_866N_CURRENT_TEXT,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2021-09-11",
    effectiveTo: "2027-08-31",
    topicSlugs: ["medical-activity-licensing"],
    mainSource: {
      kind: "OFFICIAL_CONSOLIDATED_TEXT",
      title: "Официальный консолидированный текст в редакции приказа № 293н",
      url: MINZDRAV_ORDER_866N_CURRENT_TEXT,
    },
    additionalSources: [
      {
        kind: "OFFICIAL_PUBLICATION",
        title: "Официальное опубликование приказа Минздрава России № 293н",
        url: "https://publication.pravo.gov.ru/document/0001202506300014",
        sourceDate: "2025-06-30",
      },
    ],
    edition: {
      key: "current-after-293n",
      title: "Редакция после приказа Минздрава России № 293н",
      effectiveFrom: "2025-07-11",
      effectiveTo: "2027-08-31",
      legalStatus: "IN_FORCE",
      transitionNote:
        "Карточка ограничена текущим проверенным срезом с 11.07.2025 по 31.08.2027. Для более раннего события требуется отдельная редакция классификатора.",
      officialTextUrl: MINZDRAV_ORDER_866N_CURRENT_TEXT,
      historicalUseAllowed: false,
      verificationNote:
        "В официальном консолидированном тексте в редакции приказов № 494н, № 356н и № 293н сверены пункт 1 и пункт 2, включая строки «по офтальмологии», а также пункт 3 о сроке действия. Иные строки классификатора не проверялись для этой карточки.",
      provisions: [
        provision({
          key: "classifier-item-1-ophthalmology",
          topicSlug: "medical-activity-licensing",
          locator: "Классификатор, пункт 1, строка «по офтальмологии»",
          title: "Офтальмология в первичной медико-санитарной помощи",
          requirement:
            "В рамках первичной медико-санитарной помощи работа по офтальмологии отнесена к первичной специализированной медико-санитарной помощи в амбулаторных условиях и в условиях дневного стационара.",
          applicability:
            "Только при подтверждении, что фактическая работа выполнялась как первичная медико-санитарная помощь в одном из указанных условий. Строка не переносится на специализированную или высокотехнологичную помощь.",
          effectiveFrom: "2025-07-11",
          effectiveTo: "2027-08-31",
          checks: [
            {
              key: "primary-ophthalmology-license-scope",
              question:
                "Совпадают ли фактически оказываемая работа по офтальмологии, вид первичной помощи, условия оказания и адрес с записью в лицензии на дату события?",
              factToEstablish:
                "Фактическая медицинская работа, вид помощи, амбулаторные условия либо дневной стационар, адрес и соответствующая запись лицензии.",
              primaryEvidenceType:
                "Историческая выписка из реестра лицензий, медицинская документация по услуге и документы об организационной форме подразделения.",
              officialSearchUrl: RZN_LICENSE_REGISTER,
              officialSearchLabel: "Единый реестр лицензий Росздравнадзора",
              nonCompliancePattern:
                "Подтверждённая первичная офтальмологическая работа не охватывается действовавшей записью лицензии по виду помощи, условиям или адресу; сначала проверяются архивная запись и фактическая квалификация услуги.",
            },
          ],
        }),
        provision(
          {
            key: "classifier-item-2-ophthalmology",
            topicSlug: "medical-activity-licensing",
            locator: "Классификатор, пункт 2, строка «по офтальмологии»",
            title: "Офтальмология в специализированной и высокотехнологичной помощи",
            requirement:
              "Работа по офтальмологии отнесена к специализированной медицинской помощи в дневном стационаре и стационарно, а также к высокотехнологичной медицинской помощи в дневном стационаре и стационарно.",
            applicability:
              "Только при подтверждении соответствующего вида помощи и условий её оказания. Наличие оборудования или название процедуры сами по себе не устанавливают вид медицинской помощи.",
            effectiveFrom: "2025-07-11",
            effectiveTo: "2027-08-31",
            checks: [
              {
                key: "specialized-ophthalmology-license-scope",
                question:
                  "Как квалифицированы фактически оказанные офтальмологические услуги по виду помощи и условиям, и охватывала ли их лицензия на дату и по адресу события?",
                factToEstablish:
                  "Содержание услуги, специализированная либо высокотехнологичная помощь, дневной стационар либо стационар, адрес и объём лицензии.",
                primaryEvidenceType:
                  "Историческая выписка из реестра лицензий, первичная медицинская документация, положение о подразделении и применимый порядок оказания помощи.",
                officialSearchUrl: RZN_LICENSE_REGISTER,
                officialSearchLabel: "Единый реестр лицензий Росздравнадзора",
                nonCompliancePattern:
                  "Документированная услуга соответствующего вида и условий не охватывается действовавшей лицензией; вывод не делается только по названию оборудования, рекламному описанию или одному отсутствующему документу.",
              },
            ],
          },
          1,
        ),
      ],
    },
  }),

  regulation({
    slug: "government-resolution-1650-2021",
    title: "Постановление Правительства РФ № 1650 о ведении государственного реестра медицинских изделий",
    summary:
      "Правила определяют состав публичной реестровой записи о медицинском изделии, сохранение истории изменений и предоставление официальной выписки.",
    content:
      "Реестровая карточка используется для точной идентификации изделия и состояния регистрации на дату события. Совпадение только по торговому названию или отсутствие результата одного поискового запроса не заменяет проверку регистрационного удостоверения, производителя, модификации и исторической записи.",
    documentType: "Постановление Правительства Российской Федерации",
    number: "1650",
    adoptedAt: "2021-09-30",
    issuingAuthority: "Правительство Российской Федерации",
    officialPublicationUrl: GOVERNMENT_RESOLUTION_1650_TEXT,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2022-03-01",
    effectiveTo: "2028-02-29",
    topicSlugs: ["medical-device-registration"],
    mainSource: {
      kind: "OFFICIAL_CONSOLIDATED_TEXT",
      title: "Официальная копия текста постановления на сайте Росздравнадзора",
      url: GOVERNMENT_RESOLUTION_1650_TEXT,
    },
    additionalSources: [
      {
        kind: "OFFICIAL_GUIDANCE",
        title: "Официальный раздел Росздравнадзора о государственной регистрации медицинских изделий",
        url: "https://www.roszdravnadzor.gov.ru/medproducts/registration",
      },
      {
        kind: "OFFICIAL_REGISTER",
        title: "Государственный реестр медицинских изделий",
        url: RZN_MEDICAL_DEVICE_REGISTER,
      },
    ],
    edition: {
      key: "verified-rzn-copy-2026-08-12",
      title: "Редакция, сверенная по официальной копии Росздравнадзора",
      effectiveFrom: "2022-03-01",
      effectiveTo: "2028-02-29",
      legalStatus: "IN_FORCE",
      transitionNote:
        "Постановление установило период с 01.03.2022 до 01.03.2028. Для вывода о состоянии регистрации используется запись и её история именно на дату проверяемого события.",
      officialTextUrl: GOVERNMENT_RESOLUTION_1650_TEXT,
      historicalUseAllowed: false,
      verificationNote:
        "По официальной копии текста сверены пункт 5 постановления и пункты 6, 7, 9, 12 и 14 Правил. Карточка описывает доказательную ценность реестра, но не превращает отсутствие результата поиска в доказательство отсутствия регистрации.",
      provisions: [
        provision({
          key: "rules-items-6-7-9-register-record",
          topicSlug: "medical-device-registration",
          locator: "Правила, пункты 6, 7 и 9",
          title: "Состав записи и история государственного реестра медицинских изделий",
          requirement:
            "Реестр содержит идентифицирующие сведения о медицинском изделии, регистрации, назначении, виде, классе риска, производителе, производственных площадках и документации; изменения вносятся с сохранением уникального номера и истории, а опубликованные сведения обновляются ежедневно с сохранением предыдущих редакций.",
          applicability:
            "К установлению содержания официальной реестровой записи конкретного медицинского изделия и её состояния на дату события. Реестровое наименование модели не заменяет идентификацию конкретного экземпляра, серии или модификации.",
          effectiveFrom: "2022-03-01",
          effectiveTo: "2028-02-29",
          checks: [
            {
              key: "exact-device-historical-register-record",
              question:
                "Какая редакция официальной реестровой записи действовала на дату события и охватывает ли она точного производителя, наименование, модель или модификацию, назначение и производственную площадку проверяемого изделия?",
              factToEstablish:
                "Регистрационный номер, статус и срок, история записи, производитель, модель или модификация, назначение и связь этих сведений с конкретным экземпляром.",
              primaryEvidenceType:
                "Официальная выписка из государственного реестра, регистрационное удостоверение, эксплуатационная документация и паспорт или формуляр конкретного экземпляра с идентификаторами.",
              officialSearchUrl: RZN_MEDICAL_DEVICE_REGISTER,
              officialSearchLabel: "Государственный реестр медицинских изделий",
              nonCompliancePattern:
                "Подтверждённое несовпадение конкретного изделия с действовавшей регистрационной записью является основанием для дальнейшей правовой проверки; отсутствие результата по одному варианту названия не доказывает нарушение.",
            },
          ],
        }),
        provision(
          {
            key: "rules-items-12-14-public-extract",
            topicSlug: "medical-device-registration",
            locator: "Правила, пункты 12 и 14",
            title: "Открытость сведений и официальная выписка из реестра",
            requirement:
              "Сведения реестра являются общедоступными; Росздравнадзор предоставляет выписку из реестра либо сообщает об отсутствии сведений в установленный Правилами срок.",
            applicability:
              "К документированию результата проверки реестра. Сообщение об отсутствии сведений оценивается вместе с параметрами запроса, альтернативными наименованиями, регистрационным удостоверением и датой события.",
            effectiveFrom: "2022-03-01",
            effectiveTo: "2028-02-29",
            checks: [
              {
                key: "official-register-extract-request",
                question:
                  "Получена ли официальная выписка или официальный ответ Росздравнадзора по достаточно точным идентификаторам изделия и относимой дате?",
                factToEstablish:
                  "Параметры запроса, официальный ответ, дата состояния сведений и совпадение идентификаторов с документами конкретного изделия.",
                primaryEvidenceType:
                  "Подписанная официальная выписка из реестра либо официальный ответ Росздравнадзора, запрос и документы с идентификаторами конкретного экземпляра.",
                officialSearchUrl: RZN_MEDICAL_DEVICE_REGISTER,
                officialSearchLabel: "Государственный реестр медицинских изделий",
                nonCompliancePattern:
                  "Официальный ответ фиксирует реестровый факт, но правовой вывод требует проверки точности запроса, исторической редакции и возможных специальных режимов регистрации.",
              },
            ],
          },
          1,
        ),
      ],
    },
  }),

  regulation({
    slug: "government-resolution-145-2022",
    title: "Постановление Правительства РФ № 145 об изъятии из обращения и уничтожении отдельных медицинских изделий",
    summary:
      "Правила для изъятия и уничтожения фальсифицированных, недоброкачественных и контрафактных медицинских изделий с обязательной идентификацией изделия и документированным основанием.",
    content:
      "Постановление не устанавливает общий срок службы оборудования и не означает, что старый год выпуска либо прекращение производства модели сами по себе требуют изъятия. Его порядок применяется только после подтверждения предусмотренной законом категории и основания в отношении конкретного изделия.",
    documentType: "Постановление Правительства Российской Федерации",
    number: "145",
    adoptedAt: "2022-02-10",
    issuingAuthority: "Правительство Российской Федерации",
    officialPublicationUrl: GOVERNMENT_RESOLUTION_145_TEXT,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2022-09-01",
    effectiveTo: "2028-08-31",
    topicSlugs: ["decommissioning", "medical-device-operation"],
    mainSource: {
      kind: "OFFICIAL_CONSOLIDATED_TEXT",
      title: "Официальная копия текста постановления на сайте Росздравнадзора",
      url: GOVERNMENT_RESOLUTION_145_TEXT,
    },
    additionalSources: [
      {
        kind: "OFFICIAL_GUIDANCE",
        title: "Карточка постановления в официальном перечне Росздравнадзора",
        url: "https://www.roszdravnadzor.gov.ru/medproducts/control/documents/78834",
      },
      {
        kind: "OFFICIAL_REGISTER",
        title: "Решения Росздравнадзора об изъятии медицинских изделий из обращения",
        url: RZN_WITHDRAWAL_REGISTER,
      },
    ],
    edition: {
      key: "verified-rzn-copy-2026-08-12",
      title: "Редакция, сверенная по официальной копии Росздравнадзора",
      effectiveFrom: "2022-09-01",
      effectiveTo: "2028-08-31",
      legalStatus: "IN_FORCE",
      transitionNote:
        "Постановление действует с 01.09.2022 до 01.09.2028. Оно не применяется к обычному списанию оборудования, если отсутствует квалификация изделия как фальсифицированного, недоброкачественного или контрафактного.",
      officialTextUrl: GOVERNMENT_RESOLUTION_145_TEXT,
      historicalUseAllowed: false,
      verificationNote:
        "По официальной копии сверены пункт 3 постановления и пункты 2, 3, 6, 7, 10 и 11 Правил. Норма не позволяет выводить основание для изъятия только из возраста, прекращения выпуска модели, отсутствия найденного документа или сообщения третьей стороны.",
      provisions: [
        provision({
          key: "rules-items-2-3-6-7-withdrawal-decision",
          topicSlug: "decommissioning",
          locator: "Правила, пункты 2, 3, 6 и 7",
          title: "Основание и идентификация при изъятии медицинского изделия",
          requirement:
            "Изъятие в смысле Правил обеспечивает невозможность дальнейшего применения и иных операций с изделием. Для фальсифицированного или недоброкачественного изделия требуется решение владельца, Росздравнадзора либо суда, для контрафактного — решение суда; решение Росздравнадзора должно идентифицировать изделие, серию, партию или лот, количество, признаки квалификации и документы контроля.",
          applicability:
            "Только к конкретному изделию, отнесённому к одной из категорий Правил, и к решению компетентного лица или органа. Положение не устанавливает автоматическое изъятие исправного изделия из-за возраста модели или прекращения её производства.",
          effectiveFrom: "2022-09-01",
          effectiveTo: "2028-08-31",
          checks: [
            {
              key: "withdrawal-ground-and-exact-item",
              question:
                "Есть ли предусмотренное Правилами решение, подтверждённая категория изделия и достаточные идентификаторы, связывающие решение именно с проверяемым экземпляром, серией, партией или лотом?",
              factToEstablish:
                "Вид решения, компетенция принявшего его лица или органа, категория изделия, основания квалификации и точное совпадение идентификаторов.",
              primaryEvidenceType:
                "Решение владельца, Росздравнадзора или суда; акт контрольного мероприятия или экспертное заключение; регистрационные и эксплуатационные документы; паспорт или формуляр конкретного экземпляра.",
              officialSearchUrl: RZN_WITHDRAWAL_REGISTER,
              officialSearchLabel: "Решения Росздравнадзора об изъятии медицинских изделий",
              nonCompliancePattern:
                "Установленное компетентным документом продолжение обращения конкретно идентифицированного изделия вопреки применимому решению; одного старого года выпуска, прекращения производства или ненайденной записи недостаточно.",
            },
          ],
        }),
        provision(
          {
            key: "rules-items-10-11-owner-decision-and-destruction",
            topicSlug: "decommissioning",
            locator: "Правила, пункты 10 и 11",
            title: "Самостоятельное решение владельца и документы уничтожения",
            requirement:
              "Самостоятельное решение владельца о квалификации и изъятии требует подтверждения категории изделия и незамедлительного уведомления производителя (либо его уполномоченного представителя) и Росздравнадзора; исполнить решение можно не ранее чем через 60 рабочих дней после уведомления. После уничтожения владелец направляет в Росздравнадзор сведения и акт уничтожения в установленный срок.",
            applicability:
              "Только когда владелец применяет процедуру Правил к фальсифицированному или недоброкачественному изделию. Для обычного вывода исправного оборудования из эксплуатации применяются иные основания и первичные документы.",
            effectiveFrom: "2022-09-01",
            effectiveTo: "2028-08-31",
            checks: [
              {
                key: "owner-withdrawal-and-destruction-documents",
                question:
                  "Если решение принято владельцем, подтверждены ли основания квалификации, выполнены ли уведомления и имеется ли акт уничтожения, относящийся к точно идентифицированному изделию?",
                factToEstablish:
                  "Основания решения владельца, подтверждающие документы, адресаты и даты уведомлений, способ и дата уничтожения, идентификаторы изделия в акте.",
                primaryEvidenceType:
                  "Решение владельца, протоколы испытаний или иные подтверждающие документы, уведомления производителю (либо его уполномоченному представителю) и Росздравнадзору, акт уничтожения и документы организации-исполнителя.",
                officialSearchUrl: RZN_WITHDRAWAL_REGISTER,
                officialSearchLabel: "Решения Росздравнадзора об изъятии медицинских изделий",
                nonCompliancePattern:
                  "Документированное несоблюдение применимой процедуры после подтверждения её основания; отсутствие одного документа в первоначальном комплекте сначала требует запроса и проверки альтернативных документов.",
              },
            ],
          },
          1,
        ),
      ],
    },
  }),

  regulation({
    slug: "roszdravnadzor-order-756-2022",
    title: "Приказ Росздравнадзора № 756 о форме оценочного листа для лицензирования медицинской деятельности",
    summary:
      "Официальный оценочный лист Росздравнадзора переводит лицензионные требования в контрольные вопросы; текущая редакция отдельно проверяет законное владение необходимыми и зарегистрированными медицинскими изделиями.",
    content:
      "Оценочный лист используется в процедуре оценки соответствия соискателя лицензии или лицензиата. Контрольный вопрос не создаёт самостоятельного состава нарушения и применяется вместе с нормами, реквизиты которых указаны в листе.",
    documentType: "Приказ Росздравнадзора",
    number: "756",
    adoptedAt: "2022-02-04",
    issuingAuthority: "Федеральная служба по надзору в сфере здравоохранения",
    officialPublicationUrl: ROSZDRAVNADZOR_ORDER_756_TEXT,
    legalStatus: "IN_FORCE",
    effectiveFrom: "2022-03-01",
    topicSlugs: ["medical-activity-licensing", "roszdravnadzor-control", "medical-device-registration"],
    mainSource: {
      kind: "OFFICIAL_CONSOLIDATED_TEXT",
      title: "Официальная копия первоначального приказа на сайте Росздравнадзора",
      url: ROSZDRAVNADZOR_ORDER_756_TEXT,
    },
    additionalSources: [
      {
        kind: "OFFICIAL_PUBLICATION",
        title: "Официальное опубликование приказа Росздравнадзора № 26 о текущей редакции вопроса 4",
        url: ROSZDRAVNADZOR_ORDER_26_PUBLICATION,
        sourceDate: "2026-02-19",
      },
      {
        kind: "OFFICIAL_REGISTER",
        title: "Государственный реестр медицинских изделий",
        url: RZN_MEDICAL_DEVICE_REGISTER,
      },
    ],
    edition: {
      key: "current-after-order-26",
      title: "Редакция после приказа Росздравнадзора № 26",
      effectiveFrom: "2026-03-02",
      legalStatus: "IN_FORCE",
      transitionNote:
        "Текущий вопрос 4 собран из формы, утверждённой приказом № 756, и изменения, официально опубликованного 19.02.2026. Для более ранней оценки используется прежняя редакция листа.",
      officialTextUrl: ROSZDRAVNADZOR_ORDER_26_PUBLICATION,
      historicalUseAllowed: false,
      verificationNote:
        "По официальной копии приказа № 756 сверены назначение формы и пункт 7; по официальной публикации приказа № 26 сверена новая редакция вопроса 4 и отмена прежних вопросов 8 и 9. Другие строки оценочного листа в карточку не перенесены.",
      provisions: [
        provision({
          key: "form-item-7-section-1-question-4-current",
          topicSlug: "roszdravnadzor-control",
          locator: "Форма оценочного листа, пункт 7, раздел I, контрольный вопрос 4 (в редакции приказа Росздравнадзора № 26)",
          title: "Необходимые, законно используемые и зарегистрированные медицинские изделия",
          requirement:
            "При документарной оценке Росздравнадзор проверяет, имеются ли у соискателя лицензии или лицензиата на праве собственности либо ином законном основании, предусматривающем владение и пользование, медицинские изделия, необходимые для заявленных работ (услуг) и зарегистрированные в порядке части 4 статьи 38 Закона № 323-ФЗ.",
          applicability:
            "К оценке соответствия соискателя лицензии или лицензиата с 02.03.2026, по конкретным заявленным работам и услугам. Ответ требует связи между правом на экземпляр, его точной идентификацией, регистрацией и необходимостью для заявленной работы.",
          effectiveFrom: "2026-03-02",
          checks: [
            {
              key: "licensed-service-required-device-evidence",
              question:
                "Подтверждены ли для каждого необходимого медицинского изделия законное владение и пользование, точная идентификация экземпляра, применимая регистрация и связь с заявленными работами (услугами)?",
              factToEstablish:
                "Правовое основание владения и пользования, модель, модификация и идентификаторы экземпляра, регистрационная запись, применимый стандарт оснащения и заявленная медицинская работа.",
              primaryEvidenceType:
                "Договор или документ собственности, инвентарная карточка, паспорт или формуляр с заводским номером, регистрационное удостоверение и официальная запись реестра, документы о заявленных работах и применимом оснащении.",
              officialSearchUrl: RZN_MEDICAL_DEVICE_REGISTER,
              officialSearchLabel: "Государственный реестр медицинских изделий",
              nonCompliancePattern:
                "Несоответствие фиксируется в рамках лицензионной оценки после документированного отрицательного ответа по точному экземпляру и применимой работе; отсутствие одного документа или результата поиска сначала требует запроса и проверки альтернативной версии.",
            },
          ],
        }),
      ],
    },
  }),
];
