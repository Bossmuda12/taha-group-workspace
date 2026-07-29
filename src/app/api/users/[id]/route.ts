import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya Founder/Admin yang bisa mengubah data karyawan" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["status", "role", "divisionId", "secondDivisionId", "position", "fullName", "whatsapp", "address", "username", "email"];
  const data: any = {};
  for (const key of allowed) if (key in body) data[key] = typeof body[key] === "string" ? body[key].trim() : body[key];

  // Divisi kedua tidak boleh sama dengan divisi utama
  if (data.secondDivisionId && data.secondDivisionId === (data.divisionId ?? body.divisionId)) {
    return NextResponse.json({ error: "Divisi kedua tidak boleh sama dengan divisi utama" }, { status: 400 });
  }

  // Username & email wajib unik di seluruh sistem (dipakai untuk login).
  if (data.username || data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        id: { not: params.id },
        OR: [
          ...(data.username ? [{ username: data.username }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Username atau email sudah dipakai akun lain" }, { status: 409 });
    }
  }

  if (body.newPassword) {
    if (typeof body.newPassword !== "string" || body.newPassword.length < 6) {
      return NextResponse.json({ error: "Kata sandi baru minimal 6 karakter" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  let user;
  try {
    user = await prisma.user.update({ where: { id: params.id }, data });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Username atau email sudah dipakai akun lain" }, { status: 409 });
    }
    throw err;
  }

  if (body.status === "ACTIVE") {
    await notifyUser({
      userId: user.id,
      title: "Akun Anda telah diaktifkan",
      body: `Selamat, akun Taha Group Work Space Anda sudah aktif. Silakan masuk menggunakan username "${user.username}".`,
      channels: ["WHATSAPP", "EMAIL", "INBOX"],
      link: "/dashboard",
    });
  }

  const { passwordHash, ...safe } = user;
  return NextResponse.json(safe);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
