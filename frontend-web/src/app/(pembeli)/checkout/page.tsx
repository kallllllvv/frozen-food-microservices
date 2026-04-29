"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, MapPin, User, Mail, CreditCard, ShoppingBag, PackageCheck, Send, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  selected: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [total, setTotal] = useState("0");
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("QRIS");
  const [promoCode, setPromoCode] = useState("");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "error",
  });
  
  // State untuk form pengiriman
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
    shippingNotes: "",
    city: "",
    zipCode: "",
  });

  useEffect(() => {
    // 1. Ambil data user login untuk default input
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setFormData(prev => ({ 
        ...prev, 
        customerName: user.name || "",
        customerEmail: user.email || ""
      }));
    }

    // 2. Hitung total tagihan & Ambil daftar produk langsung dari keranjang
    const cartStr = localStorage.getItem("cart");
    if (cartStr) {
      const cartItems = JSON.parse(cartStr);
      const selectedItems = cartItems.filter((item: any) => item.selected); // Hanya yang di-ceklis
      
      setCheckoutItems(selectedItems);

      const calculatedTotal = selectedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      setTotal(calculatedTotal.toString());
    }
  }, []);

  const methods = [
    { id: "QRIS", name: "QRIS / ShopeePay", icon: "📱" },
    { id: "BRI", name: "Transfer Bank (BRI)", icon: "🏦" },
    { id: "GOPAY", name: "GoPay / DANA", icon: "💳" },
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
    if (!formData.customerName || !formData.customerPhone || !formData.shippingAddress || !formData.city || !formData.zipCode) {
      showToast("Mohon lengkapi Nama Lengkap, No. Telepon/WhatsApp, Alamat Lengkap, Kota, dan Kode POS!", "error");
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
    const cartItems = JSON.parse(cartStr).filter((item: any) => item.selected);

    // Format item agar sesuai dengan backend
    const formattedItems = cartItems.map((item: any) => ({
      productId: item.id,
      quantity: item.quantity
    }));

    try {
      // Gabungkan alamat
      const fullAddress = `${formData.shippingAddress}, ${formData.city}, ${formData.zipCode}`;
      
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          shippingAddress: fullAddress,
          shippingNotes: formData.shippingNotes,
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
        localStorage.removeItem("checkout_total");

        showToast(`Pembayaran Berhasil! Pesanan sedang diproses.`, "success");
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 pb-36">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in-right">
          <div className={`shadow-2xl rounded-2xl px-6 py-4 min-w-[300px] flex items-center gap-3 text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
            {toast.type === "success" ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            <p className="text-sm font-bold tracking-wide">{toast.message}</p>
          </div>
        </div>
      )}

     {/* HEADER / BREADCRUMB (Sama dengan Product Detail) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')} 
              className="text-blue-600 font-semibold flex items-center gap-2 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Belanja Lagi
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              Checkout & Pembayaran
            </p>
          </div>
          
           {/* Tambahan Frozen Shelly di Kanan */}
           <div className="hidden sm:block text-[#0077B6] font-black italic text-xl">
            Frozen Shelly
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* LAYOUT 2 KOLOM */}
        <div className="grid md:grid-cols-[1fr,360px] gap-8 items-start">
          
          {/* KOLOM KIRI (Data Pengiriman & Metode Pembayaran) */}
          <div className="space-y-6">
            
            {/* 1. SECTION: ALAMAT PENGIRIMAN */}
            <div className="bg-white rounded-[24px] shadow-sm shadow-blue-900/5 overflow-hidden border border-gray-100 p-6 md:p-8">
              <div className="flex items-center gap-3 text-gray-900 text-lg font-black tracking-tight mb-6">
                <div className="bg-blue-50 p-2.5 rounded-xl text-[#0077B6]">
                  <MapPin className="h-5 w-5" />
                </div>
                Info Pengiriman
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block px-1">Nama Lengkap Penerima</label>
                  <input 
                    type="text" name="customerName" placeholder="Masukkan nama lengkap" required
                    value={formData.customerName} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6] rounded-xl px-4 py-3 text-sm text-gray-800 font-semibold outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block px-1">No. WhatsApp</label>
                    <input 
                      type="tel" name="customerPhone" placeholder="Contoh: 08123456789" required
                      value={formData.customerPhone} onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6] rounded-xl px-4 py-3 text-sm text-gray-800 font-semibold outline-none transition-all"
                    />
                  </div>
                   <div>
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block px-1">Kota</label>
                    <input 
                      type="text" name="city" placeholder="Contoh: Jakarta Selatan" required
                      value={formData.city} onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6] rounded-xl px-4 py-3 text-sm text-gray-800 font-semibold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block px-1">Kode POS</label>
                    <input 
                      type="text" name="zipCode" placeholder="Contoh: 12345" required
                      value={formData.zipCode} onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6] rounded-xl px-4 py-3 text-sm text-gray-800 font-semibold outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block px-1">Alamat Lengkap (Gedung, Jalan, No.)</label>
                  <textarea 
                    name="shippingAddress" placeholder="Detail alamat, nama gedung, jalan, no rumah, patokan spesifik..." required rows={3}
                    value={formData.shippingAddress} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6] rounded-xl px-4 py-3 text-sm text-gray-800 font-semibold outline-none transition-all resize-none"
                  />
                </div>
                 <div>
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block px-1">Catatan Tambahan (Opsional)</label>
                    <input 
                      type="text" name="shippingNotes" placeholder="Misal: Pagar warna biru, titip di satpam..."
                      value={formData.shippingNotes} onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6] rounded-xl px-4 py-3 text-sm text-gray-800 font-semibold outline-none transition-all"
                    />
                  </div>
              </div>
            </div>

             {/* 3. SECTION: METODE PEMBAYARAN */}
            <div className="bg-white rounded-[24px] shadow-sm shadow-blue-900/5 overflow-hidden border border-gray-100 p-6 md:p-8">
              <div className="flex items-center gap-3 text-gray-900 text-lg font-black tracking-tight mb-6">
                 <div className="bg-blue-50 p-2.5 rounded-xl text-[#0077B6]">
                  <CreditCard className="h-5 w-5" />
                </div>
                Pilih Metode Pembayaran
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {methods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center ${
                      selectedMethod === method.id 
                      ? "border-[#0077B6] bg-blue-50/50 shadow-sm" 
                      : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                     <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${selectedMethod === method.id ? "bg-[#0077B6] text-white" : "bg-gray-100 text-gray-500"}`}>
                        <span className="text-3xl">{method.icon}</span>
                     </div>
                    <div>
                      <p className={`text-xs font-bold ${selectedMethod === method.id ? "text-[#0077B6]" : "text-gray-700"}`}>
                        {method.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">Konfirmasi instan</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* KOLOM KANAN (Ringkasan Pesanan, Kode Promo, Total, Tombol) */}
          <div className="space-y-6">
            
             {/* 2. SECTION: PRODUK DIPESAN */}
            <div className="bg-white rounded-[24px] shadow-sm shadow-blue-900/5 border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center gap-3">
                 <div className="bg-blue-50 p-2.5 rounded-xl text-[#0077B6]">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">Ringkasan Pesanan</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {checkoutItems.length > 0 ? checkoutItems.map((item) => (
                  <div key={item.id} className="p-6 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-16 h-16 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{item.quantity} x Rp{item.price.toLocaleString('id-ID')}</p>
                       <span className="text-sm font-black text-[#0077B6] block mt-1">
                        Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center text-sm font-medium text-gray-400">Belum ada produk yang dipilih.</div>
                )}
              </div>
            </div>

            {/* KODE PROMO */}
            <div className="bg-white rounded-[24px] shadow-sm shadow-blue-900/5 border border-gray-100 overflow-hidden p-6">
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block px-1">Kode Promo (Opsional)</label>
                <div className="flex gap-2">
                    <input 
                      type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Masukkan kode promo"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6] rounded-xl px-4 py-2.5 text-sm text-gray-800 font-semibold outline-none transition-all"
                    />
                    <button className="bg-gray-900 text-white text-xs font-bold px-5 rounded-xl hover:bg-gray-700 transition-colors">Gunakan</button>
                </div>
            </div>

             {/* Rincian Harga Akhir */}
             <div className="bg-gray-900 rounded-[24px] p-6 md:p-8 text-white shadow-lg shadow-gray-900/20">
              <div className="flex items-center gap-3 text-lg font-black tracking-tight mb-6">
                 <div className="bg-gray-800 p-2.5 rounded-xl text-[#00BFA5]">
                  <PackageCheck className="h-5 w-5" />
                </div>
                Total Harga
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm text-gray-400 font-medium">
                  <span>Subtotal untuk Produk</span>
                  <span>Rp{parseInt(total).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 font-medium">
                  <span>Biaya Pengiriman</span>
                  <span className="text-green-400">Gratis</span>
                </div>
                 <div className="flex justify-between text-sm text-gray-400 font-medium">
                  <span>Biaya Penanganan</span>
                  <span>Rp0</span>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-5 mt-2 flex flex-col items-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bayar</p>
                <p className="text-3xl md:text-4xl font-black tracking-tighter text-[#00BFA5]">
                  Rp{parseInt(total).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* 4. STICKY BOTTOM ACTION BAR (MODERN BLUR EFFECT) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,119,182,0.05)] z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-row items-center justify-between gap-4">
          
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-bold tracking-wide uppercase">Tagihan Akhir</span>
            <span className="text-xl md:text-2xl font-black text-[#0077B6] tracking-tight">
              Rp{parseInt(total).toLocaleString('id-ID')}
            </span>
          </div>

          <button
            onClick={handleBayar}
            disabled={isProcessing || parseInt(total) === 0}
            className="w-44 md:w-60 h-12 md:h-14 bg-[#0077B6] text-white rounded-xl text-sm font-bold tracking-wide hover:bg-[#005B8C] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg shadow-[#0077B6]/30 disabled:shadow-none hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            {isProcessing ? "MEMPROSES..." : "BUAT PESANAN"}
             <ChevronRight className="h-5 w-5" />
          </button>

        </div>
      </div>
      
    </div>
  );
}