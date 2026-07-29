"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users2,
  ListChecks,
  CalendarDays,
  Inbox,
  Megaphone,
  Wallet,
  Headphones,
  Package,
  LogOut,
  UserCircle2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: any; roles?: string[] };

const items: NavItem[] = [
  { href: "/dashboard/profile", label: "Profil Saya", icon: UserCircle2 },
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/dashboard/team", label: "Team Management", icon: Users2 },
  { href: "/dashboard/tasks", label: "Tugas", icon: ListChecks },
  { href: "/dashboard/calendar", label: "Kalender & Laporan", icon: CalendarDays },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/advertising", label: "Advertising", icon: Megaphone },
  { href: "/dashboard/accounting", label: "Accounting", icon: Wallet },
  { href: "/dashboard/customer-service", label: "Customer Service", icon: Headphones },
  { href: "/dashboard/cs-performance", label: "Rekap Performa CS", icon: ClipboardList },
  { href: "/dashboard/products", label: "Produk", icon: Package },
];

export function Sidebar({
  role,
  divisionName,
  secondDivisionName,
}: {
  role: string;
  divisionName: string | null;
  secondDivisionName?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Karyawan rangkap divisi dapat akses penuh ke kedua divisinya.
  const names = [divisionName, secondDivisionName].filter(Boolean).map((n) => n!.toLowerCase());
  const has = (keyword: string) => names.some((n) => n.includes(keyword));

  const visible = items.filter((item) => {
    if (item.href === "/dashboard/advertising") {
      return role === "SUPERADMIN" || has("advertising");
    }
    if (item.href === "/dashboard/accounting") {
      return role === "SUPERADMIN" || has("acounting") || has("accounting");
    }
    if (item.href === "/dashboard/customer-service") {
      return role === "SUPERADMIN" || has("costumer") || has("customer");
    }
    if (item.href === "/dashboard/cs-performance") {
      return role === "SUPERADMIN" || has("management admin") || has("costumer") || has("customer");
    }
    if (item.href === "/dashboard/team" || item.href === "/dashboard/products") {
      return role === "SUPERADMIN" || role === "DIVISION_HEAD";
    }
    return true;
  });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="glass-dark fixed left-4 top-4 bottom-4 z-40 hidden w-64 flex-col rounded-4xl p-4 lg:flex">
      <div className="mb-6 flex items-center gap-2 px-2 pt-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl glass-strong">
          <img src="/brand/logo-icon.png" alt="Taha Group" className="h-6 w-6 object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Taha Group</p>
          <p className="text-[11px] text-white/40">Work Space</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto glass-scroll pr-1">
        {visible.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                active ? "glass text-white shadow-glass" : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-accent-pink/80 transition-all hover:bg-accent-pink/10"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>
    </aside>
  );
}
