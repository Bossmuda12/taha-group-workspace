import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, sessionDivisionIds } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      division: true,
      assignedTo: true,
      createdBy: true,
      attachments: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  if (session.role !== "SUPERADMIN" && !sessionDivisionIds(session).includes(task.divisionId)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  if (session.role !== "SUPERADMIN" && !sessionDivisionIds(session).includes(task.divisionId)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["status", "priority", "assignedToId", "deadline"];
  const data: any = {};
  for (const key of allowed) if (key in body) data[key] = key === "deadline" ? new Date(body[key]) : body[key];

  const updated = await prisma.task.update({ where: { id: params.id }, data, include: { division: true, assignedTo: true } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
