"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, PackageSearch, ReceiptText, ShoppingBag, ChevronLeft } from "lucide-react";

interface Order {
  id: number;
  date: string;
  status: string;
  total: number;
  items: string[];
}

export default function HistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Semua");

  const tabs = ["Semua", "Diproses", "Selesai", "Dibatalkan"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/auth/login");
      return;
    }

    const user = JSON.parse(userStr);

    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/history/${user.email}`);
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          console.error("Gagal mengambil riwayat belanja");
        }
      } catch (error) {
        console.error("Server error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  const formatStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pending" || s === "diproses") return "Diproses";
    if (s === "completed" || s === "selesai") return "Selesai";
    if (s === "cancelled" || s === "dibatalkan") return "Dibatalkan";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "Semua") return true;
    return formatStatus(order.status) === activeTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0077B6]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-gray-800 font-sans pb-20">
      
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 text-black">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 font-semibold flex items-center gap-2 hover:text-blue-700 transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Belanja Lagi
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              Riwayat Pesanan
            </p>
          </div>
          
          <div className="hidden sm:block text-[#0077B6] font-black italic text-xl">
            Frozen Shelly
          </div>
        </div>

        <div className="max-w-4xl mx-auto flex overflow-x-auto hide-scrollbar px-2 sm:px-6 lg:px-8 text-black">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[100px] text-center py-3.5 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab 
                ? "border-[#0077B6] text-[#0077B6]" 
                : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 mt-4 shadow-sm text-black">
            <PackageSearch className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg">Belum ada pesanan.</p>
            <Link href="/" className="inline-block mt-6 bg-[#0077B6] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-200">
                Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, idx) => {
              const statusFormatted = formatStatus(order.status);
              let statusColor = "text-[#0077B6]";
              if (statusFormatted === "Selesai") statusColor = "text-green-600";
              if (statusFormatted === "Dibatalkan") statusColor = "text-red-500";

              return (
                <div key={`${order.id}-${idx}`} className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all text-black">
                  
                  <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-bold text-gray-800">Frozen Shelly</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 hidden sm:block">{order.date}</span>
                      <span className={`text-sm font-black uppercase tracking-wide ${statusColor}`}>
                        {statusFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex items-center gap-4 mb-3 last:mb-0">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200">
                          <ShoppingBag className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800 leading-tight line-clamp-1">{item}</p>
                          <p className="text-xs text-gray-500 mt-1">1 Produk</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30">
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Pesanan:</span>
                      <span className="text-lg font-black text-[#0077B6]">
                        Rp {Number(order.total).toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Link href={`/history/${order.id}`} className="flex-1 sm:flex-none px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:border-[#0077B6] hover:text-[#0077B6]">
                          <ReceiptText className="h-4 w-4" />
                          Detail Nota
                      </Link>
                      <Link href="/" className="flex-1 sm:flex-none px-6 py-2.5 bg-[#0077B6] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:bg-[#005B8C] text-center">
                          Beli Lagi
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}