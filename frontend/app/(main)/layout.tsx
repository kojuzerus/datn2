import Header from "../components/Header";
import Footer from "../components/Footer";
import { SearchProvider } from "../components/searchContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <Header />
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Footer />
    </SearchProvider>
  );
}