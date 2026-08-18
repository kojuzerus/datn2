"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  ChevronRight,
  Home,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  CheckCircle2,
  Gift,
  MessageSquare,
  Repeat,
  Loader2,
  Send,
  PackageCheck,
} from "lucide-react";
import { useCart } from "../../../hooks/useCart";
import { flyToCart } from "../../../utils/flyToCart";
import { useComparison } from "../../../components/comparisonContext";
import {
  useFavorites,
  type FavoriteProduct,
} from "../../../components/favoritesContext";
import { requireLogin, isLoggedIn } from "../../../lib/authPrompt";
import ProductQuestions from "../../../components/ProductQuestions";
import { toastError } from "../../../utils/toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Variant {
  variant_id: number;
  color: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  sku: string;
  image?: string;
  sold_quantity?: number;
}

interface Product {
  id: number;
  ten: string;
  slug: string;
  thuongHieu: string;
  thumbnail: string;
  images: string[];
  moTa: string;
  gia: number;
  giaSale: number | null;
  giamGia: number;
  danhGia: number;
  luotDanhGia: number;
  luotBan: number;
  badge: string;
  categoryName: string;
  warranty: string;
  variants: Variant[];
  videoId?: string;
  specification?: { label: string; value: string }[];
  category_id?: number | null;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );

const PROMOTIONS = [
  "Hộp đầy đủ phụ kiện chính hãng từ nhà sản xuất",
  "Tặng kèm túi đựng sản phẩm SmartHub cao cấp",
  "Hỗ trợ đổi trả miễn phí trong 30 ngày nếu có lỗi kỹ thuật",
  "Miễn phí vận chuyển toàn quốc cho đơn từ 500.000đ",
  "Thu cũ đổi mới, định giá nhanh trong 5 phút",
];

const GUARANTEES = [
  { Icon: ShieldCheck, title: "Chính hãng 100%", sub: "Bảo hành đầy đủ" },
  { Icon: Truck, title: "Giao hàng 2h", sub: "Nội thành HN, HCM" },
  {
    Icon: RefreshCw,
    title: "Đổi trả 30 ngày",
    sub: "Miễn phí, không cần lý do",
  },
  { Icon: Headphones, title: "Hỗ trợ 24/7", sub: "1800 xxxx (miễn phí)" },
];

interface ReviewItem {
  _id: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6">
        <div>
          <div className="bg-gray-200 rounded-md aspect-square" />
          <div className="flex gap-2 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0"
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded w-4/5" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded w-1/2 mt-2" />
          <div className="h-32 bg-gray-200 rounded-md mt-4" />
          <div className="h-12 bg-gray-200 rounded-md" />
          <div className="h-12 bg-gray-200 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ── Stars ──────────────────────────────────────────────────────────────── */
function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const cls = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  // true khi người dùng tự bấm chọn ảnh trong thư viện — ưu tiên hơn ảnh của phiên bản
  const [userPickedImage, setUserPickedImage] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);
  // Hiện khi thêm giỏ hàng lúc ảnh sản phẩm đã cuộn khuất màn hình — lúc đó animation
  // "bay vào giỏ" xuất phát từ vị trí ngoài màn hình nên người dùng không thấy được.
  const [showCartToast, setShowCartToast] = useState(false);

  const tabRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const specSecRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("thong-tin");

  /* Scroll-spy cho thanh tab điều hướng */
  useEffect(() => {
    const sections: [string, React.RefObject<HTMLDivElement | null>][] = [
      ["lien-quan", relatedRef],
      ["danh-gia", reviewsRef],
      ["mo-ta", tabRef],
      ["thong-so", specSecRef],
    ];
    const onScroll = () => {
      for (const [id, ref] of sections) {
        if (ref.current && ref.current.getBoundingClientRect().top <= 80) {
          setActiveSection(id);
          return;
        }
      }
      setActiveSection("thong-tin");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [product]);

  /* Cuộn xuống → ẩn header, thanh tab hiện ra thế chỗ; ở đầu trang thì chỉ có header */
  const [showTabs, setShowTabs] = useState(false);
  useEffect(() => {
    const header = document.querySelector("header");
    if (!(header instanceof HTMLElement)) return;
    header.style.transition = "transform 0.25s ease";
    const onScroll = () => {
      const scrolled = window.scrollY > 120;
      header.style.transform = scrolled ? "translateY(-100%)" : "";
      setShowTabs(scrolled);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      header.style.transform = "";
      header.style.transition = "";
    };
  }, []);
  const { addToCart, adding } = useCart();
  const { addItem, removeItem, isInComparison } = useComparison();
  const { isFavorite, toggleItem } = useFavorites();
  const wishlist = product ? isFavorite(product.id) : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    const fav: FavoriteProduct = {
      id: product.id,
      ten: product.ten,
      slug: product.slug,
      thumbnail: product.thumbnail,
      gia: product.gia,
      giaSale: product.giaSale,
      giamGia: product.giamGia,
      danhGia: product.danhGia,
      thuongHieu: product.thuongHieu,
      categoryName: product.categoryName,
    };
    toggleItem(fav);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_BASE}/api/products/${slug}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setProduct(j.data);
          setSelectedVariant(j.data.variants?.[0] ?? null);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  /* ── Lưu vào "đã xem gần đây" ── */
  useEffect(() => {
    if (!product) return;
    try {
      const KEY = "smarthub_recently_viewed";
      const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
      const item = {
        id: product.id,
        ten: product.ten,
        slug: product.slug,
        thumbnail: product.thumbnail,
        gia: product.gia,
        giaSale: product.giaSale,
      };
      const next = [
        item,
        ...prev.filter((p: { id: number }) => p.id !== product.id),
      ].slice(0, 10);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, [product?.id]);

  /* ── Sản phẩm liên quan: cùng danh mục, ưu tiên bán chạy ── */
  useEffect(() => {
    if (!product) {
      setRelated([]);
      return;
    }
    const query =
      product.category_id != null
        ? `category_id=${product.category_id}`
        : `category_name=${encodeURIComponent(product.categoryName)}`;
    fetch(`${API_BASE}/api/products?${query}&sort=sold&limit=9`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) {
          setRelated(
            j.data.filter((p: Product) => p.id !== product.id).slice(0, 8),
          );
        }
      })
      .catch(() => {});
  }, [product?.id]);

  /* ── Sticky buy bar: hiện khi hai nút Mua ngay / Thêm vào giỏ khuất khỏi màn hình ── */
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  const displayPrice =
    selectedVariant?.sale_price ??
    selectedVariant?.price ??
    product?.giaSale ??
    product?.gia ??
    0;
  const originalPrice = selectedVariant?.price ?? product?.gia ?? 0;
  const hasDiscount = selectedVariant
    ? selectedVariant.sale_price != null &&
      selectedVariant.sale_price < selectedVariant.price
    : (product?.giamGia ?? 0) > 0;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;
  const inStock = (selectedVariant?.stock_quantity ?? 0) > 0;
  const soldCount = selectedVariant
    ? (selectedVariant.sold_quantity ?? 0)
    : (product?.luotBan ?? 0);
  const allImages = product
    ? [product.thumbnail, ...(product.images || [])]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
    : [];
  // Người dùng bấm thumbnail → hiện ảnh đó; ngược lại ưu tiên ảnh của phiên bản đang chọn
  const mainImageSrc = userPickedImage
    ? allImages[activeImage] || selectedVariant?.image
    : selectedVariant?.image || allImages[activeImage];

  /* Đổi phiên bản → quay về ảnh của phiên bản đó (và đồng bộ thumbnail nếu ảnh có trong thư viện) */
  useEffect(() => {
    setUserPickedImage(false);
    if (selectedVariant?.image) {
      const idx = allImages.indexOf(selectedVariant.image);
      if (idx >= 0) setActiveImage(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant?.variant_id]);

  const mainImgRef = useRef<HTMLImageElement>(null);

  const handleAddToCart = async () => {
    if (!product || !inStock) return;
    const imgSrc = selectedVariant?.image || product.thumbnail || "";

    // Ảnh còn hiện trên màn hình (chưa cuộn khuất) → chạy animation bay vào giỏ như cũ.
    // Ảnh đã cuộn khuất (VD đang bấm ở sticky bar dưới cùng) → animation sẽ xuất phát
    // từ ngoài màn hình, người dùng không thấy gì cả — hiện thông báo bên trái thay thế.
    const rect = mainImgRef.current?.getBoundingClientRect();
    const imageVisible = !!rect && rect.bottom > 0 && rect.top < window.innerHeight;

    if (imageVisible && mainImgRef.current && imgSrc) {
      flyToCart(imgSrc, mainImgRef.current.getBoundingClientRect());
    } else {
      setShowCartToast(true);
      setTimeout(() => setShowCartToast(false), 2600);
    }

    const success = await addToCart({
      productId: String(product.id),
      tenSanPham: product.ten,
      hinhAnh: imgSrc,
      gia: displayPrice,
      soLuong: Math.max(1, qty),
      variant: selectedVariant?.color || "",
    });
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!product || !inStock) return;
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const item = {
      _id: `buynow_${product.id}`,
      productId: String(product.id),
      tenSanPham: product.ten,
      hinhAnh: selectedVariant?.image || product.thumbnail,
      gia: displayPrice,
      soLuong: Math.max(1, qty),
      variant: selectedVariant?.color || "",
    };
    sessionStorage.setItem("smarthub_buynow_item", JSON.stringify(item));
    localStorage.removeItem("smarthub_checkout_ids");
    router.push("/thanhtoan");
  };

  const scrollToTab = (tab: "mo-ta" | "danh-gia") => {
    const ref = tab === "danh-gia" ? reviewsRef : tabRef;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto py-6 px-4">
        <div className="h-3 bg-gray-200 rounded w-48 animate-pulse mb-6" />
        <Skeleton />
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound || !product) {
    return (
      <div className="max-w-screen-xl mx-auto py-20 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
          <Package className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-[20px] font-bold text-gray-800">
          Không tìm thấy sản phẩm
        </h1>
        <p className="text-[13.5px] text-gray-500">
          Sản phẩm này không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          href="/sanpham"
          className="px-5 py-2.5 bg-red-600 text-white rounded-md text-[13.5px] font-semibold hover:bg-red-700 transition-colors"
        >
          Quay về danh sách
        </Link>
      </div>
    );
  }

  const variantColors = Array.from(
    new Set((product.variants || []).map((v) => v.color).filter(Boolean)),
  );

  const faqs = [
    {
      q: `${product.ten} có bảo hành bao lâu?`,
      a: `${product.ten} được bảo hành chính hãng ${product.warranty || "12 tháng"}. Trong vòng 30 ngày đầu, nếu phát hiện lỗi phần cứng từ nhà sản xuất, SmartHub hỗ trợ đổi 1 đổi 1.`,
    },
    {
      q: `${product.ten} có mấy phiên bản màu?`,
      a: variantColors.length
        ? `${product.ten} hiện có ${variantColors.length} phiên bản màu: ${variantColors.join(", ")}.`
        : `${product.ten} hiện có 1 phiên bản tiêu chuẩn. Vui lòng chọn phiên bản phù hợp ở phần lựa chọn sản phẩm phía trên.`,
    },
    {
      q: `Mua ${product.ten} có hỗ trợ giao hàng nhanh không?`,
      a: `SmartHub hỗ trợ giao hàng 2 giờ nội thành Hà Nội và TP.HCM. Giao toàn quốc 1–3 ngày qua GHTK, GHN, ViettelPost. Miễn phí vận chuyển cho đơn từ 500.000đ.`,
    },
    {
      q: `${product.ten} có giao hàng nhanh không?`,
      a: `SmartHub hỗ trợ giao hàng trong 2 giờ tại nội thành Hà Nội, TP.HCM, và giao toàn quốc trong 1-3 ngày làm việc cho các khu vực khác.`,
    },
    {
      q: `Mua ${product.ten} tại SmartHub có được đổi trả không?`,
      a: `Có. ${product.ten} được đổi trả miễn phí trong 30 ngày nếu phát hiện lỗi kỹ thuật từ nhà sản xuất, không cần lý do trong 7 ngày đầu theo chính sách đổi trả của SmartHub.`,
    },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-4">
      {/* Breadcrumb */}
      <nav className="flex items-center flex-wrap gap-1 text-[12.5px] text-gray-400 mb-4">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-red-500 transition-colors"
        >
          <Home className="w-3 h-3" /> Trang chủ
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <Link href="/sanpham" className="hover:text-red-500 transition-colors">
          Sản phẩm
        </Link>
        {product.categoryName && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <Link
              href={`/sanpham?danh-muc=${product.categoryName.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-red-500 transition-colors"
            >
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <span className="text-gray-600 line-clamp-1 max-w-[240px]">
          {product.ten}
        </span>
      </nav>

      {/* ── Thanh tab điều hướng: chỉ hiện khi đã cuộn (header ẩn) ── */}
      {showTabs && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-screen-xl mx-auto px-4 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                ["thong-tin", "Thông tin sản phẩm", null],
                ["thong-so", "Thông số kỹ thuật", specSecRef],
                ["mo-ta", "Mô tả sản phẩm", tabRef],
                ["danh-gia", "Đánh giá & Hỏi đáp", reviewsRef],
                ["lien-quan", "Sản phẩm liên quan", relatedRef],
              ] as [
                string,
                string,
                React.RefObject<HTMLDivElement | null> | null,
              ][]
            ).map(([id, label, ref]) => (
              <button
                key={id}
                onClick={() =>
                  ref
                    ? ref.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    : window.scrollTo({ top: 0, behavior: "smooth" })
                }
                className={`px-4 py-3 text-[13.5px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  activeSection === id
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-600 hover:text-red-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 2-col main ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 mb-10 lg:items-start">
        {/* Gallery */}
        <div className="lg:sticky lg:top-[64px] lg:self-start">
          <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
            {/* Main image */}
            <div className="relative bg-gray-50 overflow-hidden aspect-square flex items-center justify-center group">
              {product.badge && (
                <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  {product.badge}
                </span>
              )}
              {discountPct > 0 && (
                <span className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[12px] font-bold w-11 h-11 rounded-full flex items-center justify-center">
                  -{discountPct}%
                </span>
              )}
              <img
                ref={mainImgRef}
                src={
                  mainImageSrc || "https://placehold.co/600x600?text=No+Image"
                }
                alt={product.ten}
                className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.04]"
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      setUserPickedImage(true);
                      setActiveImage(
                        (i) => (i - 1 + allImages.length) % allImages.length,
                      );
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => {
                      setUserPickedImage(true);
                      setActiveImage((i) => (i + 1) % allImages.length);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </>
              )}
              {allImages.length > 1 && (
                <span className="absolute bottom-3 right-3 text-[11px] bg-black/40 text-white px-2 py-0.5 rounded-full">
                  {activeImage + 1}/{allImages.length}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 px-3 pt-2.5 pb-2.5 overflow-x-auto border-t border-gray-100">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setUserPickedImage(true);
                      setActiveImage(i);
                    }}
                    className={`w-[68px] h-[68px] flex-shrink-0 rounded-md border-2 overflow-hidden bg-white transition-all ${
                      i === activeImage
                        ? "border-red-500 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-contain p-1.5"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Share strip */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
              <span className="text-[12px] text-gray-400">Chia sẻ:</span>
              <button className="bg-[#1877F2] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">
                Facebook
              </button>
              <button className="bg-[#0068FF] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">
                Zalo
              </button>
              <button className="bg-gray-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity flex items-center gap-1">
                <Share2 className="w-3 h-3" /> Sao chép
              </button>
            </div>
            {/* Thông số nổi bật — 3 thông số đầu, kiểu FPT */}
            {(product.specification?.length || product.warranty) && (
              <div className="border-t border-gray-100 px-5 py-4">
                <p className="text-[15px] font-bold text-gray-800 mb-3.5">
                  Thông số nổi bật
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Bảo hành",
                      value: product.warranty || "12 tháng",
                    },
                    ...(product.specification || [])
                      .slice(0, 2)
                      .map((s) => ({ label: s.label, value: s.value })),
                  ]
                    .slice(0, 3)
                    .map(({ label, value }) => (
                      <div key={label} className="min-w-0">
                        <p className="text-[12px] text-gray-500 mb-1.5">
                          {label}
                        </p>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-[13px] font-semibold text-gray-800 truncate">
                            {value}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Chính sách sản phẩm */}
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="text-[15px] font-bold text-gray-800 mb-3.5">
                Chính sách sản phẩm
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {GUARANTEES.map(({ Icon, title, sub }) => (
                  <div
                    key={title}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    <Icon className="w-[18px] h-[18px] text-gray-700 shrink-0" />
                    <span className="text-[13px] text-gray-700 truncate">
                      {title} — {sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>{" "}
          {/* end gallery card */}
        </div>

        {/* Info panel */}
        <div className="bg-white rounded-md border border-gray-100 shadow-sm px-5 pt-5 pb-4">
          {/* Brand badges + title */}
          <div className="pb-4 border-b border-gray-100">
            <div className="flex items-center flex-wrap gap-1.5 mb-2">
              {product.thuongHieu && (
                <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  {product.thuongHieu}
                </span>
              )}
              {product.badge && (
                <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full uppercase">
                  {product.badge}
                </span>
              )}
            </div>

            <div className="flex items-start gap-2">
              <h1 className="text-[20px] font-bold text-gray-900 leading-snug">
                {product.ten}
              </h1>
              <button
                onClick={handleToggleWishlist}
                title="Yêu thích"
                className={`shrink-0 w-7 h-7 mt-0.5 flex items-center justify-center rounded-full border-2 transition-all ${
                  wishlist
                    ? "border-red-400 bg-red-50 text-red-500"
                    : "border-gray-200 text-gray-400 hover:border-red-300"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${wishlist ? "fill-red-500" : ""}`}
                />
              </button>
            </div>

            {/* Rating + sold */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
              {product.danhGia > 0 ? (
                <button
                  onClick={() => scrollToTab("danh-gia")}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <Stars rating={product.danhGia} />
                  <span className="text-[13px] font-semibold text-amber-600">
                    {product.danhGia.toFixed(1)}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => scrollToTab("danh-gia")}
                  className="text-[12.5px] text-blue-500 hover:underline"
                >
                  Chưa có đánh giá
                </button>
              )}
              {product.luotDanhGia > 0 && (
                <button
                  onClick={() => scrollToTab("danh-gia")}
                  className="text-[12.5px] text-blue-500 hover:underline"
                >
                  {product.luotDanhGia} đánh giá
                </button>
              )}
              {soldCount > 0 && (
                <>
                  <span className="text-gray-300 text-[12px]">|</span>
                  <span className="text-[12.5px] text-gray-500">
                    Đã bán{" "}
                    <span className="font-semibold text-gray-700">
                      {soldCount.toLocaleString("vi-VN")}
                    </span>
                  </span>
                </>
              )}
              {product.warranty && (
                <>
                  <span className="text-gray-300 text-[12px]">|</span>
                  <span className="text-[12.5px] text-green-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> BH{" "}
                    {product.warranty}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-end flex-wrap gap-3">
              <span className="text-[34px] font-bold text-red-600 leading-none">
                {fmt(displayPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-[17px] text-gray-400 line-through leading-none mb-0.5">
                    {fmt(originalPrice)}
                  </span>
                  <span className="text-[11.5px] font-bold text-white bg-red-500 px-2 py-0.5 rounded mb-1">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="text-[12px] text-gray-400 mt-1">
                Tiết kiệm:{" "}
                <span className="font-semibold text-red-600">
                  {fmt(originalPrice - displayPrice)}
                </span>
              </p>
            )}
          </div>

          {/* Short desc */}
          {product.moTa && (
            <div className="py-3 border-b border-gray-100">
              <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
                {product.moTa}
              </p>
              <button
                onClick={() => scrollToTab("mo-ta")}
                className="text-[12.5px] text-blue-500 hover:underline mt-1"
              >
                Xem thêm
              </button>
            </div>
          )}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="py-4 border-b border-gray-100">
              <p className="text-[12.5px] font-semibold text-gray-600 mb-2.5">
                Phiên bản / Màu sắc
                {selectedVariant?.color && (
                  <span className="ml-2 text-gray-900">
                    {selectedVariant.color}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const active = selectedVariant?.variant_id === v.variant_id;
                  const outOfStock = v.stock_quantity === 0;
                  return (
                    <button
                      key={v.variant_id}
                      onClick={() => {
                        if (!outOfStock) {
                          setSelectedVariant(v);
                          setQty(1);
                          setActiveImage(0);
                        }
                      }}
                      disabled={outOfStock}
                      className={`relative px-4 py-2.5 rounded-md border-2 text-left transition-all ${
                        active
                          ? "border-red-500 bg-red-50"
                          : outOfStock
                            ? "border-gray-200 opacity-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {outOfStock && (
                        <span className="absolute inset-x-2 top-1/2 h-[1px] bg-gray-300 rotate-[-8deg] pointer-events-none" />
                      )}
                      <span
                        className={`block text-[13px] font-semibold ${active ? "text-red-700" : "text-gray-700"} ${outOfStock ? "line-through" : ""}`}
                      >
                        {v.color || `Phiên bản ${v.variant_id}`}
                      </span>
                      <span
                        className={`block text-[11.5px] mt-0.5 font-medium ${active ? "text-red-500" : "text-gray-500"}`}
                      >
                        {fmt(v.sale_price ?? v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Banner ưu đãi */}
          <Link
            href="/sanpham?giam-gia=1"
            className="block mt-4 rounded-md overflow-hidden"
          >
            <img
              src="/ads/tgdd-laptop.png"
              alt="Ưu đãi tựu trường - giảm thêm đến 3 triệu"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </Link>

          {/* Quà tặng và ưu đãi khác */}
          <div className="py-4 border-b border-gray-100">
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <p className="text-[13.5px] font-bold text-gray-800 bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-red-500" />
                Quà tặng và ưu đãi khác
              </p>
              {PROMOTIONS.map((text, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 px-4 py-2.5 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-[12.5px] text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock + Qty + CTA */}
          <div className="py-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              {inStock && (
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setQty(digits === "" ? 0 : Number(digits));
                    }}
                    onBlur={() => {
                      const max = selectedVariant?.stock_quantity ?? 99;
                      setQty((q) => Math.min(max, Math.max(1, q || 1)));
                    }}
                    className="w-12 h-9 text-center text-[14px] font-bold text-gray-900 border-x border-gray-200 outline-none"
                  />
                  <button
                    onClick={() =>
                      setQty((q) =>
                        Math.min(
                          selectedVariant?.stock_quantity ?? 99,
                          (q || 0) + 1,
                        ),
                      )
                    }
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span
                  className={`text-[13px] font-medium ${inStock ? "text-green-700" : "text-gray-400"}`}
                >
                  {inStock
                    ? `Còn hàng (${selectedVariant?.stock_quantity} sản phẩm)`
                    : "Hết hàng"}
                </span>
              </div>
            </div>

            <div ref={ctaRef} className="flex gap-2.5">
              <button
                disabled={!inStock || adding}
                onClick={handleAddToCart}
                title={addedToCart ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
                className={`flex-1 h-[52px] flex items-center justify-center gap-2 rounded-md border-2 text-[13.5px] font-semibold transition-all ${
                  addedToCart
                    ? "border-green-500 bg-green-50 text-green-600"
                    : inStock && !adding
                      ? "border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-600"
                      : "border-gray-200 text-gray-300 cursor-not-allowed"
                }`}
              >
                {addedToCart ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
                {adding
                  ? "Đang thêm..."
                  : addedToCart
                    ? "Đã thêm!"
                    : "Thêm vào giỏ"}
              </button>
              <button
                disabled={!inStock || adding}
                onClick={handleBuyNow}
                className={`flex-1 h-[52px] rounded-md text-[15px] font-bold transition-all active:scale-[0.99] ${
                  inStock
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                {!inStock ? "Hết hàng" : adding ? "Đang xử lý..." : "Mua ngay"}
              </button>
              {product &&
                (() => {
                  const inCompare = isInComparison(product.id);
                  return (
                    <button
                      onClick={() =>
                        inCompare
                          ? removeItem(product.id)
                          : addItem({
                              id: product.id,
                              ten: product.ten,
                              slug: product.slug,
                              thumbnail: product.thumbnail,
                              gia: product.gia,
                              giaSale: product.giaSale,
                              giamGia: product.giamGia,
                              danhGia: product.danhGia,
                              thuongHieu: product.thuongHieu,
                              categoryName: product.categoryName,
                            })
                      }
                      title={inCompare ? "Đang so sánh" : "So sánh sản phẩm"}
                      className={`w-[52px] h-[52px] flex-shrink-0 border-2 rounded-md flex items-center justify-center transition-all ${
                        inCompare
                          ? "border-red-400 bg-red-50 text-red-500"
                          : "border-gray-200 text-gray-400 hover:border-red-300"
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                    </button>
                  );
                })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mô tả sản phẩm + Video đánh giá (2 cột) ── */}
      <div
        ref={tabRef}
        className="scroll-mt-[64px] mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
      >
        <div className={product.videoId ? "lg:col-span-2" : "lg:col-span-3"}>
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Mô tả sản phẩm
          </h2>
          <div className="bg-white border border-gray-100 rounded-md overflow-hidden">
            <div
              className={`relative px-6 py-5 transition-all ${
                !descExpanded && product.moTa && product.moTa.length > 400
                  ? "max-h-72 overflow-hidden"
                  : ""
              }`}
            >
              {product.moTa ? (
                <div className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.moTa}
                </div>
              ) : (
                <p className="text-[14px] text-gray-400 italic">
                  Chưa có mô tả cho sản phẩm này.
                </p>
              )}
              {!descExpanded && product.moTa && product.moTa.length > 400 && (
                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
            {product.moTa && product.moTa.length > 400 && (
              <div className="px-6 pb-5 pt-1 text-center border-t border-gray-100">
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="inline-flex items-center gap-1 text-[13px] text-red-600 font-semibold hover:underline"
                >
                  {descExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" /> Thu gọn
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" /> Xem thêm nội dung
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Banner quảng cáo lấp khoảng trống khi mô tả ngắn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Link
              href="/sanpham?tu-khoa=oppo"
              className="block rounded-md overflow-hidden border border-gray-100 group/ad1"
            >
              <img
                src="/ads/OppoReno16F-2.jpg"
                alt="OPPO Reno16 F 5G - ưu đãi chính hãng"
                className="w-full h-auto object-cover group-hover/ad1:scale-[1.02] transition-transform duration-300"
                loading="lazy"
              />
            </Link>
            <Link
              href="/sanpham?tu-khoa=redmi"
              className="block rounded-md overflow-hidden border border-gray-100 group/ad2"
            >
              <img
                src="/ads/redmi-17-home.png"
                alt="Redmi 17 Series - mở bán giá tốt"
                className="w-full h-auto object-cover group-hover/ad2:scale-[1.02] transition-transform duration-300"
                loading="lazy"
              />
            </Link>
          </div>
        </div>

        {/* Cột phải: video đánh giá — hộp nhỏ */}
        {product.videoId && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Video đánh giá
            </h2>
            <div className="bg-white border border-gray-100 rounded-md overflow-hidden">
              <div className="aspect-video bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${product.videoId}`}
                  title={`Video đánh giá ${product.ten}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <p className="px-4 py-3 text-[12px] text-gray-400 border-t border-gray-100">
                Nguồn YouTube, thuộc bản quyền của kênh đăng tải.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Thông số kỹ thuật ── */}
      <div ref={specSecRef} className="mb-8 scroll-mt-[64px]">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Thông số kỹ thuật
        </h2>
        <div className="bg-white border border-gray-100 rounded-md overflow-hidden">
          {product.specification && product.specification.length > 0 && (
            <>
              {product.specification.map((spec, i) => (
                <div
                  key={i}
                  className={`flex items-center px-6 py-3 border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                >
                  <span className="w-2/5 text-[13px] text-gray-500 shrink-0">
                    {spec.label}
                  </span>
                  <span className="text-[13px] text-gray-800 font-medium">
                    {spec.value}
                  </span>
                </div>
              ))}
            </>
          )}

          {product.variants?.length > 0 && (
            <>
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                <p className="text-[12.5px] font-bold text-gray-600 uppercase tracking-wide">
                  Các phiên bản
                </p>
              </div>
              {product.variants.map((v, i) => (
                <div
                  key={v.variant_id}
                  className={`flex items-center px-6 py-3 border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                >
                  <span className="w-2/5 text-[13px] text-gray-500 shrink-0">
                    {v.color || `Phiên bản ${i + 1}`}
                  </span>
                  <span className="text-[13px] text-gray-800 font-medium">
                    {fmt(v.sale_price ?? v.price)}
                    {v.sale_price && v.sale_price < v.price && (
                      <span className="ml-2 text-gray-400 line-through text-[12px]">
                        {fmt(v.price)}
                      </span>
                    )}
                    <span className="ml-3 text-gray-400 text-[12px]">
                      Tồn kho: {v.stock_quantity}
                    </span>
                  </span>
                </div>
              ))}
            </>
          )}

          {(!product.specification || product.specification.length === 0) && (
            <div className="px-6 py-4 bg-yellow-50/40 border-t border-yellow-100">
              <p className="text-[12px] text-yellow-700">
                Thông số kỹ thuật chi tiết đang được cập nhật. Vui lòng liên hệ
                hotline để biết thêm thông tin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Đánh giá ── */}
      <div ref={reviewsRef} className="scroll-mt-[64px] mb-10">
        <ReviewsSection productId={product.id} />
      </div>

      {/* ── Câu hỏi thường gặp ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Câu hỏi thường gặp
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const open = openFaq === i;
            return (
              <div
                key={i}
                className={`rounded-md transition-colors ${open ? "bg-gray-100" : "bg-gray-50"}`}
              >
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="text-[14px] font-bold text-gray-800">
                    {faq.q}
                  </span>
                  {open ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {open && (
                  <div className="px-5 pb-4 text-[13.5px] text-gray-500 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hỏi đáp khách hàng */}
      <div className="mt-6 mb-10">
        <ProductQuestions sanPhamId={String(product.id)} />
      </div>

      {/* ── Sản phẩm liên quan ── */}
      {related.length > 0 && (
        <div ref={relatedRef} className="mb-10 scroll-mt-[64px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              Sản phẩm liên quan
            </h2>
            {product.categoryName && (
              <Link
                href={`/sanpham?danh-muc=${product.categoryName.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-[13px] text-red-500 hover:text-red-600 font-medium flex items-center gap-0.5 transition-colors"
              >
                Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/sanpham/${p.slug}`}
                className="group bg-white border border-gray-100 rounded-md overflow-hidden hover:shadow-lg hover:border-red-100 hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
              >
                {/* Badge giảm giá */}
                <div className="px-2.5 pt-2.5 min-h-[26px]">
                  {p.giamGia > 0 && (
                    <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                      Giảm {p.giamGia}%
                    </span>
                  )}
                </div>

                {/* Ảnh */}
                <div className="flex items-center justify-center h-36 px-4 py-1.5 overflow-hidden">
                  <img
                    src={
                      p.thumbnail ||
                      "https://placehold.co/300x300?text=No+Image"
                    }
                    alt={p.ten}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Thông tin */}
                <div className="px-2.5 pb-3 flex flex-col gap-1.5 flex-1">
                  <h3 className="font-semibold text-gray-800 text-[12.5px] leading-snug line-clamp-2 min-h-[36px]">
                    {p.ten}
                  </h3>
                  <div className="flex items-baseline gap-1.5 mt-auto">
                    <p className="text-[14px] font-bold text-red-600">
                      {fmt(p.giaSale ?? p.gia)}
                    </p>
                    {p.giamGia > 0 && (
                      <p className="text-[10.5px] text-gray-400 line-through">
                        {fmt(p.gia)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                    {p.danhGia > 0 ? (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[11px] font-semibold text-gray-600">
                          {p.danhGia.toFixed(1)}
                        </span>
                      </span>
                    ) : (
                      <span />
                    )}
                    {p.luotBan > 0 && (
                      <span className="text-[10.5px] text-gray-400">
                        Đã bán {p.luotBan.toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <Link
        href="/sanpham"
        className="inline-flex items-center gap-2 text-[13px] text-gray-400 hover:text-red-600 transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" /> Tiếp tục mua sắm
      </Link>

      {/* ── Banner quảng cáo ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Link
          href="/sanpham?tu-khoa=iphone"
          className="block rounded-md overflow-hidden border border-gray-100 group"
        >
          <img
            src="/ads/690x300_iPhone17Pro_1.png"
            alt="iPhone 17 Pro - Siu hời để lên đời"
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        </Link>
        <Link
          href="/sanpham?tu-khoa=galaxy"
          className="block rounded-md overflow-hidden border border-gray-100 group"
        >
          <img
            src="/ads/Z8-OPEN.png"
            alt="Samsung Galaxy Z Fold8 Ultra - Ưu đãi lên đời"
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        </Link>
      </div>

      {/* ── Sticky buy bar (hiện khi cuộn qua khối thông tin chính) ── */}
      {showStickyBar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white rounded-md border border-gray-200 shadow-lg p-3 flex items-center gap-4 w-[min(560px,calc(100vw-2rem))]">
          <img
            src={product.thumbnail || "https://placehold.co/64x64?text=?"}
            alt={product.ten}
            className="w-11 h-11 rounded-md object-cover bg-gray-50 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 truncate">
              {product.ten}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-red-600">
                {fmt(displayPrice)}
              </p>
              {hasDiscount && (
                <p className="text-[12px] text-gray-400 line-through">
                  {fmt(originalPrice)}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              disabled={!inStock || adding}
              onClick={handleBuyNow}
              className={`flex items-center justify-center px-4 py-2.5 rounded-md text-[13px] font-bold transition-all whitespace-nowrap ${
                inStock && !adding
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {adding ? "Đang xử lý..." : "Mua ngay"}
            </button>
            <button
              disabled={!inStock || adding}
              onClick={handleAddToCart}
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13px] font-semibold border-2 transition-all whitespace-nowrap ${
                addedToCart
                  ? "border-green-500 bg-green-50 text-green-700"
                  : inStock && !adding
                    ? "border-red-500 text-red-600 hover:bg-red-50"
                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {adding
                ? "Đang thêm..."
                : addedToCart
                  ? "Đã thêm!"
                  : "Thêm vào giỏ"}
            </button>
          </div>
        </div>
      )}

      {/* ── Thông báo thêm giỏ hàng — góc trên phải, thay cho animation bay vào giỏ
           khi ảnh sản phẩm đã cuộn khuất màn hình (không thấy animation chạy) ── */}
      {showCartToast && product && (
        <div
          className="fixed top-20 right-5 z-50 flex items-center gap-3 bg-white rounded-md border border-gray-200 shadow-lg px-4 py-3 max-w-[320px]"
          style={{ animation: "fadeInScale 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-800">Đã thêm vào giỏ hàng!</p>
            <p className="text-[12px] text-gray-500 truncate">{product.ten}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Đánh giá sản phẩm (chỉ khách đã mua mới được gửi) ─────────────────── */
function ReviewsSection({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checked, setChecked] = useState(false);

  const [myRating, setMyRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [myContent, setMyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("smarthub_token")
      : null;

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reviews/product/${productId}`);
      const json = await res.json();
      if (json.success) setReviews(json.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
    const t = localStorage.getItem("smarthub_token");
    if (!t) {
      setChecked(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/reviews/can-review/${productId}`,
          {
            headers: { Authorization: `Bearer ${t}` },
          },
        );
        const json = await res.json();
        if (json.success) {
          setCanReview(json.canReview);
          setHasReviewed(json.hasReviewed);
          if (json.myReview) {
            setMyRating(json.myReview.rating);
            setMyContent(json.myReview.content || "");
          }
        }
      } catch {
      } finally {
        setChecked(true);
      }
    })();
  }, [productId, fetchReviews]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!requireLogin("Đăng nhập để đánh giá sản phẩm")) return;
    setSubmitting(true);
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("smarthub_token")}`,
        },
        body: JSON.stringify({
          productId,
          rating: myRating,
          content: myContent.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setHasReviewed(true);
        fetchReviews();
      } else {
        toastError(json.message || "Không gửi được đánh giá");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const count = reviews.length;
  const avg = count
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;
  const dist = [5, 4, 3, 2, 1].map((stars) => {
    const n = reviews.filter((r) => r.rating === stars).length;
    return { stars, pct: count ? Math.round((n / count) * 100) : 0 };
  });

  const fmtD = (s: string) => {
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  return (
    <>
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        Đánh giá ({count})
      </h2>
      <div className="border border-gray-100 rounded-md overflow-hidden bg-white">
        {/* Summary */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-10">
            <div className="text-center shrink-0">
              <div className="text-[56px] font-bold text-gray-900 leading-none">
                {avg > 0 ? avg.toFixed(1) : "0"}
              </div>
              <Stars rating={avg} size="md" />
              <p className="text-[12px] text-gray-400 mt-1.5">
                {count} đánh giá
              </p>
            </div>
            <div className="flex-1 space-y-2">
              {dist.map(({ stars, pct }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-[12px] text-gray-500 w-4 text-right shrink-0">
                    {stars}
                  </span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-gray-400 w-8 shrink-0">
                    {pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form / thông báo điều kiện */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          {!token ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[13px] text-gray-500">
                Đăng nhập và mua hàng để đánh giá sản phẩm này.
              </p>
              <button
                onClick={() => requireLogin("Đăng nhập để đánh giá sản phẩm")}
                className="text-[13px] font-semibold text-red-500 hover:text-red-600 transition"
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : !checked ? (
            <p className="text-[13px] text-gray-400">
              Đang kiểm tra điều kiện đánh giá...
            </p>
          ) : !canReview ? (
            <p className="text-[13px] text-gray-500 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-gray-400 shrink-0" />
              Chỉ khách hàng đã mua và nhận sản phẩm này mới có thể đánh giá.
            </p>
          ) : (
            <div>
              <p className="text-[13.5px] font-semibold text-gray-800 mb-2.5">
                {hasReviewed ? "Cập nhật đánh giá của bạn" : "Đánh giá của bạn"}
              </p>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMyRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        n <= (hoverRating || myRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-100 text-gray-200"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-[13px] text-gray-500">
                  {
                    ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"][
                      hoverRating || myRating
                    ]
                  }
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={1000}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm (không bắt buộc)..."
                value={myContent}
                onChange={(e) => setMyContent(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3.5 py-2.5 text-[13.5px] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-gray-400"
              />
              <div className="flex items-center justify-between mt-2.5 gap-3 flex-wrap">
                {successMsg ? (
                  <p className="text-[12.5px] text-green-600 font-medium">
                    {successMsg}
                  </p>
                ) : (
                  <span />
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-[13px] font-semibold transition disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {hasReviewed ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Danh sách đánh giá */}
        {loading ? (
          <div className="p-10 text-center text-[13px] text-gray-400">
            Đang tải đánh giá...
          </div>
        ) : count > 0 ? (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review._id} className="px-6 py-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[13px] font-bold text-gray-500 shrink-0">
                    {(review.userName || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-gray-800">
                      {review.userName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Stars rating={review.rating} />
                      <span className="text-[11.5px] text-gray-400">
                        {fmtD(review.createdAt)}
                      </span>
                      <span className="text-[10.5px] font-medium bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded">
                        Đã mua hàng
                      </span>
                    </div>
                  </div>
                </div>
                {review.content && (
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line pl-12">
                    {review.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-[14px] text-gray-400">
              Chưa có đánh giá nào cho sản phẩm này.
            </p>
            <p className="text-[13px] text-gray-400 mt-1">
              Hãy là người đầu tiên đánh giá sau khi mua hàng!
            </p>
          </div>
        )}
      </div>
    </>
  );
}
