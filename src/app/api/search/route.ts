import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, sessionDivisionIds } from "@/lib/auth";
import { GHOST_USERNAME } from "@/lib/ghost-user";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ tasks: [], users: [], reports: [] });

  const isAdmin = session.role === "SUPERADMIN";
  const divisionIds = sessionDivisionIds(session);
  const taskWhere: any = {
    title: { contains: q, mode: "insensitive" },
    ...(isAdmin ? {} : { OR: [{ assignedToId: session.userId }, { divisionId: { in: divisionIds } }] }),
  };
  const userWhere: any = {
    AND: [
      { username: { not: GHOST_USERNAME } },
      {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { position: { contains: q, mode: "insensitive" } },
        ],
      },
      ...(isAdmin ? [] : [{ OR: [{ divisionId: { in: divisionIds } }, { secondDivisionId: { in: divisionIds } }] }]),
    ],
  };
  const reportWhere: any = {
    summary: { contains: q, mode: "insensitive" },
    ...(isAdmin ? {} : { userId: session.userId }),
  };

  const [tasks, users, reports] = await Promise.all([
    prisma.task.findMany({ where: taskWhere, take: 6, include: { division: true } }),
    prisma.user.findMany({ where: userWhere, take: 6 }),
    prisma.dailyRecord.findMany({ where: reportWhere, take: 6, include: { user: true } }),
  ]);

  return NextResponse.json({
    tasks: tasks.map((t: (typeof tasks)[number]) => ({ id: t.id, title: t.title, sub: t.division.name, href: "/dashboard/tasks" })),
    users: users.map((u: (typeof users)[number]) => ({ id: u.id, title: u.fullName, sub: u.position, href: "/dashboard/team" })),
    reports: reports.map((r: (typeof reports)[number]) => ({ id: r.id, title: r.summary.slice(0, 60), sub: r.user.fullName, href: "/dashboard/calendar" })),
  });
}
