"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Wallet2, ShoppingCart, FileBarChart, Banknote } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect, GlassTextarea } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Rec = { id: string; date: string; type: string; category: string; description: string; amount: number; user: { fullName: string } };
type Payslip = { id: string; period: string; total: number; user: { fullName: string } };

const COLORS = ["#0A84FF", "#BF5AF2", "#FF375F", "#63E6E2", "#FF9F0A", "#30D158"];
const TYPE_LABEL: Record<string, string> = { OUTFLOW: "Pengeluaran", PURCHASE: "Pembelian Barang", RECAP: "Rekapitulasi" };

export default function AccountingPage() {
  const toast = useToast();
  const [records, setRecords] = useState<Rec[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [range, setRange] = useState({ start: "", end: "" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "OUTFLOW", category: "", description: "", amount: "" });

  async function load() {
    const qs = new URLSearchParams();
    if (range.start) qs.set("start", range.start);
    if (range.end) qs.set("end", range.end);
    const [r, p] = await Promise.all([
      fetch(`/api/accounting?${qs}`).then((res) => res.json()),
      fetch("/api/payslips").then((res) => res.json()),
    ]);
    setRecords(r);
    setPayslips(p);
  }
  useEffect(() => { load(); }, [range.start, range.end]);

  const totalOut = useMemo(() => records.reduce((a, r) => a + r.amount, 0), [records]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) map[r.category] = (map[r.category] || 0) + r.amount;
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [records]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) map[r.type] = (map[r.type] || 0) + r.amount;
    return Object.entries(map).map(([type, value]) => ({ name: TYPE_LABEL[type] || type, value }));
  }, [records]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/accounting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Catatan keuangan tersimpan");
      setOpen(false);
      load();
    } else toast("Gagal menyimpan", "error");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Accounting</h1>
          <p className="text-sm text-white/50">Laporan keuangan, pembelian, dan slip gaji</p>
        </div>
        <GlassButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Catat Transaksi</GlassButton>
      </div>

      <GlassCard className="flex flex-wrap items-end gap-3 p-4">
        <div>
          <GlassLabel>Dari Tanggal</GlassLabel>
          <GlassInput type="date" value={range.start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} />
        </div>
        <div>
          <GlassLabel>Sampai Tanggal</GlassLabel>
          <GlassInput type="date" value={range.end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} />
        </div>
        <GlassButton variant="secondary" onClick={() => setRange({ start: "", end: "" })}>Reset</GlassButton>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Pengeluaran" value={formatCurrency(totalOut)} icon={Wallet2} color="#FF375F" />
        <StatCard label="Transaksi" value={records.length} icon={FileBarChart} color="#0A84FF" />
        <StatCard label="Pembelian" value={records.filter((r) => r.type === "PURCHASE").length} icon={ShoppingCart} color="#FF9F0A" />
        <StatCard label="Slip Gaji Terbit" value={payslips.length} icon={Banknote} color="#30D158" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-5">
          <p className="mb-4 text-sm font-semibold text-white">Persentase per Kategori</p>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "#12141C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-white/30">Belum ada data pada rentang ini.</p>}
        </GlassCard>

        <GlassCard className="p-5">
          <p className="mb-4 text-sm font-semibold text-white">Total per Jenis</p>
          {byType.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "#12141C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0A84FF" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-white/30">Belum ada data pada rentang ini.</p>}
        </GlassCard>
      </div>

      <GlassCard className="overflow-x-auto p-5">
        <p className="mb-4 text-sm font-semibold text-white">Rekapitulasi Transaksi</p>
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="text-left text-xs text-white/40">
              <th className="pb-3 font-medium">Tanggal</th>
              <th className="pb-3 font-medium">Jenis</th>
              <th className="pb-3 font-medium">Kategori</th>
              <th className="pb-3 font-medium">Deskripsi</th>
              <th className="pb-3 font-medium">Oleh</th>
              <th className="pb-3 text-right font-medium">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-white/5 text-white/80">
                <td className="py-3">{formatDate(r.date)}</td>
                <td className="py-3">{TYPE_LABEL[r.type] || r.type}</td>
                <td className="py-3">{r.category}</td>
                <td className="py-3">{r.description}</td>
                <td className="py-3">{r.user.fullName}</td>
                <td className="py-3 text-right text-accent-pink">{formatCurrency(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <p className="py-6 text-center text-sm text-white/30">Belum ada data.</p>}
      </GlassCard>

      <GlassCard className="p-5">
        <p className="mb-4 text-sm font-semibold text-white">Slip Gaji Karyawan</p>
        <div className="space-y-2">
          {payslips.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl glass-pill p-3">
              <span className="text-sm text-white/80">{p.user.fullName} · Periode {p.period}</span>
              <span className="text-sm font-medium text-accent-green">{formatCurrency(p.total)}</span>
            </div>
          ))}
          {payslips.length === 0 && <p className="text-sm text-white/30">Belum ada slip gaji.</p>}
        </div>
      </GlassCard>

      <GlassModal open={open} onClose={() => setOpen(false)} title="Catat Transaksi Keuangan">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><GlassLabel>Tanggal</GlassLabel><GlassInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required /></div>
            <div>
              <GlassLabel>Jenis</GlassLabel>
              <GlassSelect value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="OUTFLOW" className="bg-ink-800">Pengeluaran (Outflow)</option>
                <option value="PURCHASE" className="bg-ink-800">Pembelian Barang</option>
                <option value="RECAP" className="bg-ink-800">Rekapitulasi</option>
              </GlassSelect>
            </div>
          </div>
          <div><GlassLabel>Kategori</GlassLabel><GlassInput value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required placeholder="mis. Operasional, ATK, Sewa" /></div>
          <div><GlassLabel>Deskripsi</GlassLabel><GlassTextarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
          <div><GlassLabel>Jumlah (Rp)</GlassLabel><GlassInput type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required /></div>
          <GlassButton type="submit" className="w-full">Simpan</GlassButton>
        </form>
      </GlassModal>
    </div>
  );
}
