"use client";
import { useEffect, useState } from "react";
import { Plus, Check, X as XIcon, Handshake } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect, GlassTextarea } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Division = { id: string; name: string; color: string };
type CoordinationRequest = {
  id: string;
  title: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  decisionNote: string | null;
  fromUser: { fullName: string };
  fromDivision: Division;
  toDivision: Division;
  decidedBy: { fullName: string } | null;
};

export default function CoordinationPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<CoordinationRequest[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isFounder, setIsFounder] = useState(false);
  const [myDivisionId, setMyDivisionId] = useState<string | null>(null);
  const [mySecondDivisionId, setMySecondDivisionId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", toDivisionId: "" });
  const [decideOpen, setDecideOpen] = useState<{ id: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    const [r, d, me] = await Promise.all([
      fetch("/api/coordination").then((res) => res.json()),
      fetch("/api/divisions").then((res) => res.json()),
      fetch("/api/me").then((res) => res.json()),
    ]);
    setRequests(r);
    setDivisions(d);
    setIsFounder(me?.role === "SUPERADMIN");
    setMyDivisionId(me?.divisionId ?? null);
    setMySecondDivisionId(me?.secondDivisionId ?? null);
  }
  useEffect(() => {
    load();
  }, []);

  const targetDivisions = divisions.filter((d) => d.id !== myDivisionId && d.id !== mySecondDivisionId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/coordination", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Pengajuan terkirim, menunggu persetujuan Founder");
      setOpen(false);
      setForm({ title: "", description: "", toDivisionId: "" });
      load();
    } else {
      const d = await res.json();
      toast(d.error || "Gagal mengirim pengajuan", "error");
    }
  }

  async function decide() {
    if (!decideOpen) return;
    const res = await fetch(`/api/coordination/${decideOpen.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: decideOpen.action, note }),
    });
    if (res.ok) {
      toast(decideOpen.action === "APPROVED" ? "Pengajuan disetujui" : "Pengajuan ditolak");
      setDecideOpen(null);
      setNote("");
      load();
    } else {
      const d = await res.json();
      toast(d.error || "Gagal memproses", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Koordinasi Antar Divisi</h1>
          <p className="text-sm text-white/50">
            {isFounder ? "Tinjau & putuskan pengajuan kerja sama antar divisi" : "Ajukan koordinasi ke divisi lain, wajib disetujui Founder"}
          </p>
        </div>
        {myDivisionId && (
          <GlassButton onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Ajukan Koordinasi
          </GlassButton>
        )}
      </div>

      <div className="space-y-4">
        {requests.map((r) => (
          <GlassCard key={r.id} className="p-5">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{r.title}</p>
                <p className="text-xs text-white/40">
                  {r.fromUser.fullName} · {formatDate(r.createdAt)}
                </p>
              </div>
              <Badge value={r.status} />
            </div>
            <p className="mb-3 text-sm text-white/70">{r.description}</p>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full px-2 py-0.5" style={{ background: `${r.fromDivision.color}22`, color: r.fromDivision.color }}>
                {r.fromDivision.name}
              </span>
              <Handshake className="h-3.5 w-3.5 text-white/30" />
              <span className="rounded-full px-2 py-0.5" style={{ background: `${r.toDivision.color}22`, color: r.toDivision.color }}>
                {r.toDivision.name}
              </span>
            </div>
            {r.status !== "PENDING" && (
              <p className="text-xs text-white/40">
                Diputuskan oleh {r.decidedBy?.fullName ?? "-"}
                {r.decisionNote ? `: "${r.decisionNote}"` : ""}
              </p>
            )}
            {isFounder && r.status === "PENDING" && (
              <div className="mt-3 flex items-center gap-2">
                <GlassButton type="button" onClick={() => setDecideOpen({ id: r.id, action: "APPROVED" })}>
                  <Check className="h-4 w-4" /> Setujui
                </GlassButton>
                <GlassButton type="button" variant="danger" onClick={() => setDecideOpen({ id: r.id, action: "REJECTED" })}>
                  <XIcon className="h-4 w-4" /> Tolak
                </GlassButton>
              </div>
            )}
          </GlassCard>
        ))}
        {requests.length === 0 && (
          <GlassCard className="p-8 text-center text-sm text-white/30">Belum ada pengajuan koordinasi.</GlassCard>
        )}
      </div>

      <GlassModal open={open} onClose={() => setOpen(false)} title="Ajukan Koordinasi Antar Divisi">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <GlassLabel>Judul</GlassLabel>
            <GlassInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="mis. Bantuan desain konten Ramadan" />
          </div>
          <div>
            <GlassLabel>Divisi Tujuan</GlassLabel>
            <GlassSelect value={form.toDivisionId} onChange={(e) => setForm((f) => ({ ...f, toDivisionId: e.target.value }))} required>
              <option value="" className="bg-ink-800">Pilih divisi</option>
              {targetDivisions.map((d) => (
                <option key={d.id} value={d.id} className="bg-ink-800">{d.name}</option>
              ))}
            </GlassSelect>
          </div>
          <div>
            <GlassLabel>Deskripsi / Alasan</GlassLabel>
            <GlassTextarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          </div>
          <GlassButton type="submit" className="w-full" loading={saving}>Kirim Pengajuan ke Founder</GlassButton>
        </form>
      </GlassModal>

      <GlassModal
        open={!!decideOpen}
        onClose={() => {
          setDecideOpen(null);
          setNote("");
        }}
        title={decideOpen?.action === "APPROVED" ? "Setujui Pengajuan" : "Tolak Pengajuan"}
      >
        <div className="space-y-4">
          <div>
            <GlassLabel>Catatan (opsional)</GlassLabel>
            <GlassTextarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan untuk pemohon" />
          </div>
          <GlassButton type="button" className="w-full" onClick={decide}>
            Konfirmasi {decideOpen?.action === "APPROVED" ? "Persetujuan" : "Penolakan"}
          </GlassButton>
        </div>
      </GlassModal>
    </div>
  );
}
