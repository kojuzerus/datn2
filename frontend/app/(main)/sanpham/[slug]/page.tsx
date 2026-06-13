"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star, ShieldCheck, Truck, RefreshCw, Headphones,
  ChevronRight, Home, ChevronLeft, ChevronDown, ChevronUp,
  ShoppingCart, Heart, Share2, Package, CheckCircle2,
  CreditCard, Gift, ThumbsUp, MessageSquare,
} from "lucide-react";
import { useCart } from "../../../hooks/useCart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Variant {
  variant_id: number;
  color: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  sku: string;
}

interface Product {
  id: number; ten: string; slug: string; thuongHieu: string;
  thumbnail: string; images: string[];
  moTa: string; gia: number; giaSale: number | null;
  giamGia: number; danhGia: number; luotDanhGia: number;
  luotBan: number; badge: string; categoryName: string;
  warranty: string; variants: Variant[];
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const PROMOTIONS = [
  "Hộp đầy đủ phụ kiện chính hãng từ nhà sản xuất",
  "Tặng kèm túi đựng sản phẩm SmartHub cao cấp",
  "Hỗ trợ đổi trả miễn phí trong 30 ngày nếu có lỗi kỹ thuật",
  "Miễn phí vận chuyển toàn quốc cho đơn từ 500.000đ",
  "Thu cũ đổi mới, định giá nhanh trong 5 phút",
];

const INSTALLMENTS = [
  { name: "VPBank",      rate: "0% lãi suất", note: "12 tháng" },
  { name: "Shinhan",     rate: "0% lãi suất", note: "6 tháng"  },
  { name: "HDBANK",      rate: "0% lãi suất", note: "12 tháng" },
  { name: "Home Credit", rate: "Trả góp",      note: "linh hoạt" },
];

const GUARANTEES = [
  { Icon: ShieldCheck, title: "Chính hãng 100%", sub: "Bảo hành đầy đủ"      },
  { Icon: Truck,       title: "Giao hàng 2h",    sub: "Nội thành HN, HCM"    },
  { Icon: RefreshCw,   title: "Đổi trả 30 ngày", sub: "Miễn phí, không cần lý do" },
  { Icon: Headphones,  title: "Hỗ trợ 24/7",     sub: "1800 xxxx (miễn phí)" },
];

const RATING_DIST = [
  { stars: 5, pct: 68 },
  { stars: 4, pct: 20 },
  { stars: 3, pct: 8  },
  { stars: 2, pct: 2  },
  { stars: 1, pct: 2  },
];

const MOCK_REVIEWS = [
  {
    id: 1, name: "Nguyễn Văn A", stars: 5, date: "15/05/2025",
    title: "Sản phẩm rất tốt, đúng mô tả",
    body: "Mình đã dùng được 2 tuần, sản phẩm hoạt động ổn định. Đóng gói cẩn thận, giao hàng nhanh. Nhân viên tư vấn nhiệt tình chu đáo.",
    helpful: 12,
  },
  {
    id: 2, name: "Trần Thị B", stars: 4, date: "08/05/2025",
    title: "Hài lòng với chất lượng",
    body: "Chất lượng sản phẩm đúng với mô tả. Giá cả hợp lý so với thị trường. Sẽ tiếp tục ủng hộ SmartHub.",
    helpful: 7,
  },
];

type TabKey = "mo-ta" | "thong-so" | "danh-gia";

/* ── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6">
        <div>
          <div className="bg-gray-200 rounded-2xl aspect-square" />
          <div className="flex gap-2 mt-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded w-4/5" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded w-1/2 mt-2" />
          <div className="h-32 bg-gray-200 rounded-xl mt-4" />
          <div className="h-12 bg-gray-200 rounded-xl" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── Stars ──────────────────────────────────────────────────────────────── */
function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
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
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [product, setProduct]               = useState<Product | null>(null);
  const [loading, setLoading]               = useState(true);
  const [notFound, setNotFound]             = useState(false);
  const [activeImage, setActiveImage]       = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [qty, setQty]                       = useState(1);
  const [addedToCart, setAddedToCart]       = useState(false);
  const [wishlist, setWishlist]             = useState(false);
  const [activeTab, setActiveTab]           = useState<TabKey>("mo-ta");
  const [descExpanded, setDescExpanded]     = useState(false);

  const tabRef = useRef<HTMLDivElement>(null);
  const { addToCart, adding } = useCart();

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

  const displayPrice  = selectedVariant?.sale_price ?? selectedVariant?.price ?? product?.giaSale ?? product?.gia ?? 0;
  const originalPrice = selectedVariant?.price ?? product?.gia ?? 0;
  const hasDiscount   = selectedVariant
    ? selectedVariant.sale_price != null && selectedVariant.sale_price < selectedVariant.price
    : (product?.giamGia ?? 0) > 0;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;
  const inStock   = (selectedVariant?.stock_quantity ?? 0) > 0;
  const allImages = product
    ? [product.thumbnail, ...(product.images || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
    : [];

  const handleAddToCart = async () => {
    if (!product || !inStock) return;
    const success = await addToCart({
      productId: String(product.id),
      tenSanPham: product.ten,
      hinhAnh: product.thumbnail,
      gia: displayPrice,
      soLuong: qty,
      variant: selectedVariant?.color || "",
    });
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const scrollToTab = (tab: TabKey) => {
    setActiveTab(tab);
    setTimeout(() => tabRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Package className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-[20px] font-bold text-gray-800">Không tìm thấy sản phẩm</h1>
        <p className="text-[13.5px] text-gray-500">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/sanpham"
          className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-[13.5px] font-semibold hover:bg-red-700 transition-colors"
        >
          Quay về danh sách
        </Link>
      </div>
    );
  }

  const specsRows = [
    { label: "Thương hiệu",    value: product.thuongHieu  || "Đang cập nhật" },
    { label: "Danh mục",       value: product.categoryName || "Đang cập nhật" },
    { label: "Bảo hành",       value: product.warranty    || "Đang cập nhật" },
    { label: "Tình trạng",     value: inStock ? "Còn hàng" : "Hết hàng"      },
    { label: "Số phiên bản",   value: `${product.variants?.length ?? 0} phiên bản` },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-4">

      {/* Breadcrumb */}
      <nav className="flex items-center flex-wrap gap-1 text-[12.5px] text-gray-400 mb-4">
        <Link href="/" className="flex items-center gap-1 hover:text-red-500 transition-colors">
          <Home className="w-3 h-3" /> Trang chủ
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <Link href="/sanpham" className="hover:text-red-500 transition-colors">Sản phẩm</Link>
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
        <span className="text-gray-600 line-clamp-1 max-w-[240px]">{product.ten}</span>
      </nav>

      {/* ── 2-col main ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 mb-10">

        {/* Gallery */}
        <div className="lg:sticky lg:top-4 lg:self-start">

          {/* Main image */}
          <div className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden aspect-square flex items-center justify-center group">
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
              src={allImages[activeImage] || "https://placehold.co/600x600?text=No+Image"}
              alt={product.ten}
              className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.04]"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((i) => (i - 1 + allImages.length) % allImages.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setActiveImage((i) => (i + 1) % allImages.length)}
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
            <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-[68px] h-[68px] flex-shrink-0 rounded-xl border-2 overflow-hidden bg-white transition-all ${
                    i === activeImage ? "border-red-500 shadow-sm" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}

          {/* Share strip */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <span className="text-[12px] text-gray-400">Chia sẻ:</span>
            <button className="bg-[#1877F2] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">Facebook</button>
            <button className="bg-[#0068FF] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">Zalo</button>
            <button className="bg-gray-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity flex items-center gap-1">
              <Share2 className="w-3 h-3" /> Sao chép
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div>

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

            <h1 className="text-[20px] font-bold text-gray-900 leading-snug">{product.ten}</h1>

            {/* Rating + sold */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
              {product.danhGia > 0 ? (
                <button
                  onClick={() => scrollToTab("danh-gia")}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <Stars rating={product.danhGia} />
                  <span className="text-[13px] font-semibold text-amber-600">{product.danhGia.toFixed(1)}</span>
                </button>
              ) : (
                <button onClick={() => scrollToTab("danh-gia")} className="text-[12.5px] text-blue-500 hover:underline">
                  Chưa có đánh giá
                </button>
              )}
              {product.luotDanhGia > 0 && (
                <button onClick={() => scrollToTab("danh-gia")} className="text-[12.5px] text-blue-500 hover:underline">
                  {product.luotDanhGia} đánh giá
                </button>
              )}
              {product.luotBan > 0 && (
                <>
                  <span className="text-gray-300 text-[12px]">|</span>
                  <span className="text-[12.5px] text-gray-500">
                    Đã bán <span className="font-semibold text-gray-700">{product.luotBan.toLocaleString("vi-VN")}</span>
                  </span>
                </>
              )}
              {product.warranty && (
                <>
                  <span className="text-gray-300 text-[12px]">|</span>
                  <span className="text-[12.5px] text-green-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> BH {product.warranty}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-end flex-wrap gap-3">
              <span className="text-[34px] font-bold text-red-600 leading-none">{fmt(displayPrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-[17px] text-gray-400 line-through leading-none mb-0.5">{fmt(originalPrice)}</span>
                  <span className="text-[11.5px] font-bold text-white bg-red-500 px-2 py-0.5 rounded mb-1">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="text-[12px] text-gray-400 mt-1">
                Tiết kiệm: <span className="font-semibold text-red-600">{fmt(originalPrice - displayPrice)}</span>
              </p>
            )}
          </div>

          {/* Short desc */}
          {product.moTa && (
            <div className="py-3 border-b border-gray-100">
              <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">{product.moTa}</p>
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
                  <span className="ml-2 text-gray-900">{selectedVariant.color}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const active     = selectedVariant?.variant_id === v.variant_id;
                  const outOfStock = v.stock_quantity === 0;
                  return (
                    <button
                      key={v.variant_id}
                      onClick={() => { if (!outOfStock) { setSelectedVariant(v); setQty(1); } }}
                      disabled={outOfStock}
                      className={`relative px-4 py-2.5 rounded-xl border-2 text-left transition-all ${
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
                      <span className={`block text-[13px] font-semibold ${active ? "text-red-700" : "text-gray-700"} ${outOfStock ? "line-through" : ""}`}>
                        {v.color || `Phiên bản ${v.variant_id}`}
                      </span>
                      <span className={`block text-[11.5px] mt-0.5 font-medium ${active ? "text-red-500" : "text-gray-500"}`}>
                        {fmt(v.sale_price ?? v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Khuyến mãi */}
          <div className="py-4 border-b border-gray-100">
            <p className="text-[13px] font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-green-600" />
              Khuyến mãi đặc biệt
            </p>
            <div className="border border-green-200 rounded-xl overflow-hidden bg-green-50/30">
              {PROMOTIONS.map((text, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 px-4 py-2.5 ${i > 0 ? "border-t border-green-100" : ""}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-[12.5px] text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trả góp */}
          <div className="py-4 border-b border-gray-100">
            <p className="text-[13px] font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Trả góp 0%
            </p>
            <div className="flex flex-wrap gap-2">
              {INSTALLMENTS.map((inst) => (
                <button
                  key={inst.name}
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
                >
                  <span className="block text-[12.5px] font-bold text-gray-800 group-hover:text-blue-700">{inst.name}</span>
                  <span className="block text-[11px] text-blue-600 font-medium">{inst.rate} - {inst.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock + Qty + CTA */}
          <div className="py-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-gray-300"}`} />
                <span className={`text-[13px] font-medium ${inStock ? "text-green-700" : "text-gray-400"}`}>
                  {inStock ? `Còn hàng (${selectedVariant?.stock_quantity} sản phẩm)` : "Hết hàng"}
                </span>
              </div>
              {inStock && (
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg"
                  >-</button>
                  <span className="w-10 h-9 flex items-center justify-center text-[14px] font-bold text-gray-900 border-x border-gray-200">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(selectedVariant?.stock_quantity ?? 99, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg"
                  >+</button>
                </div>
              )}
            </div>

            <button
              disabled={!inStock}
              className={`w-full py-3.5 rounded-xl text-[15px] font-bold transition-all active:scale-[0.99] ${
                inStock
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              {inStock ? "Mua ngay" : "Hết hàng"}
            </button>

            <div className="flex gap-2.5">
              <button
                disabled={!inStock || adding}
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13.5px] font-semibold border-2 transition-all ${
                  addedToCart
                    ? "border-green-500 bg-green-50 text-green-700"
                    : inStock && !adding
                    ? "border-red-500 text-red-600 hover:bg-red-50"
                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {adding ? "Đang thêm..." : addedToCart ? "Đã thêm vào giỏ!" : "Thêm vào giỏ hàng"}
              </button>
              <button
                onClick={() => setWishlist((w) => !w)}
                title="Yêu thích"
                className={`w-11 h-11 flex-shrink-0 border-2 rounded-xl flex items-center justify-center transition-all ${
                  wishlist ? "border-red-400 bg-red-50 text-red-500" : "border-gray-200 text-gray-400 hover:border-red-300"
                }`}
              >
                <Heart className={`w-4.5 h-4.5 ${wishlist ? "fill-red-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="pt-4">
            <div className="grid grid-cols-2 gap-2.5">
              {GUARANTEES.map(({ Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                  <Icon className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-[12.5px] font-semibold text-gray-800">{title}</p>
                    <p className="text-[11px] text-gray-400 leading-tight">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div ref={tabRef} className="scroll-mt-4 mb-10">

        {/* Tab nav */}
        <div className="flex border-b border-gray-200 overflow-x-auto mb-0">
          {(
            [
              { key: "mo-ta",    label: "Mô tả sản phẩm"                          },
              { key: "thong-so", label: "Thông số kỹ thuật"                       },
              { key: "danh-gia", label: `Đánh giá (${product.luotDanhGia || 0})` },
            ] as { key: TabKey; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-[13.5px] font-semibold border-b-2 whitespace-nowrap transition-colors -mb-[2px] ${
                activeTab === key
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Mô tả */}
        {activeTab === "mo-ta" && (
          <div className="bg-white border border-gray-100 border-t-0 rounded-b-2xl overflow-hidden">
            <div
              className={`relative px-6 py-5 transition-all ${
                !descExpanded && product.moTa && product.moTa.length > 400 ? "max-h-72 overflow-hidden" : ""
              }`}
            >
              {product.moTa ? (
                <div className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">{product.moTa}</div>
              ) : (
                <p className="text-[14px] text-gray-400 italic">Chưa có mô tả cho sản phẩm này.</p>
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
                    <><ChevronUp className="w-3.5 h-3.5" /> Thu gọn</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5" /> Xem thêm nội dung</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Thông số */}
        {activeTab === "thong-so" && (
          <div className="bg-white border border-gray-100 border-t-0 rounded-b-2xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
              <p className="text-[12.5px] font-bold text-gray-600 uppercase tracking-wide">Thông tin chung</p>
            </div>
            {specsRows.map((row, i) => (
              <div
                key={i}
                className={`flex items-center px-6 py-3 border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
              >
                <span className="w-2/5 text-[13px] text-gray-500 shrink-0">{row.label}</span>
                <span className="text-[13px] text-gray-800 font-medium">{row.value}</span>
              </div>
            ))}
            {product.variants?.length > 0 && (
              <>
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                  <p className="text-[12.5px] font-bold text-gray-600 uppercase tracking-wide">Các phiên bản</p>
                </div>
                {product.variants.map((v, i) => (
                  <div
                    key={v.variant_id}
                    className={`flex items-center px-6 py-3 border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                  >
                    <span className="w-2/5 text-[13px] text-gray-500 shrink-0">{v.color || `Phiên bản ${i + 1}`}</span>
                    <span className="text-[13px] text-gray-800 font-medium">
                      {fmt(v.sale_price ?? v.price)}
                      {v.sale_price && v.sale_price < v.price && (
                        <span className="ml-2 text-gray-400 line-through text-[12px]">{fmt(v.price)}</span>
                      )}
                      <span className="ml-3 text-gray-400 text-[12px]">Tồn kho: {v.stock_quantity}</span>
                    </span>
                  </div>
                ))}
              </>
            )}
            <div className="px-6 py-4 bg-yellow-50/40 border-t border-yellow-100">
              <p className="text-[12px] text-yellow-700">Thông số kỹ thuật chi tiết đang được cập nhật. Vui lòng liên hệ hotline để biết thêm thông tin.</p>
            </div>
          </div>
        )}

        {/* Tab: Đánh giá */}
        {activeTab === "danh-gia" && (
          <div className="border border-gray-100 border-t-0 rounded-b-2xl overflow-hidden bg-white">

            {/* Summary */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-10">
                <div className="text-center shrink-0">
                  <div className="text-[56px] font-bold text-gray-900 leading-none">
                    {product.danhGia > 0 ? product.danhGia.toFixed(1) : "0"}
                  </div>
                  <Stars rating={product.danhGia} size="md" />
                  <p className="text-[12px] text-gray-400 mt-1.5">{product.luotDanhGia || 0} đánh giá</p>
                </div>
                <div className="flex-1 space-y-2">
                  {RATING_DIST.map(({ stars, pct }) => (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-[12px] text-gray-500 w-4 text-right shrink-0">{stars}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[12px] text-gray-400 w-8 shrink-0">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews list */}
            {product.luotDanhGia > 0 ? (
              <div className="divide-y divide-gray-100">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="px-6 py-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-[13.5px] font-bold text-gray-800">{review.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Stars rating={review.stars} />
                          <span className="text-[11.5px] text-gray-400">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[13.5px] font-semibold text-gray-700 mb-1">{review.title}</p>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{review.body}</p>
                    <button className="mt-3 flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" /> Hữu ích ({review.helpful})
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-[14px] text-gray-400">Chưa có đánh giá nào cho sản phẩm này.</p>
                <p className="text-[13px] text-gray-400 mt-1">Hãy là người đầu tiên đánh giá!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back */}
      <Link
        href="/sanpham"
        className="inline-flex items-center gap-2 text-[13px] text-gray-400 hover:text-red-600 transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" /> Tiếp tục mua sắm
      </Link>
    </div>
  );
}
