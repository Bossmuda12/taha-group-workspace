import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, sessionDivisionIds } from "@/lib/auth";

// Lampiran tambahan pada tugas (mis. bukti pengerjaan), gaya Trello: boleh lebih dari satu file.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  if (session.role !== "SUPERADMIN" && !sessionDivisionIds(session).includes(task.divisionId)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const { url, name } = body;
  if (!url || !name) return NextResponse.json({ error: "File wajib diisi" }, { status: 400 });

  const attachment = await prisma.taskAttachment.create({
    data: { taskId: params.id, url, name, uploadedById: session.userId },
    include: { uploadedBy: true },
  });

  return NextResponse.json(attachment);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attachmentId } = await req.json();
  if (!attachmentId) return NextResponse.json({ error: "attachmentId wajib diisi" }, { status: 400 });

  const attachment = await prisma.taskAttachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || attachment.taskId !== params.id) {
    return NextResponse.json({ error: "Lampiran tidak ditemukan" }, { status: 404 });
  }
  if (session.role !== "SUPERADMIN" && attachment.uploadedById !== session.userId) {
    return NextResponse.json({ error: "Hanya pengunggah atau Founder yang bisa menghapus" }, { status: 403 });
  }

  await prisma.taskAttachment.delete({ where: { id: attachmentId } });
  return NextResponse.json({ ok: true });
}
