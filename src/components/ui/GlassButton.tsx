"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function GlassButton({
  className,
  variant = "primary",
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  const variants: Record<Variant, string> = {
    primary:
      "bg-gradient-to-b from-accent to-[#0066CC] text-white shadow-glow border border-white/25 hover:brightness-110",
    secondary: "glass-pill text-white hover:bg-white/15",
    ghost: "bg-transparent text-white/80 hover:bg-white/10 border border-transparent",
    danger: "bg-gradient-to-b from-[#FF5F6D] to-[#C7233A] text-white border border-white/20 hover:brightness-110",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium",
        "transition-all duration-300 active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
