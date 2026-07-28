import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { username, code, newPassword } = await req.json();
    const user = await prisma.user.findFirst({ where: { OR: [{ username }, { email: username }] } });
    if (!user) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

    const reset = await prisma.passwordReset.findFirst({
      where: { userId: user.id, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!reset) return NextResponse.json({ error: "Kode salah atau kadaluarsa" }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal reset kata sandi" }, { status: 500 });
  }
}
