"use client";
import { useEffect, useState } from "react";

export function GlassClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="glass-pill rounded-full px-4 py-2 text-sm text-white/60">--:--:--</div>;

  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="glass-pill flex items-center gap-3 rounded-full px-4 py-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums text-white">{time}</span>
      <span className="hidden text-xs text-white/50 sm:inline">{date}</span>
    </div>
  );
}
