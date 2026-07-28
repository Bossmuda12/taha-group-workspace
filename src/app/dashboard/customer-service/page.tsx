"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, MessageCircle, Target, Users, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect, GlassTextarea } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Product = { id: string; name: string };
type Rec = {
  id: string; date: string; incomingChats: number; closingCount: number; leadsCount: number;
  obstacles: string | null; notes: string | null; user: { fullName: string }; product: { name: string } | null;
};

export default function CustomerServicePage() {
  const toast = useToast();
  const [records, setRecords] = useState<Rec[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10), incomingChats: "", closingCount: "", leadsCount: "",
    productId: "", obstacles: "", notes: "",
  });

  async function load() {
    const [r, p] = await Promise.all([
      fetch("/api/cs-records").then((res) => res.json()),
      fetch("/api/products").then((res) => res.json()),
    ]);
    setRecords(r);
    setProducts(p);
  }
  useEffect(() => { load(); }, []);

  const totals = useMemo(() => records.reduce((a, r) => ({
    chats: a.chats + r.incomingChats, closing: a.closing + r.closingCount, leads: a.leads + r.leadsCount,
  }), { chats: 0, closing: 0, leads: 0 }), [records]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cs-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Laporan CS tersimpan");
      setOpen(false);
      load();
    } else toast("Gagal menyimpan laporan", "error");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Customer Service</h1>
          <p className="text-sm text-white/50">Laporan harian layanan pelanggan</p>
        </div>
        <GlassButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Input Laporan</GlassButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Chat Masuk" value={totals.chats} icon={MessageCircle} color="#0A84FF" />
        <StatCard label="Closing" value={totals.closing} icon={Target} color="#30D158" />
        <StatCard label="Leads Masuk" value={totals.leads} icon={Users} color="#BF5AF2" />
        <StatCard label="Rasio Closing" value={`${totals.chats ? ((totals.closing / totals.chats) * 100).toFixed(1) : 0}%`} icon={AlertCircle} color="#FF9F0A" />
      </div>

      <GlassCard className="overflow-x-auto p-5">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-left text-xs text-white/40">
              <th className="pb-3 font-medium">Tanggal</th>
              <th className="pb-3 font-medium">Karyawan</th>
              <th className="pb-3 font-medium">Chat Masuk</th>
              <th className="pb-3 font-medium">Closing</th>
              <th className="pb-3 font-medium">Leads</th>
              <th className="pb-3 font-medium">Produk</th>
              <th className="pb-3 font-medium">Kendala</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-white/5 text-white/80">
                <td className="py-3">{formatDate(r.date)}</td>
                <td className="py-3">{r.user.fullName}</td>
                <td className="py-3">{r.incomingChats}</td>
                <td className="py-3 text-accent-green">{r.closingCount}</td>
                <td className="py-3">{r.leadsCount}</td>
                <td className="py-3">{r.product?.name ?? "-"}</td>
                <td className="py-3 text-white/50">{r.obstacles ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <p className="py-6 text-center text-sm text-white/30">Belum ada data.</p>}
      </GlassCard>

      <GlassModal open={open} onClose={() => setOpen(false)} title="Input Laporan Customer Service">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><GlassLabel>Tanggal</GlassLabel><GlassInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required /></div>
          <div>
            <GlassLabel>Produk</GlassLabel>
            <GlassSelect value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}>
              <option value="" className="bg-ink-800">Pilih produk</option>
              {products.map((p) => <option key={p.id} value={p.id} className="bg-ink-800">{p.name}</option>)}
            </GlassSelect>
          </div>
          <div><GlassLabel>Chat Masuk</GlassLabel><GlassInput type="number" value={form.incomingChats} onChange={(e) => setForm((f) => ({ ...f, incomingChats: e.target.value }))} /></div>
          <div><GlassLabel>Closing</GlassLabel><GlassInput type="number" value={form.closingCount} onChange={(e) => setForm((f) => ({ ...f, closingCount: e.target.value }))} /></div>
          <div><GlassLabel>Leads Masuk</GlassLabel><GlassInput type="number" value={form.leadsCount} onChange={(e) => setForm((f) => ({ ...f, leadsCount: e.target.value }))} /></div>
          <div className="sm:col-span-2"><GlassLabel>Kendala</GlassLabel><GlassTextarea value={form.obstacles} onChange={(e) => setForm((f) => ({ ...f, obstacles: e.target.value }))} /></div>
          <div className="sm:col-span-2"><GlassLabel>Catatan</GlassLabel><GlassTextarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
          <div className="sm:col-span-2"><GlassButton type="submit" className="w-full">Simpan</GlassButton></div>
        </form>
      </GlassModal>
    </div>
  );
}
