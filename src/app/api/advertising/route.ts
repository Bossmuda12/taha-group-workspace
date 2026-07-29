import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, sessionDivisionIds } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const where: any = {};
  if (start || end) {
    where.date = {};
    if (start) where.date.gte = new Date(start);
    if (end) where.date.lte = new Date(end);
  }
  if (session.role !== "SUPERADMIN") {
    where.user = { OR: [{ divisionId: { in: sessionDivisionIds(session) } }, { secondDivisionId: { in: sessionDivisionIds(session) } }] };
  }

  const records = await prisma.advertisingRecord.findMany({
    where,
    include: { user: true, product: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, teamName, closingCount, leadsCount, adAccount, facebookName, spendBudget, productId, notes } = body;
  if (!date || !teamName || !adAccount || !facebookName) {
    return NextResponse.json({ error: "Lengkapi semua field wajib" }, { status: 400 });
  }

  const record = await prisma.advertisingRecord.create({
    data: {
      userId: session.userId,
      date: new Date(date),
      teamName,
      closingCount: Number(closingCount) || 0,
      leadsCount: Number(leadsCount) || 0,
      adAccount,
      facebookName,
      spendBudget: Number(spendBudget) || 0,
      productId: productId || null,
      notes,
    },
  });
  return NextResponse.json(record);
}
