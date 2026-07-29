// Integrasi WhatsApp GRATIS via Baileys (WhatsApp Web multi-device).
// Tidak perlu API key / biaya per-pesan. Cukup scan QR sekali di terminal.
// Catatan: butuh proses Node yang tetap berjalan (self-host / VPS / `npm run wa:start`),
// tidak cocok untuk hosting serverless (mis. Vercel).
import path from "path";

type BaileysSocket = any;

let sock: BaileysSocket | null = null;
let connecting: Promise<BaileysSocket> | null = null;
const AUTH_DIR = process.env.WA_SESSION_DIR || path.join(process.cwd(), "wa-session");

// Proteksi supaya kalau koneksi putus berulang kali (mis. auth belum valid,
// nomor belum di-pairing, atau jaringan bermasalah), kita TIDAK langsung
// reconnect tanpa jeda. Reconnect beruntun tanpa delay bisa dianggap WhatsApp
// sebagai aktivitas mencurigakan dan berisiko nomor kena limit/blokir.
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 60_000; // maksimal jeda 60 detik
const MIN_RECONNECT_DELAY_MS = 3_000; // minimal jeda 3 detik
const MAX_RECONNECT_ATTEMPTS = 8; // setelah ini, berhenti coba otomatis
let pairingCodeRequested = false; // pastikan kode pairing cuma diminta sekali per proses

async function getSocket(): Promise<BaileysSocket | null> {
    if (process.env.WA_ENABLED !== "true") return null;
    if (sock) return sock;
    if (connecting) return connecting;

  connecting = (async () => {
        try {
                const baileys = await import("@whiskeysockets/baileys");
                const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys as any;
                const qrcode = (await import("qrcode-terminal")).default;

          const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
                const socket = makeWASocket({ auth: state, printQRInTerminal: false });

          // Di server tanpa layar (mis. Railway), scan QR dari log teks itu susah.
          // Kalau WA_PAIRING_PHONE diisi (nomor WA Admin), pakai kode pairing
          // (8 digit) yang bisa dimasukkan manual di HP: WhatsApp > Perangkat
          // Tertaut > Tautkan dengan nomor telepon.
          const pairingPhone = process.env.WA_PAIRING_PHONE;
                if (pairingPhone && !socket.authState.creds.registered && !pairingCodeRequested) {
                          pairingCodeRequested = true;
                          setTimeout(async () => {
                                      try {
                                                    const code = await socket.requestPairingCode(pairingPhone.replace(/[^0-9]/g, ""));
                                                    console.log(`\n=== KODE PAIRING WHATSAPP: ${code} ===`);
                                                    console.log("Buka WhatsApp di HP Admin > Perangkat Tertaut > Tautkan dengan nomor telepon, lalu masukkan kode di atas.\n");
                                      } catch (err) {
                                                    console.error("[wa:error] gagal minta kode pairing:", err);
                                                    pairingCodeRequested = false; // boleh coba lagi di percobaan reconnect berikutnya
                                      }
                          }, 3000);
                }

          socket.ev.on("creds.update", saveCreds);
                socket.ev.on("connection.update", (update: any) => {
                          const { connection, lastDisconnect, qr } = update;
                          if (qr && !pairingPhone) {
                                      console.log("\n=== SCAN QR INI DENGAN WHATSAPP ADMIN (Perangkat Tertaut) ===\n");
                                      qrcode.generate(qr, { small: true });
                          }
                          if (connection === "close") {
                                      const shouldReconnect =
                                                    (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                                      sock = null;
                                      connecting = null;
                                      if (!shouldReconnect) {
                                                    console.log("[wa] logout terdeteksi, tidak reconnect otomatis.");
                                                    return;
                                      }
                                      reconnectAttempts += 1;
                                      if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
                                                    console.error(
                                                                  `[wa:error] koneksi gagal ${reconnectAttempts}x berturut-turut, berhenti mencoba otomatis untuk menghindari risiko limit WhatsApp. Restart service untuk mencoba lagi.`
                                                    );
                                                    return;
                                      }
                                      const delay = Math.min(
                                                    MIN_RECONNECT_DELAY_MS * 2 ** (reconnectAttempts - 1),
                                                    MAX_RECONNECT_DELAY_MS
                                      );
                                      console.log(`[wa] koneksi terputus, reconnect percobaan ke-${reconnectAttempts} dalam ${delay / 1000}s`);
                                      setTimeout(() => {
                                                    getSocket();
                                      }, delay);
                          } else if (connection === "open") {
                                      console.log("[wa] terhubung ke WhatsApp ✅");
                                      reconnectAttempts = 0;
                          }
                });

          sock = socket;
                return socket;
        } catch (err) {
                console.error("[wa:error] gagal inisialisasi Baileys:", err);
                connecting = null;
                return null;
        }
  })();

  return connecting;
}

export function formatWaNumber(raw: string) {
    let n = raw.replace(/[^0-9]/g, "");
    if (n.startsWith("0")) n = "62" + n.slice(1);
    if (!n.startsWith("62")) n = "62" + n;
    return `${n}@s.whatsapp.net`;
}

export async function sendWhatsApp(to: string, message: string) {
    try {
          const socket = await getSocket();
          if (!socket) {
                  console.log(`[wa:disabled] Would send to ${to}: ${message}`);
                  return { ok: false, reason: "WA belum aktif/terhubung. Jalankan `npm run wa:start` dan scan QR." };
          }
          const jid = formatWaNumber(to);
          await socket.sendMessage(jid, { text: message });
          return { ok: true };
    } catch (err: any) {
          console.error("[wa:error]", err.message);
          return { ok: false, reason: err.message };
    }
}

export async function startWhatsAppWorker() {
    console.log("[wa] memulai koneksi WhatsApp (Baileys)...");
    await getSocket();
}
