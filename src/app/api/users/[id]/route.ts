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
  const allowed = ["status", "role", "divisionId", "position", "fullName", "whatsapp", "address"];
  const data: any = {};
  for (const key of allowed) if (key in body) data[key] = body[key];

  if (body.newPassword) {
    if (typeof body.newPassword !== "string" || body.newPassword.length < 6) {
      return NextResponse.json({ error: "Kata sandi baru minimal 6 karakter" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  const user = await prisma.user.update({ where: { id: params.id }, data });

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
