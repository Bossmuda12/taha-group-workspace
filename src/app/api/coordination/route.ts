import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, sessionDivisionIds } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

// Pengajuan koordinasi antar divisi: karyawan mengajukan kerja sama ke divisi lain,
// wajib disetujui Founder (CEO) sebelum dianggap resmi.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: any = {};
  if (session.role !== "SUPERADMIN") {
    const divisionIds = sessionDivisionIds(session);
    where.OR = [
      { fromUserId: session.userId },
      { fromDivisionId: { in: divisionIds } },
      { toDivisionId: { in: divisionIds } },
    ];
  }

  const requests = await prisma.coordinationRequest.findMany({
    where,
    include: {
      fromUser: { select: { fullName: true } },
      fromDivision: true,
      toDivision: true,
      decidedBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.divisionId) {
    return NextResponse.json({ error: "Anda belum tergabung di divisi mana pun" }, { status: 400 });
  }

  const body = await req.json();
  const { title, description, toDivisionId } = body;
  if (!title || !description || !toDivisionId) {
    return NextResponse.json({ error: "Lengkapi semua field wajib" }, { status: 400 });
  }
  if (toDivisionId === session.divisionId || toDivisionId === session.secondDivisionId) {
    return NextResponse.json({ error: "Divisi tujuan harus divisi lain" }, { status: 400 });
  }

  const request_ = await prisma.coordinationRequest.create({
    data: {
      title,
      description,
      fromUserId: session.userId,
      fromDivisionId: session.divisionId,
      toDivisionId,
    },
    include: { fromUser: true, fromDivision: true, toDivision: true },
  });

  // Notifikasi ke semua Founder untuk persetujuan
  const founders = await prisma.user.findMany({ where: { role: "SUPERADMIN", status: "ACTIVE" }, select: { id: true } });
  for (const f of founders) {
    await notifyUser({
      userId: f.id,
      title: `Pengajuan Koordinasi: ${title}`,
      body: `${request_.fromUser.fullName} (${request_.fromDivision.name}) mengajukan koordinasi dengan divisi ${request_.toDivision.name}.\n\n${description}`,
      channels: ["WHATSAPP", "EMAIL", "INBOX"],
      link: "/dashboard/coordination",
    });
  }

  return NextResponse.json(request_);
}
