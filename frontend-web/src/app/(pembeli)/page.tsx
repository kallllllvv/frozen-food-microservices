"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [bannerSlides, setBannerSlides] = useState<any[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  //state untuk angka di navbar
  const [cartCount, setCartCount] = useState(0);

  // State untuk Data Produk dari API Backend
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Filter & Pencarian
  const [activeCategory, setActiveCategory] = useState("Semua");
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

  // hitung total qty dari localStorage
  const updateCartCount = () => {
    const cartStr = localStorage.getItem("cart");
    if (cartStr) {
      const cart = JSON.parse(cartStr);
      const count = cart.reduce((total: number, item: any) => total + item.quantity, 0);
      setCartCount(count);
    } else {
      setCartCount(0);
    }
  };

  //add toCart
  const addToCart = (product: any) => {
    const cartStr = localStorage.getItem("cart");
    let cart = cartStr ? JSON.parse(cartStr) : [];
    const existingItem = cart.find((item: any) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || productFallbackImage,
        quantity: 1,
        selected: true
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount(); // Update angka navbar seketika
    window.dispatchEvent(new Event("storage"));
    alert(`${product.name} ditambah ke keranjang!`);
  };

  // Processed categories from products
  const processedCategories = useMemo(() => {
    const categoryMap = new Map();
    products.forEach(product => {
      const cat = product.category || 'Lainnya';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          name: cat,
          products: [],
          latestProduct: null,
          backgroundImage: getCategoryBackgroundImage(cat)
        });
      }
      categoryMap.get(cat).products.push(product);
      if (!categoryMap.get(cat).latestProduct || (product.created_at && categoryMap.get(cat).latestProduct.created_at && new Date(product.created_at) > new Date(categoryMap.get(cat).latestProduct.created_at))) {
        categoryMap.get(cat).latestProduct = product;
      }
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => {
        if (!a.latestProduct || !b.latestProduct) return 0;
        const aDate = a.latestProduct.created_at ? new Date(a.latestProduct.created_at) : new Date(a.latestProduct.id);
        const bDate = b.latestProduct.created_at ? new Date(b.latestProduct.created_at) : new Date(b.latestProduct.id);
        return bDate.getTime() - aDate.getTime();
      });
  }, [products]);

  const brands = useMemo(() => {
    const brandSet = new Set(products.map(p => p.brand).filter(Boolean));
    return Array.from(brandSet) as string[];
  }, [products]);

  useEffect(() => {
    setMounted(true);
    updateCartCount();

    //agar angka di navbar update jika ada perubahan di tab lain /storage
    window.addEventListener('storage', updateCartCount);
    
    
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
            rating: p.rating ?? (Math.random() * 4 + 1),
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
          const firstBanner = data.data?.[0] || null;
          const primarySlide = firstBanner || {
            title: "Beli Banyak, Stok Aman!",
            image_url: foodFallbackImage,
            link_url: "",
          };

          setBannerSlides([
            primarySlide,
            {
              title: "Promo Mingguan Frozen Food",
              image_url: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1200&auto=format&fit=crop",
              link_url: "promo",
            },
            {
              title: "Menu Favorit Keluarga",
              image_url: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1200&auto=format&fit=crop",
              link_url: "favorite",
            },
            {
              title: "Siap Masak Kapan Saja",
              image_url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1200&auto=format&fit=crop",
              link_url: "ready-to-cook",
            },
          ]);
        }
      } catch (error) {
        console.error("Gagal mengambil banner:", error);
      } finally {
        setActiveBannerIndex(0);
      }
    };

    fetchBanner();

    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  useEffect(() => {
    if (!bannerSlides.length) return;

    const interval = window.setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [bannerSlides.length]);

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
    ...processedCategories.slice(0, 8).map(cat => ({ name: cat.name, icon: "🍽️" }))
  ];

  // Logika Filtering (dijalankan pada data 'products' yang sudah di-fetch)
  const filteredProducts = products.filter((product) => {
    const matchCategory = activeCategory === "Semua" || product.category === activeCategory;
    
    let matchPrice = true;
    const priceNum = Number(product.price); // Pastikan harga menjadi angka
    if (priceFilter === "under50") matchPrice = priceNum < 50000;
    else if (priceFilter === "above50") matchPrice = priceNum >= 50000;

    const matchBrand = brandFilter === "all" || product.brand === brandFilter;

    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchPrice && matchBrand && matchSearch;
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

  // Recommendation and curated lists
  const recommendedProducts = useMemo(() => {
    const scored = products.map((p) => ({
      ...p,
      score: (Number(p.reviews || 0) * 2) + Number(p.sold || 0) / 2,
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [products]);

  const trendingProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 8);
  }, [products]);

  const promoProducts = useMemo(() => {
    return products.filter(p => (p.tag && String(p.tag).toLowerCase().includes('promo')) || Number(p.price) < 30000).slice(0, 8);
  }, [products]);

  const topRatedProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 8);
  }, [products]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const searchSpotlightProducts = useMemo(() => {
    if (!normalizedSearch) return [];

    return [...products]
      .filter((product) => product.name.toLowerCase().includes(normalizedSearch) || String(product.category || "").toLowerCase().includes(normalizedSearch) || String(product.tag || "").toLowerCase().includes(normalizedSearch))
      .sort((a, b) => {
        const aExact = a.name.toLowerCase().startsWith(normalizedSearch) ? 1 : 0;
        const bExact = b.name.toLowerCase().startsWith(normalizedSearch) ? 1 : 0;
        if (bExact !== aExact) return bExact - aExact;
        return (b.sold || 0) - (a.sold || 0);
      })
      .slice(0, 6);
  }, [normalizedSearch, products]);

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
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
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

              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full shadow-lg">
                  {cartCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Halo,</span>
                  <Link href="/profile" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
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
        {/* --- SEARCH & FILTER SECTION --- */}
        <div className="flex flex-col gap-4 mb-6 bg-white py-2">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
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
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer"
              >
                <option value="all">Semua Brand</option>
                {brands.map(brand => (
                  <option key={brand as string} value={brand as string}>{brand as string}</option>
                ))}
              </select>
            </div>
          </div>

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
        </div>

        {/* --- SEARCH SPOTLIGHT --- */}
        {normalizedSearch && searchSpotlightProducts.length > 0 && (
          <section className="mb-8 rounded-[2rem] border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-cyan-50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-amber-600 font-black mb-2">Search Spotlight</p>
                <h3 className="text-xl font-black text-gray-900">Barang yang paling cocok dengan pencarianmu</h3>
              </div>
              <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-widest">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-white shadow-md">★</span>
                Live highlight
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {searchSpotlightProducts.map((p) => (
                <Link key={`search-${p.id}`} href={`/product/${p.id}`} className={`w-[220px] flex-none snap-start rounded-2xl border p-3 bg-white transition-all duration-300 ${highlightMatches(p.name) ? 'border-amber-400 ring-2 ring-amber-200 shadow-lg shadow-amber-100' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="relative aspect-square mb-3 overflow-hidden rounded-xl">
                    <img src={p.image || productFallbackImage} alt={p.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = productFallbackImage)} />
                    <div className="absolute top-2 left-2 rounded-full bg-amber-400 text-white text-[10px] font-black px-2 py-1 shadow-md">Cocok</div>
                  </div>
                  <div className="flex items-start justify-between gap-2 min-h-[40px]">
                      <p className="text-sm font-black text-gray-900 line-clamp-2 flex-1">{p.name}</p>
                      <button onClick={(e) => { e.preventDefault(); addToCart(p); }} className="p-1.5 bg-blue-50 text-[#0077B6] rounded-lg hover:bg-[#0077B6] hover:text-white transition-all flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-gray-500">
                    <span>{p.category}</span>
                    <span className="text-blue-600">{formatRupiah(Number(p.price))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* --- CAROUSEL BANNER --- */}
        <section className="mb-8 rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-gray-900 shadow-2xl min-h-[260px] sm:min-h-[320px]">
            {bannerSlides.length > 0 && bannerSlides.map((slide, index) => {
              const isActive = index === activeBannerIndex;
              return (
                <div
                  key={`${slide.title}-${index}`}
                  className={`absolute inset-0 transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                >
                  <img
                    src={slide.image_url || foodFallbackImage}
                    className="object-cover w-full h-full brightness-50 absolute"
                    alt={slide.title}
                    onError={(e) => (e.currentTarget.src = foodFallbackImage)}
                  />
                  <div className="relative z-10 h-[260px] sm:h-[320px] flex flex-col justify-center px-8 sm:px-10 text-white">
                    <h2 className="text-3xl sm:text-5xl font-black mb-3 uppercase tracking-tighter max-w-2xl">
                      {slide.title}
                    </h2>
                  </div>
                </div>
              );
            })}

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex flex-wrap gap-2 justify-center">
              {bannerSlides.map((slide, index) => (
                <button
                  key={`banner-dot-${index}`}
                  onClick={() => setActiveBannerIndex(index)}
                  className={`rounded-full w-3 h-3 transition-all ${index === activeBannerIndex ? 'bg-white shadow-lg scale-125' : 'bg-white/40 hover:bg-white/60'}`}
                  aria-label={`Banner ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* --- REKOMENDASI (di bawah banner) --- */}
        {recommendedProducts.length > 0 && (
          <section className="mb-8 rounded-[2rem] border border-cyan-100 bg-gradient-to-r from-white via-cyan-50/50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-600 font-black mb-2">Rekomendasi</p>
                <h3 className="text-xl font-black text-gray-900">Untuk Anda</h3>
              </div>
              <div className="flex items-center gap-2 text-cyan-700 font-black text-xs uppercase tracking-widest">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white shadow-md">✦</span>
                Highlight utama
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {recommendedProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className={`group w-[230px] flex-none snap-start rounded-[1.5rem] border bg-white p-3 shadow-sm transition-all ${highlightMatches(p.name) ? 'border-cyan-300 ring-2 ring-cyan-100' : 'border-gray-200 hover:border-cyan-300'}`}>
                  <div className="relative aspect-[4/3] mb-3 overflow-hidden rounded-2xl">
                    <img src={p.image || productFallbackImage} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => (e.currentTarget.src = productFallbackImage)} />
                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                      <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-black uppercase text-cyan-700 shadow-sm">Rekomendasi</span>
                      {p.tag && <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black uppercase text-white shadow-sm">{p.tag}</span>}
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2 min-h-[40px]">
                    <p className="text-sm font-black text-gray-900 line-clamp-2 flex-1">{p.name}</p>
                    <button onClick={(e) => { e.preventDefault(); addToCart(p); }} className="p-1.5 bg-blue-50 text-[#0077B6] rounded-lg hover:bg-[#0077B6] hover:text-white transition-all flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-gray-500">
                    <span className="inline-flex items-center gap-1 text-amber-600">★ {(p.rating || 4.5).toFixed(1)}</span>
                    <span className="text-blue-600">{formatRupiah(Number(p.price))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* PRODUCT GRID */}
        {/* --- CURATED SECTIONS: Trending / Promo / Top Rating --- */}
        <section className="grid gap-6 mb-8 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-600 font-black mb-1">Trending</p>
                <h4 className="font-black text-lg text-gray-900 flex items-center gap-2"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-lime-500 text-white shadow-md">↗</span> Lagi Naik</h4>
              </div>
              <span className="rounded-full bg-lime-500 px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">Hot</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {trendingProducts.map((p) => (
                <Link key={`trend-${p.id}`} href={`/product/${p.id}`} className={`w-[190px] flex-none snap-start rounded-2xl bg-white border p-3 transition-all ${highlightMatches(p.name) ? 'border-lime-300 ring-2 ring-lime-100' : 'border-gray-200 hover:border-lime-300'}`}>
                  <div className="relative aspect-square overflow-hidden rounded-xl mb-3">
                    <img src={p.image || productFallbackImage} alt={p.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = productFallbackImage)} />
                    <span className="absolute top-2 left-2 rounded-full bg-lime-500 px-2 py-1 text-[10px] font-black uppercase text-white shadow-md">Trending</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 min-h-[40px]">
                    <p className="text-sm font-black text-gray-900 line-clamp-2 flex-1">{p.name}</p>
                    <button onClick={(e) => { e.preventDefault(); addToCart(p); }} className="p-1 bg-blue-50 text-[#0077B6] rounded-md hover:bg-[#0077B6] hover:text-white transition-all flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-gray-500">
                    <span className="inline-flex items-center gap-1 text-amber-600">★ {(p.rating || 4.5).toFixed(1)}</span>
                    <span>Terjual {p.sold || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-rose-600 font-black mb-1">Promo</p>
                <h4 className="font-black text-lg text-gray-900 flex items-center gap-2"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">%</span> Harga Ramah</h4>
              </div>
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">Deal</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {promoProducts.map((p) => (
                <Link key={`promo-${p.id}`} href={`/product/${p.id}`} className={`w-[190px] flex-none snap-start rounded-2xl bg-white border p-3 transition-all ${highlightMatches(p.name) ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-200 hover:border-emerald-300'}`}>
                  <div className="relative aspect-square overflow-hidden rounded-xl mb-3">
                    <img src={p.image || productFallbackImage} alt={p.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = productFallbackImage)} />
                    <span className="absolute top-2 left-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-black uppercase text-white shadow-md">Promo</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 min-h-[40px]">
                    <p className="text-sm font-black text-gray-900 line-clamp-2 flex-1">{p.name}</p>
                    <button onClick={(e) => { e.preventDefault(); addToCart(p); }} className="p-1 bg-blue-50 text-[#0077B6] rounded-md hover:bg-[#0077B6] hover:text-white transition-all flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-gray-500">
                    <span className="inline-flex items-center gap-1 text-amber-600">★ {(p.rating || 4.5).toFixed(1)}</span>
                    <span className="line-through text-gray-400">{formatRupiah(Number(p.price) + 10000)}</span>
                  </div>
                  <div className="mt-1 text-sm font-black text-rose-600">{formatRupiah(Number(p.price))}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-cyan-50 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-amber-600 font-black mb-1">Top Rating</p>
                <h4 className="font-black text-lg text-gray-900 flex items-center gap-2"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">★</span> Paling Disukai</h4>
              </div>
              <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">Best</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {topRatedProducts.map((p) => (
                <Link key={`top-${p.id}`} href={`/product/${p.id}`} className={`w-[190px] flex-none snap-start rounded-2xl bg-white border p-3 transition-all ${highlightMatches(p.name) ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200 hover:border-amber-300'}`}>
                  <div className="relative aspect-square overflow-hidden rounded-xl mb-3">
                    <img src={p.image || productFallbackImage} alt={p.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = productFallbackImage)} />
                    <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-black uppercase text-white shadow-md">Top</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 min-h-[40px]">
                    <p className="text-sm font-black text-gray-900 line-clamp-2 flex-1">{p.name}</p>
                    <button onClick={(e) => { e.preventDefault(); addToCart(p); }} className="p-1 bg-blue-50 text-[#0077B6] rounded-md hover:bg-[#0077B6] hover:text-white transition-all flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-gray-500">
                    <span className="inline-flex items-center gap-1 text-amber-600">★ {(p.rating || 4.5).toFixed(1)}</span>
                    <span>{formatRupiah(Number(p.price))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        {/* --- KATEGORI FROZEN FOOD --- */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-black">Kategori Frozen Food</p>
              <h2 className="text-2xl font-black text-gray-900">Pilih Kategori Favoritmu</h2>
            </div>
            <p className="text-sm text-gray-500">Diurutkan berdasarkan produk terbaru</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {processedCategories.map((category) => (
              <Link
                key={category.name}
                href={`/category/${encodeURIComponent(category.name)}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
              >
                <img
                  src={category.backgroundImage}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => (e.currentTarget.src = foodFallbackImage)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-black text-lg mb-1">{category.name}</h3>
                  <p className="text-white/80 text-sm">{category.products.length} produk tersedia</p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-[#232f3e] text-gray-300 font-sans mt-12">
        {/* Back to top */}
        <div
          className="bg-[#37475a] hover:bg-[#485769] transition-colors cursor-pointer text-center py-4 text-sm text-white font-medium"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Kembali ke atas
        </div>

        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">Kenali Kami Lebih Dekat</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:underline">Tentang FrozenShelly</Link></li>
                <li><Link href="#" className="hover:underline">Karir</Link></li>
                <li><Link href="#" className="hover:underline">Blog Makanan</Link></li>
                <li><Link href="#" className="hover:underline">Keberlanjutan</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Bermitra dengan Kami</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:underline">Jual Produk Frozen</Link></li>
                <li><Link href="#" className="hover:underline">Menjadi Agen/Reseller</Link></li>
                <li><Link href="#" className="hover:underline">Program Afiliasi</Link></li>
                <li><Link href="#" className="hover:underline">Iklankan Produk Anda</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Metode Pembayaran</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:underline">FrozenShelly Pay</Link></li>
                <li><Link href="#" className="hover:underline">Kartu Kredit/Debit</Link></li>
                <li><Link href="#" className="hover:underline">Bayar di Tempat (COD)</Link></li>
                <li><Link href="#" className="hover:underline">Promo Bank Mitra</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Bantuan & Layanan</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:underline">Lacak Pesanan Anda</Link></li>
                <li><Link href="#" className="hover:underline">Tarif Pengiriman</Link></li>
                <li><Link href="#" className="hover:underline">Garansi Suhu & Pengembalian</Link></li>
                <li><Link href="#" className="hover:underline">Hubungi CS FrozenShelly</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider & Logo/Settings */}
        <div className="border-t border-gray-700 py-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6">
            <Link href="/" className="text-2xl font-black text-white italic tracking-tighter">
              FrozenShelly
            </Link>
            <div className="flex flex-wrap justify-center gap-2">
              <button className="border border-gray-500 rounded px-3 py-1.5 flex items-center gap-2 text-sm hover:border-white transition-colors">
                🌐 <span className="text-gray-300">Bahasa Indonesia</span>
              </button>
              <button className="border border-gray-500 rounded px-3 py-1.5 flex items-center gap-2 text-sm hover:border-white transition-colors">
                <span className="font-bold">Rp</span> <span className="text-gray-300">Rupiah - IDR</span>
              </button>
              <button className="border border-gray-500 rounded px-3 py-1.5 flex items-center gap-2 text-sm hover:border-white transition-colors">
                🇮🇩 <span className="text-gray-300">Indonesia</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Legal */}
        <div className="bg-[#131a22] py-8 text-center text-xs">
          <div className="flex justify-center gap-6 mb-2">
            <Link href="#" className="hover:underline">Ketentuan Penggunaan</Link>
            <Link href="#" className="hover:underline">Kebijakan Privasi</Link>
            <Link href="#" className="hover:underline">Peringatan Iklan</Link>
          </div>
          <p>© 2024-{new Date().getFullYear()}, FrozenShelly.com, Inc. atau afiliasinya</p>
        </div>
      </footer>
    </div>
  );
}