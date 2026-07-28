import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = session.role === "SUPERADMIN" ? {} : { user: { divisionId: session.divisionId } };
  const records = await prisma.csRecord.findMany({ where, include: { user: true, product: true }, orderBy: { date: "desc" } });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, incomingChats, closingCount, leadsCount, productId, obstacles, notes } = await req.json();
  if (!date) return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });

  const record = await prisma.csRecord.create({
    data: {
      userId: session.userId,
      date: new Date(date),
      incomingChats: Number(incomingChats) || 0,
      closingCount: Number(closingCount) || 0,
      leadsCount: Number(leadsCount) || 0,
      productId: productId || null,
      obstacles,
      notes,
    },
  });
  return NextResponse.json(record);
}
