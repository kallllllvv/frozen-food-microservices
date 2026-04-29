"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  // Stabilize fallback values with hooks called unconditionally
  const displayRating = useMemo(() => (product ? (product.rating ?? 4.8) : 4.8), [product?.id]);
  const displayReviews = useMemo(() => (product ? (product.reviews ?? (Math.floor(Math.random() * 50) + 10)) : 0), [product?.id]);
  const displaySold = useMemo(() => (product ? (product.sold ?? (Math.floor(Math.random() * 100) + 20)) : 0), [product?.id]);
  const displayDesc = useMemo(() => (product ? (product.description || "Produk frozen food berkualitas dengan bahan pilihan terbaik. Sangat praktis untuk disajikan kapan saja.") : ""), [product?.id]);

  useEffect(() => {
    const fetchProductFromDB = async () => {
      try {
        // PENTING: Sesuaikan URL ini dengan endpoint API backend kamu
        // Misalnya backend berjalan di port 5000 dengan route /api/products
        const response = await fetch(`http://localhost:5000/api/products/${params.id}`);
        const data = await response.json();

        // Asumsi backend me-return data di dalam object (misal: data.data) atau langsung objeknya
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
                  src={product.image} 
                  alt={product.name} 
                  className="object-cover w-full h-full"
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
      </main>
    </div>
  );
}