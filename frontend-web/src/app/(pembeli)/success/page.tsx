"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Receipt, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    // Memicu animasi masuk (slide up) dan membuat ID pesanan acak
    setMounted(true);
    setOrderId(`FS-${Math.floor(100000 + Math.random() * 900000)}`);
  }, []);

  return (
    // Latar belakang sekarang putih bersih (bg-white)
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-gray-800 font-sans overflow-hidden">
      
      {/* Kotak Utama / Card dengan efek animasi masuk */}
      <div 
        className={`bg-white max-w-md w-full rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-blue-900/10 border border-gray-100 flex flex-col items-center text-center relative z-10 transition-all duration-1000 ease-out transform ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        
        {/* Aksen Biru di atas card yang disesuaikan kembali (biru-biru gradien) */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#005B8C] to-[#0077B6]"></div>

        {/* Animasi Icon Centang (Ping & Sparkles) */}
        <div className="relative mb-6 mt-4">
          <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-50"></div>
          
          {/* Ikon Bintang Dekoratif */}
          <Sparkles className={`absolute -top-2 -right-4 h-6 w-6 text-yellow-400 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
          <Sparkles className={`absolute bottom-0 -left-6 h-5 w-5 text-blue-400 transition-all duration-700 delay-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />

          <div className="relative w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
              <Check className="h-8 w-8 text-white stroke-[3.5]" />
            </div>
          </div>
        </div>

        {/* Teks Keberhasilan dengan teks gradasi mewah */}
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-500">
          Pembayaran Berhasil!
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed px-2">
          Hore! Pesananmu telah masuk dan segera kami proses. Terima kasih telah berbelanja di <span className="font-black text-[#0077B6] italic">Frozen Shelly</span>.
        </p>

        {/* Info Tambahan (Desain Efek Potongan Tiket/Struk) */}
        <div className="w-full bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 relative">
          {/* Bolongan Tiket Kiri */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r border-gray-100 shadow-inner"></div>
          {/* Bolongan Tiket Kanan */}
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-l border-gray-100 shadow-inner"></div>
          
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Receipt className="h-5 w-5 text-[#0077B6]" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                <p className="text-sm font-black text-gray-800">{orderId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
              <p className="text-sm font-black text-green-600">Lunas</p>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="w-full flex flex-col gap-3">
          <Link href="/history" className="w-full">
            <button className="w-full py-4 bg-gradient-to-r from-[#0077B6] to-blue-600 text-white rounded-xl text-sm font-bold tracking-wide hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98] flex items-center justify-center gap-2 group">
              CEK RIWAYAT PESANAN
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
          
          <Link href="/" className="w-full">
            <button className="w-full py-4 bg-white text-gray-500 border-2 border-gray-100 rounded-xl text-sm font-bold tracking-wide hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#0077B6] transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              <ShoppingBag className="h-4 w-4" />
              BELANJA LAGI
            </button>
          </Link>
        </div>

      </div>

      {/* Footer Merek */}
      <div 
        className={`mt-12 flex flex-col items-center gap-2 transition-all duration-1000 delay-500 ${
          mounted ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
          Frozen Shelly Delivery
        </p>
      </div>
      
    </main>
  );
}