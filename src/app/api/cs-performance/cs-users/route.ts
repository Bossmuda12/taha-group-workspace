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

  const [byCostumer, byCustomer] = await Promise.all([
    prisma.user.findMany({
      where: { division: { name: { contains: "ostumer" } }, status: "ACTIVE" }, // cocok "Costumer Service"
      select: { id: true, fullName: true, position: true },
    }),
    prisma.user.findMany({
      where: { division: { name: { contains: "ustomer" } }, status: "ACTIVE" }, // cocok "Customer Service"
      select: { id: true, fullName: true, position: true },
    }),
  ]);
  const seen = new Set<string>();
  const csUsers = [...byCostumer, ...byCustomer]
    .filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true)))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  return NextResponse.json(csUsers);
}
