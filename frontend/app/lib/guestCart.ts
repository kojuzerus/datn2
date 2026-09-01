const KEY = "smarthub_guest_cart";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface GuestCartItem {
  _id: string;
  productId: string;
  tenSanPham: string;
  slug?: string;
  hinhAnh: string;
  gia: number;
  soLuong: number;
  variant: string;
}

function read(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: GuestCartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function getGuestCart(): GuestCartItem[] {
  return read();
}

export function guestCartCount(): number {
  return read().reduce((s, i) => s + i.soLuong, 0);
}

export function addGuestCartItem(item: {
  productId: string;
  tenSanPham: string;
  slug?: string;
  hinhAnh?: string;
  gia: number;
  soLuong?: number;
  variant?: string;
  maxStock?: number;
}) {
  const items = read();
  const variant = item.variant || "";
  const id = `${item.productId}__${variant}`;
  const idx = items.findIndex((i) => i._id === id);
  const currentQty = idx > -1 ? items[idx].soLuong : 0;
  const wantQty = item.soLuong || 1;
  const addQty =
    item.maxStock != null
      ? Math.max(0, Math.min(wantQty, item.maxStock - currentQty))
      : wantQty;

  if (addQty <= 0) return false;

  if (idx > -1) {
    items[idx].soLuong += addQty;
  } else {
    items.push({
      _id: id,
      productId: item.productId,
      tenSanPham: item.tenSanPham,
      slug: item.slug || "",
      hinhAnh: item.hinhAnh || "",
      gia: item.gia,
      soLuong: addQty,
      variant,
    });
  }
  write(items);
  return true;
}

export function updateGuestCartItem(id: string, soLuong: number) {
  if (soLuong < 1) return;
  write(read().map((i) => (i._id === id ? { ...i, soLuong } : i)));
}

export function removeGuestCartItem(id: string) {
  write(read().filter((i) => i._id !== id));
}

export function clearGuestCart() {
  write([]);
}

// Gộp giỏ hàng khách vào giỏ hàng server ngay sau khi đăng nhập thành công.
export async function mergeGuestCartToServer(token: string) {
  const items = read();
  if (items.length === 0) return;
  try {
    for (const item of items) {
      await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.productId,
          tenSanPham: item.tenSanPham,
          slug: item.slug || "",
          hinhAnh: item.hinhAnh,
          gia: item.gia,
          soLuong: item.soLuong,
          variant: item.variant,
        }),
      });
    }
    clearGuestCart();
    window.dispatchEvent(new Event("cart-updated"));
  } catch {}
}
