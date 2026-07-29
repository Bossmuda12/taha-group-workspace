import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isManagementAccountingOrFounder } from "@/lib/rbac";

// Daftar seluruh karyawan aktif (lintas divisi) untuk dropdown pembuatan slip gaji.
// Hanya Management Accounting/Founder yang boleh mengakses.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await isManagementAccountingOrFounder(session);
  if (!allowed) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const employees = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    include: { division: true, secondDivision: true },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json(
    employees.map((e: (typeof employees)[number]) => ({
      id: e.id,
      fullName: e.fullName,
      position: e.position,
      divisionName: [e.division?.name, e.secondDivision?.name].filter(Boolean).join(" & ") || "Belum ditempatkan",
    }))
  );
}
