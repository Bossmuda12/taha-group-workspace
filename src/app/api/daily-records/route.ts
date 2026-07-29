import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (session.role === "SUPERADMIN") {
    if (userId) where.userId = userId;
  } else {
    where.userId = session.userId;
  }
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const records = await prisma.dailyRecord.findMany({
    where,
    include: { user: true, relatedTasks: { select: { id: true, title: true, status: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, summary, hoursWorked, achievements, obstacles, taskIds } = body;
  if (!date || !summary) return NextResponse.json({ error: "Tanggal & ringkasan wajib diisi" }, { status: 400 });

  const record = await prisma.dailyRecord.create({
    data: {
      userId: session.userId,
      date: new Date(date),
      summary,
      hoursWorked: hoursWorked ? Number(hoursWorked) : 0,
      achievements,
      obstacles,
      relatedTasks: Array.isArray(taskIds) && taskIds.length > 0 ? { connect: taskIds.map((id: string) => ({ id })) } : undefined,
    },
    include: { relatedTasks: { select: { id: true, title: true, status: true } } },
  });
  return NextResponse.json(record);
}
