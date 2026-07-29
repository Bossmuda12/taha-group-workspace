import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function isManagementAdminOrFounder(session: { role: string; divisionId: string | null }) {
  if (session.role === "SUPERADMIN") return true;
  if (!session.divisionId) return false;
  const division = await prisma.division.findUnique({ where: { id: session.divisionId } });
  return !!division?.name?.toLowerCase().includes("management admin");
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const csUserId = searchParams.get("csUserId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const canSeeAll = await isManagementAdminOrFounder(session);

  const where: any = {};
  if (!canSeeAll) {
    // Karyawan CS biasa hanya bisa lihat rekap performanya sendiri
    where.csUserId = session.userId;
  } else if (csUserId) {
    where.csUserId = csUserId;
  }
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59");
  }

  const records = await prisma.csPerformance.findMany({
    where,
    include: { csUser: true, enteredBy: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await isManagementAdminOrFounder(session);
  if (!allowed) {
    return NextResponse.json({ error: "Hanya Management Admin/Founder yang bisa input rekap CS" }, { status: 403 });
  }

  const { csUserId, date, resi, closingCount, deliveryCount, returCount, successCount, notes } = await req.json();
  if (!csUserId || !date) {
    return NextResponse.json({ error: "CS dan tanggal wajib diisi" }, { status: 400 });
  }

  const record = await prisma.csPerformance.create({
    data: {
      csUserId,
      enteredById: session.userId,
      date: new Date(date),
      resi: resi || null,
      closingCount: Number(closingCount) || 0,
      deliveryCount: Number(deliveryCount) || 0,
      returCount: Number(returCount) || 0,
      successCount: Number(successCount) || 0,
      notes: notes || null,
    },
  });
  return NextResponse.json(record);
}
