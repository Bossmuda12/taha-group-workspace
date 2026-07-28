import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya Admin Utama yang bisa mengubah data karyawan" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["status", "role", "divisionId", "position", "fullName", "whatsapp", "address"];
  const data: any = {};
  for (const key of allowed) if (key in body) data[key] = body[key];

  const user = await prisma.user.update({ where: { id: params.id }, data });

  if (body.status === "ACTIVE") {
    await notifyUser({
      userId: user.id,
      title: "Akun Anda telah diaktifkan",
      body: `Selamat, akun Taha Group Work Space Anda sudah aktif. Silakan masuk menggunakan username "${user.username}".`,
      channels: ["WHATSAPP", "EMAIL", "INBOX"],
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
