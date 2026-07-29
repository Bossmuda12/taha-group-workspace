import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Saat karyawan dihapus permanen, banyak data lain (tugas, catatan harian, slip gaji,
// pesan chat, dsb) masih punya referensi wajib (foreign key) ke akun itu. Kalau kita
// hard-delete User secara langsung, Postgres akan menolak (FK constraint) sehingga
// penghapusan terlihat "gagal diam-diam" dan karyawan itu muncul lagi setelah reload.
//
// Solusinya: sebelum menghapus User yang sebenarnya, semua referensi wajib dialihkan
// ke satu akun placeholder "Pengguna Dihapus" (pola yang sama dipakai Slack/Discord/GitHub
// saat sebuah akun dihapus tapi riwayat pesan/aktivitasnya tetap ada). Akun ini disembunyikan
// dari semua daftar karyawan karena status-nya SUSPENDED & tidak punya divisi.
export const GHOST_USERNAME = "pengguna_dihapus";
const GHOST_EMAIL = "pengguna.dihapus@system.internal";

export async function getOrCreateGhostUser() {
  let ghost = await prisma.user.findUnique({ where: { username: GHOST_USERNAME } });
  if (!ghost) {
    ghost = await prisma.user.create({
      data: {
        username: GHOST_USERNAME,
        fullName: "Pengguna Dihapus",
        address: "-",
        whatsapp: "-",
        email: GHOST_EMAIL,
        passwordHash: await bcrypt.hash(`${Math.random()}${Date.now()}`, 10),
        position: "-",
        role: "STAFF",
        status: "SUSPENDED",
        emailVerified: true,
      },
    });
  }
  return ghost;
}
