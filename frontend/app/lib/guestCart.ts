// Giỏ hàng cho khách chưa đăng nhập, lưu trong localStorage.
// Khi đăng nhập thành công, gọi mergeGuestCartToServer() để gộp vào giỏ trên server.

const STORAGE_KEY = 'smarthub_guest_cart';

export interface GuestCartItem {
  _id: string; // id cục bộ: productId + variant
  productId: string;
  tenSanPham: string;
  hinhAnh: string;
  gia: number;
  soLuong: number;
  variant: string;
}

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToGuestCart(item: Omit<GuestCartItem, '_id'>): GuestCartItem[] {
  const items = getGuestCart();
  const id = `${item.productId}__${item.variant}`;
  const existing = items.find(i => i._id === id);
  if (existing) {
    existing.soLuong += item.soLuong;
  } else {
    items.push({ ...item, _id: id });
  }
  saveGuestCart(items);
  return items;
}

export function updateGuestCartItem(id: string, soLuong: number): GuestCartItem[] {
  const items = getGuestCart();
  const item = items.find(i => i._id === id);
  if (item && soLuong >= 1) {
    item.soLuong = soLuong;
    saveGuestCart(items);
  }
  return items;
}

export function removeGuestCartItem(id: string): GuestCartItem[] {
  const items = getGuestCart().filter(i => i._id !== id);
  saveGuestCart(items);
  return items;
}

export function clearGuestCart() {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}

export function guestCartCount(): number {
  return getGuestCart().reduce((s, i) => s + i.soLuong, 0);
}

// Gộp giỏ hàng khách vào giỏ trên server sau khi đăng nhập
export async function mergeGuestCartToServer(apiUrl: string, token: string) {
  const items = getGuestCart();
  if (items.length === 0) return;
  for (const item of items) {
    try {
      await fetch(`${apiUrl}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.productId,
          tenSanPham: item.tenSanPham,
          hinhAnh: item.hinhAnh,
          gia: item.gia,
          soLuong: item.soLuong,
          variant: item.variant,
        }),
      });
    } catch {}
  }
  clearGuestCart();
  window.dispatchEvent(new Event('cart-updated'));
}
