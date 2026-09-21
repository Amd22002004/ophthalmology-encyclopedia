import { notFound } from "next/navigation";
import { NewsTemplate } from "@/components/templates/news-template";
import { getNewsItem } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const news = await getNewsItem(slug);
  if (!news) return {};

  return createPageMetadata({
    title: news.seoTitle || news.title,
    description: news.seoDescription || news.summary,
    path: "/news/" + news.slug,
  });
}

export default async function NewsItemPage({ params }: Props) {
  const { slug } = await params;
  const news = await getNewsItem(slug);
  if (!news) notFound();
  return <NewsTemplate data={news} />;
}
