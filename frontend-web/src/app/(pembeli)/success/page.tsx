"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-black">
      {/* Animasi Icon Centang */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center animate-bounce">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-center">Pesanan Diterima!</h1>
      <p className="text-gray-500 text-sm mb-12 text-center max-w-xs font-medium leading-relaxed">
        Pembayaran udah masuk. 
        <span className="text-black font-black italic">FrozenGo</span>.
      </p>

      <div className="flex flex-col w-full max-w-xs gap-4">
        <Link href="/history" className="w-full">
          <button className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-100">
            Cek Riwayat Pesanan
          </button>
        </Link>
        
        <Link href="/" className="w-full">
          <button className="w-full py-4 bg-white text-gray-400 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-black transition-all">
            Belanja Lagi
          </button>
        </Link>
      </div>

      <div className="mt-20">
        <p className="text-[10px] font-bold text-gray-200 uppercase tracking-[0.5em]">FrozenGo Delivery</p>
      </div>
    </main>
  );
}