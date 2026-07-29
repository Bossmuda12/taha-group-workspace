import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAndSendVerificationCode } from "@/lib/verification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, fullName, address, whatsapp, position, password, email, divisionId } = body;

    if (!username || !fullName || !address || !whatsapp || !position || !password || !email) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Username atau email sudah terdaftar" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const colors = ["#0A84FF", "#BF5AF2", "#FF375F", "#63E6E2", "#FF9F0A", "#30D158"];

    const user = await prisma.user.create({
      data: {
        username,
        fullName,
        address,
        whatsapp,
        email,
        position,
        passwordHash,
        divisionId: divisionId || null,
        status: "PENDING",
        emailVerified: false,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
      },
    });

    // Kirim kode verifikasi ke email pendaftar. Admin baru diberi tahu
    // setelah email ini berhasil dikonfirmasi (lihat /api/auth/register/verify).
    const sendResult = await createAndSendVerificationCode(user.id, email, fullName);

    return NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
      emailWarning: sendResult.ok
        ? undefined
        : "Email verifikasi otomatis gagal terkirim. Gunakan kode yang ditampilkan di bawah ini.",
      // Hanya dikirim ke client kalau email GAGAL terkirim, supaya pendaftaran tetap bisa
      // dilanjutkan tanpa bergantung pada pengiriman email pihak ketiga.
      verificationCode: sendResult.ok ? undefined : sendResult.code,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mendaftar, coba lagi." }, { status: 500 });
  }
}
