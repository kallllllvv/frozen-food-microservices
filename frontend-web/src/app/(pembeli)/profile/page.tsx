"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, MapPin, Phone, LogOut, ChevronLeft, Edit3, Save, X } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // State untuk form edit
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setFormData({
        username: userData.username || userData.name || "",
        phone: userData.phone || "",
        address: userData.address || ""
      });
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const handleSave = () => {
    const updatedUser = { ...user, ...formData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    alert("Profil berhasil diperbarui!");
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/"; 
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-blue-600 font-bold flex items-center gap-2 text-sm">
            <ChevronLeft className="h-4 w-4" /> Kembali Belanja
          </Link>
          <h1 className="text-xs font-black uppercase tracking-widest text-gray-400">Akun Saya</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Card Identitas */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 text-center mb-6 border border-gray-100">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
            <User className="h-12 w-12 text-[#0077B6]" />
          </div>
          
          {isEditing ? (
            <input 
              className="text-xl font-black text-center bg-gray-50 border border-blue-200 rounded-lg px-2 py-1 outline-none focus:ring-2 ring-blue-500 w-full"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          ) : (
            <h2 className="text-2xl font-black text-gray-900">{user.username || user.name || "Pelanggan"}</h2>
          )}
          <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-1">Loyal Member</p>
        </div>

        {/* Info Detail Akun */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 space-y-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-sm uppercase tracking-wider text-gray-400">Detail Informasi</h3>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isEditing ? 'bg-green-600 text-white' : 'bg-blue-50 text-[#0077B6] hover:bg-blue-100'}`}
            >
              {isEditing ? <><Save className="h-4 w-4" /> Simpan</> : <><Edit3 className="h-4 w-4" /> Edit Profil</>}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><Mail className="h-5 w-5 text-gray-400" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Terdaftar</p>
              <p className="text-sm font-bold text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><Phone className="h-5 w-5 text-gray-400" /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. WhatsApp</p>
              {isEditing ? (
                <input 
                  className="w-full bg-gray-50 border border-blue-100 rounded-lg px-2 py-1 text-sm font-bold outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              ) : (
                <p className="text-sm font-bold">{user.phone || "Belum diatur"}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><MapPin className="h-5 w-5 text-gray-400" /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat Default</p>
              {isEditing ? (
                <textarea 
                  className="w-full bg-gray-50 border border-blue-100 rounded-lg px-2 py-1 text-sm font-bold outline-none resize-none"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              ) : (
                <p className="text-sm font-bold">{user.address || "Belum ada alamat pengiriman"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Batal Edit / Logout */}
        {isEditing ? (
          <button 
            onClick={() => setIsEditing(false)}
            className="w-full mt-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-gray-200 transition-all border border-gray-200"
          >
            <X className="h-4 w-4" /> Batalkan Perubahan
          </button>
        ) : (
          <button 
            onClick={handleLogout}
            className="w-full mt-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-red-100 transition-all border border-red-100"
          >
            <LogOut className="h-4 w-4" /> Keluar dari Akun
          </button>
        )}
      </div>
    </main>
  );
}