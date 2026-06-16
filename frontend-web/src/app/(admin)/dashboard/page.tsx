"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSocket, joinSocketContext } from "@/lib/socket";

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
    
    const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "stock" | "banners">("dashboard");

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

            const socket = getSocket();

            const handleConnect = () => {
                joinSocketContext({ role: "admin", email: parsedUser.email });
            };

            const handleOrderCreated = () => {
                loadDashboard();
            };

            const handleOrderStatusUpdated = () => {
                loadDashboard();
            };

            const handleDashboardStatsUpdated = (payload: DashboardStats) => {
                setStats(payload);
            };

            const handleStockUpdated = (payload: Product) => {
                if (!payload?.id) return;
                setProducts((prevProducts) =>
                    prevProducts.map((product) =>
                        product.id === payload.id ? { ...product, stock: payload.stock } : product
                    )
                );
            };

            socket.on("connect", handleConnect);
            socket.on("order_created", handleOrderCreated);
            socket.on("order_status_updated", handleOrderStatusUpdated);
            socket.on("dashboard_stats_updated", handleDashboardStatsUpdated);
            socket.on("stock_updated", handleStockUpdated);

            if (socket.connected) {
                handleConnect();
            }

            return () => {
                socket.off("connect", handleConnect);
                socket.off("order_created", handleOrderCreated);
                socket.off("order_status_updated", handleOrderStatusUpdated);
                socket.off("dashboard_stats_updated", handleDashboardStatsUpdated);
                socket.off("stock_updated", handleStockUpdated);
            };
        } catch {
            router.push("/auth/login");
        }
    }, [router]);

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
            
            setOrders((prevOrders) => 
                prevOrders.map((order) => 
                    order.id === orderId ? { ...order, status: draft.status, tracking_number: draft.tracking_number } : order
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

    if (!mounted) return <div className="min-h-screen bg-[#F3F4F6]" />;

    const menuItems = [
        { 
            id: "dashboard" as const, 
            label: "Dashboard Overview", 
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> 
        },
        { 
            id: "orders" as const, 
            label: "Data Pesanan", 
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> 
        },
        { 
            id: "stock" as const, 
            label: "Manajemen Stok", 
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> 
        },
        { 
            id: "banners" as const, 
            label: "Pengaturan Banner", 
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> 
        },
    ];

    return (
        <div className="min-h-screen bg-[#F3F4F6] flex font-sans text-gray-900 selection:bg-blue-500 selection:text-white">
            
            {/* TOAST NOTIFICATION */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-[60] animate-slide-in-right">
                    <div className={`rounded-xl px-4 py-3 min-w-[320px] shadow-2xl border ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${toast.type === "success" ? "bg-emerald-100/80 text-emerald-700" : "bg-red-100/80 text-red-700"}`}>
                                {toast.type === "success" ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{toast.type === "success" ? "Berhasil" : "Gagal"}</p>
                                <p className="text-sm font-semibold">{toast.message}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SIDEBAR */}
            <aside className="w-64 bg-[#0F172A] text-white flex-col hidden lg:flex fixed inset-y-0 z-50 shadow-xl">
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <h1 className="text-2xl font-black italic tracking-tight select-none">
                        <span className="text-blue-500">Frozen</span>
                        <span className="text-cyan-400">Shelly</span>
                    </h1>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-1">
                    <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 mt-4">Menu Utama</p>
                    
                    {menuItems.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden group ${
                                activeTab === item.id 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 font-semibold" 
                                : "text-gray-400 hover:bg-white/5 hover:text-white font-medium"
                            }`}
                        >
                            {activeTab === item.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-r-full" />
                            )}
                            <div className={`${activeTab === item.id ? "text-cyan-300" : "text-gray-400 group-hover:text-white"} transition-colors`}>
                                {item.icon}
                            </div>
                            <span className="text-sm tracking-wide">{item.label}</span>
                        </div>
                    ))}
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64 bg-[#F3F4F6]">
                
                {/* HEADER NAV */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm shadow-gray-100">
                    <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 w-64 border border-gray-200 focus-within:border-blue-400 focus-within:bg-white transition-all">
                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Cari di dashboard..." className="bg-transparent text-sm outline-none w-full placeholder-gray-400 text-gray-700" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{user?.name || "Administrator"}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user?.role || "Admin"}</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                            {(user?.name || "A")[0].toUpperCase()}
                        </div>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Keluar Sistem">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        
                        {/* === VIEW: DASHBOARD OVERVIEW === */}
                        {activeTab === "dashboard" && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard Overview</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Ringkasan performa penjualan, profitabilitas keuangan, dan antrean kerja.</p>
                                </div>

                                <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Order</p>
                                            <p className="text-2xl font-black text-gray-800">{stats?.totalOrders || 0}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Revenue</p>
                                            <p className="text-2xl font-black text-gray-800">{money(stats?.revenue || 0)}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0九 9 0 0118 0z" /></svg>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Profit Bersih</p>
                                            <p className="text-2xl font-black text-gray-800">{money(stats?.netProfit || 0)}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Perlu Diproses</p>
                                            <p className="text-2xl font-black text-gray-800">{stats?.needProcess || 0}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-gray-800">Trend Keuangan</h3>
                                            <p className="text-xs text-gray-400">Analisis visual periodik kurva pendapatan dan profitabilitas</p>
                                        </div>

                                        {loading ? (
                                            <div className="py-24 text-center text-gray-400 font-medium text-sm animate-pulse">Memuat data grafik keuangan...</div>
                                        ) : (stats?.monthlyFinance?.length || 0) > 0 ? (
                                            <div className="relative h-[280px] w-full mt-2">
                                                <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                                                    <defs>
                                                        <linearGradient id="areaRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                                                        </linearGradient>
                                                        <linearGradient id="areaGross" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                                                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
                                                        </linearGradient>
                                                        <linearGradient id="areaNet" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                                                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                                                        </linearGradient>
                                                    </defs>

                                                    {/* Grid Lines */}
                                                    {[0, 1, 2, 3, 4].map((i) => (
                                                        <line key={`grid-${i}`} x1="40" y1={50 + i * 50} x2="780" y2={50 + i * 50} stroke="#f8fafc" strokeWidth="1.5" />
                                                    ))}
                                                    <line x1="40" y1="30" x2="40" y2="210" stroke="#f1f5f9" strokeWidth="1" />
                                                    <line x1="40" y1="210" x2="780" y2="210" stroke="#f1f5f9" strokeWidth="1" />
                                                    
                                                    {/* AREA SHADING (PROFIT/REVENUE VOLUME) */}
                                                    {/* Revenue Area */}
                                                    {(() => {
                                                        const pts = stats?.monthlyFinance?.map((d, i) => {
                                                            const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                                            const maxRev = Math.max(...(stats?.monthlyFinance?.map(e => e.revenue) || [1]));
                                                            return `${x},${210 - ((d.revenue / maxRev) * 170)}`;
                                                        }) || [];
                                                        return pts.length ? <polygon points={`60,210 ${pts.join(' ')} ${60 + (pts.length - 1) * 720 / (pts.length - 1 || 1)},210`} fill="url(#areaRevenue)" /> : null;
                                                    })()}

                                                    {/* Gross Shading */}
                                                    {(() => {
                                                        const pts = stats?.monthlyFinance?.map((d, i) => {
                                                            const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                                            const maxProfit = Math.max(...(stats?.monthlyFinance?.map(e => e.grossProfit) || [1]));
                                                            return `${x},${210 - ((d.grossProfit / maxProfit) * 170)}`;
                                                        }) || [];
                                                        return pts.length ? <polygon points={`60,210 ${pts.join(' ')} ${60 + (pts.length - 1) * 720 / (pts.length - 1 || 1)},210`} fill="url(#areaGross)" /> : null;
                                                    })()}

                                                    {/* Net Shading */}
                                                    {(() => {
                                                        const pts = stats?.monthlyFinance?.map((d, i) => {
                                                            const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                                            const maxNet = Math.max(...(stats?.monthlyFinance?.map(e => e.netProfit) || [1]));
                                                            return `${x},${210 - ((d.netProfit / maxNet) * 170)}`;
                                                        }) || [];
                                                        return pts.length ? <polygon points={`60,210 ${pts.join(' ')} ${60 + (pts.length - 1) * 720 / (pts.length - 1 || 1)},210`} fill="url(#areaNet)" /> : null;
                                                    })()}

                                                    {/* LINES */}
                                                    <polyline
                                                        points={stats?.monthlyFinance?.map((d, i) => {
                                                            const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                                            const maxRev = Math.max(...(stats?.monthlyFinance?.map(e => e.revenue) || [1]));
                                                            return `${x},${210 - ((d.revenue / maxRev) * 170)}`;
                                                        }).join(' ')}
                                                        fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                                    />
                                                    <polyline
                                                        points={stats?.monthlyFinance?.map((d, i) => {
                                                            const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                                            const maxProfit = Math.max(...(stats?.monthlyFinance?.map(e => e.grossProfit) || [1]));
                                                            return `${x},${210 - ((d.grossProfit / maxProfit) * 170)}`;
                                                        }).join(' ')}
                                                        fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                                    />
                                                    <polyline
                                                        points={stats?.monthlyFinance?.map((d, i) => {
                                                            const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                                            const maxNet = Math.max(...(stats?.monthlyFinance?.map(e => e.netProfit) || [1]));
                                                            return `${x},${210 - ((d.netProfit / maxNet) * 170)}`;
                                                        }).join(' ')}
                                                        fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                                    />

                                                    {/* CIRCLE DOTS */}
                                                    {stats?.monthlyFinance?.map((d, i) => {
                                                        const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                                        const maxRev = Math.max(...(stats?.monthlyFinance?.map(e => e.revenue) || [1]));
                                                        const maxProfit = Math.max(...(stats?.monthlyFinance?.map(e => e.grossProfit) || [1]));
                                                        const maxNet = Math.max(...(stats?.monthlyFinance?.map(e => e.netProfit) || [1]));
                                                        return (
                                                            <g key={`points-${i}`}>
                                                                <circle cx={x} cy={210 - ((d.revenue / maxRev) * 170)} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2.5" />
                                                                <circle cx={x} cy={210 - ((d.grossProfit / maxProfit) * 170)} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="2.5" />
                                                                <circle cx={x} cy={210 - ((d.netProfit / maxNet) * 170)} r="4" fill="#10b981" stroke="#fff" strokeWidth="2.5" />
                                                            </g>
                                                        );
                                                    })}

                                                    {/* AXIS LABELS */}
                                                    {stats?.monthlyFinance?.map((d, i) => {
                                                        const x = 60 + (i * 720 / ((stats?.monthlyFinance?.length || 1) - 1 || 1));
                                                        return (
                                                            <text key={`label-${i}`} x={x} y="235" textAnchor="middle" fontSize="11" fill="#94a3b8" className="font-semibold tracking-wider">
                                                                {d.month.substring(0, 3).toUpperCase()}
                                                            </text>
                                                        );
                                                    })}
                                                </svg>
                                                
                                                <div className="flex justify-center gap-6 mt-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />Revenue</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />Gross Profit</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />Net Profit</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                                <svg className="w-14 h-14 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                <p className="text-sm font-medium">Data finansial bulanan belum tersedia.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-gray-800">Detail Bulanan</h3>
                                            <p className="text-xs text-gray-400">Rincian komparasi pendapatan bersih</p>
                                        </div>

                                        {loading ? (
                                            <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-sm">Memuat data komparasi...</div>
                                        ) : (stats?.monthlyFinance?.length || 0) > 0 ? (
                                            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[280px]">
                                                {stats?.monthlyFinance?.slice().reverse().map((entry) => {
                                                    const maxFinanceValue = Math.max(
                                                        ...(stats?.monthlyFinance?.map(e => Math.max(e.revenue, e.grossProfit, e.netProfit)) || [1])
                                                    );
                                                    return (
                                                        <div key={entry.month} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                                            <p className="text-xs font-black text-slate-700 mb-2 uppercase tracking-wider">{entry.month}</p>
                                                            <div className="space-y-2">
                                                                {[
                                                                    { label: "Rev", value: entry.revenue, color: "bg-gradient-to-r from-blue-400 to-blue-600" },
                                                                    { label: "Gross", value: entry.grossProfit, color: "bg-gradient-to-r from-amber-400 to-amber-500" },
                                                                    { label: "Net", value: entry.netProfit, color: "bg-gradient-to-r from-emerald-400 to-emerald-600" },
                                                                ].map((bar) => (
                                                                    <div key={bar.label} className="grid grid-cols-[40px_1fr_85px] gap-2 items-center">
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{bar.label}</span>
                                                                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                                                                            <div className={`${bar.color} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.max(3, (bar.value / maxFinanceValue) * 100)}%` }} />
                                                                        </div>
                                                                        <span className="text-[10px] text-slate-700 font-black text-right tracking-wide">{money(bar.value)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-sm">Data belum tersedia.</div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* === VIEW: DATA PESANAN === */}
                        {activeTab === "orders" && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Data Pesanan</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Manajemen logistik pesanan, pengaturan status kurir, serta penginputan nomor resi.</p>
                                </div>
                                
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                                    <div className="p-5 border-b border-gray-100 bg-gray-50/70 rounded-t-xl flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Antrean Distribusi</h3>
                                        <span className="text-xs font-black px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">{orders.length} Transaksi</span>
                                    </div>
                                    <div className="p-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                        {orders.map((order) => {
                                            const draft = orderDrafts[order.id] || { status: order.status, tracking_number: order.tracking_number || "" };
                                            return (
                                                <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 Richmond pb-3">
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900">ID #{order.id}</p>
                                                                <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{order.date}</p>
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest ${
                                                                order.status === "Diproses" ? "bg-amber-50 text-amber-700 border border-amber-200" : 
                                                                order.status === "Dikirim" ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            }`}>{order.status}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-600 mb-5 space-y-2">
                                                            <p className="truncate"><span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block">Pelanggan</span> {order.user_email}</p>
                                                            <p><span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block">Penerima</span> {order.customer_name || "-"} ({order.customer_phone || "-"})</p>
                                                            <p className="line-clamp-2" title={order.shipping_address}><span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block">Alamat Pengiriman</span> {order.shipping_address || "-"}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid gap-2 pt-3 border-t border-slate-100">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Logistik</label>
                                                            <select 
                                                                value={draft.status} 
                                                                onChange={(e) => setOrderDrafts((prev) => ({ ...prev, [order.id]: { ...draft, status: e.target.value } }))} 
                                                                className="w-full h-9 rounded-lg bg-slate-50 border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white text-slate-700 transition-colors"
                                                            >
                                                                <option value="Diproses">Diproses</option>
                                                                <option value="Dikirim">Dikirim</option>
                                                                <option value="Selesai">Selesai</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nomor Resi AWB</label>
                                                            <input 
                                                                value={draft.tracking_number} 
                                                                onChange={(e) => setOrderDrafts((prev) => ({ ...prev, [order.id]: { ...draft, tracking_number: e.target.value } }))} 
                                                                placeholder="Masukkan nomor tracking resi" 
                                                                className="w-full h-9 rounded-lg bg-white border border-slate-200 px-3 text-xs outline-none focus:border-blue-500 transition-colors" 
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={() => handleOrderSave(order.id)} 
                                                            disabled={saving}
                                                            className="w-full h-9 mt-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 shadow-sm transition-all active:scale-[0.98]" 
                                                        >
                                                            Update Transaksi
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {orders.length === 0 && (
                                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                                                <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                                <p className="text-sm font-semibold tracking-wide">Belum ada antrean pesanan masuk saat ini.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === VIEW: MANAJEMEN STOK === */}
                        {activeTab === "stock" && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Manajemen Stok & Katalog</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Pembaruan volume inventaris gudang dan penambahan entri komoditas baru.</p>
                                </div>

                                <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
                                    <form onSubmit={handleCreateProduct} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-fit sticky top-24">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-5 border-b border-slate-100 pb-3">Formulir Komoditas Baru</h3>
                                        <div className="space-y-4 mb-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-600">Nama Produk</label>
                                                <input value={newProduct.name} onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-600">Kategori</label>
                                                    <input value={newProduct.category} onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-600">Kuantitas Stok Awal</label>
                                                    <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-600">Harga Jual Konsumen</label>
                                                    <input type="number" value={newProduct.price} onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-600">Harga Pokok (HPP / Modal)</label>
                                                    <input type="number" value={newProduct.cost_price} onChange={(e) => setNewProduct((prev) => ({ ...prev, cost_price: e.target.value }))} placeholder="Opsional" className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-600">Label Tag Atribut</label>
                                                <input value={newProduct.tag} onChange={(e) => setNewProduct((prev) => ({ ...prev, tag: e.target.value }))} placeholder="Contoh: Terlaris, Promo Spesial" className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-600">Tautan Gambar Aset (URL)</label>
                                                <input value={newProduct.image} onChange={(e) => setNewProduct((prev) => ({ ...prev, image: e.target.value }))} placeholder="https://domain.com/gambar.jpg" className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                            </div>
                                        </div>
                                        <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-11 text-sm font-bold shadow-md shadow-blue-500/10 transition-colors disabled:opacity-50">
                                            Daftarkan Produk Baru
                                        </button>
                                    </form>

                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70 rounded-t-xl">
                                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Mutasi Inventaris Barang</h3>
                                            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">{products.length} SKU Aktif</span>
                                        </div>
                                        <div className="p-5 space-y-3 max-h-[640px] overflow-y-auto">
                                            {products.map((product) => {
                                                const draft = productStockDrafts[product.id] || { value: String(product.stock), mode: "set" as const };
                                                return (
                                                    <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5">
                                                        <div className="flex-1 min-w-[160px]">
                                                            <p className="text-sm font-bold text-slate-800 truncate" title={product.name}>{product.name}</p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-[10px] font-black tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">{product.category}</span>
                                                                <span className="text-xs text-slate-500">Stok: <span className={`font-black ${product.stock <= 5 ? "text-red-500 font-extrabold" : "text-slate-800"}`}>{product.stock}</span></span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                                            <select 
                                                                value={draft.mode} 
                                                                onChange={(e) => setProductStockDrafts((prev) => ({ ...prev, [product.id]: { ...draft, mode: e.target.value as "set" | "add" } }))} 
                                                                className="h-9 w-24 rounded-lg bg-slate-50 border border-slate-200 px-2 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white text-slate-700 transition-colors"
                                                            >
                                                                <option value="set">Set Stok</option>
                                                                <option value="add">Tambah (+)</option>
                                                            </select>
                                                            <input 
                                                                type="number"
                                                                value={draft.value} 
                                                                onChange={(e) => setProductStockDrafts((prev) => ({ ...prev, [product.id]: { ...draft, value: e.target.value } }))} 
                                                                className="h-9 w-16 text-center rounded-lg bg-slate-50 border border-slate-200 px-2 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white" 
                                                            />
                                                            <button 
                                                                onClick={() => handleStockSave(product.id)} 
                                                                disabled={saving}
                                                                className="h-9 px-4 flex items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-sm active:scale-[0.97]" 
                                                            >
                                                                Simpan
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {products.length === 0 && (
                                                <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                                                    <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                    <p className="text-sm font-semibold tracking-wide">Katalog master produk masih kosong.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === VIEW: PENGATURAN BANNER === */}
                        {activeTab === "banners" && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Pengaturan Banner</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Pengendalian konten visual karosel promosi utama pada beranda aplikasi klien.</p>
                                </div>

                                <div className="grid lg:grid-cols-2 gap-6">
                                    <form onSubmit={handleCreateBanner} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-fit">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-5 border-b border-slate-100 pb-3">Registrasi Banner Utama</h3>
                                        <div className="space-y-4 mb-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-600">Judul / Kampanye Kampanye</label>
                                                <input value={newBanner.title} onChange={(e) => setNewBanner((prev) => ({ ...prev, title: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-600">Tautan Gambar Banner (URL)</label>
                                                <input value={newBanner.image_url} onChange={(e) => setNewBanner((prev) => ({ ...prev, image_url: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-600">Tautan Pengalihan (Redirect Link URL)</label>
                                                <input value={newBanner.link_url} onChange={(e) => setNewBanner((prev) => ({ ...prev, link_url: e.target.value }))} placeholder="Opsional: Tautan rujukan promo" className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                            </div>
                                            <div className="flex items-center gap-3 mt-4 p-3 rounded-xl border border-blue-100 bg-blue-50/40">
                                                <input type="checkbox" id="active_banner" checked={newBanner.is_active} onChange={(e) => setNewBanner((prev) => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                                                <label htmlFor="active_banner" className="text-xs font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wide">Aktifkan Visual Pada Komponen Utama Beranda</label>
                                            </div>
                                        </div>
                                        <button disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-11 text-sm font-bold transition-all active:scale-[0.99] disabled:opacity-50">
                                            Terbitkan Banner Promosi
                                        </button>
                                    </form>

                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                                        <div className="p-5 border-b border-gray-100 bg-gray-50/70 rounded-t-xl flex justify-between items-center">
                                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Aset Visual Promosi</h3>
                                            <span className="text-xs font-bold px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg">{banners.length} Promo Terdaftar</span>
                                        </div>
                                        <div className="p-5 space-y-4 max-h-[540px] overflow-y-auto">
                                            {banners.map((banner) => (
                                                <div key={banner.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5">
                                                    <img src={banner.image_url} alt={banner.title} className="w-full sm:w-36 h-20 object-cover rounded-lg shadow-inner border border-slate-100 bg-slate-50" />
                                                    <div className="flex-1 min-w-0 text-center sm:text-left">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{banner.title}</p>
                                                        <p className="text-xs text-slate-400 truncate mt-1">{banner.link_url || "Tidak ada link tautan eksternal"}</p>
                                                        <div className="mt-3 flex justify-center sm:justify-start">
                                                            <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border ${
                                                                banner.is_active 
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                : 'bg-slate-50 text-slate-400 border-slate-200'
                                                            }`}>
                                                                {banner.is_active ? 'Status: Live Aktif' : 'Status: Off / Arsip'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {banners.length === 0 && (
                                                <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                                                    <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <p className="text-sm font-semibold tracking-wide">Belum ada aset visual banner iklan yang disimpan.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}