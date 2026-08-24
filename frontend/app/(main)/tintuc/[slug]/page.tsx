import type { Metadata } from "next";
import NewsDetailClient from "./NewsDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SITE_URL = "https://datn2-nine.vercel.app";

interface NewsSeo {
  title: string;
  slug: string;
  thumbnail: string;
  summary: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

// Server Component — chỉ để generateMetadata() + JSON-LD NewsArticle theo
// từng bài viết thật. UI/logic hiển thị vẫn ở NewsDetailClient.tsx (nguyên
// vẹn). Gọi API kèm ?meta=1 để KHÔNG tính vào lượt xem thật của bài viết
// (lượt xem thật đã được đếm ở fetch phía client, không đổi).
async function getNews(slug: string): Promise<NewsSeo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/news/${slug}?meta=1`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNews(slug);

  if (!news) {
    return {
      title: "Không tìm thấy bài viết",
      robots: { index: false, follow: true },
    };
  }

  const title = news.title;
  const description = news.summary?.trim() || `${news.title} — Tin tức công nghệ tại SmartHub.`;
  const url = `${SITE_URL}/tintuc/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: news.createdAt,
      modifiedTime: news.updatedAt,
      authors: news.author ? [news.author] : undefined,
      images: news.thumbnail ? [{ url: news.thumbnail }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: news.thumbnail ? [news.thumbnail] : undefined,
    },
  };
}

export default async function Page(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const news = await getNews(slug);

  return (
    <>
      {news && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: news.title,
              image: news.thumbnail ? [news.thumbnail] : undefined,
              datePublished: news.createdAt,
              dateModified: news.updatedAt || news.createdAt,
              author: news.author ? { "@type": "Person", name: news.author } : undefined,
              publisher: {
                "@type": "Organization",
                name: "SmartHub",
                logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
              },
              mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/tintuc/${slug}` },
            }),
          }}
        />
      )}
      <NewsDetailClient />
    </>
  );
}
