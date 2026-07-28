import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const divisionId = searchParams.get("divisionId");

  const where: any = {};
  if (session.role !== "SUPERADMIN") {
    where.divisionId = session.divisionId;
  } else if (divisionId) {
    where.divisionId = divisionId;
  }

  const users = await prisma.user.findMany({
    where,
    include: { division: true },
    orderBy: { createdAt: "desc" },
  });

  const safe = users.map(({ passwordHash, ...u }: (typeof users)[number]) => u);
  return NextResponse.json(safe);
}
