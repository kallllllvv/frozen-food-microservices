"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DetailNotaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  // Data Dummy Nota (Nanti ditarik pake API berdasarkan ID)
  const nota = {
    id: id,
    tanggal: "28 April 2026",
    status: "Selesai",
    penerima: "Zhawa Kamela",
    alamat: "Jl. Kalibata City No. 10, Jakarta Selatan",
    metodeBayar: "QRIS / ShopeePay",
    items: [
      { nama: "Nugget Ayam Crispy 500gr", qty: 2, harga: 45000 },
      { nama: "Sosis Sapi Bakar Jumbo", qty: 1, harga: 52000 },
    ],
    subtotal: 142000,
    ongkir: 15000,
    total: 157000
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-12 px-4 text-black">
      <div className="max-w-2xl mx-auto">
        
        {/* Header Nota */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.back()} className="text-sm font-black text-gray-400 hover:text-black">
            ← KEMBALI
          </button>
          <button onClick={() => window.print()} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50">
            CETAK NOTA
          </button>
        </div>

        {/* Kertas Nota */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-100/50 overflow-hidden border border-gray-100">
          {/* Bagian Atas: Status */}
          <div className="bg-gray-900 p-10 text-white flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Nota Transaksi</p>
              <h1 className="text-2xl font-black italic">FrozenGo</h1>
            </div>
            <div className="text-right">
               <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {nota.status}
               </span>
               <p className="text-[10px] font-bold mt-2 text-gray-400">{nota.tanggal}</p>
            </div>
          </div>

          <div className="p-10">
            {/* Info Pengiriman */}
            <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b border-dashed border-gray-200">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Penerima</p>
                <p className="text-sm font-black text-black">{nota.penerima}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{nota.alamat}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ID Transaksi</p>
                <p className="text-sm font-black text-[#0077B6]">{nota.id}</p>
                <p className="text-[10px] font-bold mt-4 text-gray-400 uppercase">Pembayaran</p>
                <p className="text-[11px] font-black text-gray-900">{nota.metodeBayar}</p>
              </div>
            </div>

            {/* List Item */}
            <div className="space-y-6 mb-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rincian Produk</p>
              {nota.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.nama}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{item.qty} x Rp {item.harga.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-black text-black">Rp {(item.qty * item.harga).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Totalan */}
            <div className="bg-[#F8FAFC] p-8 rounded-[30px] space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Subtotal</span>
                <span>Rp {nota.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Biaya Pengiriman</span>
                <span>Rp {nota.ongkir.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="text-sm font-black uppercase">Total Bayar</span>
                <span className="text-xl font-black text-[#0077B6]">Rp {nota.total.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-center text-[10px] font-bold text-gray-300 mt-10 uppercase tracking-[0.5em]">
              Terima Kasih Telah Belanja di FrozenGo
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}