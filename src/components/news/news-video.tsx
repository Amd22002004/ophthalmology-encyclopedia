"use client";

import { useRef } from "react";
import { formatVideoClock, type NewsChapter } from "@/lib/news-media";

export function NewsVideo({
  src,
  poster,
  chapters,
  width,
  height,
}: {
  src: string;
  poster: string | null;
  chapters: NewsChapter[];
  width: number;
  height: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function seek(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    void video.play().catch(() => undefined);
  }

  return (
    <figure className="space-y-3">
      <video
        className="w-full rounded-lg border bg-muted object-contain"
        controls
        playsInline
        poster={poster ?? undefined}
        preload="metadata"
        ref={videoRef}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <source src={src} type="video/mp4" />
      </video>
      {chapters.length > 0 && (
        <nav aria-label="Навигация по видеосюжету" className="space-y-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Навигация по видеосюжету</h2>
          <ol className="space-y-2">
            {chapters.map((chapter) => (
              <li key={`${chapter.seconds}-${chapter.label}`}>
                <button
                  className="flex w-full gap-3 rounded-md border bg-card p-3 text-left text-sm leading-6 transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => seek(chapter.seconds)}
                  type="button"
                >
                  <span className="shrink-0 font-semibold tabular-nums text-primary">{formatVideoClock(chapter.seconds)}</span>
                  <span className="text-foreground">{chapter.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </figure>
  );
}
