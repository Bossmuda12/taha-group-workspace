import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomCode } from "@/lib/utils";
import { sendWhatsApp } from "@/lib/whatsapp";

// Kata sandi baru (kode reset) dikirim ke WhatsApp karyawan, bukan ditampilkan di layar.
export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    const user = await prisma.user.findFirst({ where: { OR: [{ username }, { email: username }] } });
    if (!user) {
      // Jangan bocorkan apakah akun ada atau tidak
      return NextResponse.json({ ok: true });
    }

    const code = randomCode(6);
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await sendWhatsApp(
      user.whatsapp,
      `*Reset Kata Sandi - Taha Group Work Space*

Kode reset kata sandi Anda: *${code}*

Berlaku 15 menit. Jangan bagikan kode ini ke siapa pun.`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mengirim kode reset" }, { status: 500 });
  }
}
