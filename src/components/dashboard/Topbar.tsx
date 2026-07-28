"use client";
import { Bell, Menu, Search } from "lucide-react";
import { GlassClock } from "@/components/ui/GlassClock";
import { initials } from "@/lib/utils";
import { useState } from "react";
import { MobileNav } from "./MobileNav";

export function Topbar({
  fullName,
  position,
  avatarColor,
  role,
  divisionName,
  notifCount,
}: {
  fullName: string;
  position: string;
  avatarColor: string;
  role: string;
  divisionName: string | null;
  notifCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="glass sticky top-4 z-30 mb-6 flex items-center justify-between gap-3 rounded-4xl px-4 py-3 sm:px-6">
      <button className="lg:hidden text-white/70" onClick={() => setMobileOpen(true)}>
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 sm:flex">
        <Search className="h-4 w-4 text-white/40" />
        <input
          placeholder="Cari tugas, karyawan, laporan..."
          className="w-56 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden md:block">
          <GlassClock />
        </div>
        <a href="/dashboard/inbox" className="relative glass-pill flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:text-white">
          <Bell className="h-4 w-4" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-pink text-[10px] font-bold text-white">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </a>
        <div className="flex items-center gap-2.5 rounded-full glass-pill py-1.5 pl-1.5 pr-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: avatarColor }}
          >
            {initials(fullName)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-white">{fullName}</p>
            <p className="text-[11px] leading-tight text-white/40">{position}</p>
          </div>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} role={role} divisionName={divisionName} />
    </header>
  );
}
