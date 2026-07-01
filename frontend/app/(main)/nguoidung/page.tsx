'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Phone, Mail, Calendar, Shield, Lock,
  Edit3, Check, X, ChevronRight, Package,
  LogOut, Camera, Eye, EyeOff, MapPin,
  Plus, Trash2, Star, Home, ShoppingCart,
  Wallet, LayoutGrid, Truck, Search, Heart,
} from 'lucide-react';
import SearchableSelect, { SelectOption } from '../../components/SearchableSelect';
import { useFavorites } from '../../components/favoritesContext';
import ConfirmModal from '../../components/ConfirmModal';

const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000';
const GEO_API  = 'https://provinces.open-api.vn/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserInfo {
  _id: string; hoTen: string; soDienThoai?: string; email?: string;
  ngaySinh?: string; role: string; googleId?: string; zaloId?: string; createdAt: string;
}

interface Address {
  _id: string; receiverName: string; phone: string;
  province: string; district: string; ward: string;
  detailAddress: string; isDefault: boolean;
}

interface AddrForm {
  receiverName: string; phone: string;
  province: string; district: string; ward: string;
  detailAddress: string; isDefault: boolean;
}

const EMPTY_FORM: AddrForm = {
  receiverName: '', phone: '', province: '', district: '', ward: '',
  detailAddress: '', isDefault: false,
};

type Tab = 'overview' | 'info' | 'address' | 'password' | 'orders';

interface OrderItem {
  productId: string; tenSanPham: string; hinhAnh: string; gia: number; soLuong: number; variant?: string;
}
interface Order {
  _id: string; items: OrderItem[]; tongThanhToan: number;
  trangThai: 'cho_xac_nhan' | 'da_xac_nhan' | 'dang_giao' | 'da_giao' | 'da_huy';
  createdAt: string;
}

const ORDER_STATUS_LABEL: Record<Order['trangThai'], string> = {
  cho_xac_nhan: 'Chờ xác nhận', da_xac_nhan: 'Đã xác nhận',
  dang_giao: 'Đang giao', da_giao: 'Đã giao', da_huy: 'Đã hủy',
};
const ORDER_STATUS_CLASS: Record<Order['trangThai'], string> = {
  cho_xac_nhan: 'bg-amber-50 text-amber-600', da_xac_nhan: 'bg-blue-50 text-blue-600',
  dang_giao: 'bg-purple-50 text-purple-600', da_giao: 'bg-green-50 text-green-600',
  da_huy: 'bg-gray-100 text-gray-500',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const toInputDate = (iso?: string) => (!iso ? '' : new Date(iso).toISOString().split('T')[0]);
const getAvatarLetter = (n: string) => n?.charAt(0)?.toUpperCase() || 'U';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('smarthub_token') || '' : '');

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NguoiDungPage() {
  const router = useRouter();
  const { items: favoriteItems, removeItem: removeFavorite } = useFavorites();

  // ── User ──
  const [user, setUser]       = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>('overview');
  const [showPhone, setShowPhone] = useState(false);

  // ── Avatar ──
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // ── Orders ──
  const [orders, setOrders]               = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading]  = useState(false);
  const [orderSearch, setOrderSearch]      = useState('');
  const [orderRange, setOrderRange]        = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // ── Profile edit ──
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [saveErr, setSaveErr]   = useState('');
  const [hoTen, setHoTen]       = useState('');
  const [email, setEmail]       = useState('');
  const [ngaySinh, setNgaySinh] = useState('');

  // ── Password ──
  const [matKhauCu, setMatKhauCu]   = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhan, setXacNhan]       = useState('');
  const [showCu, setShowCu]         = useState(false);
  const [showMoi, setShowMoi]       = useState(false);
  const [showXN, setShowXN]         = useState(false);
  const [pwMsg, setPwMsg]           = useState('');
  const [pwErr, setPwErr]           = useState('');
  const [pwSaving, setPwSaving]     = useState(false);

  // ── Address list ──
  const [addresses, setAddresses]   = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrMsg, setAddrMsg]       = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Address form ──
  const [showForm, setShowForm]       = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [form, setForm]               = useState<AddrForm>(EMPTY_FORM);
  const [formSaving, setFormSaving]   = useState(false);
  const [formErr, setFormErr]         = useState('');

  // ── Geo data ──
  const [provinces, setProvinces]           = useState<SelectOption[]>([]);
  const [districts, setDistricts]           = useState<SelectOption[]>([]);
  const [wards, setWards]                   = useState<SelectOption[]>([]);
  const [loadingProv, setLoadingProv]       = useState(false);
  const [loadingDist, setLoadingDist]       = useState(false);
  const [loadingWard, setLoadingWard]       = useState(false);
  const provincesRef = useRef<SelectOption[]>([]);

  // ── Fetch user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          setHoTen(d.user.hoTen || '');
          setEmail(d.user.email || '');
          setNgaySinh(toInputDate(d.user.ngaySinh));
          if (d.user.avatar) setAvatarPreview(d.user.avatar);
        } else router.replace('/login');
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh quá lớn, vui lòng chọn ảnh dưới 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      try {
        const r = await fetch(`${API_URL}/api/auth/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ avatar: base64 }),
        });
        const d = await r.json();
        if (d.user) setUser(d.user);
      } catch {
        // preview vẫn hiển thị dù lưu thất bại
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Fetch addresses ─────────────────────────────────────────────────────────
  const fetchAddresses = useCallback(async () => {
    setAddrLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json();
      if (d.success) setAddresses(d.data);
    } finally { setAddrLoading(false); }
  }, []);

  useEffect(() => {
    if ((tab === 'address' || tab === 'overview') && user) fetchAddresses();
  }, [tab, user, fetchAddresses]);

  // ── Fetch orders ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json();
      if (d.success) setOrders(d.orders);
    } finally { setOrdersLoading(false); }
  }, []);

  useEffect(() => {
    if ((tab === 'overview' || tab === 'orders') && user) fetchOrders();
  }, [tab, user, fetchOrders]);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      const r = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json();
      if (d.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, trangThai: 'da_huy' } : o));
      } else {
        alert(d.message || 'Không thể hủy đơn hàng');
      }
    } catch {
      alert('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setCancellingOrderId(null);
      setConfirmCancelId(null);
    }
  };

  const orderCount     = orders.filter(o => o.trangThai !== 'da_huy').length;
  const totalSpent      = orders.filter(o => o.trangThai === 'da_giao').reduce((s, o) => s + o.tongThanhToan, 0);
  const recentOrders    = orders.slice(0, 3);

  const RANGE_DAYS: Record<typeof orderRange, number | null> = {
    all: null, day: 1, week: 7, month: 30, year: 365,
  };
  const filteredOrders = orders.filter(o => {
    const days = RANGE_DAYS[orderRange];
    if (days != null) {
      const diffMs = Date.now() - new Date(o.createdAt).getTime();
      if (diffMs > days * 24 * 60 * 60 * 1000) return false;
    }
    if (orderSearch.trim()) {
      const kw = orderSearch.trim().toLowerCase();
      if (!o.items.some(it => it.tenSanPham.toLowerCase().includes(kw))) return false;
    }
    return true;
  });
  const maskedPhone = (() => {
    const p = user?.soDienThoai || '';
    if (!p || p.length < 5) return p;
    return `${p.slice(0, 3)}${'*'.repeat(p.length - 5)}${p.slice(-2)}`;
  })();

  // ── Geo loaders ─────────────────────────────────────────────────────────────
  const loadProvinces = useCallback(async (): Promise<SelectOption[]> => {
    if (provincesRef.current.length) return provincesRef.current;
    setLoadingProv(true);
    try {
      const r = await fetch(`${GEO_API}/p/`);
      const d: { code: number; name: string }[] = await r.json();
      const list = d.map(p => ({ code: p.code, name: p.name }));
      provincesRef.current = list;
      setProvinces(list);
      return list;
    } catch { return []; }
    finally { setLoadingProv(false); }
  }, []);

  const loadDistricts = useCallback(async (provCode: number): Promise<SelectOption[]> => {
    setLoadingDist(true);
    setDistricts([]);
    setWards([]);
    try {
      const r = await fetch(`${GEO_API}/p/${provCode}?depth=2`);
      const d = await r.json();
      const list = (d.districts || []).map((x: any) => ({ code: x.code, name: x.name }));
      setDistricts(list);
      return list;
    } catch { return []; }
    finally { setLoadingDist(false); }
  }, []);

  const loadWards = useCallback(async (distCode: number): Promise<SelectOption[]> => {
    setLoadingWard(true);
    setWards([]);
    try {
      const r = await fetch(`${GEO_API}/d/${distCode}?depth=2`);
      const d = await r.json();
      const list = (d.wards || []).map((x: any) => ({ code: x.code, name: x.name }));
      setWards(list);
      return list;
    } catch { return []; }
    finally { setLoadingWard(false); }
  }, []);

  // ── Province/district/ward change handlers ──────────────────────────────────
  const handleProvinceChange = useCallback((code: number, name: string) => {
    setForm(f => ({ ...f, province: name, district: '', ward: '' }));
    loadDistricts(code);
  }, [loadDistricts]);

  const handleDistrictChange = useCallback((code: number, name: string) => {
    setForm(f => ({ ...f, district: name, ward: '' }));
    loadWards(code);
  }, [loadWards]);

  const handleWardChange = useCallback((_code: number, name: string) => {
    setForm(f => ({ ...f, ward: name }));
  }, []);

  // ── Open add form ───────────────────────────────────────────────────────────
  const openAddForm = useCallback(async () => {
    setEditingAddr(null);
    setForm(EMPTY_FORM);
    setFormErr('');
    setDistricts([]);
    setWards([]);
    setShowForm(true);
    await loadProvinces();
  }, [loadProvinces]);

  // ── Open edit form (cascade-load existing address data) ─────────────────────
  const openEditForm = useCallback(async (addr: Address) => {
    setEditingAddr(addr);
    setForm({
      receiverName: addr.receiverName, phone: addr.phone,
      province: addr.province, district: addr.district, ward: addr.ward,
      detailAddress: addr.detailAddress, isDefault: addr.isDefault,
    });
    setFormErr('');
    setDistricts([]);
    setWards([]);
    setShowForm(true);

    // Cascade-load so dropdowns are pre-populated
    const provList = await loadProvinces();
    const prov = provList.find(p => p.name === addr.province);
    if (!prov) return;
    const distList = await loadDistricts(prov.code);
    const dist = distList.find(d => d.name === addr.district);
    if (!dist) return;
    await loadWards(dist.code);
  }, [loadProvinces, loadDistricts, loadWards]);

  // ── Save address ────────────────────────────────────────────────────────────
  const handleSaveAddress = async () => {
    const { receiverName, phone, province, district, ward, detailAddress } = form;
    if (!receiverName || !phone || !province || !district || !ward || !detailAddress) {
      setFormErr('Vui lòng điền đầy đủ tất cả các trường bắt buộc');
      return;
    }
    setFormSaving(true); setFormErr('');
    try {
      const url    = editingAddr ? `${API_URL}/api/addresses/${editingAddr._id}` : `${API_URL}/api/addresses`;
      const method = editingAddr ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await fetchAddresses();
      setShowForm(false);
      setAddrMsg(editingAddr ? 'Đã cập nhật địa chỉ thành công!' : 'Đã thêm địa chỉ mới thành công!');
      setTimeout(() => setAddrMsg(''), 3000);
    } catch (e: any) { setFormErr(e.message || 'Có lỗi xảy ra'); }
    finally { setFormSaving(false); }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormErr('');
    setDistricts([]);
    setWards([]);
  };

  // ── Set default ──────────────────────────────────────────────────────────────
  const handleSetDefault = async (id: string) => {
    await fetch(`${API_URL}/api/addresses/${id}/default`, {
      method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` },
    });
    await fetchAddresses();
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`${API_URL}/api/addresses/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` },
      });
      await fetchAddresses();
    } finally { setDeletingId(null); }
  };

  // ── Profile save ─────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true); setSaveMsg(''); setSaveErr('');
    try {
      const res  = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ hoTen, email, ngaySinh }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUser(data.user);
      localStorage.setItem('smarthub_user', JSON.stringify({
        id: data.user._id, hoTen: data.user.hoTen,
        soDienThoai: data.user.soDienThoai, email: data.user.email,
      }));
      setSaveMsg('Cập nhật thông tin thành công!');
      setEditing(false);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: any) { setSaveErr(e.message || 'Có lỗi xảy ra'); }
    finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setHoTen(user?.hoTen || '');
    setEmail(user?.email || '');
    setNgaySinh(toInputDate(user?.ngaySinh));
    setSaveErr('');
  };

  // ── Change password ──────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwMsg(''); setPwErr('');
    if (matKhauMoi !== xacNhan) { setPwErr('Mật khẩu xác nhận không khớp'); return; }
    if (matKhauMoi.length < 6)  { setPwErr('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    setPwSaving(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ matKhauCu, matKhauMoi }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPwMsg('Đổi mật khẩu thành công!');
      setMatKhauCu(''); setMatKhauMoi(''); setXacNhan('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (e: any) { setPwErr(e.message || 'Có lỗi xảy ra'); }
    finally { setPwSaving(false); }
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('smarthub_token');
    localStorage.removeItem('smarthub_user');
    router.push('/');
  };

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const accountType = user.googleId ? 'Google' : user.zaloId ? 'Zalo' : 'Tài khoản thường';
  const hasPassword = !user.googleId && !user.zaloId;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
        <Link href="/" className="hover:text-red-500 transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 font-medium">Tài khoản của tôi</span>
      </nav>

      {/* ══════════ Summary header ══════════ */}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                getAvatarLetter(user.hoTen)
              )}
            </div>
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <Camera className="w-2.5 h-2.5 text-gray-500" />
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-800 text-base leading-tight">{user.hoTen}</p>
              {user.role === 'admin' && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                  Quản trị viên
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPhone(v => !v)}
              className="flex items-center gap-1.5 text-sm text-gray-400 mt-1 hover:text-gray-600 transition-colors"
            >
              {showPhone ? (user.soDienThoai || '—') : maskedPhone}
              {showPhone ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="hidden sm:block w-px h-12 bg-gray-100" />

        <button onClick={() => setTab('orders')} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg leading-none">{ordersLoading ? '—' : orderCount}</p>
            <p className="text-xs text-gray-400 mt-1">Tổng số đơn hàng đã mua</p>
          </div>
        </button>

        <div className="hidden sm:block w-px h-12 bg-gray-100" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg leading-none">
              {ordersLoading ? '—' : new Intl.NumberFormat('vi-VN').format(totalSpent) + 'đ'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Tổng tiền tích lũy · Từ {fmtDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">

        {/* ══════════ Sidebar ══════════ */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            {/* Nav */}
            <nav className="p-2">
              {([
                { key: 'overview', icon: LayoutGrid, label: 'Tổng quan' },
                { key: 'info',     icon: User,    label: 'Thông tin cá nhân' },
                { key: 'address',  icon: MapPin,  label: 'Địa chỉ của tôi' },
                { key: 'orders',   icon: Package, label: 'Đơn hàng của tôi' },
                { key: 'password', icon: Lock,    label: 'Đổi mật khẩu', hide: !hasPassword },
              ] as { key: Tab; icon: React.ElementType; label: string; hide?: boolean }[])
                .filter(i => !i.hide)
                .map(item => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                      tab === item.key
                        ? 'bg-red-50 text-red-600 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                    {tab === item.key && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}
              {user.role === 'admin' && (
                <Link href="/admin" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-amber-500 hover:bg-amber-50 transition-all">
                  <Shield className="w-4 h-4 shrink-0" />Trang quản trị
                </Link>
              )}
              <div className="border-t border-gray-100 my-1.5" />
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all">
                <LogOut className="w-4 h-4 shrink-0" />Đăng xuất
              </button>
            </nav>
          </div>
          <div className="mt-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-gray-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 leading-none">Loại tài khoản</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{accountType}</p>
            </div>
          </div>
        </aside>

        {/* ══════════ Main content ══════════ */}
        <main className="flex-1 min-w-0">

          {/* ── Tab: Tổng quan ── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {!user.email && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 text-blue-700 text-sm px-4 py-3 rounded-xl">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="flex-1">Thêm email để bảo mật tài khoản và nhận thông báo đơn hàng.</span>
                  <button onClick={() => setTab('info')} className="font-semibold hover:underline shrink-0">Cập nhật</button>
                </div>
              )}
              {addresses.length === 0 && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 text-blue-700 text-sm px-4 py-3 rounded-xl">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="flex-1">Thêm địa chỉ để đặt đơn hàng nhanh hơn.</span>
                  <button onClick={() => setTab('address')} className="font-semibold hover:underline shrink-0">Thêm địa chỉ</button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Đơn hàng gần đây */}
                <div className="lg:col-span-2 bg-white rounded-sm shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-800">Đơn hàng gần đây</h2>
                    <button onClick={() => setTab('orders')} className="text-xs text-red-500 font-medium hover:underline">Xem tất cả</button>
                  </div>
                  {ordersLoading ? (
                    <div className="p-6 space-y-3">
                      {[1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="px-6 py-14 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Package className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium text-sm">Bạn chưa có đơn hàng nào</p>
                      <Link href="/sanpham" className="mt-3 text-sm text-red-500 font-semibold hover:underline">Mua sắm ngay</Link>
                    </div>
                  ) : (
                    <div className="p-4 space-y-2.5">
                      {recentOrders.map(o => (
                        <div key={o._id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                          <img
                            src={o.items[0]?.hinhAnh || 'https://placehold.co/80x80?text=No+Image'}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {o.items[0]?.tenSanPham}{o.items.length > 1 ? ` và ${o.items.length - 1} sản phẩm khác` : ''}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(o.createdAt)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-800">{new Intl.NumberFormat('vi-VN').format(o.tongThanhToan)}đ</p>
                            <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_CLASS[o.trangThai]}`}>
                              {ORDER_STATUS_LABEL[o.trangThai]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Thông tin tài khoản */}
                <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-5 space-y-4">
                  <h2 className="text-sm font-bold text-gray-800">Thông tin tài khoản</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 leading-none">Loại tài khoản</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{accountType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 leading-none">Thành viên từ</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{fmtDate(user.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 leading-none">Email</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5 truncate">{user.email || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <button onClick={() => setTab('info')} className="w-full text-sm text-red-500 font-medium border border-red-200 rounded-xl py-2 hover:bg-red-50 transition-colors">
                    Chỉnh sửa thông tin
                  </button>
                </div>
              </div>

              {/* Sản phẩm yêu thích */}
              <div className="bg-white rounded-sm shadow-sm border border-gray-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-800">Sản phẩm yêu thích</h2>
                  {favoriteItems.length > 0 && (
                    <span className="text-xs text-gray-400">{favoriteItems.length} sản phẩm</span>
                  )}
                </div>
                {favoriteItems.length === 0 ? (
                  <div className="px-6 py-14 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Heart className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium text-sm">Bạn chưa có sản phẩm yêu thích nào</p>
                    <Link href="/sanpham" className="mt-3 text-sm text-red-500 font-semibold hover:underline">Mua sắm ngay</Link>
                  </div>
                ) : (
                  <div className="p-4 space-y-2.5">
                    {favoriteItems.slice(0, 4).map((p) => (
                      <Link
                        key={p.id}
                        href={`/sanpham/${p.slug}`}
                        className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:border-red-100 hover:bg-red-50/30 transition-colors"
                      >
                        <img
                          src={p.thumbnail || 'https://placehold.co/80x80?text=No+Image'}
                          alt={p.ten}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.ten}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-bold text-red-500">
                              {new Intl.NumberFormat('vi-VN').format(p.giaSale ?? p.gia)}đ
                            </span>
                            {p.giamGia > 0 && (
                              <span className="text-xs text-gray-400 line-through">
                                {new Intl.NumberFormat('vi-VN').format(p.gia)}đ
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFavorite(p.id); }}
                          title="Bỏ yêu thích"
                          className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 hover:bg-red-100 transition-colors shrink-0"
                        >
                          <Heart className="w-4 h-4 fill-red-500" />
                        </button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Thông tin cá nhân ── */}
          {tab === 'info' && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h1 className="text-base font-bold text-gray-800">Thông tin cá nhân</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Quản lý thông tin hồ sơ của bạn</p>
                </div>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleCancelEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                      <X className="w-3.5 h-3.5" />Hủy
                    </button>
                    <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
                      <Check className="w-3.5 h-3.5" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-5">
                {saveMsg && <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl"><Check className="w-4 h-4 shrink-0" />{saveMsg}</div>}
                {saveErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl"><X className="w-4 h-4 shrink-0" />{saveErr}</div>}
                {[
                  { icon: User, bg: 'bg-red-50', ic: 'text-red-500', label: 'Họ và tên', editable: true,
                    view: <p className="text-sm font-medium text-gray-800">{user.hoTen}</p>,
                    edit: <input value={hoTen} onChange={e => setHoTen(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition" placeholder="Nhập họ và tên" /> },
                  { icon: Phone, bg: 'bg-blue-50', ic: 'text-blue-500', label: 'Số điện thoại', editable: false,
                    view: <><p className="text-sm font-medium text-gray-800">{user.soDienThoai || '—'}</p><p className="text-[11px] text-gray-400 mt-0.5">Số điện thoại không thể thay đổi</p></> },
                  { icon: Mail, bg: 'bg-purple-50', ic: 'text-purple-500', label: 'Email', editable: true,
                    view: <p className="text-sm font-medium text-gray-800">{user.email || '—'}</p>,
                    edit: <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition" placeholder="Nhập địa chỉ email" /> },
                  { icon: Calendar, bg: 'bg-amber-50', ic: 'text-amber-500', label: 'Ngày sinh', editable: true,
                    view: <p className="text-sm font-medium text-gray-800">{fmtDate(user.ngaySinh)}</p>,
                    edit: <input type="date" value={ngaySinh} onChange={e => setNgaySinh(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition" /> },
                  { icon: Shield, bg: 'bg-green-50', ic: 'text-green-500', label: 'Thành viên từ', editable: false,
                    view: <p className="text-sm font-medium text-gray-800">{fmtDate(user.createdAt)}</p> },
                ].map(({ icon: Icon, bg, ic, label, editable, view, edit }, i, arr) => (
                  <div key={label}>
                    <div className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${ic}`} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
                        {editing && editable ? edit : view}
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="border-t border-dashed border-gray-100 mt-5" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: Địa chỉ ── */}
          {tab === 'address' && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h1 className="text-base font-bold text-gray-800">Địa chỉ của tôi</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Quản lý địa chỉ nhận hàng</p>
                </div>
                {!showForm && (
                  <button onClick={openAddForm} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                    <Plus className="w-3.5 h-3.5" />Thêm địa chỉ
                  </button>
                )}
              </div>

              {addrMsg && (
                <div className="mx-6 mt-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                  <Check className="w-4 h-4 shrink-0" />{addrMsg}
                </div>
              )}

              {/* ── Add / Edit Form ── */}
              {showForm && (
                <div className="mx-6 mt-4 mb-2 border border-gray-200 rounded-sm p-5 bg-gray-50/60">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    {editingAddr ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                  </h3>

                  {formErr && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl mb-4">
                      <X className="w-4 h-4 shrink-0" />{formErr}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {/* Tên người nhận */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Tên người nhận *</label>
                      <input
                        value={form.receiverName}
                        onChange={e => setForm(f => ({ ...f, receiverName: e.target.value }))}
                        placeholder="Nguyễn Văn A"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition"
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Số điện thoại *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={11}
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                        placeholder="0901234567"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition"
                      />
                      <p className="text-xs text-gray-400 mt-1">Chỉ nhập số</p>
                    </div>

                    {/* Tỉnh / Thành phố */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Tỉnh / Thành phố *
                      </label>
                      <SearchableSelect
                        options={provinces}
                        value={form.province}
                        onChange={handleProvinceChange}
                        placeholder="Chọn tỉnh / thành phố"
                        loading={loadingProv}
                      />
                    </div>

                    {/* Quận / Huyện */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Quận / Huyện *
                      </label>
                      <SearchableSelect
                        options={districts}
                        value={form.district}
                        onChange={handleDistrictChange}
                        placeholder={form.province ? 'Chọn quận / huyện' : 'Chọn tỉnh trước'}
                        disabled={!form.province || loadingDist}
                        loading={loadingDist}
                      />
                    </div>

                    {/* Phường / Xã */}
                    <div className="sm:col-span-2 sm:w-1/2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Phường / Xã *
                      </label>
                      <SearchableSelect
                        options={wards}
                        value={form.ward}
                        onChange={handleWardChange}
                        placeholder={form.district ? 'Chọn phường / xã' : 'Chọn quận trước'}
                        disabled={!form.district || loadingWard}
                        loading={loadingWard}
                      />
                    </div>

                    {/* Địa chỉ chi tiết */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Địa chỉ chi tiết *</label>
                      <input
                        value={form.detailAddress}
                        onChange={e => setForm(f => ({ ...f, detailAddress: e.target.value }))}
                        placeholder="Số nhà, tên đường, tổ, ấp..."
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition"
                      />
                    </div>

                    {/* Mặc định */}
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
                        className="flex items-center gap-2.5 group"
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          form.isDefault ? 'bg-red-500 border-red-500' : 'border-gray-300 group-hover:border-red-300'
                        }`}>
                          {form.isDefault && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-gray-600 select-none">Đặt làm địa chỉ mặc định</span>
                      </button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={handleCancelForm}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveAddress}
                      disabled={formSaving}
                      className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                    >
                      {formSaving ? 'Đang lưu...' : editingAddr ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Address list ── */}
              <div className="p-6 space-y-3">
                {addrLoading ? (
                  [1, 2].map(i => (
                    <div key={i} className="animate-pulse border border-gray-100 rounded-sm p-4 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  ))
                ) : addresses.length === 0 ? (
                  <div className="text-center py-14">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Chưa có địa chỉ nào</p>
                    <p className="text-sm text-gray-400 mt-1">Thêm địa chỉ để nhận hàng nhanh hơn</p>
                    <button onClick={openAddForm} className="mt-4 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">
                      Thêm địa chỉ ngay
                    </button>
                  </div>
                ) : (
                  addresses.map(addr => (
                    <div key={addr._id} className={`relative border rounded-sm p-4 transition-all ${
                      addr.isDefault ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}>
                      {addr.isDefault && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-red-500" />Mặc định
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${addr.isDefault ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <Home className={`w-4 h-4 ${addr.isDefault ? 'text-red-500' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0 pr-20">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-800">{addr.receiverName}</p>
                            <span className="text-gray-300">|</span>
                            <p className="text-sm text-gray-500">{addr.phone}</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            {addr.detailAddress}, {addr.ward}, {addr.district}, {addr.province}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 ml-12">
                        <button onClick={() => openEditForm(addr)} className="flex items-center gap-1 px-3 py-1.5 rounded-sm border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors">
                          <Edit3 className="w-3 h-3" />Chỉnh sửa
                        </button>
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefault(addr._id)} className="flex items-center gap-1 px-3 py-1.5 rounded-sm border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium transition-colors">
                            <Star className="w-3 h-3" />Đặt mặc định
                          </button>
                        )}
                        {addresses.length > 1 && (
                          <button onClick={() => handleDelete(addr._id)} disabled={deletingId === addr._id} className="flex items-center gap-1 px-3 py-1.5 rounded-sm border border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-200 text-xs font-medium transition-colors disabled:opacity-50">
                            <Trash2 className="w-3 h-3" />{deletingId === addr._id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Đơn hàng ── */}
          {tab === 'orders' && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h1 className="text-base font-bold text-gray-800">Đơn hàng của tôi</h1>
                <p className="text-xs text-gray-400 mt-0.5">Theo dõi và quản lý đơn hàng</p>
              </div>

              {orders.length > 0 && (
                <div className="px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      placeholder="Tìm theo tên sản phẩm..."
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-[13px] focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    {([
                      { key: 'all',   label: 'Tất cả' },
                      { key: 'day',   label: 'Hôm nay' },
                      { key: 'week',  label: 'Tuần' },
                      { key: 'month', label: 'Tháng' },
                      { key: 'year',  label: 'Năm' },
                    ] as { key: typeof orderRange; label: string }[]).map(r => (
                      <button
                        key={r.key}
                        onClick={() => setOrderRange(r.key)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-medium border whitespace-nowrap transition-colors ${
                          orderRange === r.key
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ordersLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="px-6 py-16 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-9 h-9 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Chưa có đơn hàng nào</p>
                  <p className="text-sm text-gray-400 mt-1">Hãy mua sắm và quay lại đây để theo dõi đơn hàng</p>
                  <Link href="/sanpham" className="mt-5 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">
                    Mua sắm ngay
                  </Link>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="px-6 py-16 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-9 h-9 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Không tìm thấy đơn hàng phù hợp</p>
                  <p className="text-sm text-gray-400 mt-1">Thử đổi từ khóa hoặc khoảng thời gian khác</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredOrders.map(o => (
                    <div key={o._id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400">Đặt ngày {fmtDate(o.createdAt)}</p>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_CLASS[o.trangThai]}`}>
                          {ORDER_STATUS_LABEL[o.trangThai]}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {o.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <img
                              src={it.hinhAnh || 'https://placehold.co/80x80?text=No+Image'}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{it.tenSanPham}</p>
                              <p className="text-xs text-gray-400">{it.variant ? `${it.variant} · ` : ''}x{it.soLuong}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-700 shrink-0">
                              {new Intl.NumberFormat('vi-VN').format(it.gia)}đ
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-dashed border-gray-100">
                        <div>
                          {o.trangThai === 'cho_xac_nhan' && (
                            <button
                              onClick={() => setConfirmCancelId(o._id)}
                              className="px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Hủy đơn
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Tổng tiền:</span>
                          <span className="text-sm font-bold text-red-600">
                            {new Intl.NumberFormat('vi-VN').format(o.tongThanhToan)}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Đổi mật khẩu ── */}
          {tab === 'password' && hasPassword && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h1 className="text-base font-bold text-gray-800">Đổi mật khẩu</h1>
                <p className="text-xs text-gray-400 mt-0.5">Bảo mật tài khoản bằng mật khẩu mạnh</p>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-4 max-w-md">
                {pwMsg && <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl"><Check className="w-4 h-4 shrink-0" />{pwMsg}</div>}
                {pwErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl"><X className="w-4 h-4 shrink-0" />{pwErr}</div>}
                {[
                  { label: 'Mật khẩu hiện tại',     val: matKhauCu,  set: setMatKhauCu,  show: showCu,  setShow: setShowCu },
                  { label: 'Mật khẩu mới',           val: matKhauMoi, set: setMatKhauMoi, show: showMoi, setShow: setShowMoi },
                  { label: 'Xác nhận mật khẩu mới',  val: xacNhan,    set: setXacNhan,    show: showXN,  setShow: setShowXN },
                ].map(({ label, val, set, show, setShow }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                    <div className="relative">
                      <input type={show ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)} required
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm pr-10 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition"
                        placeholder={`Nhập ${label.toLowerCase()}`} />
                      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={pwSaving} className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2">
                  {pwSaving ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

      <ConfirmModal
        open={!!confirmCancelId}
        title="Hủy đơn hàng?"
        message="Bạn có chắc muốn hủy đơn hàng này không? Hành động này không thể hoàn tác."
        confirmLabel="Hủy đơn"
        cancelLabel="Giữ đơn"
        onConfirm={() => confirmCancelId && handleCancelOrder(confirmCancelId)}
        onCancel={() => setConfirmCancelId(null)}
        loading={!!cancellingOrderId}
      />
    </div>
  );
}
