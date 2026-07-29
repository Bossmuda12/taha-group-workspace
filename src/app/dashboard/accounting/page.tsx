"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Wallet2, ShoppingCart, FileBarChart, Banknote, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect, GlassTextarea } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Rec = { id: string; date: string; type: string; category: string; description: string; amount: number; user: { fullName: string } };
type Payslip = {
  id: string; period: string; baseSalary: number; bonus: number; deduction: number; total: number; createdAt: string;
  user: { fullName: string };
};
type Employee = { id: string; fullName: string; position: string; divisionName: string };

const COLORS = ["#0A84FF", "#BF5AF2", "#FF375F", "#63E6E2", "#FF9F0A", "#30D158"];
const TYPE_LABEL: Record<string, string> = { OUTFLOW: "Pengeluaran", PURCHASE: "Pembelian Barang", RECAP: "Rekapitulasi" };

export default function AccountingPage() {
  const toast = useToast();
  const [records, setRecords] = useState<Rec[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [canManagePayslip, setCanManagePayslip] = useState(false);
  const [range, setRange] = useState({ start: "", end: "" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "OUTFLOW", category: "", description: "", amount: "" });

  const [payslipOpen, setPayslipOpen] = useState(false);
  const [payslipSaving, setPayslipSaving] = useState(false);
  const [payslipForm, setPayslipForm] = useState({
    userId: "", period: new Date().toISOString().slice(0, 7), baseSalary: "", bonus: "", deduction: "",
  });

  async function load() {
    const qs = new URLSearchParams();
    if (range.start) qs.set("start", range.start);
    if (range.end) qs.set("end", range.end);
    const [r, p, empRes] = await Promise.all([
      fetch(`/api/accounting?${qs}`).then((res) => res.json()),
      fetch("/api/payslips").then((res) => res.json()),
      fetch("/api/payslips/employees"),
    ]);
    setRecords(r);
    setPayslips(p);
    if (empRes.ok) {
      setCanManagePayslip(true);
      setEmployees(await empRes.json());
    } else {
      setCanManagePayslip(false);
    }
  }
  useEffect(() => { load(); }, [range.start, range.end]);

  const payslipTotal = useMemo(() => {
    const base = Number(payslipForm.baseSalary) || 0;
    const bonus = Number(payslipForm.bonus) || 0;
    const deduction = Number(payslipForm.deduction) || 0;
    return base + bonus - deduction;
  }, [payslipForm.baseSalary, payslipForm.bonus, payslipForm.deduction]);

  async function submitPayslip(e: React.FormEvent) {
    e.preventDefault();
    setPayslipSaving(true);
    const res = await fetch("/api/payslips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payslipForm),
    });
    setPayslipSaving(false);
    if (res.ok) {
      toast("Slip gaji berhasil diterbitkan & notifikasi terkirim");
      setPayslipOpen(false);
      setPayslipForm({ userId: "", period: new Date().toISOString().slice(0, 7), baseSalary: "", bonus: "", deduction: "" });
      load();
    } else {
      const d = await res.json();
      toast(d.error || "Gagal menerbitkan slip gaji", "error");
    }
  }

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

      <GlassCard className="overflow-x-auto p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Slip Gaji Karyawan</p>
          {canManagePayslip && (
            <div className="flex items-center gap-2">
              <GlassButton variant="secondary" type="button" onClick={() => window.open("/api/export/payslips", "_blank")}>
                <Download className="h-4 w-4" /> Export Excel
              </GlassButton>
              <GlassButton onClick={() => setPayslipOpen(true)}>
                <Banknote className="h-4 w-4" /> Buat Slip Gaji
              </GlassButton>
            </div>
          )}
        </div>
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-xs text-white/40">
              <th className="pb-3 font-medium">Karyawan</th>
              <th className="pb-3 font-medium">Periode</th>
              <th className="pb-3 text-right font-medium">Gaji Pokok</th>
              <th className="pb-3 text-right font-medium">Bonus</th>
              <th className="pb-3 text-right font-medium">Potongan</th>
              <th className="pb-3 text-right font-medium">Total</th>
              <th className="pb-3 font-medium">Diterbitkan</th>
            </tr>
          </thead>
          <tbody>
            {payslips.map((p) => (
              <tr key={p.id} className="border-t border-white/5 text-white/80">
                <td className="py-3">{p.user.fullName}</td>
                <td className="py-3">{p.period}</td>
                <td className="py-3 text-right">{formatCurrency(p.baseSalary)}</td>
                <td className="py-3 text-right text-accent-green">{formatCurrency(p.bonus)}</td>
                <td className="py-3 text-right text-accent-pink">{formatCurrency(p.deduction)}</td>
                <td className="py-3 text-right font-medium text-white">{formatCurrency(p.total)}</td>
                <td className="py-3 text-white/50">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payslips.length === 0 && <p className="py-6 text-center text-sm text-white/30">Belum ada slip gaji.</p>}
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

      <GlassModal open={payslipOpen} onClose={() => setPayslipOpen(false)} title="Terbitkan Slip Gaji">
        <form onSubmit={submitPayslip} className="space-y-4">
          <div>
            <GlassLabel>Karyawan</GlassLabel>
            <GlassSelect value={payslipForm.userId} onChange={(e) => setPayslipForm((f) => ({ ...f, userId: e.target.value }))} required>
              <option value="" className="bg-ink-800">Pilih karyawan</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id} className="bg-ink-800">{e.fullName} · {e.position} ({e.divisionName})</option>
              ))}
            </GlassSelect>
          </div>
          <div>
            <GlassLabel>Periode</GlassLabel>
            <GlassInput type="month" value={payslipForm.period} onChange={(e) => setPayslipForm((f) => ({ ...f, period: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <GlassLabel>Gaji Pokok (Rp)</GlassLabel>
              <GlassInput type="number" value={payslipForm.baseSalary} onChange={(e) => setPayslipForm((f) => ({ ...f, baseSalary: e.target.value }))} required />
            </div>
            <div>
              <GlassLabel>Bonus (Rp)</GlassLabel>
              <GlassInput type="number" value={payslipForm.bonus} onChange={(e) => setPayslipForm((f) => ({ ...f, bonus: e.target.value }))} />
            </div>
            <div>
              <GlassLabel>Potongan (Rp)</GlassLabel>
              <GlassInput type="number" value={payslipForm.deduction} onChange={(e) => setPayslipForm((f) => ({ ...f, deduction: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl glass-pill px-4 py-3">
            <span className="text-sm text-white/60">Total Diterima</span>
            <span className="text-sm font-semibold text-accent-green">{formatCurrency(payslipTotal)}</span>
          </div>
          <GlassButton type="submit" className="w-full" loading={payslipSaving}>Terbitkan Slip Gaji</GlassButton>
        </form>
      </GlassModal>
    </div>
  );
}
