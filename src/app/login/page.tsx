"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, User, Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassClock } from "@/components/ui/GlassClock";
import { GlassModal } from "@/components/ui/GlassModal";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request");
  const [resetUsername, setResetUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
      setLoading(false);
    }
  }

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg("");
    await fetch("/api/auth/reset-password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: resetUsername }),
    });
    setResetLoading(false);
    setResetStep("confirm");
    setResetMsg("Kode reset telah dikirim ke WhatsApp yang terdaftar.");
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg("");
    const res = await fetch("/api/auth/reset-password/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: resetUsername, code: resetCode, newPassword: resetPassword }),
    });
    const data = await res.json();
    setResetLoading(false);
    if (!res.ok) {
      setResetMsg(data.error || "Gagal reset kata sandi");
      return;
    }
    setResetMsg("Kata sandi berhasil diubah. Silakan masuk kembali.");
    setTimeout(() => {
      setResetOpen(false);
      setResetStep("request");
    }, 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute left-1/2 top-10 -translate-x-1/2 animate-float">
        <div className="h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="absolute top-6 right-6">
        <GlassClock />
      </div>

      <GlassCard strong className="w-full max-w-md animate-scale-in rounded-5xl p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl glass-strong shadow-glow">
            <img src="/brand/logo-icon.png" alt="Taha Group" className="h-9 w-9 object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Taha Group</h1>
          <p className="mt-1 text-sm text-white/50">Work Space Portal Karyawan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <GlassInput
                className="pl-11"
                placeholder="Username atau email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <GlassInput
                className="pl-11 pr-11"
                placeholder="Kata sandi"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-accent-pink/15 px-4 py-2.5 text-sm text-accent-pink">{error}</div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="text-xs text-white/50 hover:text-accent"
            >
              Lupa kata sandi?
            </button>
          </div>

          <GlassButton type="submit" loading={loading} className="w-full py-3">
            Masuk <ArrowRight className="h-4 w-4" />
          </GlassButton>
        </form>

        <div className="mt-6 text-center text-sm text-white/50">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Daftar di sini
          </Link>
        </div>
      </GlassCard>

      <GlassModal
        open={resetOpen}
        onClose={() => {
          setResetOpen(false);
          setResetStep("request");
          setResetMsg("");
        }}
        title="Reset Kata Sandi"
      >
        {resetStep === "request" ? (
          <form onSubmit={requestReset} className="space-y-4">
            <p className="text-sm text-white/60">
              Masukkan username Anda. Kode reset akan dikirim ke nomor WhatsApp yang terdaftar.
            </p>
            <GlassInput
              placeholder="Username atau email"
              value={resetUsername}
              onChange={(e) => setResetUsername(e.target.value)}
              required
            />
            {resetMsg && <p className="text-sm text-accent-green">{resetMsg}</p>}
            <GlassButton type="submit" loading={resetLoading} className="w-full">
              Kirim Kode ke WhatsApp
            </GlassButton>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="space-y-4">
            <GlassInput placeholder="Kode dari WhatsApp" value={resetCode} onChange={(e) => setResetCode(e.target.value)} required />
            <GlassInput
              placeholder="Kata sandi baru"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              required
            />
            {resetMsg && <p className="text-sm text-white/70">{resetMsg}</p>}
            <GlassButton type="submit" loading={resetLoading} className="w-full">
              Ubah Kata Sandi
            </GlassButton>
          </form>
        )}
      </GlassModal>
    </main>
  );
}
