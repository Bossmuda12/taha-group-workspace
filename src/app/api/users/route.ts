import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, sessionDivisionIds } from "@/lib/auth";
import { GHOST_USERNAME } from "@/lib/ghost-user";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const divisionId = searchParams.get("divisionId");

  // Akun placeholder "Pengguna Dihapus" (penampung riwayat data karyawan yang sudah dihapus
  // permanen) tidak boleh muncul di daftar karyawan mana pun.
  const where: any = { username: { not: GHOST_USERNAME } };
  if (session.role !== "SUPERADMIN") {
    const divisionIds = sessionDivisionIds(session);
    where.OR = [{ divisionId: { in: divisionIds } }, { secondDivisionId: { in: divisionIds } }];
  } else if (divisionId) {
    where.OR = [{ divisionId }, { secondDivisionId: divisionId }];
  }

  const users = await prisma.user.findMany({
    where,
    include: { division: true, secondDivision: true },
    orderBy: { createdAt: "desc" },
  });

  const safe = users.map(({ passwordHash, ...u }: (typeof users)[number]) => u);
  return NextResponse.json(safe);
}
