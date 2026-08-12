import type { Metadata } from "next";
import './globals.css';
import { Be_Vietnam_Pro } from "next/font/google";
import { ThemeProvider } from "./components/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import LoginPromptModal from "./components/LoginPromptModal";
import ScrollToTop from "./components/ScrollToTop";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartHub - Thế giới đồ điện tử chính hãng",
  description: "Mua sắm laptop, điện thoại, phụ kiện công nghệ giá rẻ nhất",
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
        <ThemeProvider>
          <ThemeToggle />
          {children}
          <LoginPromptModal />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
