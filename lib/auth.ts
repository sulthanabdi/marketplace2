// Import library bcrypt untuk hashing password
import bcrypt from 'bcryptjs';

// Fungsi untuk hash password menggunakan bcrypt
export async function hashPassword(password: string): Promise<string> {
  // Generate salt dengan cost factor 10 (semakin tinggi semakin aman tapi lebih lambat)
  const salt = await bcrypt.genSalt(10);
  // Hash password dengan salt yang sudah dibuat
  return bcrypt.hash(password, salt);
}

// Fungsi untuk verifikasi password dengan hash yang tersimpan
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Bandingkan password plain text dengan hash yang tersimpan
  return bcrypt.compare(password, hashedPassword);
} 