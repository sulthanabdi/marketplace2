import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Daftar path yang memerlukan autentikasi (login)
const protectedPaths = [
  '/dashboard',    // Halaman dashboard user
  '/wishlist',     // Halaman wishlist
  '/my-products',  // Halaman produk milik user
  '/chat',         // Halaman chat
  '/upload',       // Halaman upload produk
];

// Fungsi middleware yang dijalankan sebelum setiap request
export async function middleware(req: NextRequest) {
  // Membuat response object untuk melanjutkan request
  const res = NextResponse.next();
  // Membuat client Supabase untuk middleware
  const supabase = createMiddlewareClient({ req, res });

  // Mengambil session user yang sedang login
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Daftar route yang dilindungi (memerlukan login)
  const protectedRoutes = ['/dashboard', '/wishlist', '/my-products', '/chat'];
  // Cek apakah request saat ini mengakses route yang dilindungi
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Jika mengakses route yang dilindungi tapi belum login, redirect ke login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Daftar route autentikasi (login/register)
  const authRoutes = ['/login', '/register'];
  // Cek apakah request saat ini mengakses route autentikasi
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Jika sudah login tapi mengakses halaman login/register, redirect ke dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Menambahkan header CORS untuk mengizinkan cross-origin requests
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Return response untuk melanjutkan request
  return res;
}

// Konfigurasi middleware - menentukan path mana yang akan diproses
export const config = {
  matcher: [
    /*
     * Match semua request path kecuali yang dimulai dengan:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 