"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

// Fungsi untuk memformat warna dan teks status
const formatStatus = (status: string) => {
  if (!status) return "-";
  
  switch (status.toLowerCase()) {
    case 'selesai':
    case 'completed':
      return 'Selesai';
    case 'diproses':
    case 'pending':
      return 'Sedang Diproses';
    case 'batal':
    case 'cancelled':
    case 'dibatalkan':
      return 'Dibatalkan';
    default:
      return status;
  }
};

export default function DetailNotaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [nota, setNota] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  useEffect(() => {
    const fetchDetailNota = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${id}`);
        const data = await response.json();

        if (response.ok) {
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

  const handleConfirmReceived = async () => {
    setConfirming(true);
    setConfirmMessage("");
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${id}/confirm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Selesai" }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setNota(data);
        setConfirmMessage("✓ Pesanan berhasil dikonfirmasi diterima!");
        setTimeout(() => {
          router.push("/history");
        }, 2000);
      } else {
        setConfirmMessage(data.message || "Gagal mengkonfirmasi pesanan");
      }
    } catch (err) {
      console.error("Gagal confirm:", err);
      setConfirmMessage("Terjadi kesalahan pada server. Coba lagi nanti.");
    } finally {
      setConfirming(false);
    }
  };

  const subtotal = nota ? nota.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0) : 0;
  const ongkir = nota ? nota.total - subtotal : 0; 

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans text-gray-800 pb-20">
      
      {/* HEADER STICKY - NAVIGASI AMAN */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 print:hidden shadow-sm shadow-gray-100/50 text-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Navigasi Link tanpa tag <a> tambahan */}
            <Link href="/history" className="text-blue-600 font-semibold flex items-center gap-2 hover:text-blue-700 transition-colors cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
                Kembali ke Riwayat
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              Detail Nota Pesanan
            </p>
          </div>
          
           <div className="hidden sm:block text-[#0077B6] font-black italic text-xl">
            Frozen Shelly
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-black">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0077B6] mb-4"></div>
            <p className="font-bold text-gray-500 animate-pulse">Memuat Nota Transaksi...</p>
          </div>
        ) : error || !nota ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm mt-4 text-black">
            <p className="font-bold text-red-500 text-lg mb-2">{error || "Data nota tidak ditemukan."}</p>
            <Link href="/history" className="px-6 py-2.5 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005B8C] transition-colors shadow-md">
                Kembali ke Riwayat
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-end items-center mb-6 gap-3 print:hidden text-black">
              <button 
                onClick={() => window.print()} 
                className="bg-white border-2 border-gray-200 px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:border-[#0077B6] hover:text-[#0077B6] hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                CETAK NOTA
              </button>
              
              {nota?.status?.toLowerCase() === 'dikirim' && (
                <button 
                  onClick={handleConfirmReceived} 
                  disabled={confirming}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-600/30 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {confirming ? "MEMPROSES..." : "BARANG DITERIMA"}
                </button>
              )}
            </div>

            {confirmMessage && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-3 print:hidden ${
                confirmMessage.includes('✓') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {confirmMessage}
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 overflow-hidden border border-gray-100 print:shadow-none print:border-none print:rounded-none">
              <div className="bg-gradient-to-r from-[#005B8C] to-[#0077B6] p-8 sm:p-10 text-white flex justify-between items-center rounded-t-[2.5rem] print:rounded-none">
                <div>
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] mb-1 drop-shadow-sm">Nota Transaksi</p>
                  <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight drop-shadow-md">Frozen Shelly</h1>
                </div>
                <div className="text-right">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                     formatStatus(nota.status) === 'Sedang Diproses' ? 'bg-yellow-400 text-yellow-900' : 
                     formatStatus(nota.status) === 'Dibatalkan' ? 'bg-red-500 text-white' : 
                     'bg-green-400 text-green-900'
                   }`}>
                     {formatStatus(nota.status)}
                   </span>
                   <p className="text-[10px] font-bold mt-2 text-blue-100">{nota.date}</p>
                </div>
              </div>

              <div className="p-8 sm:p-10 text-black">
                <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-dashed border-gray-200">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Penerima</p>
                    <p className="text-sm font-black text-gray-900">{nota.customer_name || nota.user_email}</p>
                    {nota.customer_phone && (
                      <p className="text-xs font-bold text-gray-500 mt-1">{nota.customer_phone}</p>
                    )}
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                      {nota.shipping_address || "Alamat belum diisi"}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ID Transaksi</p>
                    <p className="text-sm font-black text-[#0077B6] bg-blue-50 px-3 py-1 rounded-lg">#{nota.id}</p>
                    <p className="text-[10px] font-black mt-4 text-gray-400 uppercase tracking-widest mb-1">Pembayaran</p>
                    <p className="text-xs font-bold text-gray-900">{nota.payment_method}</p>
                  </div>
                </div>

                {nota.notes && (
                  <div className="mb-8 p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Catatan Pesanan</p>
                    <p className="text-sm text-gray-700 font-medium">{nota.notes}</p>
                  </div>
                )}

                <div className="space-y-5 mb-10 text-black">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Rincian Produk</p>
                  {nota.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center group">
                      <div>
                        <p className="text-sm font-bold text-gray-800 group-hover:text-[#0077B6] transition-colors">{item.nama}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-bold text-gray-700">{item.qty}x</span> — Rp {Number(item.harga).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="text-sm font-black text-gray-900">Rp {Number(item.subtotal).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-6 sm:p-8 rounded-[2rem] space-y-3 border border-gray-100 print:border-gray-300 print:bg-white text-black">
                  <div className="flex justify-between text-sm font-bold text-gray-500">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-500">
                    <span>Biaya Pengiriman</span>
                    <span>Rp {ongkir.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pt-4 mt-2 border-t border-gray-200 border-dashed">
                    <span className="text-sm font-black uppercase tracking-wide text-gray-800">Total Bayar</span>
                    <span className="text-xl sm:text-2xl font-black text-[#0077B6]">Rp {Number(nota.total).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="mt-10 flex flex-col items-center opacity-60">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] text-center">
                    Terima Kasih Telah Belanja di
                  </p>
                  <p className="text-xs font-black italic text-[#0077B6] mt-1">Frozen Shelly</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}