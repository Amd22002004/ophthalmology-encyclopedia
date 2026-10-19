-- Additive media and event link for News. Existing rows keep empty media.

ALTER TABLE "News" ADD COLUMN "coverImageUrl" TEXT;
ALTER TABLE "News" ADD COLUMN "coverImageAlt" TEXT;
ALTER TABLE "News" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "News" ADD COLUMN "videoPosterUrl" TEXT;
ALTER TABLE "News" ADD COLUMN "badges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "News" ADD COLUMN "videoChapters" JSONB;
ALTER TABLE "News" ADD COLUMN "gallery" JSONB;
ALTER TABLE "News" ADD COLUMN "highlights" JSONB;
ALTER TABLE "News" ADD COLUMN "showMembershipCta" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "News" ADD COLUMN "eventSlug" TEXT;

CREATE INDEX "News_eventSlug_idx" ON "News"("eventSlug");
