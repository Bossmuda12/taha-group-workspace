"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, PackageCheck, Truck, RotateCcw, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect, GlassTextarea } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type CsUser = { id: string; fullName: string; position: string };
type Rec = {
  id: string;
  date: string;
  resi: string | null;
  closingCount: number;
  deliveryCount: number;
  returCount: number;
  successCount: number;
  notes: string | null;
  csUser: { id: string; fullName: string };
  enteredBy: { fullName: string };
};

export default function CsPerformancePage() {
  const toast = useToast();
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [csUsers, setCsUsers] = useState<CsUser[]>([]);
  const [records, setRecords] = useState<Rec[]>([]);
  const [filterCs, setFilterCs] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    csUserId: "", date: new Date().toISOString().slice(0, 10), resi: "",
    closingCount: "", deliveryCount: "", returCount: "", successCount: "", notes: "",
  });

  async function load(csUserId?: string) {
    const usersRes = await fetch("/api/cs-performance/cs-users");
    if (usersRes.ok) {
      setIsManager(true);
      setCsUsers(await usersRes.json());
    } else {
      setIsManager(false);
    }
    const params = new URLSearchParams();
    if (csUserId) params.set("csUserId", csUserId);
    const recRes = await fetch(`/api/cs-performance${params.toString() ? `?${params}` : ""}`);
    if (recRes.ok) setRecords(await recRes.json());
  }
  useEffect(() => { load(); }, []);

  const totals = useMemo(
    () =>
      records.reduce(
        (a, r) => ({
          closing: a.closing + r.closingCount,
          delivery: a.delivery + r.deliveryCount,
          retur: a.retur + r.returCount,
          success: a.success + r.successCount,
        }),
        { closing: 0, delivery: 0, retur: 0, success: 0 }
      ),
    [records]
  );

  const chartData = useMemo(
    () =>
      [...records]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14)
        .map((r) => ({
          tanggal: formatDate(r.date, { day: "2-digit", month: "2-digit" }),
          Closing: r.closingCount,
          Pengiriman: r.deliveryCount,
          Retur: r.returCount,
          Sukses: r.successCount,
        })),
    [records]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cs-performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Rekap performa CS tersimpan");
      setOpen(false);
      setForm((f) => ({ ...f, resi: "", closingCount: "", deliveryCount: "", returCount: "", successCount: "", notes: "" }));
      load(filterCs);
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || "Gagal menyimpan rekap", "error");
    }
  }

  function applyFilter(id: string) {
    setFilterCs(id);
    load(id);
  }

  if (isManager === null) {
    return <p className="text-sm text-white/40">Memuat...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Rekap Performa Customer Service</h1>
          <p className="text-sm text-white/50">
            {isManager
              ? "Input & monitoring resi closingan, pengiriman, retur, dan paket sukses per CS"
              : "Rekap performa harian Anda yang dicatat oleh Management Admin"}
          </p>
        </div>
        {isManager && (
          <GlassButton onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Input Rekap CS
          </GlassButton>
        )}
      </div>

      {isManager && csUsers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl glass-pill px-3 py-2 w-fit">
          <span className="text-xs text-white/40">Filter CS:</span>
          <button
            onClick={() => applyFilter("")}
            className={`rounded-xl px-3 py-1.5 text-xs ${!filterCs ? "bg-accent/20 text-accent" : "text-white/60 hover:bg-white/10"}`}
          >
            Semua
          </button>
          {csUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => applyFilter(u.id)}
              className={`rounded-xl px-3 py-1.5 text-xs ${filterCs === u.id ? "bg-accent/20 text-accent" : "text-white/60 hover:bg-white/10"}`}
            >
              {u.fullName}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Closingan" value={totals.closing} icon={PackageCheck} color="#0A84FF" />
        <StatCard label="Total Pengiriman" value={totals.delivery} icon={Truck} color="#30D158" />
        <StatCard label="Retur / RTS" value={totals.retur} icon={RotateCcw} color="#FF375F" />
        <StatCard label="Terkirim Sukses" value={totals.success} icon={CheckCircle2} color="#BF5AF2" />
      </div>

      <GlassCard className="p-5">
        <p className="mb-4 text-sm font-semibold text-white">Grafik Performa (14 entri terakhir)</p>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/30">Belum ada data untuk ditampilkan.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="tanggal" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "#14161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="Closing" stroke="#0A84FF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Pengiriman" stroke="#30D158" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Retur" stroke="#FF375F" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Sukses" stroke="#BF5AF2" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <GlassCard className="overflow-x-auto p-5">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left text-xs text-white/40">
              <th className="pb-3 font-medium">Tanggal</th>
              {isManager && <th className="pb-3 font-medium">CS</th>}
              <th className="pb-3 font-medium">No. Resi</th>
              <th className="pb-3 font-medium">Closing</th>
              <th className="pb-3 font-medium">Pengiriman</th>
              <th className="pb-3 font-medium">Retur/RTS</th>
              <th className="pb-3 font-medium">Sukses</th>
              <th className="pb-3 font-medium">Diinput oleh</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-white/5 text-white/80">
                <td className="py-3">{formatDate(r.date)}</td>
                {isManager && <td className="py-3">{r.csUser.fullName}</td>}
                <td className="py-3 text-white/50">{r.resi || "-"}</td>
                <td className="py-3 text-accent">{r.closingCount}</td>
                <td className="py-3 text-accent-green">{r.deliveryCount}</td>
                <td className="py-3 text-accent-pink">{r.returCount}</td>
                <td className="py-3 text-accent-purple">{r.successCount}</td>
                <td className="py-3 text-white/40">{r.enteredBy.fullName}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <p className="py-6 text-center text-sm text-white/30">Belum ada data rekap.</p>}
      </GlassCard>

      <GlassModal open={open} onClose={() => setOpen(false)} title="Input Rekap Performa CS">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <GlassLabel>Karyawan CS</GlassLabel>
            <GlassSelect value={form.csUserId} onChange={(e) => setForm((f) => ({ ...f, csUserId: e.target.value }))} required>
              <option value="" className="bg-ink-800">Pilih karyawan CS</option>
              {csUsers.map((u) => <option key={u.id} value={u.id} className="bg-ink-800">{u.fullName}</option>)}
            </GlassSelect>
          </div>
          <div><GlassLabel>Tanggal</GlassLabel><GlassInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required /></div>
          <div>
            <GlassLabel>No. Resi Closingan</GlassLabel>
            <GlassInput value={form.resi} onChange={(e) => setForm((f) => ({ ...f, resi: e.target.value }))} placeholder="JNE00123456789" />
          </div>
          <div><GlassLabel>Total Closingan</GlassLabel><GlassInput type="number" value={form.closingCount} onChange={(e) => setForm((f) => ({ ...f, closingCount: e.target.value }))} /></div>
          <div><GlassLabel>Total Pengiriman</GlassLabel><GlassInput type="number" value={form.deliveryCount} onChange={(e) => setForm((f) => ({ ...f, deliveryCount: e.target.value }))} /></div>
          <div><GlassLabel>Retur / RTS Paket</GlassLabel><GlassInput type="number" value={form.returCount} onChange={(e) => setForm((f) => ({ ...f, returCount: e.target.value }))} /></div>
          <div><GlassLabel>Paket Terkirim Sukses</GlassLabel><GlassInput type="number" value={form.successCount} onChange={(e) => setForm((f) => ({ ...f, successCount: e.target.value }))} /></div>
          <div className="sm:col-span-2"><GlassLabel>Catatan</GlassLabel><GlassTextarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
          <div className="sm:col-span-2"><GlassButton type="submit" className="w-full">Simpan Rekap</GlassButton></div>
        </form>
      </GlassModal>
    </div>
  );
}
