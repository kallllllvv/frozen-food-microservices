"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getSocket, joinSocketContext } from '@/lib/socket';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [bannerSlides, setBannerSlides] = useState<any[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    updateCartCount();
    window.dispatchEvent(new Event("storage"));
    
    // Opsional: ganti alert bawaan dengan toast atau modal yang lebih rapi nantinya
    alert(`${product.name} berhasil ditambahkan ke keranjang!`);
  };

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
    window.addEventListener('storage', updateCartCount);
    
    const user = localStorage.getItem("user"); 
    let userEmail = "";
    let userRole = "guest";

    if (user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setUserName(userData.name || "User");
        userEmail = String(userData.email || "").trim().toLowerCase();
        userRole = String(userData.role || "user").trim().toLowerCase();
      } catch (error) {
        console.error("Gagal membaca data user:", error);
      }
    }

    const socket = getSocket();

    const handleConnect = () => {
      joinSocketContext({ role: userRole, email: userEmail });
    };

    const handleStockUpdated = (payload: { id?: number; stock?: number }) => {
      if (!payload?.id) return;
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === payload.id
            ? { ...product, stock: Number(payload.stock ?? product.stock) }
            : product
        )
      );
    };

    socket.on('connect', handleConnect);
    socket.on('stock_updated', handleStockUpdated);

    if (socket.connected) {
      handleConnect();
    }

    const fetchProducts = async () => {
      try {
        setError(null);
        const response = await fetch("http://localhost:5000/api/products");
        if (response.ok) {
          const data = await response.json();
          const rows = (data.data || data).map((p: any) => ({
            ...p,
            reviews: p.reviews ?? Math.floor(Math.random() * 50) + 10,
            sold: p.sold ?? Math.floor(Math.random() * 100) + 20,
            rating: p.rating ?? (Math.random() * 4 + 1),
          }));
          setProducts(rows);
          setError(null);
        } else {
          setError(`Gagal mengambil data produk (${response.status})`);
          setProducts([]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Gagal terhubung ke server.");
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

    return () => {
      window.removeEventListener('storage', updateCartCount);
      socket.off('connect', handleConnect);
      socket.off('stock_updated', handleStockUpdated);
    };
  }, []);

  useEffect(() => {
    if (!bannerSlides.length) return;
    const interval = window.setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [bannerSlides.length]);

  const formatRupiah = (angka: number) => {
    return "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(angka || 0);
  };
  
  const getCategoryIcon = (name: string) => {
    const icons: Record<string, string> = {
      'Semua': '🍱',
      'Sosis': '🌭',
      'Nugget': '🍗',
      'Kentang': '🍟',
      'Fillet': '🥩',
      'Olahan Ikan': '🍥',
      'Daging': '🍖',
      'Ayam': '🐔',
      'Seafood': '🦞',
      'Camilan': '🍿',
    };
    return icons[name] || '🍽️';
  };

  const categories = [
    { name: "Semua", icon: "🍱" },
    ...processedCategories.slice(0, 8).map(cat => ({ name: cat.name, icon: getCategoryIcon(cat.name) }))
  ];

  const filteredProducts = products.filter((product) => {
    const matchCategory = activeCategory === "Semua" || product.category === activeCategory;
    let matchPrice = true;
    const priceNum = Number(product.price);
    if (priceFilter === "under50") matchPrice = priceNum < 50000;
    else if (priceFilter === "above50") matchPrice = priceNum >= 50000;

    const matchBrand = brandFilter === "all" || product.brand === brandFilter;
    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchPrice && matchBrand && matchSearch;
  });

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    switch (sortOption) {
      case 'price-asc': return arr.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price-desc': return arr.sort((a, b) => Number(b.price) - Number(a.price));
      case 'reviews-desc': return arr.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
      case 'reviews-asc': return arr.sort((a, b) => (a.reviews || 0) - (b.reviews || 0));
      case 'trending': return arr.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      case 'promo': return arr.filter(p => (p.tag && String(p.tag).toLowerCase().includes('promo')) || Number(p.price) < 30000).sort((a,b) => Number(a.price) - Number(b.price));
      default: return arr;
    }
  }, [filteredProducts, sortOption]);

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

  const handleRetry = () => {
    window.location.reload();
  };

  if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]"></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent italic tracking-tight hover:scale-105 transition-transform">
            FrozenShelly
          </Link>

          <div className="flex items-center gap-1 sm:gap-4">
            {isLoggedIn && (
              <Link href="/history" className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300" title="Riwayat Pesanan">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </Link>
            )}

            <Link href="/cart" className="relative p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full shadow-md shadow-red-500/30 border border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-4 border-l pl-4 border-slate-200 ml-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Halo,</span>
                  <Link href="/profile" className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                    {userName}
                  </Link>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-blue-500/30">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all duration-300" title="Keluar">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-3 border-l pl-4 border-slate-200 ml-2 items-center">
                <Link href="/auth/login" className="text-sm font-bold px-3 py-2 text-slate-600 hover:text-blue-600 transition-colors">Masuk</Link>
                <Link href="/auth/register" className="text-sm font-bold px-5 py-2 bg-slate-900 text-white rounded-full hover:bg-blue-600 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">Daftar</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl shadow-sm flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-red-800 text-sm">Ups, ada kendala</p>
                <p className="text-red-600 text-xs mt-0.5">{error}</p>
              </div>
            </div>
            <button onClick={handleRetry} className="px-5 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm">
              Coba Lagi
            </button>
          </div>
        )}

        {/* --- CAROUSEL BANNER --- */}
        <section className="mb-10 relative group">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl shadow-slate-300/50 min-h-[280px] sm:min-h-[380px]">
            {bannerSlides.length > 0 && bannerSlides.map((slide, index) => {
              const isActive = index === activeBannerIndex;
              return (
                <div key={index} className={`absolute inset-0 transition-all duration-700 ease-in-out ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent z-10" />
                  <img src={slide.image_url || foodFallbackImage} className="object-cover w-full h-full absolute" alt={slide.title} onError={(e) => (e.currentTarget.src = foodFallbackImage)} />
                  <div className="relative z-20 h-full flex flex-col justify-center px-8 sm:px-16 text-white max-w-3xl">
                    <span className="inline-block px-3 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-200 mb-4 w-fit">Penawaran Spesial</span>
                    <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight leading-tight">{slide.title}</h2>
                    <Link href={slide.link_url ? `/${slide.link_url}` : "#"} className="w-fit px-6 py-3 bg-white text-slate-900 text-sm font-bold rounded-full hover:scale-105 hover:bg-blue-50 transition-all duration-300 shadow-xl shadow-white/10">
                      Lihat Sekarang
                    </Link>
                  </div>
                </div>
              );
            })}
            
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex gap-2.5 p-2 bg-black/20 backdrop-blur-md rounded-full">
              {bannerSlides.map((_, index) => (
                <button key={index} onClick={() => setActiveBannerIndex(index)} className={`rounded-full h-2 transition-all duration-300 ${index === activeBannerIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`} aria-label={`Banner ${index + 1}`} />
              ))}
            </div>
          </div>
        </section>

        {/* --- SEARCH & CATEGORY (UNIFIED FILTER BAR) --- */}
        <section className="mb-10 space-y-6 relative z-40">
          <div className="bg-white p-2 sm:p-3 rounded-2xl sm:rounded-full border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col sm:flex-row items-center gap-2">
            
            <div className="relative w-full flex-1 flex items-center bg-slate-50 rounded-xl sm:rounded-full overflow-hidden border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all px-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Mau masak apa hari ini? Cari produk disini..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent text-slate-800 text-sm font-semibold p-3 outline-none placeholder-slate-400" />
            </div>

            <div className="flex w-full sm:w-auto gap-2">
              <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className="flex-1 sm:w-auto bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl sm:rounded-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 outline-none cursor-pointer appearance-none text-center">
                <option value="all">Semua Harga</option>
                <option value="under50">≤ Rp 50 Rb</option>
                <option value="above50">≥ Rp 50 Rb</option>
              </select>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="flex-1 sm:w-auto bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl sm:rounded-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 outline-none cursor-pointer appearance-none text-center">
                <option value="default">Urutkan</option>
                <option value="price-asc">Termurah</option>
                <option value="price-desc">Termahal</option>
                <option value="trending">Terlaris</option>
                <option value="promo">Promo</option>
              </select>
            </div>

          </div>

          {/* ULTRA MODERN CATEGORY FILTER */}
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 custom-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <button key={cat.name} onClick={() => setActiveCategory(cat.name)} className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${isActive ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20 scale-105' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <span className={`text-base transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{cat.icon}</span>
                  <span className="tracking-wide">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* --- SEARCH SPOTLIGHT --- */}
        {normalizedSearch && searchSpotlightProducts.length > 0 && (
          <section className="mb-10">
            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-blue-500">🔍</span> Hasil Pencarian
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {searchSpotlightProducts.map((p) => (
                <ProductCard key={p.id} p={p} formatRupiah={formatRupiah} addToCart={addToCart} highlight />
              ))}
            </div>
          </section>
        )}

        {/* --- MAIN PRODUCT SECTIONS --- */}
        {!normalizedSearch && (
          <div className="space-y-12">
            
            {/* Rekomendasi Section */}
            {recommendedProducts.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Pilihan Spesial</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Dikurasi khusus untuk melengkapi isi kulkasmu.</p>
                  </div>
                  <Link href="/products" className="text-sm font-bold text-blue-600 hover:text-blue-700 hidden sm:block">Lihat Semua →</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {recommendedProducts.slice(0, 5).map((p) => (
                    <ProductCard key={p.id} p={p} formatRupiah={formatRupiah} addToCart={addToCart} badge="Rekomendasi" badgeColor="bg-blue-500" />
                  ))}
                </div>
              </section>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Trending */}
              <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl">🔥</div>
                  <div>
                    <h4 className="font-black text-lg text-slate-800">Sedang Tren</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Paling banyak dibeli</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {trendingProducts.slice(0, 4).map((p) => (
                    <ListProductCard key={p.id} p={p} formatRupiah={formatRupiah} addToCart={addToCart} />
                  ))}
                </div>
              </section>

              {/* Promo */}
              <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">💸</div>
                  <div>
                    <h4 className="font-black text-lg text-slate-800">Promo Menarik</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Harga spesial hari ini</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {promoProducts.slice(0, 4).map((p) => (
                    <ListProductCard key={p.id} p={p} formatRupiah={formatRupiah} addToCart={addToCart} isPromo />
                  ))}
                </div>
              </section>

              {/* Top Rated */}
              <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center text-xl">⭐</div>
                  <div>
                    <h4 className="font-black text-lg text-slate-800">Ulasan Terbaik</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Favorit pelanggan</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {topRatedProducts.slice(0, 4).map((p) => (
                    <ListProductCard key={p.id} p={p} formatRupiah={formatRupiah} addToCart={addToCart} showRating />
                  ))}
                </div>
              </section>
            </div>

            {/* Kategori Visual Section */}
            <section className="pt-8 border-t border-slate-200/60">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Jelajah Kategori</h2>
                <p className="text-slate-500 font-medium mt-2">Temukan bahan masak sesuai seleramu</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {processedCategories.map((category) => (
                  <Link key={category.name} href={`/category/${encodeURIComponent(category.name)}`} className="group relative h-40 sm:h-48 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-slate-100">
                    <img src={category.backgroundImage} alt={category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => (e.currentTarget.src = foodFallbackImage)} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <h3 className="text-lg sm:text-xl font-black text-white mb-1 group-hover:text-blue-300 transition-colors">{category.name}</h3>
                      <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">{category.products.length} Produk Tersedia</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
            
          </div>
        )}

      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 font-sans mt-12 border-t border-slate-800">
        <div className="bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer text-center py-4 text-sm text-white font-bold" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Kembali ke atas ⬆
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-5">Kenali Kami</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Tentang FrozenShelly</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Blog Makanan</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Keberlanjutan</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-5">Bermitra</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Jual Produk Frozen</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Menjadi Agen/Reseller</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-5">Pembayaran</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">FrozenShelly Pay</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Kartu Kredit/Debit</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Bayar di Tempat (COD)</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-5">Bantuan</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Lacak Pesanan</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Garansi Suhu</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Hubungi CS</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 py-6 text-center text-xs">
          <p>© {new Date().getFullYear()} FrozenShelly.com. Semua hak cipta dilindungi.</p>
        </div>
      </footer>

      {/* Styles khusus untuk memperhalus scrollbar kategori */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}

/* === KOMPONEN BANTUAN UNTUK KARTU PRODUK (Supaya Rapi) === */
function ProductCard({ p, formatRupiah, addToCart, highlight, badge, badgeColor }: any) {
  return (
    <Link href={`/product/${p.id}`} className={`group relative bg-white rounded-[1.5rem] border ${highlight ? 'border-blue-300 shadow-lg shadow-blue-500/10' : 'border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10'} transition-all duration-500 p-3 sm:p-4 flex flex-col h-full hover:-translate-y-1`}>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-50 mb-4">
        <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop")} />
        {badge && (
          <span className={`absolute top-2 left-2 ${badgeColor} text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm`}>{badge}</span>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.category}</p>
        <h3 className="text-sm font-black text-slate-800 line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">{p.name}</h3>
        
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-0.5">⭐ {Number(p.rating || 4.5).toFixed(1)}</span>
            <span className="text-base font-black text-slate-900">{formatRupiah(Number(p.price))}</span>
          </div>
          <button onClick={(e) => { e.preventDefault(); addToCart(p); }} className="w-9 h-9 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

/* === KOMPONEN BANTUAN UNTUK LIST PRODUK (Trending/Promo/Top Rating) === */
function ListProductCard({ p, formatRupiah, addToCart, isPromo, showRating }: any) {
  return (
    <Link href={`/product/${p.id}`} className="group flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100">
        <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop")} />
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{p.name}</h4>
        <div className="mt-1 flex flex-col">
          {isPromo && <span className="text-[10px] line-through text-slate-400">{formatRupiah(Number(p.price) + 10000)}</span>}
          <div className="flex items-center justify-between">
            <span className={`font-black ${isPromo ? 'text-red-600' : 'text-slate-900'}`}>{formatRupiah(Number(p.price))}</span>
            <button onClick={(e) => { e.preventDefault(); addToCart(p); }} className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}