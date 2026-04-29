"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const [total, setTotal] = useState("0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("QRIS");

  useEffect(() => {
    const savedTotal = localStorage.getItem("checkout_total");
    if (savedTotal) setTotal(savedTotal);
  }, []);

  const methods = [
    { id: "QRIS", name: "QRIS / ShopeePay", icon: "📱", color: "bg-blue-600" },
    { id: "BRI", name: "BRI Virtual Account", icon: "🏦", color: "bg-orange-500" },
    { id: "GOPAY", name: "GoPay / DANA", icon: "💳", color: "bg-green-600" },
  ];

  const handleBayar = () => {
    setIsProcessing(true);

    // LOGIKA SIMPAN KE HISTORY
    const pesananBaru = {
      id: "FS-" + Math.floor(1000 + Math.random() * 9000),
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      total: total,
      status: "Diproses",
      metode: selectedMethod
    };

    setTimeout(() => {
      // Ambil data history lama, tambah pesanan baru di paling atas
      const historyLama = JSON.parse(localStorage.getItem("order_history") || "[]");
      localStorage.setItem("order_history", JSON.stringify([pesananBaru, ...historyLama]));

      alert(`Pembayaran Berhasil via ${selectedMethod}! Pesanan sedang diproses.`);
      localStorage.removeItem("checkout_total");
      router.push("/success");
    }, 1500);
  };

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
              Rp {parseInt(total).toLocaleString('id-ID')}
            </p>
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