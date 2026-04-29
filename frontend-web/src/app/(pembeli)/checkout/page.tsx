"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createOrder } from '@/lib/order';

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  selected: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("QRIS");
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCustomerName(parsedUser.name || '');
      } catch (error) {
        console.error('Gagal membaca data user:', error);
      }
    }

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartItems: CartItem[] = JSON.parse(savedCart);
        setSelectedItems(cartItems.filter((item) => item.selected));
      } catch (error) {
        console.error('Gagal membaca cart untuk checkout:', error);
      }
    }
  }, []);

  const total = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems]
  );

  const methods = [
    { id: "QRIS", name: "QRIS / ShopeePay", icon: "📱", color: "bg-blue-600" },
    { id: "BRI", name: "BRI Virtual Account", icon: "🏦", color: "bg-orange-500" },
    { id: "GOPAY", name: "GoPay / DANA", icon: "💳", color: "bg-green-600" },
  ];

  const handleBayar = async () => {
    if (selectedItems.length === 0) {
      setErrorMessage('Tidak ada item yang dipilih untuk checkout.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setErrorMessage('Nama, nomor telepon, dan alamat pengiriman wajib diisi.');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);

    try {
      const response = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        notes: notes.trim() || `Metode pembayaran: ${selectedMethod}`,
        items: selectedItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });

      const createdOrderId = response?.data?.id;
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const remainingCart = Array.isArray(savedCart)
        ? savedCart.filter((item: CartItem) => !item.selected)
        : [];

      localStorage.setItem('cart', JSON.stringify(remainingCart));

      alert(`Pembayaran berhasil via ${selectedMethod}! Pesanan sudah tersimpan di backend.`);

      if (createdOrderId) {
        router.push(`/history/${createdOrderId}`);
        return;
      }

      router.push('/success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal membuat pesanan.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-black">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-blue-100/50 p-8 border border-white text-center">
          <h1 className="text-xl font-black uppercase tracking-tighter text-black mb-3">Checkout Kosong</h1>
          <p className="text-sm text-gray-500 mb-6">Belum ada produk yang dipilih di keranjang untuk dibayar.</p>
          <Link href="/cart" className="inline-flex items-center justify-center w-full py-4 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em]">
            Kembali ke Keranjang
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-black">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-100/50 p-8 border border-white">
          
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-black">Pilih Pembayaran</h1>
          </div>

          <div className="bg-gray-900 p-6 rounded-[30px] mb-8 text-white">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tagihan</p>
            <p className="text-2xl font-black tracking-tighter">
              Rp {total.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="space-y-4 mb-8 text-black">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Penerima</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama penerima"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nomor Telepon</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Alamat Pengiriman</label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[96px] resize-none"
                placeholder="Tulis alamat pengiriman lengkap"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Catatan Tambahan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                placeholder="Opsional"
              />
            </div>
          </div>

          {/* OPSI METODE BAYAR */}
          <div className="space-y-3 mb-10 text-black">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">Metode Tersedia</p>
            {methods.map((method) => (
              <div 
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-[24px] border-2 transition-all cursor-pointer flex items-center justify-between ${
                  selectedMethod === method.id 
                  ? "border-blue-600 bg-blue-50/50" 
                  : "border-gray-50 bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${method.color} rounded-xl flex items-center justify-center text-white text-lg`}>
                    {method.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight">{method.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Konfirmasi Instan</p>
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mb-8 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ringkasan Item</p>
            <div className="space-y-2 max-h-44 overflow-auto pr-1">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight">{item.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <p className="text-xs font-black text-gray-900">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-semibold text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleBayar}
              disabled={isProcessing}
              className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                isProcessing 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-black shadow-xl shadow-blue-100 active:scale-95"
              }`}
            >
              {isProcessing ? "Menghubungkan..." : `Bayar Pake ${selectedMethod}`}
            </button>
            
            <Link href="/cart" className="block text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500">
              Kembali ke Keranjang
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}