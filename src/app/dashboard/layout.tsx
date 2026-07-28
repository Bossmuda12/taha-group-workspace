import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { WelcomeScreen } from "@/components/dashboard/WelcomeScreen";
import { ToastProvider } from "@/components/ui/Toast";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const notifCount = await prisma.notification.count({
    where: { userId: user.id, channel: "INBOX", status: "SENT" },
  });

  return (
    <ToastProvider>
      <WelcomeScreen fullName={user.fullName} />
      <Sidebar role={user.role} divisionName={user.division?.name ?? null} />
      <div className="min-h-screen px-4 pb-10 pt-4 lg:pl-[17rem] lg:pr-6">
        <Topbar
          fullName={user.fullName}
          position={user.position}
          avatarColor={user.avatarColor}
          role={user.role}
          divisionName={user.division?.name ?? null}
          notifCount={notifCount}
        />
        {children}
      </div>
    </ToastProvider>
  );
}
