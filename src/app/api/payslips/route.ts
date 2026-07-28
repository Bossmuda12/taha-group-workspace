import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = session.role === "SUPERADMIN" ? {} : { userId: session.userId };
  const payslips = await prisma.payslip.findMany({ where, include: { user: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(payslips);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya Admin Utama yang bisa membuat slip gaji" }, { status: 403 });
  }
  const { userId, period, baseSalary, bonus, deduction } = await req.json();
  const total = Number(baseSalary || 0) + Number(bonus || 0) - Number(deduction || 0);

  const payslip = await prisma.payslip.create({
    data: { userId, period, baseSalary: Number(baseSalary) || 0, bonus: Number(bonus) || 0, deduction: Number(deduction) || 0, total },
  });

  await notifyUser({
    userId,
    title: `Slip Gaji Periode ${period}`,
    body: `Slip gaji Anda untuk periode ${period} telah terbit. Total: Rp ${total.toLocaleString("id-ID")}`,
    channels: ["EMAIL", "INBOX"],
  });

  return NextResponse.json(payslip);
}
