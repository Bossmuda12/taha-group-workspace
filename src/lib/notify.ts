import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { sendWhatsApp } from "./whatsapp";

// Kirim notifikasi ke satu user lewat WA + Email + Inbox internal,
// dan catat semuanya di tabel Notification supaya ada histori/log.
export async function notifyUser(opts: {
    userId: string;
    title: string;
    body: string;
    channels?: ("WHATSAPP" | "EMAIL" | "INBOX")[];
}) {
    const { userId, title, body } = opts;
    const channels = opts.channels ?? ["WHATSAPP", "EMAIL", "INBOX"];
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

  for (const channel of channels) {
        const record = await prisma.notification.create({
                data: { userId, channel: channel as any, title, body, status: "PENDING" },
        });

      let result: { ok: boolean; reason?: string } = { ok: true };
        if (channel === "WHATSAPP") {
                result = await sendWhatsApp(user.whatsapp, `*${title}*\n\n${body}`);
        } else if (channel === "EMAIL") {
                result = await sendEmail(
                          user.email,
                          title,
                          `<div style="font-family:sans-serif"><h2>${title}</h2><p>${body.replace(/\n/g, "<br/>")}</p><p style="color:#888">Taha Group Work Space</p></div>`
                        );
        }
        // INBOX channel always "sent" (it's just a DB record shown in the Inbox page)

      await prisma.notification.update({
              where: { id: record.id },
              data: {
                        status: result.ok || channel === "INBOX" ? "SENT" : "FAILED",
                        sentAt: new Date(),
                        meta: result.reason ?? null,
              },
      });
  }
}
