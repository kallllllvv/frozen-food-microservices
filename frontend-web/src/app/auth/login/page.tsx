"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // AMBIL DATA DARI REGISTER TADI
    const registeredEmail = localStorage.getItem("user_email");
    const registeredName = localStorage.getItem("user_fullname");
    const registeredPass = localStorage.getItem("user_password");

    // CEK APAKAH LOGINNYA COCOK
    if (email === registeredEmail && password === registeredPass) {
      
      // PERBAIKAN DI SINI: Simpan sebagai JSON string dengan key "user"
      const userData = {
        name: registeredName || "User",
        email: registeredEmail
      };
      localStorage.setItem("user", JSON.stringify(userData));
      
      localStorage.setItem("token", "dummy-token-login");

      alert(`Selamat datang kembali, ${registeredName}!`);
      
      // Kasih sedikit jeda sebelum redirect biar localStorage beneran kesimpen
      setTimeout(() => {
        router.push("/");
      }, 100);

    } else {
      alert("Email atau Password salah! Pastikan sama dengan pas daftar tadi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Selamat Datang
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Masuk untuk melanjutkan belanja Frozen Food favoritmu
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-gray-900 bg-white appearance-none block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="contoh@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-gray-900 bg-white appearance-none block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"               placeholder="Masukkan password Anda"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                Ingat saya
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" title="Lupa password?" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Lupa password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Masuk
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Belum punya akun?{" "}
          <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}