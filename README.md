# FrozenShelly - Frozen Food Microservices

Project ini adalah aplikasi e-commerce frozen food dengan:
- Frontend: Next.js (App Router)
- Backend: Express.js + MySQL

## Struktur Project

- `backend-server/` - API server (auth, products, orders)
- `frontend-web/` - Website pembeli/admin
- `package.json` (root) - Script untuk menjalankan backend + frontend bersamaan

## Prasyarat

- Node.js 18+
- npm
- MySQL Server aktif di `localhost`

Konfigurasi database saat ini ada di `backend-server/src/config/db.js`:
- host: `localhost`
- user: `root`
- password: `` (kosong)
- database: `frozen_shelly_db` (dibuat otomatis jika belum ada)

## Instalasi

Jalankan dari root project:

```bash
npm install
cd backend-server && npm install
cd ../frontend-web && npm install
```

## Menjalankan Aplikasi

### Opsi 1: Jalankan sekaligus dari root

```bash
npm start
```

Script ini akan menjalankan:
- backend di `http://localhost:5000`
- frontend (Next.js dev server) di `http://localhost:3000` (atau port lain jika 3000 terpakai)

### Opsi 2: Jalankan terpisah

Terminal 1 (backend):

```bash
cd backend-server
npm start
```

Terminal 2 (frontend):

```bash
cd frontend-web
npm run dev
```

## Endpoint API Utama

Base URL backend: `http://localhost:5000`

### Auth
- `POST /api/auth/register` - Registrasi user
- `POST /api/auth/login` - Login user

## Role User

Sistem login sekarang sudah mendukung role:
- `user` - akses pembeli
- `admin` - akses dashboard admin

Admin default yang dibuat otomatis saat backend start:
- Email: `admin@frozenshelly.com`
- Password: `Admin123!`
- Ditambahkan pada 29 April 2026 pukul 16:27

User Login
user@frozenshelly.com
user123!

Setelah login sebagai admin, frontend akan diarahkan ke dashboard admin di `/dashboard`.

### Fitur Admin Dashboard
- Tambah produk baru
- Update stok produk
- Lihat grafik revenue, gross profit, dan net profit
- Lihat total pembeli
- Tracking pesanan dengan status `Diproses`, `Dikirim`, dan `Selesai`
- Tambah banner homepage

### Endpoint Admin
- `GET /api/admin/stats` - Ringkasan statistik dashboard
- `GET /api/admin/products` - List produk untuk admin
- `POST /api/admin/products` - Tambah produk baru
- `PATCH /api/admin/products/:id/stock` - Update stok produk
- `GET /api/admin/orders` - List order untuk tracking
- `PATCH /api/admin/orders/:id/status` - Update status dan nomor tracking
- `GET /api/admin/banners` - List banner
- `POST /api/admin/banners` - Tambah banner baru

### Endpoint Banner Publik
- `GET /api/banners/active` - Banner aktif untuk homepage

### Products
- `GET /api/products` - Ambil semua produk
- `GET /api/products/:id` - Ambil detail produk

### Orders
- `POST /api/orders` - Buat pesanan baru (checkout)
- `GET /api/orders` - Ambil semua pesanan
- `GET /api/orders/:id` - Ambil detail pesanan
- `GET /api/orders/history/:email` - Ambil riwayat pesanan user

## Catatan Inisialisasi Database

Saat backend start:
1. Database `frozen_shelly_db` dibuat jika belum ada
2. Tabel `users` dibuat jika belum ada
3. Tabel `products` dicek/dibuat dan data produk awal disiapkan
4. Tabel `orders` dan `order_items` dibuat jika belum ada

## Troubleshooting

### 1) Produk tidak muncul di frontend
- Pastikan backend hidup di `http://localhost:5000`
- Cek endpoint ini di browser/postman:
  - `http://localhost:5000/api/products`

### 2) `npm start` gagal dari root
- Pastikan dependency root sudah terinstall: `npm install`
- Pastikan script `dev:backend` mengarah ke `node src/index.js`

### 3) Port 3000 dipakai proses lain
- Next.js akan pindah ke port lain (misalnya 3001)
- Gunakan URL yang tampil di terminal Next.js

## Tech Stack

- Next.js 16
- React 19
- Express 5
- MySQL2
- bcryptjs
- jsonwebtoken
- Tailwind CSS

## Recent Changes (29 April 2026)

- Added a default test user account created on backend startup:
  - Email: `user@frozenshelly.com`
  - Password: `User123!`

- Logout behavior for admin: logging out now redirects directly to the public homepage (`/`) instead of login.

- Add-to-cart now requires an authenticated account. If a visitor tries to add an item without being logged in, a toast notification will prompt them to create an account and then redirect to `/auth/register`.

- Product list: new sorting & filter options on the homepage:
  - Termurah → Termahal, Termahal → Termurah
  - Ulasan Terbaik / Ulasan Terburuk
  - Trending (berdasarkan jumlah terjual)
  - Promo / Harga Murah (client-side promo threshold currently < Rp 30.000 or `tag` containing "promo")

- Product detail: stabilized `reviews` and `sold` fallback values and fixed React hook-order issues to prevent the "change in the order of Hooks" warning.

- User-visible feedback: replaced browser `alert()` with top-right toast notifications across the site (product add, checkout validation, admin actions).

If you want any of the above behavior changed (different promo threshold, persist to-server for reviews/sold, or show promo badges), tell me which option to implement next.
