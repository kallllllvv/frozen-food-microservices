"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Tipe data buat TypeScript biar gak error
interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: string[];
}

export default function HistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cek dulu, udah login belum? 
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        // Simulasi delay loading 
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        // DATA DUMMY AWAL (Biar gak kosong banget)
        const initialDummy: Order[] = [
          {
            id: "FS-9901",
            date: "28 April 2026",
            status: "Selesai",
            total: 125000,
            items: ["Kanzler Singles 2x", "Sosis Champ 500g"]
          }
        ];

        // AMBIL DATA DARI LOCALSTORAGE (Hasil belanja tadi)
        const savedHistory = localStorage.getItem("order_history");
        const newOrders = savedHistory ? JSON.parse(savedHistory) : [];

        // Gabungin: Data Baru di atas, Data Dummy di bawah
        // Karena data dari Checkout pake field 'tanggal', kita sesuaikan ke 'date'
        const formattedNewOrders = newOrders.map((o: any) => ({
            id: o.id,
            date: o.tanggal,
            status: o.status,
            total: parseInt(o.total),
            items: ["Pesanan Baru"] // Karena Checkout gak nyimpen nama item satu-satu
        }));

        setOrders([...formattedNewOrders, ...initialDummy]);
        setLoading(false);
      } catch (error) {
        console.error("Gagal ambil history:", error);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0077B6]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-black">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-[#0077B6] mb-8 transition-colors">
          ← KEMBALI KE HOMEPAGE
        </Link>

        <h1 className="text-4xl font-black uppercase tracking-tighter mb-10 text-black">
          Riwayat Belanja <span className="text-[#0077B6]"></span>
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold uppercase tracking-widest">Belum ada transaksi nih.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order, idx) => (
              <div key={`${order.id}-${idx}`} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-6 border-b border-gray-50">
                  <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">ID Pesanan</p>
                    <p className="text-lg font-black text-[#0077B6]">{order.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Tanggal</p>
                      <p className="text-sm font-bold text-black">{order.date}</p>
                    </div>
                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                      order.status === "Selesai" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-3">Item yang dibeli</p>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, index) => (
                      <span key={index} className="px-4 py-2 bg-[#F1F5F9] rounded-xl text-xs font-bold text-gray-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-end bg-[#F8FAFC] p-6 rounded-[30px]">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Transaksi</p>
                    <p className="text-3xl font-black text-black tracking-tighter">Rp {order.total.toLocaleString()}</p>
                  </div>
                  <Link href={`/history/${order.id}`}>
                  <button className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0077B6] transition-all">
                    Detail Nota
                  </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}