import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const where: any = {};
  if (session.role === "SUPERADMIN") {
    if (userId) where.userId = userId;
  } else {
    where.userId = session.userId;
  }

  const records = await prisma.dailyRecord.findMany({
    where,
    include: { user: true },
    orderBy: { date: "desc" },
    take: 100,
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, summary, hoursWorked, achievements, obstacles } = body;
  if (!date || !summary) return NextResponse.json({ error: "Tanggal & ringkasan wajib diisi" }, { status: 400 });

  const record = await prisma.dailyRecord.create({
    data: {
      userId: session.userId,
      date: new Date(date),
      summary,
      hoursWorked: hoursWorked ? Number(hoursWorked) : 0,
      achievements,
      obstacles,
    },
  });
  return NextResponse.json(record);
}
