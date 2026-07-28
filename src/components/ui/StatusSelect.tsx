"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const META: Record<string, { label: string; dot: string; text: string }> = {
  TODO: { label: "Belum Dikerjakan", dot: "bg-white/50", text: "text-white/70" },
  IN_PROGRESS: { label: "Diproses", dot: "bg-accent", text: "text-accent" },
  REVIEW: { label: "Review", dot: "bg-accent-orange", text: "text-accent-orange" },
  DONE: { label: "Selesai", dot: "bg-accent-green", text: "text-accent-green" },
};

export function StatusSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const list = options || Object.keys(META);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    function updateRect() {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setOpen((o) => !o);
  }

  const current = META[value] || { label: value, dot: "bg-white/50", text: "text-white/70" };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 rounded-xl glass-pill px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
      >
        <span className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />
          <span className={current.text}>{current.label}</span>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-white/40 transition-transform", open && "rotate-180")} />
      </button>

      {mounted && open && rect &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width, zIndex: 9999 }}
            className="glass-strong overflow-hidden rounded-2xl p-1.5 shadow-glass ring-1 ring-white/10 [background:linear-gradient(135deg,rgba(28,30,42,0.97),rgba(14,16,26,0.97))]"
          >
            {list.map((s) => {
              const meta = META[s] || { label: s, dot: "bg-white/50", text: "text-white/70" };
              const active = s === value;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition hover:bg-white/10",
                    active ? "bg-white/10" : ""
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    <span className={meta.text}>{meta.label}</span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
