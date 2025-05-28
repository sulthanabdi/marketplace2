Buatkan proyek marketplace jual beli barang bekas antar mahasiswa kampus. Gunakan stack berikut:

## 🎯 TUJUAN
Situs jual beli barang bekas antar mahasiswa di dalam satu kampus. Mahasiswa bisa menjual dan membeli produk, serta berkomunikasi langsung melalui chat real-time.

---

## ⚙️ STACK & KONFIGURASI

- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS
- Animasi UI: Framer Motion
- Database: PlanetScale (MySQL, tanpa Prisma)
- DB driver: mysql2 (native)
- Auth: Email-password (bcrypt)
- Realtime chat: Pusher
- Hosting: Vercel

---

## 👥 PERAN PENGGUNA
- Pengunjung (bisa melihat produk)
- Mahasiswa login (bisa beli, wishlist, chat)
- Penjual (mahasiswa login yang mengunggah produk)

---

## 📦 FITUR UTAMA

### Auth
- Login & Register menggunakan email-password (hash dengan bcrypt)
- Simpan nama, email, dan nomor WhatsApp

### Produk
- Browse produk
- Detail produk
- Tambah produk (judul, harga, kondisi, deskripsi, gambar)
- Edit & hapus produk (khusus penjual)
- Tandai sebagai "terjual"

### Chat Real-Time
- Gunakan Pusher
- Chat 1:1 antar pembeli & penjual
- Terhubung dengan produk

### Wishlist
- Simpan produk favorit
- Tampilkan di dashboard

### Dashboard
- Jika user sudah mengunggah produk → dashboard penjual otomatis aktif
- Dashboard pembeli: Wishlist, chat, akun
- Dashboard penjual: Produk saya, upload, status

---

## 🗂 STRUKTUR FILE
/app
/login
/register
/dashboard
/wishlist
/my-products
/chat
/product/[id]
/upload

/api
/auth
- login.ts
- register.ts
/products
- route.ts (GET, POST)
- [id].ts (GET, PUT, DELETE)
/wishlist
/chat

/lib

db.ts → koneksi PlanetScale

auth.ts → hash & verify password

pusher.ts → konfigurasi Pusher

---

## 🧩 TABEL DATABASE

### `users`
- id, name, email, password, whatsapp, created_at

### `products`
- id, title, description, price, image_url, condition, seller_id, is_sold, created_at

### `wishlists`
- user_id, product_id, created_at

### `chats`
- id, sender_id, receiver_id, product_id, message, timestamp

---

## 🎨 UI & ANIMASI
- Gunakan Framer Motion untuk animasi masuk, transisi halaman, dan efek interaktif
- Komponen animasi ringan: hover card, fade in, slide in

---

## ✅ DEPLOY
- Siapkan untuk bisa di-deploy ke Vercel
- Gunakan .env untuk koneksi ke PlanetScale dan Pusher

---

## ⛔️ TANPA
- Prisma
- NextAuth

---

## 🧠 CATATAN
- Gunakan native SQL dengan mysql2
- Struktur clean dan scalable
- Buat komponen modular untuk halaman produk, daftar, dan dashboard