"use client";
import { useEffect, useState } from "react";
import { Camera, KeyRound, Save, User2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel } from "@/components/ui/GlassInput";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";

type Me = {
  id: string; fullName: string; username: string; email: string; whatsapp: string;
  address: string; position: string; avatarColor: string; avatarUrl: string | null;
  division: { name: string } | null;
};

export default function ProfilePage() {
  const toast = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({ fullName: "", whatsapp: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  async function load() {
    const data = await fetch("/api/me").then((r) => r.json());
    setMe(data);
    setForm({ fullName: data.fullName, whatsapp: data.whatsapp, address: data.address });
  }
  useEffect(() => {
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Profil berhasil diperbarui");
      load();
    } else toast("Gagal memperbarui profil", "error");
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", f);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      setUploadingAvatar(false);
      toast("Gagal mengunggah foto", "error");
      return;
    }
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: uploadData.url }),
    });
    setUploadingAvatar(false);
    if (res.ok) {
      toast("Foto profil berhasil diubah");
      load();
    } else toast("Gagal menyimpan foto profil", "error");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast("Konfirmasi kata sandi baru tidak cocok", "error");
      return;
    }
    setPwSaving(true);
    const res = await fetch("/api/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    setPwSaving(false);
    if (res.ok) {
      toast("Kata sandi berhasil diubah");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else toast(data.error || "Gagal mengubah kata sandi", "error");
  }

  if (!me) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Profil Saya</h1>
        <p className="text-sm text-white/50">Kelola data diri, foto profil, dan kata sandi Anda</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="flex flex-col items-center p-6 text-center">
          <div className="relative mb-4">
            <Avatar avatarUrl={me.avatarUrl} fullName={me.fullName} avatarColor={me.avatarColor} className="h-24 w-24" textClassName="text-2xl" />
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full glass-strong text-white/80 hover:text-white">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploadingAvatar} />
            </label>
          </div>
          <p className="font-semibold text-white">{me.fullName}</p>
          <p className="text-xs text-white/40">{me.position} · {me.division?.name ?? "Belum ada divisi"}</p>
          <p className="mt-1 text-xs text-white/30">@{me.username}</p>
          {uploadingAvatar && <p className="mt-2 text-xs text-accent">Mengunggah foto...</p>}
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <User2 className="h-4 w-4 text-accent" /> Data Diri
          </p>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <GlassLabel>Nama Lengkap</GlassLabel>
              <GlassInput value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <GlassLabel>Nomor WhatsApp</GlassLabel>
                <GlassInput value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} required />
              </div>
              <div>
                <GlassLabel>Email</GlassLabel>
                <GlassInput value={me.email} disabled className="opacity-50" />
              </div>
            </div>
            <div>
              <GlassLabel>Alamat</GlassLabel>
              <GlassInput value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
            </div>
            <GlassButton type="submit" loading={saving}>
              <Save className="h-4 w-4" /> Simpan Perubahan
            </GlassButton>
          </form>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <KeyRound className="h-4 w-4 text-accent" /> Ubah Kata Sandi
        </p>
        <form onSubmit={changePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <GlassLabel>Kata Sandi Lama</GlassLabel>
            <GlassInput
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <GlassLabel>Kata Sandi Baru</GlassLabel>
            <GlassInput
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <div>
            <GlassLabel>Konfirmasi Kata Sandi Baru</GlassLabel>
            <GlassInput
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <div className="sm:col-span-3">
            <GlassButton type="submit" loading={pwSaving}>
              <KeyRound className="h-4 w-4" /> Ubah Kata Sandi
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
