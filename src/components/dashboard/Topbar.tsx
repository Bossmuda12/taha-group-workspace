"use client";
import { Bell, Menu, Search, ListChecks, User2, FileText, Loader2 } from "lucide-react";
import { GlassClock } from "@/components/ui/GlassClock";
import { initials } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MobileNav } from "./MobileNav";

type SearchResults = {
  tasks: { id: string; title: string; sub: string; href: string }[];
  users: { id: string; title: string; sub: string; href: string }[];
  reports: { id: string; title: string; sub: string; href: string }[];
};

type Notif = { id: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

export function Topbar({
  fullName,
  position,
  avatarColor,
  avatarUrl,
  role,
  divisionName,
  notifCount,
}: {
  fullName: string;
  position: string;
  avatarColor: string;
  avatarUrl?: string | null;
  role: string;
  divisionName: string | null;
  notifCount: number;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(notifCount);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function openNotifications() {
    setNotifOpen((v) => !v);
    if (!notifOpen) {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifs(await res.json());
    }
  }

  async function goToNotif(n: Notif) {
    if (!n.read) {
      setUnread((u) => Math.max(0, u - 1));
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
    }
    setNotifOpen(false);
    router.push(n.link || "/dashboard/inbox");
  }

  function goTo(href: string) {
    setSearchOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  }

  const hasResults = results && (results.tasks.length || results.users.length || results.reports.length);

  return (
    <header className="glass sticky top-4 z-30 mb-6 flex items-center justify-between gap-3 rounded-4xl px-4 py-3 sm:px-6">
      <button className="lg:hidden text-white/70" onClick={() => setMobileOpen(true)}>
        <Menu className="h-5 w-5" />
      </button>

      <div ref={searchRef} className="relative hidden sm:block">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Cari tugas, karyawan, laporan..."
            className="w-56 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
          {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" />}
        </div>

        {searchOpen && query.trim().length >= 2 && (
          <div className="glass-strong absolute left-0 top-12 z-40 w-80 rounded-3xl p-2 shadow-glass">
            {!hasResults && !searching && (
              <p className="px-3 py-4 text-center text-xs text-white/40">Tidak ada hasil untuk "{query}"</p>
            )}
            {results?.tasks && results.tasks.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-white/30">Tugas</p>
                {results.tasks.map((r) => (
                  <button key={r.id} onClick={() => goTo(r.href)} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left hover:bg-white/10">
                    <ListChecks className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-white">{r.title}</span>
                      <span className="block truncate text-[10px] text-white/40">{r.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {results?.users && results.users.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-white/30">Karyawan</p>
                {results.users.map((r) => (
                  <button key={r.id} onClick={() => goTo(r.href)} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left hover:bg-white/10">
                    <User2 className="h-3.5 w-3.5 shrink-0 text-accent-purple" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-white">{r.title}</span>
                      <span className="block truncate text-[10px] text-white/40">{r.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {results?.reports && results.reports.length > 0 && (
              <div>
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-white/30">Laporan</p>
                {results.reports.map((r) => (
                  <button key={r.id} onClick={() => goTo(r.href)} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left hover:bg-white/10">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-accent-green" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-white">{r.title}</span>
                      <span className="block truncate text-[10px] text-white/40">{r.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden md:block">
          <GlassClock />
        </div>

        <div ref={notifRef} className="relative">
          <button onClick={openNotifications} className="relative glass-pill flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:text-white">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-pink text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="glass-strong absolute right-0 top-12 z-40 w-80 rounded-3xl p-2 shadow-glass">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-white/30">Notifikasi</p>
              <div className="max-h-80 overflow-y-auto glass-scroll">
                {notifs.length === 0 && <p className="px-3 py-6 text-center text-xs text-white/40">Belum ada notifikasi.</p>}
                {notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => goToNotif(n)}
                    className={`block w-full rounded-2xl px-3 py-2.5 text-left hover:bg-white/10 ${!n.read ? "bg-white/5" : ""}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="truncate text-xs font-medium text-white">{n.title}</span>
                      {!n.read && <span className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-white/40">{n.body}</span>
                  </button>
                ))}
              </div>
              <a href="/dashboard/inbox" className="mt-1 block rounded-2xl px-3 py-2 text-center text-xs text-accent hover:bg-white/10">
                Lihat semua
              </a>
            </div>
          )}
        </div>

        <Link href="/dashboard/profile" className="flex items-center gap-2.5 rounded-full glass-pill py-1.5 pl-1.5 pr-3 transition hover:bg-white/10">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: avatarColor }}
            >
              {initials(fullName)}
            </div>
          )}
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-white">{fullName}</p>
            <p className="text-[11px] leading-tight text-white/40">{position}</p>
          </div>
        </Link>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} role={role} divisionName={divisionName} />
    </header>
  );
}
