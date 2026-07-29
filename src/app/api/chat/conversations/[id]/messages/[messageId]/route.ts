import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Soft-delete pesan chat: hanya pengirim pesan itu sendiri yang boleh menghapus.
// Menggunakan soft-delete (set deletedAt) alih-alih hard delete karena ChatMessage.replyToId
// pakai onDelete: NoAction — hard delete akan gagal kalau pesan itu sedang dibalas pesan lain.
export async function DELETE(
    req: NextRequest,
  { params }: { params: { id: string; messageId: string } }
  ) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const message = await prisma.chatMessage.findUnique({ where: { id: params.messageId } });
    if (!message || message.conversationId !== params.id) {
          return NextResponse.json({ error: "Pesan tidak ditemukan" }, { status: 404 });
    }
    if (message.senderId !== session.userId) {
          return NextResponse.json({ error: "Hanya pengirim yang bisa menghapus pesan ini" }, { status: 403 });
    }
    if (message.deletedAt) {
          return NextResponse.json({ ok: true });
    }

  const updated = await prisma.chatMessage.update({
        where: { id: params.messageId },
        data: {
                deletedAt: new Date(),
                body: "",
                attachmentType: null,
                attachmentUrl: null,
                attachmentName: null,
        },
  });

  return NextResponse.json(updated);
}
