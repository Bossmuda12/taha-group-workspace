"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, FileText } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassTextarea } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/Badge";
import { formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Task = { id: string; title: string; deadline: string; status: string; priority: string };
type Record = { id: string; date: string; summary: string; hoursWorked: number; achievements: string | null; obstacles: string | null; user: { fullName: string } };

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function CalendarPage() {
  const toast = useToast();
  const [cursor, setCursor] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [form, setForm] = useState({ summary: "", hoursWorked: "", achievements: "", obstacles: "" });
  const [range, setRange] = useState({ from: "", to: "" });

  async function load(customRange?: { from: string; to: string }) {
    const r = customRange ?? range;
    const params = new URLSearchParams();
    if (r.from) params.set("from", r.from);
    if (r.to) params.set("to", r.to);
    const query = params.toString();
    const [t, records] = await Promise.all([
      fetch("/api/tasks").then((res) => res.json()),
      fetch(`/api/daily-records${query ? `?${query}` : ""}`).then((res) => res.json()),
    ]);
    setTasks(t);
    setRecords(records);
  }
  useEffect(() => { load(); }, []);

  function applyRange(e: React.FormEvent) {
    e.preventDefault();
    load(range);
  }

  function resetRange() {
    const cleared = { from: "", to: "" };
    setRange(cleared);
    load(cleared);
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();

  const taskMap = useMemo(() => {
    const map: Record2 = {};
    for (const t of tasks) {
      const d = new Date(t.deadline);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate();
        map[key] = map[key] ? [...map[key], t] : [t];
      }
    }
    return map;
  }, [tasks, year, month]);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  async function submitRecord(e: React.FormEvent) {
    e.preventDefault();
    const date = selectedDay ?? new Date();
    const res = await fetch("/api/daily-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: date.toISOString(), ...form }),
    });
    if (res.ok) {
      toast("Laporan harian tersimpan");
      setForm({ summary: "", hoursWorked: "", achievements: "", obstacles: "" });
      load();
    } else toast("Gagal menyimpan laporan", "error");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Kalender & Laporan Harian</h1>
        <p className="text-sm text-white/50">Pantau deadline tugas dan catat rekap pekerjaan setiap hari</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="rounded-full p-2 hover:bg-white/10">
              <ChevronLeft className="h-4 w-4 text-white/60" />
            </button>
            <p className="text-sm font-semibold text-white">
              {cursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </p>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="rounded-full p-2 hover:bg-white/10">
              <ChevronRight className="h-4 w-4 text-white/60" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-white/40">
            {DAY_LABELS.map((d) => <div key={d} className="py-1.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const dayTasks = taskMap[d] || [];
              const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
              const isSelected = selectedDay?.getDate() === d && selectedDay?.getMonth() === month;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(new Date(year, month, d))}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl text-sm transition-all",
                    isSelected ? "glass-strong text-white" : isToday ? "bg-accent/20 text-accent" : "text-white/60 hover:bg-white/5"
                  )}
                >
                  {d}
                  {dayTasks.length > 0 && <span className="h-1 w-1 rounded-full bg-accent-orange" />}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="mb-2 text-xs font-medium text-white/50">
                Tugas deadline {formatDate(selectedDay)}
              </p>
              <div className="space-y-2">
                {(taskMap[selectedDay.getDate()] || []).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl glass-pill px-3 py-2">
                    <span className="text-xs text-white/80">{t.title}</span>
                    <Badge value={t.status} />
                  </div>
                ))}
                {(!taskMap[selectedDay.getDate()] || taskMap[selectedDay.getDate()].length === 0) && (
                  <p className="text-xs text-white/30">Tidak ada deadline pada hari ini.</p>
                )}
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <FileText className="h-4 w-4 text-accent" /> Catat Laporan Harian
          </p>
          <form onSubmit={submitRecord} className="space-y-3">
            <div>
              <GlassLabel>Ringkasan pekerjaan</GlassLabel>
              <GlassTextarea rows={2} value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} required />
            </div>
            <div>
              <GlassLabel>Jam kerja</GlassLabel>
              <GlassInput type="number" step="0.5" value={form.hoursWorked} onChange={(e) => setForm((f) => ({ ...f, hoursWorked: e.target.value }))} />
            </div>
            <div>
              <GlassLabel>Pencapaian</GlassLabel>
              <GlassTextarea rows={2} value={form.achievements} onChange={(e) => setForm((f) => ({ ...f, achievements: e.target.value }))} />
            </div>
            <div>
              <GlassLabel>Kendala</GlassLabel>
              <GlassTextarea rows={2} value={form.obstacles} onChange={(e) => setForm((f) => ({ ...f, obstacles: e.target.value }))} />
            </div>
            <GlassButton type="submit" className="w-full">Simpan Laporan</GlassButton>
          </form>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-white">Riwayat Laporan</p>
          <form onSubmit={applyRange} className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="rounded-xl glass-pill px-3 py-1.5 text-xs text-white outline-none"
            />
            <span className="text-xs text-white/40">s/d</span>
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="rounded-xl glass-pill px-3 py-1.5 text-xs text-white outline-none"
            />
            <button type="submit" className="rounded-xl bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/30">
              Terapkan
            </button>
            {(range.from || range.to) && (
              <button type="button" onClick={resetRange} className="rounded-xl px-3 py-1.5 text-xs text-white/40 hover:text-white/70">
                Reset
              </button>
            )}
          </form>
        </div>
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="rounded-2xl glass-pill p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-white">{r.user?.fullName} · {formatDate(r.date)}</p>
                <span className="flex items-center gap-1 text-xs text-white/40"><Clock3 className="h-3 w-3" /> {r.hoursWorked} jam</span>
              </div>
              <p className="text-xs text-white/60">{r.summary}</p>
            </div>
          ))}
          {records.length === 0 && <p className="text-sm text-white/30">Belum ada laporan.</p>}
        </div>
      </GlassCard>
    </div>
  );
}
type Record2 = { [day: number]: Task[] };
