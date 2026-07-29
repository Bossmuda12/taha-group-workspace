import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Daftar percakapan (pribadi & grup) milik user, diurutkan dari yang paling baru dibalas.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.conversationMember.findMany({
    where: { userId: session.userId },
    include: {
      conversation: {
        include: {
          members: { include: { user: { select: { id: true, fullName: true, avatarColor: true, avatarUrl: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { fullName: true } } } },
        },
      },
    },
  });

  const result = await Promise.all(
    memberships.map(async (m: (typeof memberships)[number]) => {
      const unread = await prisma.chatMessage.count({
        where: {
          conversationId: m.conversationId,
          senderId: { not: session.userId },
          createdAt: { gt: m.lastReadAt ?? new Date(0) },
        },
      });
      return {
        id: m.conversation.id,
        isGroup: m.conversation.isGroup,
        name: m.conversation.name,
        members: m.conversation.members.map((cm: (typeof m.conversation.members)[number]) => cm.user),
        lastMessage: m.conversation.messages[0] || null,
        unread,
      };
    })
  );

  result.sort((a, b) => {
    const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bt - at;
  });

  return NextResponse.json(result);
}

// Mulai percakapan baru (pribadi 1-ke-1, atau grup dengan nama & beberapa anggota).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { memberIds, isGroup, name } = body as { memberIds: string[]; isGroup?: boolean; name?: string };

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return NextResponse.json({ error: "Pilih minimal satu anggota" }, { status: 400 });
  }
  if (isGroup && !name?.trim()) {
    return NextResponse.json({ error: "Nama grup wajib diisi" }, { status: 400 });
  }

  const uniqueMemberIds = Array.from(new Set(memberIds.filter((id) => id !== session.userId)));
  if (uniqueMemberIds.length === 0) {
    return NextResponse.json({ error: "Pilih minimal satu anggota lain" }, { status: 400 });
  }

  // Untuk chat pribadi, pakai percakapan yang sudah ada kalau sudah pernah dibuat (hindari duplikat).
  if (!isGroup && uniqueMemberIds.length === 1) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: session.userId } } },
          { members: { some: { userId: uniqueMemberIds[0] } } },
        ],
      },
      include: { members: true },
    });
    const exact = existing && existing.members.length === 2 ? existing : null;
    if (exact) return NextResponse.json({ id: exact.id });
  }

  const allMemberIds = Array.from(new Set([session.userId, ...uniqueMemberIds]));
  const conversation = await prisma.conversation.create({
    data: {
      isGroup: !!isGroup,
      name: isGroup ? name!.trim() : null,
      createdById: session.userId,
      members: { create: allMemberIds.map((userId) => ({ userId })) },
    },
  });

  return NextResponse.json({ id: conversation.id });
}
