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

  // Tahap verifikasi kode email (muncul setelah form pendaftaran berhasil dikirim)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [fallbackCode, setFallbackCode] = useState("");
  const [code, setCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

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
    setPendingUserId(data.userId);
    setPendingEmail(data.email || form.email);
    setEmailWarning(data.emailWarning || "");
    setFallbackCode(data.verificationCode || "");
    if (data.verificationCode) setCode(data.verificationCode);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingUserId) return;
    setVerifyError("");
    setVerifyLoading(true);
    const res = await fetch("/api/auth/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: pendingUserId, code }),
    });
    const data = await res.json();
    setVerifyLoading(false);
    if (!res.ok) {
      setVerifyError(data.error || "Kode verifikasi salah");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  async function handleResend() {
    if (!pendingUserId) return;
    setResendMsg("");
    setVerifyError("");
    setResendLoading(true);
    const res = await fetch("/api/auth/register/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: pendingUserId }),
    });
    const data = await res.json();
    setResendLoading(false);
    if (!res.ok) {
      setVerifyError(data.error || "Gagal mengirim ulang kode");
      return;
    }
    setResendMsg(data.verificationCode ? "Kode baru berhasil dibuat." : "Kode baru sudah dikirim ke email Anda.");
    setEmailWarning(data.emailWarning || "");
    setFallbackCode(data.verificationCode || "");
    if (data.verificationCode) setCode(data.verificationCode);
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

  if (pendingUserId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <GlassCard strong className="w-full max-w-md animate-scale-in rounded-5xl p-8 sm:p-10">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl glass-strong shadow-glow">
              <UserPlus className="h-6 w-6 text-accent" />
            </div>
            <h1 className="text-xl font-semibold text-white">Verifikasi Email</h1>
            <p className="mt-2 text-sm text-white/60">
              Kami telah mengirim kode 6 digit ke <span className="text-white">{pendingEmail}</span>. Masukkan kodenya untuk
              melanjutkan pendaftaran.
            </p>
            {emailWarning && <p className="mt-2 text-xs text-accent-orange/80">{emailWarning}</p>}
          </div>

          {fallbackCode && (
            <div className="mb-4 rounded-2xl bg-accent/15 px-4 py-3 text-center">
              <p className="text-xs text-white/60">Kode verifikasi Anda (sudah terisi otomatis di bawah):</p>
              <p className="mt-1 text-2xl font-bold tracking-[0.3em] text-accent">{fallbackCode}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <GlassLabel>Kode Verifikasi</GlassLabel>
              <GlassInput
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="text-center text-2xl tracking-[0.5em]"
                required
              />
            </div>

            {verifyError && (
              <div className="rounded-2xl bg-accent-pink/15 px-4 py-2.5 text-sm text-accent-pink">{verifyError}</div>
            )}
            {resendMsg && (
              <div className="rounded-2xl bg-accent-green/15 px-4 py-2.5 text-sm text-accent-green">{resendMsg}</div>
            )}

            <GlassButton type="submit" loading={verifyLoading} className="w-full py-3" disabled={code.length !== 6}>
              Verifikasi
            </GlassButton>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full text-center text-sm text-white/50 hover:text-white disabled:opacity-50"
            >
              {resendLoading ? "Mengirim..." : "Kirim ulang kode"}
            </button>
          </form>
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
