// Jalankan proses ini terpisah dari Next.js: `npm run wa:start`
// Proses ini akan menampilkan QR code di terminal untuk ditautkan
// dengan WhatsApp Admin (Perangkat Tertaut), lalu tetap berjalan
// di background agar API route /api/... bisa mengirim pesan WA.
import "dotenv/config";
import { startWhatsAppWorker } from "../src/lib/whatsapp";

startWhatsAppWorker().catch((err) => {
    console.error("Gagal menjalankan WhatsApp worker:", err);
    process.exit(1);
});
