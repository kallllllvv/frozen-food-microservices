"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // State untuk Filter & Pencarian
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [priceFilter, setPriceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
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
  }, []);

  // Data Produk
  const products = [
    { 
      id: 1, 
      name: "Nugget Ayam Crispy 500gr", 
      category: "Ayam",
      priceText: "Rp 45.000", 
      priceNum: 45000,
      stock: 4, 
      image: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=500&auto=format&fit=crop", 
      tag: "Best Seller" 
    },
    { 
      id: 2, 
      name: "Sosis Sapi Bakar Jumbo", 
      category: "Daging",
      priceText: "Rp 52.000", 
      priceNum: 52000,
      stock: 25, 
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=500&auto=format&fit=crop", 
      tag: "Diskon" 
    },
    { 
      id: 3, 
      name: "Kentang Goreng Shoestring 1kg", 
      category: "Camilan",
      priceText: "Rp 32.000", 
      priceNum: 32000,
      stock: 8, 
      image: "https://images.unsplash.com/photo-1630384066202-18d038253a1d?q=80&w=500&auto=format&fit=crop", 
      tag: "" 
    },
    { 
      id: 4, 
      name: "Bakso Sapi Asli Isi 50", 
      category: "Daging",
      priceText: "Rp 60.000", 
      priceNum: 60000,
      stock: 12, 
      image: "https://images.unsplash.com/photo-1529006557810-264b5ca99197?q=80&w=500&auto=format&fit=crop", 
      tag: "Baru" 
    },
    { 
      id: 5, 
      name: "Dimsum Ayam Mix Isi 15", 
      category: "Camilan",
      priceText: "Rp 40.000", 
      priceNum: 40000,
      stock: 3, 
      image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=500&auto=format&fit=crop", 
      tag: "" 
    },
    { 
      id: 6, 
      name: "Ikan Dory Fillet 1kg", 
      category: "Seafood",
      priceText: "Rp 55.000", 
      priceNum: 55000,
      stock: 15, 
      image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=500&auto=format&fit=crop", 
      tag: "Frozen" 
    },
  ];

  const categories = [
    { name: "Semua", icon: "🍱" },
    { name: "Ayam", icon: "🍗" },
    { name: "Daging", icon: "🥩" },
    { name: "Seafood", icon: "🐟" },
    { name: "Camilan", icon: "🍟" },
  ];

  // Logika Filtering
  const filteredProducts = products.filter((product) => {
    const matchCategory = activeCategory === "Semua" || product.category === activeCategory;
    
    let matchPrice = true;
    if (priceFilter === "under50") matchPrice = product.priceNum < 50000;
    else if (priceFilter === "above50") matchPrice = product.priceNum >= 50000;

    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchPrice && matchSearch;
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.reload();
  };

  if (!mounted) return <div className="min-h-screen bg-white"></div>;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent italic">
            FrozenGo
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
        {/* HERO BANNER */}
        <section className="relative h-[250px] sm:h-[300px] rounded-[2rem] overflow-hidden mb-12 bg-gray-900 shadow-2xl">
          <img src="https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop" className="object-cover w-full h-full brightness-50 absolute" alt="Banner" />
          <div className="relative z-10 h-full flex flex-col justify-center px-10 text-white">
            <h2 className="text-3xl sm:text-5xl font-black mb-2 uppercase tracking-tighter">Beli Banyak, <br/> Stok Aman!</h2>
            <p className="text-blue-100 font-medium">Gratis ongkir khusus wilayah Jabodetabek.</p>
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
            </div>
          </div>
        </div>

        {/* PRODUCT GRID */}
        <section>
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic border-l-4 border-blue-600 pl-4">
                List Produk ({filteredProducts.length})
             </h3>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-3xl border border-gray-100 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-300 overflow-hidden flex flex-col">
                  <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50 cursor-pointer">
                    {product.tag && (
                      <span className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase italic shadow-md">
                        {product.tag}
                      </span>
                    )}
                    <img src={product.image} alt={product.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  </Link>

                  <div className="p-5 flex-1 flex flex-col">
                    <Link href={`/product/${product.id}`} className="block">
                      <h4 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px] cursor-pointer">
                        {product.name}
                      </h4>
                    </Link>
                    <p className="text-base font-black text-gray-900 mb-3">{product.priceText}</p>
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