"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [banner, setBanner] = useState<any>(null);

  // State untuk Data Produk dari API Backend
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Filter & Pencarian
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    
    // 1. Cek status login
    const user = localStorage.getItem("user"); 
    if (user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setUserName(userData.name || "User");
      } catch (error) {
        console.error("Gagal membaca data user:", error);
      }
    }

    // 2. Fetch data produk dari Backend
    const fetchProducts = async () => {
      try {
        setError(null);
        const response = await fetch("http://localhost:5000/api/products");
        if (response.ok) {
          const data = await response.json();
          // Set fallback values for reviews/sold sekali saat fetch agar tidak berubah tiap render
          const rows = (data.data || data).map((p: any) => ({
            ...p,
            reviews: p.reviews ?? Math.floor(Math.random() * 50) + 10,
            sold: p.sold ?? Math.floor(Math.random() * 100) + 20,
          }));
          setProducts(rows);
          setError(null);
        } else {
          const errorMsg = `Gagal mengambil data produk (${response.status})`;
          setError(errorMsg);
          setProducts([]);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Gagal terhubung ke server. Pastikan backend sedang berjalan di http://localhost:5000";
        setError(errorMsg);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    const fetchBanner = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/banners/active");
        if (response.ok) {
          const data = await response.json();
          setBanner(data.data?.[0] || null);
        }
      } catch (error) {
        console.error("Gagal mengambil banner:", error);
      }
    };

    fetchBanner();
  }, []);

  // Fungsi utilitas untuk format harga angka (misal: 45000) menjadi "Rp 45.000"
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const categories = [
    { name: "Semua", icon: "🍱" },
    { name: "Ayam", icon: "🍗" },
    { name: "Daging", icon: "🥩" },
    { name: "Seafood", icon: "🐟" },
    { name: "Camilan", icon: "🍟" },
  ];

  // Logika Filtering (dijalankan pada data 'products' yang sudah di-fetch)
  const filteredProducts = products.filter((product) => {
    const matchCategory = activeCategory === "Semua" || product.category === activeCategory;
    
    let matchPrice = true;
    const priceNum = Number(product.price); // Pastikan harga menjadi angka
    if (priceFilter === "under50") matchPrice = priceNum < 50000;
    else if (priceFilter === "above50") matchPrice = priceNum >= 50000;

    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchPrice && matchSearch;
  });

  // Apply sorting / special filters
  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    switch (sortOption) {
      case 'price-asc':
        return arr.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price-desc':
        return arr.sort((a, b) => Number(b.price) - Number(a.price));
      case 'reviews-desc':
        return arr.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
      case 'reviews-asc':
        return arr.sort((a, b) => (a.reviews || 0) - (b.reviews || 0));
      case 'trending':
        return arr.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      case 'promo':
        return arr.filter(p => (p.tag && String(p.tag).toLowerCase().includes('promo')) || Number(p.price) < 30000).sort((a,b) => Number(a.price) - Number(b.price));
      default:
        return arr;
    }
  }, [filteredProducts, sortOption]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5000/api/products");
      if (response.ok) {
        const data = await response.json();
        const rows = (data.data || data).map((p: any) => ({
          ...p,
          reviews: p.reviews ?? Math.floor(Math.random() * 50) + 10,
          sold: p.sold ?? Math.floor(Math.random() * 100) + 20,
        }));
        setProducts(rows);
        setError(null);
      } else {
        setError(`Gagal mengambil data produk (${response.status})`);
        setProducts([]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Gagal terhubung ke server. Pastikan backend sedang berjalan di http://localhost:5000";
      setError(errorMsg);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const closeError = () => {
    setError(null);
  };

  if (!mounted) return <div className="min-h-screen bg-white"></div>;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent italic">
            FrozenShelly
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* ICON HISTORY (BOX) */}
            {isLoggedIn && (
              <Link href="/history" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors group" title="Riwayat Pesanan">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </Link>
            )}

            <Link href="/cart" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Halo,</span>
                  <Link href="/history" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                    {userName}
                  </Link>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2 rounded-full transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-2 border-l pl-4 border-gray-200">
                <Link href="/auth/login" className="text-sm font-bold px-4 py-2 text-gray-700 hover:text-blue-600">Masuk</Link>
                <Link href="/auth/register" className="text-sm font-bold px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-100 hover:bg-blue-700">Daftar</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-md flex items-center justify-between animate-slide-down">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-bold text-red-800 text-sm">Terjadi Kesalahan</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Coba Lagi
              </button>
              <button
                onClick={closeError}
                className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {/* HERO BANNER */}
        <section className="relative h-[250px] sm:h-[300px] rounded-[2rem] overflow-hidden mb-12 bg-gray-900 shadow-2xl">
          <img
            src={banner?.image_url || "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop"}
            className="object-cover w-full h-full brightness-50 absolute"
            alt={banner?.title || "Banner"}
          />
          <div className="relative z-10 h-full flex flex-col justify-center px-10 text-white">
            <h2 className="text-3xl sm:text-5xl font-black mb-2 uppercase tracking-tighter">
              {banner?.title || <>Beli Banyak, <br/> Stok Aman!</>}
            </h2>
            <p className="text-blue-100 font-medium">
              {banner?.link_url ? "Klik banner untuk detail promo." : "Gratis ongkir khusus wilayah Jabodetabek."}
            </p>
          </div>
        </section>

        {/* --- FILTER & SEARCH SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-white sticky top-16 z-40 py-2">
          {/* Kategori */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full border text-sm font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat.name ? "bg-gray-900 border-gray-900 text-white shadow-lg" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
              >
                <span>{cat.icon}</span>{cat.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-blue-500 focus:border-blue-500 block pl-9 p-2.5 outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="hidden xl:block text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Harga:</span>
              <select 
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer"
              >
                <option value="all">Semua Harga</option>
                <option value="under50">Di bawah Rp 50.000</option>
                <option value="above50">Rp 50.000 ke atas</option>
              </select>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer ml-2"
              >
                <option value="default">Urutkan: Default</option>
                <option value="price-asc">Termurah → Termahal</option>
                <option value="price-desc">Termahal → Termurah</option>
                <option value="reviews-desc">Ulasan Terbaik</option>
                <option value="reviews-asc">Ulasan Terburuk</option>
                <option value="trending">Trending (Terlaris)</option>
                <option value="promo">Promo / Harga Murah</option>
              </select>
            </div>
          </div>
        </div>

        {/* PRODUCT GRID */}
        <section>
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic border-l-4 border-blue-600 pl-4">
               List Produk ({sortedProducts.length})
             </h3>
          </div>

          {isLoading ? (
            <div className="py-24 text-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
               <p className="mt-4 text-gray-500 font-medium">Memuat produk...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {sortedProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-3xl border border-gray-100 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-300 overflow-hidden flex flex-col">
                  <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50 cursor-pointer">
                    {product.tag && (
                      <span className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase italic shadow-md">
                        {product.tag}
                      </span>
                    )}
                    <img src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} alt={product.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  </Link>

                  <div className="p-5 flex-1 flex flex-col">
                    <Link href={`/product/${product.id}`} className="block">
                      <h4 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px] cursor-pointer">
                        {product.name}
                      </h4>
                    </Link>
                    <p className="text-base font-black text-gray-900 mb-3">
                      {formatRupiah(product.price)}
                    </p>
                    <div className="mb-4 flex items-center gap-1.5 mt-auto">
                      <div className={`h-1.5 w-1.5 rounded-full ${product.stock <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <p className={`text-[10px] font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                        Stok: {product.stock} {product.stock <= 5 ? '(Menipis!)' : '(Aman)'}
                      </p>
                    </div>
                    <Link href={`/product/${product.id}`} className="block w-full">
                       <button className="w-full py-2.5 bg-gray-50 text-gray-700 text-xs font-black rounded-2xl hover:bg-gray-900 hover:text-white transition-all uppercase tracking-widest cursor-pointer">
                         Lihat Detail
                       </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400 font-bold mb-2">Yah, produk tidak ditemukan...</p>
              <button onClick={() => {setActiveCategory("Semua"); setPriceFilter("all"); setSearchQuery("");}} className="text-blue-600 text-sm font-black underline mt-2">Reset Filter</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}