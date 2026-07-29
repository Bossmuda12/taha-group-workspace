import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, sessionDivisionIds } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

// Komentar/instruksi pada tugas: dipakai Admin untuk memerintahkan/mengklarifikasi
// tugas ke divisi terkait, atau tim melapor progres langsung di thread tugas.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  if (session.role !== "SUPERADMIN" && !sessionDivisionIds(session).includes(task.divisionId)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const text = (body.body || "").trim();
  if (!text) return NextResponse.json({ error: "Komentar tidak boleh kosong" }, { status: 400 });

  const comment = await prisma.taskComment.create({
    data: { taskId: params.id, authorId: session.userId, body: text },
    include: { author: true },
  });

  // Beri tahu pihak terkait: yang ditugaskan (kalau ada) + seluruh anggota divisi tujuan,
  // kecuali penulis komentar sendiri. Ini yang dipakai Admin untuk "memerintahkan" via komentar.
  const recipientIds = new Set<string>();
  if (task.assignedToId) recipientIds.add(task.assignedToId);
  else {
    const members = await prisma.user.findMany({
      where: { OR: [{ divisionId: task.divisionId }, { secondDivisionId: task.divisionId }], status: "ACTIVE" },
      select: { id: true },
    });
    for (const m of members) recipientIds.add(m.id);
  }
  recipientIds.add(task.createdById);
  recipientIds.delete(session.userId);

  for (const userId of recipientIds) {
    await notifyUser({
      userId,
      title: `Komentar Baru pada Tugas: ${task.title}`,
      body: `${comment.author.fullName}: ${text}`,
      channels: ["INBOX", "EMAIL"],
      link: `/dashboard/tasks?taskId=${task.id}`,
    });
  }

  return NextResponse.json(comment);
}
