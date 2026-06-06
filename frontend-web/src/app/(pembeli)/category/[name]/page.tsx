"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ShoppingCart, Star, Search, SlidersHorizontal, X } from 'lucide-react';
import { getSocket, joinSocketContext } from '@/lib/socket';

export default function CategorySidebarPage() {
  const params = useParams();
  const router = useRouter();
  const categoryName = decodeURIComponent(params.name as string);

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [cartCount, setCartCount] = useState(0);
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priceFilter, setPriceFilter] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  
  // STATE BARU: Untuk kontrol mode input search
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const productFallbackImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop";

  const updateCartCount = () => {
    const cartStr = localStorage.getItem("cart");
    if (cartStr) {
      const cart = JSON.parse(cartStr);
      setCartCount(cart.reduce((total: number, item: any) => total + item.quantity, 0));
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
      cart.push({ id: product.id, name: product.name, price: product.price, image: product.image || productFallbackImage, quantity: 1, selected: true });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    window.dispatchEvent(new Event("storage"));
    alert(`${product.name} ditambah ke keranjang!`);
  };

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
      } catch (e) { console.error(e); }
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
        setIsLoading(true);
        const response = await fetch(`http://localhost:5000/api/products?category=${encodeURIComponent(categoryName)}`);
        if (response.ok) {
          const data = await response.json();
          setProducts((data.data || data).map((p: any) => ({
            ...p,
            reviews: p.reviews ?? Math.floor(Math.random() * 50) + 10,
            sold: p.sold ?? Math.floor(Math.random() * 100) + 20,
            rating: p.rating ?? (Math.random() * 1.5 + 3.5),
          })));
        }
      } catch (err) { setError("Gagal memuat produk."); } finally { setIsLoading(false); }
    };
    fetchProducts();
    return () => {
      window.removeEventListener('storage', updateCartCount);
      socket.off('connect', handleConnect);
      socket.off('stock_updated', handleStockUpdated);
    };
  }, [categoryName]);

  const brandsInCategory = useMemo(() => {
    return Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort() as string[];
  }, [products]);

  const filteredProducts = products.filter((p) => {
    const priceNum = Number(p.price);
    const matchPrice = priceFilter === "all" ? true : (priceFilter === "under50" ? priceNum < 50000 : priceNum >= 50000);
    const matchBrand = brandFilter === "all" || p.brand === brandFilter;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPrice && matchBrand && matchSearch;
  });

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    switch (sortOption) {
      case 'price-asc': return arr.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price-desc': return arr.sort((a, b) => Number(b.price) - Number(a.price));
      case 'trending': return arr.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      default: return arr;
    }
  }, [filteredProducts, sortOption]);

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent italic tracking-tighter">
            FrozenShelly
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/cart" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors group">
              <ShoppingCart className="h-6 w-6 group-hover:text-blue-600" />
              {cartCount > 0 && <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-[10px] font-black leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full shadow-lg">{cartCount}</span>}
            </Link>
            {isLoggedIn ? (
              <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Halo,</span>
                  <Link href="/profile" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">{userName}</Link>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="text-sm font-black px-4 py-2 bg-blue-600 text-white rounded-full">Masuk</Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-8 py-8">
        
        {/* SIDEBAR FILTER */}
        <aside className="lg:w-64 flex-shrink-0 space-y-8">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <ChevronLeft className="h-4 w-4" /> Kembali
          </button>

          {/* INLINE SEARCH FIELD */}
          <div className="min-h-[40px] flex flex-col justify-center">
            {isSearchOpen ? (
              <div className="relative flex items-center group">
                <Search className="absolute left-0 h-3.5 w-3.5 text-blue-600" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Cari camilan..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if(searchQuery === "") setIsSearchOpen(false) }}
                  className="w-full bg-transparent border-b-2 border-blue-600 ml-6 py-1 text-xs font-black uppercase tracking-widest outline-none focus:ring-0"
                />
                <button 
                  onClick={() => {setSearchQuery(""); setIsSearchOpen(false);}}
                  className="absolute right-0 text-gray-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 text-[11px] font-black text-gray-900 uppercase tracking-[0.15em] hover:text-blue-600 transition-all group"
              >
                <Search className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                <span>Cari Produk</span>
              </button>
            )}
          </div>

          {/* Filter Harga */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <SlidersHorizontal className="h-3 w-3" /> Harga
            </h3>
            <div className="flex flex-col gap-2">
              {[{id:'all', l:'Semua Harga'}, {id:'under50', l:'Di bawah 50rb'}, {id:'above50', l:'Di atas 50rb'}].map((opt) => (
                <button 
                  key={opt.id} 
                  onClick={() => setPriceFilter(opt.id)}
                  className={`text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${priceFilter === opt.id ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Brand */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Brand</h3>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-2 scrollbar-hide">
              <button 
                onClick={() => setBrandFilter("all")}
                className={`text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${brandFilter === "all" ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}
              >Semua Brand</button>
              {brandsInCategory.map(brand => (
                <button 
                  key={brand} 
                  onClick={() => setBrandFilter(brand)}
                  className={`text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${brandFilter === brand ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}
                >{brand}</button>
              ))}
            </div>
          </div>

          <button onClick={() => {setPriceFilter("all"); setBrandFilter("all"); setSortOption("default"); setSearchQuery(""); setIsSearchOpen(false);}} className="w-full py-3.5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg active:scale-95">Reset Filter</button>
        </aside>

        {/* CONTENT AREA */}
        <div className="flex-1">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">{categoryName}</h1>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-3">Ditemukan {sortedProducts.length} Produk</p>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Urutkan:</span>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-white border-none rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider outline-none cursor-pointer shadow-sm">
                <option value="default">Default</option>
                <option value="trending">Terlaris</option>
                <option value="price-asc">Termurah</option>
                <option value="price-desc">Termahal</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="font-black text-gray-300 uppercase tracking-widest text-xs">Memuat Katalog...</p></div>
          ) : sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedProducts.map((p) => (
                <div key={p.id} className="group flex flex-col bg-white rounded-[2rem] border border-gray-100 p-4 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 hover:-translate-y-1">
                  <Link href={`/product/${p.id}`} className="relative aspect-square mb-4 overflow-hidden rounded-[1.5rem] bg-gray-50">
                    <img src={p.image || productFallbackImage} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </Link>
                  <div className="flex items-start justify-between gap-2 min-h-[44px]">
                    <p className="text-sm font-black text-gray-800 line-clamp-2 leading-tight uppercase tracking-tight">{p.name}</p>
                    <button onClick={(e) => { e.preventDefault(); addToCart(p); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex-shrink-0">
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{p.brand || 'Premium'}</span>
                      <span className="text-blue-600 font-black text-lg leading-none tracking-tighter">{formatRupiah(Number(p.price))}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-amber-600 border border-amber-100">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-[10px] font-black">{Number(p.rating).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
              <p className="text-gray-300 font-black text-3xl uppercase tracking-tighter mb-2">Produk Kosong</p>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Coba reset filter pencarian</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}