import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isManagementAccountingOrFounder } from "@/lib/rbac";
import { toXlsxBuffer } from "@/lib/xlsx";
import { formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await isManagementAccountingOrFounder(session);
  if (!allowed) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");

  const where: any = {};
  if (period) where.period = period;

  const payslips = await prisma.payslip.findMany({
    where,
    include: { user: { include: { division: true, secondDivision: true } } },
    orderBy: [{ period: "desc" }, { createdAt: "desc" }],
  });

  const rows = payslips.map((p: (typeof payslips)[number]) => ({
    "Nama Karyawan": p.user.fullName,
    Jabatan: p.user.position,
    Divisi: [p.user.division?.name, p.user.secondDivision?.name].filter(Boolean).join(" & ") || "-",
    Periode: p.period,
    "Gaji Pokok": p.baseSalary,
    Bonus: p.bonus,
    Potongan: p.deduction,
    Total: p.total,
    "Tanggal Terbit": formatDate(p.createdAt),
  }));

  const buffer = toXlsxBuffer(rows, "Slip Gaji");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="slip-gaji-${period || "semua"}-${Date.now()}.xlsx"`,
    },
  });
}
