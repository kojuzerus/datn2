'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, CreditCard, FileText, Package,
  Truck, ShieldCheck, BadgeCheck, Banknote, Building2,
  Plus, Loader2, CheckCircle2, Lock,
} from 'lucide-react';
import SearchableSelect, { SelectOption } from '../components/SearchableSelect';

const API_URL      = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const GEO_BASE_URL = 'https://provinces.open-api.vn/api';

interface CartItem {
  _id: string;
  productId: string;
  tenSanPham: string;
  hinhAnh: string;
  gia: number;
  soLuong: number;
  variant: string;
}

interface Address {
  _id: string;
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  isDefault: boolean;
}

interface AddrForm {
  receiverName: string;
  phone: string;
  provinceCode: number | null;
  provinceName: string;
  districtCode: number | null;
  districtName: string;
  wardCode: number | null;
  wardName: string;
  detailAddress: string;
}

const EMPTY_FORM: AddrForm = {
  receiverName: '', phone: '',
  provinceCode: null, provinceName: '',
  districtCode: null, districtName: '',
  wardCode: null, wardName: '',
  detailAddress: '',
};

function formatPrice(n: number) {
  return n.toLocaleString('vi-VN') + '₫';
}

const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    desc: 'Trả tiền mặt khi nhận hàng',
    Icon: Banknote,
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    id: 'banking',
    label: 'Chuyển khoản ngân hàng',
    desc: 'Chuyển khoản qua internet banking',
    Icon: Building2,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
];

export default function ThanhToanPage() {
  const router = useRouter();
  const [allItems, setAllItems]         = useState<CartItem[]>([]);
  const [items, setItems]               = useState<CartItem[]>([]);   // chỉ item được chọn
  const [addresses, setAddresses]       = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'banking'>('cod');
  const [ghiChu, setGhiChu]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [placing, setPlacing]           = useState(false);
  const [showNewAddr, setShowNewAddr]   = useState(false);

  const [newAddr, setNewAddr]       = useState<AddrForm>(EMPTY_FORM);
  const [savingAddr, setSavingAddr] = useState(false);

  const [provinces, setProvinces]   = useState<SelectOption[]>([]);
  const [districts, setDistricts]   = useState<SelectOption[]>([]);
  const [wards, setWards]           = useState<SelectOption[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards]         = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('smarthub_token') : null;

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.all([fetchCart(), fetchAddresses()]).finally(() => setLoading(false));
    fetchProvinces();
  }, []);

  const fetchCart = async () => {
    const res  = await fetch(`${API_URL}/api/cart`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      const cartItems: CartItem[] = data.cart.items;
      setAllItems(cartItems);

      // Lọc theo item IDs được chọn từ trang giỏ hàng
      const raw = localStorage.getItem('smarthub_checkout_ids');
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        const filtered = cartItems.filter(i => ids.includes(i._id));
        setItems(filtered.length > 0 ? filtered : cartItems);
      } else {
        setItems(cartItems);
      }
    }
  };

  const fetchAddresses = async () => {
    const res  = await fetch(`${API_URL}/api/addresses`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      setAddresses(data.data);
      const def = data.data.find((a: Address) => a.isDefault);
      if (def) setSelectedAddr(def._id);
      else if (data.data.length > 0) setSelectedAddr(data.data[0]._id);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res  = await fetch(`${GEO_BASE_URL}/p/`);
      const data = await res.json();
      setProvinces(data.map((p: { code: number; name: string }) => ({ code: p.code, name: p.name })));
    } catch {}
  };

  const handleProvinceChange = async (code: number, name: string) => {
    setNewAddr(p => ({ ...p, provinceCode: code, provinceName: name, districtCode: null, districtName: '', wardCode: null, wardName: '' }));
    setDistricts([]);
    setWards([]);
    setLoadingDistricts(true);
    try {
      const res  = await fetch(`${GEO_BASE_URL}/p/${code}?depth=2`);
      const data = await res.json();
      setDistricts((data.districts || []).map((d: { code: number; name: string }) => ({ code: d.code, name: d.name })));
    } catch {}
    setLoadingDistricts(false);
  };

  const handleDistrictChange = async (code: number, name: string) => {
    setNewAddr(p => ({ ...p, districtCode: code, districtName: name, wardCode: null, wardName: '' }));
    setWards([]);
    setLoadingWards(true);
    try {
      const res  = await fetch(`${GEO_BASE_URL}/d/${code}?depth=2`);
      const data = await res.json();
      setWards((data.wards || []).map((w: { code: number; name: string }) => ({ code: w.code, name: w.name })));
    } catch {}
    setLoadingWards(false);
  };

  const handleSaveNewAddr = async () => {
    const { receiverName, phone, provinceName, districtName, wardName, detailAddress } = newAddr;
    if (!receiverName || !phone || !provinceName || !districtName || !wardName || !detailAddress)
      return alert('Vui lòng điền đầy đủ thông tin địa chỉ');

    setSavingAddr(true);
    const res  = await fetch(`${API_URL}/api/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        receiverName, phone,
        province: provinceName, district: districtName, ward: wardName,
        detailAddress,
        isDefault: addresses.length === 0,
      }),
    });
    const data = await res.json();
    setSavingAddr(false);
    if (data.success) {
      await fetchAddresses();
      setSelectedAddr(data.data._id);
      setShowNewAddr(false);
      setNewAddr(EMPTY_FORM);
      setDistricts([]);
      setWards([]);
    } else {
      alert(data.message || 'Lỗi khi lưu địa chỉ');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddr) return alert('Vui lòng chọn địa chỉ giao hàng');
    if (items.length === 0) return alert('Không có sản phẩm nào');

    const addr = addresses.find(a => a._id === selectedAddr);
    if (!addr) return;

    setPlacing(true);
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        receiverName:  addr.receiverName,
        phone:         addr.phone,
        province:      addr.province,
        district:      addr.district,
        ward:          addr.ward,
        detailAddress: addr.detailAddress,
        paymentMethod,
        ghiChu,
        itemIds: items.map(i => i._id),
      }),
    });
    const data = await res.json();
    setPlacing(false);

    if (data.success) {
      localStorage.removeItem('smarthub_checkout_ids');
      router.push(`/dat-hang-thanh-cong?orderId=${data.order._id}`);
    } else {
      alert(data.message || 'Đặt hàng thất bại');
    }
  };

  const tongTien      = items.reduce((s, i) => s + i.gia * i.soLuong, 0);
  const phiGH         = tongTien >= 500000 ? 0 : 30000;
  const tongThanhToan = tongTien + phiGH;

  if (!token && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-9 h-9 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-6">Bạn cần đăng nhập để thanh toán</p>
          <Link href="/login" className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-red-500 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-500" />
            Thanh toán
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Cột trái ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* 1. Địa chỉ giao hàng */}
            <section className="bg-white border border-gray-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <MapPin className="w-4 h-4 text-red-500" />
                  Địa chỉ giao hàng
                </h2>
                <button
                  onClick={() => setShowNewAddr(v => !v)}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  {showNewAddr ? 'Đóng' : 'Thêm địa chỉ'}
                </button>
              </div>

              {/* Form thêm địa chỉ mới */}
              {showNewAddr && (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                  <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-400" />
                    Địa chỉ mới
                  </h3>

                  <input
                    placeholder="Họ và tên người nhận *"
                    value={newAddr.receiverName}
                    onChange={e => setNewAddr(p => ({ ...p, receiverName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  />
                  <input
                    placeholder="Số điện thoại *"
                    value={newAddr.phone}
                    onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  />
                  <SearchableSelect
                    options={provinces}
                    value={newAddr.provinceName}
                    onChange={handleProvinceChange}
                    placeholder="Tỉnh / Thành phố *"
                  />
                  <SearchableSelect
                    options={districts}
                    value={newAddr.districtName}
                    onChange={handleDistrictChange}
                    placeholder="Quận / Huyện *"
                    disabled={!newAddr.provinceName}
                    loading={loadingDistricts}
                  />
                  <SearchableSelect
                    options={wards}
                    value={newAddr.wardName}
                    onChange={(code, name) => setNewAddr(p => ({ ...p, wardCode: code, wardName: name }))}
                    placeholder="Phường / Xã *"
                    disabled={!newAddr.districtName}
                    loading={loadingWards}
                  />
                  <input
                    placeholder="Địa chỉ chi tiết (số nhà, tên đường...) *"
                    value={newAddr.detailAddress}
                    onChange={e => setNewAddr(p => ({ ...p, detailAddress: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  />

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveNewAddr}
                      disabled={savingAddr}
                      className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
                    >
                      {savingAddr
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                        : <><CheckCircle2 className="w-4 h-4" /> Lưu địa chỉ</>
                      }
                    </button>
                    <button
                      onClick={() => { setShowNewAddr(false); setNewAddr(EMPTY_FORM); setDistricts([]); setWards([]); }}
                      className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách địa chỉ */}
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ giao hàng.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <label
                      key={addr._id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedAddr === addr._id
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr._id}
                        checked={selectedAddr === addr._id}
                        onChange={() => setSelectedAddr(addr._id)}
                        className="mt-1 accent-red-500"
                      />
                      <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${selectedAddr === addr._id ? 'text-red-400' : 'text-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 text-sm">{addr.receiverName}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500 text-sm">{addr.phone}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded font-medium">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {addr.detailAddress}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* 2. Phương thức thanh toán */}
            <section className="bg-white border border-gray-100 rounded-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <CreditCard className="w-4 h-4 text-red-500" />
                Phương thức thanh toán
              </h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(({ id, label, desc, Icon, color, bg }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                      paymentMethod === id
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={id}
                      checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id as 'cod' | 'banking')}
                      className="accent-red-500"
                    />
                    <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === 'banking' && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="font-semibold text-blue-700 text-sm mb-2 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    Thông tin chuyển khoản
                  </p>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>Ngân hàng: <span className="font-medium">Vietcombank</span></p>
                    <p>Số tài khoản: <span className="font-medium">1234567890</span></p>
                    <p>Chủ tài khoản: <span className="font-medium">SMARTHUB CO. LTD</span></p>
                    <p className="text-xs text-blue-400 mt-1">Nội dung: [Mã đơn hàng] - [Họ tên]</p>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Ghi chú */}
            <section className="bg-white border border-gray-100 rounded-lg p-6">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <FileText className="w-4 h-4 text-red-500" />
                Ghi chú đơn hàng
              </h2>
              <textarea
                rows={3}
                placeholder="Ghi chú cho người giao hàng (không bắt buộc)..."
                value={ghiChu}
                onChange={e => setGhiChu(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </section>
          </div>

          {/* ── Cột phải — Tóm tắt ── */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-lg p-6 sticky top-24">
              <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-red-500" />
                Sản phẩm ({items.length})
              </h2>

              {/* Danh sách sản phẩm được chọn */}
              <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item._id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {item.hinhAnh
                        ? <img src={item.hinhAnh} alt={item.tenSanPham} className="w-full h-full object-cover" />
                        : <Package className="w-5 h-5 text-gray-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.tenSanPham}</p>
                      {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                      <p className="text-xs text-gray-400">x{item.soLuong}</p>
                    </div>
                    <p className="text-sm font-bold text-red-500 shrink-0">
                      {formatPrice(item.gia * item.soLuong)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tính tiền */}
              <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatPrice(tongTien)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                    Phí giao hàng
                  </span>
                  <span className={phiGH === 0 ? 'text-green-500 font-medium' : ''}>
                    {phiGH === 0 ? 'Miễn phí' : formatPrice(phiGH)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 text-base pt-3 border-t border-gray-100">
                  <span>Tổng cộng</span>
                  <span className="text-red-500 text-lg">{formatPrice(tongThanhToan)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing || items.length === 0 || !selectedAddr}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-lg transition flex items-center justify-center gap-2"
              >
                {placing
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang đặt hàng...</>
                  : <><CreditCard className="w-4 h-4" /> Đặt hàng ngay</>
                }
              </button>

              {/* Trust badges */}
              <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                {[
                  { Icon: ShieldCheck, text: 'Bảo mật SSL',      color: 'text-green-500'  },
                  { Icon: BadgeCheck,  text: 'Hàng chính hãng',  color: 'text-purple-500' },
                  { Icon: Truck,       text: 'Giao hàng nhanh',  color: 'text-blue-500'   },
                  { Icon: CreditCard,  text: 'Thanh toán an toàn', color: 'text-yellow-500'},
                ].map(({ Icon, text, color }, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
