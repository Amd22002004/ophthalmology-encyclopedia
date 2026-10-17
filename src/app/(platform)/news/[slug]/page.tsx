import { notFound } from "next/navigation";
import { NewsTemplate } from "@/components/templates/news-template";
import { getNewsItem } from "@/lib/loaders";
import { newsFigureSources } from "@/lib/news-content";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const news = await getNewsItem(slug);
  if (!news) return {};
  const image = news.content ? newsFigureSources(news.content)[0] : undefined;

  return createPageMetadata({
    title: news.seoTitle || news.title,
    description: news.seoDescription || news.summary,
    path: "/news/" + news.slug,
    image: image?.src,
    imageAlt: image?.alt,
    imageWidth: image?.width,
    imageHeight: image?.height,
  });
}

export default async function NewsItemPage({ params }: Props) {
  const { slug } = await params;
  const news = await getNewsItem(slug);
  if (!news) notFound();
  return <NewsTemplate data={news} />;
}
