"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

  // Stabilize fallback values with hooks called unconditionally
  const displayRating = useMemo(() => (product ? (product.rating ?? 4.8) : 4.8), [product?.id]);
  const displayReviews = useMemo(() => (product ? (product.reviews ?? (Math.floor(Math.random() * 50) + 10)) : 0), [product?.id]);
  const displaySold = useMemo(() => (product ? (product.sold ?? (Math.floor(Math.random() * 100) + 20)) : 0), [product?.id]);
  const displayDesc = useMemo(() => (product ? (product.description || "Produk frozen food berkualitas dengan bahan pilihan terbaik. Sangat praktis untuk disajikan kapan saja.") : ""), [product?.id]);

  const similarProducts = useMemo(() => {
    if (!product || allProducts.length === 0) return [];
    return allProducts
      .filter((item) => item.id !== product.id)
      .filter((item) => item.category === product.category || item.tag === product.tag)
      .slice(0, 5);
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
    // Check if user is logged in
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setToast({ show: true, message: "Buat akun terlebih dahulu untuk menambahkan ke keranjang" });
      setTimeout(() => {
        setToast({ show: false, message: "" });
        router.push("/auth/register");
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
        price: product.price, // Mengambil langsung dari DB
        image: product.image,
        quantity: quantity,
        selected: true
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    setTimeout(() => {
      setIsAdding(false);
      setToast({ show: true, message: "Produk berhasil ditambahkan ke keranjang!" });

      setTimeout(() => {
        setToast({ show: false, message: "" });
        router.push("/cart");
      }, 1200);
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center font-bold text-gray-500 animate-pulse">Memuat data dari database...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Produk Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-6 text-center">Maaf, produk dengan ID {params.id} tidak ada di database.</p>
        <button 
          onClick={() => router.back()} 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {toast.show && (
        <div className="fixed top-4 right-4 z-[60] animate-slide-in-right">
          <div className="bg-green-600 text-white shadow-xl rounded-xl px-4 py-3 border border-green-500 min-w-[280px]">
            <p className="text-xs font-black uppercase tracking-wide mb-0.5">Berhasil</p>
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        </div>
      )}
      
      {/* HEADER / BREADCRUMB */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="text-blue-600 font-semibold flex items-center gap-2 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <p className="text-xs text-gray-500 font-medium tracking-wide">
            {product.category} / <span className="text-gray-900">{product.name}</span>
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            
            {/* AREA GAMBAR (KIRI) */}
            <div className="w-full lg:w-1/2 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <img 
                  src={product.image || fallbackProductImage} 
                  alt={product.name} 
                  className="object-cover w-full h-full"
                  onError={(e) => (e.currentTarget.src = fallbackProductImage)}
                />
                {product.tag && (
                  <span className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-bold shadow-sm uppercase tracking-wider">
                    {product.tag}
                  </span>
                )}
              </div>
            </div>

            {/* AREA INFO PRODUK (KANAN) */}
            <div className="w-full lg:w-1/2 p-6 lg:p-10 flex flex-col justify-center">
              
              {/* Rating & Terjual */}
              <div className="flex items-center gap-3 mb-4">
                 <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase">
                   Tersedia
                 </span>
                 <div className="flex items-center text-sm text-gray-500 font-medium">
                   <span className="text-yellow-400 mr-1 text-base">★</span>
                   <span className="text-gray-900 font-bold">{displayRating}</span>
                   <span className="mx-2">•</span>
                   <span>{displayReviews} Ulasan</span>
                   <span className="mx-2">•</span>
                   <span>{displaySold} Terjual</span>
                 </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-snug">
                {product.name}
              </h1>
              
              <p className="text-3xl font-extrabold text-blue-600 mb-6">
                Rp {Number(product.price).toLocaleString('id-ID')}
              </p>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Deskripsi Produk</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {displayDesc}
                </p>
              </div>

              <section className="mb-8 rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center justify-between mb-4 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-black">Detail Rating</p>
                    <h3 className="text-xl font-black text-gray-900">Ulasan & Kualitas</h3>
                  </div>
                  <div className="rounded-3xl bg-white px-4 py-3 shadow-sm text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Rating Rata-rata</p>
                    <p className="text-3xl font-black text-gray-900">{displayRating.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">dari 5</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {detailRatings.map((detail) => (
                    <div key={detail.label} className="rounded-3xl bg-white p-4 border border-gray-200">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-black mb-2">{detail.label}</p>
                      <p className="text-xl font-black text-gray-900">{detail.value.toFixed(1)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {ratingBreakdown.map((row) => (
                    <div key={row.star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-[24px]">{row.star}★</span>
                      <div className="h-2 rounded-full flex-1 bg-gray-200 overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: `${row.percent}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-[32px] text-right">{row.count}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  Berdasarkan {displayReviews} ulasan pelanggan, produk ini mendapat rating rata-rata {displayRating.toFixed(1)} dari 5.
                </p>
              </section>

              <hr className="border-gray-200 mb-6" />

              {/* KONTROL QUANTITY & BUTTON */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Atur Jumlah</span>
                <span className="text-xs font-medium text-gray-500">Sisa stok: <span className="font-bold text-gray-900">{product.stock}</span></span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                {/* Counter */}
                <div className="flex items-center border border-gray-300 rounded-lg bg-white h-12 w-full sm:w-32">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors font-bold text-lg rounded-l-lg"
                  >-</button>
                  <span className="flex-1 text-center font-bold text-gray-900">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                    className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors font-bold text-lg rounded-r-lg"
                  >+</button>
                </div>

                {/* Tombol Add to Cart (BIRU) */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || product.stock === 0}
                  className="flex-1 w-full h-12 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {isAdding ? "Memproses..." : "Keranjang"}
                </button>
              </div>

            </div>
          </div>
        </div>

        {similarProducts.length > 0 && (
          <section className="mt-10 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-black">Produk Serupa</p>
                <h2 className="text-2xl font-black text-gray-900">Kamu mungkin suka</h2>
              </div>
              <p className="text-sm text-gray-500">Berdasarkan kategori dan tag produk</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarProducts.map((item) => (
                <div key={item.id} className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-4 hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-white mb-4">
                    <img
                      src={item.image || fallbackProductImage}
                      alt={item.name}
                      className="object-cover w-full h-full"
                      onError={(e) => (e.currentTarget.src = fallbackProductImage)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black text-gray-900 line-clamp-2">{item.name}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.category || "Frozen"}</span>
                      <span>Rp {Number(item.price).toLocaleString('id-ID')}</span>
                    </div>
                    <button
                      onClick={() => router.push(`/product/${item.id}`)}
                      className="w-full py-2 text-xs font-black uppercase rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Lihat
                    </button>
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