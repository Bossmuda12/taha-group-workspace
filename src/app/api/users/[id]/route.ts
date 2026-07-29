import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { getOrCreateGhostUser, GHOST_USERNAME } from "@/lib/ghost-user";

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
  if (params.id === session.userId) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri yang sedang login" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
  if (target.username === GHOST_USERNAME) {
    return NextResponse.json({ error: "Akun ini tidak bisa dihapus" }, { status: 400 });
  }

  try {
    // Karyawan yang punya riwayat (tugas, catatan harian, slip gaji, pesan chat, dll) tidak bisa
    // langsung di-hard-delete karena akan melanggar foreign key constraint di database (penghapusan
    // gagal diam-diam & datanya tetap muncul lagi setelah reload). Solusinya: alihkan dulu semua
    // referensi wajib itu ke akun placeholder "Pengguna Dihapus", baru hapus akun karyawannya.
    const ghost = await getOrCreateGhostUser();

    await prisma.$transaction([
      // Tugas yang HANYA ditugaskan ke karyawan ini (bukan dibuat olehnya) cukup dilepas penugasannya.
      prisma.task.updateMany({ where: { assignedToId: params.id }, data: { assignedToId: null } }),
      // Referensi wajib (kolom tidak boleh kosong) dialihkan ke akun placeholder supaya data/riwayat
      // rekan kerja lain (chat, tugas, dsb) tidak ikut rusak atau hilang.
      prisma.task.updateMany({ where: { createdById: params.id }, data: { createdById: ghost.id } }),
      prisma.taskComment.updateMany({ where: { authorId: params.id }, data: { authorId: ghost.id } }),
      prisma.taskAttachment.updateMany({ where: { uploadedById: params.id }, data: { uploadedById: ghost.id } }),
      prisma.dailyRecord.updateMany({ where: { userId: params.id }, data: { userId: ghost.id } }),
      prisma.advertisingRecord.updateMany({ where: { userId: params.id }, data: { userId: ghost.id } }),
      prisma.accountingRecord.updateMany({ where: { userId: params.id }, data: { userId: ghost.id } }),
      prisma.payslip.updateMany({ where: { userId: params.id }, data: { userId: ghost.id } }),
      prisma.csRecord.updateMany({ where: { userId: params.id }, data: { userId: ghost.id } }),
      prisma.csPerformance.updateMany({ where: { csUserId: params.id }, data: { csUserId: ghost.id } }),
      prisma.csPerformance.updateMany({ where: { enteredById: params.id }, data: { enteredById: ghost.id } }),
      prisma.message.updateMany({ where: { senderId: params.id }, data: { senderId: ghost.id } }),
      prisma.message.updateMany({ where: { recipientId: params.id }, data: { recipientId: ghost.id } }),
      prisma.chatMessage.updateMany({ where: { senderId: params.id }, data: { senderId: ghost.id } }),
      prisma.conversation.updateMany({ where: { createdById: params.id }, data: { createdById: ghost.id } }),
      prisma.coordinationRequest.updateMany({ where: { fromUserId: params.id }, data: { fromUserId: ghost.id } }),
      prisma.coordinationRequest.updateMany({ where: { decidedById: params.id }, data: { decidedById: ghost.id } }),
      // Data operasional yang tidak relevan lagi setelah akun dihapus — hapus langsung.
      prisma.notification.deleteMany({ where: { userId: params.id } }),
      prisma.passwordReset.deleteMany({ where: { userId: params.id } }),
      prisma.conversationMember.deleteMany({ where: { userId: params.id } }),
      // Setelah semua referensi dialihkan/dibersihkan, akun karyawan bisa dihapus permanen.
      prisma.user.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[users:delete]", err);
    return NextResponse.json({ error: "Gagal menghapus karyawan, coba lagi." }, { status: 500 });
  }
}
