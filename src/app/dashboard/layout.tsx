import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { WelcomeScreen } from "@/components/dashboard/WelcomeScreen";
import { ChatWidget } from "@/components/dashboard/ChatWidget";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/Confirm";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const notifCount = await prisma.notification.count({
    where: { userId: user.id, channel: "INBOX", status: "SENT", read: false },
  });

  return (
    <ToastProvider>
      <ConfirmProvider>
        <WelcomeScreen fullName={user.fullName} />
        <Sidebar role={user.role} divisionName={user.division?.name ?? null} secondDivisionName={user.secondDivision?.name ?? null} />
        <div className="min-h-screen px-4 pb-10 pt-4 lg:pl-[18.5rem] lg:pr-8">
          <Topbar
            fullName={user.fullName}
            position={user.position}
            avatarColor={user.avatarColor}
            avatarUrl={user.avatarUrl}
            role={user.role}
            divisionName={user.division?.name ?? null}
            secondDivisionName={user.secondDivision?.name ?? null}
            notifCount={notifCount}
          />
          {children}
        </div>
        <ChatWidget />
      </ConfirmProvider>
    </ToastProvider>
  );
}
