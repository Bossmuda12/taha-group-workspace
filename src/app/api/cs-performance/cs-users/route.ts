import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let allowed = session.role === "SUPERADMIN";
  if (!allowed && session.divisionId) {
    const division = await prisma.division.findUnique({ where: { id: session.divisionId } });
    allowed = !!division?.name?.toLowerCase().includes("management admin");
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const csUsers = await prisma.user.findMany({
    where: {
      division: { name: { contains: "ustomer" } }, // cocok utk "Costumer Service" / "Customer Service"
      status: "ACTIVE",
    },
    select: { id: true, fullName: true, position: true },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json(csUsers);
}
