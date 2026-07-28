import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: any = {};
  if (session.role !== "SUPERADMIN") where.user = { divisionId: session.divisionId };

  const records = await prisma.advertisingRecord.findMany({ where, include: { user: true, product: true }, orderBy: { date: "desc" } });
  const rows = records.map((r: (typeof records)[number]) => ({
    Tanggal: formatDate(r.date),
    "Nama Tim": r.teamName,
    "Nama Karyawan": r.user.fullName,
    "Closing": r.closingCount,
    "Leads Masuk": r.leadsCount,
    "Akun Iklan": r.adAccount,
    "Nama Facebook": r.facebookName,
    "Total Spend": r.spendBudget,
    "Produk": r.product?.name ?? "-",
    "Catatan": r.notes ?? "",
  }));

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-advertising-${Date.now()}.csv"`,
    },
  });
}
