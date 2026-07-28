import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const divisionsData = [
      { name: "Management Acounting", color: "#30D158", description: "Keuangan, pembelian, dan penggajian" },
      { name: "Management Advertising", color: "#0A84FF", description: "Iklan & performa campaign" },
      { name: "Management Production", color: "#FF9F0A", description: "Produksi & operasional" },
      { name: "Costumer Service", color: "#63E6E2", description: "Layanan pelanggan" },
      { name: "Video Editor", color: "#BF5AF2", description: "Editing video & konten" },
        ];

  const divisions: Record<string, string> = {};
    for (const d of divisionsData) {
          const div = await prisma.division.upsert({
                  where: { name: d.name },
                  update: {},
                  create: { ...d, isCore: true },
          });
          divisions[d.name] = div.id;
    }

  const adminPass = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
          where: { username: "admin" },
          update: {},
          create: {
                  username: "admin",
                  fullName: "Admin Utama Taha Group",
                  address: "Kantor Pusat Taha Group",
                  whatsapp: "6281234567890",
                  email: "admin@tahagroup.co",
                  passwordHash: adminPass,
                  position: "Owner / Direktur",
                  role: "SUPERADMIN",
                  status: "ACTIVE",
                  avatarColor: "#0A84FF",
          },
    });

  const staffPass = await bcrypt.hash("staff123", 10);
    const staffSeed = [
      { username: "budi.adv", fullName: "Budi Santoso", position: "Media Buyer", division: "Management Advertising", role: "DIVISION_HEAD" as const },
      { username: "sari.adv", fullName: "Sari Wulandari", position: "Ads Specialist", division: "Management Advertising", role: "STAFF" as const },
      { username: "andi.acc", fullName: "Andi Prasetyo", position: "Staff Accounting", division: "Management Acounting", role: "DIVISION_HEAD" as const },
      { username: "dewi.cs", fullName: "Dewi Lestari", position: "CS Lead", division: "Costumer Service", role: "DIVISION_HEAD" as const },
      { username: "rian.ve", fullName: "Rian Firmansyah", position: "Video Editor", division: "Video Editor", role: "STAFF" as const },
      { username: "made.prod", fullName: "Made Wirawan", position: "Staff Produksi", division: "Management Production", role: "STAFF" as const },
        ];

  const users: Record<string, string> = {};
    for (const s of staffSeed) {
          const u = await prisma.user.upsert({
                  where: { username: s.username },
                  update: {},
                  create: {
                            username: s.username,
                            fullName: s.fullName,
                            address: "Jl. Contoh No. 1, Jakarta",
                            whatsapp: "6281200000" + Math.floor(Math.random() * 900 + 100),
                            email: `${s.username}@tahagroup.co`,
                            passwordHash: staffPass,
                            position: s.position,
                            role: s.role,
                            status: "ACTIVE",
                            divisionId: divisions[s.division],
                            avatarColor: ["#0A84FF", "#BF5AF2", "#FF375F", "#63E6E2", "#FF9F0A", "#30D158"][Math.floor(Math.random() * 6)],
                  },
          });
          users[s.username] = u.id;
    }

  const products = await Promise.all(
        [
          { name: "Paket Skincare Glow", sku: "SKC-001", price: 250000 },
          { name: "Kelas Online Digital Marketing", sku: "EDU-002", price: 499000 },
          { name: "Suplemen Fit Daily", sku: "SUP-003", price: 150000 },
              ].map((p) => prisma.product.create({ data: { ...p, isCustom: false } }))
      );

  const inThreeDays = new Date(Date.now() + 3 * 86400000);
    const inWeek = new Date(Date.now() + 7 * 86400000);

  await prisma.task.create({
        data: {
                title: "Optimasi Campaign Ramadan",
                description: "Review & optimasi budget campaign iklan untuk periode promo mendatang.",
                divisionId: divisions["Management Advertising"],
                assignedToId: users["budi.adv"],
                createdById: admin.id,
                deadline: inThreeDays,
                priority: "HIGH",
                status: "IN_PROGRESS",
        },
  });

  await prisma.task.create({
        data: {
                title: "Rekap Laporan Keuangan Bulanan",
                description: "Susun rekap outflow & pembelian bulan berjalan untuk direview.",
                divisionId: divisions["Management Acounting"],
                assignedToId: users["andi.acc"],
                createdById: admin.id,
                deadline: inWeek,
                priority: "MEDIUM",
                status: "TODO",
        },
  });

  await prisma.advertisingRecord.create({
        data: {
                userId: users["budi.adv"],
                date: new Date(),
                teamName: "Tim Advertising A",
                closingCount: 12,
                leadsCount: 48,
                adAccount: "Ads Acc #102",
                facebookName: "Taha Group Official",
                spendBudget: 1500000,
                productId: products[0].id,
                notes: "Performa stabil, CTR naik 1.2%",
        },
  });

  await prisma.accountingRecord.create({
        data: { userId: users["andi.acc"], date: new Date(), type: "OUTFLOW", category: "Operasional", description: "Bayar listrik kantor", amount: 850000 },
  });
    await prisma.accountingRecord.create({
          data: { userId: users["andi.acc"], date: new Date(), type: "PURCHASE", category: "ATK", description: "Pembelian alat tulis kantor", amount: 320000 },
    });

  await prisma.csRecord.create({
        data: {
                userId: users["dewi.cs"],
                date: new Date(),
                incomingChats: 64,
                closingCount: 20,
                leadsCount: 40,
                productId: products[1].id,
                obstacles: "Beberapa pelanggan komplain pengiriman lambat",
        },
  });

  await prisma.dailyRecord.create({
        data: {
                userId: users["rian.ve"],
                date: new Date(),
                summary: "Edit 3 video konten promosi, revisi 1 video",
                hoursWorked: 8,
                achievements: "Selesai 3 video sesuai deadline",
        },
  });

  await prisma.payslip.create({
        data: { userId: users["dewi.cs"], period: new Date().toISOString().slice(0, 7), baseSalary: 5000000, bonus: 500000, deduction: 0, total: 5500000 },
  });

  console.log("Seed selesai. Login admin: username=admin password=admin123");
}

main()
  .catch((e) => {
        console.error(e);
        process.exit(1);
  })
  .finally(async () => {
        await prisma.$disconnect();
  });
