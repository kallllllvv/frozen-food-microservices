"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryName = decodeURIComponent(params.name as string);

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  
  // State untuk Data Produk dari API Backend
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Filter & Pencarian
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");

  const foodFallbackImage = "https://images.unsplash.com/photo-1547592180-3f4f7f42b2a1?q=80&w=1200&auto=format&fit=crop";
  const productFallbackImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop";

  const getCategoryBackgroundImage = (category: string) => {
    const images: Record<string, string> = {
      'Sosis': 'https://images.unsplash.com/photo-1551782450-17144efb5723?q=80&w=1200&auto=format&fit=crop',
      'Nugget': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
      'Kentang': 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?q=80&w=1200&auto=format&fit=crop',
      'Fillet': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop',
      'Olahan Ikan': 'https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=1200&auto=format&fit=crop',
      'Daging': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=1200&auto=format&fit=crop',
      'Ayam': 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=1200&auto=format&fit=crop',
      'Seafood': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=1200&auto=format&fit=crop',
      'Camilan': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200&auto=format&fit=crop',
    };
    return images[category] || foodFallbackImage;
  };

  // Get brands from category products
  const brandsInCategory = useMemo(() => {
    const brandSet = new Set(products.map(p => p.brand).filter(Boolean));
    return Array.from(brandSet).sort();
  }, [products]);

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

    // 2. Fetch data produk dari Backend berdasarkan kategori
    const fetchProducts = async () => {
      try {
        setError(null);
        const response = await fetch(`http://localhost:5000/api/products?category=${encodeURIComponent(categoryName)}`);
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
  }, [categoryName]);

  // Utility function untuk format harga
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // Logika Filtering
  const filteredProducts = products.filter((product) => {
    let matchPrice = true;
    const priceNum = Number(product.price);
    if (priceFilter === "under50") matchPrice = priceNum < 50000;
    else if (priceFilter === "above50") matchPrice = priceNum >= 50000;

    const matchBrand = brandFilter === "all" || product.brand === brandFilter;
    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchPrice && matchBrand && matchSearch;
  });

  // Apply sorting
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

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const highlightMatches = (text?: string) => Boolean(normalizedSearch && text && text.toLowerCase().includes(normalizedSearch));

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/products?category=${encodeURIComponent(categoryName)}`);
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
            {/* ICON HISTORY */}
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
        {/* CATEGORY HEADER */}
        <div className="mb-8 rounded-[2rem] border border-gray-100 bg-gradient-to-r from-gray-50 via-blue-50 to-cyan-50 p-6 shadow-sm overflow-hidden">
          <div className="relative">
            <img
              src={getCategoryBackgroundImage(categoryName)}
              alt={categoryName}
              className="absolute inset-0 w-full h-full object-cover opacity-10 rounded-2xl"
              onError={(e) => (e.currentTarget.src = foodFallbackImage)}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <span className="text-sm text-gray-500">/</span>
                <span className="text-sm font-bold text-blue-600">{categoryName}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">
                Produk {categoryName}
              </h1>
              <p className="text-gray-600 text-lg">
                Temukan pilihan terbaik dari kategori {categoryName} dengan harga terjangkau
              </p>
            </div>
          </div>
        </div>

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

        {/* FILTER SECTION */}
        <div className="mb-8 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={`Cari produk di kategori ${categoryName}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-blue-500 focus:border-blue-500 block pl-9 p-2.5 outline-none transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Price Filter */}
              <div>
                <label className="block text-xs font-black text-gray-600 uppercase mb-2">Filter Harga</label>
                <select 
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer"
                >
                  <option value="all">Semua Harga</option>
                  <option value="under50">Di bawah Rp 50.000</option>
                  <option value="above50">Rp 50.000 ke atas</option>
                </select>
              </div>

              {/* Sort Option */}
              <div>
                <label className="block text-xs font-black text-gray-600 uppercase mb-2">Urutkan</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer"
                >
                  <option value="default">Default</option>
                  <option value="price-asc">Termurah → Termahal</option>
                  <option value="price-desc">Termahal → Termurah</option>
                  <option value="reviews-desc">Ulasan Terbaik</option>
                  <option value="trending">Trending (Terlaris)</option>
                  <option value="promo">Promo / Harga Murah</option>
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block text-xs font-black text-gray-600 uppercase mb-2">Filter Brand</label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer"
                >
                  <option value="all">Semua Brand</option>
                  {brandsInCategory.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setPriceFilter("all");
                    setSortOption("default");
                    setBrandFilter("all");
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BRAND SHOWCASE */}
        {brandsInCategory.length > 0 && (
          <div className="mb-8 p-5 rounded-[2rem] border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.35em] text-blue-600 font-black mb-3">Brand Tersedia</p>
            <div className="flex flex-wrap gap-2">
              {brandsInCategory.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setBrandFilter(brandFilter === brand ? "all" : brand)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    brandFilter === brand
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {brand}
                </button>
              ))}
              {brandFilter !== "all" && (
                <button
                  onClick={() => setBrandFilter("all")}
                  className="px-4 py-2 rounded-full text-sm font-bold text-gray-500 border border-gray-300 hover:border-red-300 hover:text-red-600 transition-all"
                >
                  ✕ Hapus Filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* PRODUCT GRID */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic border-l-4 border-blue-600 pl-4">
              Produk {categoryName} ({sortedProducts.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="py-24 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500 font-medium">Memuat produk...</p>
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map((product) => {
                const isHighlighted = highlightMatches(product.name);
                return (
                  <div key={product.id} className={`group bg-white rounded-[1.75rem] border transition-all duration-300 overflow-hidden flex flex-col ${isHighlighted ? 'border-amber-400 ring-2 ring-amber-100 shadow-xl shadow-amber-50' : 'border-gray-100 hover:shadow-2xl hover:shadow-blue-50'}`}>
                    <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50 cursor-pointer">
                      {product.tag && (
                        <span className={`absolute top-3 left-3 z-10 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase italic shadow-md ${product.tag.toLowerCase().includes('promo') ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                          {product.tag}
                        </span>
                      )}
                      <img src={product.image || productFallbackImage} alt={product.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" onError={(e) => (e.currentTarget.src = productFallbackImage)} />
                      {isHighlighted && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-amber-400 text-white text-[10px] font-black px-2 py-1 shadow-md">Cocok Dicari</span>
                      )}
                    </Link>

                    <div className="p-5 flex-1 flex flex-col">
                      <Link href={`/product/${product.id}`} className="block">
                        <h4 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px] cursor-pointer">
                          {product.name}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest">
                        <span className="inline-flex items-center gap-1 text-amber-600">★ {product.reviews || 0}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-emerald-600">Terjual {product.sold || 0}</span>
                      </div>
                      {product.brand && (
                        <p className="text-xs text-gray-500 font-semibold mb-2">Brand: {product.brand}</p>
                      )}
                      <p className="text-base font-black text-gray-900 mb-3">
                        {formatRupiah(product.price)}
                      </p>
                      <div className="mb-4 flex items-center gap-1.5 mt-auto">
                        <div className={`h-1.5 w-1.5 rounded-full ${product.stock <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        <p className={`text-[10px] font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                          Stok: {product.stock}
                        </p>
                      </div>
                      <Link href={`/product/${product.id}`} className="block w-full">
                        <button className={`w-full py-2.5 text-xs font-black rounded-2xl transition-all uppercase tracking-widest cursor-pointer ${isHighlighted ? 'bg-amber-400 text-white hover:bg-amber-500' : 'bg-gray-50 text-gray-700 hover:bg-gray-900 hover:text-white'}`}>
                          Lihat Detail
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400 font-bold mb-2">Yah, produk tidak ditemukan...</p>
              <button onClick={() => {setPriceFilter("all"); setSortOption("default"); setBrandFilter("all"); setSearchQuery("");}} className="text-blue-600 text-sm font-black underline mt-2">Reset Filter</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
