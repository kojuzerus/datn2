import type { Metadata } from "next";
import "./globals.css";
import { Be_Vietnam_Pro } from "next/font/google";
import { ThemeProvider } from "./components/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import LoginPromptModal from "./components/LoginPromptModal";
import ScrollToTop from "./components/ScrollToTop";
import FloatingSpinWheel from "./components/FloatingSpinWheel";
import { SpinEventProvider } from "./components/SpinEventProvider";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = "https://datn2-nine.vercel.app";
const SITE_NAME = "SmartHub";
const SITE_DESCRIPTION =
  "SmartHub - Mua sắm điện thoại, laptop, máy tính bảng, tai nghe và phụ kiện công nghệ chính hãng, giá tốt nhất, giao hàng nhanh toàn quốc.";

export const metadata: Metadata = {
  // Bắt buộc phải có để Next.js resolve được URL tuyệt đối cho ảnh Open Graph/
  // Twitter card khai báo bằng đường dẫn tương đối (nếu không có, các URL đó
  // sẽ rỗng/sai khi chia sẻ link trên Facebook/Zalo/Twitter...).
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Thế giới đồ điện tử chính hãng`,
    // Các trang con (sản phẩm, tin tức...) chỉ cần set title:"Tên trang", Next.js
    // tự nối theo mẫu này → "Tên trang | SmartHub" thay vì phải lặp lại "SmartHub".
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "SmartHub", "điện thoại chính hãng", "laptop chính hãng", "máy tính bảng",
    "tai nghe", "phụ kiện công nghệ", "mua sắm online", "điện tử giá rẻ",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} - Thế giới đồ điện tử chính hãng`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Thế giới đồ điện tử chính hãng`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {/* JSON-LD: giúp Google hiểu SmartHub là 1 tổ chức/thương hiệu (Knowledge
            Panel) và bật ô tìm kiếm ngay trong kết quả tìm kiếm (Sitelinks Search
            Box) — không hiển thị gì với người dùng, chỉ để công cụ tìm kiếm đọc. */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: SITE_NAME,
                  url: SITE_URL,
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  name: SITE_NAME,
                  url: SITE_URL,
                  publisher: { "@id": `${SITE_URL}/#organization` },
                  potentialAction: {
                    "@type": "SearchAction",
                    // Đúng tên query param thật của trang /sanpham ("tu-khoa"),
                    // không phải "search" — xem sanpham/page.tsx.
                    target: `${SITE_URL}/sanpham?tu-khoa={search_term_string}`,
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        <ThemeProvider>
          <ThemeToggle />
          <SpinEventProvider>
            {children}
            <LoginPromptModal />
            <ScrollToTop />
            <FloatingSpinWheel />
          </SpinEventProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
