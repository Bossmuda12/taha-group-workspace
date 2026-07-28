import { GlassCard } from "@/components/ui/GlassCard";
import { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "#0A84FF",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  hint?: string;
}) {
  return (
    <GlassCard className="animate-fade-up p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">{label}</p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </GlassCard>
  );
}
