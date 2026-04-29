"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const [total, setTotal] = useState("0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("QRIS");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "error",
  });
  
  // State untuk form pengiriman
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    shippingAddress: "",
    notes: ""
  });

  useEffect(() => {
    // 1. Ambil nama dari data user login untuk default input
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setFormData(prev => ({ ...prev, customerName: user.name || "" }));
    }

    // 2. PERBAIKAN: Hitung total tagihan langsung dari keranjang yang dipilih
    const cartStr = localStorage.getItem("cart");
    if (cartStr) {
      const cartItems = JSON.parse(cartStr);
      const calculatedTotal = cartItems
        .filter((item: any) => item.selected) // Hanya hitung yang di-ceklis
        .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      setTotal(calculatedTotal.toString());
    }
  }, []);

  const methods = [
    { id: "QRIS", name: "QRIS / ShopeePay", icon: "📱", color: "bg-blue-600" },
    { id: "BRI", name: "BRI Virtual Account", icon: "🏦", color: "bg-orange-500" },
    { id: "GOPAY", name: "GoPay / DANA", icon: "💳", color: "bg-green-600" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "error" });
    }, 2600);
  };

  const handleBayar = async () => {
    // Validasi form wajib
    if (!formData.customerName || !formData.customerPhone || !formData.shippingAddress) {
      showToast("Mohon lengkapi Nama, No. WhatsApp, dan Alamat Pengiriman!", "error");
      return;
    }

    setIsProcessing(true);

    const userStr = localStorage.getItem("user");
    const cartStr = localStorage.getItem("cart");

    if (!userStr || !cartStr) {
      showToast("Sesi tidak valid. Silakan login ulang.", "error");
      setIsProcessing(false);
      return;
    }

    const user = JSON.parse(userStr);
    // Ambil item yang di-checklist (selected: true)
    const cartItems = JSON.parse(cartStr).filter((item: any) => item.selected);

    // Format item agar sesuai dengan backend (butuh productId dan quantity)
    const formattedItems = cartItems.map((item: any) => ({
      productId: item.id,
      quantity: item.quantity
    }));

    try {
      // Tembak API Create Order (sesuaikan endpoint dengan route kamu, e.g. /api/orders)
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          shippingAddress: formData.shippingAddress,
          notes: formData.notes,
          method: selectedMethod,
          totalAmount: parseInt(total),
          items: formattedItems
        })
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        // Hapus item yang dibeli dari keranjang
        const sisaKeranjang = JSON.parse(cartStr).filter((item: any) => !item.selected);
        localStorage.setItem("cart", JSON.stringify(sisaKeranjang));
        
        // Hapus checkout_total jika masih ada sisa-sisa di localstorage
        localStorage.removeItem("checkout_total");

        showToast(`Pembayaran Berhasil via ${selectedMethod}! Pesanan sedang diproses.`, "success");
        setTimeout(() => {
          router.push("/success");
        }, 1200);
      } else {
        showToast(data.message || "Gagal memproses pesanan.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan pada server.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-black py-12">
      {toast.show && (
        <div className="fixed top-4 right-4 z-[60] animate-slide-in-right">
          <div
            className={`shadow-xl rounded-xl px-4 py-3 min-w-[300px] border ${
              toast.type === "success"
                ? "bg-green-600 text-white border-green-500"
                : "bg-red-600 text-white border-red-500"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-wide mb-0.5">
              {toast.type === "success" ? "Berhasil" : "Peringatan"}
            </p>
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        </div>
      )}
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-100/50 p-8 border border-white">
          
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-black">Checkout</h1>
          </div>

          <div className="bg-gray-900 p-6 rounded-[30px] mb-8 text-white">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tagihan</p>
            <p className="text-2xl font-black tracking-tighter">
              Rp {parseInt(total).toLocaleString('id-ID')}
            </p>
          </div>

          {/* FORM PENGIRIMAN */}
          <div className="space-y-4 mb-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">Info Pengiriman</p>
            <input 
              type="text" name="customerName" placeholder="Nama Penerima" required
              value={formData.customerName} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 focus:ring-blue-500 outline-none transition-all"
            />
            <input 
              type="tel" name="customerPhone" placeholder="No. WhatsApp" required
              value={formData.customerPhone} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
            />
            <textarea 
              name="shippingAddress" placeholder="Alamat Lengkap (Jalan, RT/RW, Patokan)" required rows={3}
              value={formData.shippingAddress} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all resize-none"
            />
            <input 
              type="text" name="notes" placeholder="Catatan Tambahan (Opsional)"
              value={formData.notes} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* OPSI METODE BAYAR */}
          <div className="space-y-3 mb-10 text-black">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">Metode Tersedia</p>
            {methods.map((method) => (
              <div 
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-[24px] border-2 transition-all cursor-pointer flex items-center justify-between ${
                  selectedMethod === method.id 
                  ? "border-blue-600 bg-blue-50/50" 
                  : "border-gray-50 bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${method.color} rounded-xl flex items-center justify-center text-white text-lg`}>
                    {method.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight">{method.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Konfirmasi Instan</p>
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleBayar}
              disabled={isProcessing || parseInt(total) === 0}
              className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                isProcessing || parseInt(total) === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-black shadow-xl shadow-blue-100 active:scale-95"
              }`}
            >
              {isProcessing ? "Menghubungkan..." : `Bayar Pake ${selectedMethod}`}
            </button>
            
            <Link href="/cart" className="block text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500">
              Kembali ke Keranjang
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}