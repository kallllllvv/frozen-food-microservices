"use client";

import { useState, useEffect } from "react";
import { DUMMY_PRODUCTS } from "../../lib/product";
import Link from "next/link";

export default function KatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [maxPrice, setMaxPrice] = useState(150000);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Fix Hydration Error
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredProducts = DUMMY_PRODUCTS.filter((p) => {
    const matchCategory = selectedCategory === "Semua" || p.category === selectedCategory;
    const matchPrice = p.price <= maxPrice;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchPrice && matchSearch;
  });

  // Logika Status Stok: Hijau (Aman), Kuning (Terbatas), Merah (Bahaya)
  const getStockStatus = (stock: number) => {
    if (stock <= 5) return { label: "Hampir Habis", color: "text-red-600" };
    if (stock <= 10) return { label: "Stok Terbatas", color: "text-amber-500" };
    return { label: "Stok Tersedia", color: "text-green-600" };
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-black">
      {/* Container Full Width (Tanpa max-w agar megah di Desktop) */}
      <div className="w-full p-8 md:p-12">
        
        {/* === HEADER === */}
        <header className="flex items-center justify-between bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#E0F2FE] rounded-2xl flex items-center justify-center border border-[#BAE6FD]">
              <span className="text-3xl">❄️</span> 
            </div>
            <div className="hidden sm:block">
              {/* Nama Toko Tetap Biru */}
              <h1 className="text-2xl font-black leading-none text-[#0077B6]">Frozen Shelly</h1>
              <p className="text-xs font-bold text-gray-500 uppercase mt-1 tracking-widest">Premium Frozen Food</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-2xl mx-16 relative">
            <input 
              type="text" 
              placeholder="Cari nugget, sosis, atau bakso..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-2xl px-8 py-4 text-sm focus:bg-white focus:border-[#0077B6] text-black outline-none transition-all shadow-inner"
            />
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-sm font-bold text-black hover:text-[#0077B6] uppercase tracking-widest">🛒 Keranjang</button>
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-white ring-2 ring-[#E0F2FE] shadow-md">
              Z
            </div>
            <button className="px-6 py-2.5 border-2 border-black text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all">
              Keluar
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* === SIDEBAR FILTER === */}
          <aside className="w-full lg:w-96 bg-white p-10 rounded-[48px] shadow-sm h-fit sticky top-12 border border-gray-100">
            {/* Judul Sidebar Konsisten: Katalog Produk */}
            <h2 className="text-black font-black text-2xl mb-10 border-b-4 border-[#F8FAFC] pb-4 uppercase tracking-tighter">Filter Produk</h2>
            
            <div className="mb-12 text-black">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] block mb-5 text-gray-400">Harga Maksimal</label>
              <input 
                type="range" 
                min="10000" max="200000" step="5000"
                className="w-full h-2 bg-[#E0F2FE] rounded-lg appearance-none cursor-pointer accent-black"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              />
              <p className="mt-5 font-black text-2xl text-right tracking-tighter text-black">Rp {maxPrice.toLocaleString()}</p>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 block text-gray-400">Kategori</label>
              <div className="flex flex-col gap-3">
                {["Semua", "Sosis", "Nugget", "Bakso", "Kentang", "Dimsum"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left px-7 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                      selectedCategory === cat 
                      ? "bg-[#0077B6] text-white opacity-100 shadow-[0_10px_25px_rgba(0,119,182,0.3)] translate-x-2" 
                      : "bg-white text-black border border-gray-100 opacity-40 hover:opacity-100 hover:border-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* === KATALOG AREA === */}
          <div className="flex-1">
            {/* Teks Konsisten: Katalog Produk */}
            <h2 className="text-3xl font-black text-black mb-10 border-b-4 border-[#F8FAFC] pb-4 uppercase tracking-tighter">Katalog</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
              {filteredProducts.map((product) => {
                const status = getStockStatus(product.stock);
                return (
                  <Link href={`/product/${product.id}`} key={product.id} className="bg-white p-6 rounded-[48px] shadow-sm border border-gray-100 flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                    <div className="w-full h-64 bg-[#F1F5F9] rounded-[36px] mb-8 overflow-hidden">
                      <img 
                        src={`https://via.placeholder.com/400x400/F1F5F9/000000?text=${product.name}`} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    </div>
                    
                    <div className="px-2 flex-1">
                      {/* Nama Produk Hitam Pekat */}
                      <h3 className="font-black text-black text-xl mb-1 tracking-tight">{product.name}</h3>
                      
                      {/* Status Stok Berwarna & Konsisten */}
                      <p className={`text-xs font-bold mb-5 ${status.color}`}>
                        {status.label} ({product.stock} Pack)
                      </p>

                      <span className="text-[10px] font-black text-black bg-gray-100 px-4 py-1.5 rounded-full uppercase tracking-widest border border-gray-100">
                        {product.category}
                      </span>

                      {/* Harga Biru Ocean */}
                      <div className="pt-6 mt-6 border-t-2 border-gray-50 font-black text-3xl tracking-tighter text-[#0077B6]">
                        Rp {product.price.toLocaleString()}
                      </div>
                    </div>

                    <button className="mt-8 w-full bg-black text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#0077B6] transition-all">
                      Detail Produk
                    </button>
                  </Link>
                );
              })}
            </div>

            {/* Jika hasil filter kosong */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-40 bg-white rounded-[60px] border-4 border-dashed border-gray-100">
                <p className="text-2xl font-black text-gray-300 uppercase italic">Produk Tidak Ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}