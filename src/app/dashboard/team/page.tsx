"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2, ChevronDown, MapPin, Phone, Mail, Plus, Check, Ban, Trash2, Crown, UserCheck,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassTextarea } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { Badge } from "@/components/ui/Badge";
import { initials } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Division = { id: string; name: string; description: string | null; color: string; _count: { users: number; tasks: number } };
type Member = {
  id: string; username: string; fullName: string; address: string; whatsapp: string;
  email: string; position: string; role: string; status: string; avatarColor: string; divisionId: string | null;
};

export default function TeamPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [openDivision, setOpenDivision] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [newDivision, setNewDivision] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [d, m] = await Promise.all([
      fetch("/api/divisions").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    setDivisions(d);
    setMembers(m);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchParams?.get("pending") === "1") setPendingOpen(true);
  }, [searchParams]);

  async function addDivision(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/divisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDivision),
    });
    if (res.ok) {
      toast("Divisi berhasil ditambahkan");
      setAddOpen(false);
      setNewDivision({ name: "", description: "" });
      load();
    } else {
      const d = await res.json();
      toast(d.error || "Gagal menambah divisi", "error");
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast(status === "ACTIVE" ? "Karyawan diaktifkan" : "Karyawan dinonaktifkan");
      load();
    } else toast("Gagal memperbarui status", "error");
  }

  async function removeMember(id: string) {
    if (!confirm("Hapus karyawan ini?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Karyawan dihapus");
      load();
    }
  }

  const unassigned = members.filter((m) => !m.divisionId);
  const pendingMembers = members.filter((m) => m.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Team Management</h1>
          <p className="text-sm text-white/50">Kelola divisi dan data karyawan Taha Group</p>
        </div>
        <GlassButton onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Tambah Divisi
        </GlassButton>
      </div>

      {pendingMembers.length > 0 && (
        <button
          onClick={() => setPendingOpen(true)}
          className="block w-full text-left"
        >
          <GlassCard className="border border-accent-orange/30 p-4 transition hover:bg-white/5">
            <p className="flex items-center gap-2 text-sm text-accent-orange">
              <UserCheck className="h-4 w-4" />
              {pendingMembers.length} karyawan menunggu aktivasi akun. Klik untuk review.
            </p>
          </GlassCard>
        </button>
      )}

      <div className="space-y-4">
        {divisions.map((div) => {
          const divMembers = members.filter((m) => m.divisionId === div.id);
          const open = openDivision === div.id;
          return (
            <GlassCard key={div.id} className="overflow-hidden">
              <button
                className="flex w-full items-center justify-between p-5"
                onClick={() => setOpenDivision(open ? null : div.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: `${div.color}22`, color: div.color }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{div.name}</p>
                    <p className="text-xs text-white/40">{divMembers.length} anggota · {div._count.tasks} tugas</p>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <div className="space-y-3 border-t border-white/10 p-5">
                  {divMembers.length === 0 && <p className="text-sm text-white/40">Belum ada anggota di divisi ini.</p>}
                  {divMembers.map((m) => (
                    <div key={m.id} className="flex flex-col gap-3 rounded-2xl glass-pill p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ background: m.avatarColor }}
                        >
                          {initials(m.fullName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{m.fullName}</p>
                            {m.role === "DIVISION_HEAD" && <Crown className="h-3.5 w-3.5 text-accent-orange" />}
                            <Badge value={m.status} />
                          </div>
                          <p className="text-xs text-white/40">{m.position} · @{m.username}</p>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {m.whatsapp}</span>
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {m.email}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                        {m.status !== "ACTIVE" && (
                          <button onClick={() => updateStatus(m.id, "ACTIVE")} className="rounded-full bg-accent-green/20 p-2 text-accent-green hover:bg-accent-green/30">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {m.status === "ACTIVE" && (
                          <button onClick={() => updateStatus(m.id, "SUSPENDED")} className="rounded-full bg-accent-orange/20 p-2 text-accent-orange hover:bg-accent-orange/30">
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => removeMember(m.id)} className="rounded-full bg-accent-pink/20 p-2 text-accent-pink hover:bg-accent-pink/30">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          );
        })}

        {unassigned.length > 0 && (
          <GlassCard className="p-5">
            <p className="mb-3 text-sm font-medium text-white/70">Belum Ditempatkan ({unassigned.length})</p>
            <div className="space-y-2">
              {unassigned.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-2xl glass-pill p-3">
                  <span className="text-sm text-white/80">{m.fullName} · {m.position}</span>
                  <Badge value={m.status} />
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      <GlassModal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Divisi Baru">
        <form onSubmit={addDivision} className="space-y-4">
          <div>
            <GlassLabel>Nama Divisi</GlassLabel>
            <GlassInput value={newDivision.name} onChange={(e) => setNewDivision((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <GlassLabel>Deskripsi (opsional)</GlassLabel>
            <GlassTextarea value={newDivision.description} onChange={(e) => setNewDivision((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <GlassButton type="submit" className="w-full">Simpan Divisi</GlassButton>
        </form>
      </GlassModal>

      <GlassModal open={pendingOpen} onClose={() => setPendingOpen(false)} title="Karyawan Menunggu Aktivasi" maxWidth="max-w-xl">
        <div className="space-y-3">
          {pendingMembers.length === 0 && <p className="text-sm text-white/40">Tidak ada karyawan yang menunggu aktivasi.</p>}
          {pendingMembers.map((m) => (
            <div key={m.id} className="flex flex-col gap-3 rounded-2xl glass-pill p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: m.avatarColor }}
                >
                  {initials(m.fullName)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{m.fullName}</p>
                  <p className="text-xs text-white/40">{m.position} · @{m.username}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {m.whatsapp}</span>
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {m.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                <GlassButton
                  variant="secondary"
                  className="!px-4 !py-2 !text-xs"
                  onClick={async () => {
                    await updateStatus(m.id, "ACTIVE");
                  }}
                >
                  <Check className="h-3.5 w-3.5" /> Aktifkan
                </GlassButton>
                <button
                  onClick={() => removeMember(m.id)}
                  className="rounded-full bg-accent-pink/20 p-2 text-accent-pink hover:bg-accent-pink/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassModal>
    </div>
  );
}
