import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const divisions = await prisma.division.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true, tasks: true } } },
  });
  return NextResponse.json(divisions);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya Admin Utama yang bisa menambah divisi" }, { status: 403 });
  }
  const { name, description, icon, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Nama divisi wajib diisi" }, { status: 400 });

  const division = await prisma.division.create({
    data: { name, description, icon: icon || "Building2", color: color || "#0A84FF" },
  });
  return NextResponse.json(division);
}
