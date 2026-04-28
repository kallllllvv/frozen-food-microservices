"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// DATA LENGKAP: Sama dengan Homepage
const products = [
  { 
    id: 1, 
    name: "Nugget Ayam Crispy 500gr", 
    category: "Ayam",
    priceText: "Rp 45.000", 
    priceNum: 45000,
    stock: 4, 
    sold: 124,
    rating: 4.8,
    reviews: 32,
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop", 
    description: "Nugget ayam pilihan dengan balutan tepung roti yang ekstra renyah. Cocok untuk bekal anak sekolah atau camilan keluarga. Tanpa bahan pengawet buatan.",
    tag: "Best Seller" 
  },
  { 
    id: 2, 
    name: "Sosis Sapi Bakar Jumbo", 
    category: "Daging",
    priceText: "Rp 52.000", 
    priceNum: 52000,
    stock: 25, 
    sold: 89,
    rating: 4.9,
    reviews: 45,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop", 
    description: "Sosis sapi premium dengan bumbu rempah yang meresap. Tekstur kenyal dan sangat nikmat jika dibakar atau digoreng. Isi 6 pcs per kemasan.",
    tag: "Diskon" 
  },
  { 
    id: 3, 
    name: "Kentang Goreng Shoestring 1kg", 
    category: "Camilan",
    priceText: "Rp 32.000", 
    priceNum: 32000,
    stock: 8, 
    sold: 200,
    rating: 4.7,
    reviews: 60,
    image: "https://images.unsplash.com/photo-1630384066202-18d038253a1d?q=80&w=800&auto=format&fit=crop", 
    description: "Kentang potong beku kualitas restoran (Shoestring cut). Renyah di luar dan lembut di dalam. Sangat praktis untuk teman nonton film.",
    tag: "" 
  },
  { 
    id: 4, 
    name: "Bakso Sapi Asli Isi 50", 
    category: "Daging",
    priceText: "Rp 60.000", 
    priceNum: 60000,
    stock: 12, 
    sold: 150,
    rating: 4.9,
    reviews: 78,
    image: "https://images.unsplash.com/photo-1529006557810-264b5ca99197?q=80&w=800&auto=format&fit=crop", 
    description: "Bakso sapi asli tanpa bahan pengenyal buatan. Rasa daging sapinya sangat terasa. Cocok untuk campuran kuah kaldu atau dibakar.",
    tag: "Baru" 
  },
  { 
    id: 5, 
    name: "Dimsum Ayam Mix Isi 15", 
    category: "Camilan",
    priceText: "Rp 40.000", 
    priceNum: 40000,
    stock: 3, 
    sold: 56,
    rating: 4.6,
    reviews: 12,
    image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=800&auto=format&fit=crop", 
    description: "Aneka dimsum ayam dengan berbagai topping menarik (jamur, wortel, kepiting). Tinggal kukus 10 menit dan siap dihidangkan.",
    tag: "" 
  },
  { 
    id: 6, 
    name: "Ikan Dory Fillet 1kg", 
    category: "Seafood",
    priceText: "Rp 55.000", 
    priceNum: 55000,
    stock: 15, 
    sold: 42,
    rating: 4.8,
    reviews: 10,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop", 
    description: "Daging ikan dory fillet yang sudah bersih tanpa duri. Sangat praktis untuk dimasak dory crispy asam manis atau di-pan seared.",
    tag: "Frozen" 
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mencari produk berdasarkan ID dari URL
    const foundProduct = products.find(p => p.id === Number(params.id));
    if (foundProduct) {
      setProduct(foundProduct);
    }
    setLoading(false);
  }, [params.id]);

  const handleAddToCart = () => {
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
        price: product.priceNum,
        image: product.image,
        quantity: quantity,
        selected: true
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));

    setTimeout(() => {
      setIsAdding(false);
      alert("Produk berhasil ditambahkan ke keranjang!");
      router.push("/cart"); 
    }, 300);
  };

  if (loading) return null; // Layar kosong saat loading
  if (!product) return <div className="p-20 text-center font-bold text-gray-500">Memuat produk...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
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
                   <span className="text-gray-900 font-bold">{product.rating}</span>
                   <span className="mx-2">•</span>
                   <span>{product.reviews} Ulasan</span>
                   <span className="mx-2">•</span>
                   <span>{product.sold} Terjual</span>
                 </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-snug">
                {product.name}
              </h1>
              
              <p className="text-3xl font-extrabold text-blue-600 mb-6">
                {product.priceText}
              </p>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Deskripsi Produk</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {product.description}
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