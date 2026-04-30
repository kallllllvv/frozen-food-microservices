"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type User = { name?: string; email?: string; role?: string };
type DashboardStats = {
    totalOrders: number;
    revenue: number;
    totalBuyers: number;
    needProcess: number;
    shipping: number;
    completed: number;
    grossProfit: number;
    netProfit: number;
    monthlyFinance: Array<{ month: string; revenue: number; grossProfit: number; netProfit: number }>;
};
type Product = {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    image?: string;
    tag?: string;
};
type Order = {
    id: number;
    user_email: string;
    customer_name?: string;
    customer_phone?: string;
    shipping_address?: string;
    status: string;
    tracking_number?: string;
    total: number;
    date: string;
};
type Banner = {
    id: number;
    title: string;
    image_url: string;
    link_url?: string;
    is_active: number;
};

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

export default function AdminDashboardPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);

    const [newProduct, setNewProduct] = useState({ name: "", category: "Ayam", price: "", stock: "0", image: "", tag: "", cost_price: "" });
    const [newBanner, setNewBanner] = useState({ title: "", image_url: "", link_url: "", is_active: true });
    const [productStockDrafts, setProductStockDrafts] = useState<Record<number, { value: string; mode: "set" | "add" }>>({});
    const [orderDrafts, setOrderDrafts] = useState<Record<number, { status: string; tracking_number: string }>>({});

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type }), 2600);
    };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            // Tambahkan cache: 'no-store' agar Next.js selalu mengambil data paling baru (tidak pakai cache lama)
            const [statsRes, productsRes, ordersRes, bannersRes] = await Promise.all([
                fetch("http://localhost:5000/api/admin/stats", { cache: "no-store" }),
                fetch("http://localhost:5000/api/admin/products", { cache: "no-store" }),
                fetch("http://localhost:5000/api/admin/orders", { cache: "no-store" }),
                fetch("http://localhost:5000/api/admin/banners", { cache: "no-store" }),
            ]);

            const statsData = await statsRes.json();
            const productsData = await productsRes.json();
            const ordersData = await ordersRes.json();
            const bannersData = await bannersRes.json();

            if (statsRes.ok) setStats(statsData.data);
            if (productsRes.ok) setProducts(productsData.data || []);
            if (ordersRes.ok) {
                const orderRows = ordersData.data || [];
                setOrders(orderRows);
                setOrderDrafts(
                    orderRows.reduce((acc: Record<number, { status: string; tracking_number: string }>, order: Order) => {
                        acc[order.id] = { status: order.status || "Diproses", tracking_number: order.tracking_number || "" };
                        return acc;
                    }, {})
                );
            }
            if (bannersRes.ok) setBanners(bannersData.data || []);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Gagal memuat dashboard", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        const userStr = localStorage.getItem("user");

        if (!userStr) {
            router.push("/auth/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(userStr);
            if (parsedUser.role !== "admin") {
                router.push("/");
                return;
            }

            setUser(parsedUser);
            loadDashboard();
        } catch {
            router.push("/auth/login");
        }
    }, [router]);

    const maxFinanceValue = useMemo(() => {
        if (!stats?.monthlyFinance?.length) return 1;
        return Math.max(...stats.monthlyFinance.flatMap((item) => [item.revenue, item.grossProfit, item.netProfit]), 1);
    }, [stats]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("cart");
        router.push("/");
    };

    const handleCreateProduct = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch("http://localhost:5000/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newProduct,
                    price: Number(newProduct.price),
                    stock: Number(newProduct.stock),
                    cost_price: newProduct.cost_price ? Number(newProduct.cost_price) : undefined,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Gagal menambahkan produk");
            showToast("Produk baru berhasil ditambahkan");
            setNewProduct({ name: "", category: "Ayam", price: "", stock: "0", image: "", tag: "", cost_price: "" });
            await loadDashboard();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Gagal menambahkan produk", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleStockSave = async (productId: number) => {
        const draft = productStockDrafts[productId];
        if (!draft) return;
        setSaving(true);
        try {
            const response = await fetch(`http://localhost:5000/api/admin/products/${productId}/stock`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: draft.mode, value: Number(draft.value) }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Gagal update stok");
            showToast("Stok berhasil diperbarui");
            await loadDashboard();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Gagal update stok", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleOrderSave = async (orderId: number) => {
        const draft = orderDrafts[orderId];
        if (!draft) return;
        setSaving(true);
        try {
            const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draft),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Gagal update order");
            
            showToast("Tracking order berhasil diperbarui");
            
            // Optimistic Update: Langsung ubah state lokal agar badge otomatis berubah warnanya jadi Selesai
            setOrders((prevOrders) => 
                prevOrders.map((order) => 
                    order.id === orderId 
                        ? { ...order, status: draft.status, tracking_number: draft.tracking_number } 
                        : order
                )
            );

            await loadDashboard();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Gagal update order", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateBanner = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch("http://localhost:5000/api/admin/banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBanner),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Gagal menambahkan banner");
            showToast("Banner berhasil ditambahkan");
            setNewBanner({ title: "", image_url: "", link_url: "", is_active: true });
            await loadDashboard();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Gagal menambahkan banner", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-white" />;

    const pendingOrders = orders.filter((order) => order.status === "Diproses");
    const shippingOrders = orders.filter((order) => order.status === "Dikirim");

    return (
        <main className="min-h-screen bg-white text-gray-900">
            {toast.show && (
                <div className="fixed top-4 right-4 z-[60] animate-slide-in-right">
                    <div className={`rounded-xl px-4 py-3 min-w-[300px] shadow-xl border ${toast.type === "success" ? "bg-green-600 text-white border-green-500" : "bg-red-600 text-white border-red-500"}`}>
                        <p className="text-xs font-black uppercase tracking-widest mb-0.5">{toast.type === "success" ? "Berhasil" : "Gagal"}</p>
                        <p className="text-sm font-semibold">{toast.message}</p>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">FrozenShelly Admin</p>
                        <h1 className="text-lg font-black">Dashboard Admin</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-widest text-gray-400">Login sebagai</p>
                            <p className="font-bold text-gray-800">{user?.name || "Admin"}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-red-600 hover:bg-red-700 text-white font-black px-6 py-2 text-xs uppercase tracking-widest transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <section className="rounded-[2rem] overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 text-white shadow-2xl shadow-blue-100">
                    <div className="p-8 lg:p-10 grid lg:grid-cols-[1.3fr_1fr] gap-6 items-center">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-100 mb-3">Admin Control Center</p>
                            <h2 className="text-3xl lg:text-5xl font-black leading-tight mb-4">Kelola stok, order, banner, dan revenue dalam satu dashboard.</h2>
                            <p className="text-blue-50 max-w-2xl">Tema dibuat tetap konsisten dengan user biasa, tetapi dashboard ini memberi akses penuh untuk menambahkan barang baru, menaikkan stok, memantau order, dan mengatur banner homepage.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-3xl bg-white/15 backdrop-blur p-4 border border-white/15">
                                <p className="text-[10px] uppercase tracking-widest text-blue-100">Total Revenue</p>
                                <p className="text-2xl font-black mt-2">{money(stats?.revenue || 0)}</p>
                            </div>
                            <div className="rounded-3xl bg-white/15 backdrop-blur p-4 border border-white/15">
                                <p className="text-[10px] uppercase tracking-widest text-blue-100">Profit Bersih</p>
                                <p className="text-2xl font-black mt-2">{money(stats?.netProfit || 0)}</p>
                            </div>
                            <div className="rounded-3xl bg-white/15 backdrop-blur p-4 border border-white/15">
                                <p className="text-[10px] uppercase tracking-widest text-blue-100">Buyer</p>
                                <p className="text-2xl font-black mt-2">{stats?.totalBuyers || 0}</p>
                            </div>
                            <div className="rounded-3xl bg-white/15 backdrop-blur p-4 border border-white/15">
                                <p className="text-[10px] uppercase tracking-widest text-blue-100">Status Diproses</p>
                                <p className="text-2xl font-black mt-2">{stats?.needProcess || 0}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                        { label: "Total Order", value: stats?.totalOrders || 0 },
                        { label: "Total Pembeli", value: stats?.totalBuyers || 0 },
                        { label: "Butuh Diproses", value: stats?.needProcess || 0 },
                        { label: "Sedang Dikirim", value: stats?.shipping || 0 },
                    ].map((item) => (
                        <div key={item.label} className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">{item.label}</p>
                            <p className="text-3xl font-black text-gray-900">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
                    <div className="rounded-[2rem] bg-white border border-gray-100 shadow-sm p-6">
                        <div className="flex items-end justify-between mb-8 gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-black mb-2">Grafik Kurva Keuangan</p>
                                <h3 className="text-2xl font-black">Trend Revenue & Profit</h3>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-gray-400 font-medium">Memuat grafik...</div>
                        ) : (stats?.monthlyFinance?.length || 0) > 0 ? (
                            <div className="relative h-[280px] bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-gray-100 p-6">
                                <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="xMidYMid meet">
                                    {/* Grid */}
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <line key={`grid-${i}`} x1="40" y1={50 + i * 50} x2="780" y2={50 + i * 50} stroke="#e5e7eb" strokeWidth="1" />
                                    ))}
                                    <line x1="40" y1="30" x2="40" y2="210" stroke="#1f2937" strokeWidth="2" />
                                    <line x1="40" y1="210" x2="780" y2="210" stroke="#1f2937" strokeWidth="2" />
                                    
                                    {/* Revenue Line (Blue) */}
                                    <polyline
                                        points={stats?.monthlyFinance?.map((d, i) => {
                                            const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                            const maxRev = Math.max(...(stats?.monthlyFinance?.map(e => e.revenue) || [1]));
                                            const y = 210 - ((d.revenue / maxRev) * 170);
                                            return `${x},${y}`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="#0077B6"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    
                                    {/* Gross Profit Line (Amber) */}
                                    <polyline
                                        points={stats?.monthlyFinance?.map((d, i) => {
                                            const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                            const maxProfit = Math.max(...(stats?.monthlyFinance?.map(e => e.grossProfit) || [1]));
                                            const y = 210 - ((d.grossProfit / maxProfit) * 170);
                                            return `${x},${y}`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="#f59e0b"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    
                                    {/* Net Profit Line (Green) */}
                                    <polyline
                                        points={stats?.monthlyFinance?.map((d, i) => {
                                            const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                            const maxNet = Math.max(...(stats?.monthlyFinance?.map(e => e.netProfit) || [1]));
                                            const y = 210 - ((d.netProfit / maxNet) * 170);
                                            return `${x},${y}`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Data Points */}
                                    {stats?.monthlyFinance?.map((d, i) => {
                                        const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                        const maxRev = Math.max(...(stats?.monthlyFinance?.map(e => e.revenue) || [1]));
                                        const yRev = 210 - ((d.revenue / maxRev) * 170);
                                        const maxProfit = Math.max(...(stats?.monthlyFinance?.map(e => e.grossProfit) || [1]));
                                        const yGross = 210 - ((d.grossProfit / maxProfit) * 170);
                                        const maxNet = Math.max(...(stats?.monthlyFinance?.map(e => e.netProfit) || [1]));
                                        const yNet = 210 - ((d.netProfit / maxNet) * 170);
                                        return (
                                            <g key={`points-${i}`}>
                                                <circle cx={x} cy={yRev} r="4" fill="#0077B6" />
                                                <circle cx={x} cy={yGross} r="4" fill="#f59e0b" />
                                                <circle cx={x} cy={yNet} r="4" fill="#10b981" />
                                            </g>
                                        );
                                    })}

                                    {/* Month Labels */}
                                    {stats?.monthlyFinance?.map((d, i) => {
                                        const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                        return (
                                            <text key={`label-${i}`} x={x} y="230" textAnchor="middle" fontSize="12" fill="#6b7280" className="font-bold">
                                                {d.month.substring(0, 3)}
                                            </text>
                                        );
                                    })}
                                </svg>
                                
                                {/* Legend */}
                                <div className="flex justify-center gap-6 mt-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                                        <span className="font-bold text-gray-600">Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <span className="font-bold text-gray-600">Gross Profit</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="font-bold text-gray-600">Net Profit</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-gray-400 font-medium">Belum ada data order untuk grafik.</div>
                        )}
                    </div>

                    <div className="rounded-[2rem] bg-white border border-gray-100 shadow-sm p-6">
                        <div className="flex items-end justify-between mb-6 gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-black mb-2">Grafik Bar Bulanan</p>
                                <h3 className="text-2xl font-black">Detail Revenue & Profit</h3>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                                <p>Gross = Revenue - HPP</p>
                                <p>Net = Gross - estimasi biaya operasional</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-gray-400 font-medium">Memuat grafik...</div>
                        ) : (stats?.monthlyFinance?.length || 0) > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                                {stats?.monthlyFinance?.map((entry) => {
                                    const maxFinanceValue = Math.max(
                                        ...(stats?.monthlyFinance?.map(e => Math.max(e.revenue, e.grossProfit, e.netProfit)) || [1])
                                    );
                                    return (
                                        <div key={entry.month} className="rounded-2xl border border-gray-100 p-4 bg-gray-50/80">
                                            <p className="font-black text-gray-800 mb-4 text-sm">{entry.month}</p>
                                            <div className="space-y-3">
                                                {[
                                                    { label: "Revenue", value: entry.revenue, color: "bg-blue-600" },
                                                    { label: "Gross", value: entry.grossProfit, color: "bg-amber-500" },
                                                    { label: "Net", value: entry.netProfit, color: "bg-emerald-500" },
                                                ].map((bar) => (
                                                    <div key={bar.label}>
                                                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                                                            <span>{bar.label}</span>
                                                            <span>{money(bar.value)}</span>
                                                        </div>
                                                        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                                                            <div className={`${bar.color} h-full rounded-full`} style={{ width: `${Math.max(6, (bar.value / maxFinanceValue) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-gray-400 font-medium">Belum ada data order untuk grafik.</div>
                        )}
                    </div>

                    <div className="rounded-[2rem] bg-white border border-gray-100 shadow-sm p-6 space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-black mb-2">Tracking Order</p>
                            <h3 className="text-2xl font-black">Butuh Diproses & Sedang Dikirim</h3>
                        </div>
                        <div className="grid gap-3">
                            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                                <p className="text-xs uppercase tracking-widest text-amber-700 font-black mb-1">Butuh Diproses</p>
                                <p className="text-3xl font-black text-amber-900">{pendingOrders.length}</p>
                            </div>
                            <div className="rounded-2xl bg-cyan-50 border border-cyan-100 p-4">
                                <p className="text-xs uppercase tracking-widest text-cyan-700 font-black mb-1">Sedang Dikirim</p>
                                <p className="text-3xl font-black text-cyan-900">{shippingOrders.length}</p>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600 leading-relaxed">
                            Nomer tracking ditampilkan di daftar order dan bisa diisi saat status diubah ke <span className="font-bold text-gray-900">Dikirim</span>.
                        </div>
                    </div>
                </section>

                <section className="grid xl:grid-cols-2 gap-6">
                    <form onSubmit={handleCreateProduct} className="rounded-[2rem] bg-white border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-black mb-2">Tambah Barang</p>
                                <h3 className="text-2xl font-black">Barang Baru</h3>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <input value={newProduct.name} onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nama barang" className="rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                            <input value={newProduct.category} onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))} placeholder="Kategori" className="rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                            <input type="number" value={newProduct.price} onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))} placeholder="Harga jual" className="rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                            <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))} placeholder="Stok awal" className="rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            <input value={newProduct.image} onChange={(e) => setNewProduct((prev) => ({ ...prev, image: e.target.value }))} placeholder="URL gambar" className="rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:col-span-2" />
                            <input value={newProduct.tag} onChange={(e) => setNewProduct((prev) => ({ ...prev, tag: e.target.value }))} placeholder="Label / tag" className="rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            <input type="number" value={newProduct.cost_price} onChange={(e) => setNewProduct((prev) => ({ ...prev, cost_price: e.target.value }))} placeholder="HPP / modal (opsional)" className="rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <button disabled={saving} className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black py-3 text-sm uppercase tracking-[0.2em] disabled:opacity-50">Tambah Produk</button>
                    </form>

                    <form onSubmit={handleCreateBanner} className="rounded-[2rem] bg-white border border-gray-100 shadow-sm p-6 space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-black mb-2">Banner Homepage</p>
                            <h3 className="text-2xl font-black">Tambah Banner</h3>
                        </div>
                        <div className="space-y-3">
                            <input value={newBanner.title} onChange={(e) => setNewBanner((prev) => ({ ...prev, title: e.target.value }))} placeholder="Judul banner" className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                            <input value={newBanner.image_url} onChange={(e) => setNewBanner((prev) => ({ ...prev, image_url: e.target.value }))} placeholder="URL gambar banner" className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                            <input value={newBanner.link_url} onChange={(e) => setNewBanner((prev) => ({ ...prev, link_url: e.target.value }))} placeholder="Link / teks tambahan" className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                <input type="checkbox" checked={newBanner.is_active} onChange={(e) => setNewBanner((prev) => ({ ...prev, is_active: e.target.checked }))} />
                                Aktifkan banner di homepage
                            </label>
                        </div>
                        <button disabled={saving} className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black py-3 text-sm uppercase tracking-[0.2em] disabled:opacity-50">Simpan Banner</button>
                        <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">Banner aktif akan tampil di hero homepage user.</div>
                    </form>
                </section>

                <section className="grid xl:grid-cols-2 gap-6">
                    <div className="rounded-[2rem] bg-white border border-gray-100 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-end justify-between gap-4 mb-5">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-black mb-2">Kelola Stok</p>
                                <h3 className="text-2xl font-black">Update Stok Barang</h3>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                            {products.map((product) => {
                                const draft = productStockDrafts[product.id] || { value: String(product.stock), mode: "set" as const };
                                return (
                                    <div key={product.id} className="rounded-2xl border border-gray-100 p-4 bg-gray-50/80 grid sm:grid-cols-[1.5fr_0.5fr_0.8fr_auto] gap-3 items-center">
                                        <div>
                                            <p className="font-black text-gray-900">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.category} • {money(product.price)}</p>
                                        </div>
                                        <input value={draft.value} onChange={(e) => setProductStockDrafts((prev) => ({ ...prev, [product.id]: { ...draft, value: e.target.value } }))} type="number" className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                        <select value={draft.mode} onChange={(e) => setProductStockDrafts((prev) => ({ ...prev, [product.id]: { ...draft, mode: e.target.value as "set" | "add" } }))} className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="set">Set</option>
                                            <option value="add">Tambah</option>
                                        </select>
                                        <button onClick={() => handleStockSave(product.id)} className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50" disabled={saving}>Simpan</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-[2rem] bg-white border border-gray-100 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-end justify-between gap-4 mb-5">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-black mb-2">Tracking Pesanan</p>
                                <h3 className="text-2xl font-black">Butuh Diproses & Sedang Dikirim</h3>
                            </div>
                        </div>
                        <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
                            {orders.map((order) => {
                                const draft = orderDrafts[order.id] || { status: order.status, tracking_number: order.tracking_number || "" };
                                return (
                                    <div key={order.id} className="rounded-2xl border border-gray-100 p-4 bg-gray-50/80 space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-black text-gray-900">Order #{order.id}</p>
                                                <p className="text-xs text-gray-500">{order.user_email} • {order.date}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-black ${order.status === "Diproses" ? "bg-amber-100 text-amber-700" : order.status === "Dikirim" ? "bg-cyan-100 text-cyan-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                {order.status}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">{order.customer_name || "-"} • {order.customer_phone || "-"}</p>
                                        <p className="text-sm text-gray-600 line-clamp-2">{order.shipping_address || "-"}</p>
                                        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
                                            <select value={draft.status} onChange={(e) => setOrderDrafts((prev) => ({ ...prev, [order.id]: { ...draft, status: e.target.value } }))} className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="Diproses">Diproses</option>
                                                <option value="Dikirim">Dikirim</option>
                                                <option value="Selesai">Selesai</option>
                                            </select>
                                            <input value={draft.tracking_number} onChange={(e) => setOrderDrafts((prev) => ({ ...prev, [order.id]: { ...draft, tracking_number: e.target.value } }))} placeholder="Nomor tracking" className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                            <button onClick={() => handleOrderSave(order.id)} className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={saving}>Simpan</button>
                                        </div>
                                        {draft.status === "Dikirim" && draft.tracking_number ? (
                                            <p className="text-xs text-cyan-700 font-bold">Tracking: {draft.tracking_number}</p>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="grid xl:grid-cols-2 gap-6">
                    <div className="rounded-[2rem] bg-white border border-gray-100 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-end justify-between gap-4 mb-5">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-black mb-2">Banner Aktif</p>
                                <h3 className="text-2xl font-black">Homepage Banner</h3>
                            </div>
                            <p className="text-sm text-gray-500">{banners.length} banner</p>
                        </div>
                        <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                            {banners.map((banner) => (
                                <div key={banner.id} className="rounded-2xl border border-gray-100 overflow-hidden">
                                    <img src={banner.image_url} alt={banner.title} className="h-36 w-full object-cover" />
                                    <div className="p-4 bg-gray-50">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-black text-gray-900">{banner.title}</p>
                                                <p className="text-xs text-gray-500 break-all">{banner.link_url || "-"}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${banner.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>{banner.is_active ? "Aktif" : "Nonaktif"}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!banners.length && <div className="py-12 text-center text-gray-400">Belum ada banner yang ditambahkan.</div>}
                        </div>
                    </div>

                    <div className="rounded-[2rem] bg-white border border-gray-100 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-end justify-between gap-4 mb-5">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-black mb-2">Ringkasan Order</p>
                                <h3 className="text-2xl font-black">Status Sekarang</h3>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {[
                                { label: "Diproses", value: stats?.needProcess || 0, color: "bg-amber-500" },
                                { label: "Dikirim", value: stats?.shipping || 0, color: "bg-cyan-500" },
                                { label: "Selesai", value: stats?.completed || 0, color: "bg-emerald-500" },
                            ].map((item) => (
                                <div key={item.label} className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                                    <div className={`h-2 w-16 rounded-full ${item.color} mb-4`} />
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">{item.label}</p>
                                    <p className="text-3xl font-black mt-2">{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900 leading-relaxed">
                            Bagian tracking hanya pakai nomor, jadi admin cukup isi status dan nomor resi. Tidak perlu map.
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}