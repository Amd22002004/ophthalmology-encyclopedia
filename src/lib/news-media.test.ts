import assert from "node:assert/strict";
import test from "node:test";
import { formatVideoClock, parseNewsChapters, parseNewsGallery, parseNewsHighlights } from "./news-media";

test("media parsers keep only complete local records", () => {
  assert.deepEqual(
    parseNewsHighlights([{ title: " 10+ ", text: " текст " }, { title: "", text: "нет" }, "нет"]),
    [{ title: "10+", text: "текст" }],
  );
  assert.deepEqual(parseNewsChapters([{ seconds: 18, label: "Комментарий" }, { seconds: -1, label: "нет" }]), [
    { seconds: 18, label: "Комментарий" },
  ]);
  assert.deepEqual(
    parseNewsGallery([
      { src: "/images/events/frame.webp", alt: "Кадр" },
      { src: "https://example.com/a.webp", alt: "Чужой" },
      { src: "/images/../secret.webp", alt: "Путь" },
    ]),
    [{ src: "/images/events/frame.webp", alt: "Кадр" }],
  );
  assert.equal(formatVideoClock(107), "01:47");
});
