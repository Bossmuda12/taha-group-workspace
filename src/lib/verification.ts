import { prisma } from "./prisma";
import { sendEmail } from "./email";

const CODE_TTL_MS = 15 * 60 * 1000; // 15 menit

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Buat kode verifikasi baru untuk user & kirim via email.
export async function createAndSendVerificationCode(userId: string, email: string, fullName: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.emailVerification.create({
    data: { userId, code, expiresAt },
  });

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#0A84FF">Verifikasi Email Anda</h2>
      <p>Halo ${fullName},</p>
      <p>Gunakan kode berikut untuk menyelesaikan pendaftaran akun Taha Group Work Space:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0A84FF;text-align:center;margin:24px 0">${code}</p>
      <p style="color:#666">Kode ini berlaku selama 15 menit. Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
      <p style="color:#999;font-size:12px;margin-top:32px">Taha Group Work Space</p>
    </div>`;

  const sendResult = await sendEmail(email, "Kode Verifikasi Pendaftaran - Taha Group", html);
  // Selipkan kode-nya di hasil juga: kalau pengiriman email gagal (mis. domain pengirim
  // belum diverifikasi di Resend), API pemanggil masih bisa menampilkan kode ini langsung
  // ke pengguna supaya pendaftaran tidak buntu menunggu email yang tidak akan pernah sampai.
  return { ...sendResult, code };
}

// Validasi kode yang dimasukkan user. Mengembalikan { ok, error? }.
export async function verifyCode(userId: string, code: string) {
  const record = await prisma.emailVerification.findFirst({
    where: { userId, code, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, error: "Kode verifikasi salah" };
  if (record.expiresAt < new Date()) return { ok: false, error: "Kode verifikasi sudah kedaluwarsa" };

  await prisma.emailVerification.update({ where: { id: record.id }, data: { used: true } });
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });

  return { ok: true };
}
