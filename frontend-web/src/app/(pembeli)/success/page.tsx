"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Receipt, ShoppingBag } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-gray-800 font-sans">
      
      {/* Kotak Utama / Card */}
      <div className="bg-white max-w-md w-full rounded-[32px] p-8 md:p-10 shadow-2xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Aksen Biru di atas card */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0077B6] to-blue-300"></div>

        {/* Animasi Icon Centang (Ping & Pulse Effect) */}
        <div className="relative mb-8 mt-4">
          <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-60"></div>
          <div className="relative w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
              <Check className="h-8 w-8 text-white stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Teks Keberhasilan */}
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-3">
          Pembayaran Berhasil!
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed px-2">
          Hore! Pesananmu sudah masuk dan sedang kami proses. Terima kasih telah berbelanja di <span className="font-black text-[#0077B6] italic">Frozen Shelly</span>.
        </p>

        {/* Info Tambahan */}
        <div className="w-full bg-blue-50/50 rounded-2xl p-4 mb-8 flex items-center justify-center gap-3 border border-dashed border-blue-200">
          <Receipt className="h-5 w-5 text-[#0077B6]" />
          <span className="text-sm font-medium text-gray-700">Bukti transaksi telah tersimpan di riwayat.</span>
        </div>

        {/* Tombol Aksi */}
        <div className="w-full flex flex-col gap-3">
          <Link href="/history" className="w-full">
            <button className="w-full py-4 bg-[#0077B6] text-white rounded-xl text-sm font-bold tracking-wide hover:bg-[#005B8C] transition-all shadow-lg shadow-[#0077B6]/30 active:scale-[0.98] flex items-center justify-center gap-2">
              <Receipt className="h-4 w-4" />
              CEK RIWAYAT PESANAN
            </button>
          </Link>
          
          <Link href="/" className="w-full">
            <button className="w-full py-4 bg-white text-gray-500 border-2 border-gray-100 rounded-xl text-sm font-bold tracking-wide hover:border-[#0077B6] hover:text-[#0077B6] transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              <ShoppingBag className="h-4 w-4" />
              BELANJA LAGI
            </button>
          </Link>
        </div>

      </div>

      {/* Footer Merek */}
      <div className="mt-12 opacity-60 flex flex-col items-center gap-2">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
          Frozen Shelly Delivery
        </p>
      </div>
      
    </main>
  );
}