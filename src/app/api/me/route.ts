import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json(null, { status: 401 });
  const { passwordHash, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest) {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const allowed = ["fullName", "whatsapp", "address", "avatarUrl"];
    const data: any = {};
    for (const key of allowed) if (key in body) data[key] = body[key];

    const updated = await prisma.user.update({ where: { id: user.id }, data });
    const { passwordHash, ...safe } = updated;
    return NextResponse.json(safe);
}
