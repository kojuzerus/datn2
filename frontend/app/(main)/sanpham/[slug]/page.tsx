import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SITE_URL = "https://datn2-nine.vercel.app";

interface ProductVariant {
  color?: string;
  price?: number;
  sale_price?: number | null;
  stock_quantity?: number;
}

interface ProductSeo {
  ten: string;
  slug: string;
  thuongHieu: string;
  thumbnail: string;
  moTa: string;
  gia: number;
  giaSale: number | null;
  danhGia: number;
  luotDanhGia: number;
  categoryName: string;
  sku: string;
  variants?: ProductVariant[];
}

// Đây là Server Component (không "use client") — CHỈ để gọi generateMetadata()
// (Client Component không export được hàm này) và nhúng JSON-LD Product theo
// từng sản phẩm thật. Toàn bộ UI/logic hiển thị vẫn ở ProductDetailClient.tsx
// (nguyên vẹn, không đổi gì) — trang tự fetch dữ liệu riêng, không phụ thuộc
// vào fetch ở đây, nên không có rủi ro làm hỏng hành vi hiện tại.
async function getProduct(slug: string): Promise<ProductSeo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch {
    return null;
  }
}

function formatPriceVN(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm",
      robots: { index: false, follow: true },
    };
  }

  const price = product.giaSale ?? product.gia;
  const title = product.ten;
  const description =
    product.moTa?.trim() ||
    `${product.ten} chính hãng, giá ${formatPriceVN(price)} tại SmartHub. Bảo hành chính hãng, giao hàng nhanh toàn quốc.`;
  const url = `${SITE_URL}/sanpham/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: product.thumbnail ? [{ url: product.thumbnail }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.thumbnail ? [product.thumbnail] : undefined,
    },
  };
}

export default async function Page(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.ten,
              image: product.thumbnail ? [product.thumbnail] : undefined,
              description: product.moTa || undefined,
              sku: product.sku || undefined,
              brand: product.thuongHieu ? { "@type": "Brand", name: product.thuongHieu } : undefined,
              ...(product.luotDanhGia > 0 && {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.danhGia,
                  reviewCount: product.luotDanhGia,
                },
              }),
              offers: {
                "@type": "Offer",
                url: `${SITE_URL}/sanpham/${slug}`,
                priceCurrency: "VND",
                price: product.giaSale ?? product.gia,
                availability:
                  (product.variants || []).some((v) => (v.stock_quantity ?? 0) > 0)
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
              },
            }),
          }}
        />
      )}
      <ProductDetailClient />
    </>
  );
}
