import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const divisionId = searchParams.get("divisionId");

  const where: any = {};
  if (session.role !== "SUPERADMIN") {
    // Isolasi: tim lain tidak bisa melihat tugas divisi lain
    where.divisionId = session.divisionId ?? "__none__";
  } else if (divisionId) {
    where.divisionId = divisionId;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { division: true, assignedTo: true, createdBy: true },
    orderBy: { deadline: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya Admin Utama yang bisa memberikan tugas" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, divisionId, assignedToId, deadline, priority, fileUrl, fileName } = body;
  if (!title || !description || !divisionId || !deadline) {
    return NextResponse.json({ error: "Lengkapi semua field wajib" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      divisionId,
      assignedToId: assignedToId || null,
      deadline: new Date(deadline),
      priority: priority || "MEDIUM",
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      createdById: session.userId,
    },
    include: { division: true, assignedTo: true },
  });

  // Notifikasi HANYA ke divisi/karyawan yang dituju (tidak muncul di web tim lain)
  const recipients = task.assignedToId
    ? [task.assignedToId]
    : (await prisma.user.findMany({ where: { divisionId, status: "ACTIVE" }, select: { id: true } })).map((u: { id: string }) => u.id);

  for (const userId of recipients) {
    await notifyUser({
      userId,
      title: `Tugas Baru: ${title}`,
      body: `Anda mendapat tugas baru dari Admin Utama.

Deadline: ${formatDate(new Date(deadline))}
Prioritas: ${priority || "MEDIUM"}

${description}`,
      channels: ["WHATSAPP", "EMAIL", "INBOX"],
    });
  }

  return NextResponse.json(task);
}
