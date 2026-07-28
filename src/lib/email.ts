import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (transporter) return transporter;
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) return null;
    transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
    });
    return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
    const t = getTransporter();
    if (!t) {
          console.log(`[email:disabled] Would send to ${to}: ${subject}`);
          return { ok: false, reason: "GMAIL_USER/GMAIL_APP_PASSWORD belum diisi di .env" };
    }
    try {
          await t.sendMail({
                  from: `"Taha Group Work Space" <${process.env.GMAIL_USER}>`,
                  to,
                  subject,
                  html,
          });
          return { ok: true };
    } catch (err: any) {
          console.error("[email:error]", err.message);
          return { ok: false, reason: err.message };
    }
}
