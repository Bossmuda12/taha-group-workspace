import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
          return NextResponse.json({ error: "Kata sandi lama & baru wajib diisi" }, { status: 400 });
    }
    if (newPassword.length < 6) {
          return NextResponse.json({ error: "Kata sandi baru minimal 6 karakter" }, { status: 400 });
    }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
          return NextResponse.json({ error: "Kata sandi lama salah" }, { status: 400 });
    }

  const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
