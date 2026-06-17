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

// Memastikan format spesifik "Rp" ada di depan angka agar terbaca benar di sistem/Excel
const money = (value: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value || 0);

export default function AdminDashboardPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]" />;

    const menuItems = [
        { 
            id: "dashboard" as const, 
            label: "Dashboard Overview", 
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> 
        },
        { 
            id: "orders" as const, 
            label: "Data Pesanan", 
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> 
        },
        { 
            id: "stock" as const, 
            label: "Manajemen Stok", 
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> 
        },
        { 
            id: "banners" as const, 
            label: "Pengaturan Banner", 
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> 
        },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-900 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
            
            {/* Latar Belakang Berwarna - Ambient Glow Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-emerald-500/5 blur-[80px]" />
            </div>

            {/* TOAST NOTIFICATION */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-[60] animate-slide-in-right">
                    <div className={`rounded-xl px-4 py-3 min-w-[320px] shadow-2xl border ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${toast.type === "success" ? "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-gradient-to-br from-red-400 to-red-500 text-white shadow-lg shadow-red-500/30"}`}>
                                {toast.type === "success" ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
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

            {/* BACKDROP SIDEBAR MOBILE */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Tutup menu navigasi"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-40 lg:hidden"
                />
            )}

            {/* SIDEBAR */}
            <aside className={`w-64 bg-gradient-to-b from-[#0F172A] via-[#1e1b4b] to-[#0F172A] text-white flex-col flex fixed inset-y-0 z-50 shadow-2xl border-r border-indigo-500/10 transform transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
                <div className="h-16 flex items-center px-6 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full" />
                    <h1 className="text-2xl font-black italic tracking-tight select-none relative z-10">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Frozen</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-300">Shelly</span>
                    </h1>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-1">
                    <p className="px-3 text-[10px] font-bold text-indigo-300/50 uppercase tracking-widest mb-3 mt-4">Navigasi Sistem</p>
                    
                    {menuItems.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setSidebarOpen(false);
                            }}
                            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                                activeTab === item.id 
                                ? "bg-gradient-to-r from-indigo-600/80 to-blue-600/80 text-white shadow-lg shadow-indigo-500/20 font-semibold border border-indigo-400/20" 
                                : "text-slate-400 hover:bg-white/5 hover:text-white font-medium"
                            }`}
                        >
                            {activeTab === item.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                            )}
                            <div className={`${activeTab === item.id ? "text-cyan-200" : "text-slate-400 group-hover:text-indigo-300"} transition-colors duration-300`}>
                                {item.icon}
                            </div>
                            <span className="text-sm tracking-wide">{item.label}</span>
                        </div>
                    ))}
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64 relative z-10">
                
                {/* HEADER NAV */}
                <header className="h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0 flex-1 max-w-2xl">
                        <button
                            type="button"
                            aria-label="Buka menu navigasi"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white/90 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-300"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center bg-slate-100/80 rounded-xl px-4 py-2 w-full lg:w-72 border border-slate-200 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-md focus-within:shadow-indigo-500/5 transition-all duration-300">
                            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input type="text" placeholder="Pencarian cepat..." className="bg-transparent text-sm outline-none w-full placeholder-slate-400 text-slate-700" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name || "Administrator"}</p>
                            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">{user?.role || "Admin"}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/50">
                            {(user?.name || "A")[0].toUpperCase()}
                        </div>
                        <div className="w-px h-6 bg-slate-200 mx-1" />
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300" title="Keluar Sistem">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        
                        {/* === VIEW: DASHBOARD OVERVIEW === */}
                        {activeTab === "dashboard" && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Overview</h2>
                                        <p className="text-sm text-slate-500 mt-1">Ringkasan performa penjualan dan profitabilitas keuangan toko.</p>
                                    </div>
                                </div>

                                <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {/* Stats Card 1 */}
                                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Order</p>
                                                <p className="text-3xl font-black text-slate-800">{stats?.totalOrders || 0}</p>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Stats Card 2 */}
                                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Revenue</p>
                                                <p className="text-xl font-black text-emerald-600 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">{money(stats?.revenue || 0)}</p>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Card 3 */}
                                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Profit Bersih</p>
                                                <p className="text-xl font-black text-purple-600 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-fuchsia-500">{money(stats?.netProfit || 0)}</p>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Card 4 */}
                                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Perlu Diproses</p>
                                                <p className="text-3xl font-black text-amber-600">{stats?.needProcess || 0}</p>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* CHART SECTION - SEKARANG MENGGUNAKAN MODERN BAR CHART */}
                                <section className="grid lg:grid-cols-[1.8fr_1fr] gap-6">
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 flex flex-col justify-between">
                                        <div className="mb-6 flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800">Komparasi Finansial Bulanan</h3>
                                                <p className="text-xs text-slate-500 mt-1">Analisis visual volume pendapatan dan margin keuntungan (Bar Chart)</p>
                                            </div>
                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">Grafik Aktual</div>
                                        </div>

                                        {loading ? (
                                            <div className="py-24 text-center text-indigo-400 font-bold text-sm animate-pulse flex flex-col items-center gap-3">
                                                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Menganalisis Data Keuangan...
                                            </div>
                                        ) : (stats?.monthlyFinance?.length || 0) > 0 ? (
                                            <div className="relative h-[300px] w-full mt-2">
                                                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 250" preserveAspectRatio="none">
                                                    <defs>
                                                        {/* GRADASI WARNA UNTUK BATANG (BARS) */}
                                                        <linearGradient id="barRev" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#4f46e5" />
                                                            <stop offset="100%" stopColor="#818cf8" />
                                                        </linearGradient>
                                                        <linearGradient id="barGross" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#d97706" />
                                                            <stop offset="100%" stopColor="#fbbf24" />
                                                        </linearGradient>
                                                        <linearGradient id="barNet" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#059669" />
                                                            <stop offset="100%" stopColor="#34d399" />
                                                        </linearGradient>
                                                    </defs>

                                                    {/* GARIS BANTU HORIZONTAL (GRID) */}
                                                    {[0, 1, 2, 3, 4].map((i) => (
                                                        <line key={`grid-${i}`} x1="40" y1={50 + i * 40} x2="780" y2={50 + i * 40} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="6 4" />
                                                    ))}
                                                    <line x1="40" y1="210" x2="780" y2="210" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                                                    
                                                    {/* RENDER BATANG DIAGRAM (BARS) */}
                                                    {(() => {
                                                        const monthCount = stats?.monthlyFinance?.length || 1;
                                                        const slotWidth = 720 / monthCount;
                                                        const maxVal = Math.max(...(stats?.monthlyFinance?.map(e => Math.max(e.revenue, e.grossProfit, e.netProfit)) || [1]));

                                                        return stats?.monthlyFinance?.map((d, i) => {
                                                            const xCenter = 60 + (i * slotWidth) + (slotWidth / 2);
                                                            
                                                            // Kalkulasi tinggi batang
                                                            const revHeight = (d.revenue / maxVal) * 160;
                                                            const grossHeight = (d.grossProfit / maxVal) * 160;
                                                            const netHeight = (d.netProfit / maxVal) * 160;

                                                            // Mencegah tinggi negatif
                                                            const hR = Math.max(0, revHeight);
                                                            const hG = Math.max(0, grossHeight);
                                                            const hN = Math.max(0, netHeight);

                                                            // Lebar batang individual
                                                            const barW = Math.min(16, slotWidth / 4);

                                                            return (
                                                                <g key={`bar-group-${i}`} className="hover:opacity-80 transition-opacity cursor-pointer">
                                                                    {/* Latar Belakang Sorotan (Hover Effect Area) */}
                                                                    <rect x={xCenter - (barW * 2.5)} y="40" width={barW * 5} height="170" fill="#f8fafc" opacity="0" className="hover:opacity-100 transition-opacity" rx="8" />
                                                                    
                                                                    {/* Revenue Bar (Kiri) */}
                                                                    <rect x={xCenter - (barW * 1.8)} y={210 - hR} width={barW} height={hR} rx={barW/2} fill="url(#barRev)" />
                                                                    
                                                                    {/* Gross Profit Bar (Tengah) */}
                                                                    <rect x={xCenter - (barW * 0.5)} y={210 - hG} width={barW} height={hG} rx={barW/2} fill="url(#barGross)" />
                                                                    
                                                                    {/* Net Profit Bar (Kanan) */}
                                                                    <rect x={xCenter + (barW * 0.8)} y={210 - hN} width={barW} height={hN} rx={barW/2} fill="url(#barNet)" />

                                                                    {/* Label Sumbu X (Bulan) */}
                                                                    <text x={xCenter} y="235" textAnchor="middle" fontSize="12" fill="#64748b" className="font-extrabold tracking-widest">
                                                                        {d.month.substring(0, 3).toUpperCase()}
                                                                    </text>
                                                                </g>
                                                            );
                                                        });
                                                    })()}
                                                </svg>
                                                
                                                {/* KETERANGAN DIAGRAM (LEGEND) */}
                                                <div className="flex justify-center gap-6 mt-6 text-[11px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 py-3 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-indigo-500 to-indigo-400 shadow-sm" />
                                                        Revenue
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-amber-500 to-amber-400 shadow-sm" />
                                                        Gross Profit
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-emerald-500 to-emerald-400 shadow-sm" />
                                                        Net Profit
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                <svg className="w-14 h-14 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                <p className="text-sm font-bold">Data finansial bulanan belum tersedia.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* PROGRESS BAR KEUANGAN BULANAN */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 flex flex-col justify-between">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-black text-slate-800">Rincian Nominal</h3>
                                            <p className="text-xs text-slate-500 mt-1">Komparasi capaian nilai Rupiah secara spesifik</p>
                                        </div>

                                        {loading ? (
                                            <div className="flex-1 flex items-center justify-center text-indigo-400 font-bold text-sm animate-pulse">Memuat komparasi...</div>
                                        ) : (stats?.monthlyFinance?.length || 0) > 0 ? (
                                            <div className="flex-1 overflow-y-auto pr-2 space-y-5 max-h-[320px] custom-scrollbar">
                                                {stats?.monthlyFinance?.slice().reverse().map((entry) => {
                                                    const maxFinanceValue = Math.max(
                                                        ...(stats?.monthlyFinance?.map(e => Math.max(e.revenue, e.grossProfit, e.netProfit)) || [1])
                                                    );
                                                    return (
                                                        <div key={entry.month} className="bg-slate-50/70 p-4 rounded-xl border border-slate-100/80 hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                                                            <p className="text-xs font-black text-indigo-900 mb-3 uppercase tracking-widest">{entry.month}</p>
                                                            <div className="space-y-3">
                                                                {[
                                                                    { label: "Rev", value: entry.revenue, color: "bg-gradient-to-r from-indigo-500 to-blue-500 shadow-blue-500/30" },
                                                                    { label: "Gross", value: entry.grossProfit, color: "bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-500/30" },
                                                                    { label: "Net", value: entry.netProfit, color: "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-500/30" },
                                                                ].map((bar) => (
                                                                    <div key={bar.label} className="grid grid-cols-[40px_1fr_95px] gap-3 items-center">
                                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{bar.label}</span>
                                                                        <div className="h-2.5 rounded-full bg-slate-200/80 overflow-hidden shadow-inner">
                                                                            <div className={`${bar.color} h-full rounded-full shadow-lg transition-all duration-1000 ease-out`} style={{ width: `${Math.max(3, (bar.value / maxFinanceValue) * 100)}%` }} />
                                                                        </div>
                                                                        <span className="text-[10px] text-slate-800 font-black text-right tracking-wide">{money(bar.value)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-slate-400 font-bold text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">Data belum tersedia.</div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* === VIEW: DATA PESANAN === */}
                        {activeTab === "orders" && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data Pesanan</h2>
                                    <p className="text-sm text-slate-500 mt-1">Manajemen logistik pesanan, pengaturan status kurir, serta penginputan nomor resi.</p>
                                </div>
                                
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Antrean Distribusi</h3>
                                        <span className="text-xs font-black px-4 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg shadow-sm">{orders.length} Transaksi</span>
                                    </div>
                                    <div className="p-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-6 bg-slate-50/30">
                                        {orders.map((order) => {
                                            const draft = orderDrafts[order.id] || { status: order.status, tracking_number: order.tracking_number || "" };
                                            return (
                                                <div key={order.id} className="bg-white border-t-4 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-400 group relative">
                                                    <div className={`absolute top-0 left-0 w-full h-1 ${
                                                        order.status === "Diproses" ? "bg-amber-400" : 
                                                        order.status === "Dikirim" ? "bg-cyan-400" : "bg-emerald-400"
                                                    } rounded-t-xl`} />
                                                    
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">ID #{order.id}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider">{order.date}</p>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                                order.status === "Diproses" ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200" : 
                                                                order.status === "Dikirim" ? "bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 border border-cyan-200" : "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border border-emerald-200"
                                                            }`}>{order.status}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-600 mb-6 space-y-2.5">
                                                            <p className="truncate"><span className="font-bold text-indigo-400/80 uppercase text-[9px] tracking-wider block mb-0.5">Pelanggan Email</span> {order.user_email}</p>
                                                            <p><span className="font-bold text-indigo-400/80 uppercase text-[9px] tracking-wider block mb-0.5">Penerima & Kontak</span> {order.customer_name || "-"} <span className="text-slate-400">({order.customer_phone || "-"})</span></p>
                                                            <p className="line-clamp-2 leading-relaxed" title={order.shipping_address}><span className="font-bold text-indigo-400/80 uppercase text-[9px] tracking-wider block mb-0.5">Alamat Pengiriman</span> {order.shipping_address || "-"}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid gap-3 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 px-5 pb-1 rounded-b-xl">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Logistik</label>
                                                            <select 
                                                                value={draft.status} 
                                                                onChange={(e) => setOrderDrafts((prev) => ({ ...prev, [order.id]: { ...draft, status: e.target.value } }))} 
                                                                className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition-all shadow-sm"
                                                            >
                                                                <option value="Diproses">Diproses</option>
                                                                <option value="Dikirim">Dikirim</option>
                                                                <option value="Selesai">Selesai</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nomor Resi AWB</label>
                                                            <input 
                                                                value={draft.tracking_number} 
                                                                onChange={(e) => setOrderDrafts((prev) => ({ ...prev, [order.id]: { ...draft, tracking_number: e.target.value } }))} 
                                                                placeholder="Ketik nomor resi pengiriman" 
                                                                className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm font-medium" 
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={() => handleOrderSave(order.id)} 
                                                            disabled={saving}
                                                            className="w-full h-10 mt-1 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs font-bold hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 shadow-md transition-all duration-300 active:scale-[0.98]" 
                                                        >
                                                            Update Transaksi
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {orders.length === 0 && (
                                            <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400">
                                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                                                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                                </div>
                                                <p className="text-sm font-black tracking-widest uppercase">Belum Ada Pesanan</p>
                                                <p className="text-xs font-medium mt-2">Antrean pesanan kosong untuk saat ini.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === VIEW: MANAJEMEN STOK === */}
                        {activeTab === "stock" && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Stok & Katalog</h2>
                                    <p className="text-sm text-slate-500 mt-1">Pembaruan volume inventaris gudang dan penambahan entri komoditas baru.</p>
                                </div>

                                <div className="grid xl:grid-cols-[1fr_1.5fr] gap-8">
                                    <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 h-fit sticky top-24">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 border-b border-slate-100 pb-3">Formulir Komoditas Baru</h3>
                                        <div className="space-y-5 mb-8">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600">Nama Produk</label>
                                                <input value={newProduct.name} onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))} className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50 focus:bg-white font-medium" required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600">Kategori</label>
                                                    <input value={newProduct.category} onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))} className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50 focus:bg-white font-medium" required />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600">Stok Awal</label>
                                                    <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))} className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50 focus:bg-white font-medium" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600">Harga Jual</label>
                                                    <input type="number" value={newProduct.price} onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))} className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50 focus:bg-white font-medium" required />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600">Harga Modal</label>
                                                    <input type="number" value={newProduct.cost_price} onChange={(e) => setNewProduct((prev) => ({ ...prev, cost_price: e.target.value }))} placeholder="Opsional" className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50 focus:bg-white font-medium" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600">Label Tag / Atribut</label>
                                                <input value={newProduct.tag} onChange={(e) => setNewProduct((prev) => ({ ...prev, tag: e.target.value }))} placeholder="Contoh: Terlaris, Promo Spesial" className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50 focus:bg-white font-medium" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600">URL Gambar Aset</label>
                                                <input value={newProduct.image} onChange={(e) => setNewProduct((prev) => ({ ...prev, image: e.target.value }))} placeholder="https://domain.com/gambar.jpg" className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50 focus:bg-white font-medium" />
                                            </div>
                                        </div>
                                        <button disabled={saving} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl h-12 text-sm font-black tracking-wide shadow-lg shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5">
                                            Daftarkan Produk Baru
                                        </button>
                                    </form>

                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
                                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Mutasi Inventaris Barang</h3>
                                            <span className="text-xs font-black px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg shadow-sm">{products.length} SKU Aktif</span>
                                        </div>
                                        <div className="p-5 space-y-4 max-h-[720px] overflow-y-auto bg-slate-50/30 custom-scrollbar">
                                            {products.map((product) => {
                                                const draft = productStockDrafts[product.id] || { value: String(product.stock), mode: "set" as const };
                                                return (
                                                    <div key={product.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-5 shadow-sm hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
                                                        <div className="flex-1 min-w-[200px]">
                                                            <p className="text-base font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors" title={product.name}>{product.name}</p>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="text-[10px] font-black tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase border border-slate-200">{product.category}</span>
                                                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                                                    Sisa Stok: 
                                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-black ${product.stock <= 5 ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}>
                                                                        {product.stock}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 w-full sm:w-auto bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                                            <select 
                                                                value={draft.mode} 
                                                                onChange={(e) => setProductStockDrafts((prev) => ({ ...prev, [product.id]: { ...draft, mode: e.target.value as "set" | "add" } }))} 
                                                                className="h-10 w-28 rounded-lg bg-white border border-slate-200 px-2 text-xs font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition-colors shadow-sm"
                                                            >
                                                                <option value="set">Ubah Jadi</option>
                                                                <option value="add">Tambah (+)</option>
                                                            </select>
                                                            <input 
                                                                type="number"
                                                                value={draft.value} 
                                                                onChange={(e) => setProductStockDrafts((prev) => ({ ...prev, [product.id]: { ...draft, value: e.target.value } }))} 
                                                                className="h-10 w-20 text-center rounded-lg bg-white border border-slate-200 px-2 text-sm font-black outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm" 
                                                            />
                                                            <button 
                                                                onClick={() => handleStockSave(product.id)} 
                                                                disabled={saving}
                                                                className="h-10 px-5 flex items-center justify-center rounded-lg bg-slate-800 text-white font-black tracking-wide text-xs hover:bg-indigo-600 transition-all duration-300 shadow-md active:scale-[0.95]" 
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {products.length === 0 && (
                                                <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                                                        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                    </div>
                                                    <p className="text-sm font-black tracking-widest uppercase">Katalog Kosong</p>
                                                    <p className="text-xs font-medium mt-2">Belum ada produk terdaftar dalam database.</p>
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
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pengaturan Banner Iklan</h2>
                                    <p className="text-sm text-slate-500 mt-1">Pengendalian konten visual karosel promosi utama pada beranda aplikasi.</p>
                                </div>

                                <div className="grid lg:grid-cols-2 gap-8">
                                    <form onSubmit={handleCreateBanner} className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 h-fit relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 border-b border-slate-100 pb-3 mt-2">Registrasi Banner Utama</h3>
                                        
                                        <div className="space-y-5 mb-8">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600">Judul / Tema Kampanye</label>
                                                <input value={newBanner.title} onChange={(e) => setNewBanner((prev) => ({ ...prev, title: e.target.value }))} className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all bg-slate-50 focus:bg-white font-medium" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600">URL Gambar Banner (Resolusi Lebar)</label>
                                                <input value={newBanner.image_url} onChange={(e) => setNewBanner((prev) => ({ ...prev, image_url: e.target.value }))} placeholder="https://domain.com/banner-promo.jpg" className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all bg-slate-50 focus:bg-white font-medium" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600">Tautan Pengalihan (Redirect Link URL)</label>
                                                <input value={newBanner.link_url} onChange={(e) => setNewBanner((prev) => ({ ...prev, link_url: e.target.value }))} placeholder="Opsional: Tautan jika diklik" className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all bg-slate-50 focus:bg-white font-medium" />
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-6 p-4 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 shadow-inner">
                                                <div className="relative flex items-center">
                                                    <input type="checkbox" id="active_banner" checked={newBanner.is_active} onChange={(e) => setNewBanner((prev) => ({ ...prev, is_active: e.target.checked }))} className="peer w-6 h-6 text-purple-600 bg-white border-slate-300 rounded cursor-pointer focus:ring-purple-500 focus:ring-offset-0" />
                                                </div>
                                                <label htmlFor="active_banner" className="text-[11px] font-black text-slate-700 cursor-pointer select-none uppercase tracking-widest leading-snug">
                                                    Aktifkan Visual Pada Beranda
                                                    <span className="block text-xs font-medium text-slate-500 normal-case tracking-normal mt-0.5">Pengguna akan langsung melihat ini di urutan rotasi karosel.</span>
                                                </label>
                                            </div>
                                        </div>
                                        <button disabled={saving} className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl h-12 text-sm font-black tracking-wide shadow-lg shadow-slate-900/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-50">
                                            Terbitkan Banner Promosi
                                        </button>
                                    </form>

                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
                                        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Aset Visual Tersimpan</h3>
                                            <span className="text-xs font-black px-4 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg shadow-sm">{banners.length} Terdaftar</span>
                                        </div>
                                        <div className="p-5 space-y-5 max-h-[600px] overflow-y-auto bg-slate-50/30 custom-scrollbar">
                                            {banners.map((banner) => (
                                                <div key={banner.id} className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl border border-slate-200 shadow-sm bg-white hover:border-purple-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                                    <div className="w-full sm:w-48 h-28 shrink-0 overflow-hidden rounded-xl shadow-inner border border-slate-100 bg-slate-100 relative group-hover:shadow-purple-500/20 transition-shadow">
                                                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        {banner.is_active && (
                                                            <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] border border-white/50 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left">
                                                        <p className="text-base font-black text-slate-800 truncate mb-1">{banner.title}</p>
                                                        <p className="text-[11px] font-medium text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100 truncate" title={banner.link_url || "Tidak ada rujukan"}>
                                                            <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block mb-0.5">Tautan Rujukan:</span>
                                                            {banner.link_url || "Tidak ada link terpasang"}
                                                        </p>
                                                        <div className="mt-4 flex justify-center sm:justify-start">
                                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border shadow-sm ${
                                                                banner.is_active 
                                                                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200' 
                                                                : 'bg-slate-100 text-slate-400 border-slate-200'
                                                            }`}>
                                                                {banner.is_active ? 'Visibilitas: Aktif' : 'Status: Diarsipkan'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {banners.length === 0 && (
                                                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                                                        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                    <p className="text-sm font-black tracking-widest uppercase">Visual Promosi Kosong</p>
                                                    <p className="text-xs font-medium mt-2">Belum ada aset banner yang siap dipublikasikan.</p>
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
            
            {/* CSS untuk Scrollbar Kustom biar gak jelek */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
            `}} />
        </div>
    );
}