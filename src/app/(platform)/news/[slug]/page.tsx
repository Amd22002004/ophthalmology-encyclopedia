import { notFound } from "next/navigation";
import { NewsTemplate } from "@/components/templates/news-template";
import { getNewsItem } from "@/lib/loaders";
import { newsFigureSources, newsOpenGraphImage } from "@/lib/news-content";
import { NEWS_CONFERENCE_FRAME_HEIGHT, NEWS_CONFERENCE_FRAME_WIDTH } from "@/lib/news-media";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const news = await getNewsItem(slug);
  if (!news) return {};

  const coverSize = news.coverImageUrl && news.content
    ? newsFigureSources(news.content).find((item) => item.src === news.coverImageUrl)
    : undefined;
  const figure = !news.coverImageUrl && news.content ? newsOpenGraphImage(news.content) : undefined;
  const image = news.coverImageUrl ?? figure?.src;
  const sized = coverSize ?? figure;
  const conferenceFrame = image?.startsWith("/images/events/konferenciya-aok-tyumen-15-10/") ?? false;

  return createPageMetadata({
    title: news.seoTitle || news.title,
    description: news.seoDescription || news.summary,
    path: "/news/" + news.slug,
    ...(image
      ? {
          image,
          imageAlt: news.coverImageAlt ?? sized?.alt ?? news.title,
          ...(conferenceFrame
            ? { imageWidth: NEWS_CONFERENCE_FRAME_WIDTH, imageHeight: NEWS_CONFERENCE_FRAME_HEIGHT }
            : sized
              ? { imageWidth: sized.width, imageHeight: sized.height }
              : {}),
        }
      : {}),
  });
}

export default async function NewsItemPage({ params }: Props) {
  const { slug } = await params;
  const news = await getNewsItem(slug);
  if (!news) notFound();
  return <NewsTemplate data={news} />;
}
