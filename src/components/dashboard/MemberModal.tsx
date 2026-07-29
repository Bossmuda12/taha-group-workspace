"use client";
import { useEffect, useState } from "react";
import { KeyRound, Save } from "lucide-react";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/Badge";
import { initials } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Division = { id: string; name: string };
type Member = {
  id: string; username: string; fullName: string; address: string; whatsapp: string;
  email: string; position: string; role: string; status: string; avatarColor: string; divisionId: string | null;
  secondDivisionId?: string | null;
};

export function MemberModal({
  member,
  divisions,
  onClose,
  onUpdated,
}: {
  member: Member | null;
  divisions: Division[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ fullName: "", whatsapp: "", address: "", position: "", divisionId: "", secondDivisionId: "" });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setForm({
        fullName: member.fullName,
        whatsapp: member.whatsapp,
        address: member.address,
        position: member.position,
        divisionId: member.divisionId || "",
        secondDivisionId: member.secondDivisionId || "",
      });
      setPw("");
    }
  }, [member]);

  if (!member) return null;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (form.secondDivisionId && form.secondDivisionId === form.divisionId) {
      setSaving(false);
      toast("Divisi kedua tidak boleh sama dengan divisi utama", "error");
      return;
    }
    const res = await fetch(`/api/users/${member!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, divisionId: form.divisionId || null, secondDivisionId: form.secondDivisionId || null }),
    });
    setSaving(false);
    if (res.ok) {
      toast("Data karyawan berhasil diperbarui");
      onUpdated();
    } else toast("Gagal memperbarui data", "error");
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) {
      toast("Kata sandi baru minimal 6 karakter", "error");
      return;
    }
    setPwSaving(true);
    const res = await fetch(`/api/users/${member!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: pw }),
    });
    setPwSaving(false);
    if (res.ok) {
      toast("Kata sandi karyawan berhasil direset");
      setPw("");
    } else toast("Gagal mereset kata sandi", "error");
  }

  return (
    <GlassModal open={!!member} onClose={onClose} title="Profil Karyawan" maxWidth="max-w-lg">
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ background: member.avatarColor }}
        >
          {initials(member.fullName)}
        </div>
        <div>
          <p className="font-semibold text-white">{member.fullName}</p>
          <p className="text-xs text-white/40">@{member.username} · {member.email}</p>
          <div className="mt-1"><Badge value={member.status} /></div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <GlassLabel>Nama Lengkap</GlassLabel>
            <GlassInput value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
          </div>
          <div>
            <GlassLabel>Jabatan</GlassLabel>
            <GlassInput value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} required />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <GlassLabel>Nomor WhatsApp</GlassLabel>
            <GlassInput value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} required />
          </div>
          <div>
            <GlassLabel>Alamat</GlassLabel>
            <GlassInput value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <GlassLabel>Divisi Utama</GlassLabel>
            <GlassSelect value={form.divisionId} onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value }))}>
              <option value="" className="bg-ink-800">Belum ditempatkan</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id} className="bg-ink-800">{d.name}</option>
              ))}
            </GlassSelect>
          </div>
          <div>
            <GlassLabel>Divisi Kedua (opsional)</GlassLabel>
            <GlassSelect value={form.secondDivisionId} onChange={(e) => setForm((f) => ({ ...f, secondDivisionId: e.target.value }))}>
              <option value="" className="bg-ink-800">Tidak ada</option>
              {divisions.filter((d) => d.id !== form.divisionId).map((d) => (
                <option key={d.id} value={d.id} className="bg-ink-800">{d.name}</option>
              ))}
            </GlassSelect>
          </div>
        </div>
        <p className="-mt-2 text-xs text-white/30">Karyawan dengan divisi kedua mendapat akses dashboard penuh ke kedua divisi.</p>
        <GlassButton type="submit" loading={saving}>
          <Save className="h-4 w-4" /> Simpan Perubahan
        </GlassButton>
      </form>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <KeyRound className="h-4 w-4 text-accent" /> Reset Kata Sandi
        </p>
        <form onSubmit={resetPassword} className="flex flex-col gap-3 sm:flex-row">
          <GlassInput
            type="text"
            placeholder="Kata sandi baru (min. 6 karakter)"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="sm:flex-1"
          />
          <GlassButton type="submit" loading={pwSaving} variant="secondary">
            Set Kata Sandi
          </GlassButton>
        </form>
        <p className="mt-2 text-xs text-white/30">
          Karyawan tidak perlu tahu kata sandi lama untuk ini — hanya Founder/Admin yang bisa mereset langsung.
        </p>
      </div>
    </GlassModal>
  );
}
