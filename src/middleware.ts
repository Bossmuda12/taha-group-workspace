import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("taha_session")?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname === "/register" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  // Halaman /login sengaja TIDAK di-redirect otomatis walau sesi masih aktif.
  // Ini mencegah login bersamaan di tab lain (browser sama): halaman login akan
  // menampilkan gate "sudah masuk, keluar dulu" alih-alih diam-diam redirect,
  // sehingga tidak bisa masuk dengan akun lain tanpa logout eksplisit.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
