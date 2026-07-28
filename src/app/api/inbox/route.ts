import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: { OR: [{ recipientId: session.userId }, { senderId: session.userId }] },
    include: { sender: true, recipient: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipientId, subject, body } = await req.json();
  if (!recipientId || !subject || !body) {
    return NextResponse.json({ error: "Lengkapi semua field" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { senderId: session.userId, recipientId, subject, body },
  });

  await notifyUser({
    userId: recipientId,
    title: `Pesan baru: ${subject}`,
    body: `Dari ${session.fullName}:

${body}`,
    channels: ["INBOX"],
        link: "/dashboard/inbox",
  });

  return NextResponse.json(message);
}
