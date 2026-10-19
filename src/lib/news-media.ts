export const NEWS_CONFERENCE_VIDEO_URL = "/videos/konferenciya-aok-tyumen-15-10.mp4";
export const NEWS_CONFERENCE_VIDEO_WIDTH = 1048;
export const NEWS_CONFERENCE_VIDEO_HEIGHT = 576;
export const NEWS_CONFERENCE_FRAME_WIDTH = 1046;
export const NEWS_CONFERENCE_FRAME_HEIGHT = 576;

export type NewsHighlight = { title: string; text: string };
export type NewsChapter = { seconds: number; label: string };
export type NewsGalleryItem = { src: string; alt: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseNewsHighlights(value: unknown): NewsHighlight[] {
  if (!Array.isArray(value)) return [];
  const items: NewsHighlight[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.title !== "string" || typeof entry.text !== "string") continue;
    const title = entry.title.trim();
    const text = entry.text.trim();
    if (!title || !text) continue;
    items.push({ title, text });
  }
  return items;
}

export function parseNewsChapters(value: unknown): NewsChapter[] {
  if (!Array.isArray(value)) return [];
  const items: NewsChapter[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.label !== "string" || typeof entry.seconds !== "number") continue;
    if (!Number.isFinite(entry.seconds) || entry.seconds < 0) continue;
    const label = entry.label.trim();
    if (!label) continue;
    items.push({ seconds: entry.seconds, label });
  }
  return items;
}

export function parseNewsGallery(value: unknown): NewsGalleryItem[] {
  if (!Array.isArray(value)) return [];
  const items: NewsGalleryItem[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.src !== "string" || typeof entry.alt !== "string") continue;
    const src = entry.src.trim();
    const alt = entry.alt.trim();
    if (!src.startsWith("/images/") || src.includes("..") || !alt) continue;
    items.push({ src, alt });
  }
  return items;
}

export function formatVideoClock(seconds: number) {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
