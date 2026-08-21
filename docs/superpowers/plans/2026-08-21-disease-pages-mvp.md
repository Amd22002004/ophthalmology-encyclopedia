# Disease Pages MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one reusable, evidence-sourced disease-page template and populate only the three approved disease routes.

**Architecture:** Keep `Disease` and all graph edges in Prisma. Add a typed `DiseaseContent` registry for article structure, SEO, FAQ, image metadata and source provenance; enrich `getDisease` with that content and existing direct relations. Render a rich branch only when a registry entry exists and preserve the current fallback branch for every other disease.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript, Prisma 7, Tailwind CSS 4, native `details/summary`, Schema.org JSON-LD, local WebP assets generated with imagegen.

**Spec:** `docs/superpowers/specs/2026-08-21-disease-pages-design.md`

## Global Constraints

- Do not change `prisma/schema.prisma` or create a `DiseaseContent` database model.
- Change rich content only for `ambliopiya`, `astigmatizm`, and `vozrastnaya-makulyarnaya-degeneratsiya`.
- Do not infer `ClinicOnDisease` through doctors and do not create `Disease ↔ Regulation` links.
- Preserve existing routes and the current disease fallback rendering for all other slugs.
- Store source name, URL, access date, optional source update date, and supported content sections for every medical source.
- Keep copy concise, neutral, non-promotional, non-diagnostic, and free of keyword stuffing.
- Do not render empty article, relationship, source, or Schema.org blocks.
- Use only existing internal URLs; resolve editorial related-disease slugs against the database before rendering.
- Follow the existing tokens, `Card`, `EntityBlock`, `RelatedBlock`, `Breadcrumbs`, and responsive patterns.
- Production deployment is out of scope.

---

### Task 1: Add failing tests for the content and SEO contracts

**Files:**
- Create: `src/lib/disease-content.test.ts`
- Create: `src/lib/disease-seo.test.ts`
- Modify: `src/lib/seo.ts` only after the tests fail

**Interfaces:**
- Consumes: the not-yet-created `getDiseaseContent`, `getRichDiseaseSlugs`, `DiseaseContentSectionKey`, `faqPageJsonLd`, and disease JSON-LD helpers.
- Produces: executable requirements for the registry, source provenance, metadata image fields, `MedicalWebPage`, `MedicalCondition`, and conditional `FAQPage`.

- [ ] **Step 1: Write the failing registry contract test**

Create a test that imports `getDiseaseContent` and asserts the exact MVP slug set and required fields:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getDiseaseContent, getRichDiseaseSlugs } from "./disease-content";

const requiredSections = [
  "definition",
  "causes",
  "riskFactors",
  "symptoms",
  "types",
  "diagnosis",
  "treatment",
  "prognosis",
  "prevention",
  "whenToSeeDoctor",
] as const;

test("MVP registry contains exactly three rich disease pages", () => {
  assert.deepEqual(getRichDiseaseSlugs(), [
    "ambliopiya",
    "astigmatizm",
    "vozrastnaya-makulyarnaya-degeneratsiya",
  ]);
});

test("each MVP disease has compact content, source provenance, and FAQ", () => {
  for (const slug of getRichDiseaseSlugs()) {
    const content = getDiseaseContent(slug);
    assert.ok(content);
    assert.equal(content.slug, slug);
    assert.ok(content.summary.length >= 80 && content.summary.length <= 260);
    assert.ok(content.seo.title.includes(content.title));
    assert.ok(content.seo.description.includes(content.title));
    assert.ok(content.image.src.endsWith(".webp"));
    assert.ok(content.image.alt.length > 20);
    assert.ok(content.faq.length >= 7);
    assert.ok(content.sources.length > 0);

    for (const section of requiredSections) {
      assert.ok(content[section].length > 0, `${slug} lacks ${section}`);
      assert.ok(
        content.sources.some((source) => source.sections.includes(section)),
        `${slug} lacks provenance for ${section}`,
      );
    }

    const questions = new Set(content.faq.map((item) => item.question));
    assert.equal(questions.size, content.faq.length);
    for (const source of content.sources) {
      assert.match(source.url, /^https:\/\//);
      assert.match(source.accessedAt, /^2026-08-21$/);
      assert.ok(source.sections.length > 0);
    }
  }
});

test("unknown disease does not receive rich content", () => {
  assert.equal(getDiseaseContent("glaukoma"), null);
});
```

- [ ] **Step 2: Write the failing SEO/Schema.org test**

Add a test for helpers that will be exported from `src/lib/seo.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  diseaseConditionJsonLd,
  diseaseWebPageJsonLd,
  faqPageJsonLd,
} from "./seo";

test("disease JSON-LD uses only the approved medical entities", () => {
  const condition = diseaseConditionJsonLd({
    title: "Амблиопия",
    description: "Снижение зрительной функции.",
    aliases: ["Ленивый глаз"],
    category: "Нарушения рефракции",
    path: "/diseases/ambliopiya",
    icdCode: null,
  });
  const page = diseaseWebPageJsonLd({
    title: "Амблиопия",
    description: "Снижение зрительной функции.",
    path: "/diseases/ambliopiya",
  });
  const faq = faqPageJsonLd([{ question: "Что такое амблиопия?", answer: "Ответ." }]);

  assert.equal(condition["@type"], "MedicalCondition");
  assert.deepEqual(condition.alternateName, ["Ленивый глаз"]);
  assert.equal(condition.code, undefined);
  assert.equal(page["@type"], "MedicalWebPage");
  assert.equal(page.about["@id"], "http://localhost:3000/diseases/ambliopiya#condition");
  assert.equal(faq["@type"], "FAQPage");
});
```

- [ ] **Step 3: Run the focused tests and verify the expected RED state**

Run:

```powershell
node --import tsx --test src/lib/disease-content.test.ts src/lib/disease-seo.test.ts
```

Expected: FAIL because the registry and disease JSON-LD helpers do not exist yet. Fix test syntax or import mistakes if the failure is a module error unrelated to the missing feature.

---

### Task 2: Implement the typed content registry and provenance data

**Files:**
- Create: `src/lib/disease-content.ts`
- Modify: `src/lib/disease-content.test.ts` only if the exported contract needs a type-safe assertion adjustment

**Interfaces:**
- Consumes: the RED tests from Task 1.
- Produces: `DiseaseContentSectionKey`, `DiseaseSource`, `DiseaseContent`, `getDiseaseContent(slug)`, and `getRichDiseaseSlugs()`.

- [ ] **Step 1: Define the content types**

Use a section-key union that includes every section required for provenance:

```ts
export type DiseaseContentSectionKey =
  | "definition"
  | "causes"
  | "riskFactors"
  | "symptoms"
  | "types"
  | "diagnosis"
  | "treatment"
  | "prognosis"
  | "prevention"
  | "whenToSeeDoctor";

export type DiseaseSource = {
  name: string;
  url: string;
  accessedAt: string;
  updatedAt?: string;
  sections: DiseaseContentSectionKey[];
};

export type DiseaseContent = {
  slug: string;
  title: string;
  summary: string;
  aliases: string[];
  seo: { title: string; description: string };
  image: { src: string; alt: string; width: number; height: number };
  definition: string[];
  causes: string[];
  riskFactors: string[];
  symptoms: string[];
  types: string[];
  diagnosis: string[];
  diagnosticMethods: { label: string; description: string }[];
  treatment: string[];
  treatmentGroups: { title: string; items: string[] }[];
  prognosis: string[];
  prevention: string[];
  whenToSeeDoctor: string[];
  faq: { question: string; answer: string }[];
  relatedDiseaseSlugs: string[];
  sources: DiseaseSource[];
};
```

Keep facts that already belong to Prisma out of this type. The registry supplies article content and navigation refs, not doctor, clinic, publication, guideline, or equipment records.

- [ ] **Step 2: Add the three concise medical records**

Add exactly three entries keyed by the approved slugs. Use the browsed sources and preserve their dates in `updatedAt` when the source page exposes one:

- amblyopia: NEI amblyopia page plus AAO EyeWiki classification/diagnostic details;
- astigmatism: NEI astigmatism page;
- AMD: NEI AMD page plus AAO EyeWiki only where the NEI page does not cover a necessary diagnostic distinction.

Write 7–10 FAQ entries per disease. Answers must be complete sentences, avoid treatment prescriptions, and state when examination is needed. Keep `relatedDiseaseSlugs` limited to existing seeded slugs.

- [ ] **Step 3: Add provenance section coverage**

For each source, include `name`, canonical HTTPS URL, `accessedAt: "2026-08-21"`, optional source update date, and the exact section keys supported by that source. Every non-empty required section must be covered by at least one source.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```powershell
node --import tsx --test src/lib/disease-content.test.ts
```

Expected: PASS. If a source date or section assertion fails, correct the registry data rather than weakening the contract.

---

### Task 3: Extend SEO helpers and metadata with disease-specific structured data

**Files:**
- Modify: `src/lib/seo.ts`
- Modify: `src/app/(platform)/diseases/[slug]/page.tsx`
- Test: `src/lib/disease-seo.test.ts`

**Interfaces:**
- Consumes: `DiseaseContent` from Task 2 and existing `breadcrumbJsonLd`/`faqPageJsonLd`.
- Produces: `diseaseConditionJsonLd`, `diseaseWebPageJsonLd`, and rich disease metadata with canonical, robots, OpenGraph image dimensions, and alt text.

- [ ] **Step 1: Extend `createPageMetadata` without changing existing callers**

Keep `image?: string | null` valid for all existing callers, and add optional fields:

```ts
imageAlt?: string;
imageWidth?: number;
imageHeight?: number;
robots?: Metadata["robots"];
```

When `image` is present, create one OpenGraph image object with URL, alt, width, and height only when those values exist. Return `robots` only when supplied so unrelated pages retain inherited root metadata.

- [ ] **Step 2: Implement the JSON-LD helpers**

`diseaseConditionJsonLd` must return `MedicalCondition` with `name`, `description`, `url`, optional `alternateName`, optional ICD-10 `code`, and no empty properties. `diseaseWebPageJsonLd` must return `MedicalWebPage` with `name`, `description`, `url`, `inLanguage: "ru-RU"`, and `about: { "@id": absoluteUrl(path) + "#condition" }`. Do not add an unsupported or unverified `Regulation` relation.

- [ ] **Step 3: Wire `generateMetadata` to the registry**

Load the disease and its content. For a rich entry use `content.seo.title` with `absoluteTitle: true`, `content.seo.description`, `content.image`, and `robots: { index: true, follow: true }`. For other diseases preserve the current title/summary behavior.

- [ ] **Step 4: Run the focused SEO test**

Run:

```powershell
node --import tsx --test src/lib/disease-seo.test.ts
```

Expected: PASS.

---

### Task 4: Enrich the disease loader without inferring graph edges

**Files:**
- Modify: `src/lib/loaders.ts`
- Test: `src/lib/disease-content.test.ts` may gain pure helper assertions if a loader-free resolver is extracted

**Interfaces:**
- Consumes: `getDiseaseContent` and existing Prisma relation loaders.
- Produces: `DiseaseDetail.editorial`, `DiseaseDetail.relatedDiseases`, and direct `clinics` data.

- [ ] **Step 1: Start content and relation resolution from the requested slug**

Inside `getDisease`, compute `const editorial = getDiseaseContent(slug)` before the query. Start the main `findUnique` and, when `editorial` exists, a second `findMany` for `editorial.relatedDiseaseSlugs` in parallel with `Promise.all`. Select only `slug`, `title`, and `summary` for related diseases.

- [ ] **Step 2: Add direct clinics to the existing disease query**

Add:

```ts
clinics: {
  take: 6,
  include: { clinic: { select: { slug: true, title: true, city: true } } },
},
```

Do not use `doctors` as a filter or fallback for this relation.

- [ ] **Step 3: Return the merged detail contract**

Return `null` for an unknown disease. Otherwise return the Prisma row plus `editorial` and the resolved `relatedDiseases` array. Update `getDiseases` so rich registry summaries fill the catalog descriptions while existing non-rich descriptions retain the database summary/ICD fallback.

- [ ] **Step 4: Run typecheck before UI work**

Run:

```powershell
npm run typecheck
```

Expected: PASS or only errors caused by the not-yet-updated template props. Do not proceed with unrelated refactors.

---

### Task 5: Implement the rich disease template and accessible FAQ

**Files:**
- Modify: `src/components/templates/disease-template.tsx`
- Create: `src/components/disease/disease-faq.tsx`
- Create: `src/components/disease/disease-source-list.tsx`
- Test: `src/components/disease/disease-faq.test.ts`

**Interfaces:**
- Consumes: `DiseaseDetail.editorial`, `DiseaseDetail.relatedDiseases`, direct Prisma relations, SEO helpers, and existing UI components.
- Produces: one-H1 rich page with article sections, FAQ accordion, source provenance, actual graph blocks, and fallback output for non-rich diseases.

- [ ] **Step 1: Write the failing FAQ render test**

Create a server-rendering test:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DiseaseFaq } from "./disease-faq";

test("FAQ is visible as accessible details elements", () => {
  const html = renderToStaticMarkup(
    createElement(DiseaseFaq, {
      items: [{ question: "Что такое амблиопия?", answer: "Это справочный ответ." }],
    }),
  );
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
  assert.match(html, /Что такое амблиопия\?/);
  assert.match(html, /Это справочный ответ\./);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --import tsx --test src/components/disease/disease-faq.test.ts
```

Expected: FAIL because `DiseaseFaq` does not exist.

- [ ] **Step 3: Implement `DiseaseFaq` with native disclosure UI**

Use semantic `<section aria-labelledby>`, one `<details>` per item, a `<summary>` with visible question text and a content paragraph. Do not add a client directive or a second accordion library. Keep focus styles visible and use existing border/card tokens.

- [ ] **Step 4: Implement `DiseaseSourceList`**

Render only non-empty sources. Each item shows source name, source update date when known, access date, and a readable external link. Do not render internal file paths or hidden technical identifiers. The section provenance list should be visible in a compact `EntityBlock`.

- [ ] **Step 5: Implement the rich branch in `DiseaseTemplate`**

If `data.editorial` is `null`, retain the current `TemplateShell` fallback and all current direct graph blocks. If present:

1. Render `Breadcrumbs` and one custom hero card with category, H1, summary, optional ICD badge, and the image on the right.
2. Render `definition`, `causes`, `riskFactors`, `symptoms`, `types`, `diagnosis`, `treatment`, `prognosis`, and `prevention` only when their arrays are non-empty.
3. Render diagnostic methods as a disease-specific list and treatment groups as titled groups.
4. Render the highlighted `whenToSeeDoctor` card before FAQ.
5. Render `DiseaseFaq` and emit `faqPageJsonLd` only when FAQ items exist.
6. Render direct doctors, clinics, procedures, publications, scientific works, guidelines, equipment, and investigations exactly from `DiseaseDetail`; do not derive clinics from doctors and do not invent scientific authors.
7. Render `relatedDiseases` only after loader resolution; render no link for a missing slug.
8. Render sources and a neutral note that the page is informational and does not replace an eye examination.

The hero image must use `next/image` with the registry dimensions, `sizes="(min-width: 1280px) 360px, 100vw"`, and `preload` because it is above the fold. Use a stable aspect ratio and `object-cover`/`object-contain` consistent with the illustration composition.

- [ ] **Step 6: Add rich-page JSON-LD to the template**

For rich entries emit separate `SchemaOrg` scripts for `BreadcrumbList`, `MedicalWebPage`, and `MedicalCondition`; emit `FAQPage` conditionally. The condition URL and breadcrumb URL must be `/diseases/${data.slug}`. Reuse `breadcrumbJsonLd` and `faqPageJsonLd` rather than duplicating serialization.

- [ ] **Step 7: Run focused component and type tests**

Run:

```powershell
node --import tsx --test src/components/disease/disease-faq.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 6: Add only the two approved direct procedure links

**Files:**
- Modify: `prisma/seed.ts`
- Test: `src/lib/disease-content.test.ts` or a focused seed-contract assertion if needed

**Interfaces:**
- Consumes: existing `DiseaseOnProcedure` upsert loop and existing procedure slugs.
- Produces: direct, bidirectional graph rows for astigmatism and AMD only.

- [ ] **Step 1: Add source comments beside the seed entries**

Document that the astigmatism relation is supported by the NEI statement that surgery can change corneal shape to treat astigmatism, and that the AMD relation is supported by the NEI wet-AMD treatment page describing anti-VEGF injections. Use the canonical source URLs in comments.

- [ ] **Step 2: Set the procedure slugs in `DISEASES`**

Change only these entries:

```ts
{ slug: "astigmatizm", title: "Астигматизм", categoryTitle: "Нарушения рефракции", procedureSlugs: ["lazernaya-korrektsiya-zreniya"] },
{ slug: "vozrastnaya-makulyarnaya-degeneratsiya", title: "Возрастная макулярная дегенерация", categoryTitle: "Патология сетчатки", procedureSlugs: ["anti-vegf-terapiya"] },
```

Do not add a procedure slug to amblyopia and do not add clinic relations.

- [ ] **Step 3: Validate the Prisma schema and seed typecheck**

Run:

```powershell
npm run prisma:validate
npm run typecheck
```

Expected: PASS. Do not run a production seed or migration in this task.

---

### Task 7: Generate, inspect, and persist the three image assets

**Files:**
- Create: `public/images/diseases/ambliopiya.webp`
- Create: `public/images/diseases/astigmatizm.webp`
- Create: `public/images/diseases/vozrastnaya-makulyarnaya-degeneratsiya.webp`

**Interfaces:**
- Consumes: image metadata in `DiseaseContent` and the imagegen skill.
- Produces: three distinct local medical illustrations with no text, logos, watermarks, or third-party branding.

- [ ] **Step 1: Generate the amblyopia illustration**

Use imagegen with a scientific-educational prompt: clean editorial medical illustration of binocular visual development, one eye providing a weaker blurred signal to the visual pathway, neutral teal/white background, no labels, no text, no watermark, no logo, no realistic patient identity, suitable for a professional ophthalmology encyclopedia hero.

- [ ] **Step 2: Generate the astigmatism illustration**

Use a separate prompt: clean scientific-educational cross-sectional eye illustration showing an irregular corneal curvature and light rays focusing at more than one point, neutral teal/white clinical palette, no text, no labels, no watermark, no logo, no diagnostic claim.

- [ ] **Step 3: Generate the AMD illustration**

Use a separate prompt: clean scientific-educational retina/macula illustration showing the central macular area and a restrained visual representation of central distortion, neutral teal/white clinical palette, no text, no labels, no watermark, no logo, no patient identity, no treatment recommendation.

- [ ] **Step 4: Inspect and convert assets**

Inspect each generated output with `view_image`. Copy the selected outputs into `public/images/diseases/`, convert to WebP if the generated output is not already WebP, and verify each file has a stable non-zero width/height matching the registry metadata. Do not overwrite an existing asset without explicit permission; these paths are new.

- [ ] **Step 5: Verify asset contract**

Run:

```powershell
node --import tsx --test src/lib/disease-content.test.ts
```

Expected: PASS, with all three `.webp` paths present in the workspace.

---

### Task 8: Update documentation and add release-facing regression tests

**Files:**
- Modify: `docs/architecture/diseases.md`
- Modify: `docs/architecture/ROADMAP.md` only if the current disease-content status needs a factual update
- Modify: `docs/architecture/CHANGELOG.md`
- Create: `src/lib/disease-route-contract.test.ts`

**Interfaces:**
- Consumes: completed registry, template, metadata, asset, and graph changes.
- Produces: documented content/provenance contract and checks that the three routes are canonical without widening scope to other diseases.

- [ ] **Step 1: Add the route contract test**

Test pure registry invariants: the three approved routes are the only rich routes, all route paths are `/diseases/${slug}`, no alternate disease route is listed, and all related disease slugs are within the seeded route set used by the registry.

- [ ] **Step 2: Update `diseases.md`**

Document the optional `DiseaseContent` registry, source provenance fields, rich/fallback rendering rule, and the fact that clinics are shown only from direct `ClinicOnDisease`. Do not alter the frozen Prisma structure section.

- [ ] **Step 3: Update `CHANGELOG.md` and, if applicable, `ROADMAP.md`**

Add a dated entry stating that the three disease pages now use the reusable content-driven template, that no schema change was made, that only two direct procedure edges were added, and that normative relations remain intentionally absent. Update ROADMAP only with facts supported by the completed implementation; do not mark the whole disease section complete.

- [ ] **Step 4: Run the full local checks**

Run exactly:

```powershell
npm test
npm run lint
npm run typecheck
npm run prisma:validate
npm run build
```

Record each result and separate targeted disease checks from unrelated legacy warnings.

---

### Task 9: Local production smoke test, UI review, and release audit

**Files:**
- No source changes expected; only generated local artifacts under `output/playwright/` if screenshots are retained.

**Interfaces:**
- Consumes: local build and a running local production server with the existing configured database, if available.
- Produces: HTTP/SEO/UI evidence and a final release decision. No production mutation.

- [ ] **Step 1: Start the local production server**

Run `npm start` after the successful build. If the configured local database is unavailable, record that limitation rather than seeding or changing production data.

- [ ] **Step 2: Check the three URLs**

For each route verify HTTP 200, one H1, unique title/description, canonical URL, `robots` index/follow, OpenGraph image, `BreadcrumbList`, `MedicalWebPage`, `MedicalCondition`, visible FAQ and conditional `FAQPage`, image alt, and no console/server errors.

- [ ] **Step 3: Verify sitemap and links**

Inspect `/sitemap.xml` and confirm the three canonical disease URLs are present when the local database contains their seeded rows. Crawl links on the three pages and confirm every internal disease/procedure/doctor/publication/guideline URL resolves without a 404. Confirm no `ambliopiya-*`, `astigmatizm-*`, or city/price route was created.

- [ ] **Step 4: Perform browser UI review**

Use Playwright CLI after checking `npx` availability. Capture desktop and 375–390 px screenshots. Check hero hierarchy, image aspect ratio, one-column mobile flow, readable long disease title, FAQ focus/open state, source links, no horizontal scroll, no clipped card text, and no empty relationship blocks.

- [ ] **Step 5: Complete skills-based release audit**

Record product effect, content-quality result, medical SEO result, graph/network result, UI/visual result, performance result, documentation result, tests, HTTP codes, sitemap, canonical, source assets, and limitations. Final status must be exactly `Готово к публикации` or `Не рекомендуется публиковать`. Do not deploy.

---

## Plan self-review

- Spec coverage: content registry/provenance is covered by Tasks 1–2; loader and direct graph boundaries by Tasks 4 and 6; template/FAQ by Task 5; SEO/schema by Task 3; images by Task 7; documentation and verification by Tasks 8–9.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation step is required.
- Type consistency: `DiseaseContent`, `DiseaseSource`, `DiseaseDetail.editorial`, `DiseaseDetail.relatedDiseases`, and SEO helper names are defined before later tasks consume them.
- Scope: no Prisma migration, no new disease routes, no automatic clinic/regulation relation, and no rich branch for non-MVP diseases.
