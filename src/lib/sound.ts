"use client";

// Nada notifikasi dibangkitkan langsung via Web Audio API (tanpa file audio eksternal),
// supaya tiap jenis notifikasi punya "ringtone" yang beda: tugas, pesan (chat), dan notifikasi umum.
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

function beep(freq: number, duration: number, delay = 0, gain = 0.16) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ctx.destination);
  const start = ctx.currentTime + delay;
  const stop = start + duration;
  // fade out halus biar tidak "klik" di ujung nada
  g.gain.setValueAtTime(gain, Math.max(ctx.currentTime, stop - 0.03));
  g.gain.linearRampToValueAtTime(0, stop);
  osc.start(start);
  osc.stop(stop);
}

export type NotifKind = "task" | "chat" | "general";

// Klasifikasi jenis notifikasi dari judulnya (tanpa perlu ubah skema database).
export function classifyNotifTitle(title: string): NotifKind {
  const t = (title || "").toLowerCase();
  if (t.includes("pesan baru") || t.includes("chat")) return "chat";
  if (t.includes("tugas")) return "task";
  return "general";
}

export function playNotifSound(kind: NotifKind) {
  try {
    if (getCtx()?.state === "suspended") getCtx()?.resume();
    if (kind === "task") {
      // dua nada naik, tegas — cocok untuk penugasan
      beep(659, 0.13, 0);
      beep(880, 0.16, 0.13);
    } else if (kind === "chat") {
      // tiga ketuk cepat, seperti nada chat
      beep(523, 0.08, 0);
      beep(659, 0.08, 0.09);
      beep(784, 0.12, 0.18);
    } else {
      // satu nada lembut untuk notifikasi umum
      beep(440, 0.2, 0, 0.13);
    }
  } catch {
    // abaikan (mis. browser belum izinkan audio sebelum interaksi user)
  }
}
