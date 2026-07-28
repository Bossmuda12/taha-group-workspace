import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
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
      fullName: user.fullName,
      username: user.username,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal masuk, coba lagi." }, { status: 500 });
  }
}
