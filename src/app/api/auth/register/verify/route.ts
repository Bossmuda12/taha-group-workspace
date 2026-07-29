import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/verification";
import { notifyUser } from "@/lib/notify";

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();
    if (!userId || !code) {
      return NextResponse.json({ error: "Kode verifikasi wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ ok: true, already: true });

    const result = await verifyCode(userId, String(code).trim());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Baru sekarang beri tahu Admin Utama ada pendaftaran baru yang siap ditinjau.
    const admin = await prisma.user.findFirst({ where: { role: "SUPERADMIN" } });
    if (admin) {
      await notifyUser({
        userId: admin.id,
        title: "Pendaftaran Karyawan Baru",
        body: `${user.fullName} (${user.position}) baru saja mendaftar dan email-nya sudah terverifikasi. Silakan aktivasi akun di Team Management.`,
        channels: ["INBOX", "EMAIL"],
        link: "/dashboard/team?pending=1",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memverifikasi, coba lagi." }, { status: 500 });
  }
}
