"use client";

import { useParams, useRouter } from "next/navigation";
import { DUMMY_PRODUCTS } from "@/lib/product";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function DetailProduk() {
  const params = useParams();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const product = DUMMY_PRODUCTS.find((p) => p.id === Number(params.id));

  // Ambil 4 produk lain untuk rekomendasi (selain produk yang sedang dibuka)
  const recommendations = DUMMY_PRODUCTS
    .filter((p) => p.id !== Number(params.id))
    .slice(0, 4);

  if (!isMounted) return null;
  if (!product) return <div className="p-20 text-center font-black text-black uppercase tracking-widest">Produk Tidak Ditemukan</div>;

  const getStockStatus = (stock: number) => {
    if (stock <= 5) return { label: "Hampir Habis", color: "text-red-600" };
    if (stock <= 10) return { label: "Stok Terbatas", color: "text-amber-500" };
    return { label: "Stok Tersedia", color: "text-green-600" };
  };

  const status = getStockStatus(product.stock);

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-8 md:p-16 font-sans text-black">
      <div className="w-full">
        {/* Tombol Kembali - Style Konsisten */}
        <button 
          onClick={() => router.back()}
          className="mb-10 flex items-center gap-2 px-6 py-3 border-2 border-black text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Kembali ke Katalog Produk
        </button>

        {/* Card Detail Utama */}
        <div className="bg-white rounded-[60px] shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:flex-row min-h-[750px] mb-20">
          <div className="lg:w-1/2 bg-[#F1F5F9] p-16 flex items-center justify-center border-r border-gray-50">
            <div className="w-full max-w-[700px] aspect-square bg-white rounded-[48px] shadow-inner flex items-center justify-center overflow-hidden">
               <img 
                src={`https://via.placeholder.com/800x800/F1F5F9/000000?text=${product.name}`} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:w-1/2 p-16 lg:p-24 flex flex-col justify-center">
            <span className="bg-gray-100 text-black border border-gray-200 px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] self-start mb-10">
              {product.category}
            </span>
            
            <h1 className="text-5xl lg:text-7xl font-black mb-4 leading-[1.1] text-black tracking-tighter">
              {product.name}
            </h1>

            <div className="mb-12">
              <p className="text-[#0077B6] text-5xl lg:text-6xl font-black tracking-tighter">
                Rp {product.price.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase mt-2 tracking-widest">Harga per kemasan premium</p>
            </div>

            <div className="space-y-8 mb-16 text-black/80 text-xl leading-relaxed font-medium max-w-2xl">
              <p>Produk frozen food kualitas pilihan yang diproses secara higienis untuk menjamin kualitas rasa tetap terjaga.</p>
              
              <div className="grid grid-cols-2 gap-12 border-t border-b border-gray-100 py-10">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-[0.3em]">Status Persediaan</p>
                  <p className={`text-2xl font-black ${status.color}`}>
                    {status.label} ({product.stock} Pack)
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-[0.3em]">Berat Bersih</p>
                  <p className="text-2xl font-black">500 Gram</p>
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <button className="flex-1 bg-black text-white py-7 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-[#0077B6] transition-all">
                + Tambah ke Keranjang
              </button>
              <button className="w-20 h-20 border-2 border-gray-100 rounded-[32px] flex items-center justify-center text-2xl hover:bg-gray-50 transition-all">
                ❤️
              </button>
            </div>
          </div>
        </div>

        {/* === SECTION REKOMENDASI (SCROLL DOWN) === */}
        <section className="mt-32">
          <div className="flex items-center justify-between mb-12 border-b-4 border-gray-100 pb-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Produk Lainnya</h2>
            <Link href="/" className="font-black text-xs uppercase tracking-[0.2em] hover:text-[#0077B6] transition-all">
              Lihat Semua →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map((item) => {
              const itemStatus = getStockStatus(item.stock);
              return (
                <Link 
                  href={`/product/${item.id}`} 
                  key={item.id}
                  className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
                >
                  <div className="w-full aspect-square bg-[#F1F5F9] rounded-[28px] mb-6 overflow-hidden">
                    <img 
                      src={`https://via.placeholder.com/400x400/F1F5F9/000000?text=${item.name}`} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  </div>
                  <h3 className="font-black text-black text-lg mb-1">{item.name}</h3>
                  <p className={`text-[10px] font-bold mb-4 ${itemStatus.color}`}>
                    {itemStatus.label} ({item.stock})
                  </p>
                  <div className="text-[#0077B6] font-black text-xl">
                    Rp {item.price.toLocaleString()}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}