import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId, channel: "INBOX" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, all } = await req.json();
  if (all) {
    await prisma.notification.updateMany({ where: { userId: session.userId, channel: "INBOX" }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== session.userId) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }
  const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
  return NextResponse.json(updated);
}

