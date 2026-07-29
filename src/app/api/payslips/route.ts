import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { isManagementAccountingOrFounder } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const period = searchParams.get("period");

  const canSeeAll = await isManagementAccountingOrFounder(session);

  const where: any = {};
  if (!canSeeAll) {
    // Karyawan biasa hanya bisa lihat slip gaji miliknya sendiri
    where.userId = session.userId;
  } else if (userId) {
    where.userId = userId;
  }
  if (period) where.period = period;

  const payslips = await prisma.payslip.findMany({ where, include: { user: true }, orderBy: [{ period: "desc" }, { createdAt: "desc" }] });
  return NextResponse.json(payslips);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await isManagementAccountingOrFounder(session);
  if (!allowed) {
    return NextResponse.json({ error: "Hanya Management Accounting/Founder yang bisa membuat slip gaji" }, { status: 403 });
  }

  const { userId, period, baseSalary, bonus, deduction } = await req.json();
  if (!userId || !period) {
    return NextResponse.json({ error: "Karyawan dan periode wajib diisi" }, { status: 400 });
  }
  const total = Number(baseSalary || 0) + Number(bonus || 0) - Number(deduction || 0);

  const payslip = await prisma.payslip.create({
    data: { userId, period, baseSalary: Number(baseSalary) || 0, bonus: Number(bonus) || 0, deduction: Number(deduction) || 0, total },
    include: { user: true },
  });

  await notifyUser({
    userId,
    title: `Slip Gaji Periode ${period}`,
    body: `Slip gaji Anda untuk periode ${period} telah terbit.\n\nGaji Pokok: Rp ${Number(baseSalary || 0).toLocaleString("id-ID")}\nBonus: Rp ${Number(bonus || 0).toLocaleString("id-ID")}\nPotongan: Rp ${Number(deduction || 0).toLocaleString("id-ID")}\nTotal: Rp ${total.toLocaleString("id-ID")}`,
    channels: ["EMAIL", "INBOX"],
    link: "/dashboard/inbox",
  });

  return NextResponse.json(payslip);
}
