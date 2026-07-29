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
    const allowed = ["fullName", "whatsapp", "address", "avatarUrl", "email", "username", "position"];
    const data: any = {};
    for (const key of allowed) if (key in body) data[key] = typeof body[key] === "string" ? body[key].trim() : body[key];

    // Email & username wajib unik di seluruh sistem (dipakai untuk login).
    if (data.email || data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          id: { not: user.id },
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.username ? [{ username: data.username }] : []),
          ],
        },
      });
      if (existing) {
        return NextResponse.json({ error: "Username atau email sudah dipakai akun lain" }, { status: 409 });
      }
    }

    try {
      const updated = await prisma.user.update({ where: { id: user.id }, data });
      const { passwordHash, ...safe } = updated;
      return NextResponse.json(safe);
    } catch (err: any) {
      if (err?.code === "P2002") {
        return NextResponse.json({ error: "Username atau email sudah dipakai akun lain" }, { status: 409 });
      }
      throw err;
    }
}
