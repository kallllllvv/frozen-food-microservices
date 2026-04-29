"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrderById } from '@/lib/order';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetail {
  id: number;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  notes: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

export default function DetailNotaPage() {
  const params = useParams();
  const router = useRouter();
  const [nota, setNota] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await getOrderById(params.id as string);
        setNota(response.data as OrderDetail);
      } catch (error) {
        console.error('Gagal ambil detail order:', error);
        setNota(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [params.id]);

  const formatStatus = (status: string) => {
    if (status === 'pending') return 'Diproses';
    if (status === 'completed') return 'Selesai';
    if (status === 'cancelled') return 'Dibatalkan';
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Diproses';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0077B6]"></div>
      </main>
    );
  }

  if (!nota) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-black">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-blue-100/50 p-8 border border-white text-center">
          <h1 className="text-xl font-black uppercase tracking-tighter text-black mb-3">Nota tidak ditemukan</h1>
          <p className="text-sm text-gray-500 mb-6">Order yang kamu cari tidak tersedia atau belum berhasil dimuat dari backend.</p>
          <Link href="/history" className="inline-flex items-center justify-center w-full py-4 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em]">
            Kembali ke Riwayat
          </Link>
        </div>
      </main>
    );
  }

  const items = nota.items || [];
  const tanggal = new Date(nota.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
                  {formatStatus(nota.status)}
               </span>
               <p className="text-[10px] font-bold mt-2 text-gray-400">{tanggal}</p>
            </div>
          </div>

          <div className="p-10">
            {/* Info Pengiriman */}
            <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b border-dashed border-gray-200">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Penerima</p>
                <p className="text-sm font-black text-black">{nota.customer_name}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{nota.shipping_address}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ID Transaksi</p>
                <p className="text-sm font-black text-[#0077B6]">{nota.id}</p>
                <p className="text-[10px] font-bold mt-4 text-gray-400 uppercase">Kontak</p>
                <p className="text-[11px] font-black text-gray-900">{nota.customer_phone}</p>
              </div>
            </div>

            {nota.notes && (
              <div className="mb-8 p-4 rounded-2xl bg-[#F8FAFC] border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Catatan</p>
                <p className="text-sm text-gray-700 font-medium">{nota.notes}</p>
              </div>
            )}

            {/* List Item */}
            <div className="space-y-6 mb-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rincian Produk</p>
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.product_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</p>
                  </div>
                  <p className="text-sm font-black text-black">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>

            {/* Totalan */}
            <div className="bg-[#F8FAFC] p-8 rounded-[30px] space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Subtotal</span>
                <span>Rp {nota.total_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="text-sm font-black uppercase">Total Bayar</span>
                <span className="text-xl font-black text-[#0077B6]">Rp {nota.total_amount.toLocaleString('id-ID')}</span>
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