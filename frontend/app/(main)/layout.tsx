import Header from "../components/Header";
import Footer from "../components/Footer";
import { SearchProvider } from "../components/searchContext";
import { ComparisonProvider } from "../components/comparisonContext";
import { FavoritesProvider } from "../components/favoritesContext";
import ComparisonBar from "../components/ComparisonBar";
import AIChatBox from "../components/AIChatBox";
import PromoModal from "../components/PromoModal";

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
          <main className="flex-1 w-full">
            {children}
          </main>
          <Footer />
          <ComparisonBar />
          <AIChatBox />
          <PromoModal />
        </FavoritesProvider>
      </ComparisonProvider>
    </SearchProvider>
  );
}
