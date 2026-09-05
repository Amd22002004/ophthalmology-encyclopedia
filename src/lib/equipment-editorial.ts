/**
 * Редакционные блоки, для которых у зафиксированной модели Equipment нет полей.
 *
 * Здесь не дублируются паспортные данные, связи или SEO-сведения из Prisma:
 * их владельцем остаётся Equipment / EquipmentSpec. Модуль хранит только
 * проверяемые исторические пояснения, FAQ, визуальные подписи и метаданные
 * локальных документов. Он опционален: будущая карточка получает единый шаблон,
 * а блок появляется только при достаточном первичном источнике.
 */

export type EquipmentDocumentMeta = {
  title: string;
  type: string;
  description: string;
  source: string;
  pages?: number;
};

export type EquipmentEditorialContent = {
  history?: {
    paragraphs: string[];
    sources: { label: string; href: string }[];
  };
  timeline?: { year: string; title: string; description: string }[];
  faq?: { question: string; answer: string }[];
  videos?: { title: string; description: string; embedUrl: string; sourceHref: string }[];
  comparisonTargets?: { title: string; description: string }[];
  documentMeta?: Record<string, EquipmentDocumentMeta>;
  imageMeta?: Record<string, { alt: string; caption: string }>;
};

const fdaOriginalPma = "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P020050";
const fdaEyeQ = "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?ID=P020050S003";
const fdaEx500 = "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?ID=P020050S006";
const fdaPrk = "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P020050S023";
const alconEx500 = "https://www.myalcon.com/professional/refractive/wavelight-ex500-excimer-laser/";
const alconSuite =
  "https://www.alcon.com/media-release/alcon-introduces-enhanced-wavelightr-refractive-suite-optimize-patient-and-surgeon/";
const alconWaveLightHistory =
  "https://www.alcon.com/de-DE/karriere-bei-wavelight/ueber-wavelight/";
const alconAcquisition =
  "https://www.sec.gov/Archives/edgar/data/1167379/000116737911000037/acl20f2010.htm";
const lightmedSltPage = "https://www.lightmed.com/ophthalmology/lightlas-slt-glaucoma-laser/";
const lightmedYagPage = "https://www.lightmed.com/ophthalmology/lightlas-yag-capsulotomy-laser/";
const lightmedSltDeuxBrochure = "https://www.lightmed.com/content/SLT-Deux-brochure.pdf";
const lightmedYagBrochure = "https://www.lightmed.com/content/LightLasYAG-ProductBrochure.pdf";
const lightmedSltBrochure = "https://www.lightmed.com/content/LightLasSLT-ProductBrochure.pdf";
const volkSuperQuadPage =
  "https://www.volk.com/products/super-quad-160-indirect-contact-laser-lens";
const volkCatalog = "https://support.volk.com/hubfs/Volk%20Catalog_Jan%202025_Web%20Version.pdf";
const volkCareGuide =
  "https://cdn.shopify.com/s/files/1/0289/2749/2130/files/CCG-004_-_Volk_CCG_-_Contact_Laser_and_Diagnostic_Lenses.pdf";

export const equipmentEditorial: Record<string, EquipmentEditorialContent> = {
  "lightmed-lightlas-slt-yag": {
    history: {
      paragraphs: [
        "Публичная карточка сохраняет название Lightmed Lightlas SLT/YAG, потому что именно оно указано в научной статье Островерхова А. И. Для технического наполнения использованы официальные материалы LIGHTMED по семейству LIGHTLas YAG-V, LIGHTLas SLT и комбинированной системе LIGHTLas SLT Deux-V.",
        "Официальная брошюра LIGHTLas SLT Deux-V описывает платформу как SLT/YAG combination system: YAG-режим работает на 1064 нм, SLT-режим — на 532 нм. Документ также фиксирует модельное регистрационное наименование Lightlas SeLecTor Deux и наличие FDA/CE registration для этой модели.",
        "В научной работе связь с ретинопатией Вальсальвы ограничена конкретным клиническим случаем: YAG-лазер 1064 нм использован вместе с линзой VOLK SUPER QUAD 160 для лазерной гиалоидопунктуры субгиалоидного кровоизлияния.",
      ],
      sources: [
        { label: "LIGHTMED: LightLas SLT", href: lightmedSltPage },
        { label: "LIGHTMED: LightLas YAG", href: lightmedYagPage },
        { label: "LIGHTMED: LIGHTLas SLT Deux-V brochure", href: lightmedSltDeuxBrochure },
        { label: "LIGHTMED: LIGHTLas YAG-V brochure", href: lightmedYagBrochure },
        { label: "LIGHTMED: LIGHTLas SLT brochure", href: lightmedSltBrochure },
      ],
    },
    faq: [
      {
        question: "Что такое Lightmed Lightlas SLT/YAG?",
        answer:
          "В энциклопедии это карточка комбинированной Lightmed YAG/SLT-платформы, связанная с научной статьёй Островерхова А. И. Технические параметры взяты из официальных материалов LIGHTMED по LIGHTLas SLT Deux-V и YAG-V.",
      },
      {
        question: "Какая часть аппарата использовалась в клиническом случае?",
        answer:
          "В статье указан YAG-лазер 1064 нм. Процедура проведена шестью импульсами по 4,5 мДж с линзой VOLK SUPER QUAD 160.",
      },
      {
        question: "Можно ли считать аппарат связанным с конкретной клиникой?",
        answer:
          "Нет. В предоставленной статье нет подтверждения конкретной клиники установки или эксплуатации, поэтому связь Equipment → Clinic не создаётся.",
      },
    ],
    documentMeta: {
      "lightmed-slt-deux-v-brochure.pdf": {
        title: "LIGHTLas SLT Deux-V Brochure",
        type: "Официальная брошюра",
        description: "YAG/SLT combination system: режимы, оптика, рабочее место и технические характеристики.",
        source: "LIGHTMED",
        pages: 6,
      },
      "lightmed-lightlas-yag-v-brochure.pdf": {
        title: "LIGHTLas YAG-V Brochure",
        type: "Официальная брошюра",
        description: "Материалы производителя по YAG-фотодеструктору LIGHTLas YAG-V.",
        source: "LIGHTMED",
        pages: 5,
      },
      "lightmed-lightlas-slt-brochure.pdf": {
        title: "LIGHTLas SLT Brochure",
        type: "Официальная брошюра",
        description: "Материалы производителя по SLT-платформе LIGHTLas SLT и возможностям апгрейда.",
        source: "LIGHTMED",
        pages: 2,
      },
    },
    imageMeta: {
      "lightmed-slt-deux-v-workstation.jpg": {
        alt: "LIGHTLas SLT Deux-V: рабочее место со щелевой лампой, тележкой и педалью",
        caption: "Официальное изображение LIGHTMED: рабочее место комбинированной SLT/YAG-системы.",
      },
      "lightmed-slt-deux-v-system.png": {
        alt: "LIGHTLas SLT Deux-V: комбинированная SLT/YAG-система",
        caption: "Официальное изображение LIGHTMED для платформы SLT Deux-V.",
      },
      "lightmed-yag-v-system.png": {
        alt: "LIGHTLas YAG-V: YAG-фотодеструктор",
        caption: "Официальное изображение LIGHTMED для YAG-V, связанного семейства YAG-систем.",
      },
    },
  },
  "volk-super-quad-160": {
    history: {
      paragraphs: [
        "VOLK SUPER QUAD 160 включён в энциклопедию как оборудование, прямо названное в научной статье Островерхова А. И. о YAG лазерной гиалоидопунктуре при ретинопатии Вальсальвы.",
        "Официальная страница Volk называет модель Super Quad® 160 PRP Laser Lens и описывает её как линзу для wide field visualization сетчатки, панретинального осмотра и лазерных вмешательств. Каталог Volk 2025 фиксирует ключевые параметры: поле зрения 160°/165°, image magnification 0,50× и laser spot magnification 2,0×.",
        "Связь с заболеванием и процедурой в проекте создаётся на основании статьи; техническая часть карточки заполняется по официальной странице, каталогу и руководству по уходу Volk.",
      ],
      sources: [
        { label: "Volk: Super Quad 160 product page", href: volkSuperQuadPage },
        { label: "Volk Catalog 2025", href: volkCatalog },
        { label: "Volk Cleaning & Care Guide", href: volkCareGuide },
      ],
    },
    faq: [
      {
        question: "Что такое VOLK SUPER QUAD 160?",
        answer:
          "Это контактная лазерная линза Volk для широкопольной визуализации сетчатки. В научной статье она указана как сопутствующая оптика при YAG лазерной гиалоидопунктуре.",
      },
      {
        question: "Какие основные параметры линзы?",
        answer:
          "Официальный каталог Volk указывает поле зрения 160°/165°, image magnification 0,50× и laser spot magnification 2,0×.",
      },
      {
        question: "Есть ли связь линзы с клиникой?",
        answer:
          "Нет. Статья подтверждает использование линзы в клиническом случае, но не подтверждает конкретную клинику, поэтому связь с клиникой не создаётся.",
      },
    ],
    documentMeta: {
      "volk-catalog-2025.pdf": {
        title: "Volk Catalog 2025",
        type: "Официальный каталог",
        description: "Каталог Volk с разделом Retina Laser Lenses и техническими параметрами Super Quad 160.",
        source: "Volk Optical",
        pages: 45,
      },
      "volk-contact-laser-diagnostic-lenses-care-guide.pdf": {
        title: "Contact Laser and Diagnostic Lenses Cleaning & Care Guide",
        type: "Руководство по уходу",
        description: "Официальные правила очистки, дезинфекции и стерилизации контактных лазерных линз Volk.",
        source: "Volk Optical",
        pages: 3,
      },
    },
    imageMeta: {
      "volk-super-quad-160-lens.png": {
        alt: "VOLK SUPER QUAD 160: контактная офтальмологическая лазерная линза",
        caption: "Официальное изображение линзы Super Quad 160 со страницы Volk.",
      },
      "volk-super-quad-160-field-of-view.jpg": {
        alt: "VOLK SUPER QUAD 160: схема поля зрения 160°/165°, magnification 0,50× и laser spot 2,0×",
        caption: "Официальная схема Volk с ключевыми оптическими параметрами Super Quad 160.",
      },
    },
  },
  "wavelight-allegretto-wave": {
    history: {
      paragraphs: [
        "В официальной хронологии WaveLight первая 200-Гц система ALLEGRETTO WAVE представлена в 2000 году. Документ FDA фиксирует отдельное событие для рынка США: 7 октября 2003 года исходная система получила одобрение для LASIK. В сводке FDA закреплены 193 нм, частота 200 Гц, сканирующее пятно, два гальванометрических сканера и интегрированный eye tracker.",
        "Эта конструкция стала основой линейки. В хронологии производителя далее названы Eye-Q 400 Гц (2003), 500-Гц CONCERTO (2004) и интегрированный Refractive Suite (2010). EX500 получил отдельное одобрение FDA в 2011 году как конфигурация с новыми лазерной головой, сканером, трекером и интерфейсом.",
      ],
      sources: [
        { label: "WaveLight / Alcon: история линейки", href: alconWaveLightHistory },
        { label: "FDA: исходное одобрение P020050", href: fdaOriginalPma },
      ],
    },
    timeline: [
      { year: "2000", title: "Первая ALLEGRETTO WAVE", description: "WaveLight представила первую 200-Гц эксимерную систему серии." },
      { year: "2003", title: "Eye-Q 400 Гц и FDA исходной системы", description: "Производитель датирует Eye-Q 2003 годом; FDA в этом же году одобрила исходную ALLEGRETTO Wave для рынка США." },
      { year: "2004", title: "CONCERTO 500 Гц", description: "В хронологии WaveLight названо следующее 500-Гц поколение CONCERTO." },
      { year: "2010", title: "Refractive Suite", description: "WaveLight представила интегрированный рефракционный комплекс." },
      { year: "2011", title: "EX500", description: "Новое поколение: 500 Гц, обновлённые laser head, scanner, eye tracker, интерфейс и программное обеспечение." },
    ],
    faq: [
      { question: "Что такое WaveLight ALLEGRETTO Wave?", answer: "Это исходная 200-Гц эксимерная система линейки WaveLight, представленная в 2000 году. Документ FDA 2003 года описывает её версию Model 1008 для рынка США; её параметры не следует переносить на следующие поколения без проверки маркировки." },
      { question: "Чем она отличается от Eye-Q?", answer: "Eye-Q — последующее поколение с регуляторно зафиксированной частотой 400 Гц; исходная модель в сводке FDA 2003 года имеет частоту 200 Гц." },
    ],
    documentMeta: {
      "fda-summary-safety-effectiveness-lasik.pdf": {
        title: "FDA Approval: исходная система ALLEGRETTO Wave",
        type: "Сводка безопасности и эффективности",
        description: "Исходный документ PMA P020050: устройство, показания LASIK и параметры Model 1008.",
        source: "FDA",
        pages: 24,
      },
    },
  },
  "alcon-allegretto-wave-eye-q": {
    history: {
      paragraphs: [
        "В официальной хронологии WaveLight первая 200-Гц ALLEGRETTO WAVE представлена в 2000 году, а 400-Гц ALLEGRETTO Wave Eye-Q — в 2003 году. Для рынка США FDA в 2006 году одобрила повышение частоты импульсов с 200 до 400 Гц и закрепила торговое наименование ALLEGRETTO Wave Eye-Q.",
        "WaveLight AG была германской компанией, разрабатывавшей и производившей рефракционные лазерные и диагностические системы. В официальном годовом отчёте Alcon для SEC указано, что в ноябре 2007 года Alcon приобрела 77,4% акций WaveLight, а затем увеличила пакет; в 2008–2009 годах проходила интеграция операций.",
        "Eye-Q стал переходным поколением линейки: к базовой LASIK-маркировке добавлялись wavefront-guided LASIK, топографически-управляемый T-CAT LASIK и PRK. В истории производителя между Eye-Q и Suite отмечен 500-Гц CONCERTO (2004); EX500 получил отдельное одобрение FDA в 2011 году, а Refractive Suite появился в 2010 году и обновлялся позднее.",
      ],
      sources: [
        { label: "WaveLight / Alcon: история линейки", href: alconWaveLightHistory },
        { label: "FDA: Eye-Q 400 Гц", href: fdaEyeQ },
        { label: "Alcon: годовой отчёт WaveLight acquisition", href: alconAcquisition },
        { label: "FDA: EX500", href: fdaEx500 },
      ],
    },
    timeline: [
      { year: "2000", title: "ALLEGRETTO WAVE", description: "Первая 200-Гц система линейки в истории WaveLight." },
      { year: "2003", title: "Eye-Q", description: "Производитель датирует 400-Гц Eye-Q 2003 годом; исходная ALLEGRETTO Wave получила FDA-одобрение в США." },
      { year: "2004", title: "CONCERTO", description: "В официальной хронологии — 500-Гц эксимерный лазер следующего этапа." },
      { year: "2007–2009", title: "Интеграция с Alcon", description: "Alcon приобрела контрольный пакет WaveLight и интегрировала коммерческие операции." },
      { year: "2010", title: "Refractive Suite", description: "WaveLight представила интегрированный рефракционный комплекс." },
      { year: "2011", title: "EX500", description: "500 Гц и новая конструкция лазерной системы по FDA P020050/S006." },
      { year: "2018", title: "Refractive Suite", description: "Alcon представила обновлённый интерфейс и аппаратные элементы интегрированного комплекса." },
    ],
    faq: [
      { question: "Что такое ALLEGRETTO Wave Eye-Q?", answer: "Это эксимерная лазерная система WaveLight / Alcon поколения 400 Гц. В документах FDA она описана как сканирующая система с гальванометрическим позиционированием и интегрированным eye tracker." },
      { question: "Какие операции выполняет система?", answer: "В зависимости от утверждённой маркировки и конфигурации: LASIK, wavefront-guided LASIK, топографически-управляемый T-CAT LASIK и PRK. Конкретную пригодность определяет врач, а диапазоны указаны в приложенных документах FDA." },
      { question: "Чем Eye-Q отличается от EX500?", answer: "FDA зафиксировала для EX500 повышение частоты с 400 до 500 Гц, новые laser head, scanner, eye tracker, интерфейс, сетевые возможности и программное обеспечение." },
      { question: "Используется ли Eye-Q сегодня?", answer: "В карточке нет утверждения о текущем коммерческом статусе: для него нужен официальный документ именно по конкретной версии и стране обращения." },
      { question: "Какие состояния корректируют на этой системе?", answer: "Маркировка FDA относится к коррекции рефракционных ошибок — миопии, астигматизма и в отдельных показаниях гиперметропии. Это не лечение заболеваний как самостоятельных нозологий." },
      { question: "Чем Eye-Q отличается от систем ZEISS?", answer: "Это эксимерная платформа WaveLight; корректное сравнение возможно только по первичным техническим документам конкретных моделей и их зарегистрированным показаниям." },
    ],
    comparisonTargets: [
      { title: "ZEISS MEL 90", description: "Эксимерная система ZEISS; ссылка появится автоматически после публикации её карточки оборудования." },
      { title: "SCHWIND AMARIS", description: "Семейство эксимерных систем; ссылка появится автоматически после публикации подтверждённой карточки." },
      { title: "VISX Star S4 IR", description: "Эксимерная система VISX; ссылка появится автоматически после публикации подтверждённой карточки." },
      { title: "NIDEK EC-5000", description: "Эксимерная система NIDEK; ссылка появится автоматически после публикации подтверждённой карточки." },
    ],
    documentMeta: {
      "fda-summary-safety-effectiveness-lasik.pdf": { title: "FDA Approval: LASIK", type: "Сводка безопасности и эффективности", description: "Исходное показание LASIK для платформы WaveLight.", source: "FDA", pages: 24 },
      "fda-summary-safety-effectiveness-wavefront-lasik.pdf": { title: "FDA Approval: Wavefront-guided LASIK", type: "Сводка безопасности и эффективности", description: "Регуляторное расширение на wavefront-guided LASIK.", source: "FDA", pages: 7 },
      "fda-summary-safety-effectiveness-t-cat.pdf": { title: "FDA Approval: T-CAT LASIK", type: "Сводка безопасности и эффективности", description: "Топографически-управляемый LASIK с Eye-Q, Topolyzer и T-CAT.", source: "FDA", pages: 39 },
      "fda-procedure-manual-topography-guided-lasik.pdf": { title: "Процедурное руководство: T-CAT LASIK", type: "Руководство по процедуре", description: "Маркировка FDA для Eye-Q, ALLEGRO Topolyzer и T-CAT.", source: "FDA", pages: 78 },
      "fda-patient-information-topography-guided-lasik.pdf": { title: "Информация для пациента: T-CAT LASIK", type: "Patient guide", description: "Официальный буклет с описанием системы и показаний.", source: "FDA / WaveLight", pages: 53 },
      "fda-summary-safety-effectiveness-prk.pdf": { title: "FDA Approval: PRK", type: "Сводка безопасности и эффективности", description: "Расширение показаний на PRK для Eye-Q и EX500.", source: "FDA", pages: 36 },
    },
    imageMeta: {
      "alcon-allegretto-wave-eye-q-system.jpg": { alt: "ALLEGRETTO Wave Eye-Q: лазерная система с пациентской кушеткой и ножной педалью", caption: "Официальное изображение системы, опубликованное FDA в пациентском буклете WaveLight." },
      "alcon-topography-workflow-interface.png": { alt: "ALLEGRETTO Wave Eye-Q: интерфейс топографического планирования ALLEGRO Topolyzer", caption: "Интерфейс топографического планирования из маркировки FDA." },
      "alcon-treatment-planning-interface.jpeg": { alt: "ALLEGRETTO Wave Eye-Q: интерфейс сравнения карт для планирования лечения", caption: "Интерфейс планирования лечения из процедурного руководства FDA." },
    },
  },
  "wavelight-ex500": {
    history: {
      paragraphs: [
        "В истории производителя путь серии начинается с ALLEGRETTO WAVE (2000), затем идут Eye-Q 400 Гц (2003), CONCERTO 500 Гц (2004) и Refractive Suite (2010). В ноябре 2011 года FDA одобрила EX500 как изменённую конфигурацию платформы: частота импульсов выросла с 400 до 500 Гц, а система получила новые laser head, scanner, eye tracker, интерфейс, сетевые возможности и программное обеспечение.",
        "В актуальном описании Alcon EX500 позиционируется как эксимерный компонент WaveLight Refractive Suite с персонализированными профилями абляции. Исторически Eye-Q и EX500 некоторое время развивались в рамках одного PMA; поэтому расширение показаний на PRK в 2016 году относится к обеим системам.",
      ],
      sources: [
        { label: "WaveLight / Alcon: история линейки", href: alconWaveLightHistory },
        { label: "FDA: EX500 P020050/S006", href: fdaEx500 },
        { label: "Alcon: WaveLight EX500", href: alconEx500 },
        { label: "FDA: PRK для Eye-Q и EX500", href: fdaPrk },
      ],
    },
    timeline: [
      { year: "2000", title: "ALLEGRETTO WAVE", description: "Первая 200-Гц система WaveLight." },
      { year: "2003", title: "Eye-Q", description: "400-Гц система в официальной хронологии производителя." },
      { year: "2004", title: "CONCERTO", description: "500-Гц этап развития линейки WaveLight." },
      { year: "2010", title: "Refractive Suite", description: "Интегрированный рефракционный комплекс WaveLight." },
      { year: "2011", title: "EX500", description: "500 Гц, новая laser head, scanner, eye tracker и программное обеспечение." },
      { year: "2018", title: "Интегрированный Suite", description: "Обновление интерфейса и эргономики комплекса EX500 + FS200 + WaveNet." },
    ],
    videos: [
      {
        title: "WaveLight EX500: официальный видеоматериал Alcon",
        description: "Видео встроено с официальной международной страницы Alcon о WaveLight EX500.",
        embedUrl: "https://embed.ustudio.com/embed/DNS0qFk24MXK/Uf20vPHksp66",
        sourceHref: alconEx500,
      },
    ],
    documentMeta: {
      "fda-summary-safety-effectiveness-prk.pdf": { title: "FDA Approval: PRK для EX500 и Eye-Q", type: "Сводка безопасности и эффективности", description: "Регуляторное расширение показаний на PRK для двух систем WaveLight.", source: "FDA", pages: 36 },
    },
    imageMeta: {
      "alcon-wavelight-ex500-system.png": { alt: "WaveLight EX500: лазерный блок, рабочее место и пациентская кушетка", caption: "Официальное изображение EX500 со страницы Alcon." },
    },
  },
  "wavelight-refractive-suite": {
    history: {
      paragraphs: [
        "WaveLight Refractive Suite — развитие линии от отдельной эксимерной системы к интегрированному рабочему комплексу. Официальная хронология WaveLight датирует его появление 2010 годом; в сообщении Alcon 2018 года названы EX500 Excimer Laser, FS200 Femtosecond Laser и WaveNet Planning Station.",
        "Обновление 2018 года затронуло графический интерфейс, эргономику и элементы управления. Оно не создаёт отдельного показания к вмешательству: применимость всегда определяется маркировкой конкретных компонентов комплекса.",
      ],
      sources: [
        { label: "WaveLight / Alcon: история линейки", href: alconWaveLightHistory },
        { label: "Alcon: WaveLight Refractive Suite, 2018", href: alconSuite },
      ],
    },
    timeline: [
      { year: "2000", title: "ALLEGRETTO WAVE", description: "Первая 200-Гц эксимерная система WaveLight." },
      { year: "2003", title: "Eye-Q", description: "Поколение 400 Гц в официальной хронологии производителя." },
      { year: "2004", title: "CONCERTO", description: "500-Гц эксимерный лазер следующего этапа линейки." },
      { year: "2010", title: "Refractive Suite", description: "Интегрированный рефракционный комплекс WaveLight." },
      { year: "2011", title: "EX500", description: "Поколение 500 Гц с обновлённой конструкцией и программным обеспечением." },
      { year: "2018", title: "Refractive Suite", description: "Интегрированный комплекс с обновлёнными GUI, control panel и эргономикой." },
    ],
    imageMeta: {
      "wavelight-ex500-component.png": { alt: "WaveLight EX500 — эксимерный компонент WaveLight Refractive Suite", caption: "Официальный вид EX500 — одного из компонентов WaveLight Refractive Suite; изображение не показывает комплекс целиком." },
    },
  },
};

export function getEquipmentEditorial(slug: string): EquipmentEditorialContent | undefined {
  return equipmentEditorial[slug];
}

export function getDocumentMeta(
  slug: string,
  url: string,
): EquipmentDocumentMeta {
  const file = url.split("/").at(-1) ?? "";
  return (
    equipmentEditorial[slug]?.documentMeta?.[file] ?? {
      title: "Документация по оборудованию",
      type: "Документ",
      description: "Локальная копия документа из проверенного источника.",
      source: "Источник указан в документе",
    }
  );
}

export function getEquipmentImageMeta(slug: string, url: string, title: string) {
  const file = url.split("/").at(-1) ?? "";
  return (
    equipmentEditorial[slug]?.imageMeta?.[file] ?? {
      alt: `${title}: изображение оборудования`,
      caption: "Изображение из локальной медиатеки энциклопедии.",
    }
  );
}
