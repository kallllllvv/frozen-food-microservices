"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  selected: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Gagal parse keranjang:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, mounted]);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const toggleSelect = (id: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setCartItems((prev) => prev.map((item) => ({ ...item, selected: isChecked })));
  };

  const removeItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const removeSelectedItems = () => {
    setCartItems((prev) => prev.filter((item) => !item.selected));
  };

  const selectedItems = cartItems.filter(item => item.selected);
  const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const isAllSelected = cartItems.length > 0 && cartItems.every(i => i.selected);

  if (!mounted) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* HEADER / BREADCRUMB (Sama dengan Product Detail) */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button 
            onClick={() => router.push('/')} 
            className="text-blue-600 font-semibold flex items-center gap-2 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Belanja Lagi
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <p className="text-xs text-gray-500 font-medium tracking-wide">
            Keranjang Belanja
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Keranjang Belanja</h1>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          
          {/* KOLOM KIRI: Daftar Produk */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* Header List Action */}
              <div className="bg-gray-50/50 p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3 pl-2">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-700">Pilih Semua</span>
                </div>
                <button 
                  className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 pr-2"
                  onClick={removeSelectedItems}
                  disabled={selectedItems.length === 0}
                >
                  Hapus Terpilih
                </button>
              </div>

              {/* List Item Keranjang */}
              <div className="divide-y divide-gray-100">
                {cartItems.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                       </svg>
                    </div>
                    <p className="text-gray-500 font-medium mb-6">Keranjang belanjamu masih kosong.</p>
                    <Link href="/" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                      Mulai Belanja
                    </Link>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                      
                      {/* Checkbox & Gambar */}
                      <div className="flex items-center gap-4 pl-2">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-100 overflow-hidden">
                           <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                        </div>
                      </div>

                      {/* Info & Aksi */}
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full pr-2">
                        
                        <div className="flex-1">
                          <Link href={`/product/${item.id}`} className="hover:text-blue-600 transition-colors">
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{item.name}</h3>
                          </Link>
                          <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                          <p className="text-base font-extrabold text-blue-600">
                            Rp {item.price.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Kontrol + / - dan Hapus */}
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                          
                          {/* Tombol Delete */}
                          <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2" title="Hapus">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          
                          {/* Counter Quantity */}
                          <div className="flex items-center border border-gray-300 rounded-lg bg-white h-10 w-28">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="flex-1 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors font-bold rounded-l-lg disabled:opacity-40"
                              disabled={item.quantity <= 1}
                            >-</button>
                            <span className="flex-1 text-center font-bold text-gray-900 text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="flex-1 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors font-bold rounded-r-lg"
                            >+</button>
                          </div>

                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Ringkasan Belanja */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Ringkasan Belanja</h2>
              
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total Harga ({selectedItems.reduce((acc, i) => acc + i.quantity, 0)} barang)</span>
                  <span className="font-semibold text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Diskon</span>
                  <span className="font-semibold text-green-600">- Rp 0</span>
                </div>
                
                {/* Pembatas */}
                <div className="pt-4 border-t border-gray-200 mt-2 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Total Tagihan</span>
                  <span className="text-xl font-extrabold text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <Link href="/checkout" className="block mt-6">
                <button
                    onClick={() => {
                      // Simpan total harga yang dipilih ke localStorage agar bisa ditarik di halaman Checkout
                      localStorage.setItem("checkout_total", subtotal.toString());
                      router.push("/checkout");
                    }}
                    disabled={selectedItems.length === 0}
                    className="w-full h-12 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-blue-200 flex items-center justify-center"
                  >
                    Beli ({selectedItems.length})
                  </button>

                  {selectedItems.length === 0 && cartItems.length > 0 && (
                    <p className="text-xs text-red-500 font-medium mt-4 text-center">
                        *Pilih minimal 1 barang untuk checkout.
                    </p>
                  )}
              </Link>
              
              {selectedItems.length === 0 && cartItems.length > 0 && (
                <p className="text-xs text-red-500 font-medium mt-4 text-center">
                  *Pilih minimal 1 barang untuk checkout.
                </p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}