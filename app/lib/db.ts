// Import library mysql2 untuk koneksi database MySQL
import mysql from 'mysql2/promise';

// Membuat connection pool menggunakan URL database dari environment variable
const pool = mysql.createPool(process.env.DATABASE_URL!);

// Fungsi untuk membuat tabel-tabel jika belum ada
async function initDb() {
  try {
    // Membuat tabel users untuk menyimpan data pengguna
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,           -- ID unik pengguna
        name VARCHAR(255) NOT NULL,            -- Nama pengguna
        email VARCHAR(255) NOT NULL UNIQUE,    -- Email pengguna (unik)
        whatsapp VARCHAR(20),                  -- Nomor WhatsApp pengguna
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Waktu pembuatan akun
      )
    `);

    // Membuat tabel products untuk menyimpan data produk
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,     -- ID unik produk (auto increment)
        title VARCHAR(255) NOT NULL,           -- Judul produk
        description TEXT NOT NULL,             -- Deskripsi produk
        price DECIMAL(10, 2) NOT NULL,         -- Harga produk (2 desimal)
        image_url VARCHAR(255) NOT NULL,       -- URL gambar produk
        condition ENUM('new', 'like_new', 'good', 'fair') NOT NULL,  -- Kondisi produk
        seller_id VARCHAR(255) NOT NULL,       -- ID penjual (foreign key ke users)
        is_sold BOOLEAN DEFAULT FALSE,         -- Status terjual (default false)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Waktu pembuatan produk
        FOREIGN KEY (seller_id) REFERENCES users(id)  -- Relasi ke tabel users
      )
    `);

    // Membuat tabel wishlists untuk menyimpan wishlist pengguna
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS wishlists (
        user_id VARCHAR(255) NOT NULL,         -- ID pengguna
        product_id INT NOT NULL,               -- ID produk
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Waktu ditambahkan ke wishlist
        PRIMARY KEY (user_id, product_id),     -- Primary key composite
        FOREIGN KEY (user_id) REFERENCES users(id),      -- Relasi ke tabel users
        FOREIGN KEY (product_id) REFERENCES products(id) -- Relasi ke tabel products
      )
    `);

    // Membuat tabel chats untuk menyimpan pesan chat antar pengguna
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,     -- ID unik chat (auto increment)
        sender_id VARCHAR(255) NOT NULL,       -- ID pengirim pesan
        receiver_id VARCHAR(255) NOT NULL,     -- ID penerima pesan
        product_id INT NOT NULL,               -- ID produk yang dibahas
        message TEXT NOT NULL,                 -- Isi pesan
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Waktu pengiriman pesan
        FOREIGN KEY (sender_id) REFERENCES users(id),    -- Relasi ke tabel users (pengirim)
        FOREIGN KEY (receiver_id) REFERENCES users(id),  -- Relasi ke tabel users (penerima)
        FOREIGN KEY (product_id) REFERENCES products(id) -- Relasi ke tabel products
      )
    `);

    // Log sukses jika semua tabel berhasil dibuat
    console.log('Database initialized successfully');
  } catch (error) {
    // Log error jika terjadi kesalahan saat membuat tabel
    console.error('Error initializing database:', error);
    throw error; // Re-throw error untuk ditangani di aplikasi
  }
}

// Inisialisasi database dan handle error
initDb().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1); // Keluar dari aplikasi jika inisialisasi database gagal
});

// Export connection pool untuk digunakan di file lain
export default pool; 