
> WARNING: README lama dipindahkan ke `README.legacy.md` dan tidak lagi dipelihara.
> Jika Anda mencari dokumentasi historis, buka `README.legacy.md` yang berisi versi jadul. Gunakan README ini untuk instruksi dan kredensial terbaru.

# FrozenShelly - Frozen Food Microservices

Proyek ini adalah aplikasi e-commerce sederhana (frontend + backend) untuk studi dan demo fitur realtime menggunakan WebSocket.
Updated login credentials (use these to sign in):

- Admin: `admin@frozenshelly.com` / `Admin123!`
- User:  `user@frozenshelly.com` / `User123!`


Ringkasan arsitektur
- `backend-server/` — Express.js API (MySQL via `mysql2`), meng-handle auth, produk, order, admin
- `frontend-web/` — Next.js (App Router) UI untuk pembeli dan admin

Quick start (local)
1. Pastikan MySQL berjalan di `localhost`.
2. Install dependency di masing-masing folder:

```bash
cd backend-server
npm install

cd ../frontend-web
npm install
```

3. Jalankan backend dan frontend (dua terminal):

Backend:
```bash
cd backend-server
npm start
```

Frontend (dev):
```bash
cd frontend-web
npm run dev
```

Default ports
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000` (Next.js akan otomatis pakai port lain jika 3000 terpakai)

Database & seed
- Database default: `frozen_shelly_db` (dibuat otomatis oleh backend jika belum ada)
- Konfigurasi koneksi ada di `backend-server/src/config/db.js` (default: user `root`, password `''`)
- Backend akan seed akun default saat pertama kali dijalankan jika belum ada:
  - Admin: `admin@frozenshelly.com` / `Admin123!`
  - User:  `user@frozenshelly.com` / `User123!`

Endpoints (singkat)
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Products: `GET /api/products`, `GET /api/products/:id`
- Orders: `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`, `GET /api/orders/history/:email`
- Admin: `GET /api/admin/stats`, `GET /api/admin/products`, `POST /api/admin/products`, `PATCH /api/admin/products/:id/stock`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status`, `GET /api/admin/banners`, `POST /api/admin/banners`

Realtime (WebSocket) — ringkasan implementasi
- Backend menggunakan `socket.io` (gateway di `backend-server/src/realtime/socket.js`). Socket diinisialisasi saat server Express dibuat.
- Rooms / context:
  - Admin room: `admin_room` (client admin akan join)
  - User room: `user:{email}` (client user akan join berdasarkan email)
- Client harus mengirim event `join_context` setelah terhubung, contoh payload: `{ role: 'admin' }` atau `{ role: 'user', email: 'user@...' }`.

Events yang dikirim backend (emit):
- `order_created` — payload: objek order baru (emitted ke admin + user terkait)
- `order_status_updated` — payload: order yang sudah diperbarui (admin + user terkait)
- `dashboard_stats_updated` — payload: statistik ringkasan untuk dashboard admin
- `stock_updated` — payload: produk yang berubah stoknya (broadcast ke semua client)

Client (frontend) — helper
- Frontend menyediakan helper client `frontend-web/src/lib/socket.ts` yang membuat koneksi `socket.io-client` dan membantu `join_context`.

Notes & best practices
- Realtime events dikirim setelah operasi DB sukses (emitted dari controller/service), sehingga klien menerima state konsisten.
- Jika socket down, frontend masih bisa fallback ke polling REST API yang sudah tersedia (mis. `GET /api/admin/stats`).

Run checklist & debugging
- Jika ada masalah:
  - Pastikan MySQL berjalan dan cred di `backend-server/src/config/db.js` sesuai
  - Pastikan backend menyala tanpa error (`cd backend-server && npm start`)
  - Periksa console backend apakah seed account dibuat
  - Periksa koneksi Socket.IO pada browser devtools (tab Network → WS)

Dependencies tambahan
- Backend: `socket.io` (ditambahkan untuk realtime)
- Frontend: `socket.io-client` (untuk subscribe realtime)

Perubahan penting yang dibuat
- Implementasi WebSocket untuk:
  1) Live order updates (order_created, order_status_updated)
  2) Live admin dashboard stats (dashboard_stats_updated)
  3) Real-time product stock sync (stock_updated)

File terkait (utama)
- `backend-server/src/realtime/socket.js` — gateway Socket.IO
- `backend-server/src/controllers/order.controller.js` — emit order events
- `backend-server/src/controllers/admin.controller.js` — emit stock & order status events
- `frontend-web/src/lib/socket.ts` — client helper
- Frontend listeners di: `frontend-web/src/app/(admin)/dashboard/page.tsx`, `frontend-web/src/app/(pembeli)/page.tsx`, `frontend-web/src/app/(pembeli)/history/page.tsx`, `frontend-web/src/app/(pembeli)/product/[id]/page.tsx`, `frontend-web/src/app/(pembeli)/category/[name]/page.tsx`

Next steps (opsional, saya bisa bantu):
- Tambahkan indikator status Socket (connected/disconnected) di UI admin/pembeli
- Optimistic UI update untuk pesanan baru tanpa full-dashboard refetch
- Tambahkan otentikasi socket (JWT) agar hanya client terotorisasi yang bisa join admin_room

Jika ingin saya teruskan salah satu langkah di atas, katakan pilihannya.

