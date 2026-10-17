export type NewsInline =
  | { type: "text"; text: string }
  | { type: "link"; href: string; text: string };

export type NewsBlock =
  | { type: "paragraph"; inlines: NewsInline[] }
  | { type: "list"; items: NewsInline[][] }
  | {
      type: "figure";
      alt: string;
      src: string;
      width: number;
      height: number;
      caption: NewsInline[];
    };

export type NewsSection = { title: string | null; blocks: NewsBlock[] };

const LINK_PATTERN = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const FIGURE_PATTERN = /^!\[([^\]]+)\]\((\/[^)\s]+)\)\{(\d+)x(\d+)\}$/;

/**
 * `News.content` remains the single editor-owned text field. The notation
 * below makes headings, lists, links and captioned figures readable without a
 * second storage format:
 *
 * ## Раздел
 * Абзац со [ссылкой](https://example.com/).
 *
 * - Пункт
 *
 * ![Подпись для чтения с экрана](/images/example.webp){1200x800}
 * Подпись. Источник: [example.com](https://example.com/).
 */
export function parseNewsContent(content: string): NewsSection[] {
  const sections: NewsSection[] = [];
  let current: NewsSection = { title: null, blocks: [] };

  const commit = () => {
    if (current.title || current.blocks.length > 0) sections.push(current);
  };

  for (const rawBlock of content.trim().split(/\n\s*\n/)) {
    const block = rawBlock.trim();
    if (!block) continue;

    const heading = block.match(/^##\s+(.+)$/);
    if (heading && block === heading[0]) {
      commit();
      current = { title: heading[1], blocks: [] };
      continue;
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const figure = parseFigure(lines);
    if (figure) {
      current.blocks.push(figure);
      continue;
    }

    const listItems = lines.map((line) => line.match(/^[-•]\s+(.+)$/)?.[1] ?? null);
    if (listItems.length > 0 && listItems.every(Boolean)) {
      current.blocks.push({
        type: "list",
        items: (listItems as string[]).map((item) => parseNewsInlines(item)),
      });
      continue;
    }

    current.blocks.push({ type: "paragraph", inlines: parseNewsInlines(lines.join(" ")) });
  }

  commit();
  return sections;
}

export function parseNewsInlines(text: string): NewsInline[] {
  const inlines: NewsInline[] = [];
  let cursor = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) inlines.push({ type: "text", text: text.slice(cursor, index) });

    const label = match[1];
    const href = safeNewsHref(match[2]);
    inlines.push(href ? { type: "link", href, text: label } : { type: "text", text: match[0] });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) inlines.push({ type: "text", text: text.slice(cursor) });
  return inlines.filter((inline) => inline.type === "link" || inline.text.length > 0);
}

export function safeNewsHref(href: string) {
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\") && !href.includes("..")) {
    return href;
  }

  try {
    const url = new URL(href);
    if (url.protocol === "https:") return url.toString();
  } catch {
    return null;
  }

  return null;
}

export function newsFigureSources(content: string) {
  return parseNewsContent(content).flatMap((section) =>
    section.blocks.flatMap((block) => (block.type === "figure" ? [block] : [])),
  );
}

function parseFigure(lines: string[]): NewsBlock | null {
  const matched = lines[0]?.match(FIGURE_PATTERN);
  if (!matched) return null;

  const src = safeNewsImageSrc(matched[2]);
  const width = Number(matched[3]);
  const height = Number(matched[4]);
  if (!src || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    return null;
  }

  return {
    type: "figure",
    alt: matched[1],
    src,
    width,
    height,
    caption: parseNewsInlines(lines.slice(1).join(" ")),
  };
}

function safeNewsImageSrc(src: string) {
  if (!src.startsWith("/images/") || src.includes("..") || src.includes("\\") || src.includes("//")) return null;
  if (!/^\/images\/[a-z0-9/._-]+\.(?:webp|png|jpe?g)$/i.test(src)) return null;
  return src;
}
