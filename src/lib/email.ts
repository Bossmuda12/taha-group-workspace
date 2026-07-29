// Kirim email transaksional lewat Resend (https://resend.com).
// Catatan: selama domain pengirim belum diverifikasi di Resend, alamat
// default "onboarding@resend.dev" hanya bisa mengirim ke email pemilik
// akun Resend itu sendiri (mode sandbox). Setelah domain sendiri
// ditambahkan & diverifikasi di Resend, set RESEND_FROM_EMAIL ke alamat
// domain sendiri (mis. "Taha Group <noreply@tahagroup.com>") supaya bisa
// mengirim ke email siapa pun.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Taha Group Work Space <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[email:disabled] Would send to ${to}: ${subject}`);
    return { ok: false, reason: "RESEND_API_KEY belum diisi di environment" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[email:error]", res.status, errBody);
      return { ok: false, reason: `Resend error ${res.status}: ${errBody}` };
    }
    return { ok: true };
  } catch (err: any) {
    console.error("[email:error]", err.message);
    return { ok: false, reason: err.message };
  }
}
