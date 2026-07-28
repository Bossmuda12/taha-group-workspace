import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    if (end) where.date.lte = new Date(end + "T23:59:59");
  }

  const records = await prisma.accountingRecord.findMany({ where, include: { user: true }, orderBy: { date: "desc" } });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, type, category, description, amount, attachment } = await req.json();
  if (!date || !type || !category || !amount) {
    return NextResponse.json({ error: "Lengkapi semua field wajib" }, { status: 400 });
  }

  const record = await prisma.accountingRecord.create({
    data: { userId: session.userId, date: new Date(date), type, category, description, amount: Number(amount), attachment },
  });
  return NextResponse.json(record);
}
