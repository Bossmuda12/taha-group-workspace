"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Download, TrendingUp, Users, Target, Wallet2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect, GlassTextarea } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Product = { id: string; name: string };
type Rec = {
  id: string; date: string; teamName: string; closingCount: number; leadsCount: number;
  adAccount: string; facebookName: string; spendBudget: number; notes: string | null;
  user: { fullName: string }; product: { name: string } | null;
};

export default function AdvertisingPage() {
  const toast = useToast();
  const [records, setRecords] = useState<Rec[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10), teamName: "", closingCount: "", leadsCount: "",
    adAccount: "", facebookName: "", spendBudget: "", productId: "", notes: "",
  });

  async function load() {
    const [r, p] = await Promise.all([
      fetch("/api/advertising").then((res) => res.json()),
      fetch("/api/products").then((res) => res.json()),
    ]);
    setRecords(r);
    setProducts(p);
  }
  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, r) => ({
        closing: acc.closing + r.closingCount,
        leads: acc.leads + r.leadsCount,
        spend: acc.spend + r.spendBudget,
      }),
      { closing: 0, leads: 0, spend: 0 }
    );
  }, [records]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/advertising", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Daily record tersimpan");
      setOpen(false);
      load();
    } else toast("Gagal menyimpan record", "error");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Advertising Daily Record</h1>
          <p className="text-sm text-white/50">Rekap performa iklan harian tim Advertising</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/advertising">
            <GlassButton variant="secondary"><Download className="h-4 w-4" /> Unduh Laporan</GlassButton>
          </a>
          <GlassButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Input Harian</GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Closing" value={totals.closing} icon={Target} color="#30D158" />
        <StatCard label="Leads Masuk" value={totals.leads} icon={Users} color="#0A84FF" />
        <StatCard label="Total Spend" value={formatCurrency(totals.spend)} icon={Wallet2} color="#FF9F0A" />
        <StatCard label="Conversion" value={`${totals.leads ? ((totals.closing / totals.leads) * 100).toFixed(1) : 0}%`} icon={TrendingUp} color="#BF5AF2" />
      </div>

      <GlassCard className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="text-left text-xs text-white/40">
                <th className="pb-3 font-medium">Tanggal</th>
                <th className="pb-3 font-medium">Tim</th>
                <th className="pb-3 font-medium">Closing</th>
                <th className="pb-3 font-medium">Leads</th>
                <th className="pb-3 font-medium">Akun Iklan</th>
                <th className="pb-3 font-medium">Nama FB</th>
                <th className="pb-3 font-medium">Spend</th>
                <th className="pb-3 font-medium">Produk</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-white/5 text-white/80">
                  <td className="py-3">{formatDate(r.date)}</td>
                  <td className="py-3">{r.teamName}</td>
                  <td className="py-3 text-accent-green">{r.closingCount}</td>
                  <td className="py-3">{r.leadsCount}</td>
                  <td className="py-3">{r.adAccount}</td>
                  <td className="py-3">{r.facebookName}</td>
                  <td className="py-3">{formatCurrency(r.spendBudget)}</td>
                  <td className="py-3">{r.product?.name ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length === 0 && <p className="py-6 text-center text-sm text-white/30">Belum ada data.</p>}
      </GlassCard>

      <GlassModal open={open} onClose={() => setOpen(false)} title="Input Daily Record" maxWidth="max-w-xl">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><GlassLabel>Tanggal</GlassLabel><GlassInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required /></div>
          <div><GlassLabel>Nama Tim</GlassLabel><GlassInput value={form.teamName} onChange={(e) => setForm((f) => ({ ...f, teamName: e.target.value }))} required /></div>
          <div><GlassLabel>Closing</GlassLabel><GlassInput type="number" value={form.closingCount} onChange={(e) => setForm((f) => ({ ...f, closingCount: e.target.value }))} /></div>
          <div><GlassLabel>Leads Masuk</GlassLabel><GlassInput type="number" value={form.leadsCount} onChange={(e) => setForm((f) => ({ ...f, leadsCount: e.target.value }))} /></div>
          <div><GlassLabel>Akun Iklan</GlassLabel><GlassInput value={form.adAccount} onChange={(e) => setForm((f) => ({ ...f, adAccount: e.target.value }))} required /></div>
          <div><GlassLabel>Nama Facebook</GlassLabel><GlassInput value={form.facebookName} onChange={(e) => setForm((f) => ({ ...f, facebookName: e.target.value }))} required /></div>
          <div><GlassLabel>Total Spend Budget</GlassLabel><GlassInput type="number" value={form.spendBudget} onChange={(e) => setForm((f) => ({ ...f, spendBudget: e.target.value }))} /></div>
          <div>
            <GlassLabel>Produk</GlassLabel>
            <GlassSelect value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}>
              <option value="" className="bg-ink-800">Pilih produk</option>
              {products.map((p) => <option key={p.id} value={p.id} className="bg-ink-800">{p.name}</option>)}
            </GlassSelect>
          </div>
          <div className="sm:col-span-2"><GlassLabel>Catatan</GlassLabel><GlassTextarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
          <div className="sm:col-span-2"><GlassButton type="submit" className="w-full">Simpan</GlassButton></div>
        </form>
      </GlassModal>
    </div>
  );
}
