import Header from "../components/Header";
import Footer from "../components/Footer";
import { SearchProvider } from "../components/searchContext";
import { ComparisonProvider } from "../components/comparisonContext";
import { FavoritesProvider } from "../components/favoritesContext";
import ComparisonBar from "../components/ComparisonBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <ComparisonProvider>
        <FavoritesProvider>
          <Header />
          <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
          <ComparisonBar />
        </FavoritesProvider>
      </ComparisonProvider>
    </SearchProvider>
  );
}
