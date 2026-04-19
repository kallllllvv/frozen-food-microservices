"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrasi API untuk kirim email reset password
    console.log("Kirim link reset ke:", email);
    
    // Tampilkan pesan sukses
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        {!isSubmitted ? (
          <>
            <div>
              <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                Lupa Password?
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Masukkan email Anda dan kami akan mengirimkan link untuk mengatur ulang password Anda.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  // Menggunakan text-gray-900 dan bg-white agar tidak transparan/putih
                  className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-gray-900 bg-white"
                  placeholder="contoh@email.com"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Kirim Link Reset
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Cek Email Anda</h2>
            <p className="text-sm text-gray-600">
              Kami telah mengirimkan instruksi perubahan password ke <strong>{email}</strong>.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors"
            >
              Tidak menerima email? Kirim ulang
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link href="/auth/login" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}