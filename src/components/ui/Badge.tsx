import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  TODO: "bg-white/10 text-white/70",
  IN_PROGRESS: "bg-accent/20 text-accent",
  REVIEW: "bg-accent-orange/20 text-accent-orange",
  DONE: "bg-accent-green/20 text-accent-green",
  OVERDUE: "bg-accent-pink/20 text-accent-pink",
  LOW: "bg-white/10 text-white/60",
  MEDIUM: "bg-accent/20 text-accent",
  HIGH: "bg-accent-orange/20 text-accent-orange",
  URGENT: "bg-accent-pink/20 text-accent-pink",
  ACTIVE: "bg-accent-green/20 text-accent-green",
  PENDING: "bg-accent-orange/20 text-accent-orange",
  SUSPENDED: "bg-accent-pink/20 text-accent-pink",
  SENT: "bg-accent-green/20 text-accent-green",
  FAILED: "bg-accent-pink/20 text-accent-pink",
  APPROVED: "bg-accent-green/20 text-accent-green",
  REJECTED: "bg-accent-pink/20 text-accent-pink",
};

const labels: Record<string, string> = {
  TODO: "Belum Dikerjakan",
  IN_PROGRESS: "Diproses",
  REVIEW: "Review",
  DONE: "Selesai",
  OVERDUE: "Terlambat",
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
  ACTIVE: "Aktif",
  PENDING: "Menunggu",
  SUSPENDED: "Nonaktif",
  SENT: "Terkirim",
  FAILED: "Gagal",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export function Badge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        map[value] ?? "bg-white/10 text-white/70",
        className
      )}
    >
      {labels[value] ?? value}
    </span>
  );
}
