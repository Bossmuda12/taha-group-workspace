import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seed ini dijalankan setiap kali container start (lihat railway start command),
// jadi WAJIB idempotent. Helper di bawah membersihkan duplikat data contoh yang
// sempat tercipta sebelum fix ini, lalu menjaga agar tidak duplikat lagi.
async function dedupe<T extends { id: string; createdAt: Date }>(
  rows: T[],
  keyFn: (row: T) => string,
  deleteMany: (ids: string[]) => Promise<unknown>
) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const k = keyFn(row);
    const arr = groups.get(k) || [];
    arr.push(row);
    groups.set(k, arr);
  }
  const toDelete: string[] = [];
  for (const arr of groups.values()) {
    if (arr.length <= 1) continue;
    arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (const dup of arr.slice(1)) toDelete.push(dup.id);
  }
  if (toDelete.length > 0) {
    await deleteMany(toDelete);
    console.log(`Dibersihkan ${toDelete.length} data duplikat.`);
  }
}

async function main() {
  const divisionsData = [
    { name: "Management Acounting", color: "#30D158", description: "Keuangan, pembelian, dan penggajian" },
    { name: "Management Advertising", color: "#0A84FF", description: "Iklan & performa campaign" },
    { name: "Management Production", color: "#FF9F0A", description: "Produksi & operasional" },
    { name: "Costumer Service", color: "#63E6E2", description: "Layanan pelanggan" },
    { name: "Video Editor", color: "#BF5AF2", description: "Editing video & konten" },
    { name: "Management Admin", color: "#FF375F", description: "Rekap & monitoring performa harian Customer Service" },
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
    { username: "nadia.madmin", fullName: "Nadia Putri", position: "Management Admin", division: "Management Admin", role: "DIVISION_HEAD" as const },
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

  // --- Bersihkan duplikat data contoh dari deploy-deploy sebelumnya (seed lama belum idempotent) ---
  await dedupe(
    await prisma.product.findMany({ where: { isCustom: false } }),
    (p) => p.sku || p.name,
    (ids) => prisma.product.deleteMany({ where: { id: { in: ids } } })
  );
  await dedupe(
    await prisma.task.findMany({ where: { createdById: admin.id } }),
    (t) => `${t.title}|${t.divisionId}`,
    (ids) => prisma.task.deleteMany({ where: { id: { in: ids } } })
  );
  await dedupe(
    await prisma.advertisingRecord.findMany({}),
    (r) => `${r.userId}|${r.teamName}|${r.notes}`,
    (ids) => prisma.advertisingRecord.deleteMany({ where: { id: { in: ids } } })
  );
  await dedupe(
    await prisma.accountingRecord.findMany({}),
    (r) => `${r.userId}|${r.description}|${r.amount}`,
    (ids) => prisma.accountingRecord.deleteMany({ where: { id: { in: ids } } })
  );
  await dedupe(
    await prisma.csRecord.findMany({}),
    (r) => `${r.userId}|${r.incomingChats}|${r.closingCount}|${r.obstacles}`,
    (ids) => prisma.csRecord.deleteMany({ where: { id: { in: ids } } })
  );
  await dedupe(
    await prisma.dailyRecord.findMany({}),
    (r) => `${r.userId}|${r.summary}`,
    (ids) => prisma.dailyRecord.deleteMany({ where: { id: { in: ids } } })
  );
  await dedupe(
    await prisma.csPerformance.findMany({}),
    (r) => `${r.csUserId}|${r.resi}|${r.closingCount}`,
    (ids) => prisma.csPerformance.deleteMany({ where: { id: { in: ids } } })
  );
  await dedupe(
    await prisma.payslip.findMany({}),
    (r) => `${r.userId}|${r.period}`,
    (ids) => prisma.payslip.deleteMany({ where: { id: { in: ids } } })
  );

  // --- Data contoh (hanya dibuat sekali, aman dijalankan berulang) ---
  const productsData = [
    { name: "Paket Skincare Glow", sku: "SKC-001", price: 250000 },
    { name: "Kelas Online Digital Marketing", sku: "EDU-002", price: 499000 },
    { name: "Suplemen Fit Daily", sku: "SUP-003", price: 150000 },
  ];
  const products: { id: string }[] = [];
  for (const p of productsData) {
    let existing = await prisma.product.findFirst({ where: { sku: p.sku } });
    if (!existing) existing = await prisma.product.create({ data: { ...p, isCustom: false } });
    products.push(existing);
  }

  const inThreeDays = new Date(Date.now() + 3 * 86400000);
  const inWeek = new Date(Date.now() + 7 * 86400000);

  if (!(await prisma.task.findFirst({ where: { title: "Optimasi Campaign Ramadan", divisionId: divisions["Management Advertising"] } }))) {
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
  }

  if (!(await prisma.task.findFirst({ where: { title: "Rekap Laporan Keuangan Bulanan", divisionId: divisions["Management Acounting"] } }))) {
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
  }

  if (!(await prisma.advertisingRecord.findFirst({ where: { userId: users["budi.adv"], teamName: "Tim Advertising A" } }))) {
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
  }

  if (!(await prisma.accountingRecord.findFirst({ where: { userId: users["andi.acc"], description: "Bayar listrik kantor" } }))) {
    await prisma.accountingRecord.create({
      data: { userId: users["andi.acc"], date: new Date(), type: "OUTFLOW", category: "Operasional", description: "Bayar listrik kantor", amount: 850000 },
    });
  }
  if (!(await prisma.accountingRecord.findFirst({ where: { userId: users["andi.acc"], description: "Pembelian alat tulis kantor" } }))) {
    await prisma.accountingRecord.create({
      data: { userId: users["andi.acc"], date: new Date(), type: "PURCHASE", category: "ATK", description: "Pembelian alat tulis kantor", amount: 320000 },
    });
  }

  if (!(await prisma.csRecord.findFirst({ where: { userId: users["dewi.cs"], incomingChats: 64 } }))) {
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
  }

  if (!(await prisma.dailyRecord.findFirst({ where: { userId: users["rian.ve"], summary: "Edit 3 video konten promosi, revisi 1 video" } }))) {
    await prisma.dailyRecord.create({
      data: {
        userId: users["rian.ve"],
        date: new Date(),
        summary: "Edit 3 video konten promosi, revisi 1 video",
        hoursWorked: 8,
        achievements: "Selesai 3 video sesuai deadline",
      },
    });
  }

  if (!(await prisma.csPerformance.findFirst({ where: { csUserId: users["dewi.cs"], resi: "JNE00123456789" } }))) {
    await prisma.csPerformance.create({
      data: {
        csUserId: users["dewi.cs"],
        enteredById: users["nadia.madmin"],
        date: new Date(),
        resi: "JNE00123456789",
        closingCount: 20,
        deliveryCount: 18,
        returCount: 2,
        successCount: 16,
        notes: "Performa harian stabil",
      },
    });
  }

  if (!(await prisma.payslip.findFirst({ where: { userId: users["dewi.cs"] } }))) {
    await prisma.payslip.create({
      data: { userId: users["dewi.cs"], period: new Date().toISOString().slice(0, 7), baseSalary: 5000000, bonus: 500000, deduction: 0, total: 5500000 },
    });
  }

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
