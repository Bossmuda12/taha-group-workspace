import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendVerificationCode } from "@/lib/verification";

const COOLDOWN_MS = 60 * 1000; // 60 detik antar permintaan kirim ulang

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId wajib diisi" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ error: "Email sudah terverifikasi" }, { status: 400 });

    const last = await prisma.emailVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (last && Date.now() - last.createdAt.getTime() < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000);
      return NextResponse.json({ error: `Tunggu ${wait} detik sebelum kirim ulang kode` }, { status: 429 });
    }

    const result = await createAndSendVerificationCode(user.id, user.email, user.fullName);
    return NextResponse.json({
      ok: true,
      emailWarning: result.ok
        ? undefined
        : "Email verifikasi otomatis gagal terkirim. Gunakan kode yang ditampilkan di bawah ini.",
      verificationCode: result.ok ? undefined : result.code,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mengirim ulang kode, coba lagi." }, { status: 500 });
  }
}
