// Next.js memanggil register() sekali saat server (proses Node) baru dinyalakan.
// Dipakai di sini untuk menyalakan koneksi WhatsApp (Baileys) di proses yang sama
// dengan server web, supaya tidak perlu service/proses terpisah di Railway.
// Aktif hanya kalau WA_ENABLED=true di environment variables.
//
// Catatan: karena project ini pakai struktur folder `src/`, file instrumentation
// WAJIB berada di `src/instrumentation.ts` (bukan di root repo) supaya Next.js
// mendeteksinya.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.WA_ENABLED === "true") {
    const { startWhatsAppWorker } = await import("./lib/whatsapp");
    startWhatsAppWorker().catch((err) => {
      console.error("[wa] gagal start worker dari instrumentation:", err);
    });
  }
}
