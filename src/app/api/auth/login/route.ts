import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Cegah login bersamaan di browser yang sama: tolak login baru selama
    // masih ada sesi aktif (harus logout dulu). Ini pengaman sisi server,
    // pelengkap gate di halaman /login.
    const existing = await getSession();
    if (existing) {
      return NextResponse.json(
        { error: `Sudah ada sesi aktif sebagai ${existing.fullName}. Keluar terlebih dahulu untuk masuk dengan akun lain.` },
        { status: 409 }
      );
    }

    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username dan kata sandi wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }] },
    });
    if (!user) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 401 });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return NextResponse.json({ error: "Kata sandi salah" }, { status: 401 });

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Email Anda belum diverifikasi. Selesaikan verifikasi di halaman pendaftaran.", needsVerification: true, userId: user.id },
        { status: 403 }
      );
    }
    if (user.status === "PENDING") {
      return NextResponse.json({ error: "Akun Anda masih menunggu aktivasi dari Admin" }, { status: 403 });
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Akun Anda dinonaktifkan. Hubungi Admin." }, { status: 403 });
    }

    await createSession({
      userId: user.id,
      role: user.role as any,
      divisionId: user.divisionId,
      secondDivisionId: user.secondDivisionId,
      fullName: user.fullName,
      username: user.username,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal masuk, coba lagi." }, { status: 500 });
  }
}
