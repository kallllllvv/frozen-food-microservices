"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DetailNotaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  
  const [nota, setNota] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailOrder = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${id}`);
        const data = await res.json();
        
        if (res.ok && data.success !== false) {
          setNota(data.data || data); 
        } else {
          alert("Gagal memuat detail nota.");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetailOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0077B6]"></div>
      </div>
    );
  }

  if (!nota) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center text-black">
        <p className="font-bold text-gray-400 mb-4">Nota tidak ditemukan.</p>
        <button onClick={() => router.back()} className="text-blue-600 text-sm font-black underline">Kembali</button>
      </div>
    );
  }

  // Hitung subtotal dan ongkir dengan aman (menggunakan nota.total dari backend)
  const calculatedSubtotal = nota.items.reduce((sum: number, item: any) => sum + (item.qty * item.harga), 0);
  const ongkir = nota.total - calculatedSubtotal;
  
  // Tanggal langsung ambil dari backend yang sudah diformat
  const formattedDate = nota.date;

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-12 px-4 text-black">
      <div className="max-w-2xl mx-auto">
        
        {/* Header Nota */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.back()} className="text-sm font-black text-gray-400 hover:text-black">
            ← KEMBALI
          </button>
          <button onClick={() => window.print()} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
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
               <p className="text-[10px] font-bold mt-2 text-gray-400">{formattedDate}</p>
            </div>
          </div>

          <div className="p-10">
            {/* Info Pengiriman */}
            <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b border-dashed border-gray-200">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Penerima</p>
                <p className="text-sm font-black text-black">{nota.customer_name || nota.user_email}</p>
                <p className="text-[11px] font-bold text-gray-500 mt-1">{nota.customer_phone || "-"}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{nota.shipping_address || "Tidak ada alamat"}</p>
                {nota.notes && <p className="text-[10px] text-orange-500 mt-2 font-bold bg-orange-50 p-2 rounded-md">Catatan: {nota.notes}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ID Transaksi</p>
                <p className="text-sm font-black text-[#0077B6]">{nota.id}</p>
                <p className="text-[10px] font-bold mt-4 text-gray-400 uppercase">Pembayaran</p>
                <p className="text-[11px] font-black text-gray-900">{nota.payment_method}</p>
              </div>
            </div>

            {/* List Item */}
            <div className="space-y-6 mb-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rincian Produk</p>
              {nota.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.nama}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{item.qty} x Rp {item.harga.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-black text-black">Rp {(item.subtotal).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Totalan */}
            <div className="bg-[#F8FAFC] p-8 rounded-[30px] space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Subtotal Produk</span>
                <span>Rp {calculatedSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Biaya Lainnya / Ongkir</span>
                <span>Rp {ongkir > 0 ? ongkir.toLocaleString() : "0"}</span>
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