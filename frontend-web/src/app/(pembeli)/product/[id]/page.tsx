"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link'; // <-- Ditambahkan untuk mencegah 404 dan navigasi lebih mulus
import { getSocket, joinSocketContext } from '@/lib/socket';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  const fallbackProductImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop";

  // Stabilize fallback values
  const displayRating = useMemo(() => (product ? (product.rating ?? 4.8) : 4.8), [product?.id]);
  const displayReviews = useMemo(() => (product ? (product.reviews ?? (Math.floor(Math.random() * 50) + 10)) : 0), [product?.id]);
  const displaySold = useMemo(() => (product ? (product.sold ?? (Math.floor(Math.random() * 100) + 20)) : 0), [product?.id]);
  const displayDesc = useMemo(() => (product ? (product.description || "Produk frozen food berkualitas dengan bahan pilihan terbaik. Sangat praktis untuk disajikan kapan saja.") : ""), [product?.id]);

  const similarProducts = useMemo(() => {
    if (!product || allProducts.length === 0) return [];
    return allProducts
      .filter((item) => item.id !== product.id)
      .filter((item) => item.category === product.category || item.tag === product.tag)
      .slice(0, 4); // Dibatasi 4 agar lebih proporsional di grid
  }, [product, allProducts]);

  const ratingBreakdown = useMemo(() => {
    const reviews = Math.max(displayReviews, 1);
    const five = Math.max(1, Math.round(reviews * 0.45 + (displayRating - 4) * 3));
    const four = Math.max(0, Math.round(reviews * 0.25));
    const three = Math.max(0, Math.round(reviews * 0.15));
    const two = Math.max(0, Math.round(reviews * 0.1));
    const one = Math.max(0, reviews - five - four - three - two);

    const total = five + four + three + two + one || 1;
    return [
      { star: 5, count: five, percent: Math.round((five / total) * 100) },
      { star: 4, count: four, percent: Math.round((four / total) * 100) },
      { star: 3, count: three, percent: Math.round((three / total) * 100) },
      { star: 2, count: two, percent: Math.round((two / total) * 100) },
      { star: 1, count: one, percent: Math.round((one / total) * 100) },
    ];
  }, [displayRating, displayReviews]);

  const detailRatings = useMemo(() => [
    { label: "Rasa", value: Math.min(5, Math.max(3.5, displayRating + 0.2)) },
    { label: "Kualitas", value: Math.min(5, Math.max(3.5, displayRating)) },
    { label: "Kemasan", value: Math.min(5, Math.max(3.5, displayRating - 0.1)) },
  ], [displayRating]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    let userEmail = '';
    let userRole = 'guest';

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        userEmail = String(userData.email || '').trim().toLowerCase();
        userRole = String(userData.role || 'user').trim().toLowerCase();
      } catch (error) {
        console.error('Gagal membaca data user:', error);
      }
    }

    const socket = getSocket();

    const handleConnect = () => {
      joinSocketContext({ role: userRole, email: userEmail });
    };

    const handleStockUpdated = (payload: { id?: number; stock?: number }) => {
      if (!payload?.id) return;

      setProduct((prevProduct: any) => {
        if (!prevProduct || prevProduct.id !== payload.id) return prevProduct;
        return { ...prevProduct, stock: Number(payload.stock ?? prevProduct.stock) };
      });

      setAllProducts((prevProducts) =>
        prevProducts.map((item) =>
          item.id === payload.id
            ? { ...item, stock: Number(payload.stock ?? item.stock) }
            : item
        )
      );
    };

    socket.on('connect', handleConnect);
    socket.on('stock_updated', handleStockUpdated);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('stock_updated', handleStockUpdated);
    };
  }, []);

  useEffect(() => {
    const fetchProductFromDB = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${params.id}`);
        const data = await response.json();

        const productData = data.data || data;

        if (response.ok && productData && productData.id) {
          setProduct(productData);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Gagal mengambil data dari database:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProductFromDB();
    }
  }, [params.id]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");
        const data = await response.json();
        const products = data.data || data;
        setAllProducts(Array.isArray(products) ? products : []);
      } catch (error) {
        console.error("Gagal mengambil daftar produk untuk similar:", error);
      }
    };

    fetchAllProducts();
  }, []);

  const handleAddToCart = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setToast({ show: true, message: "Harap login untuk menambah ke keranjang." });
      setTimeout(() => {
        setToast({ show: false, message: "" });
        router.push("/auth/login");
      }, 2000);
      return;
    }

    setIsAdding(true);
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === product.id);
    
    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += quantity;
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        quantity: quantity,
        selected: true
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    
    // Trigger event agar navbar langsung update angkanya
    window.dispatchEvent(new Event("storage"));
    
    setTimeout(() => {
      setIsAdding(false);
      setToast({ show: true, message: "Produk ditambahkan ke keranjang!" });

      setTimeout(() => {
        setToast({ show: false, message: "" });
        router.push("/cart");
      }, 1200);
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <div className="text-center font-bold text-slate-500 animate-pulse">Menyiapkan Produk...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Produk Tidak Ditemukan</h1>
        <p className="text-slate-500 mb-8 text-center max-w-sm">Maaf, produk yang kamu cari tidak tersedia atau sudah dihapus dari katalog kami.</p>
        <button onClick={() => router.push('/')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 selection:bg-blue-500 selection:text-white">
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[60] animate-slide-in-right">
          <div className="bg-emerald-50 text-emerald-800 shadow-2xl rounded-2xl px-5 py-4 border border-emerald-100 min-w-[300px] flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Berhasil</p>
              <p className="text-sm font-bold leading-tight">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* BREADCRUMB HEADER */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="group text-slate-500 font-bold flex items-center gap-2 hover:text-blue-600 transition-colors text-sm bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          <div className="h-4 w-px bg-slate-300" />
          <p className="text-xs text-slate-400 font-bold tracking-wide truncate">
            Eksplorasi / <Link href="/" className="hover:text-blue-500">{product.category}</Link> / <span className="text-slate-800">{product.name}</span>
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* KARTU UTAMA PRODUK */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12">
          <div className="flex flex-col lg:flex-row">
            
            {/* FOTO PRODUK */}
            <div className="w-full lg:w-[45%] p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/50 flex items-center justify-center relative">
              {product.tag && (
                <span className="absolute top-8 left-8 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg shadow-blue-500/30 uppercase tracking-widest z-10">
                  {product.tag}
                </span>
              )}
              <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 group">
                <img 
                  src={product.image || fallbackProductImage} 
                  alt={product.name} 
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  onError={(e) => (e.currentTarget.src = fallbackProductImage)}
                />
              </div>
            </div>

            {/* DETAIL PRODUK */}
            <div className="w-full lg:w-[55%] p-6 sm:p-10 flex flex-col justify-center">
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                 <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                   Stok Tersedia
                 </span>
                 <div className="flex items-center text-xs text-slate-500 font-bold bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                   <span className="text-amber-500 mr-1.5 text-sm">★</span>
                   <span className="text-slate-800">{displayRating}</span>
                   <span className="mx-2 text-slate-300">|</span>
                   <span>{displayReviews} Ulasan</span>
                   <span className="mx-2 text-slate-300">|</span>
                   <span>Terjual {displaySold}</span>
                 </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 leading-tight tracking-tight">
                {product.name}
              </h1>
              
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-8 inline-block">
                Rp {Number(product.price).toLocaleString('id-ID')}
              </p>

              <div className="mb-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Deskripsi Produk</h3>
                <p className="text-slate-600 leading-relaxed text-sm font-medium">
                  {displayDesc}
                </p>
              </div>

              {/* RATING SECTION */}
              <section className="mb-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-blue-500 font-black mb-1">Feedback</p>
                    <h3 className="text-xl font-black text-slate-900">Ulasan & Kualitas</h3>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                    <div className="text-center">
                      <p className="text-3xl font-black text-slate-900 leading-none">{displayRating.toFixed(1)}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Dari 5</p>
                    </div>
                    <div className="flex text-amber-400 text-xl">
                       ★★★★★
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {detailRatings.map((detail) => (
                    <div key={detail.label} className="rounded-2xl bg-slate-50 p-4 text-center border border-slate-100">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">{detail.label}</p>
                      <p className="text-lg font-black text-slate-800">{detail.value.toFixed(1)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5">
                  {ratingBreakdown.map((row) => (
                    <div key={row.star} className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-600 w-[24px] flex items-center gap-1">{row.star}<span className="text-amber-400">★</span></span>
                      <div className="h-2.5 rounded-full flex-1 bg-slate-100 overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full" style={{ width: `${row.percent}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-400 w-[32px] text-right">{row.count}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ADD TO CART ACTION */}
              <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl shadow-slate-900/20 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-300">Atur Jumlah Pembelian</span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    Sisa stok: <span className="text-white font-black">{product.stock}</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl h-14 w-full sm:w-36 overflow-hidden">
                    <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors font-bold text-xl">-</button>
                    <span className="flex-1 text-center font-black text-lg">{quantity}</span>
                    <button onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))} className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors font-bold text-xl">+</button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || product.stock === 0}
                    className="flex-1 w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl font-black text-sm uppercase tracking-widest hover:from-blue-500 hover:to-cyan-400 transition-all active:scale-[0.98] disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 border border-blue-400/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {isAdding ? "Memproses..." : "Masuk Keranjang"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* PRODUK SERUPA (Menambahkan Tombol Lihat Semua yang Bekerja) */}
        {similarProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-blue-600 font-black mb-2">Eksplorasi Lainnya</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Kamu mungkin suka</h2>
              </div>
              
              {/* TOMBOL LIHAT SEMUA YANG LEBIH MENARIK DAN AMAN */}
              <Link 
                href="/" 
                className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 hover:text-blue-600 rounded-full text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 w-fit"
              >
                Lihat Semua Produk
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {similarProducts.map((item) => (
                <div key={item.id} className="group/card bg-white rounded-3xl border border-slate-100 p-4 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-500 flex flex-col h-full">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-4 border border-slate-100">
                    <img
                      src={item.image || fallbackProductImage}
                      alt={item.name}
                      className="object-cover w-full h-full group-hover/card:scale-110 transition-transform duration-700"
                      onError={(e) => (e.currentTarget.src = fallbackProductImage)}
                    />
                    {item.tag && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{item.category || "Frozen"}</p>
                    <h3 className="text-sm font-black text-slate-800 line-clamp-2 leading-tight mb-2 group-hover/card:text-blue-600 transition-colors">{item.name}</h3>
                    <p className="text-base font-black text-slate-900 mt-auto">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                    
                    {/* TOMBOL LIHAT PRODUK YANG DIPERCANTIK */}
                    <Link
                      href={`/product/${item.id}`}
                      className="group/btn mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500 text-slate-600 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all duration-300 border border-slate-200 hover:border-transparent hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      <span>Lihat Detail</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}