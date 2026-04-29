"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Fungsi untuk memformat warna dan teks status
const formatStatus = (status: string) => {
  if (!status) return "-";
  
  switch (status.toLowerCase()) {
    case 'selesai':
      return 'Selesai';
    case 'diproses':
      return 'Sedang Diproses';
    case 'batal':
      return 'Dibatalkan';
    default:
      return status;
  }
};

export default function DetailNotaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  // State untuk menyimpan data dari Backend
  const [nota, setNota] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mengambil data dari Backend saat halaman pertama kali dibuka
  useEffect(() => {
    const fetchDetailNota = async () => {
      try {
        // Sesuaikan URL dan Port ini dengan alamat backend kamu yang sebenarnya
        // Misalnya backend kamu jalan di port 5000 dan route-nya /api/orders
        const response = await fetch(`http://localhost:5000/api/orders/${id}`);
        const data = await response.json();

        if (response.ok) {
          // Backend me-return objek langsung berdasarkan controller getOrderDetail
          setNota(data);
        } else {
          setError(data.message || "Nota tidak ditemukan");
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setError("Terjadi kesalahan pada server. Coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetailNota();
    }
  }, [id]);

  // Tampilan saat data masih dimuat (Loading)
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-black">
        <p className="font-bold animate-pulse">Memuat Nota Transaksi...</p>
      </main>
    );
  }

  // Tampilan jika data tidak ditemukan atau error
  if (error || !nota) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-black space-y-4">
        <p className="font-bold text-red-500">{error || "Data nota tidak ditemukan."}</p>
        <button onClick={() => router.back()} className="text-sm font-bold text-[#0077B6] underline">
          Kembali ke Riwayat
        </button>
      </main>
    );
  }

  // Hitung Subtotal karena di backend total_amount = subtotal (belum ada ongkir di database)
  const subtotal = nota.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
  const ongkir = nota.total - subtotal; // Jika nanti di masa depan backend ditambah fitur ongkir

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
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                 nota.status === 'Diproses' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
               }`}>
                  {formatStatus(nota.status)}
               </span>
               {/* Backend menggunakan alias 'date' untuk DATE_FORMAT */}
               <p className="text-[10px] font-bold mt-2 text-gray-400">{nota.date}</p>
            </div>
          </div>

          <div className="p-10">
            {/* Info Pengiriman */}
            <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b border-dashed border-gray-200">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Penerima</p>
                {/* Fallback jika customer_name kosong di DB, pakai email */}
                <p className="text-sm font-black text-black">{nota.customer_name || nota.user_email}</p>
                
                {nota.customer_phone && (
                  <p className="text-[11px] font-bold text-gray-600 mt-1">{nota.customer_phone}</p>
                )}
                
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  {nota.shipping_address || "Alamat belum diisi"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ID Transaksi</p>
                <p className="text-sm font-black text-[#0077B6]">#{nota.id}</p>
                <p className="text-[10px] font-bold mt-4 text-gray-400 uppercase">Pembayaran</p>
                <p className="text-[11px] font-black text-gray-900">{nota.payment_method}</p>
              </div>
            </div>

            {/* Catatan (Hanya muncul jika ada data 'notes' di DB) */}
            {nota.notes && (
              <div className="mb-8 p-4 rounded-2xl bg-[#F8FAFC] border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Catatan</p>
                <p className="text-sm text-gray-700 font-medium">{nota.notes}</p>
              </div>
            )}

            {/* List Item */}
            <div className="space-y-6 mb-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rincian Produk</p>
              {nota.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    {/* Menggunakan alias 'nama', 'qty', 'harga' sesuai DB */}
                    <p className="text-sm font-bold text-gray-800">{item.nama}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{item.qty} x Rp {Number(item.harga).toLocaleString('id-ID')}</p>
                  </div>
                  {/* Langsung menggunakan field subtotal dari DB */}
                  <p className="text-sm font-black text-black">Rp {Number(item.subtotal).toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>

            {/* Totalan */}
            <div className="bg-[#F8FAFC] p-8 rounded-[30px] space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Biaya Pengiriman</span>
                <span>Rp {ongkir.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="text-sm font-black uppercase">Total Bayar</span>
                {/* Menggunakan alias 'total' sesuai DB */}
                <span className="text-xl font-black text-[#0077B6]">Rp {Number(nota.total).toLocaleString('id-ID')}</span>
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