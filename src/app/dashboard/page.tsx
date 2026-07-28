import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ListChecks, Users2, Clock3, AlertTriangle, Building2, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardHome() {
  const user = await requireUser();
  if (!user) return null;

  const isAdmin = user.role === "SUPERADMIN";
  const taskWhere = isAdmin ? {} : { OR: [{ assignedToId: user.id }, { divisionId: user.divisionId ?? "" }] };

  const [totalTasks, doneTasks, overdueTasks, totalEmployees, divisions, upcoming, pendingCount] = await Promise.all([
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({ where: { ...taskWhere, status: "DONE" } }),
    prisma.task.count({ where: { ...taskWhere, deadline: { lt: new Date() }, status: { not: "DONE" } } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.division.findMany({ include: { _count: { select: { users: true } } } }),
    prisma.task.findMany({
      where: { ...taskWhere, status: { not: "DONE" } },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { division: true, assignedTo: true },
    }),
    isAdmin ? prisma.user.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-6">
      {isAdmin && pendingCount > 0 && (
        <Link href="/dashboard/team?pending=1" className="block">
          <GlassCard className="border border-accent-orange/30 p-4 transition hover:bg-white/5">
            <p className="flex items-center gap-2 text-sm text-accent-orange">
              <UserCheck className="h-4 w-4" />
              {pendingCount} karyawan menunggu aktivasi akun. Klik untuk review.
            </p>
          </GlassCard>
        </Link>
      )}

      <GlassCard strong className="animate-fade-up overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-white/50">{formatDate(new Date(), { weekday: "long" })}</p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
              Halo, {user.fullName.split(" ")[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {isAdmin ? `Anda masuk sebagai ${user.position || "Founder Taha Group"}` : `${user.position} · ${user.division?.name ?? "Belum ada divisi"}`}
            </p>
          </div>
          {isAdmin && (
            <Link href="/dashboard/tasks?new=1">
              <button className="rounded-full bg-gradient-to-b from-accent to-[#0066CC] px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:brightness-110">
                + Berikan Tugas Baru
              </button>
            </Link>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Tugas" value={totalTasks} icon={ListChecks} color="#0A84FF" />
        <StatCard label="Selesai" value={doneTasks} icon={Clock3} color="#30D158" />
        <StatCard label="Terlambat" value={overdueTasks} icon={AlertTriangle} color="#FF375F" />
        {isAdmin ? (
          <StatCard label="Karyawan Aktif" value={totalEmployees} icon={Users2} color="#BF5AF2" />
        ) : (
          <StatCard label="Divisi" value={user.division?.name ?? "-"} icon={Building2} color="#BF5AF2" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="animate-fade-up p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-white">Tugas Mendekati Deadline</h3>
          <div className="space-y-3">
            {upcoming.length === 0 && <p className="text-sm text-white/40">Tidak ada tugas aktif saat ini 🎉</p>}
            {upcoming.map((t: (typeof upcoming)[number]) => (
              <div key={t.id} className="flex items-center justify-between rounded-2xl glass-pill px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{t.title}</p>
                  <p className="text-xs text-white/40">
                    {t.division.name} {t.assignedTo ? `· ${t.assignedTo.fullName}` : ""} · {formatDate(t.deadline)}
                  </p>
                </div>
                <Badge value={t.status} />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="animate-fade-up p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Divisi</h3>
          <div className="space-y-2.5">
            {divisions.map((d: (typeof divisions)[number]) => (
              <Link
                key={d.id}
                href="/dashboard/team"
                className="flex items-center justify-between rounded-2xl px-3 py-2.5 transition hover:bg-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-sm text-white/80">{d.name}</span>
                </div>
                <span className="text-xs text-white/40">{d._count.users} orang</span>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
