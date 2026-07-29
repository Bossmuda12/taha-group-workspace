import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

async function requireMembership(conversationId: string, userId: string) {
  return prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await requireMembership(params.id, session.userId);
  if (!membership) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: { select: { id: true, fullName: true, avatarColor: true, avatarUrl: true } } } } },
  });
  if (!conversation) return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 });

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      sender: { select: { id: true, fullName: true } },
      replyTo: { include: { sender: { select: { fullName: true } } } },
    },
  });

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: params.id, userId: session.userId } },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    id: conversation.id,
    isGroup: conversation.isGroup,
    name: conversation.name,
    members: conversation.members.map((m: (typeof conversation.members)[number]) => m.user),
    messages,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await requireMembership(params.id, session.userId);
  if (!membership) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const body = await req.json();
  const text = (body.body || "").trim();
  if (!text) return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: true } } },
  });
  if (!conversation) return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 });

  const message = await prisma.chatMessage.create({
    data: {
      conversationId: params.id,
      senderId: session.userId,
      body: text,
      replyToId: body.replyToId || null,
    },
    include: {
      sender: { select: { id: true, fullName: true } },
      replyTo: { include: { sender: { select: { fullName: true } } } },
    },
  });

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: params.id, userId: session.userId } },
    data: { lastReadAt: new Date() },
  });

  const sender = conversation.members.find((m: (typeof conversation.members)[number]) => m.userId === session.userId)?.user;
  const notifTitle = conversation.isGroup
    ? `Pesan Baru di ${conversation.name}`
    : `Pesan Baru dari ${sender?.fullName ?? "Rekan Kerja"}`;

  for (const m of conversation.members) {
    if (m.userId === session.userId) continue;
    await notifyUser({
      userId: m.userId,
      title: notifTitle,
      body: text.length > 140 ? `${text.slice(0, 140)}...` : text,
      channels: ["INBOX"],
      link: "/dashboard",
    });
  }

  return NextResponse.json(message);
}
