"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, UserPlus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect, GlassTextarea } from "@/components/ui/GlassInput";

type Division = { id: string; name: string };

export default function RegisterPage() {
  const router = useRouter();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    address: "",
    whatsapp: "",
    position: "",
    password: "",
    email: "",
    divisionId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/divisions")
      .then((r) => r.json())
      .then(setDivisions)
      .catch(() => {});
  }, []);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Gagal mendaftar");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <GlassCard strong className="w-full max-w-md animate-scale-in rounded-5xl p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/20">
            <CheckCircle2 className="h-8 w-8 text-accent-green" />
          </div>
          <h2 className="text-xl font-semibold text-white">Pendaftaran Berhasil</h2>
          <p className="mt-2 text-sm text-white/60">
            Akun Anda menunggu aktivasi dari Admin Utama. Anda akan dialihkan ke halaman masuk...
          </p>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 py-10">
      <GlassCard strong className="w-full max-w-2xl animate-scale-in rounded-5xl p-8 sm:p-10">
        <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Masuk
        </Link>

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl glass-strong shadow-glow">
            <UserPlus className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Formulir Pendaftaran</h1>
          <p className="mt-1 text-sm text-white/50">Isi data lengkap untuk bergabung dengan Taha Group</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <GlassLabel>Username</GlassLabel>
            <GlassInput value={form.username} onChange={(e) => update("username", e.target.value)} required />
          </div>
          <div>
            <GlassLabel>Nama Lengkap</GlassLabel>
            <GlassInput value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <GlassLabel>Alamat Lengkap</GlassLabel>
            <GlassTextarea rows={2} value={form.address} onChange={(e) => update("address", e.target.value)} required />
          </div>
          <div>
            <GlassLabel>Nomor WhatsApp</GlassLabel>
            <GlassInput
              placeholder="08xxxxxxxxxx"
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              required
            />
          </div>
          <div>
            <GlassLabel>Gmail</GlassLabel>
            <GlassInput type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div>
            <GlassLabel>Jabatan</GlassLabel>
            <GlassInput value={form.position} onChange={(e) => update("position", e.target.value)} required />
          </div>
          <div>
            <GlassLabel>Divisi</GlassLabel>
            <GlassSelect value={form.divisionId} onChange={(e) => update("divisionId", e.target.value)}>
              <option value="" className="bg-ink-800">Belum ditentukan (dipilih Admin)</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id} className="bg-ink-800">
                  {d.name}
                </option>
              ))}
            </GlassSelect>
          </div>
          <div className="sm:col-span-2">
            <GlassLabel>Kata Sandi</GlassLabel>
            <GlassInput type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />
          </div>

          {error && (
            <div className="sm:col-span-2 rounded-2xl bg-accent-pink/15 px-4 py-2.5 text-sm text-accent-pink">
              {error}
            </div>
          )}

          <div className="sm:col-span-2">
            <GlassButton type="submit" loading={loading} className="w-full py-3">
              Daftar Sekarang
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </main>
  );
}
