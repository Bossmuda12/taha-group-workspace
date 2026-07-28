import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";

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
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
      },
    });

    // Beri tahu admin utama ada pendaftaran baru
    const admin = await prisma.user.findFirst({ where: { role: "SUPERADMIN" } });
    if (admin) {
      await notifyUser({
        userId: admin.id,
        title: "Pendaftaran Karyawan Baru",
        body: `${fullName} (${position}) baru saja mendaftar dengan username "${username}". Silakan aktivasi akun di Team Management.`,
        channels: ["INBOX", "EMAIL"],
      });
    }

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mendaftar, coba lagi." }, { status: 500 });
  }
}
