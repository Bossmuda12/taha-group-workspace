"use client";
import { useEffect, useState } from "react";
import { Package, Plus, Trash2, Tag } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Product = { id: string; name: string; sku: string | null; price: number; isCustom: boolean; division: { name: string; color: string } | null };
type Division = { id: string; name: string };

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", price: "", divisionId: "" });

  async function load() {
    const [p, d] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/divisions").then((r) => r.json()),
    ]);
    setProducts(p);
    setDivisions(d);
  }
  useEffect(() => { load(); }, []);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Produk ditambahkan");
      setOpen(false);
      setForm({ name: "", sku: "", price: "", divisionId: "" });
      load();
    } else toast("Gagal menambah produk", "error");
  }

  async function removeProduct(id: string) {
    if (!confirm("Hapus produk ini?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Produk</h1>
          <p className="text-sm text-white/50">Daftar produk untuk laporan Advertising & Customer Service</p>
        </div>
        <GlassButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Tambah Produk</GlassButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <GlassCard key={p.id} className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20 text-accent">
                <Package className="h-5 w-5" />
              </div>
              <button onClick={() => removeProduct(p.id)} className="text-white/30 hover:text-accent-pink">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="font-medium text-white">{p.name}</p>
            {p.sku && <p className="text-xs text-white/40">SKU: {p.sku}</p>}
            <p className="mt-1 text-sm text-accent-green">{formatCurrency(p.price)}</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-white/40">
              <Tag className="h-3 w-3" /> {p.division?.name ?? "Umum"} {p.isCustom && "· Custom"}
            </div>
          </GlassCard>
        ))}
        {products.length === 0 && <p className="text-sm text-white/30">Belum ada produk.</p>}
      </div>

      <GlassModal open={open} onClose={() => setOpen(false)} title="Tambah Produk">
        <form onSubmit={addProduct} className="space-y-4">
          <div>
            <GlassLabel>Nama Produk</GlassLabel>
            <GlassInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <GlassLabel>SKU (opsional)</GlassLabel>
            <GlassInput value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
          </div>
          <div>
            <GlassLabel>Harga</GlassLabel>
            <GlassInput type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          </div>
          <div>
            <GlassLabel>Divisi (opsional)</GlassLabel>
            <GlassSelect value={form.divisionId} onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value }))}>
              <option value="" className="bg-ink-800">Umum</option>
              {divisions.map((d) => <option key={d.id} value={d.id} className="bg-ink-800">{d.name}</option>)}
            </GlassSelect>
          </div>
          <GlassButton type="submit" className="w-full">Simpan Produk</GlassButton>
        </form>
      </GlassModal>
    </div>
  );
}
