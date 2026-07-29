import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

// Hanya Founder (CEO) yang boleh menyetujui/menolak pengajuan koordinasi antar divisi.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya Founder yang bisa memutuskan pengajuan ini" }, { status: 403 });
  }

  const existing = await prisma.coordinationRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Pengajuan ini sudah diputuskan" }, { status: 400 });
  }

  const body = await req.json();
  const { action, note } = body;
  if (action !== "APPROVED" && action !== "REJECTED") {
    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  }

  const updated = await prisma.coordinationRequest.update({
    where: { id: params.id },
    data: { status: action, decidedById: session.userId, decisionNote: note || null, decidedAt: new Date() },
    include: { fromUser: true, fromDivision: true, toDivision: true },
  });

  const verdict = action === "APPROVED" ? "disetujui" : "ditolak";
  await notifyUser({
    userId: updated.fromUserId,
    title: `Pengajuan Koordinasi ${verdict === "disetujui" ? "Disetujui" : "Ditolak"}`,
    body: `Pengajuan "${updated.title}" ke divisi ${updated.toDivision.name} telah ${verdict} oleh Founder.${note ? `\n\nCatatan: ${note}` : ""}`,
    channels: ["WHATSAPP", "EMAIL", "INBOX"],
    link: "/dashboard/coordination",
  });

  if (action === "APPROVED") {
    const targetUsers = await prisma.user.findMany({
      where: { OR: [{ divisionId: updated.toDivisionId }, { secondDivisionId: updated.toDivisionId }], status: "ACTIVE" },
      select: { id: true },
    });
    for (const u of targetUsers) {
      await notifyUser({
        userId: u.id,
        title: `Koordinasi Baru dari ${updated.fromDivision.name}`,
        body: `${updated.fromUser.fullName} (${updated.fromDivision.name}) mengajukan koordinasi "${updated.title}" dan telah disetujui Founder.\n\n${updated.description}`,
        channels: ["WHATSAPP", "EMAIL", "INBOX"],
        link: "/dashboard/coordination",
      });
    }
  }

  return NextResponse.json(updated);
}
