import type { MetadataRoute } from "next";

const SITE_URL = "https://datn2-nine.vercel.app";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Next.js App Router quy ước: file này tự động phục vụ tại /sitemap.xml.
// Chạy trên server (build/request time), không phải trong trình duyệt, nên
// gọi thẳng API thật để lấy đúng danh sách sản phẩm/tin tức đang tồn tại —
// không hard-code URL, sitemap luôn khớp với dữ liệu thật trong DB.

interface ProductLite { slug: string }
interface NewsLite { slug: string; createdAt?: string }

async function getAllProducts(): Promise<ProductLite[]> {
  const all: ProductLite[] = [];
  let page = 1;
  // Lặp qua từng trang phòng khi catalog vượt quá 1 lần gọi (hiện ~30 sản
  // phẩm, nhưng không hard-code giả định số lượng sẽ không tăng).
  while (true) {
    const res = await fetch(`${API_URL}/api/products?limit=200&page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;
    const data = await res.json();
    const items: ProductLite[] = data?.data || [];
    all.push(...items);
    const totalPages = data?.pagination?.totalPages || 1;
    if (page >= totalPages || items.length === 0) break;
    page++;
  }
  return all;
}

async function getAllNews(): Promise<NewsLite[]> {
  const all: NewsLite[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${API_URL}/api/news?limit=30&page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;
    const data = await res.json();
    const items: NewsLite[] = data?.data || [];
    all.push(...items);
    const totalPages = data?.pagination?.totalPages || 1;
    if (page >= totalPages || items.length === 0) break;
    page++;
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sanpham`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tintuc`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/thuonghieu`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/he-thong-cua-hang`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/gioi-thieu`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/lien-he`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/huong-dan-mua-hang`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/doi-tac`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/tuyen-dung`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/chinh-sach-bao-hanh`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/chinh-sach-bao-mat`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/chinh-sach-doi-tra`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/chinh-sach-van-chuyen`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  let newsPages: MetadataRoute.Sitemap = [];

  try {
    const products = await getAllProducts();
    productPages = products
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${SITE_URL}/sanpham/${p.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    // Backend tạm không phản hồi khi build — vẫn trả sitemap với các trang
    // tĩnh, không để lỗi 1 API làm hỏng toàn bộ sitemap.
  }

  try {
    const news = await getAllNews();
    newsPages = news
      .filter((n) => n.slug)
      .map((n) => ({
        url: `${SITE_URL}/tintuc/${n.slug}`,
        lastModified: n.createdAt ? new Date(n.createdAt) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
  } catch {}

  return [...staticPages, ...productPages, ...newsPages];
}
